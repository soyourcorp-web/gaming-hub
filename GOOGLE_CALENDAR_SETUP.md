# 🔑 CONFIGURATION GOOGLE CALENDAR - SERVICE ACCOUNT

## ⚠️ IMPORTANT

Google Calendar API n'accepte PAS les API Keys pour créer des événements.
Il faut utiliser un **Service Account** (compte de service).

---

## 📋 ÉTAPES COMPLÈTES

### 1️⃣ CRÉER UN SERVICE ACCOUNT

1. Allez sur **Google Cloud Console** : https://console.cloud.google.com
2. Sélectionnez votre projet (ou créez-en un)
3. Menu hamburger (☰) → **IAM & Admin** → **Service Accounts**
4. Cliquez **+ CREATE SERVICE ACCOUNT**
5. Remplissez :
   - **Name** : `calendar-automation`
   - **Description** : `Service account for Netlify calendar automation`
6. **CREATE AND CONTINUE**
7. **Role** : Pas besoin de rôle spécial pour l'instant → **CONTINUE**
8. **DONE**

### 2️⃣ CRÉER UNE CLÉ JSON

1. Dans la liste des Service Accounts, **cliquez sur celui que vous venez de créer**
2. Onglet **KEYS** (en haut)
3. **ADD KEY** → **Create new key**
4. Type : **JSON**
5. **CREATE**
6. ✅ Un fichier JSON est téléchargé sur votre ordinateur

### 3️⃣ ACTIVER GOOGLE CALENDAR API

1. Menu (☰) → **APIs & Services** → **Library**
2. Cherchez : `Google Calendar API`
3. Cliquez dessus
4. **ENABLE** (si pas déjà activé)

### 4️⃣ PARTAGER LE CALENDRIER

1. Ouvrez **Google Calendar** : https://calendar.google.com
2. Cliquez sur ⚙️ **Paramètres**
3. Dans le menu de gauche, sous "Paramètres de mes calendriers", cliquez sur votre calendrier (`elbepoly@gmail.com`)
4. Descendez jusqu'à **"Partager avec des personnes en particulier"**
5. **+ Ajouter des personnes et des groupes**
6. Collez l'email du service account (vous le trouverez dans le fichier JSON : `client_email`)
   - Il ressemble à : `calendar-automation@votre-projet.iam.gserviceaccount.com`
7. **Autorisations** : Sélectionnez **"Apporter des modifications aux événements"**
8. **Envoyer**

### 5️⃣ CONFIGURER NETLIFY

1. Ouvrez le fichier JSON téléchargé à l'étape 2
2. Il contient quelque chose comme :

```json
{
  "type": "service_account",
  "project_id": "votre-projet-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "calendar-automation@votre-projet.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

3. **Dans Netlify** → Environment variables → **Add variable** :

**Variable 1** :
```
Key:   GOOGLE_SERVICE_ACCOUNT_EMAIL
Value: (copiez la valeur de "client_email" du JSON)
```

**Variable 2** :
```
Key:   GOOGLE_PRIVATE_KEY
Value: (copiez TOUTE la valeur de "private_key" du JSON, 
        y compris -----BEGIN PRIVATE KEY----- et -----END PRIVATE KEY-----)
```

⚠️ **ATTENTION** : La clé privée doit contenir les `\n` (retours à la ligne). 
Copiez-collez exactement comme dans le JSON.

**Variable 3** (si pas déjà là) :
```
Key:   GOOGLE_CALENDAR_ID
Value: elbepoly@gmail.com
```

### 6️⃣ SUPPRIMER L'ANCIENNE VARIABLE

Dans Netlify Environment Variables, **SUPPRIMEZ** :
```
GOOGLE_API_KEY  ← Supprimez cette variable (elle ne sert plus)
```

### 7️⃣ DÉPLOYER

1. Push votre nouveau code sur GitHub :
```bash
git add .
git commit -m "Fix: Google Calendar avec Service Account"
git push
```

2. Ou dans Netlify :
   - **Deploys** → **Trigger deploy** → **Clear cache and deploy**

### 8️⃣ TESTER

1. Attendez que le déploiement soit terminé (1-2 min)
2. Allez sur votre Gaming Hub
3. Créez une proposition et acceptez-la
4. ✅ L'événement devrait être créé dans Google Calendar !

---

## ✅ CHECKLIST FINALE

- [ ] Service Account créé
- [ ] Fichier JSON téléchargé
- [ ] Google Calendar API activée
- [ ] Calendrier partagé avec le service account
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` dans Netlify
- [ ] `GOOGLE_PRIVATE_KEY` dans Netlify
- [ ] `GOOGLE_CALENDAR_ID` dans Netlify
- [ ] `GOOGLE_API_KEY` supprimée (ancienne variable)
- [ ] Code déployé
- [ ] Testé ✅

---

## 🆘 DÉPANNAGE

### Erreur "Service Account non configuré"
→ Vérifiez que `GOOGLE_SERVICE_ACCOUNT_EMAIL` et `GOOGLE_PRIVATE_KEY` sont bien dans Netlify

### Erreur "403 Forbidden"
→ Le calendrier n'est pas partagé avec le service account. Retournez à l'étape 4.

### Erreur "401 Unauthorized"
→ La clé privée est mal copiée. Vérifiez qu'elle contient bien `\n` et les `-----BEGIN/END-----`

### L'événement ne se créé pas
→ Vérifiez les logs Netlify Functions pour voir l'erreur exacte

---

## 📌 RÉSUMÉ

Au lieu d'utiliser une simple API Key, on utilise un Service Account qui :
1. S'authentifie avec OAuth2
2. A les permissions d'écrire dans votre calendrier
3. Fonctionne parfaitement avec Netlify Functions

C'est plus sécurisé et c'est la méthode recommandée par Google ! ✅
