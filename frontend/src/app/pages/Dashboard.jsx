import { useEffect, useState } from "react";
import StatCard from "../components/StatCard.jsx";
import { useSuppliers } from "../context/SupplierContext.jsx";
import { Link } from "react-router-dom";
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend,
} from "recharts";
import {
    LayoutDashboard, Users, UserCheck, UserX, Clock, Star, TrendingUp,
} from "lucide-react";
import API from "../../api";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#6366f1"];

export default function Dashboard() {
    const { suppliers } = useSuppliers();
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        API.get("/analytics").then((r) => setAnalytics(r.data)).catch(() => { });
    }, [suppliers]);

    const active = suppliers.filter((s) => s.status === "Active");
    const inactive = suppliers.filter((s) => s.status === "Inactive");

    const sorted = [...active].sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    const avgDeliveryDay = analytics?.avg_lead_time ?? 0;
    const categoryData = analytics?.category_chart ?? [];
    const importanceData = analytics?.chart ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-emerald-600" />
                        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Supplier overview and performance summary.</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/suppliers" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors">
                        Manage Suppliers
                    </Link>
                    <Link to="/analytics" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors">
                        Full Analytics
                    </Link>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Suppliers"
                    value={suppliers.length}
                    subtitle="All records"
                    icon={<Users size={18} />}
                    color="slate"
                />
                <StatCard
                    title="Active Suppliers"
                    value={active.length}
                    subtitle="Currently operating"
                    icon={<UserCheck size={18} />}
                    color="emerald"
                />
                <StatCard
                    title="Inactive Suppliers"
                    value={inactive.length}
                    subtitle="Soft deleted / paused"
                    icon={<UserX size={18} />}
                    color="red"
                />
                <StatCard
                    title="Avg. Delivery Day"
                    value={avgDeliveryDay ? `${avgDeliveryDay}d` : "—"}
                    subtitle="Active suppliers"
                    icon={<Clock size={18} />}
                    color="blue"
                />
            </div>

            {/* Charts row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Category Bar Chart */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600" />
                        <div className="font-bold text-slate-900">Suppliers by Category</div>
                    </div>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={categoryData} barSize={28}>
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => [v, "Suppliers"]} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {categoryData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart />
                    )}
                </div>

                {/* Importance Pie Chart */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <Star size={16} className="text-amber-500" />
                        <div className="font-bold text-slate-900">Suppliers by Importance Level</div>
                    </div>
                    {importanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={importanceData}
                                    dataKey="value"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    innerRadius={40}
                                    label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {importanceData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyChart />
                    )}
                </div>
            </div>

            {/* Best / Worst */}
            <div className="grid gap-4 md:grid-cols-2">
                <SupplierHighlight label="Top Performer" supplier={best} color="emerald" />
                <SupplierHighlight label="Needs Attention" supplier={worst} color="red" />
            </div>
        </div>
    );
}

function SupplierHighlight({ label, supplier, color }) {
    const border = color === "emerald" ? "border-emerald-100" : "border-red-100";
    const from = color === "emerald" ? "from-emerald-50" : "from-red-50";
    const badge = color === "emerald"

        ? "bg-emerald-100 text-emerald-700"
        : "bg-red-100 text-red-700";

    return (
        <div className={`rounded-2xl border ${border} bg-gradient-to-br ${from} to-white p-5 shadow-sm`}>
            <div className="text-xs font-semibold text-slate-500 mb-2">{label}</div>
            {supplier ? (
                <>
                    <div className="text-base font-extrabold text-slate-900 truncate">{supplier.companyName}</div>
                    {supplier.name && <div className="text-xs text-slate-500 mt-0.5 truncate">{supplier.name}</div>}
                    <div className="mt-3 flex items-center gap-2">
                        {supplier.category && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {supplier.category.split(",")[0].trim()}
                            </span>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-sm text-slate-400 mt-2">No data yet</div>
            )}
        </div>
    );
}

function EmptyChart() {
    return (
        <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
            No data yet — add some suppliers first.
        </div>
    );
}
