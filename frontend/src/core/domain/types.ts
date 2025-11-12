export type Route = {
  id: number;
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
};

export type ComparisonRow = {
  routeId: string;
  baselineGhg: number;
  comparisonGhg: number;
  percentDiff: number;
  compliant: boolean;
};

export type ComplianceBalance = {
  shipId: string;
  year: number;
  cb: number;
};

export type AdjustedComplianceBalance = {
  shipId: string;
  year: number;
  adjustedCb: number;
};

export type BankRecord = {
  id: number;
  shipId: string;
  year: number;
  amount: number;
  createdAt: string;
};

export type BankingResult = {
  cb_before: number;
  applied: number;
  cb_after: number;
};

export type PoolMember = {
  shipId: string;
  cb: number;
};

export type PoolMemberAllocation = {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
};

export type PoolResult = {
  poolId: number;
  members: PoolMemberAllocation[];
};


