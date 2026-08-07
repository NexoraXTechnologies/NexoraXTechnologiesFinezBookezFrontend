import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import { createPortal } from "react-dom";
import { toast } from "react-toastify";

import {
  CreatableSelectInput,
  ImageUploadInput,
  SelectInput,
  TextArea,
  TextInput,
  ToggleInput,
} from "../../../../components/inputs";

import professionalAxios from "../../../../services/professionalAxios";
import Modal from "../../../../components/modal";

import {
  getAllUnits,
} from "../../../../redux/slices/professionalSlice/unitMasterSlice";

import UnitMasterModal from "../UnitMasterModal";

/* =====================================================
   TYPES
===================================================== */

type ProductMasterModalProps = {
  show: boolean;

  setShow: (
    value: boolean
  ) => void;

  editingProduct?: any;

  onSaved?: (
    savedProduct: any
  ) => void | Promise<void>;

  title?: string;

  initialProductName?: string;
};

type ReferenceOption = {
  label: string;
  value: string;
  raw: any;
};

/* =====================================================
   SYSTEM FIELD KEYS
===================================================== */

const PRODUCT_SYSTEM_FIELD_KEYS =
  new Set([
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

/* =====================================================
   MASTER REFERENCE FIELD TYPES
===================================================== */

const MASTER_REFERENCE_FIELD_TYPES =
  new Set([
    "accountmaster",
    "productmaster",
    "unitmaster",
    "employeemaster",
    "customemployeemaster",
    "teamemployeemaster",
    "custommaster",
  ]);

/* =====================================================
   MASTER TYPES FORCED INTO dynamicFields
===================================================== */

const DYNAMIC_MASTER_FIELD_TYPES =
  new Set([
    "accountmaster",
    "productmaster",
    "unitmaster",
    "employeemaster",
    "customemployeemaster",
    "teamemployeemaster",
  ]);

/* =====================================================
   EMPLOYEE REFERENCE TYPES
===================================================== */

const EMPLOYEE_REFERENCE_FIELD_TYPES =
  new Set([
    "employeemaster",
    "customemployeemaster",
    "teamemployeemaster",
  ]);

/* =====================================================
   DATASOURCE HELPER
===================================================== */

const getDataSource = (
  field: any
) => {
  const source =
    field?.dataSource;

  if (
    source &&
    typeof source ===
    "object"
  ) {
    return source;
  }

  if (
    typeof source ===
    "string"
  ) {
    const trimmed =
      source.trim();

    if (!trimmed) {
      return {};
    }

    try {
      const parsed =
        JSON.parse(
          trimmed
        );

      return (
        parsed &&
          typeof parsed ===
          "object"
          ? parsed
          : {
            api:
              trimmed,
          }
      );
    } catch {
      return {
        api:
          trimmed,
      };
    }
  }

  return {};
};

/* =====================================================
   FIELD TYPE
===================================================== */

const getFieldType = (
  field: any
) => {
  const dataSource =
    getDataSource(
      field
    );

  return String(
    field?.type ||
    dataSource?.type ||
    ""
  )
    .trim()
    .toLowerCase();
};

/* =====================================================
   MASTER REFERENCE CHECK
===================================================== */

const isMasterReferenceField = (
  field: any
) =>
  MASTER_REFERENCE_FIELD_TYPES.has(
    getFieldType(
      field
    )
  );

/* =====================================================
   RESPONSE HELPERS
===================================================== */

const getProductFromResponse = (
  response: any
) =>
  response?.data?.data
    ?.product ||
  response?.data?.product ||
  response?.data?.data ||
  response?.data ||
  response?.product ||
  response;

const getUnitFromResponse = (
  response: any
) =>
  response?.data?.unit ||
  response?.data?.data
    ?.unit ||
  response?.data?.data ||
  response?.data ||
  response?.unit ||
  response;

/* =====================================================
   TEXT VALUE
===================================================== */

const getTextValue = (
  value: any
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  if (
    typeof value ===
    "string" ||
    typeof value ===
    "number"
  ) {
    return String(
      value
    );
  }

  if (
    typeof value ===
    "object"
  ) {
    return String(
      value.en ||
      value.name ||
      value.label ||
      value.productName ||
      value.unitName ||
      value.accountName ||
      value.code ||
      Object.values(
        value
      ).find(
        (
          itemValue
        ) =>
          typeof itemValue ===
          "string"
      ) ||
      ""
    );
  }

  return "";
};

/* =====================================================
   BOOLEAN VALUE
===================================================== */

const getBooleanValue = (
  value: any
) => {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return (
      value === 1
    );
  }

  const normalizedValue =
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase();

  return [
    "true",
    "1",
    "yes",
    "active",
  ].includes(
    normalizedValue
  );
};

/* =====================================================
   NORMALIZE PRODUCT TYPE
===================================================== */

const normalizeProductType = (
  value = ""
) => {
  const map: Record<
    string,
    string
  > = {
    rawmaterial:
      "Raw Material",

    finishedgoods:
      "Finished Goods",

    serviceproduct:
      "Service Product",

    nonstockproduct:
      "Non Stock Product",

    nonstocks:
      "Non Stock Product",

    intermediaryproduct:
      "Intermediary Product",
  };

  const normalizedKey =
    String(
      value
    )
      .toLowerCase()
      .replace(
        /\s/g,
        ""
      );

  return (
    map[
    normalizedKey
    ] ||
    value
  );
};

/* =====================================================
   PROFESSIONAL USER FROM LOCAL STORAGE
===================================================== */

const getProfessionalUserFromStorage =
  () => {
    try {
      const rawUser =
        localStorage.getItem(
          "professionalUser"
        );

      return rawUser
        ? JSON.parse(
          rawUser
        )
        : null;
    } catch (
    error
    ) {
      console.error(
        "Unable to read professionalUser from localStorage:",
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
   BUILD DATASOURCE REQUEST URL
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

  /*
   * Absolute API is used exactly as provided.
   */

  if (
    /^https?:\/\//i.test(
      resolvedApi
    )
  ) {
    return resolvedApi;
  }

  const backendPrefix =
    "eTaxSolnMongoApiBackend";

  const axiosBaseUrl =
    String(
      professionalAxios
        ?.defaults
        ?.baseURL ||
      ""
    ).trim();

  const baseHasBackendPrefix =
    /\/eTaxSolnMongoApiBackend\/?$/i.test(
      axiosBaseUrl
    );

  let relativeApi =
    resolvedApi
      .replace(
        /^\/+/,
        ""
      )
      .replace(
        /^SandBox\//i,
        ""
      );

  /*
   * Avoid duplicate backend prefix.
   */

  if (
    baseHasBackendPrefix
  ) {
    return relativeApi.replace(
      /^eTaxSolnMongoApiBackend\/?/i,
      ""
    );
  }

  /*
   * Add backend prefix when missing.
   */

  if (
    !relativeApi
      .toLowerCase()
      .startsWith(
        backendPrefix.toLowerCase()
      )
  ) {
    relativeApi =
      `${backendPrefix}/${relativeApi}`;
  }

  /*
   * No leading slash so the Axios /SandBox/ base
   * path is preserved.
   */

  return relativeApi;
};

/* =====================================================
   EXTRACT GENERIC RECORDS
===================================================== */

const extractGenericRecords = (
  responseData: any
): any[] => {
  const roots = [
    responseData,
    responseData?.data,
    responseData?.result,
    responseData?.payload,
    responseData?.data
      ?.data,
  ];

  const keys = [
    "items",
    "records",
    "users",
    "accounts",
    "products",
    "units",
    "docs",
    "result",
  ];

  for (
    const root of roots
  ) {
    if (
      Array.isArray(
        root
      )
    ) {
      return root;
    }

    if (
      root &&
      typeof root ===
      "object"
    ) {
      for (
        const key of keys
      ) {
        if (
          Array.isArray(
            root?.[key]
          )
        ) {
          return root[
            key
          ];
        }
      }
    }
  }

  return [];
};

/* =====================================================
   EXTRACT EMPLOYEE CHILD USERS
===================================================== */

const extractEmployeeChildUsers = (
  responseData: any
): any[] => {
  const result =
    Array.isArray(
      responseData
        ?.result
    )
      ? responseData
        .result
      : Array.isArray(
        responseData
          ?.data
          ?.result
      )
        ? responseData
          .data
          .result
        : [];

  return result.flatMap(
    (
      record: any
    ) =>
      Array.isArray(
        record
          ?.ChildUsers
      )
        ? record
          .ChildUsers
        : []
  );
};

/* =====================================================
   BUILD REFERENCE OPTION
===================================================== */

const buildReferenceOption = (
  field: any,
  item: any
): ReferenceOption | null => {
  const fieldType =
    getFieldType(
      field
    );

  const dataSource =
    getDataSource(
      field
    );

  const dynamicData =
    item?.data ||
    item?.dynamicFields ||
    item?.customFields ||
    {};

  let valueField =
    String(
      field?.valueField ||
      dataSource?.valueField ||
      ""
    ).trim();

  let labelField =
    String(
      field?.labelField ||
      dataSource?.labelField ||
      ""
    ).trim();

  let optionValue: any =
    "";

  let optionLabel: any =
    "";

  /* ============================================
     ACCOUNT MASTER
  ============================================ */

  if (
    fieldType ===
    "accountmaster"
  ) {
    valueField =
      valueField ||
      "accountCode";

    labelField =
      labelField ||
      "accountName";

    optionValue =
      item?.[
      valueField
      ] ||
      item?.accountCode ||
      item?.code;

    optionLabel =
      item?.[
      labelField
      ] ||
      item?.accountName ||
      item?.name;
  }

  /* ============================================
     PRODUCT MASTER
  ============================================ */

  else if (
    fieldType ===
    "productmaster"
  ) {
    valueField =
      valueField ||
      "productCode";

    labelField =
      labelField ||
      "productName";

    optionValue =
      item?.[
      valueField
      ] ||
      item?.productCode ||
      item?.code;

    optionLabel =
      item?.[
      labelField
      ] ||
      item?.productName ||
      item?.name;
  }

  /* ============================================
     UNIT MASTER
  ============================================ */

  else if (
    fieldType ===
    "unitmaster"
  ) {
    valueField =
      valueField ||
      "unitCode";

    labelField =
      labelField ||
      "unitName";

    optionValue =
      item?.[
      valueField
      ] ||
      item?.unitCode ||
      item?.code;

    optionLabel =
      item?.[
      labelField
      ] ||
      item?.unitName ||
      item?.name;
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
      item?.mobile;

    optionLabel = [
      item?.userFirstName,
      item?.userMiddleName,
      item?.userLastName,
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      )
      .trim();
  }

  /* ============================================
     CUSTOM MASTER
  ============================================ */

  else if (
    fieldType ===
    "custommaster"
  ) {
    valueField =
      valueField ||
      "code";

    labelField =
      labelField ||
      "name";

    optionValue =
      dynamicData?.[
      valueField
      ] ||
      item?.[
      valueField
      ] ||
      dynamicData?.code ||
      item?.code ||
      item?.voucherNumber ||
      item?._id;

    optionLabel =
      dynamicData?.[
      labelField
      ] ||
      item?.[
      labelField
      ] ||
      dynamicData?.name ||
      dynamicData
        ?.vehicle_number ||
      item?.name;
  }

  const finalValue =
    String(
      optionValue ??
      ""
    ).trim();

  if (!finalValue) {
    return null;
  }

  return {
    value:
      finalValue,

    label:
      getTextValue(
        optionLabel
      ) ||
      finalValue,

    raw:
      item,
  };
};

/* =====================================================
   LOAD SCHEMA REFERENCE OPTIONS
===================================================== */

const loadSchemaReferenceOptions =
  async (
    fields: any[]
  ) => {
    return Promise.all(
      (
        Array.isArray(
          fields
        )
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
            getDataSource(
              field
            );

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
                  ? field
                    .options
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
              `Datasource placeholder is unresolved for product field "${field.key}":`,
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
                    field
                      ?.queryParams ||
                    dataSource
                      ?.queryParams ||
                    {},
                }
              );

            const fieldType =
              getFieldType(
                field
              );

            const records =
              EMPLOYEE_REFERENCE_FIELD_TYPES.has(
                fieldType
              )
                ? extractEmployeeChildUsers(
                  response
                    ?.data
                )
                : extractGenericRecords(
                  response
                    ?.data
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
                );

            return {
              ...field,

              dataSource,

              api:
                requestUrl,

              options,
            };
          } catch (
          error: any
          ) {
            console.error(
              `Failed to load datasource for product field "${field.key}":`,
              error
                ?.response
                ?.data ||
              error
            );

            return {
              ...field,

              dataSource,

              api:
                requestUrl,

              options:
                [],
            };
          }
        }
      )
    );
  };

/* =====================================================
   NORMALIZE REFERENCE VALUE
===================================================== */

const normalizeReferenceValue = (
  field: any,
  value: any
) => {
  if (
    !value ||
    typeof value !==
    "object" ||
    Array.isArray(
      value
    )
  ) {
    return null;
  }

  const fieldType =
    getFieldType(
      field
    );

  if (
    EMPLOYEE_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    return {
      userMobileNumberHash:
        value
          ?.userMobileNumberHash ||
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
        value
          ?.parentUserMobileNumber ||
        value?.parentMobile ||
        "",
    };
  }

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
        value
          ?.vehicle_number ||
        value?.label
      ),
  };
};

/* =====================================================
   GET REFERENCE SELECT VALUE
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
    return String(
      value
    );
  }

  const fieldType =
    getFieldType(
      field
    );

  if (
    EMPLOYEE_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    return String(
      value
        ?.userMobileNumberHash ||
      value?.mobile ||
      ""
    );
  }

  return String(
    value?.code ||
    value?.productCode ||
    value?.unitCode ||
    value?.accountCode ||
    value?.voucherNumber ||
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
  option:
    | ReferenceOption
    | undefined,
  fallbackValue: string
) => {
  const raw =
    option?.raw ||
    {};

  const fieldType =
    getFieldType(
      field
    );

  /* ============================================
     EMPLOYEE MASTER
  ============================================ */

  if (
    EMPLOYEE_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    return {
      userMobileNumberHash:
        raw
          ?.userMobileNumberHash ||
        raw?.mobile ||
        option?.value ||
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
        raw
          ?.parentUserMobileNumber ||
        raw?.parentMobile ||
        "",
    };
  }

  const dynamicData =
    raw?.data ||
    raw?.dynamicFields ||
    raw?.customFields ||
    raw;

  /* ============================================
     ACCOUNT MASTER
  ============================================ */

  if (
    fieldType ===
    "accountmaster"
  ) {
    return {
      code:
        raw?.accountCode ||
        raw?.code ||
        option?.value ||
        fallbackValue,

      name:
        getTextValue(
          raw?.accountName ||
          raw?.name ||
          option?.label
        ),
    };
  }

  /* ============================================
     PRODUCT MASTER
  ============================================ */

  if (
    fieldType ===
    "productmaster"
  ) {
    return {
      code:
        raw?.productCode ||
        raw?.code ||
        option?.value ||
        fallbackValue,

      name:
        getTextValue(
          raw?.productName ||
          raw?.name ||
          option?.label
        ),
    };
  }

  /* ============================================
     UNIT MASTER
  ============================================ */

  if (
    fieldType ===
    "unitmaster"
  ) {
    return {
      code:
        raw?.unitCode ||
        raw?.code ||
        option?.value ||
        fallbackValue,

      name:
        getTextValue(
          raw?.unitName ||
          raw?.name ||
          option?.label
        ),
    };
  }

  /* ============================================
     CUSTOM MASTER
  ============================================ */

  return {
    code:
      dynamicData?.code ||
      raw?.code ||
      raw?.voucherNumber ||
      raw?._id ||
      option?.value ||
      fallbackValue,

    name:
      getTextValue(
        dynamicData?.name ||
        dynamicData
          ?.vehicle_number ||
        raw?.name ||
        option?.label
      ),
  };
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
    typeof value ===
    "string" &&
    value
      .trim()
      .toLowerCase() ===
    "false"
  );
};

const isSchemaDefaultTrue = (
  field: any
) => {
  const value =
    field?.isDefault;

  if (
    value === true ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  return (
    typeof value ===
    "string" &&
    value
      .trim()
      .toLowerCase() ===
    "true"
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
    Record<
      string,
      any
    >
  >({});

  const [
    errors,
    setErrors,
  ] = useState<
    Record<
      string,
      string
    >
  >({});

  const [
    productMasterSchemaFields,
    setProductMasterSchemaFields,
  ] = useState<any[]>(
    []
  );

  const [
    schemaLoading,
    setSchemaLoading,
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
     DYNAMIC SCHEMA FIELD CHECK

     Rules:
     1. Account/Product/Unit/Employee references always
        go inside dynamicFields.
     2. Any schema field where isDefault is false,
        "false", 0 or "0" goes inside dynamicFields.
     3. Default fields remain at payload root.
     4. Existing dynamic flags remain supported.
  =================================================== */

  const isDynamicSchemaField = (
    field: any
  ) => {
    const fieldType =
      getFieldType(
        field
      );

    /* ============================================
       MASTER REFERENCE TYPES
    ============================================ */

    if (
      DYNAMIC_MASTER_FIELD_TYPES.has(
        fieldType
      )
    ) {
      return true;
    }

    /* ============================================
       SCHEMA isDefault FALSE
    ============================================ */

    if (
      isSchemaDefaultFalse(
        field
      )
    ) {
      return true;
    }

    /* ============================================
       EXISTING DYNAMIC FLAGS
    ============================================ */

    if (
      field?.isDynamic ===
      true
    ) {
      return true;
    }

    if (
      field
        ?.isDynamicField ===
      true
    ) {
      return true;
    }

    if (
      field?.isCustomField ===
      true
    ) {
      return true;
    }

    if (
      field?.source ===
      "dynamic"
    ) {
      return true;
    }

    if (
      field?.fieldSource ===
      "dynamic"
    ) {
      return true;
    }

    /* ============================================
       DEFAULT FIELD
    ============================================ */

    if (
      isSchemaDefaultTrue(
        field
      )
    ) {
      return false;
    }

    /* ============================================
       EXISTING SYSTEM FLAGS
    ============================================ */

    if (
      field?.isDynamic ===
      false
    ) {
      return false;
    }

    if (
      field?.isSystemField ===
      true
    ) {
      return false;
    }

    return !PRODUCT_SYSTEM_FIELD_KEYS.has(
      field?.key
    );
  };

  /* ===================================================
     BUILD EMPTY FORM
  =================================================== */

  const buildEmptyForm = (
    fields: any[] = []
  ) =>
    fields.reduce(
      (
        accumulator:
          Record<
            string,
            any
          >,

        field: any
      ) => {
        const fieldType =
          getFieldType(
            field
          );

        if (
          fieldType ===
          "boolean"
        ) {
          accumulator[
            field.key
          ] = false;
        } else if (
          isMasterReferenceField(
            field
          )
        ) {
          accumulator[
            field.key
          ] = null;
        } else {
          accumulator[
            field.key
          ] = "";
        }

        return accumulator;
      },

      {}
    );

  /* ===================================================
     GET EDIT VALUE
  =================================================== */

  const getComparableValue = (
    field: any,
    product: any
  ) => {
    const key =
      field.key;

    const fieldType =
      getFieldType(
        field
      );

    const hasTopLevelValue =
      Object.prototype
        .hasOwnProperty
        .call(
          product || {},
          key
        );

    const hasDynamicValue =
      Object.prototype
        .hasOwnProperty
        .call(
          product
            ?.dynamicFields ||
          {},
          key
        );

    let value: any =
      "";

    if (
      hasTopLevelValue
    ) {
      value =
        product?.[
        key
        ];
    } else if (
      hasDynamicValue
    ) {
      value =
        product
          ?.dynamicFields?.[
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
      key ===
      "productType"
    ) {
      return normalizeProductType(
        value || ""
      );
    }

    if (
      key ===
      "unit"
    ) {
      if (
        typeof value ===
        "object" &&
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

      return (
        value ?? ""
      );
    }

    if (
      fieldType ===
      "number"
    ) {
      return (
        value === undefined ||
          value === null ||
          value === ""
          ? ""
          : Number(
            value
          )
      );
    }

    if (
      fieldType ===
      "boolean"
    ) {
      return getBooleanValue(
        value
      );
    }

    return (
      value ?? ""
    );
  };

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
          fieldsWithOptions
        );
      } catch (
      error: any
      ) {
        setProductMasterSchemaFields(
          []
        );

        toast.error(
          error
            ?.response
            ?.data
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
  =================================================== */

  useEffect(() => {
    if (!show) {
      setShowUnitModal(
        false
      );

      setUnitSearchValue(
        ""
      );

      return;
    }

    loadProductSchema();
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
            getComparableValue(
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
        nextForm
          .productName =
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
        Record<
          string,
          any[]
        > = {};

      productMasterSchemaFields.forEach(
        (
          field: any
        ) => {
          const fieldType =
            getFieldType(
              field
            );

          if (
            fieldType !==
            "select"
          ) {
            return;
          }

          /* =========================================
             UNIT FIELD
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
              units?.map(
                (
                  item: any
                ) => {
                  const value =
                    item?.[
                    field
                      .valueField
                    ] ||
                    item?.unitCode ||
                    item?.code ||
                    "";

                  const label =
                    item?.[
                    field
                      .labelField
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
              ) ||
              [];

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
    ]);

  /* ===================================================
     VALIDATE FORM
  =================================================== */

  const validateForm =
    () => {
      const validationErrors:
        Record<
          string,
          string
        > = {};

      productMasterSchemaFields.forEach(
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

          const required =
            field.isRequired ||
            field.required;

          if (
            required
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
                EMPLOYEE_REFERENCE_FIELD_TYPES.has(
                  fieldType
                )
              ) {
                if (
                  !String(
                    value
                      ?.userMobileNumberHash ||
                    ""
                  ).trim()
                ) {
                  validationErrors[
                    field.key
                  ] =
                    `${field.label} required`;
                }
              } else if (
                !String(
                  value?.code ||
                  ""
                ).trim() ||
                !String(
                  value?.name ||
                  ""
                ).trim()
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
             HSN VALIDATION
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
             NEGATIVE NUMBER
          ========================================= */

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

          /* =========================================
             INVALID NUMBER
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
     RENDER SCHEMA FIELD
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
        field?.disabled ||
        field?.isReadonly ||
        submitting,
    };

    /* =========================================
       MASTER REFERENCE
    ========================================= */

    if (
      isMasterReferenceField(
        field
      )
    ) {
      const options =
        (
          Array.isArray(
            field?.options
          )
            ? field.options
            : []
        ) as ReferenceOption[];

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
            field?.disabled ||
            field?.isReadonly ||
            submitting ||
            schemaLoading
          }
          styles={{
            menuPortal:
              (
                base:
                  any
              ) => ({
                ...base,

                zIndex:
                  2147483647,
              }),

            menu:
              (
                base:
                  any
              ) => ({
                ...base,

                zIndex:
                  2147483647,
              }),
          }}
          options={[
            {
              value:
                "",

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
            const nextValue =
              String(
                event?.target
                  ?.value ??
                ""
              );

            if (
              !nextValue
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
                  option
                ) =>
                  String(
                    option.value
                  ) ===
                  nextValue
              );

            updateField(
              field.key,

              buildSelectedReferenceValue(
                field,
                selectedOption,
                nextValue
              )
            );
          }}
        />
      );
    }

    /* =========================================
       SELECT
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
              field?.disabled ||
              field?.isReadonly ||
              submitting
            }
            options={
              fieldOptionsMap[
              field.key
              ] ||
              []
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
            menuPortal:
              (
                base:
                  any
              ) => ({
                ...base,

                zIndex:
                  2147483647,
              }),

            menu:
              (
                base:
                  any
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
            field?.disabled ||
            field?.isReadonly ||
            submitting
          }
          options={
            fieldOptionsMap[
            field.key
            ] ||
            []
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

    /* =========================================
       BOOLEAN TOGGLE
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
            field?.disabled ||
            field?.isReadonly ||
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

    /* =========================================
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

    /* =========================================
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

    /* =========================================
       HSN CODE
    ========================================= */

    if (
      field.key ===
      "productHSNCode"
    ) {
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
            const numericValue =
              event.target
                .value
                .replace(
                  /\D/g,
                  ""
                )
                .slice(
                  0,
                  8
                );

            updateField(
              field.key,
              numericValue
            );
          }}
        />
      );
    }

    /* =========================================
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

    /* =========================================
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

      const payload:
        Record<
          string,
          any
        > = {};

      const dynamicFields:
        Record<
          string,
          any
        > = {
        ...(
          editingProduct
            ?.dynamicFields ||
          {}
        ),
      };

      productMasterSchemaFields.forEach(
        (
          field: any
        ) => {
          const fieldType =
            getFieldType(
              field
            );

          let value =
            form?.[
            field.key
            ];

          /* =========================================
             NORMALIZE REFERENCE VALUE
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
             NORMALIZE NUMBER
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
             NORMALIZE BOOLEAN
          ========================================= */

          else if (
            fieldType ===
            "boolean"
          ) {
            value =
              getBooleanValue(
                value
              );
          }

          /* =========================================
             DYNAMIC OR ROOT PAYLOAD
          ========================================= */

          if (
            isDynamicSchemaField(
              field
            )
          ) {
            dynamicFields[
              field.key
            ] =
              value;
          } else {
            payload[
              field.key
            ] =
              value;
          }
        }
      );

      payload.dynamicFields =
        dynamicFields;

      setSubmitting(
        true
      );

      try {
        let response: any;

        /* =========================================
           UPDATE PRODUCT
        ========================================= */

        if (
          editingProduct
            ?.productCode
        ) {
          response =
            await professionalAxios.put(
              `/eTaxSolnMongoApiBackend/productMaster/updateProduct/${editingProduct.productCode}`,
              payload
            );

          toast.success(
            "Product updated successfully"
          );
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

        const savedProduct =
          getProductFromResponse(
            response
          ) ||
          payload;

        if (
          onSaved
        ) {
          await onSaved(
            savedProduct
          );
        }

        setShow(
          false
        );

        setErrors({});

        setForm(
          buildEmptyForm(
            productMasterSchemaFields
          )
        );
      } catch (
      error: any
      ) {
        const apiErrors =
          error?.error ||
          error?.errors ||
          error
            ?.response
            ?.data
            ?.error ||
          error
            ?.response
            ?.data
            ?.errors ||
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
          error
            ?.response
            ?.data
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
                  field
                    ?.isHidden
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
      productMasterSchemaFields,
      form,
      errors,
      fieldOptionsMap,
      submitting,
    ]);

  /* ===================================================
     PORTAL GUARD
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

  /* ===================================================
     UI
  =================================================== */

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
              handleSubmit={
                handleSubmit
              }
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
          value:
            boolean
        ) => {
          setShowUnitModal(
            value
          );

          if (!value) {
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