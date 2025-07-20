"use client";
import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { ImageCarousel } from "@/components/images-carousel";

export default function AuthWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="hidden md:flex h-screen">
      {/* Left Column - Image Carousel */}
      <motion.div
        className="flex-1 flex items-center justify-center "
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="w-full max-w-md px-8">{children}</div>
      </motion.div>
      {/* Right Column - Children Content */}
      <motion.div
        className="flex-1 relative m-4 rounded-2xl overflow-clip"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <ImageCarousel />
      </motion.div>
    </div>
  );
}
