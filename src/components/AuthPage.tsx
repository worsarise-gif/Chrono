import React from 'react';
import { loginWithGoogle } from '../firebase';
import { ChevronDown, Mail } from 'lucide-react';
import {PlanetLogo} from 'PlanetLogo.tsx';
export default function AuthPage() {
  return (
    <div className="flex h-[100dvh] w-full bg-white text-black font-sans overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col relative z-10 bg-white">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center">
            {/* xAI style logo */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.5 2L2 22H5.5L18 2H14.5Z" fill="black"/>
              <path d="M22 2H18.5L12 12.5L15.5 18L22 2Z" fill="black"/>
              <path d="M9.5 2H6L12.5 12.5L9 18L9.5 2Z" fill="black"/>
            </svg>
          </div>
          <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
            You are signing into 
            <span className="flex items-center gap-1 text-black font-semibold">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              Grok
            </span>
            <ChevronDown size={14} className="text-gray-500 ml-1" />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 max-w-[400px] mx-auto w-full">
          <h1 className="text-[32px] font-normal mb-8 text-center text-black">Log into your account</h1>
          
          <div className="w-full space-y-4">
            <button className="w-full bg-black text-white rounded-full py-3 flex items-center justify-center gap-2 font-medium hover:bg-black/90 transition-colors text-[15px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Login with 𝕏
            </button>

            <div className="flex items-center justify-center py-1">
              <div className="h-px bg-gray-200 w-full max-w-[80%]"></div>
            </div>

            <button className="w-full bg-white text-black border border-gray-200 rounded-full py-3 flex items-center justify-center gap-2 font-medium hover:bg-gray-50 transition-colors text-[15px]">
              <Mail size={18} strokeWidth={1.5} />
              Login with email
            </button>

            <button onClick={loginWithGoogle} className="w-full bg-white text-black border border-gray-200 rounded-full py-3 flex items-center justify-center gap-2 font-medium hover:bg-gray-50 transition-colors text-[15px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login with Google
            </button>

            <button className="w-full bg-white text-black border border-gray-200 rounded-full py-3 flex items-center justify-center gap-2 font-medium hover:bg-gray-50 transition-colors text-[15px]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.365 1.43c0 0-2.03.06-3.98 1.4-1.67 1.14-2.75 2.89-2.61 4.56 0 .02 2.08-.1 3.93-1.38 1.6-1.11 2.58-2.77 2.66-4.58zm-4.14 6.4c-1.8-.05-3.63 1.14-4.58 1.14-.98 0-2.52-1.09-3.96-1.06-2.06.03-3.97 1.2-5 3.02-2.12 3.65-.54 9.04 1.5 12.02 1.01 1.46 2.2 3.1 3.76 3.05 1.5-.06 2.08-1 3.88-1 1.8 0 2.33 1 3.9 1 1.6-.01 2.63-1.48 3.62-2.93 1.15-1.68 1.62-3.3 1.65-3.39-.03-.01-3.17-1.22-3.2-4.86-.02-3.05 2.49-4.52 2.6-4.59-1.42-2.09-3.63-2.36-4.42-2.4z"/>
              </svg>
              Login with Apple
            </button>
          </div>

          <p className="mt-8 text-[15px] text-gray-500">
            Don't have an account? <a href="#" className="text-black font-medium hover:underline">Sign up</a>
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-[13px] text-gray-500">
          By continuing, you agree to xAI's <a href="#" className="text-black hover:underline">Terms of Service</a> and <a href="#" className="text-black hover:underline">Privacy Policy</a>.
        </div>
      </div>

      {/* Right Side - Graphic */}
      <div className="hidden md:block md:w-1/2 h-full bg-black relative overflow-hidden">
        {/* Abstract gradient graphic matching the image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-3xl max-h-3xl">
            {/* Base glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-transparent via-[#3b4a5a]/20 to-[#8ba3b8]/40 blur-3xl rounded-full opacity-50"></div>
            
            <PlanetLogo/>
            
            {/* Right side bright edge */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#dbe6f0] to-transparent opacity-40 blur-2xl mix-blend-screen"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
