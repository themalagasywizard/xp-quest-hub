
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

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
  // Add other activity fields as needed
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { action, code } = await req.json()

    if (action === 'get_client_id') {
      return new Response(
        JSON.stringify({ clientId: Deno.env.get('STRAVA_CLIENT_ID') }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (action === 'handle_oauth') {
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: Deno.env.get('STRAVA_CLIENT_ID'),
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
          code,
          grant_type: 'authorization_code',
        }),
      })

      const data = await tokenResponse.json()

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code')
      }

      // Get the user from the auth header
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) throw new Error('Missing auth header')
      const token = authHeader.replace('Bearer ', '')
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
      if (userError) throw userError

      // Store the tokens
      const { error: insertError } = await supabaseClient
        .from('strava_accounts')
        .insert({
          user_id: user.id,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: new Date(data.expires_at * 1000).toISOString(),
          strava_athlete_id: data.athlete.id,
        })

      if (insertError) throw insertError

      // Fetch recent activities
      const activitiesResponse = await fetch(
        'https://www.strava.com/api/v3/athlete/activities',
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        }
      )

      if (!activitiesResponse.ok) {
        throw new Error('Failed to fetch activities')
      }

      const activities: StravaActivity[] = await activitiesResponse.json()

      // Store activities in our database
      for (const activity of activities) {
        const { error: activityError } = await supabaseClient
          .from('strava_activities')
          .insert({
            user_id: user.id,
            strava_id: activity.id,
            activity_data: activity,
          })
          .maybeSingle()

        if (activityError && activityError.code !== '23505') { // Ignore unique constraint violations
          console.error('Error storing activity:', activityError)
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'POST' && !action) {
      // Handle webhook events
      const event: WebhookEvent = await req.json()
      
      if (event.object_type === 'activity' && event.aspect_type === 'create') {
        // Get the Strava account associated with this athlete
        const { data: stravaAccount } = await supabaseClient
          .from('strava_accounts')
          .select('user_id, access_token, token_expires_at')
          .eq('strava_athlete_id', event.owner_id)
          .maybeSingle()

        if (!stravaAccount) {
          throw new Error('No Strava account found for athlete')
        }

        // Fetch activity details from Strava
        const activityResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${event.object_id}`,
          {
            headers: {
              Authorization: `Bearer ${stravaAccount.access_token}`,
            },
          }
        )

        if (!activityResponse.ok) {
          throw new Error('Failed to fetch activity details')
        }

        const activity: StravaActivity = await activityResponse.json()

        // Store activity in our database
        const { error: activityError } = await supabaseClient
          .from('strava_activities')
          .insert({
            user_id: stravaAccount.user_id,
            strava_id: activity.id,
            activity_data: activity,
          })

        if (activityError) {
          throw activityError
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
