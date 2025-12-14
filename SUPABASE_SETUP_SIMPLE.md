# 🗄️ SUPABASE STEAM STORAGE - CONFIGURATION

## ✅ BONNE NOUVELLE !

Vos credentials Supabase sont **déjà dans les variables Netlify** ! 
Aucune modification de code nécessaire ! 🎉

---

## 📋 CHECKLIST RAPIDE

### 1️⃣ Créer la table Supabase

**Supabase Dashboard** → **SQL Editor** → **New query**

Copiez-collez ce SQL :

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

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger (supprimer d'abord si existe pour éviter erreurs)
DROP TRIGGER IF EXISTS update_steam_games_updated_at ON steam_games;
CREATE TRIGGER update_steam_games_updated_at 
  BEFORE UPDATE ON steam_games 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS - Accès public
ALTER TABLE steam_games ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Lecture publique" ON steam_games;
DROP POLICY IF EXISTS "Insertion publique" ON steam_games;
DROP POLICY IF EXISTS "MAJ publique" ON steam_games;

-- Créer les policies
CREATE POLICY "Lecture publique" ON steam_games FOR SELECT USING (true);
CREATE POLICY "Insertion publique" ON steam_games FOR INSERT WITH CHECK (true);
CREATE POLICY "MAJ publique" ON steam_games FOR UPDATE USING (true);
```

**Run** (F5) → ✅ Success

### 2️⃣ Vérifier les variables Netlify

**Netlify** → **Environment variables**

Vous devez avoir :
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`

*Si elles ne sont pas là, ajoutez-les (voir section "Où trouver" ci-dessous)*

### 3️⃣ Déployer le nouveau code

```bash
git add .
git commit -m "Add: Netlify Function for Supabase Steam storage"
git push
```

**C'est tout ! ✅**

---

## 🧪 TESTER

1. Allez sur **Steam Calendar**
2. Entrez une URL de jeu **SANS date de sortie**
   - Ex: un jeu en Early Access
   - Ex: un jeu avec "TBA" ou "Coming Soon"
3. **Soumettez**

**Résultat attendu :**
```
✅ [Titre du jeu]
📊 Stocké dans la base de données pour suivi ultérieur
🔔 Vous serez notifié quand une date sera disponible
```

4. **Vérifiez dans Supabase** :
   - Table Editor → `steam_games`
   - Le jeu devrait apparaître ! 🎉

---

## 📊 VOIR LES JEUX STOCKÉS

**Supabase Dashboard** → **Table Editor** → `steam_games`

Vous verrez tous les jeux sans date avec :
- `title` - Nom du jeu
- `app_id` - ID Steam unique
- `url` - Lien Steam complet
- `release_date` - NULL (pas de date)
- `added_to_calendar` - false
- `created_at` - Quand ajouté

---

## 🔍 OÙ TROUVER VOS CREDENTIALS SUPABASE

Si vous devez les ajouter dans Netlify :

### Supabase Dashboard

1. Connectez-vous à https://supabase.com
2. Sélectionnez votre projet
3. **Settings** ⚙️ (menu gauche, en bas)
4. **API**

Vous verrez :

```
Project URL
https://xxxxxxxxxxxxx.supabase.co  ← SUPABASE_URL
[Copy]

Project API keys
────────────────
🔓 anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  ← SUPABASE_ANON_KEY
[Copy]
```

### Netlify

1. **Environment variables** (dans le menu de gauche)
2. **Environment variables**
3. **Add a variable**

Ajoutez :
```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

4. **Trigger deploy**

---

## 🎯 COMMENT ÇA MARCHE ?

Avant (version précédente) :
- ❌ Credentials dans le code HTML (pas sécurisé)
- ❌ Supabase appelé depuis le navigateur

Maintenant (nouvelle version) :
- ✅ Credentials dans les variables Netlify (sécurisé)
- ✅ **Netlify Function** `store-steam-game.js` gère tout
- ✅ Le navigateur appelle juste la function

**Flow :**
```
Steam Calendar HTML
    ↓
/.netlify/functions/store-steam-game
    ↓
Supabase (avec credentials serveur)
    ↓
✅ Jeu stocké !
```

---

## ❓ DÉPANNAGE

### Les jeux n'apparaissent pas dans Supabase

1. **Vérifiez la console** (F12 dans le navigateur)
   - Devrait afficher : `✅ Jeu stocké dans Supabase`
   - Ou : `ℹ️ Jeu déjà en base de données`

2. **Vérifiez les logs Netlify Functions** :
   - Netlify → Deploys → (votre dernier deploy) → Functions
   - Cherchez `store-steam-game`
   - Regardez les logs

### Erreur "Supabase non configuré"

→ Les variables `SUPABASE_URL` et `SUPABASE_ANON_KEY` ne sont pas dans Netlify
→ Ajoutez-les (voir section "Où trouver")

### Erreur de permissions

→ Vérifiez que les RLS policies sont créées (étape 1)

---

## ✅ RÉSUMÉ

- [x] Table `steam_games` créée dans Supabase
- [x] Variables dans Netlify (déjà fait !)
- [x] Nouvelle Netlify Function `store-steam-game.js`
- [x] Code déployé
- [ ] Testé avec un jeu sans date
- [ ] Jeu visible dans Supabase Table Editor

---

**Tout est automatique maintenant ! Plus besoin de configurer quoi que ce soit dans le code HTML ! 🚀**
