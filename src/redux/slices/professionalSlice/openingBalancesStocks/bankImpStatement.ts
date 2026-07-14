// importBankStatementSlice.ts

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import professionalAxios from "../../../../services/professionalAxios";

/* ===================================================
   TYPES
=================================================== */

type RejectValue = {
    message: string;
};

export type AccountRecord = {
    accountCode: string;
    accountName: string;
    accountType?: string;
    [key: string]: any;
};

export type DropdownOption = {
    label: string;
    value: string;
    raw: AccountRecord;
};

export type BankTransaction = {
    transactionDate?: string;
    narration?: string;
    referenceNumber?: string;
    paymentMode?: string;
    confidence?: string;
    creditAmount?: number | string;
    debitAmount?: number | string;
    [key: string]: any;
};

export type BankStatementSummary = {
    openingBalance?: number | string;
    closingBalance?: number | string;
    totalReceipts?: number | string;
    totalPayments?: number | string;
    receiptCount?: number;
    paymentCount?: number;
    [key: string]: any;
};

export type BankStatementParseResult = {
    summary?: BankStatementSummary;
    receipts?: BankTransaction[];
    payments?: BankTransaction[];
    [key: string]: any;
};

type ParseBankStatementPayload = {
    pdfBase64: string;
};

type SelectedAccount = {
    code: string;
    name: string;
};

type PostBankStatementPayload = {
    bankAccount: SelectedAccount;
    receiptAccount: SelectedAccount;
    paymentAccount: SelectedAccount;
    receipts: BankTransaction[];
    payments: BankTransaction[];
};

type VoucherPostResult = {
    receiptSuccessCount: number;
    receiptFailCount: number;
    paymentSuccessCount: number;
    paymentFailCount: number;
    totalSuccessCount: number;
    totalFailCount: number;
    failures: Array<{
        type: "receipt" | "payment";
        index: number;
        transaction: BankTransaction;
        message: string;
    }>;
};

type BankStatementAccountsResponse = {
    bankAccounts: DropdownOption[];
    receiptAccounts: DropdownOption[];
    paymentAccounts: DropdownOption[];
};

type ImportBankStatementState = {

    bankAccounts: DropdownOption[];
    receiptAccounts: DropdownOption[];
    paymentAccounts: DropdownOption[];

    parseResult: BankStatementParseResult | null;
    summary: BankStatementSummary | null;
    receipts: BankTransaction[];
    payments: BankTransaction[];

    postResult: VoucherPostResult | null;

    configLoading: boolean;
    accountsLoading: boolean;
    parseLoading: boolean;
    postLoading: boolean;

    progressText: string;
    error: string | null;
};

/* ===================================================
   CONSTANTS
=================================================== */

const API_PREFIX = "/eTaxSolnMongoApiBackend";

const BANK_STATEMENT_PARSE_URL =
    `${API_PREFIX}/users/bankStatement/ai/parse`;

const RECEIPT_SAVE_URL =
    `${API_PREFIX}/users/bookEZ/salesFlow/receipt/save`;

const PAYMENT_SAVE_URL =
    `${API_PREFIX}/users/bookez/purchaseFlow/payment/save`;

const GET_ALL_ACCOUNTS_URL =
    `${API_PREFIX}/accountMaster/getAllAccounts`;

const ALL_ACCOUNTS_LIMIT = 500;


/* ===================================================
   INITIAL STATE
=================================================== */

const initialState: ImportBankStatementState = {


    bankAccounts: [],
    receiptAccounts: [],
    paymentAccounts: [],

    parseResult: null,
    summary: null,
    receipts: [],
    payments: [],

    postResult: null,

    configLoading: false,
    accountsLoading: false,
    parseLoading: false,
    postLoading: false,

    progressText: "",
    error: null,
};

const getErrorMessage = (
    error: any,
    fallbackMessage: string
): string => {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallbackMessage
    );
};

const mapAccountsToDropdown = (
    accounts: AccountRecord[] = []
): DropdownOption[] => {
    if (!Array.isArray(accounts)) {
        return [];
    }

    return accounts
        .filter((account) => account?.accountCode)
        .map((account) => ({
            label: account.accountName || account.accountCode,
            value: account.accountCode,
            raw: account,
        }));
};

const parseTransactionDate = (dateValue?: string): string => {
    if (!dateValue) {
        return new Date().toISOString();
    }

    const normalizedValue = String(dateValue).trim();

    /*
      DD/MM/YYYY
    */
    const slashParts = normalizedValue.split("/");

    if (slashParts.length === 3) {
        const [day, month, year] = slashParts;

        const parsedDate = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString();
        }
    }

    /*
      DD-MM-YYYY
    */
    const dashParts = normalizedValue.split("-");

    if (
        dashParts.length === 3 &&
        dashParts[0]?.length === 2 &&
        dashParts[1]?.length === 2
    ) {
        const [day, month, year] = dashParts;

        const parsedDate = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString();
        }
    }

    const parsedDate = new Date(normalizedValue);

    if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
    }

    return new Date().toISOString();
};

const toDateOnly = (dateValue: string): string => {
    const parsedDate = new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
        return new Date().toISOString().split("T")[0];
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const day = String(parsedDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const buildNewReference = (
    amount: number,
    voucherDate: string
) => {
    const amountString = String(amount || 0);

    return {
        referenceType: "NEW",
        newReference: "ADV",
        billDueDate: toDateOnly(voucherDate),
        billAmount: amountString,
        adjustedAmount: amountString,
        returnAmount: 0,
    };
};

const buildReceiptPayload = ({
    transaction,
    bankAccount,
    bodyAccount,
}: {
    transaction: BankTransaction;
    bankAccount: SelectedAccount;
    bodyAccount: SelectedAccount;
}) => {
    const amount = Number(transaction?.creditAmount || 0);
    const voucherDate = parseTransactionDate(
        transaction?.transactionDate
    );

    return {
        recVoucherNumber: "AUTO",
        recVoucherDate: voucherDate,

        recAccountCode: bankAccount.code,
        recAccountName: bankAccount.name,

        recStatus: "open",
        recRemark: transaction?.narration || "",

        recBody: [
            {
                accountCode: bodyAccount.code,
                accountName: bodyAccount.name,

                amount: String(amount),
                netAmount: String(amount),

                references: [
                    buildNewReference(amount, voucherDate),
                ],

                remarks: null,
            },
        ],
    };
};

const buildPaymentPayload = ({
    transaction,
    bankAccount,
    bodyAccount,
}: {
    transaction: BankTransaction;
    bankAccount: SelectedAccount;
    bodyAccount: SelectedAccount;
}) => {
    const amount = Number(transaction?.debitAmount || 0);
    const voucherDate = parseTransactionDate(
        transaction?.transactionDate
    );

    return {
        payVoucherNumber: "AUTO",
        payVoucherDate: voucherDate,

        payAccountCode: bankAccount.code,
        payAccountName: bankAccount.name,

        payStatus: "open",
        payRemark: transaction?.narration || "",

        payFooter: {
            netAmount: String(amount),
            adjustedAmount: "0",
            balanceAmount: "0",
        },

        payBody: [
            {
                accountCode: bodyAccount.code,
                accountName: bodyAccount.name,

                amount: String(amount),
                netAmount: String(amount),

                references: [
                    buildNewReference(amount, voucherDate),
                ],

                remarks: null,
            },
        ],
    };
};

/* ===================================================
   GET ACCOUNT DROPDOWNS
=================================================== */

export const getBankStatementAccounts = createAsyncThunk<
    BankStatementAccountsResponse,
    void,
    { rejectValue: RejectValue }
>(
    "importBankStatement/getBankStatementAccounts",
    async (_, { rejectWithValue }) => {
        try {
            const [bankResponse, allAccountsResponse] =
                await Promise.all([
                    professionalAxios.get(GET_ALL_ACCOUNTS_URL, {
                        params: {
                            accountType: "cash,bank",
                            offset: 0,
                            limit: ALL_ACCOUNTS_LIMIT,
                        },
                    }),

                    professionalAxios.get(GET_ALL_ACCOUNTS_URL, {
                        params: {
                            offset: 0,
                            limit: ALL_ACCOUNTS_LIMIT,
                        },
                    }),
                ]);

            if (!bankResponse.data?.success) {
                return rejectWithValue({
                    message:
                        bankResponse.data?.message ||
                        "Failed to fetch bank accounts",
                });
            }

            if (!allAccountsResponse.data?.success) {
                return rejectWithValue({
                    message:
                        allAccountsResponse.data?.message ||
                        "Failed to fetch accounts",
                });
            }

            const bankItems =
                bankResponse.data?.data?.items ||
                bankResponse.data?.data?.records ||
                [];

            const allAccountItems =
                allAccountsResponse.data?.data?.items ||
                allAccountsResponse.data?.data?.records ||
                [];

            const bankAccounts =
                mapAccountsToDropdown(bankItems);

            const allAccounts =
                mapAccountsToDropdown(allAccountItems);

            return {
                bankAccounts,
                receiptAccounts: allAccounts,
                paymentAccounts: allAccounts,
            };
        } catch (error: any) {
            return rejectWithValue({
                message: getErrorMessage(
                    error,
                    "Failed to fetch account dropdowns"
                ),
            });
        }
    }
);

/* ===================================================
   PARSE BANK STATEMENT
=================================================== */

export const parseBankStatement = createAsyncThunk<
    BankStatementParseResult,
    ParseBankStatementPayload,
    { rejectValue: RejectValue }
>(
    "importBankStatement/parseBankStatement",
    async ({ pdfBase64 }, { rejectWithValue }) => {
        try {
            if (!pdfBase64?.trim()) {
                return rejectWithValue({
                    message: "PDF Base64 data is required",
                });
            }

            const response = await professionalAxios.post(
                BANK_STATEMENT_PARSE_URL,
                {
                    pdfBase64: pdfBase64.trim(),
                }
            );

            if (!response.data?.success) {
                return rejectWithValue({
                    message:
                        response.data?.message ||
                        "Failed to parse bank statement",
                });
            }

            return response.data?.data || {};
        } catch (error: any) {
            return rejectWithValue({
                message: getErrorMessage(
                    error,
                    "Failed to parse bank statement"
                ),
            });
        }
    }
);

/* ===================================================
   POST BANK STATEMENT VOUCHERS
=================================================== */

export const postBankStatementVouchers = createAsyncThunk<
    VoucherPostResult,
    PostBankStatementPayload,
    { rejectValue: RejectValue }
>(
    "importBankStatement/postBankStatementVouchers",
    async (
        {
            bankAccount,
            receiptAccount,
            paymentAccount,
            receipts,
            payments,
        },
        { rejectWithValue, dispatch }
    ) => {
        try {
            if (!bankAccount?.code) {
                return rejectWithValue({
                    message: "Please select Bank Account",
                });
            }

            if (!receiptAccount?.code) {
                return rejectWithValue({
                    message: "Please select Receipt Account",
                });
            }

            if (!paymentAccount?.code) {
                return rejectWithValue({
                    message: "Please select Payment Account",
                });
            }

            const receiptList = Array.isArray(receipts)
                ? receipts
                : [];

            const paymentList = Array.isArray(payments)
                ? payments
                : [];

            if (!receiptList.length && !paymentList.length) {
                return rejectWithValue({
                    message:
                        "No receipts or payments found to create",
                });
            }

            let receiptSuccessCount = 0;
            let receiptFailCount = 0;
            let paymentSuccessCount = 0;
            let paymentFailCount = 0;

            const failures: VoucherPostResult["failures"] = [];

            /* ================= RECEIPTS ================= */

            for (
                let index = 0;
                index < receiptList.length;
                index += 1
            ) {
                const transaction = receiptList[index];

                dispatch(
                    setBankStatementProgress(
                        `Creating receipt ${index + 1} of ${receiptList.length}...`
                    )
                );

                try {
                    const payload = buildReceiptPayload({
                        transaction,
                        bankAccount,
                        bodyAccount: receiptAccount,
                    });

                    const response =
                        await professionalAxios.post(
                            RECEIPT_SAVE_URL,
                            payload
                        );

                    if (response.data?.success === false) {
                        throw new Error(
                            response.data?.message ||
                            "Failed to create receipt"
                        );
                    }

                    receiptSuccessCount += 1;
                } catch (error: any) {
                    receiptFailCount += 1;

                    failures.push({
                        type: "receipt",
                        index,
                        transaction,
                        message: getErrorMessage(
                            error,
                            "Failed to create receipt"
                        ),
                    });

                    console.error(
                        `Receipt creation failed at index ${index}`,
                        error
                    );
                }
            }

            /* ================= PAYMENTS ================= */

            for (
                let index = 0;
                index < paymentList.length;
                index += 1
            ) {
                const transaction = paymentList[index];

                dispatch(
                    setBankStatementProgress(
                        `Creating payment ${index + 1} of ${paymentList.length}...`
                    )
                );

                try {
                    const payload = buildPaymentPayload({
                        transaction,
                        bankAccount,
                        bodyAccount: paymentAccount,
                    });

                    const response =
                        await professionalAxios.post(
                            PAYMENT_SAVE_URL,
                            payload
                        );

                    if (response.data?.success === false) {
                        throw new Error(
                            response.data?.message ||
                            "Failed to create payment"
                        );
                    }

                    paymentSuccessCount += 1;
                } catch (error: any) {
                    paymentFailCount += 1;

                    failures.push({
                        type: "payment",
                        index,
                        transaction,
                        message: getErrorMessage(
                            error,
                            "Failed to create payment"
                        ),
                    });

                    console.error(
                        `Payment creation failed at index ${index}`,
                        error
                    );
                }
            }

            const totalSuccessCount =
                receiptSuccessCount + paymentSuccessCount;

            const totalFailCount =
                receiptFailCount + paymentFailCount;

            return {
                receiptSuccessCount,
                receiptFailCount,
                paymentSuccessCount,
                paymentFailCount,
                totalSuccessCount,
                totalFailCount,
                failures,
            };
        } catch (error: any) {
            return rejectWithValue({
                message: getErrorMessage(
                    error,
                    "Failed to create bank statement vouchers"
                ),
            });
        } finally {
            dispatch(setBankStatementProgress(""));
        }
    }
);

/* ===================================================
   BANK STATEMENT SLICE
=================================================== */

const importBankStatementSlice = createSlice({
    name: "importBankStatement",

    initialState,

    reducers: {

        setBankStatementProgress: (
            state,
            action
        ) => {
            state.progressText = action.payload;
        },

        clearBankStatementParseResult: (state) => {
            state.parseResult = null;
            state.summary = null;
            state.receipts = [];
            state.payments = [];
            state.postResult = null;
            state.progressText = "";
            state.error = null;
        },

        clearBankStatementPostResult: (state) => {
            state.postResult = null;
        },

        clearBankStatementError: (state) => {
            state.error = null;
        },

        clearBankStatementState: (state) => {

            state.bankAccounts = [];
            state.receiptAccounts = [];
            state.paymentAccounts = [];

            state.parseResult = null;
            state.summary = null;
            state.receipts = [];
            state.payments = [];

            state.postResult = null;

            state.configLoading = false;
            state.accountsLoading = false;
            state.parseLoading = false;
            state.postLoading = false;

            state.progressText = "";
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            /* ================= ACCOUNTS ================= */

            .addCase(
                getBankStatementAccounts.pending,
                (state) => {
                    state.accountsLoading = true;
                    state.error = null;
                }
            )

            .addCase(
                getBankStatementAccounts.fulfilled,
                (state, action) => {
                    state.accountsLoading = false;

                    state.bankAccounts =
                        action.payload.bankAccounts;

                    state.receiptAccounts =
                        action.payload.receiptAccounts;

                    state.paymentAccounts =
                        action.payload.paymentAccounts;
                }
            )

            .addCase(
                getBankStatementAccounts.rejected,
                (state, action) => {
                    state.accountsLoading = false;

                    state.bankAccounts = [];
                    state.receiptAccounts = [];
                    state.paymentAccounts = [];

                    state.error =
                        action.payload?.message ||
                        "Failed to fetch accounts";
                }
            )

            /* ================= PARSE PDF ================= */

            .addCase(
                parseBankStatement.pending,
                (state) => {
                    state.parseLoading = true;
                    state.progressText =
                        "Fetching bank statement data...";
                    state.error = null;

                    state.parseResult = null;
                    state.summary = null;
                    state.receipts = [];
                    state.payments = [];
                    state.postResult = null;
                }
            )

            .addCase(
                parseBankStatement.fulfilled,
                (state, action) => {
                    state.parseLoading = false;
                    state.progressText = "";

                    const parseResult =
                        action.payload || {};

                    state.parseResult = parseResult;

                    state.summary =
                        parseResult.summary || null;

                    state.receipts = Array.isArray(
                        parseResult.receipts
                    )
                        ? parseResult.receipts
                        : [];

                    state.payments = Array.isArray(
                        parseResult.payments
                    )
                        ? parseResult.payments
                        : [];
                }
            )

            .addCase(
                parseBankStatement.rejected,
                (state, action) => {
                    state.parseLoading = false;
                    state.progressText = "";

                    state.parseResult = null;
                    state.summary = null;
                    state.receipts = [];
                    state.payments = [];

                    state.error =
                        action.payload?.message ||
                        "Failed to parse bank statement";
                }
            )

            /* ================= POST VOUCHERS ================= */

            .addCase(
                postBankStatementVouchers.pending,
                (state) => {
                    state.postLoading = true;
                    state.postResult = null;
                    state.error = null;
                }
            )

            .addCase(
                postBankStatementVouchers.fulfilled,
                (state, action) => {
                    state.postLoading = false;
                    state.progressText = "";
                    state.postResult = action.payload;
                }
            )

            .addCase(
                postBankStatementVouchers.rejected,
                (state, action) => {
                    state.postLoading = false;
                    state.progressText = "";

                    state.error =
                        action.payload?.message ||
                        "Failed to create vouchers";
                }
            );
    },
});

/* ===================================================
   EXPORT ACTIONS
=================================================== */

export const {
    setBankStatementProgress,
    clearBankStatementParseResult,
    clearBankStatementPostResult,
    clearBankStatementError,
    clearBankStatementState,
} = importBankStatementSlice.actions;

/* ===================================================
   EXPORT REDUCER
=================================================== */

export default importBankStatementSlice.reducer;