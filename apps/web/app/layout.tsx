import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { A11yProvider } from "@/lib/a11y/a11y-context";
import { Header } from "@/components/header";

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
        }
        if (prefs.reducedMotion) {
          document.documentElement.setAttribute('data-reduced-motion', 'true');
        }
      }
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prePaintA11yScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        <AuthProvider>
          <A11yProvider>
            <Header />
            <div className="flex-1 flex flex-col">{children}</div>
            <footer
              role="contentinfo"
              className="border-t-2 border-[var(--border)] bg-[var(--card)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]"
            >
              <div className="mx-auto max-w-7xl">
                <p>PathPulse &copy; 2026. Accessible indoor and outdoor navigation for everyone.</p>
              </div>
            </footer>
          </A11yProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
