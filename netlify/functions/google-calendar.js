const fetch = require('node-fetch');

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'elbepoly@gmail.com';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

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

    if (!GOOGLE_API_KEY) {
      throw new Error('Google API Key non configurée');
    }

    // Créer l'événement
    const eventDate = new Date(data.date);
    
    const calendarEvent = {
      summary: data.title,
      description: data.description || '',
      start: {},
      end: {},
      transparency: 'transparent'
    };

    if (data.time) {
      // Événement avec horaire spécifique
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
    } else {
      // Événement toute la journée
      calendarEvent.start = {
        date: eventDate.toISOString().split('T')[0]
      };
      calendarEvent.end = {
        date: eventDate.toISOString().split('T')[0]
      };
    }

    // Appeler l'API Google Calendar
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
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
