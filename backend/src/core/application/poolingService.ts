import { PoolsRepository } from "../ports/repositories.js";

type MemberInput = { shipId: string; cb: number };

export class PoolingService {
  constructor(private readonly poolsRepo: PoolsRepository) {}

  validateMembers(members: MemberInput[]) {
    const sum = members.reduce((s, m) => s + m.cb, 0);
    if (sum < 0) {
      throw new Error("Pool sum must be >= 0");
    }
  }

  // Greedy allocation: sort by cb desc; use surplus to cover deficits
  createAllocations(members: MemberInput[]) {
    const surplus = members
      .filter(m => m.cb > 0)
      .sort((a, b) => b.cb - a.cb)
      .map(m => ({ shipId: m.shipId, remaining: m.cb }));
    const deficits = members
      .filter(m => m.cb < 0)
      .sort((a, b) => a.cb - b.cb)
      .map(m => ({ shipId: m.shipId, need: -m.cb }));

    const result = new Map<string, number>();
    members.forEach(m => result.set(m.shipId, m.cb));

    let sIdx = 0;
    for (const d of deficits) {
      let need = d.need;
      while (need > 0 && sIdx < surplus.length) {
        const s = surplus[sIdx];
        if (s.remaining <= 0) {
          sIdx++;
          continue;
        }
        const transfer = Math.min(s.remaining, need);
        s.remaining -= transfer;
        need -= transfer;
        result.set(d.shipId, (result.get(d.shipId) ?? 0) + transfer);
        result.set(s.shipId, (result.get(s.shipId) ?? 0) - transfer);
      }
    }

    // Enforce: deficit ship cannot exit worse; surplus ship cannot exit negative
    for (const m of members) {
      const after = result.get(m.shipId)!;
      if (m.cb < 0 && after < m.cb) throw new Error("Deficit ship cannot exit worse");
      if (m.cb > 0 && after < 0) throw new Error("Surplus ship cannot exit negative");
    }

    return members.map(m => ({ shipId: m.shipId, cbBefore: m.cb, cbAfter: result.get(m.shipId)! }));
  }

  async createPool(year: number, members: MemberInput[]) {
    this.validateMembers(members);
    const allocations = this.createAllocations(members);
    const poolId = await this.poolsRepo.createPool(year, allocations);
    return { poolId, members: allocations };
  }
}




