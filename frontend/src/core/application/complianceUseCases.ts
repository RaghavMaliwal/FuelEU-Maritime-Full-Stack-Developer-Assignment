import type { ApiClient } from "../ports/apiClient.js";
import type { ComplianceBalance, AdjustedComplianceBalance } from "../domain/types.js";

export class ComplianceUseCases {
  constructor(private readonly apiClient: ApiClient) {}

  async fetchComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance> {
    return this.apiClient.getComplianceBalance(shipId, year);
  }

  async fetchAdjustedComplianceBalance(
    shipId: string,
    year: number
  ): Promise<AdjustedComplianceBalance> {
    return this.apiClient.getAdjustedComplianceBalance(shipId, year);
  }
}


