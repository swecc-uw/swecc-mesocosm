import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Mesocosm — a field guide to AI environments",
  description: "A public archive of typed environments for AI agents, ranked under reproducible conditions.",
};

const themeBoot = `
  (function () {
    try {
      var stored = localStorage.getItem('ba-theme');
      var os = window.matchMedia &&
               window.matchMedia('(prefers-color-scheme: dark)').matches
                 ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', stored || os);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink font-body">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line py-8 mt-16">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-muted">
            <span>Mesocosm · a distributed AI evaluation protocol</span>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink transition-colors"
            >
              API Docs
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
