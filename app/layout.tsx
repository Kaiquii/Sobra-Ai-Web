import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Providers } from "@/app/providers";
import { THEME_BOOTSTRAP_SCRIPT, THEME_COLORS } from "@/lib/theme";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
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
            __html: THEME_BOOTSTRAP_SCRIPT,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
