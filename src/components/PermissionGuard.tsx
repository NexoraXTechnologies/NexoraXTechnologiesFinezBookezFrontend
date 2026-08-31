
import type { ReactNode } from "react";
import {
    checkCustomMasterPermissionFromData,
    checkPermissionFromData,
    getStoredPermissions,
    type PermissionAction,
} from "../utils/permissionUtils";

type PermissionProps = {
    children: ReactNode;
    module?: string;
    permissionKey?: string;
    moduleCode?: string;
    action?: PermissionAction;
};

const Permission = ({
    children,
    module = "bookez",
    permissionKey = "",
    moduleCode = "",
    action = "view",
}: PermissionProps) => {
    const permissions = getStoredPermissions();
    // console.log({permissions})
    const hasPermission = moduleCode
        ? checkCustomMasterPermissionFromData(permissions, moduleCode, action)
        : checkPermissionFromData(permissions, module, permissionKey, action);

    if (!hasPermission) return null;

    return <>{children}</>;
};

const isModuleEnabled = (moduleName: string) => {
    const permissions = getStoredPermissions();
    return permissions?.[moduleName]?.enabled === true;
};
export { isModuleEnabled }

export default Permission;