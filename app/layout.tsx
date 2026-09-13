import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { AccessibilityBar } from "@/components/AccessibilityBar";
import { CookieNotice } from "@/components/CookieNotice";
import { ScrollToTop } from "@/components/ScrollToTop";
import { SITE } from "@/lib/site";
import { verificationMetadata } from "@/lib/seo";

// Applied before first paint so a saved high-contrast or text-size choice never flashes.
const EARLY_A11Y = `(()=>{try{var p=JSON.parse(localStorage.getItem("playoboe:a11y")||"{}");var r=document.documentElement;var s=[1,1.15,1.3,1.5,1.75][p.fontStep||0]||1;r.style.setProperty("--a11y-scale",String(s));if(p.contrast)r.setAttribute("data-a11y-contrast","high");if(p.readableFont)r.setAttribute("data-a11y-font","readable");if(p.underlineLinks)r.setAttribute("data-a11y-links","underline");if(p.wideSpacing)r.setAttribute("data-a11y-spacing","wide");if(p.reducedMotion)r.setAttribute("data-a11y-motion","reduced");}catch(e){}})();`;

const display = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.founder, url: SITE.url }],
  creator: SITE.founder,
  publisher: SITE.name,
  keywords: [...SITE.keywords],
  category: "music",
  referrer: "origin-when-cross-origin",
  verification: verificationMetadata(),
};

export const viewport: Viewport = {
  themeColor: SITE.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${sans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_A11Y }} />
      </head>
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-cream focus:px-4 focus:py-3 focus:font-semibold focus:text-forest"
        >
          Skip to content
        </a>
        {children}
        <AccessibilityBar />
        <ScrollToTop />
        <CookieNotice />
      </body>
    </html>
  );
}
