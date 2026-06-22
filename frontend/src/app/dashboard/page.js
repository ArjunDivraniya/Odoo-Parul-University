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

  /* ✅ Date */
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date()),
    []
  );

  const chartData = salesTrends.length > 0 ? salesTrends : [];
  const radarData = topProducts.length > 0 ? topProducts : [];
  const openOrders = stats?.totalOrders || recentOrders.length || 0;
  const activeStaff = stats?.totalUsers || 1;

  /* ✅ Loading Spinner */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <CoffeeLoader size="xl" text="Brewing Dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✅ HERO SECTION */}
      <section className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT: Hero Banner */}
        <div className="relative flex-1 bg-[#FDFCF7] rounded-[32px] p-10 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-[#F0EBE1] overflow-hidden flex flex-col justify-between min-h-[340px]">
          <div className="relative z-10 max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-transparent text-[#3E2B21] text-sm font-bold border border-[#EBE4D5]">
              <span className="text-base">👋</span> Welcome back to Odoo Cafe
            </div>

            <div>
              <h1 className="text-5xl font-black leading-[1.1] text-[#3E2B21] font-serif tracking-tight">
                Brewing insights for today's service.
              </h1>
              <p className="text-[#8C8775] text-base mt-4 font-bold leading-relaxed max-w-sm">
                Track revenue, monitor orders, and keep your baristas aligned with a single glance.
              </p>
            </div>

            <div className="inline-flex items-center gap-1 bg-[#FDFCF7] rounded-full border border-[#F0EBE1] mt-4 p-1 shadow-sm">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setActiveRange(option.value)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                    activeRange === option.value
                      ? "bg-[#3E2B21] text-white shadow-md"
                      : "text-[#8C8775] hover:text-[#3E2B21]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <img 
            src="/hero-coffee.png" 
            alt="Coffee Cups" 
            className="absolute -right-8 bottom-0 h-[115%] object-contain pointer-events-none opacity-60 mix-blend-multiply"
          />
        </div>

        {/* RIGHT: Quick Actions & Overview Cards */}
        <div className="w-full lg:w-[420px] flex flex-col gap-6">
          
          {/* Top Row: Date & Notification */}
          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-full px-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#F0EBE1] flex items-center gap-3 text-sm text-[#3E2B21] font-bold h-14">
              <CalendarDays className="h-[18px] w-[18px] text-[#8C8775]" />
              <span>{today}</span>
            </div>
            <button className="h-14 w-14 rounded-full border border-[#F0EBE1] flex items-center justify-center text-[#3E2B21] bg-white hover:bg-[#FDFCF7] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all shrink-0">
              <Bell className="h-[20px] w-[20px]" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A8A396]" />
            <input
              placeholder="Search drink, table, barista..."
              className="w-full h-14 rounded-full bg-white border border-[#F0EBE1] pl-14 pr-6 text-sm font-bold text-[#3E2B21] placeholder:text-[#A8A396] focus:outline-none focus:border-[#EBE4D5] focus:ring-4 focus:ring-[#FDFCF7] shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all"
            />
          </div>

          {/* Bottom Row: Tall Cards */}
          <div className="grid grid-cols-2 gap-5 flex-1 min-h-[160px]">
            <div className="rounded-[32px] bg-white border border-[#F0EBE1] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <p className="text-[#8C8775] text-sm font-bold">Open Orders</p>
              <div className="flex items-end justify-between mt-auto">
                <p className="text-[40px] font-black text-[#3E2B21] leading-none">{openOrders}</p>
                <div className="h-[46px] w-[46px] rounded-full bg-[#FDFCF7] flex items-center justify-center text-[#A8A396] border border-[#F0EBE1]">
                  <ShoppingBag className="h-[22px] w-[22px]" />
                </div>
              </div>
            </div>
            
            <div className="rounded-[32px] bg-white border border-[#F0EBE1] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <p className="text-[#8C8775] text-sm font-bold">Active Staff</p>
              <div className="flex items-end justify-between mt-auto">
                <p className="text-[40px] font-black text-[#3E2B21] leading-none">{activeStaff}</p>
                <div className="h-[46px] w-[46px] rounded-full bg-[#FDFCF7] flex items-center justify-center text-[#A8A396] border border-[#F0EBE1]">
                  <Users className="h-[22px] w-[22px]" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ✅ STATS GRID */}
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

      {/* ✅ CHARTS & ACTIVITY */}
      <section className="space-y-6">
        {/* Line Chart */}
        <div className="rounded-[32px] bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#F0EBE1]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[#3E2B21] text-xl">Revenue by Category</h3>
            <TrendingUp className="h-5 w-5 text-[#8C8775]" />
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
                      const colors = ['#3E2B21', '#F4A460', '#EBE4D5', '#8B5CF6', '#F59E0B'];
                      return {
                        data: chartData.map((d) => d[key] || 0),
                        label: cat,
                        color: colors[idx % colors.length],
                        curve: "linear",
                      };
                    })
                  : [
                      { data: chartData.map((d) => d.beverages || 0), label: "Beverages", color: "#3E2B21" },
                      { data: chartData.map((d) => d.food || 0), label: "Food", color: "#F4A460" },
                      { data: chartData.map((d) => d.desserts || 0), label: "Desserts", color: "#EBE4D5" },
                    ]
              }
              margin={{ left: 60, right: 20, top: 40, bottom: 40 }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-[#A8A396] bg-[#FDFCF7] rounded-[24px] border border-dashed border-[#F0EBE1]">
              <p className="font-bold">No historical data available</p>
            </div>
          )}
        </div>

        {/* Top Selling & Heatmap Grid */}
        <div className="grid xl:grid-cols-2 gap-6">
          {/* Top Selling Products List */}
          <div className="rounded-[32px] bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#F0EBE1] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#3E2B21]">Top Selling Products</h3>
                <p className="text-[#8C8775] text-sm mt-1 font-medium">Your most popular items by volume.</p>
              </div>
              <Sparkles className="h-6 w-6 text-[#3E2B21]" />
            </div>

            <div className="grid md:grid-cols-2 gap-8 flex-1">
              <div className="space-y-4">
                {chartsLoading ? (
                   Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-16 w-full bg-[#FDFCF7] animate-pulse rounded-[16px]" />
                   ))
                ) : topProducts.length > 0 ? (
                  topProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-[#FDFCF7] p-3 rounded-[16px] border border-[#F0EBE1]">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-[#3E2B21] border border-[#EBE4D5]">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#3E2B21] text-sm">{product.name}</p>
                        <p className="text-xs text-[#8C8775] font-medium">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#6B4423] text-sm">{product.sold}</p>
                        <p className="text-[10px] text-[#8C8775] font-medium">sold</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#8C8775] font-bold">No products sold yet.</p>
                )}
              </div>

              {/* Radar Chart for Top Products Categories */}
              <div className="flex items-center justify-center bg-[#FDFCF7] rounded-[24px] p-4 border border-[#F0EBE1] h-full min-h-[250px]">
                {chartsLoading ? (
                  <CoffeeLoader size="sm" />
                ) : radarData.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: radarData.slice(0, 5).map((p, i) => ({
                          id: i,
                          value: p.sold,
                          label: p.name,
                        })),
                        innerRadius: 30,
                        outerRadius: 100,
                        paddingAngle: 5,
                        cornerRadius: 5,
                      },
                    ]}
                    height={250}
                  />
                ) : (
                  <div className="text-center">
                    <PieChart
                      series={[
                        {
                          data: [
                            { id: 0, value: 30, label: "Coffee", color: "#3E2B21" },
                            { id: 1, value: 20, label: "Tea", color: "#F4A460" },
                            { id: 2, value: 15, label: "Snacks", color: "#EBE4D5" },
                          ],
                          innerRadius: 30,
                          outerRadius: 100,
                          paddingAngle: 5,
                          cornerRadius: 5,
                        },
                      ]}
                      height={250}
                    />
                    <p className="text-xs text-[#8C8775] mt-2 font-bold italic">Sample Data</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="rounded-[32px] bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#F0EBE1] flex flex-col">
            <h3 className="font-bold text-[#3E2B21] mb-2 text-xl">Busy Hours</h3>
            <p className="text-[#8C8775] text-sm mb-6 font-medium">Heatmap of order volume by time of day.</p>
            {chartsLoading ? (
              <div className="flex-1 flex items-center justify-center min-h-[280px]">
                <CoffeeLoader size="sm" text="" />
              </div>
            ) : heatmapData.length > 0 ? (
              <div className="flex-1 min-h-[280px]">
                <ResponsiveHeatMap
                  data={heatmapData}
                  margin={{ top: 20, right: 10, bottom: 20, left: 40 }}
                  valueFormat=">-.0f"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legendPosition: 'middle',
                    legendOffset: 46
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                  }}
                  colors={{
                    type: 'sequential',
                    scheme: 'browns',
                    minValue: 0,
                    maxValue: 50
                  }}
                  emptyColor="#FDFCF7"
                  borderColor="#ffffff"
                  borderWidth={2}
                  enableLabels={false}
                />
              </div>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center min-h-[280px] text-[#A8A396] bg-[#FDFCF7] rounded-[24px] border border-dashed border-[#F0EBE1]">
                  <p className="font-bold">Not enough data for heatmap</p>
               </div>
            )}
          </div>
        </div>
      </section>

      {/* ✅ FULL WIDTH RECENT ORDERS */}
      <section className="w-full">
        <RecentOrders orders={recentOrders} loading={loading} />
      </section>
    </div>
  );
}