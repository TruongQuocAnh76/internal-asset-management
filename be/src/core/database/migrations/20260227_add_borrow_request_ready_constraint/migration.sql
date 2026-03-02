CREATE OR REPLACE FUNCTION public.check_borrow_target_ready()
RETURNS trigger AS $$
DECLARE
  v_status public."AssetStatus";
BEGIN

  IF (NEW.asset_id IS NULL AND NEW.kit_id IS NULL)
     OR (NEW.asset_id IS NOT NULL AND NEW.kit_id IS NOT NULL)
  THEN
    RAISE EXCEPTION 'borrow_target_invalid: must reference exactly one of asset_id or kit_id';
  END IF;

  IF NEW.asset_id IS NOT NULL THEN
    SELECT status INTO v_status
    FROM public."Assets"
    WHERE id = NEW.asset_id
    FOR SHARE;

    IF v_status IS NULL THEN
      RAISE EXCEPTION 'asset_not_found: asset % does not exist', NEW.asset_id;
    END IF;

    IF v_status != 'READY' THEN
      RAISE EXCEPTION 'asset_not_ready: asset % has status %', NEW.asset_id, v_status;
    END IF;
  END IF;

  IF NEW.kit_id IS NOT NULL THEN
    SELECT status INTO v_status
    FROM public."AssetsKits"
    WHERE id = NEW.kit_id
    FOR SHARE;

    IF v_status IS NULL THEN
      RAISE EXCEPTION 'kit_not_found: kit % does not exist', NEW.kit_id;
    END IF;

    IF v_status != 'READY' THEN
      RAISE EXCEPTION 'kit_not_ready: kit % has status %', NEW.kit_id, v_status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER borrow_request_target_ready_check
BEFORE INSERT OR UPDATE
ON public."BorrowRequests"
FOR EACH ROW
EXECUTE FUNCTION public.check_borrow_target_ready();