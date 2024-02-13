/*
  Warnings:

  - The primary key for the `Follow` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `followId` on the `Follow` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Comment` ADD COLUMN `commentImg` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Follow` DROP PRIMARY KEY,
    DROP COLUMN `followId`,
    ADD PRIMARY KEY (`follower`, `following`);

-- AlterTable
ALTER TABLE `Post` ADD COLUMN `postImg` VARCHAR(191) NULL,
    ADD COLUMN `view` INTEGER NOT NULL DEFAULT 0;
