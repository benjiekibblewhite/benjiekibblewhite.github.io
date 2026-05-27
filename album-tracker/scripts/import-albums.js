// scripts/import-albums.js
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Get credentials from command line args
const supabaseUrl = process.argv[2];
const supabaseKey = process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.error('Usage: node import-albums.js <supabase-url> <supabase-key>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importAlbums() {
  // Read albums.json
  let albumsData;
  try {
    albumsData = JSON.parse(fs.readFileSync('./albums.json', 'utf-8'));
  } catch (error) {
    console.error('Error reading albums.json:', error.message);
    process.exit(1);
  }

  if (!Array.isArray(albumsData) || albumsData.length === 0) {
    console.error('Error: albums.json must contain a non-empty array of albums');
    process.exit(1);
  }

  console.log(`Importing ${albumsData.length} albums...`);

  // Transform to database format
  const albumsToInsert = albumsData.map(album => ({
    artist: album.artist,
    album: album.album,
    year: album.year,
    genre: album.genre,
    cover_url: album.cover_url,
    sources: album.sources
  }));

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < albumsToInsert.length; i += batchSize) {
    const batch = albumsToInsert.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('albums')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      process.exit(1);
    }

    console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(albumsToInsert.length / batchSize)}`);
  }

  console.log('✓ All albums imported successfully');
}

importAlbums().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
