"use client";

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Script from 'next/script';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { 'agent-id'?: string };
    }
  }
}

export default function ElevenLabsWidget() {
  const { user } = useAuth();

  if (user?.email !== 'johnkerveelayese@gmail.com') {
    return null;
  }

  return (
    <>
      <elevenlabs-convai agent-id="agent_4901kpg3xg17ex4sdsjw0kkaxs90"></elevenlabs-convai>
      <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="lazyOnload" />
    </>
  );
}
