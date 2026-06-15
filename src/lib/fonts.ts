import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";

// Mirrors the rozalix-landing brand typography so client dashboards feel
// like a natural extension of their marketing site.
export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const fontVariables = [inter, spaceGrotesk, jetbrains]
  .map((f) => f.variable)
  .join(" ");
