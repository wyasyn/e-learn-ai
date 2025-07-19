import { cn } from "@/lib/utils";
import Image from "next/image";
import React from "react";

export default function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="university logo"
      width={32}
      height={32}
      className={cn("object-contain ")}
    />
  );
}
