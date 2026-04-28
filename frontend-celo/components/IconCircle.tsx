interface IconCircleProps { icon: string; size?: "sm" | "md" | "lg"; }

export function IconCircle({ icon, size = "md" }: IconCircleProps) {
  const sz = size === "sm" ? "w-8 h-8 text-base" : size === "lg" ? "w-14 h-14 text-3xl" : "w-10 h-10 text-xl";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#35D07F] to-[#0EA56F] flex items-center justify-center flex-shrink-0 shadow-md shadow-green-900/20`}>
      {icon}
    </div>
  );
}
