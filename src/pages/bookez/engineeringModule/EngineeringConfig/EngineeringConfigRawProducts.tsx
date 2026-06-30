import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/* ===================================================
   HELPERS
=================================================== */

const toNum = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const sanitizeDecimal = (value: any) => {
    return String(value ?? "")
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1");
};

const formatIndianNumber = (value: any) => {
    return Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

/* ===================================================
   OPTIONS
=================================================== */

const componentOptions = [
    { label: "Top Rail RHS 60x40x2.5", value: "topRail" },
    { label: "Bottom Rail RHS 60x40x2.5", value: "bottomRail" },
    { label: "Pillar RHS 60x40x2.5", value: "pillar" },
    { label: "Sheet Panel 2.5mm", value: "sheetPanel" },
    { label: "Gusset Plate 100x100x2.5", value: "gussetPlate" },
];

const unitOptions = [
    { label: "Nos", value: "Nos" },
    { label: "KG", value: "KG" },
    { label: "MM", value: "MM" },
    { label: "SQFT", value: "SQFT" },
];

const componentDetails: any = {
    topRail: { product: "Top Rail", unit: "Nos", rate: "4500" },
    bottomRail: { product: "Bottom Rail", unit: "Nos", rate: "4500" },
    pillar: { product: "Pillar", unit: "Nos", rate: "1200" },
    sheetPanel: { product: "Sheet Panel", unit: "SQFT", rate: "180" },
    gussetPlate: { product: "Gusset Plate", unit: "Nos", rate: "120" },
};

/* ===================================================
   SMALL INPUT COMPONENTS
=================================================== */

const SelectField = ({
    label,
    value,
    onChange,
    options = [],
    placeholder,
}: any) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">{label}</label>

            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
                <option value="">{placeholder || `Select ${label}`}</option>

                {options.map((item: any) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

const TextField = ({
    label,
    value,
    onChange,
    placeholder,
    disabled = false,
    type = "text",
}: any) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-slate-700">{label}</label>

            <input
                type={type}
                value={value || ""}
                disabled={disabled}
                placeholder={placeholder || label}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
        </div>
    );
};

/* ===================================================
   MAIN COMPONENT
=================================================== */

const EngineeringConfigRawProducts = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const state: any = location.state || {};

    const components = Array.isArray(state?.components)
        ? state.components
        : [];

    const lineIndex =
        typeof state?.lineIndex === "number" ? state.lineIndex : -1;

    const lineToEdit = state?.lineToEdit || null;

    const isEditLine = lineIndex >= 0 && Boolean(lineToEdit);

    const [selectedProduct, setSelectedProduct] = useState("");
    const [quantity, setQuantity] = useState("");
    const [rate, setRate] = useState("");
    const [amount, setAmount] = useState("");
    const [unitValue, setUnitValue] = useState("");
    const [lineRemarks, setLineRemarks] = useState("");

    const computedAmount = useMemo(() => {
        return (toNum(quantity) * toNum(rate)).toFixed(2);
    }, [quantity, rate]);

    useEffect(() => {
        if (!lineToEdit) return;

        setSelectedProduct(lineToEdit.productCode || "");
        setQuantity(String(lineToEdit.qty ?? lineToEdit.quantity ?? ""));
        setRate(String(lineToEdit.rate ?? ""));
        setAmount(String(lineToEdit.amount ?? ""));
        setUnitValue(lineToEdit.unit || "");
        setLineRemarks(String(lineToEdit.remarks ?? ""));
    }, [lineToEdit]);

    const handleProductChange = (value: string) => {
        setSelectedProduct(value);

        const item = componentDetails[value];

        if (item) {
            setUnitValue(item.unit);
            setRate(String(item.rate));

            const q = toNum(quantity);
            const r = toNum(item.rate);

            if (q > 0) {
                setAmount((q * r).toFixed(2));
            } else {
                setAmount("");
            }
        }
    };

    const handleQuantityChange = (value: string) => {
        const clean = sanitizeDecimal(value);

        setQuantity(clean);
        setAmount((toNum(clean) * toNum(rate)).toFixed(2));
    };

    const handleRateChange = (value: string) => {
        const clean = sanitizeDecimal(value);

        setRate(clean);
        setAmount((toNum(quantity) * toNum(clean)).toFixed(2));
    };

    const handleSave = useCallback(() => {
        if (!selectedProduct) {
            toast.error("Please select component");
            return;
        }

        if (!quantity || toNum(quantity) <= 0) {
            toast.error("Please enter quantity");
            return;
        }

        if (!unitValue) {
            toast.error("Please select unit");
            return;
        }

        if (rate === "" || toNum(rate) < 0) {
            toast.error("Please enter rate");
            return;
        }

        const detail = componentDetails[selectedProduct] || {};
        const amtStr = amount.trim() ? amount.trim() : computedAmount;

        const entry = {
            productCode: selectedProduct,
            product: detail.product || selectedProduct,
            productName: detail.product || selectedProduct,
            unit: unitValue,
            qty: String(quantity),
            quantity: String(quantity),
            rate: String(rate),
            amount: String(amtStr),
            remarks: String(lineRemarks || "").trim(),
        };

        const next = [...components];

        if (isEditLine) {
            next[lineIndex] = entry;
        } else {
            next.push(entry);
        }

        const totalBomCost = next.reduce((acc: number, item: any) => {
            return acc + toNum(item.amount);
        }, 0);

        navigate("/bookEz/engineering/create-edit-engineering-config", {
            state: {
                ...state,
                components: next,
                totalBomCost: String(totalBomCost),
                engineeringComponentsFromChild: true,
            },
            replace: true,
        });
    }, [
        selectedProduct,
        quantity,
        unitValue,
        rate,
        amount,
        computedAmount,
        lineRemarks,
        components,
        isEditLine,
        lineIndex,
        navigate,
        state,
    ]);

    return (
        <div className="flex h-full w-full flex-col bg-slate-50">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                >
                    <ArrowLeft size={20} />
                </button>

                <h1 className="text-xl font-black text-slate-900">
                    {isEditLine ? "Edit Component" : "Add Component"}
                </h1>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-4">
                <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <SelectField
                                label="Component"
                                value={selectedProduct}
                                onChange={handleProductChange}
                                options={componentOptions}
                                placeholder="Select Component"
                            />
                        </div>

                        <TextField
                            label="Quantity"
                            value={quantity}
                            onChange={handleQuantityChange}
                            placeholder="Quantity"
                            type="text"
                        />

                        <SelectField
                            label="Unit"
                            value={unitValue}
                            onChange={setUnitValue}
                            options={unitOptions}
                            placeholder="Unit"
                        />

                        <TextField
                            label="Rate"
                            value={rate}
                            onChange={handleRateChange}
                            placeholder="Rate"
                            type="text"
                        />

                        <TextField
                            label="Amount"
                            value={amount}
                            onChange={(value: string) =>
                                setAmount(sanitizeDecimal(value))
                            }
                            placeholder="Amount"
                            disabled
                            type="text"
                        />

                        <div className="md:col-span-2">
                            <TextField
                                label="Line Remarks"
                                value={lineRemarks}
                                onChange={setLineRemarks}
                                placeholder="Line remarks"
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-bold text-slate-500">
                            Gross:{" "}
                            <span className="font-black text-slate-900">
                                ₹{formatIndianNumber(computedAmount)}
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Save Button */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-4 shadow-lg">
                <div className="mx-auto max-w-4xl">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-lg font-black text-white transition hover:bg-blue-700"
                    >
                        <Save size={20} />
                        {isEditLine ? "Update" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EngineeringConfigRawProducts;