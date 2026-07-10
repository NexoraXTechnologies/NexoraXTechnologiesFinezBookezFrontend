import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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

import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   HELPERS
=================================================== */

const money = (value: any) => {
    const num = Number(value || 0);

    return `₹${num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
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

const getApiList = (res: any) => {
    const data = res?.data || res || {};

    const list =
        data?.records ||
        data?.data?.records ||
        data?.result ||
        data?.data?.result ||
        data?.items ||
        data?.data?.items ||
        data?.data ||
        [];

    return Array.isArray(list) ? list : [];
};

const getApiPagination = (res: any, fallback: any = {}) => {
    const data = res?.data || res || {};

    return (
        data?.pagination ||
        data?.data?.pagination ||
        {
            offset: fallback.offset || 0,
            limit: fallback.limit || 20,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        }
    );
};

const getSettlementNumber = (record: any) =>
    record?.driverSettlementNumber ||
    record?.settlementNumber ||
    record?.voucherNumber ||
    record?.driverSettlementVoucherNumber ||
    "";

const getDriverName = (record: any) =>
    record?.driver?.driverName ||
    record?.driverName ||
    record?.driverAllocation?.driverName ||
    "-";

const getDriverMobile = (record: any) =>
    record?.driver?.driverId ||
    record?.driver?.mobileNumber ||
    record?.driverMobile ||
    record?.mobileNumber ||
    "-";

const getTripNumber = (record: any) =>
    record?.tripId ||
    record?.tripNumber ||
    record?.transportOrderNumber ||
    record?.orderNumber ||
    record?.tripDetails?.tripNo ||
    "-";

const getLRNumber = (record: any) =>
    record?.lrNumber ||
    record?.lrNo ||
    record?.tripDetails?.lrNo ||
    record?.lrEntry?.lrNumber ||
    "-";

const getVehicleNumber = (record: any) =>
    record?.vehicle?.vehicleNumber ||
    record?.vehicleSelection?.vehicleNumber ||
    record?.tripDetails?.vehicleNo ||
    record?.vehicleNumber ||
    "-";

const getNetPayable = (record: any) =>
    Number(
        record?.settlement?.netPayable ||
        record?.netPayable ||
        record?.summary?.netPayable ||
        0
    );

const getStatusClass = (status: any) => {
    const value = String(status || "").toLowerCase();

    if (value === "paid" || value === "completed") {
        return "border-success/20 bg-success/10 text-success";
    }

    if (value === "cancelled" || value === "rejected") {
        return "border-danger/20 bg-danger/10 text-danger";
    }

    if (value === "pending" || value === "draft") {
        return "border-warning/20 bg-warning/10 text-warning";
    }

    return "border-primary/20 bg-primary/10 text-primary";
};

/* ===================================================
   API HELPERS
=================================================== */

const getDriverSettlementsApi = ({
    limit = 20,
    offset = 0,
    search = "",
    status = "",
}: any = {}) => {
    return professionalAxios.get(
        "",
        {
            params: {
                limit,
                offset,
                search,
                status,
            },
        }
    );
};

const deleteDriverSettlementApi = (voucherNumber: string) => {
    return professionalAxios.delete(
        `${voucherNumber}`
    );
};

/* ===================================================
   DRIVER SETTLEMENT LIST
=================================================== */

const DriverSettlementList = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [settlements, setSettlements] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>({
        offset: 0,
        limit: 20,
        totalDocs: 0,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });

    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(20);

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        settlementNumber: null,
    });

    const pageTitle = location.state?.title || "Driver Settlement";
    const pageDescription =
        location.state?.description ||
        "Calculate and settle driver advances, expenses, and final trip balance.";

    const loadSettlements = async ({
        offset = localOffset,
        limit = localLimit,
        searchValue = search,
        silent = false,
    }: any = {}) => {
        try {
            if (!silent) setLoading(true);

            const res = await getDriverSettlementsApi({
                limit,
                offset,
                search: searchValue,
            });

            const list = getApiList(res);
            const apiPagination = getApiPagination(res, { offset, limit });

            setSettlements(list);
            setPagination(apiPagination);
        } catch (error: any) {
            setSettlements([]);
            setPagination({
                offset,
                limit,
                totalDocs: 0,
                totalPages: 1,
                currentPage: 1,
                hasNextPage: false,
                hasPrevPage: false,
            });

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load driver settlements"
            );
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadSettlements({
            offset: localOffset,
            limit: localLimit,
            searchValue: search,
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localOffset, localLimit]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLocalOffset(0);

            loadSettlements({
                offset: 0,
                limit: localLimit,
                searchValue: search,
                silent: false,
            });
        }, 400);

        return () => clearTimeout(timer);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);

            await loadSettlements({
                offset: localOffset,
                limit: localLimit,
                searchValue: search,
                silent: true,
            });
        } finally {
            setRefreshing(false);
        }
    };

    const openCreateSettlement = () => {
        navigate("/bookez/transportation/driver-settlement/create", {
            state: {
                title: "Create Driver Settlement",
                description:
                    "Create salary based driver settlement using trip expenses and advances.",
                mode: "add",
            },
        });
    };

    const handleEditSettlement = (record: any) => {
        const settlementNumber = getSettlementNumber(record);

        if (!settlementNumber) {
            toast.warn("Settlement number not found");
            return;
        }

        navigate(
            `/bookez/transportation/driver-settlement/edit/${settlementNumber}`,
            {
                state: {
                    title: "Edit Driver Settlement",
                    description: "Update driver settlement details.",
                    mode: "edit",
                    settlementNumber,
                    voucherNumber: settlementNumber,
                    settlementData: record,
                },
            }
        );
    };

    const handleDeleteClick = (e: any, record: any) => {
        const settlementNumber = getSettlementNumber(record);

        if (!settlementNumber) {
            toast.warn("Settlement number not found");
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
            settlementNumber,
        });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.settlementNumber) {
                toast.warn("Settlement number not found");
                return;
            }

            setDeleteLoading(true);

            await deleteDriverSettlementApi(confirmTooltip.settlementNumber);

            toast.success("Driver settlement deleted successfully");

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                settlementNumber: null,
            });

            await loadSettlements({
                offset: localOffset,
                limit: localLimit,
                searchValue: search,
                silent: true,
            });
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete driver settlement"
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    const columns = [
        {
            key: "driverSettlementNumber",
            title: "Settlement No",
            render: (row: any) => (
                <div>
                    <div className="text-card-foreground">
                        {getSettlementNumber(row) || "-"}
                    </div>

                    <div className="text-xs font-medium text-muted-foreground">
                        {formatDateTime(row?.settlementDate || row?.paymentDate)}
                    </div>
                </div>
            ),
        },
        {
            key: "driver.driverName",
            title: "Driver",
            render: (row: any) => (
                <div>
                    <div className="text-card-foreground">
                        {getDriverName(row)}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {getDriverMobile(row)}
                    </div>
                </div>
            ),
        },
        {
            key: "tripId",
            title: "Trip / LR",
            render: (row: any) => (
                <div>
                    <div className="text-card-foreground">
                        {getTripNumber(row)}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        LR: {getLRNumber(row)}
                    </div>
                </div>
            ),
        },
        {
            key: "vehicle.vehicleNumber",
            title: "Vehicle",
            render: (row: any) => getVehicleNumber(row),
        },
        {
            key: "salary",
            title: "Salary",
            type: "amount",
            render: (row: any) => money(row?.salary),
        },
        {
            key: "incentives",
            title: "Incentives",
            type: "amount",
            render: (row: any) => money(row?.incentives),
        },
        {
            key: "totalAdvances",
            title: "Advances",
            type: "amount",
            render: (row: any) =>
                money(row?.settlement?.totalAdvances || row?.totalAdvances || 0),
        },
        {
            key: "settlement.netPayable",
            title: "Net Payable",
            type: "amount",
            render: (row: any) => {
                const netPayable = getNetPayable(row);

                return (
                    <span
                        className={`font-black ${netPayable < 0 ? "text-danger" : "text-success"
                            }`}
                    >
                        {money(netPayable)}
                    </span>
                );
            },
        },
        {
            key: "paymentMode",
            title: "Payment Mode",
            render: (row: any) => row?.paymentMode || "-",
        },
        {
            key: "status",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-bold capitalize ${getStatusClass(
                        row?.status || "draft"
                    )}`}
                >
                    {row?.status || "draft"}
                </span>
            ),
        },
    ];

    return (
        <div className="flex h-full w-full flex-col bg-card p-4 text-card-foreground shadow-sm">
            <div id="driver-settlement-header" className="mb-3 flex items-center">
                <div
                    id="driver-settlement-summary"
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

                        <p className=" text-sm text-muted-foreground">
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
                                settlements?.length ??
                                0,
                            text: "Total Settlements:",
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

                    <Permission module="bookez" permissionKey="Pass" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openCreateSettlement,
                                text: "Create Settlement",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={settlements}
                    loading={loading}
                    emptyMessage="No driver settlement found"
                    actions={(record: any) => (
                        <div className="flex items-center gap-2">
                            <Permission
                                module="bookez"
                                permissionKey="Pass"
                                action="update"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleEditSettlement(record)}
                                    className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                                >
                                    <Edit size={16} />
                                </button>
                            </Permission>

                            <Permission
                                module="bookez"
                                permissionKey="Pass"
                                action="delete"
                            >
                                <button
                                    type="button"
                                    disabled={deleteLoading}
                                    onClick={(e) => handleDeleteClick(e, record)}
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
                    message="Are you sure you want to delete this driver settlement?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            settlementNumber: null,
                        })
                    }
                />
            )}
        </div>
    );
};

export default DriverSettlementList;