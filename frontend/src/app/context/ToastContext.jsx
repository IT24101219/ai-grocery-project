import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const push = (type, title, message) => {
        const id = crypto.randomUUID();
        setToasts((p) => [...p, { id, type, title, message }]);
        setTimeout(() => {
            setToasts((p) => p.filter((t) => t.id !== id));
        }, 3000);
    };

    const api = useMemo(
        () => ({
            success: (title, message) => push("success", title, message),
            error: (title, message) => push("error", title, message),
            info: (title, message) => push("info", title, message),
        }),
        []
    );

    return (
        <ToastContext.Provider value={api}>
            {children}
            <ToastStack toasts={toasts} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}

function ToastStack({ toasts }) {
    return (
        <div className="fixed right-4 top-4 z-[999] flex w-[320px] flex-col gap-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`rounded-2xl border p-4 shadow-lg ${
                        t.type === "success"
                            ? "border-emerald-200 bg-emerald-50"
                            : t.type === "error"
                                ? "border-rose-200 bg-rose-50"
                                : "border-slate-200 bg-white"
                    }`}
                >
                    <div className="text-sm font-extrabold text-slate-900">{t.title}</div>
                    {t.message ? (
                        <div className="mt-1 text-xs text-slate-600">{t.message}</div>
                    ) : null}
                </div>
            ))}
        </div>
    );
}