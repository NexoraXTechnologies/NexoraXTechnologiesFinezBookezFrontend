import { SelectInput, TextArea, TextInput, ToggleInput } from "../inputs";
import EditableLineTable from "./EditableLineTable";
import SummaryCards from "./SummaryCards";
import VoucherFormModal from "./VoucherFormModal";
import { DynamicFormContentSkeleton } from "../skeleton/SkeletonLoader";
import LocationSection from "./LocationSection";

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
    headerChildTitle,
    isAddButton = true,
    isRefrenceAction = false,
    RefrenceBtnText,
    bodyTitle,
    isView = false,
    contentLoading = false,
    contentSkeleton,
    isSummaryFooter,
    manualselected,
    enableLocation,

    // Optional row-aware field visibility functions.
    isBodyColumnVisible,
    isBodyCellVisible,
    isBodyCellDisabled
}: any) => {
    const renderInput = (field: any) => {
        if (field?.type === "date") {
            return (
                <TextInput
                    label={field?.label}
                    mandatory={field?.isRequired}
                    disabled={field?.disabled || field?.isReadonly}
                    read
                    type={field.type}
                    value={
                        form?.[field?.key]
                            ? String(form?.[field?.key]).split("T")[0]
                            : ""
                    }
                    error={errors?.[field?.key]}
                    onChange={(event: any) =>
                        handleChange(field?.key, event.target.value)
                    }
                />
            );
        }

        if (field?.type === "textarea") {
            return (
                <TextArea
                    label={field?.label}
                    mandatory={field?.isRequired}
                    value={form?.[field?.key] || ""}
                    placeholder={field?.placeholder}
                    error={errors?.[field?.key]}
                    onChange={(event: any) =>
                        handleChange(field?.key, event.target.value)
                    }
                />
            );
        }

        if (field?.type === "toggle") {
            return (
                <ToggleInput
                    key={field.key}
                    label={field.label}
                    name={field.key}
                    value={form?.[field.key]}
                    checked={Boolean(form?.[field.key])}
                    mandatory={field.required}
                    disabled={field.disabled}
                    error={errors?.[field.key]}
                    onChange={(event: any) =>
                        handleChange(field.key, event.target.checked)
                    }
                />
            );
        }

        if (field?.type === "select") {
            return (
                <SelectInput
                    label={field?.label}
                    value={form?.[field?.key] || ""}
                    mandatory={field?.isRequired}
                    placeholder={field?.placeholder}
                    disabled={field?.disabled || field?.isReadonly}
                    error={errors?.[field?.key]}
                    onChange={(event: any) =>
                        handleChange(field?.key, event.target.value)
                    }
                    options={[
                        { label: `Select ${field?.label}`, value: "" },
                        ...(field?.options || []),
                    ]}
                />
            );
        }

        return (
            <TextInput
                label={field?.label}
                mandatory={field?.isRequired}
                value={form?.[field?.key] || ""}
                disabled={field?.disabled || field?.isReadonly}
                placeholder={field?.placeholder}
                error={errors?.[field?.key]}
                onChange={(event: any) =>
                    handleChange(field?.key, event.target.value)
                }
            />
        );
    };

    return (
        <VoucherFormModal
            isView={isView}
            show={show}
            setShow={setShow}
            edit={edit}
            title={title}
            subtitle={subtitle}
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
        >
            <div className="w-full max-w-full text-card-foreground h-full">
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
                            {inputData?.header?.map(
                                (field: any, index: number) => {
                                    if (field?.isHidden) return null;

                                    return (
                                        <div key={field?.key || index}>
                                            {renderInput(field)}
                                        </div>
                                    );
                                }
                            )}
                        </div>

                        {inputData?.headerChild &&
                            inputData.headerChild.length > 0 && (
                                <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                                    <div className="mb-4 border-b border-border pb-3">
                                        <h1 className="text-lg font-bold text-card-foreground">
                                            {headerChildTitle}
                                        </h1>
                                    </div>

                                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
                                        {inputData.headerChild.map(
                                            (field: any, index: number) => {
                                                if (field?.isHidden) return null;

                                                return (
                                                    <div
                                                        key={
                                                            field?.key || index
                                                        }
                                                    >
                                                        {renderInput(field)}
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            )}

                        {enableLocation && (
                            <LocationSection
                                form={form}
                                handleChange={handleChange}
                            />
                        )}

                        {errors?.[bodyKey] && (
                            <p className="mt-4 text-sm text-danger">
                                {errors?.[bodyKey]}
                            </p>
                        )}

                        {!manualselected && (
                            <div className="mt-3 w-full max-w-full">
                                <EditableLineTable
                                    isView={isView}
                                    bodyTitle={bodyTitle || "Products"}
                                    addButtonText={
                                        addButtonText || "Add Product"
                                    }
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
                                    isColumnVisible={isBodyColumnVisible}
                                        isCellVisible={isBodyCellVisible}
                                        isCellDisabled={isBodyCellDisabled}
                                />
                            </div>
                        )}

                        {Object.keys(errors || {})
                            .filter((key) => key.includes("_tax"))
                            .map((key) => (
                                <p
                                    key={key}
                                    className="mt-2 text-sm text-danger"
                                >
                                    {errors[key]}
                                </p>
                            ))}

                        <SummaryCards
                            items={inputData?.footer || []}
                            isSummaryFooter={isSummaryFooter}
                        />
                    </>
                )}
            </div>
        </VoucherFormModal>
    );
};

export default DynamicAddForm;