export interface Vulnerability {
  name: string;
  owasp_category: string;
  severity: "critical" | "high" | "medium" | "low";
  affected_lines: number[];
  description: string;
  exploit_code: string;
  fix_suggestion: string;
}

export interface ScanResult {
  scan_id: string;
  status: "processing" | "scanning" | "testing" | "fixing" | "complete" | "error";
  progress: number;
  vulnerabilities: Vulnerability[];
  fixes: { original: string; fixed: string; vulnerability: string }[];
  sandbox_results: { vulnerability: string; exploitable: boolean; output: string }[];
}

export interface ThreatPoint {
  id: string;
  lat: number;
  lng: number;
  country: string;
  city?: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  description: string;
  cve_id?: string;
  source_ip?: string;
  timestamp: string;
}

export interface ScanRequest {
  code?: string;
  repo_url?: string;
  language: string;
}
