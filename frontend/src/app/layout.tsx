import type { Metadata } from "next";
import "../styles/index.css";

export const metadata: Metadata = {
  title: "FairBite",
  description: "Bias-Aware Restaurant Rating System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
