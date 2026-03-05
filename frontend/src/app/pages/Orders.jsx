import { useState, useEffect, useCallback } from "react";
import {
    ShoppingCart, Plus, Trash2, ChevronDown, CheckCircle2,
    Clock, XCircle, Truck, Package, FileText, TrendingUp
} from "lucide-react";
import API from "../../api";
import { useToast } from "../context/ToastContext.jsx";
import { useSuppliers } from "../context/SupplierContext.jsx";
import CreateOrderModal from "../components/CreateOrderModal.jsx";

const STATUS_CONFIG = {
    Pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock size={12} /> },
    Approved: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={12} /> },
    Shipped: { color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: <Truck size={12} /> },
    Delivered: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle2 size={12} /> },
    Cancelled: { color: "bg-red-50 text-red-700 border-red-200", icon: <XCircle size={12} /> },
};
const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? { color: "bg-slate-50 text-slate-500 border-slate-200", icon: null };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.color}`}>
            {cfg.icon} {status}
        </span>
    );
}

function StatCard({ icon, label, value, sub, color = "blue" }) {
    const colors = {
        blue: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        emerald: "bg-emerald-50 text-emerald-600",
        slate: "bg-slate-100 text-slate-600",
        red: "bg-red-50 text-red-600",
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

export default function Orders() {
    const { suppliers } = useSuppliers();
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("All");
    const [updatingId, setUpdatingId] = useState(null);

    const fetchOrders = useCallback(async () => {
        try {
            const res = await API.get("/orders");
            setOrders(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingId(orderId);
        try {
            await API.patch(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            toast.success("Updated", `Order status changed to ${newStatus}.`);
        } catch {
            toast.error("Error", "Could not update order status.");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (orderId) => {
        if (!confirm("Delete this purchase order?")) return;
        try {
            await API.delete(`/orders/${orderId}`);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            toast.success("Deleted", "Order removed.");
        } catch {
            toast.error("Error", "Could not delete order.");
        }
    };

    // Stats
    const totalOrders = orders.length;
    const pending = orders.filter(o => o.status === "Pending").length;
    const delivered = orders.filter(o => o.status === "Delivered").length;
    const totalSpend = orders.reduce((s, o) => s + (o.total_amount || 0), 0);

    const filtered = statusFilter === "All" ? orders : orders.filter(o => o.status === statusFilter);

    // Helper: get supplier name from id (may already be in order data)
    const supplierName = (order) => {
        if (order.supplier?.companyName) return order.supplier.companyName;
        const s = suppliers.find(s => s.id === order.supplier_id);
        return s?.companyName || `Supplier #${order.supplier_id}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={20} className="text-emerald-600" />
                                <h1 className="text-2xl font-extrabold text-slate-900">Purchase Orders</h1>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                Create and manage supplier purchase orders with real-time status tracking.
                            </p>
                        </div>
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                            <Plus size={16} /> Create PO
                        </button>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<FileText size={20} />} label="Total Orders" value={totalOrders} color="slate" />
                <StatCard icon={<Clock size={20} />} label="Pending" value={pending} sub="Awaiting approval" color="amber" />
                <StatCard icon={<CheckCircle2 size={20} />} label="Delivered" value={delivered} sub="Completed" color="emerald" />
                <StatCard
                    icon={<TrendingUp size={20} />}
                    label="Total Spend"
                    value={`LKR ${totalSpend.toLocaleString("en-LK", { maximumFractionDigits: 0 })}`}
                    color="blue"
                />
            </div>

            {/* Filter + Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3">
                    {["All", ...STATUS_OPTIONS].map(s => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${statusFilter === s
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                    <span className="ml-auto text-xs text-slate-400">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
                </div>

                {loading ? (
                    <div className="py-16 text-center text-sm text-slate-400">Loading orders…</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <ShoppingCart size={36} className="mx-auto text-slate-200 mb-3" />
                        <div className="text-sm font-semibold text-slate-500">No orders found.</div>
                        {statusFilter === "All" && (
                            <button
                                onClick={() => setCreateOpen(true)}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                            >
                                <Plus size={15} /> Create your first PO
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs text-slate-500 font-bold">
                                    <th className="px-5 py-3">PO Number</th>
                                    <th className="px-3 py-3">Supplier</th>
                                    <th className="px-3 py-3">Order Date</th>
                                    <th className="px-3 py-3">Exp. Delivery</th>
                                    <th className="px-3 py-3">Items</th>
                                    <th className="px-3 py-3">Total (LKR)</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3 font-mono text-xs font-bold text-emerald-700">{order.order_number}</td>
                                        <td className="px-3 py-3">
                                            <div className="font-semibold text-slate-800 truncate max-w-[140px]">{supplierName(order)}</div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-600">{order.order_date}</td>
                                        <td className="px-3 py-3 text-slate-500">{order.expected_delivery_date || "—"}</td>
                                        <td className="px-3 py-3">
                                            <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                                <Package size={11} /> {order.items?.length ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 font-semibold text-slate-800">
                                            {(order.total_amount || 0).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="relative inline-flex items-center">
                                                <StatusBadge status={order.status} />
                                                <select
                                                    value={order.status}
                                                    disabled={updatingId === order.id}
                                                    onChange={e => handleStatusChange(order.id, e.target.value)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CreateOrderModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={fetchOrders}
            />
        </div>
    );
}

