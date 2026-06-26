import  { useEffect, useState } from "react";
import Modal from "../../../../components/modal";
import { SelectInput, TextArea, TextInput } from "../../../../components/inputs";

/* =====================================================
   PRODUCT MASTER FORM MODAL COMPONENT

   This component contains only Add / Update modal logic:
   - Form state
   - Validation
   - Dynamic schema field rendering
   - Select/Text/Textarea handling
   - Payload conversion before submit

   Parent component will still handle:
   - Product list
   - Search
   - Refresh
   - Pagination
   - Delete
   - API create/update action
===================================================== */

type ProductMasterFormModalProps = {
  show: boolean;
  setShow: (value: boolean) => void;
  editingProduct: any;
  productMasterSchemaFields: any[];
  schemaLoading: boolean;
  units: any[];
  onSubmit: (payload: any) => Promise<void>;
};

const ProductMasterFormModal = ({
  show,
  setShow,
  editingProduct,
  productMasterSchemaFields,
  schemaLoading,
  units,
  onSubmit,
}: ProductMasterFormModalProps) => {
  /* ================= FORM STATE ================= */
  const [form, setForm] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  /* =====================================================
     BUILD EMPTY FORM FROM DYNAMIC SCHEMA FIELDS

     Example:
     fields = [{ key: "productName" }, { key: "productType" }]
     output = { productName: "", productType: "" }
  ===================================================== */
  const buildEmptyForm = (fields: any[] = []) => {
    return fields.reduce((acc: any, field: any) => {
      acc[field.key] = "";
      return acc;
    }, {});
  };

  /* =====================================================
     GET DISPLAY TEXT FROM DIFFERENT VALUE TYPES

     This is used for dropdown labels like unitName/name/label/en etc.
  ===================================================== */
  const getTextValue = (value: any) => {
    if (!value) return "";
	  if (typeof value === "string" || typeof value === "number") { return String(value); }
    if (typeof value === "object") {
      return (
        value.en ||
        value.name ||
        value.label ||
        value.unitName ||
        value.code ||
        Object.values(value).find((v) => typeof v === "string") ||
        ""
      );
	}
    return "";
  };

  /* =====================================================
     NORMALIZE PRODUCT TYPE

     Handles values coming from API like:
     rawmaterial -> Raw Material
     finishedgoods -> Finished Goods
  ===================================================== */
  const normalizeProductType = (value = "") => {
    const map: any = {
      rawmaterial: "Raw Material",
      finishedgoods: "Finished Goods",
      serviceproduct: "Service Product",
      nonstockproduct: "Non Stock Product",
      nonstocks: "Non Stock Product",
      intermediaryproduct: "Intermediary Product",
    };

    const normalizedKey = String(value).toLowerCase().replace(/\s/g, "");
    return map[normalizedKey] || value;
  };

  /* =====================================================
     GET COMPARABLE VALUE FOR EDIT MODE

     This keeps edit functionality same as your previous code:
     - productType gets normalized
     - unit object gets converted into unitCode/code/value/_id
     - number fields remain number
  ===================================================== */
  const getComparableValue = (field: any, product: any) => {
    const key = field.key;
    const value = product?.[key];

    if (key === "productType") {
      return normalizeProductType(value || "");
    }

    if (key === "unit") {
      if (typeof value === "object") {
        return (
          value?.unitCode ||
          value?.code ||
          value?.value ||
          value?._id ||
          ""
        );
      }

      return value || "";
    }

    if (field.type === "number") {
      return value === undefined || value === null || value === ""
        ? ""
        : Number(value);
    }

    return value ?? "";
  };

  /* =====================================================
     GET OPTIONS FOR SELECT INPUT

     Handles:
     - unitMeasurement reference from unit master
     - productType options
     - normal static options
  ===================================================== */
  const getFieldOptions = (field: any) => {
    if (field.ref === "unitMeasurement") {
      return (
        units?.map((item: any) => {
          const value =
            item?.[field.valueField] || item?.unitCode || item?.code || "";

          const label =
            item?.[field.labelField] ||
            item?.unitName ||
            item?.name ||
            value;

          return {
            value,
            label: getTextValue(label),
          };
        }) || []
      );
    }

    if (field.key === "productType") {
      return (field.options || []).map((opt: any) => {
        const label =
          typeof opt === "object" ? opt.label || opt.name || opt.value : opt;

        return {
          value: label,
          label,
        };
      });
    }

    return (field.options || []).map((opt: any) => {
      if (typeof opt === "object") {
        return {
          value: opt.value || opt.code || opt.name || "",
          label: opt.label || opt.name || opt.value || "",
        };
      }

      return {
        value: opt,
        label: opt,
      };
    });
  };

  /* =====================================================
     SET FORM DATA WHEN MODAL OPENS

     Add Mode:
     - Creates blank form

     Edit Mode:
     - Fills form with selected product data
  ===================================================== */
  useEffect(() => {
    if (!show) return;

    setErrors({});

    const nextForm = buildEmptyForm(productMasterSchemaFields);

    if (editingProduct) {
      productMasterSchemaFields.forEach((field: any) => {
        nextForm[field.key] = getComparableValue(field, editingProduct);
      });
    }

    setForm(nextForm);
  }, [show, editingProduct, productMasterSchemaFields]);

  /* =====================================================
     VALIDATE FORM

     Same validation from your original component:
     - Required fields
     - HSN/SAC code 2/4/6/8 digits
     - Number should not be negative
  ===================================================== */
  const validateForm = () => {
    const e: any = {};

    productMasterSchemaFields.forEach((field: any) => {
      const value = form?.[field.key];

      if (field.isRequired && String(value || "").trim() === "") {
        e[field.key] = `${field.label} required`;
      }

      if (
        field.key === "productHSNCode" &&
        value &&
        !/^\d{2}$|^\d{4}$|^\d{6}$|^\d{8}$/.test(String(value))
      ) {
        e[field.key] =
          "Invalid HSN/SAC code. Allowed: 2, 4, 6, or 8 digit numeric code.";
      }

      if (
        field.type === "number" &&
        value !== "" &&
        value !== null &&
        Number(value) < 0
      ) {
        e[field.key] = `${field.label} cannot be negative`;
      }
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* =====================================================
     COMMON FIELD UPDATE FUNCTION

     Updates form and clears field error
  ===================================================== */
  const updateField = (key: string, value: any) => {
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));

    setErrors((prev: any) => ({
      ...prev,
      [key]: "",
    }));
  };

  /* =====================================================
     RENDER DYNAMIC FIELD BASED ON SCHEMA TYPE

     Supports:
     - select
     - number
     - textarea
     - productHSNCode special numeric validation
     - imageUrl special placeholder
     - normal text input
  ===================================================== */
  const renderSchemaField = (field: any) => {
	  const value = form?.[field.key] ?? "";
    const commonProps = {
      label: field.label,
      mandatory: field.isRequired,
      value,
      placeholder: `Enter ${field.label}`,
      error: errors?.[field.key],
    };

    if (field.type === "select") {
      const options = getFieldOptions(field);

      return (
        <SelectInput
          key={field.key}
          label={field.label}
          mandatory={field.isRequired}
          value={value}
          placeholder={`Select ${field.label}`}
          error={errors?.[field.key]}
          onChange={(e: any) => {
            updateField(field.key, e?.target?.value ?? "");
          }}
          options={[{ value: "", label: `Select ${field.label}` }, ...options]}
        />
      );
    }

    if (field.type === "number") {
      return (
        <TextInput
          key={field.key}
          {...commonProps}
          type="number"
			  onChange={(e: any) => {
				  // if (field?.key == "csgst") updateField("igst", null);
				  // if (field?.key == "igst") updateField("csgst", null);
				  field?.key == "csgst" && console.log({ field })
            updateField(field.key, e.target.value);
          }}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <TextArea
          key={field.key}
          {...commonProps}
          onChange={(e: any) => {
            updateField(field.key, e.target.value);
          }}
        />
      );
    }

    if (field.key === "productHSNCode") {
      return (
        <TextInput
          key={field.key}
          {...commonProps}
          type="text"
          onChange={(e: any) => {
            updateField(
              field.key,
              e.target.value.replace(/\D/g, "").slice(0, 8)
            );
          }}
        />
      );
    }

    if (field.key === "imageUrl") {
      return (
		  <TextInput
			  label={field.label}
			  mandatory={field.isRequired}
			  placeholder={`Enter ${field.label}`}
			  error={errors?.[field.key]}
			  key={field.key}
			  type="file"
			  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
				  const file = e.target.files?.[0];
				  if (!file) return;
				  const reader = new FileReader();
				  reader.onload = () => {
					  const base64 = reader.result as string;
					  updateField(field.key, base64);
				  };
				  reader.readAsDataURL(file);
			  }}
		  />
      );
    }

    return (
      <TextInput
        key={field.key}
        {...commonProps}
        type="text"
			onChange={(e: any) => {
          updateField(field.key, e.target.value);
        }}
      />
    );
  };

  /* =====================================================
     SUBMIT FORM

     Same functionality:
     - Validate first
     - Convert number fields to Number
     - Send payload to parent
     - Parent will decide create/update API
     - API errors are shown inside modal
  ===================================================== */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload: any = { ...form };
    productMasterSchemaFields.forEach((field: any) => {
      if (field.type === "number" && payload[field.key] !== "") {
        payload[field.key] = Number(payload[field.key]);
      }
    });

    try {
      await onSubmit(payload);
      setShow(false);
    } catch (err: any) {
      const apiErrors =
        err?.error ||
        err?.errors ||
        err?.response?.data?.error ||
        err?.response?.data?.errors ||
        {};

      if (apiErrors && typeof apiErrors === "object") {
        setErrors(apiErrors);
      }

      throw err;
    }
  };

  return (
    // @ts-ignore
    <Modal
      {...{
        show,
        setShow,
        handleSubmit,
        state: editingProduct,
        title: "Add New Product",
        body: (
          <>
            {schemaLoading ? (
              <div className="py-6 text-sm text-gray-500">
                Loading product fields...
              </div>
            ) : (
              productMasterSchemaFields.map((field: any) =>
                renderSchemaField(field)
              )
            )}
          </>
        ),
      }}
    />
  );
};

export default ProductMasterFormModal;