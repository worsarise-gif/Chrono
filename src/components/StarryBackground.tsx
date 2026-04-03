"use client";
import React from 'react';

export default function StarryBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundColor: 'var(--color-chat-bg)',
        backgroundImage: 'radial-gradient(var(--color-stars) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    />
  );
}
