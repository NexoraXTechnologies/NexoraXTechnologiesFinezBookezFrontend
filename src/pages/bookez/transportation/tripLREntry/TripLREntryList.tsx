import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Lock, Trash2 } from "lucide-react";
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
    deleteTripLRCollection,
    getAllLRCollection,
    getTripLRCollectionByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/transportation/tripLRCollectionSlice";

/* ===================================================
   HELPERS
=================================================== */

const getApiList = (res: any) => {
    const data = res?.data || res || {};

    const list =
        data?.records ||
        data?.tripLRCollection ||
        data?.data?.records ||
        data?.data?.tripLRCollection ||
        data?.data ||
        data?.items ||
        [];

    return Array.isArray(list) ? list : [];
};

const getPagination = (res: any, records: any[] = []) => {
    const data = res?.data || res || {};

    return (
        data?.pagination ||
        data?.data?.pagination || {
            totalDocs: records.length,
            totalRecords: records.length,
            hasPrevPage: false,
            hasNextPage: false,
            offset: 0,
            limit: records.length,
        }
    );
};

const getLRVoucher = (item: any) =>
    item?.lrNumber ||
    item?.voucherNumber ||
    item?.lrVoucherNumber ||
    item?.tripLRVoucherNumber ||
    item?.tripLRCollectionVoucherNumber ||
    item?.lrCollectionVoucherNumber ||
    item?.lrNumber ||
    "";

const normalizeStatus = (value: any) =>
    String(value || "open")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

const getLRStatus = (item: any) =>
    normalizeStatus(
        item?.tripStatus ||
        item?.status ||
        item?.docStatus ||
        item?.lrStatus ||
        item?.collectionStatus ||
        "open"
    );

const isLRClosed = (item: any) => {
    const status = getLRStatus(item);

    return (
        status === "close" ||
        status === "closed" ||
        status === "complete" ||
        status === "completed"
    );
};

const formatStatusLabel = (item: any) => {
    const status = getLRStatus(item);

    if (isLRClosed(item)) return "Closed";

    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
};

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

const getCustomerName = (row: any) =>
    row?.customer?.customerName ||
    row?.customerDetails?.customerName ||
    row?.accountName ||
    row?.customerName ||
    "-";

const getCustomerCode = (row: any) =>
    row?.customer?.customerCode ||
    row?.customerDetails?.customerCode ||
    row?.accountCode ||
    row?.customerCode ||
    "-";

const getVehicleNumber = (row: any) =>
    row?.vehicle?.vehicleNumber ||
    row?.vehicleDetails?.vehicleNumber ||
    row?.vehicleNumber ||
    "-";

const getVehicleType = (row: any) =>
    row?.vehicle?.vehicleType ||
    row?.vehicleDetails?.vehicleType ||
    row?.vehicleType ||
    "-";

const getDriverName = (row: any) =>
    row?.driver?.driverName ||
    row?.driverDetails?.driverName ||
    row?.driverName ||
    "-";

// const getDriverMobile = (row: any) =>
//     row?.driver?.driverMobile ||
//     row?.driver?.mobileNumber ||
//     row?.driver?.driverCode ||
//     row?.driverDetails?.driverMobile ||
//     row?.driverDetails?.mobileNumber ||
//     row?.driverDetails?.driverCode ||
//     row?.driverMobile ||
//     row?.mobileNumber ||
//     "-";

const getRouteName = (row: any) =>
    row?.route?.routeName ||
    (row?.route?.source || row?.route?.destination
        ? `${row?.route?.source || "-"} → ${row?.route?.destination || "-"}`
        : "-");

// const getRouteDistance = (row: any) =>
//     row?.route?.distanceKm || row?.routeDetails?.routeDistanceKm || "";

const getCargoName = (row: any) =>
    row?.cargo?.productName ||
    row?.cargo?.itemName ||
    row?.productName ||
    "-";

// const getCargoQty = (row: any) => {
//     const qty = row?.cargo?.quantity ?? row?.quantity ?? "";
//     const unit = row?.cargo?.unit ?? row?.unit ?? "";

//     if (!qty && !unit) return "-";

//     return `${qty || "0"} ${unit || ""}`.trim();
// };

const getFreightAmount = (row: any) =>
    row?.freight?.agreedFreight ||
    row?.freightDetails?.agreedFreight ||
    row?.freightDetails?.expectedFreight ||
    row?.agreedFreight ||
    row?.expectedFreight ||
    row?.freightAmount ||
    0;

/* ===================================================
   TRIP LR COLLECTION LIST
=================================================== */

const TripLREntryList = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();

    const [rows, setRows] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [activeStatus, setActiveStatus] = useState<"open" | "close">("open");

    const [listingLoader, setListingLoader] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    // @ts-ignore
    const [deleteLoader, setDeleteLoader] = useState(false);

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(20);

    const [pagination, setPagination] = useState<any>({
        totalDocs: 0,
        totalRecords: 0,
        hasPrevPage: false,
        hasNextPage: false,
        offset: 0,
        limit: 20,
    });

    const [openCount, setOpenCount] = useState(0);
    const [closedCount, setClosedCount] = useState(0);

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        item: null,
        voucherNumber: null,
    });

    const searchTimerRef = useRef<any>(null);

    const pageTitle = location.state?.title || "Trip L/R Entry";
  
    const totalLRCount = openCount + closedCount;

    /* ===================================================
       API LOADERS
    =================================================== */

    const fetchTabCounts = useCallback(async () => {
        try {
            const res = await dispatch(
                getAllLRCollection({
                    limit: 1000,
                    offset: 0,
                    search: "",
                    tripStatus: "",
                }) as any
            ).unwrap();

            const list = getApiList(res);

            const clientOpen = list.filter((item: any) => !isLRClosed(item)).length;
            const clientClosed = list.filter((item: any) => isLRClosed(item)).length;

            setOpenCount(clientOpen);
            setClosedCount(clientClosed);
        } catch {
            setOpenCount(0);
            setClosedCount(0);
        }
    }, [dispatch]);

    const fetchEntries = useCallback(
        async ({
            offset = localOffset,
            limit = localLimit,
            searchValue = search,
            showLoader = true,
        }: any = {}) => {
            try {
                if (showLoader) setListingLoader(true);

                /*
                   IMPORTANT:
                   Do not send tripStatus: "open" here because your API data has
                   tripStatus like "in_transit". We fetch records and filter
                   Open/Close on frontend.
                */
                const res = await dispatch(
                    getAllLRCollection({
                        limit,
                        offset,
                        search: searchValue?.trim() || "",
                        tripStatus: "",
                    }) as any
                ).unwrap();

                const list = getApiList(res);
                const pg = getPagination(res, list);

                setRows(list);

                setPagination({
                    ...pg,
                    totalDocs: pg?.totalDocs ?? list.length,
                    totalRecords: pg?.totalRecords ?? pg?.totalDocs ?? list.length,
                    hasPrevPage: !!pg?.hasPrevPage,
                    hasNextPage: !!pg?.hasNextPage,
                    offset: pg?.offset ?? offset,
                    limit: pg?.limit ?? limit,
                });

                return list;
            } catch (error: any) {
                setRows([]);

                setPagination({
                    totalDocs: 0,
                    totalRecords: 0,
                    hasPrevPage: false,
                    hasNextPage: false,
                    offset,
                    limit,
                });

                toast.error(error?.message || "Failed to load trip LR collection");
                return [];
            } finally {
                if (showLoader) setListingLoader(false);
            }
        },
        [dispatch, localLimit, localOffset, search]
    );

    const loadPage = useCallback(
        async ({
            offset = localOffset,
            limit = localLimit,
            searchValue = search,
            showLoader = true,
        }: any = {}) => {
            try {
                if (showLoader) setListingLoader(true);

                await Promise.all([
                    fetchTabCounts(),
                    fetchEntries({
                        offset,
                        limit,
                        searchValue,
                        showLoader: false,
                    }),
                ]);
            } finally {
                if (showLoader) setListingLoader(false);
                setRefreshing(false);
            }
        },
        [fetchEntries, fetchTabCounts, localLimit, localOffset, search]
    );

    useEffect(() => {
        loadPage({
            offset: localOffset,
            limit: localLimit,
            searchValue: search,
            showLoader: true,
        });
    }, [localOffset, localLimit]);

    useEffect(() => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = setTimeout(() => {
            setLocalOffset(0);

            fetchEntries({
                offset: 0,
                limit: localLimit,
                searchValue: search,
                showLoader: true,
            });
        }, 400);

        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, [search, fetchEntries, localLimit]);

    /* ===================================================
       FILTERED ROWS
    =================================================== */

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();

        return rows.filter((item: any) => {
            const closed = isLRClosed(item);

            if (activeStatus === "open" && closed) return false;
            if (activeStatus === "close" && !closed) return false;

            if (!q) return true;

            return (
                String(getLRVoucher(item) || "").toLowerCase().includes(q) ||
                String(item?.tripNumber || "").toLowerCase().includes(q) ||
                String(item?.transportOrderNumber || "").toLowerCase().includes(q) ||
                String(getCustomerName(item) || "").toLowerCase().includes(q) ||
                String(getVehicleNumber(item) || "").toLowerCase().includes(q) ||
                String(getDriverName(item) || "").toLowerCase().includes(q) ||
                String(getRouteName(item) || "").toLowerCase().includes(q) ||
                String(getCargoName(item) || "").toLowerCase().includes(q)
            );
        });
    }, [activeStatus, rows, search]);

    /* ===================================================
       ACTIONS
    =================================================== */

    const handleRefresh = async () => {
        setRefreshing(true);

        await loadPage({
            offset: localOffset,
            limit: localLimit,
            searchValue: search,
            showLoader: false,
        });
    };

    const handleCreate = () => {
        navigate("/bookEz/transportation/trip-lr-entry/create", {
            state: {
                title: "Create Trip L/R Collection",
                description:
                    "Create LR collection with customer, route, vehicle, freight and status.",
                mode: "add",
            },
        });
    };

    const handleEdit = async (item: any) => {
        if (isLRClosed(item)) {
            toast.error("Closed LR collection cannot be edited.");
            return;
        }

        try {
            setListingLoader(true);

            const voucher = getLRVoucher(item);

            if (!voucher) {
                toast.warn("LR number not found");
                return;
            }

            const res = await dispatch(
                getTripLRCollectionByVoucherNumber(voucher) as any
            ).unwrap();

            navigate(`/bookEz/transportation/trip-lr-entry/edit/${voucher}`, {
                state: {
                    title: "Edit Trip L/R Entry",
                    description: "Update LR Entry details.",
                    mode: "edit",
                    voucherNumber: voucher,
                    lrNumber: voucher,
                    lrData: res?.data || res,
                },
            });
        } catch (error: any) {
            toast.error(error?.message || "Failed to open LR Entry");
        } finally {
            setListingLoader(false);
        }
    };

    const handleDeleteClick = (e: any, item: any) => {
        if (isLRClosed(item)) {
            toast.error("Closed LR Entry cannot be deleted.");
            return;
        }

        const voucher = getLRVoucher(item);

        if (!voucher) {
            toast.warn("LR number not found");
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
                toast.warn("LR number not found");
                return;
            }

            setDeleteLoader(true);

            await dispatch(
                deleteTripLRCollection(confirmTooltip.voucherNumber) as any
            ).unwrap();

            toast.success("Trip LR Entry deleted");

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                item: null,
                voucherNumber: null,
            });

            setLocalOffset(0);

            await loadPage({
                offset: 0,
                limit: localLimit,
                searchValue: search,
                showLoader: false,
            });
        } catch (error: any) {
            toast.error(error?.message || "Delete failed");
        } finally {
            setDeleteLoader(false);
        }
    };

    /* ===================================================
       COLUMNS
    =================================================== */

    const columns = [
        {
            key: "lrNumber",
            title: "LR No",
            render: (row: any) => (
                <span className="">
                    {getLRVoucher(row) || "-"}
                </span>
            ),
        },
        {
            key: "lrDate",
            title: "LR Date",
            render: (row: any) => formatDateTime(row?.lrDate || row?.createdOn),
        },
        {
            key: "tripNumber",
            title: "Trip No",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.tripNumber || "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.transportOrderNumber || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "customer",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {getCustomerName(row)}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {getCustomerCode(row)}
                    </div>
                </div>
            ),
        },

        {
            key: "vehicle",
            title: "Vehicle",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {getVehicleNumber(row)}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {getVehicleType(row)}
                    </div>
                </div>
            ),
        },
        // {
        //     key: "driver",
        //     title: "Driver",
        //     render: (row: any) => (
        //         <div>
        //             <div className="font-medium text-card-foreground">
        //                 {getDriverName(row)}
        //             </div>

        //             <div className="text-xs text-muted-foreground">
        //                 {getDriverMobile(row)}
        //             </div>
        //         </div>
        //     ),
        // },
        // {
        //     key: "cargo",
        //     title: "Cargo",
        //     render: (row: any) => (
        //         <div>
        //             <div className="font-medium text-card-foreground">
        //                 {getCargoName(row)}
        //             </div>

        //             <div className="text-xs text-muted-foreground">
        //                 {getCargoQty(row)}
        //             </div>
        //         </div>
        //     ),
        // },
        {
            key: "freight",
            title: "Freight",
            type: "amount",
            render: (row: any) => (
                <div className="text-right">
                    <div className="">
                        ₹{formatIndianNumber(getFreightAmount(row))}
                    </div>

                    {/* <div className="text-xs text-muted-foreground">
                        {row?.freight?.paymentType || "-"}
                    </div> */}
                </div>
            ),
        },
        {
            key: "tripStatus",
            title: "Status",
            render: (row: any) => {
                const closed = isLRClosed(row);

                return closed ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-muted bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
                        <Lock size={12} />
                        Closed
                    </span>
                ) : (
                    <span className="inline-flex rounded-md border border-success/20 bg-success/10 px-2 py-1 text-xs font-bold text-success">
                        {formatStatusLabel(row) || "Open"}
                    </span>
                );
            },
        },
    ];

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col bg-card p-4 text-card-foreground shadow-sm">
            <div id="trip-lr-collection-header" className="mb-3 flex items-center">
                <div
                    id="trip-lr-collection-summary"
                    className="flex items-center"
                >
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

                <div className="ml-auto flex items-center gap-2">
                    <Badge
                        {...{
                            count:
                                pagination?.totalDocs ??
                                pagination?.totalRecords ??
                                filteredRows?.length ??
                                totalLRCount ??
                                0,
                            text: "Total LR:",
                            varient: "primary",
                        }}
                    />

                    <div className="flex rounded-md border border-border bg-background p-1">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveStatus("open");
                                setLocalOffset(0);
                            }}
                            className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "open"
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
                                setLocalOffset(0);
                            }}
                            className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "close"
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


                    <Permission
                        module="bookez"
                        permissionKey="tripLrCollection"
                        action="create"
                    >
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: handleCreate,
                                text: "Create LR",
                            }}
                        />
                    </Permission>

                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredRows}
                    loading={listingLoader}
                    emptyMessage={
                        activeStatus === "close"
                            ? "No closed trip LR collection found"
                            : "No open trip LR collection found"
                    }
                {...(activeStatus !== "close"
                    ? {
                          actions: (record: any) => {
                              if (isLRClosed(record)) return null;

                              return (
                                  <div className="flex items-center gap-2">
                                      <Permission
                                          module="bookez"
                                          permissionKey="tripLrCollection"
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

                                      <Permission
                                          module="bookez"
                                          permissionKey="tripLrCollection"
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
                    message={`Are you sure you want to delete ${confirmTooltip?.voucherNumber || "this LR collection"
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

export default TripLREntryList;