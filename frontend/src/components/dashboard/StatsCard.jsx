import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, trend = "12.5%", trendUp = true }) {
  // Default to coffee/brown theme to match the app aesthetic
  let iconBg = "bg-[#F5EFE6]";
  let iconColor = "text-[#6B4423]";
  let sparklineStroke = "#6B4423";
  let sparklineGradientStart = "rgba(107, 68, 35, 0.4)";
  let sparklineGradientEnd = "rgba(107, 68, 35, 0)";
  
  if (title.includes("Occupied Tables") || title.includes("Available Tables")) {
    iconBg = "bg-[#FCF8F2]";
    iconColor = "text-[#8C8775]";
    sparklineStroke = "#8C8775";
    sparklineGradientStart = "rgba(140, 135, 117, 0.4)";
    sparklineGradientEnd = "rgba(140, 135, 117, 0)";
  }

  // Generate a smooth sparkline path
  const pathData = trendUp 
    ? "M0 25 C20 25, 40 22, 60 18 C80 14, 90 5, 100 5"
    : "M0 5 C20 5, 40 8, 60 12 C80 16, 90 25, 100 25";
    
  const fillPathData = `${pathData} L100 30 L0 30 Z`;

  return (
    <div className="rounded-[24px] bg-white p-5 pb-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#F0EBE1] hover:shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[160px]">
      <div className="flex gap-4">
        <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`h-[22px] w-[22px] ${iconColor}`} strokeWidth={2} />
        </div>
        
        <div className="flex flex-col">
          <p className="text-[13px] font-bold text-[#8C8775] tracking-wide mt-1">
            {title}
          </p>
          <h3 className="text-[26px] font-black text-[#3E2B21] mt-1 tracking-tight leading-none">
            {value}
          </h3>
          
          <div className="flex items-center gap-1.5 mt-2.5">
            {trendUp ? (
              <TrendingUp className="h-[14px] w-[14px] text-[#22C55E]" strokeWidth={3} />
            ) : (
              <TrendingDown className="h-[14px] w-[14px] text-red-500" strokeWidth={3} />
            )}
            <span className={`text-[12px] font-bold ${trendUp ? "text-[#22C55E]" : "text-red-500"}`}>
              {trend}
            </span>
            <span className="text-[12px] text-[#A8A396] font-medium">vs yesterday</span>
          </div>
        </div>
      </div>

      <div className="mt-4 h-12 w-[calc(100%+40px)] -ml-5 relative">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={`gradient-${title.replace(/[^a-zA-Z]/g, '')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={sparklineGradientStart} />
              <stop offset="100%" stopColor={sparklineGradientEnd} />
            </linearGradient>
          </defs>
          <path 
            d={fillPathData} 
            fill={`url(#gradient-${title.replace(/[^a-zA-Z]/g, '')})`} 
          />
          <path 
            d={pathData} 
            fill="none" 
            stroke={sparklineStroke} 
            strokeWidth="2.5" 
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
