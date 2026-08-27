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

const TouchUPList = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Replace with Redux selector when Touch Up slice is connected
    const touchUps: any[] = [];
    const pagination: any = {};
    const listingLoader = false;
    const deleteLoader = false;

    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(20);
    const [activeStatus, setActiveStatus] = useState<"pending" | "completed">("pending");
    const [confirmTooltip, setConfirmTooltip] = useState<any>({ show: false, x: null, y: null, touchUpNumber: null });

    const pageTitle = location.state?.title || "Touch Up";

    const normalizeStatus = (value: any) => String(value || "pending").trim().toLowerCase().replace(/[\s-]+/g, "_");

    const isCompleted = (row: any) => {
        const status = normalizeStatus(row?.touchUpStatus || row?.status);
        return status === "completed" || status === "complete" || status === "closed" || status === "close";
    };

    const pendingCount = useMemo(() => touchUps.filter((item: any) => !isCompleted(item)).length, [touchUps]);

    const completedCount = useMemo(() => touchUps.filter((item: any) => isCompleted(item)).length, [touchUps]);

    const filteredTouchUps = useMemo(() => {
        const searchValue = String(search || "").trim().toLowerCase();

        return touchUps.filter((item: any) => {
            const completed = isCompleted(item);

            if (activeStatus === "pending" && completed) return false;
            if (activeStatus === "completed" && !completed) return false;

            if (!searchValue) return true;

            const pickup = item?.pickupLocation || {};
            const delivery = item?.deliveryLocation || {};

            return [
                item?.touchUpNumber,
                item?.voucherNumber,
                item?.tripOrder,
                pickup?.location,
                pickup?.cityName,
                pickup?.address,
                delivery?.location,
                delivery?.cityName,
                delivery?.address,
                item?.material,
                item?.invoiceNumber,
                item?.consignor,
                item?.consignee,
                item?.touchUpStatus
            ].some(value => String(value || "").toLowerCase().includes(searchValue));
        });
    }, [touchUps, activeStatus, search]);

    const getLocationText = (locationData: any) => {
        if (!locationData) return "-";
        if (typeof locationData === "string") return locationData;

        return locationData?.location || locationData?.cityName || locationData?.address || "-";
    };

    const handleRefresh = () => {
        setRefreshing(true);

        // API CALL
        // dispatch(getAllTransportTouchUp({ offset: localOffset, limit: localLimit, search }))
        //     .finally(() => setRefreshing(false));

        setTimeout(() => setRefreshing(false), 300);
    };

    const openCreateTouchUp = () => {
        navigate("/bookEz/transportation/touch-up/create", {
            state: {
                title: "Create Touch Up",
                description: "Create pickup or delivery touch up against a transport trip order.",
                mode: "add"
            }
        });
    };

    const handleEditTouchUp = (record: any) => {
        const touchUpNumber = record?.touchUpNumber || record?.voucherNumber;

        if (!touchUpNumber) {
            toast.warn("Touch Up number not found");
            return;
        }

        navigate(`/bookEz/transportation/touch-up/edit/${touchUpNumber}`, {
            state: {
                title: "Edit Touch Up",
                description: "Update transport touch up details.",
                mode: "edit",
                touchUpNumber,
                touchUpData: record
            }
        });
    };

    const handleDeleteClick = (e: any, record: any) => {
        const touchUpNumber = record?.touchUpNumber || record?.voucherNumber;

        if (!touchUpNumber) {
            toast.warn("Touch Up number not found");
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();

        let x = rect.left - 160;
        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({ show: true, x, y, touchUpNumber });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.touchUpNumber) {
                toast.warn("Touch Up number not found");
                return;
            }

            // API CALL
            // await dispatch(deleteTransportTouchUp(confirmTooltip.touchUpNumber)).unwrap();

            toast.success("Touch Up deleted successfully");

            setConfirmTooltip({ show: false, x: null, y: null, touchUpNumber: null });

            handleRefresh();
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete Touch Up");
        }
    };

    const columns = [
        {
            key: "touchUpNumber",
            title: "Touch Up No",
            render: (row: any) => row?.touchUpNumber || row?.voucherNumber || "-"
        },
        {
            key: "tripOrder",
            title: "Trip Order",
            render: (row: any) => (
                <span className="font-medium text-primary">
                    {row?.tripOrder || "-"}
                </span>
            )
        },
        {
            key: "pickupLocation",
            title: "Pickup",
            render: (row: any) => (
                <div className="max-w-[180px]">
                    <div className="truncate font-medium text-card-foreground" title={getLocationText(row?.pickupLocation)}>
                        {getLocationText(row?.pickupLocation)}
                    </div>

                    {row?.pickupLocation?.stateName && (
                        <div className="truncate text-xs text-muted-foreground">
                            {[row?.pickupLocation?.cityName, row?.pickupLocation?.stateName].filter(Boolean).join(", ")}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: "deliveryLocation",
            title: "Delivery",
            render: (row: any) => (
                <div className="max-w-[180px]">
                    <div className="truncate font-medium text-card-foreground" title={getLocationText(row?.deliveryLocation)}>
                        {getLocationText(row?.deliveryLocation)}
                    </div>

                    {row?.deliveryLocation?.stateName && (
                        <div className="truncate text-xs text-muted-foreground">
                            {[row?.deliveryLocation?.cityName, row?.deliveryLocation?.stateName].filter(Boolean).join(", ")}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: "material",
            title: "Material",
            render: (row: any) => row?.material || "-"
        },
        {
            key: "quantity",
            title: "Quantity",
            render: (row: any) => (
                <span>
                    {row?.quantity ?? "-"} {row?.unit || ""}
                </span>
            )
        },
        {
            key: "invoiceNumber",
            title: "Invoice No",
            render: (row: any) => row?.invoiceNumber || "-"
        },
        {
            key: "consignor",
            title: "Consignor",
            render: (row: any) => row?.consignor || "-"
        },
        {
            key: "consignee",
            title: "Consignee",
            render: (row: any) => row?.consignee || "-"
        },
        {
            key: "touchUpStatus",
            title: "Status",
            render: (row: any) => {
                const status = normalizeStatus(row?.touchUpStatus || row?.status);

                const statusClass =
                    status === "completed" || status === "complete"
                        ? "border-success/20 bg-success/10 text-success"
                        : status === "in_progress" || status === "inprogress"
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : status === "cancelled"
                                ? "border-danger/20 bg-danger/10 text-danger"
                                : "border-warning/20 bg-warning/10 text-warning";

                return (
                    <span className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${statusClass}`}>
                        {String(row?.touchUpStatus || row?.status || "pending").replace(/([A-Z])/g, " $1").trim()}
                    </span>
                );
            }
        }
    ];

    return (
        <div className="flex h-full w-full flex-col border border-border bg-card p-4 text-card-foreground shadow-sm">
            <div id="touch-up-header" className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div id="touch-up-summary" className="flex items-center">
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
                            count: pagination?.totalDocs ?? pagination?.totalRecords ?? touchUps?.length ?? 0,
                            text: "Total Touch Ups:",
                            varient: "primary"
                        }}
                    />

                    <div className="flex rounded-md border border-border bg-background p-1">
                        <button type="button" onClick={() => setActiveStatus("pending")} className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "pending" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                            Pending ({pendingCount})
                        </button>

                        <button type="button" onClick={() => setActiveStatus("completed")} className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "completed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                            Completed ({completedCount})
                        </button>
                    </div>

                    <DataREfreshButton {...{ callBackFn: handleRefresh, loading: refreshing }} />

                    <SearchInput {...{ search, setSearch }} />

                    <Permission module="bookez" permissionKey="Pass" action="create">
                        {/* @ts-ignore */}
                        <DataCreateButton {...{ callBackFn: openCreateTouchUp, text: "Create Touch Up" }} />
                    </Permission>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredTouchUps}
                    loading={listingLoader}
                    emptyMessage={activeStatus === "pending" ? "No pending Touch Up found" : "No completed Touch Up found"}
                    actions={(record: any) => (
                        <div className="flex items-center gap-2">
                            <Permission module="bookez" permissionKey="touchUP" action="update">
                                <button type="button" onClick={() => handleEditTouchUp(record)} className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary" title="Edit Touch Up">
                                    <Edit size={16} />
                                </button>
                            </Permission>

                            <Permission module="bookez" permissionKey="touchUP" action="delete">
                                <button type="button" disabled={deleteLoader} onClick={e => handleDeleteClick(e, record)} className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-50" title="Delete Touch Up">
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
                    message="Are you sure you want to delete this Touch Up?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, touchUpNumber: null })}
                />
            )}
        </div>
    );
};

export default TouchUPList;