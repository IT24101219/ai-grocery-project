import { Routes, Route } from "react-router-dom";
import Home from "./app/pages/Home.jsx";
import Dashboard from "./app/pages/Dashboard.jsx";
import Suppliers from "./app/pages/Suppliers.jsx";
import SupplierDetails from "./app/pages/SupplierDetails.jsx";
import Analytics from "./app/pages/Analytics.jsx";
import NotFound from "./app/pages/NotFound.jsx";
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
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/suppliers/:id" element={<SupplierDetails />} />
                        <Route path="/analytics" element={<Analytics />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </SupplierProvider>
        </ToastProvider>
    );
}