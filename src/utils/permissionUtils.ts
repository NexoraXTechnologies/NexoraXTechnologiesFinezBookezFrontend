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
    if (!moduleData?.enabled) return false;

    const modulePermissions = moduleData?.permissions;
    if (!modulePermissions) return false;

    const keys = permissionKey?.split(".") || [];
    let current = modulePermissions;

    for (const key of keys) {
        current = current?.[key];
        if (!current) return false;
    }

    return current?.[action] === true;
};

// CUSTOM MASTER PERMISSION
export const checkCustomMasterPermissionFromData = (
    permissions: any,
    moduleCode: string,
    action: PermissionAction = "view"
): boolean => {
    const bookez = permissions?.bookez;
    if (!bookez?.enabled) return false;

    const customMasterAccess = bookez?.permissions?.customMasterAccess;
    if (!customMasterAccess) return false;

    // restricted false means all custom masters are allowed
    if (customMasterAccess?.restricted !== true) return true;

    const masters = Array.isArray(customMasterAccess?.masters) ? customMasterAccess.masters : [];

    const master = masters.find((item: any) => item?.moduleCode === moduleCode);
    if (!master) return false;

    return master?.permissions?.[action] === true;
};