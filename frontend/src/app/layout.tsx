import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentinel Code — AI Security Scanner",
  description: "AI-powered vulnerability scanner with threat intelligence mapping",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-[#0a0a0f]">
        <nav className="border-b border-[#2a2a3e] bg-[#12121a]/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <span className="text-xl font-bold text-[#00ff88]">
                Sentinel Code
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#a1a1aa]">
              <a href="/" className="hover:text-[#00ff88] transition-colors">
                Scanner
              </a>
              <a
                href="/threatmap"
                className="hover:text-[#00ff88] transition-colors"
              >
                Threat Map
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
