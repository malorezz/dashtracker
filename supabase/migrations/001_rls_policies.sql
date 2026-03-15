-- Enable RLS on all tables
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Habits policies
CREATE POLICY "Users can view their own habits"
  ON habits FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert their own habits"
  ON habits FOR INSERT WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update their own habits"
  ON habits FOR UPDATE USING (user_id = current_user);

CREATE POLICY "Users can delete their own habits"
  ON habits FOR DELETE USING (user_id = current_user);

-- Habit logs policies
CREATE POLICY "Users can view their own habit logs"
  ON habit_logs FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert their own habit logs"
  ON habit_logs FOR INSERT WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update their own habit logs"
  ON habit_logs FOR UPDATE USING (user_id = current_user);

CREATE POLICY "Users can delete their own habit logs"
  ON habit_logs FOR DELETE USING (user_id = current_user);

-- Goals policies
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE USING (user_id = current_user);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE USING (user_id = current_user);

-- Journal entries policies
CREATE POLICY "Users can view their own journal entries"
  ON journal_entries FOR SELECT USING (user_id = current_user);

CREATE POLICY "Users can insert their own journal entries"
  ON journal_entries FOR INSERT WITH CHECK (user_id = current_user);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries FOR UPDATE USING (user_id = current_user);

CREATE POLICY "Users can delete their own journal entries"
  ON journal_entries FOR DELETE USING (user_id = current_user);
