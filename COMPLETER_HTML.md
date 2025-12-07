# 📝 COMPLÉTER LES FICHIERS HTML

Les fichiers HTML sont trop gros pour être inclus directement. Voici comment les créer :

## 🎮 Gaming Hub HTML

Le fichier `public/gaming-hub.html` doit contenir le code de l'ancienne version AVEC ces modifications :

### 1. Configuration (début du script)

```javascript
const CONFIG = {
    SUPABASE_URL: '', // Sera rempli par l'utilisateur
    SUPABASE_KEY: '', // Sera rempli par l'utilisateur  
    ADMIN_PASSWORD: 'elbe2024'
};
```

### 2. Ajouter Supabase CDN (dans le <head>)

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 3. Initialiser Supabase (début du script)

```javascript
let supabase = null;

function initSupabase() {
    if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log('✅ Supabase initialisé');
    } else {
        console.warn('⚠️ Supabase non configuré - mode localStorage');
    }
}

initSupabase();
```

### 4. Modifier loadProposals() pour utiliser Supabase

```javascript
async function loadProposals() {
    // Si Supabase configuré
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('propositions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            // Convertir format Supabase vers format app
            return data.map(p => ({
                id: p.id,
                pseudo: p.pseudo,
                email: p.email,
                gameName: p.game_name,
                gameLink: p.game_link,
                date: p.date,
                time: p.time,
                notes: p.notes,
                status: p.status,
                createdAt: p.created_at
            }));
        } catch (error) {
            console.error('Erreur Supabase:', error);
            // Fallback localStorage
            return loadFromLocalStorage();
        }
    }
    
    // Sinon localStorage
    return loadFromLocalStorage();
}

function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('gameProposals');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Erreur localStorage:', error);
        return [];
    }
}
```

### 5. Modifier saveProposal() pour Supabase + Netlify

```javascript
async function saveProposal(proposal) {
    // Sauvegarder dans Supabase
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('propositions')
                .insert([{
                    pseudo: proposal.pseudo,
                    email: proposal.email,
                    game_name: proposal.gameName,
                    game_link: proposal.gameLink,
                    date: proposal.date,
                    time: proposal.time,
                    notes: proposal.notes,
                    status: 'pending'
                }])
                .select();
            
            if (error) throw error;
            
            console.log('✅ Proposition sauvegardée dans Supabase');
            return data[0];
        } catch (error) {
            console.error('Erreur Supabase:', error);
        }
    }
    
    // Fallback localStorage
    localStorage.setItem('gameProposals', JSON.stringify(proposals));
}
```

### 6. Modifier confirmAccept() pour appeler les Netlify Functions

```javascript
async function confirmAccept(id) {
    const proposal = proposals.find(p => p && p.id === id);
    if (!proposal) {
        showNotification('❌ Proposition introuvable', 'error');
        return;
    }
    
    const newDate = document.getElementById('modal-accept-date').value;
    const newTime = document.getElementById('modal-accept-time').value;
    const message = document.getElementById('modal-accept-message').value;
    
    // 1. Mettre à jour dans Supabase
    if (supabase) {
        await supabase
            .from('propositions')
            .update({
                status: 'accepted',
                date: newDate,
                time: newTime,
                message: message
            })
            .eq('id', id);
    }
    
    // 2. Envoyer DM Discord
    try {
        await fetch('/.netlify/functions/discord-dm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pseudo: proposal.pseudo,
                gameName: proposal.gameName,
                status: 'accepted',
                newDate: newDate,
                newTime: newTime,
                message: message
            })
        });
        console.log('✅ DM Discord envoyé');
    } catch (error) {
        console.error('Erreur Discord:', error);
    }
    
    // 3. Ajouter au Google Calendar
    try {
        await fetch('/.netlify/functions/google-calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `🎮 ${proposal.gameName} avec ${proposal.pseudo}`,
                date: newDate,
                time: newTime,
                description: `Session de jeu avec ${proposal.pseudo}\n\nNotes: ${proposal.notes || 'Aucune'}`
            })
        });
        console.log('✅ Ajouté au calendrier');
    } catch (error) {
        console.error('Erreur Calendar:', error);
    }
    
    closeModal('acceptModal');
    await loadAndRender();
    showNotification(`✅ Session acceptée ! DM envoyé à @${proposal.pseudo}`, 'success');
}
```

### 7. Ajouter un bouton retour vers le Hub

```html
<div class="back-btn-container" style="position: fixed; top: 20px; left: 20px; z-index: 1000;">
    <a href="/" class="back-btn">← Retour au Hub</a>
</div>
```

---

## 📅 Steam Calendar HTML

Créez `public/steam-calendar.html` en adaptant le fichier `SteamApp.html` d'origine :

### 1. Ajouter le bouton retour

```html
<a href="/" class="back-button">← Retour au Hub</a>
```

### 2. Remplacer l'appel Google Apps Script par Netlify Function

```javascript
async function handleSubmit(event) {
    event.preventDefault();
    
    const steamUrl = document.getElementById('steamUrl').value.trim();
    
    if (!steamUrl) {
        showError('Veuillez entrer une URL Steam valide');
        return;
    }
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';
    
    try {
        // 1. Récupérer données Steam
        const steamResponse = await fetch('/.netlify/functions/steam-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: steamUrl })
        });
        
        const steamData = await steamResponse.json();
        
        if (!steamData.title) {
            throw new Error('Jeu introuvable');
        }
        
        // 2. Si date trouvée, ajouter au calendrier
        if (steamData.releaseDate) {
            const calendarResponse = await fetch('/.netlify/functions/google-calendar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: steamData.title,
                    date: steamData.releaseDate,
                    description: `Page Steam : ${steamUrl}`
                })
            });
            
            const calendarData = await calendarResponse.json();
            
            if (calendarData.success) {
                showSuccess(`Événement créé : ${steamData.title}`, steamData.releaseDate);
            } else if (calendarData.exists) {
                showWarning(`Événement existe déjà : ${steamData.title}`, steamData.releaseDate);
            }
        } else {
            // Pas de date - stocker dans Supabase
            showInfo(`${steamData.title} - Date à déterminer\nStocké pour suivi ultérieur`);
        }
        
        document.getElementById('steamUrl').value = '';
        
    } catch (error) {
        showError('Erreur : ' + error.message);
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
}
```

---

## 📝 Checklist finale

- [ ] `gaming-hub.html` créé avec Supabase
- [ ] `steam-calendar.html` créé avec Netlify Functions
- [ ] Boutons "Retour au Hub" ajoutés
- [ ] Configurations Supabase vides (à remplir par utilisateur)
- [ ] Testez en local avec `netlify dev`

---

## 💡 Alternative rapide

Vous pouvez aussi :
1. Copier votre fichier `game-proposals-gameradar-style.html` existant
2. Le renommer en `gaming-hub.html`
3. Ajouter les modifications ci-dessus
4. Faire pareil pour Steam Calendar

Les fichiers fonctionneront en mode localStorage même sans Supabase !
