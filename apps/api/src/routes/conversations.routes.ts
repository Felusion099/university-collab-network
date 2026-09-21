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
import { verifyAccessToken } from "../services/auth.service.js";
import { userRepository } from "../repositories/user.repository.js";
import { UnauthorizedError } from "../utils/errors.js";

const router = Router();

router.get("/:id/stream", async (req, res, next) => {
  try {
    const token = req.query.token;
    let userId: string;
    try {
      if (typeof token !== "string" || !token) throw new Error("missing");
      const payload = verifyAccessToken(token);
      const user = await userRepository.findByIdLean(payload.sub);
      if (!user) throw new Error("no user");
      if (user.status === "suspended" || user.status === "banned") throw new Error("suspended");
      userId = user.id;
    } catch {
      throw new UnauthorizedError("Missing or invalid stream token");
    }
    // Participant membership asserted server-side
    await assertParticipantForStream(String(req.params.id), userId);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      // Ask intermediary proxies (nginx-style, dev proxies) not to buffer
      // the stream — Firefox is sensitive to buffered SSE through proxies.
      "X-Accel-Buffering": "no",
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

router.post("/direct", requireAuth, controller.openDirect);

router.use(requireAuth);
router.get("/", validateQuery(PaginationQuerySchema), controller.list);
router.post("/", validateBody(CreateConversationRequestSchema), controller.create);
router.get("/:id", controller.getById);
router.get("/:id/messages", validateQuery(PaginationQuerySchema), controller.listMessages);
router.post("/:id/messages", validateBody(CreateMessageRequestSchema), controller.sendMessage);

// GET /conversations/:id/stream — SSE realtime delivery for members.
// Auth + participant membership asserted server-side; each new message
// is pushed as a JSON event. No polling.
// SSE cannot send custom headers — the access token arrives via the
// ?token= query parameter and is validated with the SAME verification
// requireAuth uses (never trusted blindly). Sender identity is always
// determined by the token payload + database lookup, never by the client.


// POST /conversations/:id/read — opening the conversation marks it read
// (participant's lastReadAt updated; refreshing preserves it).
router.post("/:id/read", requireAuth, controller.markRead);

export { router as conversationsRouter };
