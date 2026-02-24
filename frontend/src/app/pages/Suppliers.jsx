import { useState } from "react";
import EmptyState from "../components/EmptyState.jsx";
import SupplierFormModal from "../components/SupplierFormModal.jsx";
import SupplierTable from "../components/SupplierTable.jsx";
import ExportButtons from "../components/ExportButtons.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useSuppliers } from "../context/SupplierContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Suppliers() {
    const { suppliers, addSupplier, updateSupplier, softDeleteSupplier, loadSuppliers } = useSuppliers();
    const toast = useToast();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deactivateId, setDeactivateId] = useState(null);

    const openCreate = () => {
        setEditing(null);
        setOpen(true);
    };

    const onSubmit = async (supplier) => {
        try {
            if (editing) {
                await updateSupplier(supplier);
                toast.success("Supplier Updated", "Supplier details updated successfully.");
            } else {
                await addSupplier(supplier);
                toast.success("Supplier Added", "New supplier created successfully.");
            }
        } catch (error) {
            toast.error("Error", "Failed to save supplier. Please try again.");
        }
    };

    const askDeactivate = (id) => {
        setDeactivateId(id);
        setConfirmOpen(true);
    };

    const confirmDeactivate = async () => {
        try {
            await softDeleteSupplier(deactivateId);
            toast.info("Supplier Deactivated", "Supplier marked as inactive (soft delete).");
            setConfirmOpen(false);
            setDeactivateId(null);
        } catch (error) {
            toast.error("Error", "Failed to deactivate supplier. Please try again.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
                            Supplier Management
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-600 md:text-[0.95rem]">
                            Maintain supplier records, track their status, and use filters for fast management.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <ExportButtons suppliers={suppliers} onImported={loadSuppliers} />
                        <button
                            onClick={openCreate}
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                        >
                            Add Supplier
                        </button>
                    </div>
                </div>
            </div>

            {suppliers.length === 0 ? (
                <EmptyState
                    title="No suppliers yet"
                    description="Start by adding suppliers to manage records and generate analytics."
                    actionLabel="Add Supplier"
                    onAction={openCreate}
                />
            ) : (
                <SupplierTable
                    suppliers={suppliers}
                    onEdit={(s) => {
                        setEditing(s);
                        setOpen(true);
                    }}
                    onSoftDelete={askDeactivate}
                />
            )}

            <SupplierFormModal
                open={open}
                mode={editing ? "edit" : "create"}
                initial={editing}
                onClose={() => setOpen(false)}
                onSubmit={onSubmit}
            />

            <ConfirmDialog
                open={confirmOpen}
                title="Deactivate Supplier?"
                description="This will mark the supplier as Inactive (soft delete). You can keep the record for history."
                onCancel={() => setConfirmOpen(false)}
                onConfirm={confirmDeactivate}
            />
        </div>
    );
}