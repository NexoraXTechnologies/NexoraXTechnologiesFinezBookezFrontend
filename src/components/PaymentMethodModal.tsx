import { useEffect, useMemo, useState } from "react";
import { X, Loader2, QrCode, Banknote } from "lucide-react";
import QRCode from "qrcode";

const toNum = (v: any) => {
    const n = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
};

const formatIndianNumber = (value: any) => {
    const num = toNum(value);

    return num.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });
};

const buildUpiLink = ({ upiId, amount, name }: any) => {
    if (!upiId) return "";

    const params = new URLSearchParams({
        pa: upiId,
        pn: name || "",
        am: Number(amount || 0).toFixed(2),
        cu: "INR",
    });

    return `upi://pay?${params.toString()}`;
};

const PaymentMethodModal = ({
    visible,
    onClose,
    company,
    amount,
    loadingCompany = false,
    onPressCollected,
}: any) => {
    const [selectedMethod, setSelectedMethod] = useState("cash");
    const [qrUri, setQrUri] = useState("");

    const upiUrl = useMemo(() => {
        return buildUpiLink({
            upiId: company?.upiId,
            amount,
            name: company?.companyName,
        });
    }, [company?.upiId, company?.companyName, amount]);

    const upiReady = Boolean(company?.upiId);

    useEffect(() => {
        const generateQr = async () => {
            try {
                if (!upiUrl) {
                    setQrUri("");
                    return;
                }

                const dataUrl = await QRCode.toDataURL(upiUrl, {
                    errorCorrectionLevel: "H",
                    margin: 2,
                    width: 240,
                });

                setQrUri(dataUrl);
            } catch (error) {
                console.log("QR generate error:", error);
                setQrUri("");
            }
        };

        generateQr();
    }, [upiUrl]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-[440px] overflow-hidden rounded-md bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            Collect Payment
                        </h2>
                        <p className="text-sm font-bold text-slate-400">
                            Select payment method and save bill
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    {/* Amount */}
                    <div className="mb-4 flex items-center justify-between rounded-md bg-slate-50 p-4">
                        <span className="text-sm font-black text-slate-500">Amount</span>
                        <span className="text-2xl font-black text-slate-900">
                            ₹ {formatIndianNumber(amount)}
                        </span>
                    </div>

                    {/* Method Buttons */}
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setSelectedMethod("cash")}
                            className={`flex h-12 items-center justify-center gap-2 rounded-md border text-sm font-black transition ${selectedMethod === "cash"
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <Banknote size={18} />
                            Cash
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedMethod("qr")}
                            className={`flex h-12 items-center justify-center gap-2 rounded-md border text-sm font-black transition ${selectedMethod === "qr"
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                        >
                            <QrCode size={18} />
                            QR / UPI
                        </button>
                    </div>

                    {/* Payment Preview */}
                    <div className="mb-5 flex min-h-[250px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 p-4">
                        {loadingCompany ? (
                            <div className="text-center">
                                <Loader2 className="mx-auto mb-3 animate-spin text-slate-900" />
                                <p className="text-sm font-black text-slate-500">
                                    Loading company details...
                                </p>
                            </div>
                        ) : selectedMethod === "cash" ? (
                            <div className="text-center">
                                <Banknote size={54} className="mx-auto mb-3 text-emerald-500" />
                                <p className="text-lg font-black text-slate-900">
                                    Cash Payment
                                </p>
                                <p className="mt-1 text-sm font-bold text-slate-500">
                                    Collect cash and click Save.
                                </p>
                            </div>
                        ) : !upiReady ? (
                            <div className="text-center">
                                <QrCode size={54} className="mx-auto mb-3 text-red-400" />
                                <p className="text-lg font-black text-red-600">
                                    UPI Not Configured
                                </p>
                                <p className="mt-1 text-sm font-bold text-slate-500">
                                    Please add UPI ID in company master.
                                </p>
                            </div>
                        ) : !qrUri ? (
                            <div className="text-center">
                                <Loader2 className="mx-auto mb-3 animate-spin text-slate-900" />
                                <p className="text-sm font-black text-slate-500">
                                    Generating QR...
                                </p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <p className="mb-3 text-sm font-black text-slate-900">
                                    Scan To Pay
                                </p>

                                <img
                                    src={qrUri}
                                    alt="UPI QR"
                                    className="mx-auto h-[190px] w-[190px] rounded-md bg-white p-2 shadow-sm"
                                />

                                <p className="mt-3 text-sm font-black text-slate-900">
                                    UPI ID: {company?.upiId}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Save */}
                    <button
                        type="button"
                        onClick={() => onPressCollected(selectedMethod)}
                        disabled={selectedMethod === "qr" && !upiReady}
                        className="h-12 w-full rounded-md bg-emerald-600 text-sm font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodModal;