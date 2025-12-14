const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Supabase non configuré' })
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const method = event.httpMethod;

    if (method === 'GET') {
      const { data, error } = await supabase
        .from('propositions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ proposals: data })
      };
    }

    if (method === 'POST') {
      const proposal = JSON.parse(event.body);
      
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

      console.log('✅ Proposition créée:', data[0].id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, proposal: data[0] })
      };
    }

    if (method === 'PUT') {
      const update = JSON.parse(event.body);
      
      const updateData = {
        status: update.status
      };

      if (update.date) updateData.date = update.date;
      if (update.time) updateData.time = update.time;
      if (update.message) updateData.message = update.message;

      const { data, error } = await supabase
        .from('propositions')
        .update(updateData)
        .eq('id', update.id)
        .select();

      if (error) throw error;

      console.log('✅ Proposition mise à jour:', update.id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, proposal: data[0] })
      };
    }

    if (method === 'DELETE') {
      const { id } = JSON.parse(event.body);
      
      const { error } = await supabase
        .from('propositions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('✅ Proposition supprimée:', id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('❌ Erreur Supabase:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
