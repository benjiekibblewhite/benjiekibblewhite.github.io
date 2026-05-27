const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qztbbxghcbdamcxgjcgy.supabase.co';
const supabaseKey = process.argv[2];

if (!supabaseKey) {
  console.error('Usage: node check-pitchfork.js <service-role-key>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase
    .from('albums')
    .select('*');
  
  if (error) {
    console.error(error);
    process.exit(1);
  }
  
  // Find albums with pitchfork sources
  const pitchforkAlbums = data.filter(album => 
    album.sources && album.sources.some(s => s.publication === 'pitchfork')
  );
  
  console.log('Albums with Pitchfork sources:');
  pitchforkAlbums.forEach(album => {
    const pfSource = album.sources.find(s => s.publication === 'pitchfork');
    console.log(`- ${album.artist} - ${album.album} (rank: ${pfSource.rank})`);
  });
  console.log(`\nTotal: ${pitchforkAlbums.length} albums`);
})();
