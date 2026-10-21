import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import {
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/room.controller";

const router = Router();

router.use(authMiddleware);
router.get("/", getRooms);
router.post("/", createRoom);
router.patch("/:id", updateRoom);
router.delete("/:id", deleteRoom);

export default router;