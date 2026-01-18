import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCVibe Project Manager",
  description: "A clean project management app for vibe coders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
