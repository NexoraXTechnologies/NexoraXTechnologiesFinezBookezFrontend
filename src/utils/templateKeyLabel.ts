// src/utils/templateKeyLabel.ts

const prefixMap: Record<string, string> = {
  accountMaster: "Acc",
  companyMaster: "Comp",
  module: "",
};

const modulePrefixMap: Record<string, string> = {
  sOrder: "Sales Order",
  sQuote: "Sales Quotation",
  sInv: "Sales Invoice",
  pInv: "Purchase Invoice",
};

const langMap: Record<string, string> = {
  en: "English",
  hi: "Hindi",
};

const wordMap: Record<string, string> = {
  gst: "GST",
  ifsc: "IFSC",
  upi: "UPI",
  iso: "ISO",
};

const splitCamelCase = (value: string) => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
};

const capitalize = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatWord = (word: string) => {
  if (!word) return "";

  const lowerWord = word.toLowerCase();

  if (langMap[lowerWord]) return langMap[lowerWord];

  return splitCamelCase(word)
    .split(" ")
    .map((item) => {
      const lowerItem = item.toLowerCase();

      if (wordMap[lowerItem]) return wordMap[lowerItem];

      return capitalize(item);
    })
    .join(" ");
};

export const getTemplateKeyLabel = (key: unknown): string => {
  /**
   * Important:
   * This prevents crash when key is array/object/null/undefined.
   */
  if (typeof key !== "string") {
    return "";
  }

  if (!key.trim()) return "";

  const parts = key.split(".");
  const namespace = parts[0];

  if (namespace === "module") {
    const firstKey = parts[1];

    const matchedModulePrefix = Object.keys(modulePrefixMap).find((moduleKey) =>
      firstKey?.startsWith(moduleKey)
    );

    if (matchedModulePrefix) {
      const readableModulePrefix = modulePrefixMap[matchedModulePrefix];
      const cleanedFirstKey = firstKey.replace(matchedModulePrefix, "");

      return [
        readableModulePrefix,
        formatWord(cleanedFirstKey),
        ...parts.slice(2).map(formatWord),
      ]
        .filter(Boolean)
        .join(" ");
    }
  }

  const prefix = prefixMap[namespace] ?? formatWord(namespace);

  return [prefix, ...parts.slice(1).map(formatWord)]
    .filter(Boolean)
    .join(" ");
};

export const makeTemplateKeyOptions = (keys: unknown) => {
  if (!Array.isArray(keys)) return [];

  return keys
    .filter((key): key is string => typeof key === "string")
    .map((key) => ({
      value: key,
      label: getTemplateKeyLabel(key),
    }));
};

export const makeTemplateKeyLabelMap = (keys: unknown) => {
  if (!Array.isArray(keys)) return {};

  return keys
    .filter((key): key is string => typeof key === "string")
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = getTemplateKeyLabel(key);
      return acc;
    }, {});
};