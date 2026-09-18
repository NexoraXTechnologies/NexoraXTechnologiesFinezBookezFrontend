import type { ReactNode } from "react";
import { useSelector } from "react-redux";
import {
    checkCustomMasterPermissionFromData,
    checkCustomTransactionPermissionFromData,
    checkPermissionFromData,
    getStoredPermissions,
    type PermissionAction,
} from "../utils/permissionUtils";

type PermissionProps = {
    children: ReactNode;
    module?: string;
    permissionKey?: string;
    moduleCode?: string;
    transactionModuleCode?: string;
    action?: PermissionAction;
};

const Permission = ({
    children,
    module = "bookez",
    permissionKey = "",
    moduleCode = "",
    transactionModuleCode = "",
    action = "view",
}: PermissionProps) => {
    const currentUserPermissions = useSelector((state: any) => state?.permissions?.currentUserPermissions || {});

    const permissions = Object.keys(currentUserPermissions || {}).length > 0
        ? currentUserPermissions
        : getStoredPermissions();

    const normalizedMasterCode = String(moduleCode || "").trim();
    const normalizedTransactionCode = String(transactionModuleCode || "").trim();

    let hasPermission = false;

    if (normalizedTransactionCode) {
        hasPermission = checkCustomTransactionPermissionFromData(permissions, normalizedTransactionCode, action);
    } else if (normalizedMasterCode) {
        hasPermission = checkCustomMasterPermissionFromData(permissions, normalizedMasterCode, action);
    } else {
        hasPermission = checkPermissionFromData(permissions, module, permissionKey, action);
    }

    if (!hasPermission) return null;

    return <>{children}</>;
};

const isModuleEnabled = (moduleName: string) => {
    const permissions = getStoredPermissions();
    return permissions?.[moduleName]?.enabled === true;
};

export { isModuleEnabled };

export default Permission;