export default function ConfirmDialog({ open, title, description, onCancel, onConfirm }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                <div className="p-5">
                    <div className="text-lg font-extrabold text-slate-900">{title}</div>
                    <div className="mt-2 text-sm text-slate-600">{description}</div>
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
                    <button
                        onClick={onCancel}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-rose-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}