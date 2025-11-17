-- Fix function search paths - drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_aspirations_updated_at ON aspirations;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_aspirations_updated_at
  BEFORE UPDATE ON aspirations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create game system tables

-- Game types
CREATE TYPE game_type AS ENUM ('brain_rush', 'pattern_master', 'word_sprint');
CREATE TYPE room_status AS ENUM ('waiting', 'playing', 'finished');

-- Player profiles extension for gaming
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_games_played INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  highest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Friends system
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Game rooms
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  game_type game_type NOT NULL,
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status room_status DEFAULT 'waiting',
  max_players INTEGER DEFAULT 4,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);

ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Room players
CREATE TABLE IF NOT EXISTS room_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;

-- Game sessions (completed games)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE SET NULL,
  game_type game_type NOT NULL,
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_players INTEGER NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Player session scores
CREATE TABLE IF NOT EXISTS session_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  rank INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE session_scores ENABLE ROW LEVEL SECURITY;

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Player stats
CREATE POLICY "Users can view all player stats"
  ON player_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can update own stats"
  ON player_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON player_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Superadmins can update any stats"
  ON player_stats FOR UPDATE
  USING (has_role(auth.uid(), 'superadmin'));

-- Friendships
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friend requests"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Game rooms
CREATE POLICY "Anyone can view public rooms"
  ON game_rooms FOR SELECT
  USING (is_private = false OR host_id = auth.uid() OR EXISTS (
    SELECT 1 FROM room_players WHERE room_id = game_rooms.id AND user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update room"
  ON game_rooms FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Host can delete room"
  ON game_rooms FOR DELETE
  USING (auth.uid() = host_id);

CREATE POLICY "Superadmins can manage all rooms"
  ON game_rooms FOR ALL
  USING (has_role(auth.uid(), 'superadmin'));

-- Room players
CREATE POLICY "Users can view players in their rooms"
  ON room_players FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM game_rooms WHERE id = room_id AND (
      host_id = auth.uid() OR is_private = false OR EXISTS (
        SELECT 1 FROM room_players rp WHERE rp.room_id = game_rooms.id AND rp.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can join rooms"
  ON room_players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own room player status"
  ON room_players FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave rooms"
  ON room_players FOR DELETE
  USING (auth.uid() = user_id);

-- Game sessions
CREATE POLICY "Anyone can view game sessions"
  ON game_sessions FOR SELECT
  USING (true);

CREATE POLICY "System can create game sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (true);

-- Session scores
CREATE POLICY "Anyone can view session scores"
  ON session_scores FOR SELECT
  USING (true);

CREATE POLICY "System can create session scores"
  ON session_scores FOR INSERT
  WITH CHECK (true);

-- Chat messages
CREATE POLICY "Users can view messages in their rooms"
  ON chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM room_players WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
  ) OR room_id IS NULL);

CREATE POLICY "Users can send messages in their rooms"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM room_players WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
  ));

CREATE POLICY "Superadmins can view all chats"
  ON chat_messages FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'));

-- Triggers
CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to generate unique room codes
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM game_rooms WHERE room_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;