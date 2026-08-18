import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle,
    Download,
    Loader2,
    Send,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { generateEngineeringDrawingPdf } from "./engineeringDrawingPdfGenerator";
import { getCompany } from "../../../../redux/slices/professionalSlice/professionalCompanyMaster.slice";

const PDFTab = ({ bomData = {} }: any) => {
    const dispatch = useDispatch<any>();

    const d = bomData?.dimensions || {};
    const c = bomData?.calculated || {};

    const [loading, setLoading] = useState(false);

    const { companyData, company, data, listingLoader } = useSelector(
        (state: any) => state.professionalCompanyMaster || {}
    );

    const companyMaster = useMemo(() => {
        const raw = companyData || company || data?.data || data || null;

        if (Array.isArray(raw)) {
            return raw?.[0] || null;
        }

        return raw;
    }, [companyData, company, data]);

    useEffect(() => {
        dispatch(
            getCompany({
                limit: 10,
                offset: 0,
            })
        );
    }, [dispatch]);

    const handleGeneratePDF = async () => {
        try {
            if (!companyMaster?._id && !companyMaster?.companyName) {
                toast.error("Please create Company Master first.");
                return;
            }

            await generateEngineeringDrawingPdf(bomData, {
                setLoading,
                company: companyMaster,
            });

            toast.success("PDF generated successfully");
        } catch (err: any) {
            toast.error(err?.message || "Failed to generate PDF");
        }
    };

    const totalWeight =
        bomData?.estimatedWeight || c.estimatedTrailerWeight || 0;

    const estimatedCost =
        bomData?.estimatedCost ||
        c.estimatedCost ||
        (bomData?.components || []).reduce(
            (sum: number, item: any) => sum + Number(item.amount || 0),
            0
        );

    return (
        <div className="h-full overflow-y-auto px-4 pb-10 text-foreground">
            {(loading || listingLoader) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70">
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-card-foreground shadow-lg">
                        <Loader2
                            className="animate-spin text-primary"
                            size={22}
                        />

                        <span className="text-sm font-semibold text-foreground">
                            {loading ? "Generating PDF..." : "Loading company..."}
                        </span>
                    </div>
                </div>
            )}

            <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
                <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-base font-semibold text-foreground">
                        PDF Export
                    </h2>

                    <div className="flex justify-end gap-3">
                        <Action
                            icon={<Download size={16} />}
                            title="PDF"
                            // sub="Download"
                            onClick={handleGeneratePDF}
                            disabled={loading || listingLoader}
                        />

                        <Action
                            icon={<Download size={16} />}
                            title="DXF"
                            // sub="Download"
                            onClick={() => toast.info("DXF download coming soon")}
                        />

                        <Action
                            icon={<Send size={16} />}
                            title="Send"
                            // sub="Approval"
                            green
                            onClick={() => toast.info("Approval flow coming soon")}
                        />
                    </div>
                </div>

                <p className="mt-0.5 text-sm font-normal leading-5 text-muted-foreground">
                    Export engineering drawing, BOM and summary into a PDF
                    document with your company details from Company Master.
                </p>

                <Info
                    label="Company"
                    value={companyMaster?.companyName || "-"}
                />
                <Info
                    label="Product"
                    value={
                        bomData?.selectedProductLabel ||
                        bomData?.selectedProduct ||
                        "-"
                    }
                />
                <Info label="Account" value={bomData?.accountName || "-"} />
                <Info label="Total Length" value={`${d.totalLength || "-"} mm`} />
                <Info
                    label="Total Height"
                    value={`${d.totalHeight ||
                        d.deckHeight ||
                        d.trailerHeight ||
                        "-"
                        } mm`}
                />
                <Info label="Total Weight" value={`${totalWeight} kg`} />
                <Info
                    label="Estimated Cost"
                    value={`₹ ${Number(estimatedCost || 0).toLocaleString(
                        "en-IN"
                    )}`}
                />
                <Info
                    label="BOM Items"
                    value={String(bomData?.components?.length || 0)}
                />
            </div>

            <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
                <h2 className="mb-3 text-base font-semibold text-foreground">
                    PDF Includes
                </h2>

                <Feature text="Company name & details from Company Master" />
                <Feature text="Technical Drawing" />
                <Feature text="Engineering Summary" />
                <Feature text="Bill of Materials" />
                <Feature text="Input Dimensions" />
                <Feature text="Estimated Cost & Weight" />
            </div>
        </div>
    );
};

const Info = ({ label, value }: any) => {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
            <span className="flex-1 text-sm font-medium text-muted-foreground">
                {label}
            </span>

            <span className="flex-1 text-right text-sm font-semibold text-foreground">
                {value}
            </span>
        </div>
    );
};

const Feature = ({ text }: any) => {
    return (
        <div className="flex items-center gap-2 border-b border-border py-2 last:border-b-0">
            <CheckCircle size={17} className="shrink-0 text-success" />

            <span className="text-sm font-medium text-foreground">
                {text}
            </span>
        </div>
    );
};

const Action = ({
    icon,
    title,
    sub,
    green = false,
    disabled = false,
    onClick,
}: any) => {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex h-9 items-center gap-2 rounded-lg border bg-card px-3 transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                green
                    ? "border-success/20 text-success hover:bg-success/10"
                    : "border-border text-primary hover:bg-primary/10"
            }`}
        >
            <span className="shrink-0">{icon}</span>

            <span className="text-left leading-none">
                <span
                    className={`block text-xs font-semibold ${
                        green ? "text-success" : "text-primary"
                    }`}
                >
                    {title}
                </span>

                <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">
                    {sub}
                </span>
            </span>
        </button>
    );
};

export default PDFTab;