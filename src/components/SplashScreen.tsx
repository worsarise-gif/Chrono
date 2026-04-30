"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { PlanetLogo } from './PlanetLogo';

export const SplashScreen = () => {
  const brandName = "Chrono";
  const letters = Array.from(brandName);

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.8, // Wait for logo to settle
        staggerChildren: 0.1, // Stagger effect
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background">
      <div className="flex items-center gap-4">
        {/* Logo starts off-screen to the right and slides in */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            type: 'spring' as const,
            damping: 15,
            stiffness: 100,
            duration: 0.8,
          }}
        >
          <PlanetLogo showText={false} size={48} />
        </motion.div>

        {/* Brand name staggered reveal */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex overflow-hidden"
          style={{ fontFamily: 'var(--font-brand)' }}
        >
          {letters.map((letter, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className="text-4xl font-bold tracking-tight text-foreground"
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
