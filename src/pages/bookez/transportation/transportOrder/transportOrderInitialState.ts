import { todayYMD } from "../../../../utils/helperFunctions";

export const STEPS = [
    "Customer",
    "Load",
    "Pickup",
    "Delivery",
    "Vehicle",
    "Freight",
    "Risk",
];

export const todayDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
};

export const createInitialTransportOrder = () => ({
    orderDate:todayYMD(),
    orderType: "direct",

    contractDetails: {
        contractNumber: "",
        validityFrom: "",
        validityTo: "",
        totalTrips: "",
        completedTrips: 0,
        remainingTrips: 0,
    },

    customerDetails: {
        customerCode: "",
        customerName: "",
        contactPerson: "",
        gstNumber: "",
        mobileNumber: "",
        email: "",
    },

    loadDetails: {
        loadType: "",
        materialName: "",
        materialCategory: "",
        quantity: "",
        weight: "",
        weightUnit: "",
        packagingType: "",
        invoiceNumber: "",
        ewayBillDetails: {
            ewayBillRequired: false,
            ewayBillGeneratedBy: "customer",
            ewayBillNumber: "",
            ewayBillDate: todayYMD(),
        },
        specialHandlingInstructions: "",
    },

    pickupDetails: {
        pickupStateCode: "",
        pickupStateName: "",
        pickupCityName: "",
        pickupLocation: "",
        pickupAddress: "",
        pickupDateTime: todayDateTime(),
        pickupContactName: "",
        pickupContactNumber: "",
    },

    deliveryDetails: {
        deliveryStateCode: "",
        deliveryStateName: "",
        deliveryCityName: "",
        deliveryLocation: "",
        deliveryAddress: "",
        expectedDeliveryDateTime: todayDateTime(),
        deliveryContactName: "",
        deliveryContactNumber: "",
    },

    routeDetails: {
        routeDistanceKm: "",
        routeType: "",
        expectedTollAmount: "",

    },

    vehicleRequirement: {
        vehicleType: "",
        vehicleBodyType: "",
        vehicleCapacity: "",
        numberOfVehicles: 1,
        specialVehicleRequirement: "",
    },

    freightDetails: {
        freightPerTon: "",
        expectedFreight: "",
        advanceAmount: "",
        balanceAmount: "",
        paymentType: "",
        paymentMode: "",
    },

    brokerDetails: {
        brokerRequired: false,
        brokerCode: "",
        brokerName: "",
        brokerCommission: "",
    },

    riskAndInsurance: {
        riskType: "",
        insuranceRequired: false,
        insuranceAmount: "",
    },

    trackingPreferences: {
        gpsTrackingRequired: false,
        podRequired: false,
        liveTrackingEnabled: false,
    },

    priority: "high",
    remarks: "",
});



