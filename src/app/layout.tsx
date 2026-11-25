import type { Metadata } from "next";
import { IBM_Plex_Mono, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"),
  title: { default: "HouseholdMe – Independently tested for the home", template: "%s – HouseholdMe" },
  description:
    "HouseholdMe tests household products in a real home. Independent buying guides and reviews for kitchen, cleaning, sleep and home.",
};

// Google tag (Google Ads conversion measurement for householdme.com), loaded on every page.
const GOOGLE_TAG_ID = "AW-18054504085";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${schibsted.variable} ${plexMono.variable}`}>
      <head>
        <script async src={`https://www.googletagmanager.com/gtm.js?id=${GOOGLE_TAG_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
