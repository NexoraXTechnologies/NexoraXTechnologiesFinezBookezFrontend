/* ===================================================
   CREDIT NOTE REGISTER SLICE
=================================================== */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type CreditNoteRegisterPayload = {
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

type CreditNoteRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    creditNoteRegisterData: any[];
    pagination: any;
    totals: any;
    error: string | null;
};

/* ===================================================
   GET CREDIT NOTE REGISTER
=================================================== */

export const addCreditNoteRegister = createAsyncThunk<
    any,
    CreditNoteRegisterPayload,
    { rejectValue: RejectValue }
>(
    "creditNoteRegisterSlice/addCreditNoteRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/salesCreditNoteRegister",
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
                        "Failed to fetch credit note register",
                });
            }

            return res?.data?.data;
        } catch (error: any) {
            let errorMessage =
                "Failed to fetch credit note register";

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

const initialState: CreditNoteRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    creditNoteRegisterData: [],
    pagination: {},
    totals: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const creditNoteRegisterSlice =
    createSlice({
        name: "creditNoteRegisterSlice",

        initialState,

        reducers: {
            clearCreditNoteRegisterError:
                (state) => {
                    state.error = null;
                },

            clearCreditNoteRegisterData:
                (state) => {
                    state.creditNoteRegisterData =
                        [];

                    state.pagination = {};
                    state.totals = {};
                    state.error = null;
                },
        },

        extraReducers: (builder) => {
            builder
                .addCase(
                    addCreditNoteRegister.pending,
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
                    addCreditNoteRegister.fulfilled,
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

                        state.creditNoteRegisterData =
                            data?.creditNotes ||
                            data?.creditNote ||
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
                    addCreditNoteRegister.rejected,
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
                            "Failed to fetch credit note register";
                    }
                );
        },
    });

/* ===================================================
   EXPORTS
=================================================== */

export const {
    clearCreditNoteRegisterError,
    clearCreditNoteRegisterData,
} =
    creditNoteRegisterSlice.actions;

export default creditNoteRegisterSlice.reducer;