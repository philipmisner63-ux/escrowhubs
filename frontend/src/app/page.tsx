import Link from "next/link";
import { StatCard } from "@/components/ui/stat-card";
import { EscrowCard } from "@/components/escrow-card";
import { mockEscrows, mockStats } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const activeEscrows = mockEscrows.filter(e => e.status === "active");
  const recentEscrows = [...mockEscrows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Manage your escrow contracts on BlockDAG
          </p>
        </div>
        <Link href="/create">
          <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-semibold shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] transition-all">
            + New Escrow
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Volume"
          value={mockStats.totalVolume}
          icon="⬡"
          accent="cyan"
        />
        <StatCard
          label="Active Escrows"
          value={mockStats.activeEscrows}
          icon="◈"
          accent="blue"
        />
        <StatCard
          label="Completed"
          value={mockStats.completedEscrows}
          icon="✓"
          accent="green"
        />
        <StatCard
          label="Disputed"
          value={mockStats.disputedEscrows}
          icon="⚠"
          accent="red"
        />
      </div>

      {/* Active Escrows */}
      {activeEscrows.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
            Active Escrows
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {activeEscrows.map(escrow => (
              <EscrowCard key={escrow.id} escrow={escrow} />
            ))}
          </div>
        </section>
      )}

      {/* All Escrows */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
          Recent Activity
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {recentEscrows.map(escrow => (
            <EscrowCard key={escrow.id} escrow={escrow} />
          ))}
        </div>
      </section>
    </div>
  );
}
