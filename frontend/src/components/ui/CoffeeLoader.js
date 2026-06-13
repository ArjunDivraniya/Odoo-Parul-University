"use client";

export default function CoffeeLoader({ size = "md", text = "Brewing..." }) {
  // Size variants
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32"
  };

  const containerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${containerSize}`}>
        {/* Steam Animation */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1">
          <div className="w-1.5 h-4 bg-white/40 rounded-full animate-steam-1"></div>
          <div className="w-1.5 h-4 bg-white/60 rounded-full animate-steam-2"></div>
          <div className="w-1.5 h-4 bg-white/40 rounded-full animate-steam-3"></div>
        </div>

        {/* Cup Handle */}
        <div className="absolute top-1/2 -right-3 w-4 h-8 border-4 border-[#1A4D2E] rounded-r-xl -translate-y-1/2 transform rotate-12"></div>

        {/* Cup Body */}
        <div className="relative w-full h-full border-4 border-[#1A4D2E] rounded-b-[2rem] rounded-t-lg overflow-hidden bg-white/50 backdrop-blur-sm shadow-xl">
          {/* Liquid Fill */}
          <div className="absolute bottom-0 left-0 w-full bg-[#1A4D2E] animate-fill-coffee origin-bottom"></div>
          
          {/* Liquid Wave Surface */}
          <div className="absolute bottom-0 left-0 w-[200%] h-full">
             <div className="absolute bottom-[30%] w-full h-4 bg-[#23633e] opacity-50 animate-wave rounded-[100%]"></div>
          </div>
        </div>
        
        {/* Saucer */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[120%] h-1.5 bg-[#1A4D2E] rounded-full"></div>
      </div>

      {text && (
        <p className="text-[#1A4D2E] font-bold tracking-wider animate-pulse uppercase text-sm">
          {text}
        </p>
      )}
    </div>
  );
}
