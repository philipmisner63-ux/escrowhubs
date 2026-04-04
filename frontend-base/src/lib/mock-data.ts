export type EscrowStatus = "active" | "completed" | "disputed" | "refunded";
export type EscrowType = "simple" | "milestone";

export interface Milestone {
  id: number;
  description: string;
  amount: string;
  status: "pending" | "released" | "disputed" | "refunded";
}

export interface Escrow {
  id: string;
  type: EscrowType;
  title: string;
  depositor: string;
  beneficiary: string;
  arbiter: string;
  amount: string;
  status: EscrowStatus;
  createdAt: string;
  milestones?: Milestone[];
  trustScore: number;
  txHash: string;
}

export const mockEscrows: Escrow[] = [
  {
    id: "0x1a2b3c4d",
    type: "milestone",
    title: "Smart Contract Audit",
    depositor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    beneficiary: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    arbiter: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    amount: "2.5 ETH",
    status: "active",
    createdAt: "2026-03-20",
    trustScore: 87,
    txHash: "0xabc123def456",
    milestones: [
      { id: 0, description: "Kickoff & Scope", amount: "0.5 ETH", status: "released" },
      { id: 1, description: "Initial Report", amount: "1.0 ETH", status: "pending" },
      { id: 2, description: "Final Delivery", amount: "1.0 ETH", status: "pending" },
    ],
  },
  {
    id: "0x5e6f7a8b",
    type: "simple",
    title: "Frontend Development",
    depositor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    beneficiary: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    arbiter: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    amount: "1.8 ETH",
    status: "active",
    createdAt: "2026-03-25",
    trustScore: 92,
    txHash: "0xdef789ghi012",
  },
  {
    id: "0x9c0d1e2f",
    type: "simple",
    title: "Logo Design",
    depositor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    beneficiary: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    arbiter: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    amount: "0.3 ETH",
    status: "completed",
    createdAt: "2026-03-10",
    trustScore: 75,
    txHash: "0xjkl345mno678",
  },
  {
    id: "0x3a4b5c6d",
    type: "milestone",
    title: "Backend API Integration",
    depositor: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    beneficiary: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    arbiter: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    amount: "4.0 ETH",
    status: "disputed",
    createdAt: "2026-03-01",
    trustScore: 60,
    txHash: "0xpqr901stu234",
    milestones: [
      { id: 0, description: "Auth System", amount: "1.0 ETH", status: "released" },
      { id: 1, description: "Core APIs", amount: "2.0 ETH", status: "disputed" },
      { id: 2, description: "Testing & Docs", amount: "1.0 ETH", status: "pending" },
    ],
  },
];

export const mockStats = {
  totalEscrows: 47,
  activeEscrows: 12,
  totalVolume: "284.5 ETH",
  completedEscrows: 31,
  disputedEscrows: 4,
  avgTrustScore: 84,
};

export function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function statusColor(status: EscrowStatus) {
  const map: Record<EscrowStatus, string> = {
    active: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    completed: "text-green-400 bg-green-400/10 border-green-400/20",
    disputed: "text-red-400 bg-red-400/10 border-red-400/20",
    refunded: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  };
  return map[status];
}

export function milestoneStatusColor(status: Milestone["status"]) {
  const map: Record<Milestone["status"], string> = {
    pending: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    released: "text-green-400 bg-green-400/10 border-green-400/20",
    disputed: "text-red-400 bg-red-400/10 border-red-400/20",
    refunded: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  };
  return map[status];
}
