import { TARGET_INTENSITY_2025 } from "../../shared/constants.js";
import { RoutesRepository, ComplianceRepository, BankingRepository } from "../ports/repositories.js";

export class ComplianceService {
  constructor(
    private readonly routesRepo: RoutesRepository,
    private readonly complianceRepo: ComplianceRepository,
    private readonly bankingRepo: BankingRepository
  ) {}

  // Energy in scope (MJ) ≈ fuelConsumption × 41,000 MJ/t
  private energyInScopeMj(fuelConsumptionTons: number): number {
    return fuelConsumptionTons * 41000;
  }

  // Compliance Balance = ( Target − Actual ) × Energy in scope
  private computeCBForRoute(actualGhgIntensity: number, fuelConsumptionTons: number): number {
    const energy = this.energyInScopeMj(fuelConsumptionTons);
    return (TARGET_INTENSITY_2025 - actualGhgIntensity) * energy;
  }

  async computeAndStoreSnapshot(shipId: string, year: number): Promise<number> {
    const routes = await this.routesRepo.findAll();
    const yearRoutes = routes.filter(r => r.year === year);
    const cbSum = yearRoutes.reduce((sum, r) => sum + this.computeCBForRoute(r.ghgIntensity, r.fuelConsumption), 0);
    await this.complianceRepo.saveSnapshot(shipId, year, cbSum);
    return cbSum;
  }

  async getAdjustedCB(shipId: string, year: number): Promise<number> {
    const latest = await this.complianceRepo.getLatestSnapshot(shipId, year);
    const base = latest ?? 0;
    const banked = await this.bankingRepo.getBankedSum(shipId, year);
    return base + banked;
  }
}




