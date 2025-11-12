import { prisma } from "./prismaClient.js";
import { BankingRepository, ComplianceRepository, PoolsRepository, RoutesRepository } from "../../../core/ports/repositories.js";
import { BankRecord, PoolMemberAllocation, RouteRecord } from "../../../core/domain/types.js";

export class PrismaRoutesRepository implements RoutesRepository {
  async findAll(): Promise<RouteRecord[]> {
    const rows = await prisma.route.findMany({ orderBy: { id: "asc" } });
    return rows.map(r => ({
      id: r.id,
      routeId: r.routeId,
      vesselType: r.vesselType,
      fuelType: r.fuelType,
      year: r.year,
      ghgIntensity: r.ghgIntensity,
      fuelConsumption: r.fuelConsumption,
      distance: r.distance,
      totalEmissions: r.totalEmissions,
      isBaseline: r.isBaseline
    }));
  }
  async findBaseline(): Promise<RouteRecord | null> {
    const r = await prisma.route.findFirst({ where: { isBaseline: true } });
    if (!r) return null;
    return {
      id: r.id,
      routeId: r.routeId,
      vesselType: r.vesselType,
      fuelType: r.fuelType,
      year: r.year,
      ghgIntensity: r.ghgIntensity,
      fuelConsumption: r.fuelConsumption,
      distance: r.distance,
      totalEmissions: r.totalEmissions,
      isBaseline: r.isBaseline
    };
  }
  async setBaselineById(id: number): Promise<void> {
    await prisma.$transaction([
      prisma.route.updateMany({ data: { isBaseline: false }, where: { isBaseline: true } }),
      prisma.route.update({ where: { id }, data: { isBaseline: true } })
    ]);
  }
}

export class PrismaComplianceRepository implements ComplianceRepository {
  async saveSnapshot(shipId: string, year: number, cb: number): Promise<void> {
    await prisma.shipCompliance.create({
      data: { shipId, year, cbGco2eq: cb }
    });
  }
  async getLatestSnapshot(shipId: string, year: number): Promise<number | null> {
    const rec = await prisma.shipCompliance.findFirst({
      where: { shipId, year },
      orderBy: { createdAt: "desc" }
    });
    return rec ? rec.cbGco2eq : null;
  }
}

export class PrismaBankingRepository implements BankingRepository {
  async getBankedSum(shipId: string, year: number): Promise<number> {
    const rows = await prisma.bankEntry.findMany({ where: { shipId, year } });
    return rows.reduce((s, r) => s + r.amount, 0);
  }
  async listRecords(shipId: string, year: number): Promise<BankRecord[]> {
    const rows = await prisma.bankEntry.findMany({
      where: { shipId, year },
      orderBy: { createdAt: "desc" }
    });
    return rows.map(r => ({ id: r.id, shipId: r.shipId, year: r.year, amount: r.amount, createdAt: r.createdAt }));
  }
  async addBankEntry(shipId: string, year: number, amount: number): Promise<void> {
    await prisma.bankEntry.create({ data: { shipId, year, amount } });
  }
}

export class PrismaPoolsRepository implements PoolsRepository {
  async createPool(year: number, members: PoolMemberAllocation[]): Promise<number> {
    const pool = await prisma.pool.create({
      data: {
        year,
        members: {
          create: members.map(m => ({ shipId: m.shipId, cbBefore: m.cbBefore, cbAfter: m.cbAfter }))
        }
      }
    });
    return pool.id;
  }
}




