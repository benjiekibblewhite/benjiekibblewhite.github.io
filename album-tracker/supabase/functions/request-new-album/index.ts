// supabase/functions/request-new-album/index.ts
// Allows authenticated users to request a new album on-demand

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Create authenticated client from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client to verify user
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing request for user ${user.id}`)

    // Get user's rated album IDs
    const { data: ratedAlbums } = await supabase
      .from('ratings')
      .select('album_id')
      .eq('user_id', user.id)

    const ratedAlbumIds = new Set(ratedAlbums?.map((r: any) => r.album_id) || [])

    // Get all albums
    const { data: allAlbums, error: albumsError } = await supabase
      .from('albums')
      .select('id, artist, album, year, cover_url, sources')

    if (albumsError) {
      throw new Error(`Failed to fetch albums: ${albumsError.message}`)
    }

    // Filter unrated albums
    const unratedAlbums = allAlbums.filter(album => !ratedAlbumIds.has(album.id))

    // Exclude albums picked in last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentPicks } = await supabase
      .from('daily_picks')
      .select('album_id')
      .eq('user_id', user.id)
      .gte('picked_at', sevenDaysAgo.toISOString())

    const recentPickIds = new Set(recentPicks?.map((p: any) => p.album_id) || [])
    const availableAlbums = unratedAlbums.filter(
      (album: any) => !recentPickIds.has(album.id)
    )

    // If no albums available, return error
    if (availableAlbums.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No albums available',
          message: 'You\'ve rated all available albums or all unrated albums were picked recently. Check back tomorrow!'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Pick random album
    const randomIndex = Math.floor(Math.random() * availableAlbums.length)
    const pickedAlbum = availableAlbums[randomIndex]

    // Insert daily pick
    const { data: pickData, error: insertError } = await supabase
      .from('daily_picks')
      .insert({
        user_id: user.id,
        album_id: pickedAlbum.id
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to insert daily pick: ${insertError.message}`)
    }

    console.log(`User ${user.id} requested: ${pickedAlbum.artist} - ${pickedAlbum.album}`)

    // Return the album details
    return new Response(
      JSON.stringify({
        success: true,
        album: {
          id: pickedAlbum.id,
          artist: pickedAlbum.artist,
          album: pickedAlbum.album,
          year: pickedAlbum.year,
          cover_url: pickedAlbum.cover_url,
          sources: pickedAlbum.sources
        },
        pick_id: pickData.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
