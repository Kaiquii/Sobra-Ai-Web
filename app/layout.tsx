import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  applicationName: "SobraAi",
  title: "SobraAi",
  description: "Controle financeiro pessoal",
  appleWebApp: {
    capable: true,
    title: "SobraAi",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  interactiveWidget: "resizes-content",
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: "#f8fafc",
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
                var color = theme === "dark" ? "#020617" : "#f8fafc";
                document.querySelectorAll('meta[name="theme-color"]').forEach(function(meta) { meta.setAttribute("content", color); });
                document.documentElement.style.backgroundColor = color;
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
