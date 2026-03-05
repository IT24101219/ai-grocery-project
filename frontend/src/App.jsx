import { Routes, Route } from "react-router-dom";
import Home from "./app/pages/Home.jsx";
import Suppliers from "./app/pages/Suppliers.jsx";
import SupplierDetails from "./app/pages/SupplierDetails.jsx";
import Analytics from "./app/pages/Analytics.jsx";
import Deliveries from "./app/pages/Deliveries.jsx";
import AdminLayout from "./app/layout/AdminLayout.jsx";
import { SupplierProvider } from "./app/context/SupplierContext.jsx";
import { ToastProvider } from "./app/context/ToastContext.jsx";

export default function App() {
    return (
        <ToastProvider>
            <SupplierProvider>
                <Routes>
                    <Route path="/" element={<Home />} />

                    <Route element={<AdminLayout />}>
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/suppliers/:id" element={<SupplierDetails />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/deliveries" element={<Deliveries />} />
                    </Route>

                    <Route path="*" element={<div className="flex h-screen items-center justify-center text-xl font-bold text-slate-500">404 - Page Not Found</div>} />
                </Routes>
            </SupplierProvider>
        </ToastProvider>
    );
}