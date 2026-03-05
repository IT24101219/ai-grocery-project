import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex">
            <Sidebar />
            <div className="flex-1 pl-60 min-w-0">
                <main className="max-w-7xl mx-auto px-6 py-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}