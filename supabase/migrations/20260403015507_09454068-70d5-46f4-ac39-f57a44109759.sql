
-- Create lesson_progress table to track student lesson completion
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Students can view their own progress, staff can view all
CREATE POLICY "Students can view own progress"
ON public.lesson_progress FOR SELECT TO authenticated
USING (
  (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
);

-- Students can insert their own progress
CREATE POLICY "Students can create own progress"
ON public.lesson_progress FOR INSERT TO authenticated
WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Students can update their own progress
CREATE POLICY "Students can update own progress"
ON public.lesson_progress FOR UPDATE TO authenticated
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_lesson_progress_updated_at
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
