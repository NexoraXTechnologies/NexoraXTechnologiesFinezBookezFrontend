const emptyDateSection = () => ({
    issueDate: "",
    expiryDate: "",
});

export const createEmptyBreakdown = () => ({
    breakdownDate: "",
    breakdownReason: "",
    breakdownLocation: "",
    tripNumber: "",
    tripFrom: "",
    tripTo: "",
    odometerReading: "",
    repairStatus: "",
});

export const createInitialVehicleMaintenance = () => ({
    vehicleCode: "",
    vehicleNumber: "",
    vehicleType: "",
    driverCode: "",
    driverName: "",

    pucDetails: {
        certificateNumber: "",
        ...emptyDateSection(),
    },

    insuranceDetails: {
        insuranceCompany: "",
        policyNumber: "",
        ...emptyDateSection(),
    },

    passingDetails: {
        passingNumber: "",
        ...emptyDateSection(),
    },

    fitnessCertificateDetails: {
        certificateNumber: "",
        ...emptyDateSection(),
    },

    permitDetails: {
        permitType: "",
        permitNumber: "",
        ...emptyDateSection(),
    },

    roadTaxDetails: {
        receiptNumber: "",
        paidDate: "",
        validTill: "",
    },

    batteryDetails: {
        batteryBrand: "",
        batterySeriesNumber: "",
        batteryInstalledDate: "",
        batteryExpiryDate: "",
    },

    tyreDetails: {
        totalTyres: "",
        tyreBrand: "",
        tyreSeriesNumbers: [],
        lastChangedDate: "",
        nextChangeDueKm: "",
    },

    lastMaintenance: {
        maintenanceDate: new Date().toISOString().slice(0, 10),
        maintenanceType: "Preventive",
        serviceCenter: "",
        billNumber: "",
        odometerReading: "",
        issueReported: "",
        workDone: "",
        amount: "",
    },

    breakdownDetails: [],

    nextMaintenance: {
        dueDate: "",
        dueAtKm: "",
    },

    documents: {
        insuranceCopyUrl: "",
        pucCertificateUrl: "",
        maintenanceBillUrl: "",
        fitnessCertificateUrl: "",
        permitCopyUrl: "",
    },

    status: "active",
    remarks: "",
});

export const toDateString = (value: any) => {
    if (!value) return "";

    const text = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

    const date = new Date(text);

    if (Number.isNaN(date.getTime())) return text.slice(0, 10);

    return date.toISOString().slice(0, 10);
};

export const toNumber = (value: any) => {
    const num = Number(value);

    return Number.isFinite(num) ? num : 0;
};

const mergeDateSection = (base: any = {}, source: any = {}, extra: any = {}) => ({
    ...base,
    ...extra,
    ...source,
    issueDate: toDateString(source.issueDate || base.issueDate),
    expiryDate: toDateString(source.expiryDate || base.expiryDate),
});

export const getVehicleMaintenanceVoucher = (item: any) =>
    item?.voucherNumber ||
    item?.maintenanceNumber ||
    item?.maintenanceVoucherNumber ||
    item?.vehicleMaintenanceVoucherNumber ||
    "";

export const mergeVehicleMaintenanceForm = (data: any = {}) => {
    const base: any = createInitialVehicleMaintenance();

    const vehicle = data.vehicle || {};
    const legacyPuc = data.puc || {};
    const legacyInsurance = data.insurance || {};
    const legacyBattery = data.battery || {};
    const legacyService = data.serviceDetails || {};
    const legacyNext = data.nextService || data.nextMaintenance || {};
    const legacyDocuments = data.documents || {};

    const tyreSeries = Array.isArray(data.tyreDetails?.tyreSeriesNumbers)
        ? data.tyreDetails.tyreSeriesNumbers
        : [];

    return {
        ...base,

        vehicleCode: data.vehicleCode || vehicle.vehicleCode || "",
        vehicleNumber: data.vehicleNumber || vehicle.vehicleNumber || "",
        vehicleType: data.vehicleType || vehicle.vehicleType || "",
        driverCode: data.driverCode || vehicle.driverCode || "",
        driverName: data.driverName || vehicle.driverName || "",

        pucDetails: {
            certificateNumber:
                data.pucDetails?.certificateNumber ||
                legacyPuc.certificateNumber ||
                "",
            issueDate: toDateString(
                data.pucDetails?.issueDate || legacyPuc.issueDate
            ),
            expiryDate: toDateString(
                data.pucDetails?.expiryDate ||
                    legacyPuc.expiryDate ||
                    legacyPuc.validTill
            ),
        },

        insuranceDetails: {
            insuranceCompany:
                data.insuranceDetails?.insuranceCompany ||
                legacyInsurance.insuranceCompany ||
                "",
            policyNumber:
                data.insuranceDetails?.policyNumber ||
                legacyInsurance.policyNumber ||
                "",
            issueDate: toDateString(data.insuranceDetails?.issueDate),
            expiryDate: toDateString(
                data.insuranceDetails?.expiryDate || legacyInsurance.validTill
            ),
        },

        passingDetails: mergeDateSection(base.passingDetails, data.passingDetails, {
            passingNumber: data.passingDetails?.passingNumber || "",
        }),

        fitnessCertificateDetails: mergeDateSection(
            base.fitnessCertificateDetails,
            data.fitnessCertificateDetails,
            {
                certificateNumber:
                    data.fitnessCertificateDetails?.certificateNumber || "",
            }
        ),

        permitDetails: mergeDateSection(base.permitDetails, data.permitDetails, {
            permitType: data.permitDetails?.permitType || "",
            permitNumber: data.permitDetails?.permitNumber || "",
        }),

        roadTaxDetails: {
            receiptNumber: data.roadTaxDetails?.receiptNumber || "",
            paidDate: toDateString(data.roadTaxDetails?.paidDate),
            validTill: toDateString(data.roadTaxDetails?.validTill),
        },

        batteryDetails: {
            batteryBrand:
                data.batteryDetails?.batteryBrand ||
                legacyBattery.batteryBrand ||
                "",
            batterySeriesNumber: data.batteryDetails?.batterySeriesNumber || "",
            batteryInstalledDate: toDateString(
                data.batteryDetails?.batteryInstalledDate
            ),
            batteryExpiryDate: toDateString(
                data.batteryDetails?.batteryExpiryDate
            ),
        },

        tyreDetails: {
            totalTyres: String(
                data.tyreDetails?.totalTyres ?? base.tyreDetails.totalTyres ?? ""
            ),
            tyreBrand: data.tyreDetails?.tyreBrand || "",
            tyreSeriesNumbers: tyreSeries,
            lastChangedDate: toDateString(data.tyreDetails?.lastChangedDate),
            nextChangeDueKm: String(
                data.tyreDetails?.nextChangeDueKm ??
                    base.tyreDetails.nextChangeDueKm ??
                    ""
            ),
        },

        lastMaintenance: {
            maintenanceDate:
                toDateString(
                    data.lastMaintenance?.maintenanceDate ||
                        legacyService.serviceDate ||
                        base.lastMaintenance.maintenanceDate
                ) || base.lastMaintenance.maintenanceDate,

            maintenanceType:
                data.lastMaintenance?.maintenanceType ||
                data.maintenanceType ||
                data.maintenanceCategory ||
                base.lastMaintenance.maintenanceType,

            serviceCenter:
                data.lastMaintenance?.serviceCenter ||
                legacyService.serviceCenterName ||
                "",

            billNumber:
                data.lastMaintenance?.billNumber ||
                legacyService.billNumber ||
                "",

            odometerReading: String(
                data.lastMaintenance?.odometerReading ??
                    legacyService.odometerReading ??
                    ""
            ),

            issueReported:
                data.lastMaintenance?.issueReported ||
                legacyService.issueReported ||
                "",

            workDone:
                data.lastMaintenance?.workDone ||
                legacyService.repairReason ||
                "",

            amount: String(
                data.lastMaintenance?.amount ?? data.costing?.totalAmount ?? ""
            ),
        },

        breakdownDetails: Array.isArray(data.breakdownDetails)
            ? data.breakdownDetails.map((item: any) => ({
                  ...createEmptyBreakdown(),
                  ...item,
                  breakdownDate: toDateString(item?.breakdownDate),
                  odometerReading: String(item?.odometerReading ?? ""),
              }))
            : [],

        nextMaintenance: {
            dueDate: toDateString(legacyNext.dueDate),
            dueAtKm: String(legacyNext.dueAtKm ?? ""),
        },

        documents: {
            insuranceCopyUrl:
                legacyDocuments.insuranceCopyUrl ||
                data.documents?.insuranceCopyUrl ||
                "",
            pucCertificateUrl:
                legacyDocuments.pucCertificateUrl ||
                data.documents?.pucCertificateUrl ||
                "",
            maintenanceBillUrl:
                legacyDocuments.maintenanceBillUrl ||
                legacyDocuments.invoiceUrl ||
                data.documents?.maintenanceBillUrl ||
                "",
            fitnessCertificateUrl: data.documents?.fitnessCertificateUrl || "",
            permitCopyUrl: data.documents?.permitCopyUrl || "",
        },

        status: data.status || base.status,
        remarks: data.remarks || "",
    };
};

export const toVehicleMaintenancePayload = (form: any, overrides: any = {}) => {
    const merged: any = mergeVehicleMaintenanceForm({
        ...form,
        ...overrides,
    });

    return {
        vehicleCode: merged.vehicleCode || "",
        vehicleNumber: merged.vehicleNumber || "",
        vehicleType: merged.vehicleType || "",
        driverCode: merged.driverCode || "",
        driverName: merged.driverName || "",

        pucDetails: {
            certificateNumber: merged.pucDetails.certificateNumber || "",
            issueDate: toDateString(merged.pucDetails.issueDate),
            expiryDate: toDateString(merged.pucDetails.expiryDate),
        },

        insuranceDetails: {
            insuranceCompany: merged.insuranceDetails.insuranceCompany || "",
            policyNumber: merged.insuranceDetails.policyNumber || "",
            issueDate: toDateString(merged.insuranceDetails.issueDate),
            expiryDate: toDateString(merged.insuranceDetails.expiryDate),
        },

        passingDetails: {
            passingNumber: merged.passingDetails.passingNumber || "",
            issueDate: toDateString(merged.passingDetails.issueDate),
            expiryDate: toDateString(merged.passingDetails.expiryDate),
        },

        fitnessCertificateDetails: {
            certificateNumber:
                merged.fitnessCertificateDetails.certificateNumber || "",
            issueDate: toDateString(
                merged.fitnessCertificateDetails.issueDate
            ),
            expiryDate: toDateString(
                merged.fitnessCertificateDetails.expiryDate
            ),
        },

        permitDetails: {
            permitType: merged.permitDetails.permitType || "",
            permitNumber: merged.permitDetails.permitNumber || "",
            issueDate: toDateString(merged.permitDetails.issueDate),
            expiryDate: toDateString(merged.permitDetails.expiryDate),
        },

        roadTaxDetails: {
            receiptNumber: merged.roadTaxDetails.receiptNumber || "",
            paidDate: toDateString(merged.roadTaxDetails.paidDate),
            validTill: toDateString(merged.roadTaxDetails.validTill),
        },

        batteryDetails: {
            batteryBrand: merged.batteryDetails.batteryBrand || "",
            batterySeriesNumber:
                merged.batteryDetails.batterySeriesNumber || "",
            batteryInstalledDate: toDateString(
                merged.batteryDetails.batteryInstalledDate
            ),
            batteryExpiryDate: toDateString(
                merged.batteryDetails.batteryExpiryDate
            ),
        },

        tyreDetails: {
            totalTyres: toNumber(merged.tyreDetails.totalTyres),
            tyreBrand: merged.tyreDetails.tyreBrand || "",
            tyreSeriesNumbers: (
                merged.tyreDetails.tyreSeriesNumbers || []
            ).filter(Boolean),
            lastChangedDate: toDateString(merged.tyreDetails.lastChangedDate),
            nextChangeDueKm: toNumber(merged.tyreDetails.nextChangeDueKm),
        },

        lastMaintenance: {
            maintenanceDate: toDateString(
                merged.lastMaintenance.maintenanceDate
            ),
            maintenanceType: merged.lastMaintenance.maintenanceType || "",
            serviceCenter: merged.lastMaintenance.serviceCenter || "",
            billNumber: merged.lastMaintenance.billNumber || "",
            odometerReading: toNumber(merged.lastMaintenance.odometerReading),
            issueReported: merged.lastMaintenance.issueReported || "",
            workDone: merged.lastMaintenance.workDone || "",
            amount: toNumber(merged.lastMaintenance.amount),
        },

        breakdownDetails: (merged.breakdownDetails || []).map((item: any) => ({
            breakdownDate: toDateString(item.breakdownDate),
            breakdownReason: item.breakdownReason || "",
            breakdownLocation: item.breakdownLocation || "",
            tripNumber: item.tripNumber || "",
            tripFrom: item.tripFrom || "",
            tripTo: item.tripTo || "",
            odometerReading: toNumber(item.odometerReading),
            repairStatus: item.repairStatus || "",
        })),

        nextMaintenance: {
            dueDate: toDateString(merged.nextMaintenance.dueDate) || null,
            dueAtKm: merged.nextMaintenance.dueAtKm
                ? toNumber(merged.nextMaintenance.dueAtKm)
                : null,
        },

        documents: {
            insuranceCopyUrl: merged.documents.insuranceCopyUrl || null,
            pucCertificateUrl: merged.documents.pucCertificateUrl || null,
            maintenanceBillUrl: merged.documents.maintenanceBillUrl || null,
            fitnessCertificateUrl:
                merged.documents.fitnessCertificateUrl || null,
            permitCopyUrl: merged.documents.permitCopyUrl || null,
        },

        status: merged.status || "active",
        remarks: merged.remarks || "",
    };
};

export const validateVehicleMaintenanceForm = (form: any) => {
    const errors: string[] = [];

    if (!String(form.vehicleNumber || "").trim()) {
        errors.push("Vehicle is required");
    }

    if (!String(form.lastMaintenance?.serviceCenter || "").trim()) {
        errors.push("Service center is required");
    }

    if (!form.lastMaintenance?.maintenanceDate) {
        errors.push("Maintenance date is required");
    }

    return errors;
};