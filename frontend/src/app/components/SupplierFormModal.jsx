import { useEffect, useMemo, useState } from "react";
import { X, CheckSquare, Square } from "lucide-react";

const CATEGORIES = [
    "Dairy", "Vegetables", "Fruits", "Frozen", "Snacks",
    "Beverages", "Bakery", "Meat", "Seafood", "Condiments",
];

const PAYMENT_TERMS = ["Cash", "7 days", "14 days", "30 days", "60 days"];
const PRIORITIES = ["Normal", "Preferred", "Critical"];

function genCode() {
    return `SUP-${Date.now().toString().slice(-6)}`;
}

export default function SupplierFormModal({ open, mode, initial, onClose, onSubmit }) {
    const empty = useMemo(() => ({
        supplierCode: genCode(),
        name: "",
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        category: "",
        paymentTerms: "",
        importanceLevel: "Normal",
        status: "Active",
        delivery_day: "",
        totalOrders: "",
        lateDeliveries: "",
        updated_by: "staff",
    }), []);

    const [form, setForm] = useState(empty);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            const base = initial
                ? {
                    ...initial,
                    delivery_day: initial.delivery_day ?? "",
                    totalOrders: initial.totalOrders ?? "",
                    lateDeliveries: initial.lateDeliveries ?? "",
                }
                : empty;
            setForm(base);
            setErrors({});
        }
    }, [open, initial, empty]);

    if (!open) return null;

    const set = (k, v) => {
        setForm((p) => ({ ...p, [k]: v }));
        setErrors((e) => ({ ...e, [k]: undefined }));
    };

    // Multi-select category toggle
    const selectedCats = form.category
        ? form.category.split(",").map((c) => c.trim()).filter(Boolean)
        : [];
    const toggleCat = (cat) => {
        const next = selectedCats.includes(cat)
            ? selectedCats.filter((c) => c !== cat)
            : [...selectedCats, cat];
        set("category", next.join(", "));
    };

    const validate = () => {
        const e = {};
        if (!form.companyName.trim()) e.companyName = "Company Name is required";
        if (form.email && !/^[^@]+@[^@]+\.[^@]+$/.test(form.email))
            e.email = "Invalid email format";
        if (form.phone && !/^[\d\s+\-()]{7,20}$/.test(form.phone))
            e.phone = "Phone must be 7-20 digits";

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const submit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const payload = {
                supplierCode: form.supplierCode || genCode(),
                name: form.name || "",
                companyName: form.companyName,
                contactPerson: form.contactPerson || "",
                email: form.email || "",
                phone: form.phone || "",
                address: form.address || "",
                category: form.category || "",
                paymentTerms: form.paymentTerms || "",
                importanceLevel: form.importanceLevel || "Normal",
                status: form.status || "Active",
                delivery_day: form.delivery_day !== "" ? parseInt(form.delivery_day) || 0 : 0,
                totalOrders: form.totalOrders !== "" ? parseInt(form.totalOrders) || 0 : 0,
                lateDeliveries: form.lateDeliveries !== "" ? parseInt(form.lateDeliveries) || 0 : 0,
                updated_by: "staff",
            };
            if (mode === "edit" && form.id) payload.id = form.id;
            await onSubmit(payload);
            onClose();
        } catch (err) {
            console.error("Submit error:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
                    <div>
                        <div className="text-lg font-bold text-slate-900">
                            {mode === "create" ? "➕ Add Supplier" : "✏️ Edit Supplier"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            {mode === "create" ? "Fill in details to create a new supplier record" : "Update supplier information"}
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100 transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Supplier Code */}
                        <Field label="Supplier Code" hint="Auto-generated">
                            <input
                                value={form.supplierCode}
                                onChange={(e) => set("supplierCode", e.target.value)}
                                className={inp()}
                                placeholder="SUP-XXXXXX"
                                readOnly={mode === "edit"}
                            />
                        </Field>

                        {/* Status */}
                        <Field label="Status">
                            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inp()}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </Field>

                        {/* Name */}
                        <Field label="Supplier Name">
                            <input
                                value={form.name}
                                onChange={(e) => set("name", e.target.value)}
                                className={inp()}
                                placeholder="e.g. Example Supplies"
                            />
                        </Field>

                        {/* Company */}
                        <Field label="Company Name *" error={errors.companyName}>
                            <input
                                value={form.companyName}
                                onChange={(e) => set("companyName", e.target.value)}
                                className={inp(errors.companyName)}
                                placeholder="e.g. Company Ltd."
                            />
                        </Field>

                        {/* Contact */}
                        <Field label="Contact Person">
                            <input
                                value={form.contactPerson}
                                onChange={(e) => set("contactPerson", e.target.value)}
                                className={inp()}
                                placeholder="e.g. person name"
                            />
                        </Field>

                        {/* Email */}
                        <Field label="Email" error={errors.email}>
                            <input
                                value={form.email}
                                onChange={(e) => set("email", e.target.value)}
                                className={inp(errors.email)}
                                placeholder="contact@company.com"
                                type="email"
                            />
                        </Field>

                        {/* Phone */}
                        <Field label="Phone" error={errors.phone}>
                            <input
                                value={form.phone}
                                onChange={(e) => set("phone", e.target.value)}
                                className={inp(errors.phone)}
                                placeholder="e.g. +94 77 123 4567"
                            />
                        </Field>

                        {/* Priority */}
                        <Field label="Importance Level">
                            <select value={form.importanceLevel} onChange={(e) => set("importanceLevel", e.target.value)} className={inp()}>
                                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </Field>

                        {/* Payment Terms */}
                        <Field label="Payment Terms">
                            <select value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} className={inp()}>
                                <option value="">Select terms…</option>
                                {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </Field>

                        {/* Lead Time */}
                        <Field label="Delivery Day (days)">
                            <input
                                value={form.delivery_day}
                                onChange={(e) => set("delivery_day", e.target.value)}
                                className={inp()}
                                placeholder="e.g. 7"
                                type="number"
                                min={0}
                            />
                        </Field>

                        {/* Total Orders */}
                        <Field label="Total Orders">
                            <input
                                value={form.totalOrders}
                                onChange={(e) => set("totalOrders", e.target.value)}
                                className={inp()}
                                placeholder="e.g. 40"
                                type="number" min={0}
                            />
                        </Field>

                        {/* Late Deliveries */}
                        <Field label="Late Deliveries">
                            <input
                                value={form.lateDeliveries}
                                onChange={(e) => set("lateDeliveries", e.target.value)}
                                className={inp()}
                                placeholder="e.g. 1"
                                type="number" min={0}
                            />
                        </Field>

                        {/* Categories */}
                        <Field label="Categories (select all that apply)" full>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {CATEGORIES.map((cat) => {
                                    const active = selectedCats.includes(cat);
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => toggleCat(cat)}
                                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${active
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50"
                                                }`}
                                        >
                                            {active ? <CheckSquare size={12} /> : <Square size={12} />}
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedCats.length > 0 && (
                                <div className="mt-2 text-xs text-emerald-600 font-medium">
                                    Selected: {selectedCats.join(", ")}
                                </div>
                            )}
                        </Field>

                        {/* Address */}
                        <Field label="Address" full>
                            <textarea
                                value={form.address}
                                onChange={(e) => set("address", e.target.value)}
                                className={`${inp()} min-h-[80px] resize-y`}
                                placeholder="Street, City, Country"
                            />
                        </Field>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={submitting}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                        {submitting ? "Saving…" : mode === "create" ? "Create Supplier" : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function inp(err) {
    return `w-full rounded-xl border ${err ? "border-red-400 bg-red-50" : "border-slate-200"} px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100`;
}

function Field({ label, children, full, error, hint }) {
    return (
        <label className={full ? "block md:col-span-2" : "block"}>
            <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{label}</span>
                {hint && <span className="text-xs text-slate-400">{hint}</span>}
            </div>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </label>
    );
}