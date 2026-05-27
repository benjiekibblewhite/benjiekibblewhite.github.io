// supabase/functions/daily-album-picker/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://your-app-url.com'

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables')
}

serve(async (req) => {
  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing required environment variables' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
  try {
    // Create Supabase admin client
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('Starting daily album picker...')

    // Get all users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    console.log(`Processing ${users.length} users`)

    let successCount = 0
    let errorCount = 0

    // Process each user
    for (const user of users) {
      try {
        await processUser(supabase, user)
        successCount++
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: users.length,
        successful: successCount,
        errors: errorCount
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function processUser(supabase: any, user: any) {
  // Get user's rated album IDs
  const { data: ratedAlbums } = await supabase
    .from('ratings')
    .select('album_id')
    .eq('user_id', user.id)

  const ratedAlbumIds = new Set(ratedAlbums?.map((r: any) => r.album_id) || [])

  // Get all albums
  const { data: allAlbums, error: albumsError } = await supabase
    .from('albums')
    .select('id, artist, album, year')

  if (albumsError) {
    throw new Error(`Failed to fetch albums: ${albumsError.message}`)
  }

  // Filter unrated in JavaScript
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

  // If no albums available, send completion email
  if (availableAlbums.length === 0) {
    await sendCompletionEmail(user.email)
    return
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

  // Send email
  await sendAlbumEmail(user.email, pickedAlbum)

  // Mark email as sent
  await supabase
    .from('daily_picks')
    .update({ email_sent: true })
    .eq('id', pickData.id)

  console.log(`Processed user ${user.email}: picked ${pickedAlbum.artist} - ${pickedAlbum.album}`)
}

async function sendAlbumEmail(email: string, album: any) {
  const emailBody = `Today's album: ${album.album}
Artist: ${album.artist}
${album.year ? `Year: ${album.year}` : ''}

Listen and rate it when you're ready!

${APP_URL}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Album Tracker <albums@benjie.ca>',
      to: [email],
      subject: 'Your Album of the Day',
      text: emailBody
    })
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to send email: ${error}`)
  }
}

async function sendCompletionEmail(email: string) {
  const emailBody = `Congratulations! You've rated all available albums!

No new album today. Keep enjoying your collection!

${APP_URL}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Album Tracker <albums@benjie.ca>',
      to: [email],
      subject: 'Album Tracker - All Albums Rated!',
      text: emailBody
    })
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Failed to send completion email: ${error}`)
  }
}
