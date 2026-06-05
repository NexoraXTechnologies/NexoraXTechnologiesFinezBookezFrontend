import { SelectInput, TextArea, TextInput } from "../inputs";
import EditableLineTable from "./EditableLineTable";
import SummaryCards from "./SummaryCards";
import VoucherFormModal from "./VoucherFormModal";

const DynamicAddForm = ({ show, setShow, edit, title, subtitle, loading, onClose, onSubmit, form, errors, handleAddRow, handleDeleteRow, handleRowChange, inputData, bodyKey, handleChange }: any) => {

    const renderInput = (e: any) => {
        return (
            <>
                {e?.type == "date" ?
                    <TextInput
                        label={e?.title}
                        disabled={e?.disabled}
                        type={e.type}
                        value={form?.[e?.key] ? String(form?.[e?.key]).split("T")[0] : ""}
                        error={errors?.openingStockDate}
                        onChange={(event: any) => handleChange(e?.key, event.target.value)}
                    />
                    :
                    (e?.type == "textarea" ?
                        <TextArea
                            label={e?.title}
                            value={form?.[e?.key] || ""}
                            placeholder={e?.placeholder}
                            error={errors?.[e?.key]}
                            onChange={(event: any) => handleChange(e?.key, event.target.value)}
                        />
                        : (e?.type == "select" ? <SelectInput
                            label={e?.title}
                            value={form?.[e?.key] || ""}
                            placeholder={e?.placeholder}
                            disabled={e?.disabled}
                            error={errors?.[e?.key]}
                            onChange={(event: any) => handleChange(e?.key, event.target.value)}
                            options={e?.options}
                        /> : <TextInput
                            label={e?.title}
                            value={form?.[e?.key] || ""}
                            error={errors?.[e?.key]}
                            disabled={e?.disabled}
                            onChange={(event: any) => handleChange(e?.key, event.target.value)}
                        />))
                }
            </>
        )
    }

    return (
        <VoucherFormModal
            {...{ show, setShow, edit, title, subtitle, loading, onClose, onSubmit, form, errors, handleAddRow, handleDeleteRow, handleRowChange }}
        >
            <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-3">

                {inputData?.headerInput?.map((e: any) => renderInput(e))}

                {/* <TextInput
                    label="Voucher No"
                    value={form.openingStockVoucherNumber || ""}
                    disabled
                    onChange={(e: any) =>
                        handleChange(
                            "openingStockVoucherNumber",
                            e.target.value
                        )
                    }
                />

                <TextInput
                    label="Date"
                    type="date"
                    value={form.openingStockDate ? String(form.openingStockDate).split("T")[0] : ""}
                    error={errors?.openingStockDate}
                    onChange={(e: any) =>
                        handleChange("openingStockDate", e.target.value)
                    }
                />

                <TextArea
                    label="Remark"
                    value={form.remark || ""}
                    placeholder="Enter Remark"
                    error={errors?.remark}
                    onChange={(e: any) =>
                        handleChange("remark", e.target.value)
                    }
                /> */}
            </div>

            {errors?.[bodyKey] && (
                <p className="mt-4 text-sm text-red-500">
                    {errors?.[bodyKey]}
                </p>
            )}

            <div className="col-span-2 space-y-5">
                <EditableLineTable
                    title="Products"
                    addButtonText="Add Product"
                    rows={form?.[bodyKey]}
                    columns={inputData?.editTable}
                    errors={errors}
                    onAddRow={handleAddRow}
                    onDeleteRow={handleDeleteRow}
                    onChange={handleRowChange}
                    emptyText="No products added"
                />
            </div>

            {Object.keys(errors || {}).filter((key) => key.includes("_tax")).map((key) => (
                <p key={key} className="mt-2 text-sm text-red-500">
                    {errors[key]}
                </p>
            ))}

            <SummaryCards
                items={inputData?.footerCard}
            />
        </VoucherFormModal>
    )
}
export default DynamicAddForm;