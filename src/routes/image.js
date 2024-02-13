import aws from "aws-sdk";
import express from "express";
import multers3 from "multer-s3";
import multer from "multer";
import { prisma } from "../utils/index.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const router = express.Router();

const s3 = new S3Client({
  region: process.env.IMG_REGION,
  credentials: {
    accessKeyId: process.env.IMG_DATA,
    secretAccessKey: process.env.IMG_SECRETKEY,
  },
});

const upload = multer({
  storage: multers3({
    s3,
    bucket: process.env.IMG_BUCKET,
    contentType: multers3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `${Date.now().toString()}_${file.originalname}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 최대 10MB 파일 업로드 허용
});

router.post("/image/:postId", authMiddleware, upload.single("image"), async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { postId } = req.params;
      const { postimg } = req.body;
      const post = await prisma.post.findFirst({
        where: { postId: +postId },
      });
      if (post.userId !== userId) {
        return res.status(401).json({ message: "수정할 권한이 없습니다." });
      }
      const posts = await prisma.post.update({
        where: { postId: +postId },
        data: {
          postimg,
        },
      });
      return res.status(201).json({ data: posts });
    } catch (error) {
      console.error(error.message);
      if (!upload) throw new Error("메시지 업로드 오류");
      return res.status(500).json({ message: "서버 전송 오류" });
    }
  }
);

router.delete("/image/:postId", authMiddleware, async (req, res, next) => {
  try {
    const { postimg } = req.body;
    const { userId } = req.user;
    const { postId } = req.params;

    const post = await prisma.post.findFirst({
      where: { postId: +postId },
    });

    if (post.userId !== userId) {
      return res.status(401).json({ message: "수정할 권한이 없습니다." });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.IMG_BUCKET,
      Key: postimg,
    });
    await s3.send(command);

    await prisma.post.update({
      where: { postId: +postId },
      data: {
        postimg: null,
      },
    });

    return res.status(200).json({ message: "삭제 완료" });
  } catch (error) {
    console.error(error.message);
  }
});

export default router;
