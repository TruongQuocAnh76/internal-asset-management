-- CreateIndex
CREATE INDEX "BorrowRequests_status_due_date_idx" ON "public"."BorrowRequests"("status", "due_date");
