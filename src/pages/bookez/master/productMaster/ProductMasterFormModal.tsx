import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { CreatableSelectInput, ImageUploadInput, SelectInput, TextArea, TextInput, ToggleInput } from "../../../../components/inputs";
import professionalAxios from "../../../../services/professionalAxios";
import Modal from "../../../../components/modal";
import { getAllUnits } from "../../../../redux/slices/professionalSlice/unitMasterSlice";
import UnitMasterModal from "../UnitMasterModal";
import { getAllProducts } from "../../../../redux/slices/professionalSlice/productMasterSlice";

type ProductMasterModalProps = {
  show: boolean;
  setShow: (value: boolean) => void;
  editingProduct?: any;
  onSaved?: (savedProduct: any) => void | Promise<void>;
  title?: string;
  initialProductName?: string;
};

type ReferenceOption = {
  label: string;
  value: string;
  raw: any;
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

const CODE_NAME_REFERENCE_FIELD_TYPES = new Set([
  "productmaster",
  "unitmaster",
  "accountmaster",
  "custommaster",
]);

const STATE_CITY_REFERENCE_FIELD_TYPES = new Set([
  "statemaster",
  "citymaster",
]);

const EMPLOYEE_REFERENCE_FIELD_TYPES = new Set([
  "employeemaster",
  "customemployeemaster",
  "teamemployeemaster",
]);

const MASTER_REFERENCE_FIELD_TYPES = new Set([
  ...CODE_NAME_REFERENCE_FIELD_TYPES,
  ...STATE_CITY_REFERENCE_FIELD_TYPES,
  ...EMPLOYEE_REFERENCE_FIELD_TYPES,
]);

const getDataSource = (field: any) => {
  const source = field?.dataSource;

  if (source && typeof source === "object") return source;

  if (typeof source === "string") {
    const trimmed = source.trim();

    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === "object"
        ? parsed
        : { api: trimmed };
    } catch {
      return { api: trimmed };
    }
  }

  return {};
};

const getFieldType = (field: any) => {
  const dataSource = getDataSource(field);

  return String(
    field?.type ||
    dataSource?.type ||
    ""
  )
    .trim()
    .toLowerCase();
};

const isMasterReferenceField = (field: any) => {
  return MASTER_REFERENCE_FIELD_TYPES.has(
    getFieldType(field)
  );
};

const getTextValue = (value: any): string => {
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
    const possibleValue =
      value?.en ||
      value?.name ||
      value?.label ||
      value?.productName ||
      value?.unitName ||
      value?.accountName ||
      value?.cityName ||
      value?.stateName ||
      value?.code ||
      "";

    if (typeof possibleValue === "object") {
      return getTextValue(possibleValue);
    }

    if (possibleValue) {
      return String(possibleValue);
    }

    const firstTextValue =
      Object.values(value).find(
        (itemValue) =>
          typeof itemValue === "string"
      );

    return firstTextValue
      ? String(firstTextValue)
      : "";
  }

  return "";
};

/* =====================================================
   BOOLEAN
===================================================== */

const getBooleanValue = (value: any) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalizedValue =
    String(value ?? "")
      .trim()
      .toLowerCase();

  return [
    "true",
    "1",
    "yes",
    "active",
  ].includes(normalizedValue);
};

/* =====================================================
   PRODUCT TYPE
===================================================== */

const normalizeProductType = (
  value = ""
) => {
  const map: Record<string, string> = {
    rawmaterial: "Raw Material",
    finishedgoods: "Finished Goods",
    serviceproduct: "Service Product",
    nonstockproduct: "Non Stock Product",
    nonstocks: "Non Stock Product",
    intermediaryproduct: "Intermediary Product",
  };

  const normalizedKey =
    String(value)
      .toLowerCase()
      .replace(/\s/g, "");

  return (
    map[normalizedKey] ||
    value
  );
};

/* =====================================================
   isDefault HELPERS
===================================================== */

const isSchemaDefaultFalse = (
  field: any
) => {
  const value =
    field?.isDefault;

  if (
    value === false ||
    value === 0 ||
    value === "0"
  ) {
    return true;
  }

  return (
    typeof value === "string" &&
    value.trim().toLowerCase() ===
    "false"
  );
};

const isSchemaDefaultTrue = (
  field: any
) => {
  const value = field?.isDefault;

  if (
    value === true ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  return (
    typeof value === "string" &&
    value.trim().toLowerCase() ===
    "true"
  );
};

/* =====================================================
   DYNAMIC FIELD
===================================================== */

const isDynamicSchemaField = (
  field: any
) => {
  if (
    isMasterReferenceField(field)
  ) {
    return true;
  }

  if (
    isSchemaDefaultFalse(field)
  ) {
    return true;
  }

  if (
    field?.isDynamic === true
  ) {
    return true;
  }

  if (
    field?.isDynamicField === true
  ) {
    return true;
  }

  if (
    field?.isCustomField === true
  ) {
    return true;
  }

  if (
    field?.source === "dynamic"
  ) {
    return true;
  }

  if (
    field?.fieldSource === "dynamic"
  ) {
    return true;
  }

  if (
    isSchemaDefaultTrue(field)
  ) {
    return false;
  }

  if (
    field?.isDynamic === false
  ) {
    return false;
  }

  if (
    field?.isSystemField === true
  ) {
    return false;
  }

  return !PRODUCT_SYSTEM_FIELD_KEYS.has(
    field?.key
  );
};

/* =====================================================
   EMPTY FORM
===================================================== */

const buildEmptyForm = (
  fields: any[] = []
) => {
  return (
    Array.isArray(fields)
      ? fields
      : []
  ).reduce(
    (
      accumulator: Record<string, any>,
      field: any
    ) => {
      const fieldType =
        getFieldType(field);

      if (
        fieldType === "boolean"
      ) {
        accumulator[field.key] =
          false;
      } else if (
        isMasterReferenceField(field)
      ) {
        accumulator[field.key] =
          null;
      } else {
        accumulator[field.key] =
          "";
      }

      return accumulator;
    },
    {}
  );
};

/* =====================================================
   API RECORDS
===================================================== */

const extractGenericRecords = (
  responseData: any
): any[] => {
  const possibleRoots = [
    responseData,
    responseData?.data,
    responseData?.result,
    responseData?.payload,
    responseData?.data?.data,
  ];

  const possibleKeys = [
    "items",
    "records",
    "products",
    "units",
    "accounts",
    "users",
    "states",
    "cities",
    "hsn",
    "hsnCodes",
    "docs",
    "result",
  ];

  for (
    const root of possibleRoots
  ) {
    if (
      Array.isArray(root)
    ) {
      return root;
    }

    if (
      root &&
      typeof root === "object"
    ) {
      for (
        const key of possibleKeys
      ) {
        if (
          Array.isArray(
            root?.[key]
          )
        ) {
          return root[key];
        }
      }
    }
  }

  return [];
};

/* =====================================================
   EMPLOYEE RECORDS
===================================================== */

const extractEmployeeChildUsers = (
  responseData: any
): any[] => {
  const result =
    Array.isArray(
      responseData?.result
    )
      ? responseData.result
      : Array.isArray(
        responseData?.data?.result
      )
        ? responseData.data.result
        : [];

  return result.flatMap(
    (record: any) =>
      Array.isArray(
        record?.ChildUsers
      )
        ? record.ChildUsers
        : []
  );
};

/* =====================================================
   PROFESSIONAL USER
===================================================== */

const getProfessionalUserFromStorage =
  () => {
    try {
      const rawUser =
        localStorage.getItem(
          "professionalUser"
        );

      return rawUser
        ? JSON.parse(rawUser)
        : null;
    } catch (error) {
      console.error(
        "Unable to read professionalUser:",
        error
      );

      return null;
    }
  };

/* =====================================================
   RESOLVE DATASOURCE PLACEHOLDERS
===================================================== */

const resolveDataSourceApi = (
  rawApi: string
) => {
  const storedUser =
    getProfessionalUserFromStorage();

  const userMobileNumberHash =
    String(
      storedUser
        ?.userMobileNumberHash ||
      ""
    ).trim();

  const parentUserMobileNumber =
    String(
      storedUser
        ?.parentUserMobileNumber ||
      userMobileNumberHash ||
      ""
    ).trim();

  let resolvedApi =
    String(
      rawApi || ""
    ).trim();

  if (
    userMobileNumberHash
  ) {
    resolvedApi =
      resolvedApi.replace(
        /\{userMobileNumberHash\}/g,
        encodeURIComponent(
          userMobileNumberHash
        )
      );
  }

  if (
    parentUserMobileNumber
  ) {
    resolvedApi =
      resolvedApi.replace(
        /\{parentUserMobileNumber\}/g,
        encodeURIComponent(
          parentUserMobileNumber
        )
      );
  }

  return resolvedApi;
};

/* =====================================================
   BUILD DATASOURCE URL
===================================================== */

const buildDataSourceRequestUrl = (
  rawApi: string
) => {
  const resolvedApi =
    resolveDataSourceApi(
      rawApi
    );

  if (!resolvedApi) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      resolvedApi
    )
  ) {
    return resolvedApi;
  }
  const backendPrefix = "eTaxSolnMongoApiBackend";
  const axiosBaseUrl = String(professionalAxios?.defaults?.baseURL || "").trim();
  const baseHasBackendPrefix = /\/eTaxSolnMongoApiBackend\/?$/i.test(axiosBaseUrl);
  let relativeApi = resolvedApi.replace(/^\/+/, "").replace(/^SandBox\//i, "");

  if (baseHasBackendPrefix) {
    return relativeApi.replace(
      /^eTaxSolnMongoApiBackend\/?/i,
      ""
    );
  }

  if (!relativeApi.toLowerCase().startsWith(backendPrefix.toLowerCase())) {
    relativeApi = `${backendPrefix}/${relativeApi}`;
  }

  return relativeApi;
};

/* =====================================================
   BUILD REFERENCE OPTION
===================================================== */

const buildReferenceOption = (
  field: any,
  item: any
): ReferenceOption | null => {
  const fieldType =
    getFieldType(field);

  const dataSource = getDataSource(field);

  const dynamicData = item?.data || item?.dynamicFields || item?.customFields || {};
  let optionValue: any = "";
  let optionLabel: any = "";

  /* ============================================
     PRODUCT MASTER
  ============================================ */

  if (fieldType === "productmaster") {
    const valueField =
      field?.valueField ||
      dataSource?.valueField ||
      "productCode";

    const labelField =
      field?.labelField ||
      dataSource?.labelField ||
      "productName";

    optionValue =
      item?.[valueField] ||
      item?.productCode ||
      item?.code ||
      "";

    optionLabel =
      item?.[labelField] ||
      item?.productName ||
      item?.name ||
      optionValue;
  }

  /* ============================================
     UNIT MASTER
  ============================================ */

  else if (
    fieldType ===
    "unitmaster"
  ) {
    const valueField =
      field?.valueField ||
      dataSource?.valueField ||
      "unitCode";

    const labelField =
      field?.labelField ||
      dataSource?.labelField ||
      "unitName";

    optionValue =
      item?.[valueField] ||
      item?.unitCode ||
      item?.code ||
      "";

    optionLabel =
      item?.[labelField] ||
      item?.unitName ||
      item?.name ||
      optionValue;
  }

  /* ============================================
     ACCOUNT MASTER
  ============================================ */

  else if (
    fieldType ===
    "accountmaster"
  ) {
    const valueField =
      field?.valueField ||
      dataSource?.valueField ||
      "accountCode";

    const labelField =
      field?.labelField ||
      dataSource?.labelField ||
      "accountName";

    optionValue =
      item?.[valueField] ||
      item?.accountCode ||
      item?.code ||
      "";

    optionLabel =
      item?.[labelField] ||
      item?.accountName ||
      item?.name ||
      optionValue;
  }

  /* ============================================
     STATE MASTER
  ============================================ */

  else if (
    fieldType ===
    "statemaster"
  ) {
    optionValue =
      item?.stateCode ||
      item?.isoCode ||
      item?.code ||
      item?.value ||
      "";

    optionLabel =
      getTextValue(
        item?.name ||
        item?.stateName ||
        item?.label
      );
  }

  /* ============================================
     CITY MASTER
  ============================================ */

  else if (
    fieldType ===
    "citymaster"
  ) {
    optionLabel =
      getTextValue(
        item?.name ||
        item?.cityName ||
        item?.label
      );

    optionValue =
      optionLabel ||
      item?.code ||
      item?.value ||
      "";
  }

  /* ============================================
     EMPLOYEE MASTER
  ============================================ */

  else if (
    EMPLOYEE_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    optionValue =
      item?.userMobileNumberHash ||
      item?.mobile ||
      "";

    optionLabel = [
      item?.userFirstName,
      item?.userMiddleName,
      item?.userLastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    optionLabel =
      optionLabel ||
      optionValue;
  }

  /* ============================================
     CUSTOM MASTER
  ============================================ */

  else if (
    fieldType ===
    "custommaster"
  ) {
    optionValue =
      dynamicData?.code ||
      item?.code ||
      item?.voucherNumber ||
      item?._id ||
      "";

    optionLabel =
      dynamicData?.name ||
      dynamicData?.vehicle_number ||
      item?.name ||
      item?.label ||
      optionValue;
  }

  const finalValue =
    String(
      optionValue ??
      ""
    ).trim();

  if (
    !finalValue
  ) {
    return null;
  }

  return {
    value: finalValue,
    label:
      getTextValue(
        optionLabel
      ) ||
      finalValue,
    raw: item,
  };
};

/* =====================================================
   LOAD MASTER REFERENCE OPTIONS
===================================================== */

const loadSchemaReferenceOptions =
  async (
    fields: any[]
  ) => {
    return Promise.all(
      (
        Array.isArray(fields)
          ? fields
          : []
      ).map(
        async (
          field: any
        ) => {
          if (
            !isMasterReferenceField(
              field
            )
          ) {
            return field;
          }

          const dataSource =
            getDataSource(field);

          const rawApi =
            String(
              field?.api ||
              dataSource?.api ||
              ""
            ).trim();

          if (!rawApi) {
            return {
              ...field,
              options:
                Array.isArray(
                  field?.options
                )
                  ? field.options
                  : [],
            };
          }

          const requestUrl =
            buildDataSourceRequestUrl(
              rawApi
            );

          if (
            !requestUrl ||
            /\{[^}]+\}/.test(
              requestUrl
            )
          ) {
            console.error(
              `Datasource placeholder unresolved for "${field.key}":`,
              requestUrl ||
              rawApi
            );

            return {
              ...field,
              options: [],
            };
          }

          try {
            const response =
              await professionalAxios.get(
                requestUrl,
                {
                  params:
                    field?.queryParams ||
                    dataSource?.queryParams ||
                    {},
                }
              );

            const fieldType =
              getFieldType(field);

            const records =
              EMPLOYEE_REFERENCE_FIELD_TYPES.has(
                fieldType
              )
                ? extractEmployeeChildUsers(
                  response?.data
                )
                : extractGenericRecords(
                  response?.data
                );

            const options =
              records
                .map(
                  (
                    item: any
                  ) =>
                    buildReferenceOption(
                      field,
                      item
                    )
                )
                .filter(
                  Boolean
                ) as ReferenceOption[];

            return {
              ...field,
              dataSource,
              options,
            };
          } catch (
          error: any
          ) {
            console.error(
              `Failed to load datasource for "${field.key}":`,
              error?.response?.data ||
              error
            );

            return {
              ...field,
              dataSource,
              options: [],
            };
          }
        }
      )
    );
  };

/* =====================================================
   NORMALIZE MASTER REFERENCE
===================================================== */

const normalizeReferenceValue = (
  field: any,
  value: any
) => {
  if (
    !value ||
    typeof value !==
    "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const fieldType =
    getFieldType(field);

  /* ============================================
     PRODUCT / UNIT / ACCOUNT / CUSTOM
  ============================================ */

  if (
    CODE_NAME_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    return {
      code:
        value?.code ||
        value?.productCode ||
        value?.unitCode ||
        value?.accountCode ||
        value?.voucherNumber ||
        value?.value ||
        value?._id ||
        "",

      name:
        getTextValue(
          value?.name ||
          value?.productName ||
          value?.unitName ||
          value?.accountName ||
          value?.vehicle_number ||
          value?.label
        ),
    };
  }

  /* ============================================
     STATE
  ============================================ */

  if (
    fieldType ===
    "statemaster"
  ) {
    return {
      stateCode:
        value?.stateCode ||
        value?.isoCode ||
        value?.code ||
        value?.value ||
        "",

      name:
        getTextValue(
          value?.name ||
          value?.stateName ||
          value?.label
        ),
    };
  }

  /* ============================================
     CITY
  ============================================ */

  if (
    fieldType ===
    "citymaster"
  ) {
    return {
      stateCode:
        value?.stateCode ||
        value?.state?.isoCode ||
        value?.state?.stateCode ||
        "",

      name:
        getTextValue(
          value?.name ||
          value?.cityName ||
          value?.label
        ),
    };
  }

  /* ============================================
     EMPLOYEE
  ============================================ */

  if (
    EMPLOYEE_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    return {
      userMobileNumberHash:
        value?.userMobileNumberHash ||
        value?.mobile ||
        value?.value ||
        "",

      userFirstName:
        value?.userFirstName ||
        value?.firstName ||
        "",

      userMiddleName:
        value?.userMiddleName ||
        value?.middleName ||
        "",

      userLastName:
        value?.userLastName ||
        value?.lastName ||
        "",

      userType:
        value?.userType ||
        value?.type ||
        "",

      parentUserMobileNumber:
        value?.parentUserMobileNumber ||
        value?.parentMobile ||
        "",
    };
  }

  return value;
};

/* =====================================================
   REFERENCE SELECT VALUE
===================================================== */

const getReferenceSelectValue = (
  field: any,
  value: any
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value !==
    "object"
  ) {
    return String(value);
  }

  const fieldType =
    getFieldType(field);

  if (
    fieldType ===
    "statemaster"
  ) {
    return String(
      value?.stateCode ||
      value?.isoCode ||
      value?.code ||
      ""
    );
  }

  if (
    fieldType ===
    "citymaster"
  ) {
    return String(
      value?.name ||
      value?.cityName ||
      ""
    );
  }

  if (
    EMPLOYEE_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    return String(
      value?.userMobileNumberHash ||
      value?.mobile ||
      ""
    );
  }

  return String(
    value?.code ||
    value?.productCode ||
    value?.unitCode ||
    value?.accountCode ||
    value?.value ||
    value?._id ||
    ""
  );
};

/* =====================================================
   BUILD SELECTED REFERENCE VALUE
===================================================== */

const buildSelectedReferenceValue = (
  field: any,
  selectedOption:
    | ReferenceOption
    | undefined,
  fallbackValue: string
) => {
  const fieldType =
    getFieldType(field);

  const raw =
    selectedOption?.raw ||
    {};

  if (
    fieldType ===
    "productmaster"
  ) {
    return {
      code:
        raw?.productCode ||
        raw?.code ||
        selectedOption?.value ||
        fallbackValue,

      name:
        getTextValue(
          raw?.productName ||
          raw?.name ||
          selectedOption?.label
        ),
    };
  }

  if (
    fieldType ===
    "unitmaster"
  ) {
    return {
      code:
        raw?.unitCode ||
        raw?.code ||
        selectedOption?.value ||
        fallbackValue,

      name:
        getTextValue(
          raw?.unitName ||
          raw?.name ||
          selectedOption?.label
        ),
    };
  }

  if (
    fieldType ===
    "accountmaster"
  ) {
    return {
      code:
        raw?.accountCode ||
        raw?.code ||
        selectedOption?.value ||
        fallbackValue,

      name:
        getTextValue(
          raw?.accountName ||
          raw?.name ||
          selectedOption?.label
        ),
    };
  }

  if (
    fieldType ===
    "statemaster"
  ) {
    return {
      stateCode:
        raw?.stateCode ||
        raw?.isoCode ||
        raw?.code ||
        selectedOption?.value ||
        fallbackValue,

      name:
        getTextValue(
          raw?.name ||
          raw?.stateName ||
          selectedOption?.label
        ),
    };
  }

  if (
    fieldType ===
    "citymaster"
  ) {
    return {
      stateCode:
        raw?.stateCode ||
        raw?.state?.isoCode ||
        raw?.state?.stateCode ||
        "",

      name:
        getTextValue(
          raw?.name ||
          raw?.cityName ||
          selectedOption?.label
        ),
    };
  }

  if (
    EMPLOYEE_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    return {
      userMobileNumberHash:
        raw?.userMobileNumberHash ||
        raw?.mobile ||
        selectedOption?.value ||
        fallbackValue,

      userFirstName:
        raw?.userFirstName ||
        raw?.firstName ||
        "",

      userMiddleName:
        raw?.userMiddleName ||
        raw?.middleName ||
        "",

      userLastName:
        raw?.userLastName ||
        raw?.lastName ||
        "",

      userType:
        raw?.userType ||
        raw?.type ||
        "",

      parentUserMobileNumber:
        raw?.parentUserMobileNumber ||
        raw?.parentMobile ||
        "",
    };
  }

  const dynamicData =
    raw?.data ||
    raw?.dynamicFields ||
    raw?.customFields ||
    raw;

  return {
    code:
      dynamicData?.code ||
      raw?.code ||
      raw?.voucherNumber ||
      raw?._id ||
      selectedOption?.value ||
      fallbackValue,

    name:
      getTextValue(
        dynamicData?.name ||
        dynamicData?.vehicle_number ||
        raw?.name ||
        selectedOption?.label
      ),
  };
};

/* =====================================================
   EDIT VALUE
===================================================== */

const getProductFieldValue = (
  field: any,
  product: any
) => {
  const key =
    field.key;

  const fieldType =
    getFieldType(field);

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

  let value: any =
    "";

  if (
    hasTopLevelValue
  ) {
    value =
      product?.[key];
  } else if (
    hasDynamicValue
  ) {
    value =
      product?.dynamicFields?.[
      key
      ];
  }

  if (
    isMasterReferenceField(
      field
    )
  ) {
    return normalizeReferenceValue(
      field,
      value
    );
  }

  if (
    key === "productType"
  ) {
    return normalizeProductType(
      value || ""
    );
  }

  if (
    key === "unit"
  ) {
    if (
      value &&
      typeof value ===
      "object"
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

  if (
    fieldType === "number"
  ) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return Number(value);
  }

  if (
    fieldType === "boolean"
  ) {
    return getBooleanValue(
      value
    );
  }

  return value ?? "";
};

/* =====================================================
   RESPONSE HELPERS
===================================================== */

const getProductFromResponse = (
  response: any
) => {
  return (
    response?.data?.data?.product ||
    response?.data?.product ||
    response?.data?.data ||
    response?.data ||
    response?.product ||
    response
  );
};

const getUnitFromResponse = (
  response: any
) => {
  return (
    response?.data?.unit ||
    response?.data?.data?.unit ||
    response?.data?.data ||
    response?.data ||
    response?.unit ||
    response
  );
};

/* =====================================================
   PRODUCT MASTER MODAL
===================================================== */

const ProductMasterModal = ({
  show,
  setShow,
  editingProduct = null,
  onSaved,
  title,
  initialProductName = "",
}: ProductMasterModalProps) => {
  const dispatch =
    useDispatch<any>();

  const {
    units = [],
  } = useSelector(
    (state: any) =>
      state.unitMaster ||
      {}
  );

  const [
    form,
    setForm,
  ] = useState<
    Record<string, any>
  >({});

  const [
    errors,
    setErrors,
  ] = useState<
    Record<string, string>
  >({});

  const [
    productMasterSchemaFields,
    setProductMasterSchemaFields,
  ] = useState<any[]>([]);

  const [
    schemaLoading,
    setSchemaLoading,
  ] = useState(false);

  const [
    hsnOptions,
    setHsnOptions,
  ] = useState<any[]>([]);

  const [
    hsnLoading,
    setHsnLoading,
  ] = useState(false);

  const [
    showUnitModal,
    setShowUnitModal,
  ] = useState(false);

  const [
    unitSearchValue,
    setUnitSearchValue,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  /* ===================================================
     LOAD PRODUCT SCHEMA
  =================================================== */

  const loadProductSchema =
    async () => {
      setSchemaLoading(
        true
      );

      try {
        const response =
          await professionalAxios.get(
            "/eTaxSolnMongoApiBackend/users/masters/productMaster/schema/getAll",
            {
              params: {
                offset: 0,
                limit: 500,
              },
            }
          );

        const data =
          response?.data
            ?.data ||
          {};

        const fields =
          data?.fields ||
          data?.items ||
          data?.schema
            ?.fields ||
          [];

        const normalizedFields =
          Array.isArray(
            fields
          )
            ? fields
            : [];

        const fieldsWithOptions =
          await loadSchemaReferenceOptions(
            normalizedFields
          );

        setProductMasterSchemaFields(
          Array.isArray(
            fieldsWithOptions
          )
            ? fieldsWithOptions
            : []
        );
      } catch (
      error: any
      ) {
        console.log(
          "Failed to load Product Master schema",
          error
        );

        setProductMasterSchemaFields(
          []
        );

        toast.error(
          error?.response?.data
            ?.message ||
          "Failed to load product fields"
        );
      } finally {
        setSchemaLoading(
          false
        );
      }
    };

  /* ===================================================
     LOAD HSN CODES

     IMPORTANT:
     This is an independent API call.
     It is not dependent on the schema API.
  =================================================== */

  const loadHSNCodes =
    async () => {
      setHsnLoading(
        true
      );

      try {
        const response =
          await professionalAxios.get(
            "/eTaxSolnMongoApiBackend/users/global/hsn/search",
            {
              params: {
                offset: 0,
                limit: 8000,
                q: "",
                type: "",
              },
            }
          );

        const records =
          extractGenericRecords(
            response?.data
          );

        const options =
          records
            .map(
              (
                item: any
              ) => {
                const code =
                  item?.code ||
                  item?.hsnCode ||
                  item?.hsn ||
                  item?.value ||
                  "";

                const description =
                  item?.description ||
                  item?.hsnDescription ||
                  item?.desc ||
                  item?.name ||
                  "";

                if (!code) {
                  return null;
                }

                return {
                  ...item,

                  value:
                    String(
                      code
                    ),

                  label:
                    description
                      ? `${code} - ${description}`
                      : String(
                        code
                      ),
                };
              }
            )
            .filter(
              Boolean
            );

        setHsnOptions(
          options
        );
      } catch (
      error: any
      ) {
        console.log(
          "Failed to load HSN codes",
          error?.response?.data ||
          error
        );

        setHsnOptions(
          []
        );

        toast.error(
          error?.response?.data
            ?.message ||
          "Failed to load HSN codes"
        );
      } finally {
        setHsnLoading(
          false
        );
      }
    };

  /* ===================================================
     LOAD UNITS
  =================================================== */

  const loadUnits =
    async () => {
      try {
        await dispatch(
          getAllUnits({
            offset: 0,
            limit: 1000,
            search: "",
          }) as any
        ).unwrap();
      } catch (
      error
      ) {
        console.log(
          "Failed to load units",
          error
        );
      }
    };

  /* ===================================================
     OPEN EFFECT

     Opening the modal now calls:
     1. Product schema
     2. HSN API
     3. Unit Master
  =================================================== */

  useEffect(() => {
    if (!show) {
      setShowUnitModal(
        false
      );

      setUnitSearchValue(
        ""
      );

      setHsnOptions(
        []
      );

      return;
    }

    loadProductSchema();
    loadHSNCodes();
    loadUnits();
  }, [
    show,
  ]);

  /* ===================================================
     INITIALIZE FORM
  =================================================== */

  useEffect(() => {
    if (
      !show ||
      productMasterSchemaFields
        .length === 0
    ) {
      return;
    }

    setErrors({});

    const nextForm =
      buildEmptyForm(
        productMasterSchemaFields
      );

    if (
      editingProduct
    ) {
      productMasterSchemaFields.forEach(
        (
          field: any
        ) => {
          nextForm[
            field.key
          ] =
            getProductFieldValue(
              field,
              editingProduct
            );
        }
      );
    } else if (
      initialProductName
    ) {
      const productNameField =
        productMasterSchemaFields.find(
          (
            field: any
          ) =>
            field.key ===
            "productName"
        );

      if (
        productNameField
      ) {
        nextForm.productName =
          initialProductName;
      }
    }

    setForm(
      nextForm
    );
  }, [
    show,
    editingProduct,
    productMasterSchemaFields,
    initialProductName,
  ]);

  /* ===================================================
     FIELD OPTIONS MAP
  =================================================== */

  const fieldOptionsMap =
    useMemo(() => {
      const map:
        Record<string, any[]> =
        {};

      (
        Array.isArray(
          productMasterSchemaFields
        )
          ? productMasterSchemaFields
          : []
      ).forEach(
        (
          field: any
        ) => {
          const fieldType =
            getFieldType(
              field
            );

          /* =========================================
             HSN OPTIONS
          ========================================= */

          if (
            field.key ===
            "productHSNCode"
          ) {
            map[
              field.key
            ] =
              hsnOptions;

            return;
          }

          /* =========================================
             MASTER REFERENCE OPTIONS
          ========================================= */

          if (
            isMasterReferenceField(
              field
            )
          ) {
            map[
              field.key
            ] =
              Array.isArray(
                field?.options
              )
                ? field.options
                : [];

            return;
          }

          if (
            fieldType !==
            "select"
          ) {
            return;
          }

          /* =========================================
             UNIT OPTIONS
          ========================================= */

          if (
            field.ref ===
            "unitMeasurement" ||
            field.key ===
            "unit"
          ) {
            map[
              field.key
            ] =
              (
                Array.isArray(
                  units
                )
                  ? units
                  : []
              ).map(
                (
                  item: any
                ) => {
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
                      getTextValue(
                        label
                      ),
                  };
                }
              );

            return;
          }

          /* =========================================
             PRODUCT TYPE
          ========================================= */

          if (
            field.key ===
            "productType"
          ) {
            map[
              field.key
            ] =
              (
                field.options ||
                []
              ).map(
                (
                  option: any
                ) => {
                  const label =
                    typeof option ===
                      "object"
                      ? option.label ||
                      option.name ||
                      option.value
                      : option;

                  return {
                    value:
                      label,

                    label,
                  };
                }
              );

            return;
          }

          /* =========================================
             NORMAL SELECT
          ========================================= */

          map[
            field.key
          ] =
            (
              field.options ||
              []
            ).map(
              (
                option: any
              ) => {
                if (
                  typeof option ===
                  "object"
                ) {
                  return {
                    ...option,

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
                  value:
                    option,

                  label:
                    option,
                };
              }
            );
        }
      );

      return map;
    }, [
      productMasterSchemaFields,
      units,
      hsnOptions,
    ]);

  /* ===================================================
     UPDATE FIELD
  =================================================== */

  const updateField = (
    key: string,
    value: any
  ) => {
    setForm(
      (
        previousForm
      ) => ({
        ...previousForm,

        [key]:
          value,
      })
    );

    setErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        [key]:
          "",
      })
    );
  };

  /* ===================================================
     REFERENCE VALIDATION
  =================================================== */

  const isReferenceValueEmpty = (
    field: any,
    value: any
  ) => {
    const fieldType =
      getFieldType(
        field
      );

    if (
      !value ||
      typeof value !==
      "object" ||
      Array.isArray(value)
    ) {
      return true;
    }

    if (
      CODE_NAME_REFERENCE_FIELD_TYPES.has(
        fieldType
      )
    ) {
      return (
        !String(
          value?.code ||
          ""
        ).trim() ||
        !String(
          value?.name ||
          ""
        ).trim()
      );
    }

    if (
      fieldType ===
      "statemaster"
    ) {
      return (
        !String(
          value?.stateCode ||
          ""
        ).trim() ||
        !String(
          value?.name ||
          ""
        ).trim()
      );
    }

    if (
      fieldType ===
      "citymaster"
    ) {
      return !String(
        value?.name ||
        ""
      ).trim();
    }

    if (
      EMPLOYEE_REFERENCE_FIELD_TYPES.has(
        fieldType
      )
    ) {
      return !String(
        value?.userMobileNumberHash ||
        ""
      ).trim();
    }

    return false;
  };

  /* ===================================================
     VALIDATION
  =================================================== */

  const validateForm =
    () => {
      const validationErrors:
        Record<string, string> =
        {};

      (
        Array.isArray(
          productMasterSchemaFields
        )
          ? productMasterSchemaFields
          : []
      ).forEach(
        (
          field: any
        ) => {
          const value =
            form?.[
            field.key
            ];

          const fieldType =
            getFieldType(
              field
            );

          if (
            field.isRequired ||
            field.required
          ) {
            if (
              fieldType ===
              "boolean"
            ) {
              if (
                value ===
                undefined ||
                value ===
                null
              ) {
                validationErrors[
                  field.key
                ] =
                  `${field.label} required`;
              }
            } else if (
              isMasterReferenceField(
                field
              )
            ) {
              if (
                isReferenceValueEmpty(
                  field,
                  value
                )
              ) {
                validationErrors[
                  field.key
                ] =
                  `${field.label} required`;
              }
            } else if (
              value ===
              undefined ||
              value ===
              null ||
              String(
                value
              ).trim() ===
              ""
            ) {
              validationErrors[
                field.key
              ] =
                `${field.label} required`;
            }
          }

          /* =========================================
             HSN
          ========================================= */

          if (
            field.key ===
            "productHSNCode" &&
            value &&
            !/^(?:\d{2}|\d{4}|\d{6}|\d{8})$/.test(
              String(
                value
              )
            )
          ) {
            validationErrors[
              field.key
            ] =
              "Invalid HSN/SAC code. Allowed: 2, 4, 6, or 8 digit numeric code.";
          }

          /* =========================================
             NUMBER
          ========================================= */

          if (
            fieldType ===
            "number" &&
            value !== "" &&
            value !== null &&
            value !==
            undefined &&
            Number.isNaN(
              Number(
                value
              )
            )
          ) {
            validationErrors[
              field.key
            ] =
              `${field.label} must be a valid number`;
          }

          if (
            fieldType ===
            "number" &&
            value !== "" &&
            value !== null &&
            value !==
            undefined &&
            Number(
              value
            ) < 0
          ) {
            validationErrors[
              field.key
            ] =
              `${field.label} cannot be negative`;
          }
        }
      );

      setErrors(
        validationErrors
      );

      return (
        Object.keys(
          validationErrors
        ).length === 0
      );
    };

  /* ===================================================
     RENDER FIELD
  =================================================== */

  const renderSchemaField = (
    field: any
  ) => {
    const fieldType =
      getFieldType(
        field
      );

    const value =
      form?.[
      field.key
      ] ?? "";

    const commonProps = {
      label:
        field.label,

      mandatory:
        field.isRequired ||
        field.required,

      value,

      placeholder:
        field.placeholder ||
        `Enter ${field.label}`,

      error:
        errors?.[
        field.key
        ],

      disabled:
        field.disabled ||
        field.isReadonly ||
        submitting,
    };

    /* ========================================
       HSN SELECT

       IMPORTANT:
       This comes before the normal field.type checks,
       so productHSNCode always renders as a dropdown.
    ========================================= */

    if (
      field.key ===
      "productHSNCode"
    ) {
      return (
        <SelectInput
          key={
            field.key
          }
          name={
            field.key
          }
          label={
            field.label
          }
          mandatory={
            field.isRequired ||
            field.required
          }
          value={
            value
          }
          placeholder="Select HSN/SAC Code"
          error={
            errors?.[
            field.key
            ]
          }
          largeData={
            true
          }
          disabled={
            field.disabled ||
            field.isReadonly ||
            submitting ||
            hsnLoading
          }
          styles={{
            menuPortal: (
              base: any
            ) => ({
              ...base,

              zIndex:
                2147483647,
            }),

            menu: (
              base: any
            ) => ({
              ...base,

              zIndex:
                2147483647,
            }),
          }}
          options={[
            {
              value: "",

              label:
                hsnLoading
                  ? "Loading HSN/SAC codes..."
                  : hsnOptions.length >
                    0
                    ? "Select HSN/SAC Code"
                    : "No HSN/SAC codes found",
            },

            ...(
              fieldOptionsMap[
              field.key
              ] || []
            ),
          ]}
          onChange={(
            event: any
          ) => {
            updateField(
              field.key,

              event?.target
                ?.value ??
              ""
            );
          }}
        />
      );
    }

    /* ========================================
       MASTER REFERENCE SELECT
    ========================================= */

    if (
      isMasterReferenceField(
        field
      )
    ) {
      const options =
        fieldOptionsMap[
        field.key
        ] ||
        [];

      const selectedValue =
        getReferenceSelectValue(
          field,
          value
        );

      return (
        <SelectInput
          key={
            field.key
          }
          name={
            field.key
          }
          label={
            field.label
          }
          mandatory={
            field.isRequired ||
            field.required
          }
          value={
            selectedValue
          }
          placeholder={`Select ${field.label}`}
          error={
            errors?.[
            field.key
            ]
          }
          largeData={
            true
          }
          disabled={
            field.disabled ||
            field.isReadonly ||
            submitting
          }
          styles={{
            menuPortal: (
              base: any
            ) => ({
              ...base,

              zIndex:
                2147483647,
            }),

            menu: (
              base: any
            ) => ({
              ...base,

              zIndex:
                2147483647,
            }),
          }}
          options={[
            {
              value: "",

              label:
                options.length >
                  0
                  ? `Select ${field.label}`
                  : `No ${field.label} found`,
            },

            ...options,
          ]}
          onChange={(
            event: any
          ) => {
            const selectedValue =
              event?.target
                ?.value ??
              "";

            if (
              !selectedValue
            ) {
              updateField(
                field.key,
                null
              );

              return;
            }

            const selectedOption =
              options.find(
                (
                  option: any
                ) =>
                  String(
                    option?.value
                  ) ===
                  String(
                    selectedValue
                  )
              );

            const selectedReference =
              buildSelectedReferenceValue(
                field,
                selectedOption,
                selectedValue
              );

            updateField(
              field.key,
              selectedReference
            );
          }}
        />
      );
    }

    /* ========================================
       NORMAL SELECT
    ========================================= */

    if (
      fieldType ===
      "select"
    ) {
      const isUnitField =
        field.ref ===
        "unitMeasurement" ||
        field.key ===
        "unit";

      if (
        isUnitField
      ) {
        return (
          <CreatableSelectInput
            key={
              field.key
            }
            name={
              field.key
            }
            label={
              field.label
            }
            mandatory={
              field.isRequired ||
              field.required
            }
            value={
              value
            }
            placeholder={`Select ${field.label}`}
            error={
              errors?.[
              field.key
              ]
            }
            largeData={
              true
            }
            disabled={
              field.disabled ||
              field.isReadonly ||
              submitting
            }
            options={
              fieldOptionsMap[
              field.key
              ] || []
            }
            showCreateOnEmpty={
              true
            }
            useMenuPortal={
              false
            }
            createOptionLabel={(
              searchValue:
                string
            ) =>
              searchValue
                ? `+ Add "${searchValue}" as New Unit`
                : "+ Add New Unit"
            }
            onCreateOption={(
              searchValue:
                string
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
                  ?.value ??
                ""
              );
            }}
          />
        );
      }
      return (
        <SelectInput
          key={
            field.key
          }
          name={
            field.key
          }
          label={
            field.label
          }
          mandatory={
            field.isRequired ||
            field.required
          }
          value={
            value
          }
          placeholder={`Select ${field.label}`}
          error={
            errors?.[
            field.key
            ]
          }
          styles={{
            menuPortal: (
              base: any
            ) => ({
              ...base,

              zIndex:
                2147483647,
            }),

            menu: (
              base: any
            ) => ({
              ...base,

              zIndex:
                2147483647,
            }),
          }}
          largeData={
            true
          }
          disabled={
            field.disabled ||
            field.isReadonly ||
            submitting
          }
          options={
            fieldOptionsMap[
            field.key
            ] || []
          }
          onChange={(
            event: any
          ) => {
            updateField(
              field.key,

              event?.target
                ?.value ??
              ""
            );
          }}
        />
      );
    }

    /* ========================================
       BOOLEAN
    ========================================= */

    if (
      fieldType ===
      "boolean"
    ) {
      const booleanValue =
        getBooleanValue(
          form?.[
          field.key
          ]
        );

      return (
        <ToggleInput
          key={
            field.key
          }
          label={
            field.label
          }
          name={
            field.key
          }
          value={
            booleanValue
          }
          checked={
            booleanValue
          }
          mandatory={
            field.isRequired ||
            field.required
          }
          error={
            errors?.[
            field.key
            ]
          }
          disabled={
            field.disabled ||
            field.isReadonly ||
            submitting
          }
          onChange={(
            event: any
          ) => {
            updateField(
              field.key,

              getBooleanValue(
                event?.target
                  ?.checked ??
                event?.target
                  ?.value
              )
            );
          }}
        />
      );
    }

    /* ========================================
       NUMBER
    ========================================= */

    if (
      fieldType ===
      "number"
    ) {
      return (
        <TextInput
          key={
            field.key
          }
          {...commonProps}
          type="number"
          onChange={(
            event: any
          ) => {
            updateField(
              field.key,

              event.target
                .value
            );
          }}
        />
      );
    }

    /* ========================================
       TEXTAREA
    ========================================= */

    if (
      fieldType ===
      "textarea"
    ) {
      return (
        <TextArea
          key={
            field.key
          }
          {...commonProps}
          onChange={(
            event: any
          ) => {
            updateField(
              field.key,

              event.target
                .value
            );
          }}
        />
      );
    }

    /* ========================================
       DATE
    ========================================= */

    if (
      fieldType ===
      "date"
    ) {
      return (
        <TextInput
          key={
            field.key
          }
          {...commonProps}
          type="date"
          onChange={(
            event: any
          ) => {
            updateField(
              field.key,

              event.target
                .value
            );
          }}
        />
      );
    }

    /* ========================================
       IMAGE
    ========================================= */

    if (
      field.key ===
      "imageUrl" ||
      fieldType ===
      "image" ||
      fieldType ===
      "imageupload"
    ) {
      return (
        <ImageUploadInput
          key={
            field.key
          }
          className="sm:col-span-1"
          label={
            field.label
          }
          mandatory={
            field.isRequired ||
            field.required
          }
          value={
            value
          }
          error={
            errors?.[
            field.key
            ]
          }
          placeholder={`Click to upload ${field.label}`}
          alt={
            field.label
          }
          onChange={(
            base64:
              string | null
          ) => {
            updateField(
              field.key,

              base64 ||
              ""
            );
          }}
        />
      );
    }

    /* ========================================
       STRING
    ========================================= */

    return (
      <TextInput
        key={
          field.key
        }
        {...commonProps}
        type="text"
        onChange={(
          event: any
        ) => {
          updateField(
            field.key,

            event.target
              .value
          );
        }}
      />
    );
  };

  /* ===================================================
     UNIT SAVED
  =================================================== */

  const handleUnitSaved =
    async (
      response: any
    ) => {
      const savedUnit =
        getUnitFromResponse(
          response
        );

      await loadUnits();

      const unitCode =
        savedUnit?.unitCode ||
        savedUnit?.code ||
        savedUnit?.unitId ||
        savedUnit?.value ||
        "";

      if (
        unitCode
      ) {
        setForm(
          (
            previousForm
          ) => ({
            ...previousForm,

            unit:
              unitCode,
          })
        );

        setErrors(
          (
            previousErrors
          ) => ({
            ...previousErrors,

            unit:
              "",
          })
        );
      }

      setShowUnitModal(
        false
      );

      setUnitSearchValue(
        ""
      );
    };

  /* ===================================================
     SUBMIT
  =================================================== */

  const handleSubmit =
    async () => {
      if (
        submitting ||
        !validateForm()
      ) {
        return;
      }

      const payload: Record<string, any> = {};
      const dynamicFields: Record<string, any> = {
        ...(editingProduct?.dynamicFields || {}
        ),
      };

      (Array.isArray(productMasterSchemaFields) ? productMasterSchemaFields : []).forEach((field: any) => {
          const fieldType =
            getFieldType(
              field
            );

          let value =
            form?.[
            field.key
            ];

          /* =========================================
             MASTER REFERENCE
          ========================================= */

          if (
            isMasterReferenceField(
              field
            )
          ) {
            value =
              normalizeReferenceValue(
                field,
                value
              );
          }

          /* =========================================
             NUMBER
          ========================================= */

          else if (
            fieldType ===
            "number" &&
            value !== "" &&
            value !== null &&
            value !==
            undefined
          ) {
            value =
              Number(
                value
              );
          }

          /* =========================================
             BOOLEAN
          ========================================= */

          else if (fieldType === "boolean") {
            value = getBooleanValue(value);
          }

          /* =========================================
             DYNAMIC OR ROOT
          ========================================= */

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

        /* =========================================
           UPDATE PRODUCT
        ========================================= */

        if (editingProduct?.productCode) {
          response = await professionalAxios.put(`/eTaxSolnMongoApiBackend/productMaster/updateProduct/${editingProduct.productCode}`, payload);
          toast.success("Product updated successfully");
        }

        /* =========================================
           CREATE PRODUCT
        ========================================= */

        else {
          response =
            await professionalAxios.post(
              "/eTaxSolnMongoApiBackend/productMaster/createProduct",
              payload
            );

          toast.success(
            "Product created successfully"
          );
        }
        dispatch(
          getAllProducts({
            offset: 0,
            limit: 10,
          }) as any
        );
        const savedProduct = getProductFromResponse(response) || payload;
        if (onSaved) {
          await onSaved(
            savedProduct
          );
        }

        setShow(false);
        setErrors({});
        setForm(buildEmptyForm(productMasterSchemaFields)
        );
      } catch (
      error: any
      ) {
        const apiErrors =
          error?.error ||
          error?.errors ||
          error?.response
            ?.data?.error ||
          error?.response
            ?.data?.errors ||
          {};

        if (
          apiErrors &&
          typeof apiErrors ===
          "object" &&
          !Array.isArray(
            apiErrors
          )
        ) {
          setErrors(
            apiErrors
          );
        }

        toast.error(
          error?.response?.data
            ?.message ||
          error?.message ||
          "Product operation failed"
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* ===================================================
     MODAL BODY
  =================================================== */

  const modalBody =
    useMemo(() => {
      if (
        schemaLoading
      ) {
        return (
          <div className="py-6 text-sm text-muted-foreground">
            Loading product fields...
          </div>
        );
      }

      if (
        productMasterSchemaFields
          .length === 0
      ) {
        return (
          <div className="py-6 text-sm text-muted-foreground">
            Product Master schema fields not found.
          </div>
        );
      }

      return (
        <>
          {productMasterSchemaFields
            .filter(
              (
                field: any
              ) =>
                !getBooleanValue(
                  field?.isHidden
                )
            )
            .map(
              (
                field: any
              ) =>
                renderSchemaField(
                  field
                )
            )}
        </>
      );
    }, [
      schemaLoading,
      hsnLoading,
      hsnOptions,
      productMasterSchemaFields,
      form,
      errors,
      fieldOptionsMap,
      submitting,
    ]);

  /* ===================================================
     PORTAL
  =================================================== */

  if (
    (
      !show &&
      !showUnitModal
    ) ||
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  return createPortal(
    <>
      {show && (
        <div className="fixed inset-0 z-[2147483000] isolate pointer-events-none">
          <div className="pointer-events-auto">
            <Modal
              show={
                show
              }
              setShow={
                setShow
              }
              handleSubmit={handleSubmit}
              loader={
                submitting
              }
              state={
                editingProduct
              }
              title={
                title ||
                (
                  editingProduct
                    ? "Update Product"
                    : "Add New Product"
                )
              }
              body={
                modalBody
              }
            />
          </div>
        </div>
      )}

      <UnitMasterModal
        show={
          showUnitModal
        }
        setShow={(
          value: boolean
        ) => {
          setShowUnitModal(
            value
          );

          if (
            !value
          ) {
            setUnitSearchValue(
              ""
            );
          }
        }}
        onSaved={
          handleUnitSaved
        }
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