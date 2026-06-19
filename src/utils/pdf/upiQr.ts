import QRCode from "qrcode";

export const buildUpiLink = ({
    upiId,
    amount,
    invoiceNo,
    name,
}: any) => {
    if (!upiId) return "";

    const params = new URLSearchParams({
        pa: upiId,
        pn: name || "",
        am: Number(amount || 0).toFixed(2),
        cu: "INR",
        tn: `Invoice ${invoiceNo || ""}`,
        tr: String(invoiceNo || ""),
    });

    return `upi://pay?${params.toString()}`;
};

export const generateQrDataUrl = async (value: string) => {
    if (!value) return "";

    try {
        return await QRCode.toDataURL(value, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: "H",
        });
    } catch (error) {
        console.log("QR generate failed:", error);
        return "";
    }
};