import jwt from "jsonwebtoken";
import { prisma } from "../utils/index.js";
import randToken from "rand-token";
import { redisCli } from "../../app.js";

export default async function (req, res, next) {
  try {
    //접속하지 않은 사용자도 
    let { uid } = req.cookies;
    console.log(3);
    if (!uid) {
      const newUid = randToken.generate(12);
      console.log(newUid);
      console.log(1);
      const token = jwt.sign({ uid: newUid }, "custom-secret-key", { expiresIn: "1h" });
      res.cookie("uid", token, { httpOnly: true, maxAge: 1000 * 60 * 60 });
      uid = newUid;
    }

    next();
  } catch (error) {
    console.log(error.stack);
    return res.status(400).json({
      message: error.message,
    });
  }
}
