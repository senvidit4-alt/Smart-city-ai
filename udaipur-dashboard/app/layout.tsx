import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CopilotPanel } from "@/components/chat/CopilotPanel";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Udaipur Smart City Copilot",
  description: "Municipal Intelligence Dashboard — Udaipur Municipal Corporation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-civic-bg text-civic-text font-sans">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <TopBar />
              <main className="flex-1 overflow-y-auto p-6" id="main-content">
                {children}
              </main>
            </div>
            <CopilotPanel />
          </div>
        </Providers>
      </body>
    </html>
  );
}
