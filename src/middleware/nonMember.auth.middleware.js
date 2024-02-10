import jwt from "jsonwebtoken";
import { prisma } from "../utils/index.js";
import randToken from "rand-token";
import { redisCli } from "../../app.js";

export default async function (req, res, next) {
  try {
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
    //생성했으면 해당 rand-token을 레디스에 저장 (1시간 만료기한)
    await redisCli.set(`${uid}`, "1");
    await redisCli.expire(`${uid}`, 3600);

    next();
  } catch (error) {
    console.log(error.stack);
    return res.status(400).json({
      message: error.message,
    });
  }
}
