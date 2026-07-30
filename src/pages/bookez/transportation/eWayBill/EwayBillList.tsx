import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Eye,  } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";


import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import SearchInput from "../../../../components/searchInput";
import {
    DataREfreshButton,
} from "../../../../components/buttons";
import Badge from "../../../../components/badge";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";

import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
    getAllEWayBill,

} from "../../../../redux/slices/professionalSlice/transportation/eWayBillSlice";

/* ===================================================
   E-WAY BILL LIST
=================================================== */

const EWayBillList = () => {
    const dispatch = useDispatch<any>();
    const location = useLocation();
    const navigate = useNavigate();

    const {
        eWayBill = [],
        pagination = {},
        listingLoader = false,
        
    } = useSelector((state: any) => state.eWayBill);

    const [search, setSearch] = useState("");

    const [refreshing, setRefreshing] = useState(false);

    const [localOffset, setLocalOffset] = useState(0);

    const [localLimit, setLocalLimit] = useState(20);

    const [activeStatus, setActiveStatus] = useState<
        "open" | "close"
    >("open");

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        ewayBillNumber: null,
    });

    const pageTitle =
        location.state?.title || "E-Way Bill";

    const fetchEWayBills = ({
        offset = localOffset,
        limit = localLimit,
        searchValue = search,
    }: any = {}) => {
        dispatch(
            getAllEWayBill({
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
            row?.ewayBillStatus ||
            row?.docStatus ||
            row?.status ||
            "active"
        );

    const isClosedEWayBill = (row: any) => {
        const status = getRowStatus(row);

        return (
            status === "close" ||
            status === "closed" ||
            status === "cancelled" ||
            status === "inactive"
        );
    };

    const openCount = useMemo(
        () =>
            eWayBill.filter(
                (item: any) =>
                    !isClosedEWayBill(item)
            ).length,
        [eWayBill]
    );

    const closeCount = useMemo(
        () =>
            eWayBill.filter((item: any) =>
                isClosedEWayBill(item)
            ).length,
        [eWayBill]
    );

    const filteredEWayBills = useMemo(() => {
        return eWayBill.filter((item: any) => {
            const closed =
                isClosedEWayBill(item);

            if (
                activeStatus === "open" &&
                closed
            )
                return false;

            if (
                activeStatus === "close" &&
                !closed
            )
                return false;

            return true;
        });
    }, [eWayBill, activeStatus]);

    /* ===================================================
   FETCH DATA
=================================================== */

    useEffect(() => {
        fetchEWayBills();
    }, [dispatch, localOffset, localLimit]);

    /* ===================================================
       SEARCH
    =================================================== */

    useEffect(() => {
        const timer = setTimeout(() => {
            setLocalOffset(0);

            dispatch(
                getAllEWayBill({
                    limit: localLimit,
                    offset: 0,
                    search,
                })
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [search, dispatch, localLimit]);

    /* ===================================================
       REFRESH
    =================================================== */

    const handleRefresh = () => {
        setRefreshing(true);

        dispatch(
            getAllEWayBill({
                limit: localLimit,
                offset: localOffset,
                search,
            })
        ).finally(() => {
            setRefreshing(false);
        });
    };

    /* ===================================================
       CREATE
    =================================================== */

    // const openCreateEWayBill = () => {
    //     navigate("/bookEz/transportation/e-way-bill/create", {
    //         state: {
    //             title: "Create E-Way Bill",
    //             description: "Create a new E-Way Bill.",
    //             mode: "add",
    //         },
    //     });
    // };

    /* ===================================================
       EDIT
    =================================================== */

    // const handleEditEWayBill = (record: any) => {
    //     if (!record?.ewayBillNumber) {
    //         toast.warn("E-Way Bill Number not found");
    //         return;
    //     }

    //     navigate(
    //         `/bookEz/transportation/e-way-bill/edit/${record.ewayBillNumber}`,
    //         {
    //             state: {
    //                 title: "Edit E-Way Bill",
    //                 description: "Update E-Way Bill details.",
    //                 mode: "edit",
    //                 ewayBillNumber: record.ewayBillNumber,
    //                 ewayBillData: record,
    //             },
    //         }
    //     );
    // };

    const handleDownload = (record: any) => {
    if (!record?.ewayBillNo) {
        toast.warn("E-Way Bill not found");
        return;
    }

    window.open(
        `/eTaxSolnMongoApiBackend/users/eWayBill/download/${record.ewayBillNo}`,
        "_blank"
    );
};

    /* ===================================================
       DELETE POPUP
    =================================================== */

    // const handleDeleteClick = (e: any, record: any) => {
    //     if (!record?.ewayBillNumber) {
    //         toast.warn("E-Way Bill Number not found");
    //         return;
    //     }

    //     const rect = e.currentTarget.getBoundingClientRect();

    //     let x = rect.left - 160;

    //     if (x < 10) x = 10;

    //     const y = rect.top + window.scrollY - 5;

    //     setConfirmTooltip({
    //         show: true,
    //         x,
    //         y,
    //         ewayBillNumber: record.ewayBillNumber,
    //     });
    // };

    /* ===================================================
       DELETE
    =================================================== */

    const handleDeleteConfirm = async () => {
        try {
            if (!confirmTooltip?.ewayBillNumber) {
                toast.warn("E-Way Bill Number not found");
                return;
            }

            // await dispatch(
            //     deleteEWayBill(confirmTooltip.ewayBillNumber)
            // ).unwrap();

            toast.success("E-Way Bill deleted successfully.");

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                ewayBillNumber: null,
            });

            fetchEWayBills();
        } catch (error: any) {
            toast.error(
                error?.message ||
                "Failed to delete E-Way Bill."
            );
        }
    };

    /* ===================================================
       TABLE COLUMNS
    =================================================== */


    const columns = [
        {
            key: "ewayBillNo",
            title: "E-Way Bill No",
            render: (row: any) => row?.ewayBillNo || "-",
        },

        {
            key: "docNo",
            title: "Invoice No",
            render: (row: any) =>
                row?.ewayPayload?.docNo || "-",
        },

        // {
        //     key: "docDate",
        //     title: "Invoice Date",
        //     render: (row: any) =>
        //         row?.ewayPayload?.docDate || "-",
        // },

        {
            key: "ewayBillDate",
            title: "E-Way Bill Date",
            render: (row: any) =>
                row?.rawResponse?.ewayBillDate || "-",
        },

        {
            key: "from",
            title: "From Party",
            render: (row: any) => (
                <div>
                    <div className="font-medium">
                        {row?.ewayPayload?.fromTrdName || "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.ewayPayload?.fromGstin || "-"}
                    </div>
                </div>
            ),
        },

        {
            key: "to",
            title: "To Party",
            render: (row: any) => (
                <div>
                    <div className="font-medium">
                        {row?.ewayPayload?.toTrdName || "-"}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {row?.ewayPayload?.toGstin || "-"}
                    </div>
                </div>
            ),
        },

        {
            key: "vehicle",
            title: "Vehicle No",
            render: (row: any) =>
                row?.ewayPayload?.vehicleNo || "-",
        },

        {
            key: "distance",
            title: "Distance",
            render: (row: any) =>
                row?.ewayPayload?.transDistance
                    ? `${row.ewayPayload.transDistance} KM`
                    : "-",
        },

        // {
        //     key: "transportMode",
        //     title: "Mode",
        //     render: (row: any) => {
        //         const mode = row?.ewayPayload?.transMode;

        //         switch (mode) {
        //             case "1":
        //                 return "Road";
        //             case "2":
        //                 return "Rail";
        //             case "3":
        //                 return "Air";
        //             case "4":
        //                 return "Ship";
        //             default:
        //                 return "-";
        //         }
        //     },
        // },

        // {
        //     key: "invoiceValue",
        //     title: "Invoice Value",
        //     render: (row: any) =>
        //         row?.ewayPayload?.totInvValue ?? "-",
        // },

        {
            key: "validUpto",
            title: "Valid Upto",
            render: (row: any) =>
                row?.rawResponse?.validUpto || "-",
        },
    ];
    return (
        <div className="flex h-full w-full flex-col rounded-md border border-border bg-card p-4 text-card-foreground shadow-sm">

            {/* ========================= Header ========================= */}

            <div
                id="eway-bill-header"
                className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
                <div
                    id="eway-bill-summary"
                    className="flex items-center"
                >
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        title="Go Back"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <h1 className="truncate text-lg font-bold text-card-foreground">
                            {pageTitle}
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:flex-nowrap">

                    <Badge
                        {...{
                            count:
                                pagination?.totalDocs ??
                                pagination?.totalRecords ??
                                eWayBill.length ??
                                0,
                            text: "Total E-Way Bills:",
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

                    <DataREfreshButton
                        {...{
                            callBackFn: handleRefresh,
                            loading: refreshing,
                        }}
                    />

                    <SearchInput
                        {...{
                            search,
                            setSearch,
                        }}
                    />

                    {/* <Permission
                        module="bookez"
                        permissionKey="Pass"
                        action="create"
                    >
                       
                        <DataCreateButton
                            {...{
                                callBackFn: openCreateEWayBill,
                                text: "Create E-Way Bill",
                            }}
                        />
                    </Permission> */}

                </div>
            </div>

            {/* ========================= Table ========================= */}

            <div className="min-h-0 flex-1 overflow-hidden">

                <DataTable
                    columns={columns}
                    data={filteredEWayBills}
                    loading={listingLoader}
                    emptyMessage={
                        activeStatus === "open"
                            ? "No open E-Way Bill found"
                            : "No closed E-Way Bill found"
                    }
                    actions={(record: any) => (
                        <div className="flex items-center gap-2">

                            <Permission
                                module="bookez"
                                permissionKey="Pass"
                                action="view"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/bookEz/transportation/e-way-bill/view/${record.ewayBillNo}`,
                                            {
                                                state: {
                                                    mode: "view",
                                                    ewayBillData: record,
                                                },
                                            }
                                        )
                                    }
                                    className="rounded-md p-2 text-primary hover:bg-primary/10"
                                    title="View"
                                >
                                    <Eye size={16} />
                                </button>
                            </Permission>

                            <button
                                type="button"
                                onClick={() => handleDownload(record)}
                                className="rounded-md p-2 text-success hover:bg-success/10"
                                title="Download"
                            >
                                <Download size={16} />
                            </button>

                           

                        </div>
                    )}
                />

            </div>


            {/* ========================= Pagination ========================= */}

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

            {/* ========================= Delete Confirmation ========================= */}

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this E-Way Bill?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            ewayBillNumber: null,
                        })
                    }
                />
            )}
        </div>
    );
}

export default EWayBillList;