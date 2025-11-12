import request from "supertest";
import { createTestApp } from "../../../../infrastructure/server/testApp.js";
import { prisma } from "../../../outbound/postgres/prismaClient.js";

const app = createTestApp();

describe("HTTP Integration Tests", () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.poolMember.deleteMany();
    await prisma.pool.deleteMany();
    await prisma.bankEntry.deleteMany();
    await prisma.shipCompliance.deleteMany();
    await prisma.route.deleteMany();

    // Seed test routes
    await prisma.route.createMany({
      data: [
        { routeId: "R001", vesselType: "Container", fuelType: "HFO", year: 2024, ghgIntensity: 91.0, fuelConsumption: 5000, distance: 12000, totalEmissions: 4500, isBaseline: true },
        { routeId: "R002", vesselType: "BulkCarrier", fuelType: "LNG", year: 2024, ghgIntensity: 88.0, fuelConsumption: 4800, distance: 11500, totalEmissions: 4200, isBaseline: false },
        { routeId: "R003", vesselType: "Tanker", fuelType: "MGO", year: 2024, ghgIntensity: 93.5, fuelConsumption: 5100, distance: 12500, totalEmissions: 4700, isBaseline: false },
        { routeId: "R004", vesselType: "RoRo", fuelType: "HFO", year: 2025, ghgIntensity: 89.2, fuelConsumption: 4900, distance: 11800, totalEmissions: 4300, isBaseline: false },
        { routeId: "R005", vesselType: "Container", fuelType: "LNG", year: 2025, ghgIntensity: 90.5, fuelConsumption: 4950, distance: 11900, totalEmissions: 4400, isBaseline: false }
      ]
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /routes", () => {
    it("returns all routes", async () => {
      const res = await request(app).get("/routes");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5);
      expect(res.body[0]).toHaveProperty("routeId");
      expect(res.body[0]).toHaveProperty("ghgIntensity");
    });
  });

  describe("POST /routes/:id/baseline", () => {
    it("sets baseline route", async () => {
      const routes = await prisma.route.findMany();
      const route2 = routes.find(r => r.routeId === "R002")!;

      const res = await request(app).post(`/routes/${route2.id}/baseline`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });

      const updated = await prisma.route.findMany();
      expect(updated.find(r => r.routeId === "R001")?.isBaseline).toBe(false);
      expect(updated.find(r => r.routeId === "R002")?.isBaseline).toBe(true);
    });
  });

  describe("GET /routes/comparison", () => {
    it("returns comparison data with compliance check against target", async () => {
      const res = await request(app).get("/routes/comparison");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(4);

      const expectedRoutes = ["R002", "R003", "R004", "R005"];
      expectedRoutes.forEach((id) => {
        expect(res.body.some((r: any) => r.routeId === id)).toBe(true);
      });

      const r002 = res.body.find((r: any) => r.routeId === "R002");
      expect(r002).toBeDefined();
      expect(r002.baselineGhg).toBe(91.0);
      expect(r002.comparisonGhg).toBe(88.0);
      expect(r002.compliant).toBe(true); // 88.0 <= 89.3368

      const r003 = res.body.find((r: any) => r.routeId === "R003");
      expect(r003).toBeDefined();
      expect(r003.comparisonGhg).toBe(93.5);
      expect(r003.compliant).toBe(false); // 93.5 > 89.3368
    });

    it("returns empty array when no baseline exists", async () => {
      await prisma.route.updateMany({ data: { isBaseline: false } });
      const res = await request(app).get("/routes/comparison");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("GET /compliance/cb", () => {
    it("computes and stores CB snapshot", async () => {
      const res = await request(app)
        .get("/compliance/cb")
        .query({ shipId: "SHIP001", year: 2024 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("shipId", "SHIP001");
      expect(res.body).toHaveProperty("year", 2024);
      expect(res.body).toHaveProperty("cb");
      expect(typeof res.body.cb).toBe("number");

      // Verify stored in database
      const stored = await prisma.shipCompliance.findFirst({
        where: { shipId: "SHIP001", year: 2024 }
      });
      expect(stored).toBeDefined();
      expect(stored?.cbGco2eq).toBe(res.body.cb);
    });

    it("requires shipId and year query params", async () => {
      const res = await request(app).get("/compliance/cb");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /compliance/adjusted-cb", () => {
    it("returns adjusted CB with banked amounts", async () => {
      // Create snapshot
      await prisma.shipCompliance.create({
        data: { shipId: "SHIP001", year: 2024, cbGco2eq: 1000000 }
      });
      // Add banked amount
      await prisma.bankEntry.create({
        data: { shipId: "SHIP001", year: 2024, amount: 500000 }
      });

      const res = await request(app)
        .get("/compliance/adjusted-cb")
        .query({ shipId: "SHIP001", year: 2024 });

      expect(res.status).toBe(200);
      expect(res.body.adjustedCb).toBe(1500000); // 1000000 + 500000
    });

    it("returns 0 when no snapshot exists", async () => {
      const res = await request(app)
        .get("/compliance/adjusted-cb")
        .query({ shipId: "SHIP001", year: 2024 });

      expect(res.status).toBe(200);
      expect(res.body.adjustedCb).toBe(0);
    });
  });

  describe("GET /banking/records", () => {
    it("returns bank records for ship and year", async () => {
      await prisma.bankEntry.createMany({
        data: [
          { shipId: "SHIP001", year: 2024, amount: 1000000 },
          { shipId: "SHIP001", year: 2024, amount: 500000 },
          { shipId: "SHIP002", year: 2024, amount: 2000000 }
        ]
      });

      const res = await request(app)
        .get("/banking/records")
        .query({ shipId: "SHIP001", year: 2024 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every((r: any) => r.shipId === "SHIP001" && r.year === 2024)).toBe(true);
    });
  });

  describe("POST /banking/bank", () => {
    it("banks positive CB surplus", async () => {
      await prisma.shipCompliance.create({
        data: { shipId: "SHIP001", year: 2024, cbGco2eq: 1000000 }
      });

      const res = await request(app)
        .post("/banking/bank")
        .send({ shipId: "SHIP001", year: 2024 });

      expect(res.status).toBe(200);
      expect(res.body.cb_before).toBe(1000000);
      expect(res.body.applied).toBe(1000000);
      expect(res.body.cb_after).toBe(0);

      // Verify bank entry created
      const banked = await prisma.bankEntry.findMany({
        where: { shipId: "SHIP001", year: 2024 }
      });
      expect(banked).toHaveLength(1);
      expect(banked[0].amount).toBe(1000000);
    });

    it("returns error when CB is zero or negative", async () => {
      await prisma.shipCompliance.create({
        data: { shipId: "SHIP001", year: 2024, cbGco2eq: -500000 }
      });

      const res = await request(app)
        .post("/banking/bank")
        .send({ shipId: "SHIP001", year: 2024 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("No positive compliance balance");
    });
  });

  describe("POST /banking/apply", () => {
    it("applies banked surplus to deficit", async () => {
      await prisma.shipCompliance.create({
        data: { shipId: "SHIP001", year: 2024, cbGco2eq: -500000 }
      });
      await prisma.bankEntry.create({
        data: { shipId: "SHIP001", year: 2024, amount: 1000000 }
      });

      const res = await request(app)
        .post("/banking/apply")
        .send({ shipId: "SHIP001", year: 2024, amount: 300000 });

      expect(res.status).toBe(200);
      expect(res.body.cb_before).toBe(-500000);
      expect(res.body.applied).toBe(300000);
      expect(res.body.cb_after).toBe(-200000);
    });

    it("applies maximum available when amount exceeds banked", async () => {
      await prisma.shipCompliance.create({
        data: { shipId: "SHIP001", year: 2024, cbGco2eq: -500000 }
      });
      await prisma.bankEntry.create({
        data: { shipId: "SHIP001", year: 2024, amount: 100000 }
      });

      const res = await request(app)
        .post("/banking/apply")
        .send({ shipId: "SHIP001", year: 2024, amount: 200000 });

      // Should apply only 100000 (what's available), not throw error
      expect(res.status).toBe(200);
      expect(res.body.applied).toBe(100000);
      expect(res.body.cb_after).toBe(-400000); // -500000 + 100000
    });

    it("validates positive amount", async () => {
      const res = await request(app)
        .post("/banking/apply")
        .send({ shipId: "SHIP001", year: 2024, amount: -100 });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /pools", () => {
    it("creates pool with valid members", async () => {
      const res = await request(app)
        .post("/pools")
        .send({
          year: 2025,
          members: [
            { shipId: "A", cb: 100 },
            { shipId: "B", cb: -60 },
            { shipId: "C", cb: -40 }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("poolId");
      expect(res.body.members).toHaveLength(3);

      const a = res.body.members.find((m: any) => m.shipId === "A");
      const b = res.body.members.find((m: any) => m.shipId === "B");
      const c = res.body.members.find((m: any) => m.shipId === "C");

      expect(a.cbAfter).toBeCloseTo(0);
      expect(b.cbAfter).toBeCloseTo(0);
      expect(c.cbAfter).toBeCloseTo(0);
    });

    it("returns error when pool sum is negative", async () => {
      const res = await request(app)
        .post("/pools")
        .send({
          year: 2025,
          members: [
            { shipId: "A", cb: 50 },
            { shipId: "B", cb: -100 }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Pool sum must be >= 0");
    });

    it("validates minimum one member", async () => {
      const res = await request(app)
        .post("/pools")
        .send({
          year: 2025,
          members: []
        });

      expect(res.status).toBe(400);
    });

    it("enforces deficit ship cannot exit worse", async () => {
      // This test verifies the business rule is enforced
      // Pool sum: 30 - 20 = 10 (valid)
      const res = await request(app)
        .post("/pools")
        .send({
          year: 2025,
          members: [
            { shipId: "A", cb: 30 },
            { shipId: "B", cb: -20 }
          ]
        });

      // Should succeed and B should not be worse than -20 (should improve)
      expect(res.status).toBe(200);
      const b = res.body.members.find((m: any) => m.shipId === "B");
      expect(b.cbAfter).toBeGreaterThanOrEqual(-20); // B should improve or stay same
      expect(b.cbAfter).toBeLessThanOrEqual(0); // But not become positive from this allocation
    });
  });
});

