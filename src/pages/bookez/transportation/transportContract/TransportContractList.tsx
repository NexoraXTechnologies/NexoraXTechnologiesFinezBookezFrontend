import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { formatDateForList } from "../../../../utils/helperFunctions";
import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import SearchInput from "../../../../components/searchInput";
import {
    DataCreateButton,
    DataREfreshButton,
} from "../../../../components/buttons";
import Badge from "../../../../components/badge";
import { useLocation, useNavigate } from "react-router-dom";
import {
    deleteTransportContract,
    getAllTransportContract,
    // deleteTransportContract,
} from "../../../../redux/slices/professionalSlice/transportation/transportContractSlice";
import Pagination from "../../../../components/pagination";
import { toast } from "react-toastify";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";

/* ===================================================
   TRANSPORT CONTRACT LIST
=================================================== */

const TransportContractList = () => {
    const dispatch = useDispatch<any>();
    const location = useLocation();
    const navigate = useNavigate();

    const {
        transportContract = [],
        pagination = {},
        listingLoader = false,
        deleteLoader = false,
    } = useSelector((state: any) => state.transportContract);

    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(20);
    const [activeStatus, setActiveStatus] = useState<"open" | "close">("open");

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        contractNumber: null,
    });

    const pageTitle = location.state?.title || "Transport Contract";
    const pageDescription =
        location.state?.description ||
        "Create transport contracts with customers, vendors, or fleet partners.";

    const fetchTransportContracts = ({
        offset = localOffset,
        limit = localLimit,
        searchValue = search,
    }: any = {}) => {
        dispatch(
            getAllTransportContract({
                limit,
                offset,
                search: searchValue,
            })
        );
    };

    const normalizeStatus = (value: any) =>
        String(value || "active")
            .trim()
            .toLowerCase()
            .replace(/[\s-]+/g, "_");

    const getRowStatus = (row: any) =>
        normalizeStatus(
            row?.contractStatus ||
            row?.docStatus ||
            row?.status ||
            "active"
        );

    const isClosedContract = (row: any) => {
        const status = getRowStatus(row);

        return (
            status === "close" ||
            status === "closed" ||
            status === "inactive" ||
            status === "expired" ||
            status === "complete" ||
            status === "completed"
        );
    };

    const openCount = useMemo(
        () =>
            transportContract.filter(
                (item: any) => !isClosedContract(item)
            ).length,
        [transportContract]
    );

    const closeCount = useMemo(
        () =>
            transportContract.filter(
                (item: any) => isClosedContract(item)
            ).length,
        [transportContract]
    );

    const filteredTransportContracts = useMemo(() => {
        return transportContract.filter((item: any) => {
            const closed = isClosedContract(item);

            if (activeStatus === "open" && closed) {
                return false;
            }

            if (activeStatus === "close" && !closed) {
                return false;
            }

            return true;
        });
    }, [transportContract, activeStatus]);

    useEffect(() => {
        fetchTransportContracts();
    }, [dispatch, localOffset, localLimit]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLocalOffset(0);

            dispatch(
                getAllTransportContract({
                    limit: localLimit,
                    offset: 0,
                    search,
                })
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [search, dispatch, localLimit]);

    const handleRefresh = () => {
        setRefreshing(true);

        dispatch(
            getAllTransportContract({
                limit: localLimit,
                offset: localOffset,
                search,
            })
        ).finally(() => {
            setRefreshing(false);
        });
    };

    const openCreateContract = () => {
        navigate("/bookEz/transportation/transport-contract/create", {
            state: {
                title: "Create Contract",
                description:
                    "Create transport contracts with customers, vendors, or fleet partners.",
                mode: "add",
            },
        });
    };

    const handleEditContract = (record: any) => {
        if (!record?.contractNumber) {
            toast.warn("Contract number not found");
            return;
        }

        navigate(
            `/bookEz/transportation/transport-contract/edit/${record.contractNumber}`,
            {
                state: {
                    title: "Edit Contract",
                    description: "Update transport contract details.",
                    mode: "edit",
                    contractNumber: record.contractNumber,
                    contractData: record,
                },
            }
        );
    };

    const handleDeleteClick = (e: any, record: any) => {
        if (!record?.contractNumber) {
            toast.warn("Contract number not found");
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
            contractNumber: record.contractNumber,
        });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.contractNumber) {
                toast.warn("Contract number not found");
                return;
            }


            await dispatch(
                deleteTransportContract(confirmTooltip.contractNumber)
            ).unwrap();
            toast.success("Transport contract deleted successfully");


            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                contractNumber: null,
            });

            fetchTransportContracts();
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete contract");
        }
    };

    const columns = [
        {
            key: "contractNumber",
            title: "Contract No",
            render: (row: any) => row?.contractNumber || "-",
        },
        {
            key: "contractDate",
            title: "Date",
            render: (row: any) =>
                row?.contractDate ? formatDateForList(row.contractDate) : "-",
        },
        {
            key: "customer",
            title: "Customer",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">
                        {row?.customer?.customerName || row?.customerName || "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.customer?.customerCode || row?.customerCode || "-"}
                    </div>
                </div>
            ),
        },
        {
            key: "contractPeriod",
            title: "Period",
            render: (row: any) => (
                <span>
                    {row?.contractPeriod?.startDate && row?.contractPeriod?.endDate
                        ? `${formatDateForList(
                            row.contractPeriod.startDate
                        )} - ${formatDateForList(row.contractPeriod.endDate)}`
                        : "-"}
                </span>
            ),
        },
        {
            key: "contractType",
            title: "Type",
            render: (row: any) => row?.contractType || "-",
        },
        {
            key: "serviceType",
            title: "Service",
            render: (row: any) => row?.serviceType || "-",
        },
        {
            key: "routes",
            title: "Routes",
            render: (row: any) => row?.routes?.length || 0,
        },
        {
            key: "status",
            title: "Status",
            render: (row: any) => (
                <span
                    className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${row?.status === "active"
                        ? "border-success/20 bg-success/10 text-success"
                        : "border-warning/20 bg-warning/10 text-warning"
                        }`}
                >
                    {row?.status || "-"}
                </span>
            ),
        },
    ];

    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="transport-contract-header" className="mb-3 flex items-center">
                <div id="transport-contract-summary" className="flex items-center">
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
                                transportContract?.length ??
                                0,
                            text: "Total Contracts:",
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

                    <Permission
                        module="bookez"
                        permissionKey="allRegisters"
                        action="create"
                    >
                        {/* @ts-ignore */}
                        <DataCreateButton
                            {...{
                                callBackFn: openCreateContract,
                                text: "Create Contract",
                            }}
                        />
                    </Permission>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredTransportContracts}
                    loading={listingLoader}
                    emptyMessage={
                        activeStatus === "open"
                            ? "No open transport contract found"
                            : "No closed transport contract found"
                    }
                    actions={(record: any) => (
                        <div className="flex items-center gap-2">
                            <Permission
                                module="bookez"
                                permissionKey="allRegisters"
                                action="update"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleEditContract(record)}
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
                    message="Are you sure you want to delete this transport contract?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            contractNumber: null,
                        })
                    }
                />
            )}
        </div>
    );
};

export default TransportContractList;