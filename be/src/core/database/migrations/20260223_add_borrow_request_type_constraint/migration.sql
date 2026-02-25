-- Add CHECK constraint to ensure either asset_id or kit_id is set, but not both
ALTER TABLE "public"."BorrowRequests"
ADD CONSTRAINT "borrow_request_asset_or_kit_check" 
CHECK (
  (asset_id IS NOT NULL AND kit_id IS NULL) OR 
  (asset_id IS NULL AND kit_id IS NOT NULL)
);

CREATE UNIQUE INDEX unique_active_asset_request
ON "BorrowRequests"(requester_id, asset_id)
WHERE status IN ('PENDING', 'APPROVED', 'PROVIDED');

CREATE UNIQUE INDEX unique_active_kit_request
ON "BorrowRequests"(requester_id, kit_id)
WHERE status IN ('PENDING', 'APPROVED', 'PROVIDED');