import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ChatProvider } from "../contexts/ChatContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ThemeProvider } from "../components/ThemeProvider";
import { DebugProvider } from "../contexts/DebugContext";
import FloatingDebugger from "../components/FloatingDebugger";
import { Toaster } from "sonner";
import ElevenLabsWidget from "../components/ElevenLabsWidget";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Chris",
  description: "Chris Chat App",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable}`} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans overflow-hidden selection:bg-gray-800 selection:text-white relative">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <DebugProvider>
            <ErrorBoundary>
              <AuthProvider>
                <ChatProvider>
                  {/* Mobile Top Scrim */}
                  <div className="fixed top-0 left-0 right-0 h-[calc(6rem+env(safe-area-inset-top))] bg-gradient-to-b from-chat-bg via-chat-bg/80 to-transparent z-[39] pointer-events-none md:hidden" />
                  {children}
                  <FloatingDebugger />
                  <ElevenLabsWidget />
                </ChatProvider>
              </AuthProvider>
            </ErrorBoundary>
          </DebugProvider>
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
