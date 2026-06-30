import { useEffect, useMemo, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { getProfessionalUsers } from "../../redux/slices/professionalSlice/professionalUserSlice";
import { useDispatch, useSelector } from "react-redux";
import { SelectInput } from "../../components/inputs";
import { getAllPermissions, updatePermission } from "../../redux/slices/permissionSlice";
import { toast } from "react-toastify";

type ActionKey = "view" | "create" | "update" | "delete";

const actions: ActionKey[] = ["view", "create", "update", "delete"];

const moduleTabs = [
    { label: "BookEZ", key: "bookez" },
    { label: "TaxEZ", key: "taxez" },
    { label: "PayrollEZ", key: "payrollEz" },
];

const permissionSections: any = {
    bookez: [
        {
            title: "Masters",
            items: [
                { label: "Account Master", key: "accountMaster" },
                { label: "Product Master", key: "productMaster" },
                { label: "Unit Master", key: "unitMaster" },
                { label: "Report Mapping", key: "reportMappingMaster" },
            ],
        },
        {
            title: "Opening / Other Vouchers",
            items: [
                { label: "Opening Balance", key: "openingBalance" },
                { label: "Opening Stock", key: "openingStock" },
                { label: "Journal Voucher", key: "journalVouchar" },
                { label: "Contra Voucher", key: "contraVoucher" },
                { label: "Credit Note", key: "creditNote" },
                { label: "Debit Notes", key: "debitNotes" },
            ],
        },
        {
            title: "Sales Workflow",
            items: [
                { label: "Sales Quotation", key: "salesQuotation" },
                { label: "Sales Order", key: "salesOrder" },
                { label: "Sales Invoice", key: "salesInvoice" },
                { label: "Sales Return", key: "salesReturn" },
                { label: "Receipt", key: "receipt" },
            ],
        },
        {
            title: "Purchase Workflow",
            items: [
                { label: "Purchase Order", key: "purchaseOrder" },
                { label: "GRN", key: "grn" },
                { label: "Purchase Invoice", key: "purchaseInvoice" },
                { label: "Purchase Return", key: "purchaseReturn" },
                { label: "Payment", key: "payment" },
            ],
        },
        {
            title: "Reports",
            items: [
                { label: "Account Receivable", key: "accountReceivable" },
                { label: "Account Payable", key: "accountPayable" },
                { label: "Account Ledger", key: "accountLedger" },
                { label: "Stock Ledger", key: "stockLedger" },
                { label: "Profit And Loss", key: "profitAndLoss" },
                { label: "Balance Sheet", key: "balanceSheet" },
                { label: "Cash Bank Report", key: "cashbankReport" },
                { label: "SO Drill Down Report", key: "soDrillDownReport" },
            ],
        },
        {
            title: "Registers",
            items: [
                { label: "All Registers", key: "allRegisters" },
                { label: "Sales Register", key: "registers.salesRegister" },
                { label: "Purchase Register", key: "registers.purchaseRegister" },
                { label: "Receipt Register", key: "registers.receiptRegister" },
                { label: "Payment Register", key: "registers.paymentRegister" },
                { label: "Quotation Register", key: "registers.quotationRegister" },
                { label: "Sales Return Register", key: "registers.salesReturnRegister" },
                { label: "Purchase Return Register", key: "registers.purchaseReturnRegister" },
                { label: "Opening Balance Register", key: "registers.openingBalanceRegister" },
                { label: "Opening Stock Register", key: "registers.openingStockRegister" },
                { label: "Credit Note Register", key: "registers.creditNoteRegister" },
                { label: "Debit Note Register", key: "registers.debitNoteRegister" },
            ],
        },
        {
            title: "Productions",
            items: [
                { label: "All Productions", key: "AllProductions" },
                { label: "Assembly Production", key: "productions.assemblyProduction" },
                { label: "Issues To Production", key: "productions.issuesToProduction" },
                { label: "Receipt From Production", key: "productions.receiptFromProduction" },
            ],
        },
    ],

    taxez: [
        {
            title: "TaxEZ",
            items: [
                { label: "Document Management", key: "documentManagement" },
                { label: "Refund Status", key: "refundStatus" },
                { label: "Reset ITR Password", key: "resetITRPassword" },
                { label: "Form 26AS", key: "form26AS" },
                { label: "AIS", key: "ais" },
                { label: "TIS", key: "tis" },
                { label: "Tax Payer", key: "taxPayer" },
                { label: "File ITR 1", key: "fileITR1" },
                { label: "File ITR 4", key: "fileITR4" },
                { label: "Upload Form 16", key: "uploadForm16" },
                { label: "Download ITR", key: "downloadITR" },
            ],
        },
    ],

    payrollEz: [
        {
            title: "PayrollEZ",
            items: [
                { label: "Attendance", key: "attendance" },
                { label: "Holiday Calendar", key: "holidayCalendar" },
                { label: "Attendance Register", key: "attendanceRegister" },
            ],
        },
    ],
};

const defaultPermissionAction = {
    view: false,
    create: false,
    update: false,
    delete: false,
};

const getChangedPermissions = (oldData: any, newData: any) => {
    const changes: any = {};
    Object.keys(newData || {}).forEach((moduleKey) => {
        const oldModule = oldData?.[moduleKey];
        const newModule = newData?.[moduleKey];
        if (oldModule?.enabled !== newModule?.enabled) {
            changes[moduleKey] = {
                ...(changes[moduleKey] || {}),
                enabled: newModule?.enabled,
            };
        }
        const oldPermissions = oldModule?.permissions || {};
        const newPermissions = newModule?.permissions || {};
        const comparePermissionObject = (
            oldObj: any,
            newObj: any,
            path: string[] = []
        ) => {
            Object.keys(newObj || {}).forEach((key) => {
                const oldValue = oldObj?.[key];
                const newValue = newObj?.[key];
                const currentPath = [...path, key];
                const isCrudObject = typeof newValue === "object" && newValue !== null && ("view" in newValue || "create" in newValue || "update" in newValue || "delete" in newValue);
                if (isCrudObject) {
                    const changedActions: any = {};
                    ["view", "create", "update", "delete"].forEach((action) => {
                        if (oldValue?.[action] !== newValue?.[action]) {
                            changedActions[action] = newValue?.[action];
                        }
                    });

                    if (Object.keys(changedActions).length > 0) {
                        if (!changes[moduleKey]) {
                            changes[moduleKey] = {};
                        }
                        if (!changes[moduleKey].permissions) {
                            changes[moduleKey].permissions = {};
                        }
                        let current = changes[moduleKey].permissions;
                        currentPath.forEach((pathKey, index) => {
                            if (index === currentPath.length - 1) {
                                current[pathKey] = changedActions;
                            } else {
                                current[pathKey] = current[pathKey] || {};
                                current = current[pathKey];
                            }
                        });
                    }
                } else if (typeof newValue === "object" && newValue !== null) {
                    comparePermissionObject(oldValue || {}, newValue, currentPath);
                }
            });
        };
        comparePermissionObject(oldPermissions, newPermissions);
    });
    return changes;
};

const getValueByPath = (obj: any, path: string, action: ActionKey) => {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
        current = current?.[key];
        if (!current) return false;
    }
    return current?.[action] === true;
};

const setValueByPath = (
    obj: any,
    path: string,
    action: ActionKey,
    value: boolean
) => {
    const keys = path.split(".");
    let current = obj;
    keys.forEach((key, index) => {
        if (!current[key]) current[key] = index === keys.length - 1 ? { ...defaultPermissionAction } : {};
        current = current[key];
    });
    current[action] = value;
};

const createDefaultPermissionData = () => {
    return {
        bookez: {
            enabled: false,
            permissions: {},
        },
        taxez: {
            enabled: false,
            permissions: {},
        },
        payrollEz: {
            enabled: false,
            permissions: {},
        },
    };
};

const PermissionManagement = () => {
    const [activeModule, setActiveModule] = useState("bookez");
    const dispatch = useDispatch();
    const { users } = useSelector((s: any) => s.professionalUser || {});
    const [userOption, setUserOption] = useState([]);
    const [selectUser, setSelectUser]: any = useState();
    const localUser = JSON.parse(localStorage.getItem("professionalUser") || "{}");
    const { permissions, loader } = useSelector((s: any) => s.permissions || {});
    const [permissionData, setPermissionData] = useState<any>(
        createDefaultPermissionData()
    );

    const activeSections = useMemo(() => {
        return permissionSections?.[activeModule] || [];
    }, [activeModule]);

    const handleModuleToggle = (moduleKey: string) => {
        setPermissionData((prev: any) => ({
            ...prev,
            [moduleKey]: {
                ...prev[moduleKey],
                enabled: !prev?.[moduleKey]?.enabled,
                permissions: prev?.[moduleKey]?.permissions || {},
            },
        }));
    };

    const handlePermissionToggle = (
        moduleKey: string,
        permissionKey: string,
        action: ActionKey
    ) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated[moduleKey]) {
                updated[moduleKey] = {
                    enabled: false,
                    permissions: {},
                };
            }

            if (!updated[moduleKey].permissions) {
                updated[moduleKey].permissions = {};
            }

            const currentValue = getValueByPath(
                updated[moduleKey].permissions,
                permissionKey,
                action
            );

            setValueByPath(
                updated[moduleKey].permissions,
                permissionKey,
                action,
                !currentValue
            );

            return updated;
        });
    };

    const handleRowToggle = (
        moduleKey: string,
        permissionKey: string,
        checked: boolean
    ) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated[moduleKey]) {
                updated[moduleKey] = {
                    enabled: false,
                    permissions: {},
                };
            }

            if (!updated[moduleKey].permissions) {
                updated[moduleKey].permissions = {};
            }

            actions.forEach((action) => {
                setValueByPath(
                    updated[moduleKey].permissions,
                    permissionKey,
                    action,
                    checked
                );
            });

            return updated;
        });
    };

    const isFullRowChecked = (moduleKey: string, permissionKey: string) => {
        return actions.every((action) =>
            getValueByPath(
                permissionData?.[moduleKey]?.permissions,
                permissionKey,
                action
            )
        );
    };

    const handleSave = () => {
        try {
            const changedPermissions = getChangedPermissions(
                permissions,
                permissionData
            );

            if (Object.keys(changedPermissions).length === 0) {
                toast.warn("No change found");
                return;
            }
            const payload: any = {
                parentMobile: selectUser?.parentUserMobileNumber,
                childMobile: selectUser?.userMobileNumberHash,
                permissions: changedPermissions,
            };
            // @ts-ignore
            dispatch(updatePermission({ payload }) as any);
            toast.success("Permission Updated");
            if (selectUser?.parentUserMobileNumber === selectUser?.userMobileNumberHash) {
                localStorage.setItem("permissions", JSON.stringify(permissionData));
            }
        } catch (error) {
            console.error(error);
            toast.error("Getting error when submit");
        }
    };

    useEffect(() => {
        // @ts-ignore
        dispatch(getProfessionalUsers({ withParent: true }));
    }, []);

    useEffect(() => {
        const _ = users?.reduce((a: any, c: any) => {
            a.push({ label: (c?.parentUserMobileNumber !== c?.userMobileNumberHash) ? `${c?.userFirstName} ${c?.userLastName}` : "Me (Parent Account)", value: c?.userMobileNumberHash, ...c });
            return a;
        }, []);
        setUserOption(_);
        setSelectUser(_?.[0]);
    }, [users]);

    useEffect(() => {
        // @ts-ignore
        dispatch(getAllPermissions({ parentMobile: selectUser?.parentUserMobileNumber || localUser?.parentUserMobileNumber, childMobile: selectUser?.userMobileNumberHash || localUser?.userMobileNumberHash, storeInLocal: false }));
    }, [selectUser]);

    useEffect(() => {
        if (permissions && Object.keys(permissions)?.length > 0) setPermissionData(permissions);
    }, [permissions]);

    return (
        <div className="min-h-screen w-full bg-background p-4 text-foreground">
            <div className="mx-auto space-y-4">
                {/* Header */}
                <div className="rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                                    <ShieldCheck size={22} />
                                </div>

                                <div>
                                    <h1 className="text-xl font-bold text-card-foreground">
                                        Permission Management
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Manage module access and CRUD permissions for users.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loader}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={16} />
                            {loader ? "Loading..." : "Save Permissions"}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex justify-between rounded-md border border-border bg-card p-3 text-card-foreground shadow-sm">
                    <div className="w-100 flex items-center">
                        <label className="me-2 text-nowrap text-sm font-medium text-card-foreground" htmlFor="">
                            Select User
                        </label>
                        <SelectInput  {...{ name: "Hello", label: "", value: selectUser?.value, onChange: (e: any) => setSelectUser(e?.target), options: userOption, placeholder: "Select User" }} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {moduleTabs.map((tab) => {
                            const isActive = activeModule === tab.key;
                            const enabled = permissionData?.[tab.key]?.enabled === true;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveModule(tab.key)}
                                    className={`cursor-pointer rounded-md border px-4 py-2 text-sm font-semibold transition ${isActive
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    {tab.label}

                                    <span
                                        className={`ml-2 rounded-md px-2 py-0.5 text-[11px] ${enabled
                                            ? "bg-success/10 text-success"
                                            : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        {enabled ? "Enabled" : "Disabled"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Active module card */}
                <div className="rounded-md border border-border bg-card text-card-foreground shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-card-foreground">
                                {moduleTabs.find((m) => m.key === activeModule)?.label}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Enable this module first, then manage permission checkboxes.
                            </p>
                        </div>

                        <label className="flex cursor-pointer items-center gap-3">
                            <span className="text-sm font-semibold text-card-foreground">
                                Module Enabled
                            </span>

                            <button
                                type="button"
                                onClick={() => handleModuleToggle(activeModule)}
                                className={`relative h-7 w-12 cursor-pointer rounded-full transition ${permissionData?.[activeModule]?.enabled
                                    ? "bg-success"
                                    : "bg-muted-foreground/40"
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition ${permissionData?.[activeModule]?.enabled
                                        ? "left-6"
                                        : "left-1"
                                        }`}
                                />
                            </button>
                        </label>
                    </div>

                    {/* If disabled */}
                    {permissionData?.[activeModule]?.enabled !== true ? (
                        <div className="p-8 text-center">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                <ShieldCheck size={26} />
                            </div>
                            <h3 className="text-base font-bold text-card-foreground">
                                Module is disabled
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Enable this module to show it in sidebar and allow access.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5 p-5">
                            {activeSections.map((section: any) => (
                                <div
                                    key={section.title}
                                    className="overflow-hidden rounded-md border border-border"
                                >
                                    <div className="bg-muted px-4 py-3">
                                        <h3 className="text-sm font-bold uppercase tracking-wide text-card-foreground">
                                            {section.title}
                                        </h3>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-card">
                                                <tr className="border-b border-border">
                                                    <th className="w-[45%] px-4 py-3 text-left font-semibold text-muted-foreground">
                                                        Permission
                                                    </th>
                                                    <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                                                        All
                                                    </th>
                                                    {actions.map((action) => (
                                                        <th
                                                            key={action}
                                                            className="px-4 py-3 text-center font-semibold capitalize text-muted-foreground"
                                                        >
                                                            {action}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {section.items.map((permission: any) => {
                                                    const allChecked = isFullRowChecked(activeModule, permission.key);
                                                    return (
                                                        <tr
                                                            key={permission.key}
                                                            className="border-b border-border last:border-b-0 hover:bg-muted"
                                                        >
                                                            <td className="px-4 py-3 font-medium text-card-foreground">
                                                                {permission.label}
                                                                {/* <p className="text-xs text-muted-foreground">
                                                                    {permission.key}
                                                                </p> */}
                                                            </td>

                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={allChecked}
                                                                    onChange={(e) =>
                                                                        handleRowToggle(
                                                                            activeModule,
                                                                            permission.key,
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                    className="h-4 w-4 cursor-pointer accent-primary"
                                                                />
                                                            </td>

                                                            {actions.map((action) => (
                                                                <td
                                                                    key={action}
                                                                    className="px-4 py-3 text-center"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={getValueByPath(
                                                                            permissionData?.[activeModule]
                                                                                ?.permissions,
                                                                            permission.key,
                                                                            action
                                                                        )}
                                                                        onChange={() =>
                                                                            handlePermissionToggle(
                                                                                activeModule,
                                                                                permission.key,
                                                                                action
                                                                            )
                                                                        }
                                                                        className="h-4 w-4 cursor-pointer accent-primary"
                                                                    />
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* JSON Preview */}
                {/* <div className="rounded-2xl border border-border bg-slate-950 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">JSON Preview</h3>

                        <button
                            type="button"
                            onClick={() =>
                                navigator.clipboard.writeText(
                                    JSON.stringify(permissionData, null, 2)
                                )
                            }
                            className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
                        >
                            Copy JSON
                        </button>
                    </div>

                    <pre className="max-h-80 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-emerald-300">
                        {JSON.stringify(permissionData, null, 2)}
                    </pre>
                </div> */}
            </div>
        </div>
    );
};

export default PermissionManagement;