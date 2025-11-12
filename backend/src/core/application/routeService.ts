import { ComparisonRow, RouteRecord } from "../domain/types.js";
import { RoutesRepository } from "../ports/repositories.js";
import { TARGET_INTENSITY_2025 } from "../../shared/constants.js";

export class RouteService {
  constructor(private readonly routesRepo: RoutesRepository) {}

  async getAllRoutes(): Promise<RouteRecord[]> {
    return this.routesRepo.findAll();
  }

  async setBaseline(routeId: number): Promise<void> {
    await this.routesRepo.setBaselineById(routeId);
  }

  async getComparison(): Promise<ComparisonRow[]> {
    const routes = await this.routesRepo.findAll();
    const baseline = routes.find(r => r.isBaseline);
    if (!baseline) return [];
    const baseGhg = baseline.ghgIntensity;
    return routes
      .filter(r => r.id !== baseline.id)
      .map(r => {
        const percentDiff = ((r.ghgIntensity / baseGhg) - 1) * 100;
        // Compliance check against target 89.3368 gCO₂e/MJ (2% below 91.16)
        const compliant = r.ghgIntensity <= TARGET_INTENSITY_2025;
        return {
          routeId: r.routeId,
          baselineGhg: baseGhg,
          comparisonGhg: r.ghgIntensity,
          percentDiff,
          compliant
        };
      });
  }
}



