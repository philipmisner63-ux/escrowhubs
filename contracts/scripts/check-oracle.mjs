import { createPublicClient, http, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const pk = '0xb9c8f99fe1f30b3e432f9c62b37de2242eace84443ce4f39555493245eb85d30';
const account = privateKeyToAccount(pk);

const chains = {
  blockdag: { id: 1404, rpc: 'https://rpc.blockdag.engineering' },
  base:     { id: 8453, rpc: 'https://api.developer.coinbase.com/rpc/v1/base/UBNUmihEXBUIpqEkwQduYYFccMAVuvNR' },
  polygon:  { id: 137,  rpc: 'https://polygon-mainnet.g.alchemy.com/v2/YUs_6FzIKG617Yt8pMqay' },
  celo:     { id: 42220, rpc: 'https://rpc.ankr.com/celo' },
};

const addresses = {
  blockdag: '0x4703258e28a6731b5d890d33ed29b67906ad9f01',
  base:     '0x5c3d960e5875902b111e655b55ff02eef7a462e6',
  polygon:  '0x6c6b0903d065bba1ea142ea40dd46dbbec5bd3b5',
  celo:     '0x34dd4dda6d704ddbc0b800a7eaff3fea710eba9c',
};

const abi = [{"inputs":[],"name":"oracleSigner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}];

async function main() {
  for (const [name, cfg] of Object.entries(chains)) {
    try {
      const client = createPublicClient({ chain: { id: cfg.id, name }, transport: http(cfg.rpc) });
      const balance = await client.getBalance({ address: account.address });
      const oracle = await client.readContract({ address: addresses[name], abi, functionName: 'oracleSigner' });
      console.log(`${name}: balance=${formatEther(balance)}, oracle=${oracle}`);
    } catch (e) {
      console.log(`${name}: ERROR - ${e.message}`);
    }
  }
}
main().catch(console.error);
