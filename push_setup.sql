-- 建立推播訂閱表
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  subscription text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- RLS 設定
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_push_sub" ON push_subscriptions;
CREATE POLICY "own_push_sub" ON push_subscriptions
  FOR ALL TO authenticated
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());
