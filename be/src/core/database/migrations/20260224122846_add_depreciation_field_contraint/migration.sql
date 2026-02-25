ALTER TABLE "Assets"
ADD CONSTRAINT depreciation_method_requirements
CHECK (
  (
    depreciation_method = 'STRAIGHT_LINE'
    AND salvage_value IS NOT NULL
    AND life_months IS NOT NULL
  )
  OR
  (
    depreciation_method = 'DECLINING_BALANCE'
    AND decline_balance_rate IS NOT NULL
  )
  OR
  depreciation_method IS NULL
);