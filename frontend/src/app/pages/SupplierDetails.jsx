import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Tag, Clock, CreditCard, ShieldCheck, Calendar } from "lucide-react";
import { useSuppliers } from "../context/SupplierContext.jsx";
import AIPanel from "../components/AIPanel.jsx";
import { useState } from "react";
import SupplierFormModal from "../components/SupplierFormModal.jsx";
import { useToast } from "../context/ToastContext.jsx";

function CategoryChips({ category }) {
    if (!category) return <span className="text-slate-400">—</span>;
    const cats = category.split(",").map((c) => c.trim()).filter(Boolean);
    return (
        <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
                <span key={c} className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {c}
                </span>
            ))}
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 mt-0.5">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-500">{label}</div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900 break-words">{value || "—"}</div>
            </div>
        </div>
    );
}

function ScoreBar({ label, value, max = 100, color = "emerald" }) {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    const cls = { emerald: "bg-emerald-500", blue: "bg-blue-500", amber: "bg-amber-500", red: "bg-red-500" };
    return (
        <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>{label}</span>
                <span className="font-semibold">{value} / {max}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${cls[color]}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export default function SupplierDetails() {
    const { id } = useParams();
    const { getSupplierById, updateSupplier } = useSuppliers();
    const toast = useToast();
    const supplier = getSupplierById(id);

    const [editOpen, setEditOpen] = useState(false);

    const handleUpdate = async (data) => {
        try {
            await updateSupplier({ ...data, id: supplier.id });
            toast.success("Supplier Updated", "Changes saved successfully.");
            setEditOpen(false);
        } catch {
            toast.error("Error", "Failed to update supplier.");
        }
    };

    const initials = (supplier?.companyName || "??").slice(0, 2).toUpperCase();
    const statusColor = supplier?.status === "Active"
        ? "bg-emerald-100 text-emerald-700"
        : "bg-slate-100 text-slate-600";

    const priorityColor = {
        Critical: "bg-red-100 text-red-700 border-red-200",
        Preferred: "bg-blue-100 text-blue-700 border-blue-200",
        Normal: "bg-slate-100 text-slate-600 border-slate-200",
    }[supplier?.importanceLevel || "Normal"];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Link to="/suppliers"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                    <ArrowLeft size={16} /> Back to Suppliers
                </Link>
                {supplier && (
                    <button
                        onClick={() => setEditOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                        <Pencil size={14} /> Edit Supplier
                    </button>
                )}
            </div>

            {!supplier ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="text-3xl mb-3">🔍</div>
                    <div className="text-slate-600 font-semibold">Supplier not found.</div>
                    <Link to="/suppliers" className="mt-3 inline-block text-sm text-emerald-600 hover:underline">
                        Return to supplier list
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left panel – profile + details */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* Profile card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-2xl font-extrabold text-white shadow-md">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-xl font-extrabold text-slate-900 truncate">
                                            {supplier.companyName}
                                        </h1>
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusColor}`}>
                                            {supplier.status}
                                        </span>
                                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityColor}`}>
                                            {supplier.importanceLevel || "Normal"}
                                        </span>
                                    </div>
                                    {supplier.name && (
                                        <div className="mt-0.5 text-sm text-slate-500">{supplier.name}</div>
                                    )}
                                    <div className="mt-2 font-mono text-xs text-slate-400">{supplier.supplierCode || "—"}</div>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="mt-5">
                                <div className="text-xs font-semibold text-slate-500 mb-2">Categories</div>
                                <CategoryChips category={supplier.category} />
                            </div>
                        </div>

                        {/* Contact & logistics */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="text-sm font-bold text-slate-900 mb-3">Contact & Logistics</div>
                            <InfoRow icon={<Mail size={13} />} label="Email" value={supplier.email} />
                            <InfoRow icon={<Phone size={13} />} label="Phone" value={supplier.phone} />
                            <InfoRow icon={<MapPin size={13} />} label="Address" value={supplier.address} />
                            <InfoRow icon={<Tag size={13} />} label="Contact Person" value={supplier.contactPerson} />
                            <InfoRow icon={<Clock size={13} />} label="Delivery Day" value={supplier.delivery_day ? `${supplier.delivery_day} days` : null} />
                            <InfoRow icon={<CreditCard size={13} />} label="Payment Terms" value={supplier.paymentTerms} />
                        </div>

                        {/* Performance */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="text-sm font-bold text-slate-900 mb-4">Performance Metrics</div>
                            <div className="grid grid-cols-2 gap-3">
                                <Metric label="Total Orders" value={supplier.totalOrders ?? 0} />
                                <Metric label="Late Deliveries" value={supplier.lateDeliveries ?? 0} />
                            </div>
                        </div>

                        {/* Audit info */}
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                                <ShieldCheck size={13} /> Audit Information
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <div className="text-slate-400 flex items-center gap-1">
                                        <Calendar size={11} /> Created At
                                    </div>
                                    <div className="mt-0.5 font-semibold text-slate-700">
                                        {supplier.created_at ? new Date(supplier.created_at).toLocaleDateString() : "—"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 flex items-center gap-1">
                                        <Calendar size={11} /> Last Updated
                                    </div>
                                    <div className="mt-0.5 font-semibold text-slate-700">
                                        {supplier.updated_at ? new Date(supplier.updated_at).toLocaleDateString() : "—"}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <div className="text-slate-400">Updated By</div>
                                    <div className="mt-0.5 font-semibold text-slate-700">{supplier.updated_by || "—"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right panel – AI */}
                    <div>
                        <AIPanel supplierId={supplier.id} score={supplier.reliabilityScore || 0} supplierData={supplier} />
                    </div>
                </div>
            )}

            <SupplierFormModal
                open={editOpen}
                mode="edit"
                initial={supplier}
                onClose={() => setEditOpen(false)}
                onSubmit={handleUpdate}
            />
        </div>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <div className="text-xl font-extrabold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
        </div>
    );
}