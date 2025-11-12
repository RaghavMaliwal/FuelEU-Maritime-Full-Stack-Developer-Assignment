export type RouteRecord = {
  id: number;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number; // tons
  distance: number; // km
  totalEmissions: number; // tons
  isBaseline: boolean;
};

export type ComparisonRow = {
  routeId: string;
  baselineGhg: number;
  comparisonGhg: number;
  percentDiff: number;
  compliant: boolean;
};

export type ComplianceSnapshot = {
  shipId: string;
  year: number;
  cb: number;
};

export type BankRecord = {
  id: number;
  shipId: string;
  year: number;
  amount: number;
  createdAt: Date;
};

export type PoolMemberAllocation = {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
};




