import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    BarChart2,
    ShoppingCart,
    Truck,
    ChevronRight,
    ShoppingBag,
} from "lucide-react";

const NAV = [
    { to: "/suppliers", icon: Users, label: "Suppliers" },
    { to: "/deliveries", icon: Truck, label: "Deliveries" },
    { to: "/analytics", icon: BarChart2, label: "Analytics" },
];

export default function Sidebar() {
    return (
        <aside className="fixed top-0 left-0 z-[60] flex h-full w-60 flex-col bg-white border-r border-slate-200 shadow-sm">
            {/* Logo / Header */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
                <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-sm">
                    <ShoppingBag size={18} />
                </div>
                <div className="text-lg font-extrabold text-slate-900 tracking-tight">Ransara</div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">


                <div className="space-y-0.5">
                    {NAV.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isActive
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Active bar */}
                                    <span
                                        className={`absolute left-0 h-6 w-1 rounded-r-full transition-all ${isActive ? "bg-emerald-500 opacity-100" : "bg-transparent opacity-0"
                                            }`}
                                    />

                                    <Icon
                                        size={18}
                                        className={`transition-colors flex-shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"
                                            }`}
                                    />

                                    <span className={`text-sm ${isActive ? "font-bold" : "font-semibold"}`}>
                                        {label}
                                    </span>

                                    <ChevronRight
                                        size={15}
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
        </aside>
    );
}