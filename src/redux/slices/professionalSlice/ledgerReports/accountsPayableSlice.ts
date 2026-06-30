// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import professionalAxios from "../../../../services/professionalAxios";

// // Rejected thunk value shape
// type RejectValue = {
//     message: string;
// };

// export const getAccountPayable = createAsyncThunk<
//     any,
//     void,
//     { rejectValue: RejectValue }

// >(
//     "accountPayable/getAccountPayable", async (_, { rejectWithValue }) => {

//         try {
//             const res = await professionalAxios.get("/eTaxSolnMongoApiBackend//users/bookEZ/reporting/accountsPayable/vendors")

//             if (!res.data?.success) {
//                 return rejectWithValue({
//                     message: res.data?.message || "failed to fetch account payable"
//                 })
//             }
//             return res.data;
//         } catch (error: any) {
//             return rejectWithValue({
//                 message: error?.response?.data?.message ||
//                     error?.response?.data?.error || "failed to fetch account payable",
//             })
//         }
//     }
// )


// /* ===================================================
//    SLICE
// =================================================== */

// const accountPayableSlice = createSlice({
//     name: "accountPayable",
//     initialState: {
//         addLoader: false,
//         listingLoader: false,
//         deleteLoader: false,
//         accountPayable: [] as any[],
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
//         clearAccountPayable: (state) => {
//             state.error = null;
//             state.addLoader = false;
//             state.deleteLoader = false;
//             state.listingLoader = false;



//         }
//     },

//     extraReducers: (builder) => {
//         builder

//             .addCase(getAccountPayable.pending, (state) => {
//                 state.listingLoader = true;
//                 state.error = null;
//             })
//             .addCase(getAccountPayable.fulfilled, (state, action) => {
//                 state.listingLoader = false;
//                 state.pagination = action.payload?.data?.pagination ?? state.pagination;
//                 state.accountPayable = action.payload?.data?.records ?? [];
//                 state.summary=action.payload?.data?.summary
//                 state.count=action.payload?.data?.count
//             })
//             .addCase(getAccountPayable.rejected, (state, action) => {
//                 state.listingLoader = false;
//                 state.error =
//                     action.payload?.message || "failed to fetch account payable";

//                 state.accountPayable = [];
//                 state.summary = {
//                     totalReceivableAmount: 0,
//                 };
//                 state.count = 0;
//             })
//     }
// })

// export const { clearAccountPayable } = accountPayableSlice.actions;
// export default accountPayableSlice.reducer;


import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

type RejectValue = {
    message: string;
};

type AccountPayableParams = {
    offset?: number;
    limit?: number;
    search?: string;
    exportType?: "pdf" | "excel" | "xlsx";
};

const downloadBlobFile = (
    blob: Blob,
    fileName: string
) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
};

export const getAccountPayable = createAsyncThunk<
    any,
    AccountPayableParams | undefined,
    { rejectValue: RejectValue }
>(
    "accountPayable/getAccountPayable",
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
                ? "/eTaxSolnMongoApiBackend/users/bookEZ/reporting/accountsPayable"
                : "/eTaxSolnMongoApiBackend/users/bookEZ/reporting/accountsPayable/vendors";

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
                const fileName = `AccountsPayable_${Date.now()}.${fileExt}`;

                downloadBlobFile(res.data, fileName);

                return {
                    exportType,
                    downloaded: true,
                };
            }

            if (!res.data?.success) {
                return rejectWithValue({
                    message:
                        res.data?.message ||
                        "Failed to fetch account payable",
                });
            }

            return res.data;
        } catch (error: any) {
            return rejectWithValue({
                message:
                    error?.response?.data?.message ||
                    error?.response?.data?.error ||
                    error?.message ||
                    "Failed to fetch account payable",
            });
        }
    }
);

/* ===================================================
   SLICE
=================================================== */

const accountPayableSlice = createSlice({
    name: "accountPayable",

    initialState: {
        addLoader: false,
        listingLoader: false,
        deleteLoader: false,
        exportLoader: false,

        accountPayable: [] as any[],
        error: null as string | null,

        summary: {
            totalPayableAmount: 0,
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
        clearAccountPayable: (state) => {
            state.error = null;
            state.addLoader = false;
            state.deleteLoader = false;
            state.listingLoader = false;
            state.exportLoader = false;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(getAccountPayable.pending, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = true;
                } else {
                    state.listingLoader = true;
                }

                state.error = null;
            })

            .addCase(getAccountPayable.fulfilled, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                    return;
                }

                state.listingLoader = false;

                state.pagination =
                    action.payload?.data?.pagination ?? state.pagination;

                state.accountPayable =
                    action.payload?.data?.records ?? [];

                state.summary =
                    action.payload?.data?.summary ?? {
                        totalPayableAmount: 0,
                    };

                state.count =
                    action.payload?.data?.count ?? 0;
            })

            .addCase(getAccountPayable.rejected, (state, action) => {
                const isExport = Boolean(action.meta.arg?.exportType);

                if (isExport) {
                    state.exportLoader = false;
                } else {
                    state.listingLoader = false;
                }

                state.error =
                    action.payload?.message ||
                    "Failed to fetch account payable";

                if (!isExport) {
                    state.accountPayable = [];
                    state.summary = {
                        totalPayableAmount: 0,
                    };
                    state.count = 0;
                }
            });
    },
});

export const { clearAccountPayable } = accountPayableSlice.actions;
export default accountPayableSlice.reducer;