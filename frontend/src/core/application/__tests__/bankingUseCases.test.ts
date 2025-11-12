import { describe, it, expect, vi } from "vitest";
import { BankingUseCases } from "../bankingUseCases.js";
import type { ApiClient } from "../../ports/apiClient.js";
import type { BankRecord, BankingResult } from "../../domain/types.js";

describe("BankingUseCases", () => {
  const mockApiClient: ApiClient = {
    getAllRoutes: vi.fn(),
    setBaseline: vi.fn(),
    getComparison: vi.fn(),
    getComplianceBalance: vi.fn(),
    getAdjustedComplianceBalance: vi.fn(),
    getBankRecords: vi.fn(),
    bankSurplus: vi.fn(),
    applyBanked: vi.fn(),
    createPool: vi.fn(),
  };

  const bankingUseCases = new BankingUseCases(mockApiClient);

  describe("fetchBankRecords", () => {
    it("should fetch bank records from API client", async () => {
      const mockRecords: BankRecord[] = [
        {
          id: 1,
          shipId: "SHIP001",
          year: 2024,
          amount: 1000000,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ];

      vi.mocked(mockApiClient.getBankRecords).mockResolvedValue(mockRecords);

      const result = await bankingUseCases.fetchBankRecords("SHIP001", 2024);

      expect(result).toEqual(mockRecords);
      expect(mockApiClient.getBankRecords).toHaveBeenCalledWith("SHIP001", 2024);
    });
  });

  describe("bankSurplus", () => {
    it("should call API client to bank surplus", async () => {
      const mockResult: BankingResult = {
        cb_before: 1000000,
        applied: 1000000,
        cb_after: 0,
      };

      vi.mocked(mockApiClient.bankSurplus).mockResolvedValue(mockResult);

      const result = await bankingUseCases.bankSurplus("SHIP001", 2024);

      expect(result).toEqual(mockResult);
      expect(mockApiClient.bankSurplus).toHaveBeenCalledWith("SHIP001", 2024);
    });
  });

  describe("applyBanked", () => {
    it("should call API client to apply banked amount", async () => {
      const mockResult: BankingResult = {
        cb_before: -500000,
        applied: 300000,
        cb_after: -200000,
      };

      vi.mocked(mockApiClient.applyBanked).mockResolvedValue(mockResult);

      const result = await bankingUseCases.applyBanked("SHIP001", 2024, 300000);

      expect(result).toEqual(mockResult);
      expect(mockApiClient.applyBanked).toHaveBeenCalledWith("SHIP001", 2024, 300000);
    });
  });
});


