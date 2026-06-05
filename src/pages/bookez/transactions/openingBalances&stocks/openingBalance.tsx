import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "../../../../components/buttons";
import SearchInput from "../../../../components/searchInput";
import Modal from "../../../../components/modal";
import { SelectInput, TextArea, TextInput } from "../../../../components/inputs";
import DataTable from "../../../../components/DataTable";
import { useDispatch, useSelector } from "react-redux";
import { getAllAccounts } from "../../../../redux/slices/professionalSlice/accountMasterSlice";
import Toggle from "../../../../components/toggle";
import Pagination from "../../../../components/pagination";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import { toast } from "react-toastify";
import { addBalance, deleteBalance, getOpeningBalList, updateBalance } from "../../../../redux/slices/professionalSlice/openingBalancesStocks/openingBalance";

const columns = [
    { key: 'account', title: 'Account', },
    {
        key: 'debit', title: 'Debit',
        render: (row: any) => (
            <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
                ₹{row.debit?.toFixed ? row.debit.toFixed(2) : row.debit}
            </span>
        ),
    },
    {
        key: 'credit', title: 'Credit',
        render: (row: any) => (
            <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs">
                ₹{row.credit.toFixed ? row.credit.toFixed(2) : row.credit}
            </span>
        ),
    },
    { key: 'reference', title: 'Reference', },
];

const mainColumns = [
    { key: 'openingBalVoucherNumber', title: 'Voucher', },
    { key: 'createdOn', title: 'Date', },
    {
        key: 'totalCredit', title: 'Total Credit',
        render: (row: any) => (
            <>
                {row?.openingBalFooter?.totalCredit && `₹${row?.openingBalFooter?.totalCredit}`}
            </>
        ),
    },
    {
        key: 'credit', title: 'Total Debit',
        render: (row: any) => (
            <>
                {row?.openingBalFooter?.totalDebit && `₹${row?.openingBalFooter?.totalDebit}`}
            </>
        ),
    },
    { key: 'openingBalStatus', title: 'Status', },
];

const mainInputData = [
    {
        grid: 2,
        child: [
            {
                key: "voucherno",
                label: "Voucher No",
                type: "text",
                grid: 2,
                isRequired: true,
                disabled: true,
            },
            {
                key: "openingBalDate",
                label: "Date",
                grid: 2,
                type: "date",
                isRequired: true,
                disabled: true,
            },
        ]
    },
    {
        key: "remark",
        label: "Remark",
        grid: 1,
        type: "textarea",
        isRequired: false,
    },
];

const OpeningBalance = () => {
    const [search, setSearch] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [showEntryModal, setShowEntryModal] = useState(false);
    const dispatch = useDispatch();
    const { accounts } = useSelector((s: any) => s.accountMaster);
    const { openingBal, listingLoader, pagination, addLoader } = useSelector((s: any) => s.openingBalance);
    const [edit, setEdit] = useState(false);
    const [status, setStatus] = useState("open");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [confirmTooltip, setConfirmTooltip] = useState({
        show: false,
        x: null,
        y: null,
        openingBalVoucherNumber: null,
    });

    const accOptions = accounts?.reduce((a: any, c: any) => {
        a.push({ label: c?.accountName, value: c?.accountCode })
        return a;
    }, []);

    const [form, setForm] = useState<any>({
        voucherno: "OPBAL",
        openingBalDate: new Date().toISOString().split("T")[0],
        remark: "",
        openingBalBody: [],
    });

    const [entryForm, setEntryForm] = useState<any>({});
    const [errors, setErrors] = useState<any>({});
    const [entryErrors, setEntryErrors] = useState<any>({});

    const totalDebit = useMemo(() => {
        return form.openingBalBody.reduce(
            (sum: number, item: any) => sum + Number(item.debit || 0),
            0
        );
    }, [form.openingBalBody]);

    const totalCredit = useMemo(() => {
        return form.openingBalBody.reduce(
            (sum: number, item: any) => sum + Number(item.credit || 0),
            0
        );
    }, [form.openingBalBody]);

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

    const handleEntryChange = (key: string, value: any) => {
        setEntryForm((prev: any) => {
            let updated = {
                ...prev,
                [key]: value,
            };

            // Optional: if debit entered, clear credit
            if (key === "debit" && Number(value) > 0) {
                updated.credit = "";
            }

            // Optional: if credit entered, clear debit
            if (key === "credit" && Number(value) > 0) {
                updated.debit = "";
            }

            return updated;
        });

        setEntryErrors((prev: any) => ({
            ...prev,
            [key]: "",
            amount: "",
        }));
    };

    const validateMainForm = () => {
        const err: any = {};
        mainInputData.forEach((field: any) => {
            const value = form?.[field.key];
            if (field.isRequired && (value === undefined || value === null || String(value).trim() === "")) {
                err[field.key] = `${field.label} is required`;
            }
        });

        if (!form.openingBalBody || form.openingBalBody.length === 0) {
            err.openingBalBody = "Please add at least one account";
        }

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const validateEntryForm = () => {
        const err: any = {};

        entryInputData.forEach((field: any) => {
            const value = entryForm?.[field.key];

            if (
                field.isRequired &&
                (value === undefined || value === null || String(value).trim() === "")
            ) {
                err[field.key] = `${field.label} is required`;
            }
        });

        const debit = Number(entryForm?.debit || 0);
        const credit = Number(entryForm?.credit || 0);

        if (debit <= 0 && credit <= 0) {
            err.amount = "Debit or Credit amount is required";
            err.debit = "Enter debit or credit";
            err.credit = "Enter debit or credit";
        }

        if (debit > 0 && credit > 0) {
            err.amount = "You can enter either debit or credit, not both";
            err.debit = "Only one amount allowed";
            err.credit = "Only one amount allowed";
        }

        setEntryErrors(err);

        return Object.keys(err).length === 0;
    };

    const handleAddEntry = () => {
        if (!validateEntryForm()) return;

        // const selectedAccount = entryInputData[0].options.find(
        //     (item: any) => item.value === entryForm.accountCode
        // );

        const newEntry = {
            id: Date.now(),
            account: entryForm.accountCode,
            // accountName: selectedAccount?.label || "",
            debit: Number(entryForm.debit || 0),
            credit: Number(entryForm.credit || 0),
            reference: entryForm.reference || "",
            remarks: entryForm.remarks || "",
        };

        setForm((prev: any) => ({
            ...prev,
            openingBalBody: [...prev.openingBalBody, newEntry],
        }));

        setEntryForm({});
        setEntryErrors({});
        setShowEntryModal(false);

        setErrors((prev: any) => ({
            ...prev,
            openingBalBody: "",
        }));
    };

    const handleDeleteEntry = async (e: any) => {
        {/* @ts-ignore */ }
        await dispatch(deleteBalance({ openingBalVoucherNumber: e }))
        {/* @ts-ignore */ }
        await dispatch(getOpeningBalList({ status }))
        toast.success("Opening balance deleted successfully");
        setConfirmTooltip({
            show: false,
            x: null,
            y: null,
            openingBalVoucherNumber: null,
        })
        setForm((prev: any) => ({
            ...prev,
            openingBalBody: prev.openingBalBody.filter((item: any) => item.id !== e?.id),
        }));
    };

    const handleSubmit = async () => {
        if (!validateMainForm()) return;

        const payload = {
            ...form,
            openingBalFooter: {
                totalDebit,
                totalCredit,
            }
        };
        if (edit) {
            {/* @ts-ignore */ }
            await dispatch(updateBalance({ payload, openingBalVoucherNumber: form?.openingBalVoucherNumber }))
        } else {
            {/* @ts-ignore */ }
            await dispatch(addBalance({ payload }))
        } {/* @ts-ignore */ }
        await dispatch(getOpeningBalList({ status }))
        toast.success(`Opening balance ${edit ? "updated" : "added"} successfully`);
        setShowModal(false);
        setForm({
            voucherno: "OPBAL",
            openingBalDate: new Date().toISOString().split("T")[0],
            remark: "",
            openingBalBody: [],
        });
        setEdit(false)
        setErrors({});
    };

    const renderMainField = (field: any) => {
        const value = form?.[field.key] ?? "";

        const commonProps = {
            label: field.label,
            mandatory: field.isRequired,
            value,
            placeholder: `Enter ${field.label}`,
            error: errors?.[field.key],
            disabled: field.disabled,
        };

        if (field.type === "date") {
            return (
                <TextInput
                    key={field.key}
                    {...commonProps}
                    type="date"
                    onChange={(e: any) => handleChange(field.key, e.target.value)}
                />
            );
        }

        if (field.type === "textarea") {
            return (
                <TextArea
                    key={field.key}
                    {...commonProps}
                    onChange={(e: any) => handleChange(field.key, e.target.value)}
                />
            );
        }

        return (
            <TextInput
                key={field.key}
                {...commonProps}
                type="text"
                onChange={(e: any) => handleChange(field.key, e.target.value)}
            />
        );
    };

    const renderEntryField = (field: any) => {
        const value = entryForm?.[field.key] ?? "";

        const commonProps = {
            label: field.label,
            mandatory: field.isRequired,
            value,
            placeholder: `Enter ${field.label}`,
            error: entryErrors?.[field.key],
        };

        if (field.type === "select") {
            return (
                <SelectInput
                    key={field.key}
                    label={field.label}
                    mandatory={field.isRequired}
                    value={value}
                    placeholder={`Select ${field.label}`}
                    error={entryErrors?.[field.key]}
                    onChange={(e: any) => handleEntryChange(field.key, e?.target?.value)}
                    options={[
                        { label: `Select ${field.label}`, value: "" },
                        ...field.options,
                    ]}
                />
            );
        }

        if (field.type === "number") {
            return (
                <TextInput
                    key={field.key}
                    {...commonProps}
                    type="number"
                    onChange={(e: any) => handleEntryChange(field.key, e.target.value)}
                />
            );
        }

        if (field.type === "textarea") {
            return (
                <TextArea
                    key={field.key}
                    {...commonProps}
                    onChange={(e: any) => handleEntryChange(field.key, e.target.value)}
                />
            );
        }

        return (
            <TextInput
                key={field.key}
                {...commonProps}
                type="text"
                onChange={(e: any) => handleEntryChange(field.key, e.target.value)}
            />
        );
    };

    useEffect(() => {
        // @ts-ignore
        dispatch(getOpeningBalList({ limit: localLimit, offset: localOffset, status, search: debouncedSearch, }))
        console.log({ localLimit })
        // @ts-ignore
        dispatch(getAllAccounts({ limit: localLimit, offset: localOffset, status, search: debouncedSearch }));
    }, [localOffset, localLimit, status, debouncedSearch]);

    const entryInputData = [
        {
            key: "accountCode",
            label: "Account",
            type: "select",
            isRequired: true,
            options: accOptions,
        },
        {
            key: "debit",
            label: "Debit",
            type: "number",
            isRequired: false,
        },
        {
            key: "credit",
            label: "Credit",
            type: "number",
            isRequired: false,
        },
        {
            key: "reference",
            label: "Reference",
            type: "text",
            isRequired: false,
        },
        {
            key: "remarks",
            label: "Remarks",
            type: "textarea",
            isRequired: false,
        }
    ];

    // useEffect(() => {
    //     dispatch(getOpeningBalList({ limit: localLimit, offset: localOffset, status, search: debouncedSearch, }));
    // }, [debouncedSearch]);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setLocalOffset(0);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    console.log({ openingBal, localOffset })
    return (
        <>
            <div className="w-full bg-white border border-gray-200 shadow-sm p-4 flex flex-col h-[100%]">
                <div className="flex justify-end items-center mb-3">
                    <Toggle  {...{ arr: ["open", "close"], state: status, setState: setStatus }} />

                    <div className="me-2">
                        <SearchInput {...{ search, setSearch }} />
                    </div>

                    <PrimaryButton
                        {...{
                            text: "Add",
                            callBackFn: () => setShowModal(true),
                        }}
                    />
                </div>
                <DataTable
                    columns={mainColumns}
                    data={openingBal}
                    loading={listingLoader}
                    emptyMessage="No data found"
                    actions={(acc: any) => (
                        <div className="flex items-center gap-2">
                            <button
                                id="account-edit-button"
                                onClick={() => {
                                    setForm(acc)
                                    setEdit(true)
                                    setShowModal(true)
                                }}
                                className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200 cursor-pointer">
                                <Edit size={16} />
                            </button>
                            {/* delete */}
                            <button
                                type="button"
                                // onClick={() => handleDeleteEntry(acc?.openingBalVoucherNumber)}
                                onClick={(e: any) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    let x: any = rect.left - 150;
                                    if (x < 10) x = 10;
                                    const y: any = rect.top + window.scrollY - 5;
                                    setConfirmTooltip({ show: true, x, y, openingBalVoucherNumber: acc.openingBalVoucherNumber, });
                                }}
                                className="text-red-500 hover:text-red-700"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                />
                {pagination.totalDocs > 0 && <Pagination  {...{
                    localLimit, selectCb: (e: any) => {
                        setLocalLimit(Number(e.target.value));
                        setLocalOffset(0);
                    },
                    preDisabled: !pagination.hasPrevPage,
                    nextDisabled: !pagination.hasNextPage,
                    setLocalOffset, pagination
                }} />}
            </div>

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message="Are you sure you want to delete this account?"
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={() => {
                        handleDeleteEntry(confirmTooltip?.openingBalVoucherNumber)
                        
                    }}
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


            {/* Main Opening Balance Modal */}
            {/* @ts-ignore */}
            <Modal
                {...{
                    show: showModal,
                    setShow: setShowModal,
                    handleClose: () => {
                        setErrors(null)
                        setForm({
                            voucherno: "OPBAL",
                            openingBalDate: new Date().toISOString().split("T")[0],
                            remark: "",
                            openingBalBody: [],
                        });
                        setEdit(false)
                    },
                    handleSubmit,
                    loader: addLoader,
                    state: edit,
                    gridCols: 12,
                    title: "Opening Balance",
                    body: (
                        <>
                            <div>
                                <div>
                                    {mainInputData.map((field: any) => <><div className={`grid gap-2 mb-2 grid-cols-${field?.grid}`}> {field?.child?.length ? field?.child?.map((e: any) => renderMainField(e)) : renderMainField(field)}</div></>)}
                                </div>

                                <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-base font-semibold text-slate-800">
                                            Entries
                                        </h3>
                                        <SecondaryButton
                                            {...{
                                                text: "Add Account",
                                                icon: <Plus size={16} />,
                                                callBackFn: () => setShowEntryModal(true),
                                            }}
                                        />
                                    </div>

                                    {errors?.openingBalBody && (
                                        <p className="mb-2 text-sm text-red-500">{errors.openingBalBody}</p>
                                    )}

                                    {form.openingBalBody.length === 0 ? (
                                        <div className="rounded-lg border border-slate-200 p-5 text-center text-sm text-slate-500">
                                            No data found
                                        </div>
                                    ) : (
                                        <>
                                            <div className="overflow-auto w-100">
                                                <DataTable
                                                    columns={columns}
                                                    data={form.openingBalBody}
                                                    // loading={loading}
                                                    emptyMessage="No accounts found"
                                                        actions={(acc: any) => (
                                                        <div className="flex items-center gap-2">
                                                            {/* EDIT */}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteEntry(acc.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
                                    <div className="flex items-center justify-between text-base font-semibold text-slate-800">
                                        <span>Total Debit:</span>
                                        <span>₹{totalDebit.toFixed(2)}</span>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between text-base font-semibold text-slate-800">
                                        <span>Total Credit:</span>
                                        <span>₹{totalCredit.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ),
                }}
            />

            {/* Add Account Modal */}
            {/* @ts-ignore */}
            <Modal
                {...{
                    show: showEntryModal,
                    setShow: setShowEntryModal,
                    handleSubmit: handleAddEntry,
                    loader: false,
                    maxWidth: "lg",
                    state: false,
                    gridCols: 1,
                    title: "Add Opening Balance",
                    body: (
                        <>
                            <div>
                                <div>
                                    {entryInputData.map((field: any) => <><div className="mb-2">{renderEntryField(field)}</div></>)}
                                </div>

                                {entryErrors?.amount && (
                                    <p className="mt-2 text-sm text-red-500">
                                        {entryErrors.amount}
                                    </p>
                                )}

                                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                                        <span>Total Debit</span>
                                        <span>₹{Number(entryForm?.debit || 0).toFixed(2)}</span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-800">
                                        <span>Total Credit</span>
                                        <span>₹{Number(entryForm?.credit || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    ),
                }}
            />
        </>
    );
};

export default OpeningBalance;