import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Command Center | School ERP",
  description: "AI-native educational ERP command center powered by local Llama 3.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  );
}
