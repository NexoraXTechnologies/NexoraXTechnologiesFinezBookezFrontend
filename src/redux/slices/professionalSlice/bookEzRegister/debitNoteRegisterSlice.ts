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

type DebitNoteRegisterPayload = {
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

type DebitNoteRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;
    debitNoteRegisterData: any[];
    pagination: any;
    totals: any;
    error: string | null;
};

/* ===================================================
   GET CREDIT NOTE REGISTER
=================================================== */

export const addDebitNoteRegister = createAsyncThunk<
    any,
    DebitNoteRegisterPayload,
    { rejectValue: RejectValue }
>(
    "debitNoteRegisterSlice/addDebitNoteRegister",
    async (payload, { rejectWithValue }) => {
        try {
            const res = await professionalAxios.post(
                "/eTaxSolnMongoApiBackend/users/bookEZ/registers/salesDebitNoteRegister",
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
                        "Failed to fetch debit note register",
                });
            }

            return res?.data?.data;
        } catch (error: any) {
            let errorMessage =
                "Failed to fetch debit note register";

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

const initialState: DebitNoteRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,
    debitNoteRegisterData: [],
    pagination: {},
    totals: {},
    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const debitNoteRegisterSlice =
    createSlice({
        name: "debitNoteRegisterSlice",

        initialState,

        reducers: {
            clearDebitNoteRegisterError:
                (state) => {
                    state.error = null;
                },

            clearDebitNoteRegisterData:
                (state) => {
                    state.debitNoteRegisterData =
                        [];

                    state.pagination = {};
                    state.totals = {};
                    state.error = null;
                },
        },

        extraReducers: (builder) => {
            builder
                .addCase(
                    addDebitNoteRegister.pending,
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
                    addDebitNoteRegister.fulfilled,
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

                        state.debitNoteRegisterData =
                            data?.debitNotes ||
                            data?.debitNote ||
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
                    addDebitNoteRegister.rejected,
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
    clearDebitNoteRegisterError,
    clearDebitNoteRegisterData,
} =
    debitNoteRegisterSlice.actions;

export default debitNoteRegisterSlice.reducer;