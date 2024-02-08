import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";

import commentRouter from "./src/routes/comments.routes.js";
import userRouter from "./src/routes/user.router.js";
import postRouter from "./src/routes/posts.js";
import likeRouter from "./src/routes/like.routes.js";
import replyRouter from "./src/routes/reply.routes.js";
import followRouter from "./src/routes/follow.routes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(userRouter);
app.use(commentRouter);
app.use(postRouter);
app.use(likeRouter);
app.use(replyRouter);
app.use(followRouter);

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT}번 포트로 서버 실행중`);
});
