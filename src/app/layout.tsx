import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ChatProvider } from "../contexts/ChatContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ThemeProvider } from "../components/ThemeProvider";
import { DebugProvider } from "../contexts/DebugContext";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
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
                  {children}
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
