import express from "express";
import { buildRouter } from "../../adapters/inbound/http/routes.js";
import { PrismaRoutesRepository, PrismaComplianceRepository, PrismaBankingRepository, PrismaPoolsRepository } from "../../adapters/outbound/postgres/repositories.js";
import { RouteService } from "../../core/application/routeService.js";
import { ComplianceService } from "../../core/application/complianceService.js";
import { BankingService } from "../../core/application/bankingService.js";
import { PoolingService } from "../../core/application/poolingService.js";

/**
 * Creates Express app for testing (without starting server)
 */
export function createTestApp() {
  const app = express();
  app.use(express.json());

  // Wire dependencies (hexagonal)
  const routesRepo = new PrismaRoutesRepository();
  const complianceRepo = new PrismaComplianceRepository();
  const bankingRepo = new PrismaBankingRepository();
  const poolsRepo = new PrismaPoolsRepository();

  const routeService = new RouteService(routesRepo);
  const complianceService = new ComplianceService(routesRepo, complianceRepo, bankingRepo);
  const bankingService = new BankingService(bankingRepo, complianceRepo);
  const poolingService = new PoolingService(poolsRepo);

  app.use("/", buildRouter({ routeService, complianceService, bankingService, poolingService }));

  return app;
}


