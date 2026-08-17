import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import {
  getProfessionalUsers,
  addProfessionalUser,
  deleteProfessionalUser,
  updateProfessionalUser,
} from "../../redux/slices/professionalSlice/professionalUserSlice";

import {
  verifyPanWithHeader,
  resetVerifyPan,
} from "../../redux/slices/professionalSlice/panVerify/panVerify";

import {
  clearTeamEmployeeSchemaError,
  getTeamEmployeeSchema,
  isTrue,
  isUserStatusField,
  normalizeSelectOptions,
  normalizeUserStatusValue,
  type TeamEmployeeSchemaField,
} from "../../redux/slices/systemConf/teamEmployeeSchemaSlice";

import {
  getCustomMasterListing,
} from "../../redux/slices/professionalSlice/customMasterModuleSlice";

import professionalAxios from "../../services/professionalAxios";

import { toast } from "react-toastify";
import {
  Edit,
  Trash2,
} from "lucide-react";

import ConfirmTooltip from "../../components/common/ConfirmTooltip";
import { formatToDDMMYYYY } from "../../components/common/DateFormator";
import SearchInput from "../../components/searchInput";

import {
  DataCreateButton,
  DataREfreshButton,
} from "../../components/buttons";

import DataTable from "../../components/DataTable";
import Pagination from "../../components/pagination";
import Modal from "../../components/modal";

import {
  SelectInput,
  TextInput,
  ToggleInput,
} from "../../components/inputs";

/* ===================================================
   TYPES
=================================================== */

type CustomMasterOption = {
  label: string;
  value: string;
  code?: string;
  name?: string;
  raw: any;
};

type FormDataState = Record<
  string,
  any
>;

type FormErrorState = Record<
  string,
  string
>;

type ReferenceOption = {
  label: string;
  value: string;
  raw: any;
  code?: string;
  name?: string;
};

/* ===================================================
   MASTER REFERENCE TYPES
=================================================== */

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


const EMPLOYEE_REFERENCE_FIELD_TYPES =
  new Set([
    "employeemaster",
    "customemployeemaster",
    "teamemployeemaster",
  ]);

/* ===================================================
   DATASOURCE HELPERS
=================================================== */

const getFieldDataSource = (
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

const getSchemaFieldType = (
  field: any
) => {
  const dataSource =
    getFieldDataSource(
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

const isMasterReferenceField = (
  field: any
) =>
  MASTER_REFERENCE_FIELD_TYPES.has(
    getSchemaFieldType(
      field
    )
  );

/* ===================================================
   CUSTOM MASTER MULTI SELECT
=================================================== */

const isCustomMasterMultiSelectField = (
  field: any
) => {
  const fieldType =
    getSchemaFieldType(
      field
    );

  const dataSource =
    getFieldDataSource(
      field
    );

  const selectionType =
    String(
      field?.selectionType ||
      dataSource?.selectionType ||
      ""
    )
      .trim()
      .toLowerCase();

  return (
    fieldType ===
    "custommaster" &&
    selectionType ===
    "multiselect"
  );
};

const getReferenceText = (
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
      value.vehicle_number ||
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

const resolveReferenceDataSourceApi = (
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

const buildReferenceRequestUrl = (
  rawApi: string
) => {
  const resolvedApi =
    resolveReferenceDataSourceApi(
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

  if (
    baseHasBackendPrefix
  ) {
    return relativeApi.replace(
      /^eTaxSolnMongoApiBackend\/?/i,
      ""
    );
  }

  if (
    !relativeApi
      .toLowerCase()
      .startsWith(
        backendPrefix
          .toLowerCase()
      )
  ) {
    relativeApi =
      `${backendPrefix}/${relativeApi}`;
  }

  return relativeApi;
};

const extractGenericReferenceRecords = (
  responseData: any
): any[] => {
  const roots = [
    responseData,
    responseData?.data,
    responseData?.result,
    responseData?.payload,
    responseData?.data?.data,
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

const extractEmployeeChildUsers = (
  responseData: any
): any[] => {
  const result =
    Array.isArray(
      responseData?.result
    )
      ? responseData.result
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
        record?.ChildUsers
      )
        ? record.ChildUsers
        : []
  );
};

const buildReferenceOption = (
  field: any,
  item: any
): ReferenceOption | null => {
  const fieldType =
    getSchemaFieldType(
      field
    );

  const dataSource =
    getFieldDataSource(
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
      dataSource
        ?.valueField ||
      ""
    ).trim();

  let labelField =
    String(
      field?.labelField ||
      dataSource
        ?.labelField ||
      ""
    ).trim();

  let optionValue: any =
    "";

  let optionLabel: any =
    "";

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
  } else if (
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
  } else if (
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
  } else if (
    EMPLOYEE_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    optionValue =
      item
        ?.userMobileNumberHash ||
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
  } else if (
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
      getReferenceText(
        optionLabel
      ) ||
      finalValue,

    raw:
      item,
  };
};

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
            getFieldDataSource(
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
                  field
                    ?.options
                )
                  ? field.options
                  : [],
            };
          }

          const requestUrl =
            buildReferenceRequestUrl(
              rawApi
            );

          if (
            !requestUrl ||
            /\{[^}]+\}/.test(
              requestUrl
            )
          ) {
            console.error(
              `Datasource placeholder is unresolved for employee field "${field.key}":`,
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
              getSchemaFieldType(
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
                : extractGenericReferenceRecords(
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
              `Failed to load datasource for employee field "${field.key}":`,
              error?.response
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

const normalizeReferenceValue = (
  field: any,
  value: any
) => {
  const fieldType =
    getSchemaFieldType(
      field
    );

  if (
    isCustomMasterMultiSelectField(
      field
    )
  ) {
    if (
      !Array.isArray(
        value
      )
    ) {
      return [];
    }

    return value
      .map(
        (
          item: any
        ) => {
          if (!item) {
            return null;
          }

          if (
            typeof item ===
            "object" &&
            !Array.isArray(
              item
            )
          ) {
            const code =
              item?.code ||
              item?.productCode ||
              item?.unitCode ||
              item?.accountCode ||
              item?.voucherNumber ||
              item?.value ||
              item?._id ||
              "";

            const name =
              getReferenceText(
                item?.name ||
                item?.productName ||
                item?.unitName ||
                item?.accountName ||
                item?.vehicle_number ||
                item?.label
              );

            if (
              !String(
                code
              ).trim()
            ) {
              return null;
            }

            return {
              code:
                String(
                  code
                ),

              name,
            };
          }

          const code =
            String(
              item ??
              ""
            ).trim();

          if (!code) {
            return null;
          }

          return {
            code,
            name: "",
          };
        }
      )
      .filter(
        Boolean
      );
  }

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
        value
          ?.parentMobile ||
        "",
    };
  }

  return {
    code:
      value?.code ||
      value?.productCode ||
      value?.unitCode ||
      value?.accountCode ||
      value
        ?.voucherNumber ||
      value?.value ||
      value?._id ||
      "",

    name:
      getReferenceText(
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

const getReferenceSelectValue = (
  field: any,
  value: any
) => {
  if (
    isCustomMasterMultiSelectField(
      field
    )
  ) {
    if (
      !Array.isArray(
        value
      )
    ) {
      return [];
    }

    return value
      .map(
        (
          item: any
        ) => {
          if (
            item &&
            typeof item ===
            "object"
          ) {
            return String(
              item?.code ||
              item?.voucherNumber ||
              item?.value ||
              item?._id ||
              ""
            );
          }

          return String(
            item ??
            ""
          );
        }
      )
      .filter(
        Boolean
      );
  }

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
    getSchemaFieldType(
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
    value
      ?.voucherNumber ||
    value?.value ||
    value?._id ||
    ""
  );
};

const buildSelectedReferenceValue = (
  field: any,
  option:
    ReferenceOption | undefined,
  fallbackValue: string
) => {
  const raw =
    option?.raw ||
    {};

  const fieldType =
    getSchemaFieldType(
      field
    );

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
        raw
          ?.parentMobile ||
        "",
    };
  }

  const dynamicData =
    raw?.data ||
    raw?.dynamicFields ||
    raw?.customFields ||
    raw;

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
        getReferenceText(
          raw?.accountName ||
          raw?.name ||
          option?.label
        ),
    };
  }

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
        getReferenceText(
          raw?.productName ||
          raw?.name ||
          option?.label
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
        option?.value ||
        fallbackValue,

      name:
        getReferenceText(
          raw?.unitName ||
          raw?.name ||
          option?.label
        ),
    };
  }

  return {
    code:
      dynamicData?.code ||
      raw?.code ||
      raw
        ?.voucherNumber ||
      raw?._id ||
      option?.value ||
      fallbackValue,

    name:
      getReferenceText(
        dynamicData?.name ||
        dynamicData
          ?.vehicle_number ||
        raw?.name ||
        option?.label
      ),
  };
};

const isReferenceValueEmpty = (
  field: any,
  value: any
) => {
  const normalized =
    normalizeReferenceValue(
      field,
      value
    );

  if (
    isCustomMasterMultiSelectField(
      field
    )
  ) {
    const selectedValues =
      Array.isArray(
        normalized
      )
        ? normalized
        : [];

    return (
      selectedValues.length ===
      0 ||
      selectedValues.some(
        (
          item: any
        ) =>
          !String(
            item?.code ||
            ""
          ).trim() ||
          !String(
            item?.name ||
            ""
          ).trim()
      )
    );
  }

  if (!normalized) {
    return true;
  }

  const fieldType =
    getSchemaFieldType(
      field
    );

  if (
    EMPLOYEE_REFERENCE_FIELD_TYPES.has(
      fieldType
    )
  ) {
    return !String(
      normalized
        ?.userMobileNumberHash ||
      ""
    ).trim();
  }

  return (
    !String(
      normalized?.code ||
      ""
    ).trim() ||
    !String(
      normalized?.name ||
      ""
    ).trim()
  );
};

/* ===================================================
   CORE API KEY MAPPING
=================================================== */

const CORE_API_KEY_MAP: Record<
  string,
  string
> = {
  firstName:
    "userFirstName",

  userFirstName:
    "userFirstName",

  middleName:
    "userMiddleName",

  userMiddleName:
    "userMiddleName",

  lastName:
    "userLastName",

  userLastName:
    "userLastName",

  mobile:
    "userMobileNumberHash",

  mobileNumber:
    "userMobileNumberHash",

  userMobileNumberHash:
    "userMobileNumberHash",

  email:
    "userEmail",

  userEmail:
    "userEmail",

  gender:
    "userGender",

  userGender:
    "userGender",

  dateOfBirth:
    "userDOB",

  dob:
    "userDOB",

  userDOB:
    "userDOB",

  pan:
    "userPAN",

  userPAN:
    "userPAN",

  aadhar:
    "userAadhar",

  aadhaar:
    "userAadhar",

  userAadhar:
    "userAadhar",

  userType:
    "userType",

  userStatus:
    "isUserActive",

  isUserActive:
    "isUserActive",
};

/* ===================================================
   LEGACY EDIT VALUE MAPPING
=================================================== */

const LEGACY_EDIT_VALUE_BY_SCHEMA_KEY: Record<
  string,
  (item: any) => any
> = {
  firstName:
    (item) =>
      item?.userFirstName,

  userFirstName:
    (item) =>
      item?.userFirstName,

  middleName:
    (item) =>
      item?.userMiddleName,

  userMiddleName:
    (item) =>
      item?.userMiddleName,

  lastName:
    (item) =>
      item?.userLastName,

  userLastName:
    (item) =>
      item?.userLastName,

  mobile:
    (item) =>
      item
        ?.userMobileNumberHash,

  mobileNumber:
    (item) =>
      item
        ?.userMobileNumberHash,

  userMobileNumberHash:
    (item) =>
      item
        ?.userMobileNumberHash,

  email:
    (item) =>
      item?.userEmail,

  userEmail:
    (item) =>
      item?.userEmail,

  gender:
    (item) =>
      item?.userGender,

  userGender:
    (item) =>
      item?.userGender,

  dateOfBirth:
    (item) =>
      item?.userDOB,

  dob:
    (item) =>
      item?.userDOB,

  userDOB:
    (item) =>
      item?.userDOB,

  pan:
    (item) =>
      item?.userPAN,

  userPAN:
    (item) =>
      item?.userPAN,

  aadhar:
    (item) =>
      item?.userAadhar,

  aadhaar:
    (item) =>
      item?.userAadhar,

  userAadhar:
    (item) =>
      item?.userAadhar,

  userType:
    (item) =>
      item?.userType ||
      "Tax Payer / Employee",

  userStatus:
    (item) =>
      item?.isUserActive ??
      item?.dynamicFields
        ?.userStatus ??
      item?.dynamicFields
        ?.isUserActive ??
      item
        ?.childUserCustomFields
        ?.userStatus ??
      item
        ?.childUserCustomFields
        ?.isUserActive,

  isUserActive:
    (item) =>
      item?.isUserActive,
};

/* ===================================================
   FIELD HELPERS
=================================================== */

const onlyDigits = (
  value: any
) =>
  String(
    value || ""
  ).replace(
    /\D+/g,
    ""
  );

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
    return value === 1;
  }

  if (
    typeof value ===
    "string"
  ) {
    const normalizedValue =
      value
        .trim()
        .toLowerCase();

    return (
      normalizedValue ===
      "true" ||
      normalizedValue ===
      "1" ||
      normalizedValue ===
      "yes" ||
      normalizedValue ===
      "active"
    );
  }

  return false;
};

const isValidEmail = (
  value: any
) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(
      value || ""
    )
  );

const isValidIndianMobile = (
  value: any
) =>
  /^[6-9]\d{9}$/.test(
    onlyDigits(
      value
    )
  );

const isValidPan = (
  value: any
) =>
  /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
    String(
      value || ""
    )
      .trim()
      .toUpperCase()
  );

const fieldKeyLower = (
  field: TeamEmployeeSchemaField
) =>
  String(
    field?.key || ""
  )
    .trim()
    .toLowerCase();

const fieldLabelLower = (
  field: TeamEmployeeSchemaField
) =>
  String(
    field?.label || ""
  )
    .trim()
    .toLowerCase();

const isMobileField = (
  field: TeamEmployeeSchemaField
) => {
  const key =
    fieldKeyLower(field);

  const label =
    fieldLabelLower(field);

  return (
    key.includes("mobile") ||
    key.includes("phone") ||
    label.includes("mobile") ||
    label.includes("phone")
  );
};

const isEmailField = (
  field: TeamEmployeeSchemaField
) => {
  const key =
    fieldKeyLower(field);

  const label =
    fieldLabelLower(field);

  return (
    key.includes("email") ||
    label.includes("email")
  );
};

const isPanField = (
  field: TeamEmployeeSchemaField
) => {
  const key =
    fieldKeyLower(field);

  const label =
    fieldLabelLower(field);

  return (
    key === "pan" ||
    key === "userpan" ||
    label === "pan" ||
    label.includes(
      "pan number"
    )
  );
};

const isDobField = (
  field: TeamEmployeeSchemaField
) => {
  const key =
    fieldKeyLower(field);

  const label =
    fieldLabelLower(field);

  return (
    key.includes("dob") ||
    key.includes(
      "dateofbirth"
    ) ||
    key.includes("birth") ||
    label.includes(
      "date of birth"
    ) ||
    label.includes(
      "birth date"
    )
  );
};

// const isCustomMasterField = (
//   field: TeamEmployeeSchemaField
// ) => {
//   return (
//     getSchemaFieldType(
//       field
//     ) ===
//     "custommaster" &&
//     Boolean(
//       String(
//         field
//           ?.customMasterCode ||
//         ""
//       ).trim()
//     )
//   );
// };

const isEmptyValue = (
  value: any
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return true;
  }

  if (
    typeof value ===
    "string"
  ) {
    return (
      value.trim() ===
      ""
    );
  }

  return false;
};

/* ===================================================
   DATE HELPER
=================================================== */

const formatDateOnly = (
  value: any
) => {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return value;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
      1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return (
    `${year}-${month}-${day}`
  );
};

/* ===================================================
   EDIT VALUE RESOLVER
=================================================== */

const resolveStoredFieldValue = (
  item: any,
  key: string
) => {
  if (!item || !key) {
    return undefined;
  }

  const rootValue =
    item?.[key];

  if (
    rootValue !==
    undefined &&
    rootValue !== null
  ) {
    return rootValue;
  }

  const custom =
    item
      ?.childUserCustomFields ||
    {};

  const customValue =
    custom?.[key];

  if (
    customValue !==
    undefined &&
    customValue !== null
  ) {
    return customValue;
  }

  const nestedCustom =
    custom
      ?.childUserCustomFields ||
    {};

  const nestedValue =
    nestedCustom?.[key];

  if (
    nestedValue !==
    undefined &&
    nestedValue !== null
  ) {
    return nestedValue;
  }

  const dynamic =
    item?.dynamicFields ||
    custom?.dynamicFields ||
    nestedCustom
      ?.dynamicFields ||
    {};

  const dynamicValue =
    dynamic?.[key];

  if (
    dynamicValue !==
    undefined &&
    dynamicValue !== null
  ) {
    return dynamicValue;
  }

  return undefined;
};

/* ===================================================
   CUSTOM MASTER RESPONSE HELPERS
=================================================== */

const extractCustomMasterRecords = (
  payload: any
) => {
  const roots = [
    payload,
    payload?.data,
    payload?.result,
    payload?.payload,
    payload?.data?.data,
  ];

  for (const root of roots) {
    if (Array.isArray(root)) {
      return root;
    }

    if (
      root &&
      typeof root ===
      "object"
    ) {
      if (
        Array.isArray(
          root?.items
        )
      ) {
        return root.items;
      }

      if (
        Array.isArray(
          root?.records
        )
      ) {
        return root.records;
      }

      if (
        Array.isArray(
          root?.docs
        )
      ) {
        return root.docs;
      }
    }
  }

  return [];
};

const getCustomMasterData = (
  item: any
) => {
  return (
    item?.data ||
    item?.dynamicFields ||
    item?.customFields ||
    item ||
    {}
  );
};

const buildCustomMasterOptions = (
  records: any[]
): CustomMasterOption[] => {
  return (
    Array.isArray(records)
      ? records
      : []
  )
    .map(
      (
        item: any
      ): CustomMasterOption | null => {
        const data =
          getCustomMasterData(
            item
          );

        const code =
          String(
            data?.code ||
            item
              ?.voucherNumber ||
            data
              ?.vehicle_number ||
            item?.code ||
            item?._id ||
            ""
          ).trim();

        const name =
          String(
            data?.name ||
            data
              ?.vehicle_number ||
            item?.name ||
            item
              ?.voucherNumber ||
            code
          ).trim();

        const value =
          code || name;

        if (!value) {
          return null;
        }

        return {
          label:
            name || code,

          value,

          code:
            code || value,

          name:
            name ||
            code ||
            value,

          raw: item,
        };
      }
    )
    .filter(
      (
        option
      ): option is CustomMasterOption =>
        option !== null
    );
};

/* ===================================================
   INITIAL FORM HELPERS
=================================================== */

// const getCustomMasterPrefill = (
//   value: any
// ) => {
//   if (
//     value === null ||
//     value === undefined
//   ) {
//     return "";
//   }

//   if (
//     typeof value !==
//     "object"
//   ) {
//     return String(value);
//   }

//   return String(
//     value?.code ||
//     value?.value ||
//     value
//       ?.voucherNumber ||
//     value?._id ||
//     ""
//   );
// };

const getInitialFieldValue = (
  field: TeamEmployeeSchemaField,
  editingAccount: any
) => {
  const isEditMode =
    Boolean(
      editingAccount
        ?.userMobileNumberHash
    );

  if (!isEditMode) {
    if (
      field?.key ===
      "userType"
    ) {
      return (
        "Tax Payer / Employee"
      );
    }

    if (
      isUserStatusField(
        field
      )
    ) {
      return "1";
    }

    if (
      isCustomMasterMultiSelectField(
        field
      )
    ) {
      return [];
    }

    if (
      getSchemaFieldType(
        field
      ) ===
      "boolean"
    ) {
      return false;
    }

    return "";
  }

  const legacyGetter =
    LEGACY_EDIT_VALUE_BY_SCHEMA_KEY[
    field.key
    ];

  const storedValue =
    resolveStoredFieldValue(
      editingAccount,
      field.key
    ) ??
    (
      legacyGetter
        ? legacyGetter(
          editingAccount
        )
        : undefined
    );

  if (
    isUserStatusField(
      field
    )
  ) {
    return normalizeUserStatusValue(
      storedValue
    );
  }

  if (
    getSchemaFieldType(
      field
    ) ===
    "boolean"
  ) {
    return getBooleanValue(
      storedValue
    );
  }

  if (
    isMasterReferenceField(
      field
    )
  ) {
    return normalizeReferenceValue(
      field,
      storedValue
    );
  }

  if (
    getSchemaFieldType(
      field
    ) ===
    "date" ||
    isDobField(field)
  ) {
    return formatDateOnly(
      storedValue
    );
  }

  if (
    storedValue ===
    null ||
    storedValue ===
    undefined
  ) {
    return "";
  }

  if (
    typeof storedValue ===
    "object"
  ) {
    return "";
  }

  return String(
    storedValue
  );
};

const buildInitialForm = (
  fields:
    TeamEmployeeSchemaField[],
  editingAccount: any
) => {
  const form: FormDataState =
    {};

  const errors:
    FormErrorState = {};

  fields.forEach(
    (field) => {
      if (!field?.key) {
        return;
      }

      form[field.key] =
        getInitialFieldValue(
          field,
          editingAccount
        );

      errors[field.key] =
        "";
    }
  );

  return {
    form,
    errors,
  };
};

/* ===================================================
   MAIN COMPONENT
=================================================== */

const Users = () => {
  const dispatch =
    useDispatch<any>();

  const {
    users = [],
    loading,
    pagination,
  } = useSelector(
    (state: any) =>
      state.professionalUser
  );

  const {
    loading: panLoading,
  } = useSelector(
    (state: any) =>
      state.verifyPan
  );

  const {
    fields:
    allSchemaFields = [],
    loading:
    schemaLoading,
    error:
    schemaError,
  } = useSelector(
    (state: any) =>
      state
        .teamEmployeeSchema
  );

  const [
    localPage,
    setLocalPage,
  ] = useState(1);

  const [
    localLimit,
    setLocalLimit,
  ] = useState(10);

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
    editingAccount,
    setEditingAccount,
  ] = useState<any>(
    null
  );

  const [
    formData,
    setFormData,
  ] =
    useState<FormDataState>(
      {}
    );

  const [
    errors,
    setErrors,
  ] =
    useState<FormErrorState>(
      {}
    );

  const [
    customMasterOptions,
    setCustomMasterOptions,
  ] = useState<
    Record<
      string,
      CustomMasterOption[]
    >
  >({});

  const [
    customMasterLoading,
    setCustomMasterLoading,
  ] = useState<
    Record<
      string,
      boolean
    >
  >({});

  const [
    panVerified,
    setPanVerified,
  ] = useState(false);

  const [
    panVerifyFailed,
    setPanVerifyFailed,
  ] = useState(false);

  const [
    confirmTooltip,
    setConfirmTooltip,
  ]: any = useState({
    show: false,
    x: null,
    y: null,
    mobile: null,
  });

  const isEditMode =
    Boolean(
      editingAccount
        ?.userMobileNumberHash
    );

  const schemaFields =
    useMemo(() => {
      return (
        Array.isArray(
          allSchemaFields
        )
          ? allSchemaFields
          : []
      ).filter(
        (
          field:
            TeamEmployeeSchemaField
        ) =>
          !isTrue(
            field?.isHidden
          )
      );
    }, [
      allSchemaFields,
    ]);

  const anyCustomMasterLoading =
    useMemo(() => {
      return Object.values(
        customMasterLoading
      ).some(Boolean);
    }, [
      customMasterLoading,
    ]);

  /* ===================================================
     LOAD USERS
  =================================================== */

  useEffect(() => {
    dispatch(
      getProfessionalUsers({
        page:
          localPage,

        limit:
          localLimit,
      })
    );
  }, [
    dispatch,
    localPage,
    localLimit,
  ]);

  /* ===================================================
     LOAD SCHEMA
  =================================================== */

  useEffect(() => {
    dispatch(
      getTeamEmployeeSchema({
        offset: 0,
        limit: 100,
      })
    );
  }, [
    dispatch,
  ]);

  /* ===================================================
     SCHEMA ERROR
  =================================================== */

  useEffect(() => {
    if (!schemaError) {
      return;
    }

    toast.error(
      schemaError
    );

    dispatch(
      clearTeamEmployeeSchemaError()
    );
  }, [
    schemaError,
    dispatch,
  ]);

  /* ===================================================
     INITIALIZE MODAL FORM
  =================================================== */

  useEffect(() => {
    if (!showModal) {
      return;
    }

    const initial =
      buildInitialForm(
        schemaFields,
        editingAccount
      );

    setFormData(
      initial.form
    );

    setErrors(
      initial.errors
    );

    setPanVerified(
      Boolean(
        editingAccount
          ?.userPAN
      )
    );

    setPanVerifyFailed(
      false
    );
  }, [
    showModal,
    schemaFields,
    editingAccount,
  ]);

  /* ===================================================
     LOAD MASTER REFERENCE OPTIONS

     - Uses each schema field's dataSource.api.
     - Replaces {userMobileNumberHash} from localStorage.
     - Extracts employee records from result[].ChildUsers.
     - Keeps existing custom-master thunk as fallback when
       a custommaster field has no datasource API.
  =================================================== */

  useEffect(() => {
    if (
      !showModal ||
      !schemaFields.length
    ) {
      return;
    }

    let active = true;

    const loadOptions =
      async () => {
        const referenceFields =
          schemaFields.filter(
            isMasterReferenceField
          );

        if (
          !referenceFields.length
        ) {
          if (active) {
            setCustomMasterOptions(
              {}
            );

            setCustomMasterLoading(
              {}
            );
          }

          return;
        }

        for (
          const field of
          referenceFields
        ) {
          if (active) {
            setCustomMasterLoading(
              (
                previous
              ) => ({
                ...previous,

                [field.key]:
                  true,
              })
            );
          }

          try {
            const fieldType =
              getSchemaFieldType(
                field
              );

            const dataSource =
              getFieldDataSource(
                field
              );

            const rawApi =
              String(
                field?.api ||
                dataSource?.api ||
                ""
              ).trim();

            let options:
              ReferenceOption[] =
              [];

            /*
             * Existing custom-master fallback.
             * This keeps Vehicle Master and other
             * custom masters working even when an old
             * schema field has no dataSource.api.
             */
            if (
              fieldType ===
              "custommaster" &&
              !rawApi &&
              field
                ?.customMasterCode
            ) {
              const moduleCode =
                String(
                  field
                    .customMasterCode
                ).trim();

              const result =
                await dispatch(
                  getCustomMasterListing({
                    moduleCode,
                    offset: 0,
                    limit: 1000,
                    search: "",
                  })
                ).unwrap();

              options =
                buildCustomMasterOptions(
                  extractCustomMasterRecords(
                    result
                  )
                );
            } else {
              const [
                loadedField,
              ] =
                await loadSchemaReferenceOptions(
                  [
                    field,
                  ]
                );

              options =
                Array.isArray(
                  loadedField
                    ?.options
                )
                  ? loadedField
                    .options
                  : [];
            }

            if (active) {
              setCustomMasterOptions(
                (
                  previous
                ) => ({
                  ...previous,

                  [field.key]:
                    options,
                })
              );
            }
          } catch (
          error: any
          ) {
            console.log(
              `Failed to load ${field?.label} options:`,
              error
            );

            if (active) {
              setCustomMasterOptions(
                (
                  previous
                ) => ({
                  ...previous,

                  [field.key]:
                    [],
                })
              );
            }
          } finally {
            if (active) {
              setCustomMasterLoading(
                (
                  previous
                ) => ({
                  ...previous,

                  [field.key]:
                    false,
                })
              );
            }
          }
        }
      };

    loadOptions();

    return () => {
      active = false;
    };
  }, [
    dispatch,
    showModal,
    schemaFields,
  ]);

  /* ===================================================
     FILTER USERS
  =================================================== */

  const filteredUsers =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      return (
        Array.isArray(
          users
        )
          ? users
          : []
      ).filter(
        (user: any) => {
          const name =
            [
              user
                ?.userFirstName,
              user
                ?.userMiddleName,
              user
                ?.userLastName,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return (
            name.includes(
              search
            ) ||
            String(
              user
                ?.userEmail ||
              ""
            )
              .toLowerCase()
              .includes(
                search
              ) ||
            String(
              user
                ?.userMobileNumberHash ||
              ""
            ).includes(
              search
            )
          );
        }
      );
    }, [
      users,
      searchTerm,
    ]);

  /* ===================================================
     RESET FORM
  =================================================== */

  const resetUserForm =
    useCallback(() => {
      const initial =
        buildInitialForm(
          schemaFields,
          null
        );

      setFormData(
        initial.form
      );

      setErrors(
        initial.errors
      );

      setEditingAccount(
        null
      );

      setCustomMasterOptions(
        {}
      );

      setCustomMasterLoading(
        {}
      );

      setPanVerified(
        false
      );

      setPanVerifyFailed(
        false
      );

      dispatch(
        resetVerifyPan()
      );
    }, [
      schemaFields,
      dispatch,
    ]);

  const openCreateModal =
    () => {
      setEditingAccount(
        null
      );

      setShowModal(
        true
      );
    };

  const openEditModal =
    (account: any) => {
      setEditingAccount(
        account
      );

      setShowModal(
        true
      );
    };

  const closeModal =
    () => {
      setShowModal(
        false
      );

      resetUserForm();
    };

  /* ===================================================
     REFRESH
  =================================================== */

  const handleRefresh =
    async () => {
      await dispatch(
        getProfessionalUsers({
          page:
            localPage,

          limit:
            localLimit,
        })
      );

      toast.success(
        "List refreshed"
      );
    };

  /* ===================================================
     FIELD CHANGE
  =================================================== */

  const handleSchemaFieldChange =
    (
      field:
        TeamEmployeeSchemaField,
      eventOrValue: any
    ) => {
      let value =
        eventOrValue
          ?.target?.type ===
          "checkbox"
          ? eventOrValue
            .target
            .checked
          : eventOrValue
            ?.target
            ?.value ??
          eventOrValue;

      if (
        isMobileField(
          field
        )
      ) {
        value =
          onlyDigits(
            value
          ).slice(
            0,
            10
          );
      }

      if (
        isPanField(
          field
        )
      ) {
        value =
          String(
            value || ""
          )
            .toUpperCase()
            .replace(
              /[^A-Z0-9]/g,
              ""
            )
            .slice(
              0,
              10
            );

        setPanVerified(
          false
        );

        setPanVerifyFailed(
          false
        );

        dispatch(
          resetVerifyPan()
        );
      }

      if (
        getSchemaFieldType(
          field
        ) ===
        "number"
      ) {
        value =
          String(
            value ?? ""
          ).replace(
            /[^\d.-]/g,
            ""
          );
      }

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          [field.key]:
            value,
        })
      );

      setErrors(
        (
          previous
        ) => ({
          ...previous,

          [field.key]:
            "",
        })
      );
    };

  /* ===================================================
     PAN VERIFICATION
  =================================================== */

  const handleVerifyPan =
    async (
      field:
        TeamEmployeeSchemaField
    ) => {
      const pan =
        String(
          formData[
          field.key
          ] ||
          ""
        )
          .trim()
          .toUpperCase();

      if (!pan) {
        toast.error(
          "PAN is required"
        );

        return;
      }

      if (
        !isValidPan(
          pan
        )
      ) {
        setPanVerified(
          false
        );

        setPanVerifyFailed(
          true
        );

        setErrors(
          (
            previous
          ) => ({
            ...previous,

            [field.key]:
              "Enter valid PAN",
          })
        );

        toast.error(
          "Enter valid PAN"
        );

        return;
      }

      try {
        const response =
          await dispatch(
            verifyPanWithHeader({
              pan,
            })
          ).unwrap();

        setPanVerified(
          true
        );

        setPanVerifyFailed(
          false
        );

        setErrors(
          (
            previous
          ) => ({
            ...previous,

            [field.key]:
              "",
          })
        );

        toast.success(
          response?.message ||
          "PAN verified successfully"
        );
      } catch (
      error: any
      ) {
        setPanVerified(
          false
        );

        setPanVerifyFailed(
          true
        );

        setErrors(
          (
            previous
          ) => ({
            ...previous,

            [field.key]:
              "PAN verification failed",
          })
        );

        toast.error(
          error?.message ||
          error ||
          "PAN verification failed"
        );
      }
    };

  /* ===================================================
     VALIDATION
  =================================================== */

  const validateForm =
    () => {
      const nextErrors:
        FormErrorState = {};

      const today =
        new Date();

      const maximumDob =
        new Date(
          today.getFullYear() -
          18,
          today.getMonth(),
          today.getDate()
        );

      schemaFields.forEach(
        (
          field:
            TeamEmployeeSchemaField
        ) => {
          const rawValue =
            formData[
            field.key
            ];

          const fieldType =
            getSchemaFieldType(
              field
            );

          nextErrors[
            field.key
          ] = "";

          const empty =
            fieldType ===
              "boolean"
              ? rawValue ===
              null ||
              rawValue ===
              undefined
              : isMasterReferenceField(
                field
              )
                ? isReferenceValueEmpty(
                  field,
                  rawValue
                )
                : isEmptyValue(
                  rawValue
                );

          if (
            isTrue(
              field
                ?.isRequired
            ) &&
            empty
          ) {
            nextErrors[
              field.key
            ] =
              `${field.label} is required`;

            return;
          }

          if (empty) {
            return;
          }

          if (
            fieldType ===
            "number" &&
            !/^-?\d+(\.\d+)?$/.test(
              String(
                rawValue
              )
            )
          ) {
            nextErrors[
              field.key
            ] =
              `${field.label} must be a valid number`;

            return;
          }

          if (
            isEmailField(
              field
            ) &&
            !isValidEmail(
              rawValue
            )
          ) {
            nextErrors[
              field.key
            ] =
              "Invalid email";

            return;
          }

          if (
            isMobileField(
              field
            ) &&
            !isValidIndianMobile(
              rawValue
            )
          ) {
            nextErrors[
              field.key
            ] =
              "Mobile must be a valid 10-digit Indian number";

            return;
          }

          if (
            isPanField(
              field
            )
          ) {
            const pan =
              String(
                rawValue ||
                ""
              )
                .trim()
                .toUpperCase();

            if (
              !isValidPan(
                pan
              )
            ) {
              nextErrors[
                field.key
              ] =
                "Enter valid PAN";

              return;
            }

            const originalPan =
              String(
                editingAccount
                  ?.userPAN ||
                ""
              )
                .trim()
                .toUpperCase();

            const panUnchanged =
              isEditMode &&
              pan ===
              originalPan;

            if (
              !panVerified &&
              !panUnchanged
            ) {
              nextErrors[
                field.key
              ] =
                "Please verify PAN";

              return;
            }
          }

          if (
            (
              fieldType ===
              "date" ||
              isDobField(
                field
              )
            ) &&
            isDobField(
              field
            )
          ) {
            const selectedDate =
              new Date(
                rawValue
              );

            if (
              Number.isNaN(
                selectedDate
                  .getTime()
              )
            ) {
              nextErrors[
                field.key
              ] =
                "Select valid date of birth";

              return;
            }

            if (
              selectedDate >
              maximumDob
            ) {
              nextErrors[
                field.key
              ] =
                "User must be 18+";
            }
          }
        }
      );

      setErrors(
        nextErrors
      );

      return Object.values(
        nextErrors
      ).every(
        (error) =>
          !error
      );
    };

  /* ===================================================
     MASTER REFERENCE PAYLOAD VALUE
  =================================================== */

  const getMasterReferencePayloadValue =
    (
      field:
        TeamEmployeeSchemaField,
      value: any
    ) => {
      const normalizedValue =
        normalizeReferenceValue(
          field,
          value
        );

      if (
        normalizedValue
      ) {
        return normalizedValue;
      }

      const existingValue =
        resolveStoredFieldValue(
          editingAccount,
          field.key
        );

      const normalizedExistingValue =
        normalizeReferenceValue(
          field,
          existingValue
        );

      if (
        normalizedExistingValue
      ) {
        return normalizedExistingValue;
      }

      return null;
    };

  /* ===================================================
     BUILD PAYLOAD
  =================================================== */

  const buildSavePayload =
    () => {
      /*
       * Team/Employee payload rule:
       *
       * - Do not create or send dynamicFields.
       * - isDefault false is intentionally ignored here.
       * - Account/Product/Unit/Employee/Custom Master
       *   reference values stay directly at the root.
       * - Legacy dynamicFields are still read while editing
       *   through resolveStoredFieldValue(), but are migrated
       *   to their normal root-level schema keys on save.
       */

      const payload:
        Record<string, any> =
        {};

      schemaFields.forEach(
        (
          field:
            TeamEmployeeSchemaField
        ) => {
          if (!field?.key) {
            return;
          }

          const fieldType =
            getSchemaFieldType(
              field
            );

          const apiKey =
            CORE_API_KEY_MAP[
            field.key
            ] ||
            field.key;

          /*
           * These are wrapper/reserved keys and must not
           * be created from schema fields.
           */
          if (
            apiKey ===
            "childUserCustomFields" ||
            apiKey ===
            "dynamicFields" ||
            apiKey ===
            "ChildUser"
          ) {
            return;
          }

          let value =
            formData[
            field.key
            ];

          /* =========================================
             MASTER REFERENCE

             All reference values remain at the root:
             accountmaster
             productmaster
             unitmaster
             employeemaster
             customemployeemaster
             teamemployeemaster
             custommaster
          ========================================= */

          if (
            isMasterReferenceField(
              field
            )
          ) {
            const referenceValue =
              getMasterReferencePayloadValue(
                field,
                value
              );

            if (
              !referenceValue
            ) {
              return;
            }

            payload[
              apiKey
            ] =
              referenceValue;

            return;
          }

          /* =========================================
             BOOLEAN
          ========================================= */

          if (
            fieldType ===
            "boolean"
          ) {
            payload[
              apiKey
            ] =
              getBooleanValue(
                value
              );

            return;
          }

          /* =========================================
             NUMBER
          ========================================= */

          if (
            fieldType ===
            "number"
          ) {
            const numericText =
              String(
                value ?? ""
              )
                .trim()
                .replace(
                  /,/g,
                  ""
                );

            if (!numericText) {
              return;
            }

            payload[
              apiKey
            ] =
              Number(
                numericText
              );

            return;
          }

          /* =========================================
             DATE / DOB
          ========================================= */

          if (
            fieldType ===
            "date" ||
            isDobField(
              field
            )
          ) {
            value =
              formatDateOnly(
                value
              );
          }

          /* =========================================
             MOBILE
          ========================================= */

          if (
            isMobileField(
              field
            )
          ) {
            value =
              onlyDigits(
                value
              );
          }

          /* =========================================
             PAN
          ========================================= */

          if (
            isPanField(
              field
            )
          ) {
            value =
              String(
                value ||
                ""
              )
                .trim()
                .toUpperCase();
          }

          /* =========================================
             USER STATUS
          ========================================= */

          if (
            isUserStatusField(
              field
            )
          ) {
            value =
              normalizeUserStatusValue(
                value
              );
          }

          /* =========================================
             EMPTY VALUE
          ========================================= */

          if (
            isEmptyValue(
              value
            )
          ) {
            if (
              isTrue(
                field
                  ?.isRequired
              )
            ) {
              payload[
                apiKey
              ] = "";
            }

            return;
          }

          /*
           * IMPORTANT:
           * field.isDefault is not used to create
           * dynamicFields in Team/Employee.
           */
          payload[
            apiKey
          ] =
            typeof value ===
              "string"
              ? value.trim()
              : value;
        }
      );

      if (
        !payload.deviceId
      ) {
        payload.deviceId =
          "dev2030";
      }

      if (isEditMode) {
        const matchMobile =
          String(
            payload
              ?.userMobileNumberHash ||
            editingAccount
              ?.userMobileNumberHash ||
            ""
          ).trim();

        return {
          ChildUser: {
            matchMobile,
            ...payload,
          },
        };
      }

      return payload;
    };

  /* ===================================================
     SUBMIT
  =================================================== */

  const handleSubmit =
    async (
      event: any
    ) => {
      event.preventDefault();

      if (
        schemaLoading ||
        anyCustomMasterLoading
      ) {
        return;
      }

      if (
        !schemaFields.length
      ) {
        toast.error(
          "Team/Employee schema fields not found"
        );

        return;
      }

      if (
        !validateForm()
      ) {
        return;
      }

      const payload =
        buildSavePayload();

      console.log(
        "TEAM/EMPLOYEE PAYLOAD:",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      try {
        if (
          isEditMode
        ) {
          await dispatch(
            updateProfessionalUser({
              parentMobile:
                editingAccount
                  ?.parentUserMobileNumber,

              data:
                payload,
            })
          ).unwrap();

          toast.success(
            "Account updated successfully"
          );
        } else {
          await dispatch(
            addProfessionalUser(
              payload
            )
          ).unwrap();

          toast.success(
            "Employee/Team added successfully"
          );
        }

        setShowModal(
          false
        );

        resetUserForm();

        setLocalPage(
          1
        );

        await dispatch(
          getProfessionalUsers({
            page: 1,
            limit:
              localLimit,
          })
        );
      } catch (
      error: any
      ) {
        toast.error(
          error?.message ||
          error?.response
            ?.data
            ?.message ||
          "Failed to save Employee/Team"
        );
      }
    };

  /* ===================================================
     DELETE
  =================================================== */

  const handleDelete =
    async (
      mobile: string
    ) => {
      try {
        await dispatch(
          deleteProfessionalUser(
            mobile
          )
        ).unwrap();

        toast.success(
          "User deleted successfully"
        );

        await dispatch(
          getProfessionalUsers({
            page:
              localPage,

            limit:
              localLimit,
          })
        );
      } catch {
        toast.error(
          "Failed to delete user"
        );
      } finally {
        setConfirmTooltip({
          show: false,
          x: null,
          y: null,
          mobile: null,
        });
      }
    };

  /* ===================================================
     DYNAMIC FIELD RENDERER
  =================================================== */

  const renderSchemaField =
    (
      field:
        TeamEmployeeSchemaField
    ) => {
      const fieldType =
        getSchemaFieldType(
          field
        );

      const value =
        formData[
        field.key
        ] ?? "";

      const error =
        errors[
        field.key
        ];

      const mandatory =
        isTrue(
          field
            ?.isRequired
        );

      const label =
        field?.label ||
        field?.key;

      /* ===============================
         PAN
      =============================== */

      if (
        isPanField(
          field
        )
      ) {
        return (
          <div
            key={
              field.key
            }
          >
            <label className="text-sm font-medium text-card-foreground">
              {label}

              {mandatory
                ? " *"
                : ""}
            </label>

            <div className="relative">
              <input
                name={
                  field.key
                }
                maxLength={
                  10
                }
                value={
                  String(
                    value ||
                    ""
                  )
                }
                onChange={(
                  event
                ) =>
                  handleSchemaFieldChange(
                    field,
                    event
                  )
                }
                placeholder="Enter PAN (ABCDE1234F)"
                className="h-11 w-full rounded-md border border-border bg-input px-4 pr-24 text-sm text-foreground placeholder:text-muted-foreground outline-none transition duration-200 hover:border-primary/60 focus:border-primary focus:ring-1 focus:ring-primary/20"
              />

              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
                {panVerified ? (
                  <span className="text-lg font-bold text-success">
                    ✔
                  </span>
                ) : panVerifyFailed ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleVerifyPan(
                        field
                      )
                    }
                    className="px-1 text-lg font-bold text-danger"
                    title="PAN verification failed. Retry"
                  >
                    ✖
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleVerifyPan(
                        field
                      )
                    }
                    disabled={
                      panLoading
                    }
                    className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-60"
                  >
                    {panLoading
                      ? "Verifying..."
                      : "Verify"}
                  </button>
                )}
              </div>
            </div>

            {error ? (
              <p className="text-xs text-danger">
                {error}
              </p>
            ) : null}
          </div>
        );
      }

      /* ===============================
         USER STATUS
      =============================== */

      if (
        isUserStatusField(
          field
        )
      ) {
        return (
          <SelectInput
            key={
              field.key
            }
            label={
              label
            }
            mandatory={
              mandatory
            }
            value={
              normalizeUserStatusValue(
                value
              )
            }
            name={
              field.key
            }
            onChange={(
              event: any
            ) =>
              handleSchemaFieldChange(
                field,
                event
              )
            }
            placeholder="Select user status"
            error={
              error
            }
            options={[
              {
                value:
                  "0",
                label:
                  "Inactive",
              },
              {
                value:
                  "1",
                label:
                  "Active",
              },
            ]}
          />
        );
      }

      /* ===============================
         MASTER REFERENCE FIELD

         Supports:
         - Account Master
         - Product Master
         - Unit Master
         - Team / Employee Master
         - Custom Master / Vehicle Master
         - Custom Master Multi Select
      =============================== */

      if (
        isMasterReferenceField(
          field
        )
      ) {
        const options =
          customMasterOptions[
          field.key
          ] || [];

        const fieldLoading =
          Boolean(
            customMasterLoading[
            field.key
            ]
          );

        const isMultiSelect =
          isCustomMasterMultiSelectField(
            field
          );

        const selectedValue =
          getReferenceSelectValue(
            field,
            value
          );

        const selectOptions =
          isMultiSelect
            ? options.map(
              (
                option
              ) => ({
                value:
                  option.value,

                label:
                  option.label,
              })
            )
            : [
              {
                value:
                  "",

                label:
                  fieldLoading
                    ? `Loading ${label}...`
                    : options.length >
                      0
                      ? `Select ${label}`
                      : `No ${label} found`,
              },

              ...options.map(
                (
                  option
                ) => ({
                  value:
                    option.value,

                  label:
                    option.label,
                })
              ),
            ];

        return (
          <SelectInput
            key={
              field.key
            }
            label={
              label
            }
            mandatory={
              mandatory
            }
            value={
              selectedValue
            }
            name={
              field.key
            }
            isMulti={
              isMultiSelect
            }
            onChange={(
              event: any
            ) => {
              const nextValue =
                event?.target
                  ?.value;

              if (
                isMultiSelect
              ) {
                const selectedValues =
                  Array.isArray(
                    nextValue
                  )
                    ? nextValue
                    : [];

                const selectedReferences =
                  selectedValues
                    .map(
                      (
                        selectedCode: any
                      ) => {
                        const selectedOption =
                          options.find(
                            (
                              option
                            ) =>
                              String(
                                option
                                  ?.value
                              ) ===
                              String(
                                selectedCode
                              )
                          );

                        return buildSelectedReferenceValue(
                          field,
                          selectedOption,
                          String(
                            selectedCode
                          )
                        );
                      }
                    )
                    .filter(
                      (
                        selectedReference: any
                      ) =>
                        selectedReference &&
                        String(
                          selectedReference
                            ?.code ||
                          ""
                        ).trim()
                    );

                handleSchemaFieldChange(
                  field,
                  selectedReferences
                );

                return;
              }

              const singleValue =
                String(
                  nextValue ??
                  ""
                );

              if (!singleValue) {
                handleSchemaFieldChange(
                  field,
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
                      option
                        ?.value
                    ) ===
                    singleValue
                );

              handleSchemaFieldChange(
                field,
                buildSelectedReferenceValue(
                  field,
                  selectedOption,
                  singleValue
                )
              );
            }}
            placeholder={
              fieldLoading
                ? `Loading ${label}...`
                : `Select ${label}`
            }
            error={
              error
            }
            options={
              selectOptions
            }
            disabled={
              fieldLoading
            }
            largeData
            batchSize={
              100
            }
          />
        );
      }

      /* ===============================
         SELECT
      =============================== */

      if (
        fieldType ===
        "select"
      ) {
        const options =
          normalizeSelectOptions(
            field?.options
          );

        return (
          <SelectInput
            key={
              field.key
            }
            label={
              label
            }
            mandatory={
              mandatory
            }
            value={
              String(
                value ||
                ""
              )
            }
            name={
              field.key
            }
            onChange={(
              event: any
            ) =>
              handleSchemaFieldChange(
                field,
                event
              )
            }
            placeholder={`Select ${label}`}
            error={
              error
            }
            options={[
              {
                value:
                  "",

                label:
                  `Select ${label}`,
              },

              ...options,
            ]}
          />
        );
      }

      /* ===============================
         DATE
      =============================== */

      if (
        fieldType ===
        "date"
      ) {
        const today =
          new Date();

        const maximumDob =
          new Date(
            today.getFullYear() -
            18,
            today.getMonth(),
            today.getDate()
          );

        return (
          <TextInput
            key={
              field.key
            }
            label={
              label
            }
            name={
              field.key
            }
            mandatory={
              mandatory
            }
            value={
              String(
                value ||
                ""
              )
            }
            onChange={(
              event: any
            ) =>
              handleSchemaFieldChange(
                field,
                event
              )
            }
            placeholder={`Select ${label}`}
            type="date"
            max={
              isDobField(
                field
              )
                ? formatDateOnly(
                  maximumDob
                )
                : undefined
            }
            error={
              error
            }
          />
        );
      }

      /* ===============================
         NUMBER
      =============================== */

      if (
        fieldType ===
        "number"
      ) {
        return (
          <TextInput
            key={
              field.key
            }
            label={
              label
            }
            name={
              field.key
            }
            mandatory={
              mandatory
            }
            value={
              String(
                value ??
                ""
              )
            }
            onChange={(
              event: any
            ) =>
              handleSchemaFieldChange(
                field,
                event
              )
            }
            placeholder={`Enter ${label}`}
            type="text"
            error={
              error
            }
          />
        );
      }

      /* ===============================
         BOOLEAN
      =============================== */

      if (
        fieldType ===
        "boolean"
      ) {
        const booleanValue =
          getBooleanValue(
            value
          );

        return (
          <ToggleInput
            key={
              field.key
            }
            label={
              label
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
              mandatory
            }
            error={
              error
            }
            disabled={
              Boolean(
                field?.disabled ||
                field?.isReadonly ||
                schemaLoading ||
                anyCustomMasterLoading
              )
            }
            onChange={(
              event: any
            ) =>
              handleSchemaFieldChange(
                field,
                event?.target
                  ?.checked ??
                false
              )
            }
          />
        );
      }

      /* ===============================
         STRING / TEXT
      =============================== */

      return (
        <TextInput
          key={
            field.key
          }
          label={
            label
          }
          name={
            field.key
          }
          mandatory={
            mandatory
          }
          value={
            String(
              value ??
              ""
            )
          }
          onChange={(
            event: any
          ) =>
            handleSchemaFieldChange(
              field,
              event
            )
          }
          placeholder={`Enter ${label}`}
          type={
            isEmailField(
              field
            )
              ? "email"
              : "text"
          }
          maxLength={
            isMobileField(
              field
            )
              ? 10
              : undefined
          }
          disabled={
            isEditMode &&
            (
              isMobileField(
                field
              ) ||
              isEmailField(
                field
              )
            )
          }
          error={
            error
          }
        />
      );
    };

  /* ===================================================
     MODAL BODY
  =================================================== */

  const modalBody = (
    <>
      {schemaLoading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Loading Team/Employee fields...
        </div>
      ) : schemaFields.length ? (
        <>
          {schemaFields.map(
            renderSchemaField
          )}

          {anyCustomMasterLoading ? (
            <p className="text-xs text-muted-foreground">
              Loading Vehicle Master options...
            </p>
          ) : null}
        </>
      ) : (
        <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-card-foreground">
            No fields configured
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Add Team/Employee schema fields from Master Configuration.
          </p>
        </div>
      )}
    </>
  );

  /* ===================================================
     TABLE
  =================================================== */

  const totalCount =
    pagination?.totalDocs ??
    0;

  const totalPages =
    pagination?.totalPages ??
    1;

  const page =
    pagination?.currentPage ??
    localPage;

  const columns = [
    {
      key: "name",
      title: "Name",

      render:
        (row: any) => (
          <>
            {[
              row
                ?.userFirstName,
              row
                ?.userMiddleName,
              row
                ?.userLastName,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )}
          </>
        ),
    },

    {
      key:
        "userEmail",

      title:
        "Email",
    },

    {
      key:
        "userMobileNumberHash",

      title:
        "Mobile",
    },

    {
      key:
        "accountEmail",

      title:
        "DOB",

      render:
        (row: any) => (
          <>
            {formatToDDMMYYYY(
              row
                ?.userDOB
            )}
          </>
        ),
    },

    {
      key:
        "userType",

      title:
        "Type",
    },

    {
      key:
        "userGender",

      title:
        "Gender",
    },
  ];

  /* ===================================================
     UI — EXISTING UI KEPT
  =================================================== */

  return (
    <div className="flex h-full min-h-0 flex-col bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SearchInput
            search={
              searchTerm
            }
            setSearch={
              setSearchTerm
            }
          />

          <DataREfreshButton
            callBackFn={
              handleRefresh
            }
          />

          <DataCreateButton
            callBackFn={
              openCreateModal
            }
            text="Add Team/Employee"
          />
        </div>
      </div>

      <DataTable
        columns={
          columns
        }
        data={
          filteredUsers
        }
        loading={
          loading
        }
        emptyMessage="No accounts found"
        actions={(
          each: any
        ) => (
          <div className="flex items-center gap-2">
            <button
              id="account-edit-button"
              onClick={() =>
                openEditModal(
                  each
                )
              }
              className="cursor-pointer rounded-md p-2 text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
            >
              <Edit
                size={
                  16
                }
              />
            </button>

            <button
              onClick={(
                event: any
              ) => {
                const rect =
                  event
                    .currentTarget
                    .getBoundingClientRect();

                setConfirmTooltip({
                  show:
                    true,

                  x:
                    rect.left +
                    window
                      .scrollX -
                    160,

                  y:
                    rect.top +
                    window
                      .scrollY -
                    5,

                  mobile:
                    each
                      ?.userMobileNumberHash,
                });
              }}
              className="cursor-pointer rounded-md p-2 text-danger transition-all duration-200 hover:bg-danger/10 hover:text-danger"
            >
              <Trash2
                size={
                  16
                }
              />
            </button>
          </div>
        )}
      />

      <Modal
        show={
          showModal
        }
        setShow={
          closeModal
        }
        // @ts-ignore
        handleSubmit={handleSubmit}
        title="Team/Employee"
        state={
          editingAccount
        }
        body={
          modalBody
        }
      />

      {totalCount > 0 ? (
        <Pagination
          localLimit={
            localLimit
          }
          selectCb={(
            event:
              React.ChangeEvent<HTMLSelectElement>
          ) => {
            setLocalLimit(
              Number(
                event
                  .target
                  .value
              )
            );

            setLocalPage(
              1
            );
          }}
          preDisabled={
            page === 1
          }
          nextDisabled={
            page ===
            totalPages
          }
          setLocalOffset={
            setLocalPage
          }
          pagination={
            pagination
          }
        />
      ) : null}

      {confirmTooltip.show ? (
        <ConfirmTooltip
          x={
            confirmTooltip.x
          }
          y={
            confirmTooltip.y
          }
          message="Are you sure you want to delete this user?"
          confirmText="Yes"
          cancelText="Cancel"
          onConfirm={() =>
            handleDelete(
              confirmTooltip.mobile
            )
          }
          onCancel={() =>
            setConfirmTooltip({
              show:
                false,

              x:
                null,

              y:
                null,

              mobile:
                null,
            })
          }
        />
      ) : null}
    </div>
  );
};

export default Users;