'use client';
import React from 'react';
import Script from 'next/script';
import { motion } from 'motion/react';

export default function VoicePage() {
  return (
    <div className="min-h-[100dvh] bg-sidebar-bg flex flex-col items-center justify-center relative overflow-hidden">
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="lazyOnload" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-2xl px-4 flex flex-col items-center"
      >
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-white mb-3 tracking-widest uppercase">Jarvis</h1>
          <p className="text-foreground/60 font-light text-sm tracking-wider">AWAITING COMMAND</p>
        </div>
        <elevenlabs-convai agent-id="agent_4901kpg3xg17ex4sdsjw0kkaxs90"></elevenlabs-convai>
      </motion.div>
    </div>
  );
}
