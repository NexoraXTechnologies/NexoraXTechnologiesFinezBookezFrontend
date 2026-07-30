/**
 * ewayBillService.ts
 *
 * Background E-Way Bill generation for the Trip LR Collection flow.
 * Orchestrates the redux thunks in eWayBillSlice.ts.
 *
 * BUSINESS RULE (do not violate):
 *  - LR creation is the PRIMARY process and must never be blocked or delayed by this module.
 *  - E-Way Bill generation is a SECONDARY, best-effort background process.
 *  - Any failure in this module must be swallowed silently (logged only) — never
 *    surfaced to the user via toast/alert, and never thrown back into the UI flow.
 *
 * Flow implemented here (per integration doc):
 *   createLR() succeeds -> navigate back immediately -> triggerEWayBillGeneration()
 *     -> getEWayBillAccessToken()
 *     -> generateEWayBill()
 *     -> (if GST says "already generated" / error 604) fetchExistingEWayBill()
 *     -> saveEWayBill()
 */

import {
    getEWayBillAccessToken,
    generateEWayBill,
    saveEWayBill,
} from "../../../../redux/slices/professionalSlice/transportation/eWayBillSlice";

/* ===================================================
   HELPERS
=================================================== */

const formatDDMMYYYY = (value: any) => {
    const date = value ? new Date(value) : new Date();

    if (Number.isNaN(date.getTime())) return "";

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
};

const getVoucherFromLRResult = (lrResult: any, lrPayload: any) =>
    lrResult?.voucherNumber ||
    lrResult?.data?.voucherNumber ||
    lrResult?.lrNumber ||
    lrResult?.data?.lrNumber ||
    lrPayload?.transportOrderNumber ||
    lrPayload?.tripNumber ||
    "";

const getLRIdFromResult = (lrResult: any) =>
    lrResult?._id || lrResult?.id || lrResult?.data?._id || lrResult?.data?.id || "";

/* ===================================================
   STEP 4 — BUILD PAYLOAD FROM LR DATA
=================================================== */

const buildEWayBillPayload = (lrPayload: any, docNo: string) => ({
    supplyType: "O",
    subSupplyType: "1",
    docType: "INV",
    docNo,
    docDate: formatDDMMYYYY(lrPayload?.lrDate),

    fromGstin: "", // TODO: source from company/consignor GST profile
    fromTrdName: lrPayload?.consignor?.name || "",
    fromAddr1: lrPayload?.consignor?.address || "",
    fromAddr2: "",
    fromPlace: lrPayload?.consignor?.location?.city || "",
    fromPincode: 0,
    fromStateCode: 0,

    toGstin: "", // TODO: source from consignee GST profile
    toTrdName: lrPayload?.consignee?.name || "",
    toAddr1: lrPayload?.consignee?.address || "",
    toAddr2: "",
    toPlace: lrPayload?.consignee?.location?.city || "",
    toPincode: 0,
    toStateCode: 0,

    transactionType: 1,

    totalValue: Number(lrPayload?.freight?.agreedFreight || 0),
    cgstValue: 0,
    sgstValue: 0,
    igstValue: 0,
    cessValue: 0,
    otherValue: 0,
    totInvValue: Number(lrPayload?.freight?.agreedFreight || 0),

    transporterId: "",
    transporterName: "",

    transMode: "1",
    transDistance: String(lrPayload?.route?.distanceKm || "0"),

    vehicleNo: lrPayload?.vehicle?.vehicleNumber || "",
    vehicleType: "R",

    itemList: [
        {
            productName: lrPayload?.cargo?.productName || "",
            productDesc: lrPayload?.cargo?.productName || "",
            hsnCode: 0, // TODO: map from product master if HSN is tracked
            quantity: Number(lrPayload?.cargo?.quantity || 0),
            qtyUnit: String(lrPayload?.cargo?.unit || "NOS").toUpperCase(),
            taxableAmount: Number(lrPayload?.freight?.agreedFreight || 0),
            cgstRate: 0,
            sgstRate: 0,
            igstRate: 0,
            cessRate: 0,
            cessNonadvol: 0,
        },
    ],
});

/**
 * Handles the "already generated for this document number" case (error_cd 604).
 * Rather than treating it as a hard failure, we should ideally look up the
 * existing e-way bill and link it to the LR anyway.
 *
 * TODO: The exact request/response contract for GetEwayBill (query params,
 * auth requirements) wasn't specified in the integration doc — wire this up
 * against your GetEwayBill Postman request once confirmed. Until then this
 * safely no-ops (logs only), which still satisfies "never surface EWB
 * failures to the user".
 */
const fetchExistingEWayBill = async (
    _docNo: string,
    _authtoken: string
): Promise<any | null> => {
    console.warn(
        "[EWB] Document already has an e-way bill; existing-bill lookup not yet wired (see TODO in fetchExistingEWayBill)."
    );
    return null;
};

/* ===================================================
   ORCHESTRATOR — CALL THIS AFTER LR CREATE SUCCEEDS
=================================================== */

/**
 * Fire-and-forget entry point. Call this AFTER createLRCollection resolves
 * successfully and AFTER you've already navigated back / shown the success
 * toast. Do NOT await this in a way that blocks the UI, and do NOT let its
 * rejection surface anywhere the user can see.
 *
 * `dispatch` is your redux store's dispatch (typed `any` here to avoid
 * pulling in your store's AppDispatch type into this file).
 */
export const triggerEWayBillGeneration = async (
    dispatch: any,
    lrResult: any,
    lrPayload: any
): Promise<void> => {
    try {
        const voucherNumber = getVoucherFromLRResult(lrResult, lrPayload);
        const lrId = getLRIdFromResult(lrResult);
        const tripNumber = lrPayload?.tripNumber || lrPayload?.transportOrderNumber || "";

        if (!voucherNumber) {
            console.warn("[EWB] Skipped: no voucher number found on LR result");
            return;
        }

        const requestPayload = buildEWayBillPayload(lrPayload, voucherNumber);

        // Step 3 — access token
        const tokenResult = await dispatch(getEWayBillAccessToken()).unwrap();
        const authtoken = tokenResult?.authtoken;

        if (!authtoken) {
            console.warn("[EWB] No authtoken returned, aborting silently");
            return;
        }

        // Step 5 — generate e-way bill
        let genResponse: any = null;

        try {
            genResponse = await dispatch(
                generateEWayBill({ payload: requestPayload, authtoken })
            ).unwrap();
        } catch (genError: any) {
            // GST sandbox returns "already generated" (error_cd 604) as a
            // 400 — treat that as recoverable instead of a hard failure.
            if (genError?.error_cd === "604") {
                const existing = await fetchExistingEWayBill(voucherNumber, authtoken);

                if (existing?.ewayBillNo) {
                    await dispatch(
                        saveEWayBill({
                            lrId,
                            voucherNumber,
                            tripNumber,
                            ewayBillNo: existing.ewayBillNo,
                            ewayBillDate: existing.ewayBillDate || "",
                            validUpto: existing.validUpto || "",
                            authToken: authtoken,
                            requestPayload,
                            responsePayload: existing,
                            createdAt: new Date().toISOString(),
                        })
                    ).unwrap();
                }

                return;
            }

            // Any other generation failure — log and stop, never surface.
            console.warn("[EWB] Generation failed silently", genError);
            return;
        }

        // Step 6/7 — success, save the record
        if (!genResponse?.ewayBillNo) {
            console.warn("[EWB] Generation response missing ewayBillNo, skipping save", genResponse);
            return;
        }

        await dispatch(
            saveEWayBill({
                lrId,
                voucherNumber,
                tripNumber,
                ewayBillNo: genResponse.ewayBillNo,
                ewayBillDate: genResponse.ewayBillDate,
                validUpto: genResponse.validUpto,
                authToken: authtoken,
                requestPayload,
                responsePayload: genResponse,
                createdAt: new Date().toISOString(),
            })
        ).unwrap();
    } catch (error) {
        // Per business rule: E-Way Bill failures must NEVER reach the user.
        console.error("[EWB] Background generation failed silently:", error);
    }
};