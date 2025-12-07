-- ============================================
-- AUTOMATION HUB - SUPABASE SETUP
-- ============================================

-- Créer la table des propositions de jeux
CREATE TABLE IF NOT EXISTS propositions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pseudo TEXT NOT NULL,
  email TEXT NOT NULL,
  game_name TEXT NOT NULL,
  game_link TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur le statut pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_propositions_status ON propositions(status);

-- Créer un index sur la date
CREATE INDEX IF NOT EXISTS idx_propositions_date ON propositions(date);

-- Activer Row Level Security
ALTER TABLE propositions ENABLE ROW LEVEL SECURITY;

-- Politique : Tout le monde peut lire
CREATE POLICY "Propositions visibles par tous" 
  ON propositions FOR SELECT 
  USING (true);

-- Politique : Tout le monde peut créer
CREATE POLICY "Tout le monde peut créer une proposition" 
  ON propositions FOR INSERT 
  WITH CHECK (true);

-- Politique : Tout le monde peut modifier (pour l'admin)
CREATE POLICY "Tout le monde peut modifier" 
  ON propositions FOR UPDATE 
  USING (true);

-- Politique : Tout le monde peut supprimer (pour l'admin)
CREATE POLICY "Tout le monde peut supprimer" 
  ON propositions FOR DELETE 
  USING (true);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_propositions_updated_at
    BEFORE UPDATE ON propositions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE POUR STEAM GAMES (optionnel)
-- ============================================

CREATE TABLE IF NOT EXISTS steam_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  release_date DATE,
  url TEXT NOT NULL,
  added_to_calendar BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index sur app_id
CREATE INDEX IF NOT EXISTS idx_steam_games_app_id ON steam_games(app_id);

-- Index sur release_date
CREATE INDEX IF NOT EXISTS idx_steam_games_release_date ON steam_games(release_date);

-- RLS
ALTER TABLE steam_games ENABLE ROW LEVEL SECURITY;

-- Politiques
CREATE POLICY "Steam games visibles par tous" 
  ON steam_games FOR SELECT 
  USING (true);

CREATE POLICY "Tout le monde peut créer un steam game" 
  ON steam_games FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Tout le monde peut modifier un steam game" 
  ON steam_games FOR UPDATE 
  USING (true);

-- Trigger updated_at
CREATE TRIGGER update_steam_games_updated_at
    BEFORE UPDATE ON steam_games
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue des propositions en attente
CREATE OR REPLACE VIEW propositions_pending AS
SELECT * FROM propositions 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- Vue des propositions acceptées
CREATE OR REPLACE VIEW propositions_accepted AS
SELECT * FROM propositions 
WHERE status = 'accepted' 
ORDER BY date ASC;

-- Vue des jeux Steam sans date
CREATE OR REPLACE VIEW steam_games_no_date AS
SELECT * FROM steam_games 
WHERE release_date IS NULL 
ORDER BY created_at DESC;

-- ============================================
-- DONNÉES DE TEST (optionnel)
-- ============================================

-- Insérer une proposition de test
INSERT INTO propositions (pseudo, email, game_name, game_link, date, time, notes, status)
VALUES (
  'TestUser',
  'test@example.com',
  'Valorant',
  'https://playvalorant.com',
  CURRENT_DATE + INTERVAL '7 days',
  '20:00:00',
  'Proposition de test',
  'pending'
);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que tout est créé
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN ('propositions', 'steam_games')
ORDER BY tablename;

-- Compter les propositions
SELECT 
  status,
  COUNT(*) as count
FROM propositions
GROUP BY status;
