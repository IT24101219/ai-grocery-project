export default function StatCard({ title, value, subtitle, icon, color = "emerald", delta }) {
    const colors = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-600",
        red: "bg-red-50 text-red-600",
        purple: "bg-purple-50 text-purple-600",
        slate: "bg-slate-100 text-slate-600",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                {icon && (
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[color] || colors.emerald}`}>
                        {icon}
                    </div>
                )}
                {delta != null && (
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${delta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                        {delta >= 0 ? "+" : ""}{delta}%
                    </span>
                )}
            </div>
            <div className={`mt-3 text-2xl font-extrabold text-slate-900 ${icon ? "" : "mt-0"}`}>{value}</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-700">{title}</div>
            {subtitle && <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>}
        </div>
    );
}