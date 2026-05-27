// scripts/add-rolling-stone-top-50.js
const fs = require('fs');

// Read the existing albums.json
const albumsData = JSON.parse(fs.readFileSync('./albums.json', 'utf-8'));

// Read the top 50 data
const top50Data = JSON.parse(fs.readFileSync('./scripts/rolling-stone-top-50.json', 'utf-8'));

// Helper function to normalize album names for comparison
function normalizeAlbum(name) {
  return name
    .toLowerCase()
    .replace(/[''\u2018\u2019]/g, '') // Remove smart quotes and apostrophes
    .replace(/[^\w\s]/g, '') // Remove other punctuation
    .trim();
}

// Helper function to normalize artist names
function normalizeArtist(name) {
  return name
    .toLowerCase()
    .replace(/\s+and\s+/gi, ' & ') // Normalize "and"
    .replace(/[^\w\s&]/g, '') // Keep only alphanumeric, spaces, and &
    .trim();
}

// New source to add
const newSource = {
  publication: "Rolling Stone (Top 50)",
  blurb: "",
  list_url: "https://www.rollingstone.com/music/music-lists/best-albums-of-all-time-1062063/"
};

let addedCount = 0;
let updatedCount = 0;

// Process each top 50 album
top50Data.forEach(topAlbum => {
  // Try to find a matching album in the existing data
  const normalizedTopArtist = normalizeArtist(topAlbum.artist);
  const normalizedTopAlbum = normalizeAlbum(topAlbum.album);

  const existingAlbumIndex = albumsData.findIndex(existing => {
    const normalizedExistingArtist = normalizeArtist(existing.artist || '');
    const normalizedExistingAlbum = normalizeAlbum(existing.album || '');

    return normalizedExistingArtist === normalizedTopArtist &&
           normalizedExistingAlbum === normalizedTopAlbum;
  });

  if (existingAlbumIndex !== -1) {
    // Album exists - add the new source
    const existingAlbum = albumsData[existingAlbumIndex];

    // Check if this source already exists
    const hasSource = existingAlbum.sources.some(
      s => s.publication === "Rolling Stone (Top 50)"
    );

    if (!hasSource) {
      existingAlbum.sources.push({
        ...newSource,
        rank: topAlbum.rank
      });
      updatedCount++;
      console.log(`Updated: ${topAlbum.artist} - ${topAlbum.album} (rank ${topAlbum.rank})`);
    }
  } else {
    // Album doesn't exist - add it as a new entry
    albumsData.push({
      artist: topAlbum.artist,
      album: topAlbum.album,
      year: topAlbum.year,
      genre: null,
      cover_url: null,
      sources: [{
        ...newSource,
        rank: topAlbum.rank
      }]
    });
    addedCount++;
    console.log(`Added: ${topAlbum.artist} - ${topAlbum.album} (rank ${topAlbum.rank})`);
  }
});

// Write the updated data back to albums.json
fs.writeFileSync('./albums.json', JSON.stringify(albumsData, null, 2));

console.log('\n✓ Done!');
console.log(`  - Updated ${updatedCount} existing albums with new source`);
console.log(`  - Added ${addedCount} new albums`);
console.log(`  - Total albums: ${albumsData.length}`);
