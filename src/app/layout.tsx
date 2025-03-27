import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ContextProviders } from "@/contexts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NoteGPT",
  description: "Summarize YouTube videos and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ContextProviders>{children}</ContextProviders>
      </body>
    </html>
  );
}
