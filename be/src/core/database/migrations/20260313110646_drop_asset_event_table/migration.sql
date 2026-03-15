/*
  Warnings:

  - You are about to drop the `AssetsEvents` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE');

-- CreateEnum
CREATE TYPE "public"."ChatRoomType" AS ENUM ('GROUP', 'DIRECT');

-- DropTable
DROP TABLE IF EXISTS "public"."AssetsEvents";

-- CreateTable
CREATE TABLE "public"."Messages" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "chat_room_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatRooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ChatRoomType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatRoomParticipants" (
    "id" UUID NOT NULL,
    "chat_room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoomParticipants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoomParticipants_chat_room_id_user_id_key" ON "public"."ChatRoomParticipants"("chat_room_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."Messages" ADD CONSTRAINT "Messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Messages" ADD CONSTRAINT "Messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "public"."ChatRooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoomParticipants" ADD CONSTRAINT "ChatRoomParticipants_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "public"."ChatRooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatRoomParticipants" ADD CONSTRAINT "ChatRoomParticipants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
