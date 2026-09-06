import type { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service.js";
import type {
  UpdateVerificationRequest,
  UpdateReportRequest,
  PaginationQuery,
} from "@app/shared-types";

export async function listVerifications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { status } = req.query as Record<string, string | undefined>;
    res.status(200).json(await adminService.listVerifications(cursor, limit, status));
  } catch (err) {
    next(err);
  }
}

export async function updateVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await adminService.updateVerification(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateVerificationRequest,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listReports(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { cursor, limit } = req.query as unknown as PaginationQuery;
    const { status } = req.query as Record<string, string | undefined>;
    res.status(200).json(await adminService.listReports(cursor, limit, status));
  } catch (err) {
    next(err);
  }
}

export async function updateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await adminService.updateReport(
      req.user!.id,
      req.params.id as string,
      req.body as UpdateReportRequest,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await adminService.getMetrics());
  } catch (err) {
    next(err);
  }
}
