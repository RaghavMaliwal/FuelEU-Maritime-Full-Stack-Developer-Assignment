import type {
  Route,
  ComparisonRow,
  ComplianceBalance,
  AdjustedComplianceBalance,
  BankRecord,
  BankingResult,
  PoolMember,
  PoolResult,
} from "../domain/types.js";

export interface ApiClient {
  // Routes
  getAllRoutes(): Promise<Route[]>;
  setBaseline(routeId: number): Promise<void>;
  getComparison(): Promise<ComparisonRow[]>;

  // Compliance
  getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance>;
  getAdjustedComplianceBalance(shipId: string, year: number): Promise<AdjustedComplianceBalance>;

  // Banking
  getBankRecords(shipId: string, year: number): Promise<BankRecord[]>;
  bankSurplus(shipId: string, year: number): Promise<BankingResult>;
  applyBanked(shipId: string, year: number, amount: number): Promise<BankingResult>;

  // Pooling
  createPool(year: number, members: PoolMember[]): Promise<PoolResult>;
}


