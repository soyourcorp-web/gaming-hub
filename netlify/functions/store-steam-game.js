const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

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
    console.log('🗄️ Store Steam game request:', data);

    if (!data.title || !data.appId || !data.url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Title, appId et url requis' })
      };
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase non configuré');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier si le jeu existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('steam_games')
      .select('id, title')
      .eq('app_id', data.appId)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      console.log('ℹ️ Jeu déjà en base:', existing.title);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          alreadyExists: true,
          message: 'Jeu déjà stocké',
          game: existing
        })
      };
    }

    // Insérer le nouveau jeu
    const { data: inserted, error: insertError } = await supabase
      .from('steam_games')
      .insert([{
        app_id: data.appId,
        title: data.title,
        release_date: data.releaseDate || null,
        url: data.url,
        added_to_calendar: false
      }])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Jeu stocké dans Supabase:', inserted.title);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        alreadyExists: false,
        message: 'Jeu stocké avec succès',
        game: inserted
      })
    };

  } catch (error) {
    console.error('❌ Erreur store-steam-game:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
};
