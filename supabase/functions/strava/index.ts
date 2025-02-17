
// Import the createClient from Supabase
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers directly in this file since it's small
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookEvent {
  aspect_type: 'create' | 'update' | 'delete'
  event_time: number
  object_id: number
  object_type: 'activity' | 'athlete'
  owner_id: number
  subscription_id: number
  updates: Record<string, unknown>
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
    console.log('Strava function called with method:', req.method);
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Log all received headers for debugging
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    const requestBody = await req.json();
    console.log('Request body:', requestBody);

    const { action, code } = requestBody;

    if (action === 'get_client_id') {
      const clientId = Deno.env.get('STRAVA_CLIENT_ID');
      if (!clientId) {
        throw new Error('STRAVA_CLIENT_ID environment variable is not set');
      }
      console.log('Returning Strava client ID:', clientId);
      return new Response(
        JSON.stringify({ clientId }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (action === 'handle_oauth') {
      if (!code) {
        throw new Error('No code provided in OAuth callback');
      }
      console.log('Handling OAuth callback with code:', code);
      
      const clientId = Deno.env.get('STRAVA_CLIENT_ID');
      const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET');
      
      if (!clientId || !clientSecret) {
        throw new Error('Missing required Strava credentials');
      }

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
      console.log('Token exchange response:', tokenData);

      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', tokenData);
        throw new Error(`Failed to exchange authorization code: ${tokenData.message}`);
      }

      // Get the user from the auth header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('Missing auth header');
      }
      console.log('Auth header present:', !!authHeader);
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      
      if (!user) {
        throw new Error('No user found');
      }

      console.log('Found user:', user.id);

      // Store the tokens
      const { error: insertError } = await supabaseClient
        .from('strava_accounts')
        .insert({
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(tokenData.expires_at * 1000).toISOString(),
          strava_athlete_id: tokenData.athlete.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error storing tokens:', insertError);
        throw insertError;
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

      // Store activities in our database
      for (const activity of activities) {
        const { error: activityError } = await supabaseClient
          .from('strava_activities')
          .insert({
            user_id: user.id,
            strava_id: activity.id,
            activity_data: activity,
          })
          .select()
          .single();

        if (activityError && activityError.code !== '23505') { // Ignore unique constraint violations
          console.error('Error storing activity:', activityError);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST' && !action) {
      // Handle webhook events
      const event: WebhookEvent = requestBody;
      console.log('Received webhook event:', event);
      
      if (event.object_type === 'activity' && event.aspect_type === 'create') {
        // Get the Strava account associated with this athlete
        const { data: stravaAccount } = await supabaseClient
          .from('strava_accounts')
          .select('user_id, access_token, token_expires_at')
          .eq('strava_athlete_id', event.owner_id)
          .single();

        if (!stravaAccount) {
          throw new Error('No Strava account found for athlete');
        }

        // Fetch activity details from Strava
        const activityResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${event.object_id}`,
          {
            headers: {
              Authorization: `Bearer ${stravaAccount.access_token}`,
            },
          }
        );

        if (!activityResponse.ok) {
          const errorText = await activityResponse.text();
          console.error('Failed to fetch activity details:', errorText);
          throw new Error('Failed to fetch activity details');
        }

        const activity: StravaActivity = await activityResponse.json();
        console.log('Fetched activity details:', activity);

        // Store activity in our database
        const { error: activityError } = await supabaseClient
          .from('strava_activities')
          .insert({
            user_id: stravaAccount.user_id,
            strava_id: activity.id,
            activity_data: activity,
          })
          .select()
          .single();

        if (activityError) {
          throw activityError;
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action or method');

  } catch (error) {
    console.error('Error in Strava function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
