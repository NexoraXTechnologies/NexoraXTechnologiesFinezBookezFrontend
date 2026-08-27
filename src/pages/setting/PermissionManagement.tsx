import { useEffect, useMemo, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { getProfessionalUsers } from "../../redux/slices/professionalSlice/professionalUserSlice";
import { useDispatch, useSelector } from "react-redux";
import { SelectInput } from "../../components/inputs";
import {
    getAllPermissions,
    updatePermission,
    getCustomMasterPermissionOptions,
    getCustomTransactionPermissionOptions,
} from "../../redux/slices/permissionSlice";
import { toast } from "react-toastify";

type ActionKey = "view" | "create" | "update" | "delete";

const actions: ActionKey[] = ["view", "create", "update", "delete"];
const defaultPermissionAction = { view: false, create: false, update: false, delete: false };

const isToggleOnlyModule = (moduleData: any) => {
    return typeof moduleData === "object" && moduleData !== null && !("enabled" in moduleData) && !("permissions" in moduleData) && "view" in moduleData;
};

const isCrudPermission = (value: any) => {
    return typeof value === "object" && value !== null && !Array.isArray(value) && ("view" in value || "create" in value || "update" in value || "delete" in value);
};

const formatLabel = (value: string) => {
    if (!value) return "";
    return value.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().split(" ").map((word) => /^[A-Z0-9]+$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const formatModuleLabel = (key: string, moduleData?: any) => {
    if (moduleData?.label) return moduleData.label;
    if (moduleData?.title) return moduleData.title;
    if (moduleData?.name) return moduleData.name;

    const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

    if (/ez$/i.test(spaced)) {
        const base = spaced.replace(/\s*ez$/i, "");
        return `${formatLabel(base)}EZ`;
    }

    return formatLabel(key);
};

const flattenPermissionItems = (permissionObject: any, parentPath = ""): any[] => {
    const items: any[] = [];

    Object.entries(permissionObject || {}).forEach(([key, value]: any) => {
        if (key === "customMasterAccess" || key === "customTransactionAccess") return;

        const currentPath = parentPath ? `${parentPath}.${key}` : key;

        if (isCrudPermission(value)) {
            items.push({ key: currentPath, label: value?.label || value?.title || value?.name || formatLabel(key) });
            return;
        }

        if (typeof value === "object" && value !== null && !Array.isArray(value)) items.push(...flattenPermissionItems(value, currentPath));
    });

    return items;
};

const buildPermissionSections = (permissionObject: any) => {
    const directItems: any[] = [];
    const nestedSections: any[] = [];

    Object.entries(permissionObject || {}).forEach(([key, value]: any) => {
        if (key === "customMasterAccess" || key === "customTransactionAccess") return;

        if (isCrudPermission(value)) {
            directItems.push({ key, label: value?.label || value?.title || value?.name || formatLabel(key) });
            return;
        }

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            const items = flattenPermissionItems(value, key);
            if (items.length > 0) nestedSections.push({ title: value?.label || value?.title || value?.name || formatLabel(key), items });
        }
    });

    const sections: any[] = [];
    if (directItems.length > 0) sections.push({ title: "Permissions", items: directItems });
    sections.push(...nestedSections);

    return sections;
};

const getOptionArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    if (Array.isArray(data?.options)) return data.options;
    if (Array.isArray(data?.records)) return data.records;
    if (Array.isArray(data?.masters)) return data.masters;
    if (Array.isArray(data?.modules)) return data.modules;
    if (Array.isArray(data?.data)) return data.data;
    if (data?.data && typeof data.data === "object") return getOptionArray(data.data);
    return [];
};

const getOptionModuleCode = (item: any) => {
    if (typeof item === "string") return item;
    return item?.moduleCode || item?.code || "";
};

const getOptionModuleName = (item: any) => {
    if (typeof item === "string") return item;
    return item?.moduleName || item?.name || item?.label || getOptionModuleCode(item);
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

const setValueByPath = (obj: any, path: string, action: ActionKey, value: boolean) => {
    const keys = path.split(".");
    let current = obj;

    keys.forEach((key, index) => {
        if (!current[key]) current[key] = index === keys.length - 1 ? { ...defaultPermissionAction } : {};
        current = current[key];
    });

    current[action] = value;
};

const PermissionManagement = () => {
    const dispatch = useDispatch();
    const { users } = useSelector((s: any) => s.professionalUser || {});
    const {
        permissions,
        loader,
        customMasterPermissionOptions,
        customTransactionPermissionOptions,
        customMasterOptionsLoader,
        customTransactionOptionsLoader,
    } = useSelector((s: any) => s.permissions || {});

    const [activeModule, setActiveModule] = useState("");
    const [userOption, setUserOption] = useState<any[]>([]);
    const [selectUser, setSelectUser]: any = useState();
    const [permissionData, setPermissionData] = useState<any>({});

    const moduleTabs = useMemo(() => {
        return Object.entries(permissionData || {}).map(([key, value]: any) => ({ key, label: formatModuleLabel(key, value) }));
    }, [permissionData]);

    const customMasterOptions = useMemo(() => {
        return getOptionArray(customMasterPermissionOptions).filter((item: any) => getOptionModuleCode(item));
    }, [customMasterPermissionOptions]);

    const customTransactionOptions = useMemo(() => {
        return getOptionArray(customTransactionPermissionOptions).filter((item: any) => getOptionModuleCode(item));
    }, [customTransactionPermissionOptions]);

    const activeModuleData = permissionData?.[activeModule];
    const activeIsToggleOnly = isToggleOnlyModule(activeModuleData);

    const activeSections = useMemo(() => {
        if (isToggleOnlyModule(permissionData?.[activeModule])) return [];
        return buildPermissionSections(permissionData?.[activeModule]?.permissions || {});
    }, [activeModule, permissionData]);

    const totalPermissions = useMemo(() => {
        let total = activeSections.reduce((sum: number, section: any) => sum + (section?.items?.length || 0), 0);
        if (activeModule === "bookez") total += customMasterOptions.length + customTransactionOptions.length;
        return total;
    }, [activeSections, activeModule, customMasterOptions, customTransactionOptions]);

    const customMasterAccess = permissionData?.bookez?.permissions?.customMasterAccess || { restricted: false, masters: [] };
    const customTransactionAccess = permissionData?.bookez?.permissions?.customTransactionAccess || { restricted: false, modules: [] };

    const getCustomMasterPermission = (moduleCode: string) => {
        return customMasterAccess?.masters?.find((item: any) => item?.moduleCode === moduleCode);
    };

    const getCustomTransactionPermission = (moduleCode: string) => {
        return customTransactionAccess?.modules?.find((item: any) => item?.moduleCode === moduleCode);
    };

    const handleUserChange = (e: any) => {
        const selectedValue = e?.target?.value ?? e?.value;
        const selected = userOption.find((user: any) => user?.value === selectedValue || user?.userMobileNumberHash === selectedValue);

        if (selected) {
            setSelectUser(selected);
            return;
        }

        if (e?.target?.userMobileNumberHash) {
            setSelectUser(e.target);
            return;
        }

        if (e?.userMobileNumberHash) setSelectUser(e);
    };

    const handleModuleToggle = (moduleKey: string) => {
        if (!moduleKey) return;

        setPermissionData((prev: any) => {
            const moduleData = prev?.[moduleKey];

            if (isToggleOnlyModule(moduleData)) return { ...prev, [moduleKey]: { ...moduleData, view: !moduleData?.view } };

            return { ...prev, [moduleKey]: { ...moduleData, enabled: !moduleData?.enabled, permissions: moduleData?.permissions || {} } };
        });
    };

    const handlePermissionToggle = (moduleKey: string, permissionKey: string, action: ActionKey) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated[moduleKey]) updated[moduleKey] = { enabled: false, permissions: {} };
            if (!updated[moduleKey].permissions) updated[moduleKey].permissions = {};

            const currentValue = getValueByPath(updated[moduleKey].permissions, permissionKey, action);
            setValueByPath(updated[moduleKey].permissions, permissionKey, action, !currentValue);

            return updated;
        });
    };

    const handleRowToggle = (moduleKey: string, permissionKey: string, checked: boolean) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated[moduleKey]) updated[moduleKey] = { enabled: false, permissions: {} };
            if (!updated[moduleKey].permissions) updated[moduleKey].permissions = {};

            actions.forEach((action) => setValueByPath(updated[moduleKey].permissions, permissionKey, action, checked));

            return updated;
        });
    };

    const isFullRowChecked = (moduleKey: string, permissionKey: string) => {
        return actions.every((action) => getValueByPath(permissionData?.[moduleKey]?.permissions, permissionKey, action));
    };

    const handleCustomRestrictedToggle = (type: "master" | "transaction") => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated.bookez) updated.bookez = { enabled: true, permissions: {} };
            if (!updated.bookez.permissions) updated.bookez.permissions = {};

            if (type === "master") {
                const current = updated.bookez.permissions.customMasterAccess || { restricted: false, masters: [] };
                updated.bookez.permissions.customMasterAccess = { ...current, restricted: !current.restricted, masters: current.masters || [] };
            } else {
                const current = updated.bookez.permissions.customTransactionAccess || { restricted: false, modules: [] };
                updated.bookez.permissions.customTransactionAccess = { ...current, restricted: !current.restricted, modules: current.modules || [] };
            }

            return updated;
        });
    };

    const handleCustomMasterPermissionToggle = (moduleCode: string, action: ActionKey) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated.bookez) updated.bookez = { enabled: true, permissions: {} };
            if (!updated.bookez.permissions) updated.bookez.permissions = {};

            const access = updated.bookez.permissions.customMasterAccess || { restricted: true, masters: [] };
            access.masters = Array.isArray(access.masters) ? access.masters : [];

            let master = access.masters.find((item: any) => item?.moduleCode === moduleCode);

            if (!master) {
                master = { moduleCode, permissions: { ...defaultPermissionAction }, allowedEntries: [] };
                access.masters.push(master);
            }

            if (!master.permissions) master.permissions = { ...defaultPermissionAction };
            if (!Array.isArray(master.allowedEntries)) master.allowedEntries = [];

            master.permissions[action] = !master.permissions?.[action];

            updated.bookez.permissions.customMasterAccess = access;

            return updated;
        });
    };

    const handleCustomMasterAll = (moduleCode: string, checked: boolean) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated.bookez) updated.bookez = { enabled: true, permissions: {} };
            if (!updated.bookez.permissions) updated.bookez.permissions = {};

            const access = updated.bookez.permissions.customMasterAccess || { restricted: true, masters: [] };
            access.masters = Array.isArray(access.masters) ? access.masters : [];

            let master = access.masters.find((item: any) => item?.moduleCode === moduleCode);

            if (!master) {
                if (!checked) return prev;
                master = { moduleCode, permissions: { ...defaultPermissionAction }, allowedEntries: [] };
                access.masters.push(master);
            }

            if (!Array.isArray(master.allowedEntries)) master.allowedEntries = [];

            master.permissions = { view: checked, create: checked, update: checked, delete: checked };

            updated.bookez.permissions.customMasterAccess = access;

            return updated;
        });
    };

    const handleCustomTransactionPermissionToggle = (moduleCode: string, action: ActionKey) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated.bookez) updated.bookez = { enabled: true, permissions: {} };
            if (!updated.bookez.permissions) updated.bookez.permissions = {};

            const access = updated.bookez.permissions.customTransactionAccess || { restricted: true, modules: [] };
            access.modules = Array.isArray(access.modules) ? access.modules : [];

            let modulePermission = access.modules.find((item: any) => item?.moduleCode === moduleCode);

            if (!modulePermission) {
                modulePermission = { moduleCode, view: false, create: false, update: false, delete: false };
                access.modules.push(modulePermission);
            }

            modulePermission[action] = !modulePermission?.[action];

            updated.bookez.permissions.customTransactionAccess = access;

            return updated;
        });
    };

    const handleCustomTransactionAll = (moduleCode: string, checked: boolean) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated.bookez) updated.bookez = { enabled: true, permissions: {} };
            if (!updated.bookez.permissions) updated.bookez.permissions = {};

            const access = updated.bookez.permissions.customTransactionAccess || { restricted: true, modules: [] };
            access.modules = Array.isArray(access.modules) ? access.modules : [];

            let modulePermission = access.modules.find((item: any) => item?.moduleCode === moduleCode);

            if (!modulePermission) {
                if (!checked) return prev;
                modulePermission = { moduleCode, view: false, create: false, update: false, delete: false };
                access.modules.push(modulePermission);
            }

            modulePermission.view = checked;
            modulePermission.create = checked;
            modulePermission.update = checked;
            modulePermission.delete = checked;

            updated.bookez.permissions.customTransactionAccess = access;

            return updated;
        });
    };

    const handleSave = async () => {
        try {
            if (!selectUser?.parentUserMobileNumber || !selectUser?.userMobileNumberHash) {
                toast.warn("Please select user");
                return;
            }

            if (JSON.stringify(permissions || {}) === JSON.stringify(permissionData || {})) {
                toast.warn("No change found");
                return;
            }

            const payload = {
                parentMobile: selectUser.parentUserMobileNumber,
                childMobile: selectUser.userMobileNumberHash,
                permissions: structuredClone(permissionData),
            };

            console.log("UPDATE PERMISSION PAYLOAD:", payload);

            // @ts-ignore
            await dispatch(updatePermission({ payload }) as any).unwrap();

            // @ts-ignore
            await dispatch(getAllPermissions({
                parentMobile: selectUser.parentUserMobileNumber,
                childMobile: selectUser.userMobileNumberHash,
                storeInLocal: selectUser?.parentUserMobileNumber === selectUser?.userMobileNumberHash,
            }) as any).unwrap();

            toast.success("Permission Updated");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Getting error when submit");
        }
    };

    useEffect(() => {
        // @ts-ignore
        dispatch(getProfessionalUsers({ withParent: true }));

        // @ts-ignore
        dispatch(getCustomMasterPermissionOptions());

        // @ts-ignore
        dispatch(getCustomTransactionPermissionOptions());
    }, []);

    useEffect(() => {
        const options = users?.reduce((a: any, c: any) => {
            a.push({
                label: c?.parentUserMobileNumber !== c?.userMobileNumberHash ? `${c?.userFirstName} ${c?.userLastName}` : "Me (Parent Account)",
                value: c?.userMobileNumberHash,
                ...c,
            });

            return a;
        }, []);

        setUserOption(options || []);

        setSelectUser((currentUser: any) => {
            if (currentUser?.userMobileNumberHash) {
                const existingUser = options?.find((user: any) => user?.userMobileNumberHash === currentUser?.userMobileNumberHash);
                if (existingUser) return existingUser;
            }

            return options?.[0];
        });
    }, [users]);

    useEffect(() => {
        if (!selectUser?.parentUserMobileNumber || !selectUser?.userMobileNumberHash) return;

        setPermissionData({});

        // @ts-ignore
        dispatch(getAllPermissions({
            parentMobile: selectUser.parentUserMobileNumber,
            childMobile: selectUser.userMobileNumberHash,
            storeInLocal: false,
        }));
    }, [selectUser?.parentUserMobileNumber, selectUser?.userMobileNumberHash]);

    useEffect(() => {
        const apiPermissions = permissions && typeof permissions === "object" ? permissions : {};

        setPermissionData(apiPermissions);

        const availableModules = Object.keys(apiPermissions);

        setActiveModule((currentModule) => {
            if (currentModule && availableModules.includes(currentModule)) return currentModule;
            return availableModules?.[0] || "";
        });
    }, [permissions]);

    return (
        <div className="min-h-screen bg-muted/20 p-4 text-foreground">
            <div className="mx-auto max-w-[1700px] space-y-4">

                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <ShieldCheck size={23} />
                            </div>

                            <div>
                                <h1 className="text-xl font-bold leading-tight text-card-foreground">Permission Management</h1>
                                <p className="mt-1 text-sm text-muted-foreground">Manage module access and CRUD permissions for users.</p>
                            </div>
                        </div>

                        <button type="button" onClick={handleSave} disabled={loader || !selectUser || !activeModule} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                            <Save size={16} />
                            {loader ? "Loading..." : "Save Permissions"}
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                            <div className="shrink-0">
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Select User</p>

                                <div className="w-full lg:w-[280px]">
                                    <SelectInput {...{ name: "user", label: "", value: selectUser?.value, onChange: handleUserChange, options: userOption, placeholder: "Select User" }} />
                                </div>
                            </div>

                            <div className="hidden h-10 w-px bg-border lg:block" />

                            <div className="min-w-0 flex-1">
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Modules</p>

                                <div className="overflow-x-auto pb-1">
                                    <div className="flex min-w-max gap-2">
                                        {moduleTabs.map((tab: any) => {
                                            const moduleData = permissionData?.[tab.key];
                                            const isActive = activeModule === tab.key;
                                            const toggleOnly = isToggleOnlyModule(moduleData);
                                            const enabled = toggleOnly ? moduleData?.view === true : moduleData?.enabled === true;

                                            return (
                                                <button key={tab.key} type="button" onClick={() => setActiveModule(tab.key)} className={`flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition ${isActive ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"}`}>
                                                    <span>{tab.label}</span>

                                                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-success" : "bg-muted-foreground/60"}`} />
                                                        {enabled ? "ON" : "OFF"}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    {!activeModule ? (
                        <div className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                <ShieldCheck size={26} />
                            </div>

                            <h3 className="text-base font-bold text-card-foreground">No permission modules found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">No permission configuration was returned by the API.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-3 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${activeIsToggleOnly ? activeModuleData?.view ? "bg-success/10 text-success" : "bg-muted text-muted-foreground" : activeModuleData?.enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                                        <ShieldCheck size={20} />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-bold text-card-foreground">{moduleTabs.find((module: any) => module.key === activeModule)?.label}</h2>
                                            {!activeIsToggleOnly && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{totalPermissions} Permissions</span>}
                                        </div>

                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {activeIsToggleOnly ? `Enable or disable ${moduleTabs.find((module: any) => module.key === activeModule)?.label} access for this user.` : "Configure access permissions for this module."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 sm:justify-start">
                                    <div>
                                        <p className="text-sm font-semibold text-card-foreground">{activeIsToggleOnly ? "Access" : "Module Access"}</p>
                                        <p className="text-xs text-muted-foreground">{activeIsToggleOnly ? activeModuleData?.view ? "Enabled for this user" : "Disabled for this user" : activeModuleData?.enabled ? "Enabled for this user" : "Disabled for this user"}</p>
                                    </div>

                                    <button type="button" onClick={() => handleModuleToggle(activeModule)} aria-pressed={activeIsToggleOnly ? activeModuleData?.view === true : activeModuleData?.enabled === true} className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition ${activeIsToggleOnly ? activeModuleData?.view ? "bg-success" : "bg-muted-foreground/30" : activeModuleData?.enabled ? "bg-success" : "bg-muted-foreground/30"}`}>
                                        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${activeIsToggleOnly ? activeModuleData?.view ? "left-6" : "left-1" : activeModuleData?.enabled ? "left-6" : "left-1"}`} />
                                    </button>
                                </div>
                            </div>

                            {activeIsToggleOnly ? (
                                <div className="flex min-h-[250px] items-center justify-center bg-muted/20 p-8">
                                    <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                                        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${activeModuleData?.view ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                                            <ShieldCheck size={26} />
                                        </div>

                                        <h3 className="text-lg font-bold text-card-foreground">{moduleTabs.find((module: any) => module.key === activeModule)?.label}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">{activeModuleData?.view ? "This feature is currently enabled for the selected user." : "This feature is currently disabled for the selected user."}</p>

                                        <div className="mt-5 flex items-center justify-center gap-3">
                                            <span className="text-sm font-semibold text-card-foreground">{activeModuleData?.view ? "Enabled" : "Disabled"}</span>

                                            <button type="button" onClick={() => handleModuleToggle(activeModule)} className={`relative h-7 w-12 cursor-pointer rounded-full transition ${activeModuleData?.view ? "bg-success" : "bg-muted-foreground/30"}`}>
                                                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${activeModuleData?.view ? "left-6" : "left-1"}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : activeModuleData?.enabled !== true ? (
                                <div className="flex min-h-[320px] items-center justify-center p-8">
                                    <div className="max-w-md text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                                            <ShieldCheck size={29} />
                                        </div>

                                        <h3 className="text-lg font-bold text-card-foreground">Module access is disabled</h3>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">Enable this module to configure individual view, create, update and delete permissions.</p>

                                        <button type="button" onClick={() => handleModuleToggle(activeModule)} className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                                            Enable Module
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 bg-muted/20 p-4">

                                    {activeModule === "bookez" && (
                                        <>
                                            <div className="overflow-hidden rounded-xl border border-border bg-card">
                                                <div className="flex flex-col gap-3 border-b border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-card-foreground">Custom Masters</h3>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">{customMasterOptions.length} custom master{customMasterOptions.length === 1 ? "" : "s"}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <p className="text-xs font-semibold text-card-foreground">Restricted</p>
                                                            <p className="text-[11px] text-muted-foreground">{customMasterAccess?.restricted ? "Custom permissions enabled" : "Unrestricted access"}</p>
                                                        </div>

                                                        <button type="button" onClick={() => handleCustomRestrictedToggle("master")} className={`relative h-7 w-12 rounded-full transition ${customMasterAccess?.restricted ? "bg-primary" : "bg-muted-foreground/30"}`}>
                                                            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${customMasterAccess?.restricted ? "left-6" : "left-1"}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {customMasterOptionsLoader ? (
                                                    <div className="p-6 text-center text-sm text-muted-foreground">Loading custom masters...</div>
                                                ) : customMasterOptions.length === 0 ? (
                                                    <div className="p-6 text-center text-sm text-muted-foreground">No custom masters found.</div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full min-w-[720px] table-fixed text-sm">
                                                            <thead>
                                                                <tr className="border-b border-border bg-background">
                                                                    <th className="w-[46%] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom Master</th>
                                                                    <th className="w-[10.8%] px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">All</th>
                                                                    {actions.map((action) => (
                                                                        <th key={action} className="w-[10.8%] px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{action}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>

                                                            <tbody className="divide-y divide-border">
                                                                {customMasterOptions.map((option: any) => {
                                                                    const moduleCode = getOptionModuleCode(option);
                                                                    const moduleName = getOptionModuleName(option);
                                                                    const savedPermission = getCustomMasterPermission(moduleCode);
                                                                    const allChecked = actions.every((action) => savedPermission?.permissions?.[action] === true);

                                                                    return (
                                                                        <tr key={moduleCode} className="bg-card transition-colors hover:bg-muted/40">
                                                                            <td className="px-5 py-3">
                                                                                <div>
                                                                                    <p className="font-medium text-card-foreground">{moduleName}</p>
                                                                                    <p className="mt-0.5 text-xs text-muted-foreground">{moduleCode}</p>
                                                                                </div>
                                                                            </td>

                                                                            <td className="px-2 py-3 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={allChecked}
                                                                                    disabled={!customMasterAccess?.restricted}
                                                                                    onChange={(e) => handleCustomMasterAll(moduleCode, e.target.checked)}
                                                                                    className="h-[18px] w-[18px] cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                                                                                />
                                                                            </td>

                                                                            {actions.map((action) => (
                                                                                <td key={action} className="px-2 py-3 text-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={savedPermission?.permissions?.[action] === true}
                                                                                        disabled={!customMasterAccess?.restricted}
                                                                                        onChange={() => handleCustomMasterPermissionToggle(moduleCode, action)}
                                                                                        className="h-[18px] w-[18px] cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                                                                                    />
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}

                                                {!customMasterAccess?.restricted && (
                                                    <div className="border-t border-border bg-success/5 px-4 py-2.5 text-xs text-muted-foreground">
                                                        Restricted is disabled. This user has unrestricted Custom Master access.
                                                    </div>
                                                )}
                                            </div>

                                            <div className="overflow-hidden rounded-xl border border-border bg-card">
                                                <div className="flex flex-col gap-3 border-b border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-card-foreground">Custom Transactions</h3>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">{customTransactionOptions.length} custom transaction{customTransactionOptions.length === 1 ? "" : "s"}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <p className="text-xs font-semibold text-card-foreground">Restricted</p>
                                                            <p className="text-[11px] text-muted-foreground">{customTransactionAccess?.restricted ? "Custom permissions enabled" : "Unrestricted access"}</p>
                                                        </div>

                                                        <button type="button" onClick={() => handleCustomRestrictedToggle("transaction")} className={`relative h-7 w-12 rounded-full transition ${customTransactionAccess?.restricted ? "bg-primary" : "bg-muted-foreground/30"}`}>
                                                            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${customTransactionAccess?.restricted ? "left-6" : "left-1"}`} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {customTransactionOptionsLoader ? (
                                                    <div className="p-6 text-center text-sm text-muted-foreground">Loading custom transactions...</div>
                                                ) : customTransactionOptions.length === 0 ? (
                                                    <div className="p-6 text-center text-sm text-muted-foreground">No custom transactions found.</div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full min-w-[720px] table-fixed text-sm">
                                                            <thead>
                                                                <tr className="border-b border-border bg-background">
                                                                    <th className="w-[46%] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custom Transaction</th>
                                                                    <th className="w-[10.8%] px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">All</th>
                                                                    {actions.map((action) => (
                                                                        <th key={action} className="w-[10.8%] px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{action}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>

                                                            <tbody className="divide-y divide-border">
                                                                {customTransactionOptions.map((option: any) => {
                                                                    const moduleCode = getOptionModuleCode(option);
                                                                    const moduleName = getOptionModuleName(option);
                                                                    const savedPermission = getCustomTransactionPermission(moduleCode);
                                                                    const allChecked = actions.every((action) => savedPermission?.[action] === true);

                                                                    return (
                                                                        <tr key={moduleCode} className="bg-card transition-colors hover:bg-muted/40">
                                                                            <td className="px-5 py-3">
                                                                                <div>
                                                                                    <p className="font-medium text-card-foreground">{moduleName}</p>
                                                                                    <p className="mt-0.5 text-xs text-muted-foreground">{moduleCode}</p>
                                                                                </div>
                                                                            </td>

                                                                            <td className="px-2 py-3 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={allChecked}
                                                                                    disabled={!customTransactionAccess?.restricted}
                                                                                    onChange={(e) => handleCustomTransactionAll(moduleCode, e.target.checked)}
                                                                                    className="h-[18px] w-[18px] cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                                                                                />
                                                                            </td>

                                                                            {actions.map((action) => (
                                                                                <td key={action} className="px-2 py-3 text-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={savedPermission?.[action] === true}
                                                                                        disabled={!customTransactionAccess?.restricted}
                                                                                        onChange={() => handleCustomTransactionPermissionToggle(moduleCode, action)}
                                                                                        className="h-[18px] w-[18px] cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                                                                                    />
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}

                                                {!customTransactionAccess?.restricted && (
                                                    <div className="border-t border-border bg-success/5 px-4 py-2.5 text-xs text-muted-foreground">
                                                        Restricted is disabled. This user has unrestricted Custom Transaction access.
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {activeSections.length > 0 ? (
                                        activeSections.map((section: any) => (
                                            <div key={section.title} className="overflow-hidden rounded-xl border border-border bg-card">
                                                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-card-foreground">{section.title}</h3>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">{section.items?.length || 0} permission{section.items?.length === 1 ? "" : "s"}</p>
                                                    </div>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full min-w-[720px] table-fixed text-sm">
                                                        <thead>
                                                            <tr className="border-b border-border bg-background">
                                                                <th className="w-[46%] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permission</th>
                                                                <th className="w-[10.8%] px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">All</th>

                                                                {actions.map((action) => (
                                                                    <th key={action} className="w-[10.8%] px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">{action}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>

                                                        <tbody className="divide-y divide-border">
                                                            {section.items.map((permission: any) => {
                                                                const allChecked = isFullRowChecked(activeModule, permission.key);

                                                                return (
                                                                    <tr key={permission.key} className="bg-card transition-colors hover:bg-muted/40">
                                                                        <td className="px-5 py-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/5 text-xs font-bold text-primary">
                                                                                    {permission.label?.charAt(0)?.toUpperCase()}
                                                                                </div>

                                                                                <span className="font-medium text-card-foreground">{permission.label}</span>
                                                                            </div>
                                                                        </td>

                                                                        <td className="px-2 py-3 text-center">
                                                                            <input type="checkbox" checked={allChecked} onChange={(e) => handleRowToggle(activeModule, permission.key, e.target.checked)} className="h-[18px] w-[18px] cursor-pointer rounded border-border accent-primary" />
                                                                        </td>

                                                                        {actions.map((action) => (
                                                                            <td key={action} className="px-2 py-3 text-center">
                                                                                <input type="checkbox" checked={getValueByPath(activeModuleData?.permissions, permission.key, action)} onChange={() => handlePermissionToggle(activeModule, permission.key, action)} className="h-[18px] w-[18px] cursor-pointer rounded border-border accent-primary" />
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))
                                    ) : activeModule !== "bookez" ? (
                                        <div className="rounded-xl border border-dashed border-border bg-card py-14 text-center">
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                                <ShieldCheck size={22} />
                                            </div>

                                            <p className="text-sm font-semibold text-card-foreground">No permissions found</p>
                                            <p className="mt-1 text-xs text-muted-foreground">No permission configuration is available for this module.</p>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PermissionManagement;