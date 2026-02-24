import { useEffect, useState, useMemo } from "react";
import StatCard from "../components/StatCard.jsx";
import { useSuppliers } from "../context/SupplierContext.jsx";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, } from "recharts";
import { BarChart3, Users, UserCheck, UserX, TrendingUp, Trophy, AlertTriangle, ChevronDown, Star, RefreshCw } from "lucide-react";
import API from "../../api";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#6366f1"];
const STATUS_COLORS = { Active: "#10b981", Inactive: "#94a3b8" };

function reliabilityColor(score) {
    if (score >= 7.5) return { bar: "#10b981", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    if (score >= 5.0) return { bar: "#3b82f6", badge: "bg-blue-100 text-blue-700 border-blue-200" };
    if (score >= 3.0) return { bar: "#f59e0b", badge: "bg-amber-100 text-amber-700 border-amber-200" };
    return { bar: "#ef4444", badge: "bg-red-100 text-red-700 border-red-200" };
}

function ratingLabel(score) {
    if (score >= 7.5) return "Excellent";
    if (score >= 5.0) return "Good";
    if (score >= 3.0) return "Average";
    return "Poor";
}

export default function Analytics() {
    const { suppliers } = useSuppliers();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filters & sort
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterStatus, setFilterStatus] = useState("Active");
    const [sortBy, setSortBy] = useState("name-asc");

    const load = async () => {
        try {
            const res = await API.get("/analytics");
            setAnalytics(res.data);
        } catch (err) {
            console.error("Analytics error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [suppliers]);

    /* ─── Derived categories from supplier list ─── */
    const allCategories = useMemo(() => {
        const cats = new Set();
        suppliers.forEach((s) => {
            (s.category || "").split(",").forEach((c) => { if (c.trim()) cats.add(c.trim()); });
        });
        return ["All", ...Array.from(cats).sort()];
    }, [suppliers]);

    /* ─── Filtered & sorted supplier list ─── */
    const filteredSuppliers = useMemo(() => {
        let list = [...suppliers];
        if (filterStatus !== "All") list = list.filter((s) => s.status === filterStatus);
        if (filterCategory !== "All") {
            list = list.filter((s) =>
                (s.category || "").split(",").map((c) => c.trim()).includes(filterCategory)
            );
        }
        const sortFns = {
            "reliability-desc": (a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0),
            "reliability-asc": (a, b) => (a.reliabilityScore || 0) - (b.reliabilityScore || 0),
            "lead-asc": (a, b) => (a.delivery_day || 0) - (b.delivery_day || 0),
            "lead-desc": (a, b) => (b.delivery_day || 0) - (a.delivery_day || 0),
            "late-asc": (a, b) => (a.lateDeliveries || 0) - (b.lateDeliveries || 0),
            "late-desc": (a, b) => (b.lateDeliveries || 0) - (a.lateDeliveries || 0),
            "name-asc": (a, b) => (a.companyName || "").localeCompare(b.companyName || ""),
        };
        list.sort(sortFns[sortBy] || sortFns["reliability-desc"]);
        return list;
    }, [suppliers, filterStatus, filterCategory, sortBy]);

    const bestSupplier = filteredSuppliers[0] ?? null;
    const worstSupplier = filteredSuppliers[filteredSuppliers.length - 1] ?? null;

    /* Performance chart data */
    const perfChartData = filteredSuppliers.slice(0, 20).map((s) => ({
        label: s.companyName || s.name || "—",
        value: 0,
        color: reliabilityColor(0).bar,
    }));

    /* Status */
    const statusPie = analytics
        ? [
            { label: "Active", value: analytics.active },
            { label: "Inactive", value: analytics.inactive },
        ]
        : [];


    return (
        <div className="space-y-6 pb-10">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <BarChart3 size={20} className="text-emerald-600" />
                        <h1 className="text-2xl font-extrabold text-slate-900">Analytics Dashboard</h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        Performance analysis, rankings, and AI-powered supplier insights.
                    </p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Suppliers" value={analytics?.total ?? "—"}
                    icon={<Users size={16} />} color="slate" subtitle="All records" />
                <StatCard title="Active Suppliers" value={analytics?.active ?? "—"}
                    icon={<UserCheck size={16} />} color="emerald" subtitle="Currently operating" />
                <StatCard title="Inactive Suppliers" value={analytics?.inactive ?? "—"}
                    icon={<UserX size={16} />} color="red" subtitle="Paused / deactivated" />
                <StatCard title="Avg. On-Time Rate" value={analytics?.avg_on_time_rate ? `${analytics.avg_on_time_rate}%` : "—"}
                    icon={<TrendingUp size={16} />} color="blue" subtitle="Active suppliers" />
            </div>

            {/* ── Best & Worst Supplier ── */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Best Supplier */}
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
                            <Trophy size={16} className="text-emerald-600" />
                        </span>
                        <div>
                            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Best Supplier</div>
                            <div className="text-xs text-slate-400">Highest reliability score</div>
                        </div>
                    </div>
                    {bestSupplier ? (
                        <div>
                            <div className="text-lg font-extrabold text-slate-900 truncate">{bestSupplier.companyName}</div>
                            {bestSupplier.name && <div className="text-xs text-slate-500 truncate">{bestSupplier.name}</div>}
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${reliabilityColor(0).badge}`}>
                                    AI Score: 0.0 / 10
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600">
                                    {ratingLabel(0)}
                                </span>
                                {bestSupplier.category && (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                                        {bestSupplier.category.split(",")[0].trim()}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                                    <div className="text-slate-400">Delivery Day</div>
                                    <div className="font-bold text-slate-800">{bestSupplier.delivery_day ?? "—"} days</div>
                                </div>
                                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                                    <div className="text-slate-400">Late Deliveries</div>
                                    <div className="font-bold text-slate-800">{bestSupplier.lateDeliveries ?? "—"}</div>
                                </div>
                            </div>
                        </div>
                    ) : <EmptyMsg />}
                </div>

                {/* Worst Supplier */}
                <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100">
                            <AlertTriangle size={16} className="text-red-500" />
                        </span>
                        <div>
                            <div className="text-xs font-semibold text-red-600 uppercase tracking-wide">Needs Attention</div>
                            <div className="text-xs text-slate-400">Lowest reliability score</div>
                        </div>
                    </div>
                    {worstSupplier && worstSupplier !== bestSupplier ? (
                        <div>
                            <div className="text-lg font-extrabold text-slate-900 truncate">{worstSupplier.companyName}</div>
                            {worstSupplier.name && <div className="text-xs text-slate-500 truncate">{worstSupplier.name}</div>}
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${reliabilityColor(0).badge}`}>
                                    AI Score: 0.0 / 10
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600">
                                    {ratingLabel(0)}
                                </span>
                                {worstSupplier.category && (
                                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                                        {worstSupplier.category.split(",")[0].trim()}
                                    </span>
                                )}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                                    <div className="text-slate-400">Delivery Day</div>
                                    <div className="font-bold text-slate-800">{worstSupplier.delivery_day ?? "—"} days</div>
                                </div>
                                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">
                                    <div className="text-slate-400">Late Deliveries</div>
                                    <div className="font-bold text-slate-800">{worstSupplier.lateDeliveries ?? "—"}</div>
                                </div>
                            </div>
                        </div>
                    ) : <EmptyMsg />}
                </div>
            </div>

            {/* ── Filter & Sort Controls ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-bold text-slate-700 mr-1">Filter & Sort</span>

                    {/* Status */}
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Category */}
                    <div className="relative">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                            {allCategories.map((c) => (
                                <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-8 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                            <option value="reliability-desc">AI Score ↓ (Best first)</option>
                            <option value="reliability-asc">AI Score ↑ (Worst first)</option>
                            <option value="lead-asc">Delivery Day ↑</option>
                            <option value="lead-desc">Delivery Day ↓</option>
                            <option value="late-asc">Late Deliveries ↑</option>
                            <option value="late-desc">Late Deliveries ↓</option>
                            <option value="name-asc">Name A→Z</option>
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <span className="ml-auto text-xs text-slate-400">{filteredSuppliers.length} suppliers shown</span>
                </div>
            </div>

            {/* ── Supplier Performance Chart ── */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <Star size={16} className="text-amber-500" />
                    <div className="font-bold text-slate-900">Supplier Performance Chart</div>
                    <span className="ml-auto text-xs text-slate-400">AI Reliability Score (0–10)</span>
                </div>
                {perfChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(220, perfChartData.length * 36)}>
                        <BarChart data={perfChartData} layout="vertical" barSize={18} margin={{ left: 8, right: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                            <YAxis dataKey="label" type="category" width={130} tick={{ fontSize: 11 }} />
                            <Tooltip
                                formatter={(v) => [`${v} / 10`, "AI Reliability Score"]}
                                labelFormatter={(l) => l}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                {perfChartData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyChart />
                )}
                {/* Legend */}
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    {[["#10b981", "Excellent (≥7.5)"], ["#3b82f6", "Good (5–7.5)"], ["#f59e0b", "Average (3–5)"], ["#ef4444", "Poor (<3)"]].map(([color, label]) => (
                        <span key={label} className="flex items-center gap-1">
                            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Top 5 vs Bottom 5 Charts ── */}
            <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="🏆 Top 5 Best Suppliers" subtitle="By AI reliability score">
                    {analytics?.top5?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={analytics.top5.map(d => ({ ...d, value: 0 }))} layout="vertical" barSize={16}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={() => ["N/A", "AI Score (not connected)"]} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                <ChartCard title="⚠️ Bottom 5 Suppliers" subtitle="Needs attention">
                    {analytics?.bottom5?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={analytics.bottom5.map(d => ({ ...d, value: 0 }))} layout="vertical" barSize={16}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                                <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={() => ["N/A", "AI Score (not connected)"]} />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#f59e0b" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>
            </div>

            {/* ── Category + Status Charts ── */}
            <div className="grid gap-6 lg:grid-cols-2">
                <ChartCard title="Suppliers by Category" subtitle="Count per grocery category">
                    {analytics?.category_chart?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={analytics.category_chart} barSize={24}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => [v, "Suppliers"]} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {analytics.category_chart.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>

                <ChartCard title="Active vs. Inactive" subtitle="Status breakdown">
                    {statusPie.some((d) => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={statusPie}
                                    dataKey="value"
                                    nameKey="label"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    innerRadius={40}
                                    label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {statusPie.map((entry) => (
                                        <Cell key={entry.label} fill={STATUS_COLORS[entry.label]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <EmptyChart />}
                </ChartCard>
            </div>

        </div>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <div className="font-bold text-slate-900">{title}</div>
                {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
            </div>
            {children}
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

function EmptyMsg() {
    return <div className="mt-3 text-sm text-slate-400">No suppliers match the current filter.</div>;
}