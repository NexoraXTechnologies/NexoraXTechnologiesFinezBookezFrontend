import { useEffect, useMemo, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    ArrowLeft,
    Boxes,
    CalendarClock,
    Edit,
    FileText,
    Landmark,
    Plus,
    RotateCcw,
    Save,
    Settings2,
    ShieldCheck,
    ShoppingCart,
    Trash2,
    X,
} from "lucide-react";
import { toast } from "react-toastify";

import { DataCreateButton, DataREfreshButton } from "../../../components/buttons";
import SearchInput from "../../../components/searchInput";
import Badge from "../../../components/badge";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import { BooleanBadge, Panel, StatusPill } from "../components/Configui";
import { clearSelectedTransactionModule, clearTransactionModuleError, clearTransactionModuleState, clearTransactionModuleSuccessMessage, deleteTransactionModule, getAllTransactionModules, getTransactionModuleByCode, saveTransactionModule, updateTransactionModule } from "../../../redux/slices/professionalSlice/transactionConfiguration/transactionModuleSlice";
import { clearTransactionSchemaError, clearTransactionSchemaState, getAllTransactionSchema, saveTransactionSchema, updateTransactionSchema } from "../../../redux/slices/professionalSlice/transactionSchema";

/* ===================================================
   ⭐ TYPES
=================================================== */

// Custom Transaction modules (backed by transactionModuleSlice)
type TransactionModuleForm = {
    moduleName: string;
    description: string;
    moduleType: string;
    status: "active" | "inactive";
};

type TransactionModuleItem = TransactionModuleForm & {
    _id?: string;
    moduleCode: string;
    createdOn?: string;
    createdBy?: string;
    modifiedOn?: string;
    modifiedBy?: string;
};

// The 10 fixed transaction types shown as sidebar tabs
type TransactionKey =
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

type TransactionItem = {
    key: TransactionKey;
    name: string;
    description: string;
    icon: ReactNode;
};

// The schema API groups fields into 3 sections per module.
type SchemaSection = "header" | "body" | "footer";

const SCHEMA_SECTIONS: { key: SchemaSection; label: string }[] = [
    { key: "header", label: "Header" },
    { key: "body", label: "Body" },
    { key: "footer", label: "Footer" },
];

type SchemaField = {
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
type ModuleSchemaData = {
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

type SchemaFieldForm = {
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
type SchemaContext = {
    moduleKey: string;
    title: string;
    kind: "transaction" | "custom";
};

/* ===================================================
   ⭐ CONSTANTS
=================================================== */

const INITIAL_MODULE_FORM: TransactionModuleForm = {
    moduleName: "",
    description: "",
    moduleType: "",
    status: "active",
};

const INITIAL_SCHEMA_FIELD_FORM: SchemaFieldForm = {
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

const TRANSACTIONS: TransactionItem[] = [
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

const FIELD_TYPE_OPTIONS = [
    { value: "text", label: "Text" },
    { value: "string", label: "String" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "boolean", label: "Boolean" },
    { value: "select", label: "Select" },
    { value: "textarea", label: "Textarea" },
    { value: "array", label: "Array" },
];

/* ===================================================
   ⭐ MAIN PAGE
=================================================== */

const TransactionConfiguration = () => {
    const dispatch = useDispatch<any>();

    /* ---------------------------------------------------
       Custom Transaction module state (transactionModuleSlice)
    --------------------------------------------------- */

    const {
        items: transactionModules = [],
        pagination = {},
        selectedTransactionModule,
        loading: moduleLoading,
        createLoading,
        updateLoading,
        deleteLoading,
        error: moduleError,
        successMessage: moduleSuccessMessage,
    } = useSelector((state: any) => state.transactionModule || {});

    /* ---------------------------------------------------
       Transaction schema state (transactionSchemaSlice) —
       one generic store shared by every transaction type
       AND every custom transaction module, keyed by `module`.
    --------------------------------------------------- */

    const {
        transactionsSchema: schemaData,
        loading: schemaLoading,
        schemaLoading: schemaMutating,
        error: schemaError,
    } = useSelector((state: any) => state.transactionsSchema || {}) as {
        transactionsSchema: ModuleSchemaData | null;
        loading: boolean;
        schemaLoading: boolean;
        error: string | null;
    };


    //     const {
    //   transactionsSchema: schemaData,
    //   loading: schemaLoading,
    //   schemaLoading: schemaMutating,
    //   error: schemaError,
    // } = useSelector((state: any) => state.transactionsSchema || {});


    // Which section tab (Header / Body / Footer) is currently shown
    const [schemaSection, setSchemaSection] = useState<SchemaSection>("header");

    const sectionFields: SchemaField[] = Array.isArray(schemaData?.[schemaSection])
        ? (schemaData![schemaSection] as SchemaField[])
        : [];

    const sectionCounts = {
        header: schemaData?.counts?.header ?? 0,
        body: schemaData?.counts?.body ?? 0,
        footer: schemaData?.counts?.footer ?? 0,
        total: schemaData?.counts?.total ?? 0,
    };

    /* ---------------------------------------------------
       Page/navigation state
    --------------------------------------------------- */

    const [activeTab, setActiveTab] = useState<string>("overview");
    const [selectedCustomModule, setSelectedCustomModule] =
        useState<TransactionModuleItem | null>(null);

    /* ---------------------------------------------------
       Custom Transaction list filters / pagination
    --------------------------------------------------- */

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [refreshing, setRefreshing] = useState(false);

    /* ---------------------------------------------------
       Schema-field list search (client side — the schema
       API has no pagination, it just returns everything
       for a given module)
    --------------------------------------------------- */

    const [schemaSearch, setSchemaSearch] = useState("");
    const [schemaRefreshing, setSchemaRefreshing] = useState(false);

    /* ---------------------------------------------------
       Custom Transaction create/edit modal
    --------------------------------------------------- */

    const [showModuleForm, setShowModuleForm] = useState(false);
    const [editingModuleCode, setEditingModuleCode] = useState<string | null>(null);
    const [moduleForm, setModuleForm] =
        useState<TransactionModuleForm>(INITIAL_MODULE_FORM);
    const [moduleFormErrors, setModuleFormErrors] = useState<
        Partial<Record<keyof TransactionModuleForm, string>>
    >({});

    /* ---------------------------------------------------
       Schema-field create/edit modal
    --------------------------------------------------- */

    const [showSchemaForm, setShowSchemaForm] = useState(false);
    const [editingSchemaFieldKey, setEditingSchemaFieldKey] =
        useState<string | null>(null);
    const [schemaForm, setSchemaForm] =
        useState<SchemaFieldForm>(INITIAL_SCHEMA_FIELD_FORM);
    const [schemaFormErrors, setSchemaFormErrors] = useState<
        Partial<Record<keyof SchemaFieldForm, string>>
    >({});

    /* ---------------------------------------------------
       Delete confirm tooltip (custom transaction)
    --------------------------------------------------- */

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        item: null,
        moduleCode: null,
    });

    /* ---------------------------------------------------
       Derived pagination values
    --------------------------------------------------- */

    const currentPage = Number(pagination?.currentPage || 1);
    const totalPages = Math.max(1, Number(pagination?.totalPages || 1));
    const totalDocs = Number(pagination?.totalDocs || 0);
    const isModuleSubmitting = createLoading || updateLoading;


    console.log("schemaData", schemaData);
    console.log("section", schemaSection);
    console.log("header", schemaData?.header);
    console.log("body", schemaData?.body);
    console.log("footer", schemaData?.footer);

    /* ===================================================
       ⭐ TAB DEFINITIONS
    =================================================== */

    const tabs = useMemo(
        () => [
            { key: "overview", label: "All Transactions", icon: <Boxes size={17} /> },
            ...TRANSACTIONS.map((t) => ({ key: t.key, label: t.name, icon: t.icon })),
            {
                key: "customTransactions",
                label: "Custom Transactions",
                icon: <ShieldCheck size={17} />,
            },
        ],
        []
    );

    const selectedTransaction = useMemo(
        () => TRANSACTIONS.find((t) => t.key === activeTab) || null,
        [activeTab]
    );

    /* ===================================================
       ⭐ CUSTOM TRANSACTION LIST FETCH
    =================================================== */

    const fetchTransactionModules = (
        nextOffset = localOffset,
        { showLoader = true }: { showLoader?: boolean } = {}
    ) => {
        if (!showLoader) setRefreshing(true);

        dispatch(
            getAllTransactionModules({
                offset: nextOffset,
                limit: localLimit,
                search,
                status: statusFilter,
            })
        ).finally(() => {
            if (!showLoader) setRefreshing(false);
        });
    };

    useEffect(() => {
        fetchTransactionModules(localOffset);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter, localLimit, localOffset]);

    const handleRefreshModules = () => {
        fetchTransactionModules(localOffset, { showLoader: false });
    };

    /* ===================================================
       ⭐ ERROR / SUCCESS HANDLING — Custom Transactions
    =================================================== */

    useEffect(() => {
        if (!moduleError || showModuleForm) return;
        toast.error(moduleError);
        dispatch(clearTransactionModuleError());
    }, [moduleError, showModuleForm, dispatch]);

    useEffect(() => {
        if (!moduleSuccessMessage) return;
        dispatch(clearTransactionModuleSuccessMessage());
    }, [moduleSuccessMessage, dispatch]);

    /* ===================================================
       ⭐ POPULATE CUSTOM TRANSACTION EDIT FORM
    =================================================== */

    useEffect(() => {
        if (!editingModuleCode || !selectedTransactionModule) return;
        if (selectedTransactionModule.moduleCode !== editingModuleCode) return;

        setModuleForm({
            moduleName: selectedTransactionModule.moduleName || "",
            description: selectedTransactionModule.description || "",
            moduleType: selectedTransactionModule.moduleType || "",
            status:
                selectedTransactionModule.status === "inactive" ? "inactive" : "active",
        });
    }, [editingModuleCode, selectedTransactionModule]);

    /* ===================================================
       ⭐ CUSTOM TRANSACTION FORM HELPERS
    =================================================== */

    const closeModuleForm = () => {
        setShowModuleForm(false);
        setEditingModuleCode(null);
        setModuleForm(INITIAL_MODULE_FORM);
        setModuleFormErrors({});
        dispatch(clearSelectedTransactionModule());
        dispatch(clearTransactionModuleState());
    };

    const openCreateModuleForm = () => {
        setEditingModuleCode(null);
        setModuleForm(INITIAL_MODULE_FORM);
        setModuleFormErrors({});
        dispatch(clearSelectedTransactionModule());
        dispatch(clearTransactionModuleState());
        setShowModuleForm(true);
    };

    const openEditModuleForm = async (moduleCode: string) => {
        setEditingModuleCode(moduleCode);
        setModuleForm(INITIAL_MODULE_FORM);
        setModuleFormErrors({});
        dispatch(clearTransactionModuleState());
        setShowModuleForm(true);

        try {
            await dispatch(getTransactionModuleByCode(moduleCode)).unwrap();
        } catch {
            // Error is rendered inside modal via moduleError.
        }
    };

    const updateModuleFormField = (
        field: keyof TransactionModuleForm,
        value: string
    ) => {
        setModuleForm((previous) => ({ ...previous, [field]: value }));
        setModuleFormErrors((previous) => ({ ...previous, [field]: "" }));
    };

    const validateModuleForm = () => {
        const errors: Partial<Record<keyof TransactionModuleForm, string>> = {};

        if (!moduleForm.moduleName.trim()) {
            errors.moduleName = "Module name is required.";
        }

        if (!moduleForm.moduleType.trim()) {
            errors.moduleType = "Module type is required.";
        }

        setModuleFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleModuleSubmit: FormEventHandler<HTMLFormElement> = async (
        event
    ) => {
        event.preventDefault();

        if (!validateModuleForm()) return;

        const payload = {
            moduleName: moduleForm.moduleName.trim(),
            description: moduleForm.description.trim(),
            moduleType: moduleForm.moduleType.trim(),
            status: moduleForm.status,
        };

        try {
            if (editingModuleCode) {
                await dispatch(
                    updateTransactionModule({
                        moduleCode: editingModuleCode,
                        payload: {
                            ...payload,
                            moduleCode: editingModuleCode,
                        },
                    })
                ).unwrap();

                toast.success("Custom transaction updated successfully.");
            } else {
                await dispatch(saveTransactionModule(payload)).unwrap();

                toast.success("Custom transaction created successfully.");
                setLocalOffset(0);
            }

            closeModuleForm();

            fetchTransactionModules(
                editingModuleCode ? localOffset : 0,
                { showLoader: false }
            );
        } catch {
            // Error is rendered inside modal via moduleError.
        }
    };

    /* ===================================================
       ⭐ DELETE CUSTOM TRANSACTION (via ConfirmTooltip)
    =================================================== */

    const handleDeleteClick = (e: any, item: TransactionModuleItem) => {
        const rect = e.currentTarget.getBoundingClientRect();

        let x = rect.left - 160;
        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({ show: true, x, y, item, moduleCode: item.moduleCode });
    };

    const handleDeleteConfirm = async () => {
        const item: TransactionModuleItem | null = confirmTooltip?.item;

        if (!item?.moduleCode) {
            toast.warn("Module code not found");
            return;
        }

        try {
            await dispatch(deleteTransactionModule(item.moduleCode)).unwrap();
            toast.success("Custom transaction deleted successfully.");

            if (selectedCustomModule?.moduleCode === item.moduleCode) {
                setSelectedCustomModule(null);
                dispatch(clearTransactionSchemaState());
                setActiveTab("customTransactions");
            }

            setConfirmTooltip({ show: false, x: null, y: null, item: null, moduleCode: null });

            const remainingItems = transactionModules.length - 1;
            const nextOffset =
                remainingItems === 0 && localOffset > 0
                    ? Math.max(0, localOffset - localLimit)
                    : localOffset;

            if (nextOffset !== localOffset) {
                setLocalOffset(nextOffset);
            } else {
                fetchTransactionModules(nextOffset, { showLoader: false });
            }
        } catch {
            // Slice error is handled by the page-level effect.
        }
    };

    /* ===================================================
       ⭐ CURRENT SCHEMA CONTEXT — works the same whether
       it's a fixed transaction type or a custom module,
       since both are just a `module` string to the API.
    =================================================== */

    const openCustomModuleSchema = (item: TransactionModuleItem) => {
        setSelectedCustomModule(item);
        setActiveTab("customTransactionSchema");
        setSchemaSearch("");
    };

    const schemaContext = useMemo<SchemaContext | null>(() => {
        if (activeTab === "customTransactionSchema" && selectedCustomModule) {
            return {
                moduleKey: selectedCustomModule.moduleCode,
                title: selectedCustomModule.moduleName,
                kind: "custom",
            };
        }

        if (selectedTransaction) {
            return {
                moduleKey: selectedTransaction.key,
                title: selectedTransaction.name,
                kind: "transaction",
            };
        }

        return null;
    }, [activeTab, selectedCustomModule, selectedTransaction]);

    /* ===================================================
       ⭐ LOAD SCHEMA WHENEVER THE MODULE CHANGES
       e.g. dispatch(getAllTransactionSchema("purchaseOrder"))
    =================================================== */

    useEffect(() => {
        if (!schemaContext) return;

        setSchemaSection("header");
        dispatch(clearTransactionSchemaState());
        dispatch(getAllTransactionSchema(schemaContext.moduleKey) as any);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schemaContext?.moduleKey]);

    useEffect(() => {
        if (!schemaError) return;
        toast.error(schemaError);
        dispatch(clearTransactionSchemaError());
    }, [schemaError, dispatch]);

    const reloadSchema = async () => {
        if (!schemaContext) return;
        await dispatch(getAllTransactionSchema(schemaContext.moduleKey) as any).unwrap();
    };

    const isSchemaSubmitting = !!schemaMutating;

    const filteredSchemaFields = useMemo(() => {
        if (!schemaSearch.trim()) return sectionFields;

        const q = schemaSearch.toLowerCase();

        return sectionFields.filter(
            (field) =>
                String(field.key || "").toLowerCase().includes(q) ||
                String(field.label || "").toLowerCase().includes(q) ||
                String(field.type || "").toLowerCase().includes(q) ||
                String(field.ref || "").toLowerCase().includes(q)
        );
    }, [sectionFields, schemaSearch]);

    const handleRefreshSchema = async () => {
        setSchemaRefreshing(true);
        try {
            await reloadSchema();
        } catch {
            // Errors are surfaced through the slice-level effect.
        } finally {
            setSchemaRefreshing(false);
        }
    };

    console.log("filteredSchemaFields", filteredSchemaFields)


    /* ===================================================
       ⭐ SCHEMA-FIELD FORM HELPERS
    =================================================== */

    const closeSchemaForm = () => {
        setShowSchemaForm(false);
        setEditingSchemaFieldKey(null);
        setSchemaForm(INITIAL_SCHEMA_FIELD_FORM);
        setSchemaFormErrors({});
    };

    const openAddSchemaForm = () => {
        if (!schemaContext) return;

        setEditingSchemaFieldKey(null);
        setSchemaForm(INITIAL_SCHEMA_FIELD_FORM);
        setSchemaFormErrors({});
        setShowSchemaForm(true);
    };

    const openEditSchemaForm = (field: SchemaField) => {
        setEditingSchemaFieldKey(field.key);
        setSchemaForm({
            key: field.key || "",
            label: field.label || "",
            type: field.type || "text",
            ref: field.ref || "",
            isRequired: isTruthyFlag(field.isRequired),
            isSearchable: isTruthyFlag(field.isSearchable),
            isFilterable: isTruthyFlag(field.isFilterable),
            isReadonly: isTruthyFlag(field.isReadonly),
            isHidden: isTruthyFlag(field.isHidden),
        });
        setSchemaFormErrors({});
        setShowSchemaForm(true);
    };

    const updateSchemaFormField = (
        field: keyof SchemaFieldForm,
        value: string | boolean
    ) => {
        setSchemaForm((previous) => ({ ...previous, [field]: value }));
        setSchemaFormErrors((previous) => ({ ...previous, [field]: "" }));
    };

    const validateSchemaForm = () => {
        const errors: Partial<Record<keyof SchemaFieldForm, string>> = {};

        if (!schemaForm.key.trim()) errors.key = "Field key is required.";
        if (!schemaForm.label.trim()) errors.label = "Field label is required.";
        if (!schemaForm.type.trim()) errors.type = "Field type is required.";

        setSchemaFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const buildSchemaFieldPayload = (): SchemaField => {
        const payload: SchemaField = {
            key: schemaForm.key.trim(),
            label: schemaForm.label.trim(),
            type: schemaForm.type,
            isRequired: schemaForm.isRequired,
            isSearchable: schemaForm.isSearchable,
            isFilterable: schemaForm.isFilterable,
            isReadonly: schemaForm.isReadonly,
            isHidden: schemaForm.isHidden,
            section: schemaSection,
        };

        if (schemaForm.ref.trim()) payload.ref = schemaForm.ref.trim();

        return payload;
    };
    const handleSchemaSubmit: FormEventHandler<HTMLFormElement> = async (
        event
    ) => {
        event.preventDefault();

        if (!schemaContext || !validateSchemaForm()) {
            return;
        }

        const fieldPayload = buildSchemaFieldPayload();

        const moduleCode = schemaContext.moduleKey?.trim();
        const section = schemaSection?.trim();

        if (!moduleCode) {
            toast.error("Module is required.");
            return;
        }

        if (!section) {
            toast.error("Section is required.");
            return;
        }

        try {
            if (editingSchemaFieldKey) {
                const { key: _ignoredKey, ...updates } = fieldPayload;

                await dispatch(
                    updateTransactionSchema({
                        module: moduleCode,
                        section,
                        key: editingSchemaFieldKey,
                        updates,
                    })
                ).unwrap();

                toast.success(
                    `${schemaContext.title} schema field updated successfully.`
                );
            } else {
                await dispatch(
                    saveTransactionSchema({
                        module: moduleCode,
                        section,
                        fields: [fieldPayload],
                    })
                ).unwrap();

                toast.success(
                    `${schemaContext.title} schema field added successfully.`
                );
            }

            closeSchemaForm();
            await reloadSchema();
        } catch {
            // Redux slice error effect handles the error toast.
        }
    };
    /* ===================================================
       ⭐ SCHEMA TABLE COLUMNS
    =================================================== */
    // add near the top of the file, with other helpers
    const isTruthyFlag = (value: unknown): boolean =>
        value === true || value === "true";


    const schemaColumns = [
        { key: "key", title: "Key", render: (f: SchemaField) => <span>{f.key}</span> },
        { key: "label", title: "Label", render: (f: SchemaField) => f.label || "—" },
        { key: "type", title: "Type", render: (f: SchemaField) => f.type || "—" },
        { key: "reference", title: "Reference", render: (f: SchemaField) => f.ref || "—" },
        {
            key: "isRequired",
            title: "Required",
            render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isRequired)} />,
        },
        {
            key: "isSearchable",
            title: "Searchable",
            render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isSearchable)} />,
        },
        {
            key: "isFilterable",
            title: "Filterable",
            render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isFilterable)} />,
        },
        {
            key: "isReadonly",
            title: "Readonly",
            render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isReadonly)} />,
        },
        {
            key: "isHidden",
            title: "Hidden",
            render: (f: SchemaField) => <BooleanBadge value={isTruthyFlag(f.isHidden)} />,
        },
    ];

    /* ===================================================
       ⭐ CUSTOM TRANSACTION LIST TABLE COLUMNS
    =================================================== */

    const moduleColumns = [
        {
            key: "moduleCode",
            title: "Module Code",
            render: (row: TransactionModuleItem) => (
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                    {row.moduleCode}
                </span>
            ),
        },
        {
            key: "moduleName",
            title: "Module Name",
            render: (row: TransactionModuleItem) => (
                <span className="font-semibold text-card-foreground">{row.moduleName}</span>
            ),
        },
        {
            key: "moduleType",
            title: "Module Type",
            render: (row: TransactionModuleItem) => row.moduleType || "—",
        },
        {
            key: "description",
            title: "Description",
            render: (row: TransactionModuleItem) => row.description || "—",
        },
        {
            key: "status",
            title: "Status",
            render: (row: TransactionModuleItem) => <StatusPill status={row.status} />,
        },
    ];

    /* ===================================================
       ⭐ RENDER SCHEMA BUILDER (DataTable-based)
       Shared by every fixed transaction type AND every
       custom transaction module.
    =================================================== */

    const renderSchemaBuilder = (title: string, description: string, badgeText?: string) => (
        <Panel
            title={title}
            description={description}
            right={
                <div className="flex flex-wrap items-center gap-2">
                    {badgeText ? (
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {badgeText}
                        </span>
                    ) : null}

                    {schemaData?.module?.schemaSource ? (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
                            {schemaData.module.schemaSource} module
                        </span>
                    ) : null}

                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {sectionCounts.total} Total Fields
                    </span>

                    <DataREfreshButton callBackFn={handleRefreshSchema} loading={schemaRefreshing} />

                    <DataCreateButton {...{ callBackFn: openAddSchemaForm, text: " Add Field" }} />
                </div>
            }
        >
            {/* Header / Body / Footer section tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border p-4">
                {SCHEMA_SECTIONS.map((section) => {
                    const isActive = schemaSection === section.key;

                    return (
                        <button
                            key={section.key}
                            type="button"
                            onClick={() => setSchemaSection(section.key)}
                            className={`inline-flex items-center gap-2 rounded-md border px-4 py-1.5 text-sm font-semibold transition ${isActive
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            {section.label}
                            {/* <span
                                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold ${isActive ? "bg-white/20" : "bg-muted text-card-foreground"
                                    }`}
                            >
                                {sectionCounts[section.key]}
                            </span> */}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3 border-b border-border py-3 px-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput search={schemaSearch} setSearch={setSchemaSearch} />
                <Badge
                    count={sectionFields.length}
                    text={`${SCHEMA_SECTIONS.find((s) => s.key === schemaSection)?.label} Fields:`}
                    varient="primary"
                />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
                <DataTable
                    columns={schemaColumns}
                    data={filteredSchemaFields}
                    loading={!!schemaLoading}
                    emptyMessage={`No ${schemaSection} fields found. Click Add Field to create the first one.`}
                    actions={(field: SchemaField) => (
                        <div className="flex justify-start">
                            <button
                                type="button"
                                onClick={() => openEditSchemaForm(field)}
                                disabled={isTruthyFlag(field.isDefault)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                                title={field.isSystemGenerated ? "System-generated field" : "Edit schema field"}
                            >
                                <Edit size={16} />
                            </button>
                        </div>
                    )}
                />
            </div>
        </Panel>
    );

    /* ===================================================
       ⭐ OVERVIEW
    =================================================== */

    const renderOverview = () => (
        <div className="space-y-4">
            <Panel
                title="Transactions Configuration"
                description="Configure fields for every fixed transaction type."
            >
                <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                    {TRANSACTIONS.map((t) => (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => setActiveTab(t.key)}
                            className="flex items-start gap-4 rounded border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                {t.icon}
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm font-semibold text-card-foreground">
                                    {t.name}
                                </span>
                                <span className="mt-1 block text-xs font-medium leading-5 text-muted-foreground">
                                    {t.description}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
            </Panel>

            <Panel
                title="Custom Transactions"
                description="Create business-specific transaction modules and configure a separate schema for each one."
                right={
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {totalDocs} Created
                    </span>
                }
            >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium leading-5 text-muted-foreground">
                        Examples include Delivery Challan, Debit Note, Credit Note and other
                        business-specific transaction types.
                    </p>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("customTransactions")}
                            className="h-10 rounded border border-border bg-background px-4 text-sm font-semibold text-card-foreground transition hover:bg-muted"
                        >
                            View Custom Transactions
                        </button>

                        <button
                            type="button"
                            onClick={openCreateModuleForm}
                            className="inline-flex h-10 items-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            <Plus size={17} />
                            Add Custom Transaction
                        </button>
                    </div>
                </div>
            </Panel>
        </div>
    );

    /* ===================================================
       ⭐ CUSTOM TRANSACTIONS LIST (DataTable-based)
    =================================================== */

    const renderCustomTransactions = () => (
        <>
            <Panel
                title="Custom Transactions"
                description="Create modules, edit module information, delete unused modules and configure fields for each module."
                right={
                    <div className="flex items-center gap-2">
                        <DataREfreshButton callBackFn={handleRefreshModules} loading={refreshing} />

                        <button
                            type="button"
                            onClick={openCreateModuleForm}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                        >
                            <Plus size={17} />
                            Add Custom Transaction
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <SearchInput search={search} setSearch={setSearch} />

                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setLocalOffset(0);
                            }}
                            className="h-10 rounded border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <Badge count={totalDocs} text="Total Custom Transactions:" varient="primary" />
                </div>

                <div className="min-h-0 flex-1 overflow-hidden">
                    <DataTable
                        columns={moduleColumns}
                        data={transactionModules}
                        loading={moduleLoading}
                        emptyMessage="No custom transactions found."
                        actions={(item: TransactionModuleItem) => (
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => openCustomModuleSchema(item)}
                                    className="inline-flex h-9 items-center gap-2 rounded border border-border px-3 text-primary transition hover:bg-primary/10"
                                    title="Configure fields"
                                >
                                    <Settings2 size={16} />
                                    Fields
                                </button>

                                <button
                                    type="button"
                                    onClick={() => openEditModuleForm(item.moduleCode)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-primary transition hover:bg-primary/10"
                                    title="Edit custom transaction"
                                >
                                    <Edit size={16} />
                                </button>

                                <button
                                    type="button"
                                    disabled={deleteLoading}
                                    onClick={(e) => handleDeleteClick(e, item)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="Delete custom transaction"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    />
                </div>
            </Panel>

            {totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(e: any) => {
                        setLocalLimit(Number(e.target.value));
                        setLocalOffset(0);
                    }}
                    preDisabled={!pagination?.hasPrevPage && currentPage <= 1}
                    nextDisabled={!pagination?.hasNextPage && currentPage >= totalPages}
                    setLocalOffset={setLocalOffset}
                    pagination={pagination}
                />
            )}
        </>
    );

    /* ===================================================
       ⭐ ACTIVE CONTENT
    =================================================== */

    const renderActiveContent = () => {
        if (activeTab === "overview") return renderOverview();

        if (activeTab === "customTransactions") return renderCustomTransactions();

        if (activeTab === "customTransactionSchema" && selectedCustomModule) {
            return (
                <div className="space-y-4">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("customTransactions");
                            setSelectedCustomModule(null);
                            dispatch(clearTransactionSchemaState());
                        }}
                        className="inline-flex h-9 items-center gap-2 rounded border border-border bg-card px-3 text-sm font-semibold text-card-foreground transition hover:bg-muted"
                    >
                        <ArrowLeft size={16} />
                        Back to Custom Transactions
                    </button>

                    {renderSchemaBuilder(
                        `${selectedCustomModule.moduleName} Schema`,
                        `Configure fields for ${selectedCustomModule.moduleName}.`,
                        selectedCustomModule.moduleCode
                    )}
                </div>
            );
        }

        if (selectedTransaction) {
            return renderSchemaBuilder(
                `${selectedTransaction.name} Schema`,
                selectedTransaction.description,
                "Transaction"
            );
        }

        return renderOverview();
    };

    /* ===================================================
       ⭐ PAGE
    =================================================== */

    return (
        <div className="min-h-screen bg-background p-4 md:p-4">
            <div className=" space-y-4">
                <header className="flex flex-col gap-3 rounded border border-border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="flex h-9 w-9 items-center justify-center rounded border border-border bg-background text-card-foreground transition hover:bg-muted"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div>
                            <h1 className="text-xl font-semibold text-card-foreground">
                                Transactions Configuration
                            </h1>
                            <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                Configure fixed-transaction fields and manage custom-transaction
                                modules with their own schemas.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {TRANSACTIONS.length} Transactions
                        </span>
                        <span className="rounded-md bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {totalDocs} Custom Transactions
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                    <aside className="max-h-max rounded border border-border bg-card p-2 shadow-sm lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
                        <div className="mb-2 px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Transaction Menu
                            </p>
                        </div>

                        <div className="space-y-1">
                            {tabs.map((tab) => {
                                const isActive =
                                    activeTab === tab.key ||
                                    (tab.key === "customTransactions" &&
                                        activeTab === "customTransactionSchema");

                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(tab.key);

                                            if (tab.key !== "customTransactions") {
                                                setSelectedCustomModule(null);
                                                dispatch(clearTransactionSchemaState());
                                            }
                                        }}
                                        className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-bold transition ${isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-muted hover:text-card-foreground"
                                            }`}
                                    >
                                        <span
                                            className={`flex h-8 w-8 items-center justify-center rounded ${isActive ? "bg-white/15" : "bg-background text-primary"
                                                }`}
                                        >
                                            {tab.icon}
                                        </span>
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    <main className="min-w-0 space-y-4">{renderActiveContent()}</main>
                </div>
            </div>

            {/* ===================================================
          ⭐ CUSTOM TRANSACTION CREATE / EDIT MODAL
      =================================================== */}

            {showModuleForm ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-xl overflow-hidden rounded border border-border bg-card shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-card-foreground">
                                    {editingModuleCode ? "Edit Custom Transaction" : "Add Custom Transaction"}
                                </h2>
                                {editingModuleCode ? (
                                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                        Module Code: {editingModuleCode}
                                    </p>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={closeModuleForm}
                                disabled={isModuleSubmitting}
                                className="rounded p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {editingModuleCode && moduleLoading && !selectedTransactionModule ? (
                            <div className="flex items-center justify-center gap-2 px-5 py-16 text-muted-foreground">
                                Loading custom transaction...
                            </div>
                        ) : (
                            <form onSubmit={handleModuleSubmit} className="space-y-5 p-5">
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                        Module Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={moduleForm.moduleName}
                                        onChange={(event) => updateModuleFormField("moduleName", event.target.value)}
                                        placeholder="Example: Delivery Challan"
                                        maxLength={100}
                                        className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${moduleFormErrors.moduleName ? "border-danger" : "border-input"
                                            }`}
                                    />
                                    {moduleFormErrors.moduleName ? (
                                        <p className="mt-1 text-xs font-semibold text-danger">
                                            {moduleFormErrors.moduleName}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                        Module Type <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={moduleForm.moduleType}
                                        onChange={(event) => updateModuleFormField("moduleType", event.target.value)}
                                        placeholder="Example: sales / purchase / inventory"
                                        maxLength={100}
                                        className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${moduleFormErrors.moduleType ? "border-danger" : "border-input"
                                            }`}
                                    />
                                    {moduleFormErrors.moduleType ? (
                                        <p className="mt-1 text-xs font-semibold text-danger">
                                            {moduleFormErrors.moduleType}
                                        </p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                        Description
                                    </label>
                                    <textarea
                                        value={moduleForm.description}
                                        onChange={(event) => updateModuleFormField("description", event.target.value)}
                                        placeholder="Describe where this transaction will be used"
                                        rows={4}
                                        maxLength={500}
                                        className="w-full resize-none rounded border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <div className="mt-1 flex items-center justify-end">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {moduleForm.description.length}/500
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                        Status
                                    </label>
                                    <select
                                        value={moduleForm.status}
                                        onChange={(event) =>
                                            updateModuleFormField("status", event.target.value)
                                        }
                                        className="h-10 w-full rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                {moduleError ? (
                                    <div className="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                                        {moduleError}
                                    </div>
                                ) : null}

                                <div className="flex justify-end gap-3 border-t border-border pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModuleForm}
                                        disabled={isModuleSubmitting}
                                        className="h-10 rounded border border-border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isModuleSubmitting}
                                        className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {editingModuleCode ? "Update" : "Create"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            ) : null}

            {/* ===================================================
          ⭐ SCHEMA FIELD MODAL — shared by transaction
          types AND custom transaction modules
      =================================================== */}

            {showSchemaForm && schemaContext ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded border border-border bg-card shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-card-foreground">
                                    {editingSchemaFieldKey ? "Update Schema Field" : "Add Schema Field"}
                                </h2>
                                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                    {schemaContext.title}
                                    {schemaContext.kind === "custom" ? ` · ${schemaContext.moduleKey}` : " · Transaction"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeSchemaForm}
                                disabled={isSchemaSubmitting}
                                className="rounded p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={handleSchemaSubmit} className="space-y-5 p-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                        Field Key <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        value={schemaForm.key}
                                        onChange={(event) => updateSchemaFormField("key", event.target.value)}
                                        disabled={!!editingSchemaFieldKey}
                                        placeholder="Example: dueDate"
                                        className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 ${schemaFormErrors.key ? "border-danger" : "border-input"
                                            }`}
                                    />
                                    {schemaFormErrors.key ? (
                                        <p className="mt-1 text-xs font-semibold text-danger">{schemaFormErrors.key}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                        Field Label <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        value={schemaForm.label}
                                        onChange={(event) => updateSchemaFormField("label", event.target.value)}
                                        placeholder="Example: Due Date"
                                        className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none ${schemaFormErrors.label ? "border-danger" : "border-input"
                                            }`}
                                    />
                                    {schemaFormErrors.label ? (
                                        <p className="mt-1 text-xs font-semibold text-danger">{schemaFormErrors.label}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                        Field Type <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        value={schemaForm.type}
                                        onChange={(event) => updateSchemaFormField("type", event.target.value)}
                                        className="h-10 w-full rounded border border-input bg-background px-3 text-sm font-semibold outline-none"
                                    >
                                        {FIELD_TYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                                        Reference
                                    </label>
                                    <input
                                        value={schemaForm.ref}
                                        onChange={(event) => updateSchemaFormField("ref", event.target.value)}
                                        placeholder="Example: productmaster"
                                        className="h-10 w-full rounded border border-input bg-background px-3 text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                {[
                                    { key: "isRequired", label: "Required" },
                                    { key: "isSearchable", label: "Searchable" },
                                    { key: "isFilterable", label: "Filterable" },
                                    { key: "isReadonly", label: "Readonly" },
                                    { key: "isHidden", label: "Hidden" },
                                ].map((option) => (
                                    <label
                                        key={option.key}
                                        className="flex cursor-pointer items-center gap-2 rounded border border-border bg-background px-3 py-3 text-sm font-bold"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!schemaForm[option.key as keyof SchemaFieldForm]}
                                            onChange={(event) =>
                                                updateSchemaFormField(
                                                    option.key as keyof SchemaFieldForm,
                                                    event.target.checked
                                                )
                                            }
                                        />
                                        {option.label}
                                    </label>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 border-t border-border pt-4">
                                <button
                                    type="button"
                                    onClick={closeSchemaForm}
                                    disabled={isSchemaSubmitting}
                                    className="h-10 rounded border border-border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSchemaSubmitting}
                                    className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Save size={16} />
                                    {editingSchemaFieldKey ? "Update Field" : "Add Field"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {/* ===================================================
          ⭐ DELETE CONFIRM TOOLTIP (Custom Transaction)
      =================================================== */}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message={`Are you sure you want to delete ${confirmTooltip?.item?.moduleName || "this custom transaction"
                        } (${confirmTooltip?.moduleCode || ""})?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({ show: false, x: null, y: null, item: null, moduleCode: null })
                    }
                />
            )}
        </div>
    );
};

export default TransactionConfiguration;