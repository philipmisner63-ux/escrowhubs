"use client";
import Link from "next/link";

interface TileProps {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
  className?: string;
}

export function Tile({ icon, title, subtitle, href, className = "" }: TileProps) {
  return (
    <Link
      href={href}
      className={`glass-card tap-compress slide-in flex flex-col gap-3 p-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#35D07F] to-[#0EA56F] flex items-center justify-center text-2xl shadow-lg shadow-green-900/30">
        {icon}
      </div>
      <div>
        <p className="text-white font-semibold text-sm">{title}</p>
        <p className="text-white/50 text-xs mt-0.5">{subtitle}</p>
      </div>
    </Link>
  );
}
