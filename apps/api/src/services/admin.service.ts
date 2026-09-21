import { adminRepository } from "../repositories/admin.repository.js";
import { NotFoundError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { UpdateVerificationRequest, UpdateReportRequest } from "@app/shared-types";

export async function listVerifications(
  cursor: string | undefined,
  limit: number,
  status?: string,
) {
  const { skip, take } = toPageParams(cursor, limit);
  const items = await adminRepository.listVerifications({ skip, take, status });
  return buildPaginatedResponse(items, skip, take);
}

export async function updateVerification(
  reviewerId: string,
  id: string,
  input: UpdateVerificationRequest,
) {
  const existing = await adminRepository.findVerification(id);
  if (!existing) throw new NotFoundError("Verification request not found");
  return adminRepository.updateVerification(id, input.status, reviewerId);
}

export async function listReports(cursor: string | undefined, limit: number, status?: string) {
  const { skip, take } = toPageParams(cursor, limit);
  const items = await adminRepository.listReports({ skip, take, status });
  return buildPaginatedResponse(items, skip, take);
}

export async function updateReport(reviewerId: string, id: string, input: UpdateReportRequest) {
  const existing = await adminRepository.findReport(id);
  if (!existing) throw new NotFoundError("Report not found");
  return adminRepository.updateReport(id, input.status, input.action, reviewerId);
}

export async function getMetrics() {
  return adminRepository.getMetrics();
}
