import React from "react";
import {
    checkPermissionFromData,
    type PermissionAction,
} from "../utils/permissionUtils";

type PermissionGuardProps = {
    module: string;
    permissionKey: string;
    action?: PermissionAction;
    children: React.ReactNode;
    fallback?: React.ReactNode;
};

export const getStoredPermissions = () => {
    try {
        return JSON.parse(localStorage.getItem("permissions") || "{}");
    } catch {
        return {};
    }
};

const Permission = ({ module, permissionKey, action = "view", children, fallback = null }: PermissionGuardProps) => {
    const permissions = getStoredPermissions();
    const isAllowed = checkPermissionFromData(
        permissions,
        module,
        permissionKey,
        action
    );
    if (!isAllowed) return <>{fallback}</>;
    return <>{children}</>;
};

const isModuleEnabled = (moduleName: string) => {
    const permissions = getStoredPermissions();
    return permissions?.[moduleName]?.enabled === true;
};
export { isModuleEnabled }
export default Permission;