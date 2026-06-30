// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import professionalAxios from "../../../../services/professionalAxios";

// // Rejected thunk value shape
// type RejectValue = {
//     message: string;
// };

// export const getAccountReceivable = createAsyncThunk<
//     any,
//     void,
//     { rejectValue: RejectValue }

// >(
//     "accountReceivable/getAccountReceivable", async (_, { rejectWithValue }) => {

//         try {
//             const res = await professionalAxios.get("/eTaxSolnMongoApiBackend/users/bookEZ/reporting/accountsReceivable/customers")

//             if (!res.data?.success) {
//                 return rejectWithValue({
//                     message: res.data?.message || "failed to fetch account receivable"
//                 })
//             }
//             return res.data;
//         } catch (error: any) {
//             return rejectWithValue({
//                 message: error?.response?.data?.message ||
//                     error?.response?.data?.error || "failed to fetch account receivable",
//             })
//         }
//     }
// )


// /* ===================================================
//    SLICE
// =================================================== */

// const accountReceivableSlice = createSlice({
//     name: "accountReceivable",
//     initialState: {
//         addLoader: false,
//         listingLoader: false,
//         deleteLoader: false,
//         accountReceivable: [] as any[],
//         error: null as string | null,
//         summary: {
//             totalReceivableAmount: 0,
//         },

//         count: 0,
//         pagination: {
//             offset: 0,
//             limit: 20,
//             totalDocs: 6,
//             totalPages: 1,
//             currentPage: 1,
//             hasNextPage: false,
//             hasPrevPage: false,
//         }
//     },


//     reducers: {
//         clearAccountReceivableState: (state) => {
//             state.error = null;
//             state.addLoader = false;
//             state.deleteLoader = false;
//             state.listingLoader = false;



//         }
//     },

//     extraReducers: (builder) => {
//         builder

//             .addCase(getAccountReceivable.pending, (state) => {
//                 state.listingLoader = true;
//                 state.error = null;
//             })
//             .addCase(getAccountReceivable.fulfilled, (state, action) => {
//                 state.listingLoader = false;
//                 state.pagination = action.payload?.data?.pagination ?? state.pagination;
//                 state.accountReceivable = action.payload?.data?.records ?? [];
//                 state.summary=action.payload?.data?.summary
//                 state.count=action.payload?.data?.count
//             })
//             .addCase(getAccountReceivable.rejected, (state, action) => {
//                 state.listingLoader = false;
//                 state.error =
//                     action.payload?.message || "failed to fetch account receivable";

//                 state.accountReceivable = [];
//                 state.summary = {
//                     totalReceivableAmount: 0,
//                 };
//                 state.count = 0;
//             })
//     }
// })

// export const { clearAccountReceivableState } = accountReceivableSlice.actions;
// export default accountReceivableSlice.reducer;


import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
    message: string;
};

type AccountReceivableParams = {
    offset?: number;
    limit?: number;
    search?: string;
    exportType?: "pdf" | "excel" | "xlsx";
};

const downloadBlobFile = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
};

export const getAccountReceivable = createAsyncThunk<
    any,
    AccountReceivableParams | undefined,
    { rejectValue: RejectValue }
>(
    "accountReceivable/getAccountReceivable",
    async (params = {}, { rejectWithValue }) => {
        try {
            const {
                offset = 0,
                limit = 10,
                search = "",
                exportType,
            } = params;

            const isExport = Boolean(exportType);

            const apiUrl = isExport
                ? "/eTaxSolnMongoApiBackend/users/bookEZ/reporting/accountsReceivable"
                : "/eTaxSolnMongoApiBackend/users/bookEZ/reporting/accountsReceivable/customers";

            const res = await professionalAxios.get(apiUrl, {
                params: {
                    offset,
                    limit: isExport ? 120000 : limit,
                    search,
                    ...(exportType ? { exportType } : {}),
                },
                ...(isExport ? { responseType: "blob" } : {}),
            });

            if (isExport) {
                const fileExt = exportType === "pdf" ? "pdf" : "xlsx";
                const fileName = `AccountsReceivable_${Date.now()}.${fileExt}`;

                downloadBlobFile(res.data, fileName);

                return {
                    downloaded: true,
                    exportType,
                };
            }

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch account receivable",
                });
            }

            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    error?.message ||
                    "Failed to fetch account receivable",
            });
        }
    }
);

/* ===================================================
   SLICE
=================================================== */

const accountReceivableSlice = createSlice({
    name: "accountReceivable",

    initialState: {
        addLoader: false,
        listingLoader: false,
        deleteLoader: false,
        exportLoader: false,

        accountReceivable: [] as any[],

        error: null as string | null,

        summary: {
            totalReceivableAmount: 0,
        },

        count: 0,

        pagination: {
            offset: 0,
            limit: 10,
            totalDocs: 0,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },
    },

    reducers: {
        clearAccountReceivableState: (state) => {
            state.error = null;
            state.addLoader = false;
            state.deleteLoader = false;
            state.listingLoader = false;
            state.exportLoader = false;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(getAccountReceivable.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.listingLoader = true;
                }

                state.error = null;
            })

            .addCase(getAccountReceivable.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.listingLoader = false;

                state.pagination =
                    action.payload?.data?.pagination ?? state.pagination;

                state.accountReceivable =
                    action.payload?.data?.records ?? [];

                state.summary =
                    action.payload?.data?.summary ?? {
                        totalReceivableAmount: 0,
                    };

                state.count =
                    action.payload?.data?.count ?? 0;
            })

            .addCase(getAccountReceivable.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.listingLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch account receivable";

                if (!isExport) {
                    state.accountReceivable = [];
                    state.summary = {
                        totalReceivableAmount: 0,
                    };
                    state.count = 0;
                }
            });
    },
});

export const { clearAccountReceivableState } =
    accountReceivableSlice.actions;

export default accountReceivableSlice.reducer;