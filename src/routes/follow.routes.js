import express from "express";
import { prisma } from "../utils/index.js";
import { Prisma } from "@prisma/client";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();
//유저 팔로우 하기
router.post("/follow/:followId", authMiddleware, async (req, res, next) => {
  const { followId } = req.params; //팔로우 당하는 사람
  const { userId } = req.user; //팔로우 하는 사람
  try {
    const follower = await prisma.user.findFirst({
      where: { userId: Number(followId) },
    });
    if (!follower) {
      return res.status(404).json({ message: "팔로우할 대상이 없습니다." });
    }
    //팔로우 할 대상이 있다면 팔로워로 등록(생성)
    const searchFollow = await prisma.follow.findFirst({
      where: {
        follower: Number(userId),
        following: Number(followId),
      },
    });
    // 만약 팔로우를 하지 않았다면
    if (!searchFollow) {
      const result = await prisma.$transaction(async (tx) => {
        const follow = await tx.follow.create({
          data: {
            follower: Number(userId),
            following: Number(followId),
          },
        });
        const incFollower = await tx.user.update({
          where: { userId: Number(followId) },
          data: { follower: { increment: 1 } },
        });
        return [follow, incFollower];
      });
      return res.status(204).json({ message: "팔로우 성공" });
    } else {
      //팔로우가 되어있다면
      const result = await prisma.$transaction(async (tx) => {
        const follow = await tx.follow.delete({
          where: { followId: searchFollow.followId },
        });
        const decFollower = await tx.user.update({
          where: { userId: Number(followId) },
          data: { follower: { decrement: 1 } },
        });
        return [follow, decFollower];
      });
      return res.status(204).json({ message: "팔로우 취소 성공" });
    }
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ message: "팔로우 중 문제가 발생했습니다." });
  }
});

//팔로우한 유저의 게시물 조회

router.post("/follow/:followId/posts", authMiddleware, async (req, res, next) => {
  const { followId } = req.params; //팔로우 한 유저
  const { userId } = req.user; //나

  const searchFollow = await prisma.follow.findFirst({
    where: {
      follower: Number(userId),
      following: Number(followId),
    },
  });
  if (!searchFollow) {
    return res.status(400).json({ message: "대상을 팔로우 하지 않았습니다." });
  }
  //만약 팔로우가 되어있다면,
  console.log(searchFollow);
  const searchPost = await prisma.post.findMany({
    where: { userId: Number(followId) },
  });
  if (!searchPost) {
    return res.status(400).json({ message: "게시물을 찾을 수 없습니다." });
  }
  res.status(200).json({ data: searchPost });
});

export default router;
