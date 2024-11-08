import { Inter } from "next/font/google";
import "../globals.scss";

export const metadata = {
  title: "Like GAKUMAS TOOLS?",
  description: "Support me on Ko-fi",
  robots: {
    index: false,
  },
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
