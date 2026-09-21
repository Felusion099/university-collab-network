import { eventRepository } from "../repositories/event.repository.js";
import { organizationRepository } from "../repositories/organization.repository.js";
import { researchTeamRepository } from "../repositories/researchTeam.repository.js";
import { notificationRepository } from "../repositories/notification.repository.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { buildPaginatedResponse, toPageParams } from "../utils/pagination.js";
import type { CreateEventRequest, UpdateEventRequest } from "@app/shared-types";
import { Prisma } from "@prisma/client";

export async function list(params: {
  cursor?: string;
  limit: number;
  eventType?: string;
  upcoming?: boolean;
}) {
  const { skip, take } = toPageParams(params.cursor, params.limit);
  const items = await eventRepository.list({
    skip,
    take,
    eventType: params.eventType,
    upcoming: params.upcoming,
  });
  return buildPaginatedResponse(items, skip, take);
}

export async function getById(id: string) {
  const event = await eventRepository.findById(id);
  if (!event) throw new NotFoundError("Event not found");
  return event;
}

/** Requester must lead the organizing organization/research team — enforced via canManage's membership-role check, not just any authenticated user. */
export async function create(userId: string, input: CreateEventRequest) {
  if (input.organizerOrganizationId) {
    const canManage = await organizationRepository.isLeaderOrFounder(
      input.organizerOrganizationId,
      userId,
    );
    if (!canManage)
      throw new ForbiddenError("You do not have permission to create events for this organization");
  } else if (input.organizerResearchTeamId) {
    const isMember = await researchTeamRepository.isMember(input.organizerResearchTeamId, userId);
    if (!isMember)
      throw new ForbiddenError(
        "You do not have permission to create events for this research team",
      );
  }

  return eventRepository.create({
    title: input.title,
    description: input.description,
    eventType: input.eventType,
    date: new Date(input.date),
    time: input.time ? new Date(`1970-01-01T${input.time}`) : undefined,
    venue: input.venue,
    organizerOrganization: input.organizerOrganizationId
      ? { connect: { id: input.organizerOrganizationId } }
      : undefined,
    organizerResearchTeam: input.organizerResearchTeamId
      ? { connect: { id: input.organizerResearchTeamId } }
      : undefined,
    registrationUrl: input.registrationUrl,
    capacity: input.capacity,
    tags: input.tags,
  });
}

export async function update(userId: string, id: string, input: UpdateEventRequest) {
  const existing = await eventRepository.findById(id);
  if (!existing) throw new NotFoundError("Event not found");
  const canManage = await eventRepository.canManage(id, userId);
  if (!canManage) throw new ForbiddenError("You do not have permission to edit this event");
  return eventRepository.update(id, {
    title: input.title,
    description: input.description,
    eventType: input.eventType,
    date: input.date ? new Date(input.date) : undefined,
    time: input.time ? new Date(`1970-01-01T${input.time}`) : undefined,
    venue: input.venue,
    registrationUrl: input.registrationUrl,
    capacity: input.capacity,
    // Prisma's Json column: a JS null must be expressed as DbNull
    tags: input.tags === null ? Prisma.DbNull : input.tags,
  });
}

export async function remove(userId: string, id: string) {
  const existing = await eventRepository.findById(id);
  if (!existing) throw new NotFoundError("Event not found");
  const canManage = await eventRepository.canManage(id, userId);
  if (!canManage) throw new ForbiddenError("You do not have permission to delete this event");
  await eventRepository.delete(id);
}

export async function register(userId: string, eventId: string) {
  const existing = await eventRepository.findById(eventId);
  if (!existing) throw new NotFoundError("Event not found");
  const reg = await eventRepository.register(eventId, userId);

  try {
    await notificationRepository.create(userId, "event_reminder", {
      eventId,
      title: existing.title,
      date: existing.date,
      venue: existing.venue,
    });
  } catch {
    // Non-blocking notification side effect
  }

  return reg;
}
