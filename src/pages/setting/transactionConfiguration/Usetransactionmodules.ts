import { useEffect, useState } from "react";
import type { FormEventHandler } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import type { TransactionModuleForm, TransactionModuleItem } from "./Types";
import { INITIAL_MODULE_FORM } from "./Constants";
import { clearSelectedTransactionModule, clearTransactionModuleError, clearTransactionModuleState, clearTransactionModuleSuccessMessage, deleteTransactionModule, getAllTransactionModules, getTransactionModuleByCode, saveTransactionModule, updateTransactionModule } from "../../../redux/slices/professionalSlice/transactionConfiguration/transactionModuleSlice";


/**
 * Owns: module list fetch/pagination/filters, the create/edit modal state,
 * and delete-confirm handling. Returns everything the page needs to wire up
 * <CustomTransactionsList />, <ModuleFormModal /> and <TransactionOverview />.
 */
export function useTransactionModules() {
    const dispatch = useDispatch<any>();

    const {
        items: transactionModules = [],
        pagination = {},
        selectedTransactionModule,
        loading: moduleLoading,
        createLoading,
        updateLoading,
        deleteLoading,
        error: moduleError,
        successMessage: moduleSuccessMessage,
    } = useSelector((state: any) => state.transactionModule || {});

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [localOffset, setLocalOffset] = useState(0);
    const [localLimit, setLocalLimit] = useState(10);
    const [refreshing, setRefreshing] = useState(false);

    const [showModuleForm, setShowModuleForm] = useState(false);
    const [editingModuleCode, setEditingModuleCode] = useState<string | null>(null);
    const [moduleForm, setModuleForm] = useState<TransactionModuleForm>(INITIAL_MODULE_FORM);
    const [moduleFormErrors, setModuleFormErrors] = useState<
        Partial<Record<keyof TransactionModuleForm, string>>
    >({});

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        item: null,
        moduleCode: null,
    });

    const currentPage = Number(pagination?.currentPage || 1);
    const totalPages = Math.max(1, Number(pagination?.totalPages || 1));
    const totalDocs = Number(pagination?.totalDocs || 0);
    const isModuleSubmitting = createLoading || updateLoading;

    const fetchTransactionModules = (
        nextOffset = localOffset,
        { showLoader = true }: { showLoader?: boolean } = {}
    ) => {
        if (!showLoader) setRefreshing(true);

        dispatch(
            getAllTransactionModules({
                offset: nextOffset,
                limit: localLimit,
                search,
                status: statusFilter,
            })
        ).finally(() => {
            if (!showLoader) setRefreshing(false);
        });
    };

    useEffect(() => {
        fetchTransactionModules(localOffset);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter, localLimit, localOffset]);

    const handleRefreshModules = () => {
        fetchTransactionModules(localOffset, { showLoader: false });
    };

    useEffect(() => {
        if (!moduleError || showModuleForm) return;
        toast.error(moduleError);
        dispatch(clearTransactionModuleError());
    }, [moduleError, showModuleForm, dispatch]);

    useEffect(() => {
        if (!moduleSuccessMessage) return;
        dispatch(clearTransactionModuleSuccessMessage());
    }, [moduleSuccessMessage, dispatch]);

    useEffect(() => {
        if (!editingModuleCode || !selectedTransactionModule) return;
        if (selectedTransactionModule.moduleCode !== editingModuleCode) return;

        setModuleForm({
            moduleName: selectedTransactionModule.moduleName || "",
            description: selectedTransactionModule.description || "",
            moduleType: selectedTransactionModule.moduleType || "",
            status: selectedTransactionModule.status === "inactive" ? "inactive" : "active",
        });
    }, [editingModuleCode, selectedTransactionModule]);

    const closeModuleForm = () => {
        setShowModuleForm(false);
        setEditingModuleCode(null);
        setModuleForm(INITIAL_MODULE_FORM);
        setModuleFormErrors({});
        dispatch(clearSelectedTransactionModule());
        dispatch(clearTransactionModuleState());
    };

    const openCreateModuleForm = () => {
        setEditingModuleCode(null);
        setModuleForm(INITIAL_MODULE_FORM);
        setModuleFormErrors({});
        dispatch(clearSelectedTransactionModule());
        dispatch(clearTransactionModuleState());
        setShowModuleForm(true);
    };

    const openEditModuleForm = async (moduleCode: string) => {
        setEditingModuleCode(moduleCode);
        setModuleForm(INITIAL_MODULE_FORM);
        setModuleFormErrors({});
        dispatch(clearTransactionModuleState());
        setShowModuleForm(true);

        try {
            await dispatch(getTransactionModuleByCode(moduleCode)).unwrap();
        } catch {
            // Error is rendered inside modal via moduleError.
        }
    };

    const updateModuleFormField = (field: keyof TransactionModuleForm, value: string) => {
        setModuleForm((previous) => ({ ...previous, [field]: value }));
        setModuleFormErrors((previous) => ({ ...previous, [field]: "" }));
    };

    const validateModuleForm = () => {
        const errors: Partial<Record<keyof TransactionModuleForm, string>> = {};

        if (!moduleForm.moduleName.trim()) errors.moduleName = "Module name is required.";
        if (!moduleForm.moduleType.trim()) errors.moduleType = "Module type is required.";

        setModuleFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleModuleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();

        if (!validateModuleForm()) return;

        const payload = {
            moduleName: moduleForm.moduleName.trim(),
            description: moduleForm.description.trim(),
            moduleType: moduleForm.moduleType.trim(),
            status: moduleForm.status,
        };

        try {
            if (editingModuleCode) {
                await dispatch(
                    updateTransactionModule({
                        moduleCode: editingModuleCode,
                        payload: { ...payload, moduleCode: editingModuleCode },
                    })
                ).unwrap();

                toast.success("Custom transaction updated successfully.");
            } else {
                await dispatch(saveTransactionModule(payload)).unwrap();

                toast.success("Custom transaction created successfully.");
                setLocalOffset(0);
            }

            closeModuleForm();
            fetchTransactionModules(editingModuleCode ? localOffset : 0, { showLoader: false });
        } catch {
            // Error is rendered inside modal via moduleError.
        }
    };

    const handleDeleteClick = (e: any, item: TransactionModuleItem) => {
        const rect = e.currentTarget.getBoundingClientRect();

        let x = rect.left - 160;
        if (x < 10) x = 10;

        const y = rect.top + window.scrollY - 5;

        setConfirmTooltip({ show: true, x, y, item, moduleCode: item.moduleCode });
    };

    const closeConfirmTooltip = () =>
        setConfirmTooltip({ show: false, x: null, y: null, item: null, moduleCode: null });

    /**
     * onDeleted lets the caller clear any selected-module / schema view state
     * without this hook needing to know about that concern.
     */
    const handleDeleteConfirm = async (onDeleted?: (moduleCode: string) => void) => {
        const item: TransactionModuleItem | null = confirmTooltip?.item;

        if (!item?.moduleCode) {
            toast.warn("Module code not found");
            return;
        }

        try {
            await dispatch(deleteTransactionModule(item.moduleCode)).unwrap();
            toast.success("Custom transaction deleted successfully.");

            onDeleted?.(item.moduleCode);
            closeConfirmTooltip();

            const remainingItems = transactionModules.length - 1;
            const nextOffset =
                remainingItems === 0 && localOffset > 0
                    ? Math.max(0, localOffset - localLimit)
                    : localOffset;

            if (nextOffset !== localOffset) {
                setLocalOffset(nextOffset);
            } else {
                fetchTransactionModules(nextOffset, { showLoader: false });
            }
        } catch {
            // Slice error is handled by the page-level effect.
        }
    };

    return {
        // data
        transactionModules,
        moduleLoading,
        deleteLoading,
        moduleError,
        totalDocs,
        currentPage,
        totalPages,
        pagination,
        // list filters/pagination
        search,
        setSearch,
        statusFilter,
        setStatusFilter: (value: string) => {
            setStatusFilter(value);
            setLocalOffset(0);
        },
        localLimit,
        setLocalLimit: (limit: number) => {
            setLocalLimit(limit);
            setLocalOffset(0);
        },
        localOffset,
        setLocalOffset,
        refreshing,
        handleRefreshModules,
        // create/edit modal
        showModuleForm,
        editingModuleCode,
        moduleForm,
        moduleFormErrors,
        isModuleSubmitting,
        openCreateModuleForm,
        openEditModuleForm,
        updateModuleFormField,
        handleModuleSubmit,
        closeModuleForm,
        // delete confirm
        confirmTooltip,
        handleDeleteClick,
        handleDeleteConfirm,
        closeConfirmTooltip,
    };
}