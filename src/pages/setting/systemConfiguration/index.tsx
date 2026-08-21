import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
    ArrowLeft,
    Check,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Loader2,
    MessageSquareText,
    Package,
    Phone,
    Recycle,
    Settings,
    ShieldCheck,
    ShoppingCart,
    Truck,
    WalletCards,
    X,
    Ticket
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
    clearSystemConfigurationError,
    enableWhatsAppWithDefaultModulesLocal,
    getLatestSystemConfiguration,
    saveOrUpdateSystemConfiguration,
    setWhatsAppModuleEnabledLocal,
    updateFinanceConfigurationLocalField,
    updateInventoryConfigurationLocalField,
    updateSystemConfigurationNestedField,
    updateWhatsAppModuleLocalToggle,
    verifyWhatsAppMetaCredentials
} from "../../../redux/slices/systemConf";

import {
    acceptRequestsUser,
    getDbAccessRequestsUser
} from "../../../redux/slices/userExplorer";
import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { Checkbox, SelectInput } from "../../../components/inputs";
import Modal from "../../../components/modal";
import {
    resolveInventoryTagLevel,
    syncInventoryTagLevelMasters
} from "./syncInventoryTagLevelMasters";

/* ===================================================
   CONSTANTS
=================================================== */

const WHATSAPP_SUPPORT_EMAIL = "support@nexoraxtechnologies.com";
const WHATSAPP_SUPPORT_MOBILE = "+91-9579486979";

const BOOKEZ_WHATSAPP_MODULE_CONFIG_KEY = "BOOKEZ_WHATSAPP_MODULE_CONFIG";
const BOOKEZ_WHATSAPP_SEND_ENABLED_KEY = "BOOKEZ_WHATSAPP_SEND_ENABLED";

const WHATSAPP_MODULE_ORDER = [
    "salesQuotation",
    "salesOrder",
    "salesInvoice",
    "salesReturn",
    "receipt",
    "purchaseOrder",
    "grn",
    "purchaseInvoice",
    "purchaseReturn",
    "payment",
];

const WHATSAPP_MODULE_LABELS: Record<string, string> = {
    salesQuotation: "Sales Quotation",
    salesOrder: "Sales Order",
    salesInvoice: "Sales Invoice",
    salesReturn: "Sales Return",
    receipt: "Receipt",
    purchaseOrder: "Purchase Order",
    grn: "GRN",
    purchaseInvoice: "Purchase Invoice",
    purchaseReturn: "Purchase Return",
    payment: "Purchase Payment",
};

const inventoryTagLevelOptions = [
    { label: "Warehouse", value: "WAREHOUSE" },
    { label: "Warehouse + Location", value: "WAREHOUSE_LOCATION" },
    {
        label: "Warehouse + Location + Bin",
        value: "WAREHOUSE_LOCATION_BIN",
    },
    {
        label: "Warehouse + Location + Bin + Batch",
        value: "WAREHOUSE_LOCATION_BIN_BATCH",
    },
    {
        label: "Full Tracking",
        value: "FULL_TRACKING_WITH_WAREHOUSE_LOCATION_BATCH_BIN_SERIAL",
    },
];

const whereToAdd = [
    { label: "Transaction Header", value: "header" },
    { label: "Transaction Body (Line Item)", value: "body" },
];

const normalizeWhereToAddValue = (value: any) => {
    const rawValue =
        value && typeof value === "object"
            ? value?.value ?? value?.code ?? value?.key ?? value?.name ?? value?.label ?? ""
            : value;

    const normalized = String(rawValue || "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    if (["header", "transaction header", "header level", "transaction level"].includes(normalized)) return "header";
    if (["body", "transaction body", "transaction body (line item)", "line item", "lineitem", "body level"].includes(normalized)) return "body";

    return "";
};

const getWhereToAddLabel = (value: any) => {
    const normalized = normalizeWhereToAddValue(value);

    if (normalized === "header") return "Transaction Header";
    if (normalized === "body") return "Transaction Body (Line Item)";

    return "Not Selected";
};

const inventoryPickMethodOptions = [
    { label: "FIFO", value: "FIFO" },
    { label: "LIFO", value: "LIFO" },
    { label: "FEFO", value: "FEFO" },
    {
        label: "FIFO With Batch Priority & Expiry Validation",
        value: "FIFO_WITH_BATCH_PRIORITY_AND_EXPIRY_VALIDATION",
    },
];

const negativeStockPolicyOptions = [
    { label: "Allow", value: "ALLOW" },
    { label: "Allow & Warn", value: "ALLOW_WARN" },
    { label: "Stop", value: "STOP" },
];

/* ===================================================
   UI COMPONENTS
=================================================== */

const ToggleSwitch = ({
    checked,
    onChange,
    disabled = false,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}) => {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`
                relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300
                disabled:cursor-not-allowed disabled:opacity-50
                ${checked ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"}
            `}
        >
            <span
                className={`
                    h-5 w-5 rounded-full bg-white shadow transition-all duration-300
                    ${checked ? "translate-x-[22px]" : "translate-x-0.5"}
                `}
            />
        </button>
    );
};

const SettingRow = ({
    title,
    description,
    value,
    onChange,
    disabled = false,
}: {
    title: string;
    description?: string;
    value: boolean;
    onChange: (value: boolean) => void;
    disabled?: boolean;
}) => {
    return (
        <div className="flex items-center justify-between gap-5 border-b border-border px-5 py-4 last:border-b-0">
            <div className="min-w-0">
                <h4 className="text-sm font-bold text-card-foreground">
                    {title}
                </h4>

                {description ? (
                    <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>

            <ToggleSwitch checked={!!value} onChange={onChange} disabled={disabled} />
        </div>
    );
};

const SelectRow = ({
    title,
    description,
    value,
    onChange,
    options,
}: {
    title: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
}) => {
    return (
        <div className="grid grid-cols-1 gap-3 border-b border-border px-5 py-4 last:border-b-0 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
                <h4 className="text-sm font-bold text-card-foreground">
                    {title}
                </h4>

                {description ? (
                    <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>

            <select
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                className="
                    h-10 w-full rounded-lg border border-border bg-background px-3
                    text-sm font-semibold text-card-foreground outline-none
                    transition focus:border-primary focus:ring-2 focus:ring-primary/20
                "
            >
                <option value="">Select</option>

                {options.map((item) => (
                    <option key={item.value} value={item.value}>
                        {item.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

const Panel = ({
    title = "",
    description = "",
    children = <></>,
    right,
    isHeader = true,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    right?: ReactNode;
    isHeader?: boolean;
}) => {
    return (
        <div className="overflow-hidden rounded border border-border bg-card shadow-sm">
            {isHeader && (
                <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                    <div>
                        <h3 className="text-base font-semibold text-card-foreground">
                            {title}
                        </h3>

                        {description ? (
                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                                {description}
                            </p>
                        ) : null}
                    </div>

                    {right}
                </div>
            )}

            <div>{children}</div>
        </div>
    );
};

const BadgeStatus = ({ active }: { active: boolean }) => {
    return (
        <span
            className={`
                rounded-full px-2.5 py-1 text-[11px] font-semibold
                ${active
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }
            `}
        >
            {active ? "Enabled" : "Disabled"}
        </span>
    );
};

/* ===================================================
   MAIN PAGE
=================================================== */

const SystemConfiguration = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<any>();
    const [dbRequest, setDbRequest] = useState([]);

    const {
        configuration,
        loading,
        saveLoading,
        whatsappVerifyLoading,
        error,
    } = useSelector((state: any) => state.systemConfiguration);

    const localUser = JSON.parse(
        localStorage.getItem("professionalUser") || "{}"
    );

    const tabs = useMemo(
        () => [
            {
                key: "system",
                label: "System Config",
                icon: <Settings size={17} />,
            },
            {
                key: "inventory",
                label: "Inventory Config",
                icon: <Package size={17} />,
            },
            {
                key: "finance",
                label: "Finance Config",
                icon: <WalletCards size={17} />,
            },
            {
                key: "pos",
                label: "POS Config",
                icon: <ShoppingCart size={17} />,
            },
            {
                key: "scrap",
                label: "Scrap Mgmt Config",
                icon: <Recycle size={17} />,
            },
            {
                key: "transportation",
                label: "Transportation Config",
                icon: <Truck size={17} />,
            },
            {
                key: "engineering",
                label: "Engineering Module Config",
                icon: <Truck size={17} />,
            },
            ...(localUser?.accountType !== "SUPER_ADMIN"
                ? [
                    {
                        key: "dbRequest",
                        label: "DB Request",
                        icon: <Ticket size={17} />,
                    },
                ]
                : []),
        ],
        []
    );

    const [activeTab, setActiveTab] = useState("system");
    const [waModulesExpanded, setWaModulesExpanded] = useState(true);
    const [dbReqLoader, setDbReqLoader] = useState(false);
    const [showWhereToAddWarning, setShowWhereToAddWarning] = useState(false);
    const [currentWhereToAdd, setCurrentWhereToAdd] = useState("");
    const [pendingWhereToAdd, setPendingWhereToAdd] = useState("");
    const [whereToAddConfirmed, setWhereToAddConfirmed] = useState(false);

    const saving = saveLoading;
    const whatsAppVerifying = whatsappVerifyLoading;

    const systemConfig = configuration?.systemConfiguration || {};
    const inventoryConfig = configuration?.inventoryConfiguration || {};
    const financeConfig = configuration?.financeConfiguration || {};

    const transportationModuleConfiguration =
        configuration?.systemConfiguration
            ?.transportationModuleConfiguration || {};

    const whatsAppConfig =
        systemConfig?.whatsAppConfiguration || {};

    const { accounts } = useSelector(
        (s: any) => s.accountMaster
    );

    const showWhereToAdd =
        inventoryConfig?.inventoryTagLevel === "WAREHOUSE" ||
        inventoryConfig?.inventoryTagLevel === "WAREHOUSE_LOCATION";

    const acceptDbRequest = async ({
        action,
        requestId,
    }: any) => {
        setDbReqLoader(true);

        const res = await dispatch(
            acceptRequestsUser({
                requestId,
                action,
            }) as any
        );

        getDBAccessReq();

        toast.success(
            res?.payload?.message
        );

        setDbReqLoader(false);
    };

    useEffect(() => {
        dispatch(
            getLatestSystemConfiguration()
        );
    }, [dispatch]);

    useEffect(() => {
        if (!error) return;

        toast.error(error);

        dispatch(
            clearSystemConfigurationError()
        );
    }, [error, dispatch]);

    const getDBAccessReq = async () => {
        let res;

        res = await dispatch(
            getDbAccessRequestsUser({
                status: "",
            })
        );

        const get =
            res?.payload?.records?.filter(
                (e: any) =>
                    e?.status == "PENDING"
            );

        setDbRequest(get);
    };

    useEffect(() => {
        localUser?.accountType !==
            "SUPER_ADMIN" &&
            getDBAccessReq();

        dispatch(
            getAllAccounts({
                offset: 0,
                limit: 1000,
                accountType: "expense",
            })
        );
    }, []);

    useEffect(() => {
        if (
            !showWhereToAdd &&
            inventoryConfig
                ?.whereToAddInventory
        ) {
            dispatch(
                updateInventoryConfigurationLocalField(
                    {
                        key: "whereToAddInventory",
                        value: "",
                    } as any
                )
            );
        }
    }, [
        dispatch,
        showWhereToAdd,
        inventoryConfig
            ?.whereToAddInventory,
    ]);

    useEffect(() => {
        if (
            whatsAppConfig
                ?.enableWhatsAppModule
        ) {
            localStorage.setItem(
                BOOKEZ_WHATSAPP_SEND_ENABLED_KEY,
                "1"
            );
        } else {
            localStorage.removeItem(
                BOOKEZ_WHATSAPP_SEND_ENABLED_KEY
            );
        }
    }, [
        whatsAppConfig
            ?.enableWhatsAppModule,
    ]);

    useEffect(() => {
        if (
            !whatsAppConfig
                ?.enableWhatsAppModule
        ) {
            localStorage.removeItem(
                BOOKEZ_WHATSAPP_MODULE_CONFIG_KEY
            );

            return;
        }

        localStorage.setItem(
            BOOKEZ_WHATSAPP_MODULE_CONFIG_KEY,
            JSON.stringify(
                whatsAppConfig
                    ?.moduleConfiguration ||
                {}
            )
        );
    }, [whatsAppConfig]);

    const updateInventoryField =
        useCallback(
            (
                key: string,
                value: any
            ) => {
                dispatch(
                    updateInventoryConfigurationLocalField(
                        {
                            key,
                            value,
                        } as any
                    )
                );
            },
            [dispatch]
        );

    const handleWhereToAddChange = useCallback((value: string) => {
        const currentValue = normalizeWhereToAddValue(
            inventoryConfig?.whereToAddInventory
        );

        const nextValue = normalizeWhereToAddValue(value);

        if (currentValue && nextValue && currentValue !== nextValue) {
            setCurrentWhereToAdd(currentValue);
            setPendingWhereToAdd(nextValue);
            setWhereToAddConfirmed(false);
            setShowWhereToAddWarning(true);
            return;
        }

        updateInventoryField("whereToAddInventory", nextValue);
    }, [inventoryConfig?.whereToAddInventory, updateInventoryField]);

    const closeWhereToAddWarning = useCallback(() => {
        setShowWhereToAddWarning(false);
        setCurrentWhereToAdd("");
        setPendingWhereToAdd("");
        setWhereToAddConfirmed(false);
    }, []);

    const confirmWhereToAddChange = useCallback(() => {
        if (!whereToAddConfirmed) {
            toast.warning("Please confirm that you understand this change may affect existing transaction data.");
            return;
        }

        if (!pendingWhereToAdd) return;

        updateInventoryField("whereToAddInventory", pendingWhereToAdd);
        closeWhereToAddWarning();
    }, [whereToAddConfirmed, pendingWhereToAdd, updateInventoryField, closeWhereToAddWarning]);

    const updateFinanceField =
        useCallback(
            (
                key: string,
                value: any
            ) => {
                dispatch(
                    updateFinanceConfigurationLocalField(
                        {
                            key,
                            value,
                        } as any
                    )
                );
            },
            [dispatch]
        );

    const updateSystemField =
        useCallback(
            (
                section: string,
                key: string,
                value: any
            ) => {
                dispatch(
                    updateSystemConfigurationNestedField(
                        {
                            section,
                            key,
                            value,
                        } as any
                    )
                );
            },
            [dispatch]
        );

    const updateWhatsAppModuleToggle =
        useCallback(
            (
                moduleKey: string,
                enabled: boolean
            ) => {
                dispatch(
                    updateWhatsAppModuleLocalToggle(
                        {
                            moduleKey,
                            enabled,
                        } as any
                    )
                );
            },
            [dispatch]
        );

    const showWhatsAppSupportModal =
        useCallback(() => {
            toast.warning(
                `WhatsApp not configured. Contact support: ${WHATSAPP_SUPPORT_EMAIL}, ${WHATSAPP_SUPPORT_MOBILE}`
            );
        }, []);

    const handleEnableWhatsAppModuleToggle =
        useCallback(
            async (
                nextEnabled: boolean
            ) => {
                if (!nextEnabled) {
                    dispatch(
                        setWhatsAppModuleEnabledLocal(
                            false as any
                        )
                    );

                    localStorage.removeItem(
                        BOOKEZ_WHATSAPP_SEND_ENABLED_KEY
                    );

                    localStorage.removeItem(
                        BOOKEZ_WHATSAPP_MODULE_CONFIG_KEY
                    );

                    return;
                }

                try {
                    const loginuser =
                        JSON.parse(
                            localStorage.getItem(
                                "professionalUser"
                            ) || ""
                        )
                            ?.userMobileNumberHash;

                    if (!loginuser) {
                        toast.error(
                            "Logged-in user identity is missing. Please sign in again."
                        );

                        return;
                    }

                    await dispatch(
                        verifyWhatsAppMetaCredentials(
                            {
                                loginuser,
                            }
                        )
                    ).unwrap();

                    dispatch(
                        enableWhatsAppWithDefaultModulesLocal()
                    );

                    localStorage.setItem(
                        BOOKEZ_WHATSAPP_SEND_ENABLED_KEY,
                        "1"
                    );

                    toast.success(
                        "WhatsApp configured successfully"
                    );
                } catch {
                    showWhatsAppSupportModal();
                }
            },
            [
                dispatch,
                showWhatsAppSupportModal,
            ]
        );

    const handleSave = useCallback(async () => {
        try {
            const result = await dispatch(saveOrUpdateSystemConfiguration({ configuration, })).unwrap();

            try {
                const inventoryConfiguration =
                    result
                        ?.configuration
                        ?.inventoryConfiguration ||
                    configuration
                        ?.inventoryConfiguration ||
                    {};

                const inventoryTagLevel =
                    resolveInventoryTagLevel(
                        inventoryConfiguration
                    );

                const whereToAddInventory =
                    inventoryConfiguration
                        ?.whereToAddInventory ||
                    "";

                const inventoryMasterSync =
                    await syncInventoryTagLevelMasters(
                        inventoryTagLevel,
                        whereToAddInventory
                    );

                console.log(
                    "Inventory Master synchronization result:",
                    inventoryMasterSync
                );
            } catch (
            syncError
            ) {
                console.log(
                    "syncInventoryTagLevelMasters error:",
                    syncError
                );
            }

            if (result?.vehicleMasterSync?.failed) {
                toast.error(
                    result?.vehicleMasterSync?.message ||
                    "Configuration saved, but Vehicle Master synchronization failed."
                );
            }

            if (result?.transportationTransactionFieldSync?.failed) {
                toast.error(
                    result?.transportationTransactionFieldSync?.message ||
                    "Configuration saved, but Receipt / Payment transportation fields synchronization failed."
                );
            }

            if (
                configuration?.systemConfiguration
                    ?.transportationModuleConfiguration
                    ?.enableTransportationModule &&
                result?.transportationTransactionFieldSync?.skipped &&
                result?.transportationTransactionFieldSync?.reason
            ) {
                toast.warning(
                    result.transportationTransactionFieldSync.reason
                );
            }

            toast.success(
                result?.message ||
                (configuration
                    ?.configurationCode
                    ? "Configuration updated successfully"
                    : "Configuration saved successfully")
            );
            // window.location.reload();
        } catch (err: any) {
            toast.error(
                err?.message ||
                "Failed to save configuration"
            );
        }
    }, [dispatch, configuration]);

    const renderSystemTab = () => {
        return (
            <div className="space-y-4">
                <Panel
                    title="Sales Quotation"
                    description="Basic sales quotation configuration."
                    right={
                        <BadgeStatus
                            active={
                                !!systemConfig
                                    ?.salesQuotation
                                    ?.enableLocation
                            }
                        />
                    }
                >
                    <SettingRow
                        title="Enable Location"
                        description="Allow users to select location while creating sales quotation."
                        value={
                            !!systemConfig
                                ?.salesQuotation
                                ?.enableLocation
                        }
                        onChange={(
                            value
                        ) =>
                            updateSystemField(
                                "salesQuotation",
                                "enableLocation",
                                value
                            )
                        }
                    />
                </Panel>

                <Panel
                    title="KIT Configuration"
                    description="Control KIT functionality in BookEZ."
                    right={
                        <BadgeStatus
                            active={
                                !!systemConfig
                                    ?.kitConfiguration
                                    ?.enableKit
                            }
                        />
                    }
                >
                    <SettingRow
                        title="Enable KIT"
                        description="Enable or disable KIT functionality in BookEZ."
                        value={
                            !!systemConfig
                                ?.kitConfiguration
                                ?.enableKit
                        }
                        onChange={(
                            value
                        ) =>
                            updateSystemField(
                                "kitConfiguration",
                                "enableKit",
                                value
                            )
                        }
                    />
                </Panel>

                <Panel
                    title="Bank Statement Import"
                    description="Control bank statement import from system configuration."
                    right={
                        <BadgeStatus
                            active={
                                !!systemConfig
                                    ?.bankStatementConfiguration
                                    ?.enableBankStatementImport
                            }
                        />
                    }
                >
                    <SettingRow
                        title="Enable Bank Statement Import"
                        description="Allow users to import bank statements."
                        value={
                            !!systemConfig
                                ?.bankStatementConfiguration
                                ?.enableBankStatementImport
                        }
                        onChange={(
                            value
                        ) =>
                            updateSystemField(
                                "bankStatementConfiguration",
                                "enableBankStatementImport",
                                value
                            )
                        }
                    />
                </Panel>

                <Panel
                    title="WhatsApp Configuration"
                    description="Control WhatsApp sending and module-wise message permissions."
                    right={
                        <BadgeStatus
                            active={
                                !!whatsAppConfig
                                    ?.enableWhatsAppModule
                            }
                        />
                    }
                >
                    <SettingRow
                        title="Enable WhatsApp Module"
                        description="Before enabling, system will verify Meta credentials for the logged-in user."
                        value={
                            !!whatsAppConfig
                                ?.enableWhatsAppModule
                        }
                        onChange={
                            handleEnableWhatsAppModuleToggle
                        }
                        disabled={
                            whatsAppVerifying ||
                            loading ||
                            saving
                        }
                    />

                    {whatsAppConfig
                        ?.enableWhatsAppModule ? (
                        <div className="border-t border-border">
                            <button
                                type="button"
                                onClick={() =>
                                    setWaModulesExpanded(
                                        (
                                            prev
                                        ) =>
                                            !prev
                                    )
                                }
                                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-muted/40"
                            >
                                <div>
                                    <h4 className="text-sm font-semibold text-card-foreground">
                                        Module
                                        Permissions
                                    </h4>

                                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                                        Select
                                        which
                                        modules
                                        can send
                                        WhatsApp
                                        messages.
                                    </p>
                                </div>

                                {waModulesExpanded ? (
                                    <ChevronUp
                                        size={
                                            18
                                        }
                                        className="text-muted-foreground"
                                    />
                                ) : (
                                    <ChevronDown
                                        size={
                                            18
                                        }
                                        className="text-muted-foreground"
                                    />
                                )}
                            </button>

                            {waModulesExpanded ? (
                                <div className="grid grid-cols-1 border-t border-border md:grid-cols-2 xl:grid-cols-3">
                                    {WHATSAPP_MODULE_ORDER.map(
                                        (
                                            modKey
                                        ) => (
                                            <div
                                                key={
                                                    modKey
                                                }
                                                className="flex items-center justify-between gap-3 border-b border-r border-border px-5 py-3"
                                            >
                                                <span className="text-sm font-bold text-card-foreground">
                                                    {WHATSAPP_MODULE_LABELS[
                                                        modKey
                                                    ] ||
                                                        modKey}
                                                </span>

                                                <ToggleSwitch
                                                    checked={
                                                        !!whatsAppConfig
                                                            ?.moduleConfiguration?.[
                                                            modKey
                                                        ]
                                                            ?.enabled
                                                    }
                                                    onChange={(
                                                        value
                                                    ) =>
                                                        updateWhatsAppModuleToggle(
                                                            modKey,
                                                            value
                                                        )
                                                    }
                                                />
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="border-t border-border bg-muted/20 px-5 py-4">
                            <button
                                type="button"
                                onClick={
                                    showWhatsAppSupportModal
                                }
                                className="text-left text-xs font-semibold leading-5 text-muted-foreground hover:text-primary"
                            >
                                WhatsApp is
                                disabled.
                                Enable it to
                                configure
                                module-wise
                                message
                                sending. If
                                Meta
                                credentials
                                are missing,
                                click here
                                for support
                                details.
                            </button>
                        </div>
                    )}
                </Panel>

                <Panel
                    title="Product Settings"
                    description="Control product master behavior."
                    right={
                        <BadgeStatus
                            active={
                                !!systemConfig
                                    ?.productSettings
                                    ?.allowDuplicateProduct
                            }
                        />
                    }
                >
                    <SettingRow
                        title="Allow Duplicate Product"
                        description="Allow creating duplicate products in product master."
                        value={
                            !!systemConfig
                                ?.productSettings
                                ?.allowDuplicateProduct
                        }
                        onChange={(
                            value
                        ) =>
                            updateSystemField(
                                "productSettings",
                                "allowDuplicateProduct",
                                value
                            )
                        }
                    />
                </Panel>
            </div>
        );
    };

    const dbRequestTab = () => {
        return (
            <div className="space-y-2">
                {dbRequest?.length ? (
                    dbRequest.map(
                        (e: any) => (
                            <div
                                key={
                                    e?.requestId
                                }
                                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:shadow-sm"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h6 className="truncate text-sm font-semibold text-card-foreground">
                                                {
                                                    e?.requestId
                                                }
                                            </h6>

                                            <span className="rounded bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                                                Pending
                                            </span>
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Phone size={13} />
                                                {e?.requestedByAdminMobile}
                                            </span>

                                            <span className="flex items-center gap-1 truncate">
                                                <MessageSquareText size={13} />
                                                {e?.requestMessage}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ml-4 flex shrink-0 items-center gap-2">
                                    <button
                                        disabled={dbReqLoader}
                                        onClick={() =>
                                            acceptDbRequest(
                                                {
                                                    action: "ACCEPT",
                                                    requestId:
                                                        e?.requestId,
                                                }
                                            )
                                        }
                                        className="flex h-8 items-center gap-1 rounded-md bg-success px-3 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                                    >
                                        <Check size={14} />
                                        Accept
                                    </button>

                                    <button
                                        disabled={dbReqLoader}
                                        onClick={() =>
                                            acceptDbRequest(
                                                {
                                                    action: "REJECT",
                                                    requestId:
                                                        e?.requestId,
                                                }
                                            )
                                        }
                                        className="flex h-8 items-center gap-1 rounded-md bg-danger px-3 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                                    >
                                        <X size={14} />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )
                    )
                ) : (
                    <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-card text-sm text-muted-foreground">
                        No pending requests
                    </div>
                )}
            </div>
        );
    };

    const renderInventoryTab = () => {
        return (
            <Panel
                title="Inventory Setup"
                description="Manage stock tracking, picking method and negative stock rules."
                right={
                    <BadgeStatus
                        active={
                            !!inventoryConfig
                                ?.maintainInventory
                        }
                    />
                }
            >
                <SettingRow
                    title="Maintain Inventory"
                    description="Enable stock inward, outward and balance tracking."
                    value={
                        !!inventoryConfig
                            ?.maintainInventory
                    }
                    onChange={(
                        value
                    ) =>
                        updateInventoryField(
                            "maintainInventory",
                            value
                        )
                    }
                />

                <SettingRow
                    title="Service Product Inventory"
                    description="Enable stock inward, outward and available quantity tracking for Service Products."
                    value={!!inventoryConfig?.enableServiceProductInventory}
                    onChange={(value) =>
                        updateInventoryField(
                            "enableServiceProductInventory",
                            value
                        )
                    }
                />

                <SelectRow
                    title="Inventory Tag Level"
                    description="Choose how deeply inventory should be tracked."
                    value={
                        inventoryConfig
                            ?.inventoryTagLevel ||
                        ""
                    }
                    onChange={(
                        value
                    ) =>
                        updateInventoryField(
                            "inventoryTagLevel",
                            value
                        )
                    }
                    options={
                        inventoryTagLevelOptions
                    }
                />

                {showWhereToAdd ? (
                    <SelectRow
                        title="Inventory Tracking Field Placement"
                        description="Choose whether inventory tracking fields should be stored once at transaction level (Header) or separately for each line item (Body)."
                        value={normalizeWhereToAddValue(
                            inventoryConfig?.whereToAddInventory
                        )}
                        onChange={handleWhereToAddChange}
                        options={
                            whereToAdd
                        }
                    />
                ) : null}

                <SelectRow
                    title="Inventory Pick Method"
                    description="Choose stock picking method like FIFO, LIFO or FEFO."
                    value={
                        inventoryConfig
                            ?.inventoryPickMethod ||
                        ""
                    }
                    onChange={(
                        value
                    ) =>
                        updateInventoryField(
                            "inventoryPickMethod",
                            value
                        )
                    }
                    options={
                        inventoryPickMethodOptions
                    }
                />

                {/* ⭐ ADDED — QR CODE / BARCODE CONFIGURATION */}
                <SettingRow
                    title="QR Code/BarCode"
                    description="Enable QR Code and BarCode generation, assignment and printing."
                    value={!!inventoryConfig?.enableQrBarcode}
                    onChange={(value) =>
                        updateInventoryField(
                            "enableQrBarcode",
                            value
                        )
                    }
                />

                <SelectRow
                    title="Negative Stock Policy"
                    description="Control whether negative stock should be allowed or stopped."
                    value={
                        inventoryConfig
                            ?.negativeStockPolicy ||
                        ""
                    }
                    onChange={(
                        value
                    ) =>
                        updateInventoryField(
                            "negativeStockPolicy",
                            value
                        )
                    }
                    options={
                        negativeStockPolicyOptions
                    }
                />
            </Panel>
        );
    };

    const renderFinanceTab = () => {
        return (
            <Panel
                title="Finance Setup"
                description="Control finance module availability in BookEZ."
                right={
                    <BadgeStatus
                        active={
                            !!financeConfig?.isActive
                        }
                    />
                }
            >
                <SettingRow
                    title="Enable Finance Module"
                    description="Turn on finance related features and accounting flow."
                    value={
                        !!financeConfig?.isActive
                    }
                    onChange={(
                        value
                    ) =>
                        updateFinanceField(
                            "isActive",
                            value
                        )
                    }
                />
            </Panel>
        );
    };

    const renderPosTab = () => {
        return (
            <div className="space-y-4">
                <Panel
                    title="BookEZ - POS"
                    description="Manage POS billing and posting setup."
                    right={
                        <BadgeStatus
                            active={
                                !!systemConfig
                                    ?.posConfiguration
                                    ?.enablePOSModule
                            }
                        />
                    }
                >
                    <SettingRow
                        title="Enable POS Module"
                        description="Allow POS billing and POS posting features."
                        value={
                            !!systemConfig
                                ?.posConfiguration
                                ?.enablePOSModule
                        }
                        onChange={(
                            value
                        ) =>
                            updateSystemField(
                                "posConfiguration",
                                "enablePOSModule",
                                value
                            )
                        }
                    />
                </Panel>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/bookEz/pos-posting"
                        )
                    }
                    className="
                        flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-card
                        px-5 py-4 text-left shadow-sm transition hover:border-primary/40 hover:bg-primary/5
                    "
                >
                    <div>
                        <h3 className="text-sm font-semibold text-card-foreground">
                            POS Setting
                        </h3>

                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                            Configure POS
                            posting rules and
                            related setup.
                        </p>
                    </div>

                    <ChevronRight
                        size={20}
                        className="text-muted-foreground"
                    />
                </button>
            </div>
        );
    };

    const renderScrapTab = () => {
        return (
            <Panel
                title="Scrap Management"
                description="Control scrap management module availability."
                right={
                    <BadgeStatus
                        active={
                            !!systemConfig
                                ?.scrapManagement
                                ?.enableScrapManagement
                        }
                    />
                }
            >
                <SettingRow
                    title="Enable Scrap Management"
                    description="Allow scrap management features in BookEZ."
                    value={
                        !!systemConfig
                            ?.scrapManagement
                            ?.enableScrapManagement
                    }
                    onChange={(
                        value
                    ) =>
                        updateSystemField(
                            "scrapManagement",
                            "enableScrapManagement",
                            value
                        )
                    }
                />
            </Panel>
        );
    };

    const getExpenseAccount =
        accounts?.map(
            (e: any) => ({
                label:
                    e?.accountName,
                value:
                    e?.accountCode,
                ...e,
            })
        );

    const renderTransportationTab =
        () => {
            return (
                <>
                    <Panel
                        title="Book Transportation"
                        description="Control BookEZ transportation module availability."
                        right={
                            <BadgeStatus
                                active={
                                    !!systemConfig
                                        ?.transportationModuleConfiguration
                                        ?.enableTransportationModule
                                }
                            />
                        }
                    >
                        <SettingRow
                            title="Enable BookEZ Transportation"
                            description="Allow transportation configuration in BookEZ."
                            value={
                                !!systemConfig
                                    ?.transportationModuleConfiguration
                                    ?.enableTransportationModule
                            }
                            onChange={(
                                value
                            ) =>
                                updateSystemField(
                                    "transportationModuleConfiguration",
                                    "enableTransportationModule",
                                    value
                                )
                            }
                        />
                    </Panel>

                    <Panel
                        title="Expenses"
                        description=""
                    >
                        {[
                            {
                                label: "Advance Receive Account",
                                key: "advanceReceive",
                            },
                            {
                                label: "Food Cost",
                                key: "foodCost",
                            },
                            {
                                label: "Petrol Cost",
                                key: "petrolCost",
                            },
                            {
                                label: "Diesel Cost",
                                key: "dieselCost",
                            },
                            {
                                label: "Running Cost",
                                key: "runningCost",
                            },
                            {
                                label: "Breakdown Cost",
                                key: "breakdownCost",
                            },
                            {
                                label: "Other Cost",
                                key: "otherCost",
                            },
                        ]?.map(
                            ({
                                label,
                                key,
                            }) => (
                                <div
                                    key={
                                        key
                                    }
                                    className="flex px-5 my-3 flex-col gap-4 md:flex-row md:items-center md:justify-between"
                                >
                                    <h4 className="text-sm font-semibold text-foreground">
                                        {
                                            label
                                        }
                                    </h4>

                                    <div className="w-full md:w-96">
                                        <SelectInput
                                            name={
                                                key
                                            }
                                            value={
                                                transportationModuleConfiguration?.[
                                                key
                                                ]
                                            }
                                            placeholder={`Select ${label}`}
                                            options={
                                                getExpenseAccount
                                            }
                                            mandatory
                                            largeData
                                            batchSize={
                                                100
                                            }
                                            onChange={(
                                                event: any
                                            ) => {
                                                updateSystemField(
                                                    "transportationModuleConfiguration",
                                                    key,
                                                    String(
                                                        event
                                                            ?.target
                                                            ?.value ||
                                                        ""
                                                    )
                                                );
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        )}
                    </Panel>
                </>
            );
        };

    const renderEngineeringTab = () => {
        return (
            <Panel
                title="Engineering Module"
                description="Control BookEZ engineering module availability."
                right={
                    <BadgeStatus active={!!systemConfig?.engineeringModuleConfiguration?.enableEngineeringModule} />
                }
            >
                <SettingRow
                    title="Enable Engineering Module"
                    description="Allow engineering module functionality in BookEZ."
                    value={!!systemConfig?.engineeringModuleConfiguration?.enableEngineeringModule}
                    onChange={(value) =>
                        updateSystemField(
                            "engineeringModuleConfiguration",
                            "enableEngineeringModule",
                            value
                        )
                    }
                />
            </Panel>
        );
    };

    const renderActiveTabContent =
        () => {
            switch (
            activeTab
            ) {
                case "inventory":
                    return renderInventoryTab();

                case "finance":
                    return renderFinanceTab();

                case "pos":
                    return renderPosTab();

                case "scrap":
                    return renderScrapTab();

                case "transportation":
                    return renderTransportationTab();

                case "engineering":
                    return renderEngineeringTab();

                case "dbRequest":
                    return dbRequestTab();

                case "system":
                default:
                    return renderSystemTab();
            }
        };

    return (
        <div className="min-h-screen bg-background p-4 md:p-4">
            <div className="space-y-4">
                <div className="flex flex-col gap-3 rounded border border-border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                window.history.back()
                            }
                            className="flex h-9 w-9 items-center justify-center rounded border border-border bg-background text-card-foreground transition hover:bg-muted"
                        >
                            <ArrowLeft
                                size={
                                    18
                                }
                            />
                        </button>

                        <div>
                            <h1 className="text-xl font-semibold text-card-foreground">
                                System
                                Configuration
                            </h1>

                            <p className="mt-1 text-xs font-semibold text-muted-foreground">
                                Manage BookEZ
                                system,
                                inventory,
                                finance,
                                WhatsApp, POS,
                                scrap and
                                transportation
                                setup.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {configuration
                                ?.configurationCode ||
                                "New Configuration"}
                        </span>

                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                            {configuration
                                ?.configurationName ||
                                "Default System Config"}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
                    <aside className="max-h-max rounded border border-border bg-card p-2 shadow-sm lg:sticky lg:top-4 lg:self-start">
                        <div className="mb-2 px-3 py-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Configuration
                                Menu
                            </p>
                        </div>

                        <div className="space-y-1">
                            {tabs.map(
                                (
                                    tab
                                ) => {
                                    const isActive =
                                        activeTab ===
                                        tab.key;

                                    return (
                                        <button
                                            key={
                                                tab.key
                                            }
                                            type="button"
                                            onClick={() =>
                                                setActiveTab(
                                                    tab.key
                                                )
                                            }
                                            className={`
                                                flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-bold transition
                                                ${isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:bg-muted hover:text-card-foreground"
                                                }
                                            `}
                                        >
                                            <span
                                                className={`
                                                    flex h-8 w-8 items-center justify-center rounded
                                                    ${isActive
                                                        ? "bg-white/15"
                                                        : "bg-background text-primary"
                                                    }
                                                `}
                                            >
                                                {
                                                    tab.icon
                                                }
                                            </span>

                                            <span>
                                                {
                                                    tab.label
                                                }
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </aside>

                    <main className="min-w-0 space-y-4">
                        {loading ? (
                            <div className="flex min-h-[360px] items-center justify-center rounded border border-border bg-card shadow-sm">
                                <div className="flex items-center gap-2 text-primary">
                                    <Loader2
                                        size={
                                            22
                                        }
                                        className="animate-spin"
                                    />

                                    <span className="text-sm font-semibold">
                                        Loading
                                        configuration...
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {renderActiveTabContent()}

                                {activeTab !==
                                    "dbRequest" && (
                                        <div className="flex flex-col gap-3 rounded border border-border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-card-foreground">
                                                    Save
                                                    Changes
                                                </h3>

                                                <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                    Click
                                                    save to
                                                    apply
                                                    updated
                                                    configuration.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                disabled={
                                                    saving ||
                                                    whatsAppVerifying
                                                }
                                                onClick={
                                                    handleSave
                                                }
                                                className="
                                                flex h-10 min-w-[190px] items-center justify-center rounded bg-primary
                                                px-5 text-sm font-semibold text-primary-foreground transition
                                                hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60
                                            "
                                            >
                                                {saving ||
                                                    whatsAppVerifying ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2
                                                            size={
                                                                16
                                                            }
                                                            className="animate-spin"
                                                        />
                                                        Please
                                                        wait...
                                                    </span>
                                                ) : configuration
                                                    ?.configurationCode ? (
                                                    "Update Configuration"
                                                ) : (
                                                    "Save Configuration"
                                                )}
                                            </button>
                                        </div>
                                    )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            <Modal
                show={showWhereToAddWarning}
                setShow={(value) => {
                    if (!value) closeWhereToAddWarning();
                }}
                handleClose={closeWhereToAddWarning}
                handleSubmit={confirmWhereToAddChange}
                title="Inventory Field Placement"
                maxWidth="md"
                gridCols={1}
                submitText="Confirm"
                submitDisabled={!whereToAddConfirmed}
                body={
                    <div className="space-y-5">
                        <div className="rounded-md border border-warning/30 bg-warning/10 p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
                                    <ShieldCheck size={18} />
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-card-foreground">
                                        Confirm placement change
                                    </p>

                                    <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                                        This changes where inventory tracking values are stored in transactions and may affect existing saved data.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-border bg-card p-4">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Placement Change
                            </p>

                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                <div className="min-w-0 rounded-md border border-border bg-muted/30 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        Current
                                    </p>

                                    <p className="mt-1 break-words text-sm font-bold text-card-foreground">
                                        {getWhereToAddLabel(currentWhereToAdd)}
                                    </p>
                                </div>

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <ChevronRight size={18} />
                                </div>

                                <div className="min-w-0 rounded-md border border-primary/30 bg-primary/5 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                                        New
                                    </p>

                                    <p className="mt-1 break-words text-sm font-bold text-primary">
                                        {getWhereToAddLabel(pendingWhereToAdd)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-border bg-muted/20 p-4">
                            <p className="text-sm font-semibold text-card-foreground">
                                What happens after this change?
                            </p>

                            <p className="mt-1.5 text-xs font-medium leading-5 text-muted-foreground">
                                New transaction entries will use the selected placement. Existing values will not automatically move between Transaction Header and Transaction Body.
                            </p>
                        </div>

                        <div
                            className={`rounded-md border p-4 transition ${whereToAddConfirmed
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-border bg-card"
                                }`}
                        >
                            <Checkbox
                                checked={whereToAddConfirmed}
                                onChange={setWhereToAddConfirmed}
                                iconSize={22}
                                label={
                                    <span className="leading-5">
                                        I understand that changing this setting may affect existing transaction data.
                                    </span>
                                }
                            />
                        </div>
                    </div>
                }
            />
        </div>
    );
};

export default SystemConfiguration;