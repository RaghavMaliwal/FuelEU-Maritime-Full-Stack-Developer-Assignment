import { describe, it, expect, vi } from "vitest";
import { RouteUseCases } from "../routeUseCases.js";
import type { ApiClient } from "../../ports/apiClient.js";
import type { Route, ComparisonRow } from "../../domain/types.js";

describe("RouteUseCases", () => {
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

  const routeUseCases = new RouteUseCases(mockApiClient);

  describe("fetchAllRoutes", () => {
    it("should fetch all routes from API client", async () => {
      const mockRoutes: Route[] = [
        {
          id: 1,
          routeId: "R001",
          vesselType: "Container",
          fuelType: "HFO",
          year: 2024,
          ghgIntensity: 91.0,
          fuelConsumption: 5000,
          distance: 12000,
          totalEmissions: 4500,
          isBaseline: true,
        },
      ];

      vi.mocked(mockApiClient.getAllRoutes).mockResolvedValue(mockRoutes);

      const result = await routeUseCases.fetchAllRoutes();

      expect(result).toEqual(mockRoutes);
      expect(mockApiClient.getAllRoutes).toHaveBeenCalledOnce();
    });
  });

  describe("setBaselineRoute", () => {
    it("should call API client to set baseline", async () => {
      vi.mocked(mockApiClient.setBaseline).mockResolvedValue(undefined);

      await routeUseCases.setBaselineRoute(1);

      expect(mockApiClient.setBaseline).toHaveBeenCalledWith(1);
    });
  });

  describe("fetchComparison", () => {
    it("should fetch comparison data from API client", async () => {
      const mockComparison: ComparisonRow[] = [
        {
          routeId: "R002",
          baselineGhg: 91.0,
          comparisonGhg: 88.0,
          percentDiff: -3.3,
          compliant: true,
        },
      ];

      vi.mocked(mockApiClient.getComparison).mockResolvedValue(mockComparison);

      const result = await routeUseCases.fetchComparison();

      expect(result).toEqual(mockComparison);
      expect(mockApiClient.getComparison).toHaveBeenCalledOnce();
    });
  });
});


