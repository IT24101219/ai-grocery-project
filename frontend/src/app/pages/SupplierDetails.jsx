import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft, Pencil, Mail, Phone, MapPin, Tag, Clock,
    CreditCard
} from "lucide-react";
import { useSuppliers } from "../context/SupplierContext.jsx";
import { useState } from "react";
import SupplierFormModal from "../components/SupplierFormModal.jsx";
import SupplierDeliverySection from "../components/SupplierDeliverySection.jsx";
import { useToast } from "../context/ToastContext.jsx";

function CategoryChips({ categories }) {
    if (!categories || categories.length === 0) return <span className="text-slate-400 text-sm italic">—</span>;
    return (
        <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
                <span key={c} className="rounded-xl bg-white/60 backdrop-blur-sm border border-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition-transform hover:scale-105">
                    {c}
                </span>
            ))}
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div className="group flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 hover:bg-slate-50 border border-transparent hover:border-slate-100">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100 group-hover:scale-105 transition-all duration-300">
                {icon}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
                <div className="mt-1 text-[15px] font-semibold text-slate-800 break-words">{value || <span className="text-slate-300 font-medium italic">Not provided</span>}</div>
            </div>
        </div>
    );
}


export default function SupplierDetails() {
    const { id } = useParams();
    const { getSupplierById, updateSupplier, loadSuppliers } = useSuppliers();
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

    if (!supplier) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-5 animate-in fade-in duration-500">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-50 border-[10px] border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    <span className="text-5xl drop-shadow-md">🔍</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Supplier Not Found</h2>
                <p className="text-slate-500 max-w-sm text-center font-medium">The supplier you're looking for doesn't exist or has been removed from the system.</p>
                <Link to="/suppliers" className="mt-4 rounded-xl bg-emerald-600 px-8 py-3.5 font-bold text-white hover:bg-emerald-700 transition-all duration-300">
                    Return to Directory
                </Link>
            </div>
        );
    }

    const initials = (supplier.companyName || "??").slice(0, 2).toUpperCase();

    // Status Badge Logic
    const isStatusActive = supplier.status === "Active";
    const statusColor = isStatusActive
        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
        : "bg-slate-100/80 text-slate-700 border-slate-200";

    // Priority Badge Logic
    const priorityColor = {
        "Important Supplier": "bg-rose-100/80 text-rose-800 border-rose-200/80 shadow-[0_0_15px_-3px_rgba(225,29,72,0.3)]",
        "Trusted Supplier": "bg-cyan-100/80 text-cyan-800 border-cyan-200/80 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]",
        "Regular Supplier": "bg-slate-100/80 text-slate-700 border-slate-200/80",
    }[supplier.importanceLevel || "Regular Supplier"];

    return (
        <div className="mx-auto max-w-[1400px] space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            {/* Header / Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link to="/suppliers" className="group inline-flex w-fit items-center gap-2.5 rounded-xl bg-white/80 backdrop-blur-md px-5 py-3 text-sm font-bold text-slate-600 shadow-sm border border-slate-200/60 hover:text-emerald-700 hover:border-emerald-300 hover:shadow-md transition-all duration-300">
                    <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
                    Back to Directory
                </Link>
                <button
                    onClick={() => setEditOpen(true)}
                    className="inline-flex w-fit items-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 transition-all duration-300"
                >
                    <Pencil size={16} className="text-emerald-100" />
                    Edit Profile
                </button>
            </div>

            {/* Main Header Card - The "Wow" element */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-emerald-50 p-8 sm:p-12 shadow-sm">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 lg:gap-10 items-start md:items-center">
                    {/* Giant Avatar */}
                    <div className="relative group">
                        <div className="flex h-36 w-36 lg:h-40 lg:w-40 flex-shrink-0 items-center justify-center rounded-[2rem] bg-emerald-600 text-5xl font-black text-white group-hover:rotate-0 -rotate-3 transition-transform duration-500 ease-out border-4 border-white">
                            {initials}
                        </div>
                    </div>

                    <div className="flex-1 space-y-5">
                        <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-900 drop-shadow-sm">
                                {supplier.companyName}
                            </h1>
                            <div className="flex gap-2.5 ml-1 mt-2 sm:mt-0">
                                <span className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${statusColor} shadow-sm backdrop-blur-sm`}>
                                    <span className={`relative flex h-2.5 w-2.5`}>
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStatusActive ? 'bg-emerald-400' : 'hidden'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isStatusActive ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                                    </span>
                                    {supplier.status}
                                </span>
                                <span className={`rounded-xl border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${priorityColor} backdrop-blur-sm`}>
                                    {supplier.importanceLevel || "Regular Supplier"}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-slate-500 font-semibold text-lg">
                            {supplier.name && (
                                <div className="flex items-center gap-2.5">
                                    <Tag size={20} className="text-emerald-500/70" />
                                    {supplier.name}
                                </div>
                            )}
                            {supplier.supplierCode && (
                                <div className="flex items-center gap-2.5">
                                    <div className="rounded-lg bg-white px-3 py-1 font-mono text-sm font-bold text-slate-600 border border-slate-200 shadow-sm">
                                        ID: {supplier.supplierCode}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-2">
                            <CategoryChips categories={supplier.categories} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Contact & Logistics Detailed Card */}
                <div className="lg:col-span-12 rounded-[2.5rem] border border-slate-200 bg-white p-8 lg:p-10 shadow-sm h-fit relative overflow-hidden">
                    <div className="mb-8 flex items-center gap-4">
                        <div className="rounded-2xl bg-emerald-600 p-3.5 text-white shadow-sm">
                            <MapPin size={22} className="opacity-90" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Contact & Logistics</h2>
                            <p className="text-sm font-semibold text-slate-500 mt-0.5">Primary supplier details</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <InfoRow icon={<Mail size={22} strokeWidth={2.5} />} label="Email Address" value={supplier.email} />
                        <InfoRow icon={<Phone size={22} strokeWidth={2.5} />} label="Phone Number" value={supplier.phone} />
                        <InfoRow icon={<MapPin size={22} strokeWidth={2.5} />} label="Physical Address" value={supplier.address} />
                        <div className="my-4 border-t border-slate-100"></div>
                        <InfoRow icon={<Tag size={22} strokeWidth={2.5} />} label="Contact Person" value={supplier.contactPerson} />

                        <InfoRow icon={<CreditCard size={22} strokeWidth={2.5} />} label="Payment Terms" value={supplier.paymentTerms} />
                    </div>
                </div>

                {/* Deliveries Section */}
                <div className="lg:col-span-12 rounded-[2.5rem] border border-slate-200 bg-white p-6 lg:p-10 shadow-sm overflow-hidden flex flex-col">
                    <SupplierDeliverySection
                        supplierId={supplier.id}
                        onDeliveriesChanged={() => loadSuppliers()}
                    />
                </div>
            </div>

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