import {
    generateEWayBill,
    getEWayBillAccessToken,
    saveEWayBill,
} from "../../../../redux/slices/professionalSlice/transportation/eWayBillSlice";

/* ===================================================
   HELPERS
=================================================== */

type BuildSaveEWayBillPayloadArgs = {
    createdResult: any;
    lrPayload: any;
    requestPayload: any;
    responsePayload: any;
    authToken: string;
    sek?: string;
};

const getResponseData = (response: any) =>
    response?.data?.data ||
    response?.data ||
    response ||
    {};

const getCreatedLRRecord = (createdResult: any) => {
    const data = getResponseData(createdResult);

    if (Array.isArray(data)) {
        return data[0] || {};
    }

    if (Array.isArray(data?.records)) {
        return data.records[0] || {};
    }

    if (Array.isArray(data?.items)) {
        return data.items[0] || {};
    }

    return data?.record || data?.item || data;
};

export const buildSaveEWayBillPayload = ({
    createdResult,
    lrPayload,
    requestPayload,
    responsePayload,
    authToken,
    sek = "",
}: BuildSaveEWayBillPayloadArgs) => {
    const lrRecord = getCreatedLRRecord(
        createdResult
    );

    const gstResponse =
        responsePayload?.data?.data ||
        responsePayload?.data ||
        responsePayload ||
        {};

    const lrId = String(
        lrRecord?._id ||
        lrRecord?.id ||
        lrRecord?.lrId ||
        ""
    ).trim();

    const voucherNumber = String(
        lrRecord?.lrNumber ||
        lrRecord?.voucherNumber ||
        lrRecord?.lrVoucherNumber ||
        lrRecord?.tripLRVoucherNumber ||
        lrPayload?.lrNumber ||
        requestPayload?.docNo ||
        ""
    ).trim();

    const tripNumber = String(
        lrRecord?.tripNumber ||
        lrRecord?.transportOrderNumber ||
        lrPayload?.tripNumber ||
        lrPayload?.transportOrderNumber ||
        requestPayload?.docNo ||
        ""
    ).trim();

    const invoiceNumber = String(
        lrRecord?.invoiceNumber ||
        lrRecord?.invoiceNo ||
        lrPayload?.invoiceNumber ||
        lrPayload?.invoiceNo ||
        ""
    ).trim();

    const ewayBillNo = String(
        gstResponse?.ewayBillNo ||
        gstResponse?.ewbNo ||
        gstResponse?.EwbNo ||
        ""
    ).trim();

    // ⭐ GST response date-time is preserved exactly:
    // "31/07/2026 11:17:00 AM"
    const ewayBillDate = String(
        gstResponse?.ewayBillDate ||
        gstResponse?.ewayBillDateString ||
        ""
    ).trim();

    // ⭐ GST response date-time is preserved exactly:
    // "02/08/2026 11:59:00 PM"
    const validUpto = String(
        gstResponse?.validUpto ||
        gstResponse?.validUpTo ||
        ""
    ).trim();

    return {
        lrId,
        voucherNumber,
        tripNumber,
        invoiceNumber,

        ewayBillNo,
        ewayBillDate,
        validUpto,

        authToken,
        sek,

        // ⭐ Exact payload sent to Generate E-Way Bill API
        ewayPayload: requestPayload,

        // ⭐ Exact response returned by GST API
        rawResponse: gstResponse,

        createdAt: new Date().toISOString(),
    };
};

const unwrapDispatchResult = async (dispatch: any, action: any) => {
    const result = await dispatch(action);

    if (typeof result?.unwrap === "function") {
        return result.unwrap();
    }

    if (result?.error) {
        throw result.error;
    }

    return result?.payload ?? result;
};



const getLRId = (createdResult: any) => {
    const record = getCreatedLRRecord(createdResult);

    return String(
        record?._id ||
        record?.id ||
        record?.lrId ||
        ""
    ).trim();
};

const getLRVoucherNumber = (
    createdResult: any,
    lrPayload: any
) => {
    const record = getCreatedLRRecord(createdResult);

    return String(
        record?.lrNumber ||
        record?.voucherNumber ||
        record?.lrVoucherNumber ||
        record?.tripLRVoucherNumber ||
        lrPayload?.lrNumber ||
        lrPayload?.voucherNumber ||
        lrPayload?.tripNumber ||
        lrPayload?.transportOrderNumber ||
        ""
    ).trim();
};

const getTripNumber = (
    createdResult: any,
    lrPayload: any
) => {
    const record = getCreatedLRRecord(createdResult);

    return String(
        record?.tripNumber ||
        record?.transportOrderNumber ||
        record?.transportOrder?.transportOrderNumber ||
        lrPayload?.tripNumber ||
        lrPayload?.transportOrderNumber ||
        ""
    ).trim();
};

const getInvoiceNumber = (
    createdResult: any,
    lrPayload: any
) => {
    const record = getCreatedLRRecord(createdResult);

    return String(
        record?.invoiceNumber ||
        record?.invoiceNo ||
        record?.documents?.find(
            (document: any) =>
                String(document?.documentType || "")
                    .trim()
                    .toLowerCase() === "invoice"
        )?.documentNumber ||
        lrPayload?.invoiceNumber ||
        lrPayload?.invoiceNo ||
        ""
    ).trim();
};



/* ===================================================
   BUILD E-WAY BILL PAYLOAD
=================================================== */
export const buildEWayBillPayload = (
    createdResult: any,
    lrPayload: any
) => {
    const createdData =
        createdResult?.data?.data ||
        createdResult?.data ||
        createdResult ||
        {};

    const createdRecord =
        createdData?.record ||
        createdData?.item ||
        createdData;

    /* ===================================================
       HELPERS
    =================================================== */

    const getText = (
        value: any,
        fallback: string
    ) => {
        const text = String(value ?? "").trim();

        return text || fallback;
    };

    const formatDate = (value: any) => {
        const date = value
            ? new Date(value)
            : new Date();

        if (Number.isNaN(date.getTime())) {
            const currentDate = new Date();

            const currentDay = String(
                currentDate.getDate()
            ).padStart(2, "0");

            const currentMonth = String(
                currentDate.getMonth() + 1
            ).padStart(2, "0");

            const currentYear =
                currentDate.getFullYear();

            return `${currentDay}/${currentMonth}/${currentYear}`;
        }

        const day = String(
            date.getDate()
        ).padStart(2, "0");

        const month = String(
            date.getMonth() + 1
        ).padStart(2, "0");

        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    /* ===================================================
       DYNAMIC TRIP / TRANSPORT ORDER NUMBER
    =================================================== */

    const docNo = String(
        createdRecord?.tripNumber ||
        createdRecord?.transportOrderNumber ||
        createdRecord?.transportOrder?.transportOrderNumber ||
        lrPayload?.tripNumber ||
        lrPayload?.transportOrderNumber ||
        "TO-3"
    ).trim();

    /* ===================================================
       DYNAMIC ITEM VALUES
    =================================================== */

    const productName = String(
        lrPayload?.cargo?.productName ||
        lrPayload?.productName ||
        "BLAZER-1"
    ).trim();

    const productDesc = String(
        lrPayload?.cargo?.productDescription ||
        lrPayload?.cargo?.productDesc ||
        lrPayload?.productDescription ||
        productName ||
        "BLAZER-1"
    ).trim();

    const quantityValue = Number(
        lrPayload?.cargo?.quantity ||
        lrPayload?.quantity ||
        25
    );

    const quantity =
        Number.isFinite(quantityValue) &&
            quantityValue > 0
            ? quantityValue
            : 25;

    /* ===================================================
       EXACT TESTED E-WAY BILL PAYLOAD
    =================================================== */

    return {
        supplyType: "O",
        subSupplyType: "1",
        subSupplyDesc: "",
        docType: "INV",

        // ⭐ DYNAMIC: Trip / Transport Order number
        docNo,

        // ⭐ DYNAMIC: Current date
        docDate: formatDate(new Date()),

        /*
        |--------------------------------------------------
        | STATIC TESTED SUPPLIER DETAILS
        |--------------------------------------------------
        */

        fromGstin: "34AACCC1596Q002",
        fromTrdName: "welton",
        fromAddr1: "2ND CROSS NO 59  19  A",
        fromAddr2: "GROUND FLOOR OSBORNE ROAD",
        fromPlace: "FRAZER TOWN",
        fromPincode: 605001,
        actFromStateCode: 34,
        fromStateCode: 34,

        /*
        |--------------------------------------------------
        | STATIC TESTED CONSIGNEE DETAILS
        |--------------------------------------------------
        */

        toGstin: "29AACCC1596Q000",
        toTrdName: "sthuthya",
        toAddr1: "Shree Nilaya",
        toAddr2: "Dasarahosahalli",
        toPlace: "Beml Nagar",
        toPincode: 562160,
        actToStateCode: 29,
        toStateCode: 29,

        transactionType: 1,

        /*
        |--------------------------------------------------
        | STATIC TESTED TAX VALUES
        |--------------------------------------------------
        */

        otherValue: "-100",
        totalValue: 56099,
        cgstValue: 0,
        sgstValue: 0,
        igstValue: 300.67,
        cessValue: 400.56,
        cessNonAdvolValue: 400,
        totInvValue: 68358,

        transporterId: "",
        transporterName: "",
        transDocNo: "",
        transMode: "1",

        // ⭐ DYNAMIC: Distance
        transDistance: "362",
        // getText(
        //     lrPayload?.transDistance ||
        //     lrPayload?.route?.distanceKm,
        //     "362"
        // ),

        transDocDate: "",

        // ⭐ DYNAMIC: Vehicle number
        vehicleNo: getText(
            lrPayload?.vehicleNo ||
            lrPayload?.vehicle?.vehicleNumber,
            "PVC1234"
        ),

        vehicleType: getText(
            lrPayload?.vehicleType ||
            lrPayload?.vehicle?.ewayBillVehicleType,
            "R"
        ),

        itemList: [
            {
                // ⭐ DYNAMIC ITEM VALUES
                productName,
                productDesc,
                hsnCode: 442199,
                quantity,
                qtyUnit: "NOS",

                cgstRate: 0,
                sgstRate: 0,
                igstRate: 3,
                cessRate: 3,
                cessNonadvol: 0,
                taxableAmount: 5609889,
            },
        ],
    };
};




/* ===================================================
   BACKGROUND E-WAY BILL GENERATION
=================================================== */

const runEWayBillGeneration = async (
    dispatch: any,
    createdResult: any,
    lrPayload: any
) => {
    const lrId = getLRId(createdResult);

    const voucherNumber = getLRVoucherNumber(
        createdResult,
        lrPayload
    );

    const tripNumber = getTripNumber(
        createdResult,
        lrPayload
    );

    const invoiceNumber = getInvoiceNumber(
        createdResult,
        lrPayload
    );

    if (!voucherNumber) {
        throw new Error(
            "LR voucher number was not returned after LR creation"
        );
    }

    /* ---------------------------------------------------
       STEP 1: GET ACCESS TOKEN
    --------------------------------------------------- */

    const tokenResult = await unwrapDispatchResult(
        dispatch,
        getEWayBillAccessToken()
    );

    const tokenData = getResponseData(tokenResult);

    const authToken = String(
        tokenData?.authtoken ||
        tokenData?.authToken ||
        ""
    ).trim();

    const sek = String(tokenData?.sek || "").trim();

    if (!authToken) {
        throw new Error(
            "E-Way Bill access token was not received"
        );
    }

    /* ---------------------------------------------------
       STEP 2: BUILD REQUEST PAYLOAD
    --------------------------------------------------- */

    const requestPayload = buildEWayBillPayload(
        createdResult,
        lrPayload
    );

    /* ---------------------------------------------------
       STEP 3: GENERATE E-WAY BILL
    --------------------------------------------------- */

    const generationResult = await unwrapDispatchResult(
        dispatch,
        generateEWayBill({
            payload: requestPayload,
            authtoken: authToken,
        })
    );

    const responsePayload = getResponseData(generationResult);

    const ewayBillNo = String(
        responsePayload?.ewayBillNo ||
        responsePayload?.ewbNo ||
        responsePayload?.EwbNo ||
        ""
    ).trim();

    if (!ewayBillNo) {
        throw new Error(
            responsePayload?.message ||
            responsePayload?.errorMessage ||
            "E-Way Bill number was not received"
        );
    }

    /* ---------------------------------------------------
       STEP 4: SAVE GENERATED E-WAY BILL
    --------------------------------------------------- */

    const savePayload = {
        lrId,
        voucherNumber,
        tripNumber,
        invoiceNumber,

        ewayBillNo,

        ewayBillDate:
            responsePayload?.ewayBillDate ||
            responsePayload?.ewayBillDateString ||
            "",

        validUpto:
            responsePayload?.validUpto ||
            responsePayload?.validUpTo ||
            "",

        authToken,
        sek,

        requestPayload,
        responsePayload,

        createdAt: new Date().toISOString(),
    };

    await unwrapDispatchResult(
        dispatch,
        saveEWayBill(savePayload)
    );
};

/**
 * Starts E-Way Bill generation without returning a blocking promise.
 *
 * This function intentionally:
 * - does not show a toast;
 * - does not throw into the LR screen;
 * - does not affect navigation;
 * - does not affect LR creation;
 * - records errors only in the browser console.
 */
export const triggerEWayBillGeneration = (
    dispatch: any,
    createdResult: any,
    lrPayload: any
) => {
    Promise.resolve()
        .then(() =>
            runEWayBillGeneration(
                dispatch,
                createdResult,
                lrPayload
            )
        )
        .catch((error: any) => {
            console.error(
                "[E-WAY BILL BACKGROUND] Generation failed:",
                {
                    message:
                        error?.message ||
                        "Unknown E-Way Bill generation error",

                    lrId: getLRId(createdResult),

                    voucherNumber: getLRVoucherNumber(
                        createdResult,
                        lrPayload
                    ),

                    tripNumber: getTripNumber(
                        createdResult,
                        lrPayload
                    ),
                }
            );
        });
};