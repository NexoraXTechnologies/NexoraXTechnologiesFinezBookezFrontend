import React from "react";
export const EmptyData = ({ text = "No data available" }: { text?: string }) => {
    return (
        <div className="rounded-md bg-muted p-4 text-center text-xs font-bold text-muted-foreground">
            {text}
        </div>
    );
};
export const formatNumber = (value: any) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat("en-IN").format(num);
};
export const toNumber = (value: any) => Number(value || 0);
export const safeJsonParse = (value: any) => {
    try {
        if (!value) return null;
        if (typeof value === "string") return JSON.parse(value);
        return value;
    } catch {
        return null;
    }
};
export const getSavedPermissions = () => {
    const keys = ["permissions", "permissionData", "bookezPermissions"];
    for (const key of keys) {
        const saved = localStorage.getItem(key);
        const parsed = safeJsonParse(saved);
        if (parsed) return parsed;
    }
    return {};
};
export const hasAnyViewPermission = (obj: any): boolean => {
    if (!obj || typeof obj !== "object") return false;
    return Object.values(obj).some((value: any) => {
        if (!value || typeof value !== "object") return false;
        if (value?.view === true) return true;
        return hasAnyViewPermission(value);
    });
};
export const findBookEzPermissionObject = (permissions: any): any => {
    const parsed = safeJsonParse(permissions);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed?.enabled === true && parsed?.permissions) {
        return parsed;
    }
    const possibleBookEz = parsed?.bookez || parsed?.bookEz || parsed?.bookEZ || parsed?.BookEz || parsed?.data?.bookez || parsed?.data?.bookEz || parsed?.permissions?.bookez || parsed?.permissions?.bookEz;
    if (possibleBookEz) {
        return safeJsonParse(possibleBookEz);
    }
    if (parsed?.data) {
        const found = findBookEzPermissionObject(parsed.data);
        if (found) return found;
    }
    return null;
};
export const findTaxEzPermissionObject = (permissions: any): any => {
    const parsed = safeJsonParse(permissions);
    if (!parsed || typeof parsed !== "object") return null;
    const possibleTaxEz = parsed?.taxez || parsed?.taxEz || parsed?.taxEZ || parsed?.TaxEz || parsed?.incomeTax || parsed?.incometax || parsed?.tax || parsed?.data?.taxez || parsed?.data?.taxEz || parsed?.permissions?.taxez || parsed?.permissions?.taxEz;
    if (possibleTaxEz) {
        return safeJsonParse(possibleTaxEz);
    }
    if (parsed?.data) {
        const found = findTaxEzPermissionObject(parsed.data);
        if (found) return found;
    }
    return null;
};
export const isBookEzPermission = (permissions: any) => {
    const bookez = findBookEzPermissionObject(permissions);
    if (!bookez) return false;
    if (bookez?.enabled !== true) return false;
    return hasAnyViewPermission(bookez?.permissions);
};
export const isTaxEzPermission = (permissions: any) => {
    const taxez = findTaxEzPermissionObject(permissions);
    if (!taxez) return false;
    if (taxez === true) return true;
    if (taxez?.enabled === true) {
        if (!taxez?.permissions) return true;
        return hasAnyViewPermission(taxez.permissions);
    }
    return hasAnyViewPermission(taxez?.permissions || taxez);
};
export const pageAnimation: any = {
    hidden: {
        opacity: 0,
        y: 14,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        y: -14,
        transition: {
            duration: 0.2,
        },
    },
};
export const compactContainerAnim: any = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.06,
        },
    },
};
export const scrollableCardListClass = "max-h-[320px] space-y-2 overflow-y-auto pr-1";
export const ModuleAreaTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-card px-4 py-3 text-card-foreground shadow-xl ring-1 ring-border">
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-black text-foreground">
                {formatNumber(payload?.[0]?.value)}
            </p>
        </div>
    );
};
