"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import type React from "react"; // Added import for React
import Logo from "./logo";
import { Lock } from "lucide-react";

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="flex items-center justify-between px-6 py-4 backdrop-blur-sm border-b border-white/10"
    >
      <Link href="/" className="flex items-center space-x-2">
        <Logo />
      </Link>

      <div className="hidden md:flex items-center space-x-4">
        <Button
          variant="ghost"
          className="text-white hover:text-purple-400"
          asChild
        >
          <Link href="/signin">Sign In</Link>
        </Button>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white"
          asChild
        >
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-white"
        asChild
      >
        <Link href="/signin">
          <Lock className="w-6 h-6" />
        </Link>
      </Button>
    </motion.nav>
  );
}
