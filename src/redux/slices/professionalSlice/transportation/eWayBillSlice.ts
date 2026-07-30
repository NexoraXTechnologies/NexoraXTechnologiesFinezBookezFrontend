// /* ===================================================
//     GET ALL E-Way Bills
// =================================================== */

// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import professionalAxios from "../../../../services/professionalAxios";


// type EWayBillState = {
//     limit?: number,
//     offset?: number,
//     search?: string,
//     status?: string
// }

// type EWayBillSliceState = {
//     eWayBill: any[];
//     selectedEWayBill: any | null;
//     pagination: any | null;

//     listingLoader: boolean;
//     saveLoader: boolean;

//     successMessage: string | null;
//     error: string | null;
// };

// export const getAllEWayBill = createAsyncThunk(
//     "eWayBill/getAllEWayBill",
//     async (
//         {
//             limit = 10,
//             offset = 0,
//             search = "",
//             status = "",
//         }: EWayBillState = {},
//         { rejectWithValue }
//     ) => {
//         try {
//             const response = await professionalAxios.get(
//                 "/eTaxSolnMongoApiBackend/users/eWayBill/getAll",
//                 {
//                     params: {
//                         limit,
//                         offset,
//                         search,
//                         status,

//                     },
//                 }
//             );

//             return response?.data || null;
//         } catch (error: any) {
//             return rejectWithValue({
//                 message:
//                     error?.response?.data?.message ||
//                     error?.message ||
//                     "Failed to get all E-Way Bills",
//             });
//         }
//     }
// );


// /* ===================================================
//     SAVE E-WAY BILL
// =================================================== */

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


// /* ===================================================
//     SLICE
// =================================================== */
// const initialState: EWayBillSliceState = {
//     eWayBill: [],
//     selectedEWayBill: null,
//     pagination: null,

//     listingLoader: false,
//     saveLoader: false,

//     successMessage: null,
//     error: null,
// };

// const eWayBillSlice = createSlice({
//     name: "eWaybill",
//     initialState,
//     reducers: {
//         clearEWayBillError: (state) => {
//             state.error = null;
//         },

//         clearSelectedEWayBill: (state) => {
//             state.selectedEWayBill = null;
//             state.error = null;
//         },

//         clearEWayBillSuccessMessage: (state) => {
//             state.successMessage = null;
//         },

//         clearEWayBillState: (state) => {
//             state.error = null;
//             state.successMessage = null;
//             state.selectedEWayBill = null;
//         },
//     },

//     extraReducers: (builder) => {
//         builder

//             .addCase(getAllEWayBill.pending, (state) => {
//                 state.listingLoader = true;
//                 state.error = null;
//             })
//             .addCase(getAllEWayBill.fulfilled, (state, action) => {
//                 state.listingLoader = false;
//                 const records = action.payload?.data?.items || [];
//                 state.eWayBill = Array.isArray(records) ? records : [];
//                 state.pagination = action.payload?.data?.pagination || null;
//                 state.error = null;
//             })
//             .addCase(getAllEWayBill.rejected, (state, action: any) => {
//                 state.listingLoader = false;
//                 state.eWayBill = [];
//                 state.pagination = null;
//                 state.error = action.payload?.message || "Failed to get e way bill";
//             })


//             /* ===================================================
//         SAVE
//     =================================================== */

//             .addCase(saveEWayBill.pending, (state) => {
//                 state.saveLoader = true;
//                 state.error = null;
//                 state.successMessage = null;
//             })

//             .addCase(saveEWayBill.fulfilled, (state, action: any) => {
//                 state.saveLoader = false;
//                 state.successMessage =
//                     action.payload?.message ||
//                     "E-Way Bill saved successfully.";
//                 state.error = null;
//             })

//             .addCase(saveEWayBill.rejected, (state, action: any) => {
//                 state.saveLoader = false;
//                 state.error =
//                     action.payload?.message ||
//                     "Failed to save E-Way Bill";
//             })
//     }
// })

// export const {
//     clearEWayBillError,
//     clearSelectedEWayBill,
//     clearEWayBillSuccessMessage,
//     clearEWayBillState,
// } = eWayBillSlice.actions;

// export default eWayBillSlice.reducer;









/* ===================================================
    GET ALL E-Way Bills
=================================================== */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import professionalAxios from "../../../../services/professionalAxios";


type EWayBillState = {
    limit?: number,
    offset?: number,
    search?: string,
    status?: string
}

type EWayBillSliceState = {
    eWayBill: any[];
    selectedEWayBill: any | null;
    pagination: any | null;

    listingLoader: boolean;
    saveLoader: boolean;
    accessTokenLoader: boolean;
    generateLoader: boolean;

    accessToken: string | null;
    generatedEWayBill: any | null;

    successMessage: string | null;
    error: string | null;
};

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
    SAVE E-WAY BILL
=================================================== */

export const saveEWayBill = createAsyncThunk(
    "eWayBill/saveEWayBill",
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/eWayBill/save",
                payload
            );

            return response.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to save E-Way Bill",
            });
        }
    }
);


/* ===================================================
    GET E-WAY BILL ACCESS TOKEN (GST API — called directly)
=================================================== */

const EWB_BASE_URL = "https://gstsandbox.charteredinfo.com/ewaybillapi/dec/v1.03";

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

/**
 * IMPORTANT: this is a bare axios instance, deliberately NOT
 * `professionalAxios`. `professionalAxios` likely has its own `baseURL`,
 * default headers, and/or request/response interceptors (e.g. attaching
 * your app's own auth token, redirecting on 401, etc.). Any of those get
 * silently applied to every request made through it — including calls to
 * a completely unrelated third-party host like the GST sandbox — and can
 * cause GST's server to reject the request even though the exact same URL
 * works fine in Postman (which sends nothing extra).
 *
 * If this still fails from the browser, open DevTools > Network on the
 * failing request and check:
 *   1. Does a preflight OPTIONS request appear before the GET/POST? If it
 *      returns non-2xx or is missing `Access-Control-Allow-Origin`, that's
 *      a hard CORS block from GST's server — no frontend code change can
 *      fix that; the call must move server-side.
 *   2. Does the actual GET/POST show a red "CORS error" / "Failed" in the
 *      console with no response at all (not even a 4xx)? Same conclusion
 *      as above.
 *   3. If it DOES get a response but with different data than Postman,
 *      that points to a header/instance issue, not CORS — compare the
 *      request headers actually sent (Postman vs DevTools) line by line.
 */
const gstAxios = axios.create({
    timeout: 8000,
    // No baseURL, no default headers, no interceptors — mirrors exactly
    // what Postman sends.
});

export const getEWayBillAccessToken = createAsyncThunk(
    "eWayBill/getEWayBillAccessToken",
    async (_: void, { rejectWithValue }) => {
        try {
            const response = await gstAxios.get(`${EWB_BASE_URL}/auth`, {
                params: {
                    action: "ACCESSTOKEN",
                    aspid: EWB_CREDENTIALS.aspid,
                    password: EWB_CREDENTIALS.password,
                    gstin: EWB_CREDENTIALS.gstin,
                    username: EWB_CREDENTIALS.username,
                    ewbpwd: EWB_CREDENTIALS.ewbpwd,
                },
            });

            return response?.data || null;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to get e-way bill access token",
                isNetworkOrCorsError: !error?.response,
            });
        }
    }
);


/* ===================================================
    GENERATE E-WAY BILL (GST API — called directly)
=================================================== */

export const generateEWayBill = createAsyncThunk(
    "eWayBill/generateEWayBill",
    async (
        { payload, authtoken }: { payload: any; authtoken: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await gstAxios.post(
                `${EWB_BASE_URL}/ewayapi`,
                payload,
                {
                    params: {
                        action: "GENEWAYBILL",
                        aspid: EWB_CREDENTIALS.aspid,
                        password: EWB_CREDENTIALS.password,
                        gstin: EWB_CREDENTIALS.gstin,
                        ewbpwd: EWB_CREDENTIALS.ewbpwd,
                        authtoken,
                    },
                }
            );

            return response?.data || null;
        } catch (error: any) {
            // GST sandbox returns a 400 with a structured error body (e.g.
            // error_cd 604 "already generated for this document number").
            // Surface that structure so callers can decide whether it's
            // recoverable, instead of treating every rejection the same way.
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.message ||
                    "Failed to generate e-way bill",
                status_cd: error?.response?.data?.status_cd,
                error_cd: error?.response?.data?.error?.error_cd,
                raw: error?.response?.data,
                isNetworkOrCorsError: !error?.response,
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
    saveLoader: false,
    accessTokenLoader: false,
    generateLoader: false,

    accessToken: null,
    generatedEWayBill: null,

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
    }
})

export const {
    clearEWayBillError,
    clearSelectedEWayBill,
    clearEWayBillSuccessMessage,
    clearEWayBillState,
    clearGeneratedEWayBill,
} = eWayBillSlice.actions;

export default eWayBillSlice.reducer;