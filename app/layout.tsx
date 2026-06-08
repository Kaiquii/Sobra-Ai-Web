import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  applicationName: "SobraAí",
  title: "SobraAí",
  description: "Controle financeiro pessoal",
  appleWebApp: {
    capable: true,
    title: "SobraAí",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var storedTheme = localStorage.getItem("app-financeiro-theme");
                var parsedTheme = storedTheme ? JSON.parse(storedTheme) : null;
                var theme = parsedTheme && parsedTheme.state ? parsedTheme.state.theme : "light";
                document.documentElement.classList.toggle("dark", theme === "dark");
              } catch (error) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
