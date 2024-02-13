import express from "express";

const router = express.Router();

router.get("/logins", (req, res, next) => {
  res.render("login");
});
export default router;
