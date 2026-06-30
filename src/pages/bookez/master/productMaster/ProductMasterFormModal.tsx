import { useEffect, useMemo, useState } from "react";
import Modal from "../../../../components/modal";
import { SelectInput, TextArea, TextInput } from "../../../../components/inputs";

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

const ProductMasterFormModal = ({
  show,
  setShow,
  editingProduct,
  productMasterSchemaFields,
  schemaLoading,
  units,
  onSubmit,
}: ProductMasterFormModalProps) => {
  const [form, setForm] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  const buildEmptyForm = (fields: any[] = []) => {
    return fields.reduce((acc: any, field: any) => {
      acc[field.key] = "";
      return acc;
    }, {});
  };

  const getTextValue = (value: any) => {
    if (!value) return "";

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
        Object.values(value).find((v) => typeof v === "string") ||
        ""
      );
    }

    return "";
  };

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

  const fieldOptionsMap = useMemo(() => {
    const map: any = {};

    productMasterSchemaFields.forEach((field: any) => {
      if (field.type !== "select") return;

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
        map[field.key] = (field.options || []).map((opt: any) => {
          const label =
            typeof opt === "object"
              ? opt.label || opt.name || opt.value
              : opt;

          return {
            value: label,
            label,
          };
        });

        return;
      }

      map[field.key] = (field.options || []).map((opt: any) => {
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
    });

    return map;
  }, [productMasterSchemaFields, units]);

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
      return (
        <SelectInput
          key={field.key}
          name={field.key}
          label={field.label}
          mandatory={field.isRequired}
          value={value}
          placeholder={`Select ${field.label}`}
          error={errors?.[field.key]}
          largeData={true}
          onChange={(e: any) => {
            updateField(field.key, e?.target?.value ?? "");
          }}
          options={fieldOptionsMap[field.key] || []}
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
          key={field.key}
          label={field.label}
          mandatory={field.isRequired}
          placeholder={`Enter ${field.label}`}
          error={errors?.[field.key]}
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
  }, [schemaLoading, productMasterSchemaFields, form, errors, fieldOptionsMap]);

  return (
    // @ts-ignore
    <Modal
      {...{
        show,
        setShow,
        handleSubmit,
        state: editingProduct,
        title: editingProduct ? "Update Product" : "Add New Product",
        body: modalBody,
      }}
    />
  );
};

export default ProductMasterFormModal;