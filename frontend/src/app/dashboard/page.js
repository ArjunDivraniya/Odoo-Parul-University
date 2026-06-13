"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import StatsCard from "@/components/dashboard/StatsCard";
import RecentOrders from "@/components/dashboard/RecentOrders";
import CoffeeLoader from "@/components/ui/CoffeeLoader";
import { useAuthStore } from "@/stores/auth-store";

import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  CalendarDays,
  Sparkles,
  Search,
  Bell,
} from "lucide-react";

import { LineChart } from "@mui/x-charts/LineChart";
import { RadarChart } from "@mui/x-charts/RadarChart";

/* ✅ Nivo Heatmap must be imported dynamically */
const ResponsiveHeatMap = dynamic(
  () => import("@nivo/heatmap").then((m) => m.ResponsiveHeatMap),
  { ssr: false }
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesTrends, setSalesTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [activeRange, setActiveRange] = useState("day");

  /* ✅ Fetch Dashboard Data */
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, ordersRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats`, { headers }),
          fetch(`${API_URL}/dashboard/recent-orders`, { headers }),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setRecentOrders(ordersData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  /* ✅ Fetch Chart Data Based on Active Range */
  useEffect(() => {
    const fetchChartData = async () => {
      setChartsLoading(true);
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

        const headers = { Authorization: `Bearer ${token}` };

        const [trendsRes, productsRes, heatmapRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/sales-trends?range=${activeRange}`, { headers }),
          fetch(`${API_URL}/dashboard/top-products`, { headers }),
          fetch(`${API_URL}/dashboard/heatmap-data`, { headers }),
        ]);

        if (trendsRes.ok) {
          const trendsData = await trendsRes.json();
          setSalesTrends(trendsData.data || trendsData);
          setCategories(trendsData.categories || []);
        }

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setTopProducts(productsData);
        }

        if (heatmapRes.ok) {
          const heatmapResult = await heatmapRes.json();
          setHeatmapData(heatmapResult);
        }
      } catch (error) {
        console.error("Failed to fetch chart data", error);
      } finally {
        setChartsLoading(false);
      }
    };

    if (token) fetchChartData();
  }, [activeRange, token]);

  /* ✅ Timeframes */
  const timeframeOptions = [
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
  ];

  // Static data removed - now using dynamic data from API

  /* ✅ Service Score */
  const serviceScore = useMemo(() => {
    if (!stats?.totalOrders) return 75;
    return Math.min(100, Math.max(70, stats.totalOrders % 100));
  }, [stats]);

  /* ✅ Date */
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    []
  );

  const chartData = salesTrends.length > 0 ? salesTrends : [];
  const radarData = topProducts.length > 0 ? topProducts : [];
  const openOrders = stats?.totalOrders || recentOrders.length;
  const activeStaff = stats?.totalUsers || 12;

  /* ✅ Loading Spinner */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <CoffeeLoader size="xl" text="Brewing Dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ✅ HERO */}
      <section
        className="rounded-[40px] text-white p-8 lg:p-12 shadow-[0_45px_80px_rgba(14,60,39,0.45)] border border-white/10"
        style={{
          backgroundImage: `linear-gradient(
      135deg,
      #163d28ff 0%,
      #1A4D2E 60%,
      #2F7A46 100%
    )`,
        }}
      >

        <div className="flex flex-col xl:flex-row gap-10 items-start">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold">
              <Sparkles className="h-4 w-4" /> Welcome back to Odoo Cafe
            </div>

            <div>
              <h1 className="text-4xl lg:text-5xl font-black leading-tight">
                Brewing insights for today&apos;s service.
              </h1>
              <p className="text-white/80 text-lg mt-3">
                Track revenue, monitor orders, and keep your baristas aligned with a single glance.
              </p>
            </div>

            <div className="inline-flex gap-2 bg-white/5 rounded-full p-1">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setActiveRange(option.value)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition ${activeRange === option.value
                      ? "bg-white text-[#1A4D2E] shadow"
                      : "text-white/80 hover:bg-white/10"
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full max-w-sm bg-white/10 rounded-[32px] border border-white/20 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>{today}</span>
              </div>
              <button className="h-10 w-10 rounded-2xl bg-white text-[#1A4D2E] flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                placeholder="Search drink, table, barista"
                className="w-full rounded-2xl bg-white/10 border border-white/20 px-12 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-white/70">Open Orders</p>
                <p className="text-2xl font-bold">{openOrders}</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-white/70">Active Staff</p>
                <p className="text-2xl font-bold">{activeStaff}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ STATS */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard title="Total Revenue" value={`₹${stats?.totalRevenue || 0}`} icon={DollarSign} />
        <StatsCard title="Today's Revenue" value={`₹${stats?.todayRevenue || 0}`} icon={TrendingUp} />
        <StatsCard title="Orders" value={stats?.totalOrders || 0} icon={ShoppingBag} />
        <StatsCard title="Users" value={stats?.totalUsers || 0} icon={Users} />
      </section>

      {/* ✅ CHARTS GRID */}
      <section className="grid xl:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="xl:col-span-2 space-y-6">
          {/* Line Chart */}
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h3 className="font-bold text-[#1A4D2E] mb-4">
              Beverage Performance
            </h3>

            {chartsLoading ? (
              <div className="flex items-center justify-center h-[280px]">
                <CoffeeLoader size="sm" text="" />
              </div>
            ) : chartData.length > 0 ? (
              <LineChart
                height={280}
                xAxis={[
                  { scaleType: "point", data: chartData.map((d) => d.slot) },
                ]}
                series={
                  categories.length > 0
                    ? categories.map((cat, idx) => {
                        const key = cat.toLowerCase().replace(/\s+/g, '');
                        const colors = ['#1A4D2E', '#F4A460', '#4ADE80', '#8B5CF6', '#F59E0B'];
                        return {
                          data: chartData.map((d) => d[key] || 0),
                          label: cat,
                          color: colors[idx % colors.length]
                        };
                      })
                    : [
                        { data: chartData.map((d) => d.beverages || 0), label: "Beverages", color: "#1A4D2E" },
                        { data: chartData.map((d) => d.food || 0), label: "Food", color: "#F4A460" },
                        { data: chartData.map((d) => d.desserts || 0), label: "Desserts", color: "#4ADE80" },
                      ]
                }
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Radar Chart */}
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h3 className="font-bold text-[#1A4D2E] mb-4">
              Top Products Performance
            </h3>

            {chartsLoading ? (
              <div className="flex items-center justify-center h-[280px]">
                <CoffeeLoader size="sm" text="" />
              </div>
            ) : radarData.length > 0 ? (
              <RadarChart
                height={280}
                radar={{
                  metrics: radarData.map((d) => d.item),
                }}
                series={[
                  {
                    data: radarData.map((d) => d.orders),
                    label: "Orders",
                    area: true,
                    color: "#1A4D2E",
                  },
                ]}
              />
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-400">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Right Panel */}
        <div className="flex flex-col gap-6">
          {/* ✅ Heatmap */}
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <h3 className="font-bold text-[#1A4D2E] mb-4">
              Weekly Orders Heatmap
            </h3>

            <div style={{ height: 260 }}>
              {chartsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <CoffeeLoader size="sm" text="" />
                </div>
              ) : heatmapData.length > 0 ? (
                <ResponsiveHeatMap
                  data={heatmapData}
                  margin={{ top: 30, right: 20, bottom: 40, left: 80 }}
                  axisTop={null}
                  axisRight={null}
                  colors={{ type: "sequential", scheme: "greens" }}
                  enableLabels={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Service Score */}
          <div className="rounded-3xl bg-gradient-to-br from-[#FDFBF4] to-[#F1EEDB] p-6 shadow-lg">
            <h3 className="font-bold text-[#1A4D2E] mb-4">
              Customer Delight Index
            </h3>

            <div
              className="h-36 w-36 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(#1A4D2E ${(serviceScore / 100) * 360
                  }deg, #DADCCB ${(serviceScore / 100) * 360}deg)`,
              }}
            >
              <div className="h-24 w-24 bg-white rounded-full flex flex-col items-center justify-center shadow">
                <p className="text-3xl font-black text-[#1A4D2E]">
                  {serviceScore}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-widest">
                  Score
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Orders Table */}
      <RecentOrders orders={recentOrders} />
    </div>
  );
}