const fetch = require('node-fetch');

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
    console.log('🎮 Steam request:', data.url);

    if (!data.url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL Steam requise' })
      };
    }

    const gameData = await fetchSteamData(data.url);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(gameData)
    };

  } catch (error) {
    console.error('❌ Erreur Steam:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function fetchSteamData(url) {
  const match = url.match(/\/app\/(\d+)/);
  if (!match) {
    throw new Error('URL Steam invalide');
  }

  const appId = match[1];
  console.log('📊 App ID:', appId);

  let gameData = await fetchSteamDataAPI(appId);
  
  if (!gameData.title) {
    console.log('⚠️ API failed, trying HTML scraping');
    gameData = await fetchSteamDataHTML(url);
  }

  return gameData;
}

async function fetchSteamDataAPI(appId) {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data[appId] || !data[appId].success) {
      return { title: null, releaseDate: null };
    }

    const info = data[appId].data;
    const title = info.name || null;
    let releaseDate = null;

    if (info.release_date && info.release_date.date) {
      const dateText = info.release_date.date.trim();
      if (!/^\d{4}$/.test(dateText)) {
        releaseDate = parseDateText(dateText);
      }
    }

    console.log('✅ API Steam:', { title, releaseDate });
    return { title, releaseDate };

  } catch (error) {
    console.error('❌ Erreur API Steam:', error);
    return { title: null, releaseDate: null };
  }
}

async function fetchSteamDataHTML(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    let titleMatch = html.match(/<div\s+id=["']appHubAppName["'][^>]*>([^<]+)<\/div>/i);
    let title = titleMatch ? titleMatch[1].trim() : null;

    let releaseDate = null;
    const dateMatch = html.match(/"release_date"\s*:\s*\{\s*"date"\s*:\s*"([^"]+)"/i);
    if (dateMatch) {
      releaseDate = parseDateText(dateMatch[1]);
    }

    console.log('✅ HTML Steam:', { title, releaseDate });
    return { title, releaseDate };

  } catch (error) {
    console.error('❌ Erreur HTML Steam:', error);
    return { title: null, releaseDate: null };
  }
}

function parseDateText(txt) {
  if (!txt) return null;
  
  txt = txt.trim();
  console.log('🗓️ Parsing date:', txt);

  const vagueKeywords = [
    'a determiner', 'prochainement', 'bientot', 'soon', 'tba', 'tbd',
    'coming soon', 'a venir', 'to be announced'
  ];
  
  const lowerTxt = txt.toLowerCase();
  const isOnlyVague = vagueKeywords.some(k => lowerTxt === k || lowerTxt === k.replace(/\s/g, ''));
  
  if (isOnlyVague) {
    console.log('→ Date vague');
    return null;
  }

  if (/^\d{4}$/.test(txt)) {
    console.log('→ Année seule');
    return null;
  }

  const iso = txt.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    
    if (year >= 2020 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      console.log('→ Date ISO:', date.toISOString().split('T')[0]);
      return date.toISOString().split('T')[0];
    }
  }

  const months = {
    january: 1, jan: 1, janvier: 1,
    february: 2, feb: 2, fevrier: 2, février: 2,
    march: 3, mar: 3, mars: 3,
    april: 4, apr: 4, avril: 4,
    may: 5, mai: 5,
    june: 6, jun: 6, juin: 6,
    july: 7, jul: 7, juillet: 7,
    august: 8, aug: 8, aout: 8, août: 8,
    september: 9, sep: 9, sept: 9, septembre: 9,
    october: 10, oct: 10, octobre: 10,
    november: 11, nov: 11, novembre: 11,
    december: 12, dec: 12, decembre: 12, décembre: 12
  };

  const patterns = [
    /([a-z]+)\s+(\d{1,2}),?\s*(\d{4})/i,
    /(\d{1,2})\s+([a-z]+),?\s*(\d{4})/i
  ];

  for (const pattern of patterns) {
    const m = txt.match(pattern);
    if (m) {
      let day, month, year;
      
      if (pattern === patterns[0]) {
        month = months[m[1].toLowerCase()];
        day = Number(m[2]);
        year = Number(m[3]);
      } else {
        day = Number(m[1]);
        month = months[m[2].toLowerCase()];
        year = Number(m[3]);
      }

      if (month && year >= 2020 && year <= 2030 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        console.log('→ Date texte:', date.toISOString().split('T')[0]);
        return date.toISOString().split('T')[0];
      }
    }
  }

  try {
    const date = new Date(txt);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      if (year >= 2020 && year <= 2030) {
        console.log('→ Date native:', date.toISOString().split('T')[0]);
        return date.toISOString().split('T')[0];
      }
    }
  } catch (e) {
    // Ignore
  }

  console.log('→ Date non reconnue');
  return null;
}
