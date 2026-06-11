import { SelectInput, TextArea, TextInput } from "../inputs";
import EditableLineTable from "./EditableLineTable";
import SummaryCards from "./SummaryCards";
import VoucherFormModal from "./VoucherFormModal";
import { DynamicFormContentSkeleton } from "../skeleton/SkeletonLoader";


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
    handleRefRow,
    handleDeleteRow,
    handleRowChange,
    inputData,
    bodyKey,
    addButtonText,
    handleChange,
    footerTotals,
    headerChildTitle,
    isAddButton = true,
    isRefrenceAction = false,
    RefrenceBtnText,

    // ✅ New props for skeleton
    contentLoading = false,
    contentSkeleton,
}: any) => {

    const renderInput = (e: any) => {
        if (e?.type === "date") {
            return (
                <TextInput
                    label={e?.label}
                    mandatory={e?.isRequired}
                    disabled={e?.disabled || e?.isReadonly}
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
                    mandatory={e?.isRequired}
                    value={form?.[e?.key] || ""}
                    placeholder={e?.placeholder}
                    error={errors?.[e?.key]}
                    onChange={(event: any) =>
                        handleChange(e?.key, event.target.value)
                    }
                />
            );
        }

        if (e?.type === "select") {

            
            return (
                <SelectInput
                    label={e?.label}
                    value={form?.[e?.key] || ""}
                    mandatory={e?.isRequired}
                    placeholder={e?.placeholder}
                    disabled={e?.disabled || e?.isReadonly}
                    error={errors?.[e?.key]}
                    onChange={(event: any) =>
                        handleChange(e?.key, event.target.value)
                    }
                    options={[
                        { label: `Select ${e?.label}`, value: "" },
                        ...(e?.options || []),
                    ]}
                />
            );
        }

        return (
            <TextInput
                label={e?.label}
                mandatory={e?.isRequired}
                value={form?.[e?.key] || ""}
                disabled={e?.disabled || e?.isReadonly}
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
                {contentLoading ? (
                    contentSkeleton || (
                        <DynamicFormContentSkeleton
                            headerFields={5}
                            bodyRows={2}
                            bodyColumns={7}
                            footerFields={6}
                        />
                    )
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-3">
                            {inputData?.header?.map((e: any, index: number) => {
                                if (e?.isHidden) return null;

                                return (
                                    <div key={e?.key || index}>
                                        {renderInput(e)}
                                    </div>
                                );
                            })}
                        </div>

                        {inputData?.headerChild &&
                            inputData.headerChild.length > 0 && (
                                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="mb-4 border-b border-slate-200 pb-3">
                                        <h1 className="text-lg font-bold text-slate-900">
                                            {headerChildTitle}
                                        </h1>
                                    </div>

                                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
                                        {inputData.headerChild.map(
                                            (e: any, index: number) => {
                                                if (e?.isHidden) return null;

                                                return (
                                                    <div key={e?.key || index}>
                                                        {renderInput(e)}
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            )}

                        {errors?.[bodyKey] && (
                            <p className="mt-4 text-sm text-red-500">
                                {errors?.[bodyKey]}
                            </p>
                        )}

                        {/* ✅ Only EditableLineTable has horizontal scroll inside itself */}
                        <div className="mt-3 w-full max-w-full">
                            <EditableLineTable
                                title="Products"
                                addButtonText={addButtonText||"Add Product"}
                                rows={form?.[bodyKey] || []}
                                columns={inputData?.body || []}
                                errors={errors}
                                onAddRow={handleAddRow}
                                onRefrenceRow={handleRefRow}
                                onDeleteRow={handleDeleteRow}
                                onChange={handleRowChange}
                                emptyText="No products added"
                                isAddButton={isAddButton}
                                RefrenceBtnText={RefrenceBtnText}
                                isRefrenceAction={isRefrenceAction}
                            />
                        </div>

                        {Object.keys(errors || {})
                            .filter((key) => key.includes("_tax"))
                            .map((key) => (
                                <p
                                    key={key}
                                    className="mt-2 text-sm text-red-500"
                                >
                                    {errors[key]}
                                </p>
                            ))}

                        {/* ✅ Summary stays outside table scroll */}
                        <SummaryCards
                            footerTotals={footerTotals}
                            items={inputData?.footer || []}
                        />
                    </>
                )}
            </div>
        </VoucherFormModal>
    );
};

export default DynamicAddForm;