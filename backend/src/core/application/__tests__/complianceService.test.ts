import { ComplianceService } from "../complianceService.js";
import { RoutesRepository, ComplianceRepository, BankingRepository } from "../../ports/repositories.js";
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

  async setBaselineById(_id: number): Promise<void> {
    // Not used in compliance service
  }
}

class FakeComplianceRepo implements ComplianceRepository {
  private snapshots: Map<string, number> = new Map();

  async saveSnapshot(shipId: string, year: number, cb: number): Promise<void> {
    this.snapshots.set(`${shipId}-${year}`, cb);
  }

  async getLatestSnapshot(shipId: string, year: number): Promise<number | null> {
    return this.snapshots.get(`${shipId}-${year}`) ?? null;
  }

  clear() {
    this.snapshots.clear();
  }
}

class FakeBankingRepo implements BankingRepository {
  private banked: Map<string, number> = new Map();

  async getBankedSum(shipId: string, year: number): Promise<number> {
    return this.banked.get(`${shipId}-${year}`) ?? 0;
  }

  async listRecords(_shipId: string, _year: number) {
    return [];
  }

  async addBankEntry(shipId: string, year: number, amount: number): Promise<void> {
    const key = `${shipId}-${year}`;
    this.banked.set(key, (this.banked.get(key) ?? 0) + amount);
  }

  clear() {
    this.banked.clear();
  }
}

describe("ComplianceService", () => {
  let service: ComplianceService;
  let routesRepo: FakeRoutesRepo;
  let complianceRepo: FakeComplianceRepo;
  let bankingRepo: FakeBankingRepo;

  beforeEach(() => {
    routesRepo = new FakeRoutesRepo();
    complianceRepo = new FakeComplianceRepo();
    bankingRepo = new FakeBankingRepo();
    service = new ComplianceService(routesRepo, complianceRepo, bankingRepo);
  });

  describe("computeAndStoreSnapshot (ComputeCB)", () => {
    it("computes CB for routes in given year and stores snapshot", async () => {
      const routes: RouteRecord[] = [
        { id: 1, routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: false },
        { id: 2, routeId: "R002", vesselType: "BulkCarrier", fuelType: "LNG", year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false }
      ];
      routesRepo.setRoutes(routes);

      const cb = await service.computeAndStoreSnapshot("SHIP001", 2024);

      // R001: (89.3368 - 91.0) * (5000 * 41000) = -1.6632 * 205000000 = -340956000
      // R002: (89.3368 - 88.0) * (4800 * 41000) = 1.3368 * 196800000 = 263162240
      // Sum: -340956000 + 263162240 = -77793760
      const expectedR1 = (TARGET_INTENSITY_2025 - 91.0) * (5000 * 41000);
      const expectedR2 = (TARGET_INTENSITY_2025 - 88.0) * (4800 * 41000);
      const expectedSum = expectedR1 + expectedR2;

      expect(cb).toBeCloseTo(expectedSum, 0);
      
      const stored = await complianceRepo.getLatestSnapshot("SHIP001", 2024);
      expect(stored).toBeCloseTo(expectedSum, 0);
    });

    it("only includes routes for the specified year", async () => {
      const routes: RouteRecord[] = [
        { id: 1, routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: false },
        { id: 2, routeId: "R002", vesselType: "BulkCarrier", fuelType: "LNG", year: 2025, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false }
      ];
      routesRepo.setRoutes(routes);

      const cb2024 = await service.computeAndStoreSnapshot("SHIP001", 2024);
      const cb2025 = await service.computeAndStoreSnapshot("SHIP001", 2025);

      // 2024 should only include R001
      const expected2024 = (TARGET_INTENSITY_2025 - 91.0) * (5000 * 41000);
      expect(cb2024).toBeCloseTo(expected2024, 0);

      // 2025 should only include R002
      const expected2025 = (TARGET_INTENSITY_2025 - 88.0) * (4800 * 41000);
      expect(cb2025).toBeCloseTo(expected2025, 0);
    });

    it("handles negative CB (deficit)", async () => {
      const routes: RouteRecord[] = [
        { id: 1, routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 95.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: false }
      ];
      routesRepo.setRoutes(routes);

      const cb = await service.computeAndStoreSnapshot("SHIP001", 2024);

      // 95.0 > 89.3368, so CB should be negative
      expect(cb).toBeLessThan(0);
    });
  });

  describe("getAdjustedCB", () => {
    it("returns base CB when no banked entries exist", async () => {
      await complianceRepo.saveSnapshot("SHIP001", 2024, 1000000);
      const adjusted = await service.getAdjustedCB("SHIP001", 2024);
      expect(adjusted).toBe(1000000);
    });

    it("adds banked amount to base CB", async () => {
      await complianceRepo.saveSnapshot("SHIP001", 2024, 1000000);
      await bankingRepo.addBankEntry("SHIP001", 2024, 500000);
      const adjusted = await service.getAdjustedCB("SHIP001", 2024);
      expect(adjusted).toBe(1500000);
    });

    it("returns 0 when no snapshot exists and no banked entries", async () => {
      const adjusted = await service.getAdjustedCB("SHIP001", 2024);
      expect(adjusted).toBe(0);
    });

    it("handles negative banked entries (applied bank)", async () => {
      await complianceRepo.saveSnapshot("SHIP001", 2024, -500000);
      await bankingRepo.addBankEntry("SHIP001", 2024, -200000); // Applied bank
      const adjusted = await service.getAdjustedCB("SHIP001", 2024);
      expect(adjusted).toBe(-700000);
    });
  });
});


