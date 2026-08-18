import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Barcode from "react-barcode";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import { SelectInput, TextInput } from "../../../components/inputs";
import { PrimaryButton } from "../../../components/buttons";
import { getProductByCode } from "../../../redux/slices/professionalSlice/productMasterSlice";
import {
    getAllBarcodeQrAssignments,
    getAllBarcodeQrTemplates,
} from "../../../redux/slices/professionalSlice/BarCodeAndQRCode";

type CodeType = "barcode" | "qrcode";
type BarcodeType = "CODE128" | "CODE39";
type Orientation = "portrait" | "landscape";
type PrintTarget = "a4" | "labelPrinter";

type TemplateFields = {
    productName: boolean;
    productCode: boolean;
    mrp: boolean;
    sellingPrice: boolean;
    hsnCode: boolean;
    uom: boolean;
    batchNumber: boolean;
    serialNumber: boolean;
    manufacturingDate: boolean;
    expiryDate: boolean;
    warehouse: boolean;
    location: boolean;
};

type BarcodeQrTemplate = {
    _id?: string;
    templateCode: string;
    templateName: string;
    codeType: CodeType;
    barcodeType?: BarcodeType | null;
    labelSize: string;
    width: number;
    height: number;
    unit: "mm";
    orientation: Orientation;
    fields: TemplateFields;
    status: "active" | "inactive";
};

type BarcodeAssignment = {
    _id?: string;
    assignmentCode?: string;
    templateCode: string;
    productCode: string;
    productName?: string;
    codeType: CodeType;
    barcodeType?: BarcodeType;
    codeSource?: "auto" | "manual";
    codeValue?: string;
    qrValue?: Record<string, any> | string;
    sequenceNumber?: number;
    status: "active" | "inactive";
    createdOn?: string;
    createdBy?: string;
    modifiedOn?: string;
    modifiedBy?: string;
};

type ProductPrintData = {
    productCode: string;
    productName: string;
    batchNumber: string;
    serialNumber: string;
    warehouse: string;
    location: string;
    mrp: string;
    sellingPrice: string;
    hsnCode: string;
    uom: string;
    manufacturingDate: string;
    expiryDate: string;
};

type PrintForm = {
    assignmentCode: string;
    copies: number;
    printTarget: PrintTarget;
    labelSize: string;
    width: number;
    height: number;
    orientation: Orientation;
};

const PRINT_TARGET_OPTIONS = [
    { label: "A4 Sheet", value: "a4" },
    { label: "Label Printer", value: "labelPrinter" },
];

const LABEL_SIZE_OPTIONS = [
    { label: "25 mm x 15 mm", value: "25x15", width: 25, height: 15 },
    { label: "38 mm x 25 mm", value: "38x25", width: 38, height: 25 },
    { label: "50 mm x 25 mm", value: "50x25", width: 50, height: 25 },
    { label: "50 mm x 30 mm", value: "50x30", width: 50, height: 30 },
    { label: "75 mm x 50 mm", value: "75x50", width: 75, height: 50 },
    { label: "100 mm x 50 mm", value: "100x50", width: 100, height: 50 },
    { label: "Custom Size", value: "custom", width: 50, height: 25 },
];

const ORIENTATION_OPTIONS = [
    { label: "Landscape", value: "landscape" },
    { label: "Portrait", value: "portrait" },
];

const getDefaultForm = (): PrintForm => ({
    assignmentCode: "",
    copies: 1,
    printTarget: "a4",
    labelSize: "50x25",
    width: 50,
    height: 25,
    orientation: "landscape",
});

const valueToString = (value: any) => {
    if (value === undefined || value === null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (typeof value === "object") return String(value?.name ?? value?.label ?? value?.value ?? value?.code ?? "");
    return "";
};

const getProductField = (product: any, keys: string[]) => {
    if (!product) return "";

    const dynamicFields = product?.dynamicFields && typeof product.dynamicFields === "object" ? product.dynamicFields : {};

    for (const key of keys) {
        const directValue = product?.[key];

        if (directValue !== undefined && directValue !== null && directValue !== "") {
            return valueToString(directValue);
        }

        const dynamicValue = dynamicFields?.[key];

        if (dynamicValue !== undefined && dynamicValue !== null && dynamicValue !== "") {
            return valueToString(dynamicValue);
        }
    }

    const normalizedKeys = keys.map((key) => key.toLowerCase());

    for (const [key, value] of Object.entries(dynamicFields)) {
        if (normalizedKeys.includes(key.toLowerCase())) return valueToString(value);
    }

    return "";
};

const getQrObject = (qrValue: Record<string, any> | string | undefined) => {
    if (!qrValue) return {};

    if (typeof qrValue === "object") return qrValue;

    try {
        const parsed = JSON.parse(qrValue);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
};

const getAssignmentKey = (assignment: BarcodeAssignment) => {
    return assignment.assignmentCode || assignment._id || `${assignment.templateCode}-${assignment.productCode}`;
};

const BarcodeQrLabelPrint = () => {
    const dispatch = useDispatch<any>();
    const printSourceRef = useRef<HTMLDivElement | null>(null);

    const {
        templates = [],
        templateLoading = false,
        assignments = [],
        assignmentLoading = false,
        error: barcodeQrError,
    } = useSelector((state: any) => state.barcodeQr || {});

    const {
        selectedProduct,
        loading: productLoading,
    } = useSelector((state: any) => state.productMaster || {});

    const [form, setForm] = useState<PrintForm>(getDefaultForm());
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        dispatch(
            getAllBarcodeQrTemplates({
                offset: 0,
                limit: 500,
                search: "",
                status: "",
                codeType: "",
            })
        );

        dispatch(
            getAllBarcodeQrAssignments({
                offset: 0,
                limit: 500,
                search: "",
                status: "active",
                codeType: "",
                productCode: "",
                templateCode: "",
            })
        );
    }, [dispatch]);
    console.log({ assignments })
    const activeAssignments = useMemo(() => (assignments || []).filter((assignment: BarcodeAssignment) => assignment?.status === "active"),
        [assignments]
    );

    const assignmentOptions = useMemo(
        () =>
            activeAssignments.map((assignment: BarcodeAssignment) => {
                const qrObject = getQrObject(assignment.qrValue);
                const productName = assignment.productName || qrObject?.productName || assignment.productCode;
                const codeLabel = assignment.codeType === "barcode" ? assignment.codeValue || "Barcode" : "QR Code";

                return {
                    label: `${productName} - ${codeLabel}`,
                    value: getAssignmentKey(assignment),
                };
            }),
        [activeAssignments]
    );

    const selectedAssignment = useMemo(
        () =>
            activeAssignments.find(
                (assignment: BarcodeAssignment) => getAssignmentKey(assignment) === form.assignmentCode
            ) || null,
        [activeAssignments, form.assignmentCode]
    );

    const selectedTemplate = useMemo(
        () =>
            (templates || []).find(
                (template: BarcodeQrTemplate) => template.templateCode === selectedAssignment?.templateCode
            ) || null,
        [templates, selectedAssignment]
    );

    const selectedQrObject = useMemo(
        () => getQrObject(selectedAssignment?.qrValue),
        [selectedAssignment]
    );

    const productData = useMemo<ProductPrintData>(() => {
        return {
            productCode: valueToString(selectedProduct?.productCode || selectedQrObject?.productCode || selectedAssignment?.productCode),
            productName: valueToString(selectedProduct?.productName || selectedQrObject?.productName || selectedAssignment?.productName),
            batchNumber: getProductField(selectedProduct, ["batchNumber", "batchNo", "batch"]) || valueToString(selectedQrObject?.batchNumber),
            serialNumber: getProductField(selectedProduct, ["serialNumber", "serialNo", "serial"]) || valueToString(selectedQrObject?.serialNumber),
            warehouse: getProductField(selectedProduct, ["warehouse", "warehouseName", "warehouseCode"]) || valueToString(selectedQrObject?.warehouse),
            location: getProductField(selectedProduct, ["location", "locationName", "locationCode"]) || valueToString(selectedQrObject?.location),
            mrp: getProductField(selectedProduct, ["mrp", "MRP", "productMRP"]) || valueToString(selectedQrObject?.mrp),
            sellingPrice:
                getProductField(selectedProduct, ["sellingPrice", "salePrice", "salesPrice", "productSellingPrice"]) ||
                valueToString(selectedQrObject?.sellingPrice),
            hsnCode:
                getProductField(selectedProduct, ["productHSNCode", "hsnCode", "HSNCode", "hsn"]) ||
                valueToString(selectedQrObject?.hsnCode),
            uom:
                getProductField(selectedProduct, ["unit", "uom", "UOM", "productUOM", "productUnit"]) ||
                valueToString(selectedQrObject?.uom),
            manufacturingDate:
                getProductField(selectedProduct, ["manufacturingDate", "manufactureDate", "mfgDate"]) ||
                valueToString(selectedQrObject?.manufacturingDate),
            expiryDate:
                getProductField(selectedProduct, ["expiryDate", "expirationDate", "expDate"]) ||
                valueToString(selectedQrObject?.expiryDate),
        };
    }, [selectedProduct, selectedQrObject, selectedAssignment]);

    const largerSide = Math.max(form.width, form.height);
    const smallerSide = Math.min(form.width, form.height);
    const labelWidth = form.orientation === "landscape" ? largerSide : smallerSide;
    const labelHeight = form.orientation === "landscape" ? smallerSide : largerSide;
    const fields = selectedTemplate?.fields;

    const hasExtraFields = Boolean(
        (fields?.mrp && productData.mrp) ||
        (fields?.sellingPrice && productData.sellingPrice) ||
        (fields?.hsnCode && productData.hsnCode) ||
        (fields?.uom && productData.uom) ||
        (fields?.batchNumber && productData.batchNumber) ||
        (fields?.serialNumber && productData.serialNumber) ||
        (fields?.warehouse && productData.warehouse) ||
        (fields?.location && productData.location) ||
        (fields?.manufacturingDate && productData.manufacturingDate) ||
        (fields?.expiryDate && productData.expiryDate)
    );

    const qrEncodedValue = useMemo(() => {
        if (!selectedAssignment) return "";

        if (selectedAssignment.qrValue && typeof selectedAssignment.qrValue === "object") {
            return JSON.stringify(selectedAssignment.qrValue);
        }

        if (selectedAssignment.qrValue && typeof selectedAssignment.qrValue === "string") {
            return selectedAssignment.qrValue;
        }

        return "";
    }, [selectedAssignment]);

    useEffect(() => {
        if (selectedAssignment?.codeType !== "qrcode" || !qrEncodedValue) {
            setQrCodeUrl("");
            return;
        }

        let active = true;

        const generateQRCode = async () => {
            try {
                const value = await QRCode.toDataURL(qrEncodedValue, {
                    errorCorrectionLevel: "M",
                    margin: 1,
                    width: 800,
                });

                if (active) setQrCodeUrl(value);
            } catch (error) {
                console.error("QR Code generation failed:", error);
                if (active) setQrCodeUrl("");
            }
        };

        generateQRCode();

        return () => {
            active = false;
        };
    }, [selectedAssignment, qrEncodedValue]);

    const previewSize = useMemo(() => {
        const safeWidth = Math.max(labelWidth, 1);
        const safeHeight = Math.max(labelHeight, 1);
        const scale = Math.min(5.5, 400 / safeWidth, 260 / safeHeight);

        return {
            width: safeWidth * scale,
            height: safeHeight * scale,
        };
    }, [labelWidth, labelHeight]);

    const previewQrSize = useMemo(() => {
        let reservedHeight = 16;

        if (fields?.productName) reservedHeight += 16;
        if (fields?.productCode) reservedHeight += 10;
        if (hasExtraFields) reservedHeight += 16;

        const availableHeight = Math.max(35, previewSize.height - reservedHeight);
        const availableWidth = previewSize.width * 0.9;

        return Math.max(30, Math.min(availableWidth, availableHeight));
    }, [previewSize, fields, hasExtraFields]);

    const printCopies = useMemo(
        () => Array.from({ length: Math.max(1, form.copies) }, (_, index) => index),
        [form.copies]
    );

    const estimatedA4Columns = useMemo(() => {
        const usableWidth = 194;
        const gap = 2;

        return Math.max(1, Math.floor((usableWidth + gap) / (labelWidth + gap)));
    }, [labelWidth]);

    const estimatedA4Rows = useMemo(() => {
        const usableHeight = 281;
        const gap = 2;

        return Math.max(1, Math.floor((usableHeight + gap) / (labelHeight + gap)));
    }, [labelHeight]);

    const labelsPerA4Page = estimatedA4Columns * estimatedA4Rows;

    const handleAssignmentChange = (assignmentKey: string) => {
        const assignment = activeAssignments.find(
            (item: BarcodeAssignment) => getAssignmentKey(item) === assignmentKey
        );

        const template = (templates || []).find(
            (item: BarcodeQrTemplate) => item.templateCode === assignment?.templateCode
        );

        setError("");

        if (assignment?.productCode) {
            dispatch(getProductByCode(assignment.productCode));
        }

        if (!template) {
            setForm((previous) => ({
                ...previous,
                assignmentCode: assignmentKey,
            }));

            return;
        }

        setForm((previous) => ({
            ...previous,
            assignmentCode: assignmentKey,
            labelSize: template.labelSize || "custom",
            width: template.width || 50,
            height: template.height || 25,
            orientation: template.orientation || "landscape",
        }));
    };

    const handleLabelSizeChange = (value: string) => {
        const selectedSize = LABEL_SIZE_OPTIONS.find((option) => option.value === value);
        if (!selectedSize) return;

        setForm((previous) => ({
            ...previous,
            labelSize: value,
            width: value === "custom" ? previous.width : selectedSize.width,
            height: value === "custom" ? previous.height : selectedSize.height,
        }));
    };

    const handleCopiesChange = (value: string) => {
        const copies = Math.min(500, Math.max(1, Number(value || 1)));

        setForm((previous) => ({
            ...previous,
            copies,
        }));
    };

    const waitForImages = async (document: Document) => {
        const images = Array.from(document.images);

        await Promise.all(
            images.map(
                (image) =>
                    new Promise<void>((resolve) => {
                        if (image.complete) {
                            resolve();
                            return;
                        }

                        image.onload = () => resolve();
                        image.onerror = () => resolve();
                    })
            )
        );
    };

    const getPrintCss = () => {
        const productNameSize =
            labelHeight <= 15 ? "4pt" : labelHeight <= 25 ? "5.5pt" : labelHeight <= 30 ? "6.5pt" : "8pt";

        const codeValueSize =
            labelHeight <= 15 ? "3.5pt" : labelHeight <= 25 ? "4.5pt" : labelHeight <= 30 ? "5pt" : "6.5pt";

        const productCodeSize =
            labelHeight <= 15 ? "3pt" : labelHeight <= 25 ? "4pt" : labelHeight <= 30 ? "4.5pt" : "6pt";

        const extraFieldSize =
            labelHeight <= 15 ? "2.8pt" : labelHeight <= 25 ? "3.5pt" : labelHeight <= 30 ? "4pt" : "5.5pt";

        const commonCss = `
            * {
                box-sizing: border-box;
            }

            html,
            body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff;
                font-family: Arial, Helvetica, sans-serif;
            }

            .print-label {
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
                min-width: ${labelWidth}mm;
                min-height: ${labelHeight}mm;
                max-width: ${labelWidth}mm;
                max-height: ${labelHeight}mm;
                padding: ${labelHeight <= 15 ? "0.5mm" : "0.8mm"};
                display: flex;
                flex-direction: column;
                align-items: stretch;
                justify-content: stretch;
                overflow: hidden;
                background: #ffffff;
                color: #000000;
                border: 0.2mm solid #d0d0d0;
                break-inside: avoid;
                page-break-inside: avoid;
            }

            .product-name {
                width: 100%;
                flex: 0 0 auto;
                padding-bottom: 0.4mm;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                text-align: center;
                font-size: ${productNameSize};
                line-height: 1;
                font-weight: 700;
            }

            .code-area {
                width: 100%;
                flex: 1 1 0;
                min-width: 0;
                min-height: 0;
                display: flex;
                align-items: stretch;
                justify-content: stretch;
                overflow: hidden;
            }

            .barcode-wrapper {
                width: 100%;
                height: 100%;
                min-width: 0;
                min-height: 0;
                display: flex;
                align-items: stretch;
                justify-content: stretch;
                overflow: hidden;
            }

            .barcode-wrapper svg {
                width: 100% !important;
                height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                display: block !important;
            }

            .qr-wrapper {
                width: 100%;
                height: 100%;
                min-width: 0;
                min-height: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }

            .qr-image {
                width: 100%;
                height: 100%;
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
                display: block;
            }

            .code-value {
                width: 100%;
                flex: 0 0 auto;
                padding-top: 0.3mm;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                text-align: center;
                font-family: monospace;
                font-size: ${codeValueSize};
                line-height: 1;
                font-weight: 600;
            }

            .product-code {
                width: 100%;
                flex: 0 0 auto;
                padding-top: 0.2mm;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                text-align: center;
                font-size: ${productCodeSize};
                line-height: 1;
            }

            .extra-fields {
                width: 100%;
                flex: 0 0 auto;
                padding-top: 0.3mm;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: center;
                gap: 0.2mm 1mm;
                overflow: hidden;
                font-size: ${extraFieldSize};
                line-height: 1;
            }

            .extra-fields span {
                white-space: nowrap;
            }
        `;

        if (form.printTarget === "a4") {
            return `
                ${commonCss}

                @page {
                    size: A4 portrait;
                    margin: 8mm;
                }

                body {
                    width: auto;
                    min-height: auto;
                }

                .print-sheet {
                    width: 100%;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, ${labelWidth}mm);
                    grid-auto-rows: ${labelHeight}mm;
                    gap: 2mm;
                    align-items: start;
                    justify-content: start;
                    align-content: start;
                }

                .print-label {
                    margin: 0;
                    page-break-after: auto;
                    break-after: auto;
                }

                @media print {
                    .print-sheet {
                        display: grid !important;
                        grid-template-columns: repeat(auto-fill, ${labelWidth}mm) !important;
                        grid-auto-rows: ${labelHeight}mm !important;
                        gap: 2mm !important;
                    }
                }
            `;
        }

        return `
            ${commonCss}

            @page {
                size: ${labelWidth}mm ${labelHeight}mm;
                margin: 0;
            }

            html,
            body {
                width: ${labelWidth}mm;
            }

            .print-roll {
                width: ${labelWidth}mm;
                margin: 0;
                padding: 0;
            }

            .print-roll .print-label {
                margin: 0;
                border: none;
                page-break-after: always;
                break-after: page;
            }

            .print-roll .print-label:last-child {
                page-break-after: auto;
                break-after: auto;
            }
        `;
    };

    const handlePrint = async () => {
        if (!selectedAssignment) {
            setError("Please select Barcode / QR Code to print.");
            return;
        }

        if (form.copies < 1) {
            setError("Number of labels must be at least 1.");
            return;
        }

        if (selectedAssignment.codeType === "qrcode" && !qrCodeUrl) {
            setError("QR Code is still loading.");
            return;
        }

        if (!printSourceRef.current) {
            setError("Print content not found.");
            return;
        }

        setError("");

        const iframe = document.createElement("iframe");

        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "1px";
        iframe.style.height = "1px";
        iframe.style.border = "0";
        iframe.style.opacity = "0";

        iframe.setAttribute("aria-hidden", "true");

        document.body.appendChild(iframe);

        const printDocument = iframe.contentDocument || iframe.contentWindow?.document;

        if (!printDocument) {
            document.body.removeChild(iframe);
            setError("Unable to create print document.");
            return;
        }

        const labelHtml = printSourceRef.current.innerHTML;

        printDocument.open();
        printDocument.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8" />
                    <title>Barcode / QR Label Print</title>
                    <style>${getPrintCss()}</style>
                </head>
                <body>${labelHtml}</body>
            </html>
        `);
        printDocument.close();

        await waitForImages(printDocument);

        const printWindow = iframe.contentWindow;

        if (!printWindow) {
            document.body.removeChild(iframe);
            setError("Unable to open print window.");
            return;
        }

        printWindow.focus();

        setTimeout(() => {
            printWindow.print();

            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1500);
        }, 300);
    };

    const renderPreviewLabel = () => {
        if (!selectedAssignment) return null;

        return (
            <div
                className="flex flex-col overflow-hidden border border-slate-400 bg-white p-2 text-black shadow-sm"
                style={{
                    width: previewSize.width,
                    height: previewSize.height,
                }}
            >
                {fields?.productName ? (
                    <div
                        className="w-full shrink-0 truncate text-center font-semibold"
                        style={{
                            fontSize:
                                previewSize.height <= 100
                                    ? 8
                                    : previewSize.height <= 160
                                        ? 10
                                        : 12,
                        }}
                    >
                        {productData.productName || "-"}
                    </div>
                ) : null}

                <div className="flex min-h-0 w-full flex-1 items-stretch justify-stretch overflow-hidden py-1">
                    {selectedAssignment.codeType === "barcode" ? (
                        <div className="barcode-preview flex h-full w-full items-stretch justify-stretch overflow-hidden">
                            <Barcode
                                value={selectedAssignment.codeValue || ""}
                                format={selectedAssignment.barcodeType || selectedTemplate?.barcodeType || "CODE128"}
                                width={1}
                                height={100}
                                displayValue={false}
                                margin={0}
                                background="#ffffff"
                                lineColor="#000000"
                            />
                        </div>
                    ) : qrCodeUrl ? (
                        <div className="flex h-full w-full items-center justify-center overflow-hidden">
                            <img
                                src={qrCodeUrl}
                                alt="QR Code"
                                className="block object-contain"
                                style={{
                                    width: previewQrSize,
                                    height: previewQrSize,
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                }}
                            />
                        </div>
                    ) : null}
                </div>

                {selectedAssignment.codeType === "barcode" ? (
                    <div
                        className="w-full shrink-0 truncate text-center font-mono font-semibold"
                        style={{
                            fontSize: previewSize.height <= 100 ? 7 : 9,
                        }}
                    >
                        {selectedAssignment.codeValue || "-"}
                    </div>
                ) : null}

                {fields?.productCode ? (
                    <div
                        className="w-full shrink-0 truncate text-center"
                        style={{
                            fontSize: previewSize.height <= 100 ? 7 : 9,
                        }}
                    >
                        {productData.productCode || "-"}
                    </div>
                ) : null}

                {hasExtraFields ? (
                    <div
                        className="mt-1 flex w-full shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 overflow-hidden"
                        style={{
                            fontSize: previewSize.height <= 100 ? 6 : 8,
                        }}
                    >
                        {fields?.mrp && productData.mrp ? <span>MRP: {productData.mrp}</span> : null}
                        {fields?.sellingPrice && productData.sellingPrice ? <span>Price: {productData.sellingPrice}</span> : null}
                        {fields?.hsnCode && productData.hsnCode ? <span>HSN: {productData.hsnCode}</span> : null}
                        {fields?.uom && productData.uom ? <span>UOM: {productData.uom}</span> : null}
                        {fields?.batchNumber && productData.batchNumber ? <span>Batch: {productData.batchNumber}</span> : null}
                        {fields?.serialNumber && productData.serialNumber ? <span>Serial: {productData.serialNumber}</span> : null}
                        {fields?.warehouse && productData.warehouse ? <span>WH: {productData.warehouse}</span> : null}
                        {fields?.location && productData.location ? <span>LOC: {productData.location}</span> : null}
                        {fields?.manufacturingDate && productData.manufacturingDate ? <span>MFG: {productData.manufacturingDate}</span> : null}
                        {fields?.expiryDate && productData.expiryDate ? <span>EXP: {productData.expiryDate}</span> : null}
                    </div>
                ) : null}
            </div>
        );
    };

    const renderPrintLabel = (index: number) => {
        if (!selectedAssignment) return null;

        return (
            <div
                key={`${getAssignmentKey(selectedAssignment)}-${index}`}
                className="print-label"
            >
                {fields?.productName ? (
                    <div className="product-name">
                        {productData.productName || "-"}
                    </div>
                ) : null}

                <div className="code-area">
                    {selectedAssignment.codeType === "barcode" ? (
                        <div className="barcode-wrapper">
                            <Barcode
                                value={selectedAssignment.codeValue || ""}
                                format={selectedAssignment.barcodeType || selectedTemplate?.barcodeType || "CODE128"}
                                width={1}
                                height={100}
                                displayValue={false}
                                margin={0}
                                background="#ffffff"
                                lineColor="#000000"
                            />
                        </div>
                    ) : qrCodeUrl ? (
                        <div className="qr-wrapper">
                            <img
                                src={qrCodeUrl}
                                alt="QR Code"
                                className="qr-image"
                            />
                        </div>
                    ) : null}
                </div>

                {selectedAssignment.codeType === "barcode" ? (
                    <div className="code-value">
                        {selectedAssignment.codeValue || "-"}
                    </div>
                ) : null}

                {fields?.productCode ? (
                    <div className="product-code">
                        {productData.productCode || "-"}
                    </div>
                ) : null}

                {hasExtraFields ? (
                    <div className="extra-fields">
                        {fields?.mrp && productData.mrp ? <span>MRP: {productData.mrp}</span> : null}
                        {fields?.sellingPrice && productData.sellingPrice ? <span>Price: {productData.sellingPrice}</span> : null}
                        {fields?.hsnCode && productData.hsnCode ? <span>HSN: {productData.hsnCode}</span> : null}
                        {fields?.uom && productData.uom ? <span>UOM: {productData.uom}</span> : null}
                        {fields?.batchNumber && productData.batchNumber ? <span>Batch: {productData.batchNumber}</span> : null}
                        {fields?.serialNumber && productData.serialNumber ? <span>Serial: {productData.serialNumber}</span> : null}
                        {fields?.warehouse && productData.warehouse ? <span>WH: {productData.warehouse}</span> : null}
                        {fields?.location && productData.location ? <span>LOC: {productData.location}</span> : null}
                        {fields?.manufacturingDate && productData.manufacturingDate ? <span>MFG: {productData.manufacturingDate}</span> : null}
                        {fields?.expiryDate && productData.expiryDate ? <span>EXP: {productData.expiryDate}</span> : null}
                    </div>
                ) : null}
            </div>
        );
    };

    return (
        <>
            <style>
                {`
                    .barcode-preview svg {
                        width: 100% !important;
                        height: 100% !important;
                        max-width: 100% !important;
                        max-height: 100% !important;
                        display: block !important;
                    }
                `}
            </style>

            <div className="flex h-auto w-full flex-col gap-3 rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-card-foreground">
                            Barcode / QR Label Print
                        </h1>

                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Print multiple labels on an A4 sheet or one sticker per page on a label printer.
                        </p>
                    </div>
                </div>

                {error || barcodeQrError ? (
                    <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                        {error || barcodeQrError}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="min-w-0 space-y-3">
                        <div className="rounded-md border border-border bg-card">
                            <div className="border-b border-border px-4 py-3">
                                <h2 className="text-base font-semibold">
                                    Print Selection
                                </h2>

                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Select code, printer type and number of labels.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                                <SelectInput
                                    label="Barcode / QR Code"
                                    mandatory
                                    value={form.assignmentCode}
                                    options={assignmentOptions}
                                    placeholder={
                                        assignmentLoading
                                            ? "Loading Barcode / QR Code..."
                                            : "Select Barcode / QR Code"
                                    }
                                    disabled={assignmentLoading || templateLoading}
                                    largeData
                                    onChange={(event: any) =>
                                        handleAssignmentChange(event.target.value)
                                    }
                                />

                                <SelectInput
                                    label="Print On"
                                    value={form.printTarget}
                                    options={PRINT_TARGET_OPTIONS}
                                    onChange={(event: any) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            printTarget: event.target.value,
                                        }))
                                    }
                                />

                                <TextInput
                                    label="Number of Labels"
                                    mandatory
                                    type="number"
                                    value={form.copies}
                                    onChange={(event: any) =>
                                        handleCopiesChange(event.target.value)
                                    }
                                />

                                <SelectInput
                                    label="Label Size"
                                    value={form.labelSize}
                                    options={LABEL_SIZE_OPTIONS}
                                    onChange={(event: any) =>
                                        handleLabelSizeChange(event.target.value)
                                    }
                                />

                                <SelectInput
                                    label="Label Orientation"
                                    value={form.orientation}
                                    options={ORIENTATION_OPTIONS}
                                    onChange={(event: any) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            orientation: event.target.value,
                                        }))
                                    }
                                />

                                {form.labelSize === "custom" ? (
                                    <>
                                        <TextInput
                                            label="Width (mm)"
                                            type="number"
                                            value={form.width}
                                            onChange={(event: any) =>
                                                setForm((previous) => ({
                                                    ...previous,
                                                    width: Math.max(
                                                        1,
                                                        Number(event.target.value || 1)
                                                    ),
                                                }))
                                            }
                                        />

                                        <TextInput
                                            label="Height (mm)"
                                            type="number"
                                            value={form.height}
                                            onChange={(event: any) =>
                                                setForm((previous) => ({
                                                    ...previous,
                                                    height: Math.max(
                                                        1,
                                                        Number(event.target.value || 1)
                                                    ),
                                                }))
                                            }
                                        />
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {form.printTarget === "a4" ? (
                            <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-4">
                                    <div>
                                        <p className="text-muted-foreground">
                                            Columns
                                        </p>

                                        <p className="mt-0.5 font-semibold">
                                            {estimatedA4Columns}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Rows
                                        </p>

                                        <p className="mt-0.5 font-semibold">
                                            {estimatedA4Rows}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Labels / Page
                                        </p>

                                        <p className="mt-0.5 font-semibold">
                                            {labelsPerA4Page}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Required Pages
                                        </p>

                                        <p className="mt-0.5 font-semibold">
                                            {Math.ceil(
                                                form.copies / labelsPerA4Page
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {selectedAssignment ? (
                            <div className="rounded-md border border-border bg-card">
                                <div className="border-b border-border px-4 py-3">
                                    <h2 className="text-base font-semibold">
                                        Print Details
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm md:grid-cols-3">
                                    <div>
                                        <p className="text-muted-foreground">
                                            Product
                                        </p>

                                        <p className="mt-0.5 font-medium">
                                            {productLoading
                                                ? "Loading..."
                                                : productData.productName || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Product Code
                                        </p>

                                        <p className="mt-0.5 font-medium">
                                            {productData.productCode || "-"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Code Type
                                        </p>

                                        <p className="mt-0.5 font-medium">
                                            {selectedAssignment.codeType ===
                                                "barcode"
                                                ? "Barcode"
                                                : "QR Code"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Label Size
                                        </p>

                                        <p className="mt-0.5 font-medium">
                                            {labelWidth} × {labelHeight} mm
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Copies
                                        </p>

                                        <p className="mt-0.5 font-medium">
                                            {form.copies}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-muted-foreground">
                                            Print On
                                        </p>

                                        <p className="mt-0.5 font-medium">
                                            {form.printTarget === "a4"
                                                ? "A4 Sheet"
                                                : "Label Printer"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="min-w-0">
                        <div className="sticky top-3 overflow-hidden rounded-md border border-border bg-card">
                            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                                <div>
                                    <h2 className="text-base font-semibold">
                                        Label Preview
                                    </h2>

                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {labelWidth} mm × {labelHeight} mm
                                    </p>
                                </div>

                                {selectedAssignment ? (
                                    <div className="rounded-sm border border-primary/20 bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                                        {selectedAssignment.codeType ===
                                            "barcode"
                                            ? selectedAssignment.barcodeType ||
                                            selectedTemplate?.barcodeType ||
                                            "Barcode"
                                            : "QR Code"}
                                    </div>
                                ) : null}
                            </div>

                            <div className="p-4">
                                <div className="flex min-h-[300px] items-center justify-center overflow-auto rounded-md border border-dashed border-border bg-muted/20 p-4">
                                    {selectedAssignment ? (
                                        renderPreviewLabel()
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Select Barcode / QR Code to preview label.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-border bg-muted/20 p-3 text-sm">
                                    <span className="text-muted-foreground">
                                        Print On
                                    </span>

                                    <span className="text-right font-medium">
                                        {form.printTarget === "a4"
                                            ? "A4 Sheet"
                                            : "Label Printer"}
                                    </span>

                                    <span className="text-muted-foreground">
                                        Copies
                                    </span>

                                    <span className="text-right font-medium">
                                        {form.copies}
                                    </span>

                                    <span className="text-muted-foreground">
                                        Label Size
                                    </span>

                                    <span className="text-right font-medium">
                                        {labelWidth} × {labelHeight} mm
                                    </span>

                                    {form.printTarget === "a4" ? (
                                        <>
                                            <span className="text-muted-foreground">
                                                Labels Per Row
                                            </span>

                                            <span className="text-right font-medium">
                                                {estimatedA4Columns}
                                            </span>

                                            <span className="text-muted-foreground">
                                                Labels Per A4
                                            </span>

                                            <span className="text-right font-medium">
                                                {labelsPerA4Page}
                                            </span>
                                        </>
                                    ) : null}
                                </div>

                                <PrimaryButton
                                    callBackFn={handlePrint}
                                    text={`Print ${form.copies} Label${form.copies === 1 ? "" : "s"
                                        }`}
                                    icon={<Printer size={16} />}
                                    disabled={!selectedAssignment}
                                    className="mt-3 w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                ref={printSourceRef}
                style={{ display: "none" }}
            >
                {selectedAssignment ? (
                    form.printTarget === "a4" ? (
                        <div className="print-sheet">
                            {printCopies.map((index) =>
                                renderPrintLabel(index)
                            )}
                        </div>
                    ) : (
                        <div className="print-roll">
                            {printCopies.map((index) =>
                                renderPrintLabel(index)
                            )}
                        </div>
                    )
                ) : null}
            </div>
        </>
    );
};

export default BarcodeQrLabelPrint;