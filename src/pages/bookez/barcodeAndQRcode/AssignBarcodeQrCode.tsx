import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Barcode from "react-barcode";
import QRCode from "qrcode";
import { Trash2 } from "lucide-react";
import { SelectInput, TextInput } from "../../../components/inputs";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import { getAllProducts } from "../../../redux/slices/professionalSlice/productMasterSlice";
import {
    createBarcodeQrAssignment,
    deleteBarcodeQrAssignment,
    getAllBarcodeQrAssignments,
    getAllBarcodeQrTemplates,
} from "../../../redux/slices/professionalSlice/BarCodeAndQRCode";

type CodeType = "barcode" | "qrcode";
type BarcodeType = "CODE128" | "CODE39";
type Orientation = "portrait" | "landscape";
type CodeSource = "auto" | "manual";
type ActiveTab = "assign" | "listing";
type BarcodeValuePartType = "string" | "date" | "day" | "month" | "year" | "increment";
type DateFormat = "DDMMYYYY" | "DD-MM-YYYY" | "YYYYMMDD";

type BarcodeValuePart = {
    id?: string;
    type: BarcodeValuePartType;
    value?: string;
    dateFormat?: DateFormat;
    incrementLength?: number;
    incrementStart?: number;
};

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
    barcodeValueFormat?: BarcodeValuePart[];
    separator?: string;
    labelSize: string;
    width: number;
    height: number;
    unit: "mm";
    orientation: Orientation;
    fields: TemplateFields;
    status: "active" | "inactive";
    createdAt?: string;
    updatedAt?: string;
};

type ProductMasterItem = {
    _id?: string;
    productCode: string;
    productName: string;
    productDescription?: string;
    productHSNCode?: string;
    sellingPrice?: string | number;
    purchasePrice?: string | number;
    mrp?: string | number;
    unit?: string;
    uom?: string;
    batchNumber?: any;
    serialNumber?: any;
    warehouse?: any;
    location?: any;
    manufacturingDate?: any;
    expiryDate?: any;
    dynamicFields?: Record<string, any>;
    [key: string]: any;
};

type ProductSnapshot = {
    productId: string;
    productCode: string;
    productName: string;
    hsnCode: string;
    uom: string;
    mrp: string;
    sellingPrice: string;
    batchNumber: string;
    serialNumber: string;
    warehouse: string;
    location: string;
    manufacturingDate: string;
    expiryDate: string;
};

type QrValue = {
    productCode: string;
    productName: string;
    hsnCode?: string;
    uom?: string;
    mrp?: string;
    sellingPrice?: string;
    batchNumber?: string;
    serialNumber?: string;
    warehouse?: string;
    location?: string;
    manufacturingDate?: string;
    expiryDate?: string;
};

type BarcodeAssignment = {
    _id?: string;
    assignmentCode?: string;
    templateCode: string;
    templateName?: string;
    productCode: string;
    productName?: string;
    codeSource: CodeSource;
    codeType: CodeType;
    barcodeType?: BarcodeType;
    codeValue?: string;
    qrValue?: QrValue;
    sequenceNumber?: number;
    status: "active" | "inactive";
    createdAt?: string;
    updatedAt?: string;
};

type FormState = {
    templateCode: string;
    productCode: string;
    codeSource: CodeSource;
    manualCode: string;
    status: "active" | "inactive";
};

const defaultPagination = {
    offset: 0,
    limit: 10,
    totalDocs: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
};

const CODE_SOURCE_OPTIONS = [
    { label: "Auto Generate", value: "auto" },
    { label: "Manual / Existing Code", value: "manual" },
];

const STATUS_OPTIONS = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
];

const valueToString = (value: any) => {
    if (value === undefined || value === null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (typeof value === "object") return String(value?.name ?? value?.label ?? value?.value ?? value?.code ?? "");
    return "";
};

const getProductField = (product: ProductMasterItem | null, keys: string[]) => {
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

const getProductSnapshot = (product: ProductMasterItem | null): ProductSnapshot => {
    if (!product) {
        return {
            productId: "",
            productCode: "",
            productName: "",
            hsnCode: "",
            uom: "",
            mrp: "",
            sellingPrice: "",
            batchNumber: "",
            serialNumber: "",
            warehouse: "",
            location: "",
            manufacturingDate: "",
            expiryDate: "",
        };
    }

    return {
        productId: valueToString(product?._id ?? product?.productId),
        productCode: valueToString(product?.productCode),
        productName: valueToString(product?.productName),
        hsnCode: getProductField(product, ["productHSNCode", "hsnCode", "HSNCode", "hsn"]),
        uom: getProductField(product, ["unit", "uom", "UOM", "productUOM", "productUnit"]),
        mrp: getProductField(product, ["mrp", "MRP", "productMRP"]),
        sellingPrice: getProductField(product, ["sellingPrice", "salePrice", "salesPrice", "productSellingPrice"]),
        batchNumber: getProductField(product, ["batchNumber", "batchNo", "batch"]),
        serialNumber: getProductField(product, ["serialNumber", "serialNo", "serial"]),
        warehouse: getProductField(product, ["warehouse", "warehouseName", "warehouseCode"]),
        location: getProductField(product, ["location", "locationName", "locationCode"]),
        manufacturingDate: getProductField(product, ["manufacturingDate", "manufactureDate", "mfgDate"]),
        expiryDate: getProductField(product, ["expiryDate", "expirationDate", "expDate"]),
    };
};

const pad2 = (value: string | number) => String(value).padStart(2, "0");

const formatDateValue = (value: string, format: DateFormat) => {
    if (!value) return "";

    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "";

    switch (format) {
        case "DD-MM-YYYY":
            return `${day}-${month}-${year}`;
        case "YYYYMMDD":
            return `${year}${month}${day}`;
        case "DDMMYYYY":
        default:
            return `${day}${month}${year}`;
    }
};

const getNextSequenceNumber = (template: BarcodeQrTemplate | null, assignments: BarcodeAssignment[]) => {
    if (!template) return 1;

    const incrementPart = template?.barcodeValueFormat?.find((part) => part.type === "increment");
    if (!incrementPart) return 1;

    const start = Math.max(0, Number(incrementPart?.incrementStart ?? 1));

    const templateAssignments = assignments.filter(
        (assignment) => assignment.templateCode === template.templateCode && typeof assignment.sequenceNumber === "number"
    );

    if (!templateAssignments.length) return start;

    const highestSequence = Math.max(...templateAssignments.map((assignment) => Number(assignment.sequenceNumber ?? 0)));

    return Math.max(start, highestSequence + 1);
};

const generateCodeValue = (template: BarcodeQrTemplate | null, sequenceNumber: number) => {
    if (!template) return "";

    const values = (template?.barcodeValueFormat || []).map((part) => {
        switch (part.type) {
            case "string":
                return part.value || "";
            case "date":
                return formatDateValue(part.value || "", part.dateFormat || "DDMMYYYY");
            case "day":
                return part.value ? pad2(part.value) : "";
            case "month":
                return part.value ? pad2(part.value) : "";
            case "year":
                return part.value || "";
            case "increment": {
                const length = Math.max(1, Number(part?.incrementLength ?? 4));
                return String(sequenceNumber).padStart(length, "0");
            }
            default:
                return "";
        }
    });

    return values.filter(Boolean).join(template?.separator || "");
};

const removeEmptyValues = (value: QrValue): QrValue => {
    return Object.fromEntries(
        Object.entries(value).filter(([, fieldValue]) => fieldValue !== "" && fieldValue !== null && fieldValue !== undefined)
    ) as QrValue;
};

const getDefaultForm = (): FormState => ({
    templateCode: "",
    productCode: "",
    codeSource: "auto",
    manualCode: "",
    status: "active",
});

const AssignBarcodeQrCode = () => {
    const dispatch = useDispatch<any>();

    const { products, loading: productsLoading, error: productError } = useSelector((state: any) => state.productMaster);

    const {
        templates = [],
        templateLoading = false,
        assignments = [],
        assignmentPagination = defaultPagination,
        assignmentLoading = false,
        assignmentCreateLoading = false,
        assignmentDeleteLoading = false,
        error: barcodeQrError,
    } = useSelector((state: any) => state.barcodeQr || {});
    console.log({ assignments })
    const [activeTab, setActiveTab] = useState<ActiveTab>("assign");
    const [form, setForm] = useState<FormState>(getDefaultForm());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [qrCodeUrl, setQrCodeUrl] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [apiError, setApiError] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const loadAllAssignmentsForAssign = async () => {
        await dispatch(
            getAllBarcodeQrAssignments({
                offset: 0,
                limit: 500,
                search: "",
                status: "",
                codeType: "",
                productCode: "",
                templateCode: "",
            })
        );
    };

    const loadAssignmentList = async () => {
        await dispatch(
            getAllBarcodeQrAssignments({
                offset: localOffset,
                limit: localLimit,
                search: "",
                status: "",
                codeType: "",
                productCode: "",
                templateCode: "",
            })
        );
    };

    const loadProducts = () => {
        dispatch(getAllProducts({ offset: 0, limit: 199, search: "", productType: "" }));
    };

    useEffect(() => {
        dispatch(getAllProducts({ offset: 0, limit: 199, search: "", productType: "" }));
        dispatch(getAllBarcodeQrTemplates({ offset: 0, limit: 500, search: "", status: "active", codeType: "" }));
        loadAllAssignmentsForAssign();
    }, [dispatch]);

    useEffect(() => {
        if (activeTab !== "listing") return;
        loadAssignmentList();
    }, [activeTab, localOffset, localLimit]);

    const handleTabChange = (tab: ActiveTab) => {
        setActiveTab(tab);
        setSuccessMessage("");
        setApiError("");

        if (tab === "listing") {
            setLocalOffset(0);
        } else {
            loadAllAssignmentsForAssign();
        }
    };

    const activeTemplates = useMemo(
        () => (templates || []).filter((template: BarcodeQrTemplate) => template?.status === "active"),
        [templates]
    );

    const templateOptions = useMemo(
        () =>
            activeTemplates.map((template: BarcodeQrTemplate) => ({
                label: `${template.templateName} (${template.templateCode})`,
                value: template.templateCode,
            })),
        [activeTemplates]
    );

    const productOptions = useMemo(
        () =>
            (products || [])
                .filter((product: ProductMasterItem) => product?.productCode)
                .map((product: ProductMasterItem) => ({
                    label: product?.productName ? `${product.productName} (${product.productCode})` : product.productCode,
                    value: product.productCode,
                })),
        [products]
    );

    const selectedTemplate = useMemo(
        () => activeTemplates.find((template: BarcodeQrTemplate) => template.templateCode === form.templateCode) || null,
        [activeTemplates, form.templateCode]
    );

    const selectedProduct = useMemo(
        () =>
            (products || []).find(
                (product: ProductMasterItem) => String(product?.productCode || "") === String(form.productCode || "")
            ) || null,
        [products, form.productCode]
    );

    const productData = useMemo(() => getProductSnapshot(selectedProduct), [selectedProduct]);

    const hasIncrement = useMemo(
        () => Boolean(selectedTemplate?.barcodeValueFormat?.some((part: BarcodeValuePart) => part.type === "increment")),
        [selectedTemplate]
    );

    const nextSequenceNumber = useMemo(
        () => getNextSequenceNumber(selectedTemplate, assignments || []),
        [selectedTemplate, assignments]
    );

    const autoGeneratedCode = useMemo(
        () => generateCodeValue(selectedTemplate, nextSequenceNumber),
        [selectedTemplate, nextSequenceNumber]
    );

    const finalCodeValue = useMemo(
        () => form.codeSource === "manual" ? form.manualCode.trim() : autoGeneratedCode,
        [form.codeSource, form.manualCode, autoGeneratedCode]
    );

    const qrValue = useMemo<QrValue | null>(() => {
        if (!selectedProduct) return null;

        return removeEmptyValues({
            productCode: productData.productCode,
            productName: productData.productName,
            hsnCode: productData.hsnCode,
            uom: productData.uom,
            mrp: productData.mrp,
            sellingPrice: productData.sellingPrice,
            batchNumber: productData.batchNumber,
            serialNumber: productData.serialNumber,
            warehouse: productData.warehouse,
            location: productData.location,
            manufacturingDate: productData.manufacturingDate,
            expiryDate: productData.expiryDate,
        });
    }, [selectedProduct, productData]);

    const qrEncodedValue = useMemo(() => {
        if (!qrValue) return "";
        return JSON.stringify(qrValue);
    }, [qrValue]);

    const assignmentColumns = useMemo(
        () => [
            {
                key: "templateCode",
                title: "Template Code",
            },
            {
                key: "productCode",
                title: "Product",
                render: (assignment: BarcodeAssignment) => (
                    <div>
                        <p className="font-medium">
                            {assignment.qrValue?.productName || assignment.productName || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {assignment.productCode || "-"}
                        </p>
                    </div>
                ),
            },
            {
                key: "codeType",
                title: "Code Type",
                render: (assignment: BarcodeAssignment) =>
                    assignment.codeType === "barcode" ? "Barcode" : "QR Code",
            },
            {
                key: "codeValue",
                title: "Barcode Value",
                render: (assignment: BarcodeAssignment) =>
                    assignment.codeType === "barcode" ? (
                        <span className="font-mono font-medium">
                            {assignment.codeValue || "-"}
                        </span>
                    ) : (
                        "-"
                    ),
            },
            {
                key: "codeSource",
                title: "Source",
                render: (assignment: BarcodeAssignment) =>
                    assignment.codeSource === "auto" ? "Auto Generate" : "Manual",
            },
            {
                key: "status",
                title: "Status",
                render: (assignment: BarcodeAssignment) => (
                    <span className="capitalize">
                        {assignment.status || "-"}
                    </span>
                ),
            },
            {
                key: "createdOn",
                title: "Created On",
                render: (assignment: BarcodeAssignment) =>
                    assignment.createdOn
                        ? new Date(assignment.createdOn).toLocaleString()
                        : "-",
            },
        ],
        []
    );

    const updateField = (key: keyof FormState, value: any) => {
        setForm((previous) => ({ ...previous, [key]: value }));
        setErrors((previous) => ({ ...previous, [key]: "" }));
        setSuccessMessage("");
        setApiError("");
    };

    const handleTemplateChange = (value: string) => {
        const template = activeTemplates.find((item: BarcodeQrTemplate) => item.templateCode === value);

        setForm((previous) => ({
            ...previous,
            templateCode: value,
            codeSource: template?.codeType === "qrcode" ? "auto" : previous.codeSource,
            manualCode: "",
        }));

        setErrors({});
        setSuccessMessage("");
        setApiError("");
    };

    const handleProductChange = (value: string) => {
        setForm((previous) => ({ ...previous, productCode: value }));
        setErrors((previous) => ({ ...previous, productCode: "" }));
        setSuccessMessage("");
        setApiError("");
    };

    useEffect(() => {
        if (selectedTemplate?.codeType !== "qrcode" || !qrEncodedValue) {
            setQrCodeUrl("");
            return;
        }

        let active = true;

        const generateQRCode = async () => {
            try {
                const value = await QRCode.toDataURL(qrEncodedValue, {
                    errorCorrectionLevel: "M",
                    margin: 1,
                    width: 400,
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
    }, [selectedTemplate, qrEncodedValue]);

    const previewSize = useMemo(() => {
        if (!selectedTemplate) return { width: 300, height: 150 };

        const rawWidth = selectedTemplate.orientation === "portrait" ? selectedTemplate.height : selectedTemplate.width;
        const rawHeight = selectedTemplate.orientation === "portrait" ? selectedTemplate.width : selectedTemplate.height;
        const safeWidth = Math.max(rawWidth, 1);
        const safeHeight = Math.max(rawHeight, 1);
        const scale = Math.min(4.5, 350 / safeWidth, 210 / safeHeight);

        return {
            width: safeWidth * scale,
            height: safeHeight * scale,
        };
    }, [selectedTemplate]);

    const barcodeHeight = useMemo(() => {
        if (!selectedTemplate) return 40;
        if (selectedTemplate.height <= 15) return 28;
        if (selectedTemplate.height <= 25) return 40;
        if (selectedTemplate.height <= 30) return 48;
        return 60;
    }, [selectedTemplate]);

    const qrSize = useMemo(() => {
        if (!selectedTemplate) return 65;
        if (selectedTemplate.height <= 15) return 42;
        if (selectedTemplate.height <= 25) return 65;
        if (selectedTemplate.height <= 30) return 78;
        return 95;
    }, [selectedTemplate]);

    const validate = () => {
        const nextErrors: Record<string, string> = {};

        if (!form.templateCode) nextErrors.templateCode = "Template is required";
        if (!form.productCode) nextErrors.productCode = "Product is required";

        if (selectedTemplate?.codeType === "barcode") {
            if (form.codeSource === "manual" && !form.manualCode.trim()) {
                nextErrors.manualCode = "Code value is required";
            }

            if (!finalCodeValue) nextErrors.codeValue = "Barcode value is empty";

            if (finalCodeValue) {
                const duplicate = (assignments || []).some(
                    (assignment: BarcodeAssignment) =>
                        assignment.codeType === "barcode" &&
                        assignment?.codeValue?.trim()?.toLowerCase() === finalCodeValue.trim().toLowerCase()
                );

                if (duplicate) nextErrors.codeValue = "This Barcode is already assigned";
            }
        }

        if (selectedTemplate?.codeType === "qrcode" && !qrValue) {
            nextErrors.codeValue = "QR Code product data is empty";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const resetForm = (keepTemplate = false) => {
        setForm((previous) => ({
            ...getDefaultForm(),
            templateCode: keepTemplate ? previous.templateCode : "",
        }));

        setErrors({});
        setApiError("");
    };

    const handleSave = async () => {
        if (!validate()) return;
        if (!selectedTemplate || !selectedProduct) return;

        try {
            setApiError("");
            setSuccessMessage("");

            const payload =
                selectedTemplate.codeType === "barcode"
                    ? {
                        templateCode: selectedTemplate.templateCode,
                        productCode: productData.productCode,
                        codeType: "barcode" as const,
                        barcodeType: selectedTemplate.barcodeType || "CODE128",
                        codeSource: form.codeSource,
                        codeValue: finalCodeValue,
                        sequenceNumber: form.codeSource === "auto" && hasIncrement ? nextSequenceNumber : undefined,
                        status: form.status,
                    }
                    : {
                        templateCode: selectedTemplate.templateCode,
                        productCode: productData.productCode,
                        codeType: "qrcode" as const,
                        codeSource: "auto" as const,
                        qrValue: qrValue || {},
                        status: form.status,
                    };

            const result = await dispatch(createBarcodeQrAssignment(payload)).unwrap();

            setSuccessMessage(
                selectedTemplate.codeType === "barcode"
                    ? `${finalCodeValue} assigned successfully to ${productData.productName}`
                    : `QR Code assigned successfully to ${productData.productName}`
            );

            console.log("BARCODE / QR ASSIGNMENT SAVED", result);

            await loadAllAssignmentsForAssign();

            resetForm(true);
        } catch (error: any) {
            console.error("Failed to save Barcode / QR assignment:", error);
            setSuccessMessage("");
            setApiError(error?.message || error?.error?.message || "Failed to assign Barcode / QR Code");
        }
    };

    const handleDelete = async (templateCode: string) => {
        try {
            setApiError("");
            setSuccessMessage("");

            await dispatch(deleteBarcodeQrAssignment(templateCode)).unwrap();
            setSuccessMessage("Assignment deleted successfully");
            if ((assignments?.length || 0) === 1 && localOffset > 0) {
                setLocalOffset((previous) => Math.max(0, previous - localLimit));
            } else {
                await loadAssignmentList();
            }
        } catch (error: any) {
            console.error("Failed to delete Barcode / QR assignment:", error);
            setApiError(error?.message || error?.error?.message || "Failed to delete Barcode / QR assignment");
        }
    };
    console.log({ assignmentPagination })
    return (
        <div className="flex h-auto w-full flex-col gap-3 p-4 text-card-foreground">
            <div className="border-b border-border">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => handleTabChange("assign")}
                        className={`relative px-4 py-2.5 text-sm font-semibold transition ${activeTab === "assign"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-card-foreground"
                            }`}
                    >
                        Assign Barcode / QR

                        {activeTab === "assign" ? (
                            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
                        ) : null}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleTabChange("listing")}
                        className={`relative px-4 py-2.5 text-sm font-semibold transition ${activeTab === "listing"
                                ? "text-primary"
                                : "text-muted-foreground hover:text-card-foreground"
                            }`}
                    >
                        Assigned List

                        {activeTab === "listing" ? (
                            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
                        ) : null}
                    </button>
                </div>
            </div>

            {successMessage ? (
                <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
                    {successMessage}
                </div>
            ) : null}

            {apiError || barcodeQrError ? (
                <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-medium text-danger">
                    {apiError || barcodeQrError}
                </div>
            ) : null}

            {activeTab === "assign" ? (
                <>
                    {!templateLoading && activeTemplates.length === 0 ? (
                        <div className="rounded-md border border-border bg-muted/20 p-4">
                            <p className="text-sm font-semibold">No active Barcode / QR Code template found.</p>
                            <p className="mt-1 text-sm text-muted-foreground">Create and save an active template first.</p>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
                        <div className="min-w-0 space-y-3">
                            <div className="rounded-md border border-border bg-card">
                                <div className="border-b border-border px-4 py-3">
                                    <h2 className="text-base font-semibold">Assignment Details</h2>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        Select template, product and code source.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
                                    <SelectInput
                                        label="Template"
                                        mandatory
                                        value={form.templateCode}
                                        error={errors.templateCode}
                                        options={templateOptions}
                                        placeholder={templateLoading ? "Loading Templates..." : "Select Template"}
                                        disabled={templateLoading}
                                        onChange={(event: any) => handleTemplateChange(event.target.value)}
                                    />

                                    <div className="lg:col-span-2">
                                        <SelectInput
                                            label="Product"
                                            mandatory
                                            value={form.productCode}
                                            error={errors.productCode || productError || ""}
                                            options={productOptions}
                                            placeholder={productsLoading ? "Loading Products..." : "Select Product"}
                                            disabled={productsLoading}
                                            largeData
                                            onChange={(event: any) => handleProductChange(event.target.value)}
                                        />
                                    </div>

                                    {selectedTemplate?.codeType !== "qrcode" ? (
                                        <SelectInput
                                            label="Code Source"
                                            value={form.codeSource}
                                            options={CODE_SOURCE_OPTIONS}
                                            onChange={(event: any) => updateField("codeSource", event.target.value)}
                                        />
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-card-foreground">Code Source</label>

                                            <div className="flex h-8 items-center rounded-sm border border-border bg-muted/40 px-3 text-sm">
                                                Auto Generate
                                            </div>
                                        </div>
                                    )}

                                    <SelectInput
                                        label="Status"
                                        value={form.status}
                                        options={STATUS_OPTIONS}
                                        onChange={(event: any) => updateField("status", event.target.value)}
                                    />
                                </div>
                            </div>

                            {selectedProduct ? (
                                <div className="rounded-md border border-border bg-card">
                                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                                        <div>
                                            <h2 className="text-base font-semibold">Selected Product</h2>
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                Product details loaded automatically from Product Master.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={loadProducts}
                                            disabled={productsLoading}
                                            className="h-8 rounded-sm border border-border bg-card px-3 text-sm font-medium transition hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {productsLoading ? "Loading..." : "Refresh"}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm md:grid-cols-3 lg:grid-cols-4">
                                        <div>
                                            <p className="text-muted-foreground">Product Code</p>
                                            <p className="mt-0.5 font-medium">{productData.productCode || "-"}</p>
                                        </div>

                                        <div>
                                            <p className="text-muted-foreground">Product Name</p>
                                            <p className="mt-0.5 font-medium">{productData.productName || "-"}</p>
                                        </div>

                                        <div>
                                            <p className="text-muted-foreground">HSN Code</p>
                                            <p className="mt-0.5 font-medium">{productData.hsnCode || "-"}</p>
                                        </div>

                                        <div>
                                            <p className="text-muted-foreground">UOM</p>
                                            <p className="mt-0.5 font-medium">{productData.uom || "-"}</p>
                                        </div>

                                        {productData.mrp ? (
                                            <div>
                                                <p className="text-muted-foreground">MRP</p>
                                                <p className="mt-0.5 font-medium">{productData.mrp}</p>
                                            </div>
                                        ) : null}

                                        {productData.sellingPrice ? (
                                            <div>
                                                <p className="text-muted-foreground">Selling Price</p>
                                                <p className="mt-0.5 font-medium">{productData.sellingPrice}</p>
                                            </div>
                                        ) : null}

                                        {productData.batchNumber ? (
                                            <div>
                                                <p className="text-muted-foreground">Batch</p>
                                                <p className="mt-0.5 font-medium">{productData.batchNumber}</p>
                                            </div>
                                        ) : null}

                                        {productData.serialNumber ? (
                                            <div>
                                                <p className="text-muted-foreground">Serial Number</p>
                                                <p className="mt-0.5 font-medium">{productData.serialNumber}</p>
                                            </div>
                                        ) : null}

                                        {productData.warehouse ? (
                                            <div>
                                                <p className="text-muted-foreground">Warehouse</p>
                                                <p className="mt-0.5 font-medium">{productData.warehouse}</p>
                                            </div>
                                        ) : null}

                                        {productData.location ? (
                                            <div>
                                                <p className="text-muted-foreground">Location</p>
                                                <p className="mt-0.5 font-medium">{productData.location}</p>
                                            </div>
                                        ) : null}

                                        {productData.manufacturingDate ? (
                                            <div>
                                                <p className="text-muted-foreground">Manufacturing Date</p>
                                                <p className="mt-0.5 font-medium">{productData.manufacturingDate}</p>
                                            </div>
                                        ) : null}

                                        {productData.expiryDate ? (
                                            <div>
                                                <p className="text-muted-foreground">Expiry Date</p>
                                                <p className="mt-0.5 font-medium">{productData.expiryDate}</p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}

                            {selectedTemplate?.codeType === "barcode" ? (
                                <div className="rounded-md border border-border bg-card">
                                    <div className="border-b border-border px-4 py-3">
                                        <h2 className="text-base font-semibold">Barcode</h2>
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            Generate from template or enter an existing Barcode.
                                        </p>
                                    </div>

                                    <div className="p-4">
                                        {form.codeSource === "manual" ? (
                                            <TextInput
                                                label="Code Value"
                                                mandatory
                                                value={form.manualCode}
                                                error={errors.manualCode || errors.codeValue}
                                                placeholder="Scan or enter Barcode"
                                                onChange={(event: any) => updateField("manualCode", event.target.value)}
                                            />
                                        ) : (
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-sm font-medium text-card-foreground">
                                                        Generated Code
                                                    </label>

                                                    <div
                                                        className={`flex h-8 items-center rounded-sm border bg-primary/5 px-3 ${errors.codeValue ? "border-danger" : "border-primary/40"
                                                            }`}
                                                    >
                                                        <span className="truncate font-mono text-sm font-semibold text-primary">
                                                            {autoGeneratedCode || "-"}
                                                        </span>
                                                    </div>

                                                    {errors.codeValue ? (
                                                        <p className="text-xs text-danger">{errors.codeValue}</p>
                                                    ) : null}
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <label className="text-sm font-medium text-card-foreground">
                                                        Next Increment
                                                    </label>

                                                    <div className="flex h-8 items-center rounded-sm border border-border bg-input px-3 text-sm font-medium">
                                                        {hasIncrement ? nextSequenceNumber : "Not Used"}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => resetForm(false)}
                                    disabled={assignmentCreateLoading}
                                    className="h-8 rounded-sm border border-border bg-card px-4 text-sm font-medium transition hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Clear
                                </button>

                                <button
                                    type="button"
                                    disabled={activeTemplates.length === 0 || assignmentCreateLoading}
                                    onClick={handleSave}
                                    className="h-8 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {assignmentCreateLoading ? "Assigning..." : "Assign Barcode / QR"}
                                </button>
                            </div>
                        </div>

                        <div className="min-w-0">
                            <div className="sticky top-3 overflow-hidden rounded-md border border-border bg-card">
                                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                                    <div>
                                        <h2 className="text-base font-semibold">Label Preview</h2>

                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {selectedTemplate
                                                ? `${selectedTemplate.width} mm × ${selectedTemplate.height} mm`
                                                : "Select Template"}
                                        </p>
                                    </div>

                                    {selectedTemplate ? (
                                        <div className="rounded-sm border border-primary/20 bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                                            {selectedTemplate.codeType === "barcode"
                                                ? selectedTemplate.barcodeType
                                                : "QR Code"}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="p-4">
                                    <div className="flex min-h-[260px] items-center justify-center overflow-auto rounded-md border border-dashed border-border bg-muted/20 p-4">
                                        {selectedTemplate ? (
                                            <div
                                                className="flex flex-col items-center justify-center overflow-hidden border border-slate-400 bg-white p-2 text-black shadow-sm"
                                                style={{
                                                    width: previewSize.width,
                                                    height: previewSize.height,
                                                    minWidth: previewSize.width,
                                                    minHeight: previewSize.height,
                                                }}
                                            >
                                                {selectedTemplate.fields?.productName ? (
                                                    <div className="mb-1 max-w-full truncate text-center text-[11px] font-semibold">
                                                        {productData.productName || "PRODUCT NAME"}
                                                    </div>
                                                ) : null}

                                                {selectedTemplate.codeType === "barcode" ? (
                                                    finalCodeValue ? (
                                                        <div className="max-w-full overflow-hidden">
                                                            <Barcode
                                                                value={finalCodeValue}
                                                                format={selectedTemplate.barcodeType || "CODE128"}
                                                                width={selectedTemplate.width <= 38 ? 0.8 : 1}
                                                                height={barcodeHeight}
                                                                displayValue={false}
                                                                margin={0}
                                                                background="#ffffff"
                                                                lineColor="#000000"
                                                            />
                                                        </div>
                                                    ) : null
                                                ) : qrCodeUrl ? (
                                                    <img
                                                        src={qrCodeUrl}
                                                        alt="QR Code"
                                                        style={{ width: qrSize, height: qrSize }}
                                                    />
                                                ) : null}

                                                {selectedTemplate.codeType === "barcode" ? (
                                                    <div className="mt-1 max-w-full break-all text-center font-mono text-[9px] font-semibold">
                                                        {finalCodeValue || "-"}
                                                    </div>
                                                ) : null}

                                                {selectedTemplate.fields?.productCode ? (
                                                    <div className="mt-0.5 text-center text-[9px]">
                                                        {productData.productCode || "PRD-000001"}
                                                    </div>
                                                ) : null}

                                                <div className="mt-1 flex max-w-full flex-wrap justify-center gap-x-2 gap-y-0.5 text-[8px]">
                                                    {selectedTemplate.fields?.mrp && productData.mrp ? (
                                                        <span>MRP: {productData.mrp}</span>
                                                    ) : null}

                                                    {selectedTemplate.fields?.sellingPrice && productData.sellingPrice ? (
                                                        <span>Price: {productData.sellingPrice}</span>
                                                    ) : null}

                                                    {selectedTemplate.fields?.hsnCode && productData.hsnCode ? (
                                                        <span>HSN: {productData.hsnCode}</span>
                                                    ) : null}

                                                    {selectedTemplate.fields?.uom && productData.uom ? (
                                                        <span>UOM: {productData.uom}</span>
                                                    ) : null}

                                                    {selectedTemplate.fields?.batchNumber && productData.batchNumber ? (
                                                        <span>Batch: {productData.batchNumber}</span>
                                                    ) : null}

                                                    {selectedTemplate.fields?.serialNumber && productData.serialNumber ? (
                                                        <span>Serial: {productData.serialNumber}</span>
                                                    ) : null}

                                                    {selectedTemplate.fields?.warehouse && productData.warehouse ? (
                                                        <span>WH: {productData.warehouse}</span>
                                                    ) : null}

                                                    {selectedTemplate.fields?.location && productData.location ? (
                                                        <span>LOC: {productData.location}</span>
                                                    ) : null}

                                                    {selectedTemplate.fields?.manufacturingDate &&
                                                        productData.manufacturingDate ? (
                                                        <span>MFG: {productData.manufacturingDate}</span>
                                                    ) : null}

                                                    {selectedTemplate.fields?.expiryDate && productData.expiryDate ? (
                                                        <span>EXP: {productData.expiryDate}</span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Select a template to preview the label.
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-3 rounded-md border border-border bg-muted/20 p-3">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                            <span className="text-muted-foreground">Template</span>
                                            <span className="truncate text-right font-medium">
                                                {selectedTemplate?.templateName || "-"}
                                            </span>

                                            <span className="text-muted-foreground">Product</span>
                                            <span className="truncate text-right font-medium">
                                                {productData.productName || "-"}
                                            </span>

                                            <span className="text-muted-foreground">Product Code</span>
                                            <span className="text-right font-medium">
                                                {productData.productCode || "-"}
                                            </span>

                                            <span className="text-muted-foreground">Code Type</span>
                                            <span className="text-right font-medium">
                                                {selectedTemplate?.codeType === "barcode"
                                                    ? "Barcode"
                                                    : selectedTemplate?.codeType === "qrcode"
                                                        ? "QR Code"
                                                        : "-"}
                                            </span>

                                            {selectedTemplate?.codeType === "barcode" ? (
                                                <>
                                                    <span className="text-muted-foreground">Source</span>
                                                    <span className="text-right font-medium">
                                                        {form.codeSource === "auto" ? "Auto Generate" : "Manual"}
                                                    </span>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>

                                    {selectedTemplate?.codeType === "barcode" ? (
                                        <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                                            <p className="text-sm font-medium">Code Value</p>
                                            <p className="mt-1 break-all font-mono text-sm font-semibold text-primary">
                                                {finalCodeValue || "-"}
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : null}

            {activeTab === "listing" ? (
                <>
                    <div className="h-[520px] min-h-[400px]">
                        <DataTable
                            columns={assignmentColumns}
                            data={assignments || []}
                            loading={assignmentLoading}
                            showFieldSelector
                            actions={(assignment: BarcodeAssignment) => (
                                <button
                                    type="button"
                                    title="Delete"
                                    disabled={assignmentDeleteLoading}
                                    onClick={() => handleDelete(assignment.templateCode)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-danger/40 text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        />
                    </div>

                    {assignmentPagination?.totalDocs > 0 ? (
                        <Pagination
                            {...{
                                localLimit,
                                selectCb: (event: any) => {
                                    setLocalLimit(Number(event.target.value));
                                    setLocalOffset(0);
                                },
                                preDisabled: !assignmentPagination?.hasPrevPage,
                                nextDisabled: !assignmentPagination?.hasNextPage,
                                setLocalOffset,
                                pagination: assignmentPagination,
                            }}
                        />
                    ) : null}
                </>
            ) : null}
        </div>
    );
};

export default AssignBarcodeQrCode;