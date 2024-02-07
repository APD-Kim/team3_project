import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import router from '../team3_project/router/posts.js';

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.send("Hello World");
});


app.use('/' , [router]);

app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT}번 포트로 서버 실행중`);
});
