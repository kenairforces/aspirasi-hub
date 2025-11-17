-- Create power_ups table
CREATE TABLE public.power_ups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  cost INTEGER NOT NULL DEFAULT 100,
  effect_type TEXT NOT NULL, -- 'time_freeze', 'double_points', 'hint', 'skip'
  effect_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create player_items table (purchased power-ups)
CREATE TABLE public.player_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  power_up_id UUID NOT NULL REFERENCES public.power_ups(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, power_up_id)
);

-- Create player_rankings table
CREATE TABLE public.player_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rank_name TEXT NOT NULL, -- 'Pemula', 'Perunggu', 'Perak', 'Emas', 'Platinum', 'Diamond', 'Master', 'Legend'
  rank_icon TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, rank_name)
);

-- Create player_badges table
CREATE TABLE public.player_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  badge_description TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_name)
);

-- Enable RLS
ALTER TABLE public.power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for power_ups
CREATE POLICY "Anyone can view power ups"
ON public.power_ups FOR SELECT
USING (true);

-- RLS Policies for player_items
CREATE POLICY "Users can view own items"
ON public.player_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can purchase items"
ON public.player_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
ON public.player_items FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for player_rankings
CREATE POLICY "Anyone can view rankings"
ON public.player_rankings FOR SELECT
USING (true);

CREATE POLICY "Users can achieve rankings"
ON public.player_rankings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for player_badges
CREATE POLICY "Anyone can view badges"
ON public.player_badges FOR SELECT
USING (true);

CREATE POLICY "Users can earn badges"
ON public.player_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert default power-ups
INSERT INTO public.power_ups (name, description, icon, cost, effect_type, effect_value) VALUES
('⏰ Bekukan Waktu', 'Bekukan waktu selama 10 detik', '⏰', 150, 'time_freeze', 10),
('💎 Poin Ganda', 'Gandakan poin untuk 1 game', '💎', 200, 'double_points', 2),
('💡 Petunjuk', 'Dapatkan petunjuk jawaban', '💡', 100, 'hint', 1),
('⏭️ Lewati Soal', 'Lewati 1 soal sulit', '⏭️', 120, 'skip', 1),
('🔥 Combo Booster', 'Tingkatkan combo multiplier 2x', '🔥', 180, 'combo_boost', 2);