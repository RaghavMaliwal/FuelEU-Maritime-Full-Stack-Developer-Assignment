import type { ApiClient } from "../ports/apiClient.js";
import type { Route, ComparisonRow } from "../domain/types.js";

export class RouteUseCases {
  constructor(private readonly apiClient: ApiClient) {}

  async fetchAllRoutes(): Promise<Route[]> {
    return this.apiClient.getAllRoutes();
  }

  async setBaselineRoute(routeId: number): Promise<void> {
    await this.apiClient.setBaseline(routeId);
  }

  async fetchComparison(): Promise<ComparisonRow[]> {
    return this.apiClient.getComparison();
  }
}


