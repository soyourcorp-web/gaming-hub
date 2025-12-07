# 🚀 Automation Hub v2.0

Hub d'automatisation complet regroupant Gaming Hub (propositions de jeux) et Steam Calendar (synchronisation Steam).

## 📦 Contenu du projet

- **Gaming Hub** : Gestion de propositions de jeux avec DM Discord + Google Calendar
- **Steam Calendar** : Synchronisation automatique des dates de sortie Steam vers Google Calendar
- **Backend** : Netlify Functions (serverless)
- **Database** : Supabase (PostgreSQL)

---

## 🎯 Fonctionnalités

### Gaming Hub
- ✅ Formulaire public de propositions
- ✅ Interface admin sécurisée
- ✅ DM Discord automatiques (acceptation/refus)
- ✅ Ajout automatique au Google Calendar
- ✅ Base de données Supabase
- ✅ Statistiques en temps réel

### Steam Calendar
- ✅ Récupération données Steam (API + scraping)
- ✅ Parsing intelligent des dates
- ✅ Ajout automatique au calendrier
- ✅ Détection des jeux sans date
- ✅ Stockage Supabase

---

## ⚡ Déploiement rapide (15 min)

### 1. Prérequis

- Compte GitHub
- Compte Netlify (gratuit)
- Compte Supabase (gratuit)
- Bot Discord créé
- Google API Key

### 2. Setup Supabase

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un nouveau projet
3. Allez dans **SQL Editor**
4. Copiez-collez le contenu de `setup-supabase.sql`
5. Exécutez
6. Notez l'**URL** et la **Anon Key** (Settings > API)

### 3. Setup Discord Bot

1. [Discord Developer Portal](https://discord.com/developers/applications)
2. New Application → Bot → Add Bot
3. **Reset Token** → Copiez
4. Activez **SERVER MEMBERS INTENT**
5. OAuth2 > URL Generator → `bot` + permissions
6. Invitez sur votre serveur
7. Mode développeur Discord → Clic droit serveur → Copier ID

### 4. Setup Google Calendar

1. [Google Cloud Console](https://console.cloud.google.com)
2. Nouveau projet
3. Activez **Google Calendar API**
4. Credentials → Create Credentials → API Key
5. Copiez la clé

### 5. Déploiement GitHub + Netlify

1. Forkez ou uploadez ce repo sur GitHub
2. [Netlify](https://netlify.com) → New site from Git
3. Connectez GitHub → Sélectionnez le repo
4. Deploy

### 6. Configuration Netlify

Dans **Site settings > Environment variables**, ajoutez :

```
DISCORD_BOT_TOKEN=votre_token
DISCORD_SERVER_ID=votre_server_id
GOOGLE_CALENDAR_ID=elbepoly@gmail.com
GOOGLE_API_KEY=votre_google_api_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=votre_supabase_key
```

### 7. Redéployer

**Deploys** → **Trigger deploy**

✅ **Terminé !** Votre hub est en ligne !

---

## 🏗️ Structure du projet

```
automation-hub/
├── public/
│   ├── index.html           # Page d'accueil du hub
│   ├── gaming-hub.html      # Application Gaming Hub
│   └── steam-calendar.html  # Application Steam Calendar
├── netlify/
│   └── functions/
│       ├── discord-dm.js      # Envoi DM Discord
│       ├── google-calendar.js # Ajout Google Calendar
│       ├── steam-api.js       # Récupération données Steam
│       └── proposals.js       # CRUD propositions (Supabase)
├── setup-supabase.sql       # Script SQL init
├── package.json
├── netlify.toml
├── .env.example
└── README.md
```

---

## 🔧 Développement local

### Installation

```bash
# Installer les dépendances
npm install

# Installer Netlify CLI
npm install -g netlify-cli

# Copier .env.example vers .env
cp .env.example .env
# Puis remplir vos vraies valeurs
```

### Lancer en local

```bash
netlify dev
```

L'application sera accessible sur `http://localhost:8888`

---

## 🎨 Personnalisation

### Changer le mot de passe admin

Dans `public/gaming-hub.html`, ligne ~25 :
```javascript
ADMIN_PASSWORD: 'votre_nouveau_mdp'
```

### Changer les couleurs

Cherchez `#00b4db` (cyan) et remplacez par votre couleur

### Ajouter des champs

1. Modifier `setup-supabase.sql` (ajouter colonne)
2. Modifier `netlify/functions/proposals.js` (CRUD)
3. Modifier `public/gaming-hub.html` (formulaire + affichage)

---

## 📊 API Endpoints

Les Netlify Functions créent automatiquement ces endpoints :

### Discord DM
```
POST /.netlify/functions/discord-dm
Body: { pseudo, message, status, gameName, newDate, newTime }
```

### Google Calendar
```
POST /.netlify/functions/google-calendar
Body: { title, date, time?, description? }
```

### Steam API
```
POST /.netlify/functions/steam-api
Body: { url }
Response: { title, releaseDate }
```

### Propositions (Supabase)
```
GET    /.netlify/functions/proposals     # Liste toutes
POST   /.netlify/functions/proposals     # Créer
PUT    /.netlify/functions/proposals     # Modifier
DELETE /.netlify/functions/proposals     # Supprimer
```

---

## 🔐 Sécurité

### Bonnes pratiques

- ✅ Ne commitez JAMAIS les tokens dans Git
- ✅ Utilisez les variables d'environnement Netlify
- ✅ Gardez le `.env` dans `.gitignore`
- ✅ Régénérez les tokens si compromis
- ✅ Changez le mot de passe admin par défaut

### Row Level Security (Supabase)

Les politiques RLS sont configurées pour :
- Lecture publique
- Création publique (formulaire)
- Modification/suppression publique (pour l'admin)

Pour production, modifiez les politiques RLS selon vos besoins.

---

## 🐛 Dépannage

### "Utilisateur Discord non trouvé"
→ Le pseudo doit correspondre exactement au username Discord

### "Google Calendar error"
→ Vérifiez que l'API Calendar est activée et la clé valide

### "Supabase error"
→ Vérifiez les variables d'environnement et que les tables existent

### Logs

**Netlify Functions** :
```
Netlify Dashboard → Functions → [nom-fonction] → Logs
```

**Console navigateur** :
```
F12 → Console
```

---

## 💰 Coûts

**100% GRATUIT** avec les limites suivantes :

- **Netlify** : 100GB/mois + 125k functions
- **Supabase** : 500MB DB + 50k requêtes/mois
- **Discord API** : Gratuit illimité
- **Google Calendar API** : 1M requêtes/jour gratuit

Pour un usage personnel/petit serveur : largement suffisant.

---

## 📖 Documentation

- [Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Supabase](https://supabase.com/docs)
- [Discord API](https://discord.com/developers/docs)
- [Google Calendar API](https://developers.google.com/calendar)

---

## 🆘 Support

Besoin d'aide ? Vérifiez :
1. Les logs Netlify Functions
2. La console navigateur (F12)
3. Les tables Supabase (Table Editor)
4. Les variables d'environnement

---

## ✅ Checklist de déploiement

- [ ] Supabase : Projet créé + SQL exécuté
- [ ] Discord : Bot créé + invité + token copié
- [ ] Google : API activée + clé créée
- [ ] GitHub : Repo créé + code uploadé
- [ ] Netlify : Site déployé
- [ ] Netlify : Variables configurées
- [ ] Test : Proposition créée
- [ ] Test : DM Discord reçu
- [ ] Test : Événement calendrier créé

---

## 🎉 C'est prêt !

Votre Automation Hub est maintenant opérationnel !

**URL** : `https://votre-site.netlify.app`

Partagez le lien `/gaming-hub.html` avec vos joueurs !

---

© 2025 SoYour Corp. Tous droits réservés.
