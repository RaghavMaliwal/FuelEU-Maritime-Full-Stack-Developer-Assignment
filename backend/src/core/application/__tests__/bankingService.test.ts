import { BankingService } from "../bankingService.js";
import { BankingRepository, ComplianceRepository } from "../../ports/repositories.js";
import { BankRecord } from "../../domain/types.js";

class FakeComplianceRepo implements ComplianceRepository {
  private snapshots: Map<string, number> = new Map();

  async saveSnapshot(shipId: string, year: number, cb: number): Promise<void> {
    this.snapshots.set(`${shipId}-${year}`, cb);
  }

  async getLatestSnapshot(shipId: string, year: number): Promise<number | null> {
    return this.snapshots.get(`${shipId}-${year}`) ?? null;
  }

  setSnapshot(shipId: string, year: number, cb: number) {
    this.snapshots.set(`${shipId}-${year}`, cb);
  }

  clear() {
    this.snapshots.clear();
  }
}

class FakeBankingRepo implements BankingRepository {
  private banked: Map<string, number> = new Map();
  private records: BankRecord[] = [];
  private nextId = 1;

  async getBankedSum(shipId: string, year: number): Promise<number> {
    return this.banked.get(`${shipId}-${year}`) ?? 0;
  }

  async listRecords(shipId: string, year: number): Promise<BankRecord[]> {
    return this.records.filter(r => r.shipId === shipId && r.year === year);
  }

  async addBankEntry(shipId: string, year: number, amount: number): Promise<void> {
    const key = `${shipId}-${year}`;
    this.banked.set(key, (this.banked.get(key) ?? 0) + amount);
    this.records.push({
      id: this.nextId++,
      shipId,
      year,
      amount,
      createdAt: new Date()
    });
  }

  clear() {
    this.banked.clear();
    this.records = [];
    this.nextId = 1;
  }
}

describe("BankingService", () => {
  let service: BankingService;
  let bankingRepo: FakeBankingRepo;
  let complianceRepo: FakeComplianceRepo;

  beforeEach(() => {
    bankingRepo = new FakeBankingRepo();
    complianceRepo = new FakeComplianceRepo();
    service = new BankingService(bankingRepo, complianceRepo);
  });

  describe("listRecords", () => {
    it("returns bank records for ship and year", async () => {
      await bankingRepo.addBankEntry("SHIP001", 2024, 1000000);
      await bankingRepo.addBankEntry("SHIP001", 2024, 500000);
      await bankingRepo.addBankEntry("SHIP002", 2024, 2000000);

      const records = await service.listRecords("SHIP001", 2024);
      expect(records).toHaveLength(2);
      expect(records.every(r => r.shipId === "SHIP001" && r.year === 2024)).toBe(true);
    });
  });

  describe("bankSurplus", () => {
    it("banks positive CB and returns KPIs", async () => {
      complianceRepo.setSnapshot("SHIP001", 2024, 1000000);

      const result = await service.bankSurplus("SHIP001", 2024);

      expect(result.cb_before).toBe(1000000);
      expect(result.applied).toBe(1000000);
      expect(result.cb_after).toBe(0);

      const banked = await bankingRepo.getBankedSum("SHIP001", 2024);
      expect(banked).toBe(1000000);
    });

    it("throws error when CB is zero or negative", async () => {
      complianceRepo.setSnapshot("SHIP001", 2024, 0);
      await expect(service.bankSurplus("SHIP001", 2024)).rejects.toThrow("No positive compliance balance to bank");

      complianceRepo.setSnapshot("SHIP001", 2024, -500000);
      await expect(service.bankSurplus("SHIP001", 2024)).rejects.toThrow("No positive compliance balance to bank");
    });

    it("throws error when no snapshot exists", async () => {
      await expect(service.bankSurplus("SHIP001", 2024)).rejects.toThrow("No positive compliance balance to bank");
    });
  });

  describe("applyBanked", () => {
    it("applies banked surplus to deficit and returns KPIs", async () => {
      complianceRepo.setSnapshot("SHIP001", 2024, -500000);
      await bankingRepo.addBankEntry("SHIP001", 2024, 1000000); // Banked surplus

      const result = await service.applyBanked("SHIP001", 2024, 300000);

      expect(result.cb_before).toBe(-500000);
      expect(result.applied).toBe(300000);
      expect(result.cb_after).toBe(-200000);

      // Banked amount should be reduced
      const banked = await bankingRepo.getBankedSum("SHIP001", 2024);
      expect(banked).toBe(700000); // 1000000 - 300000
    });

    it("applies maximum available when requested amount exceeds banked", async () => {
      complianceRepo.setSnapshot("SHIP001", 2024, -500000);
      await bankingRepo.addBankEntry("SHIP001", 2024, 200000); // Only 200k banked

      const result = await service.applyBanked("SHIP001", 2024, 500000); // Request 500k

      expect(result.cb_before).toBe(-500000);
      expect(result.applied).toBe(200000); // Only 200k applied
      expect(result.cb_after).toBe(-300000);
    });

    it("throws error when no banked amount available", async () => {
      complianceRepo.setSnapshot("SHIP001", 2024, -500000);
      // No banked entries

      await expect(service.applyBanked("SHIP001", 2024, 200000)).rejects.toThrow("No banked surplus available to apply");
    });

    it("handles edge case: applying all banked amount", async () => {
      complianceRepo.setSnapshot("SHIP001", 2024, -500000);
      await bankingRepo.addBankEntry("SHIP001", 2024, 500000);

      const result = await service.applyBanked("SHIP001", 2024, 500000);

      expect(result.cb_before).toBe(-500000);
      expect(result.applied).toBe(500000);
      expect(result.cb_after).toBe(0);

      const banked = await bankingRepo.getBankedSum("SHIP001", 2024);
      expect(banked).toBe(0);
    });

    it("handles case with no existing snapshot (treats as 0)", async () => {
      await bankingRepo.addBankEntry("SHIP001", 2024, 1000000);

      const result = await service.applyBanked("SHIP001", 2024, 300000);

      expect(result.cb_before).toBe(0);
      expect(result.applied).toBe(300000);
      expect(result.cb_after).toBe(300000);
    });
  });
});

