export const ProductDefaultInputs = {
  trailerSidewall: {
    totalLength: '9200',
    totalHeight: '1562',
    pillarCount: '5',
    pillarSpacing: '',
    pillarWidth: '60',
    topRailHeight: '150',
    bottomRailHeight: '150',
    sheetThickness: '2.5',
    material: 'MS Steel',
  },
  trailerDoor: {
    totalLength: '2400',
    totalHeight: '1800',
    pillarCount: '3',
    pillarSpacing: '',
    pillarWidth: '60',
    topRailHeight: '100',
    bottomRailHeight: '100',
    sheetThickness: '2.5',
    material: 'MS Steel',
  },
  /** Chassis product defaults — also exposed as `chassis` for dropdown value */
  chassis: {
    trailerType: 'Flatbed',
    totalLength: '7500',
    totalWidth: '2500',
    deckHeight: '1200',
    payloadCapacity: '10T',

    mainBeamType: 'Fabricated I Beam',
    crossMemberCount: '8',
    crossMemberType: 'C Channel',
    floorType: 'MS Sheet',
    sideRailCount: '3',
    sideRailType: 'Pipe',

    suspensionType: 'Mechanical',
    suspensionCapacity: '20T',
    axleCount: '2',

    tyreSize: '8.25R20',
    tyreBrand: 'MRF',

    kingPinType: '2',
    kingPinPositionPercent: '18',

    landingLegType: 'Standard',
    landingLegCapacity: '20T',

    steelGrade: 'IS2062 E250',
    corrosionProtection: 'Primer',
  },
  chassisDefaults: undefined as any,
};

ProductDefaultInputs.chassisDefaults = ProductDefaultInputs.chassis;

const makeOptions = (arr:string[]) => arr.map(v => ({label: v, value: v}));

/** Shared dropdown options for chassis engineering forms */
export const ChassisFieldOptions = {
  trailerType: makeOptions(['Flatbed', 'Container', 'Side Wall', 'Low Bed']),
  payloadCapacity: makeOptions(['10T', '20T', '28T', '35T', '42T']),
  mainBeamType: makeOptions([
    'Fabricated I Beam',
    'Rolled I Beam',
    'Box Section',
  ]),
  crossMemberType: makeOptions(['C Channel', 'Box Channel']),
  floorType: makeOptions(['MS Sheet', 'Wooden', 'Aluminium']),
  sideRailType: makeOptions(['Pipe', 'Box Pipe']),
  suspensionType: makeOptions(['Mechanical', 'Pneumatic', 'Bogie']),
  suspensionCapacity: makeOptions(['20T', '30T', '40T']),
  tyreSize: makeOptions(['8.25R20', '295/90R20', '11R22.5']),
  tyreBrand: makeOptions(['MRF', 'Apollo', 'JK', 'Bridgestone']),
  landingLegType: makeOptions(['Standard', 'Heavy Duty', 'Hydraulic']),
  landingLegCapacity: makeOptions(['20T', '24T', '30T']),
  steelGrade: makeOptions(['IS2062 E250', 'IS2062 E350']),
  corrosionProtection: makeOptions(['Primer', 'Paint', 'Powder Coating']),
};

export const ProductOutputs = {
  trailerRearDoor: {
    estimatedWeight: 88,
    estimatedCost: 8800,
    bomItems: [
      '3 Pillars',
      '1 Top Rail',
      '1 Bottom Rail',
      '2 Door Panels',
      '6 Hinges',
      '2 Lock Rods',
    ],
  },
};
