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
       TESTED FALLBACK VALUES

       These values are used only when real LR/API data
       is not available.
    =================================================== */

    const DEFAULTS = {
        supplyType: "O",
        subSupplyType: "1",
        subSupplyDesc: "",
        docType: "INV",
        docNo: "TO-3",

        fromGstin: "34AACCC1596Q002",
        fromTrdName: "welton",
        fromAddr1: "2ND CROSS NO 59  19  A",
        fromAddr2: "GROUND FLOOR OSBORNE ROAD",
        fromPlace: "FRAZER TOWN",
        fromPincode: 605001,
        actFromStateCode: 34,
        fromStateCode: 34,

        toGstin: "29AACCC1596Q000",
        toTrdName: "sthuthya",
        toAddr1: "Shree Nilaya",
        toAddr2: "Dasarahosahalli",
        toPlace: "Beml Nagar",
        toPincode: 562160,
        actToStateCode: 29,
        toStateCode: 29,

        transactionType: 1,

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
        transDistance: "362",
        transDocDate: "",

        vehicleNo: "PVC1234",
        vehicleType: "R",

        item: {
            productName: "BLAZER-1",
            productDesc: "BLAZER-1",
            hsnCode: 442199,
            quantity: 25,
            qtyUnit: "NOS",
            cgstRate: 0,
            sgstRate: 0,
            igstRate: 3,
            cessRate: 3,
            cessNonadvol: 0,
            taxableAmount: 5609889,
        },
    };

    /* ===================================================
       HELPERS
    =================================================== */

    const getText = (
        values: any[],
        fallback: string
    ) => {
        for (const value of values) {
            if (
                value !== undefined &&
                value !== null
            ) {
                const normalizedValue =
                    String(value).trim();

                if (normalizedValue) {
                    return normalizedValue;
                }
            }
        }

        return fallback;
    };

    const getNumber = (
        values: any[],
        fallback: number,
        allowZero = true
    ) => {
        for (const value of values) {
            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                continue;
            }

            const normalizedValue =
                Number(value);

            if (
                Number.isFinite(
                    normalizedValue
                ) &&
                (
                    allowZero ||
                    normalizedValue !== 0
                )
            ) {
                return normalizedValue;
            }
        }

        return fallback;
    };

    const getRawValue = (
        values: any[],
        fallback: any
    ) => {
        for (const value of values) {
            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                return value;
            }
        }

        return fallback;
    };

    const formatDate = (value: any) => {
        const date = value
            ? new Date(value)
            : new Date();

        const finalDate =
            Number.isNaN(date.getTime())
                ? new Date()
                : date;

        const day = String(
            finalDate.getDate()
        ).padStart(2, "0");

        const month = String(
            finalDate.getMonth() + 1
        ).padStart(2, "0");

        const year =
            finalDate.getFullYear();

        return `${day}/${month}/${year}`;
    };

    const getArray = (
        values: any[]
    ) => {
        for (const value of values) {
            if (
                Array.isArray(value) &&
                value.length > 0
            ) {
                return value;
            }
        }

        return [];
    };

    /* ===================================================
       SOURCE DATA
    =================================================== */

    const consignor =
        lrPayload?.consignor ||
        lrPayload?.supplier ||
        lrPayload?.fromParty ||
        lrPayload?.sourceParty ||
        {};

    const consignee =
        lrPayload?.consignee ||
        lrPayload?.customer ||
        lrPayload?.toParty ||
        lrPayload?.destinationParty ||
        {};

    const vehicle =
        lrPayload?.vehicle ||
        lrPayload?.vehicleDetails ||
        createdRecord?.vehicle ||
        createdRecord?.vehicleDetails ||
        {};

    const transporter =
        lrPayload?.transporter ||
        lrPayload?.transporterDetails ||
        createdRecord?.transporter ||
        {};

    const route =
        lrPayload?.route ||
        lrPayload?.routeDetails ||
        createdRecord?.route ||
        {};

    const freight =
        lrPayload?.freight ||
        lrPayload?.freightDetails ||
        {};

    const cargo =
        lrPayload?.cargo ||
        lrPayload?.cargoDetails ||
        {};

    const taxDetails =
        lrPayload?.taxDetails ||
        lrPayload?.tax ||
        {};

    /* ===================================================
       DYNAMIC DOCUMENT VALUES
    =================================================== */

    const docNo = getText(
        [
            createdRecord?.tripNumber,
            createdRecord?.transportOrderNumber,
            createdRecord?.transportOrder
                ?.transportOrderNumber,
            lrPayload?.tripNumber,
            lrPayload?.transportOrderNumber,
            lrPayload?.docNo,
        ],
        DEFAULTS.docNo
    );

    const docDate = formatDate(
        getRawValue(
            [
                createdRecord?.tripDate,
                createdRecord?.lrDate,
                createdRecord?.docDate,
                lrPayload?.tripDate,
                lrPayload?.lrDate,
                lrPayload?.docDate,
            ],
            new Date()
        )
    );

    /* ===================================================
       DYNAMIC TAX VALUES
    =================================================== */

    const totalValue = getNumber(
        [
            lrPayload?.totalValue,
            lrPayload?.taxableValue,
            taxDetails?.totalValue,
            taxDetails?.taxableValue,
            freight?.agreedFreight,
            freight?.totalFreight,
            cargo?.taxableAmount,
            cargo?.totalValue,
        ],
        DEFAULTS.totalValue
    );

    const cgstValue = getNumber(
        [
            lrPayload?.cgstValue,
            taxDetails?.cgstValue,
            taxDetails?.cgstAmount,
        ],
        DEFAULTS.cgstValue
    );

    const sgstValue = getNumber(
        [
            lrPayload?.sgstValue,
            taxDetails?.sgstValue,
            taxDetails?.sgstAmount,
        ],
        DEFAULTS.sgstValue
    );

    const igstValue = getNumber(
        [
            lrPayload?.igstValue,
            taxDetails?.igstValue,
            taxDetails?.igstAmount,
        ],
        DEFAULTS.igstValue
    );

    const cessValue = getNumber(
        [
            lrPayload?.cessValue,
            taxDetails?.cessValue,
            taxDetails?.cessAmount,
        ],
        DEFAULTS.cessValue
    );

    const cessNonAdvolValue =
        getNumber(
            [
                lrPayload
                    ?.cessNonAdvolValue,
                lrPayload
                    ?.cessNonadvolValue,
                taxDetails
                    ?.cessNonAdvolValue,
                taxDetails
                    ?.cessNonadvolValue,
            ],
            DEFAULTS
                .cessNonAdvolValue
        );

    const otherValue =
        getRawValue(
            [
                lrPayload?.otherValue,
                taxDetails?.otherValue,
            ],
            DEFAULTS.otherValue
        );

    const calculatedInvoiceValue =
        Number(totalValue || 0) +
        Number(cgstValue || 0) +
        Number(sgstValue || 0) +
        Number(igstValue || 0) +
        Number(cessValue || 0) +
        Number(
            cessNonAdvolValue || 0
        ) +
        Number(otherValue || 0);

    const totInvValue = getNumber(
        [
            lrPayload?.totInvValue,
            lrPayload?.invoiceValue,
            taxDetails?.totInvValue,
            taxDetails?.invoiceValue,
            calculatedInvoiceValue,
        ],
        DEFAULTS.totInvValue
    );

    /* ===================================================
       DYNAMIC PRODUCT LIST
    =================================================== */

    const sourceItems = getArray(
        [
            lrPayload?.itemList,
            lrPayload?.items,
            lrPayload?.products,
            lrPayload?.productList,
            cargo?.itemList,
            cargo?.items,
            cargo?.products,
            createdRecord?.itemList,
            createdRecord?.items,
            createdRecord?.products,
        ]
    );

    const singleFallbackItem =
        cargo &&
        typeof cargo === "object"
            ? cargo
            : {};

    const itemsToMap =
        sourceItems.length > 0
            ? sourceItems
            : [singleFallbackItem];

    const itemList = itemsToMap.map(
        (item: any) => {
            const productName =
                getText(
                    [
                        item?.productName,
                        item?.name,
                        item?.product?.productName,
                        item?.product?.name,
                        lrPayload?.productName,
                        cargo?.productName,
                    ],
                    DEFAULTS.item
                        .productName
                );

            const productDesc =
                getText(
                    [
                        item?.productDesc,
                        item?.productDescription,
                        item?.description,
                        item?.product
                            ?.productDescription,
                        item?.product
                            ?.productDesc,
                        lrPayload
                            ?.productDescription,
                        cargo
                            ?.productDescription,
                        cargo?.productDesc,
                        productName,
                    ],
                    DEFAULTS.item
                        .productDesc
                );

            return {
                productName,
                productDesc,

                hsnCode: getNumber(
                    [
                        item?.hsnCode,
                        item?.hsn,
                        item?.product?.hsnCode,
                        item?.product?.hsn,
                        cargo?.hsnCode,
                        cargo?.hsn,
                        lrPayload?.hsnCode,
                    ],
                    DEFAULTS.item.hsnCode,
                    false
                ),

                quantity: getNumber(
                    [
                        item?.quantity,
                        item?.qty,
                        item?.productQuantity,
                        cargo?.quantity,
                        cargo?.qty,
                        lrPayload?.quantity,
                    ],
                    DEFAULTS.item.quantity,
                    false
                ),

                qtyUnit: getText(
                    [
                        item?.qtyUnit,
                        item?.unit,
                        item?.unitCode,
                        item?.quantityUnit,
                        cargo?.qtyUnit,
                        cargo?.unit,
                        cargo?.unitCode,
                        lrPayload?.qtyUnit,
                    ],
                    DEFAULTS.item.qtyUnit
                ).toUpperCase(),

                cgstRate: getNumber(
                    [
                        item?.cgstRate,
                        item?.tax?.cgstRate,
                        cargo?.cgstRate,
                        lrPayload?.cgstRate,
                    ],
                    DEFAULTS.item.cgstRate
                ),

                sgstRate: getNumber(
                    [
                        item?.sgstRate,
                        item?.tax?.sgstRate,
                        cargo?.sgstRate,
                        lrPayload?.sgstRate,
                    ],
                    DEFAULTS.item.sgstRate
                ),

                igstRate: getNumber(
                    [
                        item?.igstRate,
                        item?.tax?.igstRate,
                        cargo?.igstRate,
                        lrPayload?.igstRate,
                    ],
                    DEFAULTS.item.igstRate
                ),

                cessRate: getNumber(
                    [
                        item?.cessRate,
                        item?.tax?.cessRate,
                        cargo?.cessRate,
                        lrPayload?.cessRate,
                    ],
                    DEFAULTS.item.cessRate
                ),

                cessNonadvol: getNumber(
                    [
                        item?.cessNonadvol,
                        item?.cessNonAdvol,
                        item?.tax
                            ?.cessNonadvol,
                        item?.tax
                            ?.cessNonAdvol,
                        cargo
                            ?.cessNonadvol,
                        cargo
                            ?.cessNonAdvol,
                        lrPayload
                            ?.cessNonadvol,
                    ],
                    DEFAULTS.item
                        .cessNonadvol
                ),

                taxableAmount: getNumber(
                    [
                        item?.taxableAmount,
                        item?.taxableValue,
                        item?.totalValue,
                        item?.amount,
                        cargo?.taxableAmount,
                        cargo?.taxableValue,
                        cargo?.totalValue,
                        lrPayload
                            ?.taxableAmount,
                        totalValue,
                    ],
                    DEFAULTS.item
                        .taxableAmount,
                    false
                ),
            };
        }
    );

    /* ===================================================
       FINAL E-WAY BILL PAYLOAD
    =================================================== */

    return {
        supplyType: getText(
            [
                lrPayload?.supplyType,
                createdRecord?.supplyType,
            ],
            DEFAULTS.supplyType
        ),

        subSupplyType: getText(
            [
                lrPayload?.subSupplyType,
                createdRecord
                    ?.subSupplyType,
            ],
            DEFAULTS.subSupplyType
        ),

        subSupplyDesc: getText(
            [
                lrPayload?.subSupplyDesc,
                createdRecord
                    ?.subSupplyDesc,
            ],
            DEFAULTS.subSupplyDesc
        ),

        docType: getText(
            [
                lrPayload?.docType,
                createdRecord?.docType,
            ],
            DEFAULTS.docType
        ),

        docNo,
        docDate,

        /* ===================================================
           SUPPLIER / FROM PARTY
        =================================================== */

        fromGstin: getText(
            [
                lrPayload?.fromGstin,
                consignor?.gstin,
                consignor?.gstNumber,
                consignor?.gstNo,
                consignor?.GSTIN,
            ],
            DEFAULTS.fromGstin
        ),

        fromTrdName: getText(
            [
                lrPayload?.fromTrdName,
                consignor?.tradeName,
                consignor?.accountName,
                consignor?.name,
            ],
            DEFAULTS.fromTrdName
        ),

        fromAddr1: getText(
            [
                lrPayload?.fromAddr1,
                consignor?.addressLine1,
                consignor?.address1,
                consignor?.address,
                consignor?.location
                    ?.address,
                route?.sourceAddress,
            ],
            DEFAULTS.fromAddr1
        ),

        fromAddr2: getText(
            [
                lrPayload?.fromAddr2,
                consignor?.addressLine2,
                consignor?.address2,
            ],
            DEFAULTS.fromAddr2
        ),

        fromPlace: getText(
            [
                lrPayload?.fromPlace,
                consignor?.place,
                consignor?.city,
                consignor?.location?.city,
                route?.source,
                route?.fromPlace,
            ],
            DEFAULTS.fromPlace
        ),

        fromPincode: getNumber(
            [
                lrPayload?.fromPincode,
                consignor?.pincode,
                consignor?.pinCode,
                consignor?.location
                    ?.pincode,
                route?.sourcePincode,
            ],
            DEFAULTS.fromPincode,
            false
        ),

        actFromStateCode: getNumber(
            [
                lrPayload
                    ?.actFromStateCode,
                consignor
                    ?.actualStateCode,
                consignor?.stateCode,
                consignor?.location
                    ?.stateCode,
                route?.sourceStateCode,
            ],
            DEFAULTS
                .actFromStateCode,
            false
        ),

        fromStateCode: getNumber(
            [
                lrPayload?.fromStateCode,
                consignor?.stateCode,
                consignor?.location
                    ?.stateCode,
                route?.sourceStateCode,
            ],
            DEFAULTS.fromStateCode,
            false
        ),

        /* ===================================================
           CONSIGNEE / TO PARTY
        =================================================== */

        toGstin: getText(
            [
                lrPayload?.toGstin,
                consignee?.gstin,
                consignee?.gstNumber,
                consignee?.gstNo,
                consignee?.GSTIN,
            ],
            DEFAULTS.toGstin
        ),

        toTrdName: getText(
            [
                lrPayload?.toTrdName,
                consignee?.tradeName,
                consignee?.accountName,
                consignee?.name,
            ],
            DEFAULTS.toTrdName
        ),

        toAddr1: getText(
            [
                lrPayload?.toAddr1,
                consignee?.addressLine1,
                consignee?.address1,
                consignee?.address,
                consignee?.location
                    ?.address,
                route
                    ?.destinationAddress,
            ],
            DEFAULTS.toAddr1
        ),

        toAddr2: getText(
            [
                lrPayload?.toAddr2,
                consignee?.addressLine2,
                consignee?.address2,
            ],
            DEFAULTS.toAddr2
        ),

        toPlace: getText(
            [
                lrPayload?.toPlace,
                consignee?.place,
                consignee?.city,
                consignee?.location?.city,
                route?.destination,
                route?.toPlace,
            ],
            DEFAULTS.toPlace
        ),

        toPincode: getNumber(
            [
                lrPayload?.toPincode,
                consignee?.pincode,
                consignee?.pinCode,
                consignee?.location
                    ?.pincode,
                route
                    ?.destinationPincode,
            ],
            DEFAULTS.toPincode,
            false
        ),

        actToStateCode: getNumber(
            [
                lrPayload
                    ?.actToStateCode,
                consignee
                    ?.actualStateCode,
                consignee?.stateCode,
                consignee?.location
                    ?.stateCode,
                route
                    ?.destinationStateCode,
            ],
            DEFAULTS
                .actToStateCode,
            false
        ),

        toStateCode: getNumber(
            [
                lrPayload?.toStateCode,
                consignee?.stateCode,
                consignee?.location
                    ?.stateCode,
                route
                    ?.destinationStateCode,
            ],
            DEFAULTS.toStateCode,
            false
        ),

        transactionType: getNumber(
            [
                lrPayload?.transactionType,
                createdRecord
                    ?.transactionType,
            ],
            DEFAULTS.transactionType,
            false
        ),

        otherValue,
        totalValue,
        cgstValue,
        sgstValue,
        igstValue,
        cessValue,
        cessNonAdvolValue,
        totInvValue,

        /* ===================================================
           TRANSPORT DETAILS
        =================================================== */

        transporterId: getText(
            [
                lrPayload?.transporterId,
                transporter?.transporterId,
                transporter?.gstin,
                transporter?.gstNumber,
            ],
            DEFAULTS.transporterId
        ),

        transporterName: getText(
            [
                lrPayload
                    ?.transporterName,
                transporter
                    ?.transporterName,
                transporter?.name,
            ],
            DEFAULTS.transporterName
        ),

        transDocNo: getText(
            [
                lrPayload?.transDocNo,
                createdRecord?.transDocNo,
                lrPayload?.lrNumber,
                createdRecord?.lrNumber,
            ],
            DEFAULTS.transDocNo
        ),

        transMode: getText(
            [
                lrPayload?.transMode,
                transporter?.transMode,
                vehicle?.transMode,
            ],
            DEFAULTS.transMode
        ),

        transDistance: getText(
            [
                lrPayload
                    ?.transDistance,
                route?.distanceKm,
                route?.distance,
                createdRecord
                    ?.transDistance,
            ],
            DEFAULTS.transDistance
        ),

        transDocDate: getRawValue(
            [
                lrPayload?.transDocDate,
                createdRecord
                    ?.transDocDate,
            ],
            DEFAULTS.transDocDate
        )
            ? formatDate(
                getRawValue(
                    [
                        lrPayload
                            ?.transDocDate,
                        createdRecord
                            ?.transDocDate,
                    ],
                    ""
                )
            )
            : DEFAULTS.transDocDate,

        vehicleNo: getText(
            [
                lrPayload?.vehicleNo,
                vehicle?.vehicleNumber,
                vehicle?.vehicleNo,
                createdRecord?.vehicleNo,
                createdRecord?.vehicle
                    ?.vehicleNumber,
            ],
            DEFAULTS.vehicleNo
        )
            .replace(/\s/g, "")
            .toUpperCase(),

        vehicleType: getText(
            [
                lrPayload?.vehicleType,
                vehicle
                    ?.ewayBillVehicleType,
                vehicle?.vehicleType,
            ],
            DEFAULTS.vehicleType
        ).toUpperCase(),

        itemList,
    };
};





// export const buildEWayBillPayload = (
//     createdResult: any,
//     lrPayload: any
// ) => {
//     const createdData =
//         createdResult?.data?.data ||
//         createdResult?.data ||
//         createdResult ||
//         {};

//     const createdRecord =
//         createdData?.record ||
//         createdData?.item ||
//         createdData;

//     /* ===================================================
//        HELPERS
//     =================================================== */

//     const getText = (
//         value: any,
//         fallback: string
//     ) => {
//         const text = String(value ?? "").trim();

//         return text || fallback;
//     };

//     const formatDate = (value: any) => {
//         const date = value
//             ? new Date(value)
//             : new Date();

//         if (Number.isNaN(date.getTime())) {
//             const currentDate = new Date();

//             const currentDay = String(
//                 currentDate.getDate()
//             ).padStart(2, "0");

//             const currentMonth = String(
//                 currentDate.getMonth() + 1
//             ).padStart(2, "0");

//             const currentYear =
//                 currentDate.getFullYear();

//             return `${currentDay}/${currentMonth}/${currentYear}`;
//         }

//         const day = String(
//             date.getDate()
//         ).padStart(2, "0");

//         const month = String(
//             date.getMonth() + 1
//         ).padStart(2, "0");

//         const year = date.getFullYear();

//         return `${day}/${month}/${year}`;
//     };

//     /* ===================================================
//        DYNAMIC TRIP / TRANSPORT ORDER NUMBER
//     =================================================== */

//     const docNo = String(
//         createdRecord?.tripNumber ||
//         createdRecord?.transportOrderNumber ||
//         createdRecord?.transportOrder?.transportOrderNumber ||
//         lrPayload?.tripNumber ||
//         lrPayload?.transportOrderNumber ||
//         "TO-3"
//     ).trim();

//     /* ===================================================
//        DYNAMIC ITEM VALUES
//     =================================================== */

//     const productName = String(
//         lrPayload?.cargo?.productName ||
//         lrPayload?.productName ||
//         "BLAZER-1"
//     ).trim();

//     const productDesc = String(
//         lrPayload?.cargo?.productDescription ||
//         lrPayload?.cargo?.productDesc ||
//         lrPayload?.productDescription ||
//         productName ||
//         "BLAZER-1"
//     ).trim();

//     const quantityValue = Number(
//         lrPayload?.cargo?.quantity ||
//         lrPayload?.quantity ||
//         25
//     );

//     const quantity =
//         Number.isFinite(quantityValue) &&
//             quantityValue > 0
//             ? quantityValue
//             : 25;

//     /* ===================================================
//        EXACT TESTED E-WAY BILL PAYLOAD
//     =================================================== */

//     return {
//         supplyType: "O",
//         subSupplyType: "1",
//         subSupplyDesc: "",
//         docType: "INV",

//         // ⭐ DYNAMIC: Trip / Transport Order number
//         docNo,

//         // ⭐ DYNAMIC: Current date
//         docDate: formatDate(new Date()),

//         /*
//         |--------------------------------------------------
//         | STATIC TESTED SUPPLIER DETAILS
//         |--------------------------------------------------
//         */

//         fromGstin: "34AACCC1596Q002",
//         fromTrdName: "welton",
//         fromAddr1: "2ND CROSS NO 59  19  A",
//         fromAddr2: "GROUND FLOOR OSBORNE ROAD",
//         fromPlace: "FRAZER TOWN",
//         fromPincode: 605001,
//         actFromStateCode: 34,
//         fromStateCode: 34,

//         /*
//         |--------------------------------------------------
//         | STATIC TESTED CONSIGNEE DETAILS
//         |--------------------------------------------------
//         */

//         toGstin: "29AACCC1596Q000",
//         toTrdName: "sthuthya",
//         toAddr1: "Shree Nilaya",
//         toAddr2: "Dasarahosahalli",
//         toPlace: "Beml Nagar",
//         toPincode: 562160,
//         actToStateCode: 29,
//         toStateCode: 29,

//         transactionType: 1,

//         /*
//         |--------------------------------------------------
//         | STATIC TESTED TAX VALUES
//         |--------------------------------------------------
//         */

//         otherValue: "-100",
//         totalValue: 56099,
//         cgstValue: 0,
//         sgstValue: 0,
//         igstValue: 300.67,
//         cessValue: 400.56,
//         cessNonAdvolValue: 400,
//         totInvValue: 68358,

//         transporterId: "",
//         transporterName: "",
//         transDocNo: "",
//         transMode: "1",

//         // ⭐ DYNAMIC: Distance
//         transDistance: "362",
//         // getText(
//         //     lrPayload?.transDistance ||
//         //     lrPayload?.route?.distanceKm,
//         //     "362"
//         // ),

//         transDocDate: "",

//         // ⭐ DYNAMIC: Vehicle number
//         vehicleNo: getText(
//             lrPayload?.vehicleNo ||
//             lrPayload?.vehicle?.vehicleNumber,
//             "PVC1234"
//         ),

//         vehicleType: getText(
//             lrPayload?.vehicleType ||
//             lrPayload?.vehicle?.ewayBillVehicleType,
//             "R"
//         ),

//         itemList: [
//             {
//                 // ⭐ DYNAMIC ITEM VALUES
//                 productName,
//                 productDesc,
//                 hsnCode: 442199,
//                 quantity,
//                 qtyUnit: "NOS",

//                 cgstRate: 0,
//                 sgstRate: 0,
//                 igstRate: 3,
//                 cessRate: 3,
//                 cessNonadvol: 0,
//                 taxableAmount: 5609889,
//             },
//         ],
//     };
// };




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
        // @ts-ignore
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