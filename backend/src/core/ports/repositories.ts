import { BankRecord, PoolMemberAllocation, RouteRecord } from "../domain/types.js";

export interface RoutesRepository {
  findAll(): Promise<RouteRecord[]>;
  findBaseline(): Promise<RouteRecord | null>;
  setBaselineById(id: number): Promise<void>;
}

export interface ComplianceRepository {
  saveSnapshot(shipId: string, year: number, cb: number): Promise<void>;
  getLatestSnapshot(shipId: string, year: number): Promise<number | null>;
}

export interface BankingRepository {
  getBankedSum(shipId: string, year: number): Promise<number>;
  listRecords(shipId: string, year: number): Promise<BankRecord[]>;
  addBankEntry(shipId: string, year: number, amount: number): Promise<void>;
}

export interface PoolsRepository {
  createPool(year: number, members: PoolMemberAllocation[]): Promise<number>;
}




