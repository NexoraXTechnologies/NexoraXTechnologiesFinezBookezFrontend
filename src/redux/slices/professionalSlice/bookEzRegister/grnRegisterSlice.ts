/* ===================================================
   GRN REGISTER SLICE
=================================================== */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type GRNRegisterPayload = {
    fromDate: string;
    toDate: string;
    accountCode?: string;
    productCode?: string;
    customCodes?: string[];
    selectedColumns?: string[];
    offset?: number;
    limit?: number;
    exportType?: "pdf" | "excel" | "";
};

type GRNRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    grnRegisterData: any[];
    pagination: any;
    totals: any;
    error: string | null;
};

/* ===================================================
   GET GRN REGISTER
=================================================== */

export const addGRNRegister = createAsyncThunk<
    any,
    GRNRegisterPayload,
    { rejectValue: RejectValue }
>(
    "grnRegisterSlice/addGRNRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/grnRegister",
                { ...payload },
                payload?.exportType
                    ? {
                        responseType: "blob",
                    }
                    : undefined
            );

            if (payload?.exportType) {
                const contentType = String(
                    res?.headers?.["content-type"] || ""
                );

                if (
                    contentType.includes("application/json") &&
                    res.data instanceof Blob
                ) {
                    const text = await res.data.text();

                    try {
                        const json = JSON.parse(text);

                        if (json?.success === false) {
                            return rejectWithValue({
                                message:
                                    json?.message ||
                                    json?.error ||
                                    "Failed to generate report",
                            });
                        }
                    } catch {
                        return rejectWithValue({
                            message:
                                "Failed to generate report",
                        });
                    }
                }

                return {
                    blob: res.data,
                    exportType:
                        payload.exportType,
                };
            }

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res?.data?.message ||
                        "Failed to fetch GRN register",
                });
            }

            return res?.data?.data;
        } catch (error: any) {
            let errorMessage =
                "Failed to fetch GRN register";

            const responseData =
                error?.response?.data;

            if (
                responseData instanceof Blob
            ) {
                try {
                    const text =
                        await responseData.text();

                    const json =
                        JSON.parse(text);

                    errorMessage =
                        json?.message ||
                        json?.error ||
                        errorMessage;
                } catch {
                    errorMessage =
                        error?.message ||
                        errorMessage;
                }
            } else {
                errorMessage =
                    responseData?.message ||
                    responseData?.error ||
                    error?.message ||
                    errorMessage;
            }

            return rejectWithValue({
                message: errorMessage,
            });
        }
    }
);

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: GRNRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    grnRegisterData: [],
    pagination: {},
    totals: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const grnRegisterSlice =
    createSlice({
        name: "grnRegisterSlice",

        initialState,

        reducers: {
            clearGRNRegisterError:
                (state) => {
                    state.error = null;
                },

            clearGRNRegisterData:
                (state) => {
                    state.grnRegisterData =
                        [];

                    state.pagination = {};
                    state.totals = {};
                    state.error = null;
                },
        },

        extraReducers: (builder) => {
            builder
                .addCase(
                    addGRNRegister.pending,
                    (
                        state,
                        action
                    ) => {
                        if (
                            action.meta.arg
                                ?.exportType
                        ) {
                            state.exportLoader =
                                true;
                        } else {
                            state.addLoader =
                                true;

                            state.listingLoader =
                                true;
                        }

                        state.error =
                            null;
                    }
                )

                .addCase(
                    addGRNRegister.fulfilled,
                    (
                        state,
                        action
                    ) => {
                        state.addLoader =
                            false;

                        state.listingLoader =
                            false;

                        state.exportLoader =
                            false;

                        if (
                            action.payload
                                ?.blob
                        ) {
                            return;
                        }

                        const data =
                            action.payload ||
                            {};

                        state.grnRegisterData =
                            data?.grns ||
                            data?.grn ||
                            data?.records ||
                            data?.details ||
                            data?.transactions ||
                            data?.data ||
                            [];

                        state.pagination =
                            data?.pagination ||
                            {};

                        state.totals =
                            data?.totals ||
                            data?.summary ||
                            data?.footer ||
                            {};

                        state.error =
                            null;
                    }
                )

                .addCase(
                    addGRNRegister.rejected,
                    (
                        state,
                        action
                    ) => {
                        state.addLoader =
                            false;

                        state.listingLoader =
                            false;

                        state.exportLoader =
                            false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to fetch GRN register";
                    }
                );
        },
    });

/* ===================================================
   EXPORTS
=================================================== */

export const {
    clearGRNRegisterError,
    clearGRNRegisterData,
} =
    grnRegisterSlice.actions;

export default grnRegisterSlice.reducer;