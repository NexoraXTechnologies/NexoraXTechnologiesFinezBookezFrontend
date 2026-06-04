import { Plus } from "lucide-react";

import Modal from "../../../../../components/modal";
import { SelectInput, TextInput } from "../../../../../components/inputs";
import { ColumnWiseTable } from "../../../../../components/DataTable";

/* ===================================================
    ASSEMBLY PRODUCTION FORM MODAL

    This component contains only the Add / Update modal UI.

    This component DOES:
    - Render basic details card
    - Render finished good card
    - Render raw materials table card
    - Render cost card
    - Call parent handlers on change/apply/add/edit/delete

    This component DOES NOT:
    - Fetch list
    - Search
    - Refresh
    - Pagination
    - Delete assembly production
    - Create / Update API dispatch
    - Store main form state

    All state and logic still remain in parent component.
=================================================== */

type AssemblyProductionFormModalProps = {
    showModal: boolean;
    setShowModal: (value: boolean) => void;

    editingRecord: any;
    createLoading: boolean;
    updateLoading: boolean;

    form: any;
    errors: any;

    finishedGoodForm: any;
    isFinishedGoodApplied: boolean;
    finishedGoodOptions: any[];

    rawMaterialOptions: any[];
    rawMaterialTableFields: any[];

    totalRawMaterialCost: number;
    totalFinishedCost: number;

    emptyProduct: any;

    handleSubmit: () => void;
    handleMainChange: (key: string, value: any) => void;

    handleFinishedGoodProductChange: (productCode: string) => void;
    handleFinishedGoodChange: (key: string, value: any) => void;
    handleClearFinishedGood: () => void;
    handleApplyFinishedGood: () => void;

    setShowNoRawMaterialAlert: (value: boolean) => void;
    setEditingRawMaterialIndex: (value: number | null) => void;
    setRawMaterialForm: (value: any) => void;
    setRawErrors: (value: any) => void;
    setShowRawMaterialModal: (value: boolean) => void;

    handleEditRawMaterial: (item: any, index: number) => void;
    handleDeleteRawMaterial: (index: number) => void;
};

const AssemblyProductionFormModal = ({
    showModal,
    setShowModal,

    editingRecord,
    createLoading,
    updateLoading,

    form,
    errors,

    finishedGoodForm,
    isFinishedGoodApplied,
    finishedGoodOptions,

    rawMaterialOptions,
    rawMaterialTableFields,

    totalRawMaterialCost,
    totalFinishedCost,

    emptyProduct,

    handleSubmit,
    handleMainChange,

    handleFinishedGoodProductChange,
    handleFinishedGoodChange,
    handleClearFinishedGood,
    handleApplyFinishedGood,

    setShowNoRawMaterialAlert,
    setEditingRawMaterialIndex,
    setRawMaterialForm,
    setRawErrors,
    setShowRawMaterialModal,

    handleEditRawMaterial,
    handleDeleteRawMaterial,
}: AssemblyProductionFormModalProps) => {
    return (
        // @ts-ignore
        <Modal
            {...{
                show: showModal,
                setShow: setShowModal,
                handleSubmit,
                loader: editingRecord ? updateLoading : createLoading,
                state: editingRecord,
                title: editingRecord
                    ? "Assembly Production"
                    : "Assembly Production",

                body: (
                    <div className="col-span-2 w-full space-y-5">
                        {/* ================= BASIC DETAILS CARD ================= */}
                        <div className="w-full rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* 
                                    Voucher number is display only.
                                    Backend will auto-generate voucher number.
                                */}
                                <TextInput
                                    label="Voucher no."
                                    value={form.voucherNumber}
                                    placeholder="Voucher no."
                                    disabled
                                    error={errors.voucherNumber}
                                />

                                {/* Assembly production date */}
                                <TextInput
                                    label="Date"
                                    mandatory
                                    type="date"
                                    value={form.voucherDate}
                                    placeholder="Date"
                                    error={errors.voucherDate}
                                    onChange={(e: any) =>
                                        handleMainChange("voucherDate", e.target.value)
                                    }
                                />

                                {/* 
                                    Status is disabled as per existing functionality.
                                    Value still remains in form.
                                */}
                                <SelectInput
                                    label="Status"
                                    value={form.status}
                                    placeholder="Status"
                                    disabled
                                    error={errors.status}
                                    onChange={(e: any) =>
                                        handleMainChange("status", e.target.value)
                                    }
                                    options={[
                                        { label: "Open", value: "open" },
                                        { label: "Closed", value: "closed" },
                                    ]}
                                />

                                {/* Remarks field */}
                                <div className="md:col-span-3">
                                    <TextInput
                                        label="Remarks"
                                        value={form.remarks}
                                        placeholder="Remarks"
                                        error={errors.remarks}
                                        onChange={(e: any) =>
                                            handleMainChange("remarks", e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ================= FINISHED GOOD CARD ================= */}
                        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Finished good
                                </h3>

                                {/* Show applied badge after finished good is applied */}
                                {isFinishedGoodApplied && (
                                    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                        Applied
                                    </span>
                                )}
                            </div>

                            {/* Finished good apply validation error */}
                            {errors.finishedGoodApply && (
                                <p className="mb-2 text-sm font-medium text-red-500">
                                    {errors.finishedGoodApply}
                                </p>
                            )}

                            <div className="rounded-md border border-slate-200 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Finished good product dropdown */}
                                    <div className="md:col-span-4">
                                        <SelectInput
                                            label="Select Product"
                                            mandatory
                                            value={finishedGoodForm.productCode}
                                            placeholder="Select Product"
                                            error={errors["finishedGood.productCode"]}
                                            onChange={(e: any) =>
                                                handleFinishedGoodProductChange(e.target.value)
                                            }
                                            options={
                                                finishedGoodOptions?.length > 0
                                                    ? [
                                                        { label: "Select Product", value: "" },
                                                        ...finishedGoodOptions,
                                                    ]
                                                    : [{ label: "No Product", value: "" }]
                                            }
                                        />
                                    </div>

                                    {/* Finished good quantity */}
                                    <TextInput
                                        label="Quantity"
                                        mandatory
                                        type="number"
                                        value={finishedGoodForm.quantity}
                                        placeholder="Quantity"
                                        error={errors["finishedGood.quantity"]}
                                        onChange={(e: any) =>
                                            handleFinishedGoodChange("quantity", e.target.value)
                                        }
                                    />

                                    {/* Finished good rate */}
                                    <TextInput
                                        label="Rate"
                                        mandatory
                                        type="number"
                                        value={finishedGoodForm.rate}
                                        placeholder="Rate"
                                        error={errors["finishedGood.rate"]}
                                        onChange={(e: any) =>
                                            handleFinishedGoodChange("rate", e.target.value)
                                        }
                                    />

                                    {/* Finished good amount is auto calculated */}
                                    <div className="md:col-span-2">
                                        <TextInput
                                            label="Amount"
                                            type="number"
                                            value={finishedGoodForm.amount}
                                            placeholder="Amount"
                                            disabled
                                            onChange={(e: any) =>
                                                handleFinishedGoodChange("amount", e.target.value)
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Finished good gross amount */}
                                <div className="mt-4 text-sm font-bold text-slate-600">
                                    Gross: ₹{Number(finishedGoodForm.amount || 0).toFixed(2)}
                                </div>

                                {/* Finished good action buttons */}
                                <div className="mt-3 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={handleClearFinishedGood}
                                        className="rounded-md border border-slate-300 px-6 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleApplyFinishedGood}
                                        className="rounded-md bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ================= RAW MATERIALS CARD ================= */}
                        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Raw materials
                                </h3>

                                {/* Add raw material button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        /*
                                            If raw material products are not created,
                                            open warning modal from parent.
                                        */
                                        if (rawMaterialOptions.length === 0) {
                                            setShowNoRawMaterialAlert(true);
                                            return;
                                        }

                                        /*
                                            Open raw material modal in add mode.
                                        */
                                        setEditingRawMaterialIndex(null);
                                        setRawMaterialForm({ ...emptyProduct });
                                        setRawErrors({});
                                        setShowRawMaterialModal(true);
                                    }}
                                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                                >
                                    <Plus size={18} />
                                    Add Input Product
                                </button>
                            </div>

                            {/* Raw material validation error */}
                            {errors.rawMaterials && (
                                <p className="mb-2 text-sm text-red-500">
                                    {errors.rawMaterials}
                                </p>
                            )}

                            {/* Raw material list inside form */}
                            <ColumnWiseTable
                                data={form.rawMaterials}
                                fields={rawMaterialTableFields}
                                emptyMessage="No data"
                                onEdit={(item, index) => handleEditRawMaterial(item, index)}
                                onDelete={(_, index) => handleDeleteRawMaterial(index)}
                            />
                        </div>

                        {/* ================= COST CARD ================= */}
                        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Total raw material cost auto calculated */}
                                <TextInput
                                    label="Total raw material cost"
                                    value={String(totalRawMaterialCost)}
                                    placeholder="0"
                                    disabled
                                    onChange={(e: any) =>
                                        handleMainChange("totalRawMaterialCost", e.target.value)
                                    }
                                />

                                {/* Production cost is auto fetched from finished good rate */}
                                <TextInput
                                    label="Production cost"
                                    type="number"
                                    value={form.productionCost}
                                    placeholder="0"
                                    disabled
                                    error={errors.productionCost}
                                />

                                {/* Total finished cost auto calculated */}
                                <TextInput
                                    label="Total finished cost"
                                    value={String(totalFinishedCost)}
                                    placeholder="0"
                                    disabled
                                    onChange={(e: any) =>
                                        handleMainChange("totalFinishedCost", e.target.value)
                                    }
                                />
                            </div>
                        </div>
                    </div>
                ),
            }}
        />
    );
};

export default AssemblyProductionFormModal;