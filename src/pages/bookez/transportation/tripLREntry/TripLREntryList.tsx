import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Edit,
    Lock,
    Plus,
    RefreshCcw,
    Search,
    Trash2,
    Truck,
} from "lucide-react";
import { toast } from "react-toastify";

import {
    deleteTripLREntry,
    getTripLREntries,
    getTripLREntryByVoucher,
} from "../../../../redux/slices/professionalSlice/transportation/tripLREntrySlice";

import { getTripExpenses } from "../../../../redux/slices/professionalSlice/transportation/tripExpenseSlice";

import {
    isTripLREntryClosed,
    normalizeTripLRStatus,
} from "./tripLREntryInitialState";

import {
    getDeleteBlockReason,
    getLRVoucher,
} from "../tripLinkageHelpers";

const LIMIT = 10;

const formatTripLRStatusLabel = (status: any) =>
    normalizeTripLRStatus(status)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

const formatDateTime = (value: any) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatIndianNumber = (value: any) => {
    const number = Number(value || 0);

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const getApiList = (res: any) => {
    const data = res?.data || res || {};
    const list = data?.records || data?.data || data?.items || [];

    return Array.isArray(list) ? list : [];
};

const getPagination = (res: any) => {
    const data = res?.data || res || {};
    return data?.pagination || {};
};

const TripLREntryList = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();

    const [rows, setRows] = useState<any[]>([]);
    const [searchText, setSearchText] = useState("");
    const [activeStatus, setActiveStatus] = useState<"open" | "close">("open");

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [offset, setOffset] = useState(0);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [totalDocs, setTotalDocs] = useState(0);

    const [openCount, setOpenCount] = useState(0);
    const [closedCount, setClosedCount] = useState(0);
    const [tripExpenses, setTripExpenses] = useState<any[]>([]);

    const searchTimerRef = useRef<any>(null);

    const totalEntryCount = openCount + closedCount;

    const loadTripExpenses = useCallback(async () => {
        try {
            const res = await dispatch(
                getTripExpenses({
                    limit: 200,
                    offset: 0,
                }) as any
            ).unwrap();

            setTripExpenses(getApiList(res));
        } catch {
            setTripExpenses([]);
        }
    }, [dispatch]);

    const fetchTabCounts = useCallback(async () => {
        try {
            const [openRes, closeRes, allRes] = await Promise.all([
                dispatch(
                    getTripLREntries({
                        limit: 1,
                        offset: 0,
                        status: "open",
                    }) as any
                ).unwrap(),

                dispatch(
                    getTripLREntries({
                        limit: 1,
                        offset: 0,
                        status: "close",
                    }) as any
                ).unwrap(),

                dispatch(
                    getTripLREntries({
                        limit: 200,
                        offset: 0,
                    }) as any
                ).unwrap(),
            ]);

            const openPg = getPagination(openRes);
            const closePg = getPagination(closeRes);

            const apiOpen = Number(openPg?.totalDocs ?? NaN);
            const apiClosed = Number(closePg?.totalDocs ?? NaN);

            const allList = getApiList(allRes);

            const clientOpen = allList.filter(
                (item: any) => !isTripLREntryClosed(item)
            ).length;

            const clientClosed = allList.filter((item: any) =>
                isTripLREntryClosed(item)
            ).length;

            const apiCountsLookValid =
                Number.isFinite(apiOpen) &&
                Number.isFinite(apiClosed) &&
                apiOpen !== apiClosed;

            setOpenCount(apiCountsLookValid ? apiOpen : clientOpen);
            setClosedCount(apiCountsLookValid ? apiClosed : clientClosed);
        } catch {
            // keep old counts
        }
    }, [dispatch]);

    const fetchEntries = useCallback(
        async ({
            pageOffset = 0,
            status = activeStatus,
            search = searchText,
        }: {
            pageOffset?: number;
            status?: "open" | "close";
            search?: string;
        } = {}) => {
            try {
                const res = await dispatch(
                    getTripLREntries({
                        limit: LIMIT,
                        offset: pageOffset,
                        status,
                        search: search?.trim() || undefined,
                    }) as any
                ).unwrap();

                const list = getApiList(res);
                const pg = getPagination(res);

                setRows(list);
                setTotalDocs(Number(pg?.totalDocs || list.length || 0));
                setHasNextPage(Boolean(pg?.hasNextPage));

                const nextOffset =
                    Number(pg?.offset ?? pageOffset) + Number(pg?.limit ?? LIMIT);

                setOffset(nextOffset);

                return list;
            } catch (error: any) {
                setRows([]);
                setTotalDocs(0);
                setHasNextPage(false);
                toast.error(error?.message || "Failed to load trip LR entries");
                return [];
            }
        },
        [activeStatus, dispatch, searchText]
    );

    const loadPage = useCallback(
        async ({
            nextOffset = 0,
            nextStatus = activeStatus,
            nextSearch = searchText,
            showLoader = true,
        }: {
            nextOffset?: number;
            nextStatus?: "open" | "close";
            nextSearch?: string;
            showLoader?: boolean;
        } = {}) => {
            try {
                if (showLoader) setLoading(true);

                await Promise.all([
                    loadTripExpenses(),
                    fetchTabCounts(),
                    fetchEntries({
                        pageOffset: nextOffset,
                        status: nextStatus,
                        search: nextSearch,
                    }),
                ]);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [
            activeStatus,
            fetchEntries,
            fetchTabCounts,
            loadTripExpenses,
            searchText,
        ]
    );

    useEffect(() => {
        loadPage({
            nextOffset: 0,
            nextStatus: activeStatus,
            nextSearch: searchText,
            showLoader: true,
        });
    }, []);

    useEffect(() => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = setTimeout(() => {
            setOffset(0);
            setHasNextPage(false);

            fetchEntries({
                pageOffset: 0,
                status: activeStatus,
                search: searchText,
            });
        }, 400);

        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, [activeStatus, fetchEntries, searchText]);

    const visibleRows = useMemo(() => {
        const q = searchText.trim().toLowerCase();

        return rows.filter((item: any) => {
            const closed = isTripLREntryClosed(item);

            if (activeStatus === "close" ? !closed : closed) return false;

            if (!q) return true;

            return (
                String(getLRVoucher(item) || "").toLowerCase().includes(q) ||
                String(item?.tripNumber || "").toLowerCase().includes(q) ||
                String(item?.customer?.customerName || "")
                    .toLowerCase()
                    .includes(q) ||
                String(item?.vehicle?.vehicleNumber || "")
                    .toLowerCase()
                    .includes(q) ||
                String(item?.driver?.driverName || "")
                    .toLowerCase()
                    .includes(q)
            );
        });
    }, [activeStatus, rows, searchText]);

    const handleRefresh = async () => {
        setRefreshing(true);
        setOffset(0);
        setHasNextPage(false);

        await loadPage({
            nextOffset: 0,
            nextStatus: activeStatus,
            nextSearch: searchText,
            showLoader: false,
        });
    };

    const handleNextPage = async () => {
        if (!hasNextPage || loading) return;

        await fetchEntries({
            pageOffset: offset,
            status: activeStatus,
            search: searchText,
        });
    };

    const handlePrevPage = async () => {
        const prevOffset = Math.max(0, offset - LIMIT * 2);

        await fetchEntries({
            pageOffset: prevOffset,
            status: activeStatus,
            search: searchText,
        });
    };

    const handleEdit = async (item: any) => {
        if (isTripLREntryClosed(item)) {
            toast.error("Closed trip LR entries cannot be edited.");
            return;
        }

        const blockReason = getDeleteBlockReason(
            "tripLREntry",
            item,
            tripExpenses
        );

        if (blockReason) {
            toast.error(blockReason);
            return;
        }

        try {
            setLoading(true);

            const voucher = getLRVoucher(item);

            const res = await dispatch(
                getTripLREntryByVoucher(voucher) as any
            ).unwrap();

            navigate(`/bookez/transportation/trip-lr-entry/edit/${voucher}`, {
                state: {
                    mode: "edit",
                    voucherNumber: voucher,
                    lrData: res?.data || res,
                },
            });
        } catch (error: any) {
            toast.error(error?.message || "Failed to open trip LR entry");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (item: any) => {
        if (isTripLREntryClosed(item)) {
            toast.error("Closed trip LR entries cannot be deleted.");
            return;
        }

        const blockReason = getDeleteBlockReason(
            "tripLREntry",
            item,
            tripExpenses
        );

        if (blockReason) {
            toast.error(blockReason);
            return;
        }

        const voucher = getLRVoucher(item);

        const confirmed = window.confirm(`Delete ${voucher || "this LR entry"}?`);

        if (!confirmed) return;

        try {
            setDeleteLoading(true);

            await dispatch(deleteTripLREntry(voucher) as any).unwrap();

            toast.success("Trip LR deleted");

            setOffset(0);
            setHasNextPage(false);

            await loadPage({
                nextOffset: 0,
                nextStatus: activeStatus,
                nextSearch: searchText,
                showLoader: false,
            });
        } catch (error: any) {
            toast.error(error?.message || "Delete failed");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCreate = () => {
        navigate("/bookez/transportation/trip-lr-entry/create");
    };

    const currentFrom = totalDocs ? Math.max(1, offset - LIMIT + 1) : 0;
    const currentTo = Math.min(offset, totalDocs || offset);

    return (
        <div className="flex h-full w-full flex-col bg-background text-foreground">
            <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-6">
                <div className="min-w-0">
                    <h1 className="flex items-center gap-2 text-lg font-bold text-card-foreground">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <span className="truncate">
                            Trip L/R Entry ({totalEntryCount})
                        </span>
                    </h1>

                    <p className="ml-8 mt-1 truncate text-sm text-muted-foreground">
                        Manage LR entry, trip, customer, vehicle, freight and status.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
                >
                    <Plus size={16} />
                    Create LR & Start Trip
                </button>
            </header>

            <main className="flex-1 overflow-auto p-4 pb-8 sm:p-5">
                <div className="space-y-4">
                    <div className="rounded-lg border border-border bg-card p-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex rounded-md border border-border bg-background p-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveStatus("open");
                                        setOffset(0);
                                    }}
                                    className={`h-9 rounded px-5 text-sm font-bold transition ${
                                        activeStatus === "open"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    Open ({openCount})
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActiveStatus("close");
                                        setOffset(0);
                                    }}
                                    className={`h-9 rounded px-5 text-sm font-bold transition ${
                                        activeStatus === "close"
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    Closed ({closedCount})
                                </button>
                            </div>

                            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                                <div className="relative w-full sm:w-[360px]">
                                    <Search
                                        size={15}
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    />

                                    <input
                                        value={searchText}
                                        onChange={(e) =>
                                            setSearchText(e.target.value)
                                        }
                                        placeholder="Search LR / trip / customer / vehicle"
                                        className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-9 text-sm text-card-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                    />

                                    {searchText && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchText("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground transition hover:text-danger"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleRefresh}
                                    disabled={refreshing || loading}
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-bold text-card-foreground transition hover:bg-muted disabled:opacity-60"
                                >
                                    <RefreshCcw
                                        size={15}
                                        className={refreshing ? "animate-spin" : ""}
                                    />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card">
                        {loading ? (
                            <div className="flex min-h-[280px] items-center justify-center text-sm font-semibold text-muted-foreground">
                                Loading trip LR entries...
                            </div>
                        ) : visibleRows.length === 0 ? (
                            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background p-6 text-center">
                                <Truck
                                    size={34}
                                    className="mb-2 text-muted-foreground/40"
                                />

                                <p className="text-base font-bold text-card-foreground">
                                    {activeStatus === "close"
                                        ? "No closed trip LR entries"
                                        : "No open trip LR entries"}
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {activeStatus === "close"
                                        ? "Completed LR entries will appear here."
                                        : "Create LR and start trip from the button above."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-separate border-spacing-0">
                                        <thead className="sticky top-0 z-10 bg-muted/50">
                                            <tr>
                                                <Th>LR Voucher</Th>
                                                <Th>Date</Th>
                                                <Th>Trip No.</Th>
                                                <Th>Customer</Th>
                                                <Th>Vehicle</Th>
                                                <Th>Driver</Th>
                                                <Th align="right">Freight</Th>
                                                <Th>Status</Th>
                                                <Th align="center">Action</Th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {visibleRows.map((item: any, index: number) => {
                                                const voucher =
                                                    getLRVoucher(item) || "-";

                                                const closed =
                                                    isTripLREntryClosed(item);

                                                const expenseBlocked =
                                                    !!getDeleteBlockReason(
                                                        "tripLREntry",
                                                        item,
                                                        tripExpenses
                                                    );

                                                const canModify =
                                                    !closed && !expenseBlocked;

                                                const status =
                                                    formatTripLRStatusLabel(
                                                        item?.tripStatus
                                                    );

                                                const freight =
                                                    item?.freight?.agreedFreight ??
                                                    0;

                                                return (
                                                    <tr
                                                        key={`${voucher}-${index}`}
                                                        className="border-b border-border transition hover:bg-muted/30"
                                                    >
                                                        <Td>
                                                            <div className="font-bold text-primary">
                                                                {voucher}
                                                            </div>
                                                        </Td>

                                                        <Td>
                                                            {formatDateTime(
                                                                item?.lrDate ||
                                                                    item?.createdAt
                                                            )}
                                                        </Td>

                                                        <Td>{item?.tripNumber || "-"}</Td>

                                                        <Td>
                                                            <span className="line-clamp-1 font-semibold text-card-foreground">
                                                                {item?.customer
                                                                    ?.customerName ||
                                                                    "-"}
                                                            </span>
                                                        </Td>

                                                        <Td>
                                                            <span className="font-semibold text-card-foreground">
                                                                {item?.vehicle
                                                                    ?.vehicleNumber ||
                                                                    "-"}
                                                            </span>
                                                        </Td>

                                                        <Td>
                                                            {item?.driver?.driverName ||
                                                                "-"}
                                                        </Td>

                                                        <Td align="right">
                                                            <span className="font-black text-card-foreground">
                                                                ₹
                                                                {formatIndianNumber(
                                                                    freight || 0
                                                                )}
                                                            </span>
                                                        </Td>

                                                        <Td>
                                                            {closed ? (
                                                                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                                                                    <Lock size={12} />
                                                                    Closed
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded bg-success/10 px-2 py-1 text-xs font-bold text-success">
                                                                    {status || "Open"}
                                                                </span>
                                                            )}
                                                        </Td>

                                                        <Td align="center">
                                                            {closed ? (
                                                                <span className="text-xs font-bold text-muted-foreground">
                                                                    Locked
                                                                </span>
                                                            ) : canModify ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            handleEdit(
                                                                                item
                                                                            )
                                                                        }
                                                                        className="rounded-md p-2 text-primary transition hover:bg-primary/10"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit size={16} />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            deleteLoading
                                                                        }
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                item
                                                                            )
                                                                        }
                                                                        className="rounded-md p-2 text-danger transition hover:bg-danger/10 disabled:opacity-60"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2
                                                                            size={16}
                                                                        />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs font-bold text-warning">
                                                                    Linked
                                                                </span>
                                                            )}
                                                        </Td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Showing{" "}
                                        <b className="text-card-foreground">
                                            {currentFrom}
                                        </b>{" "}
                                        to{" "}
                                        <b className="text-card-foreground">
                                            {currentTo}
                                        </b>{" "}
                                        of{" "}
                                        <b className="text-card-foreground">
                                            {totalDocs || visibleRows.length}
                                        </b>
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handlePrevPage}
                                            disabled={offset <= LIMIT || loading}
                                            className="h-9 rounded-md border border-border bg-background px-3 text-sm font-bold text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Previous
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleNextPage}
                                            disabled={!hasNextPage || loading}
                                            className="h-9 rounded-md border border-border bg-background px-3 text-sm font-bold text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const Th = ({
    children,
    align = "left",
}: {
    children: any;
    align?: "left" | "right" | "center";
}) => (
    <th
        className={`border-b border-border px-4 py-3 text-xs font-black uppercase tracking-wide text-muted-foreground ${
            align === "right"
                ? "text-right"
                : align === "center"
                ? "text-center"
                : "text-left"
        }`}
    >
        {children}
    </th>
);

const Td = ({
    children,
    align = "left",
}: {
    children: any;
    align?: "left" | "right" | "center";
}) => (
    <td
        className={`border-b border-border px-4 py-3 text-sm text-muted-foreground ${
            align === "right"
                ? "text-right"
                : align === "center"
                ? "text-center"
                : "text-left"
        }`}
    >
        {children}
    </td>
);

export default TripLREntryList;