import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ComplySafe",
  description: "Automate compliance: Scan → Detect → Generate → Fix → Prove.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          {children}
        </div>
      </body>
    </html>
  );
}
