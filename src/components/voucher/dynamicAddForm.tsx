import { SelectInput, TextArea, TextInput } from "../inputs";
import EditableLineTable from "./EditableLineTable";
import SummaryCards from "./SummaryCards";
import VoucherFormModal from "./VoucherFormModal";

const DynamicAddForm = ({
    show,
    setShow,
    edit,
    title,
    subtitle,
    loading,
    onClose,
    onSubmit,
    form,
    errors,
    handleAddRow,
    handleDeleteRow,
    handleRowChange,
    inputData,
    bodyKey,
    handleChange,
    headerChildTitle,
}: any) => {
    const renderInput = (e: any) => {
        console.log(e?.label)
        if (e?.type === "date") {
            return (
                <TextInput
                    label={e?.label}
                    disabled={e?.disabled}
                    type={e.type}
                    value={
                        form?.[e?.key]
                            ? String(form?.[e?.key]).split("T")[0]
                            : ""
                    }
                    error={errors?.[e?.key]}
                    onChange={(event: any) =>
                        handleChange(e?.key, event.target.value)
                    }
                />
            );
        }

        if (e?.type === "textarea") {
            return (
                <TextArea
                    label={e?.label}
                    value={form?.[e?.key] || ""}
                    placeholder={e?.placeholder}
                    error={errors?.[e?.key]}
                    onChange={(event: any) =>
                        handleChange(e?.key, event.target.value)
                    }
                />
            );
        }

        if (e?.type == "select") return <SelectInput
            label={e?.label}
            value={form?.[e?.key] || ""}
            placeholder={e?.placeholder}
            disabled={e?.disabled}
            error={errors?.[e?.key]}
            onChange={(event: any) => handleChange(e?.key, event.target.value)}
            options={e?.options}
        />

        return (
            <TextInput
                label={e?.label}
                value={form?.[e?.key] || ""}
                disabled={e?.disabled}
                placeholder={e?.placeholder}
                error={errors?.[e?.key]}
                onChange={(event: any) =>
                    handleChange(e?.key, event.target.value)
                }
            />
        );
    };

    return (
        <VoucherFormModal
            show={show}
            setShow={setShow}
            edit={edit}
            title={title}
            subtitle={subtitle}
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
        >
            <div className="w-full max-w-full">
                <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-3">
                    {inputData?.header?.map((e: any, index: number) => (
                        <div key={e?.key || index}>
                            {renderInput(e)}
                        </div>
                    ))}
                </div>

                {inputData?.headerChild && inputData.headerChild.length > 0 && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 border-b border-slate-200 pb-3">
                            <h1 className="text-lg font-bold text-slate-900">
                                {headerChildTitle}
                            </h1>
                        </div>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
                            {inputData.headerChild.map((e: any, index: number) => (
                                <div key={e?.key || index}>
                                    {renderInput(e)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {errors?.[bodyKey] && (
                    <p className="mt-4 text-sm text-red-500">
                        {errors?.[bodyKey]}
                    </p>
                )}

                {/* ✅ Only EditableLineTable has horizontal scroll inside itself */}
                <div className="mt-6 w-full max-w-full">
                    <EditableLineTable
                        title="Products"
                        addButtonText="Add Product"
                        rows={form?.[bodyKey] || []}
                        columns={inputData?.body || []}
                        errors={errors}
                        onAddRow={handleAddRow}
                        onDeleteRow={handleDeleteRow}
                        onChange={handleRowChange}
                        emptyText="No products added"
                    />
                </div>

                {Object.keys(errors || {})
                    .filter((key) => key.includes("_tax"))
                    .map((key) => (
                        <p key={key} className="mt-2 text-sm text-red-500">
                            {errors[key]}
                        </p>
                    ))}

                {/* ✅ Summary stays outside table scroll */}
                <SummaryCards items={inputData?.footer || []} />
            </div>
        </VoucherFormModal>
    );
};

export default DynamicAddForm;