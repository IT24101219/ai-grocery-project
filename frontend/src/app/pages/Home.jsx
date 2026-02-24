import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, ShieldCheck, Truck, Store, Heart, Github, Twitter } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
    const heroUrl =
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80";

    // Animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerChildren = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900">

            {/* HERO */}
            <motion.section
                initial="hidden"
                animate="visible"
                variants={staggerChildren}
                className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2"
            >
                {/* Left */}
                <motion.div variants={fadeInUp}>
                    <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900">
                        Streamline Your{" "}
                        <span className="text-emerald-600">Grocery Supply Chain</span>
                    </h1>

                    <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
                        Manage suppliers, track performance, and improve supply operations
                        with a smart supplier management platform.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                            >
                                Get Started <ArrowRight size={16} />
                            </Link>
                        </motion.div>

                        <motion.a
                            href="#features"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-900 shadow-sm transition hover:bg-slate-50"
                        >
                            View Features
                        </motion.a>
                    </div>

                    {/* Trusted section*/}
                    <div className="mt-10 flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <Store size={16} />
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <Truck size={16} />
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <ShieldCheck size={16} />
                            </div>
                        </div>
                        <div className="text-slate-600">
                            Manage suppliers with{" "}
                            <span className="font-extrabold text-emerald-600">AI driven</span>{" "}
                            dashboard
                        </div>
                    </div>
                </motion.div>

                {/* Right - Image */}
                <motion.div
                    variants={fadeInUp}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <div className="rounded-3xl bg-gradient-to-b from-slate-50 to-white p-4">
                        <div className="relative overflow-hidden rounded-3xl shadow-xl">
                            <motion.img
                                src={heroUrl}
                                alt="Grocery supply"
                                className="h-[360px] w-full object-cover transition-transform duration-700 hover:scale-105 md:h-[420px]"
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 1.2 }}
                            />
                        </div>
                    </div>
                </motion.div>
            </motion.section>

            {/* FEATURES */}
            <motion.section
                id="features"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerChildren}
                className="bg-slate-50/70 py-16"
            >
                <div className="mx-auto max-w-7xl px-4">
                    <motion.div variants={fadeInUp} className="text-center">
                        <div className="text-xs font-extrabold text-emerald-600">
                            Faster Operations
                        </div>
                        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                            Everything you need to manage suppliers
                        </h2>
                        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                            End-to-end visibility and control across your grocery supply chain.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={staggerChildren}
                        className="mt-10 grid gap-6 md:grid-cols-3"
                        id="solutions"
                    >
                        <FeatureCard
                            icon={<BarChart3 size={18} />}
                            title="Real-time Analytics"
                            desc="Track supplier performance with visual dashboards and reports."
                        />
                        <FeatureCard
                            icon={<ShieldCheck size={18} />}
                            title="Quality Assurance"
                            desc="Maintain supplier standards with monitoring and score tracking."
                        />
                        <FeatureCard
                            icon={<Truck size={18} />}
                            title="Smart Logistics"
                            desc="Support on-time delivery improvements with structured supplier data."
                        />
                    </motion.div>
                </div>
            </motion.section>

            <motion.section
                className="w-full bg-slate-950 py-16"
                id="pricing"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
            >
                <div className="mx-auto max-w-7xl px-4">
                    <div className="relative overflow-hidden rounded-3xl p-10 text-center text-white">
                        {/* Animated gradient background */}
                        <motion.div
                            className="pointer-events-none absolute inset-0 opacity-30"
                            animate={{
                                background: [
                                    "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.35), transparent 40%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.25), transparent 45%), radial-gradient(circle at 50% 90%, rgba(99,102,241,0.20), transparent 50%)",
                                    "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.4), transparent 45%), radial-gradient(circle at 70% 20%, rgba(59,130,246,0.3), transparent 50%), radial-gradient(circle at 40% 80%, rgba(99,102,241,0.25), transparent 55%)",
                                    "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.35), transparent 40%), radial-gradient(circle at 80% 30%, rgba(59,130,246,0.25), transparent 45%), radial-gradient(circle at 50% 90%, rgba(99,102,241,0.20), transparent 50%)"
                                ]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        />

                        <div className="relative">
                            <h3 className="text-3xl font-extrabold">
                                Ready to optimize your supply chain?
                            </h3>
                            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
                                Access the supplier portal to manage suppliers, track performance,
                                and view analytics dashboards.
                            </p>

                            <div className="mt-8">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-block"
                                >
                                    <Link
                                        to="/dashboard"
                                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-800/30 transition hover:bg-emerald-700"
                                    >
                                        Access Dashboard
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* FOOTER */}
            <footer className="bg-white">
                <hr className="border-slate-200" />
                <div className="mx-auto max-w-7xl px-4 py-12">
                    <div className="grid gap-8 md:grid-cols-4">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-600 p-2 text-white">
                  <Truck size={20} />
                </span>
                                <span className="text-lg font-extrabold text-slate-900">FreshSupply</span>
                            </div>
                            <p className="mt-4 text-sm text-slate-600">
                                Smart supplier management for modern grocery supply chains.
                            </p>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 className="font-extrabold text-slate-900">Product</h4>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                <li><a href="#features" className="hover:text-emerald-600 transition">Features</a></li>
                                <li><a href="#pricing" className="hover:text-emerald-600 transition">Pricing</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition">Dashboard</a></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="font-extrabold text-slate-900">Company</h4>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                <li><a href="#" className="hover:text-emerald-600 transition">About</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition">Blog</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition">Careers</a></li>
                            </ul>
                        </div>

                        {/* Legal & Social */}
                        <div>
                            <h4 className="font-extrabold text-slate-900">Legal</h4>
                            <ul className="mt-4 space-y-2 text-sm text-slate-600">
                                <li><a href="#" className="hover:text-emerald-600 transition">Privacy</a></li>
                                <li><a href="#" className="hover:text-emerald-600 transition">Terms</a></li>
                            </ul>
                            <div className="mt-6 flex gap-4">
                                <a href="#" className="text-slate-400 hover:text-emerald-600 transition">
                                    <Twitter size={18} />
                                </a>
                                <a href="#" className="text-slate-400 hover:text-emerald-600 transition">
                                    <Github size={18} />
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
                        © {new Date().getFullYear()} FreshSupply • Supplier Management System
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <motion.div
            variants={fadeInUp}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.05)" }}
            className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                {icon}
            </div>
            <div className="mt-4 text-lg font-extrabold text-slate-900">{title}</div>
            <div className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</div>
        </motion.div>
    );
}

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};