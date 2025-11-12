import type { ApiClient } from "../ports/apiClient.js";
import type { BankRecord, BankingResult } from "../domain/types.js";

export class BankingUseCases {
  constructor(private readonly apiClient: ApiClient) {}

  async fetchBankRecords(shipId: string, year: number): Promise<BankRecord[]> {
    return this.apiClient.getBankRecords(shipId, year);
  }

  async bankSurplus(shipId: string, year: number): Promise<BankingResult> {
    return this.apiClient.bankSurplus(shipId, year);
  }

  async applyBanked(shipId: string, year: number, amount: number): Promise<BankingResult> {
    return this.apiClient.applyBanked(shipId, year, amount);
  }
}


