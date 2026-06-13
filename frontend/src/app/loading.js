"use client";

import CoffeeLoader from "@/components/ui/CoffeeLoader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FBFBF2]">
      <CoffeeLoader size="xl" text="Brewing..." />
    </div>
  );
}
