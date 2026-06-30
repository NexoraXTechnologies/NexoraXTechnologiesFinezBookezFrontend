/** Tyre outer diameter (mm) by size label */
const TYRE_DIAMETER_MM: Record<string, number> = {
    "8.25R20": 900,
    "295/90R20": 1030,
    "11R22.5": 1050,
};

type ChassisInputs = {
    trailerType?: string;
    totalLength?: string | number;
    totalWidth?: string | number;
    deckHeight?: string | number;
    payloadCapacity?: string;

    mainBeamType?: string;
    crossMemberCount?: string | number;
    crossMemberType?: string;
    floorType?: string;
    sideRailCount?: string | number;
    sideRailType?: string;

    suspensionType?: string;
    suspensionCapacity?: string;
    axleCount?: string | number;

    tyreSize?: string;
    tyreBrand?: string;

    kingPinType?: string;
    kingPinPositionPercent?: string | number;

    landingLegType?: string;
    landingLegCapacity?: string;

    steelGrade?: string;
    corrosionProtection?: string;
};

type BomComponent = {
    product: string;
    productName: string;
    unit: string;
    qty: string;
    quantity: string;
    weightKg: number;
    rate: number;
    amount: number;
};

const parseNumber = (value: any, fallback = 0) => {
    const numberValue = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(numberValue) ? numberValue : fallback;
};

const parsePayloadTons = (payloadCapacity: any) => {
    const match = String(payloadCapacity || "").match(/([\d.]+)/);
    return match ? Number(match[1]) : 10;
};

const getTyreDiameter = (tyreSize: any) => {
    return TYRE_DIAMETER_MM[String(tyreSize || "")] || 920;
};

/** Axle spacing (mm) — suspension type + tyre size */
export const getAxleSpacing = (suspensionType: any, tyreSize: any) => {
    const tyreDiameter = getTyreDiameter(tyreSize);
    const type = String(suspensionType || "").toLowerCase();

    if (type.includes("pneumatic")) {
        return Math.round(tyreDiameter * 1.78);
    }

    if (type.includes("bogie")) {
        return Math.round(tyreDiameter * 1.52);
    }

    return Math.round(tyreDiameter * 1.65);
};

const recommendMainBeamThickness = (totalLength: number, payloadT: number) => {
    if (payloadT >= 35 || totalLength > 12000) return "12 mm";
    if (payloadT >= 28 || totalLength > 10000) return "10 mm";
    if (payloadT >= 20 || totalLength > 8500) return "8 mm";
    return "6 mm";
};

const recommendCrossMemberThickness = (spacing: number, payloadT: number) => {
    if (payloadT >= 30 || spacing > 1200) return "6 mm";
    if (payloadT >= 20 || spacing > 950) return "5 mm";
    return "4 mm";
};

const recommendFloorPlateThickness = (payloadT: number) => {
    if (payloadT >= 35) return "5 mm";
    if (payloadT >= 28) return "4 mm";
    if (payloadT >= 20) return "3 mm";
    return "2.5 mm";
};

const recommendSideRailThickness = (payloadT: number) => {
    if (payloadT >= 30) return "5 mm";
    if (payloadT >= 20) return "4 mm";
    return "3 mm";
};

const recommendKingPinPlateThickness = (payloadT: number) => {
    if (payloadT >= 28) return "20 mm";
    if (payloadT >= 20) return "16 mm";
    return "12 mm";
};

const recommendSuspensionBracketThickness = (
    payloadT: number,
    suspensionType: any
) => {
    const type = String(suspensionType || "").toLowerCase();

    if (type.includes("bogie")) {
        return payloadT >= 25 ? "12 mm" : "10 mm";
    }

    if (type.includes("pneumatic")) {
        return payloadT >= 25 ? "10 mm" : "8 mm";
    }

    return payloadT >= 25 ? "8 mm" : "6 mm";
};

const parseThicknessMm = (label: any) => {
    return parseNumber(label, 4);
};

/** Rough MS weight estimate (kg) from geometry */
const estimateTrailerWeight = ({
    totalLength,
    totalWidth,
    deckHeight,
    crossMemberCount,
    axleCount,
    payloadT,
    mainBeamThickness,
    crossMemberThickness,
    floorPlateThickness,
    sideRailThickness,
}: any) => {
    const lenM = totalLength / 1000;
    const widthM = totalWidth / 1000;
    const heightM = deckHeight / 1000;

    const mainT = parseThicknessMm(mainBeamThickness);
    const crossT = parseThicknessMm(crossMemberThickness);
    const floorT = parseThicknessMm(floorPlateThickness);
    const railT = parseThicknessMm(sideRailThickness);

    const mainBeamKg = lenM * 2 * 0.08 * mainT * 7850 * 0.35;
    const crossMemberKg =
        crossMemberCount * widthM * 0.06 * crossT * 7850 * 0.35;
    const floorKg = lenM * widthM * floorT * 7850 * 0.25;
    const sideRailKg = lenM * 2 * 0.04 * railT * 7850 * 0.3;
    const suspensionKg = axleCount * (120 + payloadT * 8);
    const miscKg = 180 + payloadT * 5;

    return Math.round(
        mainBeamKg +
            crossMemberKg +
            floorKg +
            sideRailKg +
            suspensionKg +
            miscKg +
            heightM * 0
    );
};

const buildBOM = (inputs: ChassisInputs, calc: any): BomComponent[] => {
    const qtyCross = parseNumber(inputs.crossMemberCount, 0);
    const qtySideRail = parseNumber(inputs.sideRailCount, 0);
    const qtyAxle = parseNumber(inputs.axleCount, 0);
    const ratePerKg = 85;

    const line = (
        product: string,
        unit: string,
        qty: number,
        weightKg: number
    ): BomComponent => {
        const weight = Math.max(0, Math.round(weightKg));
        const amount = Math.round(weight * ratePerKg);

        return {
            product,
            productName: product,
            unit,
            qty: String(qty),
            quantity: String(qty),
            weightKg: weight,
            rate: ratePerKg,
            amount,
        };
    };

    const totalLength = parseNumber(calc.totalLength, 7500);
    const totalWidth = parseNumber(inputs.totalWidth, 2500);
    const payloadT = parsePayloadTons(inputs.payloadCapacity);

    const items = [
        line(
            `Main Beam (${inputs.mainBeamType || "I Beam"})`,
            "Nos",
            2,
            totalLength * 0.012 * parseThicknessMm(calc.mainBeamThickness)
        ),

        line(
            `Cross Member (${inputs.crossMemberType || "Channel"})`,
            "Nos",
            qtyCross,
            qtyCross *
                totalWidth *
                0.000006 *
                parseThicknessMm(calc.crossMemberThickness) *
                7850
        ),

        line(
            `Floor Plate (${inputs.floorType || "MS Sheet"})`,
            "Nos",
            1,
            totalLength *
                totalWidth *
                0.000001 *
                parseThicknessMm(calc.floorPlateThickness) *
                7850
        ),

        line(
            `Side Rail (${inputs.sideRailType || "Pipe"})`,
            "Nos",
            qtySideRail * 2,
            qtySideRail *
                totalLength *
                0.000004 *
                parseThicknessMm(calc.sideRailThickness) *
                7850
        ),

        line(
            "King Pin Assembly",
            "Nos",
            1,
            45 + payloadT * 2
        ),

        line("Landing Leg", "Nos", 2, 35),

        line(
            "Suspension Bracket",
            "Nos",
            qtyAxle * 2,
            qtyAxle * 18
        ),

        line(
            `Tyre ${inputs.tyreSize || ""} (${inputs.tyreBrand || ""})`.trim(),
            "Nos",
            calc.tyreCount,
            calc.tyreCount * 42
        ),

        line(
            "Axle Assembly",
            "Nos",
            qtyAxle,
            qtyAxle * 320
        ),
    ];

    return items.filter((item) => parseNumber(item.qty, 0) > 0);
};

/**
 * Compute all system-generated chassis fields from manual inputs.
 */
export function computeChassisEngineering(inputs: ChassisInputs = {}) {
    const totalLength = parseNumber(inputs.totalLength, 7500);
    const totalWidth = parseNumber(inputs.totalWidth, 2500);
    const deckHeight = parseNumber(inputs.deckHeight, 1200);

    const crossMemberCount = Math.max(
        parseNumber(inputs.crossMemberCount, 1),
        1
    );

    const axleCount = Math.max(parseNumber(inputs.axleCount, 1), 1);

    const kingPinPositionPercent = parseNumber(
        inputs.kingPinPositionPercent,
        18
    );

    const payloadT = parsePayloadTons(inputs.payloadCapacity);
    const suspensionType = inputs.suspensionType || "Mechanical";
    const tyreSize = inputs.tyreSize || "8.25R20";

    const crossMemberSpacing = Math.round(totalLength / crossMemberCount);
    const axleSpacing = getAxleSpacing(suspensionType, tyreSize);

    /**
     * Trailer axle normally has 2 tyres per axle in your current logic.
     * If you want dual tyres, change this to axleCount * 4.
     */
    const tyreCount = axleCount * 2;

    const tyreDiameter = getTyreDiameter(tyreSize);
    const tyreGap = Math.round(tyreDiameter * 0.15 + 40);

    const kingPinPositionMm = Math.round(
        totalLength * (kingPinPositionPercent / 100)
    );

    const frontOverhang = kingPinPositionMm;
    const landingLegPosition = Math.round(frontOverhang + 350);

    const axleGroupLength =
        axleCount > 1
            ? (axleCount - 1) * axleSpacing + Math.round(tyreDiameter * 0.5)
            : Math.round(tyreDiameter * 0.5);

    const rearOverhang = Math.round(Math.max(totalLength * 0.1, 800));

    const suspensionStartPosition = Math.max(
        landingLegPosition + 1200,
        totalLength - rearOverhang - axleGroupLength
    );

    const mainBeamThickness = recommendMainBeamThickness(totalLength, payloadT);

    const crossMemberThickness = recommendCrossMemberThickness(
        crossMemberSpacing,
        payloadT
    );

    const floorPlateThickness = recommendFloorPlateThickness(payloadT);
    const sideRailThickness = recommendSideRailThickness(payloadT);
    const kingPinPlateThickness = recommendKingPinPlateThickness(payloadT);

    const suspensionBracketThickness = recommendSuspensionBracketThickness(
        payloadT,
        suspensionType
    );

    const calcInputs = {
        totalLength,
        totalWidth,
        deckHeight,
        crossMemberCount,
        axleCount,
        payloadT,
        mainBeamThickness,
        crossMemberThickness,
        floorPlateThickness,
        sideRailThickness,
    };

    const estimatedTrailerWeight = estimateTrailerWeight(calcInputs);

    const bomComponents = buildBOM(
        {
            ...inputs,
            totalLength,
            totalWidth,
        },
        {
            ...calcInputs,
            crossMemberSpacing,
            axleSpacing,
            tyreCount,
            tyreDiameter,
            tyreGap,
            kingPinPositionMm,
            landingLegPosition,
            suspensionStartPosition,
            mainBeamThickness,
            crossMemberThickness,
            floorPlateThickness,
            sideRailThickness,
            kingPinPlateThickness,
            suspensionBracketThickness,
            frontOverhang,
            rearOverhang,
            axleGroupLength,
            estimatedTrailerWeight,
        }
    );

    const estimatedCost = bomComponents.reduce((sum, item) => {
        return sum + Number(item.amount || 0);
    }, 0);

    return {
        totalLength,
        totalWidth,
        deckHeight,

        crossMemberSpacing,
        axleSpacing,
        tyreCount,
        tyreDiameter,
        tyreGap,

        kingPinPositionMm,
        landingLegPosition,
        suspensionStartPosition,

        frontOverhang,
        rearOverhang,
        axleGroupLength,

        mainBeamThickness,
        crossMemberThickness,
        floorPlateThickness,
        sideRailThickness,
        kingPinPlateThickness,
        suspensionBracketThickness,

        estimatedTrailerWeight,
        estimatedCost,
        bomComponents,

        trailerHeight: deckHeight,
        totalHeight: deckHeight,
        pillarCount: crossMemberCount + 2,
    };
}