import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { DarkModeProvider } from "~/lib/dark-mode";

export const metadata: Metadata = {
  title: "lift.news",
  description: "a simple app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  );
}
