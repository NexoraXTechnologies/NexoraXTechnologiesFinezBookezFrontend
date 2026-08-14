import {
    useEffect,
    useMemo,
    useState,
} from "react";
import type { ReactNode } from "react";
import Barcode from "react-barcode";
import QRCode from "qrcode";
import {
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
} from "lucide-react";

import {
    Checkbox,
    SelectInput,
    TextInput,
} from "../../../components/inputs";

type CodeType =
    | "barcode"
    | "qrcode";

type BarcodeType =
    | "CODE128"
    | "CODE39";

type Orientation =
    | "portrait"
    | "landscape";

type BarcodeValuePartType =
    | "string"
    | "date"
    | "day"
    | "month"
    | "year"
    | "increment";

type DateFormat =
    | "DDMMYYYY"
    | "DD-MM-YYYY"
    | "YYYYMMDD";

type BarcodeValuePart = {
    id: string;
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

type BarcodeQrTemplateForm = {
    templateName: string;
    codeType: CodeType;
    barcodeType: BarcodeType;
    barcodeValueFormat: BarcodeValuePart[];
    separator: string;
    labelSize: string;
    width: number;
    height: number;
    unit: "mm";
    orientation: Orientation;
    fields: TemplateFields;
    status:
    | "active"
    | "inactive";
};

type BarcodeQrTemplateRecord =
    BarcodeQrTemplateForm & {
        templateCode: string;
        createdAt: string;
        updatedAt: string;
    };

type BarcodeQrTemplateProps = {
    onSave?: (
        payload: BarcodeQrTemplateRecord
    ) => void;
};

const BARCODE_TEMPLATE_STORAGE_KEY =
    "bookez_barcode_qr_templates";

const CODE_TYPE_OPTIONS = [
    {
        label: "Barcode",
        value: "barcode",
    },
    {
        label: "QR Code",
        value: "qrcode",
    },
];

const BARCODE_TYPE_OPTIONS = [
    {
        label: "CODE 128",
        value: "CODE128",
    },
    {
        label: "CODE 39",
        value: "CODE39",
    },
];

const LABEL_SIZE_OPTIONS = [
    {
        label: "25 mm x 15 mm",
        value: "25x15",
        width: 25,
        height: 15,
    },
    {
        label: "38 mm x 25 mm",
        value: "38x25",
        width: 38,
        height: 25,
    },
    {
        label: "50 mm x 25 mm",
        value: "50x25",
        width: 50,
        height: 25,
    },
    {
        label: "50 mm x 30 mm",
        value: "50x30",
        width: 50,
        height: 30,
    },
    // {
    //     label: "75 mm x 50 mm",
    //     value: "75x50",
    //     width: 75,
    //     height: 50,
    // },
    // {
    //     label: "100 mm x 50 mm",
    //     value: "100x50",
    //     width: 100,
    //     height: 50,
    // },
    // {
    //     label: "Custom Size",
    //     value: "custom",
    //     width: 50,
    //     height: 25,
    // },
];

const ORIENTATION_OPTIONS = [
    {
        label: "Landscape",
        value: "landscape",
    },
    {
        label: "Portrait",
        value: "portrait",
    },
];

const STATUS_OPTIONS = [
    {
        label: "Active",
        value: "active",
    },
    {
        label: "Inactive",
        value: "inactive",
    },
];

const SEPARATOR_OPTIONS = [
    {
        label: "None",
        value: "",
    },
    {
        label: "Hyphen (-)",
        value: "-",
    },
    {
        label: "Slash (/)",
        value: "/",
    },
    {
        label: "Underscore (_)",
        value: "_",
    },
];

const VALUE_PART_OPTIONS = [
    {
        label: "String",
        value: "string",
    },
    {
        label: "Date",
        value: "date",
    },
    {
        label: "Day",
        value: "day",
    },
    {
        label: "Month",
        value: "month",
    },
    {
        label: "Year",
        value: "year",
    },
    {
        label: "Increment",
        value: "increment",
    },
];

const DATE_FORMAT_OPTIONS = [
    {
        label: "DDMMYYYY",
        value: "DDMMYYYY",
    },
    {
        label: "DD-MM-YYYY",
        value: "DD-MM-YYYY",
    },
    {
        label: "YYYYMMDD",
        value: "YYYYMMDD",
    },
];

const PRINT_FIELDS: {
    key: keyof TemplateFields;
    label: string;
}[] = [
        {
            key: "productName",
            label: "Product Name",
        },
        {
            key: "productCode",
            label: "Product Code",
        },
        {
            key: "mrp",
            label: "MRP",
        },
        {
            key: "sellingPrice",
            label: "Selling Price",
        },
        {
            key: "hsnCode",
            label: "HSN Code",
        },
        {
            key: "uom",
            label: "UOM",
        },
        {
            key: "batchNumber",
            label: "Batch Number",
        },
        {
            key: "serialNumber",
            label: "Serial Number",
        },
        {
            key: "manufacturingDate",
            label: "Manufacturing Date",
        },
        {
            key: "expiryDate",
            label: "Expiry Date",
        },
        {
            key: "warehouse",
            label: "Warehouse",
        },
        {
            key: "location",
            label: "Location",
        },
    ];

const PREVIEW_PRODUCT = {
    productCode: "PRD-000001",
    productName: "NEW FOR TESTING",
    mrp: "₹250.00",
    sellingPrice: "₹225.00",
    hsnCode: "0101",
    uom: "PCS",
    batchNumber: "BAT-001",
    serialNumber: "SER-001",
    manufacturingDate: "12/08/2026",
    expiryDate: "12/08/2027",
    warehouse: "Main Warehouse",
    location: "A-01",
};

const pad2 = (
    value: string | number
) => {
    return String(value).padStart(
        2,
        "0"
    );
};

const getTodayParts = () => {
    const date = new Date();

    return {
        date: [
            date.getFullYear(),
            pad2(
                date.getMonth() + 1
            ),
            pad2(
                date.getDate()
            ),
        ].join("-"),

        day: pad2(
            date.getDate()
        ),

        month: pad2(
            date.getMonth() + 1
        ),

        year: String(
            date.getFullYear()
        ),
    };
};

const createPartId = () => {
    return `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
};

const createPart = (
    type: BarcodeValuePartType
): BarcodeValuePart => {
    const today =
        getTodayParts();

    switch (type) {
        case "string":
            return {
                id: createPartId(),
                type,
                value: "PRD",
            };

        case "date":
            return {
                id: createPartId(),
                type,
                value: today.date,
                dateFormat:
                    "DDMMYYYY",
            };

        case "day":
            return {
                id: createPartId(),
                type,
                value: today.day,
            };

        case "month":
            return {
                id: createPartId(),
                type,
                value: today.month,
            };

        case "year":
            return {
                id: createPartId(),
                type,
                value: today.year,
            };

        case "increment":
            return {
                id: createPartId(),
                type,
                incrementStart: 1,
                incrementLength: 4,
            };

        default:
            return {
                id: createPartId(),
                type,
            };
    }
};

const formatDateValue = (
    value: string,
    format: DateFormat
) => {
    if (!value) {
        return "";
    }

    const [
        year,
        month,
        day,
    ] = value.split("-");

    if (
        !year ||
        !month ||
        !day
    ) {
        return "";
    }

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

const getStoredTemplates = (): BarcodeQrTemplateRecord[] => {
    try {
        const stored =
            localStorage.getItem(
                BARCODE_TEMPLATE_STORAGE_KEY
            );

        if (!stored) {
            return [];
        }

        const parsed =
            JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed;
    } catch (error) {
        console.error(
            "Failed to read Barcode / QR templates from localStorage:",
            error
        );

        return [];
    }
};

const getNextTemplateCode = (
    templates: BarcodeQrTemplateRecord[]
) => {
    let highestNumber = 0;
    templates.forEach((template) => {
        const match = template.templateCode?.match(/^BQT-(\d+)$/);

        if (!match) return;

        const number = Number(match[1]);

        if (number > highestNumber) {
            highestNumber = number;
        }
    }
    );

    return `BQT-${String(
        highestNumber + 1
    ).padStart(6, "0")}`;
};

const saveTemplateToLocalStorage = (
    template: BarcodeQrTemplateRecord
) => {
    const templates = getStoredTemplates();
    const updatedTemplates = [...templates, template,];
    localStorage.setItem(BARCODE_TEMPLATE_STORAGE_KEY, JSON.stringify(updatedTemplates)
    );
};

const Section = ({ title, description, right, children, }: { title: string; description?: string; right?: ReactNode; children: ReactNode; }) => {
    return (
        <div className="rounded-md border border-border bg-card">
            <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-base font-semibold text-card-foreground">
                        {title}
                    </h2>

                    {description ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>
                {right}
            </div>

            <div className="p-4">
                {children}
            </div>
        </div>
    );
};

const BarcodeQrTemplate = ({ onSave, }: BarcodeQrTemplateProps) => {
    const today = useMemo(() => getTodayParts(), []);
    const [form, setForm] = useState<BarcodeQrTemplateForm>({
        templateName: "", codeType: "barcode", barcodeType: "CODE128",
        barcodeValueFormat: [
            { id: "string", type: "string", value: "PRD", },
            { id: "date", type: "date", value: today.date, dateFormat: "DDMMYYYY", },
            { id: "increment", type: "increment", incrementStart: 1, incrementLength: 4, },
        ],
        separator: "",
        labelSize: "50x25",
        width: 50,
        height: 25,
        unit: "mm",
        orientation: "landscape",

        fields: {
            productName: true,
            productCode: true,
            mrp: true,
            sellingPrice: false,
            hsnCode: false,
            uom: false,
            batchNumber: false,
            serialNumber: false,
            manufacturingDate: false,
            expiryDate: false,
            warehouse: false,
            location: false,
        },

        status: "active",
    });

    const [
        errors,
        setErrors,
    ] = useState<
        Record<string, string>
    >({});

    const [
        qrCodeUrl,
        setQrCodeUrl,
    ] = useState("");

    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");

    const updateField = (
        key: keyof BarcodeQrTemplateForm,
        value: any
    ) => {
        setForm(
            (previous) => ({
                ...previous,
                [key]: value,
            })
        );

        setErrors(
            (previous) => ({
                ...previous,
                [key]: "",
            })
        );

        setSuccessMessage("");
    };

    const updatePrintField = (
        key: keyof TemplateFields,
        value: boolean
    ) => {
        setForm(
            (previous) => ({
                ...previous,

                fields: {
                    ...previous.fields,
                    [key]: value,
                },
            })
        );

        setSuccessMessage("");
    };

    const updatePart = (
        id: string,
        updates: Partial<BarcodeValuePart>
    ) => {
        setForm(
            (previous) => ({
                ...previous,

                barcodeValueFormat:
                    previous.barcodeValueFormat.map(
                        (part) =>
                            part.id === id
                                ? {
                                    ...part,
                                    ...updates,
                                }
                                : part
                    ),
            })
        );

        setErrors(
            (previous) => ({
                ...previous,
                barcodeValueFormat:
                    "",
            })
        );

        setSuccessMessage("");
    };

    const changePartType = (
        id: string,
        type: BarcodeValuePartType
    ) => {
        const newPart =
            createPart(type);

        setForm(
            (previous) => ({
                ...previous,

                barcodeValueFormat:
                    previous.barcodeValueFormat.map(
                        (part) =>
                            part.id === id
                                ? {
                                    ...newPart,
                                    id,
                                }
                                : part
                    ),
            })
        );

        setSuccessMessage("");
    };

    const addPart = () => {
        setForm(
            (previous) => ({
                ...previous,

                barcodeValueFormat: [
                    ...previous.barcodeValueFormat,
                    createPart(
                        "string"
                    ),
                ],
            })
        );

        setSuccessMessage("");
    };

    const removePart = (
        id: string
    ) => {
        setForm(
            (previous) => ({
                ...previous,

                barcodeValueFormat:
                    previous.barcodeValueFormat.filter(
                        (part) =>
                            part.id !== id
                    ),
            })
        );

        setSuccessMessage("");
    };

    const movePart = (
        index: number,
        direction:
            | "up"
            | "down"
    ) => {
        setForm(
            (previous) => {
                const parts = [
                    ...previous.barcodeValueFormat,
                ];

                const targetIndex =
                    direction === "up"
                        ? index - 1
                        : index + 1;

                if (
                    targetIndex < 0 ||
                    targetIndex >=
                    parts.length
                ) {
                    return previous;
                }

                [
                    parts[index],
                    parts[targetIndex],
                ] = [
                        parts[targetIndex],
                        parts[index],
                    ];

                return {
                    ...previous,

                    barcodeValueFormat:
                        parts,
                };
            }
        );

        setSuccessMessage("");
    };

    const handleLabelSizeChange = (
        value: string
    ) => {
        const selected =
            LABEL_SIZE_OPTIONS.find(
                (option) =>
                    option.value ===
                    value
            );

        if (!selected) {
            return;
        }

        setForm(
            (previous) => ({
                ...previous,

                labelSize:
                    value,

                width:
                    value ===
                        "custom"
                        ? previous.width
                        : selected.width,

                height:
                    value ===
                        "custom"
                        ? previous.height
                        : selected.height,
            })
        );

        setSuccessMessage("");
    };

    const generatedCodeValue =
        useMemo(() => {
            const values =
                form.barcodeValueFormat.map(
                    (part) => {
                        switch (
                        part.type
                        ) {
                            case "string":
                                return (
                                    part.value ||
                                    ""
                                );

                            case "date":
                                return formatDateValue(
                                    part.value ||
                                    "",
                                    part.dateFormat ||
                                    "DDMMYYYY"
                                );

                            case "day":
                                return part.value
                                    ? pad2(
                                        part.value
                                    )
                                    : "";

                            case "month":
                                return part.value
                                    ? pad2(
                                        part.value
                                    )
                                    : "";

                            case "year":
                                return (
                                    part.value ||
                                    ""
                                );

                            case "increment": {
                                const start =
                                    Math.max(
                                        0,
                                        Number(
                                            part.incrementStart ??
                                            1
                                        )
                                    );

                                const length =
                                    Math.max(
                                        1,
                                        Number(
                                            part.incrementLength ??
                                            4
                                        )
                                    );

                                return String(
                                    start
                                ).padStart(
                                    length,
                                    "0"
                                );
                            }

                            default:
                                return "";
                        }
                    }
                );

            return values
                .filter(Boolean)
                .join(
                    form.separator
                );
        }, [
            form.barcodeValueFormat,
            form.separator,
        ]);

    useEffect(() => {
        if (
            form.codeType !==
            "qrcode" ||
            !generatedCodeValue
        ) {
            setQrCodeUrl("");
            return;
        }

        let active = true;

        const generateQRCode =
            async () => {
                try {
                    const value =
                        await QRCode.toDataURL(
                            generatedCodeValue,
                            {
                                errorCorrectionLevel:
                                    "M",
                                margin: 1,
                                width: 400,
                            }
                        );

                    if (active) {
                        setQrCodeUrl(
                            value
                        );
                    }
                } catch (error) {
                    console.error(
                        "QR Code generation failed:",
                        error
                    );

                    if (active) {
                        setQrCodeUrl(
                            ""
                        );
                    }
                }
            };

        generateQRCode();

        return () => {
            active = false;
        };
    }, [
        form.codeType,
        generatedCodeValue,
    ]);

    const previewSize =
        useMemo(() => {
            const rawWidth =
                form.orientation ===
                    "portrait"
                    ? form.height
                    : form.width;

            const rawHeight =
                form.orientation ===
                    "portrait"
                    ? form.width
                    : form.height;

            const safeWidth =
                Math.max(
                    rawWidth,
                    1
                );

            const safeHeight =
                Math.max(
                    rawHeight,
                    1
                );

            const scale =
                Math.min(
                    4.5,
                    350 /
                    safeWidth,
                    210 /
                    safeHeight
                );

            return {
                width:
                    safeWidth *
                    scale,

                height:
                    safeHeight *
                    scale,
            };
        }, [
            form.width,
            form.height,
            form.orientation,
        ]);

    const barcodeHeight =
        useMemo(() => {
            if (
                form.height <= 15
            ) {
                return 28;
            }

            if (
                form.height <= 25
            ) {
                return 40;
            }

            if (
                form.height <= 30
            ) {
                return 48;
            }

            return 60;
        }, [form.height]);

    const qrSize =
        useMemo(() => {
            if (
                form.height <= 15
            ) {
                return 42;
            }

            if (
                form.height <= 25
            ) {
                return 65;
            }

            if (
                form.height <= 30
            ) {
                return 78;
            }

            return 95;
        }, [form.height]);

    const validate = () => {
        const nextErrors:
            Record<
                string,
                string
            > = {};

        if (
            !form.templateName.trim()
        ) {
            nextErrors.templateName =
                "Template name is required";
        }

        if (
            !form.width ||
            form.width <= 0
        ) {
            nextErrors.width =
                "Width is required";
        }

        if (
            !form.height ||
            form.height <= 0
        ) {
            nextErrors.height =
                "Height is required";
        }

        if (
            form.barcodeValueFormat
                .length === 0
        ) {
            nextErrors.barcodeValueFormat =
                "Add at least one format part";
        }

        if (
            !generatedCodeValue
        ) {
            nextErrors.barcodeValueFormat =
                "Generated value cannot be empty";
        }

        setErrors(
            nextErrors
        );

        return (
            Object.keys(
                nextErrors
            ).length === 0
        );
    };

    const handleSave = () => {
        if (!validate()) {
            return;
        }

        try {
            const storedTemplates =
                getStoredTemplates();

            const templateCode =
                getNextTemplateCode(
                    storedTemplates
                );

            const now =
                new Date().toISOString();

            const payload:
                BarcodeQrTemplateRecord =
            {
                templateCode,

                ...form,

                templateName:
                    form.templateName.trim(),

                createdAt:
                    now,

                updatedAt:
                    now,
            };

            saveTemplateToLocalStorage(
                payload
            );

            setSuccessMessage(
                `${payload.templateName} saved successfully (${templateCode})`
            );

            console.log(
                "BARCODE / QR TEMPLATE SAVED",
                payload
            );

            if (onSave) {
                onSave(payload);
            }
        } catch (error) {
            console.error(
                "Failed to save Barcode / QR template:",
                error
            );

            setSuccessMessage("");
        }
    };

    const renderPartInput = (
        part: BarcodeValuePart
    ) => {
        switch (part.type) {
            case "string":
                return (
                    <TextInput
                        label=""
                        value={
                            part.value ||
                            ""
                        }
                        placeholder="Enter text e.g. PRD"
                        onChange={(
                            event: any
                        ) =>
                            updatePart(
                                part.id,
                                {
                                    value:
                                        event.target.value.toUpperCase(),
                                }
                            )
                        }
                    />
                );

            case "date":
                return (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px]">
                        <TextInput
                            label=""
                            type="date"
                            value={
                                part.value ||
                                ""
                            }
                            onChange={(
                                event: any
                            ) =>
                                updatePart(
                                    part.id,
                                    {
                                        value:
                                            event.target.value,
                                    }
                                )
                            }
                        />

                        <SelectInput
                            label=""
                            value={
                                part.dateFormat ||
                                "DDMMYYYY"
                            }
                            options={
                                DATE_FORMAT_OPTIONS
                            }
                            onChange={(
                                event: any
                            ) =>
                                updatePart(
                                    part.id,
                                    {
                                        dateFormat:
                                            event.target
                                                .value,
                                    }
                                )
                            }
                        />
                    </div>
                );

            case "day":
                return (
                    <TextInput
                        label=""
                        type="number"
                        value={
                            part.value ||
                            ""
                        }
                        placeholder="Enter day"
                        onChange={(
                            event: any
                        ) => {
                            const rawValue =
                                event.target.value;

                            if (
                                rawValue ===
                                ""
                            ) {
                                updatePart(
                                    part.id,
                                    {
                                        value:
                                            "",
                                    }
                                );

                                return;
                            }

                            const value =
                                Math.min(
                                    31,
                                    Math.max(
                                        1,
                                        Number(
                                            rawValue
                                        )
                                    )
                                );

                            updatePart(
                                part.id,
                                {
                                    value:
                                        String(
                                            value
                                        ),
                                }
                            );
                        }}
                    />
                );

            case "month":
                return (
                    <TextInput
                        label=""
                        type="number"
                        value={
                            part.value ||
                            ""
                        }
                        placeholder="Enter month"
                        onChange={(
                            event: any
                        ) => {
                            const rawValue =
                                event.target.value;

                            if (
                                rawValue ===
                                ""
                            ) {
                                updatePart(
                                    part.id,
                                    {
                                        value:
                                            "",
                                    }
                                );

                                return;
                            }

                            const value =
                                Math.min(
                                    12,
                                    Math.max(
                                        1,
                                        Number(
                                            rawValue
                                        )
                                    )
                                );

                            updatePart(
                                part.id,
                                {
                                    value:
                                        String(
                                            value
                                        ),
                                }
                            );
                        }}
                    />
                );

            case "year":
                return (
                    <TextInput
                        label=""
                        type="number"
                        value={
                            part.value ||
                            ""
                        }
                        placeholder="Enter year"
                        onChange={(
                            event: any
                        ) =>
                            updatePart(
                                part.id,
                                {
                                    value:
                                        String(
                                            event.target.value
                                        ).slice(
                                            0,
                                            4
                                        ),
                                }
                            )
                        }
                    />
                );

            case "increment":
                return (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                            <TextInput
                                label=""
                                type="number"
                                value={
                                    part.incrementStart ??
                                    1
                                }
                                placeholder="Start"
                                onChange={(
                                    event: any
                                ) => {
                                    const value =
                                        Math.max(
                                            0,
                                            Number(
                                                event
                                                    .target
                                                    .value ||
                                                0
                                            )
                                        );

                                    updatePart(
                                        part.id,
                                        {
                                            incrementStart:
                                                value,
                                        }
                                    );
                                }}
                            />
                        </div>

                        <div className="relative">
                            <TextInput
                                label=""
                                type="number"
                                value={
                                    part.incrementLength ??
                                    4
                                }
                                placeholder="Digits"
                                onChange={(
                                    event: any
                                ) => {
                                    const value =
                                        Math.min(
                                            12,
                                            Math.max(
                                                1,
                                                Number(
                                                    event
                                                        .target
                                                        .value ||
                                                    1
                                                )
                                            )
                                        );

                                    updatePart(
                                        part.id,
                                        {
                                            incrementLength:
                                                value,
                                        }
                                    );
                                }}
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex h-auto w-full flex-col gap-3 rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            {/* HEADER */}
            <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-card-foreground">
                        Barcode / QR Code Template
                    </h1>

                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Configure code format and label layout.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="
                            h-8 rounded-sm border border-border bg-card px-4
                            text-sm font-medium text-card-foreground
                            transition hover:border-primary hover:bg-muted
                        "
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={
                            handleSave
                        }
                        className="
                            h-8 rounded-sm bg-primary px-4
                            text-sm font-semibold text-primary-foreground
                            transition hover:opacity-90
                        "
                    >
                        Save Template
                    </button>
                </div>
            </div>

            {successMessage ? (
                <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary">
                    {successMessage}
                </div>
            ) : null}

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
                {/* LEFT SIDE */}
                <div className="min-w-0 space-y-3">
                    {/* TEMPLATE DETAILS */}
                    <Section title="Template Details">
                        <div className="grid grid-cols-1 gap-x-3 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
                            <TextInput
                                label="Template Name"
                                mandatory
                                value={
                                    form.templateName
                                }
                                error={
                                    errors.templateName
                                }
                                placeholder="Standard Product Label"
                                onChange={(
                                    event: any
                                ) =>
                                    updateField(
                                        "templateName",
                                        event.target
                                            .value
                                    )
                                }
                            />

                            <SelectInput
                                label="Code Type"
                                value={
                                    form.codeType
                                }
                                options={
                                    CODE_TYPE_OPTIONS
                                }
                                onChange={(
                                    event: any
                                ) =>
                                    updateField(
                                        "codeType",
                                        event.target
                                            .value
                                    )
                                }
                            />

                            {form.codeType ===
                                "barcode" ? (
                                <SelectInput
                                    label="Barcode Type"
                                    value={
                                        form.barcodeType
                                    }
                                    options={
                                        BARCODE_TYPE_OPTIONS
                                    }
                                    onChange={(
                                        event: any
                                    ) =>
                                        updateField(
                                            "barcodeType",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />
                            ) : null}

                            <SelectInput
                                label="Label Size"
                                value={
                                    form.labelSize
                                }
                                options={
                                    LABEL_SIZE_OPTIONS
                                }
                                onChange={(
                                    event: any
                                ) =>
                                    handleLabelSizeChange(
                                        event.target
                                            .value
                                    )
                                }
                            />

                            <SelectInput
                                label="Orientation"
                                value={
                                    form.orientation
                                }
                                options={
                                    ORIENTATION_OPTIONS
                                }
                                onChange={(
                                    event: any
                                ) =>
                                    updateField(
                                        "orientation",
                                        event.target
                                            .value
                                    )
                                }
                            />

                            {/* <SelectInput
                                label="Status"
                                value={
                                    form.status
                                }
                                options={
                                    STATUS_OPTIONS
                                }
                                onChange={(
                                    event: any
                                ) =>
                                    updateField(
                                        "status",
                                        event.target
                                            .value
                                    )
                                }
                            /> */}

                            {form.labelSize ===
                                "custom" ? (
                                <>
                                    <TextInput
                                        label="Width (mm)"
                                        type="number"
                                        value={
                                            form.width
                                        }
                                        error={
                                            errors.width
                                        }
                                        onChange={(
                                            event: any
                                        ) =>
                                            updateField(
                                                "width",
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            )
                                        }
                                    />

                                    <TextInput
                                        label="Height (mm)"
                                        type="number"
                                        value={
                                            form.height
                                        }
                                        error={
                                            errors.height
                                        }
                                        onChange={(
                                            event: any
                                        ) =>
                                            updateField(
                                                "height",
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            )
                                        }
                                    />
                                </>
                            ) : null}
                        </div>
                    </Section>

                    {/* CODE VALUE FORMAT */}
                    <Section
                        title="Code Value Format"
                        description="Configure the value that will be encoded inside the Barcode or QR Code."
                        right={
                            <button
                                type="button"
                                onClick={
                                    addPart
                                }
                                className="
                                    inline-flex h-8 items-center gap-1.5 rounded-sm
                                    bg-primary px-3 text-sm font-medium
                                    text-primary-foreground transition hover:opacity-90
                                "
                            >
                                <Plus
                                    size={
                                        16
                                    }
                                />

                                Add Part
                            </button>
                        }
                    >
                        {/* FORMAT TOP */}
                        <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                            <SelectInput
                                label="Separator"
                                value={
                                    form.separator
                                }
                                options={
                                    SEPARATOR_OPTIONS
                                }
                                onChange={(
                                    event: any
                                ) =>
                                    updateField(
                                        "separator",
                                        event.target
                                            .value
                                    )
                                }
                            />

                            <div className="flex w-full flex-col gap-1">
                                <label className="text-sm font-medium text-card-foreground">
                                    Generated Value
                                </label>

                                <div
                                    className="
                                        flex h-8 w-full items-center rounded-sm
                                        border border-primary/40 bg-primary/5 px-3
                                    "
                                >
                                    <span className="truncate font-mono text-sm font-semibold text-primary">
                                        {generatedCodeValue ||
                                            "-"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FORMAT TABLE */}
                        <div className="overflow-hidden rounded-md border border-border">
                            <div
                                className="
                                    hidden grid-cols-[50px_160px_minmax(0,1fr)_110px]
                                    items-center gap-2 border-b border-border
                                    bg-muted/50 px-3 py-2 text-sm font-medium
                                    text-card-foreground md:grid
                                "
                            >
                                <div>
                                    #
                                </div>

                                <div>
                                    Type
                                </div>

                                <div>
                                    Value
                                </div>

                                <div className="text-center">
                                    Action
                                </div>
                            </div>

                            <div className="divide-y divide-border">
                                {form.barcodeValueFormat.map(
                                    (
                                        part,
                                        index
                                    ) => (
                                        <div
                                            key={
                                                part.id
                                            }
                                            className="
                                                grid grid-cols-1 gap-2 bg-card p-3
                                                md:grid-cols-[50px_160px_minmax(0,1fr)_110px]
                                                md:items-center md:gap-2
                                            "
                                        >
                                            <div className="hidden text-center text-sm font-medium text-muted-foreground md:block">
                                                {index +
                                                    1}
                                            </div>

                                            <div className="min-w-0">
                                                <SelectInput
                                                    label=""
                                                    value={
                                                        part.type
                                                    }
                                                    options={
                                                        VALUE_PART_OPTIONS
                                                    }
                                                    onChange={(
                                                        event: any
                                                    ) =>
                                                        changePartType(
                                                            part.id,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                {renderPartInput(
                                                    part
                                                )}
                                            </div>

                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    title="Move Up"
                                                    disabled={
                                                        index ===
                                                        0
                                                    }
                                                    onClick={() =>
                                                        movePart(
                                                            index,
                                                            "up"
                                                        )
                                                    }
                                                    className="
                                                        flex h-8 w-8 items-center justify-center
                                                        rounded-sm border border-border text-card-foreground
                                                        transition hover:border-primary hover:bg-muted
                                                        disabled:cursor-not-allowed disabled:opacity-30
                                                    "
                                                >
                                                    <ChevronUp
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Move Down"
                                                    disabled={
                                                        index ===
                                                        form
                                                            .barcodeValueFormat
                                                            .length -
                                                        1
                                                    }
                                                    onClick={() =>
                                                        movePart(
                                                            index,
                                                            "down"
                                                        )
                                                    }
                                                    className="
                                                        flex h-8 w-8 items-center justify-center
                                                        rounded-sm border border-border text-card-foreground
                                                        transition hover:border-primary hover:bg-muted
                                                        disabled:cursor-not-allowed disabled:opacity-30
                                                    "
                                                >
                                                    <ChevronDown
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Remove"
                                                    disabled={
                                                        form
                                                            .barcodeValueFormat
                                                            .length <=
                                                        1
                                                    }
                                                    onClick={() =>
                                                        removePart(
                                                            part.id
                                                        )
                                                    }
                                                    className="
                                                        flex h-8 w-8 items-center justify-center
                                                        rounded-sm border border-danger/40 text-danger
                                                        transition hover:bg-danger/10
                                                        disabled:cursor-not-allowed disabled:opacity-30
                                                    "
                                                >
                                                    <Trash2
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {errors.barcodeValueFormat ? (
                            <p className="mt-2 text-sm text-danger">
                                {
                                    errors.barcodeValueFormat
                                }
                            </p>
                        ) : null}
                    </Section>

                    {/* PRINT FIELDS */}
                    <Section
                        title="Fields to Print"
                        description="Select additional product details to display on the printed label."
                    >
                        <div className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {PRINT_FIELDS.map(
                                (
                                    field
                                ) => (
                                    <Checkbox
                                        key={
                                            field.key
                                        }
                                        checked={
                                            form
                                                .fields[
                                            field
                                                .key
                                            ]
                                        }
                                        label={
                                            field.label
                                        }
                                        iconSize={
                                            18
                                        }
                                        className="gap-2"
                                        labelClassName="text-sm"
                                        onChange={(
                                            checked
                                        ) =>
                                            updatePrintField(
                                                field.key,
                                                checked
                                            )
                                        }
                                    />
                                )
                            )}
                        </div>
                    </Section>
                </div>

                {/* RIGHT SIDE PREVIEW */}
                <div className="min-w-0">
                    <div className="sticky top-3 overflow-hidden rounded-md border border-border bg-card">
                        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Label Preview
                                </h2>

                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {form.width} mm
                                    {" × "}
                                    {form.height} mm
                                </p>
                            </div>

                            <div className="rounded-sm border border-primary/20 bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                                {form.codeType ===
                                    "barcode"
                                    ? form.barcodeType
                                    : "QR Code"}
                            </div>
                        </div>

                        <div className="p-4">
                            <div
                                className="
                                    flex min-h-[260px] items-center justify-center
                                    overflow-auto rounded-md border border-dashed
                                    border-border bg-muted/20 p-4
                                "
                            >
                                <div
                                    className="
                                        flex flex-col items-center justify-center
                                        overflow-hidden border border-slate-400
                                        bg-white p-2 text-black shadow-sm
                                    "
                                    style={{
                                        width:
                                            previewSize.width,

                                        height:
                                            previewSize.height,

                                        minWidth:
                                            previewSize.width,

                                        minHeight:
                                            previewSize.height,
                                    }}
                                >
                                    {form.fields
                                        .productName ? (
                                        <div className="mb-1 max-w-full truncate text-center text-[11px] font-semibold">
                                            {
                                                PREVIEW_PRODUCT.productName
                                            }
                                        </div>
                                    ) : null}

                                    {form.codeType ===
                                        "barcode" ? (
                                        generatedCodeValue ? (
                                            <div className="max-w-full overflow-hidden">
                                                <Barcode
                                                    value={
                                                        generatedCodeValue
                                                    }
                                                    format={
                                                        form.barcodeType
                                                    }
                                                    width={
                                                        form.width <=
                                                            38
                                                            ? 0.8
                                                            : 1
                                                    }
                                                    height={
                                                        barcodeHeight
                                                    }
                                                    displayValue={
                                                        false
                                                    }
                                                    margin={
                                                        0
                                                    }
                                                    background="#ffffff"
                                                    lineColor="#000000"
                                                />
                                            </div>
                                        ) : null
                                    ) : qrCodeUrl ? (
                                        <img
                                            src={
                                                qrCodeUrl
                                            }
                                            alt="QR Code"
                                            style={{
                                                width: qrSize,
                                                height: qrSize,
                                            }}
                                        />
                                    ) : null}

                                    <div className="mt-1 max-w-full break-all text-center font-mono text-[9px] font-semibold">
                                        {
                                            generatedCodeValue
                                        }
                                    </div>

                                    {form.fields
                                        .productCode ? (
                                        <div className="mt-0.5 text-center text-[9px]">
                                            {
                                                PREVIEW_PRODUCT.productCode
                                            }
                                        </div>
                                    ) : null}

                                    <div className="mt-1 flex max-w-full flex-wrap justify-center gap-x-2 gap-y-0.5 text-[8px]">
                                        {form
                                            .fields
                                            .mrp ? (
                                            <span>
                                                MRP:{" "}
                                                {
                                                    PREVIEW_PRODUCT.mrp
                                                }
                                            </span>
                                        ) : null}

                                        {form
                                            .fields
                                            .sellingPrice ? (
                                            <span>
                                                Price:{" "}
                                                {
                                                    PREVIEW_PRODUCT.sellingPrice
                                                }
                                            </span>
                                        ) : null}

                                        {form
                                            .fields
                                            .hsnCode ? (
                                            <span>
                                                HSN:{" "}
                                                {
                                                    PREVIEW_PRODUCT.hsnCode
                                                }
                                            </span>
                                        ) : null}

                                        {form
                                            .fields
                                            .uom ? (
                                            <span>
                                                UOM:{" "}
                                                {
                                                    PREVIEW_PRODUCT.uom
                                                }
                                            </span>
                                        ) : null}

                                        {form
                                            .fields
                                            .batchNumber ? (
                                            <span>
                                                Batch:{" "}
                                                {
                                                    PREVIEW_PRODUCT.batchNumber
                                                }
                                            </span>
                                        ) : null}

                                        {form
                                            .fields
                                            .serialNumber ? (
                                            <span>
                                                Serial:{" "}
                                                {
                                                    PREVIEW_PRODUCT.serialNumber
                                                }
                                            </span>
                                        ) : null}

                                        {form
                                            .fields
                                            .manufacturingDate ? (
                                            <span>
                                                MFG:{" "}
                                                {
                                                    PREVIEW_PRODUCT.manufacturingDate
                                                }
                                            </span>
                                        ) : null}

                                        {form
                                            .fields
                                            .expiryDate ? (
                                            <span>
                                                EXP:{" "}
                                                {
                                                    PREVIEW_PRODUCT.expiryDate
                                                }
                                            </span>
                                        ) : null}

                                        {form
                                            .fields
                                            .warehouse ? (
                                            <span>
                                                WH:{" "}
                                                {
                                                    PREVIEW_PRODUCT.warehouse
                                                }
                                            </span>
                                        ) : null}

                                        {form
                                            .fields
                                            .location ? (
                                            <span>
                                                LOC:{" "}
                                                {
                                                    PREVIEW_PRODUCT.location
                                                }
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            {/* PREVIEW DETAILS */}
                            <div className="mt-3 rounded-md border border-border bg-muted/20 p-3">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <span className="text-muted-foreground">
                                        Code Type
                                    </span>

                                    <span className="text-right font-medium text-card-foreground">
                                        {form.codeType ===
                                            "barcode"
                                            ? "Barcode"
                                            : "QR Code"}
                                    </span>

                                    {form.codeType ===
                                        "barcode" ? (
                                        <>
                                            <span className="text-muted-foreground">
                                                Barcode Type
                                            </span>

                                            <span className="text-right font-medium text-card-foreground">
                                                {
                                                    form.barcodeType
                                                }
                                            </span>
                                        </>
                                    ) : null}

                                    <span className="text-muted-foreground">
                                        Label Size
                                    </span>

                                    <span className="text-right font-medium text-card-foreground">
                                        {form.width} x{" "}
                                        {form.height} mm
                                    </span>

                                    <span className="text-muted-foreground">
                                        Orientation
                                    </span>

                                    <span className="text-right font-medium capitalize text-card-foreground">
                                        {
                                            form.orientation
                                        }
                                    </span>

                                    <span className="text-muted-foreground">
                                        Status
                                    </span>

                                    <span className="text-right font-medium capitalize text-card-foreground">
                                        {
                                            form.status
                                        }
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3">
                                <p className="text-sm font-medium text-card-foreground">
                                    Encoded Value
                                </p>

                                <p className="mt-1 break-all font-mono text-sm font-semibold text-primary">
                                    {generatedCodeValue ||
                                        "-"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeQrTemplate;