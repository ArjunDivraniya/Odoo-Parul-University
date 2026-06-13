export default function StatsCard({ title, value, icon: Icon, trend, trendUp }) {
  return (
    <div className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-cream-100 via-white to-beige-100 p-6 shadow-[0_25px_60px_rgba(26,77,46,0.08)] border border-white/70 hover:-translate-y-1 hover:shadow-[0_25px_60px_rgba(26,77,46,0.16)] transition-all duration-500">
      <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.18),_transparent_60%)] pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div
          className={`h-14 w-14 rounded-2xl backdrop-blur-md flex items-center justify-center border ${
            title.includes("Revenue")
              ? "border-gold-400/50 bg-gold-500/10 text-gold-700"
              : "border-sage-500/30 bg-sage-500/10 text-sage-700"
          }`}
        >
          <Icon className="h-7 w-7" />
        </div>

        {trend && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1 ${
              trendUp
                ? "bg-[#E8F5E9] text-[#1A4D2E]"
                : "bg-red-50 text-red-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                trendUp ? "bg-[#1A4D2E]" : "bg-red-500"
              }`}
            />
            {trend}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#5F6F65]/70">
          {title}
        </p>
        <h3 className="text-4xl font-black text-[#1A4D2E] tracking-tight">
          {value}
        </h3>
      </div>

      <div className="mt-5 h-1.5 rounded-full bg-[#E6E9E5] overflow-hidden">
        <span
          className={`block h-full rounded-full ${
            trendUp ? "bg-[#1A4D2E]" : "bg-red-400"
          }`}
          style={{ width: trendUp ? "72%" : "48%" }}
        />
      </div>
    </div>
  );
}
