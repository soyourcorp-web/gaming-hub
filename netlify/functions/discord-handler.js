const fetch = require('node-fetch');

// Variables d'environnement (à configurer dans Netlify)
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;

/**
 * Fonction principale - Gère les propositions
 */
exports.handler = async (event, context) => {
  // Configuration CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    console.log('Données reçues:', data);

    // Vérifier l'action
    if (!data.action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Action manquante' })
      };
    }

    // Router selon l'action
    if (data.action === 'update' && data.message) {
      // Envoyer le DM Discord
      const result = await sendDiscordDM(data);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'DM Discord envoyé',
          result: result
        })
      };
    }

    // Pour les autres actions (add, fetch), juste confirmer
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Action reçue',
        action: data.action
      })
    };

  } catch (error) {
    console.error('Erreur:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erreur serveur', 
        details: error.message 
      })
    };
  }
};

/**
 * Envoie un DM Discord
 */
async function sendDiscordDM(data) {
  console.log('Envoi DM Discord pour:', data.pseudo);

  // Vérifier la configuration
  if (!DISCORD_BOT_TOKEN) {
    throw new Error('DISCORD_BOT_TOKEN non configuré');
  }

  if (!DISCORD_SERVER_ID) {
    throw new Error('DISCORD_SERVER_ID non configuré');
  }

  try {
    // Étape 1: Récupérer l'ID de l'utilisateur
    const userId = await getUserIdByUsername(data.pseudo);
    
    if (!userId) {
      console.error('Utilisateur Discord non trouvé:', data.pseudo);
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    console.log('Utilisateur trouvé:', userId);

    // Étape 2: Créer un canal DM
    const dmChannel = await createDMChannel(userId);
    
    if (!dmChannel) {
      console.error('Impossible de créer un canal DM');
      return { success: false, error: 'Canal DM non créé' };
    }

    console.log('Canal DM créé:', dmChannel.id);

    // Étape 3: Préparer le message
    let messageContent = data.message;
    
    // Remplacer les placeholders
    if (data.newDate && data.newTime) {
      const formattedDate = formatDate(data.newDate);
      messageContent = messageContent.replace(/\[DATE\]/g, formattedDate);
      messageContent = messageContent.replace(/\[HEURE\]/g, data.newTime);
    }

    // Créer l'embed Discord
    const isAccepted = data.status === 'accepted';
    const embed = {
      title: isAccepted ? '✅ Ta proposition a été acceptée !' : '❌ Proposition refusée',
      description: messageContent,
      color: isAccepted ? 0x00ff88 : 0xff4444,
      fields: [
        {
          name: '🎮 Jeu',
          value: data.gameName || 'Non spécifié',
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Gaming Hub'
      }
    };

    // Ajouter les détails de session si accepté
    if (isAccepted && data.newDate && data.newTime) {
      embed.fields.push({
        name: '📅 Date',
        value: formatDate(data.newDate),
        inline: true
      });
      embed.fields.push({
        name: '🕐 Horaire',
        value: data.newTime,
        inline: true
      });
    }

    // Étape 4: Envoyer le message
    const response = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (response.ok) {
      console.log('✅ DM envoyé avec succès à', data.pseudo);
      return { success: true, user: data.pseudo };
    } else {
      const errorData = await response.text();
      console.error('Erreur envoi message:', errorData);
      return { success: false, error: errorData };
    }

  } catch (error) {
    console.error('Erreur sendDiscordDM:', error);
    throw error;
  }
}

/**
 * Récupère l'ID Discord par username
 */
async function getUserIdByUsername(username) {
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members?limit=1000`, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
      }
    });

    if (!response.ok) {
      console.error('Erreur récupération membres:', await response.text());
      return null;
    }

    const members = await response.json();
    console.log(`${members.length} membres récupérés`);

    // Chercher l'utilisateur
    for (const member of members) {
      if (member.user.username === username || 
          member.user.global_name === username ||
          member.nick === username) {
        return member.user.id;
      }
    }

    return null;
  } catch (error) {
    console.error('Erreur getUserIdByUsername:', error);
    return null;
  }
}

/**
 * Crée un canal DM
 */
async function createDMChannel(userId) {
  try {
    const response = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ recipient_id: userId })
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Erreur création DM:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Erreur createDMChannel:', error);
    return null;
  }
}

/**
 * Formate une date
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    return dateString;
  }
}
