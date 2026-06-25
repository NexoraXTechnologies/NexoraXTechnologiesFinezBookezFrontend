import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Badge from "../../../../components/badge";
import { DataCreateButton } from "../../../../components/buttons";
import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import SearchInput from "../../../../components/searchInput";
import { useDispatch, useSelector } from "react-redux";
import { Edit, Trash2 } from "lucide-react";
import Pagination from "../../../../components/pagination";
import {
    addJournalVoucher,
    deleteJournalVoucher,
    getJournalVoucherList,
    updateJournalVoucher,
} from "../../../../redux/slices/professionalSlice/openingBalancesStocks/journalVoucherSlice";
import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";

const emptyEntryRow = {
    id: Date.now(),
    accountCode: "",
    account: "",
    accountName: "",
    debit: "",
    credit: "",
    narration: "",
};

const getDefaultForm = () => ({
    voucherNumber: "AUTO",
    voucherno: "AUTO",
    voucherDate: new Date().toISOString().split("T")[0],
    voucherType: "journal",
    referenceNumber: "",
    remarks: "",
    remark: "",
    status: "open",
    __autoPost: false,
    entries: [{ ...emptyEntryRow, id: Date.now() }, { ...emptyEntryRow, id: Date.now() }],
    totalDebit: "0.00",
    totalCredit: "0.00",
});

const mainColumns = [
    {
        key: "voucherNumber",
        title: "Voucher",
    },
    {
        key: "voucherDate",
        title: "Date",
        type: "date",
        render: (row: any) => row?.voucherDate || row?.createdOn || "-",
    },
    {
        key: "referenceNumber",
        title: "Reference",
    },
    {
        key: "totalDebit",
        title: "Total Debit",
        render: (row: any) => <>₹{Number(row?.totalDebit || 0).toFixed(2)}</>,
    },
    {
        key: "totalCredit",
        title: "Total Credit",
        render: (row: any) => <>₹{Number(row?.totalCredit || 0).toFixed(2)}</>,
    },
    {
        key: "status",
        title: "Status",
    },
];

const JournalVoucher = () => {
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState<any>(getDefaultForm());
    const [errors, setErrors] = useState<any>({});
    const [edit, setEdit] = useState(false);
    const [localLimit, setLocalLimit] = useState(10);
    const [localOffset, setLocalOffset] = useState(0);
    const [confirmTooltip, setConfirmTooltip] = useState<any>(false);

    const dispatch = useDispatch<any>();

    const {
        journalVouchers,
        pagination,
        listingLoader,
        addLoader,
        deleteLoader
    } = useSelector((s: any) => s.journalVoucher);

    const { accounts } = useSelector((s: any) => s.accountMaster);

    const accountOptions = useMemo(() => {
        return (
            accounts?.map((item: any) => ({
                label: item.accountName,
                value: item.accountCode,
            })) || []
        );
    }, [accounts]);

    const inputData = {
        header: [
            {
                key: "voucherno",
                label: "Voucher No",
                type: "text",
                disabled: true,
            },
            {
                key: "voucherDate",
                label: "Date",
                type: "date",
                disabled: false,
                required: true,
            },
            {
                key: "status",
                label: "Status",
                type: "select",
                disabled: false,
                options: [
                    { label: "Open", value: "open" },
                    { label: "Close", value: "close" },
                ],
            },
            {
                key: "referenceNumber",
                label: "Reference Number",
                type: "text",
                disabled: false,
            },
            {
                key: "remark",
                label: "Remark",
                type: "textarea",
                required: false,
                placeholder: "Enter Remark",
                colSpan: "full",
            },
        ],

        body: [
            {
                key: "accountCode",
                label: "Account",
                title: "Account",
                type: "select",
                width: "260px",
                required: true,
                options: accountOptions,
            },
            {
                key: "debit",
                label: "Debit",
                title: "Debit",
                type: "number",
                width: "150px",
                align: "right",
            },
            {
                key: "credit",
                label: "Credit",
                title: "Credit",
                type: "number",
                width: "150px",
                align: "right",
            },
        ],

        footer: [
            {
                key: "totalDebit",
                label: "Total Debit",
                type: "number",
                disabled: true,
                align: "right",
            },
            // {
            //     key: "totalCredit",
            //     label: "Total Credit",
            //     type: "number",
            //     disabled: true,
            // },
        ],
    };

    const refreshList = () => {
        return dispatch(
            getJournalVoucherList({
                limit: localLimit,
                offset: localOffset,
                search,
            })
        );
    };

    useEffect(() => {
        dispatch(
            getAllAccounts({
                limit: localLimit,
                offset: localOffset,
            })
        );

        refreshList();
    }, [dispatch, localLimit, localOffset]);

    const calculateTotals = (entries: any[] = []) => {
        const totalDebit = entries.reduce(
            (sum: number, row: any) => sum + Number(row?.debit || 0),
            0
        );

        const totalCredit = entries.reduce(
            (sum: number, row: any) => sum + Number(row?.credit || 0),
            0
        );

        return {
            totalDebit: totalDebit.toFixed(2),
            totalCredit: totalCredit.toFixed(2),
        };
    };

    const resetForm = () => {
        setForm(getDefaultForm());
        setErrors({});
        setEdit(false);
    };

    const handleChange = (key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            [key]: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    const handleAddRow = () => {
        setForm((prev: any) => {
            const updatedEntries = [
                ...(prev.entries || []),
                { ...emptyEntryRow, id: Date.now() + Math.random() },
            ];

            return {
                ...prev,
                entries: updatedEntries,
                ...calculateTotals(updatedEntries),
            };
        });
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedEntries = (prev.entries || []).filter(
                (_: any, i: number) => i !== index
            );

            const finalEntries =
                updatedEntries.length > 0
                    ? updatedEntries
                    : [{ ...emptyEntryRow, id: Date.now() }];

            return {
                ...prev,
                entries: finalEntries,
                ...calculateTotals(finalEntries),
            };
        });
    };

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const updatedEntries = [...(prev.entries || [])];
            const currentRow = updatedEntries[index] || {};

            const selectedAccount = accountOptions.find(
                (item: any) => String(item.value) === String(value)
            );

            let updatedRow = {
                ...currentRow,
                [key]: value,
            };

            if (key === "accountCode") {
                updatedRow = {
                    ...updatedRow,
                    account: value,
                    accountName: selectedAccount?.label || "",
                };
            }

            if (key === "debit" && Number(value || 0) > 0) {
                updatedRow.credit = "";
            }

            if (key === "credit" && Number(value || 0) > 0) {
                updatedRow.debit = "";
            }

            updatedEntries[index] = updatedRow;

            return {
                ...prev,
                entries: updatedEntries,
                ...calculateTotals(updatedEntries),
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            [`row_${index}_${key}`]: "",
            totalDebit: "",
            totalCredit: "",
        }));
    };

    const handleSubmit = async () => {
        const err: any = {};

        if (!form?.voucherDate) {
            err.voucherDate = "Voucher date is required";
        }

        const entries = form?.entries || [];

        if (!entries.length) {
            err.entries = "Please add at least one entry";
        }

        entries.forEach((row: any, index: number) => {
            if (!row?.accountCode) {
                err[`row_${index}_accountCode`] = "Account is required";
            }

            const debit = Number(row?.debit || 0);
            const credit = Number(row?.credit || 0);

            if (debit <= 0 && credit <= 0) {
                err[`row_${index}_debit`] = "Debit or Credit is required";
                err[`row_${index}_credit`] = "Debit or Credit is required";
            }

            if (debit > 0 && credit > 0) {
                err[`row_${index}_debit`] = "Only one allowed";
                err[`row_${index}_credit`] = "Only one allowed";
            }
        });

        const totals = calculateTotals(entries);

        if (Number(totals.totalDebit) !== Number(totals.totalCredit)) {
            err.totalDebit = "Total debit and credit must be equal";
            err.totalCredit = "Total debit and credit must be equal";
        }

        setErrors(err);

        if (Object.keys(err).length > 0) {
            const firstError =
                err.totalDebit ||
                err.totalCredit ||
                err.entries ||
                err.voucherDate ||
                Object.values(err)[0] ||
                "Please fix validation errors";

            toast.error(String(firstError));
            return;
        }

        const payload = {
            voucherDate: form.voucherDate,
            voucherType: form.voucherType || "journal",
            referenceNumber: form.referenceNumber,
            remarks: form.remark || form.remarks || "",
            entries: entries.map((row: any) => ({
                accountCode: row.accountCode,
                accountName: row.accountName,
                debit: row.debit ? String(row.debit) : null,
                credit: row.credit ? String(row.credit) : null,
            })),
            totalDebit: totals.totalDebit,
            totalCredit: totals.totalCredit,
            status: form.status || "open",
            __autoPost: false,
        };

        // console.log("Journal Voucher Payload:", payload);

        try {
            if (edit) {
                await dispatch(
                    updateJournalVoucher({
                        payload,
                        journalVoucherNumber: form?.voucherNumber || form?.voucherno,
                    })
                ).unwrap();
            } else {
                await dispatch(
                    addJournalVoucher({
                        payload,
                    })
                ).unwrap();
            }

            await refreshList();

            toast.success(
                `Journal Voucher ${edit ? "updated" : "added"} successfully`
            );

            setShowModal(false);
            resetForm();
        } catch (error: any) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.payload?.message ||
                error?.message ||
                "Operation failed";

            toast.error(backendMessage);
        }
    };

    const handleDeleteConfirm = async () => {
        try {
            const voucherNumber = confirmTooltip?.voucherNumber;

            if (!voucherNumber) {
                toast.error("Journal voucher number not found");
                return;
            }

            await dispatch(
                deleteJournalVoucher({
                    journalVoucherNumber: voucherNumber,
                })
            ).unwrap();

            toast.success("Journal Voucher deleted successfully");

            await refreshList();
        } catch (error: any) {
            const backendMessage =
                error?.response?.data?.message ||
                error?.payload?.message ||
                error?.message ||
                "Failed to delete journal voucher";

            toast.error(backendMessage);
        } finally {
            setConfirmTooltip(false);
        }
    };

    const dynamicFooterArray = useMemo(() => {
        return (inputData.footer || []).map((field: any) => {
            const rawValue = form?.[field.key] ?? "0.00";

            return {
                ...field,
                value: Number(rawValue || 0).toFixed(2),
                rawValue,
            };
        });
    }, [form?.totalDebit]);

    return (
        <>
            <div className="flex h-full w-full flex-col border border-gray-200 bg-white p-4 shadow-sm">
                <div
                    id="account-header"
                    className="mb-3 flex flex-wrap items-center gap-2"
                >
                    <div id="account-summary" className="flex items-start gap-3">
                        <Badge
                            {...{
                                count: pagination?.totalDocs ?? 0,
                                text: "Total Journal Voucher:",
                            }}
                        />
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">


                        <div className="me-2">
                            <SearchInput {...{ search, setSearch }} />
                        </div>

                        <Permission
                            module="bookez"
                            permissionKey="journalVouchar"
                            action="create"
                        >
                            <DataCreateButton
                                {...{
                                    text: "Create Journal Voucher",
                                    callBackFn: () => {
                                        resetForm();
                                        setShowModal(true);
                                    },
                                }}
                            />
                        </Permission>
                    </div>
                </div>

                <DataTable
                    columns={mainColumns}
                    data={journalVouchers}
                    loading={listingLoader}
                    emptyMessage="No data found"
                    actions={(item: any) => (
                        <div className="flex items-center gap-2">
                            <Permission
                                module="bookez"
                                permissionKey="journalVouchar"
                                action="update"
                            >
                                <button
                                    id="journal-voucher-edit-button"
                                    onClick={() => {
                                        const body =
                                            item?.entries?.length > 0
                                                ? item.entries.map((row: any) => ({
                                                    id:
                                                        row.id ||
                                                        Date.now() +
                                                        Math.random(),
                                                    accountCode:
                                                        row.accountCode ||
                                                        row.account ||
                                                        "",
                                                    account:
                                                        row.accountCode ||
                                                        row.account ||
                                                        "",
                                                    accountName:
                                                        row.accountName || "",
                                                    debit: row.debit || "",
                                                    credit: row.credit || "",
                                                    reference:
                                                        row.reference || "",
                                                    remarks:
                                                        row.remarks || "",
                                                }))
                                                : [
                                                    {
                                                        ...emptyEntryRow,
                                                        id: Date.now(),
                                                    },
                                                ];

                                        setForm({
                                            ...item,
                                            voucherno:
                                                item?.voucherno ||
                                                item?.voucherNumber ||
                                                "JNV",
                                            voucherDate: item?.voucherDate
                                                ? String(
                                                    item.voucherDate
                                                ).split("T")[0]
                                                : new Date()
                                                    .toISOString()
                                                    .split("T")[0],
                                            remark:
                                                item?.remark ||
                                                item?.remarks ||
                                                "",
                                            entries: body,
                                            ...calculateTotals(body),
                                        });

                                        setErrors({});
                                        setEdit(true);
                                        setShowModal(true);
                                    }}
                                    className="cursor-pointer rounded-lg p-2 text-indigo-600 transition-all duration-200 hover:bg-indigo-100 hover:text-indigo-700"
                                >
                                    <Edit size={16} />
                                </button>
                            </Permission>

                            <Permission
                                module="bookez"
                                permissionKey="journalVouchar"
                                action="delete"
                            >
                                <button
                                    type="button"
                                    disabled={deleteLoader}
                                    onClick={(e: any) => {
                                        const rect = e.currentTarget.getBoundingClientRect();

                                        let x: any = rect.left - 150;
                                        if (x < 10) x = 10;

                                        const y: any = rect.top + window.scrollY - 5;

                                        setConfirmTooltip({
                                            show: true,
                                            x,
                                            y,
                                            voucherNumber: item?.voucherNumber || item?.voucherno,
                                        });
                                    }}
                                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </Permission>
                        </div>
                    )}
                />

                {pagination?.totalDocs > 0 && (
                    <Pagination
                        {...{
                            localLimit,
                            selectCb: (e: any) => {
                                setLocalLimit(Number(e.target.value));
                                setLocalOffset(0);
                            },
                            preDisabled: !pagination?.hasPrevPage,
                            nextDisabled: !pagination?.hasNextPage,
                            setLocalOffset,
                            pagination,
                        }}
                    />
                )}

                {confirmTooltip?.show && (
                    <ConfirmTooltip
                        x={confirmTooltip.x}
                        y={confirmTooltip.y}
                        message="Are you sure you want to delete this journal voucher?"
                        confirmText="Delete"
                        cancelText="Cancel"
                        onConfirm={handleDeleteConfirm}
                        onCancel={() => setConfirmTooltip(false)}
                    />
                )}

                <DynamicAddForm
                    show={showModal}
                    setShow={setShowModal}
                    edit={edit}
                    title="Journal voucher"
                    subtitle="Fill in the journal voucher details below"
                    loading={addLoader}
                    onClose={() => {
                        setShowModal(false);
                        resetForm();
                    }}
                    onSubmit={handleSubmit}
                    addButtonText="Add Row"
                    form={form}
                    errors={errors}
                    handleAddRow={handleAddRow}
                    handleDeleteRow={handleDeleteRow}
                    handleRowChange={handleRowChange}
                    inputData={{
                        ...inputData,
                        footer: dynamicFooterArray,
                    }}
                    bodyKey="entries"
                    handleChange={handleChange}
                />
            </div>
        </>
    );
};

export default JournalVoucher;