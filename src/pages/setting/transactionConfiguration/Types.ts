import type { ReactNode } from "react";

/* ===================================================
   Custom Transaction modules (backed by transactionModuleSlice)
=================================================== */

export type TransactionModuleForm = {
    moduleName: string;
    description: string;
    moduleType: string;
    status: "active" | "inactive";
};

export type TransactionModuleItem = TransactionModuleForm & {
    _id?: string;
    moduleCode: string;
    createdOn?: string;
    createdBy?: string;
    modifiedOn?: string;
    modifiedBy?: string;
};

/* ===================================================
   The 10 fixed transaction types shown as sidebar tabs
=================================================== */

export type TransactionKey =
    | "salesQuotation"
    | "salesOrder"
    | "salesInvoice"
    | "receipt"
    | "salesReturn"
    | "purchaseOrder"
    | "grn"
    | "purchaseInvoice"
    | "purchaseReturn"
    | "payment";

export type TransactionItem = {
    key: TransactionKey;
    name: string;
    description: string;
    icon: ReactNode;
};

/* ===================================================
   Schema (fields are grouped into 3 sections per module)
=================================================== */

export type SchemaSection = "header" | "body" | "footer";

export type SchemaField = {
    key: string;
    label: string;
    type: string;
    ref?: string;
    isRequired: boolean;
    isSearchable: boolean;
    isFilterable: boolean;
    isReadonly: boolean;
    isHidden: boolean;
    isSystemGenerated?: boolean;
    defaultValue?: any;
    isDefault?: boolean;
    module?: string;
    section?: SchemaSection;
    options?: any[];
    [key: string]: any;
};

// Shape returned by GET /transactionSchema/getAll for a given module
export type ModuleSchemaData = {
    module?: {
        moduleCode?: string;
        moduleName?: string;
        moduleType?: string;
        description?: string;
        schemaSource?: "system" | "custom" | string;
    };
    counts?: {
        header?: number;
        body?: number;
        footer?: number;
        total?: number;
    };
    header?: SchemaField[];
    body?: SchemaField[];
    footer?: SchemaField[];
};

export type SchemaFieldForm = {
    key: string;
    label: string;
    type: string;
    ref: string;
    isRequired: boolean;
    isSearchable: boolean;
    isFilterable: boolean;
    isReadonly: boolean;
    isHidden: boolean;
};

// Every schema builder — whether it's a fixed transaction type or a
// custom transaction module — is driven off a single "module" string.
// That's the whole point of the generic transactionSchema slice.
export type SchemaContext = {
    moduleKey: string;
    title: string;
    kind: "transaction" | "custom";
};

// A generic sidebar tab. `module` is only present for custom-module tabs.
export type SidebarTab = {
    key: string;
    label: string;
    icon: ReactNode;
    module?: TransactionModuleItem;
};