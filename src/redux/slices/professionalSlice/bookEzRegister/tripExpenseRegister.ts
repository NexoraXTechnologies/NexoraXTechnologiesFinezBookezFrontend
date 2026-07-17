import {
    createAsyncThunk,
    createSlice,
} from "@reduxjs/toolkit";

import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

type ExportType = "pdf" | "excel" | "";

type TripExpenseRegisterPayload = {
    fromDate?: string;
    toDate?: string;
    offset?: number;
    limit?: number;
    exportType?: ExportType;
    [key: string]: any;
};

type TripExpenseRegisterState = {
    addLoader: boolean;
    listingLoader: boolean;
    deleteLoader: boolean;
    exportLoader: boolean;

    createLoader: boolean;
    detailLoader: boolean;
    updateLoader: boolean;
    podUploadLoader: boolean;
    podDownloadLoader: boolean;

    tripExpenseRegisterData: any[];
    pagination: any;
    currentTripExpense: any | null;

    error: string | null;
};

/* ===================================================
   RESPONSE HELPERS
=================================================== */

const extractTripExpenseRecords = (
    response: any,
): any[] => {
    const roots = [
        response,
        response?.data,
        response?.data?.data,
        response?.result,
        response?.data?.result,
    ].filter(Boolean);

    for (const root of roots) {
        if (Array.isArray(root)) {
            return root;
        }

        const directCandidates = [
            root?.tripExpenses,
            root?.tripExpenseRegister,
            root?.expenses,
            root?.trips,
            root?.records,
            root?.items,
            root?.invoices,
        ];

        for (const candidate of directCandidates) {
            if (Array.isArray(candidate)) {
                return candidate;
            }

            if (
                candidate &&
                typeof candidate === "object"
            ) {
                const nestedCandidates = [
                    candidate?.tripExpenses,
                    candidate?.expenses,
                    candidate?.trips,
                    candidate?.records,
                    candidate?.items,
                    candidate?.data,
                ];

                const nested = nestedCandidates.find(
                    (item) => Array.isArray(item),
                );

                if (nested) {
                    return nested;
                }
            }
        }
    }

    return [];
};

const extractPagination = (
    response: any,
    records: any[],
) => {
    const pagination =
        response?.pagination ||
        response?.data?.pagination ||
        response?.data?.data?.pagination ||
        response?.result?.pagination ||
        response?.data?.result?.pagination ||
        response?.tripExpenseRegister?.pagination ||
        response?.data?.tripExpenseRegister
            ?.pagination ||
        {};

    const limit = Number(
        pagination?.limit ?? 10,
    );

    const totalDocs = Number(
        pagination?.totalDocs ??
        records.length,
    );

    return {
        offset: Number(
            pagination?.offset ?? 0,
        ),

        limit,
        totalDocs,

        totalPages: Number(
            pagination?.totalPages ??
            (totalDocs > 0
                ? Math.ceil(
                    totalDocs /
                    Math.max(limit, 1),
                )
                : 0),
        ),

        currentPage: Number(
            pagination?.currentPage ?? 1,
        ),

        hasNextPage: Boolean(
            pagination?.hasNextPage,
        ),

        hasPrevPage: Boolean(
            pagination?.hasPrevPage,
        ),
    };
};

const extractTripExpenseRecord = (
    response: any,
) => {
    const candidates = [
        response?.data?.tripExpense,
        response?.tripExpense,
        response?.data?.record,
        response?.record,
        response?.data?.data,
        response?.data,
        response,
    ];

    return (
        candidates.find(
            (candidate) =>
                candidate &&
                typeof candidate === "object" &&
                !Array.isArray(candidate),
        ) || null
    );
};

const getUploadedFileName = (
    response: any,
    fallbackName: string,
): string =>
    response?.data?.data?.name ||
    response?.data?.data?.fileName ||
    response?.data?.name ||
    response?.data?.fileName ||
    response?.name ||
    response?.fileName ||
    fallbackName;

/* ===================================================
   GET / EXPORT TRIP EXPENSE REGISTER
=================================================== */

export const addTripExpenseRegister =
    createAsyncThunk<
        any,
        TripExpenseRegisterPayload,
        {
            rejectValue: RejectValue;
        }
    >(
        "tripExpenseRegister/addTripExpenseRegister",

        async (
            payload,
            { rejectWithValue },
        ) => {
            try {
                const isExport =
                    payload?.exportType === "pdf" ||
                    payload?.exportType === "excel";

                const response =
                    await professionalAxios.post(
                        "/eTaxSolnMongoApiBackend/users/bookEZ/registers/tripExpenseRegister",

                        {
                            ...payload,
                        },

                        isExport
                            ? {
                                responseType: "blob",
                            }
                            : undefined,
                    );

                if (isExport) {
                    return {
                        blob: response.data,
                        exportType:
                            payload.exportType,
                    };
                }

                const responseData =
                    response?.data || {};

                if (
                    responseData?.success === false
                ) {
                    return rejectWithValue({
                        message:
                            responseData?.message ||
                            "Failed to fetch trip expense register",
                    });
                }

                const records =
                    extractTripExpenseRecords(
                        responseData,
                    );

                const pagination =
                    extractPagination(
                        responseData,
                        records,
                    );

                return {
                    records,
                    pagination,
                    rawResponse:
                        responseData,
                };
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to fetch trip expense register",
                });
            }
        },
    );

/* ===================================================
   CREATE TRIP EXPENSE
=================================================== */

export const createTripExpense =
    createAsyncThunk<
        any,
        any,
        {
            rejectValue: RejectValue;
        }
    >(
        "tripExpenseRegister/createTripExpense",

        async (
            payload,
            { rejectWithValue },
        ) => {
            try {
                const response =
                    await professionalAxios.post(
                        "/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/save",
                        payload,
                    );

                if (
                    response?.data?.success === false
                ) {
                    return rejectWithValue({
                        message:
                            response?.data?.message ||
                            "Failed to save trip expense",
                    });
                }

                return response?.data || null;
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to save trip expense",
                });
            }
        },
    );

/* ===================================================
   GET TRIP EXPENSE BY VOUCHER
=================================================== */

export const getTripExpenseByVoucherNumber =
    createAsyncThunk<
        any,
        string,
        {
            rejectValue: RejectValue;
        }
    >(
        "tripExpenseRegister/getTripExpenseByVoucherNumber",

        async (
            voucherNumber,
            { rejectWithValue },
        ) => {
            try {
                const response =
                    await professionalAxios.get(
                        `/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/getByVoucherNumber/${encodeURIComponent(
                            voucherNumber,
                        )}`,
                    );

                return response?.data || null;
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to load trip expense",
                });
            }
        },
    );

/* ===================================================
   UPDATE TRIP EXPENSE
=================================================== */

export const updateTripExpenseByVoucherNumber =
    createAsyncThunk<
        any,
        {
            voucherNumber: string;
            updateData: any;
        },
        {
            rejectValue: RejectValue;
        }
    >(
        "tripExpenseRegister/updateTripExpenseByVoucherNumber",

        async (
            {
                voucherNumber,
                updateData,
            },
            { rejectWithValue },
        ) => {
            try {
                const response =
                    await professionalAxios.put(
                        `/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/update/${encodeURIComponent(
                            voucherNumber,
                        )}`,
                        updateData,
                    );

                if (
                    response?.data?.success === false
                ) {
                    return rejectWithValue({
                        message:
                            response?.data?.message ||
                            "Failed to update trip expense",
                    });
                }

                return response?.data || null;
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to update trip expense",
                });
            }
        },
    );

/* ===================================================
   DELETE TRIP EXPENSE
=================================================== */

export const deleteTripExpenseByVoucherNumber =
    createAsyncThunk<
        any,
        string,
        {
            rejectValue: RejectValue;
        }
    >(
        "tripExpenseRegister/deleteTripExpenseByVoucherNumber",

        async (
            voucherNumber,
            { rejectWithValue },
        ) => {
            try {
                const response =
                    await professionalAxios.delete(
                        `/eTaxSolnMongoApiBackend/users/bookEZ/tripExpenses/delete/${encodeURIComponent(
                            voucherNumber,
                        )}`,
                    );

                return response?.data || null;
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Failed to delete trip expense",
                });
            }
        },
    );

/* ===================================================
   POD UPLOAD
=================================================== */

export const uploadTripExpensePodFile =
    createAsyncThunk<
        {
            fileName: string;
            rawResponse: any;
        },
        {
            file: File;
            name?: string;
        },
        {
            rejectValue: RejectValue;
        }
    >(
        "tripExpenseRegister/uploadTripExpensePodFile",

        async (
            {
                file,
                name = "",
            },
            { rejectWithValue },
        ) => {
            try {
                if (!file) {
                    return rejectWithValue({
                        message: "File is required",
                    });
                }

                const safeName = String(
                    name ||
                    file.name ||
                    "pod_file",
                ).replace(/[^\w.-]/g, "_");

                const renamedFile =
                    file.name === safeName
                        ? file
                        : new File(
                            [file],
                            safeName,
                            {
                                type:
                                    file.type ||
                                    "application/octet-stream",
                            },
                        );

                const formData =
                    new FormData();

                formData.append(
                    "file",
                    renamedFile,
                );

                formData.append(
                    "name",
                    safeName,
                );

                formData.append(
                    "uploadDate",
                    new Date().toISOString(),
                );

                const response =
                    await professionalAxios.post(
                        "/eTaxSolnMongoApiBackend/documents",
                        formData,
                    );

                if (
                    response?.data?.success === false
                ) {
                    return rejectWithValue({
                        message:
                            response?.data?.message ||
                            "POD upload failed",
                    });
                }

                return {
                    fileName:
                        getUploadedFileName(
                            response,
                            safeName,
                        ),
                    rawResponse:
                        response?.data,
                };
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "POD upload failed",
                });
            }
        },
    );

/* ===================================================
   POD DOWNLOAD
=================================================== */

export const downloadTripExpensePodFile =
    createAsyncThunk<
        {
            blob: Blob;
            fileName: string;
        },
        string,
        {
            rejectValue: RejectValue;
        }
    >(
        "tripExpenseRegister/downloadTripExpensePodFile",

        async (
            fileName,
            { rejectWithValue },
        ) => {
            try {
                if (!fileName) {
                    return rejectWithValue({
                        message:
                            "File name is required",
                    });
                }

                const response =
                    await professionalAxios.get(
                        "/eTaxSolnMongoApiBackend/documents/download",
                        {
                            params: {
                                name: fileName,
                            },

                            responseType: "blob",
                        },
                    );

                return {
                    blob: response.data,
                    fileName,
                };
            } catch (error: any) {
                return rejectWithValue({
                    message:
                        error?.response?.data
                            ?.message ||
                        error?.message ||
                        "Unable to download POD file",
                });
            }
        },
    );

/* ===================================================
   INITIAL STATE
=================================================== */

const initialState:
    TripExpenseRegisterState = {
    addLoader: false,
    listingLoader: false,
    deleteLoader: false,
    exportLoader: false,

    createLoader: false,
    detailLoader: false,
    updateLoader: false,
    podUploadLoader: false,
    podDownloadLoader: false,

    tripExpenseRegisterData: [],

    pagination: {
        offset: 0,
        limit: 10,
        totalDocs: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
    },

    currentTripExpense: null,

    error: null,
};

/* ===================================================
   SLICE
=================================================== */

const tripExpenseRegisterSlice =
    createSlice({
        name: "tripExpenseRegister",

        initialState,

        reducers: {
            clearTripExpenseRegisterError:
                (state) => {
                    state.error = null;
                },

            clearTripExpenseRegisterData:
                (state) => {
                    state.tripExpenseRegisterData =
                        [];

                    state.pagination = {
                        offset: 0,
                        limit: 10,
                        totalDocs: 0,
                        totalPages: 0,
                        currentPage: 1,
                        hasNextPage: false,
                        hasPrevPage: false,
                    };

                    state.error = null;
                },

            clearCurrentTripExpense:
                (state) => {
                    state.currentTripExpense =
                        null;
                    state.error = null;
                },
        },

        extraReducers: (builder) => {
            builder
                /* REGISTER */

                .addCase(
                    addTripExpenseRegister.pending,

                    (state, action) => {
                        const isExport =
                            Boolean(
                                action.meta.arg
                                    ?.exportType,
                            );

                        if (isExport) {
                            state.exportLoader =
                                true;
                        } else {
                            state.addLoader = true;
                            state.listingLoader =
                                true;
                        }

                        state.error = null;
                    },
                )

                .addCase(
                    addTripExpenseRegister.fulfilled,

                    (state, action) => {
                        const isExport =
                            Boolean(
                                action.meta.arg
                                    ?.exportType,
                            );

                        if (isExport) {
                            state.exportLoader =
                                false;
                            return;
                        }

                        state.addLoader = false;
                        state.listingLoader =
                            false;

                        state.tripExpenseRegisterData =
                            Array.isArray(
                                action.payload
                                    ?.records,
                            )
                                ? action.payload
                                    .records
                                : [];

                        state.pagination =
                            action.payload
                                ?.pagination || {
                                offset: 0,
                                limit: 10,
                                totalDocs: 0,
                                totalPages: 0,
                                currentPage: 1,
                                hasNextPage: false,
                                hasPrevPage: false,
                            };

                        state.error = null;
                    },
                )

                .addCase(
                    addTripExpenseRegister.rejected,

                    (state, action) => {
                        const isExport =
                            Boolean(
                                action.meta.arg
                                    ?.exportType,
                            );

                        if (isExport) {
                            state.exportLoader =
                                false;
                        } else {
                            state.addLoader =
                                false;
                            state.listingLoader =
                                false;
                            state.tripExpenseRegisterData =
                                [];
                        }

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to fetch trip expense register";
                    },
                )

                /* CREATE */

                .addCase(
                    createTripExpense.pending,
                    (state) => {
                        state.createLoader =
                            true;
                        state.error = null;
                    },
                )

                .addCase(
                    createTripExpense.fulfilled,
                    (state, action) => {
                        state.createLoader =
                            false;

                        state.currentTripExpense =
                            extractTripExpenseRecord(
                                action.payload,
                            );

                        state.error = null;
                    },
                )

                .addCase(
                    createTripExpense.rejected,
                    (state, action) => {
                        state.createLoader =
                            false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to save trip expense";
                    },
                )

                /* DETAIL */

                .addCase(
                    getTripExpenseByVoucherNumber.pending,
                    (state) => {
                        state.detailLoader =
                            true;
                        state.error = null;
                    },
                )

                .addCase(
                    getTripExpenseByVoucherNumber.fulfilled,
                    (state, action) => {
                        state.detailLoader =
                            false;

                        state.currentTripExpense =
                            extractTripExpenseRecord(
                                action.payload,
                            );

                        state.error = null;
                    },
                )

                .addCase(
                    getTripExpenseByVoucherNumber.rejected,
                    (state, action) => {
                        state.detailLoader =
                            false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to load trip expense";
                    },
                )

                /* UPDATE */

                .addCase(
                    updateTripExpenseByVoucherNumber.pending,
                    (state) => {
                        state.updateLoader =
                            true;
                        state.error = null;
                    },
                )

                .addCase(
                    updateTripExpenseByVoucherNumber.fulfilled,
                    (state, action) => {
                        state.updateLoader =
                            false;

                        const updated =
                            extractTripExpenseRecord(
                                action.payload,
                            );

                        if (updated) {
                            state.currentTripExpense =
                                updated;

                            state.tripExpenseRegisterData =
                                state.tripExpenseRegisterData.map(
                                    (item: any) => {
                                        const itemVoucher =
                                            item?.tripExpenseVoucherNumber ||
                                            item?.voucherNumber ||
                                            item?.tripExpenseNumber;

                                        const updatedVoucher =
                                            updated?.tripExpenseVoucherNumber ||
                                            updated?.voucherNumber ||
                                            updated?.tripExpenseNumber;

                                        return itemVoucher &&
                                            updatedVoucher &&
                                            itemVoucher ===
                                            updatedVoucher
                                            ? updated
                                            : item;
                                    },
                                );
                        }

                        state.error = null;
                    },
                )

                .addCase(
                    updateTripExpenseByVoucherNumber.rejected,
                    (state, action) => {
                        state.updateLoader =
                            false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to update trip expense";
                    },
                )

                /* DELETE */

                .addCase(
                    deleteTripExpenseByVoucherNumber.pending,
                    (state) => {
                        state.deleteLoader =
                            true;
                        state.error = null;
                    },
                )

                .addCase(
                    deleteTripExpenseByVoucherNumber.fulfilled,
                    (state, action) => {
                        state.deleteLoader =
                            false;

                        const deleted =
                            extractTripExpenseRecord(
                                action.payload,
                            );

                        const deletedVoucher =
                            deleted?.tripExpenseVoucherNumber ||
                            deleted?.voucherNumber ||
                            deleted?.tripExpenseNumber;

                        if (deletedVoucher) {
                            state.tripExpenseRegisterData =
                                state.tripExpenseRegisterData.filter(
                                    (item: any) => {
                                        const itemVoucher =
                                            item?.tripExpenseVoucherNumber ||
                                            item?.voucherNumber ||
                                            item?.tripExpenseNumber;

                                        return (
                                            itemVoucher !==
                                            deletedVoucher
                                        );
                                    },
                                );
                        }

                        state.error = null;
                    },
                )

                .addCase(
                    deleteTripExpenseByVoucherNumber.rejected,
                    (state, action) => {
                        state.deleteLoader =
                            false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to delete trip expense";
                    },
                )

                /* POD UPLOAD */

                .addCase(
                    uploadTripExpensePodFile.pending,
                    (state) => {
                        state.podUploadLoader =
                            true;
                        state.error = null;
                    },
                )

                .addCase(
                    uploadTripExpensePodFile.fulfilled,
                    (state) => {
                        state.podUploadLoader =
                            false;
                        state.error = null;
                    },
                )

                .addCase(
                    uploadTripExpensePodFile.rejected,
                    (state, action) => {
                        state.podUploadLoader =
                            false;

                        state.error =
                            action.payload
                                ?.message ||
                            "POD upload failed";
                    },
                )

                /* POD DOWNLOAD */

                .addCase(
                    downloadTripExpensePodFile.pending,
                    (state) => {
                        state.podDownloadLoader =
                            true;
                        state.error = null;
                    },
                )

                .addCase(
                    downloadTripExpensePodFile.fulfilled,
                    (state) => {
                        state.podDownloadLoader =
                            false;
                        state.error = null;
                    },
                )

                .addCase(
                    downloadTripExpensePodFile.rejected,
                    (state, action) => {
                        state.podDownloadLoader =
                            false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Unable to download POD file";
                    },
                );
        },
    });

export const {
    clearTripExpenseRegisterError,
    clearTripExpenseRegisterData,
    clearCurrentTripExpense,
} = tripExpenseRegisterSlice.actions;

export default tripExpenseRegisterSlice.reducer;