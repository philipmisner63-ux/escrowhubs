"use client";

import { useEffect, useRef } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, erc20Abi, Abi } from "viem";
import { useNaijaLancers } from "@/hooks/useNaijaLancers";
import { useReferrer } from "@/hooks/useReferrer";
import { CONTRACTS, TOKENS } from "@/lib/config";
import FactoryABI from "@/abis/EscrowFactory.json";
import SimpleEscrowABI from "@/abis/SimpleEscrow.json";

const ESCROW_ABI = SimpleEscrowABI as Abi;

interface ChargeUserPayload {
  beneficiary: string;
  amount: string;
  token?: string; // "cUSD" | "USDT" | "CELO"
  description?: string;
  requestId?: string;
}

interface PayoutUserPayload {
  escrowAddress: string;
  requestId?: string;
}

interface GetEscrowStatusPayload {
  escrowAddress: string;
  requestId?: string;
}

export function NaijaLancersEscrowBridge() {
  const { lastMessage, isReady, sendToParent } = useNaijaLancers();
  const { isConnected } = useAccount();
  const referrer = useReferrer();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const processedRef = useRef<Set<string>>(new Set());
  const inProgressRef = useRef(false);

  useEffect(() => {
    if (!lastMessage || !isReady || inProgressRef.current) return;

    const msgKey = JSON.stringify(lastMessage);
    if (processedRef.current.has(msgKey)) return;
    processedRef.current.add(msgKey);

    if (!isConnected) {
      sendToParent("error", {
        originalType: lastMessage.type,
        requestId: lastMessage.payload?.requestId,
        message: "Wallet not connected. User must connect wallet first.",
      });
      return;
    }

    inProgressRef.current = true;

    (async () => {
      try {
        switch (lastMessage.type) {
          case "chargeUser": {
            const payload = (lastMessage.payload as unknown) as ChargeUserPayload;
            if (
              !payload.beneficiary ||
              !payload.beneficiary.startsWith("0x") ||
              payload.beneficiary.length !== 42
            ) {
              throw new Error("Invalid beneficiary address");
            }
            if (!payload.amount || parseFloat(payload.amount) <= 0) {
              throw new Error("Invalid amount");
            }

            const tokenSymbol = payload.token || "cUSD";
            let tokenAddress: `0x${string}`;
            let amountWei: bigint;
            let decimals: number;

            if (tokenSymbol === "CELO") {
              tokenAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`;
              decimals = 18;
              amountWei = parseUnits(payload.amount, decimals);
            } else {
              const token = TOKENS[tokenSymbol as keyof typeof TOKENS];
              if (!token) throw new Error(`Unsupported token: ${tokenSymbol}`);
              tokenAddress = token.address;
              decimals = token.decimals;
              amountWei = parseUnits(payload.amount, decimals);
            }

            // Step 1: Approve token to factory (skip for CELO)
            let approveHash: `0x${string}` | undefined;
            if (tokenSymbol !== "CELO") {
              approveHash = await writeContractAsync({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: "approve",
                args: [CONTRACTS.factory, amountWei],
              });
              if (publicClient && approveHash) {
                await Promise.race([
                  publicClient.waitForTransactionReceipt({
                    hash: approveHash,
                    confirmations: 1,
                  }),
                  new Promise((_, reject) =>
                    setTimeout(
                      () => reject(new Error("Approval timeout")),
                      30000
                    )
                  ),
                ]);
              } else {
                await new Promise((r) => setTimeout(r, 8000));
              }
            }

            // Step 2: Create escrow via factory
            const createHash = await writeContractAsync({
              address: CONTRACTS.factory,
              abi: FactoryABI as Abi,
              functionName: "createSimpleEscrow",
              args: [
                payload.beneficiary as `0x${string}`,
                CONTRACTS.arbiter,
                0,
                false,
                tokenAddress,
                referrer,
              ],
              value: tokenSymbol === "CELO" ? amountWei : 0n,
              gas: 1_500_000n,
            });

            if (!publicClient) throw new Error("No public client available");
            const receipt = await publicClient.waitForTransactionReceipt({
              hash: createHash,
            });
            const log = receipt.logs.find(
              (l) =>
                l.address.toLowerCase() === CONTRACTS.factory.toLowerCase()
            );
            const topic1 = log?.topics?.[1];
            if (!topic1)
              throw new Error(
                "Could not extract escrow address from receipt"
              );
            const escrowAddress = `0x${topic1.slice(-40)}` as `0x${string}`;

            // Step 3: Verify escrow amount (factory may auto-deposit for some tokens)
            const currentAmount = await publicClient.readContract({
              address: escrowAddress,
              abi: ESCROW_ABI,
              functionName: "amount",
            });

            let depositHash: `0x${string}` | undefined;
            if ((currentAmount as bigint) === 0n && amountWei > 0n) {
              // Factory did not auto-deposit; deposit manually
              if (tokenSymbol !== "CELO") {
                // Approve token to escrow address
                await writeContractAsync({
                  address: tokenAddress,
                  abi: erc20Abi,
                  functionName: "approve",
                  args: [escrowAddress, amountWei],
                });
              }
              depositHash = await writeContractAsync({
                address: escrowAddress,
                abi: ESCROW_ABI,
                functionName: "deposit",
                args: [amountWei],
                value: tokenSymbol === "CELO" ? amountWei : 0n,
                gas: 500_000n,
              });
            }

            sendToParent("chargeComplete", {
              escrowAddress,
              createTxHash: createHash,
              depositTxHash: depositHash ?? null,
              amount: payload.amount,
              token: tokenSymbol,
              beneficiary: payload.beneficiary,
              description: payload.description ?? null,
              requestId: payload.requestId ?? null,
            });
            break;
          }

          case "payoutUser": {
            const payload = (lastMessage.payload as unknown) as PayoutUserPayload;
            if (
              !payload.escrowAddress ||
              !payload.escrowAddress.startsWith("0x")
            ) {
              throw new Error("Invalid escrow address");
            }

            const releaseHash = await writeContractAsync({
              address: payload.escrowAddress as `0x${string}`,
              abi: ESCROW_ABI,
              functionName: "release",
              gas: 200_000n,
            });

            sendToParent("payoutComplete", {
              escrowAddress: payload.escrowAddress,
              txHash: releaseHash,
              requestId: payload.requestId ?? null,
            });
            break;
          }

          case "getEscrowStatus": {
            const payload = (lastMessage.payload as unknown) as GetEscrowStatusPayload;
            if (
              !payload.escrowAddress ||
              !payload.escrowAddress.startsWith("0x")
            ) {
              throw new Error("Invalid escrow address");
            }
            if (!publicClient) throw new Error("No public client available");

            const escrowAddr = payload.escrowAddress as `0x${string}`;
            const [state, amount, depositor, beneficiary, token] =
              await Promise.all([
                publicClient.readContract({
                  address: escrowAddr,
                  abi: ESCROW_ABI,
                  functionName: "state",
                }),
                publicClient.readContract({
                  address: escrowAddr,
                  abi: ESCROW_ABI,
                  functionName: "amount",
                }),
                publicClient.readContract({
                  address: escrowAddr,
                  abi: ESCROW_ABI,
                  functionName: "depositor",
                }),
                publicClient.readContract({
                  address: escrowAddr,
                  abi: ESCROW_ABI,
                  functionName: "beneficiary",
                }),
                publicClient.readContract({
                  address: escrowAddr,
                  abi: ESCROW_ABI,
                  functionName: "token",
                }),
              ]);

            sendToParent("escrowStatus", {
              escrowAddress: payload.escrowAddress,
              state: Number(state),
              amount: (amount as bigint)?.toString() ?? "0",
              depositor: depositor as string,
              beneficiary: beneficiary as string,
              token: token as string,
              requestId: payload.requestId ?? null,
            });
            break;
          }

          default:
            // Unknown type — silently ignore
            break;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[NaijaLancersBridge] ${lastMessage.type} failed:`,
          err
        );
        sendToParent("error", {
          originalType: lastMessage.type,
          requestId: lastMessage.payload?.requestId,
          message,
        });
      } finally {
        inProgressRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage, isReady, isConnected, referrer, writeContractAsync, publicClient, sendToParent]);

  return null;
}
