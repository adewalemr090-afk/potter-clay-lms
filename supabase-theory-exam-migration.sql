-- Potter And Clay LMS: theory exam and candidate details migration
-- Run in Supabase SQL Editor after backing up your database.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sex text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS arm text;
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS candidate_name text;
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS candidate_class text;
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS candidate_sex text;
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS candidate_arm text;
ALTER TABLE public.question_banks ADD COLUMN IF NOT EXISTS theory_duration_minutes integer NOT NULL DEFAULT 60;

CREATE TABLE IF NOT EXISTS public.theory_questions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 bank_id uuid NOT NULL REFERENCES public.question_banks(id) ON DELETE CASCADE,
 question_text text NOT NULL,
 marks integer NOT NULL DEFAULT 1 CHECK (marks > 0),
 position integer NOT NULL DEFAULT 1,
 created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.theory_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 attempt_id uuid NOT NULL UNIQUE REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
 bank_id uuid NOT NULL REFERENCES public.question_banks(id) ON DELETE CASCADE,
 student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'started' CHECK (status IN ('started','completed')),
 started_at timestamptz NOT NULL DEFAULT now(),
 submitted_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.theory_marks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 attempt_id uuid NOT NULL UNIQUE REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
 student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 bank_id uuid NOT NULL REFERENCES public.question_banks(id) ON DELETE CASCADE,
 score numeric NOT NULL DEFAULT 0 CHECK (score >= 0),
 total numeric NOT NULL CHECK (total > 0 AND score <= total),
 marked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 marked_at timestamptz NOT NULL DEFAULT now(),
 teacher_notes text
);
ALTER TABLE public.theory_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theory_marks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "theory questions read for authenticated" ON public.theory_questions;
CREATE POLICY "theory questions read for authenticated" ON public.theory_questions
 FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.question_banks b WHERE b.id=bank_id AND b.active=true
    AND (b.class=(SELECT p.class FROM public.profiles p WHERE p.id=auth.uid())
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('teacher','admin'))))
 );
DROP POLICY IF EXISTS "teachers manage theory questions" ON public.theory_questions;
CREATE POLICY "teachers manage theory questions" ON public.theory_questions
 FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('teacher','admin')))
 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('teacher','admin')));

DROP POLICY IF EXISTS "students create own theory session" ON public.theory_sessions;
CREATE POLICY "students create own theory session" ON public.theory_sessions
 FOR INSERT TO authenticated WITH CHECK (student_id=auth.uid());
DROP POLICY IF EXISTS "students view own theory session" ON public.theory_sessions;
CREATE POLICY "students view own theory session" ON public.theory_sessions
 FOR SELECT TO authenticated USING (student_id=auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('teacher','admin')));
DROP POLICY IF EXISTS "students update own theory session" ON public.theory_sessions;
CREATE POLICY "students update own theory session" ON public.theory_sessions
 FOR UPDATE TO authenticated USING (student_id=auth.uid()) WITH CHECK (student_id=auth.uid());
DROP POLICY IF EXISTS "teachers manage theory sessions" ON public.theory_sessions;
CREATE POLICY "teachers manage theory sessions" ON public.theory_sessions
 FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('teacher','admin')))
 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('teacher','admin')));

DROP POLICY IF EXISTS "students view own theory marks" ON public.theory_marks;
CREATE POLICY "students view own theory marks" ON public.theory_marks
 FOR SELECT TO authenticated USING (student_id=auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('teacher','admin')));
DROP POLICY IF EXISTS "teachers manage theory marks" ON public.theory_marks;
CREATE POLICY "teachers manage theory marks" ON public.theory_marks
 FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('teacher','admin')))
 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role IN ('teacher','admin')));

-- Account access flag used by the LMS admin controls.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS profiles_role_active_idx ON public.profiles(role, is_active);

-- Permit admins to update account profile flags (including is_active).
DROP POLICY IF EXISTS "admins update profiles" ON public.profiles;
CREATE POLICY "admins update profiles" ON public.profiles
 FOR UPDATE TO authenticated
 USING (EXISTS (SELECT 1 FROM public.profiles admin_profile WHERE admin_profile.id=auth.uid() AND admin_profile.role='admin'))
 WITH CHECK (EXISTS (SELECT 1 FROM public.profiles admin_profile WHERE admin_profile.id=auth.uid() AND admin_profile.role='admin'));
