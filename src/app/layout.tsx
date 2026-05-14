import type { Metadata } from "next";
import { Montserrat, Google_Sans_Code } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ChatProvider } from "../contexts/ChatContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ThemeProvider } from "../components/ThemeProvider";
import { DebugProvider } from "../contexts/DebugContext";
import { FloatingDebugger } from "../components/FloatingDebugger";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

const googleSansCode = Google_Sans_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-google-sans-code",
});

export const metadata: Metadata = {
  title: "Chrono",
  description: "Chrono Chat App",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${googleSansCode.variable}`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-foreground font-sans overflow-hidden selection:bg-primary/30 selection:text-foreground relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <AuthProvider>
              <DebugProvider>
                <ChatProvider>
                  {children}
                </ChatProvider>
                <FloatingDebugger />
              </DebugProvider>
            </AuthProvider>
          </ErrorBoundary>
          <Toaster theme="system" position="top-center" toastOptions={{
            style: {
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-foreground)',
            }
          }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
