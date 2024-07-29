import { Inter } from "next/font/google";
import "./globals.scss";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Gakumas Tools",
  description:
    "Tools for playing Gakumas. Calculate the exam score required to achieve produce ranks, view P-item and skill card information, create your ideal contest loadouts, and more.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ overflow: "auto" }}>
        {children}
      </body>
    </html>
  );
}
