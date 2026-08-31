import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import DataTable from "../../../../components/DataTable";
import SearchInput from "../../../../components/searchInput";
import { DataCreateButton, DataREfreshButton } from "../../../../components/buttons";
import Badge from "../../../../components/badge";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import { deleteTransportTouchup, getAllTransportTouchup } from "../../../../redux/slices/professionalSlice/transportation/touchUpSlice";
import Permission from "../../../../components/PermissionGuard";

const TouchUPList = () => {
    const dispatch = useDispatch<any>();
    const location = useLocation();
    const navigate = useNavigate();

    const { transportTouchups = [], pagination = null, listingLoader = false, deleteLoader = false } = useSelector((state: any) => state.transportTouchup || {});

    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(20);
    const [activeStatus, setActiveStatus] = useState<"pending" | "completed">("pending");
    const [confirmTooltip, setConfirmTooltip] = useState<any>({ show: false, x: null, y: null, transportTouchupNumber: null });

    const pageTitle = location.state?.title || "Touch Up";

    const normalizeStatus = (value: any) => String(value || "pending").trim().toLowerCase().replace(/[\s-]+/g, "_");

    const isCompleted = (row: any) => {
        const touchUps = Array.isArray(row?.touchUp) ? row.touchUp : [];
        if (!touchUps.length) return false;
        return touchUps.every((item: any) => ["completed", "complete", "closed", "close"].includes(normalizeStatus(item?.touchUpStatus)));
    };

    const loadTouchUps = async () => {
        try {
            await dispatch(getAllTransportTouchup({ offset: localOffset, limit: localLimit, search })).unwrap();
        } catch (error: any) {
            toast.error(error?.message || "Failed to load Touch Ups");
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            loadTouchUps();
        }, search ? 300 : 0);

        return () => clearTimeout(timer);
    }, [dispatch, localOffset, localLimit, search]);

    const pendingCount = useMemo(() => transportTouchups.filter((item: any) => !isCompleted(item)).length, [transportTouchups]);
    const completedCount = useMemo(() => transportTouchups.filter((item: any) => isCompleted(item)).length, [transportTouchups]);

    const filteredTouchUps = useMemo(() => {
        const searchValue = String(search || "").trim().toLowerCase();

        return transportTouchups.filter((record: any) => {
            const completed = isCompleted(record);

            if (activeStatus === "pending" && completed) return false;
            if (activeStatus === "completed" && !completed) return false;
            if (!searchValue) return true;

            const touchUpSearchValues = (record?.touchUp || []).flatMap((item: any) => [
                item?.touchUpId,
                item?.pickupLocation?.name,
                item?.pickupLocation?.address,
                item?.pickupLocation?.city,
                item?.pickupLocation?.state,
                item?.deliveryLocation?.name,
                item?.deliveryLocation?.address,
                item?.deliveryLocation?.city,
                item?.deliveryLocation?.state,
                item?.material,
                item?.unit,
                item?.quantity,
                item?.invoiceNumber,
                item?.consignor,
                item?.consignee,
                item?.touchUpStatus
            ]);

            return [
                record?.transportTouchupNumber,
                record?.tripOrder,
                ...touchUpSearchValues
            ].some(value => String(value || "").toLowerCase().includes(searchValue));
        });
    }, [transportTouchups, activeStatus, search]);

    const handleSearchChange = (value: any) => {
        setSearch(value);
        setLocalOffset(0);
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await dispatch(getAllTransportTouchup({ offset: localOffset, limit: localLimit, search })).unwrap();
        } catch (error: any) {
            toast.error(error?.message || "Failed to refresh Touch Ups");
        } finally {
            setRefreshing(false);
        }
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
        const transportTouchupNumber = record?.transportTouchupNumber;

        if (!transportTouchupNumber) {
            toast.warn("Transport Touch Up number not found");
            return;
        }

        navigate(`/bookEz/transportation/touch-up/edit/${transportTouchupNumber}`, {
            state: {
                title: "Edit Touch Up",
                description: "Update transport touch up details.",
                mode: "edit",
                transportTouchupNumber,
                touchUpData: record
            }
        });
    };

    const handleDeleteClick = (e: any, record: any) => {
        const transportTouchupNumber = record?.transportTouchupNumber;

        if (!transportTouchupNumber) {
            toast.warn("Transport Touch Up number not found");
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        let x = rect.left - 160;
        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({ show: true, x, y, transportTouchupNumber });
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.transportTouchupNumber) {
                toast.warn("Transport Touch Up number not found");
                return;
            }

            await dispatch(deleteTransportTouchup(confirmTooltip.transportTouchupNumber)).unwrap();

            toast.success("Transport Touch Up deleted successfully");
            setConfirmTooltip({ show: false, x: null, y: null, transportTouchupNumber: null });

            await handleRefresh();
        } catch (error: any) {
            toast.error(error?.message || "Failed to delete Transport Touch Up");
        }
    };

    const getStatusClass = (record: any) => {
        if (isCompleted(record)) return "border-success/20 bg-success/10 text-success";
        const hasInProgress = (record?.touchUp || []).some((item: any) => ["in_progress", "inprogress"].includes(normalizeStatus(item?.touchUpStatus)));
        if (hasInProgress) return "border-primary/20 bg-primary/10 text-primary";
        return "border-warning/20 bg-warning/10 text-warning";
    };

    const getRecordStatus = (record: any) => {
        if (isCompleted(record)) return "Completed";
        const hasInProgress = (record?.touchUp || []).some((item: any) => ["in_progress", "inprogress"].includes(normalizeStatus(item?.touchUpStatus)));
        return hasInProgress ? "In Progress" : "Pending";
    };

    const columns = [
        {
            key: "transportTouchupNumber",
            title: "Touch Up No",
            render: (row: any) => <span >{row?.transportTouchupNumber || "-"}</span>
        },
        {
            key: "tripOrder",
            title: "Transport Order",
            render: (row: any) => <span >{row?.tripOrder || "-"}</span>
        },
        {
            key: "touchUpCount",
            title: "Touch Up Points",
            render: (row: any) => {
                const touchUps = Array.isArray(row?.touchUp) ? row.touchUp : [];
                return (
                    <div>
                        <div className="font-medium text-card-foreground">{touchUps.length} {touchUps.length === 1 ? "Point" : "Points"}</div>
                        <div className="text-xs text-muted-foreground">{touchUps.map((item: any) => item?.touchUpId).filter(Boolean).join(", ") || "-"}</div>
                    </div>
                );
            }
        },
        // {
        //     key: "route",
        //     title: "Route",
        //     render: (row: any) => {
        //         const touchUps = Array.isArray(row?.touchUp) ? row.touchUp : [];
        //         const firstTouchUp = touchUps[0];
        //         const lastTouchUp = touchUps[touchUps.length - 1];
        //         const pickup = firstTouchUp?.pickupLocation?.name || firstTouchUp?.pickupLocation?.city || "-";
        //         const delivery = lastTouchUp?.deliveryLocation?.name || lastTouchUp?.deliveryLocation?.city || "-";

        //         return (
        //             <div className="max-w-[220px]">
        //                 <div className="truncate font-medium text-card-foreground" title={pickup}>{pickup}</div>
        //                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
        //                     <span>→</span>
        //                     <span className="truncate" title={delivery}>{delivery}</span>
        //                 </div>
        //             </div>
        //         );
        //     }
        // },
        {
            key: "material",
            title: "Material",
            render: (row: any) => {
                const materials = (row?.touchUp || []).map((item: any) => item?.material).filter(Boolean);
                return materials.length ? materials.join(", ") : "-";
            }
        },
        // {
        //     key: "quantity",
        //     title: "Quantity",
        //     render: (row: any) => {
        //         const touchUps = Array.isArray(row?.touchUp) ? row.touchUp : [];

        //         return (
        //             <div>
        //                 {touchUps.map((item: any, index: number) => (
        //                     <div key={item?.touchUpId || index} className="text-sm">
        //                         {item?.quantity ?? "-"} {item?.unit || ""}
        //                     </div>
        //                 ))}
        //             </div>
        //         );
        //     }
        // },
        {
            key: "status",
            title: "Status",
            render: (row: any) => (
                <span className={`rounded-md border px-2 py-1 text-xs font-medium ${getStatusClass(row)}`}>
                    {getRecordStatus(row)}
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

                    <h1 className="truncate text-lg font-bold text-card-foreground">{pageTitle}</h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">
                    <Badge {...{ count: pagination?.totalDocs ?? transportTouchups.length, text: "Total Touch Ups:", varient: "primary" }} />

                    {/* <div className="flex rounded-md border border-border bg-background p-1">
                        <button type="button" onClick={() => setActiveStatus("pending")} className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "pending" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                            Pending ({pendingCount})
                        </button>

                        <button type="button" onClick={() => setActiveStatus("completed")} className={`rounded px-3 py-1.5 text-xs transition ${activeStatus === "completed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                            Completed ({completedCount})
                        </button>
                    </div> */}

                    <DataREfreshButton {...{ callBackFn: handleRefresh, loading: refreshing }} />

                    <SearchInput search={search} setSearch={handleSearchChange} />
                    <Permission module="bookez" permissionKey="touchUp" action="create">

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
                            <Permission module="bookez" permissionKey="touchUp" action="update">


                                <button type="button" onClick={() => handleEditTouchUp(record)} className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10" title="Edit Touch Up">
                                    <Edit size={16} />
                                </button>
                            </Permission>
                            <Permission module="bookez" permissionKey="touchUp" action="delete">

                                <button type="button" disabled={deleteLoader} onClick={e => handleDeleteClick(e, record)} className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 disabled:opacity-50" title="Delete Touch Up">
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
                    message={`Are you sure you want to delete ${confirmTooltip.transportTouchupNumber}?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmTooltip({ show: false, x: null, y: null, transportTouchupNumber: null })}
                />
            )}
        </div>
    );
};

export default TouchUPList;