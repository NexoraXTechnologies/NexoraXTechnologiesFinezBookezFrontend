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
    headerChildTitle,
    isAddButton = true,
    isRefrenceAction = false,
    RefrenceBtnText,
    bodyTitle,
    isView = false,
    contentLoading = false,
    contentSkeleton,
    isSummaryFooter
}: any) => {
    const renderInput = (e: any) => {
        if (e?.type === "date") {
            return (
                <TextInput
                    label={e?.label}
                    mandatory={e?.isRequired}
                    disabled={e?.disabled || e?.isReadonly}
                    read
                    type={e.type}
                    value={form?.[e?.key] ? String(form?.[e?.key]).split("T")[0] : ""}
                    error={errors?.[e?.key]}
                    onChange={(event: any) => handleChange(e?.key, event.target.value)}
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
                    onChange={(event: any) => handleChange(e?.key, event.target.value)}
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
                    onChange={(event: any) => handleChange(e?.key, event.target.value)}
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
                onChange={(event: any) => handleChange(e?.key, event.target.value)}
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
                            {inputData?.header?.map((e: any, index: number) => {
                                if (e?.isHidden) return null;

                                return <div key={e?.key || index}>{renderInput(e)}</div>;
                            })}
                        </div>

                            {inputData?.headerChild && inputData.headerChild.length > 0 && (
                                <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                                    <div className="mb-4 border-b border-border pb-3">
                                        <h1 className="text-lg font-bold text-card-foreground">
                                            {headerChildTitle}
                                        </h1>
                                    </div>

                                    <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3">
                                        {inputData.headerChild.map((e: any, index: number) => {
                                            if (e?.isHidden) return null;

                                            return <div key={e?.key || index}>{renderInput(e)}</div>;
                                        })}
                                    </div>
                                </div>
                            )}

                        {errors?.[bodyKey] && (
                                <p className="mt-4 text-sm text-danger">
                                {errors?.[bodyKey]}
                            </p>
                        )}

                        <div className="mt-3 w-full max-w-full">
                            <EditableLineTable
                                isView={isView}
                                bodyTitle={bodyTitle || "Products"}
                                addButtonText={addButtonText || "Add Product"}
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
                                <p key={key} className="mt-2 text-sm text-danger">
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