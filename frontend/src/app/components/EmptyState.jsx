import { Plus } from "lucide-react";

export default function EmptyState({ title, description, actionLabel, onAction }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{description}</p>

            {actionLabel ? (
                <button
                    onClick={onAction}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                    <Plus size={16} />
                    {actionLabel}
                </button>
            ) : null}
        </div>
    );
}