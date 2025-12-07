const fetch = require('node-fetch');

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_SERVER_ID = process.env.DISCORD_SERVER_ID;

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    console.log('📥 Discord DM request:', data);

    if (!data.pseudo || !data.message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Pseudo et message requis' })
      };
    }

    const result = await sendDiscordDM(data);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ Erreur:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function sendDiscordDM(data) {
  if (!DISCORD_BOT_TOKEN || !DISCORD_SERVER_ID) {
    throw new Error('Discord non configuré');
  }

  try {
    const userId = await getUserIdByUsername(data.pseudo);
    
    if (!userId) {
      console.error('❌ Utilisateur non trouvé:', data.pseudo);
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    const dmChannel = await createDMChannel(userId);
    
    if (!dmChannel) {
      console.error('❌ Impossible de créer DM');
      return { success: false, error: 'Canal DM non créé' };
    }

    let messageContent = data.message;
    
    if (data.newDate && data.newTime) {
      const formattedDate = formatDate(data.newDate);
      messageContent = messageContent.replace(/\[DATE\]/g, formattedDate);
      messageContent = messageContent.replace(/\[HEURE\]/g, data.newTime);
    }

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

    const response = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (response.ok) {
      console.log('✅ DM envoyé à', data.pseudo);
      return { success: true, user: data.pseudo };
    } else {
      const errorData = await response.text();
      console.error('❌ Erreur envoi:', errorData);
      return { success: false, error: errorData };
    }

  } catch (error) {
    console.error('❌ Erreur sendDiscordDM:', error);
    throw error;
  }
}

async function getUserIdByUsername(username) {
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_SERVER_ID}/members?limit=1000`, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
      }
    });

    if (!response.ok) {
      console.error('❌ Erreur récupération membres');
      return null;
    }

    const members = await response.json();
    console.log(`📊 ${members.length} membres récupérés`);

    for (const member of members) {
      if (member.user.username === username || 
          member.user.global_name === username ||
          member.nick === username) {
        return member.user.id;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ getUserIdByUsername:', error);
    return null;
  }
}

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
      console.error('❌ Erreur création DM');
      return null;
    }
  } catch (error) {
    console.error('❌ createDMChannel:', error);
    return null;
  }
}

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
