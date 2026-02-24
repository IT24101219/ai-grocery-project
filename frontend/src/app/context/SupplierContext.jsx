import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../../api";

const SupplierContext = createContext(null);

export function SupplierProvider({ children }) {
    const [suppliers, setSuppliers] = useState([]);

    const loadSuppliers = async () => {
        try {
            const res = await API.get("/suppliers");
            setSuppliers(res.data);
        } catch (error) {
            console.error("Failed to load suppliers:", error);
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const addSupplier = async (supplier) => {
        await API.post("/suppliers", supplier);
        await loadSuppliers();
    };

    const updateSupplier = async (supplier) => {
        await API.put(`/suppliers/${supplier.id}`, supplier);
        await loadSuppliers();
    };

    const softDeleteSupplier = async (id) => {
        await API.delete(`/suppliers/${id}`);
        await loadSuppliers();
    };

    const getSupplierById = (id) =>
        suppliers.find((s) => s.id?.toString() === id?.toString());

    const value = useMemo(
        () => ({
            suppliers,
            addSupplier,
            updateSupplier,
            softDeleteSupplier,
            getSupplierById,
            loadSuppliers,
        }),
        [suppliers]
    );

    return (
        <SupplierContext.Provider value={value}>
            {children}
        </SupplierContext.Provider>
    );
}

export function useSuppliers() {
    return useContext(SupplierContext);
}