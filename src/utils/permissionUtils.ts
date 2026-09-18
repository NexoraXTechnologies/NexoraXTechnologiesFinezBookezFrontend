// src/utils/permissionUtils.ts

export type PermissionAction = "view" | "create" | "update" | "delete";

export const getStoredPermissions = () => {
    try {
        return JSON.parse(localStorage.getItem("permissions") || "{}");
    } catch {
        return {};
    }
};

export const checkPermissionFromData = (
    permissions: any,
    module: string,
    permissionKey: string,
    action: PermissionAction = "view"
): boolean => {
    const moduleData = permissions?.[module];

    if (!moduleData) return false;
    if ("enabled" in moduleData && moduleData?.enabled !== true) return false;

    const modulePermissions = moduleData?.permissions;
    if (!modulePermissions) return false;

    const keys = permissionKey?.split(".").filter(Boolean) || [];
    if (keys.length === 0) return false;

    let current = modulePermissions;

    for (const key of keys) {
        current = current?.[key];

        if (!current) return false;

        if (
            typeof current === "object" &&
            current !== null &&
            "enabled" in current &&
            current?.enabled !== true
        ) {
            return false;
        }
    }

    return current?.[action] === true;
};

// CUSTOM MASTER PERMISSION
export const checkCustomMasterPermissionFromData = (
    permissions: any,
    moduleCode: string,
    action: PermissionAction = "view"
): boolean => {
    const normalizedModuleCode = String(moduleCode || "").trim();
    if (!normalizedModuleCode) return false;

    const bookez = permissions?.bookez;
    if (!bookez?.enabled) return false;

    const customMasterAccess = bookez?.permissions?.customMasterAccess;
    if (!customMasterAccess) return false;

    if (customMasterAccess?.restricted !== true) return true;

    const masters = Array.isArray(customMasterAccess?.masters) ? customMasterAccess.masters : [];

    const master = masters.find(
        (item: any) => String(item?.moduleCode || "").trim() === normalizedModuleCode
    );

    if (!master) return false;

    return master?.permissions?.[action] === true;
};

// CUSTOM TRANSACTION PERMISSION
export const checkCustomTransactionPermissionFromData = (
    permissions: any,
    moduleCode: string,
    action: PermissionAction = "view"
): boolean => {
    const normalizedModuleCode = String(moduleCode || "").trim();
    if (!normalizedModuleCode) return false;

    const bookez = permissions?.bookez;
    if (!bookez?.enabled) return false;

    const customTransactionAccess = bookez?.permissions?.customTransactionAccess;
    if (!customTransactionAccess) return false;

    if (customTransactionAccess?.restricted !== true) return true;

    const modules = Array.isArray(customTransactionAccess?.modules) ? customTransactionAccess.modules : [];

    const transactionModule = modules.find(
        (item: any) => String(item?.moduleCode || "").trim() === normalizedModuleCode
    );

    if (!transactionModule) return false;

    return transactionModule?.[action] === true;
};