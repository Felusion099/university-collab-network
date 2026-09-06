import { opportunityRepository } from "../repositories/opportunity.repository.js";
import { organizationRepository } from "../repositories/organization.repository.js";
import { researchTeamRepository } from "../repositories/researchTeam.repository.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type {
  CreateOpportunityRequest,
  UpdateOpportunityRequest,
  ApplicationStatus,
} from "@app/shared-types";

export async function list(params: {
  cursor?: string;
  limit: number;
  type?: string;
  department?: string;
  deadlineBefore?: string;
  skill?: string;
}) {
  const { skip, take } = toPageParams(params.cursor, params.limit);
  const items = await opportunityRepository.list({ ...params, skip, take });
  return buildPaginatedResponse(items, skip, take);
}

export async function getById(id: string) {
  const opp = await opportunityRepository.findById(id);
  if (!opp) throw new NotFoundError("Opportunity not found");
  return opp;
}

export async function create(userId: string, input: CreateOpportunityRequest) {
  if (input.providedByOrganizationId) {
    const canManage = await organizationRepository.isLeaderOrFounder(
      input.providedByOrganizationId,
      userId,
    );
    if (!canManage)
      throw new ForbiddenError(
        "You do not have permission to post opportunities for this organization",
      );
  } else if (input.providedByResearchTeamId) {
    const isMember = await researchTeamRepository.isMember(input.providedByResearchTeamId, userId);
    if (!isMember)
      throw new ForbiddenError(
        "You do not have permission to post opportunities for this research team",
      );
  }

  return opportunityRepository.create({
    title: input.title,
    description: input.description,
    opportunityType: input.opportunityType,
    providedByOrganization: input.providedByOrganizationId
      ? { connect: { id: input.providedByOrganizationId } }
      : undefined,
    providedByResearchTeam: input.providedByResearchTeamId
      ? { connect: { id: input.providedByResearchTeamId } }
      : undefined,
    deadline: input.deadline ? new Date(input.deadline) : undefined,
    departmentTag: input.departmentTag,
    researchTopic: input.researchTopicId ? { connect: { id: input.researchTopicId } } : undefined,
  });
}

export async function update(userId: string, id: string, input: UpdateOpportunityRequest) {
  const existing = await opportunityRepository.findById(id);
  if (!existing) throw new NotFoundError("Opportunity not found");
  const canManage = await opportunityRepository.canManage(id, userId);
  if (!canManage) throw new ForbiddenError("You do not have permission to edit this opportunity");
  return opportunityRepository.update(id, {
    title: input.title,
    description: input.description,
    deadline:
      input.deadline === null ? null : input.deadline ? new Date(input.deadline) : undefined,
    departmentTag: input.departmentTag,
  });
}

export async function remove(userId: string, id: string) {
  const existing = await opportunityRepository.findById(id);
  if (!existing) throw new NotFoundError("Opportunity not found");
  const canManage = await opportunityRepository.canManage(id, userId);
  if (!canManage) throw new ForbiddenError("You do not have permission to delete this opportunity");
  await opportunityRepository.delete(id);
}

export async function apply(userId: string, opportunityId: string) {
  const opp = await opportunityRepository.findById(opportunityId);
  if (!opp) throw new NotFoundError("Opportunity not found");
  const existing = await opportunityRepository.findApplication(opportunityId, userId);
  if (existing) throw new ConflictError("You have already applied to this opportunity");
  return opportunityRepository.createApplication(opportunityId, userId);
}

export async function updateApplicationStatus(
  userId: string,
  opportunityId: string,
  applicationId: string,
  status: ApplicationStatus,
) {
  const canManage = await opportunityRepository.canManage(opportunityId, userId);
  if (!canManage)
    throw new ForbiddenError(
      "You do not have permission to review applications for this opportunity",
    );
  return opportunityRepository.updateApplication(applicationId, status);
}
