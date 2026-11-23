import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { A11yProvider } from "@/lib/a11y/a11y-context";
import { Header } from "@/components/header";
import { QueryProvider } from "@/lib/providers/query-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "PathPulse — Navigate Without Barriers",
    template: "%s | PathPulse",
  },
  description: "Accessibility-aware indoor and multi-floor navigation platform",
};

const prePaintA11yScript = `
(function() {
  try {
    var match = document.cookie.split('; ').find(function(row) { return row.startsWith('pp_a11y='); });
    if (match) {
      var raw = match.split('=')[1];
      if (raw) {
        var prefs = JSON.parse(decodeURIComponent(raw));
        if (prefs.textScale) {
          document.documentElement.style.setProperty('--text-scale', String(prefs.textScale));
        }
        if (prefs.highContrast) {
          document.documentElement.setAttribute('data-theme', 'high-contrast');
          return;
        }
        if (prefs.reducedMotion) {
          document.documentElement.setAttribute('data-reduced-motion', 'true');
        }
        if (prefs.theme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
          document.documentElement.classList.remove('dark');
          return;
        }
      }
    }
  } catch(e) {}
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.classList.add('dark');
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} dark`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaintA11yScript }} />
      </head>
      <body className="relative flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] antialiased font-sans">
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
        >
          <div className="decorative-shape-1 absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-teal-500/15 blur-[120px] dark:bg-teal-400/10 motion-reduce:animate-none" />
          <div className="decorative-shape-2 absolute top-1/4 -right-40 h-[560px] w-[560px] rounded-full bg-violet-600/15 blur-[140px] dark:bg-violet-500/10 motion-reduce:animate-none" />
          <div className="decorative-shape-3 absolute -bottom-40 left-1/4 h-[520px] w-[520px] rounded-full bg-blue-600/15 blur-[130px] dark:bg-blue-500/10 motion-reduce:animate-none" />
        </div>
        <QueryProvider>
          <AuthProvider>
            <A11yProvider>
              <Header />
              <div className="flex-1 flex flex-col">{children}</div>
              <footer
                role="contentinfo"
                className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]"
              >
                <div className="mx-auto max-w-7xl space-y-4">
                  <nav
                    aria-label="Footer navigation"
                    className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium"
                  >
                    <Link
                      href="/about"
                      className="inline-flex items-center min-h-[24px] py-1 text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      About
                    </Link>
                    <Link
                      href="/accessibility"
                      className="inline-flex items-center min-h-[24px] py-1 text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      Accessibility Statement
                    </Link>
                    <Link
                      href="/privacy"
                      className="inline-flex items-center min-h-[24px] py-1 text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      Privacy Notice
                    </Link>
                    <Link
                      href="/terms"
                      className="inline-flex items-center min-h-[24px] py-1 text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      Terms of Use
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center min-h-[24px] py-1 text-[var(--foreground)] underline-offset-4 hover:underline"
                    >
                      Contact & Feedback
                    </Link>
                  </nav>
                  <p>
                    PathPulse &copy; 2026. Accessible indoor and multi-floor navigation. Map data
                    &copy;{" "}
                    <a
                      href="https://www.openstreetmap.org/copyright"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[var(--foreground)]"
                    >
                      OpenStreetMap contributors
                    </a>
                    .
                  </p>
                </div>
              </footer>
            </A11yProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
