import { Router } from "express";
import {
  CreateConversationRequestSchema,
  CreateMessageRequestSchema,
  PaginationQuerySchema,
} from "@app/shared-types";
import { validateBody, validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/conversation.controller.js";
import { messageBus } from "../services/messageBus.js";
import { assertParticipantForStream } from "../services/conversation.service.js";

const router = Router();

router.use(requireAuth);
router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.post("/", validateBody(CreateConversationRequestSchema), controller.create);
router.get("/:id", controller.getById);
router.get("/:id/messages", validateQuery(PaginationQuerySchema), controller.listMessages);
router.post("/:id/messages", validateBody(CreateMessageRequestSchema), controller.sendMessage);

// GET /conversations/:id/stream — SSE realtime delivery for members.
// Auth + participant membership asserted server-side; each new message
// is pushed as a JSON event. No polling.
router.get("/:id/stream", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as { user?: { id: string } }).user?.id;
    if (!userId) {
      res.status(401).end();
      return;
    }
    // assertParticipant without a next(err) path — check directly
    await assertParticipantForStream(String(req.params.id), userId);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write(": connected\n\n");

    const unsubscribe = messageBus.subscribe(String(req.params.id), (message) => {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    });

    req.on("close", () => {
      unsubscribe();
      res.end();
    });
  } catch (err) {
    next(err);
  }
});

export { router as conversationsRouter };
