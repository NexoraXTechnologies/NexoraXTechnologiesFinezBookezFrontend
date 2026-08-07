import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Ban, CalendarClock, Download, Edit, Loader2, MoreVertical, XCircle, } from "lucide-react";
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
    cancelEWayBill,
    extendEWayBillValidity,
    getAllEWayBill,
    getEWayBillAccessToken,
    getEWayBillFromGst,
    getEWayBillPdfByNumber,
    multiVehicleUpdate,
    printDetailEWayBill,
    rejectEWayBill,
    saveEWayBillPdf,
    updateEWayBill,

} from "../../../../redux/slices/professionalSlice/transportation/eWayBillSlice";

/* ===================================================
   E-WAY BILL LIST
=================================================== */
const unwrapThunk = async (
    dispatch: any,
    action: any
) => {
    const result = await dispatch(action);

    if (result?.meta?.requestStatus === "rejected") {
        throw (
            result?.payload ||
            result?.error || {
                message: "Request failed",
            }
        );
    }

    return result?.payload ?? result;
};

// ⭐ YELLOW STAR: ADDED — CONVERT GENERATED PDF BLOB TO BASE64
const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            const result = String(
                reader.result || ""
            );

            if (!result) {
                reject(
                    new Error(
                        "Unable to convert E-Way Bill PDF to Base64"
                    )
                );

                return;
            }

            resolve(result);
        };

        reader.onerror = () => {
            reject(
                new Error(
                    "Unable to read generated E-Way Bill PDF"
                )
            );
        };

        reader.readAsDataURL(blob);
    });

// ⭐ YELLOW STAR: ADDED — CONVERT SAVED BASE64 PDF TO BLOB
const base64ToPdfBlob = (value: any) => {
    const rawValue = String(
        value || ""
    ).trim();

    if (!rawValue) {
        return null;
    }

    const cleanedBase64 = rawValue
        .replace(
            /^data:application\/pdf;base64,/i,
            ""
        )
        .replace(/\s/g, "");

    try {
        const binary = window.atob(
            cleanedBase64
        );

        const bytes = new Uint8Array(
            binary.length
        );

        for (
            let index = 0;
            index < binary.length;
            index += 1
        ) {
            bytes[index] =
                binary.charCodeAt(index);
        }

        return new Blob(
            [bytes],
            {
                type: "application/pdf",
            }
        );
    } catch {
        return null;
    }
};

// ⭐ YELLOW STAR: ADDED — DOWNLOAD PDF BLOB IN BROWSER
const downloadPdfBlob = (
    pdfBlob: Blob,
    ewayBillNo: string
) => {
    const objectUrl =
        URL.createObjectURL(pdfBlob);

    const link =
        document.createElement("a");

    link.href = objectUrl;

    link.download =
        `EWayBill_${ewayBillNo.replace(
            /[^a-zA-Z0-9_-]/g,
            ""
        )}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 1000);
};


// ⭐ YELLOW STAR: UPDATED — SAME EXTEND VALIDITY CONFIG AS REACT NATIVE
const GOODS_STATUS_MAP: Record<string, any> = {
    moving: {
        label: "Goods are moving",
        transMode: "1",
        consignmentStatus: "M",
        transitType: "",
        transitAddressRequired: false,
    },
    stoppedAtTransitPoint: {
        label: "Stopped at transit point",
        transMode: "5",
        consignmentStatus: "T",
        transitType: "R",
        transitAddressRequired: true,
    },
    storedInWarehouse: {
        label: "Stored in warehouse",
        transMode: "5",
        consignmentStatus: "T",
        transitType: "W",
        transitAddressRequired: true,
    },
    stoppedAtOtherLocation: {
        label: "Stopped at other location",
        transMode: "5",
        consignmentStatus: "T",
        transitType: "O",
        transitAddressRequired: true,
    },
};

const REASON_CODE_MAP: Record<string, any> = {
    floodCycloneLandslide: {
        label: "Flood / Cyclone / Landslide",
        code: "1",
        remark:
            "Vehicle movement delayed due to flooding and road closure",
    },
    curfewStrikeBlockade: {
        label: "Curfew / Strike / Blockade",
        code: "2",
        remark:
            "Vehicle movement stopped due to local law and order restrictions",
    },
    goodsMovedToAnotherVehicle: {
        label: "Goods moved to another vehicle",
        code: "4",
        remark:
            "Goods transferred to a replacement vehicle due to breakdown",
    },
    vehicleAccident: {
        label: "Vehicle accident",
        code: "5",
        remark:
            "Vehicle met with an accident and movement was delayed",
    },
    mechanicalBreakdown: {
        label: "Mechanical breakdown",
        code: "99",
        remark:
            "Vehicle delayed due to mechanical breakdown and repair",
    },
    trafficOrRouteDiversion: {
        label: "Traffic / Route diversion",
        code: "99",
        remark:
            "Delivery delayed due to traffic diversion and congestion",
    },
};

// ⭐ YELLOW STAR: ADDED — CANCEL E-WAY BILL REASONS
const CANCEL_EWAY_BILL_REASON_OPTIONS = [
    {
        value: "1",
        label: "Duplicate",
        remark: "E-Way Bill generated more than once",
    },
    {
        value: "2",
        label: "Data Entry Mistake",
        remark: "cancel by user",
    },
    {
        value: "3",
        label: "Order Cancelled",
        remark: "Order has been cancelled",
    },
    {
        value: "4",
        label: "Others",
        remark: "",
    },
];

const createInitialCancelEWayBillForm = () => ({
    cancelRsnCode: "2",
    cancelRmrk:
        "cancel by user",
});


const normalizeEwayStatus = (status: any) => {
    const value = String(
        status || ""
    )
        .trim()
        .toUpperCase();

    if (
        value === "ACTIVE" ||
        value === "ACT"
    ) {
        return "ACT";
    }

    if (
        value === "CANCELLED" ||
        value === "CANCELED" ||
        value === "CNL"
    ) {
        return "CNL";
    }

    if (
        value === "REJECTED" ||
        value === "REJ"
    ) {
        return "REJ";
    }

    return value;
};

const getStatusColor = (status: any) => {
    const code =
        normalizeEwayStatus(status);

    if (code === "ACT") {
        return "#16A34A";
    }

    if (code === "CNL") {
        return "#F97316";
    }

    if (code === "REJ") {
        return "#DC2626";
    }

    return "#6B7280";
};

const getStatusLabel = (status: any) => {
    const code =
        normalizeEwayStatus(status);

    if (code === "ACT") {
        return "Active";
    }

    if (code === "CNL") {
        return "Cancelled";
    }

    if (code === "REJ") {
        return "Rejected";
    }

    return status || "-";
};


const GOODS_STATUS_OPTIONS = Object.entries(
    GOODS_STATUS_MAP
).map(([value, item]: any) => ({
    label: item.label,
    value,
}));

const REASON_OPTIONS = Object.entries(
    REASON_CODE_MAP
).map(([value, item]: any) => ({
    label: `${item.code} — ${item.label}`,
    value,
}));

const DEFAULT_GOODS_STATUS = "moving";
const DEFAULT_REASON = "floodCycloneLandslide";

const createInitialExtendValidityForm = () => {
    const reason = REASON_CODE_MAP[DEFAULT_REASON];

    return {
        goodsStatus: DEFAULT_GOODS_STATUS,
        reasonKey: DEFAULT_REASON,
        extnRemarks: reason.remark,
        addressLine1: "",
        addressLine2: "",
        addressLine3: "",
    };
};

const validateExtendValidityForm = (form: any) => {
    if (!form?.goodsStatus) {
        return "Please select consignment status";
    }

    if (!form?.reasonKey) {
        return "Please select extension reason";
    }

    if (!String(form?.extnRemarks || "").trim()) {
        return "Extension remarks are required";
    }

    const goods =
        GOODS_STATUS_MAP[form.goodsStatus];

    if (
        goods?.transitAddressRequired &&
        !String(form?.addressLine1 || "").trim()
    ) {
        return "Address line 1 is required for this consignment status";
    }

    return "";
};

const buildExtendValidityPayload = ({
    item,
    form,
}: {
    item: any;
    form: any;
}) => {
    const payload =
        item?.ewayPayload ||
        item?.eWayPayload ||
        item?.payload ||
        {};

    const response =
        item?.rawResponse ||
        item?.ewayResponse ||
        item?.response ||
        {};

    const ewbNo =
        item?.ewbNo ||
        item?.EwbNo ||
        item?.ewayBillNo ||
        response?.ewbNo ||
        response?.EwbNo ||
        response?.ewayBillNo;

    const goods =
        GOODS_STATUS_MAP[form.goodsStatus] ||
        GOODS_STATUS_MAP.moving;

    const reason =
        REASON_CODE_MAP[form.reasonKey] ||
        REASON_CODE_MAP.floodCycloneLandslide;

    const needsAddress =
        Boolean(goods.transitAddressRequired);

    return {
        ewbNo: Number(ewbNo),

        vehicleNo: String(
            item?.vehicleNo ||
            payload?.vehicleNo ||
            ""
        ).trim(),

        fromPlace: String(
            payload?.fromPlace || ""
        ).trim(),

        fromState:
            Number(
                payload?.fromStateCode ||
                payload?.fromState
            ) || 0,

        fromPincode:
            Number(payload?.fromPincode) || 0,

        remainingDistance:
            Number(payload?.transDistance) || 0,

        transDocNo: String(
            payload?.transDocNo || ""
        ),

        transDocDate: String(
            payload?.transDocDate || ""
        ),

        transMode: String(
            goods?.transMode || "1"
        ),

        extnRsnCode:
            Number(reason?.code) || 1,

        extnRemarks: String(
            form?.extnRemarks ||
            reason?.remark ||
            ""
        ).trim(),

        consignmentStatus: String(
            goods?.consignmentStatus || "M"
        ),

        transitType: String(
            goods?.transitType || ""
        ),

        addressLine1: needsAddress
            ? String(
                form?.addressLine1 || ""
            ).trim()
            : "",

        addressLine2: needsAddress
            ? String(
                form?.addressLine2 || ""
            ).trim()
            : "",

        addressLine3: needsAddress
            ? String(
                form?.addressLine3 || ""
            ).trim()
            : "",
    };
};

// ⭐ YELLOW STAR: ADDED — MULTI VEHICLE UPDATE REASON OPTIONS
const MULTI_VEHICLE_REASON_OPTIONS = [
    {
        value: "1",
        label: "Vehicle Breakdown",
        remark: "Vehicle broke down",
    },
    {
        value: "2",
        label: "Transshipment",
        remark: "Goods transferred to another vehicle",
    },
    {
        value: "3",
        label: "Others",
        remark: "Vehicle updated due to operational requirement",
    },
];


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


    const [
        cancelEWayBillForm,
        setCancelEWayBillForm,
    ] = useState<any>(
        createInitialCancelEWayBillForm
    );
    // ⭐ YELLOW STAR: ADDED — ROW ACTION MENU
    const [openActionMenu, setOpenActionMenu] =
        useState<string>("");

    // ⭐ YELLOW STAR: ADDED — ACTION CONFIRMATION MODAL
    const [ewayActionConfirm, setEwayActionConfirm] =
        useState<any>({
            show: false,
            action: "",
            record: null,
        });

    // ⭐ YELLOW STAR: ADDED — ACTION AND DOWNLOAD LOADER
    const [ewayActionLoading, setEwayActionLoading] =
        useState(false);

    const [ewayDownloadLoading, setEwayDownloadLoading] =
        useState<string>("");
    // ⭐ YELLOW STAR: ADDED — ACTION API BODY
    const [ewayActionPayload, setEwayActionPayload] =
        useState<any>({});

    // ⭐ YELLOW STAR: ADDED — ACTION REMARK
    const [ewayActionRemark, setEwayActionRemark] =
        useState("");

    // ⭐ YELLOW STAR: ADDED — EXTEND VALIDITY FORM
    // Only four user inputs:
    // 1. Goods Condition
    // 2. Extension Reason
    // 3. Extension Remarks
    // 4. Transit Address (required only for transit conditions)
    const [extendValidityForm, setExtendValidityForm] =
        useState<any>(createInitialExtendValidityForm);

    // ⭐ YELLOW STAR: ADDED — MULTI VEHICLE UPDATE FORM
    const [multiVehicleForm, setMultiVehicleForm] =
        useState<any>({
            groupNo: 1,
            oldVehicleNo: "",
            newVehicleNo: "",
            oldTranNo: "",
            newTranNo: "",
            fromPlace: "",
            fromState: "",
            reasonCode: "1",
            reasonRem: "Vehicle broke down",
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
            status === "cnl" ||
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


    const openEWayBillActionConfirm = (
        action: "cancel" | "reject" | "extendValidity" | "updateVehicle",
        record: any
    ) => {
        setOpenActionMenu("");

        const initialPayload =
            action === "cancel"
                ? record?.cancelPayload || {}
                : action === "reject"
                    ? record?.rejectPayload || {}
                    : action === "extendValidity"
                        ? record?.extendValidityPayload || {}
                        : record?.multiVehicleUpdatePayload || {};

        setEwayActionPayload(initialPayload);

        // ⭐ YELLOW STAR: UPDATED — INITIALIZE CANCEL E-WAY BILL FORM
        if (action === "cancel") {
            const cancelRsnCode = String(
                initialPayload?.cancelRsnCode ||
                "2"
            ).trim();

            const selectedReason =
                CANCEL_EWAY_BILL_REASON_OPTIONS.find(
                    (option) =>
                        option.value ===
                        cancelRsnCode
                );

            setCancelEWayBillForm({
                cancelRsnCode,

                cancelRmrk: String(
                    initialPayload?.cancelRmrk ||
                    selectedReason?.remark ||
                    ""
                ),
            });
        }

        setEwayActionRemark("");

        // ⭐ YELLOW STAR: KEEP EXISTING EXTEND VALIDITY RESET
        if (action === "extendValidity") {
            setExtendValidityForm(
                createInitialExtendValidityForm()
            );
        }

        setEwayActionConfirm({
            show: true,
            action,
            record,
        });
    };

    const closeEWayBillActionConfirm = () => {
        if (ewayActionLoading) return;

        setEwayActionConfirm({
            show: false,
            action: "",
            record: null,
        });

        setEwayActionPayload({});
        setEwayActionRemark("");

        // ⭐ YELLOW STAR: ADDED — RESET CANCEL E-WAY BILL FORM
        setCancelEWayBillForm(
            createInitialCancelEWayBillForm()
        );

        setExtendValidityForm(
            createInitialExtendValidityForm()
        );

        setMultiVehicleForm({
            groupNo: 1,
            oldVehicleNo: "",
            newVehicleNo: "",
            oldTranNo: "",
            newTranNo: "",
            fromPlace: "",
            fromState: "",
            reasonCode: "1",
            reasonRem: "Vehicle broke down",
        });
    };

    const getActionTitle = () => {
        switch (ewayActionConfirm.action) {
            case "cancel":
                return "Cancel E-Way Bill";

            case "reject":
                return "Reject E-Way Bill";

            case "extendValidity":
                return "Extend E-Way Bill Validity";

            case "updateVehicle":
                return "Update E-Way Bill Vehicle";

            default:
                return "Confirm Action";
        }
    };

    const getActionMessage = () => {
        const ewayBillNo =
            ewayActionConfirm.record?.ewayBillNo ||
            "";

        switch (ewayActionConfirm.action) {
            case "cancel":
                return `Are you sure you want to cancel E-Way Bill ${ewayBillNo}?`;

            case "reject":
                return `Are you sure you want to reject E-Way Bill ${ewayBillNo}?`;

            case "extendValidity":
                return `Are you sure you want to extend the validity of E-Way Bill ${ewayBillNo}?`;

            case "updateVehicle":
                return `Update vehicle details for E-Way Bill ${ewayBillNo}.`;

            default:
                return "Are you sure you want to continue?";
        }
    };



    // ⭐ YELLOW STAR: ADDED — SELECTED EXTEND VALIDITY CONDITION
    const selectedExtendCondition =
        GOODS_STATUS_MAP[
        extendValidityForm.goodsStatus
        ] || GOODS_STATUS_MAP.moving;

    const isTransitAddressRequired =
        Boolean(
            selectedExtendCondition
                ?.transitAddressRequired
        );

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
       EDIT
    =================================================== */


    const handleEditEWayBill = (record: any) => {
        if (!record?.ewayBillNo) {
            toast.warn("E-Way Bill Number not found");
            return;
        }

        navigate(
            `/bookEz/transportation/e-way-bill/edit/${record.ewayBillNo}`,
            {
                state: {
                    title: "Edit E-Way Bill",
                    description: "Update E-Way Bill details.",
                    mode: "edit",
                    ewayBillNo: record.ewayBillNo,
                    ewayBillData: record,
                },
            }
        );
    };

    const handleDownload = async (record: any) => {
        const ewayBillNo = String(
            record?.ewbNo ||
            record?.EwbNo ||
            record?.ewayBillNo ||
            record?.rawResponse?.ewbNo ||
            record?.rawResponse?.EwbNo ||
            record?.rawResponse?.ewayBillNo ||
            ""
        ).trim();

        if (!ewayBillNo) {
            toast.warn(
                "E-Way Bill number is missing"
            );

            return;
        }

        if (ewayDownloadLoading) {
            return;
        }

        try {
            setEwayDownloadLoading(
                ewayBillNo
            );

            setOpenActionMenu("");

            /* ===================================================
               STEP 1: CHECK SAVED PDF BY E-WAY BILL NUMBER
            =================================================== */

            try {
                const savedPdfResult =
                    await unwrapThunk(
                        dispatch,
                        getEWayBillPdfByNumber({
                            ewayBillNo,
                            includeBase64: true,
                        })
                    );

                const savedPdfData =
                    savedPdfResult?.data?.data ||
                    savedPdfResult?.data ||
                    savedPdfResult ||
                    {};

                const savedPdfBase64 =
                    savedPdfData?.pdfBase64 ||
                    savedPdfData?.base64 ||
                    savedPdfData?.fileBase64 ||
                    "";

                const savedPdfBlob =
                    base64ToPdfBlob(
                        savedPdfBase64
                    );

                if (savedPdfBlob) {
                    downloadPdfBlob(
                        savedPdfBlob,
                        ewayBillNo
                    );

                    toast.success(
                        "E-Way Bill PDF downloaded successfully."
                    );

                    return;
                }
            } catch (savedPdfError: any) {
                const savedPdfStatus =
                    Number(
                        savedPdfError?.status ||
                        savedPdfError?.statusCode ||
                        savedPdfError?.response?.status ||
                        0
                    );

                const savedPdfCode = String(
                    savedPdfError?.code ||
                    savedPdfError?.error?.code ||
                    ""
                ).toUpperCase();

                const savedPdfMessage = String(
                    savedPdfError?.message ||
                    savedPdfError?.error?.message ||
                    ""
                ).toLowerCase();

                const isPdfNotFound =
                    savedPdfStatus === 404 ||
                    savedPdfCode ===
                    "NOT_FOUND" ||
                    savedPdfCode ===
                    "PDF_NOT_FOUND" ||
                    savedPdfMessage.includes(
                        "pdf not found"
                    ) ||
                    savedPdfMessage.includes(
                        "e-way bill pdf not found"
                    ) ||
                    savedPdfMessage.includes(
                        "no matching e-way bill pdf"
                    );

                if (!isPdfNotFound) {
                    throw savedPdfError;
                }
            }

            /* ===================================================
               STEP 2: GET FRESH GST ACCESS TOKEN
            =================================================== */

            const tokenResult =
                await unwrapThunk(
                    dispatch,
                    getEWayBillAccessToken()
                );

            const gstAuthToken = String(
                tokenResult?.authtoken ||
                tokenResult?.authToken ||
                tokenResult?.data?.authtoken ||
                tokenResult?.data?.authToken ||
                tokenResult?.data?.data?.authtoken ||
                tokenResult?.data?.data?.authToken ||
                ""
            ).trim();

            if (!gstAuthToken) {
                throw new Error(
                    "E-Way Bill access token was not received"
                );
            }

            /* ===================================================
               STEP 3: GET COMPLETE E-WAY BILL FROM GST
            =================================================== */

            const detailsResult =
                await unwrapThunk(
                    dispatch,
                    getEWayBillFromGst({
                        authtoken:
                            gstAuthToken,

                        ewbNo:
                            ewayBillNo,
                    })
                );

            const ewayBillDetails =
                detailsResult?.data?.data ||
                detailsResult?.data ||
                detailsResult;

            if (!ewayBillDetails) {
                throw new Error(
                    "E-Way Bill details were not received"
                );
            }

            /* ===================================================
               STEP 4: GENERATE PDF
            =================================================== */

            const pdfResult =
                await unwrapThunk(
                    dispatch,
                    printDetailEWayBill({
                        payload:
                            ewayBillDetails,
                    })
                );

            const generatedPdfBlob =
                pdfResult instanceof Blob
                    ? pdfResult
                    : pdfResult?.data instanceof Blob
                        ? pdfResult.data
                        : null;

            if (!generatedPdfBlob) {
                throw new Error(
                    "Invalid E-Way Bill PDF response"
                );
            }

            /* ===================================================
               STEP 5: CONVERT PDF TO BASE64 AND SAVE INTERNALLY
            =================================================== */

            const pdfBase64 =
                await blobToBase64(
                    generatedPdfBlob
                );

            await unwrapThunk(
                dispatch,
                saveEWayBillPdf({
                    payload: {
                        ewayBillNo,
                        ewayBillNumber:
                            ewayBillNo,

                        name:
                            `EWayBill_${ewayBillNo}.pdf`,

                        filename:
                            `EWayBill_${ewayBillNo}.pdf`,

                        mimeType:
                            "application/pdf",

                        pdfBase64,
                    },
                })
            );

            /* ===================================================
               STEP 6: DOWNLOAD GENERATED PDF
            =================================================== */

            downloadPdfBlob(
                generatedPdfBlob,
                ewayBillNo
            );

            toast.success(
                "E-Way Bill PDF saved and downloaded successfully."
            );
        } catch (error: any) {
            const apiErrorMessage =
                error?.error?.error?.message ||
                error?.error?.message ||
                error?.response?.data?.error?.error?.message ||
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.data?.error?.error?.message ||
                error?.data?.error?.message ||
                error?.data?.message ||
                error?.payload?.error?.error?.message ||
                error?.payload?.error?.message ||
                error?.payload?.message ||
                error?.message ||
                "Unable to download E-Way Bill PDF";

            toast.error(
                apiErrorMessage
            );
        } finally {
            setEwayDownloadLoading("");
        }
    };


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





    const handleConfirmEWayBillAction = async () => {
        const record =
            ewayActionConfirm.record;

        const ewayBillNo = String(
            record?.ewayBillNo || ""
        ).trim();

        if (!ewayBillNo) {
            toast.warn(
                "E-Way Bill number not found"
            );

            return;
        }

        try {
            setEwayActionLoading(true);

            /* ===================================================
               STEP 1: GET FRESH GST ACCESS TOKEN
            =================================================== */

            const tokenResult = await unwrapThunk(
                dispatch,
                getEWayBillAccessToken()
            );

            const gstAuthToken = String(
                tokenResult?.authtoken ||
                tokenResult?.data?.authtoken ||
                tokenResult?.data?.data?.authtoken ||
                ""
            ).trim();

            if (!gstAuthToken) {
                throw new Error(
                    "E-Way Bill access token was not received"
                );
            }

            /* ===================================================
               STEP 2: PREPARE DEFAULT CANCEL / REJECT BODY
            =================================================== */

            let requestPayload: any = {
                ...ewayActionPayload,

                ewbNo:
                    ewayActionPayload?.ewbNo ??
                    ewayActionPayload?.ewayBillNo ??
                    Number(ewayBillNo),


                ...(ewayActionRemark.trim()
                    ? {
                        remarks:
                            ewayActionRemark.trim(),
                    }
                    : {}),
            };

            /* ===================================================
               STEP 2A: PREPARE EXTEND VALIDITY BODY
               Only four values are selected by user.
               Remaining values are picked internally from record.
            =================================================== */



            if (
                ewayActionConfirm.action ===
                "cancel"
            ) {
                const cancelRsnCode = String(
                    cancelEWayBillForm.cancelRsnCode ||
                    "2"
                ).trim();

                const cancelRmrk = String(
                    cancelEWayBillForm.cancelRmrk ||
                    "cancel by user"
                ).trim();

                if (!cancelRsnCode) {
                    throw new Error(
                        "Cancellation reason is required"
                    );
                }

                if (!cancelRmrk) {
                    throw new Error(
                        "Cancellation remark is required"
                    );
                }

                requestPayload = {
                    ewbNo: String(
                        ewayBillNo
                    ).trim(),

                    cancelRsnCode,

                    cancelRmrk,
                };
            }



            /* ===================================================
   STEP 2B: PREPARE REJECT E-WAY BILL BODY
=================================================== */

            if (
                ewayActionConfirm.action ===
                "reject"
            ) {
                // ⭐ YELLOW STAR: EXACT REJECT API PAYLOAD
                requestPayload = {
                    ewbNo: String(
                        ewayBillNo
                    ).trim(),
                };
            }



            /* ===================================================
   STEP 2C: PREPARE EXTEND VALIDITY E-WAY BILL BODY
=================================================== */

            if (
                ewayActionConfirm.action ===
                "extendValidity"
            ) {
                const validationError =
                    validateExtendValidityForm(
                        extendValidityForm
                    );

                if (validationError) {
                    throw new Error(
                        validationError
                    );
                }

                requestPayload =
                    buildExtendValidityPayload({
                        item: record,
                        form: extendValidityForm,
                    });

                if (!requestPayload.ewbNo) {
                    throw new Error(
                        "E-Way Bill number is not available"
                    );
                }

                if (!requestPayload.vehicleNo) {
                    throw new Error(
                        "Vehicle number is not available in E-Way Bill"
                    );
                }

                if (!requestPayload.fromPlace) {
                    throw new Error(
                        "From place is not available in E-Way Bill"
                    );
                }

                if (!requestPayload.fromState) {
                    throw new Error(
                        "From state code is not available in E-Way Bill"
                    );
                }

                if (!requestPayload.fromPincode) {
                    throw new Error(
                        "From pincode is not available in E-Way Bill"
                    );
                }

                if (!requestPayload.remainingDistance) {
                    throw new Error(
                        "Remaining distance is not available in E-Way Bill"
                    );
                }
            }
            /* ===================================================
               STEP 2B: PREPARE MULTI VEHICLE UPDATE BODY
            =================================================== */

            if (
                ewayActionConfirm.action ===
                "updateVehicle"
            ) {
                const groupNo = Number(
                    multiVehicleForm.groupNo
                );

                const oldvehicleNo = String(
                    multiVehicleForm.oldVehicleNo || ""
                ).trim().toUpperCase();

                const newVehicleNo = String(
                    multiVehicleForm.newVehicleNo || ""
                ).trim().toUpperCase();

                const oldTranNo = String(
                    multiVehicleForm.oldTranNo || ""
                ).trim();

                const newTranNo = String(
                    multiVehicleForm.newTranNo || ""
                ).trim();

                const fromPlace = String(
                    multiVehicleForm.fromPlace || ""
                ).trim();

                const fromState = Number(
                    multiVehicleForm.fromState
                );

                const reasonCode = String(
                    multiVehicleForm.reasonCode || ""
                ).trim();

                const reasonRem = String(
                    multiVehicleForm.reasonRem || ""
                ).trim();

                if (!groupNo) {
                    throw new Error(
                        "Multi Vehicle group number is required"
                    );
                }

                if (!oldvehicleNo) {
                    throw new Error(
                        "Old vehicle number is required"
                    );
                }

                if (!newVehicleNo) {
                    throw new Error(
                        "New vehicle number is required"
                    );
                }

                if (
                    oldvehicleNo ===
                    newVehicleNo
                ) {
                    throw new Error(
                        "Old and new vehicle numbers cannot be the same"
                    );
                }

                if (!fromPlace) {
                    throw new Error(
                        "From place is required"
                    );
                }

                if (!fromState) {
                    throw new Error(
                        "From state code is required"
                    );
                }

                if (!reasonCode) {
                    throw new Error(
                        "Vehicle update reason is required"
                    );
                }

                if (!reasonRem) {
                    throw new Error(
                        "Vehicle update reason remark is required"
                    );
                }

                requestPayload = {
                    ewbNo: Number(ewayBillNo),
                    groupNo,
                    oldvehicleNo,
                    newVehicleNo,
                    oldTranNo,
                    newTranNo,
                    fromPlace,
                    fromState,
                    reasonCode,
                    reasonRem,
                };
            }

            let result: any = null;

            /* ===================================================
               STEP 3: CALL SELECTED ACTION API
            =================================================== */

            if (
                ewayActionConfirm.action ===
                "cancel"
            ) {
                result = await unwrapThunk(
                    dispatch,
                    cancelEWayBill({
                        authtoken:
                            gstAuthToken,

                        payload:
                            requestPayload,
                    })
                );
            } else if (
                ewayActionConfirm.action ===
                "reject"
            ) {
                result = await unwrapThunk(
                    dispatch,
                    rejectEWayBill({
                        authtoken:
                            gstAuthToken,

                        payload:
                            requestPayload,
                    })
                );
            } else if (
                ewayActionConfirm.action ===
                "extendValidity"
            ) {
                result = await unwrapThunk(
                    dispatch,
                    extendEWayBillValidity({
                        authtoken:
                            gstAuthToken,

                        payload:
                            requestPayload,
                    })
                );
            } else if (
                ewayActionConfirm.action ===
                "updateVehicle"
            ) {
                result = await unwrapThunk(
                    dispatch,
                    multiVehicleUpdate({
                        authtoken:
                            gstAuthToken,

                        payload:
                            requestPayload,
                    })
                );
            } else {
                throw new Error(
                    "Invalid E-Way Bill action"
                );
            }

            /* ===================================================
               STEP 4: REACT NATIVE PARITY AFTER EXTEND
               Get latest E-Way Bill → Print → Update local record
            =================================================== */

            if (
                ewayActionConfirm.action ===
                "extendValidity"
            ) {
                const latestDetailsResult =
                    await unwrapThunk(
                        dispatch,
                        getEWayBillFromGst({
                            authtoken:
                                gstAuthToken,
                            ewbNo:
                                Number(ewayBillNo),
                        })
                    );

                const latestEWayBillDetails =
                    latestDetailsResult?.data?.data ||
                    latestDetailsResult?.data ||
                    latestDetailsResult;

                if (!latestEWayBillDetails) {
                    throw new Error(
                        "Updated E-Way Bill details were not received"
                    );
                }

                await unwrapThunk(
                    dispatch,
                    printDetailEWayBill({
                        payload:
                            latestEWayBillDetails,
                    })
                );

                const updateId = String(
                    record?._id ||
                    record?.documentId ||
                    ewayBillNo
                ).trim();

                if (!updateId) {
                    throw new Error(
                        "E-Way Bill update ID is not available"
                    );
                }

                const latestStatus =
                    latestEWayBillDetails?.status ||
                    latestEWayBillDetails?.status_cd ||
                    record?.status ||
                    "ACT";

                await unwrapThunk(
                    dispatch,
                    updateEWayBill({
                        id: updateId,
                        payload: {
                            ewayPayload: {
                                ...(record?.ewayPayload || {}),
                            },
                            rawResponse:
                                latestEWayBillDetails,
                            extendResponse:
                                result,
                            status:
                                latestStatus,
                        },
                    })
                );
            }

            const resultData =
                result?.data?.data ||
                result?.data ||
                result ||
                {};

            const apiMessage =
                result?.message ||
                resultData?.message ||
                resultData?.status_desc ||
                resultData?.statusDesc ||
                "";

            if (
                ewayActionConfirm.action ===
                "cancel"
            ) {
                toast.success(
                    apiMessage ||
                    "E-Way Bill cancelled successfully."
                );
            } else if (
                ewayActionConfirm.action ===
                "reject"
            ) {
                toast.success(
                    apiMessage ||
                    "E-Way Bill rejected successfully."
                );
            } else if (
                ewayActionConfirm.action ===
                "extendValidity"
            ) {
                toast.success(
                    apiMessage ||
                    "E-Way Bill validity extended successfully."
                );
            } else {
                toast.success(
                    apiMessage ||
                    "E-Way Bill vehicle updated successfully."
                );
            }

            setEwayActionConfirm({
                show: false,
                action: "",
                record: null,
            });

            setEwayActionPayload({});
            setEwayActionRemark("");

            // ⭐ YELLOW STAR: ADDED — RESET CANCEL E-WAY BILL FORM
            setCancelEWayBillForm(
                createInitialCancelEWayBillForm()
            );

            setExtendValidityForm(
                createInitialExtendValidityForm()
            );

            setMultiVehicleForm({
                groupNo: 1,
                oldVehicleNo: "",
                newVehicleNo: "",
                oldTranNo: "",
                newTranNo: "",
                fromPlace: "",
                fromState: "",
                reasonCode: "1",
                reasonRem: "Vehicle broke down",
            });

            await dispatch(
                getAllEWayBill({
                    limit:
                        localLimit,

                    offset:
                        localOffset,

                    search,
                })
            );
        } catch (error: any) {
            const apiErrorMessage =
                error?.error?.error?.message ||
                error?.error?.message ||
                error?.response?.data?.error?.error?.message ||
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                error?.data?.error?.error?.message ||
                error?.data?.error?.message ||
                error?.data?.message ||
                error?.payload?.error?.error?.message ||
                error?.payload?.error?.message ||
                error?.payload?.message ||
                error?.message ||
                `Failed to ${getActionTitle().toLowerCase()}`;

            toast.error(apiErrorMessage);

        } finally {
            setEwayActionLoading(false);
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

        // {
        //     key: "from",
        //     title: "From Party",
        //     render: (row: any) => (
        //         <div>
        //             <div className="font-medium">
        //                 {row?.ewayPayload?.fromTrdName || "-"}
        //             </div>

        //             <div className="text-xs text-muted-foreground">
        //                 {row?.ewayPayload?.fromGstin || "-"}
        //             </div>
        //         </div>
        //     ),
        // },

        // {
        //     key: "to",
        //     title: "To Party",
        //     render: (row: any) => (
        //         <div>
        //             <div className="font-medium">
        //                 {row?.ewayPayload?.toTrdName || "-"}
        //             </div>

        //             <div className="text-xs text-muted-foreground">
        //                 {row?.ewayPayload?.toGstin || "-"}
        //             </div>
        //         </div>
        //     ),
        // },

        {
            key: "vehicle",
            title: "Vehicle No",
            render: (row: any) =>
                row?.ewayPayload?.vehicleNo || "-",
        },

        // {
        //     key: "distance",
        //     title: "Distance",
        //     render: (row: any) =>
        //         row?.ewayPayload?.transDistance
        //             ? `${row.ewayPayload.transDistance} KM`
        //             : "-",
        // },

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

        // {
        //     key: "validUpto",
        //     title: "Valid Upto",
        //     render: (row: any) =>
        //         row?.rawResponse?.validUpto || "-",
        // },

        {
            key: "status",
            title: "Status",
            render: (row: any) => {
                const status =
                    row?.status ||
                    row?.ewayBillStatus ||
                    row?.rawResponse?.status ||
                    "-";

                return (
                    <span
                        className="inline-flex rounded-md px-2.5 py-1 text-xs font-bold"
                        style={{
                            color:
                                getStatusColor(status),

                            backgroundColor:
                                `${getStatusColor(status)}18`,
                        }}
                    >
                        {getStatusLabel(status)}
                    </span>
                );
            },
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
                            Closed ({closeCount})
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
                
                    actions={(record: any) => {
                        const recordKey = String(
                            record?._id ||
                            record?.ewayBillNo ||
                            ""
                        );

                        const isMenuOpen =
                            openActionMenu === recordKey;

                        const isDownloading =
                            ewayDownloadLoading ===
                            String(record?.ewayBillNo || "");

                        // ⭐ YELLOW STAR: ADDED — DISABLE ACTIONS FOR CANCELLED E-WAY BILL
                        const actionsDisabled =
                            isClosedEWayBill(record);

                        return (
                            <div className="relative flex items-center gap-2">
                                <Permission
                                    module="bookez"
                                    permissionKey="Pass"
                                    action={"edit" as any}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (actionsDisabled) return;

                                            handleEditEWayBill(
                                                record
                                            );
                                        }}
                                        disabled={actionsDisabled}
                                        className={`rounded-md p-2 ${actionsDisabled
                                                ? "cursor-not-allowed text-muted-foreground opacity-40"
                                                : "text-amber-600 hover:bg-amber-100"
                                            }`}
                                        title={
                                            actionsDisabled
                                                ? "Actions are disabled for cancelled E-Way Bill"
                                                : "Edit"
                                        }
                                    >
                                        <Edit size={16} />
                                    </button>
                                </Permission>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (actionsDisabled) return;

                                        handleDownload(
                                            record
                                        );
                                    }}
                                    disabled={
                                        actionsDisabled ||
                                        isDownloading
                                    }
                                    className={`rounded-md p-2 ${actionsDisabled
                                            ? "cursor-not-allowed text-muted-foreground opacity-40"
                                            : "text-success hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-60"
                                        }`}
                                    title={
                                        actionsDisabled
                                            ? "Actions are disabled for cancelled E-Way Bill"
                                            : "Download"
                                    }
                                >
                                    {isDownloading ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Download size={16} />
                                    )}
                                </button>

                                {/* ⭐ YELLOW STAR: UPDATED — DISABLED FOR CANCELLED RECORD */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (actionsDisabled) {
                                            setOpenActionMenu(
                                                ""
                                            );

                                            return;
                                        }

                                        setOpenActionMenu(
                                            isMenuOpen
                                                ? ""
                                                : recordKey
                                        );
                                    }}
                                    disabled={actionsDisabled}
                                    className={`rounded-md p-2 ${actionsDisabled
                                            ? "cursor-not-allowed text-muted-foreground opacity-40"
                                            : "text-muted-foreground hover:bg-muted"
                                        }`}
                                    title={
                                        actionsDisabled
                                            ? "Actions are disabled for cancelled E-Way Bill"
                                            : "More Actions"
                                    }
                                >
                                    <MoreVertical size={17} />
                                </button>

                                {!actionsDisabled &&
                                    isMenuOpen && (
                                        <div className="absolute right-0 top-10 z-50 min-w-[190px] overflow-hidden rounded-md border border-border bg-card py-1 shadow-xl">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEWayBillActionConfirm(
                                                        "cancel",
                                                        record
                                                    )
                                                }
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10"
                                            >
                                                <Ban size={15} />
                                                Cancel E-Way Bill
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEWayBillActionConfirm(
                                                        "reject",
                                                        record
                                                    )
                                                }
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-amber-600 hover:bg-amber-500/10"
                                            >
                                                <XCircle size={15} />
                                                Reject E-Way Bill
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEWayBillActionConfirm(
                                                        "extendValidity",
                                                        record
                                                    )
                                                }
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/10"
                                            >
                                                <CalendarClock size={15} />
                                                Extend Validity
                                            </button>
                                        </div>
                                    )}
                            </div>
                        );
                    }}
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




            {/* ⭐ YELLOW STAR: ADDED — E-WAY BILL ACTION CONFIRMATION MODAL */}
            {ewayActionConfirm.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div
                        className={`w-full rounded-lg border border-border bg-card shadow-2xl ${ewayActionConfirm.action === "updateVehicle"
                            ? "max-w-2xl"
                            : "max-w-md"
                            }`}
                    >
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-bold text-card-foreground">
                                {getActionTitle()}
                            </h2>
                        </div>

                        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-5">
                            <p className="text-sm font-medium text-muted-foreground">
                                {getActionMessage()}
                            </p>

                            {ewayActionConfirm.action ===
                                "extendValidity" ? (
                                <>
                                    {/* ⭐ INPUT 1 — CONSIGNMENT STATUS */}
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Consignment Status
                                        </label>

                                        <select
                                            value={
                                                extendValidityForm
                                                    .goodsStatus
                                            }
                                            onChange={(event) =>
                                                setExtendValidityForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        goodsStatus:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            disabled={ewayActionLoading}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        >
                                            {GOODS_STATUS_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* ⭐ INPUT 2 — EXTENSION REASON */}
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Extension Reason
                                        </label>

                                        <select
                                            value={
                                                extendValidityForm
                                                    .reasonKey
                                            }
                                            onChange={(event) => {
                                                const reasonKey =
                                                    event.target.value;

                                                const reason =
                                                    REASON_CODE_MAP[
                                                    reasonKey
                                                    ];

                                                setExtendValidityForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        reasonKey,
                                                        extnRemarks:
                                                            reason?.remark ||
                                                            "",
                                                    })
                                                );
                                            }}
                                            disabled={ewayActionLoading}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        >
                                            {REASON_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* ⭐ INPUT 3 — EXTENSION REMARKS */}
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Extension Remarks
                                        </label>

                                        <textarea
                                            value={
                                                extendValidityForm
                                                    .extnRemarks
                                            }
                                            onChange={(event) =>
                                                setExtendValidityForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        extnRemarks:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            disabled={ewayActionLoading}
                                            rows={3}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        />
                                    </div>

                                    {/* ⭐ TRANSIT ADDRESS — SAME AS REACT NATIVE */}
                                    {isTransitAddressRequired && (
                                        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
                                            <p className="text-sm font-bold text-card-foreground">
                                                Transit Address
                                            </p>

                                            <input
                                                value={
                                                    extendValidityForm
                                                        .addressLine1
                                                }
                                                onChange={(event) =>
                                                    setExtendValidityForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            addressLine1:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                placeholder="Address Line 1 *"
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />

                                            <input
                                                value={
                                                    extendValidityForm
                                                        .addressLine2
                                                }
                                                onChange={(event) =>
                                                    setExtendValidityForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            addressLine2:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                placeholder="Address Line 2"
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />

                                            <input
                                                value={
                                                    extendValidityForm
                                                        .addressLine3
                                                }
                                                onChange={(event) =>
                                                    setExtendValidityForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            addressLine3:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                placeholder="Address Line 3"
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>
                                    )}

                                </>
                            ) : ewayActionConfirm.action ===
                                "updateVehicle" ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                Group Number
                                            </label>

                                            <input
                                                type="number"
                                                min="1"
                                                value={multiVehicleForm.groupNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            groupNo:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                From State Code
                                            </label>

                                            <input
                                                type="number"
                                                value={multiVehicleForm.fromState}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            fromState:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                Old Vehicle Number
                                            </label>

                                            <input
                                                value={multiVehicleForm.oldVehicleNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            oldVehicleNo:
                                                                event.target.value.toUpperCase(),
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm uppercase text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                New Vehicle Number
                                            </label>

                                            <input
                                                value={multiVehicleForm.newVehicleNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            newVehicleNo:
                                                                event.target.value.toUpperCase(),
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm uppercase text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                Old Transporter Number
                                            </label>

                                            <input
                                                value={multiVehicleForm.oldTranNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            oldTranNo:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                                New Transporter Number
                                            </label>

                                            <input
                                                value={multiVehicleForm.newTranNo}
                                                onChange={(event) =>
                                                    setMultiVehicleForm(
                                                        (prev: any) => ({
                                                            ...prev,
                                                            newTranNo:
                                                                event.target.value,
                                                        })
                                                    )
                                                }
                                                disabled={ewayActionLoading}
                                                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            From Place
                                        </label>

                                        <input
                                            value={multiVehicleForm.fromPlace}
                                            onChange={(event) =>
                                                setMultiVehicleForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        fromPlace:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            disabled={ewayActionLoading}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Update Reason
                                        </label>

                                        <select
                                            value={multiVehicleForm.reasonCode}
                                            onChange={(event) => {
                                                const selectedReason =
                                                    MULTI_VEHICLE_REASON_OPTIONS.find(
                                                        (option) =>
                                                            option.value ===
                                                            event.target.value
                                                    );

                                                setMultiVehicleForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        reasonCode:
                                                            selectedReason?.value ||
                                                            "1",
                                                        reasonRem:
                                                            selectedReason?.remark ||
                                                            "",
                                                    })
                                                );
                                            }}
                                            disabled={ewayActionLoading}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        >
                                            {MULTI_VEHICLE_REASON_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Reason Remark
                                        </label>

                                        <textarea
                                            value={multiVehicleForm.reasonRem}
                                            onChange={(event) =>
                                                setMultiVehicleForm(
                                                    (prev: any) => ({
                                                        ...prev,
                                                        reasonRem:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            disabled={ewayActionLoading}
                                            rows={3}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        />
                                    </div>

                                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                        Multi Vehicle Initiation must already exist for the same E-Way Bill and group number before vehicle update.
                                    </div>
                                </div>
                            ) : ewayActionConfirm.action ===
                                "cancel" ? (
                                <div className="space-y-4">
                                    {/* ⭐ YELLOW STAR: ADDED — CANCELLATION REASON */}
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Cancellation Reason
                                        </label>

                                        <select
                                            value={
                                                cancelEWayBillForm
                                                    .cancelRsnCode
                                            }
                                            onChange={(event) => {
                                                const cancelRsnCode =
                                                    event.target.value;

                                                const selectedReason =
                                                    CANCEL_EWAY_BILL_REASON_OPTIONS.find(
                                                        (option) =>
                                                            option.value ===
                                                            cancelRsnCode
                                                    );

                                                setCancelEWayBillForm(
                                                    (prev: any) => ({
                                                        ...prev,

                                                        cancelRsnCode,

                                                        cancelRmrk:
                                                            selectedReason?.remark ||
                                                            "",
                                                    })
                                                );
                                            }}
                                            disabled={ewayActionLoading}
                                            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        >
                                            {CANCEL_EWAY_BILL_REASON_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* ⭐ YELLOW STAR: ADDED — CANCELLATION REMARK */}
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-card-foreground">
                                            Cancellation Remark
                                        </label>

                                        <textarea
                                            value={
                                                cancelEWayBillForm
                                                    .cancelRmrk
                                            }
                                            onChange={(event) =>
                                                setCancelEWayBillForm(
                                                    (prev: any) => ({
                                                        ...prev,

                                                        cancelRmrk:
                                                            event.target.value,
                                                    })
                                                )
                                            }
                                            disabled={ewayActionLoading}
                                            rows={3}
                                            placeholder="Enter cancellation remark"
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
                                        />
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
                            <button
                                type="button"
                                onClick={
                                    closeEWayBillActionConfirm
                                }
                                disabled={ewayActionLoading}
                                className="h-10 rounded-md border border-border px-4 text-sm font-bold text-card-foreground hover:bg-muted disabled:opacity-60"
                            >
                                No
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleConfirmEWayBillAction
                                }
                                disabled={ewayActionLoading}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                            >
                                {ewayActionLoading && (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                Yes, Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EWayBillList;