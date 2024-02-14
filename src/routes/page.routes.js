import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/logins", (req, res, next) => {
  res.render("login");
});

router.get("/write", authMiddleware, (req, res, next) => {
  res.render("write");
});

export default router;
