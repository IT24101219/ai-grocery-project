import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <div className="text-xl font-extrabold text-slate-900">404 - Page not found</div>
                <p className="mt-2 text-sm text-slate-600">Go back to home.</p>
                <Link
                    to="/"
                    className="mt-6 inline-block rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-emerald-700"
                >
                    Home
                </Link>
            </div>
        </div>
    );
}