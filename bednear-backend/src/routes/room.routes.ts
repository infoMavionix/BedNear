import { Router } from "express";
import authMiddleware, {
  requireApprovedOwner,
} from "../middleware/auth.middleware";

import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/room.controller";

const router = Router();

// Only authenticated and approved PG owners can manage rooms.
router.use(authMiddleware, requireApprovedOwner);

router.get("/", getRooms);
router.post("/", createRoom);
router.patch("/:id", updateRoom);
router.delete("/:id", deleteRoom);

export default router;