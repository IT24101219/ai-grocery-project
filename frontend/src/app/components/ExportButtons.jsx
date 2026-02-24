import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import API from "../../api";

function downloadBlob(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function ExportButtons({ suppliers }) {

    /* ───── CSV Export ───── */
    const exportCSV = async () => {
        try {
            const res = await API.get("/suppliers/export/csv", { responseType: "blob" });
            const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "suppliers.csv";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // fallback if backend fails
            const headers = [
                "SupplierCode", "Name", "CompanyName", "ContactPerson", "Email",
                "Phone", "Category", "PaymentTerms", "Priority", "Status", "LeadTime"
            ];

            const lines = [
                headers.join(","),
                ...suppliers.map((s) =>
                    headers.map((h) => {
                        const key = h.charAt(0).toLowerCase() + h.slice(1);
                        return `"${(s[key] ?? "").toString().replaceAll('"', '""')}"`;
                    }).join(",")
                ),
            ];

            downloadBlob("suppliers.csv", lines.join("\n"), "text/csv");
        }
    };

    /* ───── PDF Export ───── */
    const exportPDF = () => {
        const doc = new jsPDF({ orientation: "landscape" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const marginX = 14;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("Supplier Report", pageWidth / 2, 16, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 23, { align: "center" });

        const total = suppliers.length;
        const active = suppliers.filter((s) => s.status !== "Inactive").length;
        const inactive = total - active;

        let y = 32;
        doc.setFontSize(11);
        doc.text(`Total: ${total}`, marginX, y);
        doc.text(`Active: ${active}`, marginX + 40, y);
        doc.text(`Inactive: ${inactive}`, marginX + 90, y);
        y += 8;

        const columns = ["#", "Code", "Company", "Name", "Category", "Lead", "Status"];
        const widths = [8, 22, 60, 40, 40, 16, 22];

        doc.setFillColor(30, 30, 30);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);

        let x = marginX;
        widths.forEach((w, i) => {
            doc.rect(x, y - 6, w, 8, "F");
            doc.text(columns[i], x + 2, y);
            x += w;
        });

        doc.setTextColor(0, 0, 0);
        let rowY = y + 6;

        suppliers.forEach((s, index) => {
            if (rowY > 190) {
                doc.addPage("landscape");
                rowY = 20;
            }

            let colX = marginX;
            const vals = [
                String(index + 1),
                s.supplierCode || "—",
                s.companyName || "—",
                s.name || "—",
                (s.category || "").split(",")[0] || "—",
                s.leadTime ? `${s.leadTime}d` : "—",
                s.status || "—",
            ];

            widths.forEach((w, i) => {
                doc.text(vals[i], colX + 2, rowY);
                colX += w;
            });

            rowY += 7;
        });

        doc.save("suppliers-report.pdf");
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Export CSV */}
            <button
                onClick={exportCSV}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
                <Download size={14} className="text-emerald-600" />
                Export CSV
            </button>

            {/* Export PDF */}
            <button
                onClick={exportPDF}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
                <FileText size={14} className="text-red-500" />
                Export PDF
            </button>
        </div>
    );
}