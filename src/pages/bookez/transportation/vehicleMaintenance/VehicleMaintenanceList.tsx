import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
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
import { deleteVehicleMaintenance, getAllVehicleMaintenanceEntry, getVehicleMaintenanceByVoucherNumber } from "../../../../redux/slices/professionalSlice/transportation/vehicleMaintenanceEntrySlice";
import { getVehicleMaintenanceVoucher } from "./vehicleMaintenanceInitialState";


/* ===================================================
   HELPERS
=================================================== */

const getApiList = (res: any) => {
    const data = res?.data || res || {};
    const list =
        data?.records ||
        data?.data?.records ||
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

const formatDateTime = (value: any) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatIndianNumber = (value: any) => {
    const number = Number(value || 0);

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatStatus = (value: any) =>
    String(value || "draft")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

const getVehicleNumber = (item: any) =>
    item?.vehicleNumber || item?.vehicle?.vehicleNumber || "-";

const getVehicleType = (item: any) =>
    item?.vehicleType || item?.vehicle?.vehicleType || "-";

const getDriverName = (item: any) =>
    item?.driverName || item?.vehicle?.driverName || "-";

const getMaintenanceType = (item: any) =>
    item?.lastMaintenance?.maintenanceType ||
    item?.maintenanceType ||
    item?.maintenanceCategory ||
    "-";

const getServiceCenter = (item: any) =>
    item?.lastMaintenance?.serviceCenter ||
    item?.serviceDetails?.serviceCenterName ||
    "-";

const getServiceDate = (item: any) =>
    item?.lastMaintenance?.maintenanceDate ||
    item?.serviceDetails?.serviceDate ||
    item?.createdAt ||
    item?.createdOn;

const getAmount = (item: any) =>
    item?.lastMaintenance?.amount || item?.costing?.totalAmount || 0;

/* ===================================================
   VEHICLE MAINTENANCE LIST
=================================================== */

const VehicleMaintenanceList = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();

    const [rows, setRows] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    const [listingLoader, setListingLoader] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
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

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        item: null,
        voucherNumber: null,
    });

    const searchTimerRef = useRef<any>(null);

    const pageTitle = location.state?.title || "Vehicle Maintenance";
    const pageDescription =
        location.state?.description ||
        "Manage vehicle service, documents, parts, cost and maintenance status.";

    /* ===================================================
       FETCH DATA
    =================================================== */

    const fetchEntries = useCallback(
        async ({
            offset = localOffset,
            limit = localLimit,
            searchValue = search,
            showLoader = true,
        }: any = {}) => {
            try {
                if (showLoader) setListingLoader(true);

                const res = await dispatch(
                    getAllVehicleMaintenanceEntry({
                        limit,
                        offset,
                        search: String(searchValue || "").trim(),
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

                toast.error(
                    error?.message || "Failed to load vehicle maintenance entries"
                );

                return [];
            } finally {
                if (showLoader) setListingLoader(false);
            }
        },
        [dispatch, localLimit, localOffset, search]
    );

    useEffect(() => {
        fetchEntries({
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
       FILTER DATA
    =================================================== */

    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();

        return rows.filter((item: any) => {
            if (!q) return true;

            return (
                getVehicleMaintenanceVoucher(item).toLowerCase().includes(q) ||
                String(getVehicleNumber(item)).toLowerCase().includes(q) ||
                String(getDriverName(item)).toLowerCase().includes(q) ||
                String(getMaintenanceType(item)).toLowerCase().includes(q) ||
                String(getServiceCenter(item)).toLowerCase().includes(q)
            );
        });
    }, [rows, search]);

    /* ===================================================
       ACTIONS
    =================================================== */

    const handleRefresh = async () => {
        setRefreshing(true);

        await fetchEntries({
            offset: localOffset,
            limit: localLimit,
            searchValue: search,
            showLoader: false,
        });

        setRefreshing(false);
    };

    const handleCreate = () => {
        navigate("/bookez/transportation/vehicle-maintenance/create", {
            state: {
                title: "Create Vehicle Maintenance",
                description:
                    "Record vehicle service, documents, tyre, battery and cost details.",
                mode: "add",
            },
        });
    };

    const handleEdit = async (item: any) => {
        try {
            setListingLoader(true);

            const voucher = getVehicleMaintenanceVoucher(item);

            if (!voucher) {
                toast.warn("Vehicle maintenance voucher not found");
                return;
            }

            const res = await dispatch(
                getVehicleMaintenanceByVoucherNumber(voucher) as any
            ).unwrap();

            navigate(
                `/bookez/transportation/vehicle-maintenance/edit/${voucher}`,
                {
                    state: {
                        title: "Edit Vehicle Maintenance",
                        description: "Update vehicle maintenance entry.",
                        mode: "edit",
                        voucherNumber: voucher,
                        maintenanceData: res?.data || res,
                    },
                }
            );
        } catch (error: any) {
            toast.error(error?.message || "Failed to open vehicle maintenance");
        } finally {
            setListingLoader(false);
        }
    };

    const handleDeleteClick = (e: any, item: any) => {
        const voucher = getVehicleMaintenanceVoucher(item);

        if (!voucher) {
            toast.warn("Vehicle maintenance voucher not found");
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
                toast.warn("Vehicle maintenance voucher not found");
                return;
            }

            setDeleteLoader(true);

            await dispatch(
                deleteVehicleMaintenance(confirmTooltip.voucherNumber) as any
            ).unwrap();

            toast.success("Vehicle maintenance deleted");

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                item: null,
                voucherNumber: null,
            });

            setLocalOffset(0);

            await fetchEntries({
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
            key: "voucherNumber",
            title: "Voucher",
            render: (row: any) => (
                <span className="">
                    {getVehicleMaintenanceVoucher(row) || "-"}
                </span>
            ),
        },
        {
            key: "lastMaintenance.maintenanceDate",
            title: "Service Date",
            render: (row: any) => formatDateTime(getServiceDate(row)),
        },
        {
            key: "vehicleNumber",
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
        {
            key: "driverName",
            title: "Driver",
            render: (row: any) => getDriverName(row),
        },
        {
            key: "lastMaintenance.maintenanceType",
            title: "Type",
            render: (row: any) => (
                <span className="font-medium text-card-foreground">
                    {getMaintenanceType(row)}
                </span>
            ),
        },
        {
            key: "lastMaintenance.serviceCenter",
            title: "Service Center",
            render: (row: any) => getServiceCenter(row),
        },
        {
            key: "lastMaintenance.amount",
            title: "Amount",
            type: "amount",
            render: (row: any) => `₹${formatIndianNumber(getAmount(row))}`,
        },
        {
            key: "status",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${
                        String(row?.status || "").toLowerCase() === "active"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                    }`}
                >
                    {formatStatus(row?.status)}
                </span>
            ),
        },
    ];

    /* ===================================================
       RENDER
    =================================================== */

    return (
        <div className="flex h-full w-full flex-col bg-card p-4 text-card-foreground shadow-sm">
            <div
                id="vehicle-maintenance-header"
                className="mb-3 flex items-center"
            >
                <div
                    id="vehicle-maintenance-summary"
                    className="flex items-start gap-3"
                >
                    <div>
                        <h1 className="flex items-center gap-1 text-md font-bold text-card-foreground">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="rounded-md p-1 text-muted-foreground transition bg-muted hover:bg-muted hover:text-foreground cursor-pointer"
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
                                pagination?.totalDocs ??
                                pagination?.totalRecords ??
                                filteredRows?.length ??
                                0,
                            text: "Total:",
                            varient: "primary",
                        }}
                    />

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
                        permissionKey="allRegisters"
                        action="create"
                    >
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: handleCreate,
                                text: "Add Maintenance",
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
                    emptyMessage="No vehicle maintenance entries found"
                    actions={(record: any) => (
                        <div className="flex items-center gap-2">
                            <Permission
                                module="bookez"
                                permissionKey="allRegisters"
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
                                permissionKey="allRegisters"
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
                    )}
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
                    message={`Are you sure you want to delete ${
                        confirmTooltip?.voucherNumber || "this entry"
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

export default VehicleMaintenanceList;