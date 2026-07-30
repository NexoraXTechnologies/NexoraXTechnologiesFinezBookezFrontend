import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { CreatableSelectInput, ImageUploadInput, SelectInput, TextArea, TextInput, ToggleInput } from "../../../../components/inputs";
import professionalAxios from "../../../../services/professionalAxios";
import Modal from "../../../../components/modal";

import { getAllUnits } from "../../../../redux/slices/professionalSlice/unitMasterSlice";
import UnitMasterModal from "../UnitMasterModal";


type ProductMasterModalProps = {
  show: boolean;
  setShow: (value: boolean) => void;
  editingProduct?: any;
  onSaved?: (savedProduct: any) => void | Promise<void>;
  title?: string;
  initialProductName?: string;
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

const getProductFromResponse = (response: any) => {
  return (
    response?.data?.data?.product ||
    response?.data?.product ||
    response?.data?.data ||
    response?.data ||
    response?.product ||
    response
  );
};

const getUnitFromResponse = (response: any) => {
  return (
    response?.data?.unit ||
    response?.data?.data?.unit ||
    response?.data?.data ||
    response?.data ||
    response?.unit ||
    response
  );
};

const ProductMasterModal = ({
  show,
  setShow,
  editingProduct = null,
  onSaved,
  title,
  initialProductName = "",
}: ProductMasterModalProps) => {
  const dispatch = useDispatch<any>();

  const {
    units = [],
  } = useSelector(
    (state: any) => state.unitMaster || {}
  );

  const [form, setForm] = useState<
    Record<string, any>
  >({});

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [productMasterSchemaFields, setProductMasterSchemaFields] =
    useState<any[]>([]);

  const [schemaLoading, setSchemaLoading] =
    useState(false);

  const [showUnitModal, setShowUnitModal] =
    useState(false);

  const [unitSearchValue, setUnitSearchValue] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

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

    return !PRODUCT_SYSTEM_FIELD_KEYS.has(
      field?.key
    );
  };

  const buildEmptyForm = (
    fields: any[] = []
  ) => {
    return fields.reduce(
      (
        accumulator: Record<string, any>,
        field: any
      ) => {
        if (field.type === "boolean") {
          accumulator[field.key] = false;
        } else {
          accumulator[field.key] = "";
        }

        return accumulator;
      },
      {}
    );
  };

  const getTextValue = (value: any) => {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
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
          (itemValue) =>
            typeof itemValue ===
            "string"
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
      const normalizedValue = value
        .trim()
        .toLowerCase();

      return (
        normalizedValue === "true" ||
        normalizedValue === "1" ||
        normalizedValue === "yes" ||
        normalizedValue === "active"
      );
    }

    return false;
  };

  const normalizeProductType = (
    value = ""
  ) => {
    const map: Record<string, string> = {
      rawmaterial: "Raw Material",
      finishedgoods: "Finished Goods",
      serviceproduct: "Service Product",
      nonstockproduct: "Non Stock Product",
      nonstocks: "Non Stock Product",
      intermediaryproduct:
        "Intermediary Product",
    };

    const normalizedKey = String(value)
      .toLowerCase()
      .replace(/\s/g, "");

    return map[normalizedKey] || value;
  };

  const getComparableValue = (
    field: any,
    product: any
  ) => {
    const key = field.key;

    const hasTopLevelValue =
      Object.prototype.hasOwnProperty.call(
        product || {},
        key
      );

    const hasDynamicValue =
      Object.prototype.hasOwnProperty.call(
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
      return normalizeProductType(
        value || ""
      );
    }

    if (key === "unit") {
      if (
        typeof value === "object" &&
        value !== null
      ) {
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

  const loadProductSchema = async () => {
    setSchemaLoading(true);

    try {
      const response =
        await professionalAxios.get(
          "/eTaxSolnMongoApiBackend/users/masters/productMaster/schema/getAll",
          {
            params: {
              offset: 0,
              limit: 50,
            },
          }
        );

      const data =
        response?.data?.data || {};

      const fields =
        data?.fields ||
        data?.items ||
        data?.schema?.fields ||
        [];

      setProductMasterSchemaFields(
        Array.isArray(fields) ? fields : []
      );
    } catch (error: any) {
      setProductMasterSchemaFields([]);

      toast.error(
        error?.response?.data?.message ||
        "Failed to load product fields"
      );
    } finally {
      setSchemaLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      await dispatch(
        getAllUnits({
          offset: 0,
          limit: 1000,
          search: "",
        }) as any
      ).unwrap();
    } catch (error) {
      console.log(
        "Failed to load units",
        error
      );
    }
  };

  useEffect(() => {
    if (!show) {
      setShowUnitModal(false);
      setUnitSearchValue("");
      return;
    }

    loadProductSchema();
    loadUnits();
  }, [show]);

  useEffect(() => {
    if (
      !show ||
      productMasterSchemaFields.length === 0
    ) {
      return;
    }

    setErrors({});

    const nextForm = buildEmptyForm(
      productMasterSchemaFields
    );

    if (editingProduct) {
      productMasterSchemaFields.forEach(
        (field: any) => {
          nextForm[field.key] =
            getComparableValue(
              field,
              editingProduct
            );
        }
      );
    } else if (initialProductName) {
      const productNameField =
        productMasterSchemaFields.find(
          (field: any) =>
            field.key === "productName"
        );

      if (productNameField) {
        nextForm.productName =
          initialProductName;
      }
    }

    setForm(nextForm);
  }, [
    show,
    editingProduct,
    productMasterSchemaFields,
    initialProductName,
  ]);


  const fieldOptionsMap = useMemo(() => {
    const map: Record<string, any[]> = {};

    productMasterSchemaFields.forEach(
      (field: any) => {
        if (field.type !== "select") {
          return;
        }

        if (
          field.ref ===
          "unitMeasurement" ||
          field.key === "unit"
        ) {
          map[field.key] =
            units?.map((item: any) => {
              const value =
                item?.[
                field.valueField
                ] ||
                item?.unitCode ||
                item?.code ||
                "";

              const label =
                item?.[
                field.labelField
                ] ||
                item?.unitName ||
                item?.name ||
                value;

              return {
                value,
                label:
                  getTextValue(label),
              };
            }) || [];

          return;
        }

        if (
          field.key ===
          "productType"
        ) {
          map[field.key] = (
            field.options || []
          ).map((option: any) => {
            const label =
              typeof option ===
                "object"
                ? option.label ||
                option.name ||
                option.value
                : option;

            return {
              value: label,
              label,
            };
          });

          return;
        }

        map[field.key] = (
          field.options || []
        ).map((option: any) => {
          if (
            typeof option === "object"
          ) {
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
      }
    );

    return map;
  }, [
    productMasterSchemaFields,
    units,
  ]);

  const validateForm = () => {
    const validationErrors: Record<
      string,
      string
    > = {};

    productMasterSchemaFields.forEach(
      (field: any) => {
        const value = form?.[field.key];

        if (
          field.isRequired ||
          field.required
        ) {
          if (field.type === "boolean") {
            if (
              value === undefined ||
              value === null
            ) {
              validationErrors[
                field.key
              ] =
                `${field.label} required`;
            }
          } else if (
            value === undefined ||
            value === null ||
            String(value).trim() === ""
          ) {
            validationErrors[
              field.key
            ] =
              `${field.label} required`;
          }
        }

        if (
          field.key ===
          "productHSNCode" &&
          value &&
          !/^(?:\d{2}|\d{4}|\d{6}|\d{8})$/.test(
            String(value)
          )
        ) {
          validationErrors[
            field.key
          ] =
            "Invalid HSN/SAC code. Allowed: 2, 4, 6, or 8 digit numeric code.";
        }

        if (
          field.type === "number" &&
          value !== "" &&
          value !== null &&
          value !== undefined &&
          Number(value) < 0
        ) {
          validationErrors[
            field.key
          ] =
            `${field.label} cannot be negative`;
        }

        if (
          field.type === "number" &&
          value !== "" &&
          value !== null &&
          value !== undefined &&
          Number.isNaN(Number(value))
        ) {
          validationErrors[
            field.key
          ] =
            `${field.label} must be a valid number`;
        }
      }
    );

    setErrors(validationErrors);

    return (
      Object.keys(validationErrors).length ===
      0
    );
  };

  const updateField = (
    key: string,
    value: any
  ) => {
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
      mandatory:
        field.isRequired || field.required,
      value,
      placeholder: `Enter ${field.label}`,
      error: errors?.[field.key],
      disabled:
        field?.disabled ||
        field?.isReadonly ||
        submitting,
    };

    if (field.type === "select") {
      const isUnitField =
        field.ref === "unitMeasurement" ||
        field.key === "unit";

      if (isUnitField) {
        return (
          <CreatableSelectInput
            key={field.key}
            name={field.key}
            label={field.label}
            mandatory={
              field.isRequired ||
              field.required
            }
            value={value}
            placeholder={`Select ${field.label}`}
            error={errors?.[field.key]}
            largeData={true}
            disabled={
              field?.disabled ||
              field?.isReadonly ||
              submitting
            }
            options={
              fieldOptionsMap[field.key] ||
              []
            }
            showCreateOnEmpty={true}

            // Keep dropdown inside Product modal.
            useMenuPortal={false}

            createOptionLabel={(
              searchValue: string
            ) =>
              searchValue
                ? `+ Add "${searchValue}" as New Unit`
                : "+ Add New Unit"
            }

            onCreateOption={(
              searchValue: string
            ) => {
              setUnitSearchValue(
                searchValue
              );

              setShowUnitModal(
                true
              );
            }}

            onChange={(
              event: any
            ) => {
              updateField(
                field.key,
                event?.target
                  ?.value ?? ""
              );
            }}
          />
        );
      }

      return (
        <SelectInput
          key={field.key}
          name={field.key}
          label={field.label}
          mandatory={
            field.isRequired ||
            field.required
          }
          value={value}
          placeholder={`Select ${field.label}`}
          error={errors?.[field.key]}
          styles={{
            menuPortal: (base: any) => ({
              ...base,
              zIndex: 2147483647,
            }),

            menu: (base: any) => ({
              ...base,
              zIndex: 2147483647,
            }),
          }}
          largeData={true}
          disabled={
            field?.disabled ||
            field?.isReadonly ||
            submitting
          }
          options={
            fieldOptionsMap[field.key] ||
            []
          }
          onChange={(event: any) => {
            updateField(
              field.key,
              event?.target?.value ?? ""
            );
          }}
        />
      );
    }

    if (field.type === "boolean") {
      return (
        <ToggleInput
          key={field.key}
          label={field.label}
          name={field.key}
          value={getBooleanValue(
            form?.[field.key]
          )}
          checked={getBooleanValue(
            form?.[field.key]
          )}
          mandatory={
            field?.isRequired ||
            field?.required
          }
          disabled={
            field?.disabled ||
            field?.isReadonly ||
            submitting
          }
          error={errors?.[field.key]}
          onChange={(event: any) => {
            updateField(
              field.key,
              event.target.checked
            );
          }}
        />
      );
    }

    if (field.type === "number") {
      return (
        <TextInput
          key={field.key}
          {...commonProps}
          type="number"
          onChange={(event: any) => {
            updateField(
              field.key,
              event.target.value
            );
          }}
        />
      );
    }

    if (field.type === "textarea") {
      return (
        <TextArea
          key={field.key}
          {...commonProps}
          onChange={(event: any) => {
            updateField(
              field.key,
              event.target.value
            );
          }}
        />
      );
    }

    if (
      field.key === "productHSNCode"
    ) {
      return (
        <TextInput
          key={field.key}
          {...commonProps}
          type="text"
          onChange={(event: any) => {
            const numericValue =
              event.target.value
                .replace(/\D/g, "")
                .slice(0, 8);

            updateField(
              field.key,
              numericValue
            );
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
          mandatory={
            field.isRequired ||
            field.required
          }
          value={value}
          error={errors?.[field.key]}
          placeholder={`Click to upload ${field.label}`}
          alt={field.label}
          onChange={(
            base64: string | null
          ) => {
            updateField(
              field.key,
              base64 || ""
            );
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
          updateField(
            field.key,
            event.target.value
          );
        }}
      />
    );
  };

  const handleUnitSaved = async (
    response: any
  ) => {
    const savedUnit =
      getUnitFromResponse(response);

    await loadUnits();

    const unitCode =
      savedUnit?.unitCode ||
      savedUnit?.code ||
      savedUnit?.unitId ||
      savedUnit?.value ||
      "";

    if (unitCode) {
      setForm((previousForm) => ({
        ...previousForm,
        unit: unitCode,
      }));

      setErrors((previousErrors) => ({
        ...previousErrors,
        unit: "",
      }));
    }

    setShowUnitModal(false);
    setUnitSearchValue("");
  };

  const handleSubmit = async () => {
    if (
      submitting ||
      !validateForm()
    ) {
      return;
    }

    const payload: Record<string, any> = {};

    const dynamicFields: Record<string, any> = {
      ...(editingProduct?.dynamicFields || {}),
    };

    productMasterSchemaFields.forEach(
      (field: any) => {
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
      }
    );

    payload.dynamicFields = dynamicFields;

    setSubmitting(true);

    try {
      let response: any;

      if (editingProduct?.productCode) {
        response =
          await professionalAxios.put(
            `/eTaxSolnMongoApiBackend/productMaster/updateProduct/${editingProduct.productCode}`,
            payload
          );

        toast.success(
          "Product updated successfully"
        );
      } else {
        response =
          await professionalAxios.post(
            "/eTaxSolnMongoApiBackend/productMaster/createProduct",
            payload
          );

        toast.success(
          "Product created successfully"
        );
      }

      const savedProduct =
        getProductFromResponse(response) ||
        payload;

      if (onSaved) {
        await onSaved(savedProduct);
      }

      setShow(false);
      setErrors({});
      setForm(
        buildEmptyForm(
          productMasterSchemaFields
        )
      );
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

      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Product operation failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const modalBody = useMemo(() => {
    if (schemaLoading) {
      return (
        <div className="py-6 text-sm text-muted-foreground">
          Loading product fields...
        </div>
      );
    }

    if (
      productMasterSchemaFields.length === 0
    ) {
      return (
        <div className="py-6 text-sm text-muted-foreground">
          Product Master schema fields not found.
        </div>
      );
    }

    return (
      <>
        {productMasterSchemaFields.map(
          (field: any) =>
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
    submitting,
  ]);

  if (
    (!show && !showUnitModal) ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    <>
      {show && (
        <div className="fixed inset-0 z-[2147483000] isolate pointer-events-none">
          <div className="pointer-events-auto">
            <Modal
              show={show}
              setShow={setShow}
              handleSubmit={handleSubmit}
              state={editingProduct}
              title={
                title ||
                (editingProduct
                  ? "Update Product"
                  : "Add New Product")
              }
              body={modalBody}
            />
          </div>
        </div>
      )}

      <UnitMasterModal
        show={showUnitModal}
        setShow={(value: boolean) => {
          setShowUnitModal(value);

          if (!value) {
            setUnitSearchValue("");
          }
        }}
        onSaved={handleUnitSaved}
        title="Add Unit for Product"
        initialSearchValue={
          unitSearchValue
        }
      />
    </>,
    document.body
  );
};

export default ProductMasterModal;