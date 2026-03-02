/*
  Warnings:

  - Made the column `due_date` on table `BorrowRequests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."BorrowRequests" ALTER COLUMN "due_date" SET NOT NULL;
