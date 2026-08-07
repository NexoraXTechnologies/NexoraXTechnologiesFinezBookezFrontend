import {
    createAsyncThunk,
    createSlice
} from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* =====================================================
   TYPES
===================================================== */

type RejectValue = {
    message: string;
};

export type CustomMasterValue = {
    code: string;
    name: string;
    [key: string]: any;
};

export type CustomMasters = Record<
    string,
    CustomMasterValue
>;

export type KitBodyItem = {
    productCode: string;
    productName: string;
    productDescription?: string;
    productHSNCode?: string;

    quantity: number;
    uom: string;
    rate: number;

    gross: number;

    discount: number;
    discountAmount: number;

    cgst: number;
    cgstAmount: number;

    sgst: number;
    sgstAmount: number;

    igst: number;
    igstAmount: number;

    netAmount: number;

    customMasters?: CustomMasters;

    [key: string]: any;
};

export type KitFooter = {
    grossAmount: number;
    discountAmount: number;

    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;

    netAmount: number;
    adjustedAmount: number;
    balanceAmount: number;

    [key: string]: any;
};

export type SaveKitCollectionPayload = {
    kitName: string;
    kitDocDate: string;
    kitRemark?: string;
    kitStatus: string;

    customMasters?: CustomMasters;

    kitBody: KitBodyItem[];

    kitFooter: KitFooter;

    [key: string]: any;
};

export type UpdateKitCollectionData =
    Partial<SaveKitCollectionPayload>;

export type UpdateKitCollectionPayload = {
    kitVoucherNumber: string;
    data: UpdateKitCollectionData;
};

export type GetAllKitCollectionsParams = {
    offset?: number;
    limit?: number;
    search?: string;
    status?: string;
};

type KitCollectionState = {
    kitCollections: any[];
    selectedKitCollection: any;

    pagination: any;

    loading: boolean;
    saveLoading: boolean;
    updateLoading: boolean;
    deleteLoading: boolean;

    error: string | null;
};

/* =====================================================
   INITIAL STATE
===================================================== */

const initialState: KitCollectionState = {
    kitCollections: [],
    selectedKitCollection: null,

    pagination: null,

    loading: false,
    saveLoading: false,
    updateLoading: false,
    deleteLoading: false,

    error: null,
};

/* =====================================================
   ERROR HANDLER
===================================================== */

const getErrorMessage = (
    error: any,
    fallbackMessage: string
) => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.message ||
        fallbackMessage
    );
};

/* =====================================================
   GET RESPONSE DATA
===================================================== */

const getResponseData = (payload: any) => {
    return payload?.data ?? payload;
};

const getResponseItem = (payload: any) => {
    const responseData =
        getResponseData(payload);

    return (
        responseData?.item ||
        responseData?.kitCollection ||
        responseData?.document ||
        responseData
    );
};

/* =====================================================
   SAVE KIT COLLECTION
===================================================== */

export const saveKitCollection =
    createAsyncThunk<
        any,
        SaveKitCollectionPayload,
        {
            rejectValue: RejectValue;
        }
    >(
        "kitCollection/saveKitCollection",
        async (
            payload,
            { rejectWithValue }
        ) => {
            try {
                const response =
                    await professionalAxios.post(
                        "/eTaxSolnMongoApiBackend/users/bookez/kitCollection/save",
                        payload
                    );

                return response.data;
            } catch (error: any) {
                return rejectWithValue({
                    message: getErrorMessage(
                        error,
                        "Failed to save kit collection."
                    ),
                });
            }
        }
    );

/* =====================================================
   UPDATE KIT COLLECTION
===================================================== */

export const updateKitCollection =
    createAsyncThunk<
        any,
        UpdateKitCollectionPayload,
        {
            rejectValue: RejectValue;
        }
    >(
        "kitCollection/updateKitCollection",
        async (
            {
                kitVoucherNumber,
                data,
            },
            { rejectWithValue }
        ) => {
            try {
                const response =
                    await professionalAxios.put(
                        `/eTaxSolnMongoApiBackend/users/bookez/kitCollection/update/${encodeURIComponent(
                            kitVoucherNumber
                        )}`,
                        data
                    );

                return {
                    ...response.data,
                    kitVoucherNumber,
                };
            } catch (error: any) {
                return rejectWithValue({
                    message: getErrorMessage(
                        error,
                        "Failed to update kit collection."
                    ),
                });
            }
        }
    );

/* =====================================================
   DELETE KIT COLLECTION
===================================================== */

export const deleteKitCollection =
    createAsyncThunk<
        any,
        string,
        {
            rejectValue: RejectValue;
        }
    >(
        "kitCollection/deleteKitCollection",
        async (
            kitVoucherNumber,
            { rejectWithValue }
        ) => {
            try {
                const response =
                    await professionalAxios.delete(
                        `/eTaxSolnMongoApiBackend/users/bookez/kitCollection/delete/${encodeURIComponent(
                            kitVoucherNumber
                        )}`
                    );

                return {
                    ...response.data,
                    kitVoucherNumber,
                };
            } catch (error: any) {
                return rejectWithValue({
                    message: getErrorMessage(
                        error,
                        "Failed to delete kit collection."
                    ),
                });
            }
        }
    );

/* =====================================================
   GET ALL KIT COLLECTIONS
===================================================== */

export const getAllKitCollections =
    createAsyncThunk<
        any,
        GetAllKitCollectionsParams | void,
        {
            rejectValue: RejectValue;
        }
    >(
        "kitCollection/getAllKitCollections",
        async (
            params,
            { rejectWithValue }
        ) => {
            try {
                const {
                    offset = 0,
                    limit = 100,
                    search = "",
                    status = "",
                } = params || {};

                const queryParams: Record<
                    string,
                    any
                > = {
                    offset,
                    limit,
                };

                if (search.trim()) {
                    queryParams.search =
                        search.trim();
                }

                if (status.trim()) {
                    queryParams.status =
                        status.trim();
                }

                const response =
                    await professionalAxios.get(
                        "/eTaxSolnMongoApiBackend/users/bookez/kitCollection/getAll",
                        {
                            params: queryParams,
                        }
                    );

                return response.data;
            } catch (error: any) {
                return rejectWithValue({
                    message: getErrorMessage(
                        error,
                        "Failed to fetch kit collections."
                    ),
                });
            }
        }
    );

/* =====================================================
   SLICE
===================================================== */

const kitCollectionSlice =
    createSlice({
        name: "kitCollection",

        initialState,

        reducers: {
            setSelectedKitCollection: (
                state,
                action: any
            ) => {
                state.selectedKitCollection =
                    action.payload;
            },

            clearSelectedKitCollection: (
                state
            ) => {
                state.selectedKitCollection =
                    null;
            },

            clearKitCollectionError: (
                state
            ) => {
                state.error = null;
            },

            resetKitCollectionState: () =>
                initialState,
        },

        extraReducers: (builder) => {
            /* =========================================
               GET ALL KIT COLLECTIONS
            ========================================= */

            builder
                .addCase(
                    getAllKitCollections.pending,
                    (state) => {
                        state.loading = true;
                        state.error = null;
                    }
                )
                .addCase(
                    getAllKitCollections.fulfilled,
                    (
                        state,
                        action
                    ) => {
                        state.loading = false;

                        const responseData =
                            getResponseData(
                                action.payload
                            );

                        state.kitCollections =
                            responseData?.items ||
                            responseData?.kitCollections ||
                            responseData?.documents ||
                            [];

                        state.pagination =
                            responseData?.pagination ||
                            null;
                    }
                )
                .addCase(
                    getAllKitCollections.rejected,
                    (
                        state,
                        action
                    ) => {
                        state.loading = false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to fetch kit collections.";
                    }
                );

            /* =========================================
               SAVE KIT COLLECTION
            ========================================= */

            builder
                .addCase(
                    saveKitCollection.pending,
                    (state) => {
                        state.saveLoading = true;
                        state.error = null;
                    }
                )
                .addCase(
                    saveKitCollection.fulfilled,
                    (
                        state,
                        action
                    ) => {
                        state.saveLoading = false;

                        const savedItem =
                            getResponseItem(
                                action.payload
                            );

                        state.selectedKitCollection =
                            savedItem;

                        if (
                            savedItem &&
                            typeof savedItem ===
                            "object" &&
                            savedItem
                                .kitVoucherNumber
                        ) {
                            const alreadyExists =
                                state.kitCollections.some(
                                    (
                                        item
                                    ) =>
                                        item?.kitVoucherNumber ===
                                        savedItem?.kitVoucherNumber
                                );

                            if (
                                !alreadyExists
                            ) {
                                state.kitCollections.unshift(
                                    savedItem
                                );
                            }
                        }
                    }
                )
                .addCase(
                    saveKitCollection.rejected,
                    (
                        state,
                        action
                    ) => {
                        state.saveLoading = false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to save kit collection.";
                    }
                );

            /* =========================================
               UPDATE KIT COLLECTION
            ========================================= */

            builder
                .addCase(
                    updateKitCollection.pending,
                    (state) => {
                        state.updateLoading =
                            true;

                        state.error = null;
                    }
                )
                .addCase(
                    updateKitCollection.fulfilled,
                    (
                        state,
                        action
                    ) => {
                        state.updateLoading =
                            false;

                        const updatedItem =
                            getResponseItem(
                                action.payload
                            );

                        const kitVoucherNumber =
                            action.payload
                                ?.kitVoucherNumber ||
                            updatedItem
                                ?.kitVoucherNumber;

                        state.selectedKitCollection =
                            updatedItem;

                        const itemIndex =
                            state.kitCollections.findIndex(
                                (item) =>
                                    item?.kitVoucherNumber ===
                                    kitVoucherNumber
                            );

                        if (
                            itemIndex !== -1
                        ) {
                            state.kitCollections[
                                itemIndex
                            ] = {
                                ...state
                                    .kitCollections[
                                itemIndex
                                ],
                                ...updatedItem,
                                kitVoucherNumber,
                            };
                        }
                    }
                )
                .addCase(
                    updateKitCollection.rejected,
                    (
                        state,
                        action
                    ) => {
                        state.updateLoading =
                            false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to update kit collection.";
                    }
                );

            /* =========================================
               DELETE KIT COLLECTION
            ========================================= */

            builder
                .addCase(
                    deleteKitCollection.pending,
                    (state) => {
                        state.deleteLoading =
                            true;

                        state.error = null;
                    }
                )
                .addCase(
                    deleteKitCollection.fulfilled,
                    (
                        state,
                        action
                    ) => {
                        state.deleteLoading =
                            false;

                        const kitVoucherNumber =
                            action.payload
                                ?.kitVoucherNumber;

                        state.kitCollections =
                            state.kitCollections.filter(
                                (item) =>
                                    item?.kitVoucherNumber !==
                                    kitVoucherNumber
                            );

                        if (
                            state
                                .selectedKitCollection
                                ?.kitVoucherNumber ===
                            kitVoucherNumber
                        ) {
                            state.selectedKitCollection =
                                null;
                        }
                    }
                )
                .addCase(
                    deleteKitCollection.rejected,
                    (
                        state,
                        action
                    ) => {
                        state.deleteLoading =
                            false;

                        state.error =
                            action.payload
                                ?.message ||
                            "Failed to delete kit collection.";
                    }
                );
        },
    });

/* =====================================================
   ACTIONS
===================================================== */

export const {
    setSelectedKitCollection,
    clearSelectedKitCollection,
    clearKitCollectionError,
    resetKitCollectionState,
} = kitCollectionSlice.actions;

/* =====================================================
   REDUCER
===================================================== */

export default kitCollectionSlice.reducer;