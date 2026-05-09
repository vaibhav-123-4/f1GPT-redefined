import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "f1GPT",
  description: "AI-powered Formula 1 chatbot with live and historical data tools.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-f1.black text-f1.white antialiased">
        <div className="f1-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
