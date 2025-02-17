
// Import the createClient from Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StravaActivity {
  id: number
  type: string
  distance: number
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      throw new Error(`Failed to parse request body: ${parseError.message}`);
    }

    const { action, code } = requestBody;
    console.log('Action:', action, 'Code:', code);

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Initialize regular Supabase client for user operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    if (action === 'get_client_id') {
      const clientId = Deno.env.get('STRAVA_CLIENT_ID');
      if (!clientId) {
        throw new Error('STRAVA_CLIENT_ID environment variable is not set');
      }
      console.log('Returning Strava client ID:', clientId);
      return new Response(
        JSON.stringify({ clientId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'handle_oauth') {
      if (!code) {
        throw new Error('No code provided in OAuth callback');
      }

      // Verify Strava credentials
      const clientId = Deno.env.get('STRAVA_CLIENT_ID');
      const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        console.error('Missing Strava credentials:', { clientId: !!clientId, clientSecret: !!clientSecret });
        throw new Error('Missing Strava credentials');
      }

      console.log('Exchanging code for token...');
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          tokenData
        });
        throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`);
      }

      console.log('Token exchange successful');

      // Get user from auth header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing Authorization header');
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      
      if (!user) {
        throw new Error('No user found from auth token');
      }

      console.log('Found user:', user.id);

      // Store the tokens using the admin client
      try {
        const { error: insertError } = await supabaseAdmin
          .from('strava_accounts')
          .upsert({
            user_id: user.id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
            strava_athlete_id: tokenData.athlete.id,
          }, {
            onConflict: 'user_id',
            ignoreDuplicates: false
          });

        if (insertError) {
          console.error('Error storing tokens:', insertError);
          throw insertError;
        }
      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        throw new Error(`Failed to store Strava tokens: ${dbError.message}`);
      }

      console.log('Successfully stored Strava tokens');

      // Fetch recent activities
      console.log('Fetching recent activities');
      const activitiesResponse = await fetch(
        'https://www.strava.com/api/v3/athlete/activities',
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      if (!activitiesResponse.ok) {
        const errorText = await activitiesResponse.text();
        console.error('Failed to fetch activities:', errorText);
        throw new Error('Failed to fetch activities');
      }

      const activities: StravaActivity[] = await activitiesResponse.json();
      console.log(`Found ${activities.length} recent activities`);

      // Store activities using the admin client
      for (const activity of activities) {
        // Store activity
        const { error: activityError } = await supabaseAdmin
          .from('strava_activities')
          .upsert({
            user_id: user.id,
            strava_id: activity.id,
            activity_data: activity,
          }, {
            onConflict: 'strava_id',
            ignoreDuplicates: false
          });

        if (activityError && activityError.code !== '23505') {
          console.error('Error storing activity:', activityError);
          continue;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Invalid action: ${action}`);

  } catch (error) {
    console.error('Error in Strava function:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        details: error.cause
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
