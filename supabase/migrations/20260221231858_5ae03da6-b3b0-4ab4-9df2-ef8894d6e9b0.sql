CREATE POLICY "Allow deleting submissions"
ON public.contest_submissions
FOR DELETE
USING (true);