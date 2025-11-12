import { PoolingService } from "../poolingService.js";
import { PoolsRepository } from "../../ports/repositories.js";
import { PoolMemberAllocation } from "../../domain/types.js";

class FakePoolsRepo implements PoolsRepository {
  private nextId = 1;

  async createPool(_year: number, members: PoolMemberAllocation[]): Promise<number> {
    return this.nextId++;
  }
}

describe("PoolingService", () => {
  let service: PoolingService;
  let repo: FakePoolsRepo;

  beforeEach(() => {
    repo = new FakePoolsRepo();
    service = new PoolingService(repo);
  });

  describe("createPool", () => {
    it("allocates surplus to deficits greedily", async () => {
      const res = await service.createPool(2025, [
        { shipId: "A", cb: 100 },
        { shipId: "B", cb: -60 },
        { shipId: "C", cb: -40 }
      ]);
      const a = res.members.find(m => m.shipId === "A")!;
      const b = res.members.find(m => m.shipId === "B")!;
      const c = res.members.find(m => m.shipId === "C")!;
      expect(a.cbAfter).toBeCloseTo(0);
      expect(b.cbAfter).toBeCloseTo(0);
      expect(c.cbAfter).toBeCloseTo(0);
    });

    it("handles multiple surplus ships", async () => {
      const res = await service.createPool(2025, [
        { shipId: "A", cb: 50 },
        { shipId: "B", cb: 30 },
        { shipId: "C", cb: -40 },
        { shipId: "D", cb: -40 }
      ]);
      const a = res.members.find(m => m.shipId === "A")!;
      const b = res.members.find(m => m.shipId === "B")!;
      const c = res.members.find(m => m.shipId === "C")!;
      const d = res.members.find(m => m.shipId === "D")!;
      
      // Total surplus: 80, total deficit: 80
      expect(a.cbAfter + b.cbAfter).toBeCloseTo(0);
      expect(c.cbAfter).toBeCloseTo(0);
      expect(d.cbAfter).toBeCloseTo(0);
    });

    it("handles allocation when surplus equals total deficit", async () => {
      // Sum: 50 - 30 - 20 = 0 (valid), surplus (50) = total deficit (50)
      // This tests that allocation fully covers all deficits
      const res = await service.createPool(2025, [
        { shipId: "A", cb: 50 },
        { shipId: "B", cb: -30 },
        { shipId: "C", cb: -20 }
      ]);
      const a = res.members.find(m => m.shipId === "A")!;
      const b = res.members.find(m => m.shipId === "B")!;
      const c = res.members.find(m => m.shipId === "C")!;
      
      // All 50 should be distributed, fully covering deficits
      expect(a.cbAfter).toBeCloseTo(0);
      expect(b.cbAfter).toBeCloseTo(0);
      expect(c.cbAfter).toBeCloseTo(0);
    });

    it("handles allocation when surplus exceeds total deficit", async () => {
      // Sum: 30 - 20 - 5 = 5 (valid), surplus (30) > total deficit (25)
      // This tests that allocation fully covers deficits and leaves remainder in surplus
      const res = await service.createPool(2025, [
        { shipId: "A", cb: 30 },
        { shipId: "B", cb: -20 },
        { shipId: "C", cb: -5 }
      ]);
      const a = res.members.find(m => m.shipId === "A")!;
      const b = res.members.find(m => m.shipId === "B")!;
      const c = res.members.find(m => m.shipId === "C")!;
      
      // Surplus 30 should fully cover deficits 20+5=25, leaving 5 in A
      expect(a.cbAfter).toBeCloseTo(5);
      expect(b.cbAfter).toBeCloseTo(0);
      expect(c.cbAfter).toBeCloseTo(0);
    });

    it("sorts surplus descending and deficits ascending", async () => {
      const res = await service.createPool(2025, [
        { shipId: "A", cb: 30 },
        { shipId: "B", cb: 100 },
        { shipId: "C", cb: 50 },
        { shipId: "D", cb: -40 },
        { shipId: "E", cb: -60 }
      ]);
      
      // Largest surplus (B=100) should be used first
      const b = res.members.find(m => m.shipId === "B")!;
      expect(b.cbAfter).toBeLessThan(100);
    });

    it("returns poolId and member allocations", async () => {
      const res = await service.createPool(2025, [
        { shipId: "A", cb: 100 },
        { shipId: "B", cb: -100 }
      ]);
      
      expect(res.poolId).toBe(1);
      expect(res.members).toHaveLength(2);
      expect(res.members.every(m => m.shipId && m.cbBefore !== undefined && m.cbAfter !== undefined)).toBe(true);
    });
  });

  describe("validateMembers", () => {
    it("throws error when pool sum is negative", () => {
      expect(() => {
        service.validateMembers([
          { shipId: "A", cb: 50 },
          { shipId: "B", cb: -100 }
        ]);
      }).toThrow("Pool sum must be >= 0");
    });

    it("allows zero sum", () => {
      expect(() => {
        service.validateMembers([
          { shipId: "A", cb: 100 },
          { shipId: "B", cb: -100 }
        ]);
      }).not.toThrow();
    });

    it("allows positive sum", () => {
      expect(() => {
        service.validateMembers([
          { shipId: "A", cb: 150 },
          { shipId: "B", cb: -100 }
        ]);
      }).not.toThrow();
    });
  });

  describe("createAllocations - edge cases", () => {
    it("enforces: deficit ship cannot exit worse", () => {
      expect(() => {
        service.createAllocations([
          { shipId: "A", cb: 10 },
          { shipId: "B", cb: -20 }
        ]);
      }).not.toThrow(); // Should work with valid allocation
      
      // This would fail if allocation made B worse, but our algorithm prevents it
      const res = service.createAllocations([
        { shipId: "A", cb: 10 },
        { shipId: "B", cb: -20 }
      ]);
      const b = res.find(m => m.shipId === "B")!;
      expect(b.cbAfter).toBeGreaterThanOrEqual(b.cbBefore);
    });

    it("enforces: surplus ship cannot exit negative", () => {
      const res = service.createAllocations([
        { shipId: "A", cb: 50 },
        { shipId: "B", cb: -30 }
      ]);
      const a = res.find(m => m.shipId === "A")!;
      expect(a.cbAfter).toBeGreaterThanOrEqual(0);
    });

    it("handles all surplus (no deficits)", () => {
      const res = service.createAllocations([
        { shipId: "A", cb: 100 },
        { shipId: "B", cb: 50 }
      ]);
      const a = res.find(m => m.shipId === "A")!;
      const b = res.find(m => m.shipId === "B")!;
      expect(a.cbAfter).toBe(100);
      expect(b.cbAfter).toBe(50);
    });

    it("handles all deficits (no surplus)", () => {
      expect(() => {
        service.validateMembers([
          { shipId: "A", cb: -50 },
          { shipId: "B", cb: -30 }
        ]);
      }).toThrow("Pool sum must be >= 0");
    });
  });
});



