// import { useEffect, useMemo, useState } from "react";
// import { Edit, Plus, Trash2 } from "lucide-react";
// import { toast } from "react-toastify";

// import { DataCreateButton } from "../../../../components/buttons";
// import SearchInput from "../../../../components/searchInput";
// import DataTable from "../../../../components/DataTable";
// import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
// import Permission from "../../../../components/PermissionGuard";

// import {
//     ProductDefaultInputs,
//     ChassisFieldOptions,
// } from "../EngineeringConfig/DefaultInputs";

// import {
//     deleteDefaultRecord,
//     loadDefaultRecords,
//     upsertDefaultRecord,
// } from "./defaultValuesStorage";
// import EngineeringDefaultValueModal from "../../../../components/cardBasedForm/EngineeringDefaultValueModal";

// const productOptions = [
//     {
//         label: "Chassis",
//         value: "chassis",
//     },
//     // {
//     //     label: "Trailer Sidewall",
//     //     value: "trailerSidewall",
//     // },
//     // {
//     //     label: "Trailer Door",
//     //     value: "trailerDoor",
//     // },
// ];

// const makeOptions = (arr: string[]) => arr.map((v) => ({ label: v, value: v }));

// const sidewallDoorMaterialOptions = makeOptions([
//     "MS Steel",
//     "Aluminium",
//     "Stainless Steel",
// ]);

// const getProductLabel = (productType: string) => {
//     return (
//         productOptions.find((item) => item.value === productType)?.label ||
//         "Product"
//     );
// };

// const getDefaultsByProductType = (productType: string) => {
//     return {
//         ...(ProductDefaultInputs?.[productType as keyof typeof ProductDefaultInputs] ||
//             ProductDefaultInputs.chassis ||
//             {}),
//     };
// };

// const emptyForm = {
//     productType: "chassis",
//     ...getDefaultsByProductType("chassis"),
// };

// const formatDateTime = (date: string) => {
//     if (!date) return "-";

//     return new Date(date).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//     });
// };

// const mainColumns = [
//     {
//         key: "productName",
//         title: "Product",
//         render: (row: any) => (
//             <span className="font-semibold text-card-foreground">
//                 {row?.productName || getProductLabel(row?.productType)}
//             </span>
//         ),
//     },
//     {
//         key: "productType",
//         title: "Product Type",
//         render: (row: any) => (
//             <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
//                 {getProductLabel(row?.productType)}
//             </span>
//         ),
//     },
//     {
//         key: "totalLength",
//         title: "Length",
//         render: (row: any) => <span>{row?.values?.totalLength || "-"}</span>,
//     },
//     {
//         key: "totalHeight",
//         title: "Height",
//         render: (row: any) => (
//             <span>
//                 {row?.values?.totalHeight ||
//                     row?.values?.deckHeight ||
//                     "-"}
//             </span>
//         ),
//     },
//     {
//         key: "material",
//         title: "Material",
//         render: (row: any) => (
//             <span>
//                 {row?.values?.material ||
//                     row?.values?.steelGrade ||
//                     "-"}
//             </span>
//         ),
//     },
//     {
//         key: "savedAt",
//         title: "Saved At",
//         render: (row: any) => <span>{formatDateTime(row?.savedAt)}</span>,
//     },
// ];

// const SetDefaultValue = () => {
//     const [records, setRecords] = useState<any[]>([]);
//     const [search, setSearch] = useState("");
//     const [debouncedSearch, setDebouncedSearch] = useState("");

//     const [showModal, setShowModal] = useState(false);
//     const [edit, setEdit] = useState(false);
//     const [selectedId, setSelectedId] = useState<string | null>(null);

//     const [loading, setLoading] = useState(false);
//     const [addLoader, setAddLoader] = useState(false);
//     const [deleteLoader, setDeleteLoader] = useState(false);

//     const [errors, setErrors] = useState<any>({});

//     const [confirmTooltip, setConfirmTooltip] = useState<any>({
//         show: false,
//         x: null,
//         y: null,
//         id: null,
//         productName: "",
//     });

//     const [form, setForm] = useState<any>(emptyForm);

//     useEffect(() => {
//         const timer = setTimeout(() => {
//             setDebouncedSearch(search);
//         }, 400);

//         return () => clearTimeout(timer);
//     }, [search]);

//     const fetchRecords = async () => {
//         setLoading(true);

//         try {
//             const list = await loadDefaultRecords();

//             const sorted = [...list].sort(
//                 (a: any, b: any) =>
//                     new Date(b.savedAt).getTime() -
//                     new Date(a.savedAt).getTime()
//             );

//             setRecords(sorted);
//         } catch (err) {
//             toast.error("Failed to load default values");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchRecords();
//     }, []);

//     const filteredRecords = useMemo(() => {
//         if (!debouncedSearch.trim()) return records;

//         const q = debouncedSearch.toLowerCase();

//         return records.filter((item: any) => {
//             return (
//                 String(item?.productName || "")
//                     .toLowerCase()
//                     .includes(q) ||
//                 String(item?.productType || "")
//                     .toLowerCase()
//                     .includes(q) ||
//                 String(getProductLabel(item?.productType))
//                     .toLowerCase()
//                     .includes(q) ||
//                 String(item?.values?.material || "")
//                     .toLowerCase()
//                     .includes(q) ||
//                 String(item?.values?.steelGrade || "")
//                     .toLowerCase()
//                     .includes(q)
//             );
//         });
//     }, [records, debouncedSearch]);

//     const resetForm = () => {
//         setForm({
//             productType: "chassis",
//             ...getDefaultsByProductType("chassis"),
//         });

//         setEdit(false);
//         setSelectedId(null);
//         setErrors({});
//     };

//     const handleChange = (key: string, value: any) => {
//         setForm((prev: any) => ({
//             ...prev,
//             [key]: value,
//         }));

//         setErrors((prev: any) => ({
//             ...prev,
//             [key]: "",
//         }));
//     };

//     const handleProductTypeChange = (productType: string) => {
//         setForm({
//             productType,
//             ...getDefaultsByProductType(productType),
//         });

//         setErrors({});
//     };

//     const validateForm = () => {
//         const nextErrors: any = {};

//         if (!form.productType) {
//             nextErrors.productType = "Product Type is required";
//         }

//         setErrors(nextErrors);

//         return Object.keys(nextErrors).length === 0;
//     };

//     const handleSubmit = async () => {
//         if (!validateForm()) return;

//         setAddLoader(true);

//         try {
//             const { productType, ...values } = form;

//             await upsertDefaultRecord({
//                 id: selectedId || undefined,
//                 productType,
//                 values,
//             });

//             toast.success(
//                 edit
//                     ? "Default values updated successfully"
//                     : "Default values saved successfully"
//             );

//             await fetchRecords();
//             setShowModal(false);
//             resetForm();
//         } catch (err) {
//             toast.error("Failed to save default values");
//         } finally {
//             setAddLoader(false);
//         }
//     };

//     const handleDeleteDefaultValue = async () => {
//         if (!confirmTooltip?.id) return;

//         setDeleteLoader(true);

//         try {
//             const next = await deleteDefaultRecord(confirmTooltip.id);
//             setRecords(next);

//             toast.success("Default values deleted successfully");

//             setConfirmTooltip({
//                 show: false,
//                 x: null,
//                 y: null,
//                 id: null,
//                 productName: "",
//             });
//         } catch (err) {
//             toast.error("Failed to delete default values");
//         } finally {
//             setDeleteLoader(false);
//         }
//     };

//     const chassisSections = [
//         {
//             title: "Basic Dimensions",

//             fields: [
//                 {
//                     key: "trailerType",
//                     label: "Trailer Type",
//                     type: "select",
//                     options: ChassisFieldOptions.trailerType,
//                     placeholder: "Select Trailer Type",
//                 },
//                 {
//                     key: "totalLength",
//                     label: "Total Length",
//                     type: "number",
//                     placeholder: "Enter Total Length",
//                 },
//                 {
//                     key: "totalWidth",
//                     label: "Total Width",
//                     type: "number",
//                     placeholder: "Enter Total Width",
//                 },
//                 {
//                     key: "deckHeight",
//                     label: "Deck Height",
//                     type: "number",
//                     placeholder: "Enter Deck Height",
//                 },
//                 {
//                     key: "payloadCapacity",
//                     label: "Payload Capacity",
//                     type: "select",
//                     options: ChassisFieldOptions.payloadCapacity,
//                     placeholder: "Select Payload Capacity",
//                 },
//             ],
//         },
//         {
//             title: "Chassis Structure",

//             fields: [
//                 {
//                     key: "mainBeamType",
//                     label: "Main Beam Type",
//                     type: "select",
//                     options: ChassisFieldOptions.mainBeamType,
//                     placeholder: "Select Main Beam Type",
//                 },
//                 {
//                     key: "crossMemberCount",
//                     label: "Cross Member Count",
//                     type: "number",
//                     placeholder: "Enter Cross Member Count",
//                 },
//                 {
//                     key: "crossMemberType",
//                     label: "Cross Member Type",
//                     type: "select",
//                     options: ChassisFieldOptions.crossMemberType,
//                     placeholder: "Select Cross Member Type",
//                 },
//                 {
//                     key: "floorType",
//                     label: "Floor Type",
//                     type: "select",
//                     options: ChassisFieldOptions.floorType,
//                     placeholder: "Select Floor Type",
//                 },
//                 {
//                     key: "sideRailCount",
//                     label: "Side Rail Count",
//                     type: "number",
//                     placeholder: "Enter Side Rail Count",
//                 },
//                 {
//                     key: "sideRailType",
//                     label: "Side Rail Type",
//                     type: "select",
//                     options: ChassisFieldOptions.sideRailType,
//                     placeholder: "Select Side Rail Type",
//                 },
//             ],
//         },
//         {
//             title: "Suspension Setup",

//             fields: [
//                 {
//                     key: "suspensionType",
//                     label: "Suspension Type",
//                     type: "select",
//                     options: ChassisFieldOptions.suspensionType,
//                     placeholder: "Select Suspension Type",
//                 },
//                 {
//                     key: "suspensionCapacity",
//                     label: "Suspension Capacity",
//                     type: "select",
//                     options: ChassisFieldOptions.suspensionCapacity,
//                     placeholder: "Select Suspension Capacity",
//                 },
//                 {
//                     key: "axleCount",
//                     label: "Axle Count",
//                     type: "number",
//                     placeholder: "Enter Axle Count",
//                 },
//             ],
//         },
//         {
//             title: "Tyre Configuration",

//             fields: [
//                 {
//                     key: "tyreSize",
//                     label: "Tyre Size",
//                     type: "select",
//                     options: ChassisFieldOptions.tyreSize,
//                     placeholder: "Select Tyre Size",
//                 },
//                 {
//                     key: "tyreBrand",
//                     label: "Tyre Brand",
//                     type: "select",
//                     options: ChassisFieldOptions.tyreBrand,
//                     placeholder: "Select Tyre Brand",
//                 },
//             ],
//         },
//         {
//             title: "King Pin & Landing Leg",

//             fields: [
//                 {
//                     key: "kingPinType",
//                     label: "King Pin Type",
//                     type: "text",
//                     placeholder: "Enter King Pin Type",
//                 },
//                 {
//                     key: "kingPinPositionPercent",
//                     label: "King Pin Position %",
//                     type: "number",
//                     placeholder: "Enter King Pin Position %",
//                 },
//                 {
//                     key: "landingLegType",
//                     label: "Landing Leg Type",
//                     type: "select",
//                     options: ChassisFieldOptions.landingLegType,
//                     placeholder: "Select Landing Leg Type",
//                 },
//                 {
//                     key: "landingLegCapacity",
//                     label: "Landing Leg Capacity",
//                     type: "select",
//                     options: ChassisFieldOptions.landingLegCapacity,
//                     placeholder: "Select Landing Leg Capacity",
//                 },
//             ],
//         },
//         {
//             title: "Material Grade",

//             fields: [
//                 {
//                     key: "steelGrade",
//                     label: "Steel Grade",
//                     type: "select",
//                     options: ChassisFieldOptions.steelGrade,
//                     placeholder: "Select Steel Grade",
//                 },
//                 {
//                     key: "corrosionProtection",
//                     label: "Corrosion Protection",
//                     type: "select",
//                     options: ChassisFieldOptions.corrosionProtection,
//                     placeholder: "Select Corrosion Protection",
//                 },
//             ],
//         },
//     ];

//     const sidewallDoorSections = [
//         {
//             title:
//                 form.productType === "trailerDoor"
//                     ? "Trailer Door Defaults"
//                     : "Trailer Sidewall Defaults",
//             description: "Configure default dimensions, pillars, rails, sheet, and material.",
//             fields: [
//                 {
//                     key: "totalLength",
//                     label: "Total Length",
//                     type: "number",
//                     placeholder: "Enter Total Length",
//                 },
//                 {
//                     key: "totalHeight",
//                     label: "Total Height",
//                     type: "number",
//                     placeholder: "Enter Total Height",
//                 },
//                 {
//                     key: "pillarCount",
//                     label: "Pillar Count",
//                     type: "number",
//                     placeholder: "Enter Pillar Count",
//                 },
//                 {
//                     key: "pillarSpacing",
//                     label: "Pillar Spacing",
//                     type: "number",
//                     placeholder: "Enter Pillar Spacing",
//                 },
//                 {
//                     key: "pillarWidth",
//                     label: "Pillar Width",
//                     type: "number",
//                     placeholder: "Enter Pillar Width",
//                 },
//                 {
//                     key: "topRailHeight",
//                     label: "Top Rail Height",
//                     type: "number",
//                     placeholder: "Enter Top Rail Height",
//                 },
//                 {
//                     key: "bottomRailHeight",
//                     label: "Bottom Rail Height",
//                     type: "number",
//                     placeholder: "Enter Bottom Rail Height",
//                 },
//                 {
//                     key: "sheetThickness",
//                     label: "Sheet Thickness",
//                     type: "number",
//                     placeholder: "Enter Sheet Thickness",
//                 },
//                 {
//                     key: "material",
//                     label: "Material",
//                     type: "select",
//                     options: sidewallDoorMaterialOptions,
//                     placeholder: "Select Material",
//                 },
//             ],
//         },
//     ];

//     const productSections = useMemo(() => {
//         if (form.productType === "chassis") {
//             return chassisSections;
//         }

//         if (
//             form.productType === "trailerSidewall" ||
//             form.productType === "trailerDoor"
//         ) {
//             return sidewallDoorSections;
//         }

//         return [];
//     }, [form.productType]);

//     const inputData = {
//         sections: [
//             {
//                 title: "Product Type",

//                 fields: [
//                     {
//                         key: "productType",
//                         label: "Select Product Type",
//                         type: "select",
//                         options: productOptions,
//                         required: true,
//                         // placeholder: "Select Product Type",
//                         onChange: handleProductTypeChange,
//                     },
//                 ],
//             },
//             ...productSections,
//         ],
//     };

//     return (
//         <>
//             <div className="flex h-full w-full flex-col border border-border bg-card p-4 text-card-foreground shadow-sm">
//                 <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
//                     <div className="me-2">
//                         <SearchInput {...{ search, setSearch }} />
//                     </div>

//                     <Permission
//                         module="bookez"
//                         permissionKey="accountLedger"
//                         action="create"
//                     >
//                         <DataCreateButton
//                             {...{
//                                 text: "Create Default Value",
//                                 icon: <Plus size={16} />,
//                                 callBackFn: () => {
//                                     resetForm();
//                                     setShowModal(true);
//                                 },
//                             }}
//                         />
//                     </Permission>
//                 </div>

//                 <DataTable
//                     columns={mainColumns}
//                     data={filteredRecords || []}
//                     loading={loading}
//                     emptyMessage="No default values found"
//                     actions={(row: any) => (
//                         <div className="flex items-center gap-2">
//                             <Permission
//                                 module="bookez"
//                                 permissionKey="accountLedger"
//                                 action="update"
//                             >
//                                 <button
//                                     type="button"
//                                     onClick={() => {
//                                         const productType = row?.productType || "chassis";

//                                         setForm({
//                                             productType,
//                                             ...getDefaultsByProductType(productType),
//                                             ...(row?.values || {}),
//                                         });

//                                         setSelectedId(row?.id);
//                                         setEdit(true);
//                                         setErrors({});
//                                         setShowModal(true);
//                                     }}
//                                     className="cursor-pointer rounded-lg p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
//                                 >
//                                     <Edit size={16} />
//                                 </button>
//                             </Permission>

//                             <Permission
//                                 module="bookez"
//                                 permissionKey="accountLedger"
//                                 action="delete"
//                             >
//                                 <button
//                                     type="button"
//                                     disabled={deleteLoader}
//                                     onClick={(e) => {
//                                         const rect = e.currentTarget.getBoundingClientRect();

//                                         let x = rect.left - 150;
//                                         if (x < 10) x = 10;

//                                         const y = rect.top + window.scrollY - 5;

//                                         setConfirmTooltip({
//                                             show: true,
//                                             x,
//                                             y,
//                                             id: row?.id,
//                                             productName:
//                                                 row?.productName ||
//                                                 getProductLabel(row?.productType),
//                                         });
//                                     }}
//                                     className="cursor-pointer rounded-lg p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-60"
//                                 >
//                                     <Trash2 size={16} />
//                                 </button>
//                             </Permission>
//                         </div>
//                     )}
//                 />
//             </div>

//             {confirmTooltip.show && (
//                 <ConfirmTooltip
//                     x={confirmTooltip.x}
//                     y={confirmTooltip.y}
//                     message={`Are you sure you want to delete "${
//                         confirmTooltip.productName || "this default value"
//                     }"?`}
//                     confirmText="Delete"
//                     cancelText="Cancel"
//                     onConfirm={handleDeleteDefaultValue}
//                     onCancel={() =>
//                         setConfirmTooltip({
//                             show: false,
//                             x: null,
//                             y: null,
//                             id: null,
//                             productName: "",
//                         })
//                     }
//                 />
//             )}

//             <EngineeringDefaultValueModal
//                 show={showModal}
//                 setShow={setShowModal}
//                 edit={edit}
//                 title="Set Default Value"
//                 subtitle="Fill in the engineering default values below"
//                 loading={addLoader}
//                 onClose={() => {
//                     setShowModal(false);
//                     resetForm();
//                 }}
//                 onSubmit={handleSubmit}
//                 form={form}
//                 errors={errors}
//                 handleChange={handleChange}
//                 inputData={inputData}
//             />
//         </>
//     );
// };

// export default SetDefaultValue;







import { useEffect, useMemo, useState } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { DataCreateButton } from "../../../../components/buttons";
import SearchInput from "../../../../components/searchInput";
import DataTable from "../../../../components/DataTable";
import ConfirmTooltip from "../../../../components/common/ConfirmTooltip";
import Permission from "../../../../components/PermissionGuard";

import {
    ProductDefaultInputs,
    ChassisFieldOptions,
} from "../EngineeringConfig/DefaultInputs";

import {
    deleteDefaultRecord,
    loadDefaultRecords,
    upsertDefaultRecord,
} from "./defaultValuesStorage";

import EngineeringDefaultValueModal from "../../../../components/cardBasedForm/EngineeringDefaultValueModal";
import Badge from "../../../../components/badge";

const productOptions = [
    {
        label: "Chassis",
        value: "chassis",
    },
];

const getDefaultsByProductType = (productType: string) => {
    return {
        ...(ProductDefaultInputs?.[productType as keyof typeof ProductDefaultInputs] ||
            ProductDefaultInputs.chassis ||
            {}),
    };
};

const emptyForm = {
    productType: "chassis",
    ...getDefaultsByProductType("chassis"),
};

const formatDateTime = (date: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const mainColumns = [
    {
        key: "productName",
        title: "Product",
        render: () => (
            <span className="font-semibold text-card-foreground">
                Chassis
            </span>
        ),
    },
    {
        key: "productType",
        title: "Product Type",
        render: () => (
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                Chassis
            </span>
        ),
    },
    {
        key: "totalLength",
        title: "Length",
        render: (row: any) => <span>{row?.values?.totalLength || "-"}</span>,
    },
    {
        key: "deckHeight",
        title: "Deck Height",
        render: (row: any) => <span>{row?.values?.deckHeight || "-"}</span>,
    },
    // {
    //     key: "payloadCapacity",
    //     title: "Payload",
    //     render: (row: any) => <span>{row?.values?.payloadCapacity || "-"}</span>,
    // },
    // {
    //     key: "steelGrade",
    //     title: "Steel Grade",
    //     render: (row: any) => <span>{row?.values?.steelGrade || "-"}</span>,
    // },
    {
        key: "savedAt",
        title: "Saved At",
        render: (row: any) => <span>{formatDateTime(row?.savedAt)}</span>,
    },
];

const SetDefaultValue = () => {
    const [records, setRecords] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [edit, setEdit] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [addLoader, setAddLoader] = useState(false);
    const [deleteLoader, setDeleteLoader] = useState(false);

    const [errors, setErrors] = useState<any>({});

    const [confirmTooltip, setConfirmTooltip] = useState<any>({
        show: false,
        x: null,
        y: null,
        id: null,
        productName: "",
    });

    const [form, setForm] = useState<any>(emptyForm);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const fetchRecords = async () => {
        setLoading(true);

        try {
            const list = await loadDefaultRecords();

            const sorted = [...list].sort(
                (a: any, b: any) =>
                    new Date(b.savedAt).getTime() -
                    new Date(a.savedAt).getTime()
            );

            setRecords(sorted);
        } catch (err) {
            toast.error("Failed to load default values");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const filteredRecords = useMemo(() => {
        if (!debouncedSearch.trim()) return records;

        const q = debouncedSearch.toLowerCase();

        return records.filter((item: any) => {
            return (
                String(item?.productName || "Chassis")
                    .toLowerCase()
                    .includes(q) ||
                String(item?.productType || "chassis")
                    .toLowerCase()
                    .includes(q) ||
                String(item?.values?.trailerType || "")
                    .toLowerCase()
                    .includes(q) ||
                String(item?.values?.payloadCapacity || "")
                    .toLowerCase()
                    .includes(q) ||
                String(item?.values?.mainBeamType || "")
                    .toLowerCase()
                    .includes(q) ||
                String(item?.values?.steelGrade || "")
                    .toLowerCase()
                    .includes(q)
            );
        });
    }, [records, debouncedSearch]);

    const resetForm = () => {
        setForm({
            productType: "chassis",
            ...getDefaultsByProductType("chassis"),
        });

        setEdit(false);
        setSelectedId(null);
        setErrors({});
    };

    const handleChange = (key: string, value: any) => {
        setForm((prev: any) => ({
            ...prev,
            productType: "chassis",
            [key]: value,
        }));

        setErrors((prev: any) => ({
            ...prev,
            [key]: "",
        }));
    };

    const validateForm = () => {
        const nextErrors: any = {};

        if (!form.productType) {
            nextErrors.productType = "Product Type is required";
        }

        if (!form.totalLength) {
            nextErrors.totalLength = "Total Length is required";
        }

        if (!form.totalWidth) {
            nextErrors.totalWidth = "Total Width is required";
        }

        if (!form.deckHeight) {
            nextErrors.deckHeight = "Deck Height is required";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setAddLoader(true);

        try {
            const { productType, ...values } = form;

            await upsertDefaultRecord({
                id: selectedId || undefined,
                productType: "chassis",
                values,
            });

            toast.success(
                edit
                    ? "Default values updated successfully"
                    : "Default values saved successfully"
            );

            await fetchRecords();
            setShowModal(false);
            resetForm();
        } catch (err) {
            toast.error("Failed to save default values");
        } finally {
            setAddLoader(false);
        }
    };

    const handleDeleteDefaultValue = async () => {
        if (!confirmTooltip?.id) return;

        setDeleteLoader(true);

        try {
            const next = await deleteDefaultRecord(confirmTooltip.id);
            setRecords(next);

            toast.success("Default values deleted successfully");

            setConfirmTooltip({
                show: false,
                x: null,
                y: null,
                id: null,
                productName: "",
            });
        } catch (err) {
            toast.error("Failed to delete default values");
        } finally {
            setDeleteLoader(false);
        }
    };

    const chassisSections = [
        {
            title: "Product Type",
            fields: [
                {
                    key: "productType",
                    label: "Product Type",
                    type: "select",
                    options: productOptions,
                    placeholder: "Select Product Type",
                    required: true,
                    disabled: false,
                },
            ],
        },
        {
            title: "Basic Dimensions",
            fields: [
                {
                    key: "trailerType",
                    label: "Trailer Type",
                    type: "select",
                    options: ChassisFieldOptions.trailerType,
                    placeholder: "Select Trailer Type",
                },
                {
                    key: "totalLength",
                    label: "Total Length",
                    type: "number",
                    placeholder: "Enter Total Length",
                    required: true,
                },
                {
                    key: "totalWidth",
                    label: "Total Width",
                    type: "number",
                    placeholder: "Enter Total Width",
                    required: true,
                },
                {
                    key: "deckHeight",
                    label: "Deck Height",
                    type: "number",
                    placeholder: "Enter Deck Height",
                    required: true,
                },
                {
                    key: "payloadCapacity",
                    label: "Payload Capacity",
                    type: "select",
                    options: ChassisFieldOptions.payloadCapacity,
                    placeholder: "Select Payload Capacity",
                },
            ],
        },
        {
            title: "Chassis Structure",
            fields: [
                {
                    key: "mainBeamType",
                    label: "Main Beam Type",
                    type: "select",
                    options: ChassisFieldOptions.mainBeamType,
                    placeholder: "Select Main Beam Type",
                },
                {
                    key: "crossMemberCount",
                    label: "Cross Member Count",
                    type: "number",
                    placeholder: "Enter Cross Member Count",
                },
                {
                    key: "crossMemberType",
                    label: "Cross Member Type",
                    type: "select",
                    options: ChassisFieldOptions.crossMemberType,
                    placeholder: "Select Cross Member Type",
                },
                {
                    key: "floorType",
                    label: "Floor Type",
                    type: "select",
                    options: ChassisFieldOptions.floorType,
                    placeholder: "Select Floor Type",
                },
                {
                    key: "sideRailCount",
                    label: "Side Rail Count",
                    type: "number",
                    placeholder: "Enter Side Rail Count",
                },
                {
                    key: "sideRailType",
                    label: "Side Rail Type",
                    type: "select",
                    options: ChassisFieldOptions.sideRailType,
                    placeholder: "Select Side Rail Type",
                },
            ],
        },
        {
            title: "Suspension Setup",
            fields: [
                {
                    key: "suspensionType",
                    label: "Suspension Type",
                    type: "select",
                    options: ChassisFieldOptions.suspensionType,
                    placeholder: "Select Suspension Type",
                },
                {
                    key: "suspensionCapacity",
                    label: "Suspension Capacity",
                    type: "select",
                    options: ChassisFieldOptions.suspensionCapacity,
                    placeholder: "Select Suspension Capacity",
                },
                {
                    key: "axleCount",
                    label: "Axle Count",
                    type: "number",
                    placeholder: "Enter Axle Count",
                },
            ],
        },
        {
            title: "Tyre Configuration",
            fields: [
                {
                    key: "tyreSize",
                    label: "Tyre Size",
                    type: "select",
                    options: ChassisFieldOptions.tyreSize,
                    placeholder: "Select Tyre Size",
                },
                {
                    key: "tyreBrand",
                    label: "Tyre Brand",
                    type: "select",
                    options: ChassisFieldOptions.tyreBrand,
                    placeholder: "Select Tyre Brand",
                },
            ],
        },
        {
            title: "King Pin & Landing Leg",
            fields: [
                {
                    key: "kingPinType",
                    label: "King Pin Type",
                    type: "text",
                    placeholder: "Enter King Pin Type",
                },
                {
                    key: "kingPinPositionPercent",
                    label: "King Pin Position %",
                    type: "number",
                    placeholder: "Enter King Pin Position %",
                },
                {
                    key: "landingLegType",
                    label: "Landing Leg Type",
                    type: "select",
                    options: ChassisFieldOptions.landingLegType,
                    placeholder: "Select Landing Leg Type",
                },
                {
                    key: "landingLegCapacity",
                    label: "Landing Leg Capacity",
                    type: "select",
                    options: ChassisFieldOptions.landingLegCapacity,
                    placeholder: "Select Landing Leg Capacity",
                },
            ],
        },
        {
            title: "Material Grade",
            fields: [
                {
                    key: "steelGrade",
                    label: "Steel Grade",
                    type: "select",
                    options: ChassisFieldOptions.steelGrade,
                    placeholder: "Select Steel Grade",
                },
                {
                    key: "corrosionProtection",
                    label: "Corrosion Protection",
                    type: "select",
                    options: ChassisFieldOptions.corrosionProtection,
                    placeholder: "Select Corrosion Protection",
                },
            ],
        },
    ];

    const productSections = useMemo(() => {
        return chassisSections;
    }, []);

    const inputData = {
        sections: [...productSections],
    };

    return (
        <>
            <div className="flex h-full w-full flex-col border border-border bg-card p-4 text-card-foreground shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div id="default-value-summary" className="flex items-start gap-3">
                        <Badge
                            count={filteredRecords?.length ?? 0}
                            text="Total Default Values:"
                            varient="primary"
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <div className="me-2">
                            <SearchInput {...{ search, setSearch }} />
                        </div>

                        <Permission
                            module="bookez"
                            permissionKey="accountLedger"
                            action="create"
                        >
                            <DataCreateButton
                                {...{
                                    text: "Create Default Value",
                                    icon: <Plus size={16} />,
                                    callBackFn: () => {
                                        resetForm();
                                        setShowModal(true);
                                    },
                                }}
                            />
                        </Permission>
                    </div>
                </div>

                <DataTable
                    columns={mainColumns}
                    data={filteredRecords || []}
                    loading={loading}
                    emptyMessage="No default values found"
                    actions={(row: any) => (
                        <div className="flex items-center gap-2">
                            <Permission
                                module="bookez"
                                permissionKey="accountLedger"
                                action="update"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm({
                                            productType: "chassis",
                                            ...getDefaultsByProductType("chassis"),
                                            ...(row?.values || {}),
                                        });

                                        setSelectedId(row?.id);
                                        setEdit(true);
                                        setErrors({});
                                        setShowModal(true);
                                    }}
                                    className="cursor-pointer rounded-lg p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                                >
                                    <Edit size={16} />
                                </button>
                            </Permission>

                            <Permission
                                module="bookez"
                                permissionKey="accountLedger"
                                action="delete"
                            >
                                <button
                                    type="button"
                                    disabled={deleteLoader}
                                    onClick={(e) => {
                                        const rect =
                                            e.currentTarget.getBoundingClientRect();

                                        let x = rect.left - 150;
                                        if (x < 10) x = 10;

                                        const y = rect.top + window.scrollY - 5;

                                        setConfirmTooltip({
                                            show: true,
                                            x,
                                            y,
                                            id: row?.id,
                                            productName: "Chassis",
                                        });
                                    }}
                                    className="cursor-pointer rounded-lg p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger disabled:opacity-60"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </Permission>
                        </div>
                    )}
                />
            </div>

            {confirmTooltip.show && (
                <ConfirmTooltip
                    x={confirmTooltip.x}
                    y={confirmTooltip.y}
                    message={`Are you sure you want to delete "${confirmTooltip.productName || "this default value"
                        }"?`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    onConfirm={handleDeleteDefaultValue}
                    onCancel={() =>
                        setConfirmTooltip({
                            show: false,
                            x: null,
                            y: null,
                            id: null,
                            productName: "",
                        })
                    }
                />
            )}

            <EngineeringDefaultValueModal
                show={showModal}
                setShow={setShowModal}
                edit={edit}
                title="Set Default Value"
                subtitle="Fill in the chassis engineering default values below"
                loading={addLoader}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                form={form}
                errors={errors}
                handleChange={handleChange}
                inputData={inputData}
            />
        </>
    );
};

export default SetDefaultValue;