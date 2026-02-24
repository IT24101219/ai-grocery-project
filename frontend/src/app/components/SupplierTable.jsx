import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Brain } from "lucide-react";

const CATEGORIES = [
    "All", "Dairy", "Vegetables", "Fruits", "Frozen",
    "Snacks", "Beverages", "Bakery", "Meat", "Seafood", "Condiments",
];
const PAGE_SIZE = 10;

function ReliabilityBadge({ score }) {
    if (!score || score === 0) return <span className="text-xs text-slate-400">—</span>;
    const color =
        score >= 8 ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
            score >= 6 ? "text-blue-700 bg-blue-50 border-blue-200" :
                score >= 4 ? "text-amber-700 bg-amber-50 border-amber-200" :
                    "text-red-700 bg-red-50 border-red-200";
    return (
        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${color}`}>
            <Brain size={10} />
            {score.toFixed(1)}
        </div>
    );
}

function CategoryChips({ category }) {
    if (!category) return <span className="text-slate-400 text-xs">—</span>;
    const cats = category.split(",").map((c) => c.trim()).filter(Boolean);
    return (
        <div className="flex flex-wrap gap-1">
            {cats.slice(0, 2).map((c) => (
                <span key={c} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{c}</span>
            ))}
            {cats.length > 2 && (
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">+{cats.length - 2}</span>
            )}
        </div>
    );
}

export default function SupplierTable({ suppliers, onEdit, onSoftDelete }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [importanceFilter, setImportanceFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [sortBy, setSortBy] = useState("name-asc");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let data = [...suppliers];

        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter((s) =>
                (s.companyName || "").toLowerCase().includes(q) ||
                (s.name || "").toLowerCase().includes(q) ||
                (s.supplierCode || "").toLowerCase().includes(q) ||
                (s.phone || "").includes(q) ||
                (s.category || "").toLowerCase().includes(q) ||
                (s.contactPerson || "").toLowerCase().includes(q)
            );
        }

        if (statusFilter !== "All") data = data.filter((s) => s.status === statusFilter);
        if (importanceFilter !== "All") data = data.filter((s) => (s.importanceLevel || "Normal") === importanceFilter);
        if (categoryFilter !== "All") data = data.filter((s) => (s.category || "").includes(categoryFilter));

        const sortFn = {
            "name-asc": (a, b) => (a.companyName || "").localeCompare(b.companyName || ""),
            "name-desc": (a, b) => (b.companyName || "").localeCompare(a.companyName || ""),
            "reliability-desc": (a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0),
            "lead-asc": (a, b) => (a.delivery_day || 0) - (b.delivery_day || 0),
            "status": (a, b) => (a.status || "").localeCompare(b.status || ""),
        };
        data.sort(sortFn[sortBy] || sortFn["name-asc"]);
        return data;
    }, [suppliers, search, statusFilter, importanceFilter, categoryFilter, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const resetPage = () => setPage(1);

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Table header */}
            <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold text-slate-900">Suppliers</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                            {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
                        </div>
                    </div>
                    <div className="text-xs text-slate-400">
                        Page {page} / {totalPages}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                    placeholder="Search by name, code, phone, category…"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 md:w-72"
                />

                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>

                <select value={importanceFilter} onChange={(e) => { setImportanceFilter(e.target.value); resetPage(); }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="All">All Importance</option>
                    <option value="Normal">Normal</option>
                    <option value="Preferred">Preferred</option>
                    <option value="Critical">Critical</option>
                </select>

                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); resetPage(); }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
                </select>

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="name-asc">Name A–Z</option>
                    <option value="name-desc">Name Z–A</option>
                    <option value="reliability-desc">AI Score ↑</option>
                    <option value="lead-asc">Delivery Day ↑</option>
                    <option value="status">Status</option>
                </select>
            </div>

            {/* Table */}
            <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <tr>
                            <th className="px-4 py-3">Code</th>
                            <th className="px-4 py-3">Company / Name</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Contact</th>
                            <th className="px-4 py-3">Delivery Day</th>
                            <th className="px-4 py-3">AI Score</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                    <div className="text-2xl mb-2">🔍</div>
                                    No suppliers found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            paginated.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.supplierCode || "—"}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-slate-900">{s.companyName}</div>
                                        {s.name && <div className="text-xs text-slate-500">{s.name}</div>}
                                    </td>
                                    <td className="px-4 py-3"><CategoryChips category={s.category} /></td>
                                    <td className="px-4 py-3 text-slate-600">{s.contactPerson || "—"}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {s.delivery_day ? `${s.delivery_day}d` : "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <ReliabilityBadge score={0} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.status === "Active"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-slate-100 text-slate-600"
                                            }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            <Link to={`/suppliers/${s.id}`}
                                                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-100 transition-colors" title="View">
                                                <Eye size={14} className="text-slate-600" />
                                            </Link>
                                            <button onClick={() => onEdit(s)}
                                                className="rounded-lg border border-slate-200 p-1.5 hover:bg-blue-50 hover:border-blue-200 transition-colors" title="Edit">
                                                <Pencil size={14} className="text-blue-600" />
                                            </button>
                                            <button onClick={() => onSoftDelete(s.id)}
                                                disabled={s.status === "Inactive"}
                                                className="rounded-lg border border-slate-200 p-1.5 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Deactivate">
                                                <Trash2 size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Page structure */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                    <span className="text-xs text-slate-500">
                        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                            .map((p, idx, arr) => (
                                <span key={p}>
                                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-slate-300 text-xs">…</span>}
                                    <button
                                        onClick={() => setPage(p)}
                                        className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${p === page ? "bg-emerald-600 text-white" : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                </span>
                            ))}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

