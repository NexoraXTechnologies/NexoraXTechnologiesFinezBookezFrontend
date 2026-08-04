/* ===================================================
    GET ALL E-Way Bills
=================================================== */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

import professionalAxios from "../../../../services/professionalAxios";


type RejectEWayBillPayload = {
    authtoken: string;
    payload: any;
};

type CancelEWayBillPayload = {
    authtoken: string;
    payload: any;
};

type ExtendEWayBillValidityPayload = {
    authtoken: string;
    payload: any;
};


type EWayBillState = {
    limit?: number,
    offset?: number,
    search?: string,
    status?: string
}

// ⭐ YELLOW STAR: ADDED — MULTI VEHICLE UPDATE PAYLOAD


type PrintDetailEWayBillPayload = {
    payload: any;
};

type EWayBillSliceState = {
    eWayBill: any[];
    selectedEWayBill: any | null;
    pagination: any | null;

    rejectLoader: boolean;
    cancelLoader: boolean;
    extendValidityLoader: boolean;
    multiVehicleUpdateLoader: boolean;
    actionResult: any | null;

    listingLoader: boolean;
    detailLoader: boolean;
    saveLoader: boolean;
    accessTokenLoader: boolean;
    generateLoader: boolean;
    updateLoader: boolean;

    pdfSaveLoader: boolean;
    pdfListingLoader: boolean;
    pdfDownloadLoader: boolean;

    // ⭐ YELLOW STAR: ADDED — GST GET E-WAY BILL LOADER
    getEWayBillFromGstLoader: boolean;

    // ⭐ YELLOW STAR: ADDED — PRINT DETAIL E-WAY BILL LOADER
    printDetailEWayBillLoader: boolean;

    accessToken: string | null;
    generatedEWayBill: any | null;

    // ⭐ YELLOW STAR: ADDED — GST E-WAY BILL DETAILS
    gstEWayBillDetails: any | null;

    // ⭐ YELLOW STAR: ADDED — PRINT DETAIL PDF
    printDetailEWayBillPdf: Blob | null;

    eWayBillPdfRecords: any[];
    eWayBillPdfPagination: any | null;
    selectedEWayBillPdf: any | null;

    successMessage: string | null;
    error: string | null;
};



type UpdateEWayBillPayload = {
    id: string;
    payload: any;
};


/* ===================================================
    E-WAY BILL PDF TYPES
=================================================== */

type SaveEWayBillPdfPayload = {
    payload: any;
};

type GetAllEWayBillPdfParams = {
    offset?: number;
    limit?: number;
    search?: string;
};

// type GetEWayBillPdfByNumberPayload = {
//     ewayBillNo: string | number;
// };

export const getAllEWayBill = createAsyncThunk(
    "eWayBill/getAllEWayBill",
    async (
        {
            limit = 10,
            offset = 0,
            search = "",
            status = "",
        }: EWayBillState = {},
        { rejectWithValue }
    ) => {
        try {
            const response = await professionalAxios.get(
                "/eTaxSolnMongoApiBackend/users/eWayBill/getAll",
                {
                    params: {
                        limit,
                        offset,
                        search,
                        status,

                    },
                }
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get all E-Way Bills",
            });
        }
    }
);


/* ===================================================
    GET E-Way Bill BY VOUCHER NUMBER
=================================================== */

export const getEWayBillByNumber = createAsyncThunk(
    "driverSettlement/getEWayBillByNumber",
    async (eWayBillNumber: string, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.get(
                `/eTaxSolnMongoApiBackend/users/eWayBill/${eWayBillNumber}`
            );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get E-Way Bill",
            });
        }
    }
);


/* ===================================================
    SAVE E-WAY BILL
=================================================== */

// export const saveEWayBill = createAsyncThunk(
//     "eWayBill/saveEWayBill",
//     async (payload: any, { rejectWithValue }) => {
//         try {
//             const response = await professionalAxios.post(
//                 "/eTaxSolnMongoApiBackend/users/eWayBill/save",
//                 payload
//             );

//             return response.data;
//         } catch (error: any) {
//             return rejectWithValue({
//                 message:
//                     error?.response?.data?.message ||
//                     error?.message ||
//                     "Failed to save E-Way Bill",
//             });
//         }
//     }
// );

type SaveEWayBillPayload = {
    payload: any;
};

export const saveEWayBill = createAsyncThunk(
    "eWayBill/saveEWayBill",
    async (
        {
            payload,
        }: SaveEWayBillPayload,
        {
            rejectWithValue,
        }
    ) => {
        try {
            if (
                !payload ||
                typeof payload !== "object"
            ) {
                return rejectWithValue({
                    message:
                        "E-Way Bill payload is required",
                });
            }

            const response =
                await professionalAxios.post(
                    "/eTaxSolnMongoApiBackend/users/eWayBill/save",

                    // ⭐ YELLOW STAR: COMPLETE DYNAMIC E-WAY BILL JSON BODY
                    payload,

                    {
                        // ⭐ YELLOW STAR: ACCESS-TOKEN CREDENTIALS IN QUERY PARAMS
                        params: {
                            action:
                                "ACCESSTOKEN",

                            aspid:
                                EWB_CREDENTIALS.aspid,

                            password:
                                EWB_CREDENTIALS.password,

                            gstin:
                                EWB_CREDENTIALS.gstin,

                            username:
                                EWB_CREDENTIALS.username,

                            ewbpwd:
                                EWB_CREDENTIALS.ewbpwd,
                        },
                    }
                );

            return (
                response?.data ||
                null
            );
        } catch (error: any) {
            const responseData =
                error?.response?.data;

            const errorMessage =
                responseData?.error?.error?.message ||
                responseData?.error?.message ||
                responseData?.data?.error?.error?.message ||
                responseData?.data?.error?.message ||
                responseData?.data?.message ||
                responseData?.message ||
                responseData?.errorMessage ||
                error?.message ||
                "Failed to save E-Way Bill";

            return rejectWithValue({
                message:
                    errorMessage,

                code:
                    responseData?.code ||
                    responseData?.error?.error?.error_cd ||
                    responseData?.error?.error_cd ||
                    "",

                error:
                    responseData?.error ||
                    responseData ||
                    null,
            });
        }
    }
);



/* ===================================================
    GET E-WAY BILL ACCESS TOKEN (GST API — called directly)
=================================================== */


/**
 * Hardcoded sandbox credentials — matches the working Postman
 * ACCESSTOKEN / GENEWAYBILL requests.
 *
 * TODO: Move these to env vars / a secrets store before going to production.
 */
const EWB_CREDENTIALS = {
    aspid: "1807712726",
    password: "NexoraX@1234",
    gstin: "34AACCC1596Q002",
    username: "TaxProEnvPON",
    ewbpwd: "abc34*",
};

/* ===================================================
    E-WAY BILL AXIOS

    Separate Axios instance for GST E-Way Bill APIs.
    Existing professionalAxios remains unchanged.
=================================================== */

const getProfessionalHeaders = () => {
    try {
        const storedHeaders = JSON.parse(
            localStorage.getItem("professionalHeaders") || "{}"
        );

        return {
            "x-db-name":
                storedHeaders?.["x-db-name"] ||
                storedHeaders?.xDbName ||
                "",

            authtoken:
                storedHeaders?.authtoken ||
                storedHeaders?.authToken ||
                "",

            loginuser:
                storedHeaders?.loginuser ||
                storedHeaders?.loginUser ||
                "",
        };
    } catch {
        return {
            "x-db-name": "",
            authtoken: "",
            loginuser: "",
        };
    }
};

const eWayBillAxios = axios.create({
    baseURL:
        professionalAxios.defaults.baseURL ||
        "",
});

eWayBillAxios.interceptors.request.use(
    (config) => {
        const headers = getProfessionalHeaders();

        if (headers["x-db-name"]) {
            config.headers.set(
                "x-db-name",
                headers["x-db-name"]
            );
        }

        if (headers.authtoken) {
            config.headers.set(
                "authtoken",
                headers.authtoken
            );
        }

        if (headers.loginuser) {
            config.headers.set(
                "loginuser",
                headers.loginuser
            );
        }

        return config;
    },
    (error) => Promise.reject(error)
);



/* ===================================================
    E-WAY BILL API ERROR EXTRACTOR
=================================================== */

// ⭐ YELLOW STAR: ADDED — GET ACTUAL EXTERNAL API ERROR

export const getEWayBillAccessToken = createAsyncThunk(
    "eWayBill/getEWayBillAccessToken",
    async (_, { rejectWithValue }) => {
        try {
            const response = await eWayBillAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/eWayBill/accessToken",
                {
                    params: {
                        action: "ACCESSTOKEN",
                        aspid: EWB_CREDENTIALS.aspid,
                        password: EWB_CREDENTIALS.password,
                        gstin: EWB_CREDENTIALS.gstin,
                        username: EWB_CREDENTIALS.username,
                        ewbpwd: EWB_CREDENTIALS.ewbpwd,
                    },
                }
            );

            const responseData = response?.data?.data || response?.data;

            if (!responseData?.authtoken) {
                return rejectWithValue({
                    message:
                        response?.data?.message ||
                        responseData?.error?.message ||
                        responseData?.errorMessage ||
                        "E-Way Bill access token was not received",
                });
            }

            return responseData;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.data?.message ||
                    error?.message ||
                    "Failed to get E-Way Bill access token",
            });
        }
    }
);



export const generateEWayBill = createAsyncThunk(
    "eWayBill/generateEWayBill",
    async (
        {
            payload,
            authtoken,
        }: {
            payload: any;
            authtoken: string;
        },
        { rejectWithValue }
    ) => {
        try {
            if (!authtoken?.trim()) {
                return rejectWithValue({
                    message: "E-Way Bill access token is required",
                });
            }

            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/eWayBill/generate",
                payload,
                {
                    params: {
                        action: "GENEWAYBILL",
                        aspid: EWB_CREDENTIALS.aspid,
                        password: EWB_CREDENTIALS.password,
                        gstin: EWB_CREDENTIALS.gstin,
                        ewbpwd: EWB_CREDENTIALS.ewbpwd,
                        authtoken: authtoken.trim(),
                    },
                }
            );

            return response?.data?.data || response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.data?.message ||
                    error?.response?.data?.error?.message ||
                    error?.message ||
                    "Failed to generate E-Way Bill",
            });
        }
    }
);


/* ===================================================
    GET E-WAY BILL FROM GST
=================================================== */

// ⭐ YELLOW STAR: ADDED — GET E-WAY BILL FROM GST API

export const getEWayBillFromGst = createAsyncThunk(
    "eWayBill/getEWayBillFromGst",
    async (
        {
            authtoken,
            ewbNo,
        }: {
            authtoken: string;
            ewbNo: string | number;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await eWayBillAxios.get(
                "/eTaxSolnMongoApiBackend/users/bookez/eWayBill/getEwayBill",
                {
                    params: {
                        action: "GetEwayBill",
                        aspid: EWB_CREDENTIALS.aspid,
                        password: EWB_CREDENTIALS.password,
                        gstin: EWB_CREDENTIALS.gstin,

                        // GST E-Way Bill token
                        authtoken: authtoken.trim(),

                        ewbNo,
                    },
                }
            );

            return response?.data?.data || response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.data?.message ||
                    error?.message ||
                    "Failed to get E-Way Bill from GST",
            });
        }
    }
);


/* ===================================================
    UPDATE E-WAY BILL BY ID
=================================================== */

// ⭐ YELLOW STAR: ADDED — UPDATE SAVED E-WAY BILL

export const updateEWayBill = createAsyncThunk(
    "eWayBill/updateEWayBill",
    async (
        {
            id,
            payload,
        }: UpdateEWayBillPayload,
        { rejectWithValue }
    ) => {
        try {
            const normalizedId = String(
                id || ""
            ).trim();

            if (!normalizedId) {
                return rejectWithValue({
                    message:
                        "E-Way Bill document ID is required",
                });
            }

            if (
                !payload ||
                typeof payload !== "object"
            ) {
                return rejectWithValue({
                    message:
                        "E-Way Bill update payload is required",
                });
            }

            const response =
                await professionalAxios.put(
                    `/eTaxSolnMongoApiBackend/users/eWayBill/update/${normalizedId}`,
                    payload
                );

            return (
                response?.data ||
                null
            );
        } catch (error: any) {
            const responseData =
                error?.response?.data;

            const errorMessage =
                responseData?.error?.error?.message ||
                responseData?.error?.message ||
                responseData?.data?.error?.message ||
                responseData?.data?.message ||
                responseData?.message ||
                responseData?.errorMessage ||
                error?.message ||
                "Failed to update E-Way Bill";

            return rejectWithValue({
                message:
                    errorMessage,

                code:
                    responseData?.code ||
                    responseData?.error?.error?.error_cd ||
                    responseData?.error?.error_cd ||
                    "",

                error:
                    responseData?.error ||
                    responseData ||
                    null,
            });
        }
    }
);



/* ===================================================
    REJECT E-WAY BILL
=================================================== */

// ⭐ YELLOW STAR: ADDED — REJECT E-WAY BILL

export const rejectEWayBill = createAsyncThunk(
    "eWayBill/rejectEWayBill",
    async (
        {
            authtoken,
            payload,
        }: RejectEWayBillPayload,
        { rejectWithValue }
    ) => {
        try {
            const normalizedAuthToken = String(
                authtoken || ""
            ).trim();

            if (!normalizedAuthToken) {
                return rejectWithValue({
                    message:
                        "E-Way Bill access token is required",
                });
            }

            if (
                !payload ||
                typeof payload !== "object"
            ) {
                return rejectWithValue({
                    message:
                        "Reject E-Way Bill payload is required",
                });
            }

            const response = await eWayBillAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/eWayBill/rejEwb",
                payload,
                {
                    params: {
                        action: "REJEWB",
                        aspid: EWB_CREDENTIALS.aspid,
                        password:
                            EWB_CREDENTIALS.password,
                        gstin: EWB_CREDENTIALS.gstin,
                        username:
                            EWB_CREDENTIALS.username,
                        authtoken:
                            normalizedAuthToken,
                    },
                }
            );

            return (
                response?.data?.data ||
                response?.data ||
                null
            );
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.data?.message ||
                    error?.response?.data?.error?.message ||
                    error?.response?.data?.errorMessage ||
                    error?.message ||
                    "Failed to reject E-Way Bill",
            });
        }
    }
);


/* ===================================================
    CANCEL E-WAY BILL
=================================================== */

// ⭐ YELLOW STAR: ADDED — CANCEL E-WAY BILL

export const cancelEWayBill = createAsyncThunk(
    "eWayBill/cancelEWayBill",
    async (
        {
            authtoken,
            payload,
        }: CancelEWayBillPayload,
        { rejectWithValue }
    ) => {
        try {
            const normalizedAuthToken = String(
                authtoken || ""
            ).trim();

            if (!normalizedAuthToken) {
                return rejectWithValue({
                    message:
                        "E-Way Bill access token is required",
                });
            }

            if (
                !payload ||
                typeof payload !== "object"
            ) {
                return rejectWithValue({
                    message:
                        "Cancel E-Way Bill payload is required",
                });
            }

            const response = await eWayBillAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/eWayBill/canEwb",
                payload,
                {
                    params: {
                        action: "CANEWB",
                        aspid: EWB_CREDENTIALS.aspid,
                        password:
                            EWB_CREDENTIALS.password,
                        gstin: EWB_CREDENTIALS.gstin,
                        username:
                            EWB_CREDENTIALS.username,
                        authtoken:
                            normalizedAuthToken,
                    },
                }
            );

            return (
                response?.data?.data ||
                response?.data ||
                null
            );
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.data?.message ||
                    error?.response?.data?.error?.message ||
                    error?.response?.data?.errorMessage ||
                    error?.message ||
                    "Failed to cancel E-Way Bill",
            });
        }
    }
);


/* ===================================================
    EXTEND E-WAY BILL VALIDITY
=================================================== */

// ⭐ YELLOW STAR: ADDED — EXTEND E-WAY BILL VALIDITY

export const extendEWayBillValidity = createAsyncThunk(
    "eWayBill/extendEWayBillValidity",
    async (
        {
            authtoken,
            payload,
        }: ExtendEWayBillValidityPayload,
        { rejectWithValue }
    ) => {
        try {
            const normalizedAuthToken = String(
                authtoken || ""
            ).trim();

            if (!normalizedAuthToken) {
                return rejectWithValue({
                    message:
                        "E-Way Bill access token is required",
                });
            }

            if (
                !payload ||
                typeof payload !== "object"
            ) {
                return rejectWithValue({
                    message:
                        "Extend validity payload is required",
                });
            }

            const response = await eWayBillAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/eWayBill/extendValidity",
                payload,
                {
                    params: {
                        action: "EXTENDVALIDITY",
                        aspid: EWB_CREDENTIALS.aspid,
                        password:
                            EWB_CREDENTIALS.password,
                        gstin: EWB_CREDENTIALS.gstin,
                        username:
                            EWB_CREDENTIALS.username,
                        ewbpwd:
                            EWB_CREDENTIALS.ewbpwd,
                        authtoken:
                            normalizedAuthToken,
                    },
                }
            );

            return (
                response?.data?.data ||
                response?.data ||
                null
            );
        } catch (error: any) {
            const responseData =
                error?.response?.data;

            const errorMessage =
                responseData?.error?.error?.message ||
                responseData?.error?.message ||
                responseData?.data?.error?.error?.message ||
                responseData?.data?.error?.message ||
                responseData?.data?.message ||
                responseData?.message ||
                responseData?.errorMessage ||
                error?.message ||
                "Failed to extend E-Way Bill validity";

            return rejectWithValue({
                message: errorMessage,

                code:
                    responseData?.code ||
                    responseData?.error?.error?.error_cd ||
                    responseData?.error?.error_cd ||
                    "",

                error:
                    responseData?.error ||
                    responseData ||
                    null,
            });
        }
    }

);




/* ===================================================
    MULTI VEHICLE UPDATE
=================================================== */

// ⭐ YELLOW STAR: ADDED — MULTI VEHICLE UPDATE

/* ===================================================
    MULTI VEHICLE UPDATE
=================================================== */

// ⭐ YELLOW STAR: ADDED — MULTI VEHICLE UPDATE

export const multiVehicleUpdate = createAsyncThunk(
    "eWayBill/multiVehicleUpdate",
    async (
        {
            authtoken,
            payload,
        }: {
            authtoken: string;
            payload: {
                ewbNo: string | number;
                groupNo: string | number;
                oldvehicleNo: string;
                newVehicleNo: string;
                oldTranNo: string;
                newTranNo: string;
                fromPlace: string;
                fromState: string | number;
                reasonCode: string | number;
                reasonRem: string;
            };
        },
        { rejectWithValue }
    ) => {
        try {
            const normalizedAuthToken = String(
                authtoken || ""
            ).trim();

            if (!normalizedAuthToken) {
                return rejectWithValue({
                    message:
                        "E-Way Bill access token is required",
                });
            }

            if (
                !payload ||
                typeof payload !== "object"
            ) {
                return rejectWithValue({
                    message:
                        "Multi Vehicle Update payload is required",
                });
            }

            const ewbNo = Number(
                payload?.ewbNo
            );

            const groupNo = Number(
                payload?.groupNo
            );

            const oldvehicleNo = String(
                payload?.oldvehicleNo || ""
            )
                .trim()
                .toUpperCase();

            const newVehicleNo = String(
                payload?.newVehicleNo || ""
            )
                .trim()
                .toUpperCase();

            const oldTranNo = String(
                payload?.oldTranNo || ""
            ).trim();

            const newTranNo = String(
                payload?.newTranNo || ""
            ).trim();

            const fromPlace = String(
                payload?.fromPlace || ""
            ).trim();

            const fromState = Number(
                payload?.fromState
            );

            const reasonCode = String(
                payload?.reasonCode || ""
            ).trim();

            const reasonRem = String(
                payload?.reasonRem || ""
            ).trim();

            if (!ewbNo) {
                return rejectWithValue({
                    message:
                        "E-Way Bill number is required",
                });
            }

            if (!groupNo) {
                return rejectWithValue({
                    message:
                        "Multi Vehicle group number is required",
                });
            }

            if (!oldvehicleNo) {
                return rejectWithValue({
                    message:
                        "Old vehicle number is required",
                });
            }

            if (!newVehicleNo) {
                return rejectWithValue({
                    message:
                        "New vehicle number is required",
                });
            }

            if (
                oldvehicleNo ===
                newVehicleNo
            ) {
                return rejectWithValue({
                    message:
                        "Old and new vehicle numbers cannot be the same",
                });
            }

            if (!fromPlace) {
                return rejectWithValue({
                    message:
                        "From place is required",
                });
            }

            if (!fromState) {
                return rejectWithValue({
                    message:
                        "From state code is required",
                });
            }

            if (!reasonCode) {
                return rejectWithValue({
                    message:
                        "Vehicle update reason is required",
                });
            }

            if (!reasonRem) {
                return rejectWithValue({
                    message:
                        "Vehicle update reason remark is required",
                });
            }

            // ⭐ YELLOW STAR: EXACT BODY REQUIRED BY API
            const requestPayload = {
                ewbNo,
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

            const response =
                await eWayBillAxios.post(
                    "/eTaxSolnMongoApiBackend/users/bookez/eWayBill/multiVehicleUpdate",

                    // ⭐ BODY
                    requestPayload,

                    {
                        // ⭐ QUERY PARAMETERS
                        params: {
                            action:
                                "MULTIVEHUPD",

                            aspid:
                                EWB_CREDENTIALS.aspid,

                            password:
                                EWB_CREDENTIALS.password,

                            gstin:
                                EWB_CREDENTIALS.gstin,

                            username:
                                EWB_CREDENTIALS.username,

                            authtoken:
                                normalizedAuthToken,
                        },
                    }
                );

            return (
                response?.data?.data ||
                response?.data ||
                null
            );
        } catch (error: any) {
            const responseData =
                error?.response?.data;

            const apiErrorMessage =
                responseData?.error?.error?.message ||
                responseData?.error?.message ||
                responseData?.data?.error?.error?.message ||
                responseData?.data?.error?.message ||
                responseData?.data?.message ||
                responseData?.message ||
                responseData?.errorMessage ||
                error?.message ||
                "Failed to update E-Way Bill vehicle";

            const apiErrorCode =
                responseData?.error?.error?.error_cd ||
                responseData?.error?.error_cd ||
                responseData?.data?.error?.error?.error_cd ||
                responseData?.code ||
                "";

            return rejectWithValue({
                message:
                    apiErrorMessage,

                code:
                    apiErrorCode,

                error:
                    responseData?.error ||
                    responseData ||
                    null,
            });
        }
    }
);

/* ===================================================
    PRINT DETAILED E-WAY BILL
=================================================== */

// ⭐ YELLOW STAR: ADDED — PRINT DETAILED E-WAY BILL PDF

export const printDetailEWayBill = createAsyncThunk(
    "eWayBill/printDetailEWayBill",
    async (
        {
            payload,
        }: PrintDetailEWayBillPayload,
        { rejectWithValue }
    ) => {
        try {
            if (!payload || typeof payload !== "object") {
                return rejectWithValue({
                    message: "E-Way Bill print payload is required",
                });
            }

            const response = await eWayBillAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookez/eWayBill/printDetailEwb",
                payload,
                {
                    params: {
                        aspid: EWB_CREDENTIALS.aspid,
                        password: EWB_CREDENTIALS.password,

                        // Postman API uses Gstin with capital G.
                        Gstin: EWB_CREDENTIALS.gstin,
                    },
                    responseType: "blob",
                }
            );

            if (!(response?.data instanceof Blob)) {
                return rejectWithValue({
                    message: "Invalid E-Way Bill PDF response",
                });
            }

            return response.data;
        } catch (error: any) {
            let errorMessage =
                error?.message ||
                "Failed to print detailed E-Way Bill";

            const responseData =
                error?.response?.data;

            if (responseData instanceof Blob) {
                try {
                    const errorText =
                        await responseData.text();

                    const parsedError =
                        JSON.parse(errorText);

                    errorMessage =
                        parsedError?.message ||
                        parsedError?.error?.message ||
                        parsedError?.errorMessage ||
                        errorMessage;
                } catch {
                    try {
                        const errorText =
                            await responseData.text();

                        errorMessage =
                            errorText ||
                            errorMessage;
                    } catch {
                        // Keep fallback error.
                    }
                }
            } else {
                errorMessage =
                    error?.response?.data?.message ||
                    error?.response?.data?.data?.message ||
                    error?.response?.data?.error?.message ||
                    error?.response?.data?.errorMessage ||
                    errorMessage;
            }

            return rejectWithValue({
                message: errorMessage,
            });
        }
    }
);




/* ===================================================
    SAVE E-WAY BILL PDF
=================================================== */

// ⭐ YELLOW STAR: ADDED — SAVE E-WAY BILL PDF

export const saveEWayBillPdf = createAsyncThunk(
    "eWayBill/saveEWayBillPdf",
    async (
        {
            payload,
        }: SaveEWayBillPdfPayload,
        { rejectWithValue }
    ) => {
        try {
            if (
                !payload ||
                typeof payload !== "object"
            ) {
                return rejectWithValue({
                    message:
                        "E-Way Bill PDF payload is required",
                });
            }

            const response =
                await professionalAxios.post(
                    "/eTaxSolnMongoApiBackend/users/eWayBill/pdf/save",
                    payload
                );

            return (
                response?.data?.data ||
                response?.data ||
                null
            );
        } catch (error: any) {
            const responseData =
                error?.response?.data;

            const errorMessage =
                responseData?.error?.error?.message ||
                responseData?.error?.message ||
                responseData?.data?.error?.error?.message ||
                responseData?.data?.error?.message ||
                responseData?.data?.message ||
                responseData?.message ||
                responseData?.errorMessage ||
                error?.message ||
                "Failed to save E-Way Bill PDF";

            return rejectWithValue({
                message: errorMessage,

                code:
                    responseData?.code ||
                    responseData?.error?.error?.error_cd ||
                    responseData?.error?.error_cd ||
                    "",

                error:
                    responseData?.error ||
                    responseData ||
                    null,
            });
        }
    }
);



/* ===================================================
    GET ALL E-WAY BILL PDF RECORDS
=================================================== */

// ⭐ YELLOW STAR: ADDED — GET ALL SAVED E-WAY BILL PDFS

export const getAllEWayBillPdf = createAsyncThunk(
    "eWayBill/getAllEWayBillPdf",
    async (
        {
            offset = 0,
            limit = 20,
            search = "",
        }: GetAllEWayBillPdfParams = {},
        { rejectWithValue }
    ) => {
        try {
            const response =
                await professionalAxios.get(
                    "/eTaxSolnMongoApiBackend/users/eWayBill/pdf/getAll",
                    {
                        params: {
                            offset,
                            limit,
                            ...(String(search || "").trim()
                                ? {
                                    search:
                                        String(
                                            search
                                        ).trim(),
                                }
                                : {}),
                        },
                    }
                );

            return (
                response?.data?.data ||
                response?.data ||
                null
            );
        } catch (error: any) {
            const responseData =
                error?.response?.data;

            const errorMessage =
                responseData?.error?.error?.message ||
                responseData?.error?.message ||
                responseData?.data?.error?.error?.message ||
                responseData?.data?.error?.message ||
                responseData?.data?.message ||
                responseData?.message ||
                responseData?.errorMessage ||
                error?.message ||
                "Failed to get saved E-Way Bill PDFs";

            return rejectWithValue({
                message: errorMessage,

                code:
                    responseData?.code ||
                    responseData?.error?.error?.error_cd ||
                    responseData?.error?.error_cd ||
                    "",

                error:
                    responseData?.error ||
                    responseData ||
                    null,
            });
        }
    }
);



/* ===================================================
    GET E-WAY BILL PDF BY NUMBER
=================================================== */

// ⭐ YELLOW STAR: ADDED — GET SAVED PDF BY E-WAY BILL NUMBER

export const getEWayBillPdfByNumber = createAsyncThunk(
    "eWayBill/getEWayBillPdfByNumber",
    async (
        {
            ewayBillNo,
            includeBase64 = true,
        }: {
            ewayBillNo: string | number;
            includeBase64?: boolean;
        },
        { rejectWithValue }
    ) => {
        try {
            const response =
                await professionalAxios.get(
                    `/eTaxSolnMongoApiBackend/users/eWayBill/pdf/${encodeURIComponent(
                        String(ewayBillNo).trim()
                    )}`,
                    {
                        params: {
                            includeBase64,
                        },
                    }
                );

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "E-Way Bill PDF not found",

                code:
                    error?.response?.data?.code ||
                    "",

                status:
                    error?.response?.status ||
                    0,
            });
        }
    }
);





/* ===================================================
    SLICE
=================================================== */

const initialState: EWayBillSliceState = {
    eWayBill: [],
    selectedEWayBill: null,
    pagination: null,

    listingLoader: false,
    detailLoader: false,
    saveLoader: false,
    accessTokenLoader: false,
    generateLoader: false,
    rejectLoader: false,
    cancelLoader: false,
    extendValidityLoader: false,
    multiVehicleUpdateLoader: false,
    actionResult: null,
    updateLoader: false,

    // ⭐ YELLOW STAR: ADDED — GST GET E-WAY BILL LOADER
    getEWayBillFromGstLoader: false,

    // ⭐ YELLOW STAR: ADDED — PRINT DETAIL E-WAY BILL LOADER
    printDetailEWayBillLoader: false,
    pdfSaveLoader: false,
    pdfListingLoader: false,
    pdfDownloadLoader: false,


    eWayBillPdfRecords: [],
    eWayBillPdfPagination: null,
    selectedEWayBillPdf: null,

    accessToken: null,
    generatedEWayBill: null,

    // ⭐ YELLOW STAR: ADDED — GST E-WAY BILL DETAILS
    gstEWayBillDetails: null,

    // ⭐ YELLOW STAR: ADDED — PRINT DETAIL PDF
    printDetailEWayBillPdf: null,

    successMessage: null,
    error: null,
};

const eWayBillSlice = createSlice({
    name: "eWaybill",
    initialState,
    reducers: {
        clearEWayBillError: (state) => {
            state.error = null;
        },

        clearSelectedEWayBill: (state) => {
            state.selectedEWayBill = null;
            state.error = null;
        },

        clearEWayBillSuccessMessage: (state) => {
            state.successMessage = null;
        },

        clearEWayBillState: (state) => {
            state.error = null;
            state.successMessage = null;
            state.selectedEWayBill = null;
        },

        clearGeneratedEWayBill: (state) => {
            state.generatedEWayBill = null;
            state.accessToken = null;
        },

        // ⭐ YELLOW STAR: ADDED — CLEAR GST E-WAY BILL DETAILS
        clearGstEWayBillDetails: (state) => {
            state.gstEWayBillDetails = null;
            state.error = null;
        },

        // ⭐ YELLOW STAR: ADDED — CLEAR PRINT PDF
        clearPrintDetailEWayBillPdf: (state) => {
            state.printDetailEWayBillPdf = null;
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder

            .addCase(getAllEWayBill.pending, (state) => {
                state.listingLoader = true;
                state.error = null;
            })
            .addCase(getAllEWayBill.fulfilled, (state, action) => {
                state.listingLoader = false;
                const records = action.payload?.data?.items || [];
                state.eWayBill = Array.isArray(records) ? records : [];
                state.pagination = action.payload?.data?.pagination || null;
                state.error = null;
            })
            .addCase(getAllEWayBill.rejected, (state, action: any) => {
                state.listingLoader = false;
                state.eWayBill = [];
                state.pagination = null;
                state.error = action.payload?.message || "Failed to get e way bill";
            })



            /* ===================================================
                          GET BY e-way-bill NUMBER
                       =================================================== */

            .addCase(getEWayBillByNumber.pending, (state) => {
                state.detailLoader = true;
                state.error = null;
            })
            .addCase(getEWayBillByNumber.fulfilled, (state, action) => {
                state.detailLoader = false;

                // ✅ Do not overwrite transportContract array here
                state.selectedEWayBill = action.payload?.data || null;

                state.error = null;
            })
            .addCase(getEWayBillByNumber.rejected, (state, action: any) => {
                state.detailLoader = false;
                state.selectedEWayBill = null;
                state.error =
                    action.payload?.message || "Failed to get driver settlement";
            })


            /* ===================================================
        SAVE
    =================================================== */

            .addCase(saveEWayBill.pending, (state) => {
                state.saveLoader = true;
                state.error = null;
                state.successMessage = null;
            })

            .addCase(saveEWayBill.fulfilled, (state, action: any) => {
                state.saveLoader = false;
                state.successMessage =
                    action.payload?.message ||
                    "E-Way Bill saved successfully.";
                state.error = null;
            })

            .addCase(saveEWayBill.rejected, (state, action: any) => {
                state.saveLoader = false;
                state.error =
                    action.payload?.message ||
                    "Failed to save E-Way Bill";
            })


            /* ===================================================
        ACCESS TOKEN
    =================================================== */

            .addCase(getEWayBillAccessToken.pending, (state) => {
                state.accessTokenLoader = true;
                state.error = null;
            })

            .addCase(getEWayBillAccessToken.fulfilled, (state, action: any) => {
                state.accessTokenLoader = false;
                state.accessToken = action.payload?.authtoken || null;
                state.error = null;
            })

            .addCase(getEWayBillAccessToken.rejected, (state, action: any) => {
                state.accessTokenLoader = false;
                state.accessToken = null;
                state.error =
                    action.payload?.message ||
                    "Failed to get e-way bill access token";
            })


            /* ===================================================
        GENERATE
    =================================================== */

            .addCase(generateEWayBill.pending, (state) => {
                state.generateLoader = true;
                state.error = null;
            })

            .addCase(generateEWayBill.fulfilled, (state, action: any) => {
                state.generateLoader = false;
                state.generatedEWayBill = action.payload || null;
                state.error = null;
            })

            .addCase(generateEWayBill.rejected, (state, action: any) => {
                state.generateLoader = false;
                state.generatedEWayBill = null;
                state.error =
                    action.payload?.message ||
                    "Failed to generate E-Way Bill";
            })


            /* ===================================================
        GET E-WAY BILL FROM GST
    =================================================== */

            // ⭐ YELLOW STAR: ADDED — GET E-WAY BILL FROM GST

            .addCase(getEWayBillFromGst.pending, (state) => {
                state.getEWayBillFromGstLoader = true;
                state.gstEWayBillDetails = null;
                state.error = null;
            })

            .addCase(getEWayBillFromGst.fulfilled, (state, action: any) => {
                state.getEWayBillFromGstLoader = false;
                state.gstEWayBillDetails =
                    action.payload || null;
                state.error = null;
            })

            .addCase(getEWayBillFromGst.rejected, (state, action: any) => {
                state.getEWayBillFromGstLoader = false;
                state.gstEWayBillDetails = null;
                state.error =
                    action.payload?.message ||
                    "Failed to get E-Way Bill from GST";
            })


            /* ===================================================
        PRINT DETAILED E-WAY BILL
    =================================================== */

            // ⭐ YELLOW STAR: ADDED — PRINT DETAILED E-WAY BILL

            .addCase(printDetailEWayBill.pending, (state) => {
                state.printDetailEWayBillLoader = true;
                state.printDetailEWayBillPdf = null;
                state.error = null;
            })

            .addCase(printDetailEWayBill.fulfilled, (state, action: any) => {
                state.printDetailEWayBillLoader = false;
                state.printDetailEWayBillPdf =
                    action.payload || null;
                state.error = null;
            })

            .addCase(printDetailEWayBill.rejected, (state, action: any) => {
                state.printDetailEWayBillLoader = false;
                state.printDetailEWayBillPdf = null;
                state.error =
                    action.payload?.message ||
                    "Failed to print detailed E-Way Bill";
            })



            /* ===================================================
    SAVE E-WAY BILL PDF
=================================================== */

            .addCase(
                saveEWayBillPdf.pending,
                (state) => {
                    state.pdfSaveLoader =
                        true;

                    state.successMessage =
                        null;

                    state.error =
                        null;
                }
            )

            .addCase(
                saveEWayBillPdf.fulfilled,
                (state, action: any) => {
                    state.pdfSaveLoader =
                        false;

                    const savedPdfRecord =
                        action.payload?.record ||
                        action.payload?.item ||
                        action.payload?.data ||
                        action.payload ||
                        null;

                    if (savedPdfRecord) {
                        state.selectedEWayBillPdf =
                            savedPdfRecord;
                    }

                    state.successMessage =
                        action.payload?.message ||
                        "E-Way Bill PDF saved successfully.";

                    state.error =
                        null;
                }
            )

            .addCase(
                saveEWayBillPdf.rejected,
                (state, action: any) => {
                    state.pdfSaveLoader =
                        false;

                    state.error =
                        action.payload?.message ||
                        "Failed to save E-Way Bill PDF";
                }
            )


            /* ===================================================
                GET ALL E-WAY BILL PDF RECORDS
            =================================================== */

            .addCase(
                getAllEWayBillPdf.pending,
                (state) => {
                    state.pdfListingLoader =
                        true;

                    state.error =
                        null;
                }
            )

            .addCase(
                getAllEWayBillPdf.fulfilled,
                (state, action: any) => {
                    state.pdfListingLoader =
                        false;

                    const responseData =
                        action.payload || {};

                    const records =
                        responseData?.records ||
                        responseData?.items ||
                        responseData?.data?.records ||
                        responseData?.data?.items ||
                        responseData?.data ||
                        [];

                    state.eWayBillPdfRecords =
                        Array.isArray(records)
                            ? records
                            : [];

                    state.eWayBillPdfPagination =
                        responseData?.pagination ||
                        responseData?.data?.pagination ||
                        {
                            offset:
                                responseData?.offset ??
                                0,

                            limit:
                                responseData?.limit ??
                                20,

                            totalDocs:
                                responseData?.totalDocs ??
                                responseData?.totalRecords ??
                                (
                                    Array.isArray(
                                        records
                                    )
                                        ? records.length
                                        : 0
                                ),

                            totalPages:
                                responseData?.totalPages ??
                                1,

                            hasNextPage:
                                Boolean(
                                    responseData
                                        ?.hasNextPage
                                ),

                            hasPrevPage:
                                Boolean(
                                    responseData
                                        ?.hasPrevPage
                                ),
                        };

                    state.error =
                        null;
                }
            )

            .addCase(
                getAllEWayBillPdf.rejected,
                (state, action: any) => {
                    state.pdfListingLoader =
                        false;

                    state.eWayBillPdfRecords =
                        [];

                    state.error =
                        action.payload?.message ||
                        "Failed to get saved E-Way Bill PDFs";
                }
            )


            /* ===================================================
                GET E-WAY BILL PDF BY NUMBER
            =================================================== */

            .addCase(
                getEWayBillPdfByNumber.pending,
                (state) => {
                    state.pdfDownloadLoader =
                        true;

                    state.selectedEWayBillPdf =
                        null;

                    state.error =
                        null;
                }
            )

            .addCase(
                getEWayBillPdfByNumber.fulfilled,
                (state, action: any) => {
                    state.pdfDownloadLoader =
                        false;

                    state.selectedEWayBillPdf =
                        action.payload ||
                        null;

                    state.error =
                        null;
                }
            )

            .addCase(
                getEWayBillPdfByNumber.rejected,
                (state, action: any) => {
                    state.pdfDownloadLoader =
                        false;

                    state.selectedEWayBillPdf =
                        null;

                    state.error =
                        action.payload?.message ||
                        "Failed to get saved E-Way Bill PDF";
                }
            )


            /* ===================================================
    REJECT E-WAY BILL
=================================================== */

            .addCase(rejectEWayBill.pending, (state) => {
                state.rejectLoader = true;
                state.actionResult = null;
                state.error = null;
            })

            .addCase(rejectEWayBill.fulfilled, (state, action: any) => {
                state.rejectLoader = false;
                state.actionResult =
                    action.payload || null;
                state.successMessage =
                    action.payload?.message ||
                    "E-Way Bill rejected successfully.";
                state.error = null;
            })

            .addCase(rejectEWayBill.rejected, (state, action: any) => {
                state.rejectLoader = false;
                state.actionResult = null;
                state.error =
                    action.payload?.message ||
                    "Failed to reject E-Way Bill";
            })


            /* ===================================================
                CANCEL E-WAY BILL
            =================================================== */

            .addCase(cancelEWayBill.pending, (state) => {
                state.cancelLoader = true;
                state.actionResult = null;
                state.error = null;
            })

            .addCase(cancelEWayBill.fulfilled, (state, action: any) => {
                state.cancelLoader = false;
                state.actionResult =
                    action.payload || null;
                state.successMessage =
                    action.payload?.message ||
                    "E-Way Bill cancelled successfully.";
                state.error = null;
            })

            .addCase(cancelEWayBill.rejected, (state, action: any) => {
                state.cancelLoader = false;
                state.actionResult = null;
                state.error =
                    action.payload?.message ||
                    "Failed to cancel E-Way Bill";
            })


            /* ===================================================
                EXTEND E-WAY BILL VALIDITY
            =================================================== */

            .addCase(extendEWayBillValidity.pending, (state) => {
                state.extendValidityLoader = true;
                state.actionResult = null;
                state.error = null;
            })

            .addCase(extendEWayBillValidity.fulfilled, (state, action: any) => {
                state.extendValidityLoader = false;
                state.actionResult =
                    action.payload || null;
                state.successMessage =
                    action.payload?.message ||
                    "E-Way Bill validity extended successfully.";
                state.error = null;
            })

            .addCase(extendEWayBillValidity.rejected, (state, action: any) => {
                state.extendValidityLoader = false;
                state.actionResult = null;
                state.error =
                    action.payload?.message ||
                    "Failed to extend E-Way Bill validity";
            })



            /* ===================================================
    MULTI VEHICLE UPDATE
=================================================== */

            // ⭐ YELLOW STAR: ADDED — MULTI VEHICLE UPDATE

            .addCase(
                multiVehicleUpdate.pending,
                (state) => {
                    state.multiVehicleUpdateLoader =
                        true;

                    state.actionResult = null;
                    state.successMessage = null;
                    state.error = null;
                }
            )

            .addCase(
                multiVehicleUpdate.fulfilled,
                (state, action: any) => {
                    state.multiVehicleUpdateLoader =
                        false;

                    state.actionResult =
                        action.payload || null;

                    state.successMessage =
                        action.payload?.message ||
                        action.payload?.status_desc ||
                        action.payload?.statusDesc ||
                        "E-Way Bill vehicle updated successfully.";

                    state.error = null;
                }
            )

            .addCase(
                multiVehicleUpdate.rejected,
                (state, action: any) => {
                    state.multiVehicleUpdateLoader =
                        false;

                    state.actionResult = null;

                    state.error =
                        action.payload?.message ||
                        "Failed to update E-Way Bill vehicle";
                }
            )



            /* ===================================================
                UPDATE E-WAY BILL
            =================================================== */

            // ⭐ YELLOW STAR: ADDED — UPDATE SAVED E-WAY BILL

            .addCase(
                updateEWayBill.pending,
                (state) => {
                    state.updateLoader = true;
                    state.successMessage = null;
                    state.error = null;
                }
            )

            .addCase(
                updateEWayBill.fulfilled,
                (state, action: any) => {
                    state.updateLoader = false;

                    const updatedRecord =
                        action.payload?.data?.record ||
                        action.payload?.data?.item ||
                        action.payload?.data ||
                        action.payload?.record ||
                        action.payload?.item ||
                        null;

                    if (updatedRecord) {
                        const updatedId = String(
                            updatedRecord?._id ||
                            updatedRecord?.documentId ||
                            ""
                        );

                        const updatedEwayBillNo =
                            String(
                                updatedRecord?.ewayBillNo ||
                                updatedRecord?.ewayPayload
                                    ?.ewayBillNo ||
                                ""
                            );

                        state.eWayBill =
                            state.eWayBill.map(
                                (item: any) => {
                                    const itemId = String(
                                        item?._id ||
                                        item?.documentId ||
                                        ""
                                    );

                                    const itemEwayBillNo =
                                        String(
                                            item?.ewayBillNo ||
                                            item?.ewayPayload
                                                ?.ewayBillNo ||
                                            ""
                                        );

                                    const isSameRecord =
                                        (
                                            updatedId &&
                                            itemId ===
                                            updatedId
                                        ) ||
                                        (
                                            updatedEwayBillNo &&
                                            itemEwayBillNo ===
                                            updatedEwayBillNo
                                        );

                                    return isSameRecord
                                        ? {
                                            ...item,
                                            ...updatedRecord,
                                        }
                                        : item;
                                }
                            );

                        state.selectedEWayBill =
                            updatedRecord;
                    }

                    state.successMessage =
                        action.payload?.message ||
                        "E-Way Bill updated successfully.";

                    state.error = null;
                }
            )

            .addCase(
                updateEWayBill.rejected,
                (state, action: any) => {
                    state.updateLoader = false;

                    state.error =
                        action.payload?.message ||
                        "Failed to update E-Way Bill";
                }
            )
    }
})

export const {
    clearEWayBillError,
    clearSelectedEWayBill,
    clearEWayBillSuccessMessage,
    clearEWayBillState,
    clearGeneratedEWayBill,

    // ⭐ YELLOW STAR: ADDED — NEW CLEAR ACTIONS
    clearGstEWayBillDetails,
    clearPrintDetailEWayBillPdf,
} = eWayBillSlice.actions;

export default eWayBillSlice.reducer;