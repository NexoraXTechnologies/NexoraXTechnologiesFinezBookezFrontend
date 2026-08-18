import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/DataTable";
import { Share } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getAllAccounts } from "../../../redux/slices/professionalSlice/accountMasterSlice";
import { DataREfreshButton } from "../../../components/buttons";
import professionalAxios from "../../../services/professionalAxios";
import { toast } from "react-toastify";

const PaymentReminders = () => {
    const dispatch = useDispatch<any>();

    const [customerCode, setCustomerCode] = useState<string>("");
    const [records, setRecords] = useState<any[]>([]);
    const [listingLoader, setListingLoader] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const {
        accounts = [],
        loading = false,
    } = useSelector((s: any) => s.accountMaster || {});

    const customerOptions = useMemo(() => {
        return (accounts || []).map((item: any) => ({
            label: item?.accountName || "",
            value: item?.accountCode || "",
            raw: item,
        }));
    }, [accounts]);

    const selectedCustomer = useMemo(() => {
        return customerOptions.find(
            (item: any) =>
                String(item?.value) ===
                String(customerCode)
        );
    }, [customerOptions, customerCode]);

    const totalRemainingAmount = useMemo(() => {
        return (records || []).reduce(
            (total: number, item: any) =>
                total +
                Number(
                    item?.balanceAmount ||
                    0
                ),
            0
        );
    }, [records]);

    useEffect(() => {
        dispatch(
            getAllAccounts({
                limit: 200,
                offset: 0,
                accountType: "customer",
            }) as any
        );
    }, [dispatch]);

    const fetchInvoices = async (
        selectedCustomerCode = customerCode,
        showRefreshMessage = false
    ) => {
        if (!selectedCustomerCode) {
            setRecords([]);
            return;
        }

        try {
            setListingLoader(true);

            const response =
                await professionalAxios.get(
                    "/users/bookez/salesFlow/salesInvoice/byCustomerCode",
                    {
                        params: {
                            customerCode:
                                selectedCustomerCode,
                        },
                    }
                );

            const responseData =
                response?.data?.data ??
                response?.data ??
                [];

            setRecords(
                Array.isArray(responseData)
                    ? responseData
                    : []
            );

            if (showRefreshMessage) {
                toast.success(
                    "Payment reminders refreshed"
                );
            }
        } catch (error: any) {
            console.log(
                "Fetch open sales invoices error:",
                error
            );

            setRecords([]);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load open sales invoices"
            );
        } finally {
            setListingLoader(false);
        }
    };

    useEffect(() => {
        if (!customerCode) {
            setRecords([]);
            return;
        }

        fetchInvoices(customerCode);
    }, [customerCode]);

    const handleRefresh = async () => {
        if (!customerCode) {
            toast.error(
                "Please select customer"
            );
            return;
        }

        try {
            setRefreshing(true);

            await fetchInvoices(
                customerCode,
                true
            );
        } finally {
            setRefreshing(false);
        }
    };

    const handleShare = (
        row: any
    ) => {
        console.log(
            "Share Payment Reminder:",
            row
        );
    };

    const mainColumns = [
        {
            key: "sInvVoucherNumber",
            title: "Voucher Number",
            render: (row: any) => (
                <span className="font-semibold text-primary">
                    {row?.sInvVoucherNumber ||
                        row?.voucherNumber ||
                        "-"}
                </span>
            ),
        },
        {
            key: "sInvVoucherDate",
            title: "Voucher Date",
            render: (row: any) => {
                const rawDate =
                    row?.sInvVoucherDate ||
                    row?.voucherDate;

                return (
                    <span className="font-medium text-muted-foreground">
                        {rawDate
                            ? new Date(
                                rawDate
                            ).toLocaleDateString(
                                "en-IN"
                            )
                            : "-"}
                    </span>
                );
            },
        },
        {
            key: "netAmount",
            title: "Net Amount",
            render: (row: any) => (
                <span className="font-semibold text-card-foreground">
                    ₹{" "}
                    {Number(
                        row?.netAmount ||
                        0
                    ).toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits:
                                2,
                            maximumFractionDigits:
                                2,
                        }
                    )}
                </span>
            ),
        },
        {
            key: "totalReturnAmount",
            title: "Return Amount",
            render: (row: any) => (
                <span className="font-semibold text-warning">
                    ₹{" "}
                    {Number(
                        row?.totalReturnAmount ||
                        0
                    ).toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits:
                                2,
                            maximumFractionDigits:
                                2,
                        }
                    )}
                </span>
            ),
        },
        {
            key: "balanceAmount",
            title: "Balance Amount",
            render: (row: any) => (
                <span className="font-bold text-danger">
                    ₹{" "}
                    {Number(
                        row?.balanceAmount ||
                        0
                    ).toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits:
                                2,
                            maximumFractionDigits:
                                2,
                        }
                    )}
                </span>
            ),
        },
        {
            key: "salesInvoiceReturns",
            title: "Return Invoices",
            render: (row: any) => {
                const returns =
                    Array.isArray(
                        row?.salesInvoiceReturns
                    )
                        ? row.salesInvoiceReturns
                        : [];

                if (!returns.length) {
                    return (
                        <span className="text-muted-foreground">
                            -
                        </span>
                    );
                }

                return (
                    <div className="flex flex-col gap-1">
                        {returns.map(
                            (
                                item: any,
                                index: number
                            ) => (
                                <span
                                    key={
                                        item?.sInvReturnVoucherNumber ||
                                        index
                                    }
                                    className="text-xs font-medium text-card-foreground"
                                >
                                    {item?.sInvReturnVoucherNumber ||
                                        "-"}
                                    {" - ₹"}
                                    {Number(
                                        item?.returnAmount ||
                                        0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                </span>
                            )
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="flex h-full w-full flex-col gap-4 bg-background p-4 text-foreground">
            <div className="flex w-full items-end justify-end gap-2">
                <div className="w-[280px]">
                    <label className="mb-1 block text-xs font-medium text-card-foreground">
                        Customer
                    </label>

                    <select
                        value={
                            customerCode
                        }
                        disabled={
                            loading
                        }
                        onChange={(
                            e
                        ) => {
                            setCustomerCode(
                                e.target.value
                            );
                        }}
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                        <option value="">
                            {loading
                                ? "Loading customers..."
                                : "Select Customer"}
                        </option>

                        {customerOptions.map(
                            (
                                item: any
                            ) => (
                                <option
                                    key={
                                        item.value
                                    }
                                    value={
                                        item.value
                                    }
                                >
                                    {item.label}
                                </option>
                            )
                        )}
                    </select>
                </div>

                <DataREfreshButton
                    callBackFn={
                        handleRefresh
                    }
                    loading={
                        refreshing
                    }
                />
            </div>

            {customerCode && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                    <div>
                        <div className="text-sm font-bold text-primary">
                            {customerCode}
                        </div>

                        <div className="mt-1 text-sm text-muted-foreground">
                            {selectedCustomer
                                ?.label ||
                                "-"}
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                            Total Remaining
                            Amount
                        </div>

                        <div className="mt-1 text-base font-bold text-danger">
                            ₹{" "}
                            {Number(
                                totalRemainingAmount ||
                                0
                            ).toLocaleString(
                                "en-IN",
                                {
                                    minimumFractionDigits:
                                        2,
                                    maximumFractionDigits:
                                        2,
                                }
                            )}
                        </div>
                    </div>
                </div>
            )}

            <DataTable
                columns={
                    mainColumns
                }
                data={
                    records
                }
                loading={
                    listingLoader
                }
                emptyMessage={
                    customerCode
                        ? "No open sales invoices found"
                        : "Please select customer"
                }
                showFieldSelector={
                    false
                }
                actions={(
                    row: any
                ) => (
                    <button
                        type="button"
                        onClick={(
                            e
                        ) => {
                            e.stopPropagation();

                            handleShare(
                                row
                            );
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/20"
                        title="Share Payment Reminder"
                    >
                        <Share
                            size={
                                15
                            }
                        />
                    </button>
                )}
            />
        </div>
    );
};

export default PaymentReminders;