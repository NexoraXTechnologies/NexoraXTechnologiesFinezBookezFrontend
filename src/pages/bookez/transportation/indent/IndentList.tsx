import { useMemo, useState } from "react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import SearchInput from "../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../components/buttons";
import Badge from "../../../../components/badge";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import { formatDateTime, formatDateForList } from "../../../../utils/helperFunctions";

const IndentList = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Replace with Redux selector after Indent slice integration
    const indents: any[] = [];
    const pagination: any = {};
    const listingLoader = false;
    const deleteLoader = false;

    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    // const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(20);
    const [activeStatus, setActiveStatus] = useState<"open" | "closed">("open");
    const [confirmTooltip, setConfirmTooltip] = useState<any>({ show: false, x: null, y: null, indentNumber: null });

    const pageTitle = location.state?.title || "Transport Indent";

    const normalizeStatus = (value: any) => String(value || "draft").trim().toLowerCase().replace(/[\s-]+/g, "_");

    const isClosedIndent = (row: any) => {
        const status = normalizeStatus(row?.indentStatus || row?.status);
        return ["completed", "complete", "cancelled", "closed", "close"].includes(status);
    };

    const openCount = useMemo(() => indents.filter((item: any) => !isClosedIndent(item)).length, [indents]);
    const closedCount = useMemo(() => indents.filter((item: any) => isClosedIndent(item)).length, [indents]);

    const filteredIndents = useMemo(() => {
        const searchValue = String(search || "").trim().toLowerCase();

        return indents.filter((item: any) => {
            const closed = isClosedIndent(item);

            if (activeStatus === "open" && closed) return false;
            if (activeStatus === "closed" && !closed) return false;

            if (!searchValue) return true;

            return [
                item?.indentNumber,
                item?.customer,
                item?.pickupLocation,
                item?.deliveryLocation,
                item?.vehicleType,
                item?.material,
                item?.weightUnit,
                item?.remarks,
                item?.indentStatus
            ].some(value => String(value || "").toLowerCase().includes(searchValue));
        });
    }, [indents, activeStatus, search]);

    const handleRefresh = () => {
        setRefreshing(true);

        // API CALL
        // dispatch(getAllTransportIndent({ offset: localOffset, limit: localLimit, search }))
        //     .finally(() => setRefreshing(false));

        setTimeout(() => setRefreshing(false), 300);
    };

    const openCreateIndent = () => {
        navigate("/bookEz/transportation/indent/create", {
            state: {
                title: "Create Indent",
                description: "Create a transport indent for vehicle placement and goods movement.",
                mode: "add"
            }
        });
    };

    const handleEditIndent = (record: any) => {
        if (!record?.indentNumber) {
            toast.warn("Indent number not found");
            return;
        }

        navigate(`/bookEz/transportation/indent/edit/${record.indentNumber}`, {
            state: {
                title: "Edit Indent",
                description: "Update transport indent details.",
                mode: "edit",
                indentNumber: record.indentNumber,
                indentData: record
            }
        });
    };

    const handleDeleteClick = (e: any, record: any) => {
        if (!record?.indentNumber) {
            toast.warn("Indent number not found");
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        let x = rect.left - 160;
        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({ show: true, x, y, indentNumber: record.indentNumber });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.indentNumber) {
                toast.warn("Indent number not found");
                return;
            }

            // API CALL
            // await dispatch(deleteTransportIndent(confirmTooltip.indentNumber)).unwrap();

            toast.success("Transport indent deleted successfully");

            setConfirmTooltip({ show: false, x: null, y: null, indentNumber: null });

            handleRefresh();
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete transport indent");
        }
    };

    const getStatusClass = (statusValue: any) => {
        const status = normalizeStatus(statusValue);

        if (status === "completed" || status === "complete") return "border-success/20 bg-success/10 text-success";
        if (status === "cancelled") return "border-danger/20 bg-danger/10 text-danger";
        if (status === "confirmed" || status === "open") return "border-primary/20 bg-primary/10 text-primary";
        return "border-warning/20 bg-warning/10 text-warning";
    };

    const columns = [
        {
            key: "indentNumber",
            title: "Indent No",
            render: (row: any) => <span className="font-medium text-primary">{row?.indentNumber || "-"}</span>
        },
        {
            key: "indentDate",
            title: "Indent Date",
            render: (row: any) => row?.indentDate ? formatDateForList(row.indentDate) : "-"
        },
        {
            key: "customer",
            title: "Customer",
            render: (row: any) => row?.customer || "-"
        },
        {
            key: "route",
            title: "Route",
            render: (row: any) => (
                <div className="max-w-[240px]">
                    <div className="truncate text-sm font-medium text-card-foreground" title={row?.pickupLocation || ""}>
                        {row?.pickupLocation || "-"}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>→</span>
                        <span className="truncate" title={row?.deliveryLocation || ""}>{row?.deliveryLocation || "-"}</span>
                    </div>
                </div>
            )
        },
        {
            key: "reportingDateTime",
            title: "Reporting",
            render: (row: any) => row?.reportingDateTime ? formatDateTime(row.reportingDateTime) : "-"
        },
        {
            key: "vehicle",
            title: "Vehicle Requirement",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">{row?.vehicleType || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                        {Number(row?.numberOfVehicles || 0)} {Number(row?.numberOfVehicles || 0) === 1 ? "Vehicle" : "Vehicles"}
                    </div>
                </div>
            )
        },
        {
            key: "material",
            title: "Material",
            render: (row: any) => (
                <div>
                    <div className="font-medium text-card-foreground">{row?.material || "-"}</div>

                    {(row?.approximateWeight || row?.weightUnit) && (
                        <div className="text-xs text-muted-foreground">
                            {row?.approximateWeight ?? 0} {row?.weightUnit || ""}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: "customerRate",
            title: "Customer Rate",
            render: (row: any) => {
                const amount = Number(row?.customerRate || 0);
                return amount ? `₹ ${amount.toLocaleString("en-IN")}` : "-";
            }
        },
        {
            key: "indentStatus",
            title: "Status",
            render: (row: any) => (
                <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${getStatusClass(row?.indentStatus)}`}>
                    {String(row?.indentStatus || "draft").replace(/([A-Z])/g, " $1").trim()}
                </span>
            )
        }
    ];

    return (
        <div className="flex h-full w-full flex-col border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center">
                    <button type="button" onClick={() => navigate(-1)} className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20" title="Go back">
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <h1 className="truncate text-lg font-bold text-card-foreground">{pageTitle}</h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Badge
                        {...{
                            count: pagination?.totalDocs ?? pagination?.totalRecords ?? indents?.length ?? 0,
                            text: "Total Indents:",
                            varient: "primary"
                        }}
                    />

                    <div className="flex rounded-md border border-border bg-background p-1">
                        <button type="button" onClick={() => setActiveStatus("open")} className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "open" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                            Open ({openCount})
                        </button>

                        <button type="button" onClick={() => setActiveStatus("closed")} className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "closed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                            Closed ({closedCount})
                        </button>
                    </div>

                    <DataREfreshButton {...{ callBackFn: handleRefresh, loading: refreshing }} />

                    <SearchInput {...{ search, setSearch }} />

                    <Permission module="bookez" permissionKey="Pass" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton {...{ callBackFn: openCreateIndent, text: "Create Indent" }} />
                    </Permission>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredIndents}
                    loading={listingLoader}
                    emptyMessage={activeStatus === "open" ? "No open transport indent found" : "No closed transport indent found"}
                    actions={(record: any) => (
                        <div className="flex items-center gap-2">
                            <Permission module="bookez" permissionKey="transportIndent" action="update">
                                <button type="button" onClick={() => handleEditIndent(record)} className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10" title="Edit Indent">
                                    <Edit size={16} />
                                </button>
                            </Permission>

                            <Permission module="bookez" permissionKey="transportIndent" action="delete">
                                <button type="button" disabled={deleteLoader} onClick={e => handleDeleteClick(e, record)} className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 disabled:opacity-50" title="Delete Indent">
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
                        // setLocalOffset(0);
                    }}
                    preDisabled={!pagination?.hasPrevPage}
                    nextDisabled={!pagination?.hasNextPage}
                    // setLocalOffset={setLocalOffset}
                    pagination={pagination}
                />
            )}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this transport indent?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, indentNumber: null })}
                />
            )}
        </div>
    );
};

export default IndentList;