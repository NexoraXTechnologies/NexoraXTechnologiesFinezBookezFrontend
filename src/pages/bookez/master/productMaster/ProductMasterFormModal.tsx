import { useEffect, useMemo, useState } from "react";
import Modal from "../../../../components/modal";
import { ImageUploadInput, SelectInput, TextArea, TextInput, ToggleInput } from "../../../../components/inputs";

/* =====================================================
   PRODUCT MASTER FORM MODAL COMPONENT
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

const PRODUCT_SYSTEM_FIELD_KEYS = new Set([
  "productCode",
  "productHSNCode",
  "productType",
  "productName",
  "productDescription",
  "sellingPrice",
  "purchasePrice",
  "unit",
  "csgst",
  "igst",
  "imageUrl",
]);

const ProductMasterFormModal = ({
  show,
  setShow,
  editingProduct,
  productMasterSchemaFields,
  schemaLoading,
  units,
  onSubmit,
}: ProductMasterFormModalProps) => {
  const [form, setForm] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDynamicSchemaField = (field: any) => {

    if (field?.isDynamic === true) return true;
    if (field?.isDynamicField === true) return true;
    if (field?.isCustomField === true) return true;

    if (field?.source === "dynamic") return true;
    if (field?.fieldSource === "dynamic") return true;
    if (field?.isDynamic === false) return false;
    if (field?.isSystemField === true) return false;
    if (field?.isDefault === true) return false; 
    if (field?.isDefault === false) return true;
    return !PRODUCT_SYSTEM_FIELD_KEYS.has(field?.key);
  };

  const buildEmptyForm = (fields: any[] = []) => {
    return fields.reduce((acc: Record<string, any>, field: any) => {
      if (field.type === "boolean") {
        acc[field.key] = false;
      } else {
        acc[field.key] = "";
      }

      return acc;
    }, {});
  };

  const getTextValue = (value: any) => {
    if (value === undefined || value === null) {
      return "";
    }

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    if (typeof value === "object") {
      return (
        value.en ||
        value.name ||
        value.label ||
        value.unitName ||
        value.code ||
        Object.values(value).find(
          (itemValue) => typeof itemValue === "string"
        ) ||
        ""
      );
    }

    return "";
  };

  const getBooleanValue = (value: any) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value === 1;
    }

    if (typeof value === "string") {
      const normalizedValue = value.trim().toLowerCase();

      return (
        normalizedValue === "true" ||
        normalizedValue === "1" ||
        normalizedValue === "yes" ||
        normalizedValue === "active"
      );
    }

    return false;
  };

  const normalizeProductType = (value = "") => {
    const map: Record<string, string> = {
      rawmaterial: "Raw Material",
      finishedgoods: "Finished Goods",
      serviceproduct: "Service Product",
      nonstockproduct: "Non Stock Product",
      nonstocks: "Non Stock Product",
      intermediaryproduct: "Intermediary Product",
    };

    const normalizedKey = String(value)
      .toLowerCase()
      .replace(/\s/g, "");

    return map[normalizedKey] || value;
  };

  const getComparableValue = (field: any, product: any) => {
    const key = field.key;

    const hasTopLevelValue = Object.prototype.hasOwnProperty.call(
      product || {},
      key
    );

    const hasDynamicValue = Object.prototype.hasOwnProperty.call(
      product?.dynamicFields || {},
      key
    );

    let value: any = "";

    if (hasTopLevelValue) {
      value = product?.[key];
    } else if (hasDynamicValue) {
      value = product?.dynamicFields?.[key];
    }

    if (key === "productType") {
      return normalizeProductType(value || "");
    }

    if (key === "unit") {
      if (typeof value === "object" && value !== null) {
        return (
          value?.unitCode ||
          value?.code ||
          value?.value ||
          value?._id ||
          ""
        );
      }

      return value ?? "";
    }

    if (field.type === "number") {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return "";
      }

      return Number(value);
    }

    if (field.type === "boolean") {
      return getBooleanValue(value);
    }

    return value ?? "";
  };

  const fieldOptionsMap = useMemo(() => {
    const map: Record<string, any[]> = {};

    productMasterSchemaFields.forEach((field: any) => {
      if (field.type !== "select") {
        return;
      }

      if (field.ref === "unitMeasurement") {
        map[field.key] =
          units?.map((item: any) => {
            const value =
              item?.[field.valueField] ||
              item?.unitCode ||
              item?.code ||
              "";

            const label =
              item?.[field.labelField] ||
              item?.unitName ||
              item?.name ||
              value;

            return {
              value,
              label: getTextValue(label),
            };
          }) || [];

        return;
      }

      if (field.key === "productType") {
        map[field.key] = (field.options || []).map((option: any) => {
          const label =
            typeof option === "object"
              ? option.label || option.name || option.value
              : option;

          return {
            value: label,
            label,
          };
        });

        return;
      }

      map[field.key] = (field.options || []).map((option: any) => {
        if (typeof option === "object") {
          return {
            value:
              option.value ||
              option.code ||
              option.name ||
              "",
            label:
              option.label ||
              option.name ||
              option.value ||
              "",
          };
        }

        return {
          value: option,
          label: option,
        };
      });
    });

    return map;
  }, [productMasterSchemaFields, units]);

  useEffect(() => {
    if (!show) {
      return;
    }

    setErrors({});

    const nextForm = buildEmptyForm(productMasterSchemaFields);

    if (editingProduct) {
      productMasterSchemaFields.forEach((field: any) => {
        nextForm[field.key] = getComparableValue(
          field,
          editingProduct
        );
      });
    }

    setForm(nextForm);
  }, [show, editingProduct, productMasterSchemaFields]);

  const validateForm = () => {
    const validationErrors: Record<string, string> = {};

    productMasterSchemaFields.forEach((field: any) => {
      const value = form?.[field.key];

      if (field.isRequired || field.required) {
        if (field.type === "boolean") {
          if (value === undefined || value === null) {
            validationErrors[field.key] =
              `${field.label} required`;
          }
        } else if (
          value === undefined ||
          value === null ||
          String(value).trim() === ""
        ) {
          validationErrors[field.key] =
            `${field.label} required`;
        }
      }

      if (
        field.key === "productHSNCode" &&
        value &&
        !/^(?:\d{2}|\d{4}|\d{6}|\d{8})$/.test(String(value))
      ) {
        validationErrors[field.key] =
          "Invalid HSN/SAC code. Allowed: 2, 4, 6, or 8 digit numeric code.";
      }

      if (
        field.type === "number" &&
        value !== "" &&
        value !== null &&
        value !== undefined &&
        Number(value) < 0
      ) {
        validationErrors[field.key] =
          `${field.label} cannot be negative`;
      }

      if (
        field.type === "number" &&
        value !== "" &&
        value !== null &&
        value !== undefined &&
        Number.isNaN(Number(value))
      ) {
        validationErrors[field.key] =
          `${field.label} must be a valid number`;
      }
    });

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const updateField = (key: string, value: any) => {
    setForm((previousForm) => ({
      ...previousForm,
      [key]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [key]: "",
    }));
  };

  const renderSchemaField = (field: any) => {
    const value = form?.[field.key] ?? "";

    const commonProps = {
      label: field.label,
      mandatory: field.isRequired || field.required,
      value,
      placeholder: `Enter ${field.label}`,
      error: errors?.[field.key],
      disabled: field?.disabled || field?.isReadonly,
    };

    /*
      Select Field
    */
    if (field.type === "select") {
      return (
        <SelectInput
          key={field.key}
          name={field.key}
          label={field.label}
          mandatory={field.isRequired || field.required}
          value={value}
          placeholder={`Select ${field.label}`}
          error={errors?.[field.key]}
          largeData={true}
          disabled={field?.disabled || field?.isReadonly}
          options={fieldOptionsMap[field.key] || []}
          onChange={(event: any) => {
            updateField(
              field.key,
              event?.target?.value ?? ""
            );
          }}
        />
      );
    }

    /*
      Boolean/Toggle Field
    */
    if (field.type === "boolean") {
      return (
        <ToggleInput
          key={field.key}
          label={field.label}
          name={field.key}
          value={getBooleanValue(form?.[field.key])}
          checked={getBooleanValue(form?.[field.key])}
          mandatory={field?.isRequired || field?.required}
          disabled={field?.disabled || field?.isReadonly}
          error={errors?.[field.key]}
          onChange={(event: any) => {
            const checkedValue = event.target.checked;

            if (field?.onChange) {
              field.onChange(checkedValue);
              return;
            }

            updateField(field.key, checkedValue);
          }}
        />
      );
    }

    /*
      Number Field
    */
    if (field.type === "number") {
      return (
        <TextInput
          key={field.key}
          {...commonProps}
          type="number"
          onChange={(event: any) => {
            updateField(field.key, event.target.value);
          }}
        />
      );
    }

    /*
      Text Area
    */
    if (field.type === "textarea") {
      return (
        <TextArea
          key={field.key}
          {...commonProps}
          onChange={(event: any) => {
            updateField(field.key, event.target.value);
          }}
        />
      );
    }

    /*
      HSN/SAC Field
    */
    if (field.key === "productHSNCode") {
      return (
        <TextInput
          key={field.key}
          {...commonProps}
          type="text"
          onChange={(event: any) => {
            const numericValue = event.target.value
              .replace(/\D/g, "")
              .slice(0, 8);

            updateField(field.key, numericValue);
          }}
        />
      );
    }

    if (
      field.key === "imageUrl" ||
      field.type === "image" ||
      field.type === "imageUpload"
    ) {
      return (
        <ImageUploadInput
          key={field.key}
          className="sm:col-span-1"
          label={field.label}
          mandatory={field.isRequired || field.required}
          value={value}
          error={errors?.[field.key]}
          placeholder={`Click to upload ${field.label}`}
          alt={field.label}
          onChange={(base64: string | null) => {
            updateField(field.key, base64 || "");
          }}
        />
      );
    }

    return (
      <TextInput
        key={field.key}
        {...commonProps}
        type="text"
        onChange={(event: any) => {
          updateField(field.key, event.target.value);
        }}
      />
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const payload: Record<string, any> = {};

    const dynamicFields: Record<string, any> = {
      ...(editingProduct?.dynamicFields || {}),
    };

    productMasterSchemaFields.forEach((field: any) => {
      let value = form?.[field.key];
      if (
        field.type === "number" &&
        value !== "" &&
        value !== null &&
        value !== undefined
      ) {
        value = Number(value);
      }

      if (field.type === "boolean") {
        value = getBooleanValue(value);
      }

      if (isDynamicSchemaField(field)) {
        dynamicFields[field.key] = value;
      } else {
        payload[field.key] = value;
      }
    });

    payload.dynamicFields = dynamicFields;

    try {
      await onSubmit(payload);
      setShow(false);
    } catch (error: any) {
      const apiErrors =
        error?.error ||
        error?.errors ||
        error?.response?.data?.error ||
        error?.response?.data?.errors ||
        {};

      if (
        apiErrors &&
        typeof apiErrors === "object" &&
        !Array.isArray(apiErrors)
      ) {
        setErrors(apiErrors);
      }

      throw error;
    }
  };
  const modalBody = useMemo(() => {
    if (schemaLoading) {
      return (
        <div className="py-6 text-sm text-gray-500">
          Loading product fields...
        </div>
      );
    }

    return (
      <>
        {productMasterSchemaFields.map((field: any) =>
          renderSchemaField(field)
        )}
      </>
    );
  }, [
    schemaLoading,
    productMasterSchemaFields,
    form,
    errors,
    fieldOptionsMap,
  ]);

  return (
    // @ts-ignore
    <Modal
      show={show}
      setShow={setShow}
      handleSubmit={handleSubmit}
      state={editingProduct}
      title={
        editingProduct
          ? "Update Product"
          : "Add New Product"
      }
      body={modalBody}
    />
  );
};

export default ProductMasterFormModal;