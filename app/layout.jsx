import "@/ui/globals.css";
import { Inter } from "next/font/google";

import AuthProvider from "@/providers/auth-provider";
import { Toaster } from "@/ui/components/toaster";

const inter = Inter({ subsets: ["latin"], display: "auto" });

export default async function RootLayout({ children }) {
  return (
    <html className={inter.className} suppressHydrationWarning>
      <head>
        <title>Manuix</title>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
