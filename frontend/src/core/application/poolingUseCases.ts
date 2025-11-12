import type { ApiClient } from "../ports/apiClient.js";
import type { PoolMember, PoolResult } from "../domain/types.js";

export class PoolingUseCases {
  constructor(private readonly apiClient: ApiClient) {}

  async createPool(year: number, members: PoolMember[]): Promise<PoolResult> {
    return this.apiClient.createPool(year, members);
  }
}


