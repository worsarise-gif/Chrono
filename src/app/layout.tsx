import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ChatProvider } from "../contexts/ChatContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Toaster } from "sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Chris",
  description: "Chris Chat App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="bg-[#000000] text-white font-sans overflow-hidden selection:bg-gray-800 selection:text-white relative">
        <ErrorBoundary>
          <AuthProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster theme="dark" position="top-center" toastOptions={{
          style: {
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#fff',
          }
        }} />
      </body>
    </html>
  );
}
