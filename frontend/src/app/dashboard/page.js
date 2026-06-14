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
  Clock,
  ChefHat,
  CheckCircle,
  Coffee,
} from "lucide-react";
import { getSocket } from "@/lib/socket";

import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

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
  const [employeePerformance, setEmployeePerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [activeRange, setActiveRange] = useState("day");

  const [refreshKey, setRefreshKey] = useState(0);

  /* ✅ Socket Listener for Real-Time Updates */
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join', 'admin-room');

    const handleOrderCreated = (order) => {
      console.log("📶 Order created via socket:", order);
      setRecentOrders((prev) => [order, ...prev].slice(0, 5));
      setStats((prev) => {
        if (!prev) return prev;
        const isSent = order.status === 'SENT';
        return {
          ...prev,
          pendingOrders: isSent ? prev.pendingOrders + 1 : prev.pendingOrders,
          periodOrders: prev.periodOrders + 1,
          totalOrders: prev.totalOrders + 1
        };
      });
    };

    const handlePaymentCompleted = (data) => {
      console.log("📶 Payment completed via socket:", data);
      const { order } = data;
      setRecentOrders((prev) => prev.map(o => o.id === order.id ? { ...o, status: order.status } : o));
      setStats((prev) => {
        if (!prev) return prev;
        const amount = Number(order.totalAmount) || 0;
        return {
          ...prev,
          totalRevenue: prev.totalRevenue + amount,
          periodRevenue: prev.periodRevenue + amount,
          completedOrders: prev.completedOrders + 1,
          pendingOrders: Math.max(0, prev.pendingOrders - 1)
        };
      });
    };

    const handleKitchenPreparing = (order) => {
      console.log("📶 Order preparing in kitchen:", order);
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pendingOrders: Math.max(0, prev.pendingOrders - 1),
          preparingOrders: prev.preparingOrders + 1
        };
      });
    };

    const handleKitchenCompleted = (order) => {
      console.log("📶 Order completed in kitchen:", order);
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          preparingOrders: Math.max(0, prev.preparingOrders - 1),
          completedOrders: prev.completedOrders + 1
        };
      });
    };

    const handleTableStatusChanged = (data) => {
      console.log("📶 Table status changed via socket:", data);
      setStats((prev) => {
        if (!prev) return prev;
        const isOccupied = data.status === 'OCCUPIED';
        const isAvailable = data.status === 'AVAILABLE';
        return {
          ...prev,
          occupiedTables: isOccupied ? prev.occupiedTables + 1 : (isAvailable ? Math.max(0, prev.occupiedTables - 1) : prev.occupiedTables),
          availableTables: isAvailable ? prev.availableTables + 1 : (isOccupied ? Math.max(0, prev.availableTables - 1) : prev.availableTables)
        };
      });
    };

    const handleGenericUpdate = () => {
      console.log("📶 Generic dashboard update trigger");
      setRefreshKey((prev) => prev + 1);
    };

    socket.on('order_created', handleOrderCreated);
    socket.on('payment_completed', handlePaymentCompleted);
    socket.on('order_sent_to_kitchen', handleGenericUpdate);
    socket.on('kitchen_preparing', handleKitchenPreparing);
    socket.on('kitchen_completed', handleKitchenCompleted);
    socket.on('table_released', handleGenericUpdate);
    socket.on('table_status_changed', handleTableStatusChanged);
    socket.on('dashboard_updated', handleGenericUpdate);

    return () => {
      socket.off('order_created', handleOrderCreated);
      socket.off('payment_completed', handlePaymentCompleted);
      socket.off('order_sent_to_kitchen', handleGenericUpdate);
      socket.off('kitchen_preparing', handleKitchenPreparing);
      socket.off('kitchen_completed', handleKitchenCompleted);
      socket.off('table_released', handleGenericUpdate);
      socket.off('table_status_changed', handleTableStatusChanged);
      socket.off('dashboard_updated', handleGenericUpdate);
    };
  }, []);

  /* ✅ Fetch Dashboard Data */
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

        const headers = { Authorization: `Bearer ${token}` };

        const [statsRes, ordersRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats?range=${activeRange}`, { headers }),
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
  }, [token, refreshKey, activeRange]);

  /* ✅ Fetch Chart Data Based on Active Range */
  useEffect(() => {
    const fetchChartData = async () => {
      setChartsLoading(true);
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api";

        const headers = { Authorization: `Bearer ${token}` };

        const [trendsRes, productsRes, heatmapRes, employeeRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/sales-trends?range=${activeRange}`, { headers }),
          fetch(`${API_URL}/dashboard/top-products`, { headers }),
          fetch(`${API_URL}/dashboard/heatmap-data`, { headers }),
          fetch(`${API_URL}/dashboard/employee-performance?range=${activeRange}`, { headers }),
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

        if (employeeRes.ok) {
          const employeeData = await employeeRes.json();
          setEmployeePerformance(employeeData);
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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Revenue" value={`₹${stats?.totalRevenue || 0}`} icon={DollarSign} />
        <StatsCard 
          title={`${activeRange.charAt(0).toUpperCase() + activeRange.slice(1)}'s Revenue`} 
          value={`₹${stats?.periodRevenue || 0}`} 
          icon={TrendingUp} 
        />
        <StatsCard 
          title={`Orders (${activeRange})`} 
          value={stats?.periodOrders || 0} 
          icon={ShoppingBag} 
        />
        <StatsCard title="Pending Orders" value={stats?.pendingOrders || 0} icon={Clock} />
        <StatsCard title="Preparing Orders" value={stats?.preparingOrders || 0} icon={ChefHat} />
        <StatsCard 
          title={`Completed (${activeRange})`} 
          value={stats?.completedOrders || 0} 
          icon={CheckCircle} 
        />
        <StatsCard title="Occupied Tables" value={stats?.occupiedTables || 0} icon={Users} />
        <StatsCard title="Available Tables" value={stats?.availableTables || 0} icon={Coffee} />
      </section>

      {/* ✅ CHARTS GRID */}
      <section className="grid xl:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="xl:col-span-2 space-y-6">
          {/* Line Chart */}
          <div className="rounded-3xl bg-white p-6 shadow-lg border border-[#F1EEDB]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#1A4D2E]">Revenue by Category</h3>
              <TrendingUp className="h-5 w-5 text-[#1A4D2E]/40" />
            </div>

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
                          color: colors[idx % colors.length],
                          curve: "linear",
                        };
                      })
                    : [
                        { data: chartData.map((d) => d.beverages || 0), label: "Beverages", color: "#1A4D2E" },
                        { data: chartData.map((d) => d.food || 0), label: "Food", color: "#F4A460" },
                        { data: chartData.map((d) => d.desserts || 0), label: "Desserts", color: "#4ADE80" },
                      ]
                }
                margin={{ left: 60, right: 20, top: 40, bottom: 40 }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-gray-400 bg-[#FDFCF7] rounded-2xl border-2 border-dashed border-[#F1EEDB]">
                <p>No historical data available</p>
              </div>
            )}
          </div>

          {/* Top Selling Products List */}
          <div className="rounded-[32px] bg-white p-8 shadow-lg border border-[#F1EEDB]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-[#1A4D2E]">Top Selling Products</h3>
                <p className="text-gray-500 text-sm mt-1">Your most popular items by volume.</p>
              </div>
              <Sparkles className="h-6 w-6 text-[#1A4D2E]" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {chartsLoading ? (
                   Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-16 w-full bg-gray-50 animate-pulse rounded-2xl" />
                   ))
                ) : radarData.length > 0 ? (
                  radarData.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-[#FDFCF7] border border-[#F1EEDB] hover:border-[#1A4D2E]/20 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white border border-[#F1EEDB] flex items-center justify-center font-bold text-[#1A4D2E] shadow-sm group-hover:bg-[#1A4D2E] group-hover:text-white transition-colors">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-[#1A4D2E]">{product.item}</p>
                          <p className="text-xs text-gray-500">{product.orders} total sales</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#1A4D2E]" 
                            style={{ width: `${(product.orders / radarData[0].orders) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-gray-400 italic">No product data yet</p>
                )}
              </div>

              <div className="flex items-center justify-center">
                {chartsLoading ? (
                  <CoffeeLoader size="sm" />
                ) : radarData.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: radarData.map((d, i) => ({
                          id: i,
                          value: d.orders,
                          label: d.item,
                          color: ['#1A4D2E', '#2F7A46', '#4ADE80', '#F4A460', '#FDBA74', '#8C8775'][i % 6]
                        })),
                        innerRadius: 60,
                        outerRadius: 100,
                        paddingAngle: 5,
                        cornerRadius: 8,
                      },
                    ]}
                    height={250}
                    legend={{ hidden: true }}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Right Panel */}
        <div className="flex flex-col gap-6">
          {/* ✅ Heatmap */}
          <div className="rounded-3xl bg-white p-6 shadow-lg border border-[#F1EEDB]">
            <h3 className="font-bold text-[#1A4D2E] mb-4">
              Hourly Activity Heatmap
            </h3>

            <div style={{ height: 280 }}>
              {chartsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <CoffeeLoader size="sm" text="" />
                </div>
              ) : heatmapData.length > 0 ? (
                <ResponsiveHeatMap
                  data={heatmapData}
                  margin={{ top: 20, right: 10, bottom: 60, left: 50 }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: 'Hour of Day',
                    legendPosition: 'middle',
                    legendOffset: 45
                  }}
                  colors={{ type: "sequential", scheme: "greens" }}
                  enableLabels={false}
                  opacity={0.9}
                  emptyColor="#FDFCF7"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#FDFCF7] rounded-2xl border-2 border-dashed border-[#F1EEDB]">
                  <Clock className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No activity data yet</p>
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

      {/* ✅ EMPLOYEE PERFORMANCE */}
      <section className="grid grid-cols-1 gap-6">
        <div className="rounded-[32px] bg-white p-8 shadow-lg border border-[#F1EEDB]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-[#1A4D2E]">Employee Sales Performance</h3>
              <p className="text-gray-500 text-sm mt-1">Real-time revenue contribution by your barista team.</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#FDFBF4] flex items-center justify-center text-[#1A4D2E]">
              <Users className="h-6 w-6" />
            </div>
          </div>

          {chartsLoading ? (
            <div className="flex items-center justify-center h-[350px]">
              <CoffeeLoader size="md" text="Calculating performance..." />
            </div>
          ) : employeePerformance.length > 0 ? (
            <BarChart
              height={350}
              xAxis={[
                {
                  scaleType: "band",
                  data: employeePerformance.map((d) => d.name),
                  label: "Barista Name",
                },
              ]}
              series={[
                {
                  data: employeePerformance.map((d) => d.sales),
                  label: "Total Sales (₹)",
                  color: "#1A4D2E",
                  valueFormatter: (value) => `₹${value.toLocaleString()}`,
                },
              ]}
              borderRadius={12}
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 bg-[#FDFCF7] rounded-3xl border-2 border-dashed border-[#F1EEDB]">
              <ShoppingBag className="h-10 w-10 mb-3 opacity-20" />
              <p className="font-medium">No sales data recorded for this period</p>
            </div>
          )}
        </div>
      </section>

      {/* Orders Table */}
      <RecentOrders orders={recentOrders} />
    </div>
  );
}