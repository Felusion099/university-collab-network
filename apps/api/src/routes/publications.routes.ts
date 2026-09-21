import { Router } from "express";
import { z } from "zod";
import {
  CreatePublicationRequestSchema,
  UpdatePublicationRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireProfessorVerified, requireProfessorOwnership } from "../middleware/requireProfessorOwnership.js";
import * as controller from "../controllers/publication.controller.js";

const router = Router();

router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.get("/:id", controller.getById);
router.post("/", requireAuth, validateBody(CreatePublicationRequestSchema), controller.create);
router.patch("/:id", requireAuth, validateBody(UpdatePublicationRequestSchema), controller.update);
router.delete("/:id", requireAuth, controller.remove);

// ============================================================================
// PROFESSOR PUBLICATION ENDPOINTS (Phase 9+)
// ============================================================================

// Professor creates a publication (must include themselves as author)
router.post(
  "/professor",
  requireAuth,
  requireProfessorVerified,
  validateBody(z.object({
    title: z.string().min(1),
    abstract: z.string().optional(),
    journalOrConference: z.string().optional(),
    publishedDate: z.string().date().optional(),
    doi: z.string().optional(),
    externalUrl: z.string().url().optional(),
    pdfUrl: z.string().url().optional(),
    authorIds: z.array(z.string().uuid()).min(1),
    topicIds: z.array(z.string().uuid()).optional(),
  })),
  controller.createByProfessor
);

// Professor lists their own publications
router.get(
  "/professor/me",
  requireAuth,
  requireProfessorVerified,
  validateQuery(PaginationQuerySchema),
  controller.listByProfessor
);

// Professor updates their publication (must be an author)
router.patch(
  "/professor/:id",
  requireAuth,
  requireProfessorOwnership('publication', 'id'),
  validateBody(z.object({
    title: z.string().optional(),
    abstract: z.string().optional(),
    journalOrConference: z.string().optional(),
    publishedDate: z.string().date().optional(),
    doi: z.string().optional(),
    externalUrl: z.string().optional(),
    pdfUrl: z.string().optional(),
  })),
  controller.updateByProfessor
);

// Professor removes their publication
router.delete(
  "/professor/:id",
  requireAuth,
  requireProfessorOwnership('publication', 'id'),
  controller.removeByProfessor
);

// Professor adds a co-author to their publication
router.post(
  "/professor/:id/authors",
  requireAuth,
  requireProfessorOwnership('publication', 'id'),
  validateBody(z.object({ authorId: z.string().uuid(), authorOrder: z.number().int().positive() })),
  controller.addAuthorByProfessor
);

// Professor removes an author from their publication
router.delete(
  "/professor/:id/authors/:authorId",
  requireAuth,
  requireProfessorOwnership('publication', 'id'),
  controller.removeAuthorByProfessor
);

// Professor updates author order in their publication
router.patch(
  "/professor/:id/authors/:authorId",
  requireAuth,
  requireProfessorOwnership('publication', 'id'),
  validateBody(z.object({ authorOrder: z.number().int().positive() })),
  controller.updateAuthorOrderByProfessor
);

// Professor lists their own publications
router.get(
  "/professor/me",
  requireAuth,
  requireProfessorVerified,
  validateQuery(PaginationQuerySchema),
  controller.listByProfessor
);

export { router as publicationsRouter };
