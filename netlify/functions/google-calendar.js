const fetch = require('node-fetch');
const { JWT } = require('google-auth-library');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'elbepoly@gmail.com';
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  // Vérifier si on a un token en cache valide
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  // Créer un nouveau JWT client
  const client = new JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar']
  });

  // Obtenir le token
  const tokens = await client.authorize();
  
  cachedToken = tokens.access_token;
  tokenExpiry = Date.now() + (tokens.expiry_date - Date.now() - 60000); // 1 min avant expiration
  
  return cachedToken;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
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
    console.log('📅 Calendar request:', data);

    if (!data.title || !data.date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Titre et date requis' })
      };
    }

    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      throw new Error('Service Account non configuré');
    }

    // Obtenir le token d'accès
    const accessToken = await getAccessToken();

    // Créer l'événement
    const eventDate = new Date(data.date);
    const calendarEvent = {
      summary: data.title,
      description: data.description || '',
      start: {
        date: eventDate.toISOString().split('T')[0]
      },
      end: {
        date: eventDate.toISOString().split('T')[0]
      },
      transparency: 'transparent'
    };

    if (data.time) {
      const [hours, minutes] = data.time.split(':');
      const startDateTime = new Date(eventDate);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + 2);

      calendarEvent.start = {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Toronto'
      };
      calendarEvent.end = {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Toronto'
      };
    }

    // Appeler l'API Google Calendar avec OAuth2
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(calendarEvent)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erreur Google Calendar:', error);
      throw new Error('Erreur création événement: ' + error);
    }

    const result = await response.json();
    console.log('✅ Événement créé:', result.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        eventId: result.id,
        title: data.title,
        date: data.date
      })
    };

  } catch (error) {
    console.error('❌ Erreur Calendar:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
