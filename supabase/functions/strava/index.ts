
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')
const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // Handle OAuth callback from Strava
    if (action === 'callback') {
      const code = url.searchParams.get('code')
      if (!code) {
        throw new Error('No authorization code provided')
      }

      // Exchange authorization code for tokens
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code'
        })
      })

      const tokenData = await tokenResponse.json()

      // Get the user's ID from the auth header
      const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1]
      const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader)
      
      if (userError || !user) {
        throw new Error('Unauthorized')
      }

      // Store the tokens in the database
      const { error: dbError } = await supabase
        .from('strava_accounts')
        .upsert({
          user_id: user.id,
          strava_athlete_id: tokenData.athlete.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(tokenData.expires_at * 1000).toISOString()
        })

      if (dbError) {
        throw dbError
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle token refresh
    if (action === 'refresh') {
      const { data: { user }, error: userError } = await supabase.auth.getUser(
        req.headers.get('Authorization')?.split('Bearer ')[1]
      )
      
      if (userError || !user) {
        throw new Error('Unauthorized')
      }

      // Get the current Strava account
      const { data: stravaAccount, error: stravaError } = await supabase
        .from('strava_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (stravaError || !stravaAccount) {
        throw new Error('No Strava account found')
      }

      // Refresh the token
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          refresh_token: stravaAccount.refresh_token,
          grant_type: 'refresh_token'
        })
      })

      const tokenData = await tokenResponse.json()

      // Update the tokens in the database
      const { error: updateError } = await supabase
        .from('strava_accounts')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: new Date(tokenData.expires_at * 1000).toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        throw updateError
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle activity sync
    if (action === 'sync') {
      const { data: { user }, error: userError } = await supabase.auth.getUser(
        req.headers.get('Authorization')?.split('Bearer ')[1]
      )
      
      if (userError || !user) {
        throw new Error('Unauthorized')
      }

      // Get the current Strava account
      const { data: stravaAccount, error: stravaError } = await supabase
        .from('strava_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (stravaError || !stravaAccount) {
        throw new Error('No Strava account found')
      }

      // Check if token needs refresh
      if (new Date(stravaAccount.token_expires_at) <= new Date()) {
        throw new Error('Token expired')
      }

      // Fetch recent activities from Strava
      const activitiesResponse = await fetch(
        'https://www.strava.com/api/v3/athlete/activities?per_page=30',
        {
          headers: {
            'Authorization': `Bearer ${stravaAccount.access_token}`
          }
        }
      )

      const activities = await activitiesResponse.json()

      // Process activities and update quest progress
      for (const activity of activities) {
        // Log activity for fitness skill
        const { error: activityError } = await supabase
          .from('activity_log')
          .insert({
            user_id: user.id,
            skill_id: 'c8066fcd-13df-456f-9c7b-4e5368377827', // Fitness skill ID
            activity_name: `Strava ${activity.type}: ${activity.name}`,
            xp_awarded: Math.floor(activity.moving_time / 60) // 1 XP per minute
          })

        if (activityError) {
          console.error('Error logging activity:', activityError)
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Strava integration error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
