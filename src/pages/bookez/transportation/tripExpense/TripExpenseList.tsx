import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Bell,
    CheckCircle2,
    Edit,
    Lock,
    PlayCircle,
    Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import SearchInput from "../../../../components/searchInput";
import Pagination from "../../../../components/pagination";
import Badge from "../../../../components/badge";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import { DataREfreshButton } from "../../../../components/buttons";

import {
    getTripExpenseVoucher,
    isAssignedToDriver,
    mergeTripExpenseForm,
    toTripExpensePayload,
} from "./tripExpenseInitialState";

import {
    deleteTripExpenses,
    getAllTripExpenses,
    getTripExpensesByVoucherNumber,
    updateTripExpenses,
} from "../../../../redux/slices/professionalSlice/transportation/tripExpensesSlice";

import {
    formatDateTime,

    formatStatusLabel,
    money,
    unwrapThunk,
} from "../../../../utils/helperFunctions";
import { applyExcelRowToTripExpenseForm, downloadTripExpenseExcel, pickAndParseTripExpenseExcel } from "./tripExpenseExcel";

/* ===================================================
   COMMON HELPERS
=================================================== */

const safeJsonParse = (value: any) => {
    try {
        if (!value) return null;
        if (typeof value === "object") return value;
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const cleanMobile = (value: any) =>
    String(value || "")
        .replace(/"/g, "")
        .trim();

const getAssignmentPromptKey = (item: any) => {
    const voucher = getTripExpenseVoucher(item);

    if (!voucher) return "";

    const stamp =
        item?.enteredDate ||
        item?.updatedAt ||
        item?.tripDate ||
        item?.createdAt ||
        "";

    return `${voucher}::${stamp}`;
};

const toBool = (value: any) => {
    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
        const clean = value.trim().toLowerCase();

        if (["true", "yes", "1"].includes(clean)) return true;
        if (["false", "no", "0", ""].includes(clean)) return false;
    }

    if (typeof value === "number") return value === 1;

    return Boolean(value);
};

const normalizeTripStatus = (status: any) => {
    const raw = String(status || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    if (!raw) return "draft";
    if (raw === "inprogress" || raw === "in_progress") return "in_progress";
    if (raw === "complete" || raw === "completed") return "completed";
    if (raw === "cancelled" || raw === "canceled") return "cancelled";

    return raw;
};

const isTripClosedSafe = (item: any = {}) =>
    normalizeTripStatus(item?.tripStatus) === "completed";

const isTripInProgressSafe = (item: any = {}) =>
    normalizeTripStatus(item?.tripStatus) === "in_progress";

const isTripPendingAcceptSafe = (item: any = {}) => {
    const status = normalizeTripStatus(item?.tripStatus);
    const driverAccepted = toBool(item?.driverAccepted);

    return (status === "pending" || status === "assigned") && !driverAccepted;
};

const isParentStartedTripSafe = (item: any = {}) => {
    const driverAccepted = toBool(item?.driverAccepted);

    return (
        !driverAccepted &&
        String(item?.notificationType || "") === "trip_started_by_parent" &&
        !isTripClosedSafe(item)
    );
};

const canChildAcceptTripSafe = (item: any = {}) => {
    const driverAccepted = toBool(item?.driverAccepted);

    return (
        !isTripClosedSafe(item) &&
        !driverAccepted &&
        (isTripPendingAcceptSafe(item) || isParentStartedTripSafe(item))
    );
};

const canChildEditTripSafe = (item: any = {}) => {
    const driverAccepted = toBool(item?.driverAccepted);

    if (isTripClosedSafe(item)) return false;
    if (!driverAccepted) return false;

    return isTripInProgressSafe(item) || driverAccepted;
};

const getProfessionalUserFromLocalStorage = () => {
    const localProfessionalUser =
        safeJsonParse(localStorage.getItem("professionalUser")) || {};

    return (
        localProfessionalUser?.ChildUsers ||
        localProfessionalUser?.data?.ChildUsers ||
        localProfessionalUser?.data?.childUser ||
        localProfessionalUser?.data?.user ||
        localProfessionalUser?.user ||
        localProfessionalUser
    );
};

/* ===================================================
   STATUS BADGE
=================================================== */

const StatusBadge = ({ item }: { item: any }) => {
    const closed = isTripClosedSafe(item);
    const pending = isTripPendingAcceptSafe(item);
    const parentStarted = isParentStartedTripSafe(item);

    if (closed) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                <Lock size={13} />
                Closed
            </span>
        );
    }

    if (pending) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                <Bell size={13} />
                Awaiting Accept
            </span>
        );
    }

    if (parentStarted) {
        return (
            <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                <PlayCircle size={13} />
                Parent Started
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
            <CheckCircle2 size={13} />
            {formatStatusLabel(item?.tripStatus)}
        </span>
    );
};

/* ===================================================
   ACCEPT ASSIGNMENT MODAL
=================================================== */

// DISABLED: pending driver trips are now accepted automatically on page entry.
/*
const AcceptAssignmentModal = ({
    item,
    loading,
    onAccept,
    onClose,
}: {
    item: any;
    loading: boolean;
    onAccept: () => void;
    onClose: () => void;
}) => {
    const voucher = getTripExpenseVoucher(item);
    const tripLabel = item?.tripId || voucher || "New trip";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                <div className="border-b border-border px-5 py-4">
                    <div className="flex items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <Bell size={20} />
                        </span>

                        <div className="min-w-0">
                            <h3 className="text-lg font-black text-card-foreground">
                                New Trip Assigned
                            </h3>

                            <p className="mt-1 text-sm font-medium text-muted-foreground">
                                Please accept this trip before entering expenses.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 px-5 py-4">
                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Trip
                        </p>

                        <p className="mt-1 text-base font-black text-card-foreground">
                            {tripLabel}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-border bg-muted/30 p-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                Expense No
                            </p>

                            <p className="mt-1 text-sm font-black text-card-foreground">
                                {voucher || "-"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/30 p-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                Vehicle
                            </p>

                            <p className="mt-1 text-sm font-black text-card-foreground">
                                {item?.vehicle?.vehicleNumber || "-"}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/30 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Date
                        </p>

                        <p className="mt-1 text-sm font-black text-card-foreground">
                            {formatDateTime(item?.tripDate)}
                        </p>
                    </div>

                    {item?.notificationMessage && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm font-semibold text-primary">
                            {item.notificationMessage}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onClose}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-bold text-muted-foreground transition hover:bg-muted disabled:opacity-60"
                    >
                        Later
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={onAccept}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                    >
                        <CheckCircle2 size={17} />
                        {loading ? "Accepting..." : "Accept Trip"}
                    </button>
                </div>
            </div>
        </div>
    );
};
*/

/* ===================================================
   TRIP EXPENSE LIST
=================================================== */

const TripExpenseList = () => {
    const dispatch = useDispatch<any>();
    const location = useLocation();
    const navigate = useNavigate();

    const authUser = useSelector((s: any) => s?.auth?.user);
    const [rows, setRows] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [listingLoader, setListingLoader] = useState(false);
    const [deleteLoader, setDeleteLoader] = useState(false);
    // const [acceptPromptItem, setAcceptPromptItem] = useState<any>(null);

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(20);
    const [activeStatus, setActiveStatus] = useState<"open" | "close">("open");
    const [excelBusy, setExcelBusy] = useState(false);
    const [pagination, setPagination] = useState<any>({
        totalDocs: 0,
        totalRecords: 0,
        hasPrevPage: false,
        hasNextPage: false,
        offset: 0,
        limit: 20,
    });


    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        item: null,
        voucherNumber: null,
    });

    const promptedAssignmentsRef = useRef(new Set<string>());

    const pageTitle = location.state?.title || "Trip Expenses";


    const professionalHeaders = useMemo(() => {
        return safeJsonParse(localStorage.getItem("professionalHeaders")) || {};
    }, []);

    const professionalUserLocal = useMemo(() => {
        return getProfessionalUserFromLocalStorage();
    }, []);

    const currentUserMobile = useMemo(() => {
        return cleanMobile(
            professionalUserLocal?.userMobileNumberHash ||
            professionalUserLocal?.userMobileNumber ||
            professionalUserLocal?.mobileNumber ||
            authUser?.userMobileNumberHash ||
            authUser?.userMobileNumber ||
            authUser?.mobileNumber ||
            localStorage.getItem("userMobileNumberHash") ||
            localStorage.getItem("loginuser") ||
            localStorage.getItem("loginUser")
        );
    }, [authUser, professionalUserLocal]);

    const parentUserMobile = useMemo(() => {
        return cleanMobile(
            professionalUserLocal?.parentUserMobileNumber ||
            professionalUserLocal?.parentUserMobileNumberHash ||
            authUser?.parentUserMobileNumber ||
            authUser?.parentUserMobileNumberHash ||
            professionalHeaders?.["x-db-name"] ||
            professionalHeaders?.parentUserMobileNumber ||
            localStorage.getItem("parentUserMobileNumber") ||
            localStorage.getItem("parentUserMobileNumberHash")
        );
    }, [authUser, professionalHeaders, professionalUserLocal]);

    const user = useMemo(
        () => ({
            ...(authUser || {}),
            ...(professionalUserLocal || {}),
            userMobileNumberHash: currentUserMobile,
            parentUserMobileNumber: parentUserMobile,
        }),
        [authUser, professionalUserLocal, currentUserMobile, parentUserMobile]
    );

    const rowAssignedToCurrentUser = useCallback(
        (item: any) => {
            if (!currentUserMobile) return false;

            const assignedMobiles = [
                item?.assignedDriverMobile,
                item?.tripAssignedToMobile,
                item?.sendNotificationTo,
                item?.driver?.driverId,
                item?.driver?.driverMobile,
                item?.driver?.mobileNumber,
            ];

            return assignedMobiles.some(
                (value) => cleanMobile(value) === currentUserMobile
            );
        },
        [currentUserMobile]
    );

    // const isChildUser = useMemo(() => {
    //     const parentChildCheck = Boolean(
    //         currentUserMobile &&
    //             parentUserMobile &&
    //             currentUserMobile !== parentUserMobile
    //     );

    //     const assignedRowCheck = rows.some(rowAssignedToCurrentUser);

    //     return Boolean(currentUserMobile && (parentChildCheck || assignedRowCheck));
    // }, [currentUserMobile, parentUserMobile, rows, rowAssignedToCurrentUser]);




    const isChildUser = Boolean(
        currentUserMobile &&
        parentUserMobile &&
        currentUserMobile !== parentUserMobile
    );

    /* ===================================================
       FETCH LIST
    =================================================== */

    const fetchExpenses = useCallback(
        async ({
            offset = localOffset,
            limit = localLimit,
            showLoader = true,
        }: any = {}) => {
            try {
                if (showLoader) setListingLoader(true);

                const res = await unwrapThunk(
                    dispatch,
                    getAllTripExpenses({
                        limit,
                        offset,
                        // assignedDriverMobile: isChildUser ? currentUserMobile : "",
                        // parentUserMobileNumber: isChildUser ? parentUserMobile : "",
                    })
                );

                const data = res?.data || res || {};
                const list = data?.records || data?.data || [];
                const pg = data?.pagination || {};

                let listToUse = Array.isArray(list) ? list : [];

                if (isChildUser) {
                    listToUse = listToUse.filter(
                        (item: any) =>
                            rowAssignedToCurrentUser(item) ||
                            isAssignedToDriver(item, currentUserMobile, user)
                    );
                }

                if (isChildUser && offset === 0 && listToUse.length === 0) {
                    try {
                        const fallbackRes = await unwrapThunk(
                            dispatch,
                            getAllTripExpenses({
                                limit: 200,
                                offset: 0,
                            })
                        );

                        const fallbackList =
                            fallbackRes?.data?.records ||
                            fallbackRes?.data?.data ||
                            fallbackRes?.records ||
                            fallbackRes?.data ||
                            [];

                        const matched = (
                            Array.isArray(fallbackList) ? fallbackList : []
                        ).filter(
                            (item: any) =>
                                rowAssignedToCurrentUser(item) ||
                                isAssignedToDriver(item, currentUserMobile, user)
                        );

                        if (matched.length) {
                            listToUse = matched;

                            setPagination({
                                totalDocs: matched.length,
                                totalRecords: matched.length,
                                hasPrevPage: false,
                                hasNextPage: false,
                                offset: 0,
                                limit,
                            });
                        }
                    } catch (fallbackError) {
                        console.log("[TripExpense] child fallback fetch failed", fallbackError);
                    }
                } else {
                    setPagination({
                        ...pg,
                        totalDocs: pg?.totalDocs ?? listToUse.length,
                        totalRecords: pg?.totalRecords ?? pg?.totalDocs ?? listToUse.length,
                        hasPrevPage: !!pg?.hasPrevPage,
                        hasNextPage: !!pg?.hasNextPage,
                        offset: pg?.offset ?? offset,
                        limit: pg?.limit ?? limit,
                    });
                }

                setRows(listToUse);
                return listToUse;
            } catch (e: any) {
                setRows([]);

                setPagination({
                    totalDocs: 0,
                    totalRecords: 0,
                    hasPrevPage: false,
                    hasNextPage: false,
                    offset,
                    limit,
                });

                toast.error(e?.message || "Failed to load trip expenses");
                return [];
            } finally {
                if (showLoader) setListingLoader(false);
            }
        },
        [
            dispatch,
            isChildUser,
            localOffset,
            localLimit,
            currentUserMobile,
            parentUserMobile,
            rowAssignedToCurrentUser,
            user,
        ]
    );

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    /* ===================================================
       SEARCH FILTER
    =================================================== */

    const visibleRows = useMemo(() => {
        if (!isChildUser) return rows;

        return rows.filter(
            (item) =>
                rowAssignedToCurrentUser(item) ||
                isAssignedToDriver(item, currentUserMobile, user)
        );
    }, [rows, isChildUser, rowAssignedToCurrentUser, currentUserMobile, user]);




    const openCount = visibleRows.filter((item) => !isTripClosedSafe(item)).length;
    const closedCount = visibleRows.filter((item) => isTripClosedSafe(item)).length;

    const filteredRows = useMemo(() => {
        return visibleRows.filter((item) => {
            const closed = isTripClosedSafe(item);

            if (activeStatus === "open" && closed) return false;
            if (activeStatus === "close" && !closed) return false;

            if (!search.trim()) return true;

            const q = search.toLowerCase();

            return (
                getTripExpenseVoucher(item).toLowerCase().includes(q) ||
                String(item?.tripId || "").toLowerCase().includes(q) ||
                String(item?.driver?.driverName || "").toLowerCase().includes(q) ||
                String(item?.driver?.driverMobile || "").toLowerCase().includes(q) ||
                String(item?.driver?.mobileNumber || "").toLowerCase().includes(q) ||
                String(item?.vehicle?.vehicleNumber || "").toLowerCase().includes(q) ||
                String(item?.vehicle?.vehicleType || "").toLowerCase().includes(q)
            );
        });
    }, [visibleRows, search, activeStatus]);

    /* ===================================================
       ACTIONS
    =================================================== */


    const handleDownloadExcel = async () => {
        try {
            if (!filteredRows.length) {
                toast.warn("No trip expenses available to export");
                return;
            }

            setExcelBusy(true);

            const result =
                await downloadTripExpenseExcel(
                    filteredRows
                );

            toast.success(
                `Excel downloaded successfully with ${result.count} trip expense${result.count === 1 ? "" : "s"
                }.`
            );
        } catch (error: any) {
            console.error(
                "[TripExpenseExcel] Download error:",
                error
            );

            toast.error(
                error?.message ||
                "Failed to download Excel"
            );
        } finally {
            setExcelBusy(false);
        }
    };

    const handleImportExcel = async () => {
        try {
            setExcelBusy(true);

            const excelRows =
                await pickAndParseTripExpenseExcel();

            if (!Array.isArray(excelRows) || excelRows.length === 0) {
                toast.warn("No valid rows found in Excel");
                return;
            }

            let updated = 0;
            let skipped = 0;
            let failed = 0;

            for (const row of excelRows) {
                const voucherNumber = String(
                    row?.["Voucher Number"] || ""
                ).trim();

                if (!voucherNumber) {
                    skipped += 1;
                    continue;
                }

                try {
                    /*
                     * Load the latest saved Trip Expense before applying
                     * values from Excel.
                     */
                    const response = await unwrapThunk(
                        dispatch,
                        getTripExpensesByVoucherNumber(
                            voucherNumber
                        )
                    );

                    const existing =
                        response?.data?.record ||
                        response?.data?.data ||
                        response?.data ||
                        response?.record ||
                        response;

                    if (!existing) {
                        skipped += 1;
                        continue;
                    }

                    /*
                     * Completed trips must not be changed through Excel.
                     */
                    if (isTripClosedSafe(existing)) {
                        skipped += 1;
                        continue;
                    }

                    /*
                     * Convert the Excel row into the complete API payload.
                     */
                    const payload =
                        applyExcelRowToTripExpenseForm(
                            existing,
                            row
                        );

                    await unwrapThunk(
                        dispatch,
                        updateTripExpenses({
                            voucherNumber,
                            payload,
                        })
                    );

                    updated += 1;
                } catch (rowError) {
                    console.error(
                        `[TripExpenseExcel] Failed to update ${voucherNumber}`,
                        rowError
                    );

                    failed += 1;
                }
            }

            await fetchExpenses({
                offset: 0,
                limit: localLimit,
                showLoader: false,
            });

            setLocalOffset(0);

            if (updated > 0) {
                const details = [
                    skipped > 0
                        ? `${skipped} skipped`
                        : "",
                    failed > 0
                        ? `${failed} failed`
                        : "",
                ]
                    .filter(Boolean)
                    .join(", ");

                toast.success(
                    `${updated} trip expense${updated === 1 ? "" : "s"
                    } updated successfully${details ? ` (${details})` : ""
                    }.`
                );

                return;
            }

            if (skipped > 0 || failed > 0) {
                toast.warn(
                    `No trip expenses updated. ${skipped} skipped, ${failed} failed.`
                );

                return;
            }

            toast.warn("No trip expenses were updated");
        } catch (error: any) {
            console.error(
                "[TripExpenseExcel] Import error:",
                error
            );

            toast.error(
                error?.message ||
                "Failed to import Trip Expense Excel"
            );
        } finally {
            setExcelBusy(false);
        }
    };

    // const handleRefresh = async () => {
    //     setRefreshing(true);

    //     await fetchExpenses({
    //         offset: localOffset,
    //         limit: localLimit,
    //         showLoader: false,
    //     });

    //     setRefreshing(false);
    // };


   const handleRefresh = async () => {
    setRefreshing(true);

    try {
        await fetchExpenses({
            offset: localOffset,
            limit: localLimit,
            showLoader: true,
        });
    } finally {
        setRefreshing(false);
    }
};

    const handleEdit = async (item: any) => {
        if (isTripClosedSafe(item)) {
            toast.error("Completed trip expense cannot be edited");
            return;
        }

        if (isChildUser && isTripPendingAcceptSafe(item)) {
            toast.error("Please accept the trip assignment first");
            return;
        }

        if (isChildUser && !canChildEditTripSafe(item)) {
            toast.error("You can only edit trips that are in progress");
            return;
        }

        try {
            setListingLoader(true);

            const voucherNumber = getTripExpenseVoucher(item);

            if (!voucherNumber) {
                toast.warn("Trip expense voucher number not found");
                return;
            }

            const res = await unwrapThunk(
                dispatch,
                getTripExpensesByVoucherNumber(voucherNumber)
            );

            navigate(`/bookEz/transportation/trip-expense/edit/${voucherNumber}`, {
                state: {
                    title: "Edit Trip Expense",
                    description: "Update trip expense details.",
                    mode: "edit",
                    voucherNumber,
                    expenseData: res?.data || res,
                },
            });
        } catch (e: any) {
            toast.error(e?.message || "Failed to open trip expense");
        } finally {
            setListingLoader(false);
        }
    };

    const performAccept = async (item: any) => {
        const voucher = getTripExpenseVoucher(item);

        try {
            setListingLoader(true);

            if (!voucher) {
                toast.warn("Trip expense voucher number not found");
                return;
            }

            const res = await unwrapThunk(
                dispatch,
                getTripExpensesByVoucherNumber(voucher)
            );

            const data = mergeTripExpenseForm(res?.data || res);

            const payload = toTripExpensePayload(data, {
                tripStatus: "in_progress",
                driverAccepted: true,
                acceptedAt: new Date().toISOString(),
                enteredBy: "driver",
                notificationType: "trip_accepted_by_driver",
                sendNotificationTo: parentUserMobile || "",
                notificationMessage: `${data.driver?.driverName || "Driver"
                    } accepted trip ${data.tripId || voucher}.`,
                notifyParent: true,
            });

            await unwrapThunk(
                dispatch,
                updateTripExpenses({
                    voucherNumber: voucher,
                    payload,
                })
            );

            await fetchExpenses({
                offset: localOffset,
                limit: localLimit,
                showLoader: false,
            });

            toast.success("Trip accepted. You can now enter expenses.");

            navigate(`/bookEz/transportation/trip-expense/edit/${voucher}`, {
                state: {
                    title: "Edit Trip Expense",
                    description: "Update trip expense details.",
                    mode: "edit",
                    voucherNumber: voucher,
                    expenseData: payload,
                },
            });
        } catch (e: any) {
            toast.error(e?.message || "Failed to accept trip");
        } finally {
            setListingLoader(false);
        }
    };

    // DISABLED: the assignment popup is replaced by automatic acceptance.
    /*
    const showAcceptAssignmentModal = useCallback(
        (item: any, { skipDedup = false }: any = {}) => {
            if (!canChildAcceptTripSafe(item)) return;

            const key = getAssignmentPromptKey(item);

            if (!skipDedup) {
                if (key && promptedAssignmentsRef.current.has(key)) return;
                if (key) promptedAssignmentsRef.current.add(key);
            }

            setAcceptPromptItem(item);
        },
        []
    );
    */

    const handleDeleteClick = (e: any, item: any) => {
        if (isTripClosedSafe(item)) {
            toast.error("Completed trip expense cannot be deleted");
            return;
        }

        const voucher = getTripExpenseVoucher(item);

        if (!voucher) {
            toast.warn("Trip expense voucher number not found");
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();

        let x = rect.left - 160;
        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({
            show: true,
            x,
            y,
            item,
            voucherNumber: voucher,
        });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.voucherNumber) {
                toast.warn("Trip expense voucher number not found");
                return;
            }

            setDeleteLoader(true);

            await unwrapThunk(
                dispatch,
                deleteTripExpenses(confirmTooltip.voucherNumber)
            );

            toast.success("Trip expense deleted");

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                item: null,
                voucherNumber: null,
            });

            await fetchExpenses({
                offset: localOffset,
                limit: localLimit,
                showLoader: false,
            });
        } catch (e: any) {
            toast.error(e?.message || "Delete failed");
        } finally {
            setDeleteLoader(false);
        }
    };

    /* ===================================================
       CHILD USER AUTO ACCEPT
    =================================================== */

    // DISABLED: original popup trigger is kept here for future use.
    /*
    useEffect(() => {
        if (listingLoader || !isChildUser || acceptPromptItem) return;

        const pendingItem = visibleRows.find((item) => {
            if (!canChildAcceptTripSafe(item)) return false;

            const key = getAssignmentPromptKey(item);

            return key && !promptedAssignmentsRef.current.has(key);
        });

        if (!pendingItem) return;

        showAcceptAssignmentModal(pendingItem, { skipDedup: false });
    }, [
        listingLoader,
        isChildUser,
        visibleRows,
        acceptPromptItem,
        showAcceptAssignmentModal,
    ]);
    */

    // NEW: automatically accept the first eligible assigned trip.
    useEffect(() => {
        if (listingLoader || !isChildUser) return;

        const pendingItem = visibleRows.find((item) => {
            if (!canChildAcceptTripSafe(item)) return false;

            const key = getAssignmentPromptKey(item);

            return key && !promptedAssignmentsRef.current.has(key);
        });

        if (!pendingItem) return;

        const key = getAssignmentPromptKey(pendingItem);

        if (!key || promptedAssignmentsRef.current.has(key)) return;

        promptedAssignmentsRef.current.add(key);
        performAccept(pendingItem);
    }, [
        listingLoader,
        isChildUser,
        visibleRows,
    ]);

    /* ===================================================
       DEBUG - remove after testing
    =================================================== */

    console.log("TRIP CHILD CHECK", {
        professionalUserLocal,
        currentUserMobile,
        parentUserMobile,
        isChildUser,
        totalRows: rows.length,
        visibleRows: visibleRows.length,
        pendingRows: visibleRows.filter(canChildAcceptTripSafe).length,
        firstPending: visibleRows.find(canChildAcceptTripSafe),
    });

    /* ===================================================
       TABLE COLUMNS
    =================================================== */

    const columns = [
        {
            key: "voucherNumber",
            title: "Expense No",
            render: (row: any) => getTripExpenseVoucher(row) || "-",
        },
        {
            key: "tripDate",
            title: "Date",
            render: (row: any) => formatDateTime(row?.tripDate),
        },
        {
            key: "tripId",
            title: "Trip ID",
            render: (row: any) => row?.tripId || "-",
        },
        {
            key: "driver.driverName",
            title: "Driver",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.driver?.driverName || "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.driver?.driverMobile ||
                            row?.driver?.mobileNumber ||
                            row?.driver?.driverId ||
                            "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "vehicle.vehicleNumber",
            title: "Vehicle",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.vehicle?.vehicleNumber || "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.vehicle?.vehicleType || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "summary.totalTripExpense",
            title: "Total Expense",
            type: "amount",
            render: (row: any) =>
                `${money(row?.summary?.totalTripExpense ?? 0)}`,
        },
        // {
        //     key: "summary.balanceAmount",
        //     title: "Balance",
        //     type: "amount",
        //     render: (row: any) =>
        //         `₹${formatIndianNumber(row?.summary?.balanceAmount ?? 0)}`,
        // },
        {
            key: "tripStatus",
            title: "Status",
            render: (row: any) => <StatusBadge item={row} />,
        },
    ];

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col bg-card p-4 text-card-foreground shadow-sm">
            <div id="trip-expense-header" className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div id="trip-expense-summary" className="flex items-center">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        title="Go back"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="truncate text-lg font-bold text-card-foreground">

                            {pageTitle}
                        </h1>

                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Badge
                        {...{
                            count:
                                isChildUser
                                    ? visibleRows?.length ?? 0
                                    : pagination?.totalDocs ??
                                    pagination?.totalRecords ??
                                    filteredRows?.length ??
                                    0,
                            text: "Total Expenses:",
                            varient: "primary",
                        }}
                    />

                    <div className="flex rounded-md border border-border bg-background p-1">
                        <button
                            type="button"
                            onClick={() => setActiveStatus("open")}
                            className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "open"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            Open ({openCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveStatus("close")}
                            className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "close"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            Closed ({closedCount})
                        </button>
                    </div>
                    <DataREfreshButton
                        {...{
                            callBackFn: handleRefresh,
                            loading: refreshing,
                        }}
                    />

                    <SearchInput
                        {...{
                            search,
                            setSearch,
                        }}
                    />



                    {!isChildUser && (
                        <>
                            <button
                                type="button"
                                onClick={handleDownloadExcel}
                                disabled={
                                    excelBusy ||
                                    listingLoader ||
                                    filteredRows.length === 0
                                }
                                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {excelBusy
                                    ? "Processing..."
                                    : "Download Excel"}
                            </button>

                            <button
                                type="button"
                                onClick={handleImportExcel}
                                disabled={
                                    excelBusy ||
                                    listingLoader
                                }
                                className="inline-flex h-9 items-center justify-center rounded-md border border-primary bg-background px-3 text-xs font-bold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {excelBusy
                                    ? "Processing..."
                                    : "Import Excel"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">


                <DataTable
                    columns={columns}
                    data={filteredRows}
                    loading={listingLoader}
                    emptyMessage="No trip expenses found"
                    {...(activeStatus !== "close"
                        ? {
                            actions: (record: any) => {
                                const closed = isTripClosedSafe(record);

                                if (closed) return null;

                                const childCanAccept =
                                    isChildUser && canChildAcceptTripSafe(record);

                                const childCanEdit = canChildEditTripSafe(record);

                                return (
                                    <div className="flex items-center gap-2">
                                        {childCanAccept ? (
                                            <>
                                                {/* DISABLED: original popup Accept button is kept for future use.
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        showAcceptAssignmentModal(record, {
                                                            skipDedup: true,
                                                        })
                                                    }
                                                    className="rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success transition hover:bg-success/20"
                                                >
                                                    Accept
                                                </button>
                                                */}

                                                <button
                                                    type="button"
                                                    onClick={() => performAccept(record)}
                                                    className="rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-bold text-success transition hover:bg-success/20"
                                                >
                                                    Accept
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {(isChildUser ? childCanEdit : true) && (
                                                    <Permission
                                                        module="bookez"
                                                        permissionKey="tripExpense"
                                                        action="update"
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEdit(record)}
                                                            className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                    </Permission>
                                                )}

                                                {!isChildUser && (
                                                    <Permission
                                                        module="bookez"
                                                        permissionKey="tripExpense"
                                                        action="delete"
                                                    >
                                                        <button
                                                            type="button"
                                                            disabled={deleteLoader}
                                                            onClick={(e) =>
                                                                handleDeleteClick(e, record)
                                                            }
                                                            className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </Permission>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            },
                        }
                        : {})}
                />
            </div>

            {pagination?.totalDocs > 0 && (
                <Pagination
                    localLimit={localLimit}
                    selectCb={(e: any) => {
                        setLocalLimit(Number(e.target.value));
                        setLocalOffset(0);
                    }}
                    preDisabled={!pagination?.hasPrevPage}
                    nextDisabled={!pagination?.hasNextPage}
                    setLocalOffset={setLocalOffset}
                    pagination={pagination}
                />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message={`Are you sure you want to delete ${confirmTooltip?.voucherNumber || "this trip expense"
                        }?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            item: null,
                            voucherNumber: null,
                        })
                    }
                />
            )}

            {/* DISABLED: original popup render is kept for future use.
            {acceptPromptItem && (
                <AcceptAssignmentModal
                    item={acceptPromptItem}
                    loading={listingLoader}
                    onClose={() => setAcceptPromptItem(null)}
                    onAccept={() => {
                        const selected = acceptPromptItem;
                        setAcceptPromptItem(null);
                        performAccept(selected);
                    }}
                />
            )}
            */}
        </div>
    );
};

export default TripExpenseList;
