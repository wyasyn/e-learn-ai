"use client";
import React from "react";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Logout() {
  const router = useRouter();
  const handleLout = async () => {
    try {
      await authClient.signOut();
      localStorage.removeItem("lecturer");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Button size={"sm"} variant={"ghost"} onClick={handleLout}>
      <LogOut className="w-4 h-4" />
      <span className="hidden md:inline-block">Logout</span>
    </Button>
  );
}
