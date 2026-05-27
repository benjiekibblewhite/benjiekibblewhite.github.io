// scripts/upsert-albums.js
// Intelligently merges albums.json into Supabase:
// - Inserts new albums
// - Updates existing albums with new sources if needed

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Get credentials from command line args
const supabaseUrl = process.argv[2];
const supabaseKey = process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.error('Usage: node upsert-albums.js <supabase-url> <supabase-service-role-key>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to normalize strings for comparison
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[''\u2018\u2019]/g, '') // Remove quotes
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

async function upsertAlbums() {
  // Read albums.json
  let albumsData;
  try {
    albumsData = JSON.parse(fs.readFileSync('./albums.json', 'utf-8'));
  } catch (error) {
    console.error('Error reading albums.json:', error.message);
    process.exit(1);
  }

  console.log(`Processing ${albumsData.length} albums from albums.json...\n`);

  // Fetch all existing albums from Supabase
  console.log('Fetching existing albums from Supabase...');
  const { data: existingAlbums, error: fetchError } = await supabase
    .from('albums')
    .select('*');

  if (fetchError) {
    console.error('Error fetching existing albums:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${existingAlbums.length} existing albums in database\n`);

  // Create a map of existing albums for quick lookup
  const existingMap = new Map();
  existingAlbums.forEach(album => {
    const key = `${normalize(album.artist)}|||${normalize(album.album)}`;
    existingMap.set(key, album);
  });

  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // Process each album from albums.json
  for (const album of albumsData) {
    const key = `${normalize(album.artist)}|||${normalize(album.album)}`;
    const existing = existingMap.get(key);

    if (!existing) {
      // Album doesn't exist - insert it
      const { error: insertError } = await supabase
        .from('albums')
        .insert({
          artist: album.artist,
          album: album.album,
          year: album.year,
          genre: album.genre,
          cover_url: album.cover_url,
          sources: album.sources
        });

      if (insertError) {
        console.error(`❌ Error inserting ${album.artist} - ${album.album}:`, insertError.message);
      } else {
        console.log(`✓ Inserted: ${album.artist} - ${album.album}`);
        insertedCount++;
      }
    } else {
      // Album exists - check if we need to update sources
      const existingSources = existing.sources || [];
      const newSources = album.sources || [];

      // Find sources that don't exist yet
      const sourcesToAdd = [];
      for (const newSource of newSources) {
        const hasSource = existingSources.some(
          s => s.publication === newSource.publication && s.rank === newSource.rank
        );
        if (!hasSource) {
          sourcesToAdd.push(newSource);
        }
      }

      if (sourcesToAdd.length > 0) {
        // Merge sources
        const mergedSources = [...existingSources, ...sourcesToAdd];

        const { error: updateError } = await supabase
          .from('albums')
          .update({ sources: mergedSources })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`❌ Error updating ${album.artist} - ${album.album}:`, updateError.message);
        } else {
          console.log(`✓ Updated: ${album.artist} - ${album.album} (added ${sourcesToAdd.length} source(s))`);
          updatedCount++;
        }
      } else {
        skippedCount++;
      }
    }
  }

  console.log('\n✓ Done!');
  console.log(`  - Inserted: ${insertedCount} new albums`);
  console.log(`  - Updated: ${updatedCount} albums with new sources`);
  console.log(`  - Skipped: ${skippedCount} albums (already up to date)`);
}

upsertAlbums().catch(error => {
  console.error('Upsert failed:', error);
  process.exit(1);
});
