
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Coffee,
    CreditCard,
    Droplets,
    Eye,
    Loader2,
    MoreHorizontal,
    Navigation,
    Paperclip,
    Plus,
    Route,
    Save,
    Trash2,
    Truck,
    Upload,
    User,
    Wrench,
    X,
} from "lucide-react";
import { toast } from "react-toastify";

import { SectionCard } from "../../../../components/SectionCards";
import { canChildEditTrip, computeTripExpenseSummary, createEmptyAdvanceEntry, createEmptyBreakdownEntry, createEmptyDieselEntry, createEmptyFoodEntry, createEmptyOtherEntry, createEmptyRunningEntry, createInitialTripExpense, getAllocationVoucher, isTripInProgress, isTripPendingAccept, mapTripAllocationToExpenseForm, mergeTripExpenseForm, toBool, toTripExpensePayload } from "./tripExpenseInitialState";
import { getTripExpensesByVoucherNumber, updateTripExpenses, uploadTripExpensePodFile } from "../../../../redux/slices/professionalSlice/transportation/tripExpensesSlice";
import {
    DRIVER_VEHICLE_STATUS_OPTIONS,
    VEHICLE_STATUS,
    getActiveTripAllocations,
    getVehicleMasterByVoucher,
    getVehicleVoucherFromTripExpense,
    isDriverSelectableStatus,
    readVehicleStatusFromRecord,
    syncAllocationStatusOnComplete,
    updateVehicleMasterStatus,
} from "../../../../redux/slices/professionalSlice/transportation/tripAllocationSlice";
import TripRoutePlannerCard from "./TripRoutePlannerCard";
import { getAllLRCollection } from "../../../../redux/slices/professionalSlice/transportation/tripLRCollectionSlice";
import { formatStatusLabel, todayYMD } from "../../../../utils/helperFunctions";
import professionalAxios from "../../../../services/professionalAxios";
import { sendWhatsAppMessage } from "../../../../redux/slices/professionalSlice/transportation/whatsappSlice";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import {
    getTransportOrderByVoucherNumber,
    updateTransportOrderByVoucherNumber,
} from "../../../../redux/slices/professionalSlice/transportation/transportOrderSlice";
import {
    getAllEWayBill,
    getEWayBillPdfByNumber,
} from "../../../../redux/slices/professionalSlice/transportation/eWayBillSlice";
import { createSalesInvoice } from "../../../../redux/slices/professionalSlice/salesWorkflow/salesInvoiceSlice";
import { addPurchaseInvoice } from "../../../../redux/slices/professionalSlice/purchaseWorkflow/purchaseInvoiceSlice";



/* ===================================================
   CONSTANTS
=================================================== */

const DRIVER_EDITABLE_CATEGORY_KEYS = ["breakdownCost", "pod"];
const TRIP_SALES_PRODUCT_NAME = "Freight By Route";
const TRIP_PURCHASE_PRODUCT_NAME = "Vehicle Hired";
const TRIP_BILLING_UNIT = "NOS";
const TO_BE_BILLED_PAYMENT_TYPE = "To Be Billed";

const SECTION_KEYS = [
    "tripSetup",
    "ewayBill",
    "touchUp",
    "tripSummary",
    "routePlanner",
    "vehicleStatus",
    "advanceReceived",
    "dieselCost",
    "foodCost",
    "runningCost",
    "breakdownCost",
    "otherCost",
    "pod",

];

const createExpandedSectionsState = () =>
    Object.fromEntries(SECTION_KEYS.map((key) => [key, true]));

const CATEGORIES = [
    {
        key: "advanceReceived",
        title: "Advance Received",
        icon: <CreditCard size={18} />,
        factory: createEmptyAdvanceEntry,
    },
    {
        key: "dieselCost",
        title: "Diesel Cost",
        icon: <Droplets size={18} />,
        factory: createEmptyDieselEntry,
    },
    {
        key: "foodCost",
        title: "Food",
        icon: <Coffee size={18} />,
        factory: createEmptyFoodEntry,
    },
    {
        key: "runningCost",
        title: "Running Cost",
        icon: <Navigation size={18} />,
        factory: createEmptyRunningEntry,
    },
    {
        key: "breakdownCost",
        title: "Breakdown Cost",
        icon: <Wrench size={18} />,
        factory: createEmptyBreakdownEntry,
    },
    {
        key: "otherCost",
        title: "Other Cost",
        icon: <MoreHorizontal size={18} />,
        factory: createEmptyOtherEntry,
    },
];

const deliveryStatusOptions = [
    { label: "Pending", value: "pending" },
    { label: "Delivered", value: "delivered" },
    { label: "Partial", value: "partial" },
];

/* ===================================================
   HELPERS
=================================================== */
// ⭐ YELLOW STAR: ADDED — CONVERT SAVED BASE64 PDF TO BLOB
const base64ToPdfBlob = (
    value: string
) => {
    const base64 = String(
        value || ""
    )
        .replace(
            /^data:application\/pdf;base64,/i,
            ""
        )
        .replace(/\s/g, "");

    if (!base64) {
        throw new Error(
            "Saved E-Way Bill PDF is empty"
        );
    }

    const binary =
        window.atob(base64);

    const bytes =
        new Uint8Array(
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
};

const normalizeTripDocKey = (value: any) =>
    String(value || "")
        .trim()
        .toLowerCase();

const getLRTouchUpDocumentUrl = (touchUp: any) => {
    const touchUpLr = touchUp?.touchUpLr;
    return String(
        typeof touchUpLr === "string"
            ? touchUpLr
            : touchUpLr?.fullUrl ||
            touchUpLr?.fileUrl ||
            touchUpLr?.url ||
            touchUpLr?.relativePath ||
            ""
    ).trim();
};

const parseEwayJsonValue = (value: any) => {
    if (!value) return {};

    if (typeof value === "object") {
        return value;
    }

    if (typeof value !== "string") {
        return {};
    }

    try {
        const parsed = JSON.parse(value);

        return typeof parsed === "object" && parsed
            ? parsed
            : {};
    } catch {
        return {};
    }
};

const extractEwayBillRecords = (response: any) => {
    const data = response?.data || response || {};

    const candidates = [
        data?.records,
        data?.items,
        data?.data?.records,
        data?.data?.items,
        data?.data,
        data,
        response?.records,
        response?.items,
    ];

    return candidates.find(Array.isArray) || [];
};

const getEwayBillResponse = (item: any) => {
    if (!item) return {};

    const response =
        parseEwayJsonValue(item?.rawResponse) ||
        parseEwayJsonValue(item?.ewayResponse) ||
        parseEwayJsonValue(item?.response) ||
        {};

    const nestedData = parseEwayJsonValue(response?.data);

    return nestedData?.ewayBillNo ||
        nestedData?.ewbNo ||
        nestedData?.EwbNo
        ? {
            ...response,
            ...nestedData,
        }
        : response;
};

const getEwayBillDetailsFromRecord = (item: any) => {
    if (!item) {
        return {
            ewayBillNo: "",
            ewayBillDate: "",
            validUpto: "",
            status: "",
        };
    }

    const payload =
        item?.ewayPayload ||
        item?.eWayPayload ||
        item?.payload ||
        {};

    const response = getEwayBillResponse(item);

    return {
        ewayBillNo:
            item?.ewayBillNo ||
            item?.ewbNo ||
            item?.EwbNo ||
            response?.ewayBillNo ||
            response?.ewbNo ||
            response?.EwbNo ||
            "",

        ewayBillDate:
            item?.ewayBillDate ||
            response?.ewayBillDate ||
            response?.ewayBillDateString ||
            payload?.docDate ||
            "",

        validUpto:
            item?.validUpto ||
            item?.validUpTo ||
            response?.validUpto ||
            response?.validUpTo ||
            "",

        status:
            item?.status ||
            response?.status ||
            "",
    };
};

const findEwayBillForTrip = (
    records: any[],
    matchKeys: any[] = []
) => {
    const normalizedKeys = new Set(
        matchKeys
            .map(normalizeTripDocKey)
            .filter(Boolean)
    );

    if (!normalizedKeys.size) {
        return null;
    }

    return (
        (Array.isArray(records) ? records : []).find(
            (item: any) => {
                const payload =
                    item?.ewayPayload ||
                    item?.eWayPayload ||
                    item?.payload ||
                    {};

                const possibleValues = [
                    item?.docNo,
                    payload?.docNo,
                    item?.tripNumber,
                    item?.transportOrderNumber,
                    item?.lrNumber,
                    item?.voucherNumber,
                ]
                    .map(normalizeTripDocKey)
                    .filter(Boolean);

                return possibleValues.some(
                    (value) => normalizedKeys.has(value)
                );
            }
        ) || null
    );
};

const getEntryCountLabel = (count: number) =>
    `${count} ${count === 1 ? "Entry" : "Entries"}`;

const unwrapThunk = async (
    dispatch: any,
    action: any
) => {
    const result = await dispatch(action);

    if (
        result?.meta?.requestStatus ===
        "rejected"
    ) {
        throw (
            result?.payload ||
            result?.error || {
                message:
                    "Request failed",
            }
        );
    }

    return (
        result?.payload ??
        result
    );
};

const firstObject = (...values: any[]) => values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};

const extractTransportOrderRecord = (response: any) => firstObject(
    response?.data?.transportOrder,
    response?.data?.record,
    response?.data?.data?.transportOrder,
    response?.data?.data?.record,
    response?.data?.data,
    response?.data,
    response?.transportOrder,
    response?.record,
    response
);

const extractTripRecords = (response: any) => {
    const data = response?.data || response || {};
    const candidates = [data?.records, data?.items, data?.data?.records, data?.data?.items, data?.data, data, response?.records, response?.items];
    return candidates.find(Array.isArray) || [];
};

const extractProductRecords = (response: any) => {
    const data = response?.data || response || {};
    const candidates = [data?.products, data?.records, data?.items, data?.data?.products, data?.data?.records, data?.data?.items, data?.data, data, response?.records, response?.items];
    return candidates.find(Array.isArray) || [];
};

const extractCreatedVoucherNumber = (response: any, key: string) => {
    const visited = new Set<any>();
    const keys = [key, key === "sInvVoucherNumber" ? "salesInvoiceVoucherNumber" : "purchaseInvoiceVoucherNumber", "invoiceVoucherNumber", "voucherNumber", "generatedVoucherNumber"];
    const findVoucher = (value: any, depth = 0): string => {
        if (!value || typeof value !== "object" || depth > 6 || visited.has(value)) return "";
        visited.add(value);
        for (const currentKey of keys) {
            const candidate = value?.[currentKey];
            if (candidate !== undefined && candidate !== null && String(candidate).trim() && String(candidate).trim().toUpperCase() !== "AUTO") return String(candidate).trim();
        }
        for (const nestedValue of Object.values(value)) {
            const voucherNumber = findVoucher(nestedValue, depth + 1);
            if (voucherNumber) return voucherNumber;
        }
        return "";
    };
    return findVoucher(response);
};

const mergeTripExpenseWithInvoiceFields = (value: any) => ({
    ...mergeTripExpenseForm(value),
    salesInvoiceVoucher: value?.salesInvoiceVoucher || "",
    purchaseInvoiceVoucher: value?.purchaseInvoiceVoucher || "",
    invoiceRemark: value?.invoiceRemark || "",
});

const normalizeBillingValue = (value: any) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const normalizeOwnershipType = (value: any) => {
    const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (["owned", "own", "companyowned", "selfowned"].includes(normalized)) return "owned";
    if (["market", "hired", "hire", "marketvehicle", "hiredvehicle", "attached", "vendor", "thirdparty", "outsourced"].includes(normalized)) return "market";
    return "";
};

const toPositiveAmount = (value: any) => {
    const amount = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const resolveFreightAmount = ({ lrEntry, allocation, tripExpense, transportOrder }: any) => {
    const lrAmounts = [lrEntry?.freightAmount, lrEntry?.lrFreightAmount, lrEntry?.totalFreight, lrEntry?.totalFreightAmount, lrEntry?.freightDetails?.freightAmount, lrEntry?.freightDetails?.actualFreight, lrEntry?.freightDetails?.expectedFreight, lrEntry?.freightDetails?.totalFreight, lrEntry?.freightDetails?.totalFreightAmount];
    const allocationAmounts = [allocation?.freightAmount, allocation?.allocationFreightAmount, allocation?.totalFreight, allocation?.totalFreightAmount, allocation?.freightDetails?.freightAmount, allocation?.freightDetails?.actualFreight, allocation?.freightDetails?.expectedFreight, allocation?.freightDetails?.totalFreight, allocation?.transportOrder?.freightDetails?.freightAmount, allocation?.transportOrder?.freightDetails?.actualFreight, allocation?.transportOrder?.freightDetails?.expectedFreight];
    const expenseAmounts = [tripExpense?.freightAmount, tripExpense?.tripFreightAmount, tripExpense?.totalFreight, tripExpense?.totalFreightAmount, tripExpense?.freightDetails?.freightAmount, tripExpense?.freightDetails?.actualFreight, tripExpense?.freightDetails?.expectedFreight, tripExpense?.freightDetails?.totalFreight, tripExpense?.summary?.freightAmount];
    const orderAmounts = [transportOrder?.freightDetails?.freightAmount, transportOrder?.freightDetails?.actualFreight, transportOrder?.freightDetails?.expectedFreight, transportOrder?.expectedFreight];

    return [...lrAmounts, ...allocationAmounts, ...expenseAmounts, ...orderAmounts].map(toPositiveAmount).find((amount) => amount > 0) || 0;
};

const findTripRelatedRecord = (records: any[], matchValues: any[] = []) => {
    const matchKeys = new Set(matchValues.map(normalizeTripDocKey).filter(Boolean));
    if (!matchKeys.size) return null;
    return (records || []).find((item: any) => {
        const values = [item?.tripId, item?.tripNumber, item?.transportOrderNumber, item?.allocationVoucherNumber, item?.tripAllocationVoucherNumber, item?.voucherNumber, item?.lrNumber, item?.lrVoucherNumber, item?.transportOrder?.transportOrderNumber, item?.transportOrder?.voucherNumber, getAllocationVoucher(item)].map(normalizeTripDocKey).filter(Boolean);
        return values.some((value) => matchKeys.has(value));
    }) || null;
};

const resolveTripBillingContext = async ({ dispatch, tripExpense }: any) => {
    const tripId = String(tripExpense?.tripId || "").trim();
    if (!tripId) throw new Error("Trip ID is required for invoice creation");

    // Check payment type first. Non-billed trips must complete without invoice work.
    const orderResponse = await unwrapThunk(dispatch, getTransportOrderByVoucherNumber(tripId));
    const transportOrder = extractTransportOrderRecord(orderResponse);
    if (!transportOrder || !Object.keys(transportOrder).length) throw new Error(`Transport Order ${tripId} was not found`);

    const paymentType = String(transportOrder?.freightDetails?.paymentType || "").trim();
    if (normalizeBillingValue(paymentType) !== normalizeBillingValue(TO_BE_BILLED_PAYMENT_TYPE)) {
        return { shouldBill: false, ownership: "", freightAmount: 0, customerCode: "", customerName: "", vendorCode: "", vendorName: "", tripId };
    }

    // To Be Billed: allocation + LR are required to resolve ownership and freight source.
    const [allocationResponse, lrResponse] = await Promise.all([
        unwrapThunk(dispatch, getActiveTripAllocations({ offset: 0, limit: 500 })),
        unwrapThunk(dispatch, getAllLRCollection({ offset: 0, limit: 500 })),
    ]);

    const allocation = findTripRelatedRecord(extractTripRecords(allocationResponse), [tripId, tripExpense?.allocationVoucherNumber, tripExpense?.tripAllocationVoucherNumber]);
    if (!allocation) throw new Error(`Trip allocation for ${tripId} was not found`);

    const allocationVoucherNumber = String(getAllocationVoucher(allocation) || tripExpense?.allocationVoucherNumber || tripExpense?.tripAllocationVoucherNumber || "").trim();
    const lrEntry = findTripRelatedRecord(extractTripRecords(lrResponse), [tripId, allocationVoucherNumber, tripExpense?.lrNumber, tripExpense?.lrVoucherNumber]) || {};
    const vehicleSelection = allocation?.vehicleSelection || allocation?.vehicle || tripExpense?.vehicleSelection || tripExpense?.vehicle || {};
    const allocationOrder = allocation?.transportOrder || {};
    const ownership = normalizeOwnershipType(vehicleSelection?.ownershipType || allocation?.ownershipType || tripExpense?.ownershipType);
   const freightAmount = Number(resolveFreightAmount({ lrEntry, allocation, tripExpense, transportOrder }) || 0);
    const customerCode = String(allocationOrder?.customerCode || allocationOrder?.customerDetails?.customerCode || transportOrder?.customerCode || transportOrder?.customerDetails?.customerCode || transportOrder?.customer?.code || vehicleSelection?.customerCode || tripExpense?.customerCode || "").trim();
    const customerName = String(allocationOrder?.customerName || allocationOrder?.customerDetails?.customerName || transportOrder?.customerName || transportOrder?.customerDetails?.customerName || transportOrder?.customer?.name || vehicleSelection?.customerName || tripExpense?.customerName || "").trim();
    const vendorCode = String(vehicleSelection?.vendorCode || vehicleSelection?.vendor?.code || allocation?.vendorCode || allocation?.vendor?.code || tripExpense?.vendorCode || "").trim();
    const vendorName = String(vehicleSelection?.vendorName || vehicleSelection?.vendor?.name || allocation?.vendorName || allocation?.vendor?.name || tripExpense?.vendorName || "").trim();

    return { shouldBill: true, ownership, freightAmount, customerCode, customerName, vendorCode, vendorName, tripId };
};

const ensureServiceProduct = async ({ productName }: any) => {
    const response = await professionalAxios.get("/eTaxSolnMongoApiBackend/productMaster/getAllProduct", { params: { offset: 0, limit: 200, search: productName } });
    const normalizedName = String(productName || "").trim().toLowerCase();
    const product = extractProductRecords(response?.data).find((item: any) => String(item?.productName || item?.name || "").trim().toLowerCase() === normalizedName);
    if (!product) throw new Error(`Product "${productName}" not found in Product Master. Add it before completing the trip.`);

    const productCode = String(product?.productCode || product?.code || product?.accountCode || product?.voucherNumber || "").trim();
    if (!productCode) throw new Error(`Product code is missing for "${productName}"`);

    return {
        productCode,
        productName: String(product?.productName || product?.name || productName).trim(),
        productType: String(product?.productType || product?.dynamicFields?.productType || "serviceproduct").trim() || "serviceproduct",
        productDescription: String(product?.productDescription || product?.description || product?.dynamicFields?.productDescription || product?.productName || productName).trim(),
        productHSNCode: String(product?.productHSNCode || product?.hsnCode || product?.hsnSacCode || product?.dynamicFields?.productHSNCode || "").trim(),
        sellingPrice: toPositiveAmount(product?.sellingPrice || product?.salePrice || product?.salesPrice || product?.productSellingPrice || product?.dynamicFields?.sellingPrice || product?.dynamicFields?.salePrice || product?.dynamicFields?.salesPrice || product?.dynamicFields?.productSellingPrice),
        uom: String(product?.uom || product?.unit || product?.dynamicFields?.unit || TRIP_BILLING_UNIT).trim() || TRIP_BILLING_UNIT,
    };
};

const formatInvoiceAmount = (value: any) => Number(value || 0).toFixed(2);

const buildInvoiceLine = ({ product, freightAmount }: any) => ({
    productCode: product.productCode,
    productName: product.productName,
    productType: product.productType,
    productDescription: product.productDescription || product.productName,
    description: product.productDescription || product.productName,
    productHSNCode: product.productHSNCode,
    remarks: "",
    quantity: "1",
    unit: TRIP_BILLING_UNIT,
    uom: TRIP_BILLING_UNIT,
    unitName: TRIP_BILLING_UNIT,
    rate: formatInvoiceAmount(freightAmount),
    gross: formatInvoiceAmount(freightAmount),
    grossAmount: formatInvoiceAmount(freightAmount),
    discount: "0",
    discountPercentage: "0",
    discountAmount: "0.00",
    taxableAmount: formatInvoiceAmount(freightAmount),
    cgst: "0",
    cgstPercentage: "0",
    cgstAmount: "0.00",
    sgst: "0",
    sgstPercentage: "0",
    sgstAmount: "0.00",
    igst: "0",
    igstPercentage: "0",
    igstAmount: "0.00",
    taxAmount: "0.00",
    otherAmount: "0.00",
    netAmount: formatInvoiceAmount(freightAmount),
    netTotal: formatInvoiceAmount(freightAmount),
    customMasters: {},
});

const buildInvoiceFooter = (freightAmount: number) => ({ grossAmount: formatInvoiceAmount(freightAmount), discountAmount: "0.00", cgstAmount: "0.00", sgstAmount: "0.00", igstAmount: "0.00", taxAmount: "0.00", otherAmount: "0.00", netAmount: formatInvoiceAmount(freightAmount), adjustedAmount: "0", balanceAmount: formatInvoiceAmount(freightAmount), totalQuantity: 1, totalGrossAmount: formatInvoiceAmount(freightAmount), totalDiscountAmount: "0.00", totalCgstAmount: "0.00", totalSgstAmount: "0.00", totalIgstAmount: "0.00", totalTaxAmount: "0.00", totalOtherAmount: "0.00", totalNetAmount: formatInvoiceAmount(freightAmount) });

const createTripSalesInvoice = async ({ dispatch, context, product }: any) => {
    const remark = `Auto from trip ${context.tripId}`;
    const payload = {
        sInvVoucherNumber: "AUTO",
        sInvVoucherDate: todayYMD(),
        sInvCustomerCode: context.customerCode,
        sInvCustomerName: context.customerName,
        sInvSalesAccount: "SA021",
        sInvStatus: "open",
        sInvRemark: remark,
        sInvRemarks: remark,
        isAutoPost: false,
        customMasters: {},
        sInvBody: [buildInvoiceLine({ product, freightAmount: context.freightAmount })],
        sInvFooter: buildInvoiceFooter(context.freightAmount),
    };
    const response = await unwrapThunk(dispatch, createSalesInvoice({ payload }));
    const voucherNumber = extractCreatedVoucherNumber(response, "sInvVoucherNumber");
    if (!voucherNumber) throw new Error("Sales invoice was created but voucher number was not returned");
    return voucherNumber;
};

const createTripPurchaseInvoice = async ({ dispatch, context, product }: any) => {
    const remark = `Auto from trip ${context.tripId}`;
    const payload = {
        pInvVoucherNumber: "AUTO",
        pInvVoucherDate: todayYMD(),
        pInvVendorCode: context.vendorCode,
        pInvVendorName: context.vendorName,
        pInvPurAccount: "SA003",
        pInvStatus: "open",
        pInvRemark: remark,
        isAutoPost: false,
        customMasters: {},
        pInvBody: [buildInvoiceLine({ product, freightAmount: context.freightAmount })],
        pInvFooter: buildInvoiceFooter(context.freightAmount),
    };
    const response = await unwrapThunk(dispatch, addPurchaseInvoice({ payload }));
    const voucherNumber = extractCreatedVoucherNumber(response, "pInvVoucherNumber");
    if (!voucherNumber) throw new Error("Purchase invoice was created but voucher number was not returned");
    return voucherNumber;
};

const createInvoiceForCompletedTrip = async ({ dispatch, tripExpense }: any) => {
    const existingSalesVoucher = String(tripExpense?.salesInvoiceVoucher || "").trim();
    const existingPurchaseVoucher = String(tripExpense?.purchaseInvoiceVoucher || "").trim();
    if (existingSalesVoucher) return { invoiceType: "sales", voucherNumber: existingSalesVoucher, alreadyCreated: true };
    if (existingPurchaseVoucher) return { invoiceType: "purchase", voucherNumber: existingPurchaseVoucher, alreadyCreated: true };

    const context = await resolveTripBillingContext({ dispatch, tripExpense });
    if (!context.shouldBill) return null;

    if (context.ownership === "owned") {
        if (!context.customerCode || !context.customerName) throw new Error(`Customer is required to create the Sales Invoice for trip ${context.tripId}`);
        const product = await ensureServiceProduct({ productName: TRIP_SALES_PRODUCT_NAME });
        const invoiceContext = { ...context, freightAmount: context.freightAmount > 0 ? context.freightAmount : product.sellingPrice || 0 };
        const voucherNumber = await createTripSalesInvoice({ dispatch, context: invoiceContext, product });
        return { invoiceType: "sales", voucherNumber, alreadyCreated: false };
    }

    if (context.ownership === "market") {
        if (!context.vendorCode || !context.vendorName) throw new Error(`Vendor is required to create the Purchase Invoice for trip ${context.tripId}`);
        const product = await ensureServiceProduct({ productName: TRIP_PURCHASE_PRODUCT_NAME });
        const invoiceContext = { ...context, freightAmount: context.freightAmount > 0 ? context.freightAmount : product.sellingPrice || 0 };
        const voucherNumber = await createTripPurchaseInvoice({ dispatch, context: invoiceContext, product });
        return { invoiceType: "purchase", voucherNumber, alreadyCreated: false };
    }

    throw new Error(`Vehicle ownership type must be Owned or Hired/Market for trip ${context.tripId}`);
};

const formatIndianNumber = (value: any) =>
    Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });

const toDateInputValue = (value: any) => {
    if (!value) return "";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return "";

    return d.toISOString().slice(0, 10);
};

const toDateTimeInputValue = (value: any) => {
    if (!value) return "";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return "";

    const pad = (n: number) => String(n).padStart(2, "0");

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const dateTimeInputToIso = (value: string) =>
    value ? new Date(value).toISOString() : "";

const formatTripDate = (value: any) => {
    if (!value) return "-";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return "-";

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (value: any) => {
    if (!value) return "-";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) return "-";

    return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};


const inputClass =
    "h-10 w-full rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-primary dark:[color-scheme:dark] disabled:cursor-not-allowed disabled:opacity-60";

const textareaClass =
    "min-h-[90px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60";


const safeJsonParse = (value: any) => {
    try {
        if (!value) return null;
        if (typeof value === "object") return value;
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const cleanMobile = (value: any) =>
    String(value || "")
        .replace(/"/g, "")
        .trim();

const getProfessionalUserFromLocalStorage = () => {
    const localProfessionalUser =
        safeJsonParse(localStorage.getItem("professionalUser")) || {};

    return (
        localProfessionalUser?.ChildUsers ||
        localProfessionalUser?.data?.ChildUsers ||
        localProfessionalUser?.data?.childUser ||
        localProfessionalUser?.data?.user ||
        localProfessionalUser?.user ||
        localProfessionalUser
    );
};

const extractAccountRecords = (response: any) => {
    const data = response?.data || response || {};
    const candidates = [data?.accounts, data?.records, data?.items, data?.data?.accounts, data?.data?.records, data?.data?.items, data?.data, data];
    return candidates.find(Array.isArray) || [];
};

const buildAccountOptions = (records: any[]) => (records || []).map((account: any) => {
    const value = String(account?.accountCode || account?.code || "").trim();
    const name = String(account?.accountName || account?.name || "").trim();
    return { value, label: name || value };
}).filter((option: any) => option.value);

const Field = ({ label, mandatory = false, children, className = "" }: any) => (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
        <span className="text-sm font-medium text-card-foreground">
            {label}
            {mandatory && <span className="text-danger">*</span>}
        </span>

        {children}
    </label>
);

const SelectInput = ({ value, onChange, options, disabled = false, placeholder = "Select" }: any) => (
    <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={inputClass}
    >
        <option value="">{placeholder}</option>

        {options.map((opt: any) => (
            <option key={opt.value} value={opt.value}>
                {opt.label}
            </option>
        ))}
    </select>
);

const SummaryBox = ({ title, value, danger = false }: any) => {
    const amount = Number(value || 0);

    return (
        <div
            className={`flex min-w-0 items-center justify-between gap-3 rounded-md border bg-muted/30 p-3 ${danger ? "border-success/30" : "border-border"
                }`}
        >
            <p className="truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {title}
            </p>

            <p
                className={`whitespace-nowrap text-xl font-black ${danger ? "text-success" : "text-card-foreground"
                    }`}
            >
                ₹{formatIndianNumber(amount)}
            </p>
        </div>
    );
};
/* ===================================================
   CATEGORY DETAILS
=================================================== */

const CategoryDetails = ({ category, form, setForm, readOnly, vendorAccountOptions = [], expenseAccountOptions = [] }: any) => {
    const entries = form.expenses?.[category.key]?.entries || [];
    const getAccountOptions = (options: any[], value: any) => {
        const currentValue = String(value || "").trim();
        return !currentValue || options.some((option: any) => String(option.value) === currentValue) ? options : [{ value: currentValue, label: currentValue }, ...options];
    };

    const patchEntry = (index: number, patch: any) => {
        if (readOnly) return;

        setForm((prev: any) => {
            const nextEntries = [...(prev.expenses?.[category.key]?.entries || [])];

            nextEntries[index] = {
                ...nextEntries[index],
                ...patch,
            };

            return {
                ...prev,
                expenses: {
                    ...prev.expenses,
                    [category.key]: {
                        ...prev.expenses?.[category.key],
                        entries: nextEntries,
                    },
                },
            };
        });
    };

    const addEntry = () => {
        if (readOnly) return;

        setForm((prev: any) => ({
            ...prev,
            expenses: {
                ...prev.expenses,
                [category.key]: {
                    ...prev.expenses?.[category.key],
                    entries: [
                        ...(prev.expenses?.[category.key]?.entries || []),
                        category.factory(),
                    ],
                },
            },
        }));
    };

    const removeEntry = (index: number) => {
        if (readOnly) return;

        setForm((prev: any) => ({
            ...prev,
            expenses: {
                ...prev.expenses,
                [category.key]: {
                    ...prev.expenses?.[category.key],
                    entries: (prev.expenses?.[category.key]?.entries || []).filter(
                        (_: any, i: number) => i !== index
                    ),
                },
            },
        }));
    };

    const renderShortFields = (entry: any, index: number) => {
        switch (category.key) {
            case "advanceReceived":
                return (
                    <div className="grid grid-cols-3 gap-4 md:grid-cols-3 xl:grid-cols-3">
                        <Field label="Date">
                            <input
                                disabled={readOnly}
                                type="datetime-local"
                                className={inputClass}
                                value={toDateTimeInputValue(entry.date || entry.receivedDate)}
                                onChange={(e) =>
                                    patchEntry(index, {
                                        date: dateTimeInputToIso(e.target.value),
                                    })
                                }
                            />
                        </Field>
                        <Field label="Source">
                            <input
                                disabled={readOnly}
                                className={inputClass}
                                value={entry.sourceName || ""}
                                onChange={(e) =>
                                    patchEntry(index, { sourceName: e.target.value })
                                }
                            />
                        </Field>

                        <Field label="Amount">
                            <input
                                disabled={readOnly}
                                type="number"
                                className={inputClass}
                                value={entry.amount ?? ""}
                                onChange={(e) => patchEntry(index, { amount: e.target.value })}
                            />
                        </Field>

                        {/* <Field label="Payment Mode">
                            <input
                                disabled={readOnly}
                                className={inputClass}
                                value={entry.paymentMode || ""}
                                onChange={(e) =>
                                    patchEntry(index, { paymentMode: e.target.value })
                                }
                            />
                        </Field> */}
                    </div>
                );

            case "dieselCost":
                return (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                        <Field label="Date">
                            <input
                                disabled={readOnly}
                                type="datetime-local"
                                className={inputClass}
                                value={toDateTimeInputValue(entry.date || entry.receivedDate)}
                                onChange={(e) =>
                                    patchEntry(index, {
                                        date: dateTimeInputToIso(e.target.value),
                                    })
                                }
                            />
                        </Field>
                        <Field label="Fuel Station">
                            <SelectInput
                                disabled={readOnly}
                                value={entry.fuelStation || ""}
                                options={getAccountOptions(vendorAccountOptions, entry.fuelStation)}
                                placeholder="Select Fuel Station"
                                onChange={(value: string) => patchEntry(index, { fuelStation: value })}
                            />
                        </Field>

                        <Field label="Amount">
                            <input
                                disabled={readOnly}
                                type="number"
                                className={inputClass}
                                value={entry.amount ?? ""}
                                onChange={(e) => patchEntry(index, { amount: e.target.value })}
                            />
                        </Field>

                        {/* <Field label="Liters">
                            <input
                                disabled={readOnly}
                                type="number"
                                className={inputClass}
                                value={entry.liters ?? ""}
                                onChange={(e) => patchEntry(index, { liters: e.target.value })}
                            />
                        </Field> */}

                        <Field label="Odometer">
                            <input
                                disabled={readOnly}
                                type="number"
                                className={inputClass}
                                value={entry.odometerReading ?? ""}
                                onChange={(e) =>
                                    patchEntry(index, { odometerReading: e.target.value })
                                }
                            />
                        </Field>
                    </div>
                );

            case "foodCost":
            case "runningCost":
            case "breakdownCost":
            case "otherCost": {
                const typeKey =
                    category.key === "foodCost"
                        ? "mealType"
                        : category.key === "breakdownCost"
                            ? "issueType"
                            : "expenseType";

                const typeLabel =
                    category.key === "foodCost"
                        ? "Meal Type"
                        : category.key === "breakdownCost"
                            ? "Issue Type"
                            : "Expense Type";

                return (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

                        <Field label="Date">
                            <input
                                disabled={readOnly}
                                type="datetime-local"
                                className={inputClass}
                                value={toDateTimeInputValue(entry.date || entry.receivedDate)}
                                onChange={(e) =>
                                    patchEntry(index, {
                                        date: dateTimeInputToIso(e.target.value),
                                    })
                                }
                            />
                        </Field>
                        <Field label={typeLabel}>
                            {typeLabel === "Expense Type" ? (
                                <SelectInput disabled={readOnly} value={entry[typeKey] || ""} options={getAccountOptions(expenseAccountOptions, entry[typeKey])} placeholder={`Select ${typeLabel}`} onChange={(value: string) => patchEntry(index, { [typeKey]: value })} />
                            ) : (
                                <input disabled={readOnly} className={inputClass} value={entry[typeKey] || ""} onChange={(e) => patchEntry(index, { [typeKey]: e.target.value })} />
                            )}
                        </Field>

                        <Field label="Amount">
                            <input
                                disabled={readOnly}
                                type="number"
                                className={inputClass}
                                value={entry.amount ?? ""}
                                onChange={(e) => patchEntry(index, { amount: e.target.value })}
                            />
                        </Field>

                        {/* <Field label="Location / Remarks">
                            <input
                                disabled={readOnly}
                                className={inputClass}
                                value={entry.location || entry.remarks || ""}
                                onChange={(e) =>
                                    patchEntry(
                                        index,
                                        category.key === "otherCost"
                                            ? { remarks: e.target.value }
                                            : { location: e.target.value }
                                    )
                                }
                            />
                        </Field> */}
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div className="md:col-span-2 xl:col-span-3">
            <div className="flex flex-col gap-3">
                {entries.map((entry: any, index: number) => (
                    <div
                        key={`${category.key}-${index}`}
                        className="rounded-md border border-border bg-muted/30 p-3"
                    >
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold text-card-foreground">
                                Entry {index + 1}
                            </h3>

                            {!readOnly && entries.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeEntry(index)}
                                    className="rounded-md p-2 text-danger transition hover:bg-danger/10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        {/* <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <Field label="Date">
                                <input
                                    disabled={readOnly}
                                    type="datetime-local"
                                    className={inputClass}
                                    value={toDateTimeInputValue(entry.date || entry.receivedDate)}
                                    onChange={(e) =>
                                        patchEntry(index, {
                                            date: dateTimeInputToIso(e.target.value),
                                        })
                                    }
                                />
                            </Field>
                        </div> */}

                        {renderShortFields(entry, index)}
                    </div>
                ))}

                {!readOnly && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={addEntry}
                            className="inline-flex h-8 w-auto items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/15"
                        >
                            <Plus size={14} />
                            Add Entry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ===================================================
   POD DETAILS
=================================================== */

const PodDetails = ({ form, setForm, readOnly }: any) => {
    const dispatch = useDispatch<any>();
    const [uploadingField, setUploadingField] = useState("");

    const patchPod = (patch: any) => {
        if (readOnly) return;

        setForm((prev: any) => ({
            ...prev,
            pod: {
                ...prev.pod,
                ...patch,
            },
        }));
    };

    const uploadFile = async (field: string, file: File) => {
        try {
            setUploadingField(field);

            const formData = new FormData();

            formData.append("file", file);
            formData.append("field", field);
            formData.append("tripId", form.tripId || "trip");

            const res = await unwrapThunk(
                dispatch,
                uploadTripExpensePodFile(formData)
            );

            const uploadedName =
                res?.file ||
                res?.filename ||
                res?.url ||
                res?.path ||
                res?.filePath ||
                res?.data?.fileName ||
                res?.data?.filename ||
                res?.data?.url ||
                res?.data?.path ||
                res?.data?.filePath ||
                file.name;

            const patch: any = {
                [field]: uploadedName,
            };

            const deliveryStatus = String(form.pod?.deliveryStatus || "")
                .trim()
                .toLowerCase();

            if (deliveryStatus === "delivered" || deliveryStatus === "partial") {
                patch.submittedAt = form.pod?.submittedAt || new Date().toISOString();
            }

            patchPod(patch);

            toast.success("POD file uploaded");
        } catch (e: any) {
            toast.error(e?.message || "Upload failed");
        } finally {
            setUploadingField("");
        }
    };

    const MediaRow = ({ label, field, accept }: any) => (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/30 p-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
                <p className="text-sm font-bold text-card-foreground">{label}</p>

                <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                    {form.pod?.[field] || "Not attached"}
                </p>
            </div>

            {!readOnly && (
                <div className="flex items-center gap-2">
                    {form.pod?.[field] && (
                        <button
                            type="button"
                            onClick={() => patchPod({ [field]: "" })}
                            className="rounded-md border border-border bg-card p-2 text-muted-foreground transition hover:bg-muted"
                        >
                            <X size={15} />
                        </button>
                    )}

                    <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/15">
                        {uploadingField === field ? (
                            <Loader2 className="animate-spin" size={14} />
                        ) : (
                            <Upload size={14} />
                        )}
                        Attach
                        <input
                            hidden
                            type="file"
                            accept={accept}
                            disabled={!!uploadingField}
                            onChange={(e) =>
                                e.target.files?.[0] && uploadFile(field, e.target.files[0])
                            }
                        />
                    </label>
                </div>
            )}
        </div>
    );

    return (
        <div className="md:col-span-2 xl:col-span-3">
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="Delivery Status">
                        <SelectInput
                            disabled={readOnly}
                            value={form.pod?.deliveryStatus}
                            options={deliveryStatusOptions}
                            onChange={(v: any) => {
                                const nextStatus = String(v || '').trim().toLowerCase();

                                const isReadyToComplete =
                                    nextStatus === 'delivered' || nextStatus === 'partial';

                                patchPod({
                                    deliveryStatus: nextStatus,
                                    submittedAt: isReadyToComplete
                                        ? form.pod.submittedAt || new Date().toISOString()
                                        : '',
                                });
                            }}
                        />
                    </Field>

                    <Field label="Receiver Name">
                        <input
                            disabled={readOnly}
                            className={inputClass}
                            value={form.pod?.receiverName || ""}
                            onChange={(e) => patchPod({ receiverName: e.target.value })}
                        />
                    </Field>

                    <Field label="Receiver Mobile">
                        <input
                            disabled={readOnly}
                            className={inputClass}
                            value={form.pod?.receiverMobile || ""}
                            onChange={(e) => patchPod({ receiverMobile: e.target.value })}
                        />
                    </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <MediaRow
                        label="POD Document"
                        field="podDocument"
                        accept="application/pdf,image/*"
                    />

                    <MediaRow
                        label="Delivery Photo"
                        field="deliveryPhoto"
                        accept="image/*"
                    />
                </div>

                <Field label="POD Remarks">
                    <textarea
                        disabled={readOnly}
                        className={textareaClass}
                        value={form.pod?.remarks || ""}
                        onChange={(e) => patchPod({ remarks: e.target.value })}
                    />
                </Field>

                {form.pod?.submittedAt && (
                    <p className="text-xs font-bold text-success">
                        Submitted: {formatDateTime(form.pod.submittedAt)}
                    </p>
                )}
            </div>
        </div>
    );
};

/* ===================================================
   CREATE / EDIT TRIP EXPENSE
=================================================== */

const CreateEditTripExpence = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const location = useLocation();

    const routeState: any = location.state || {};

    const authUser = useSelector((s: any) => s?.auth?.user);
    const params = useParams();
    const voucherNumber =
        routeState?.voucherNumber ||
        params?.voucherNumber ||
        "";

    const mode = routeState?.mode || (voucherNumber ? "edit" : "add");
    const isEdit = Boolean(voucherNumber) || mode === "edit";

    const professionalUserLocal = useMemo(() => {
        return getProfessionalUserFromLocalStorage();
    }, []);

    const professionalHeaders = useMemo(() => {
        return safeJsonParse(localStorage.getItem("professionalHeaders")) || {};
    }, []);

    const currentUserMobile = useMemo(() => {
        return cleanMobile(
            authUser?.userMobileNumberHash ||
            authUser?.userMobileNumber ||
            authUser?.mobileNumber ||
            professionalHeaders?.loginuser ||
            professionalHeaders?.loginUser ||
            localStorage.getItem("loginuser") ||
            localStorage.getItem("loginUser") ||
            localStorage.getItem("userMobileNumberHash") ||
            professionalUserLocal?.userMobileNumberHash ||
            professionalUserLocal?.userMobileNumber ||
            professionalUserLocal?.mobileNumber
        );
    }, [authUser, professionalHeaders, professionalUserLocal]);

    const parentUserMobile = useMemo(() => {
        return cleanMobile(
            professionalUserLocal?.parentUserMobileNumber ||
            professionalUserLocal?.parentUserMobileNumberHash ||
            authUser?.parentUserMobileNumber ||
            authUser?.parentUserMobileNumberHash ||
            professionalHeaders?.["x-db-name"] ||
            professionalHeaders?.parentUserMobileNumber ||
            localStorage.getItem("parentUserMobileNumber") ||
            localStorage.getItem("parentUserMobileNumberHash")
        );
    }, [authUser, professionalHeaders, professionalUserLocal]);

    const user = useMemo(
        () => ({
            ...(authUser || {}),
            ...(professionalUserLocal || {}),
            userMobileNumberHash: currentUserMobile,
            parentUserMobileNumber: parentUserMobile,
        }),
        [authUser, professionalUserLocal, currentUserMobile, parentUserMobile]
    );

    const isChildUser = useMemo(() => {
        if (!currentUserMobile) return false;

        const userType = String(
            user?.userType ||
            user?.type ||
            user?.role ||
            user?.userRole ||
            ""
        ).toLowerCase();

        const isCompanyOrParent =
            userType.includes("company") || currentUserMobile === parentUserMobile;

        if (isCompanyOrParent) return false;

        return Boolean(parentUserMobile && currentUserMobile !== parentUserMobile);
    }, [currentUserMobile, parentUserMobile, user]);

    const [form, setForm] = useState<any>(createInitialTripExpense());
    const [loading, setLoading] = useState(false);
    const [completeConfirmModalVisible, setCompleteConfirmModalVisible] = useState(false);

    const [ewayPdfUrl, setEwayPdfUrl] = useState("");
    // @ts-ignore
    const [ewayBillLoading, setEwayBillLoading] = useState(false);
    // @ts-ignore
    const [ewayPdfModalVisible, setEwayPdfModalVisible] = useState(false);
    const [ewayPdfLoading, setEwayPdfLoading] = useState(false);
    const [expandedSections, setExpandedSections] = useState<any>(
        createExpandedSectionsState
    );


    const [allocations, setAllocations] = useState<any[]>([]);
    const [allocationsLoading, setAllocationsLoading] = useState(false);
    const [selectedAllocationVoucher, setSelectedAllocationVoucher] = useState("");

    const serverExpenseRef = useRef<any>(null);
    const parentStartedPromptRef = useRef(new Set<string>());
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [vendorAccountOptions, setVendorAccountOptions] = useState<any[]>([]);
    const [expenseAccountOptions, setExpenseAccountOptions] = useState<any[]>([]);
    // TOUCH UPS - DISPLAY ONLY
    const [touchUps, setTouchUps] = useState<any[]>([]);

    const visibleCategories = useMemo(() => {
        if (!isChildUser) return CATEGORIES;

        return CATEGORIES.filter((category) =>
            DRIVER_EDITABLE_CATEGORY_KEYS.includes(category.key)
        );
    }, [isChildUser]);

    const readOnly = isChildUser && !canChildEditTrip(form);

    useEffect(() => {
        return () => {
            if (ewayPdfUrl) {
                URL.revokeObjectURL(ewayPdfUrl);
            }
        };
    }, [ewayPdfUrl]);

    const pageTitle =
        routeState?.title || (isEdit ? "Edit Trip Expense" : "Create Trip Expense");

    const pageDescription =
        routeState?.description ||
        (isEdit
            ? "Update trip expense details, POD, and route-wise trip records."
            : "Create trip expense, start trips, record advance, diesel, food, running, breakdown, other costs, and POD.");

    const summary = useMemo(() => computeTripExpenseSummary(form), [form]);

    const startOdometer = useMemo(() => {
        if (form.startOdometer) return form.startOdometer;

        const dieselEntries = form.expenses?.dieselCost?.entries || [];
        const first = dieselEntries.find((e: any) => e?.odometerReading);

        return first?.odometerReading || "";
    }, [form.startOdometer, form.expenses?.dieselCost?.entries]);

    const endOdometer = form.endOdometer || "";

    const podDeliveryStatus = String(form.pod?.deliveryStatus || "pending")
        .trim()
        .toLowerCase();

    const isPodReadyToComplete =
        podDeliveryStatus === "delivered" || podDeliveryStatus === "partial";

    const tripStatusNormalized = String(form.tripStatus || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

    const isTripReadyForComplete = tripStatusNormalized === "in_progress";

    const isDriverAccepted = toBool(form.driverAccepted);

    // ORIGINAL: only the driver could complete the trip.
    // const showCompleteTripButton =
    //     isEdit &&
    //     isChildUser &&
    //     isTripReadyForComplete &&
    //     isDriverAccepted &&
    //     isPodReadyToComplete;

    // NEW: parent can also complete; driver must still accept before completing.
    const showCompleteTripButton =
        isEdit &&
        isTripReadyForComplete &&
        isPodReadyToComplete &&
        (!isChildUser || isDriverAccepted);

    const vehicleVoucher = useMemo(
        () => getVehicleVoucherFromTripExpense(form),
        [form]
    );

    const showVehicleStatusDropdown = useMemo(
        () => isTripInProgress(form) && Boolean(vehicleVoucher),
        [form, vehicleVoucher]
    );




    const driverAccepted = toBool(form.driverAccepted);
    const tripStatusLower = String(form.tripStatus || "").toLowerCase();
    const isCompletedTrip = tripStatusLower === "completed";

    const showAcceptTripButton =
        isEdit &&
        isChildUser &&
        !isCompletedTrip &&
        !driverAccepted;

    // const showCompleteTripButton =
    //     isEdit &&
    //     isChildUser &&
    //     isTripInProgress(form) &&
    //     driverAccepted &&
    //     !isPodPending;

    /* ===================================================
       LOAD DATA
    =================================================== */

    const hydrateVehicleStatus = useCallback(async (expenseForm: any) => {
        const voucher = getVehicleVoucherFromTripExpense(expenseForm);

        if (!voucher) return expenseForm;

        try {
            const record = await getVehicleMasterByVoucher(voucher);
            const masterStatus = readVehicleStatusFromRecord(record);
            const dropdownValue = isDriverSelectableStatus(masterStatus)
                ? masterStatus
                : expenseForm.vehicleCurrentStatus || "";

            return {
                ...expenseForm,
                vehicleCurrentStatus: dropdownValue,
            };
        } catch {
            return expenseForm;
        }
    }, []);

    const loadExpense = useCallback(async () => {
        if (!isEdit) return;

        const passedData = routeState?.expenseData;

        if (passedData) {
            const merged = mergeTripExpenseWithInvoiceFields(passedData);
            const hydrated = await hydrateVehicleStatus(merged);

            serverExpenseRef.current = hydrated;

            setForm(hydrated);

            return;
        }

        if (!voucherNumber) return;

        try {
            setLoading(true);

            const res = await unwrapThunk(
                dispatch,
                getTripExpensesByVoucherNumber(voucherNumber)
            );

            const merged = mergeTripExpenseWithInvoiceFields(res?.data || res);
            const hydrated = await hydrateVehicleStatus(merged);

            serverExpenseRef.current = hydrated;

            setForm(hydrated);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load trip expense");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    }, [dispatch, hydrateVehicleStatus, isEdit, navigate, routeState?.expenseData, voucherNumber]);

    const loadAllocations = useCallback(async () => {
        if (isEdit) return;

        try {
            setAllocationsLoading(true);

            const res = await unwrapThunk(
                dispatch,
                getActiveTripAllocations({
                    limit: 100,
                    offset: 0,
                })
            );

            const list =
                res?.data?.records || res?.data?.data || res?.records || res?.data || [];

            const active = (Array.isArray(list) ? list : []).filter((item: any) => {
                const status = String(item?.tripStatus || item?.status || "assigned").toLowerCase();

                return status !== "cancelled";
            });

            setAllocations(active);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load trip allocations");
        } finally {
            setAllocationsLoading(false);
        }
    }, [dispatch, isEdit]);

    useEffect(() => {
        loadExpense();
    }, [loadExpense]);

    useEffect(() => {
        loadAllocations();
    }, [loadAllocations]);

    useEffect(() => {
        let active = true;
        const loadAccountOptions = async () => {
            const [vendorResponse, expenseResponse] = await Promise.all([
                dispatch(getAllAccounts({ accountType: "vendor", limit: 500, offset: 0 })).unwrap().catch(() => null),
                dispatch(getAllAccounts({ accountType: "expense", limit: 500, offset: 0 })).unwrap().catch(() => null),
            ]);
            if (!active) return;
            setVendorAccountOptions(buildAccountOptions(extractAccountRecords(vendorResponse)));
            setExpenseAccountOptions(buildAccountOptions(extractAccountRecords(expenseResponse)));
        };
        loadAccountOptions();
        return () => {
            active = false;
        };
    }, [dispatch]);

    useEffect(() => {
        if (!isEdit && isChildUser) {
            toast.error("Trips are assigned by parent. Please edit an assigned trip only.");
            navigate(-1);
        }
    }, [isEdit, isChildUser, navigate]);

    const showParentStartedPopup = useCallback(
        (expenseForm: any) => {
            if (!isChildUser || !isEdit || !voucherNumber) return;

            const promptKey = `${voucherNumber || expenseForm.tripId}::${expenseForm.enteredDate || ""}`;

            if (parentStartedPromptRef.current.has(promptKey)) return;
            parentStartedPromptRef.current.add(promptKey);

            const tripLabel = expenseForm.tripId || voucherNumber || "this trip";
            const message =
                expenseForm.notificationMessage ||
                `Your parent has started trip ${tripLabel}. You can now enter expenses.`;

            const confirmed = window.confirm(message);

            if (!confirmed) return;

            (async () => {
                try {
                    setLoading(true);

                    const payload = toTripExpensePayload(expenseForm, {
                        tripStatus: "in_progress",
                        driverAccepted: true,
                        acceptedAt: new Date().toISOString(),
                        enteredBy: "driver",
                    });

                    await unwrapThunk(
                        dispatch,
                        updateTripExpenses({
                            voucherNumber,
                            payload,
                        })
                    );

                    setForm(mergeTripExpenseWithInvoiceFields(payload));
                    toast.success("Trip started. You can enter expenses now.");
                } catch (e: any) {
                    toast.error(e?.message || "Failed to acknowledge trip start");
                } finally {
                    setLoading(false);
                }
            })();
        },
        [dispatch, isChildUser, isEdit, voucherNumber]
    );

    useEffect(() => {
        if (!isEdit || !isChildUser) return;

        if (
            isTripInProgress(form) &&
            !form.driverAccepted &&
            (form.notificationType === "trip_started_by_parent" ||
                form.enteredBy === "dispatcher")
        ) {
            showParentStartedPopup(form);
        }
    }, [form, isChildUser, isEdit, showParentStartedPopup]);

    /* ===================================================
       FORM HANDLERS
    =================================================== */

    const toggleSection = (sectionKey: string) => {
        setExpandedSections((prev: any) => ({
            ...prev,
            [sectionKey]: !prev[sectionKey],
        }));
    };

    const patchHeader = (patch: any) => {
        setForm((prev: any) => ({
            ...prev,
            ...patch,
        }));
    };

    const patchNested = (key: string, patch: any) => {
        setForm((prev: any) => ({
            ...prev,
            [key]: {
                ...prev[key],
                ...patch,
            },
        }));
    };

    // const syncLrNumberForTrip = useCallback(
    //     async (tripNumber: string) => {
    //         const tripKey = String(tripNumber || "").trim();

    //         if (!tripKey) return;

    //         try {
    //             const res = await unwrapThunk(
    //                 dispatch,
    //                 getAllLRCollection({
    //                     limit: 200,
    //                     offset: 0,
    //                 })
    //             );

    //             const list =
    //                 res?.data?.records ||
    //                 res?.data?.data ||
    //                 res?.records ||
    //                 res?.data ||
    //                 [];

    //             const match = (Array.isArray(list) ? list : []).find((item: any) => {
    //                 const itemTrip = String(
    //                     item?.tripNumber || item?.transportOrderNumber || ""
    //                 ).trim();

    //                 return itemTrip && itemTrip === tripKey;
    //             });

    //             if (match) {
    //                 const lrNumber = match.lrNumber || "";
    //                 const lrDate = match.lrDate || match.createdAt || "";
    //                 const ewayBill = match?.ewayBill || match;

    //                 setForm((prev: any) =>
    //                     prev.lrNumber === lrNumber && prev.lrDate === lrDate
    //                         ? prev
    //                         : {
    //                             ...prev,
    //                             lrNumber,
    //                             lrDate,

    //                             ewayBillNo:
    //                                 ewayBill?.ewayBillNo ||
    //                                 ewayBill?.ewbNo ||
    //                                 "",

    //                             ewayBillDate:
    //                                 ewayBill?.ewayBillDate ||
    //                                 "",

    //                             ewayBillValidUpto:
    //                                 ewayBill?.validUpto ||
    //                                 "",

    //                             ewayBillStatus:
    //                                 ewayBill?.status ||
    //                                 "Active",


    //                         }
    //                 );
    //             }
    //         } catch (error) {
    //             console.log("[TripExpense] LR lookup failed", error);
    //         }
    //     },
    //     [dispatch]
    // );


    const syncLrNumberForTrip = useCallback(
        async (
            tripNumber: string,
            allocationVoucher = ""
        ) => {
            const tripKey = String(
                tripNumber || ""
            ).trim();

            const allocationKey = String(
                allocationVoucher || ""
            ).trim();

            if (!tripKey && !allocationKey) {
                return;
            }

            try {
                setEwayBillLoading(true);

                const [lrRes, ewayRes] = await Promise.all([
                    unwrapThunk(
                        dispatch,
                        getAllLRCollection({
                            offset: 0,
                            limit: 200,
                        })
                    ),

                    unwrapThunk(
                        dispatch,
                        getAllEWayBill({
                            offset: 0,
                            limit: 200,
                        })
                    ),
                ]);

                const lrList =
                    lrRes?.data?.records ||
                    lrRes?.data?.items ||
                    lrRes?.data?.data ||
                    lrRes?.records ||
                    lrRes?.items ||
                    lrRes?.data ||
                    [];

                const lr = (
                    Array.isArray(lrList)
                        ? lrList
                        : []
                ).find((item: any) => {
                    const possibleValues = [
                        item?.tripNumber,
                        item?.transportOrderNumber,
                        item?.allocationVoucherNumber,
                        item?.lrNumber,
                        item?.lrVoucherNumber,
                        item?.voucherNumber,
                    ]
                        .map(normalizeTripDocKey)
                        .filter(Boolean);

                    return possibleValues.includes(
                        normalizeTripDocKey(tripKey)
                    ) ||
                        possibleValues.includes(
                            normalizeTripDocKey(allocationKey)
                        );
                });

                const lrNumber =
                    lr?.lrNumber ||
                    lr?.lrVoucherNumber ||
                    lr?.voucherNumber ||
                    "";

                const lrDate =
                    lr?.lrDate ||
                    lr?.createdAt ||
                    lr?.createdOn ||
                    "";

                setTouchUps(Array.isArray(lr?.lrTouchUp) ? lr.lrTouchUp : []);

                const ewayRecords =
                    extractEwayBillRecords(ewayRes);

                const matchKeys = [
                    tripKey,
                    allocationKey,
                    lr?.tripNumber,
                    lr?.transportOrderNumber,
                    lr?.allocationVoucherNumber,
                    lr?.lrNumber,
                    lr?.lrVoucherNumber,
                    lr?.voucherNumber,
                ]
                    .map((value) =>
                        String(value || "").trim()
                    )
                    .filter(Boolean);

                const ewayRecord =
                    findEwayBillForTrip(
                        ewayRecords,
                        matchKeys
                    );

                const ewayDetails =
                    getEwayBillDetailsFromRecord(
                        ewayRecord
                    );

                setForm((prev: any) => ({
                    ...prev,

                    lrNumber:
                        lrNumber ||
                        prev.lrNumber ||
                        "",

                    lrDate:
                        lrDate ||
                        prev.lrDate ||
                        "",

                    ewayBillNo:
                        ewayDetails.ewayBillNo
                            ? String(
                                ewayDetails.ewayBillNo
                            )
                            : prev.ewayBillNo || "",

                    ewayBillDate:
                        ewayDetails.ewayBillDate ||
                        prev.ewayBillDate ||
                        "",

                    ewayBillValidUpto:
                        ewayDetails.validUpto ||
                        prev.ewayBillValidUpto ||
                        "",

                    ewayBillStatus:
                        ewayDetails.status ||
                        prev.ewayBillStatus ||
                        "",
                }));
            } catch (error) {
                setTouchUps([]);
                console.log(
                    "[TripExpense] LR/E-Way Bill lookup failed",
                    error
                );
            } finally {
                setEwayBillLoading(false);
            }
        },
        [dispatch]
    );
    useEffect(() => {
        if (
            !form.tripId?.trim() &&
            !form.allocationVoucherNumber?.trim()
        ) {
            return;
        }

        syncLrNumberForTrip(
            form.tripId,
            form.allocationVoucherNumber
        );
    }, [
        form.tripId,
        form.allocationVoucherNumber,
        syncLrNumberForTrip,
    ]);

    const handleAllocationSelect = (voucher: string) => {
        setSelectedAllocationVoucher(voucher);

        const allocation = allocations.find(
            (item) => getAllocationVoucher(item) === voucher
        );

        if (!allocation) return;

        setForm((prev: any) => ({
            ...mapTripAllocationToExpenseForm(allocation),
            expenses: prev.expenses,
            pod: prev.pod,
            summary: prev.summary,
        }));

        const tripId =
            allocation?.transportOrder?.transportOrderNumber ||
            getAllocationVoucher(allocation) ||
            "";

        if (tripId) {
            syncLrNumberForTrip(tripId);
        }
    };

    const buildChildSaveForm = useCallback(
        (currentForm: any) => {
            if (!isChildUser) return currentForm;

            const serverForm = serverExpenseRef.current;

            if (!serverForm) return currentForm;

            return {
                ...currentForm,
                expenses: {
                    ...(serverForm.expenses || {}),
                    breakdownCost:
                        currentForm.expenses?.breakdownCost ||
                        serverForm.expenses?.breakdownCost,
                },
                pod: currentForm.pod || serverForm.pod,
            };
        },
        [isChildUser]
    );

    /* ===================================================
       VALIDATION + SAVE
    =================================================== */

    const validateForm = () => {
        if (!String(form.tripId || "").trim()) {
            toast.error("Trip ID is required");
            return false;
        }

        if (!String(form.vehicle?.vehicleNumber || "").trim()) {
            toast.error("Vehicle number is required");
            return false;
        }

        if (!String(form.driver?.driverName || "").trim()) {
            toast.error("Driver name is required");
            return false;
        }

        return true;
    };

    const handleVehicleStatusChange = async (nextStatus: string) => {
        if (!nextStatus || !vehicleVoucher) return;

        try {
            setStatusUpdating(true);

            await updateVehicleMasterStatus({
                vehicleVoucher,
                nextStatus,
            });

            setForm((prev: any) => ({
                ...prev,
                vehicleCurrentStatus: nextStatus,
            }));

            toast.success("Vehicle status updated");
        } catch (e: any) {
            toast.error(e?.message || "Failed to update vehicle status");
        } finally {
            setStatusUpdating(false);
        }
    };

    const syncVehicleStatusOnSave = async () => {
        if (
            !vehicleVoucher ||
            !form.vehicleCurrentStatus ||
            !isDriverSelectableStatus(form.vehicleCurrentStatus)
        ) {
            return;
        }

        try {
            await updateVehicleMasterStatus({
                vehicleVoucher,
                nextStatus: form.vehicleCurrentStatus,
            });
        } catch (e: any) {
            toast.error(e?.message || "Trip saved but vehicle status sync failed");
        }
    };


    const buildPodForSave = (expenseForm: any) => {
        const pod = expenseForm?.pod || {};

        const deliveryStatus = String(pod?.deliveryStatus || "pending")
            .trim()
            .toLowerCase();

        const isReadyToComplete =
            deliveryStatus === "delivered" || deliveryStatus === "partial";

        return {
            deliveryStatus,
            receiverName: pod?.receiverName || "",
            receiverMobile: pod?.receiverMobile || "",
            receiverSignature: pod?.receiverSignature || "",
            podDocument: pod?.podDocument || "",
            deliveryPhoto: pod?.deliveryPhoto || "",
            remarks: pod?.remarks || "",
            submittedAt: isReadyToComplete
                ? pod?.submittedAt || new Date().toISOString()
                : pod?.submittedAt || "",
        };
    };

    const persistExpense = async (
        overrides: any = {},
        successMessage = "Trip expense saved"
    ) => {
        if (!isEdit || !voucherNumber) {
            toast.error("Trip expense can only be updated from existing voucher");
            return;
        }

        if (!validateForm()) return;

        try {
            setLoading(true);

            const saveForm = buildChildSaveForm(form);

            const saveFormWithPod = {
                ...saveForm,
                pod: buildPodForSave(saveForm),
            };

            const payload = toTripExpensePayload(saveFormWithPod, {
                ...overrides,
                tripStatus: overrides.tripStatus || form.tripStatus,
                enteredBy:
                    isChildUser
                        ? "driver"
                        : overrides.enteredBy || form.enteredBy || "dispatcher",
                enteredDate: form.enteredDate || new Date().toISOString(),
            });

            payload.pod = buildPodForSave(saveFormWithPod);

            await unwrapThunk(
                dispatch,
                updateTripExpenses({
                    voucherNumber,
                    payload,
                })
            );

            await syncVehicleStatusOnSave();

            toast.success(successMessage);
            navigate(-1);
        } catch (e: any) {
            toast.error(e?.message || "Trip expense save failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptTrip = () => {
        if (!isEdit || !voucherNumber) {
            toast.error("Trip expense voucher number not found");
            return;
        }

        if (!isChildUser) {
            toast.error("Only driver can accept trip");
            return;
        }

        const confirmed = window.confirm("Accept this trip request?");

        if (!confirmed) return;

        (async () => {
            try {
                setLoading(true);

                const acceptFormWithPod = {
                    ...form,
                    pod: buildPodForSave(form),
                };

                const payload = toTripExpensePayload(acceptFormWithPod, {
                    tripStatus: "in_progress",
                    driverAccepted: true,
                    acceptedAt: new Date().toISOString(),
                    enteredBy: "driver",
                    notificationType: "trip_accepted_by_driver",
                    sendNotificationTo: user?.parentUserMobileNumber || "",
                    notificationMessage: `Trip ${form.tripId || voucherNumber} accepted by driver.`,
                    notifyParent: true,
                });

                payload.pod = buildPodForSave(acceptFormWithPod);

                await unwrapThunk(
                    dispatch,
                    updateTripExpenses({
                        voucherNumber,
                        payload,
                    })
                );

                if (vehicleVoucher) {
                    try {
                        await updateVehicleMasterStatus({
                            vehicleVoucher,
                            nextStatus: VEHICLE_STATUS.ON_WAY_TO_LOAD,
                        });
                    } catch (statusError: any) {
                        toast.error(
                            statusError?.message ||
                            "Trip accepted but vehicle status update failed"
                        );
                    }
                }

                const nextForm = mergeTripExpenseWithInvoiceFields(payload);

                serverExpenseRef.current = nextForm;
                setForm(nextForm);

                toast.success("Trip accepted successfully");
            } catch (e: any) {
                toast.error(e?.message || "Failed to accept trip");
            } finally {
                setLoading(false);
            }
        })();
    };


    const handleCompleteTrip = () => {
        setCompleteConfirmModalVisible(true);
    };

    const confirmCompleteTrip = () => {
        const completedBy = isChildUser ? "driver" : "parent";
        const completionRecipient = isChildUser
            ? user?.parentUserMobileNumber || ""
            : form?.assignedDriverMobile ||
            form?.driver?.driverMobile ||
            form?.driver?.mobileNumber ||
            form?.driver?.driverId ||
            "";

        // ORIGINAL: const confirmComplete = window.confirm(
        //     "Mark this trip as completed? Your parent will be notified."
        // );
        // const confirmComplete = window.confirm(
        //     isChildUser
        //         ? "Mark this trip as completed? Your parent will be notified."
        //         : "Mark this trip as completed? The assigned driver will be notified."
        // );
        // if (!confirmComplete) return;

        setCompleteConfirmModalVisible(false);
        if (!validateForm()) return;

        if (!voucherNumber) {
            toast.error("Trip expense voucher number not found");
            return;
        }

        (async () => {
            try {
                setLoading(true);

                const completeSaveForm = buildChildSaveForm(form);
                const completeSaveFormWithPod = { ...completeSaveForm, pod: buildPodForSave(completeSaveForm) };

                // INVOICE MUST SUCCEED BEFORE ANY TRIP-COMPLETION SIDE EFFECT
                const invoice = await createInvoiceForCompletedTrip({ dispatch, tripExpense: completeSaveFormWithPod });

                const payload = toTripExpensePayload(completeSaveFormWithPod, {
                    tripStatus: "completed",
                    vehicleCurrentStatus: VEHICLE_STATUS.AVAILABLE,
                    notificationType: "trip_completed",
                    // ORIGINAL: sendNotificationTo: user?.parentUserMobileNumber || "",
                    // ORIGINAL: notificationMessage: `Trip ${form.tripId || ""} marked completed by driver.`,
                    // ORIGINAL: notifyParent: true,
                    // ORIGINAL: enteredBy: "driver",
                    sendNotificationTo: completionRecipient,
                    notificationMessage: `Trip ${form.tripId || ""} marked completed by ${completedBy}.`,
                    notifyParent: isChildUser,
                    enteredBy: completedBy,
                    enteredDate: form.enteredDate || new Date().toISOString(),
                    ...(invoice?.invoiceType === "sales" ? { salesInvoiceVoucher: invoice.voucherNumber } : {}),
                    ...(invoice?.invoiceType === "purchase" ? { purchaseInvoiceVoucher: invoice.voucherNumber } : {}),
                    ...(invoice ? { invoiceRemark: `Auto ${invoice.invoiceType} invoice ${invoice.voucherNumber} from trip ${form.tripId || ""}` } : {}),
                });

                payload.pod = buildPodForSave(completeSaveFormWithPod);
                if (invoice?.invoiceType === "sales") (payload as Record<string, any>).salesInvoiceVoucher = invoice.voucherNumber;
                if (invoice?.invoiceType === "purchase") (payload as Record<string, any>).purchaseInvoiceVoucher = invoice.voucherNumber;
                if (invoice) (payload as Record<string, any>).invoiceRemark = `Auto ${invoice.invoiceType} invoice ${invoice.voucherNumber} from trip ${form.tripId || ""}`;

                await unwrapThunk(
                    dispatch,
                    updateTripExpenses({
                        voucherNumber,
                        payload,
                    })
                );

                if (vehicleVoucher) {
                    await updateVehicleMasterStatus({ vehicleVoucher, nextStatus: VEHICLE_STATUS.AVAILABLE });
                }

                try {
                    await dispatch(
                        sendWhatsAppMessage({
                            moduleType: "tripExpense",
                            voucherNumber,
                        })
                    ).unwrap();
                } catch (err) {
                    console.error(
                        "[TripExpense] WhatsApp notification failed",
                        err
                    );
                }

                if (form.allocationVoucherNumber) {
                    try {
                        await unwrapThunk(
                            dispatch,
                            syncAllocationStatusOnComplete(form.allocationVoucherNumber)
                        );
                    } catch (allocationError) {
                        console.log("[TripExpense] allocation complete sync failed", allocationError);
                    }
                }

                const transportOrderNumber = String(form.tripId || "").trim();

                if (transportOrderNumber) {
                    try {
                        const orderResponse = await unwrapThunk(
                            dispatch,
                            getTransportOrderByVoucherNumber(transportOrderNumber)
                        );

                        const existingOrder =
                            orderResponse?.data?.transportOrder ||
                            orderResponse?.data?.record ||
                            orderResponse?.data?.data ||
                            orderResponse?.data ||
                            orderResponse?.transportOrder ||
                            orderResponse?.record ||
                            orderResponse ||
                            {};

                        const completedAt = new Date().toISOString();
                        const statusHistory = Array.isArray(existingOrder?.statusHistory)
                            ? [...existingOrder.statusHistory]
                            : [];

                        statusHistory.push({
                            status: "completed",
                            updatedOn: completedAt,
                            updatedBy: completedBy,
                        });

                        await unwrapThunk(
                            dispatch,
                            updateTransportOrderByVoucherNumber({
                                voucherNumber: transportOrderNumber,
                                payload: {
                                    ...existingOrder,
                                    tripStatus: "completed",
                                    orderStatus: "completed",
                                    status: "close",
                                    completedAt,
                                    statusHistory,
                                },
                            })
                        );
                    } catch (transportOrderError) {
                        console.log(
                            "[TripExpense] transport order complete sync failed",
                            transportOrderError
                        );
                    }
                }

                const invoiceLabel = invoice?.invoiceType === "sales" ? "Sales Invoice" : invoice?.invoiceType === "purchase" ? "Purchase Invoice" : "";
                toast.success(invoice ? `Trip completed successfully. ${invoiceLabel}: ${invoice.voucherNumber}` : "Trip completed successfully");
                navigate(-1);
            } catch (e: any) {
                toast.error(e?.message || "Failed to complete trip");
            } finally {
                setLoading(false);
            }
        })();
    };

    const handleSave = () => {
        if (isChildUser && isTripPendingAccept(form)) {
            toast.error("Please accept the trip from the list first");
            return;
        }

        return persistExpense(
            {
                enteredDate: form.enteredDate || new Date().toISOString(),
            },
            isEdit ? "Trip expense updated" : "Trip expense saved"
        );
    };

    const handleViewEwayBill = async () => {
        const ewayBillNo = String(
            form.ewayBillNo || ""
        ).trim();

        if (!ewayBillNo) {
            toast.error(
                "E-Way Bill number is missing"
            );

            return;
        }

        if (ewayPdfLoading) {
            return;
        }

        try {
            setEwayPdfLoading(true);

            /* ===================================================
               CALL ONLY SAVED PDF API
               GET /users/eWayBill/pdf/:ewayBillNo
            =================================================== */

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

            let pdfBlob: Blob | null =
                null;

            /* ===================================================
               SUPPORT API RETURNING BLOB
            =================================================== */

            if (
                savedPdfResult instanceof Blob
            ) {
                pdfBlob =
                    savedPdfResult;
            } else if (
                savedPdfData?.blob instanceof Blob
            ) {
                pdfBlob =
                    savedPdfData.blob;
            }

            /* ===================================================
               SUPPORT API RETURNING BASE64
            =================================================== */

            if (!pdfBlob) {
                const pdfBase64 = String(
                    savedPdfData?.pdfBase64 ||
                    savedPdfData?.base64 ||
                    savedPdfData?.fileBase64 ||
                    savedPdfData?.pdf?.pdfBase64 ||
                    savedPdfData?.document
                        ?.pdfBase64 ||
                    ""
                ).trim();

                if (pdfBase64) {
                    pdfBlob =
                        base64ToPdfBlob(
                            pdfBase64
                        );
                }
            }

            if (!pdfBlob) {
                throw {
                    code:
                        "EWAY_BILL_PDF_NOT_FOUND",

                    status:
                        404,

                    message:
                        "Saved E-Way Bill PDF is not available",
                };
            }

            if (ewayPdfUrl) {
                URL.revokeObjectURL(
                    ewayPdfUrl
                );
            }

            const objectUrl =
                URL.createObjectURL(
                    pdfBlob
                );

            setEwayPdfUrl(
                objectUrl
            );

            setEwayPdfModalVisible(
                true
            );
        } catch (error: any) {
            const status = Number(
                error?.status ||
                error?.response?.status ||
                error?.payload?.status ||
                0
            );

            const code = String(
                error?.code ||
                error?.payload?.code ||
                error?.response?.data?.code ||
                ""
            )
                .trim()
                .toUpperCase();

            const errorMessage = String(
                error?.response?.data?.message ||
                error?.data?.message ||
                error?.payload?.message ||
                error?.message ||
                ""
            ).trim();

            const isPdfNotFound =
                status === 404 ||
                code === "NOT_FOUND" ||
                code === "PDF_NOT_FOUND" ||
                code ===
                "EWAY_BILL_PDF_NOT_FOUND" ||
                errorMessage
                    .toLowerCase()
                    .includes(
                        "pdf not found"
                    );

            if (isPdfNotFound) {
                toast.info(
                    `PDF is not available for E-Way Bill No. ${ewayBillNo}. Please download the E-Way Bill PDF first, then you can view it here.`
                );

                return;
            }

            toast.error(
                errorMessage ||
                "Unable to load E-Way Bill PDF"
            );
        } finally {
            setEwayPdfLoading(false);
        }
    };


    /* ===================================================
       RENDER
    =================================================== */
    const showVehicleStatusSection = showVehicleStatusDropdown || isTripInProgress(form);






    return (
        <div className="flex h-full w-full flex-col bg-background text-foreground">
            <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-border bg-card px-4 py-3 sm:px-4">
                <div className="flex items-center">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="me-3 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20 transition hover:bg-primary/20"
                        title="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div >
                        <h1 className="truncate text-lg font-bold text-card-foreground">

                            {pageTitle}
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            {pageDescription}
                        </p>
                    </div>
                </div>
            </header>

            {(loading || statusUpdating) && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 backdrop-blur-sm">
                    <div className="rounded-md bg-card p-5 shadow-xl">
                        <Loader2 className="animate-spin text-primary" size={34} />
                    </div>
                </div>
            )}

            {completeConfirmModalVisible && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setCompleteConfirmModalVisible(false)}>
                    <div role="dialog" aria-modal="true" aria-labelledby="complete-trip-title" className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <CheckCircle2 size={22} />
                                </div>
                                <div>
                                    <h2 id="complete-trip-title" className="text-lg font-bold text-card-foreground">Complete Trip?</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">Are you sure you want to complete this trip?</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setCompleteConfirmModalVisible(false)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Close confirmation modal">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button type="button" onClick={() => setCompleteConfirmModalVisible(false)} className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted">Cancel</button>
                            <button type="button" onClick={confirmCompleteTrip} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                                <CheckCircle2 size={17} />
                                Complete Trip
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 overflow-auto sm:p-2">
                <div className="flex flex-col gap-4">
                    <SectionCard
                        index={1}
                        title="Trip Setup"
                        icon={<CalendarDays size={18} />}
                        expanded={expandedSections.tripSetup}
                        onToggle={() => toggleSection("tripSetup")}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {!isEdit && !isChildUser && (
                                    <Field
                                        label="Select Trip Allocation"
                                        className="md:col-span-2 xl:col-span-4"
                                    >
                                        <select
                                            disabled={allocationsLoading}
                                            className={inputClass}
                                            value={selectedAllocationVoucher}
                                            onChange={(e) => handleAllocationSelect(e.target.value)}
                                        >
                                            <option value="">Select Allocation</option>

                                            {allocations.map((allocation: any) => {
                                                const voucher = getAllocationVoucher(allocation);

                                                return (
                                                    <option key={voucher} value={voucher}>
                                                        {voucher} -{" "}
                                                        {allocation?.vehicleSelection?.vehicleNumber || ""}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </Field>
                                )}

                                <Field label="Trip No." mandatory>
                                    <input
                                        disabled={readOnly}
                                        className={inputClass}
                                        value={form.tripId || ""}
                                        onChange={(e) => patchHeader({ tripId: e.target.value })}
                                    />
                                </Field>

                                <Field label="Trip Date">
                                    <input
                                        disabled={readOnly}
                                        type="date"
                                        className={inputClass}
                                        value={toDateInputValue(form.tripDate)}
                                        onChange={(e) =>
                                            patchHeader({
                                                tripDate: e.target.value
                                                    ? new Date(e.target.value).toISOString()
                                                    : "",
                                            })
                                        }
                                    />
                                </Field>

                                <Field label="Vehicle No." mandatory>
                                    <input
                                        disabled={readOnly}
                                        className={inputClass}
                                        value={form.vehicle?.vehicleNumber || ""}
                                        onChange={(e) =>
                                            patchNested("vehicle", {
                                                vehicleNumber: e.target.value,
                                            })
                                        }
                                    />
                                </Field>

                                <Field label="Vehicle ID">
                                    <input
                                        disabled={readOnly}
                                        className={inputClass}
                                        value={form.vehicle?.vehicleId || ""}
                                        onChange={(e) =>
                                            patchNested("vehicle", {
                                                vehicleId: e.target.value,
                                            })
                                        }
                                    />
                                </Field>

                                <Field label="Driver Name" mandatory>
                                    <input
                                        disabled={readOnly}
                                        className={inputClass}
                                        value={form.driver?.driverName || ""}
                                        onChange={(e) =>
                                            patchNested("driver", {
                                                driverName: e.target.value,
                                            })
                                        }
                                    />
                                </Field>

                                <Field label="Driver Mobile / ID">
                                    <input
                                        disabled={readOnly}
                                        className={inputClass}
                                        value={form.driver?.driverId || ""}
                                        onChange={(e) => {
                                            patchNested("driver", {
                                                driverId: e.target.value,
                                            });

                                            patchHeader({
                                                assignedDriverMobile: e.target.value,
                                                tripAssignedToMobile: e.target.value,
                                            });
                                        }}
                                    />
                                </Field>

                                <Field label="Start Odometer">
                                    <input
                                        disabled={readOnly}
                                        type="number"
                                        className={inputClass}
                                        value={form.startOdometer || ""}
                                        onChange={(e) =>
                                            patchHeader({
                                                startOdometer: e.target.value,
                                            })
                                        }
                                        placeholder={String(startOdometer)}
                                    />
                                </Field>

                                <Field label="End Odometer">
                                    <input
                                        disabled={readOnly}
                                        type="number"
                                        className={inputClass}
                                        value={form.endOdometer || ""}
                                        onChange={(e) =>
                                            patchHeader({
                                                endOdometer: e.target.value,
                                            })
                                        }
                                        placeholder={String(endOdometer)}
                                    />
                                </Field>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        index={2}
                        title="LR & E-Way Bill"
                        icon={<Paperclip size={18} />}
                        expanded={expandedSections.ewayBill}
                        onToggle={() => toggleSection("ewayBill")}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <Field label="LR Number">
                                    <input
                                        disabled={readOnly}
                                        className={inputClass}
                                        value={form.lrNumber || ""}
                                        onChange={(e) => patchHeader({ lrNumber: e.target.value })}
                                    />
                                </Field>

                                <Field label="LR Date">
                                    <input
                                        disabled={readOnly}
                                        type="date"
                                        className={inputClass}
                                        value={toDateInputValue(form.lrDate)}
                                        onChange={(e) => patchHeader({ lrDate: e.target.value })}
                                    />
                                </Field>

                                <Field label="E-Way Bill No">
                                    <div className="relative">
                                        <input readOnly className={`${inputClass} pr-12`} value={form.ewayBillNo || ""} />
                                        <button
                                            type="button"
                                            onClick={handleViewEwayBill}
                                            disabled={ewayPdfLoading || !String(form.ewayBillNo || "").trim()}
                                            title="View E-Way Bill"
                                            className="absolute right-1 top-1/2 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-md text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {ewayPdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </Field>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        index={3}
                        title="Touch Ups"
                        subtitle={`${touchUps.length} ${touchUps.length === 1 ? "Touch Up" : "Touch Ups"}`}
                        icon={<Route size={18} />}
                        expanded={expandedSections.touchUp}
                        onToggle={() => toggleSection("touchUp")}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            {touchUps.length ? (
                                <div className="flex flex-col gap-3">
                                    {touchUps.map((touchUp: any, index: number) => {
                                        const documentUrl = getLRTouchUpDocumentUrl(touchUp);
                                        return (
                                            <div key={touchUp?.touchUpId || index} className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
                                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-card-foreground">{touchUp?.touchUpId || `Touch Up ${index + 1}`}</p>
                                                        <p className="truncate text-xs text-muted-foreground">{touchUp?.pickupDetails?.name || "-"} → {touchUp?.deliveryDetails?.name || "-"} | {touchUp?.material || "-"}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!documentUrl) {
                                                            toast.warn("Touch Up LR document is not available");
                                                            return;
                                                        }
                                                        window.open(documentUrl, "_blank", "noopener,noreferrer");
                                                    }}
                                                    disabled={!documentUrl}
                                                    title="View Touch Up LR Document"
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex min-h-20 items-center justify-center rounded-md border border-dashed border-border bg-muted/20">
                                    <p className="text-sm text-muted-foreground">No Touch Ups found in LR</p>
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    <div
                        className={`grid grid-cols-1 gap-4 ${showVehicleStatusSection ? "xl:grid-cols-[0.75fr_1.25fr]" : ""
                            }`}
                    >
                        {showVehicleStatusSection && (
                            <div className="min-w-0">
                                <SectionCard
                                    index={4}
                                    title="Vehicle Status"
                                    icon={<Truck size={18} />}
                                    expanded={expandedSections.vehicleStatus ?? true}
                                    onToggle={() => toggleSection("vehicleStatus")}
                                >
                                    <div className="md:col-span-2 xl:col-span-3">
                                        {showVehicleStatusDropdown ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                <Field label="Current Vehicle Status">
                                                    <SelectInput
                                                        disabled={
                                                            statusUpdating ||
                                                            isTripPendingAccept(form) ||
                                                            String(form.tripStatus || "").toLowerCase() ===
                                                            "completed"
                                                        }
                                                        value={form.vehicleCurrentStatus}
                                                        options={DRIVER_VEHICLE_STATUS_OPTIONS}
                                                        onChange={handleVehicleStatusChange}
                                                    />
                                                </Field>

                                                {!form.vehicleCurrentStatus && (
                                                    <div className="rounded-md  text-xs font-medium text-muted-foreground">
                                                        Vehicle is on the way to load. Select Loading,
                                                        In-Transit, or Unloading when applicable.
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="rounded-md   p-3 text-sm font-medium text-amber-700">
                                                Vehicle master link missing — status cannot be updated.
                                            </div>
                                        )}
                                    </div>
                                </SectionCard>
                            </div>
                        )}

                        <div className="min-w-0">
                            <SectionCard
                                index={showVehicleStatusSection ? 5 : 4}
                                title="Route Planner"
                                icon={<Route size={18} />}
                                expanded={expandedSections.routePlanner}
                                onToggle={() => toggleSection("routePlanner")}
                            >
                                <div className="md:col-span-2 xl:col-span-3">
                                    <TripRoutePlannerCard routesData={form.routesData} />
                                </div>
                            </SectionCard>
                        </div>
                    </div>

                  

                    {visibleCategories.map((category: any, index: number) => {
                        const entries = form.expenses?.[category.key]?.entries || [];
                        const entryCount = entries.length;
                        const totalAmount = entries.reduce(
                            (sum: number, e: any) => sum + Number(e.amount || 0),
                            0
                        );

                        return (
                            <SectionCard
                                key={category.key}
                                index={index + 4}
                                title={category.title}
                                subtitle={getEntryCountLabel(entryCount)}
                                trailing={
                                    <span
                                        className={
                                            totalAmount > 0 ? "text-primary" : "text-muted-foreground"
                                        }
                                    >
                                        ₹{formatIndianNumber(totalAmount)}
                                    </span>
                                }
                                icon={category.icon}
                                expanded={expandedSections[category.key]}
                                onToggle={() => toggleSection(category.key)}
                            >
                                <CategoryDetails
                                    category={category}
                                    form={form}
                                    setForm={setForm}
                                    readOnly={readOnly}
                                    vendorAccountOptions={vendorAccountOptions}
                                    expenseAccountOptions={expenseAccountOptions}
                                />
                            </SectionCard>
                        );
                    })}


                    {(() => {
                        const podFilledCount = [
                            form.pod?.podDocument,
                            form.pod?.deliveryPhoto,
                            form.pod?.receiverName,
                            form.pod?.receiverMobile,
                        ].filter(Boolean).length;

                        const podStatusRaw = String(form.pod?.deliveryStatus || "pending")
                            .trim()
                            .toLowerCase();
                        const podStatusLabel =
                            podStatusRaw.charAt(0).toUpperCase() + podStatusRaw.slice(1);

                        const podStatusClass =
                            podStatusRaw === "delivered"
                                ? "text-success"
                                : podStatusRaw === "partial"
                                    ? "text-amber-600"
                                    : "text-muted-foreground";

                        return (
                            <SectionCard
                                index={visibleCategories.length + 4}
                                title="POD Details"
                                subtitle={getEntryCountLabel(podFilledCount)}
                                trailing={<span className={podStatusClass}>{podStatusLabel}</span>}
                                icon={<Paperclip size={18} />}
                                expanded={expandedSections.pod}
                                onToggle={() => toggleSection("pod")}
                            >
                                <PodDetails form={form} setForm={setForm} readOnly={readOnly} />
                            </SectionCard>
                        );
                    })()}


                    {/* <SectionCard
                        index={visibleCategories.length + 4}
                        title="POD Details"
                        icon={<Paperclip size={18} />}
                        expanded={expandedSections.pod}
                        onToggle={() => toggleSection("pod")}
                    >
                        <PodDetails form={form} setForm={setForm} readOnly={readOnly} />
                    </SectionCard> */}



                    <SectionCard
                        index={11}
                        title="Trip Summary"
                        icon={<Truck size={18} />}
                        expanded={expandedSections.tripSummary}
                        onToggle={() => toggleSection("tripSummary")}
                    >
                        <div className="md:col-span-2 xl:col-span-3">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <SummaryBox
                                    title="Advance Received"
                                    value={summary.totalAdvanceReceived}
                                />

                                <SummaryBox
                                    title="Trip Expense"
                                    value={summary.totalTripExpense}
                                />

                                <SummaryBox
                                    title="Balance"
                                    value={summary.balanceAmount}
                                    danger={summary.balanceAmount < 0}
                                />
                            </div>

                            <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                            Trip Summary
                                        </p>

                                        <h3 className="mt-1 text-lg font-bold text-card-foreground">
                                            {form.tripId || "Trip not setup"}
                                        </h3>

                                        {/* <p className="mt-1 text-sm font-medium text-muted-foreground">
                                            Vehicle: {form.vehicle?.vehicleNumber || "-"} • Driver:{" "}
                                            {form.driver?.driverName || "-"} • Date:{" "}
                                            {formatTripDate(form.tripDate)}
                                        </p> */}

                                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                                            Vehicle: {form.vehicle?.vehicleNumber || "-"} • Driver:{" "}
                                            {form.driver?.driverName || "-"} • Date:{" "}
                                            {formatTripDate(form.tripDate)} • Status:{" "}
                                            <span className="font-bold text-primary">
                                                {formatStatusLabel(form.tripStatus || "-")}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                                        <User size={16} />
                                        {form.enteredBy || "driver"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                </div>


            </main>

            <footer className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-primary bg-background px-5 text-sm font-bold text-primary transition hover:bg-primary/10 disabled:opacity-60"
                >
                    Cancel
                </button>

                {showAcceptTripButton && (
                    <button
                        type="button"
                        onClick={handleAcceptTrip}
                        disabled={loading || statusUpdating}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-success bg-background px-5 text-sm font-semibold text-success transition hover:bg-success/10 disabled:opacity-60"
                    >
                        <CheckCircle2 size={17} />
                        Accept Trip
                    </button>
                )}

                {showCompleteTripButton && (
                    <button
                        type="button"
                        onClick={handleCompleteTrip}
                        disabled={loading || statusUpdating}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary bg-background px-5 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-60"
                    >
                        <CheckCircle2 size={17} />
                        Complete Trip
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading || readOnly || statusUpdating}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                    {loading ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
                    {loading ? "Saving..." : isEdit ? "Update" : "Save"}
                </button>
            </footer>




        </div>
    );
};

export default CreateEditTripExpence;
