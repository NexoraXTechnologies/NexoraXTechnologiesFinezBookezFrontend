import { useEffect, useMemo, useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import Toggle from "../../../../components/toggle";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import { toast } from "react-toastify";
import { addBalance, deleteBalance, getOpeningBalList, updateBalance } from "../../../../redux/slices/professionalSlice/openingBalancesStocks/openingBalance";

import DynamicAddForm from "../../../../components/voucher/dynamicAddForm";
import SearchInput from "../../../../components/searchInput";
import { DataCreateButton, PrimaryButton } from "../../../../components/buttons";
import DataTable from "../../../../components/DataTable";
import Permission from "../../../../components/PermissionGuard";
import Badge from "../../../../components/badge";
import VoucherFormModal from "../../../../components/voucher/VoucherFormModal";
import { TextArea, TextInput } from "../../../../components/inputs";
import EditableLineTable from "../../../../components/voucher/EditableLineTable";
import SummaryCards from "../../../../components/voucher/SummaryCards";

const emptyEntryRow = {
    id: Date.now(),
    accountCode: "",
    account: "",
    accountName: "",
    debit: "",
    credit: "",
    reference: "",
    remarks: "",
};

const emptyForm = {
    voucherno: "OPBAL",
    openingBalDate: new Date().toISOString().split("T")[0],
    remark: "",
    openingBalBody: [{ ...emptyEntryRow, id: Date.now() }],
};

const mainColumns = [
    {
        key: "openingBalVoucherNumber",
        title: "Voucher",
    },
    {
        key: "openingBalDate",
        title: "Date",
        render: (row: any) => row?.openingBalDate || row?.createdOn || "-",
    },
    {
        key: "totalDebit",
        title: "Total Debit",
        render: (row: any) => (
            <>₹{Number(row?.openingBalFooter?.totalDebit || 0).toFixed(2)}</>
        ),
    },
    {
        key: "totalCredit",
        title: "Total Credit",
        render: (row: any) => (
            <>₹{Number(row?.openingBalFooter?.totalCredit || 0).toFixed(2)}</>
        ),
    },
    {
        key: "openingBalStatus",
        title: "Status",
    },
];





const OpeningBalance = () => {
    const dispatch = useDispatch();
    const { accounts } = useSelector((s: any) => s.accountMaster);
    const { openingBal, listingLoader, pagination, addLoader } = useSelector((s: any) => s.openingBalance);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);

    const [showModal, setShowModal] = useState(false);
    const [edit, setEdit] = useState(false);
    const [status, setStatus] = useState("open");

    const [form, setForm] = useState<any>(emptyForm);
    const [errors, setErrors] = useState<any>({});

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        openingBalVoucherNumber: null,
    });

    const accountOptions = useMemo(() => {
        return (
            accounts?.map((item: any) => ({
                label: item?.accountName,
                value: item?.accountCode,
                raw: item,
            })) || []
        );
    }, [accounts]);

    const totalDebit = useMemo(() => {
        return form.openingBalBody?.reduce(
            (sum: number, item: any) => sum + Number(item.debit || 0),
            0
        );
    }, [form.openingBalBody]);

    const totalCredit = useMemo(() => {
        return form.openingBalBody?.reduce(
            (sum: number, item: any) => sum + Number(item.credit || 0),
            0
        );
    }, [form.openingBalBody]);

    const resetForm = () => {
        setForm({
            ...emptyForm,
            openingBalBody: [{ ...emptyEntryRow, id: Date.now() }],
        });
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

    const handleRowChange = (index: number, key: string, value: any) => {
        setForm((prev: any) => {
            const updatedBody = [...(prev.openingBalBody || [])];

            const updatedRow = {
                ...updatedBody[index],
                [key]: value,
            };

            if (key === "accountCode") {
                const selectedAccount = accountOptions.find(
                    (item: any) => item.value === value
                );

                updatedRow.accountCode = value;
                updatedRow.account = value;
                updatedRow.accountName = selectedAccount?.label || "";
            }

            if (key === "debit" && Number(value) > 0) {
                updatedRow.credit = "";
            }

            if (key === "credit" && Number(value) > 0) {
                updatedRow.debit = "";
            }

            updatedBody[index] = updatedRow;

            return {
                ...prev,
                openingBalBody: updatedBody,
            };
        });

        setErrors((prev: any) => ({
            ...prev,
            openingBalBody: "",
            [`row_${index}_${key}`]: "",
            [`row_${index}_amount`]: "",
        }));
    };

    const handleAddRow = () => {
        setForm((prev: any) => ({
            ...prev,
            openingBalBody: [
                ...(prev.openingBalBody || []),
                {
                    ...emptyEntryRow,
                    id: Date.now(),
                },
            ],
        }));
    };

    const handleDeleteRow = (index: number) => {
        setForm((prev: any) => {
            const updatedBody = prev.openingBalBody.filter(
                (_: any, i: number) => i !== index
            );

            return {
                ...prev,
                openingBalBody:
                    updatedBody.length > 0
                        ? updatedBody
                        : [{ ...emptyEntryRow, id: Date.now() }],
            };
        });
    };

    const getFilledRows = () => {
        return form.openingBalBody.filter((row: any) => {
            return (
                row.accountCode ||
                row.account ||
                row.debit ||
                row.credit ||
                row.reference ||
                row.remarks
            );
        });
    };

    const validateForm = () => {
        const err: any = {};

        if (!form.voucherno || String(form.voucherno).trim() === "") {
            err.voucherno = "Voucher No is required";
        }

        if (!form.openingBalDate || String(form.openingBalDate).trim() === "") {
            err.openingBalDate = "Date is required";
        }

        const filledRows = getFilledRows();

        if (filledRows.length === 0) {
            err.openingBalBody = "Please add at least one account";
        }

        form.openingBalBody.forEach((row: any, index: number) => {
            const hasAnyValue =
                row.accountCode ||
                row.account ||
                row.debit ||
                row.credit ||
                row.reference ||
                row.remarks;

            if (!hasAnyValue) return;

            const debit = Number(row.debit || 0);
            const credit = Number(row.credit || 0);

            if (!row.accountCode && !row.account) {
                err[`row_${index}_accountCode`] = "Account is required";
            }

            if (debit <= 0 && credit <= 0) {
                err[`row_${index}_amount`] = "Debit or Credit amount is required";
                err[`row_${index}_debit`] = "Required";
                err[`row_${index}_credit`] = "Required";
            }

            if (debit > 0 && credit > 0) {
                err[`row_${index}_amount`] = "Only one amount allowed";
                err[`row_${index}_debit`] = "Only one";
                err[`row_${index}_credit`] = "Only one";
            }
        });

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const cleanRows = () => {
        return form.openingBalBody
            .filter((row: any) => {
                return (
                    row.accountCode ||
                    row.account ||
                    row.debit ||
                    row.credit ||
                    row.reference ||
                    row.remarks
                );
            })
            .map((row: any) => ({
                id: row.id || Date.now(),
                account: row.accountCode || row.account,
                accountCode: row.accountCode || row.account,
                accountName: row.accountName || "",
                debit: Number(row.debit || 0),
                credit: Number(row.credit || 0),
                reference: row.reference || "",
                remarks: row.remarks || "",
            }));
    };

    const refreshList = async () => {
        // @ts-ignore
        await dispatch(getOpeningBalList({
            limit: localLimit,
            offset: localOffset,
            status,
            search: debouncedSearch,
        })
        );
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const openingBalBody = cleanRows();

        const payload = {
            ...form,
            openingBalBody,
            openingBalFooter: {
                totalDebit,
                totalCredit,
            },
        };

        if (edit) {
            // @ts-ignore
            await dispatch(updateBalance({
                payload,
                openingBalVoucherNumber: form?.openingBalVoucherNumber,
            })
            );
        } else {
            // @ts-ignore
            await dispatch(addBalance({ payload }));
        }

        await refreshList();

        toast.success(`Opening balance ${edit ? "updated" : "added"} successfully`);

        setShowModal(false);
        resetForm();
    };

    const handleDeleteVoucher = async (openingBalVoucherNumber: any) => {
        // @ts-ignore
        await dispatch(deleteBalance({ openingBalVoucherNumber }));
        await refreshList();
        toast.success("Opening balance deleted successfully");

        setConfirmTooltip({
            show: false,
            x: null,
            y: null,
            openingBalVoucherNumber: null,
        });
    };

    useEffect(() => {
        refreshList();

        // @ts-ignore
        dispatch(getAllAccounts({
            limit: 200,
            offset: 0,
        })
        );
    }, [localOffset, localLimit, status, debouncedSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);


    const inputData = {
        header: [
            {
                key: "voucherno",
                label: "Voucher No",
                type: "text",
                disabled: true,
            },
            {
                key: "openingBalDate",
                label: "Date",
                type: "date",
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
                title: "Account",
                type: "select",
                width: "260px",
                required: true,
                options: accountOptions,
            },
            {
                key: "debit",
                title: "Debit",
                type: "number",
                width: "150px",
                align: "right",
            },
            {
                key: "credit",
                title: "Credit",
                type: "number",
                width: "150px",
                align: "right",
            },
            {
                key: "reference",
                title: "Reference",
                type: "text",
                width: "200px",
            },
            {
                key: "remarks",
                title: "Remarks",
                type: "text",
                width: "250px",
            },
        ],

        footer: [
            {
                key: "totalDebit",
                label: "Total Debit",
                value: `₹${totalDebit.toFixed(2)}`,
                rawValue: totalDebit,
            },
            {
                key: "totalCredit",
                label: "Total Credit",
                value: `₹${totalCredit.toFixed(2)}`,
                rawValue: totalCredit,
            },
        ],
    };

    return (
        <>
            <div className="flex h-full w-full flex-col border border-gray-200 bg-white p-4 shadow-sm">
                <div id="account-header" className="flex flex-wrap items-center gap-2 mb-3">
                    <div id="account-summary" className="flex items-start gap-3">
                        <Badge {...{ count: pagination.totalDocs ?? 0, text: "Total Opening Balance:" }} />
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <Toggle
                            {...{
                                arr: ["open", "close"],
                                state: status,
                                setState: setStatus,
                            }}
                        />

                        <div className="me-2">
                            <SearchInput {...{ search, setSearch }} />
                        </div>
                        <Permission module="bookez" permissionKey="openingBalance" action="create">
                            <DataCreateButton
                                {...{
                                    text: "Create Opening Balance",
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
                    data={openingBal}
                    loading={listingLoader}
                    emptyMessage="No data found"
                    actions={(item: any) => (
                        <div className="flex items-center gap-2">
                            <Permission module="bookez" permissionKey="openingBalance" action="update">
                            <button
                                id="opening-balance-edit-button"
                                onClick={() => {
                                    const body =
                                        item?.openingBalBody?.length > 0
                                            ? item.openingBalBody.map((row: any) => ({
                                                id: row.id || Date.now() + Math.random(),
                                                accountCode: row.accountCode || row.account || "",
                                                account: row.accountCode || row.account || "",
                                                accountName: row.accountName || "",
                                                debit: row.debit || "",
                                                credit: row.credit || "",
                                                reference: row.reference || "",
                                                remarks: row.remarks || "",
                                            }))
                                            : [
                                                {
                                                    ...emptyEntryRow,
                                                    id: Date.now(),
                                                },
                                            ];

                                    setForm({
                                        ...item,
                                        voucherno: item?.voucherno || item?.openingBalVoucherNumber || "OPBAL",
                                        openingBalDate: item?.openingBalDate || new Date().toISOString().split("T")[0],
                                        remark: item?.remark || "",
                                        openingBalBody: body,
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
                            <Permission module="bookez" permissionKey="openingBalance" action="delete">
                            <button
                                type="button"
                                onClick={(e: any) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    let x: any = rect.left - 150;
                                    if (x < 10) x = 10;
                                    const y: any = rect.top + window.scrollY - 5;
                                    setConfirmTooltip({
                                        show: true,
                                        x,
                                        y,
                                        openingBalVoucherNumber: item.openingBalVoucherNumber,
                                    });
                                }}
                                className="text-red-500 hover:text-red-700">
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
                            preDisabled: !pagination.hasPrevPage,
                            nextDisabled: !pagination.hasNextPage,
                            setLocalOffset,
                            pagination,
                        }}
                    />
                )}
            </div>

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this opening balance?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={() =>
                        handleDeleteVoucher(confirmTooltip?.openingBalVoucherNumber)
                    }
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            openingBalVoucherNumber: null,
                        })
                    }
                />
            )}

            <DynamicAddForm
                show={showModal}
                setShow={setShowModal}
                edit={edit}
                title="Opening Balance"
                subtitle="Fill in the opening balance details below"
                loading={addLoader}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                form={form}
                errors={errors}
                handleAddRow={handleAddRow}
                handleDeleteRow={handleDeleteRow}
                handleRowChange={handleRowChange}
                inputData={inputData}
                bodyKey="openingBalBody"
                handleChange={handleChange}
            />

        </>
    );
};

export default OpeningBalance;