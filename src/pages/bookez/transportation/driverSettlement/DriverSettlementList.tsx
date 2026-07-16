import { useEffect, useMemo, useState } from "react";
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
import { deleteDriverSettlement, getAllDriverSettlement } from "../../../../redux/slices/professionalSlice/transportation/driverSettlementSlice";
import { useDispatch, useSelector } from "react-redux";
import { truncate } from "../../../../utils/helperFunctions";

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



const getSettlementNumber = (record: any) =>
    record?.settlementNumber || "-";

const getDriverName = (record: any) =>
    record?.lrDetails?.driverName || "-";

const getDriverMobile = (record: any) =>
    record?.driverCode || "-";

const getTripNumber = (record: any) =>
    record?.transportOrderNumber ||
    record?.lrDetails?.tripNumber ||
    "-";

const getLRNumber = (record: any) =>
    record?.lrDetails?.lrNumber || "-";

const getVehicleNumber = (record: any) =>
    record?.lrDetails?.vehicleNo || "-";
const getRouteFrom = (record: any) =>
    record?.lrDetails?.from || "-";
const getRouteTo = (record: any) =>
    record?.lrDetails?.to || "-";

const getNetPayable = (record: any) =>
    Number(record?.netPayableToDriver || 0);

// const getIncentives = (record: any) =>
//     Number(record?.otherIncentives || 0);

// const getAdvances = (record: any) =>
//     Number(record?.lessAdvancesToDriver || 0);

const getSettlementDate = (record: any) =>
    record?.paymentDate ||
    record?.createdOn;

// FIX: status values on a driver-settlement record come from `status`
// (e.g. "unsettled", "settled", "paid"), not `contractStatus` / `docStatus`.
const getStatusClass = (status: any) => {
    const value = String(status || "").toLowerCase();

    if (value === "settled" || value === "paid" || value === "completed") {
        return "border-success/20 bg-success/10 text-success";
    }

    if (value === "cancelled" || value === "rejected") {
        return "border-danger/20 bg-danger/10 text-danger";
    }

    if (value === "unsettled" || value === "pending" || value === "draft") {
        return "border-warning/20 bg-warning/10 text-warning";
    }

    return "border-primary/20 bg-primary/10 text-primary";
};



/* ===================================================
   DRIVER SETTLEMENT LIST
=================================================== */

const DriverSettlementList = () => {
    const navigate = useNavigate();
    const location = useLocation();


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
   
    const dispatch = useDispatch<any>();
    const { driverSettlement, pagination, listingLoader, } = useSelector((state: any) => state.driverSettlement)
    const [activeStatus, setActiveStatus] = useState<"open" | "close">("open");



    // FIX: normalize from `status` (the real field on the record),
    // not `contractStatus` / `docStatus`, and default to "unsettled".
    const normalizeStatus = (value: any) =>
        String(value || "unsettled")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

    const getRowStatus = (row: any) => normalizeStatus(row?.status);

    // FIX: match the actual status vocabulary used by driver settlements.
    const isClosedContract = (row: any) => {
        const status = getRowStatus(row);

        return (
            status === "settled" ||
            status === "closed" ||
            status === "complete" ||
            status === "completed" ||
            status === "paid"
        );
    };

    const openCount = useMemo(
        () =>
            driverSettlement.filter(
                (item: any) => !isClosedContract(item)
            ).length,
        [driverSettlement]
    );

    const closeCount = useMemo(
        () =>
            driverSettlement.filter(
                (item: any) => isClosedContract(item)
            ).length,
        [driverSettlement]
    );

    // FIX: the table was always rendering the full unfiltered list.
    // This actually applies the open/close tab to what gets displayed.
    const filteredSettlements = useMemo(
        () =>
            driverSettlement.filter((item: any) =>
                activeStatus === "open"
                    ? !isClosedContract(item)
                    : isClosedContract(item)
            ),
        [driverSettlement, activeStatus]
    );

    useEffect(() => {
        dispatch(
            getAllDriverSettlement({
                limit: localLimit,
                offset: localOffset,

            })
        ).unwrap();

    }, [localOffset, localLimit]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLocalOffset(0);

            dispatch(
                getAllDriverSettlement({
                    offset: 0,
                    limit: localLimit,
                    search,
                })
            ).unwrap();
        }, 400);

        return () => clearTimeout(timer);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleRefresh = async () => {
        try {
            setRefreshing(true);

            await dispatch(
                getAllDriverSettlement({
                    offset: localOffset,
                    limit: localLimit,
                    search,
                })
            ).unwrap();
        } finally {
            setRefreshing(false);
        }
    };

    const openCreateSettlement = () => {
        navigate("/bookEz/transportation/driver-settlement/create", {
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
            `/bookEz/transportation/driver-settlement/edit/${settlementNumber}`,
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

            await dispatch(
                deleteDriverSettlement(confirmTooltip.settlementNumber)
            ).unwrap();

            toast.success("Driver settlement deleted successfully");

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                settlementNumber: null,
            });

            await dispatch(
                getAllDriverSettlement({
                    offset: localOffset,
                    limit: localLimit,
                    search,
                })
            ).unwrap();
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
            key: "settlementNumber",
            title: "Settlement No",
            render: (row: any) => (
                <div>
                    <div className="font-medium">
                        {getSettlementNumber(row)}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {formatDateTime(getSettlementDate(row))}
                    </div>
                </div>
            ),
        },
        {
            key: "driverName",
            title: "Driver",
            render: (row: any) => (
                <div>
                    <div>{getDriverName(row)}</div>

                    <div className="text-xs text-muted-foreground">
                        {getDriverMobile(row)}
                    </div>
                </div>
            ),
        },
        {
            key: "transportOrderNumber",
            title: "Trip / LR",
            render: (row: any) => (
                <div>
                    <div>{getTripNumber(row)}</div>

                    <div className="text-xs text-muted-foreground">
                        LR : {getLRNumber(row)}
                    </div>
                </div>
            ),
        },
        {
            key: "vehicleNo",
            title: "Vehicle",
            render: (row: any) => getVehicleNumber(row),
        },

        {
            key: "route",
            title: "Route",
            render: (row: any) => {
                const from = getRouteFrom(row);
                const to = getRouteTo(row);

                return (
                    <div>
                        <div className="font-medium">
                           {truncate(`${from} → ${to}`)} 
                        </div>
                    </div>
                );
            },
        },
        // {
        //     key: "salary",
        //     title: "Salary",
        //     type: "amount",
        //     render: (row: any) => money(row?.salary),
        // },
        // {
        //     key: "incentives",
        //     title: "Incentives",
        //     type: "amount",
        //     render: (row: any) => money(getIncentives(row)),
        // },
        // {
        //     key: "totalAdvances",
        //     title: "Advances",
        //     type: "amount",
        //     render: (row: any) =>
        //         money(getAdvances(row))
        // },
        {
            key: "netPayableToDriver",
            title: "Net Payable",
            type: "amount",
            render: (row: any) => {
                const amount = getNetPayable(row);

                return (
                    <span
                        className={`font-bold ${amount < 0 ? "text-danger" : "text-success"
                            }`}
                    >
                        {money(amount)}
                    </span>
                );
            },
        },
        // {
        //     key: "paymentMode",
        //     title: "Payment Mode",
        //     render: (row: any) => row?.paymentMode || "-",
        // },
        {
            key: "status",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-bold capitalize ${getStatusClass(
                        row?.status
                    )}`}
                >
                    {row?.status}
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

                       
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Badge
                        {...{
                            count:
                                pagination?.totalDocs ??
                                pagination?.totalRecords ??
                                driverSettlement?.length ??
                                0,
                            text: "Total Settlements:",
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
                            Close ({closeCount})
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
                    data={filteredSettlements}
                    loading={listingLoader}
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