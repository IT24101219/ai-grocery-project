import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    BarChart2,
    Menu,
    ChevronRight,
} from "lucide-react";

const NAV = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/suppliers", icon: Users, label: "Suppliers" },
    { to: "/analytics", icon: BarChart2, label: "Analytics" },
];

export default function Sidebar() {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const drawerRef = useRef(null);

    // Close sidebar when route changes
    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    // Lock scroll when sidebar open
    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    // Close when clicking outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <>
            {/* Hamburger button */}
            <button
                onClick={() => setOpen(!open)}
                className="fixed top-4 left-4 z-[70] grid h-10 w-10 place-items-center rounded-xl bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            >
                <Menu size={20} />
            </button>

            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
            />

            {/* Sidebar */}
            <aside
                ref={drawerRef}
                className={`fixed top-0 left-0 z-[60] flex h-full w-72 flex-col bg-white border-r border-slate-200 shadow-2xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-lg">
                        G
                    </div>
                    <div>
                        <div className="text-base font-extrabold text-slate-900 tracking-tight">Grocery</div>
                        <div className="text-xs font-medium text-slate-500">Supplier Management</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-5">
                    <div className="mb-3 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Main Menu
                    </div>

                    <div className="space-y-1">
                        {NAV.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isActive
                                        ? "bg-emerald-50 text-emerald-700 shadow-sm"
                                        : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {/* Active bar indicator */}
                                        <span
                                            className={`absolute left-0 h-6 w-1 rounded-r-full transition-all ${isActive ? "bg-emerald-500 opacity-100" : "bg-transparent opacity-0"
                                                }`}
                                        />

                                        <Icon
                                            size={18}
                                            className={`transition-colors ${isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"}`}
                                        />

                                        <span className={`text-sm ${isActive ? "font-bold" : "font-semibold"}`}>
                                            {label}
                                        </span>

                                        <ChevronRight
                                            size={16}
                                            className={`ml-auto transition-all ${isActive
                                                ? "text-emerald-400 opacity-100"
                                                : "text-slate-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                                }`}
                                        />
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                    {/* Placeholder for future footer items if needed */}
                </div>
            </aside>
        </>
    );
}