"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import CodeInput from "@/components/CodeInput";
import ScanProgress from "@/components/ScanProgress";
import VulnerabilityCard from "@/components/VulnerabilityCard";
import type { Vulnerability, ScanResult } from "@/lib/types";
import type { ThreatPoint } from "@/lib/types";

// Dynamic import to avoid SSR issues with Leaflet
const ThreatMap = dynamic(() => import("@/components/ThreatMap"), { ssr: false });

// Import seed data statically for now
import sampleThreats from "../../backend_data/sample_threats.json";

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async (code: string, language: string) => {
    setIsScanning(true);
    setScanResult({
      scan_id: "pending",
      status: "scanning",
      progress: 0.1,
      vulnerabilities: [],
      fixes: [],
      sandbox_results: [],
    });

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!res.ok) throw new Error("Scan failed");

      const { scan_id } = await res.json();

      // Poll for results
      const poll = async () => {
        const statusRes = await fetch(`/api/scan/${scan_id}`);
        const result: ScanResult = await statusRes.json();
        setScanResult(result);

        if (result.status !== "complete" && result.status !== "error") {
          setTimeout(poll, 1000);
        } else {
          setIsScanning(false);
        }
      };

      poll();
    } catch {
      setIsScanning(false);
      setScanResult(null);
    }
  };

  const allThreats = sampleThreats as ThreatPoint[];
  const [visibleThreats, setVisibleThreats] = useState<ThreatPoint[]>([]);
  const [latestThreat, setLatestThreat] = useState<ThreatPoint | null>(null);

  // Simulate live threat feed — add threats one by one
  useEffect(() => {
    let idx = 0;
    // Start with a few threats visible immediately
    setVisibleThreats(allThreats.slice(0, 5));
    idx = 5;

    const interval = setInterval(() => {
      if (idx < allThreats.length) {
        const newThreat = allThreats[idx];
        setVisibleThreats((prev) => [...prev, newThreat]);
        setLatestThreat(newThreat);
        idx++;
      } else {
        // Loop: pick a random threat to "re-detect"
        const random = allThreats[Math.floor(Math.random() * allThreats.length)];
        setLatestThreat(random);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [allThreats]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-[#00ff88]">AI-Powered</span> Vulnerability Scanner
        </h1>
        <p className="text-[#a1a1aa] text-lg">
          Scan code for OWASP Top 10 vulnerabilities, verify exploits in isolation, get verified
          fixes
        </p>
      </div>

      {/* Threat Map */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#e4e4e7]">
            Global Threat Intelligence Map
          </h2>
          <div className="flex items-center gap-2">
            {latestThreat && (
              <span className="text-[10px] text-[#a1a1aa] font-mono truncate max-w-[300px] animate-pulse">
                {latestThreat.cve_id || latestThreat.id} — {latestThreat.country}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-[#00ff88] font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]" />
              </span>
              Live
            </span>
          </div>
        </div>
        <ThreatMap threats={visibleThreats} height="400px" />
      </div>

      {/* Scanner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <CodeInput onSubmit={handleScan} isScanning={isScanning} />
          {scanResult && (isScanning || scanResult.status === "complete") && (
            <ScanProgress status={scanResult.status} progress={scanResult.progress} />
          )}
        </div>

        {/* Results */}
        <div>
          {scanResult?.vulnerabilities && scanResult.vulnerabilities.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-[#e4e4e7]">
                  Vulnerabilities Found
                </h2>
                <span className="text-sm text-red-400 font-mono">
                  {scanResult.vulnerabilities.length} issues
                </span>
              </div>
              <div className="space-y-3">
                {scanResult.vulnerabilities.map((vuln, i) => (
                  <VulnerabilityCard key={i} vulnerability={vuln} index={i} />
                ))}
              </div>
            </div>
          ) : scanResult?.status === "complete" ? (
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-8 text-center">
              <span className="text-4xl mb-3 block">✅</span>
              <p className="text-[#00ff88] font-semibold">No vulnerabilities found!</p>
              <p className="text-[#a1a1aa] text-sm mt-1">Your code looks secure.</p>
            </div>
          ) : !isScanning ? (
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl p-8 text-center">
              <span className="text-4xl mb-3 block">🛡️</span>
              <p className="text-[#a1a1aa]">
                Paste code and hit scan to find vulnerabilities
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
