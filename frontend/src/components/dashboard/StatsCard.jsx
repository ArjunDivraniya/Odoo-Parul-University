import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({ title, value, icon: Icon, trend = "12.5%", trendUp = true }) {
  // Determine colors based on title to match the image variety
  let iconBg = "bg-[#E8F5E9]";
  let iconColor = "text-[#1A4D2E]";
  let sparklineStroke = "#1A4D2E";
  
  if (title.includes("Today's Revenue")) {
    iconBg = "bg-[#FFF4E5]";
    iconColor = "text-[#E68A00]";
    sparklineStroke = "#E68A00";
  } else if (title.includes("Orders Today") || title.includes("Occupied Tables")) {
    iconBg = "bg-[#F3EDE5]";
    iconColor = "text-coffee-dark";
    sparklineStroke = "#8C8775";
  }

  // Generate a random sparkline path for visual effect since we don't have real data points for each card
  const pathData = trendUp 
    ? "M0 25 C20 25, 30 15, 50 18 C70 20, 80 5, 100 5"
    : "M0 5 C20 5, 30 15, 50 12 C70 10, 80 25, 100 25";
    
  const fillPathData = `${pathData} L100 30 L0 30 Z`;

  return (
    <div className="rounded-[28px] bg-white p-5 shadow-[0_4px_20px_rgba(62,43,33,0.02)] border border-[#EBE4D5]/60 hover:shadow-[0_8px_30px_rgba(62,43,33,0.06)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
      <div className="flex gap-4">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        
        <div className="flex flex-col">
          <p className="text-[13px] font-bold text-coffee-dark/60 tracking-wide">
            {title}
          </p>
          <h3 className="text-2xl font-black text-coffee-dark mt-0.5 tracking-tight">
            {value}
          </h3>
          
          <div className="flex items-center gap-1.5 mt-2">
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span className={`text-[11px] font-bold ${trendUp ? "text-green-600" : "text-red-500"}`}>
              {trend}
            </span>
            <span className="text-[11px] text-coffee-dark/40 font-medium">vs yesterday</span>
          </div>
        </div>
      </div>

      <div className="mt-4 h-10 w-full relative">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
          {/* Gradient for fill */}
          <defs>
            <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={sparklineStroke} stopOpacity="0.2" />
              <stop offset="100%" stopColor={sparklineStroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path 
            d={fillPathData} 
            fill={`url(#gradient-${title.replace(/\s+/g, '')})`} 
          />
          <path 
            d={pathData} 
            fill="none" 
            stroke={sparklineStroke} 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          {/* Add a little dot at the end */}
          <circle cx="100" cy={trendUp ? "5" : "25"} r="2.5" fill={sparklineStroke} />
        </svg>
      </div>
    </div>
  );
}
