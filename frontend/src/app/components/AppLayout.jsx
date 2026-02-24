import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <Sidebar />
            <div className="mx-auto max-w-7xl px-4 py-6 pl-16">
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}