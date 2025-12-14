# 🗄️ ACTIVER SUPABASE DANS STEAM CALENDAR

## 📋 POURQUOI ?

Quand un jeu Steam n'a pas de date de sortie, il est stocké dans Supabase pour un suivi ultérieur.

---

## ✅ ÉTAPES

### 1️⃣ Créer la table dans Supabase

1. **Supabase Dashboard** → Votre projet
2. **SQL Editor** (menu gauche)
3. **New query**
4. Copiez-collez ce SQL :

```sql
-- Table pour les jeux Steam sans date
CREATE TABLE IF NOT EXISTS steam_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  release_date DATE,
  url TEXT NOT NULL,
  added_to_calendar BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_steam_games_app_id ON steam_games(app_id);
CREATE INDEX IF NOT EXISTS idx_steam_games_release_date ON steam_games(release_date);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_steam_games_updated_at 
  BEFORE UPDATE ON steam_games 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS - Accès public
ALTER TABLE steam_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique" ON steam_games FOR SELECT USING (true);
CREATE POLICY "Insertion publique" ON steam_games FOR INSERT WITH CHECK (true);
CREATE POLICY "MAJ publique" ON steam_games FOR UPDATE USING (true);
```

5. **Run** (F5)
6. ✅ "Success. No rows returned"

### 2️⃣ Vérifier la table

1. **Table Editor** (menu gauche)
2. Vous devriez voir `steam_games` dans la liste
3. Cliquez dessus → Vide pour l'instant (normal)

### 3️⃣ Configurer steam-calendar.html

1. Ouvrez `public/steam-calendar.html`
2. Cherchez cette section (vers la ligne 780) :

```javascript
// ========================================
// SUPABASE - Stockage des jeux sans date
// ========================================
const SUPABASE_URL = ''; // À remplir
const SUPABASE_KEY = ''; // À remplir
```

3. Remplissez avec vos credentials Supabase :

```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Où trouver ces valeurs ?**
- Supabase → **Settings** → **API**
- **Project URL** → `SUPABASE_URL`
- **Project API keys** → **anon public** → `SUPABASE_KEY`

4. **Sauvegardez** le fichier

### 4️⃣ Déployer

```bash
git add public/steam-calendar.html
git commit -m "Add: Supabase storage for Steam games without dates"
git push
```

Ou upload sur Netlify.

---

## 🧪 TESTER

1. Allez sur Steam Calendar
2. Entrez l'URL d'un jeu **sans date** (ex: un jeu en early access ou TBA)
3. Soumettez

**Résultat attendu :**
```
✅ [Titre du jeu]
📊 Stocké dans la base de données pour suivi ultérieur
🔔 Vous serez notifié quand une date sera disponible
```

4. Vérifiez dans Supabase :
   - **Table Editor** → `steam_games`
   - Vous devriez voir le jeu !

---

## 📊 VOIR LES JEUX STOCKÉS

### Via Supabase Dashboard

1. **Table Editor** → `steam_games`
2. Vous verrez tous les jeux sans date

### Colonnes importantes :

- `title` - Nom du jeu
- `app_id` - ID Steam
- `url` - Lien Steam
- `release_date` - NULL si pas de date
- `added_to_calendar` - false (pour l'instant)
- `created_at` - Quand ajouté

---

## ❓ DÉPANNAGE

### "Aucun jeu n'apparaît dans Supabase"

1. Vérifiez la console du navigateur (F12) :
   - Devrait afficher : `✅ Supabase initialisé`
   - Puis : `✅ Jeu stocké dans Supabase: ...`

2. Si vous voyez `⚠️ Supabase non configuré` :
   - Les variables `SUPABASE_URL` et `SUPABASE_KEY` ne sont pas remplies
   - Retour à l'étape 3️⃣

### "Erreur Supabase: permission denied"

1. Vérifiez les RLS policies (voir SQL étape 1)
2. Ou désactivez RLS temporairement :
   ```sql
   ALTER TABLE steam_games DISABLE ROW LEVEL SECURITY;
   ```

### Le jeu est déjà stocké

Normal ! Le système vérifie les doublons par `app_id`.
Vous verrez : `ℹ️ Jeu déjà en base de données`

---

## ✅ CHECKLIST

- [ ] Table `steam_games` créée dans Supabase
- [ ] `SUPABASE_URL` remplie dans steam-calendar.html
- [ ] `SUPABASE_KEY` remplie dans steam-calendar.html
- [ ] Fichier déployé
- [ ] Testé avec un jeu sans date
- [ ] Jeu visible dans Supabase Table Editor

---

**Maintenant vos jeux Steam sans date sont trackés ! 🎮📊**
