import { useState, useEffect } from "react";
import { Plus, Clock, Trash2, Edit2, CheckCircle2, XCircle } from "lucide-react";
import API from "../../api";
import { useToast } from "../context/ToastContext.jsx";

function DeliveryModal({ open, mode, initial, supplierId, onClose, onSave }) {
    const defaultForm = {
        order_id: "",
        expected_date: "",
        delivery_date: "",
        delivered_on_time: true,
        rating: ""
    };
    const [form, setForm] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(initial ? { ...initial, order_id: initial.order_id || "", rating: initial.rating || "" } : defaultForm);
        }
    }, [open, initial]);

    if (!open) return null;

    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

    const submit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                supplier_id: supplierId,
                order_id: form.order_id ? parseInt(form.order_id) : null,
                expected_date: form.expected_date,
                delivery_date: form.delivery_date || null,
                delivered_on_time: form.delivered_on_time,
                rating: form.rating ? parseFloat(form.rating) : null,
            };
            await onSave(payload, initial?.id);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="font-bold text-slate-900">{mode === 'create' ? 'Add Delivery' : 'Edit Delivery'}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">
                        Related Order ID (Optional)
                        <input type="number" value={form.order_id} onChange={e => set('order_id', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                        Expected Date *
                        <input type="date" required value={form.expected_date} onChange={e => set('expected_date', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                        Actual Delivery Date
                        <input type="date" value={form.delivery_date} onChange={e => set('delivery_date', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={form.delivered_on_time} onChange={e => set('delivered_on_time', e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4" />
                        Delivered On Time?
                    </label>
                    <label className="block text-sm font-semibold text-slate-700">
                        Rating (1-5)
                        <input type="number" min="1" max="5" step="0.5" value={form.rating} onChange={e => set('rating', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </label>
                </div>
                <div className="flex justify-end gap-3 border-t px-6 py-4">
                    <button onClick={onClose} className="rounded-xl px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                    <button onClick={submit} disabled={submitting || !form.expected_date} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Save Delivery</button>
                </div>
            </div>
        </div>
    );
}

export default function SupplierDeliverySection({ supplierId, onDeliveriesChanged }) {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, mode: 'create', data: null });
    const toast = useToast();

    const fetchDeliveries = async () => {
        try {
            const res = await API.get(`/suppliers/${supplierId}/deliveries`);
            setDeliveries(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeliveries();
    }, [supplierId]);

    const handleSave = async (payload, id) => {
        try {
            if (id) {
                await API.put(`/deliveries/${id}`, payload);
                toast.success("Updated", "Delivery updated.");
            } else {
                await API.post(`/deliveries`, payload);
                toast.success("Added", "Delivery added.");
            }
            await fetchDeliveries();
            if (onDeliveriesChanged) onDeliveriesChanged(); // Trigger parent refresh to update metrics
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
            await fetchDeliveries();
            if (onDeliveriesChanged) onDeliveriesChanged();
        } catch (e) {
            toast.error("Error", "Could not delete delivery.");
        }
    };

    if (loading) return <div className="text-sm text-slate-500">Loading deliveries...</div>;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={16} className="text-emerald-600" /> Delivery History
                </h3>
                <button
                    onClick={() => setModal({ open: true, mode: 'create', data: null })}
                    className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                    <Plus size={14} /> Add Delivery
                </button>
            </div>

            {deliveries.length === 0 ? (
                <div className="text-center py-6 text-sm text-slate-500 border border-dashed rounded-xl border-slate-200">
                    No deliveries recorded yet.
                </div>
            ) : (
                <div className="overflow-x-auto text-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-xs text-slate-500">
                                <th className="py-2 font-semibold">Expected</th>
                                <th className="py-2 font-semibold">Actual</th>
                                <th className="py-2 font-semibold">Order ID</th>
                                <th className="py-2 font-semibold">Status</th>
                                <th className="py-2 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {deliveries.map(d => (
                                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-2.5 font-medium text-slate-700">{d.expected_date}</td>
                                    <td className="py-2.5 text-slate-600">{d.delivery_date || "—"}</td>
                                    <td className="py-2.5 text-slate-500">{d.order_id ? `#${d.order_id}` : "—"}</td>
                                    <td className="py-2.5">
                                        {d.delivered_on_time ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle2 size={12} /> On Time</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><XCircle size={12} /> Late</span>
                                        )}
                                    </td>
                                    <td className="py-2.5 text-right flex items-center justify-end gap-2">
                                        <button onClick={() => setModal({ open: true, mode: 'edit', data: d })} className="text-slate-400 hover:text-blue-600"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(d.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <DeliveryModal
                open={modal.open}
                mode={modal.mode}
                initial={modal.data}
                supplierId={supplierId}
                onClose={() => setModal(prev => ({ ...prev, open: false }))}
                onSave={handleSave}
            />
        </div>
    );
}
