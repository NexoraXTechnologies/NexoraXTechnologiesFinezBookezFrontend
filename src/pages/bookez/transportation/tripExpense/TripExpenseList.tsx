import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../components/buttons";

import {
    canChildEditTrip,
    getTripExpenseVoucher,
    isAssignedToDriver,
    isParentStartedTrip,
    isTripClosed,
    isTripPendingAccept,
    mergeTripExpenseForm,
    toTripExpensePayload,
} from "./tripExpenseInitialState";

import {
    createTripExpense,
    deleteTripExpenses,
    getAllTripExpenses,
    getTripExpensesByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/transportation/tripExpensesSlice";
import { formatDateTime, formatIndianNumber, formatStatusLabel, unwrapThunk } from "../../../../utils/helperFunctions";

/* ===================================================
   HELPERS
=================================================== */
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

/* ===================================================
   STATUS BADGE
=================================================== */

const StatusBadge = ({ item }: { item: any }) => {
    const closed = isTripClosed(item);
    const pending = isTripPendingAccept(item);
    const parentStarted = isParentStartedTrip(item);

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
   TRIP EXPENSE LIST
=================================================== */

const TripExpenseList = () => {
    const dispatch = useDispatch<any>();
    const location = useLocation();
    const navigate = useNavigate();

    const user =
        useSelector((s: any) => s?.auth?.user) ||
        JSON.parse(localStorage.getItem("user") || "{}");

    const isChildUser =
        !!user?.parentUserMobileNumber &&
        user?.parentUserMobileNumber !== user?.userMobileNumberHash;

    const [rows, setRows] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [listingLoader, setListingLoader] = useState(false);
    const [deleteLoader, setDeleteLoader] = useState(false);

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(20);
    const [activeStatus, setActiveStatus] = useState<"open" | "close">("open");

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
    const pageDescription =
        location.state?.description ||
        "Record fuel, toll, loading, unloading, and other trip-related expenses.";

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
                    })
                );

                const data = res?.data || res || {};
                const list = data?.records || data?.data || [];
                const pg = data?.pagination || {};

                let listToUse = Array.isArray(list) ? list : [];

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

                        const matched = (Array.isArray(fallbackList) ? fallbackList : []).filter(
                            (item: any) =>
                                isAssignedToDriver(item, user?.userMobileNumberHash, user)
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
            user?.userMobileNumberHash,
            user?.parentUserMobileNumber,
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

        const childMobile = String(user?.userMobileNumberHash || "").trim();

        return rows.filter(
            (item) =>
                isAssignedToDriver(item, childMobile, user) ||
                String(item?.assignedDriverMobile || "").trim() === childMobile ||
                String(item?.tripAssignedToMobile || "").trim() === childMobile ||
                String(item?.driver?.driverMobile || "").trim() === childMobile ||
                String(item?.driver?.mobileNumber || "").trim() === childMobile ||
                String(item?.ownerUser || "").trim() === childMobile ||
                String(item?.createdBy || "").trim() === childMobile
        );
    }, [rows, isChildUser, user]);

    const openCount = visibleRows.filter((item) => !isTripClosed(item)).length;
    const closedCount = visibleRows.filter((item) => isTripClosed(item)).length;

    const filteredRows = useMemo(() => {
        return visibleRows.filter((item) => {
            const closed = isTripClosed(item);

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

    const handleRefresh = async () => {
        setRefreshing(true);

        await fetchExpenses({
            offset: localOffset,
            limit: localLimit,
            showLoader: false,
        });

        setRefreshing(false);
    };

    // const openCreateTripExpense = () => {
    //     navigate("/bookEz/transportation/trip-expense/create", {
    //         state: {
    //             title: "Create Trip Expense",
    //             description:
    //                 "Record fuel, toll, loading, unloading, and other expenses for a trip.",
    //             // mode: "add",
    //         },
    //     });
    // };

 const handleEdit = async (item: any) => {
	if (isTripClosed(item)) {
		toast.error("Completed trip expense cannot be edited");
		return;
	}

	if (isChildUser && isTripPendingAccept(item)) {
		toast.error("Please accept the trip assignment first");
		return;
	}

	if (isChildUser && !canChildEditTrip(item)) {
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
                notificationType: "trip_started",
                sendNotificationTo: user?.parentUserMobileNumber || "",
                notificationMessage: `${data.driver?.driverName || "Driver"
                    } accepted trip ${data.tripId || voucher}.`,
                notifyParent: true,
            });

            await unwrapThunk(
                dispatch,
                createTripExpense({
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

            navigate("/trip-expense/create-edit", {
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

    const handleAcceptTrip = (item: any) => {
        const voucher = getTripExpenseVoucher(item);
        const tripLabel = item?.tripId || voucher || "this trip";

        const confirmAccept = window.confirm(
            `Accept trip ${tripLabel}? Your parent user will receive a notification.`
        );

        if (confirmAccept) {
            performAccept(item);
        }
    };

    const handleDeleteClick = (e: any, item: any) => {
        if (isTripClosed(item)) {
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
       CHILD USER ASSIGNMENT PROMPT
    =================================================== */

    useEffect(() => {
        if (listingLoader || !isChildUser) return;

        const pending = visibleRows.filter((item) => {
            if (!isTripPendingAccept(item)) return false;

            const key = getAssignmentPromptKey(item);

            return key && !promptedAssignmentsRef.current.has(key);
        });

        if (!pending.length) return;

        const first = pending[0];
        const key = getAssignmentPromptKey(first);

        if (key) promptedAssignmentsRef.current.add(key);
    }, [listingLoader, isChildUser, visibleRows]);

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
                        {row?.driver?.driverMobile || row?.driver?.mobileNumber || "-"}
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
                `₹${formatIndianNumber(row?.summary?.totalTripExpense ?? 0)}`,
        },
        {
            key: "summary.balanceAmount",
            title: "Balance",
            type: "amount",
            render: (row: any) =>
                `₹${formatIndianNumber(row?.summary?.balanceAmount ?? 0)}`,
        },
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
            <div id="trip-expense-header" className="mb-3 flex items-center">
                <div id="trip-expense-summary" className="flex items-start gap-3">
                    <div>
                        <h1 className="flex items-center gap-1 text-md font-bold text-card-foreground">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                <ArrowLeft size={18} />
                            </button>

                            <span>{pageTitle}</span>
                        </h1>

                        <p className="px-2 text-sm text-muted-foreground">
                            {pageDescription}
                        </p>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
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
                            className={`rounded px-3 py-1.5 text-xs  transition ${activeStatus === "open"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            Open ({openCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveStatus("close")}
                            className={`rounded px-3 py-1.5 text-xs  transition ${activeStatus === "close"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            Close ({closedCount})
                        </button>
                    </div>

                    <SearchInput
                        {...{
                            search,
                            setSearch,
                        }}
                    />

                    <DataREfreshButton
                        {...{
                            callBackFn: handleRefresh,
                            loading: refreshing,
                        }}
                    />

                    {/* {!isChildUser && (
                        <Permission
                            module="bookez"
                            permissionKey="Pass"
                            action="create"
                        >
                          
                            <DataCreateButton
                                {...{
                                    callBackFn: openCreateTripExpense,
                                    text: "Create Expense",
                                }}
                            />
                        </Permission>
                    )} */}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredRows}
                    loading={listingLoader}
                    emptyMessage="No trip expenses found"
                    actions={(record: any) => {
                        const closed = isTripClosed(record);
                        const pendingAccept = isTripPendingAccept(record);
                        const childCanEdit = canChildEditTrip(record);

                        return (
                            <div className="flex items-center gap-2">
                                {pendingAccept && isChildUser ? (
                                    <button
                                        type="button"
                                        onClick={() => handleAcceptTrip(record)}
                                        className="rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
                                    >
                                        Accept
                                    </button>
                                ) : !closed ? (
                                    <>
                                        {(isChildUser ? childCanEdit : true) && (
                                            <Permission
                                                module="bookez"
                                                permissionKey="Pass"
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
                                                permissionKey="allRegisters"
                                                action="delete"
                                            >
                                                <button
                                                    type="button"
                                                    disabled={deleteLoader}
                                                    onClick={(e) => handleDeleteClick(e, record)}
                                                    className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </Permission>
                                        )}
                                    </>
                                ) : null}
                            </div>
                        );
                    }}
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
        </div>
    );
};

export default TripExpenseList;