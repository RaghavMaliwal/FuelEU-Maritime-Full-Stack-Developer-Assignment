import { describe, it, expect, vi } from "vitest";
import { PoolingUseCases } from "../poolingUseCases.js";
import type { ApiClient } from "../../ports/apiClient.js";
import type { PoolResult } from "../../domain/types.js";

describe("PoolingUseCases", () => {
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

  const poolingUseCases = new PoolingUseCases(mockApiClient);

  describe("createPool", () => {
    it("should call API client to create pool", async () => {
      const mockResult: PoolResult = {
        poolId: 1,
        members: [
          { shipId: "SHIP001", cbBefore: 100, cbAfter: 0 },
          { shipId: "SHIP002", cbBefore: -100, cbAfter: 0 },
        ],
      };

      vi.mocked(mockApiClient.createPool).mockResolvedValue(mockResult);

      const result = await poolingUseCases.createPool(2024, [
        { shipId: "SHIP001", cb: 100 },
        { shipId: "SHIP002", cb: -100 },
      ]);

      expect(result).toEqual(mockResult);
      expect(mockApiClient.createPool).toHaveBeenCalledWith(2024, [
        { shipId: "SHIP001", cb: 100 },
        { shipId: "SHIP002", cb: -100 },
      ]);
    });
  });
});


