import type { ScanRequest, ScanResult, ThreatPoint } from "./types";

const API_BASE = "/api";

export async function submitScan(request: ScanRequest): Promise<{ scan_id: string }> {
  const res = await fetch(`${API_BASE}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error("Scan submission failed");
  return res.json();
}

export async function getScanStatus(scanId: string): Promise<ScanResult> {
  const res = await fetch(`${API_BASE}/scan/${scanId}`);
  if (!res.ok) throw new Error("Failed to fetch scan status");
  return res.json();
}

export async function getThreatMapData(): Promise<ThreatPoint[]> {
  const res = await fetch(`${API_BASE}/threatmap`);
  if (!res.ok) throw new Error("Failed to fetch threat data");
  return res.json();
}
