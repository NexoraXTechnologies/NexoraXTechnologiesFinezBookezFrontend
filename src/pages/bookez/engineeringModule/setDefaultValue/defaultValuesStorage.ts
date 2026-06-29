export const DEFAULT_CONFIG_KEY = "ENGINEERING_PRODUCT_DEFAULTS";

export const productOptions = [{ label: "Chassis", value: "chassis" }];

export const getProductLabel = (productType: string) =>
  productOptions.find((p) => p.value === productType)?.label ||
  String(productType || "Product");

const migrateLegacyObject = (legacy: any) => {
  const now = new Date().toISOString();

  return Object.entries(legacy).map(([productType, values]: any) => ({
    id: `${productType}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`,
    productType,
    productName: getProductLabel(productType),
    savedAt: now,
    values: values || {},
  }));
};

export const loadDefaultRecords = async () => {
  const raw = localStorage.getItem(DEFAULT_CONFIG_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed;

    if (parsed && typeof parsed === "object") {
      const migrated = migrateLegacyObject(parsed);
      await saveDefaultRecords(migrated);
      return migrated;
    }
  } catch {
    return [];
  }

  return [];
};

export const saveDefaultRecords = async (records: any[]) => {
  localStorage.setItem(DEFAULT_CONFIG_KEY, JSON.stringify(records));
};

export const getLatestValuesForProduct = async (productType: string) => {
  const records = await loadDefaultRecords();
  const matching = records.filter((r: any) => r.productType === productType);

  if (!matching.length) return null;

  matching.sort(
    (a: any, b: any) =>
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  return matching[0]?.values || null;
};

export const upsertDefaultRecord = async ({
  id,
  productType,
  values,
}: {
  id?: string;
  productType: string;
  values: any;
}) => {
  const records = await loadDefaultRecords();
  const now = new Date().toISOString();

  const payload = {
    productType,
    productName: getProductLabel(productType),
    savedAt: now,
    values,
  };

  if (id) {
    const idx = records.findIndex((r: any) => r.id === id);

    if (idx >= 0) {
      records[idx] = { ...records[idx], ...payload };
    } else {
      records.unshift({ id, ...payload });
    }
  } else {
    records.unshift({
      id: `${productType}_${Date.now()}`,
      ...payload,
    });
  }

  await saveDefaultRecords(records);
  return records;
};

export const deleteDefaultRecord = async (id: string) => {
  const records = await loadDefaultRecords();
  const next = records.filter((r: any) => r.id !== id);

  await saveDefaultRecords(next);
  return next;
};