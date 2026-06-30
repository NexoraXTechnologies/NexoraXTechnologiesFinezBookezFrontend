export const BOM_STORAGE_KEY = "ENGINEERING_BOM_RECORDS";

export const loadBomRecords = async () => {
    const raw = localStorage.getItem(BOM_STORAGE_KEY);

    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const saveBomRecords = async (records: any[]) => {
    localStorage.setItem(BOM_STORAGE_KEY, JSON.stringify(records));
};

export const getBomRecordById = async (id: string) => {
    const records = await loadBomRecords();
    return records.find((r: any) => r.id === id) || null;
};

export const upsertBomRecord = async (record: any) => {
    const records = await loadBomRecords();
    const now = new Date().toISOString();

    const payload = {
        ...record,
        updatedAt: now,
    };

    if (record.id) {
        const idx = records.findIndex((r: any) => r.id === record.id);

        if (idx >= 0) {
            records[idx] = {
                ...records[idx],
                ...payload,
            };
        } else {
            records.unshift({
                ...payload,
                createdAt: now,
            });
        }
    } else {
        records.unshift({
            id: `bom_${Date.now()}`,
            bomNo: `BOM-${String(records.length + 1).padStart(4, "0")}`,
            createdAt: now,
            ...payload,
        });
    }

    await saveBomRecords(records);
    return records;
};

export const deleteBomRecord = async (id: string) => {
    const records = await loadBomRecords();
    const next = records.filter((r: any) => r.id !== id);

    await saveBomRecords(next);
    return next;
};

export const nextBomNumber = async () => {
    const records = await loadBomRecords();
    return `BOM-${String(records.length + 1).padStart(4, "0")}`;
};