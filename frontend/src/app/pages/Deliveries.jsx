import { useState, useEffect, useCallback } from "react";
import {
    Truck, Plus, Edit2, Trash2, CheckCircle2, XCircle,
    Clock, AlertTriangle, TrendingUp, Calendar
} from "lucide-react";
import API from "../../api";
import { useToast } from "../context/ToastContext.jsx";
import { useSuppliers } from "../context/SupplierContext.jsx";

// Helpers
function varianceBadge(variance, deliveryDate) {
    if (!deliveryDate) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                <Clock size={11} /> Pending
            </span>
        );
    }
    if (variance === 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={11} /> On Time
            </span>
        );
    }
    if (variance > 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
                <XCircle size={11} /> {variance}d Late
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            <TrendingUp size={11} /> {Math.abs(variance)}d Early
        </span>
    );
}



function StatCard({ icon, label, value, sub, color = "slate" }) {
    const colors = {
        slate: "bg-slate-100 text-slate-600",
        emerald: "bg-emerald-50 text-emerald-600",
        red: "bg-red-50 text-red-600",
        amber: "bg-amber-50 text-amber-600",
        blue: "bg-blue-50 text-blue-600",
    };
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4">
            <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${colors[color]}`}>
                {icon}
            </div>
            <div>
                <div className="text-xl font-extrabold text-slate-900">{value}</div>
                <div className="text-xs font-semibold text-slate-500">{label}</div>
                {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}

// ── Add/Edit Modal ───────────────────────────────────────────────────────────
function DeliveryModal({ open, mode, initial, suppliers, onClose, onSave }) {
    const defaultForm = { supplier_id: "", order_id: "", expected_date: "", delivery_date: "", delivered_on_time: true, rating: "" };
    const [form, setForm] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) setForm(initial ? {
            ...initial,
            supplier_id: initial.supplier_id || "",
            order_id: initial.order_id || "",
            delivery_date: initial.delivery_date || "",
            rating: initial.rating || "",
        } : defaultForm);
    }, [open, initial]);

    if (!open) return null;

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    // Auto-set on_time when actual date is entered
    const handleActualDate = (val) => {
        set("delivery_date", val);
        if (val && form.expected_date) {
            set("delivered_on_time", val <= form.expected_date);
        }
    };

    const submit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                supplier_id: parseInt(form.supplier_id),
                order_id: form.order_id ? parseInt(form.order_id) : null,
                expected_date: form.expected_date,
                delivery_date: form.delivery_date || null,
                delivered_on_time: form.delivered_on_time,
                rating: form.rating ? parseFloat(form.rating) : null,
            };
            await onSave(payload, initial?.id);
            onClose();
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const canSubmit = form.supplier_id && form.expected_date;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Truck size={17} className="text-emerald-600" />
                        <h2 className="font-extrabold text-slate-900">{mode === "create" ? "Log Delivery" : "Edit Delivery"}</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Supplier *</label>
                        <select
                            value={form.supplier_id}
                            onChange={e => set("supplier_id", e.target.value)}
                            disabled={mode === "edit"}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50"
                        >
                            <option value="">— Select Supplier —</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Date *</label>
                            <input type="date" value={form.expected_date}
                                onChange={e => set("expected_date", e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Actual Date</label>
                            <input type="date" value={form.delivery_date}
                                onChange={e => handleActualDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                    </div>

                    {form.delivery_date && form.expected_date && (
                        <div className={`rounded-xl px-3 py-2 text-sm font-semibold ${form.delivery_date <= form.expected_date ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {form.delivery_date <= form.expected_date
                                ? `✓ On time${form.delivery_date < form.expected_date ? ` (${Math.abs((new Date(form.expected_date) - new Date(form.delivery_date)) / 86400000)} days early)` : ""}`
                                : `✗ Late by ${Math.abs(Math.round((new Date(form.delivery_date) - new Date(form.expected_date)) / 86400000))} day(s)`
                            }
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Linked Order ID</label>
                        <input type="number" value={form.order_id}
                            onChange={e => set("order_id", e.target.value)}
                            placeholder="Optional"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>

                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={form.delivered_on_time}
                            onChange={e => set("delivered_on_time", e.target.checked)}
                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500" />
                        Mark as Delivered On Time
                    </label>
                </div>

                <div className="flex justify-end gap-3 border-t px-6 py-4">
                    <button onClick={onClose} className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                    <button onClick={submit} disabled={submitting || !canSubmit}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                        <Truck size={14} /> {submitting ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Deliveries() {
    const { suppliers } = useSuppliers();
    const toast = useToast();
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, mode: "create", data: null });
    const [filter, setFilter] = useState("All");

    const fetchDeliveries = useCallback(async () => {
        try {
            const res = await API.get("/deliveries");
            setDeliveries(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

    const handleSave = async (payload, id) => {
        try {
            if (id) {
                await API.put(`/deliveries/${id}`, payload);
                toast.success("Updated", "Delivery record updated.");
            } else {
                await API.post("/deliveries", payload);
                toast.success("Logged", "Delivery recorded successfully.");
            }
            fetchDeliveries();
        } catch (e) {
            toast.error("Error", "Could not save delivery.");
            throw e;
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this delivery record?")) return;
        try {
            await API.delete(`/deliveries/${id}`);
            toast.success("Deleted", "Delivery removed.");
            setDeliveries(prev => prev.filter(d => d.id !== id));
        } catch {
            toast.error("Error", "Could not delete delivery.");
        }
    };

    // Stats
    const total = deliveries.length;
    const onTime = deliveries.filter(d => d.delivery_date && d.days_variance <= 0).length;
    const late = deliveries.filter(d => d.delivery_date && d.days_variance > 0).length;
    const pending = deliveries.filter(d => !d.delivery_date).length;
    const avgVariance = deliveries.filter(d => d.days_variance !== null && d.days_variance !== undefined)
        .reduce((s, d, _, arr) => s + d.days_variance / arr.length, 0);

    // Filter
    const FILTERS = ["All", "On Time", "Late", "Pending"];
    const filtered = deliveries.filter(d => {
        if (filter === "On Time") return d.delivery_date && d.days_variance <= 0;
        if (filter === "Late") return d.delivery_date && d.days_variance > 0;
        if (filter === "Pending") return !d.delivery_date;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Truck size={20} className="text-emerald-600" />
                            <h1 className="text-2xl font-extrabold text-slate-900">Delivery Tracking</h1>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">Track expected vs actual delivery dates and supplier punctuality.</p>
                    </div>
                    <button
                        onClick={() => setModal({ open: true, mode: "create", data: null })}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                        <Plus size={16} /> Log Delivery
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<Truck size={20} />} label="Total Deliveries" value={total} color="slate" />
                <StatCard icon={<CheckCircle2 size={20} />} label="On Time" value={onTime} sub={total ? `${Math.round(onTime / total * 100)}%` : "—"} color="emerald" />
                <StatCard icon={<XCircle size={20} />} label="Late" value={late} sub={total ? `${Math.round(late / total * 100)}%` : "—"} color="red" />
                <StatCard icon={<Clock size={20} />} label="Avg. Variance"
                    value={isNaN(avgVariance) ? "—" : `${avgVariance > 0 ? "+" : ""}${avgVariance.toFixed(1)}d`}
                    sub={avgVariance > 0 ? "avg days late" : avgVariance < 0 ? "avg days early" : "perfectly on time"}
                    color={avgVariance > 0 ? "red" : "emerald"} />
            </div>

            {/* Formula Legend */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4">
                <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center gap-2">
                    <TrendingUp size={13} /> Reliability Score Formula (0–10)
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-emerald-700 font-medium">
                    <span className="bg-white border border-emerald-200 rounded-lg px-3 py-1">6 × On-Time Rate</span>
                    <span className="text-emerald-500 self-center">+</span>
                    <span className="bg-white border border-emerald-200 rounded-lg px-3 py-1">2 × Volume Factor (cap 20)</span>
                    <span className="text-emerald-500 self-center">−</span>
                    <span className="bg-white border border-emerald-200 rounded-lg px-3 py-1">2 × Late Ratio</span>
                    <span className="ml-auto text-emerald-600 self-center">≥8 Excellent · 6–8 Good · 4–6 Average · &lt;4 Poor</span>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${filter === f ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                            {f}
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-slate-400">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-sm text-slate-400">Loading deliveries…</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <Truck size={36} className="mx-auto text-slate-200 mb-3" />
                        <div className="text-sm font-semibold text-slate-500">No deliveries found.</div>
                        {filter === "All" && (
                            <button onClick={() => setModal({ open: true, mode: "create", data: null })}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
                                <Plus size={15} /> Log your first delivery
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs text-slate-500 font-bold">
                                    <th className="px-5 py-3">Supplier</th>
                                    <th className="px-3 py-3">Order</th>
                                    <th className="px-3 py-3">
                                        <span className="flex items-center gap-1"><Calendar size={12} />Expected Date</span>
                                    </th>
                                    <th className="px-3 py-3">
                                        <span className="flex items-center gap-1"><Calendar size={12} />Actual Date</span>
                                    </th>
                                    <th className="px-3 py-3">Variance</th>
                                    <th className="px-3 py-3">Score</th>
                                    <th className="px-3 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(d => (
                                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="font-semibold text-slate-800 max-w-[140px] truncate">{d.supplier_name}</div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-500 font-mono text-xs">{d.order_id ? `#${d.order_id}` : "—"}</td>
                                        <td className="px-3 py-3 text-slate-700 font-medium">{d.expected_date || "—"}</td>
                                        <td className={`px-3 py-3 font-medium ${d.delivery_date ? (d.days_variance > 0 ? "text-red-600" : "text-emerald-600") : "text-slate-400"}`}>
                                            {d.delivery_date || "Awaiting…"}
                                        </td>
                                        <td className="px-3 py-3">
                                            {varianceBadge(d.days_variance, d.delivery_date)}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-sm font-extrabold ${d.supplier_score >= 8 ? "text-emerald-600" :
                                                    d.supplier_score >= 6 ? "text-blue-600" :
                                                        d.supplier_score >= 4 ? "text-amber-600" : "text-red-500"
                                                    }`}>{d.supplier_score ?? "—"}</span>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.supplier_tier === "Excellent" ? "bg-emerald-50 text-emerald-700" :
                                                    d.supplier_tier === "Good" ? "bg-blue-50 text-blue-700" :
                                                        d.supplier_tier === "Average" ? "bg-amber-50 text-amber-700" :
                                                            "bg-red-50 text-red-700"
                                                    }`}>{d.supplier_tier}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button onClick={() => setModal({ open: true, mode: "edit", data: d })}
                                                    className="text-slate-300 hover:text-emerald-600 transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(d.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <DeliveryModal
                open={modal.open}
                mode={modal.mode}
                initial={modal.data}
                suppliers={suppliers}
                onClose={() => setModal(p => ({ ...p, open: false }))}
                onSave={handleSave}
            />
        </div>
    );
}
