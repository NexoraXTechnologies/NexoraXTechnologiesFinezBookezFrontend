import { useEffect, useMemo, useState, } from "react";
import type { FormEventHandler, ReactNode, } from "react";
import { useDispatch, useSelector, } from "react-redux";
import { ArrowLeft, Boxes, Edit, LayoutGrid, Package, Plus, Ruler, Save, Settings2, ShieldCheck, Users, X, } from "lucide-react";
import { toast } from "react-toastify";
import { clearMasterConfigurationState, clearSelectedMasterConfiguration, createMasterConfiguration, deleteMasterConfiguration, getAllMasterConfigurations, getMasterConfigurationByCode, updateMasterConfiguration, } from "../../../redux/slices/professionalSlice/masterConfigurationSlice/masterConfigurationSlice";
import { clearAccountMasterSchemaError, clearAccountMasterSchemaState, getAccountMasterSchema, saveAccountMasterSchema, updateAccountMasterSchema, } from "../../../redux/slices/professionalSlice/masterConfigurationSlice/accountmasterSchemaSlice";
import { clearProductMasterSchemaError, clearProductMasterSchemaState, getProductMasterSchema, saveProductMasterSchema, updateProductMasterSchema, } from "../../../redux/slices/professionalSlice/masterConfigurationSlice/productMasterSchemaSlice";
import { clearUnitMeasurementSchemaError, clearUnitMeasurementSchemaState, getUnitMeasurementSchema, saveUnitMeasurementSchema, updateUnitMeasurementSchema, } from "../../../redux/slices/professionalSlice/masterConfigurationSlice/unitMeasurementSchemaSlice";
import { clearMasterSchemaError, clearMasterSchemaState, getMasterSchema, saveMasterSchema, updateMasterSchema, } from "../../../redux/slices/professionalSlice/masterConfigurationSlice/masterSchemaSlice";
import { clearTeamEmployeeSchemaError, clearTeamEmployeeSchemaState, getTeamEmployeeSchema, saveTeamEmployeeSchema, updateTeamEmployeeSchema, } from "../../../redux/slices/systemConf/teamEmployeeSchemaSlice";
import { DataCreateButton, DataREfreshButton, } from "../../../components/buttons";
import SearchInput from "../../../components/searchInput";
import Badge from "../../../components/badge";
import DataTable from "../../../components/DataTable";
import Pagination from "../../../components/pagination";
import ConfirmTooltip from "../../../components/common/ConfirmTooltip";
import { BooleanBadge, Panel, StatusPill, } from "../components/Configui";
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
type StandardMasterKey = "accountMaster" | "productMaster" | "unitMeasurement" | "teamEmployeeMaster";
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
	ref?: string | null;
	isRequired?: boolean | string | number;
	isSearchable?: boolean | string | number;
	isFilterable?: boolean | string | number;
	isHidden?: boolean | string | number;
	isDefault?: boolean | string | number;
	customMasterCode?: string | null;
	customMasterName?: string | null;
	masterSource?: string | null;
	dependsOn?: string | null;
	valueField?: string | null;
	labelField?: string | null;
  options?: any[];
	dataSource?: {
		type?: string;
		api?: string;
		dependsOn?: string;
	  [key: string]: any;
  };
	[key: string]: any;
};
type SchemaFieldPayload = Omit<SchemaField, "isRequired" | "isSearchable" | "isFilterable" | "isHidden"> & {
	isRequired: boolean;
	isSearchable: boolean;
	isFilterable: boolean;
	isHidden: boolean;
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
type SchemaContext = {
	kind: "standard";
	standardKey: StandardMasterKey;
	title: string;
	moduleCode?: never;
} | {
	kind: "custom";
	standardKey?: never;
	title: string;
	moduleCode: string;
};
const INITIAL_MASTER_FORM: MasterConfigurationForm = {
  moduleName: "",
  description: "",
  status: "active",
};
const INITIAL_SCHEMA_FIELD_FORM: SchemaFieldForm = {
  key: "",
  label: "",
	type: "string",
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
		description: "Configure fields used for customer, supplier, bank, cash, income, expense and ledger accounts.",
    icon: <LayoutGrid size={18} />,
    schemaEnabled: true,
  },
  {
    key: "productMaster",
    name: "Product Master",
	  description: "Configure product, service and inventory-related master fields.",
    icon: <Package size={18} />,
    schemaEnabled: true,
  },
  {
    key: "unitMeasurement",
    name: "Unit Master",
	  description: "Configure units of measurement used across products, purchases, sales and inventory.",
    icon: <Ruler size={18} />,
    schemaEnabled: true,
  },
  {
    key: "teamEmployeeMaster",
    name: "Team / Employee Master",
	  description: "Configure dynamic fields for application users, employees and team members.",
    icon: <Users size={18} />,
	  schemaEnabled: true,
  },
];
const FIELD_TYPE_OPTIONS = [
	{
		value: "string",
		label: "Text",
	},
	{
		value: "number",
		label: "Number",
	},
	{
		value: "date",
		label: "Date",
	},
	{
		value: "boolean",
		label: "Boolean",
	},
	{
		value: "select",
		label: "Select",
	},
	{
		value: "textarea",
		label: "Textarea",
	},
	{
		value: "accountmaster",
		label: "Account Master",
	},
	{
		value: "productmaster",
		label: "Product Master",
	},
	{
		value: "unitmaster",
		label: "Unit Master",
	},
	{
		value: "employeemaster",
		label: "Team / Employee Master",
	},
	{
		value: "statemaster",
		label: "State Master",
	},
	{
		value: "citymaster",
		label: "City Master",
	},
	{
		value: "custommaster",
		label: "Custom Master",
	},
];
// const SELF_MASTER_FIELD_TYPE_MAP: Partial<Record<StandardMasterKey, string>> = {
// 	accountMaster: "accountmaster",
// 	productMaster: "productmaster",
// };
const MasterConfiguration = () => {
  const dispatch = useDispatch<any>();
	const { masterConfigurations = [], pagination = {}, selectedMasterConfiguration, loading: moduleLoading, createLoading, updateLoading, error: moduleError, } = useSelector((state: any) => state.masterConfiguration || {});
	const { fields: customSchemaFields = [], pagination: customSchemaPagination = {}, loading: customSchemaLoading, saveLoading: customSchemaSaveLoading, updateLoading: customSchemaUpdateLoading, error: customSchemaError, } = useSelector((state: any) => state.masterSchema || {});
	const { fields: accountSchemaFields = [], pagination: accountSchemaPagination = {}, loading: accountSchemaLoading, saveLoading: accountSchemaSaveLoading, updateLoading: accountSchemaUpdateLoading, error: accountSchemaError, } = useSelector((state: any) => state.accountMasterSchema || {});
	const { fields: productSchemaFields = [], pagination: productSchemaPagination = {}, loading: productSchemaLoading, saveLoading: productSchemaSaveLoading, updateLoading: productSchemaUpdateLoading, error: productSchemaError, } = useSelector((state: any) => state.productMasterSchema || {});
	const { fields: unitSchemaFields = [], pagination: unitSchemaPagination = {}, loading: unitSchemaLoading, saveLoading: unitSchemaSaveLoading, updateLoading: unitSchemaUpdateLoading, error: unitSchemaError, } = useSelector((state: any) => state.unitMeasurementSchema || {});
	const { fields: teamEmployeeSchemaFields = [], pagination: teamEmployeeSchemaPagination = {}, loading: teamEmployeeSchemaLoading, saveLoading: teamEmployeeSchemaSaveLoading, updateLoading: teamEmployeeSchemaUpdateLoading, error: teamEmployeeSchemaError, } = useSelector((state: any) => state.teamEmployeeSchema || {});
	const [activeTab, setActiveTab,] = useState<string>("overview");
	const [selectedCustomSchemaMaster, setSelectedCustomSchemaMaster,] = useState<MasterConfigurationItem | null>(null);
	const [search, setSearch,] = useState("");
	const [statusFilter, setStatusFilter,] = useState("");
	const [localOffset, setLocalOffset,] = useState(0);
	const [localLimit, setLocalLimit,] = useState(10);
	const [refreshing, setRefreshing,] = useState(false);
	const [schemaOffset, setSchemaOffset,] = useState(0);
	const [schemaLimit, setSchemaLimit,] = useState(10);
	const [schemaSearch, setSchemaSearch,] = useState("");
	const [schemaRefreshing, setSchemaRefreshing,] = useState(false);
	const [showMasterForm, setShowMasterForm,] = useState(false);
	const [editingModuleCode, setEditingModuleCode,] = useState<string | null>(null);
	const [masterForm, setMasterForm,] = useState<MasterConfigurationForm>(INITIAL_MASTER_FORM);
	const [masterFormErrors, setMasterFormErrors,] = useState<Partial<Record<keyof MasterConfigurationForm, string>>>({});
	const [showSchemaForm, setShowSchemaForm,] = useState(false);
	const [editingSchemaFieldKey, setEditingSchemaFieldKey,] = useState<string | null>(null);
	const [schemaForm, setSchemaForm,] = useState<SchemaFieldForm>(INITIAL_SCHEMA_FIELD_FORM);
	const [schemaFormErrors, setSchemaFormErrors,] = useState<Partial<Record<keyof SchemaFieldForm, string>>>({});
	const [confirmTooltip, setConfirmTooltip,] = useState<any>({
    show: false,
    x: null,
    y: null,
    item: null,
    moduleCode: null,
  });
  const currentPage = Number(pagination?.currentPage || 1);
  const totalPages = Math.max(1, Number(pagination?.totalPages || 1));
  const totalDocs = Number(pagination?.totalDocs || 0);
	const isMasterSubmitting = createLoading ||
		updateLoading;
	const tabs = useMemo(() => [
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
  ], []);
	const selectedStandardMaster = useMemo(() => STANDARD_MASTERS.find((master) => master.key === activeTab) || null, [activeTab]);
	const fetchMasterConfigurations = (nextOffset = localOffset, { showLoader = true, }: {
		showLoader?: boolean;
	} = {}) => {
		if (!showLoader) {
			setRefreshing(true);
		}
		dispatch(getAllMasterConfigurations({
			offset: nextOffset,
			limit: localLimit,
			search,
			status: statusFilter,
	})).finally(() => {
		if (!showLoader) {
			setRefreshing(false);
		}
    });
  };
  useEffect(() => {
    fetchMasterConfigurations(localOffset);
  }, [
	  search,
	  statusFilter,
	  localLimit,
	  localOffset,
  ]);
  const handleRefreshMasters = () => {
	  fetchMasterConfigurations(localOffset, {
		  showLoader: false,
	  });
  };
  useEffect(() => {
	  if (!selectedStandardMaster
		  ?.schemaEnabled) {
		  return;
	  }
	  if (selectedStandardMaster.key ===
		  "accountMaster") {
      dispatch(clearAccountMasterSchemaState());
		dispatch(getAccountMasterSchema({
			offset: schemaOffset,
			limit: schemaLimit,
			isSearchable: "",
			isRequired: "",
			isFilterable: "",
	  }));
      return;
    }
	  if (selectedStandardMaster.key ===
		  "productMaster") {
      dispatch(clearProductMasterSchemaState());
		dispatch(getProductMasterSchema({
			offset: schemaOffset,
			limit: schemaLimit,
			isSearchable: "",
			isRequired: "",
	  }));
      return;
    }
	  if (selectedStandardMaster.key ===
		  "unitMeasurement") {
      dispatch(clearUnitMeasurementSchemaState());
		dispatch(getUnitMeasurementSchema({
			offset: schemaOffset,
			limit: schemaLimit,
			isSearchable: "",
			isRequired: "",
			type: "",
			isFilterable: "",
	  }));
		return;
    }
	  if (selectedStandardMaster.key ===
		  "teamEmployeeMaster") {
		  dispatch(clearTeamEmployeeSchemaState());
		  dispatch(getTeamEmployeeSchema({
			  offset: schemaOffset,
			  limit: schemaLimit,
			  isSearchable: "",
			  isRequired: "",
			  type: "",
			  isFilterable: "",
		  }));
	  }
  }, [
	  dispatch,
	  selectedStandardMaster?.key,
	  selectedStandardMaster
		  ?.schemaEnabled,
	  schemaOffset,
	  schemaLimit,
  ]);
  useEffect(() => {
	  if (!moduleError ||
		  showMasterForm) {
		  return;
	  }
    toast.error(moduleError);
    dispatch(clearMasterConfigurationState());
  }, [
	  moduleError,
	  showMasterForm,
	  dispatch,
  ]);
  useEffect(() => {
	  if (!customSchemaError) {
		  return;
	  }
    toast.error(customSchemaError);
    dispatch(clearMasterSchemaError());
  }, [
	  customSchemaError,
	  dispatch,
  ]);
  useEffect(() => {
	  if (!accountSchemaError) {
		  return;
	  }
    toast.error(accountSchemaError);
    dispatch(clearAccountMasterSchemaError());
  }, [
	  accountSchemaError,
	  dispatch,
  ]);
  useEffect(() => {
	  if (!productSchemaError) {
		  return;
	  }
    toast.error(productSchemaError);
    dispatch(clearProductMasterSchemaError());
  }, [
	  productSchemaError,
	  dispatch,
  ]);
  useEffect(() => {
	  if (!unitSchemaError) {
		  return;
	  }
    toast.error(unitSchemaError);
    dispatch(clearUnitMeasurementSchemaError());
  }, [
	  unitSchemaError,
	  dispatch,
  ]);
  useEffect(() => {
	  if (!teamEmployeeSchemaError) {
		  return;
	  }
	  toast.error(teamEmployeeSchemaError);
	  dispatch(clearTeamEmployeeSchemaError());
  }, [
	  teamEmployeeSchemaError,
	  dispatch,
  ]);
	useEffect(() => {
		if (!editingModuleCode ||
			!selectedMasterConfiguration) {
			return;
		}
		if (selectedMasterConfiguration
			.moduleCode !==
			editingModuleCode) {
			return;
		}
    setMasterForm({
		moduleName: selectedMasterConfiguration
			.moduleName || "",
		description: selectedMasterConfiguration
			.description || "",
		status: selectedMasterConfiguration
			.status === "inactive"
			? "inactive"
			: "active",
    });
  }, [
	  editingModuleCode,
	  selectedMasterConfiguration,
  ]);
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
	}
	catch {
    }
  };
	const updateMasterFormField = (field: keyof MasterConfigurationForm, value: string) => {
		setMasterForm((previous) => ({
			...previous,
			[field]: value,
		}));
		setMasterFormErrors((previous) => ({
			...previous,
			[field]: "",
		}));
  };
  const validateMasterForm = () => {
	  const errors: Partial<Record<keyof MasterConfigurationForm, string>> = {};
    if (!masterForm.moduleName.trim()) {
		errors.moduleName =
			"Module name is required.";
	}
    if (!masterForm.description.trim()) {
		errors.description =
			"Description is required.";
	}
    setMasterFormErrors(errors);
	  return (Object.keys(errors).length ===
		  0);
  };
	const handleMasterSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
	  if (!validateMasterForm()) {
		  return;
	  }
    const payload = {
      moduleName: masterForm.moduleName.trim(),
      description: masterForm.description.trim(),
      status: masterForm.status,
	};
    try {
      if (editingModuleCode) {
		  await dispatch(updateMasterConfiguration({
			  moduleCode: editingModuleCode,
			  data: payload,
		})).unwrap();
        toast.success("Custom master updated successfully.");
	  }
	  else {
        await dispatch(createMasterConfiguration(payload)).unwrap();
        toast.success("Custom master created successfully.");
	  }
      closeMasterForm();
		fetchMasterConfigurations(localOffset, {
			showLoader: false,
		});
	}
	catch {
    }
  };
  const handleDeleteConfirm = async () => {
	  const item: MasterConfigurationItem | null = confirmTooltip?.item;
    if (!item?.moduleCode) {
      toast.warn("Module code not found");
      return;
	}
    try {
      await dispatch(deleteMasterConfiguration(item.moduleCode)).unwrap();
      toast.success("Custom master deleted successfully.");
		if (selectedCustomSchemaMaster
			?.moduleCode ===
			item.moduleCode) {
        setSelectedCustomSchemaMaster(null);
        dispatch(clearMasterSchemaState());
        setActiveTab("customMasters");
	  }
      setConfirmTooltip({
        show: false,
        x: null,
        y: null,
        item: null,
        moduleCode: null,
      });
		const remainingItems = masterConfigurations.length -
			1;
		const nextOffset = remainingItems === 0 &&
			localOffset > 0
			? Math.max(0, localOffset -
				localLimit)
			: localOffset;
		if (nextOffset !==
			localOffset) {
		  setLocalOffset(nextOffset);
      }
		else {
			fetchMasterConfigurations(nextOffset, {
				showLoader: false,
			});
		}
	}
	catch {
    }
  };
  const openCustomMasterSchema = async (item: MasterConfigurationItem) => {
    setSelectedCustomSchemaMaster(item);
    setActiveTab("customMasterSchema");
    setSchemaSearch("");
    setSchemaOffset(0);
	  dispatch(clearMasterSchemaState());
    try {
		await dispatch(getMasterSchema({
			moduleCode: item.moduleCode,
			offset: 0,
			limit: schemaLimit,
	  })).unwrap();
	}
	catch {
    }
  };
  const reloadCustomMasterSchema = async () => {
	  if (!selectedCustomSchemaMaster
		  ?.moduleCode) {
		  return;
	  }
	  await dispatch(getMasterSchema({
		  moduleCode: selectedCustomSchemaMaster
			  .moduleCode,
		  offset: schemaOffset,
		  limit: schemaLimit,
	})).unwrap();
  };
  const schemaContext = useMemo<SchemaContext | null>(() => {
	  if (activeTab ===
		  "customMasterSchema" &&
		  selectedCustomSchemaMaster) {
      return {
        kind: "custom",
		  title: selectedCustomSchemaMaster
			  .moduleName,
		  moduleCode: selectedCustomSchemaMaster
			  .moduleCode,
      };
    }
	  if (selectedStandardMaster
		  ?.schemaEnabled) {
      return {
        kind: "standard",
        standardKey: selectedStandardMaster.key,
        title: selectedStandardMaster.name,
      };
	}
    return null;
  }, [
	  activeTab,
	  selectedCustomSchemaMaster,
	  selectedStandardMaster,
  ]);
	const availableFieldTypeOptions = useMemo(() => {
		if (!schemaContext) {
			return FIELD_TYPE_OPTIONS;
		}
		if (schemaContext.kind ===
			"custom") {
			return FIELD_TYPE_OPTIONS;
		}
		const blockedTypes = new Set<string>();
		if (schemaContext.standardKey ===
			"accountMaster") {
			blockedTypes.add("accountmaster");
		}
		if (schemaContext.standardKey ===
			"productMaster") {
			blockedTypes.add("productmaster");
		}
		if (schemaContext.standardKey ===
			"unitMeasurement") {
			blockedTypes.add("unitmaster");
		}
		if (schemaContext.standardKey ===
			"teamEmployeeMaster") {
			blockedTypes.add("employeemaster");
		}
		if (schemaContext.standardKey ===
			"accountMaster" ||
			schemaContext.standardKey ===
			"productMaster" ||
			schemaContext.standardKey ===
			"unitMeasurement") {
			blockedTypes.add("statemaster");
			blockedTypes.add("citymaster");
		}
		return FIELD_TYPE_OPTIONS.filter((option) => {
			const isExistingEditType = Boolean(editingSchemaFieldKey) &&
				schemaForm.type ===
				option.value;
			if (isExistingEditType) {
				return true;
			}
			return !blockedTypes.has(option.value);
		});
	}, [
		schemaContext,
		editingSchemaFieldKey,
		schemaForm.type,
	]);
  const activeSchemaState = useMemo(() => {
    if (!schemaContext) {
      return {
        fields: [] as SchemaField[],
        pagination: {} as any,
        loading: false,
        saveLoading: false,
        updateLoading: false,
      };
    }
	  if (schemaContext.kind ===
		  "custom") {
      return {
        fields: customSchemaFields as SchemaField[],
        pagination: customSchemaPagination,
        loading: !!customSchemaLoading,
        saveLoading: !!customSchemaSaveLoading,
        updateLoading: !!customSchemaUpdateLoading,
      };
    }
	  if (schemaContext.standardKey ===
		  "accountMaster") {
      return {
        fields: accountSchemaFields as SchemaField[],
        pagination: accountSchemaPagination,
        loading: !!accountSchemaLoading,
        saveLoading: !!accountSchemaSaveLoading,
        updateLoading: !!accountSchemaUpdateLoading,
      };
    }
	  if (schemaContext.standardKey ===
		  "productMaster") {
      return {
        fields: productSchemaFields as SchemaField[],
        pagination: productSchemaPagination,
        loading: !!productSchemaLoading,
        saveLoading: !!productSchemaSaveLoading,
        updateLoading: !!productSchemaUpdateLoading,
      };
    }
	  if (schemaContext.standardKey ===
		  "teamEmployeeMaster") {
		  return {
			  fields: teamEmployeeSchemaFields as SchemaField[],
			  pagination: teamEmployeeSchemaPagination,
			  loading: !!teamEmployeeSchemaLoading,
			  saveLoading: !!teamEmployeeSchemaSaveLoading,
			  updateLoading: !!teamEmployeeSchemaUpdateLoading,
		  };
	  }
    return {
      fields: unitSchemaFields as SchemaField[],
      pagination: unitSchemaPagination,
      loading: !!unitSchemaLoading,
      saveLoading: !!unitSchemaSaveLoading,
      updateLoading: !!unitSchemaUpdateLoading,
    };
  }, [
    schemaContext,
	  customSchemaFields,
	  customSchemaPagination,
	  customSchemaLoading,
	  customSchemaSaveLoading,
	  customSchemaUpdateLoading,
	  accountSchemaFields,
	  accountSchemaPagination,
	  accountSchemaLoading,
	  accountSchemaSaveLoading,
	  accountSchemaUpdateLoading,
	  productSchemaFields,
	  productSchemaPagination,
	  productSchemaLoading,
	  productSchemaSaveLoading,
	  productSchemaUpdateLoading,
	  unitSchemaFields,
	  unitSchemaPagination,
	  unitSchemaLoading,
	  unitSchemaSaveLoading,
	  unitSchemaUpdateLoading,
	  teamEmployeeSchemaFields,
	  teamEmployeeSchemaPagination,
	  teamEmployeeSchemaLoading,
	  teamEmployeeSchemaSaveLoading,
	  teamEmployeeSchemaUpdateLoading,
  ]);
	const isSchemaSubmitting = activeSchemaState.saveLoading ||
		activeSchemaState.updateLoading;
  const filteredSchemaFields = useMemo(() => {
	  if (!schemaSearch.trim()) {
		  return (activeSchemaState.fields);
	  }
	  const query = schemaSearch.toLowerCase();
	  return activeSchemaState.fields.filter((field) => String(field.key || "")
		  .toLowerCase()
		  .includes(query) ||
		  String(field.label || "")
			  .toLowerCase()
			  .includes(query) ||
		  String(field.type || "")
			  .toLowerCase()
			  .includes(query) ||
		  String(field.customMasterName ||
			  "")
			  .toLowerCase()
			  .includes(query) ||
		  String(field.customMasterCode ||
			  "")
			  .toLowerCase()
			  .includes(query) ||
		  String(field.ref || "")
			  .toLowerCase()
			  .includes(query));
  }, [
	  activeSchemaState.fields,
	  schemaSearch,
  ]);
  useEffect(() => {
    setSchemaOffset(0);
  }, [
	  schemaContext?.kind,
	  schemaContext?.standardKey,
	  schemaContext?.moduleCode,
  ]);
  const handleRefreshSchema = async () => {
	  setSchemaRefreshing(true);
    try {
		if (schemaContext?.kind ===
			"custom") {
        await reloadCustomMasterSchema();
	  }
	  else if (schemaContext?.kind ===
		  "standard") {
        await reloadStandardSchema(schemaContext.standardKey);
      }
	}
	catch {
	}
	finally {
      setSchemaRefreshing(false);
    }
  };
  const closeSchemaForm = () => {
    setShowSchemaForm(false);
    setEditingSchemaFieldKey(null);
    setSchemaForm(INITIAL_SCHEMA_FIELD_FORM);
    setSchemaFormErrors({});
  };
  const openAddSchemaForm = () => {
	  if (!schemaContext) {
		  return;
	  }
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
		type: field.type === "text"
			? "string"
			: field.type || "string",
		ref: String(field.ref || ""),
		isRequired: field.isRequired === true ||
			field.isRequired === "true" ||
			field.isRequired === 1 ||
			field.isRequired === "1",
		isSearchable: field.isSearchable === true ||
			field.isSearchable === "true" ||
			field.isSearchable === 1 ||
			field.isSearchable === "1",
		isFilterable: field.isFilterable === true ||
			field.isFilterable === "true" ||
			field.isFilterable === 1 ||
			field.isFilterable === "1",
		isHidden: field.isHidden === true ||
			field.isHidden === "true" ||
			field.isHidden === 1 ||
			field.isHidden === "1",
		customMasterCode: String(field.customMasterCode ||
			""),
		customMasterName: String(field.customMasterName ||
			""),
    });
    setSchemaFormErrors({});
    setShowSchemaForm(true);
  };
	const updateSchemaFormField = (field: keyof SchemaFieldForm, value: string | boolean) => {
    setSchemaForm((previous) => ({
      ...previous,
      [field]: value,
		...(field === "type" &&
			value !== "custommaster"
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
	const handleSchemaLabelChange = (value: string) => {
		setSchemaForm((previous) => ({
			...previous,
			label: value,
			key: editingSchemaFieldKey
				? previous.key
				: value.replace(/\s+/g, ""),
		}));
		setSchemaFormErrors((previous) => ({
			...previous,
			key: "",
			label: "",
		}));
	};
  const handleCustomMasterReferenceChange = (moduleCode: string) => {
	  const selected = masterConfigurations.find((item: MasterConfigurationItem) => item.moduleCode ===
		  moduleCode);
    setSchemaForm((previous) => ({
      ...previous,
      customMasterCode: moduleCode,
		customMasterName: selected?.moduleName ||
			"",
	}));
    setSchemaFormErrors((previous) => ({
      ...previous,
      customMasterCode: "",
    }));
  };
  const validateSchemaForm = () => {
	  const errors: Partial<Record<keyof SchemaFieldForm, string>> = {};
    if (!schemaForm.key.trim()) {
		errors.key =
			"Field key is required.";
	}
    if (!schemaForm.label.trim()) {
		errors.label =
			"Field label is required.";
	}
    if (!schemaForm.type.trim()) {
		errors.type =
			"Field type is required.";
    }
	  if (schemaForm.type ===
		  "custommaster" &&
		  !schemaForm.customMasterCode.trim()) {
		  errors.customMasterCode =
			  "Select a custom master.";
	}
    setSchemaFormErrors(errors);
	  return (Object.keys(errors).length ===
		  0);
  };
	const buildSchemaFieldPayload = (): SchemaFieldPayload => {
	  const normalizedType = String(schemaForm.type || "")
		  .trim()
		  .toLowerCase();
	const payload: SchemaFieldPayload = {
      key: schemaForm.key.trim(),
      label: schemaForm.label.trim(),
		type: normalizedType,
      isRequired: schemaForm.isRequired,
      isSearchable: schemaForm.isSearchable,
      isFilterable: schemaForm.isFilterable,
      isHidden: schemaForm.isHidden,
    };
	  if ([
		  "accountmaster",
		  "productmaster",
		  "unitmaster",
		  "employeemaster",
	  ].includes(normalizedType)) {
		  payload.ref =
			  normalizedType;
    }
	else if (schemaForm.ref.trim()) {
		payload.ref =
			schemaForm.ref.trim();
    }
	  if (normalizedType ===
		  "statemaster") {
		  payload.masterSource =
			  "stateMaster";
	  }
	  if (normalizedType ===
		  "citymaster") {
		  payload.masterSource =
			  "cityMaster";
		  payload.dependsOn =
			  "state";
	  }
	  if (normalizedType ===
		  "custommaster") {
		  payload.customMasterCode =
			  schemaForm.customMasterCode.trim();
		  payload.customMasterName =
			  schemaForm.customMasterName.trim();
	  }
    return payload;
  };
  const reloadStandardSchema = async (standardKey: StandardMasterKey) => {
	  if (standardKey ===
		  "accountMaster") {
		  await dispatch(getAccountMasterSchema({
			  offset: schemaOffset,
			  limit: schemaLimit,
			  isSearchable: "",
			  isRequired: "",
			  isFilterable: "",
		  })).unwrap();
      return;
    }
	  if (standardKey ===
		  "productMaster") {
		  await dispatch(getProductMasterSchema({
			  offset: schemaOffset,
			  limit: schemaLimit,
			  isSearchable: "",
			  isRequired: "",
		  })).unwrap();
      return;
    }
	  if (standardKey ===
		  "unitMeasurement") {
		  await dispatch(getUnitMeasurementSchema({
			  offset: schemaOffset,
			  limit: schemaLimit,
			  isSearchable: "",
			  isRequired: "",
			  type: "",
			  isFilterable: "",
		  })).unwrap();
		  return;
	  }
	  if (standardKey ===
		  "teamEmployeeMaster") {
		  await dispatch(getTeamEmployeeSchema({
			  offset: schemaOffset,
			  limit: schemaLimit,
			  isSearchable: "",
			  isRequired: "",
			  type: "",
			  isFilterable: "",
		  })).unwrap();
    }
  };
	const handleSchemaSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
	  if (!schemaContext ||
		  !validateSchemaForm()) {
		  return;
	  }
	  const fieldPayload:any = buildSchemaFieldPayload();
    try {
		if (schemaContext.kind ===
			"custom") {
        if (editingSchemaFieldKey) {
          const { key: _ignoredKey, ...updateData } = fieldPayload;
			await dispatch(updateMasterSchema({
				moduleCode: schemaContext.moduleCode,
				updates: [
					{
						key: editingSchemaFieldKey,
						updateData,
					},
				],
		  })).unwrap();
          toast.success("Custom-master schema field updated successfully.");
		}
		else {
			await dispatch(saveMasterSchema({
				moduleCode: schemaContext.moduleCode,
			  fields: [
				  fieldPayload,
			  ],
		  })).unwrap();
          toast.success("Custom-master schema field added successfully.");
		}
        closeSchemaForm();
        await reloadCustomMasterSchema();
        return;
      }
		if (schemaContext.standardKey ===
			"accountMaster") {
        if (editingSchemaFieldKey) {
          const { key: _ignoredKey, ...updateData } = fieldPayload;
			await dispatch(updateAccountMasterSchema({
				updates: [
					{
						key: editingSchemaFieldKey,
						updateData,
					},
				],
		  })).unwrap();
          toast.success("Account-master schema field updated successfully.");
		}
		else {
			await dispatch(saveAccountMasterSchema({
				fields: [
					fieldPayload,
				],
			})).unwrap();
          toast.success("Account-master schema field added successfully.");
        }
      }
		if (schemaContext.standardKey ===
			"productMaster") {
        if (editingSchemaFieldKey) {
          const { key: _ignoredKey, ...updateData } = fieldPayload;
			await dispatch(updateProductMasterSchema({
				updates: [
					{
						key: editingSchemaFieldKey,
						updateData,
					},
				],
		  })).unwrap();
          toast.success("Product-master schema field updated successfully.");
		}
		else {
			await dispatch(saveProductMasterSchema({
				fields: [
					fieldPayload,
				],
			})).unwrap();
          toast.success("Product-master schema field added successfully.");
        }
      }
		if (schemaContext.standardKey ===
			"unitMeasurement") {
        if (editingSchemaFieldKey) {
          const { key: _ignoredKey, ...updateData } = fieldPayload;
			await dispatch(updateUnitMeasurementSchema({
				updates: [
					{
						key: editingSchemaFieldKey,
						updateData,
					},
				],
		  })).unwrap();
          toast.success("Unit-master schema field updated successfully.");
		}
		else {
			await dispatch(saveUnitMeasurementSchema({
				fields: [
					fieldPayload,
				],
			})).unwrap();
          toast.success("Unit-master schema field added successfully.");
        }
      }
		if (schemaContext.standardKey ===
			"teamEmployeeMaster") {
			if (editingSchemaFieldKey) {
				const { key: _ignoredKey, ...updateData } = fieldPayload;
				await dispatch(updateTeamEmployeeSchema({
					updates: [
						{
							key: editingSchemaFieldKey,
							updateData,
						},
					],
				})).unwrap();
				toast.success("Team/Employee schema field updated successfully.");
			}
			else {
				await dispatch(saveTeamEmployeeSchema({
					fields: [
						fieldPayload,
					],
				})).unwrap();
				toast.success("Team/Employee schema field added successfully.");
			}
		}
      closeSchemaForm();
      await reloadStandardSchema(schemaContext.standardKey);
	}
	catch {
    }
  };
  const schemaColumns = [
    {
      key: "key",
      title: "Key",
		  render: (field: SchemaField) => (<span>
			  {field.key}
		  </span>),
    },
    {
      key: "label",
      title: "Label",
		render: (field: SchemaField) => field.label ||
			"—",
    },
    {
      key: "type",
      title: "Type",
		render: (field: SchemaField) => field.type ||
			"—",
    },
    {
      key: "isRequired",
      title: "Required",
		render: (field: SchemaField) => (<BooleanBadge value={field.isRequired === true ||
			field.isRequired === "true" ||
			field.isRequired === 1 ||
			field.isRequired === "1"} />),
    },
    {
      key: "isSearchable",
      title: "Searchable",
		render: (field: SchemaField) => (<BooleanBadge value={field.isSearchable === true ||
			field.isSearchable === "true" ||
			field.isSearchable === 1 ||
			field.isSearchable === "1"} />),
    },
    {
      key: "isFilterable",
      title: "Filterable",
		render: (field: SchemaField) => (<BooleanBadge value={field.isFilterable === true ||
			field.isFilterable === "true" ||
			field.isFilterable === 1 ||
			field.isFilterable === "1"} />),
    },
    {
      key: "isHidden",
      title: "Hidden",
		render: (field: SchemaField) => (<BooleanBadge value={field.isHidden === true ||
			field.isHidden === "true" ||
			field.isHidden === 1 ||
			field.isHidden === "1"} />),
    },
  ];
	const schemaCurrentPage = Number(activeSchemaState
		.pagination?.currentPage ||
		1);
	const schemaTotalPages = Math.max(1, Number(activeSchemaState
		.pagination?.totalPages ||
		1));
	const schemaTotalDocs = Number(activeSchemaState
		.pagination?.totalDocs ||
		0);
		// @ts-ignore
	const renderSchemaBuilder = (title: string, description: string, badgeText?: string) => (<>
		<Panel title={title} description={description} right={<div className="flex flex-wrap items-center gap-2">


		  <SearchInput search={schemaSearch} setSearch={setSchemaSearch} />

		  <DataREfreshButton callBackFn={handleRefreshSchema} loading={schemaRefreshing} />

		  <DataCreateButton callBackFn={openAddSchemaForm} text=" Add Field" />
	  </div>}>


		  <div className="min-h-0 flex-1 overflow-hidden">
			  <DataTable columns={schemaColumns} data={filteredSchemaFields} loading={activeSchemaState
				  .loading} emptyMessage="No schema fields found. Click Add Field to create the first field." actions={(field: SchemaField) => (<div className="flex justify-start">
					  <button type="button" onClick={() => openEditSchemaForm(field)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-primary transition hover:bg-primary/10" title="Edit schema field">
						  <Edit size={16} />
					  </button>
				  </div>)} />
		  </div>
	  </Panel>

	  {schemaTotalDocs > 0 ? (<Pagination localLimit={schemaLimit} selectCb={(event: any) => {
		  setSchemaLimit(Number(event.target.value));
		  setSchemaOffset(0);
		}} preDisabled={!activeSchemaState
			.pagination
			?.hasPrevPage &&
			schemaCurrentPage <= 1} nextDisabled={!activeSchemaState
				.pagination
				?.hasNextPage &&
				schemaCurrentPage >=
				schemaTotalPages} setLocalOffset={setSchemaOffset} pagination={activeSchemaState
					.pagination} />) : null}
	</>);
	const renderOverview = () => (<div className="space-y-4">
		<Panel title="Standard Masters" description="Configure fields for the standard masters supported by their dedicated schema APIs.">
			<div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
			  {STANDARD_MASTERS.map((master) => (<button key={master.key} type="button" onClick={() => setActiveTab(master.key)} className="flex items-start gap-4 rounded border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-primary/5">
				  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
					  {master.icon}
				  </span>

			<span className="min-w-0">
				<span className="block text-sm font-semibold text-card-foreground">
					{master.name}
				</span>

				<span className="mt-1 block text-xs font-medium leading-5 text-muted-foreground">
					{master.description}
				</span>

				<span className="mt-2 inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
					{master.schemaEnabled
						? "Schema configurable"
						: "Schema API not configured"}
				</span>
			</span>
		</button>))}
		  </div>
	  </Panel>

	  <Panel title="Custom Masters" description="Create business-specific modules and configure a separate schema for every created custom master." right={<span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
		  {totalDocs} Created
	  </span>}>
		  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
			  <p className="text-xs font-medium leading-5 text-muted-foreground">
				  Examples include
				  Department, Vehicle,
				  Route, Brand, Location
				  and other
				  organization-specific
				  masters.
			  </p>

			  <div className="flex flex-wrap gap-2">
				  <button type="button" onClick={() => setActiveTab("customMasters")} className="h-10 rounded border border-border bg-background px-4 text-sm font-semibold text-card-foreground transition hover:bg-muted">
					  View Custom Masters
				  </button>

				  <button type="button" onClick={openCreateMasterForm} className="inline-flex h-10 items-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
					  <Plus size={17} />
					  Add Custom Master
				  </button>
			  </div>
		  </div>
	  </Panel>
  </div>);
  const renderStandardMaster = (master: StandardMasterItem) => {
    if (!master.schemaEnabled) {
		return (<Panel title={master.name} description={master.description} right={<span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
			API Required
	  </span>}>
		  <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-5 text-center">
			  <Users size={36} className="text-muted-foreground" />

			  <div>
				  <h3 className="text-sm font-semibold text-card-foreground">
					  Schema API is not configured
				  </h3>

				  <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-muted-foreground">
					  The page is ready
					  after the schema GET,
					  SAVE and UPDATE APIs
					  are configured.
				  </p>
			  </div>
		  </div>
	  </Panel>);
    }
	  return renderSchemaBuilder(`${master.name} Schema`, master.description, "Standard Master");
  };
  const masterColumns = [
    {
      key: "moduleCode",
      title: "Module Code",
		  render: (row: MasterConfigurationItem) => (<span className="font-bold text-card-foreground">
			  {row.moduleCode}
		  </span>),
    },
    {
      key: "moduleName",
      title: "Module Name",
		render: (row: MasterConfigurationItem) => (<span>
			{row.moduleName}
		</span>),
    },
    {
      key: "description",
      title: "Description",
		render: (row: MasterConfigurationItem) => (<span>
			{row.description ||
				"—"}
		</span>),
    },
    {
      key: "status",
      title: "Status",
		render: (row: MasterConfigurationItem) => (<StatusPill status={row.status} />),
    },
  ];
	const renderCustomMasters = () => (<>
		<Panel title="Custom Masters" description="Create modules, edit module information, delete unused modules and configure fields for each module." right={<div className="flex items-center gap-2">
			<DataREfreshButton callBackFn={handleRefreshMasters} loading={refreshing} />

		  <button type="button" onClick={openCreateMasterForm} className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
			  <Plus size={17} />
			  Add Custom Master
		  </button>
	  </div>}>
		  <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
			  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				  <SearchInput search={search} setSearch={setSearch} />

				  <select value={statusFilter} onChange={(event) => {
					  setStatusFilter(event.target
						  .value);
					  setLocalOffset(0);
				  }} className="h-10 rounded border border-input bg-background px-3 text-sm outline-none focus:border-primary">
					  <option value="">
						  All Statuses
					  </option>

					  <option value="active">
						  Active
					  </option>

					  <option value="inactive">
						  Inactive
					  </option>
				  </select>
			  </div>

			  <Badge count={totalDocs} text="Total Custom Masters:" varient="primary" />
		  </div>

		  <div className="min-h-0 flex-1 overflow-hidden">
			  <DataTable columns={masterColumns} data={masterConfigurations} loading={moduleLoading} emptyMessage="No custom masters found." actions={(item: MasterConfigurationItem) => (<div className="flex justify-end gap-2">
				  <button type="button" onClick={() => openCustomMasterSchema(item)} className="inline-flex h-9 items-center gap-2 rounded border border-border px-3 text-primary transition hover:bg-primary/10" title="Configure fields">
					  <Settings2 size={16} />
					  Fields
				  </button>

				  <button type="button" onClick={() => openEditMasterForm(item.moduleCode)} className="inline-flex h-9 w-9 items-center justify-center rounded border border-border text-primary transition hover:bg-primary/10" title="Edit custom master">
					  <Edit size={16} />
				  </button>
			  </div>)} />
		  </div>
	  </Panel>

	  {totalDocs > 0 ? (<Pagination localLimit={localLimit} selectCb={(event: any) => {
		  setLocalLimit(Number(event.target.value));
		  setLocalOffset(0);
	  }} preDisabled={!pagination
		  ?.hasPrevPage &&
		  currentPage <= 1} nextDisabled={!pagination
			  ?.hasNextPage &&
			  currentPage >=
			  totalPages} setLocalOffset={setLocalOffset} pagination={pagination} />) : null}
  </>);
  const renderActiveContent = () => {
	  if (activeTab === "overview") {
		  return renderOverview();
	  }
	  if (activeTab ===
		  "customMasters") {
      return renderCustomMasters();
    }
	  if (activeTab ===
		  "customMasterSchema" &&
		  selectedCustomSchemaMaster) {
		  return (<div className="space-y-4">
			  <button type="button" onClick={() => {
				  setActiveTab("customMasters");
				  setSelectedCustomSchemaMaster(null);
				  dispatch(clearMasterSchemaState());
		  }} className="inline-flex h-9 items-center gap-2 rounded border border-border bg-card px-3 text-sm font-semibold text-card-foreground transition hover:bg-muted">
			  <ArrowLeft size={16} />

			  Back to Custom Masters
		  </button>

		  {renderSchemaBuilder(`${selectedCustomSchemaMaster.moduleName} Schema`, `Configure fields for ${selectedCustomSchemaMaster.moduleName}.`, selectedCustomSchemaMaster.moduleCode)}
	  </div>);
	}
    if (selectedStandardMaster) {
      return renderStandardMaster(selectedStandardMaster);
	}
    return renderOverview();
  };
  useEffect(() => {
	  if (activeTab !==
		  "customMasterSchema" ||
		  !selectedCustomSchemaMaster
			  ?.moduleCode) {
		  return;
	  }
	  dispatch(getMasterSchema({
		  moduleCode: selectedCustomSchemaMaster
			  .moduleCode,
		  offset: schemaOffset,
		  limit: schemaLimit,
	}));
  }, [
	  schemaOffset,
	  schemaLimit,
  ]);
	return (<div className="min-h-screen bg-background p-4 md:p-4">
		<div className="space-y-4">
			<header className="flex flex-col gap-3 rounded border border-border bg-card px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
				<div className="flex items-center gap-3">
				  <button type="button" onClick={() => window.history.back()} className="flex h-9 w-9 items-center justify-center rounded border border-border bg-background text-card-foreground transition hover:bg-muted">
					  <ArrowLeft size={18} />
				  </button>

				  <div>
					  <h1 className="text-xl font-semibold text-card-foreground">
						  Master Configuration
					  </h1>

					  <p className="mt-1 text-xs font-semibold text-muted-foreground">
						  Configure
						  standard-master fields
						  and manage
						  custom-master modules
						  with their schemas.
					  </p>
				  </div>
			  </div>

			  <div className="flex flex-wrap gap-2">
				  <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
					  {STANDARD_MASTERS.length}{" "}
					  Standard Masters
				  </span>

				  <span className="rounded-md bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
					  {totalDocs} Custom
					  Masters
				  </span>
			  </div>
		  </header>

		  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
			  <aside className="max-h-max rounded border border-border bg-card p-2 shadow-sm lg:sticky lg:top-4 lg:self-start">
				  <div className="mb-2 px-3 py-2">
					  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						  Master Menu
					  </p>
				  </div>

				  <div className="space-y-1">
					  {tabs.map((tab) => {
				const isActive = activeTab ===
					tab.key ||
					(tab.key ===
						"customMasters" &&
						activeTab ===
						"customMasterSchema");
				return (<button key={tab.key} type="button" onClick={() => {
					setActiveTab(tab.key);
				  if (tab.key !==
					  "customMasters") {
					  setSelectedCustomSchemaMaster(null);
					  dispatch(clearMasterSchemaState());
				  }
			  }} className={`
                        flex w-full items-center gap-3 rounded px-3 py-2.5
                        text-left text-sm font-bold transition
                        ${isActive
					  ? "bg-primary text-primary-foreground shadow-sm"
						  : "text-muted-foreground hover:bg-muted hover:text-card-foreground"}
                      `}>
				  <span className={`
                          flex h-8 w-8 items-center justify-center rounded
                          ${isActive
						  ? "bg-white/15"
						  : "bg-background text-primary"}
                        `}>
					  {tab.icon}
				  </span>

					<span>
						{tab.label}
					</span>
				</button>);
			})}
				  </div>
			  </aside>

			  <main className="min-w-0 space-y-4">
				  {renderActiveContent()}
			  </main>
		  </div>
	  </div>

	  {showMasterForm ? (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		  <div className="w-full max-w-xl overflow-hidden rounded border border-border bg-card shadow-2xl">
			  <div className="flex items-center justify-between border-b border-border px-5 py-4">
				  <div>
					  <h2 className="text-lg font-semibold text-card-foreground">
						  {editingModuleCode
							  ? "Edit Custom Master"
							  : "Add Custom Master"}
					  </h2>

					  {editingModuleCode ? (<p className="mt-1 text-xs font-semibold text-muted-foreground">
						  Module Code:{" "}
						  {editingModuleCode}
					  </p>) : null}
				  </div>

				  <button type="button" onClick={closeMasterForm} disabled={isMasterSubmitting} className="rounded p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50">
					  <X size={19} />
				  </button>
			  </div>

			  {editingModuleCode &&
				  moduleLoading &&
				  !selectedMasterConfiguration ? (<div className="flex items-center justify-center gap-2 px-5 py-16 text-muted-foreground">
					  Loading custom
					  master...
				  </div>) : (<form onSubmit={handleMasterSubmit} className="space-y-5 p-5">
					  <div>
						  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
							  Module Name{" "}
							  <span className="text-danger">
								  *
							  </span>
						  </label>

						  <input type="text" value={masterForm.moduleName} onChange={(event) => updateMasterFormField("moduleName", event.target
							  .value)} placeholder="Example: Department Master" maxLength={100} className={`
                      h-10 w-full rounded border bg-background px-3 text-sm
                      outline-none focus:ring-2 focus:ring-primary/20
                      ${masterFormErrors.moduleName
									  ? "border-danger"
									  : "border-input"}
                    `} />

						  {masterFormErrors.moduleName ? (<p className="mt-1 text-xs font-semibold text-danger">
							  {masterFormErrors.moduleName}
						  </p>) : null}
					  </div>

					  <div>
						  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
							  Description{" "}
							  <span className="text-danger">
								  *
							  </span>
						  </label>

						  <textarea value={masterForm.description} onChange={(event) => updateMasterFormField("description", event.target
							  .value)} placeholder="Describe where this master will be used" rows={4} maxLength={500} className={`
                      w-full resize-none rounded border bg-background
                      px-3 py-2.5 text-sm outline-none
                      focus:ring-2 focus:ring-primary/20
                      ${masterFormErrors.description
									  ? "border-danger"
									  : "border-input"}
                    `} />

						  <div className="mt-1 flex items-center justify-between">
							  <span className="text-xs font-semibold text-danger">
								  {masterFormErrors.description ||
									  ""}
							  </span>

							  <span className="text-xs font-medium text-muted-foreground">
								  {masterForm
									  .description
									  .length}
								  /500
							  </span>
						  </div>
					  </div>

					  <div>
						  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
							  Status
						  </label>

						  <select value={masterForm.status} onChange={(event) => updateMasterFormField("status", event.target
							  .value)} className="h-10 w-full rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary">
							  <option value="active">
								  Active
							  </option>

							  <option value="inactive">
								  Inactive
							  </option>
						  </select>
					  </div>

					  {moduleError ? (<div className="rounded border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
						  {moduleError}
					  </div>) : null}

					  <div className="flex justify-end gap-3 border-t border-border pt-4">
						  <button type="button" onClick={closeMasterForm} disabled={isMasterSubmitting} className="h-10 rounded border border-border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-50">
							  Cancel
						  </button>

						  <button type="submit" disabled={isMasterSubmitting} className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
							  {editingModuleCode
								  ? "Update"
								  : "Create"}
						  </button>
					  </div>
			  </form>)}
		  </div>
	  </div>) : null}



	  {showSchemaForm &&
		  schemaContext ? (<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
			  <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded border border-border bg-card shadow-2xl">
				  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-5 py-4">
					  <div>
						  <h2 className="text-lg font-semibold text-card-foreground">
							  {editingSchemaFieldKey
								  ? "Update Schema Field"
								  : "Add Schema Field"}
						  </h2>

						  <p className="mt-1 text-xs font-semibold text-muted-foreground">
							  {schemaContext.title}

							  {schemaContext.kind ===
								  "custom"
								  ? ` · ${schemaContext.moduleCode}`
								  : " · Standard Master"}
						  </p>
					  </div>

					  <button type="button" onClick={closeSchemaForm} disabled={isSchemaSubmitting} className="rounded p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50">
						  <X size={19} />
					  </button>
				  </div>

				  <form onSubmit={handleSchemaSubmit} className="space-y-5 p-5">
					  <div className="grid grid-cols-2 gap-3 md:grid-cols-2 sm:grid-cols-1">
						  <div>
							  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
								  Field Label{" "}
								  <span className="text-danger">
									  *
								  </span>
							  </label>

							  <input value={schemaForm.label} onChange={(event) => handleSchemaLabelChange(event.target.value)} placeholder="Example: Department Code" className={`
                    h-10 w-full rounded border bg-background px-3 text-sm
                    outline-none
                    ${schemaFormErrors.label ||
									  schemaFormErrors.key
									  ? "border-danger"
									  : "border-input"}
                  `} />

							  {schemaFormErrors.label ||
								  schemaFormErrors.key ? (<p className="mt-1 text-xs font-semibold text-danger">
									  {schemaFormErrors.label ||
										  schemaFormErrors.key}
								  </p>) : <></>}
						  </div>

						  <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
									  Field Type{" "}
									  <span className="text-danger">
										  *
									  </span>
								  </label>

								  <select value={schemaForm.type} onChange={(event) => updateSchemaFormField("type", event.target
									  .value)} className="h-10 w-full rounded border border-input bg-background px-3 text-sm font-semibold outline-none">
									  {availableFieldTypeOptions.map((option) => (<option key={option.value} value={option.value}>
										  {option.label}
					</option>))}
                  </select>
							  </div>
						  </div>
					  </div>

					  {schemaForm.type ===
						  "custommaster" ? (<div>
							  <label className="mb-1.5 block text-sm font-bold text-card-foreground">
								  Custom Master{" "}
								  <span className="text-danger">
									  *
								  </span>
							  </label>

							  <select value={schemaForm.customMasterCode} onChange={(event) => handleCustomMasterReferenceChange(event.target
								  .value)} className={`
                      h-10 w-full rounded border bg-background px-3
                      text-sm font-semibold outline-none
                      ${schemaFormErrors.customMasterCode
                      ? "border-danger"
										  : "border-input"}
                    `}>
								  <option value="">
									  Select Custom
									  Master
								  </option>

								  {masterConfigurations
									  .filter((item: MasterConfigurationItem) => item.status ===
										  "active")
									  .map((item: MasterConfigurationItem) => (<option key={item.moduleCode} value={item.moduleCode}>
										  {item.moduleName}{" "}
										  (
										  {item.moduleCode}
                      )
					</option>))}
							  </select>

							  {schemaFormErrors.customMasterCode ? (<p className="mt-1 text-xs font-semibold text-danger">
								  {schemaFormErrors.customMasterCode}
						  </p>) : null}
					  </div>) : null}

					  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
						  {[
							  {
								  key: "isRequired",
								  label: "Required",
							  },
							  {
								  key: "isSearchable",
								  label: "Searchable",
							  },
							  {
								  key: "isFilterable",
								  label: "Filterable",
							  },
							  {
								  key: "isHidden",
								  label: "Hidden",
							  },
						  ].map((option) => (<label key={option.key} className="flex cursor-pointer items-center gap-2 rounded border border-border bg-background px-3 py-3 text-sm font-bold">
							  <input type="checkbox" checked={!!schemaForm[option.key as keyof SchemaFieldForm]} onChange={(event) => updateSchemaFormField(option.key as keyof SchemaFieldForm, event
								  .target
								  .checked)} />

							  {option.label}
			  </label>))}
					  </div>

					  <div className="flex justify-end gap-3 border-t border-border pt-4">
						  <button type="button" onClick={closeSchemaForm} disabled={isSchemaSubmitting} className="h-10 rounded border border-border px-4 text-sm font-semibold transition hover:bg-muted disabled:opacity-50">
							  Cancel
						  </button>

						  <button type="submit" disabled={isSchemaSubmitting} className="inline-flex h-10 min-w-36 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
							  <Save size={16} />

							  {editingSchemaFieldKey
								  ? "Update Field"
								  : "Add Field"}
						  </button>
					  </div>
				  </form>
			  </div>
	  </div>) : null}

	  {confirmTooltip.show ? (<ConfirmTooltip x={confirmTooltip.x} y={confirmTooltip.y} message={`Are you sure you want to delete ${confirmTooltip?.item
		  ?.moduleName ||
		  "this custom master"} (${confirmTooltip
			  ?.moduleCode || ""})?`} confirmText="Delete" cancelText="Cancel" onConfirm={handleDeleteConfirm} onCancel={() => setConfirmTooltip({
				  show: false,
				  x: null,
				  y: null,
				  item: null,
				  moduleCode: null,
		})} />) : null}
  </div>);
};
export default MasterConfiguration;