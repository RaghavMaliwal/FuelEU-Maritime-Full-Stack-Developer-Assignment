import { BankingRepository, ComplianceRepository } from "../ports/repositories.js";

export class BankingService {
  constructor(
    private readonly bankingRepo: BankingRepository,
    private readonly complianceRepo: ComplianceRepository
  ) {}

  async listRecords(shipId: string, year: number) {
    return this.bankingRepo.listRecords(shipId, year);
  }

  async bankSurplus(shipId: string, year: number) {
    const cb = await this.complianceRepo.getLatestSnapshot(shipId, year);
    if (!cb || cb <= 0) {
      throw new Error("No positive compliance balance to bank.");
    }
    await this.bankingRepo.addBankEntry(shipId, year, cb);
    return { cb_before: cb, applied: cb, cb_after: 0 };
  }

  async applyBanked(shipId: string, year: number, amount: number) {
    const cb = await this.complianceRepo.getLatestSnapshot(shipId, year);
    const current = cb ?? 0;
    const banked = await this.bankingRepo.getBankedSum(shipId, year);
    if (banked <= 0) {
      throw new Error("No banked surplus available to apply.");
    }
    // Apply maximum available (don't throw if amount > banked, just apply what's available)
    const applied = Math.min(amount, banked);
    await this.bankingRepo.addBankEntry(shipId, year, -applied);
    const after = current + applied;
    return { cb_before: current, applied, cb_after: after };
  }
}



