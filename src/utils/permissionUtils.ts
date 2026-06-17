// src/utils/permissionUtils.ts

export type PermissionAction = "view" | "create" | "update" | "delete";

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
    console.log({ keys })
    let current = modulePermissions;
    for (const key of keys) {
        current = current?.[key];
        if (!current) return false;
    }

    return current?.[action] === true;
};