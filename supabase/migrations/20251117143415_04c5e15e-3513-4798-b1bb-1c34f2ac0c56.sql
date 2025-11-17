-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Daily challenges table
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  game_type game_type NOT NULL,
  target_score INTEGER NOT NULL,
  bonus_points INTEGER NOT NULL DEFAULT 100,
  challenge_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view daily challenges"
ON public.daily_challenges FOR SELECT
USING (true);

-- Challenge completions tracking
CREATE TABLE public.challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  score_achieved INTEGER NOT NULL,
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
ON public.challenge_completions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
ON public.challenge_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Special events table
CREATE TABLE public.special_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  game_type game_type NOT NULL,
  bonus_multiplier DECIMAL NOT NULL DEFAULT 2.0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.special_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view special events"
ON public.special_events FOR SELECT
USING (true);

-- Achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'total_wins', 'total_points', 'streak', 'challenges_completed'
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

-- Player achievements tracking
CREATE TABLE public.player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.player_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
ON public.player_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock achievements"
ON public.player_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;

-- Insert some default achievements
INSERT INTO public.achievements (title, description, icon, requirement_type, requirement_value, points_reward) VALUES
('First Win', 'Win your first game', '🏆', 'total_wins', 1, 50),
('Winning Streak', 'Win 5 games in a row', '🔥', 'streak', 5, 200),
('Brain Master', 'Earn 1000 total points', '🧠', 'total_points', 1000, 150),
('Challenge Champion', 'Complete 10 daily challenges', '⭐', 'challenges_completed', 10, 300),
('Point Collector', 'Earn 5000 total points', '💎', 'total_points', 5000, 500),
('Unstoppable', 'Win 50 games', '👑', 'total_wins', 50, 1000);