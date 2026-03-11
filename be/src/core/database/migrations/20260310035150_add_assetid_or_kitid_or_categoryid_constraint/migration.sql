-- 1 of assetId, kitId, categoryId must be provided
ALTER TABLE "BorrowRequests"
DROP CONSTRAINT IF EXISTS "borrow_request_asset_or_kit_check";
ALTER TABLE "BorrowRequests"
ADD CONSTRAINT "borrow_request_asset_or_kit_or_category_check" CHECK (num_nonnulls(asset_id, kit_id, category_id) = 1);
ALTER TABLE "BorrowRequests"
DROP CONSTRAINT IF EXISTS "borrow_request_asset_or_kit_or_category_check";

ALTER TABLE "BorrowRequests"
ADD CONSTRAINT "borrow_request_asset_or_kit_or_category_check" CHECK (
  (category_id IS NOT NULL AND asset_id IS NULL AND kit_id IS NULL AND status IN ('PENDING', 'APPROVED')) -- user can request by category without specifying asset or kit
  OR
  (category_id IS NOT NULL AND num_nonnulls(asset_id, kit_id) = 1 AND status IN ('PROVIDED', 'REJECTED', 'RETURNED', 'CANCELED', 'OVERDUE')) -- admin can specify category with either asset or kit
)