import type { Metadata } from "next";
import { Inter, Fredoka, Bungee_Shade } from "next/font/google";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["400", "500", "600", "700"],
});

const bungeeShade = Bungee_Shade({
  subsets: ["latin"],
  variable: "--font-bungee-shade",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Raffero - Private Raffles on Avalanche",
  description:
    "Join private, provably-fair raffles powered by zero-knowledge prooAfs. Spin the roulette or race your duck — your alias, your privacy.",
  icons: {
    icon: "/logos/raffero_blue.png",
    apple: "/logos/raffero_blue.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fredoka.variable} ${bungeeShade.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col film-grain scanlines font-body bg-bg-primary text-cream">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
