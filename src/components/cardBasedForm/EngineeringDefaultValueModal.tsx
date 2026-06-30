
import { DynamicFormContentSkeleton } from "../skeleton/SkeletonLoader";
import VoucherFormModal from "../voucher/VoucherFormModal";
import EngineeringSectionForm from "./EngineeringSectionForm";

const EngineeringDefaultValueModal = ({
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
    handleChange,
    inputData,
    isView = false,
    contentLoading = false,
    contentSkeleton,
}: any) => {
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
            <div className="h-full w-full max-w-full text-card-foreground">
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
                    <EngineeringSectionForm
                        sections={inputData?.sections || []}
                        form={form}
                        errors={errors}
                        handleChange={handleChange}
                    />
                )}
            </div>
        </VoucherFormModal>
    );
};

export default EngineeringDefaultValueModal;