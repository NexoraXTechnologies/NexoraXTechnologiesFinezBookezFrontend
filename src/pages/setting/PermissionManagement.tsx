import { useEffect, useMemo, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { getProfessionalUsers } from "../../redux/slices/professionalSlice/professionalUserSlice";
import { useDispatch, useSelector } from "react-redux";
import { SelectInput } from "../../components/inputs";
import { getAllPermissions, updatePermission } from "../../redux/slices/permissionSlice";
import { toast } from "react-toastify";

type ActionKey = "view" | "create" | "update" | "delete";

const actions: ActionKey[] = ["view", "create", "update", "delete"];

const defaultPermissionAction = {
    view: false,
    create: false,
    update: false,
    delete: false,
};

const isToggleOnlyModule = (moduleData: any) => {
    return typeof moduleData === "object" && moduleData !== null && !("enabled" in moduleData) && !("permissions" in moduleData) && "view" in moduleData;
};

const isCrudPermission = (value: any) => {
    return typeof value === "object" && value !== null && !Array.isArray(value) && ("view" in value || "create" in value || "update" in value || "delete" in value);
};

const formatLabel = (value: string) => {
    if (!value) return "";

    return value
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .map((word) => /^[A-Z0-9]+$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
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
        const currentPath = parentPath ? `${parentPath}.${key}` : key;

        if (isCrudPermission(value)) {
            items.push({
                key: currentPath,
                label: value?.label || value?.title || value?.name || formatLabel(key),
            });
            return;
        }

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            items.push(...flattenPermissionItems(value, currentPath));
        }
    });

    return items;
};

const buildPermissionSections = (permissionObject: any) => {
    const directItems: any[] = [];
    const nestedSections: any[] = [];

    Object.entries(permissionObject || {}).forEach(([key, value]: any) => {
        if (isCrudPermission(value)) {
            directItems.push({
                key,
                label: value?.label || value?.title || value?.name || formatLabel(key),
            });
            return;
        }

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            const items = flattenPermissionItems(value, key);

            if (items.length > 0) {
                nestedSections.push({
                    title: value?.label || value?.title || value?.name || formatLabel(key),
                    items,
                });
            }
        }
    });

    const sections: any[] = [];

    if (directItems.length > 0) {
        sections.push({
            title: "Permissions",
            items: directItems,
        });
    }

    sections.push(...nestedSections);

    return sections;
};

const getChangedPermissions = (oldData: any, newData: any) => {
    const changes: any = {};

    Object.keys(newData || {}).forEach((moduleKey) => {
        const oldModule = oldData?.[moduleKey];
        const newModule = newData?.[moduleKey];

        if (isToggleOnlyModule(newModule)) {
            if (oldModule?.view !== newModule?.view) {
                changes[moduleKey] = {
                    view: newModule?.view === true,
                };
            }

            return;
        }

        if (oldModule?.enabled !== newModule?.enabled) {
            changes[moduleKey] = {
                ...(changes[moduleKey] || {}),
                enabled: newModule?.enabled,
            };
        }

        const oldPermissions = oldModule?.permissions || {};
        const newPermissions = newModule?.permissions || {};

        const comparePermissionObject = (oldObj: any, newObj: any, path: string[] = []) => {
            Object.keys(newObj || {}).forEach((key) => {
                const oldValue = oldObj?.[key];
                const newValue = newObj?.[key];
                const currentPath = [...path, key];

                const isCrudObject = typeof newValue === "object" && newValue !== null && ("view" in newValue || "create" in newValue || "update" in newValue || "delete" in newValue);

                if (isCrudObject) {
                    const changedActions: any = {};

                    actions.forEach((action) => {
                        if (oldValue?.[action] !== newValue?.[action]) {
                            changedActions[action] = newValue?.[action];
                        }
                    });

                    if (Object.keys(changedActions).length > 0) {
                        if (!changes[moduleKey]) changes[moduleKey] = {};
                        if (!changes[moduleKey].permissions) changes[moduleKey].permissions = {};

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
    const { permissions, loader } = useSelector((s: any) => s.permissions || {});

    const [activeModule, setActiveModule] = useState("");
    const [userOption, setUserOption] = useState<any[]>([]);
    const [selectUser, setSelectUser]: any = useState();
    const [permissionData, setPermissionData] = useState<any>({});

    const moduleTabs = useMemo(() => {
        return Object.entries(permissionData || {}).map(([key, value]: any) => ({
            key,
            label: formatModuleLabel(key, value),
        }));
    }, [permissionData]);

    const activeModuleData = permissionData?.[activeModule];
    const activeIsToggleOnly = isToggleOnlyModule(activeModuleData);

    const activeSections = useMemo(() => {
        if (isToggleOnlyModule(permissionData?.[activeModule])) return [];
        return buildPermissionSections(permissionData?.[activeModule]?.permissions || {});
    }, [activeModule, permissionData]);

    const totalPermissions = useMemo(() => {
        return activeSections.reduce((total: number, section: any) => total + (section?.items?.length || 0), 0);
    }, [activeSections]);

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

        if (e?.userMobileNumberHash) {
            setSelectUser(e);
        }
    };

    const handleModuleToggle = (moduleKey: string) => {
        if (!moduleKey) return;

        setPermissionData((prev: any) => {
            const moduleData = prev?.[moduleKey];

            if (isToggleOnlyModule(moduleData)) {
                return {
                    ...prev,
                    [moduleKey]: {
                        ...moduleData,
                        view: !moduleData?.view,
                    },
                };
            }

            return {
                ...prev,
                [moduleKey]: {
                    ...moduleData,
                    enabled: !moduleData?.enabled,
                    permissions: moduleData?.permissions || {},
                },
            };
        });
    };

    const handlePermissionToggle = (moduleKey: string, permissionKey: string, action: ActionKey) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated[moduleKey]) {
                updated[moduleKey] = {
                    enabled: false,
                    permissions: {},
                };
            }

            if (!updated[moduleKey].permissions) updated[moduleKey].permissions = {};

            const currentValue = getValueByPath(updated[moduleKey].permissions, permissionKey, action);

            setValueByPath(updated[moduleKey].permissions, permissionKey, action, !currentValue);

            return updated;
        });
    };

    const handleRowToggle = (moduleKey: string, permissionKey: string, checked: boolean) => {
        setPermissionData((prev: any) => {
            const updated = structuredClone(prev);

            if (!updated[moduleKey]) {
                updated[moduleKey] = {
                    enabled: false,
                    permissions: {},
                };
            }

            if (!updated[moduleKey].permissions) updated[moduleKey].permissions = {};

            actions.forEach((action) => {
                setValueByPath(updated[moduleKey].permissions, permissionKey, action, checked);
            });

            return updated;
        });
    };

    const isFullRowChecked = (moduleKey: string, permissionKey: string) => {
        return actions.every((action) => getValueByPath(permissionData?.[moduleKey]?.permissions, permissionKey, action));
    };

    const handleSave = async () => {
        try {
            const changedPermissions = getChangedPermissions(permissions, permissionData);

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
            await dispatch(updatePermission({ payload }) as any).unwrap();

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
                                <h1 className="text-xl font-bold leading-tight text-card-foreground">
                                    Permission Management
                                </h1>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Manage module access and CRUD permissions for users.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loader || !selectUser || !activeModule}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save size={16} />
                            {loader ? "Loading..." : "Save Permissions"}
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                            <div className="shrink-0">
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Select User
                                </p>

                                <div className="w-full lg:w-[280px]">
                                    <SelectInput
                                        {...{
                                            name: "user",
                                            label: "",
                                            value: selectUser?.value,
                                            onChange: handleUserChange,
                                            options: userOption,
                                            placeholder: "Select User",
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="hidden h-10 w-px bg-border lg:block" />

                            <div className="min-w-0 flex-1">
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Modules
                                </p>

                                <div className="overflow-x-auto pb-1">
                                    <div className="flex min-w-max gap-2">
                                        {moduleTabs.map((tab: any) => {
                                            const moduleData = permissionData?.[tab.key];
                                            const isActive = activeModule === tab.key;
                                            const toggleOnly = isToggleOnlyModule(moduleData);
                                            const enabled = toggleOnly ? moduleData?.view === true : moduleData?.enabled === true;

                                            return (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    onClick={() => setActiveModule(tab.key)}
                                                    className={`flex h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition ${isActive
                                                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                                                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
                                                        }`}
                                                >
                                                    <span>{tab.label}</span>

                                                    <span
                                                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                                                            }`}
                                                    >
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

                            <h3 className="text-base font-bold text-card-foreground">
                                No permission modules found
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                No permission configuration was returned by the API.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-3 border-b border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${activeIsToggleOnly
                                                ? activeModuleData?.view
                                                    ? "bg-success/10 text-success"
                                                    : "bg-muted text-muted-foreground"
                                                : activeModuleData?.enabled
                                                    ? "bg-success/10 text-success"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                    >
                                        <ShieldCheck size={20} />
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-bold text-card-foreground">
                                                {moduleTabs.find((module: any) => module.key === activeModule)?.label}
                                            </h2>

                                            {!activeIsToggleOnly && (
                                                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                                    {totalPermissions} Permissions
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {activeIsToggleOnly
                                                ? `Enable or disable ${moduleTabs.find((module: any) => module.key === activeModule)?.label} access for this user.`
                                                : "Configure access permissions for this module."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 sm:justify-start">
                                    <div>
                                        <p className="text-sm font-semibold text-card-foreground">
                                            {activeIsToggleOnly ? "Access" : "Module Access"}
                                        </p>

                                        <p className="text-xs text-muted-foreground">
                                            {activeIsToggleOnly
                                                ? activeModuleData?.view
                                                    ? "Enabled for this user"
                                                    : "Disabled for this user"
                                                : activeModuleData?.enabled
                                                    ? "Enabled for this user"
                                                    : "Disabled for this user"}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleModuleToggle(activeModule)}
                                        aria-pressed={activeIsToggleOnly ? activeModuleData?.view === true : activeModuleData?.enabled === true}
                                        className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition ${activeIsToggleOnly
                                                ? activeModuleData?.view
                                                    ? "bg-success"
                                                    : "bg-muted-foreground/30"
                                                : activeModuleData?.enabled
                                                    ? "bg-success"
                                                    : "bg-muted-foreground/30"
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${activeIsToggleOnly
                                                    ? activeModuleData?.view
                                                        ? "left-6"
                                                        : "left-1"
                                                    : activeModuleData?.enabled
                                                        ? "left-6"
                                                        : "left-1"
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {activeIsToggleOnly ? (
                                <div className="flex min-h-[250px] items-center justify-center bg-muted/20 p-8">
                                    <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                                        <div
                                            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${activeModuleData?.view
                                                    ? "bg-success/10 text-success"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            <ShieldCheck size={26} />
                                        </div>

                                        <h3 className="text-lg font-bold text-card-foreground">
                                            {moduleTabs.find((module: any) => module.key === activeModule)?.label}
                                        </h3>

                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {activeModuleData?.view
                                                ? "This feature is currently enabled for the selected user."
                                                : "This feature is currently disabled for the selected user."}
                                        </p>

                                        <div className="mt-5 flex items-center justify-center gap-3">
                                            <span className="text-sm font-semibold text-card-foreground">
                                                {activeModuleData?.view ? "Enabled" : "Disabled"}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => handleModuleToggle(activeModule)}
                                                className={`relative h-7 w-12 cursor-pointer rounded-full transition ${activeModuleData?.view ? "bg-success" : "bg-muted-foreground/30"
                                                    }`}
                                            >
                                                <span
                                                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${activeModuleData?.view ? "left-6" : "left-1"
                                                        }`}
                                                />
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

                                        <h3 className="text-lg font-bold text-card-foreground">
                                            Module access is disabled
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Enable this module to configure individual view, create, update and delete permissions.
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => handleModuleToggle(activeModule)}
                                            className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                                        >
                                            Enable Module
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 bg-muted/20 p-4">
                                    {activeSections.length > 0 ? (
                                        activeSections.map((section: any) => (
                                            <div key={section.title} className="overflow-hidden rounded-xl border border-border bg-card">
                                                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                                                    <div>
                                                        <h3 className="text-sm font-bold text-card-foreground">
                                                            {section.title}
                                                        </h3>

                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {section.items?.length || 0} permission{section.items?.length === 1 ? "" : "s"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full min-w-[720px] table-fixed text-sm">
                                                        <thead>
                                                            <tr className="border-b border-border bg-background">
                                                                <th className="w-[46%] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                    Permission
                                                                </th>

                                                                <th className="w-[10.8%] px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                                    All
                                                                </th>

                                                                {actions.map((action) => (
                                                                    <th
                                                                        key={action}
                                                                        className="w-[10.8%] px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                                                    >
                                                                        {action}
                                                                    </th>
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

                                                                                <span className="font-medium text-card-foreground">
                                                                                    {permission.label}
                                                                                </span>
                                                                            </div>
                                                                        </td>

                                                                        <td className="px-2 py-3 text-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={allChecked}
                                                                                onChange={(e) => handleRowToggle(activeModule, permission.key, e.target.checked)}
                                                                                className="h-[18px] w-[18px] cursor-pointer rounded border-border accent-primary"
                                                                            />
                                                                        </td>

                                                                        {actions.map((action) => (
                                                                            <td key={action} className="px-2 py-3 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={getValueByPath(activeModuleData?.permissions, permission.key, action)}
                                                                                    onChange={() => handlePermissionToggle(activeModule, permission.key, action)}
                                                                                    className="h-[18px] w-[18px] cursor-pointer rounded border-border accent-primary"
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
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-border bg-card py-14 text-center">
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                                <ShieldCheck size={22} />
                                            </div>

                                            <p className="text-sm font-semibold text-card-foreground">
                                                No permissions found
                                            </p>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                No permission configuration is available for this module.
                                            </p>
                                        </div>
                                    )}
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