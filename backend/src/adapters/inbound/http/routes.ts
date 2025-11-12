import express from "express";
import { z } from "zod";
import { RouteService } from "../../../core/application/routeService.js";
import { ComplianceService } from "../../../core/application/complianceService.js";
import { BankingService } from "../../../core/application/bankingService.js";
import { PoolingService } from "../../../core/application/poolingService.js";

export function buildRouter(deps: {
  routeService: RouteService;
  complianceService: ComplianceService;
  bankingService: BankingService;
  poolingService: PoolingService;
}) {
  const router = express.Router();

  // Routes
  router.get("/routes", async (_req, res, next) => {
    try {
      const rows = await deps.routeService.getAllRoutes();
      res.json(rows);
    } catch (e) { next(e); }
  });

  router.post("/routes/:id/baseline", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      await deps.routeService.setBaseline(id);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  router.get("/routes/comparison", async (_req, res, next) => {
    try {
      const rows = await deps.routeService.getComparison();
      res.json(rows);
    } catch (e) { next(e); }
  });

  // Compliance
  router.get("/compliance/cb", async (req, res, next) => {
    try {
      const schema = z.object({ shipId: z.string(), year: z.coerce.number() });
      const { shipId, year } = schema.parse(req.query);
      const cb = await deps.complianceService.computeAndStoreSnapshot(shipId, year);
      res.json({ shipId, year, cb });
    } catch (e) { next(e); }
  });

  router.get("/compliance/adjusted-cb", async (req, res, next) => {
    try {
      const schema = z.object({ shipId: z.string(), year: z.coerce.number() });
      const { shipId, year } = schema.parse(req.query);
      const cb = await deps.complianceService.getAdjustedCB(shipId, year);
      res.json({ shipId, year, adjustedCb: cb });
    } catch (e) { next(e); }
  });

  // Banking
  router.get("/banking/records", async (req, res, next) => {
    try {
      const schema = z.object({ shipId: z.string(), year: z.coerce.number() });
      const { shipId, year } = schema.parse(req.query);
      const list = await deps.bankingService.listRecords(shipId, year);
      res.json(list);
    } catch (e) { next(e); }
  });

  router.post("/banking/bank", async (req, res, next) => {
    try {
      const schema = z.object({ shipId: z.string(), year: z.coerce.number() });
      const { shipId, year } = schema.parse(req.body);
      const result = await deps.bankingService.bankSurplus(shipId, year);
      res.json(result);
    } catch (e) { next(e); }
  });

  router.post("/banking/apply", async (req, res, next) => {
    try {
      const schema = z.object({ shipId: z.string(), year: z.coerce.number(), amount: z.coerce.number().positive() });
      const { shipId, year, amount } = schema.parse(req.body);
      const result = await deps.bankingService.applyBanked(shipId, year, amount);
      res.json(result);
    } catch (e) { next(e); }
  });

  // Pools
  router.post("/pools", async (req, res, next) => {
    try {
      const schema = z.object({
        year: z.coerce.number(),
        members: z.array(z.object({ shipId: z.string(), cb: z.number() })).min(1)
      });
      const { year, members } = schema.parse(req.body);
      const result = await deps.poolingService.createPool(year, members);
      res.json(result);
    } catch (e) { next(e); }
  });

  // Error handler
  router.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err?.message ?? "Unexpected error";
    res.status(400).json({ error: message });
  });

  return router;
}




