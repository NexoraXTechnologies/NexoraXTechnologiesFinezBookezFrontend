import { useEffect, useMemo, useState } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Edit3,
  LayoutGrid,
  Loader2,
  Package,
  Plus,
  RefreshCcw,
  Ruler,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

/* ===================================================
   ⭐ EXISTING: CUSTOM MASTER MODULE CRUD
=================================================== */

import {
  clearMasterConfigurationState,
  clearSelectedMasterConfiguration,
  createMasterConfiguration,
  deleteMasterConfiguration,
  getAllMasterConfigurations,
  getMasterConfigurationByCode,
  updateMasterConfiguration,
} from "../../../redux/slices/professionalSlice/masterConfigurationSlice/masterConfigurationSlice";

/* ===================================================
   ⭐ EXISTING: CUSTOM MASTER SCHEMA
   Used only for dynamically created custom masters.
=================================================== */

import {
  clearMasterSchemaError,
  clearMasterSchemaState,
  getMasterSchema,
  saveMasterSchema,
  updateMasterSchema,
} from "../../../redux/slices/professionalSlice/masterConfigurationSlice/masterSchemaSlice";

/* ===================================================
   ⭐ NEW: STANDARD MASTER SCHEMA SLICES
=================================================== */

import {
  clearAccountMasterSchemaError,
  clearAccountMasterSchemaState,
  getAccountMasterSchema,
  saveAccountMasterSchema,
  updateAccountMasterSchema,
} from "../../../redux/slices/professionalSlice/masterConfigurationSlice/accountMasterSchemaSlice";

import {
  clearProductMasterSchemaError,
  clearProductMasterSchemaState,
  getProductMasterSchema,
  saveProductMasterSchema,
  updateProductMasterSchema,
} from "../../../redux/slices/professionalSlice/masterConfigurationSlice/productMasterSchemaSlice";

import {
  clearUnitMeasurementSchemaError,
  clearUnitMeasurementSchemaState,
  getUnitMeasurementSchema,
  saveUnitMeasurementSchema,
  updateUnitMeasurementSchema,
} from "../../../redux/slices/professionalSlice/masterConfigurationSlice/unitMeasurementSchemaSlice";

/* ===================================================
   ⭐ TYPES
=================================================== */

type MasterConfigurationForm = {
  moduleName: string;
  description: string;
  status: "active" | "inactive";
};

type MasterConfigurationItem = MasterConfigurationForm & {
  _id?: string;
  moduleCode: string;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
};

type StandardMasterKey =
  | "accountMaster"
  | "productMaster"
  | "unitMeasurement"
  | "teamEmployeeMaster";

type StandardMasterItem = {
  key: StandardMasterKey;
  name: string;
  description: string;
  icon: ReactNode;
  schemaEnabled: boolean;
};

type SchemaField = {
  key: string;
  label: string;
  type: string;
  ref?: string;
  isRequired?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  isHidden?: boolean;
  customMasterCode?: string;
  customMasterName?: string;
  options?: any[];
  [key: string]: any;
};

type SchemaFieldForm = {
  key: string;
  label: string;
  type: string;
  ref: string;
  isRequired: boolean;
  isSearchable: boolean;
  isFilterable: boolean;
  isHidden: boolean;
  customMasterCode: string;
  customMasterName: string;
};

type SchemaContext =
  | {
      kind: "standard";
      standardKey: StandardMasterKey;
      title: string;
      moduleCode?: never;
    }
  | {
      kind: "custom";
      standardKey?: never;
      title: string;
      moduleCode: string;
    };

/* ===================================================
   ⭐ CONSTANTS
=================================================== */

const INITIAL_MASTER_FORM: MasterConfigurationForm = {
  moduleName: "",
  description: "",
  status: "active",
};

const INITIAL_SCHEMA_FIELD_FORM: SchemaFieldForm = {
  key: "",
  label: "",
  type: "text",
  ref: "",
  isRequired: false,
  isSearchable: false,
  isFilterable: false,
  isHidden: false,
  customMasterCode: "",
  customMasterName: "",
};

const STANDARD_MASTERS: StandardMasterItem[] = [
  {
    key: "accountMaster",
    name: "Account Master",
    description:
      "Configure fields used for customer, supplier, bank, cash, income, expense and ledger accounts.",
    icon: <LayoutGrid size={18} />,
    schemaEnabled: true,
  },
  {
    key: "productMaster",
    name: "Product Master",
    description:
      "Configure product, service and inventory-related master fields.",
    icon: <Package size={18} />,
    schemaEnabled: true,
  },
  {
    key: "unitMeasurement",
    name: "Unit Master",
    description:
      "Configure units of measurement used across products, purchases, sales and inventory.",
    icon: <Ruler size={18} />,
    schemaEnabled: true,
  },
  {
    key: "teamEmployeeMaster",
    name: "Team / Employee Master",
    description:
      "Manage application users, employees, team members and their access.",
    icon: <Users size={18} />,
    schemaEnabled: false,
  },
];

const FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text" },
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Select" },
  { value: "textarea", label: "Textarea" },
  { value: "accountmaster", label: "Account Master" },
  { value: "productmaster", label: "Product Master" },
  { value: "unitmaster", label: "Unit Master" },
  { value: "custommaster", label: "Custom Master" },
];

/* ===================================================
   ⭐ REUSABLE UI
=================================================== */

const Panel = ({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
}) => (
  <section className="overflow-hidden rounded border border-border bg-card shadow-sm">
    <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-base font-black text-card-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {right}
    </div>
    {children}
  </section>
);

const BooleanBadge = ({ value }: { value: boolean }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${
      value
        ? "bg-success/10 text-success"
        : "bg-muted text-muted-foreground"
    }`}
  >
    {value ? "Yes" : "No"}
  </span>
);

/* ===================================================
   ⭐ MAIN PAGE
=================================================== */

const MasterConfiguration = () => {
  const dispatch = useDispatch<any>();

  /* ---------------------------------------------------
     Custom-master module state
  --------------------------------------------------- */

  const {
    masterConfigurations = [],
    pagination = {},
    selectedMasterConfiguration,
    loading: moduleLoading,
    createLoading,
    updateLoading,
    deleteLoading,
    error: moduleError,
  } = useSelector((state: any) => state.masterConfiguration || {});

  /* ---------------------------------------------------
     Custom-master schema state
  --------------------------------------------------- */

  const {
    fields: customSchemaFields = [],
    loading: customSchemaLoading,
    saveLoading: customSchemaSaveLoading,
    updateLoading: customSchemaUpdateLoading,
    error: customSchemaError,
  } = useSelector((state: any) => state.masterSchema || {});

  /* ---------------------------------------------------
     Account-master schema state
  --------------------------------------------------- */

  const {
    fields: accountSchemaFields = [],
    loading: accountSchemaLoading,
    saveLoading: accountSchemaSaveLoading,
    updateLoading: accountSchemaUpdateLoading,
    error: accountSchemaError,
  } = useSelector((state: any) => state.accountMasterSchema || {});

  /* ---------------------------------------------------
     Product-master schema state
  --------------------------------------------------- */

  const {
    fields: productSchemaFields = [],
    loading: productSchemaLoading,
    saveLoading: productSchemaSaveLoading,
    updateLoading: productSchemaUpdateLoading,
    error: productSchemaError,
  } = useSelector((state: any) => state.productMasterSchema || {});

  /* ---------------------------------------------------
     Unit-measurement schema state
  --------------------------------------------------- */

  const {
    fields: unitSchemaFields = [],
    loading: unitSchemaLoading,
    saveLoading: unitSchemaSaveLoading,
    updateLoading: unitSchemaUpdateLoading,
    error: unitSchemaError,
  } = useSelector((state: any) => state.unitMeasurementSchema || {});

  /* ---------------------------------------------------
     Page/navigation state
  --------------------------------------------------- */

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedCustomSchemaMaster, setSelectedCustomSchemaMaster] =
    useState<MasterConfigurationItem | null>(null);

  /* ---------------------------------------------------
     Custom-master list filters
  --------------------------------------------------- */

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageLimit, setPageLimit] = useState(10);

  /* ---------------------------------------------------
     Custom-master create/edit modal
  --------------------------------------------------- */

  const [showMasterForm, setShowMasterForm] = useState(false);
  const [editingModuleCode, setEditingModuleCode] = useState<string | null>(null);
  const [masterForm, setMasterForm] =
    useState<MasterConfigurationForm>(INITIAL_MASTER_FORM);
  const [masterFormErrors, setMasterFormErrors] = useState<
    Partial<Record<keyof MasterConfigurationForm, string>>
  >({});

  /* ---------------------------------------------------
     Schema-field create/edit modal
  --------------------------------------------------- */

  const [showSchemaForm, setShowSchemaForm] = useState(false);
  const [editingSchemaFieldKey, setEditingSchemaFieldKey] =
    useState<string | null>(null);
  const [schemaForm, setSchemaForm] =
    useState<SchemaFieldForm>(INITIAL_SCHEMA_FIELD_FORM);
  const [schemaFormErrors, setSchemaFormErrors] = useState<
    Partial<Record<keyof SchemaFieldForm, string>>
  >({});

  /* ---------------------------------------------------
     Derived pagination values
  --------------------------------------------------- */

  const currentPage = Number(pagination?.currentPage || 1);
  const totalPages = Math.max(1, Number(pagination?.totalPages || 1));
  const totalDocs = Number(pagination?.totalDocs || 0);
  const offset = Number(pagination?.offset || 0);

  const isMasterSubmitting = createLoading || updateLoading;

  /* ===================================================
     ⭐ TAB DEFINITIONS
  =================================================== */

  const tabs = useMemo(
    () => [
      {
        key: "overview",
        label: "All Masters",
        icon: <Boxes size={17} />,
      },
      ...STANDARD_MASTERS.map((master) => ({
        key: master.key,
        label: master.name,
        icon: master.icon,
      })),
      {
        key: "customMasters",
        label: "Custom Masters",
        icon: <ShieldCheck size={17} />,
      },
    ],
    []
  );

  const selectedStandardMaster = useMemo(
    () =>
      STANDARD_MASTERS.find((master) => master.key === activeTab) || null,
    [activeTab]
  );

  /* ===================================================
     ⭐ CUSTOM-MASTER MODULE LIST FETCH
  =================================================== */

  const fetchMasterConfigurations = (nextOffset = 0) => {
    dispatch(
      getAllMasterConfigurations({
        offset: nextOffset,
        limit: pageLimit,
        search,
        status: statusFilter,
      })
    );
  };

  useEffect(() => {
    fetchMasterConfigurations(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, pageLimit]);

  /* ===================================================
     ⭐ LOAD STANDARD-MASTER SCHEMA BY ACTIVE TAB
  =================================================== */

  useEffect(() => {
    if (!selectedStandardMaster?.schemaEnabled) return;

    if (selectedStandardMaster.key === "accountMaster") {
      dispatch(clearAccountMasterSchemaState());
      dispatch(
        getAccountMasterSchema({
          offset: 0,
          limit: 20,
          isSearchable: "",
          isRequired: "",
          isFilterable: "",
        })
      );
      return;
    }

    if (selectedStandardMaster.key === "productMaster") {
      dispatch(clearProductMasterSchemaState());
      dispatch(
        getProductMasterSchema({
          offset: 0,
          limit: 20,
          isSearchable: "",
          isRequired: "",
        })
      );
      return;
    }

    if (selectedStandardMaster.key === "unitMeasurement") {
      dispatch(clearUnitMeasurementSchemaState());
      dispatch(
        getUnitMeasurementSchema({
          offset: 0,
          limit: 20,
          isSearchable: "",
          isRequired: "",
          type: "",
          isFilterable: "",
        })
      );
    }
  }, [dispatch, selectedStandardMaster?.key, selectedStandardMaster?.schemaEnabled]);

  /* ===================================================
     ⭐ ERROR HANDLING
  =================================================== */

  useEffect(() => {
    if (!moduleError || showMasterForm) return;
    toast.error(moduleError);
    dispatch(clearMasterConfigurationState());
  }, [moduleError, showMasterForm, dispatch]);

  useEffect(() => {
    if (!customSchemaError) return;
    toast.error(customSchemaError);
    dispatch(clearMasterSchemaError());
  }, [customSchemaError, dispatch]);

  useEffect(() => {
    if (!accountSchemaError) return;
    toast.error(accountSchemaError);
    dispatch(clearAccountMasterSchemaError());
  }, [accountSchemaError, dispatch]);

  useEffect(() => {
    if (!productSchemaError) return;
    toast.error(productSchemaError);
    dispatch(clearProductMasterSchemaError());
  }, [productSchemaError, dispatch]);

  useEffect(() => {
    if (!unitSchemaError) return;
    toast.error(unitSchemaError);
    dispatch(clearUnitMeasurementSchemaError());
  }, [unitSchemaError, dispatch]);

  /* ===================================================
     ⭐ POPULATE CUSTOM-MASTER EDIT FORM
  =================================================== */

  useEffect(() => {
    if (!editingModuleCode || !selectedMasterConfiguration) return;
    if (selectedMasterConfiguration.moduleCode !== editingModuleCode) return;

    setMasterForm({
      moduleName: selectedMasterConfiguration.moduleName || "",
      description: selectedMasterConfiguration.description || "",
      status:
        selectedMasterConfiguration.status === "inactive"
          ? "inactive"
          : "active",
    });
  }, [editingModuleCode, selectedMasterConfiguration]);

  /* ===================================================
     ⭐ CUSTOM-MASTER FORM HELPERS
  =================================================== */

  const closeMasterForm = () => {
    setShowMasterForm(false);
    setEditingModuleCode(null);
    setMasterForm(INITIAL_MASTER_FORM);
    setMasterFormErrors({});
    dispatch(clearSelectedMasterConfiguration());
    dispatch(clearMasterConfigurationState());
  };

  const openCreateMasterForm = () => {
    setEditingModuleCode(null);
    setMasterForm(INITIAL_MASTER_FORM);
    setMasterFormErrors({});
    dispatch(clearSelectedMasterConfiguration());
    dispatch(clearMasterConfigurationState());
    setShowMasterForm(true);
  };

  const openEditMasterForm = async (moduleCode: string) => {
    setEditingModuleCode(moduleCode);
    setMasterForm(INITIAL_MASTER_FORM);
    setMasterFormErrors({});
    dispatch(clearMasterConfigurationState());
    setShowMasterForm(true);

    try {
      await dispatch(getMasterConfigurationByCode(moduleCode)).unwrap();
    } catch {
      // Error is rendered inside modal.
    }
  };

  const updateMasterFormField = (
    field: keyof MasterConfigurationForm,
    value: string
  ) => {
    setMasterForm((previous) => ({ ...previous, [field]: value }));
    setMasterFormErrors((previous) => ({ ...previous, [field]: "" }));
  };

  const validateMasterForm = () => {
    const errors: Partial<
      Record<keyof MasterConfigurationForm, string>
    > = {};

    if (!masterForm.moduleName.trim()) {
      errors.moduleName = "Module name is required.";
    }

    if (!masterForm.description.trim()) {
      errors.description = "Description is required.";
    }

    setMasterFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMasterSubmit: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();
    if (!validateMasterForm()) return;

    const payload = {
      moduleName: masterForm.moduleName.trim(),
      description: masterForm.description.trim(),
      status: masterForm.status,
    };

    try {
      if (editingModuleCode) {
        await dispatch(
          updateMasterConfiguration({
            moduleCode: editingModuleCode,
            data: payload,
          })
        ).unwrap();

        toast.success("Custom master updated successfully.");
      } else {
        await dispatch(createMasterConfiguration(payload)).unwrap();
        toast.success("Custom master created successfully.");
      }

      closeMasterForm();
      fetchMasterConfigurations(offset);
    } catch {
      // Error is rendered inside modal.
    }
  };

  const handleDeleteMaster = async (item: MasterConfigurationItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${item.moduleName} (${item.moduleCode})?`
    );

    if (!confirmed) return;

    try {
      await dispatch(deleteMasterConfiguration(item.moduleCode)).unwrap();
      toast.success("Custom master deleted successfully.");

      if (selectedCustomSchemaMaster?.moduleCode === item.moduleCode) {
        setSelectedCustomSchemaMaster(null);
        dispatch(clearMasterSchemaState());
        setActiveTab("customMasters");
      }

      const remainingItems = masterConfigurations.length - 1;
      const nextOffset =
        remainingItems === 0 && offset > 0
          ? Math.max(0, offset - pageLimit)
          : offset;

      fetchMasterConfigurations(nextOffset);
    } catch {
      // Slice error is handled by the page-level effect.
    }
  };

  /* ===================================================
     ⭐ CUSTOM-MASTER LIST FILTER HELPERS
  =================================================== */

  const handleSearch: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setPageLimit(10);
  };

  const goToPreviousPage = () => {
    if (!pagination?.hasPrevPage && currentPage <= 1) return;
    fetchMasterConfigurations(Math.max(0, offset - pageLimit));
  };

  const goToNextPage = () => {
    if (!pagination?.hasNextPage && currentPage >= totalPages) return;
    fetchMasterConfigurations(offset + pageLimit);
  };

  const showingText = useMemo(() => {
    if (!totalDocs || !masterConfigurations.length) {
      return "Showing 0 records";
    }

    const from = offset + 1;
    const to = Math.min(offset + masterConfigurations.length, totalDocs);
    return `Showing ${from}-${to} of ${totalDocs}`;
  }, [masterConfigurations.length, offset, totalDocs]);

  /* ===================================================
     ⭐ OPEN CUSTOM-MASTER SCHEMA
  =================================================== */

  const openCustomMasterSchema = async (item: MasterConfigurationItem) => {
    setSelectedCustomSchemaMaster(item);
    setActiveTab("customMasterSchema");
    dispatch(clearMasterSchemaState());

    try {
      await dispatch(
        getMasterSchema({
          moduleCode: item.moduleCode,
        })
      ).unwrap();
    } catch {
      // Error is handled through customSchemaError.
    }
  };

  const reloadCustomMasterSchema = async () => {
    if (!selectedCustomSchemaMaster?.moduleCode) return;

    await dispatch(
      getMasterSchema({
        moduleCode: selectedCustomSchemaMaster.moduleCode,
      })
    ).unwrap();
  };

  /* ===================================================
     ⭐ CURRENT SCHEMA CONTEXT
  =================================================== */

  const schemaContext = useMemo<SchemaContext | null>(() => {
    if (activeTab === "customMasterSchema" && selectedCustomSchemaMaster) {
      return {
        kind: "custom",
        title: selectedCustomSchemaMaster.moduleName,
        moduleCode: selectedCustomSchemaMaster.moduleCode,
      };
    }

    if (selectedStandardMaster?.schemaEnabled) {
      return {
        kind: "standard",
        standardKey: selectedStandardMaster.key,
        title: selectedStandardMaster.name,
      };
    }

    return null;
  }, [activeTab, selectedCustomSchemaMaster, selectedStandardMaster]);

  const activeSchemaState = useMemo(() => {
    if (!schemaContext) {
      return {
        fields: [] as SchemaField[],
        loading: false,
        saveLoading: false,
        updateLoading: false,
      };
    }

    if (schemaContext.kind === "custom") {
      return {
        fields: customSchemaFields as SchemaField[],
        loading: !!customSchemaLoading,
        saveLoading: !!customSchemaSaveLoading,
        updateLoading: !!customSchemaUpdateLoading,
      };
    }

    if (schemaContext.standardKey === "accountMaster") {
      return {
        fields: accountSchemaFields as SchemaField[],
        loading: !!accountSchemaLoading,
        saveLoading: !!accountSchemaSaveLoading,
        updateLoading: !!accountSchemaUpdateLoading,
      };
    }

    if (schemaContext.standardKey === "productMaster") {
      return {
        fields: productSchemaFields as SchemaField[],
        loading: !!productSchemaLoading,
        saveLoading: !!productSchemaSaveLoading,
        updateLoading: !!productSchemaUpdateLoading,
      };
    }

    return {
      fields: unitSchemaFields as SchemaField[],
      loading: !!unitSchemaLoading,
      saveLoading: !!unitSchemaSaveLoading,
      updateLoading: !!unitSchemaUpdateLoading,
    };
  }, [
    schemaContext,
    customSchemaFields,
    customSchemaLoading,
    customSchemaSaveLoading,
    customSchemaUpdateLoading,
    accountSchemaFields,
    accountSchemaLoading,
    accountSchemaSaveLoading,
    accountSchemaUpdateLoading,
    productSchemaFields,
    productSchemaLoading,
    productSchemaSaveLoading,
    productSchemaUpdateLoading,
    unitSchemaFields,
    unitSchemaLoading,
    unitSchemaSaveLoading,
    unitSchemaUpdateLoading,
  ]);

  const isSchemaSubmitting =
    activeSchemaState.saveLoading || activeSchemaState.updateLoading;

  /* ===================================================
     ⭐ SCHEMA-FIELD FORM HELPERS
  =================================================== */

  const closeSchemaForm = () => {
    setShowSchemaForm(false);
    setEditingSchemaFieldKey(null);
    setSchemaForm(INITIAL_SCHEMA_FIELD_FORM);
    setSchemaFormErrors({});
  };

  const openAddSchemaForm = () => {
    if (!schemaContext) return;

    setEditingSchemaFieldKey(null);
    setSchemaForm(INITIAL_SCHEMA_FIELD_FORM);
    setSchemaFormErrors({});
    setShowSchemaForm(true);
  };

  const openEditSchemaForm = (field: SchemaField) => {
    setEditingSchemaFieldKey(field.key);
    setSchemaForm({
      key: field.key || "",
      label: field.label || "",
      type: field.type || "text",
      ref: field.ref || "",
      isRequired: !!field.isRequired,
      isSearchable: !!field.isSearchable,
      isFilterable: !!field.isFilterable,
      isHidden: !!field.isHidden,
      customMasterCode: field.customMasterCode || "",
      customMasterName: field.customMasterName || "",
    });
    setSchemaFormErrors({});
    setShowSchemaForm(true);
  };

  const updateSchemaFormField = (
    field: keyof SchemaFieldForm,
    value: string | boolean
  ) => {
    setSchemaForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "type" && value !== "custommaster"
        ? {
            customMasterCode: "",
            customMasterName: "",
          }
        : {}),
    }));

    setSchemaFormErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const handleCustomMasterReferenceChange = (moduleCode: string) => {
    const selected = masterConfigurations.find(
      (item: MasterConfigurationItem) => item.moduleCode === moduleCode
    );

    setSchemaForm((previous) => ({
      ...previous,
      customMasterCode: moduleCode,
      customMasterName: selected?.moduleName || "",
    }));

    setSchemaFormErrors((previous) => ({
      ...previous,
      customMasterCode: "",
    }));
  };

  const validateSchemaForm = () => {
    const errors: Partial<Record<keyof SchemaFieldForm, string>> = {};

    if (!schemaForm.key.trim()) {
      errors.key = "Field key is required.";
    }

    if (!schemaForm.label.trim()) {
      errors.label = "Field label is required.";
    }

    if (!schemaForm.type.trim()) {
      errors.type = "Field type is required.";
    }

    if (
      schemaForm.type === "custommaster" &&
      !schemaForm.customMasterCode.trim()
    ) {
      errors.customMasterCode = "Select a custom master.";
    }

    setSchemaFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildSchemaFieldPayload = () => {
    const payload: SchemaField = {
      key: schemaForm.key.trim(),
      label: schemaForm.label.trim(),
      type: schemaForm.type,
      isRequired: schemaForm.isRequired,
      isSearchable: schemaForm.isSearchable,
      isFilterable: schemaForm.isFilterable,
      isHidden: schemaForm.isHidden,
    };

    if (schemaForm.ref.trim()) {
      payload.ref = schemaForm.ref.trim();
    }

    if (schemaForm.type === "custommaster") {
      payload.customMasterCode = schemaForm.customMasterCode.trim();
      payload.customMasterName = schemaForm.customMasterName.trim();
    }

    return payload;
  };

  const reloadStandardSchema = async (standardKey: StandardMasterKey) => {
    if (standardKey === "accountMaster") {
      await dispatch(
        getAccountMasterSchema({
          offset: 0,
          limit: 20,
          isSearchable: "",
          isRequired: "",
          isFilterable: "",
        })
      ).unwrap();
      return;
    }

    if (standardKey === "productMaster") {
      await dispatch(
        getProductMasterSchema({
          offset: 0,
          limit: 20,
          isSearchable: "",
          isRequired: "",
        })
      ).unwrap();
      return;
    }

    if (standardKey === "unitMeasurement") {
      await dispatch(
        getUnitMeasurementSchema({
          offset: 0,
          limit: 20,
          isSearchable: "",
          isRequired: "",
          type: "",
          isFilterable: "",
        })
      ).unwrap();
    }
  };

  const handleSchemaSubmit: FormEventHandler<HTMLFormElement> = async (
    event
  ) => {
    event.preventDefault();

    if (!schemaContext || !validateSchemaForm()) return;

    const fieldPayload = buildSchemaFieldPayload();

    try {
      if (schemaContext.kind === "custom") {
        if (editingSchemaFieldKey) {
          const { key: _ignoredKey, ...updateData } = fieldPayload;

          await dispatch(
            updateMasterSchema({
              moduleCode: schemaContext.moduleCode,
              updates: [
                {
                  key: editingSchemaFieldKey,
                  updateData,
                },
              ],
            })
          ).unwrap();

          toast.success("Custom-master schema field updated successfully.");
        } else {
          await dispatch(
            saveMasterSchema({
              moduleCode: schemaContext.moduleCode,
              fields: [fieldPayload],
            })
          ).unwrap();

          toast.success("Custom-master schema field added successfully.");
        }

        closeSchemaForm();
        await reloadCustomMasterSchema();
        return;
      }

      if (schemaContext.standardKey === "accountMaster") {
        if (editingSchemaFieldKey) {
          const { key: _ignoredKey, ...updateData } = fieldPayload;

          await dispatch(
            updateAccountMasterSchema({
              updates: [
                {
                  key: editingSchemaFieldKey,
                  updateData,
                },
              ],
            })
          ).unwrap();

          toast.success("Account-master schema field updated successfully.");
        } else {
          await dispatch(
            saveAccountMasterSchema({
              fields: [fieldPayload],
            })
          ).unwrap();

          toast.success("Account-master schema field added successfully.");
        }
      }

      if (schemaContext.standardKey === "productMaster") {
        if (editingSchemaFieldKey) {
          const { key: _ignoredKey, ...updateData } = fieldPayload;

          await dispatch(
            updateProductMasterSchema({
              updates: [
                {
                  key: editingSchemaFieldKey,
                  updateData,
                },
              ],
            })
          ).unwrap();

          toast.success("Product-master schema field updated successfully.");
        } else {
          await dispatch(
            saveProductMasterSchema({
              fields: [fieldPayload],
            })
          ).unwrap();

          toast.success("Product-master schema field added successfully.");
        }
      }

      if (schemaContext.standardKey === "unitMeasurement") {
        if (editingSchemaFieldKey) {
          const { key: _ignoredKey, ...updateData } = fieldPayload;

          await dispatch(
            updateUnitMeasurementSchema({
              updates: [
                {
                  key: editingSchemaFieldKey,
                  updateData,
                },
              ],
            })
          ).unwrap();

          toast.success("Unit-master schema field updated successfully.");
        } else {
          await dispatch(
            saveUnitMeasurementSchema({
              fields: [fieldPayload],
            })
          ).unwrap();

          toast.success("Unit-master schema field added successfully.");
        }
      }

      closeSchemaForm();
      await reloadStandardSchema(schemaContext.standardKey);
    } catch {
      // Slice-specific errors are handled by effects.
    }
  };

  /* ===================================================
     ⭐ RENDER SCHEMA BUILDER
  =================================================== */

  const renderSchemaBuilder = (
    title: string,
    description: string,
    badgeText?: string
  ) => (
    <Panel
      title={title}
      description={description}
      right={
        <div className="flex flex-wrap items-center gap-2">
          {badgeText ? (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
              {badgeText}
            </span>
          ) : null}

          <button
            type="button"
            onClick={openAddSchemaForm}
            disabled={activeSchemaState.loading}
            className="inline-flex h-10 items-center gap-2 rounded bg-primary px-4 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={17} />
            Add Field
          </button>
        </div>
      }
    >
      {activeSchemaState.loading ? (
        <div className="flex min-h-[280px] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 size={20} className="animate-spin" />
          Loading schema...
        </div>
      ) : activeSchemaState.fields.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 px-5 text-center">
          <Settings2 size={36} className="text-muted-foreground" />
          <div>
            <h3 className="text-sm font-black text-card-foreground">
              No schema fields found
            </h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              Click Add Field to create the first field.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5 font-black">Key</th>
                <th className="px-5 py-3.5 font-black">Label</th>
                <th className="px-5 py-3.5 font-black">Type</th>
                <th className="px-5 py-3.5 font-black">Reference</th>
                <th className="px-5 py-3.5 font-black">Required</th>
                <th className="px-5 py-3.5 font-black">Searchable</th>
                <th className="px-5 py-3.5 font-black">Filterable</th>
                <th className="px-5 py-3.5 font-black">Hidden</th>
                <th className="px-5 py-3.5 text-right font-black">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {activeSchemaState.fields.map((field: SchemaField) => (
                <tr key={field.key} className="hover:bg-muted/30">
                  <td className="px-5 py-4 font-black text-card-foreground">
                    {field.key}
                  </td>
                  <td className="px-5 py-4 font-bold text-card-foreground">
                    {field.label || "—"}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {field.type || "—"}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {field.customMasterName ||
                      field.customMasterCode ||
                      field.ref ||
                      "—"}
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge value={!!field.isRequired} />
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge value={!!field.isSearchable} />
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge value={!!field.isFilterable} />
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge value={!!field.isHidden} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => openEditSchemaForm(field)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-primary transition hover:bg-primary/10"
                        title="Edit schema field"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );

  /* ===================================================
     ⭐ OVERVIEW
  =================================================== */

  const renderOverview = () => (
    <div className="space-y-4">
      <Panel
        title="Standard Masters"
        description="Configure fields for the standard masters supported by their dedicated schema APIs."
      >
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          {STANDARD_MASTERS.map((master) => (
            <button
              key={master.key}
              type="button"
              onClick={() => setActiveTab(master.key)}
              className="flex items-start gap-4 rounded border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                {master.icon}
              </span>

              <span className="min-w-0">
                <span className="block text-sm font-black text-card-foreground">
                  {master.name}
                </span>
                <span className="mt-1 block text-xs font-medium leading-5 text-muted-foreground">
                  {master.description}
                </span>
                <span className="mt-2 inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-black text-muted-foreground">
                  {master.schemaEnabled
                    ? "Schema configurable"
                    : "Schema API not configured"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Custom Masters"
        description="Create business-specific modules and configure a separate schema for every created custom master."
        right={
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
            {totalDocs} Created
          </span>
        }
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium leading-5 text-muted-foreground">
            Examples include Department, Vehicle, Route, Brand, Location and
            other organization-specific masters.
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("customMasters")}
              className="h-10 rounded border border-border bg-background px-4 text-sm font-black text-card-foreground transition hover:bg-muted"
            >
              View Custom Masters
            </button>

            <button
              type="button"
              onClick={openCreateMasterForm}
              className="inline-flex h-10 items-center gap-2 rounded bg-primary px-4 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus size={17} />
              Add Custom Master
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );

  /* ===================================================
     ⭐ STANDARD MASTER CONTENT
  =================================================== */

  const renderStandardMaster = (master: StandardMasterItem) => {
    if (!master.schemaEnabled) {
      return (
        <Panel
          title={master.name}
          description={master.description}
          right={
            <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-black text-warning">
              API Required
            </span>
          }
        >
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-5 text-center">
            <Users size={36} className="text-muted-foreground" />
            <div>
              <h3 className="text-sm font-black text-card-foreground">
                Team/Employee schema API is not configured
              </h3>
              <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-muted-foreground">
                The page is ready to support it after the Team/Employee schema
                GET, SAVE and UPDATE endpoints are added.
              </p>
            </div>
          </div>
        </Panel>
      );
    }

    return renderSchemaBuilder(
      `${master.name} Schema`,
      master.description,
      "Standard Master"
    );
  };

  /* ===================================================
     ⭐ CUSTOM MASTER LIST
  =================================================== */

  const renderCustomMasters = () => (
    <Panel
      title="Custom Masters"
      description="Create modules, edit module information, delete unused modules and configure fields for each module."
      right={
        <button
          type="button"
          onClick={openCreateMasterForm}
          className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus size={17} />
          Add Custom Master
        </button>
      }
    >
      <div className="border-b border-border p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search module name, code or description"
                className="h-10 w-full rounded border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              className="h-10 rounded bg-primary px-4 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
            >
              Search
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-10 rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={pageLimit}
              onChange={(event) => setPageLimit(Number(event.target.value))}
              className="h-10 rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>

            <button
              type="button"
              onClick={handleResetFilters}
              className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded border border-border bg-background px-4 text-sm font-black transition hover:bg-muted sm:col-span-1"
            >
              <RefreshCcw size={16} />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-5 py-3.5 font-black">Module Code</th>
              <th className="px-5 py-3.5 font-black">Module Name</th>
              <th className="px-5 py-3.5 font-black">Description</th>
              <th className="px-5 py-3.5 font-black">Status</th>
              <th className="px-5 py-3.5 text-right font-black">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {moduleLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-14 text-center">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 size={19} className="animate-spin" />
                    Loading custom masters...
                  </span>
                </td>
              </tr>
            ) : masterConfigurations.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-14 text-center text-muted-foreground"
                >
                  No custom masters found.
                </td>
              </tr>
            ) : (
              masterConfigurations.map((item: MasterConfigurationItem) => (
                <tr key={item.moduleCode} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-5 py-4 font-black text-card-foreground">
                    {item.moduleCode}
                  </td>
                  <td className="px-5 py-4 font-bold text-card-foreground">
                    {item.moduleName}
                  </td>
                  <td className="max-w-md px-5 py-4 text-muted-foreground">
                    <span className="line-clamp-2">
                      {item.description || "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                        item.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openCustomMasterSchema(item)}
                        className="inline-flex h-9 items-center gap-2 rounded border border-border px-3 text-primary transition hover:bg-primary/10"
                        title="Configure fields"
                      >
                        <Settings2 size={16} />
                        Fields
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditMasterForm(item.moduleCode)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-primary transition hover:bg-primary/10"
                        title="Edit custom master"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteMaster(item)}
                        disabled={deleteLoading}
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete custom master"
                      >
                        {deleteLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {showingText}
        </p>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={moduleLoading || currentPage <= 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={17} />
          </button>

          <button
            type="button"
            onClick={goToNextPage}
            disabled={moduleLoading || currentPage >= totalPages}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
    </Panel>
  );

  /* ===================================================
     ⭐ ACTIVE CONTENT
  =================================================== */

  const renderActiveContent = () => {
    if (activeTab === "overview") return renderOverview();

    if (activeTab === "customMasters") {
      return renderCustomMasters();
    }

    if (activeTab === "customMasterSchema" && selectedCustomSchemaMaster) {
      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("customMasters");
              setSelectedCustomSchemaMaster(null);
              dispatch(clearMasterSchemaState());
            }}
            className="inline-flex h-9 items-center gap-2 rounded border border-border bg-card px-3 text-sm font-black text-card-foreground transition hover:bg-muted"
          >
            <ArrowLeft size={16} />
            Back to Custom Masters
          </button>

          {renderSchemaBuilder(
            `${selectedCustomSchemaMaster.moduleName} Schema`,
            `Configure fields for ${selectedCustomSchemaMaster.moduleName}.`,
            selectedCustomSchemaMaster.moduleCode
          )}
        </div>
      );
    }

    if (selectedStandardMaster) {
      return renderStandardMaster(selectedStandardMaster);
    }

    return renderOverview();
  };

  /* ===================================================
     ⭐ PAGE
  =================================================== */

  return (
    <div className="min-h-screen bg-background p-4 md:p-5">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-3 rounded border border-border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex h-9 w-9 items-center justify-center rounded border border-border bg-background text-card-foreground transition hover:bg-muted"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-xl font-black text-card-foreground">
                Master Configuration
              </h1>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Configure standard-master fields and manage custom-master
                modules with their schemas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
              {STANDARD_MASTERS.length} Standard Masters
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
              {totalDocs} Custom Masters
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[270px_1fr]">
          <aside className="max-h-max rounded border border-border bg-card p-2 shadow-sm">
            <div className="mb-2 px-3 py-2">
              <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">
                Master Menu
              </p>
            </div>

            <div className="space-y-1">
              {tabs.map((tab) => {
                const isActive =
                  activeTab === tab.key ||
                  (tab.key === "customMasters" &&
                    activeTab === "customMasterSchema");

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.key);

                      if (tab.key !== "customMasters") {
                        setSelectedCustomSchemaMaster(null);
                        dispatch(clearMasterSchemaState());
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-bold transition ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-card-foreground"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded ${
                        isActive
                          ? "bg-white/15"
                          : "bg-background text-primary"
                      }`}
                    >
                      {tab.icon}
                    </span>

                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0 space-y-4">
            {renderActiveContent()}
          </main>
        </div>
      </div>

      {/* ===================================================
          ⭐ CUSTOM-MASTER CREATE / EDIT MODAL
      =================================================== */}

      {showMasterForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-card-foreground">
                  {editingModuleCode
                    ? "Edit Custom Master"
                    : "Add Custom Master"}
                </h2>
                {editingModuleCode ? (
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    Module Code: {editingModuleCode}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={closeMasterForm}
                disabled={isMasterSubmitting}
                className="rounded p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {editingModuleCode &&
            moduleLoading &&
            !selectedMasterConfiguration ? (
              <div className="flex items-center justify-center gap-2 px-5 py-16 text-muted-foreground">
                <Loader2 size={20} className="animate-spin" />
                Loading custom master...
              </div>
            ) : (
              <form
                onSubmit={handleMasterSubmit}
                className="space-y-5 p-5"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                    Module Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={masterForm.moduleName}
                    onChange={(event) =>
                      updateMasterFormField(
                        "moduleName",
                        event.target.value
                      )
                    }
                    placeholder="Example: Department Master"
                    maxLength={100}
                    className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${
                      masterFormErrors.moduleName
                        ? "border-danger"
                        : "border-input"
                    }`}
                  />
                  {masterFormErrors.moduleName ? (
                    <p className="mt-1 text-xs font-semibold text-danger">
                      {masterFormErrors.moduleName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                    Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    value={masterForm.description}
                    onChange={(event) =>
                      updateMasterFormField(
                        "description",
                        event.target.value
                      )
                    }
                    placeholder="Describe where this master will be used"
                    rows={4}
                    maxLength={500}
                    className={`w-full resize-none rounded border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${
                      masterFormErrors.description
                        ? "border-danger"
                        : "border-input"
                    }`}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-danger">
                      {masterFormErrors.description || ""}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {masterForm.description.length}/500
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                    Status
                  </label>
                  <select
                    value={masterForm.status}
                    onChange={(event) =>
                      updateMasterFormField(
                        "status",
                        event.target.value
                      )
                    }
                    className="h-10 w-full rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {moduleError ? (
                  <div className="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
                    {moduleError}
                  </div>
                ) : null}

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={closeMasterForm}
                    disabled={isMasterSubmitting}
                    className="h-10 rounded border border-border px-4 text-sm font-black transition hover:bg-muted disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isMasterSubmitting}
                    className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isMasterSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    {editingModuleCode ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* ===================================================
          ⭐ STANDARD / CUSTOM SCHEMA FIELD MODAL
      =================================================== */}

      {showSchemaForm && schemaContext ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-card-foreground">
                  {editingSchemaFieldKey
                    ? "Update Schema Field"
                    : "Add Schema Field"}
                </h2>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {schemaContext.title}
                  {schemaContext.kind === "custom"
                    ? ` · ${schemaContext.moduleCode}`
                    : " · Standard Master"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeSchemaForm}
                disabled={isSchemaSubmitting}
                className="rounded p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSchemaSubmit}
              className="space-y-5 p-5"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                    Field Key <span className="text-danger">*</span>
                  </label>
                  <input
                    value={schemaForm.key}
                    onChange={(event) =>
                      updateSchemaFormField("key", event.target.value)
                    }
                    disabled={!!editingSchemaFieldKey}
                    placeholder="Example: departmentCode"
                    className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                      schemaFormErrors.key
                        ? "border-danger"
                        : "border-input"
                    }`}
                  />
                  {schemaFormErrors.key ? (
                    <p className="mt-1 text-xs font-semibold text-danger">
                      {schemaFormErrors.key}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                    Field Label <span className="text-danger">*</span>
                  </label>
                  <input
                    value={schemaForm.label}
                    onChange={(event) =>
                      updateSchemaFormField(
                        "label",
                        event.target.value
                      )
                    }
                    placeholder="Example: Department"
                    className={`h-10 w-full rounded border bg-background px-3 text-sm outline-none ${
                      schemaFormErrors.label
                        ? "border-danger"
                        : "border-input"
                    }`}
                  />
                  {schemaFormErrors.label ? (
                    <p className="mt-1 text-xs font-semibold text-danger">
                      {schemaFormErrors.label}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                    Field Type <span className="text-danger">*</span>
                  </label>
                  <select
                    value={schemaForm.type}
                    onChange={(event) =>
                      updateSchemaFormField(
                        "type",
                        event.target.value
                      )
                    }
                    className="h-10 w-full rounded border border-input bg-background px-3 text-sm font-semibold outline-none"
                  >
                    {FIELD_TYPE_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                    Reference
                  </label>
                  <input
                    value={schemaForm.ref}
                    onChange={(event) =>
                      updateSchemaFormField("ref", event.target.value)
                    }
                    placeholder="Example: productmaster"
                    className="h-10 w-full rounded border border-input bg-background px-3 text-sm outline-none"
                  />
                </div>
              </div>

              {schemaForm.type === "custommaster" ? (
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
                    Custom Master <span className="text-danger">*</span>
                  </label>
                  <select
                    value={schemaForm.customMasterCode}
                    onChange={(event) =>
                      handleCustomMasterReferenceChange(
                        event.target.value
                      )
                    }
                    className={`h-10 w-full rounded border bg-background px-3 text-sm font-semibold outline-none ${
                      schemaFormErrors.customMasterCode
                        ? "border-danger"
                        : "border-input"
                    }`}
                  >
                    <option value="">Select Custom Master</option>
                    {masterConfigurations
                      .filter(
                        (item: MasterConfigurationItem) =>
                          item.status === "active"
                      )
                      .map((item: MasterConfigurationItem) => (
                        <option
                          key={item.moduleCode}
                          value={item.moduleCode}
                        >
                          {item.moduleName} ({item.moduleCode})
                        </option>
                      ))}
                  </select>
                  {schemaFormErrors.customMasterCode ? (
                    <p className="mt-1 text-xs font-semibold text-danger">
                      {schemaFormErrors.customMasterCode}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { key: "isRequired", label: "Required" },
                  { key: "isSearchable", label: "Searchable" },
                  { key: "isFilterable", label: "Filterable" },
                  { key: "isHidden", label: "Hidden" },
                ].map((option) => (
                  <label
                    key={option.key}
                    className="flex cursor-pointer items-center gap-2 rounded border border-border bg-background px-3 py-3 text-sm font-bold"
                  >
                    <input
                      type="checkbox"
                      checked={
                        !!schemaForm[
                          option.key as keyof SchemaFieldForm
                        ]
                      }
                      onChange={(event) =>
                        updateSchemaFormField(
                          option.key as keyof SchemaFieldForm,
                          event.target.checked
                        )
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={closeSchemaForm}
                  disabled={isSchemaSubmitting}
                  className="h-10 rounded border border-border px-4 text-sm font-black transition hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSchemaSubmitting}
                  className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-black text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSchemaSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {editingSchemaFieldKey
                    ? "Update Field"
                    : "Add Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MasterConfiguration;