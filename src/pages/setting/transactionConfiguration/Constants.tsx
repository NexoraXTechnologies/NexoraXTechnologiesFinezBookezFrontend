import {
    CalendarClock,
    FileText,
    Landmark,
    RotateCcw,
    ShoppingCart,
} from "lucide-react";

import type {
    SchemaFieldForm,
    SchemaSection,
    TransactionItem,
    TransactionModuleForm,
} from "./Types";

export const INITIAL_MODULE_FORM: TransactionModuleForm = {
    moduleName: "",
    description: "",
    moduleType: "",
    status: "active",
};

export const INITIAL_SCHEMA_FIELD_FORM: SchemaFieldForm = {
    key: "",
    label: "",
    type: "text",
    ref: "",
    isRequired: false,
    isSearchable: false,
    isFilterable: false,
    isReadonly: false,
    isHidden: false,
};

export const TRANSACTIONS: TransactionItem[] = [
    {
        key: "salesQuotation",
        name: "Sales Quotation",
        description: "Configure Sales Quotation fields",
        icon: <FileText size={20} />,
    },
    {
        key: "salesOrder",
        name: "Sales Orders",
        description: "Configure Sales Order fields",
        icon: <CalendarClock size={20} />,
    },
    {
        key: "salesInvoice",
        name: "Sales Invoice",
        description: "Configure Sales Invoice fields",
        icon: <ShoppingCart size={20} />,
    },
    {
        key: "receipt",
        name: "Receipt",
        description: "Configure Receipt fields",
        icon: <Landmark size={20} />,
    },
    {
        key: "salesReturn",
        name: "Sales Return",
        description: "Configure Sales Return fields",
        icon: <RotateCcw size={20} />,
    },
    {
        key: "purchaseOrder",
        name: "Purchase Order",
        description: "Configure Purchase Order fields",
        icon: <CalendarClock size={20} />,
    },
    {
        key: "grn",
        name: "GRN",
        description: "Configure GRN fields",
        icon: <FileText size={20} />,
    },
    {
        key: "purchaseInvoice",
        name: "Purchase Invoice",
        description: "Configure Purchase Invoice fields",
        icon: <ShoppingCart size={20} />,
    },
    {
        key: "purchaseReturn",
        name: "Purchase Return",
        description: "Configure Purchase Return fields",
        icon: <RotateCcw size={20} />,
    },
    {
        key: "payment",
        name: "Payment",
        description: "Configure Payment fields",
        icon: <Landmark size={20} />,
    },
];

export const FIELD_TYPE_OPTIONS = [
    { value: "text", label: "Text" },
    { value: "string", label: "String" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "boolean", label: "Boolean" },
    { value: "select", label: "Select" },
    { value: "textarea", label: "Textarea" },
    { value: "array", label: "Array" },
];

export const SCHEMA_SECTIONS: { key: SchemaSection; label: string }[] = [
    { key: "header", label: "Header" },
    { key: "body", label: "Body" },
    { key: "footer", label: "Footer" },
];

/** true/"true" both count as "on" — the API isn't consistent about booleans. */
export const isTruthyFlag = (value: unknown): boolean =>
    value === true || value === "true";