import axios from "axios";
import type { ApiClient } from "../../core/ports/apiClient.js";
import type {
  Route,
  ComparisonRow,
  ComplianceBalance,
  AdjustedComplianceBalance,
  BankRecord,
  BankingResult,
  PoolMember,
  PoolResult,
} from "../../core/domain/types.js";

const API_BASE_URL = "/api";

export class AxiosApiClient implements ApiClient {
  private client = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
  });

  async getAllRoutes(): Promise<Route[]> {
    const response = await this.client.get<Route[]>("/routes");
    return response.data;
  }

  async setBaseline(routeId: number): Promise<void> {
    await this.client.post(`/routes/${routeId}/baseline`);
  }

  async getComparison(): Promise<ComparisonRow[]> {
    const response = await this.client.get<ComparisonRow[]>("/routes/comparison");
    return response.data;
  }

  async getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance> {
    const response = await this.client.get<ComplianceBalance>("/compliance/cb", {
      params: { shipId, year },
    });
    return response.data;
  }

  async getAdjustedComplianceBalance(
    shipId: string,
    year: number
  ): Promise<AdjustedComplianceBalance> {
    const response = await this.client.get<AdjustedComplianceBalance>("/compliance/adjusted-cb", {
      params: { shipId, year },
    });
    return response.data;
  }

  async getBankRecords(shipId: string, year: number): Promise<BankRecord[]> {
    const response = await this.client.get<BankRecord[]>("/banking/records", {
      params: { shipId, year },
    });
    return response.data;
  }

  async bankSurplus(shipId: string, year: number): Promise<BankingResult> {
    const response = await this.client.post<BankingResult>("/banking/bank", { shipId, year });
    return response.data;
  }

  async applyBanked(shipId: string, year: number, amount: number): Promise<BankingResult> {
    const response = await this.client.post<BankingResult>("/banking/apply", {
      shipId,
      year,
      amount,
    });
    return response.data;
  }

  async createPool(year: number, members: PoolMember[]): Promise<PoolResult> {
    const response = await this.client.post<PoolResult>("/pools", { year, members });
    return response.data;
  }
}


