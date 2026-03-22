"use client";

import dynamic from "next/dynamic";
import type { ThreatPoint } from "@/lib/types";
import sampleThreats from "../../../backend_data/sample_threats.json";

const ThreatMap = dynamic(() => import("@/components/ThreatMap"), { ssr: false });

export default function ThreatMapPage() {
  const threats = sampleThreats as ThreatPoint[];

  const stats = {
    total: threats.length,
    critical: threats.filter((t) => t.severity === "critical").length,
    high: threats.filter((t) => t.severity === "high").length,
    medium: threats.filter((t) => t.severity === "medium").length,
    low: threats.filter((t) => t.severity === "low").length,
  };

  const byCategory = threats.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        <span className="text-[#00ff88]">Threat Intelligence</span> Map
      </h1>

      <ThreatMap threats={threats} height="500px" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Summary stats */}
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
          <h2 className="text-sm font-bold text-[#a1a1aa] uppercase tracking-wider mb-4">
            Threat Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-bold text-[#00ff88]">{stats.total}</div>
              <div className="text-xs text-[#a1a1aa]">Total Threats</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-400">{stats.critical}</div>
              <div className="text-xs text-[#a1a1aa]">Critical</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-400">{stats.high}</div>
              <div className="text-xs text-[#a1a1aa]">High</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {stats.medium + stats.low}
              </div>
              <div className="text-xs text-[#a1a1aa]">Medium/Low</div>
            </div>
          </div>
        </div>

        {/* By category */}
        <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-5">
          <h2 className="text-sm font-bold text-[#a1a1aa] uppercase tracking-wider mb-4">
            By OWASP Category
          </h2>
          <div className="space-y-2">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-xs text-[#e4e4e7] truncate mr-2">{cat}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00ff88] rounded-full"
                        style={{
                          width: `${(count / Math.max(...Object.values(byCategory))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#a1a1aa] font-mono w-4">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}
