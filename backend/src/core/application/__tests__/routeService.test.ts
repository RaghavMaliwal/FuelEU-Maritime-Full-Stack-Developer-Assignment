import { RouteService } from "../routeService.js";
import { RoutesRepository } from "../../ports/repositories.js";
import { RouteRecord } from "../../domain/types.js";
import { TARGET_INTENSITY_2025 } from "../../../shared/constants.js";

class FakeRoutesRepo implements RoutesRepository {
  private routes: RouteRecord[] = [];

  setRoutes(routes: RouteRecord[]) {
    this.routes = routes;
  }

  async findAll(): Promise<RouteRecord[]> {
    return [...this.routes];
  }

  async findBaseline(): Promise<RouteRecord | null> {
    return this.routes.find(r => r.isBaseline) ?? null;
  }

  async setBaselineById(id: number): Promise<void> {
    this.routes.forEach(r => { r.isBaseline = r.id === id; });
  }
}

describe("RouteService", () => {
  let service: RouteService;
  let repo: FakeRoutesRepo;

  beforeEach(() => {
    repo = new FakeRoutesRepo();
    service = new RouteService(repo);
  });

  describe("getAllRoutes", () => {
    it("returns all routes from repository", async () => {
      const routes: RouteRecord[] = [
        { id: 1, routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: false }
      ];
      repo.setRoutes(routes);
      const result = await service.getAllRoutes();
      expect(result).toEqual(routes);
    });
  });

  describe("setBaseline", () => {
    it("sets baseline flag for specified route", async () => {
      const routes: RouteRecord[] = [
        { id: 1, routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: false },
        { id: 2, routeId: "R002", vesselType: "BulkCarrier", fuelType: "LNG", year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: true }
      ];
      repo.setRoutes(routes);
      await service.setBaseline(1);
      const all = await repo.findAll();
      expect(all.find(r => r.id === 1)?.isBaseline).toBe(true);
      expect(all.find(r => r.id === 2)?.isBaseline).toBe(false);
    });
  });

  describe("getComparison (ComputeComparison)", () => {
    it("returns empty array when no baseline exists", async () => {
      const routes: RouteRecord[] = [
        { id: 1, routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: false }
      ];
      repo.setRoutes(routes);
      const result = await service.getComparison();
      expect(result).toEqual([]);
    });

    it("compares routes against baseline and checks compliance against target", async () => {
      const routes: RouteRecord[] = [
        { id: 1, routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: true },
        { id: 2, routeId: "R002", vesselType: "BulkCarrier", fuelType: "LNG", year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false },
        { id: 3, routeId: "R003", vesselType: "Tanker", fuelType: "MGO", year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100, distance: 12500, totalEmissions: 4700, isBaseline: false }
      ];
      repo.setRoutes(routes);
      const result = await service.getComparison();
      
      expect(result).toHaveLength(2);
      
      // R002: 88.0 <= 89.3368 (compliant)
      const r002 = result.find(r => r.routeId === "R002")!;
      expect(r002.baselineGhg).toBe(91.0);
      expect(r002.comparisonGhg).toBe(88.0);
      expect(r002.percentDiff).toBeCloseTo(((88.0 / 91.0) - 1) * 100);
      expect(r002.compliant).toBe(true);
      
      // R003: 93.5 > 89.3368 (not compliant)
      const r003 = result.find(r => r.routeId === "R003")!;
      expect(r003.baselineGhg).toBe(91.0);
      expect(r003.comparisonGhg).toBe(93.5);
      expect(r003.percentDiff).toBeCloseTo(((93.5 / 91.0) - 1) * 100);
      expect(r003.compliant).toBe(false);
    });

    it("excludes baseline route from comparison results", async () => {
      const routes: RouteRecord[] = [
        { id: 1, routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: true },
        { id: 2, routeId: "R002", vesselType: "BulkCarrier", fuelType: "LNG", year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false }
      ];
      repo.setRoutes(routes);
      const result = await service.getComparison();
      expect(result.find(r => r.routeId === "R001")).toBeUndefined();
      expect(result).toHaveLength(1);
    });
  });
});


