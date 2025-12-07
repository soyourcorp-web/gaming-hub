# 🚀 INSTALLATION AUTOMATION HUB

## Méthode 1 : Utiliser vos fichiers existants (RECOMMANDÉ)

### Étape 1 : Copier vos HTMLs

```bash
# Depuis votre dossier où vous avez les fichiers
cp game-proposals-gameradar-style.html automation-hub/public/gaming-hub.html
```

### Étape 2 : Modifications minimales

Dans `gaming-hub.html`, ajoutez juste en haut du fichier :

```html
<!-- Ajouter dans le <head> -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Et tout en haut du `<script>` :

```javascript
// Ajouter ces lignes
const SUPABASE_URL = '';  // Laisser vide pour l'instant
const SUPABASE_KEY = '';  // Laisser vide pour l'instant
```

### Étape 3 : Bouton retour au Hub

Ajoutez juste après le `<body>` :

```html
<div style="position: fixed; top: 20px; left: 20px; z-index: 1000;">
    <a href="/" style="background: transparent; color: #00b4db; border: 2px solid #00b4db; padding: 12px 24px; text-decoration: none; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 2px;">
        ← RETOUR AU HUB
    </a>
</div>
```

### Étape 4 : Steam Calendar

Créez `public/steam-calendar.html` avec le contenu de votre `SteamApp.html` :

```bash
cp votre-SteamApp.html automation-hub/public/steam-calendar.html
```

Ajoutez le même bouton retour.

### Étape 5 : Deploy !

```bash
cd automation-hub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOUS/automation-hub.git
git push -u origin main
```

Puis déployez sur Netlify !

---

## Méthode 2 : Depuis zéro

Suivez le `README.md` principal.

---

## ⚡ Configuration rapide Netlify

### Variables d'environnement (OBLIGATOIRES)

```
DISCORD_BOT_TOKEN=MTQ0NDQ...
DISCORD_SERVER_ID=142840...
GOOGLE_CALENDAR_ID=elbepoly@gmail.com
GOOGLE_API_KEY=AIzaSy...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

### Où les mettre ?

Netlify Dashboard → Site settings → Environment variables → Add variable

---

## 🧪 Test rapide

Une fois déployé :

1. Ouvrez `https://votre-site.netlify.app`
2. Cliquez sur "Gaming Hub"
3. Créez une proposition avec votre pseudo Discord
4. Admin → Acceptez
5. Vérifiez Discord → DM reçu ! ✅
6. Vérifiez Google Calendar → Événement créé ! ✅

---

## ✅ C'est tout !

Votre hub est opérationnel !
