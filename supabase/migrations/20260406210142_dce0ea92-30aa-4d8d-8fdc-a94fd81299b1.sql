CREATE OR REPLACE FUNCTION public.auto_set_first_lesson_free()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only act on published lessons
  IF NEW.is_published = true THEN
    -- Check if there are any other free published lessons in this major
    IF NOT EXISTS (
      SELECT 1 FROM public.lessons
      WHERE major_id = NEW.major_id
        AND is_published = true
        AND is_free = true
        AND id <> NEW.id
    ) THEN
      -- This is the first (or only) published lesson in the major with no free lesson yet
      -- Check if this lesson has the lowest display_order
      IF NOT EXISTS (
        SELECT 1 FROM public.lessons
        WHERE major_id = NEW.major_id
          AND is_published = true
          AND display_order < NEW.display_order
          AND id <> NEW.id
      ) THEN
        NEW.is_free := true;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_first_lesson_free
  BEFORE INSERT OR UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_first_lesson_free();