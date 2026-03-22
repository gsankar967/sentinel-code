"use client";

interface ScanProgressProps {
  status: string;
  progress: number;
}

const STAGES = [
  { key: "scanning", label: "Analyzing code with Gemini AI", icon: "🔍" },
  { key: "testing", label: "Testing exploits in sandbox", icon: "🧪" },
  { key: "fixing", label: "Generating secure fixes", icon: "🔧" },
  { key: "complete", label: "Scan complete", icon: "✅" },
];

export default function ScanProgress({ status, progress }: ScanProgressProps) {
  const currentIdx = STAGES.findIndex((s) => s.key === status);

  return (
    <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#e4e4e7]">Scan Progress</h2>
        <span className="text-sm text-[#00ff88] font-mono">
          {Math.round(progress * 100)}%
        </span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-2 bg-[#0a0a0f] rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#00ff88] to-[#00aaff] rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {/* Stages */}
      <div className="space-y-3">
        {STAGES.map((stage, i) => {
          const isActive = stage.key === status;
          const isDone = i < currentIdx || status === "complete";
          return (
            <div
              key={stage.key}
              className={`flex items-center gap-3 text-sm transition-all ${
                isActive
                  ? "text-[#00ff88]"
                  : isDone
                    ? "text-[#a1a1aa]"
                    : "text-[#4a4a5e]"
              }`}
            >
              <span className="text-base">{isDone && !isActive ? "✅" : stage.icon}</span>
              <span>{stage.label}</span>
              {isActive && status !== "complete" && (
                <span className="w-4 h-4 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin ml-auto" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
