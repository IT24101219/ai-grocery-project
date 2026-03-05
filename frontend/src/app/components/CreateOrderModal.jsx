import { useState, useEffect } from "react";
import {
    ShoppingCart, Plus, Trash2, ChevronDown, X, Package
} from "lucide-react";
import API from "../../api";
import { useToast } from "../context/ToastContext.jsx";
import { useSuppliers } from "../context/SupplierContext.jsx";

const STATUS_OPTIONS = ["Pending", "Approved", "Shipped", "Delivered", "Cancelled"];

const EMPTY_ITEM = { item_name: "", quantity: 1, unit_price: 0 };

export default function CreateOrderModal({ open, onClose, onCreated }) {
    const { suppliers } = useSuppliers();
    const toast = useToast();

    const [supplierId, setSupplierId] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
    const [expectedDate, setExpectedDate] = useState("");
    const [notes, setNotes] = useState("");
    const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
    const [submitting, setSubmitting] = useState(false);

    // Reset form on open
    useEffect(() => {
        if (open) {
            setSupplierId("");
            setOrderDate(new Date().toISOString().slice(0, 10));
            setExpectedDate("");
            setNotes("");
            setItems([{ ...EMPTY_ITEM }]);
        }
    }, [open]);

    if (!open) return null;

    const activeSuppliers = suppliers.filter(s => s.status === "Active");
    const selectedSupplier = activeSuppliers.find(s => s.id === parseInt(supplierId));

    const setItem = (idx, key, val) => {
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));
    };
    const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
    const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

    const total = items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0), 0);
    const canSubmit = supplierId && orderDate && items.every(it => it.item_name.trim());

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await API.post("/orders", {
                supplier_id: parseInt(supplierId),
                order_date: orderDate,
                expected_delivery_date: expectedDate || null,
                notes,
                items: items.map(it => ({
                    item_name: it.item_name,
                    quantity: parseFloat(it.quantity) || 1,
                    unit_price: parseFloat(it.unit_price) || 0,
                })),
            });
            toast.success("PO Created", "Purchase order created successfully.");
            onCreated && onCreated();
            onClose();
        } catch (e) {
            toast.error("Error", "Failed to create purchase order.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={18} className="text-emerald-600" />
                        <h2 className="text-base font-extrabold text-slate-900">Create Purchase Order</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Supplier Select */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Supplier *</label>
                        <div className="relative">
                            <select
                                value={supplierId}
                                onChange={e => setSupplierId(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">— Select Supplier —</option>
                                {activeSuppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.companyName}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-slate-400" />
                        </div>

                        {/* Supplier contact info */}
                        {selectedSupplier && (
                            <div className="mt-2 rounded-xl border border-blue-100 bg-emerald-50 px-3 py-2 text-xs text-slate-700 flex flex-wrap gap-x-4 gap-y-1">
                                <span><span className="font-semibold text-slate-500">Contact:</span> {selectedSupplier.contactPerson || "—"}</span>
                                <span><span className="font-semibold text-slate-500">Phone:</span> {selectedSupplier.phone || "—"}</span>
                                <span><span className="font-semibold text-slate-500">Email:</span> {selectedSupplier.email || "—"}</span>
                                <span><span className="font-semibold text-slate-500">Payment:</span> {selectedSupplier.paymentTerms || "—"}</span>
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Order Date *</label>
                            <input
                                type="date"
                                value={orderDate}
                                onChange={e => setOrderDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Delivery</label>
                            <input
                                type="date"
                                value={expectedDate}
                                onChange={e => setExpectedDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-semibold text-slate-700">Line Items *</label>
                            <button
                                onClick={addItem}
                                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                <Plus size={13} /> Add Item
                            </button>
                        </div>

                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            {/* Header */}
                            <div className="grid grid-cols-[1fr_90px_100px_36px] gap-2 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 border-b border-slate-200">
                                <span>Item Name</span>
                                <span>Qty</span>
                                <span>Unit Price (LKR)</span>
                                <span></span>
                            </div>
                            {items.map((it, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_90px_100px_36px] gap-2 items-center px-3 py-2 border-b border-slate-100 last:border-0">
                                    <input
                                        type="text"
                                        placeholder="e.g. Rice 25kg"
                                        value={it.item_name}
                                        onChange={e => setItem(idx, "item_name", e.target.value)}
                                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={it.quantity}
                                        onChange={e => setItem(idx, "quantity", e.target.value)}
                                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={it.unit_price}
                                        onChange={e => setItem(idx, "unit_price", e.target.value)}
                                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <button
                                        onClick={() => removeItem(idx)}
                                        disabled={items.length === 1}
                                        className="flex items-center justify-center text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="mt-2 flex justify-end text-sm">
                            <span className="text-slate-500 mr-2">Total:</span>
                            <span className="font-extrabold text-slate-900">
                                LKR {total.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Optional notes or special instructions..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t px-6 py-4">
                    <button onClick={onClose} className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !canSubmit}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                        <Package size={15} />
                        {submitting ? "Creating..." : "Create PO"}
                    </button>
                </div>
            </div>
        </div>
    );
}

