// scripts/fix-pitchfork-data.js
// Fix the Pitchfork data by removing incorrect albums and adding correct ones

const fs = require('fs');

// Read current albums.json
const albums = JSON.parse(fs.readFileSync('./albums.json', 'utf-8'));

// Remove all Pitchfork sources except John Coltrane - Olé Coltrane
console.log('Removing incorrect Pitchfork albums...');
let removedCount = 0;
const cleanedAlbums = albums.filter(album => {
  const hasPitchfork = album.sources && album.sources.some(s => s.publication === 'Pitchfork');

  if (hasPitchfork) {
    // Keep John Coltrane - Olé Coltrane
    if (album.artist === 'John Coltrane' && album.album.includes('Olé Coltrane')) {
      console.log(`✓ Keeping: ${album.artist} - ${album.album}`);
      return true;
    }

    // Remove all other Pitchfork albums
    console.log(`✗ Removing: ${album.artist} - ${album.album}`);
    removedCount++;
    return false;
  }

  return true;
});

console.log(`\nRemoved ${removedCount} incorrect Pitchfork albums\n`);

// Top 50 from Pitchfork Best Albums of the 1960s
// https://pitchfork.com/features/lists-and-guides/the-200-best-albums-of-the-1960s/
const pitchfork1960s = [
  { rank: 1, artist: 'The Velvet Underground', album: 'The Velvet Underground & Nico', year: 1967 },
  { rank: 2, artist: 'The Beatles', album: 'The Beatles (White Album)', year: 1968 },
  { rank: 3, artist: 'The Beatles', album: 'Revolver', year: 1966 },
  { rank: 4, artist: 'Bob Dylan', album: 'Highway 61 Revisited', year: 1965 },
  { rank: 5, artist: 'The Beach Boys', album: 'Pet Sounds', year: 1966 },
  { rank: 6, artist: 'The Beatles', album: "Sgt. Pepper's Lonely Hearts Club Band", year: 1967 },
  { rank: 7, artist: 'The Velvet Underground', album: 'White Light/White Heat', year: 1968 },
  { rank: 8, artist: 'The Zombies', album: 'Odessey and Oracle', year: 1968 },
  { rank: 9, artist: 'The Jimi Hendrix Experience', album: 'Are You Experienced', year: 1967 },
  { rank: 10, artist: 'Aretha Franklin', album: 'I Never Loved a Man the Way I Love You', year: 1967 },
  { rank: 11, artist: 'Miles Davis', album: 'In a Silent Way', year: 1969 },
  { rank: 12, artist: 'The Stooges', album: 'The Stooges', year: 1969 },
  { rank: 13, artist: 'Love', album: 'Forever Changes', year: 1967 },
  { rank: 14, artist: 'The Kinks', album: 'The Kinks Are the Village Green Preservation Society', year: 1968 },
  { rank: 15, artist: 'Bob Dylan', album: 'Blonde on Blonde', year: 1966 },
  { rank: 16, artist: 'The Beatles', album: 'Rubber Soul', year: 1965 },
  { rank: 17, artist: 'The Byrds', album: 'The Notorious Byrd Brothers', year: 1968 },
  { rank: 18, artist: 'Otis Redding', album: 'Otis Blue/Otis Redding Sings Soul', year: 1965 },
  { rank: 19, artist: 'The Rolling Stones', album: 'Let It Bleed', year: 1969 },
  { rank: 20, artist: 'John Coltrane', album: 'A Love Supreme', year: 1965 },
  { rank: 21, artist: 'Tim Buckley', album: 'Happy Sad', year: 1969 },
  { rank: 22, artist: 'Captain Beefheart and His Magic Band', album: 'Trout Mask Replica', year: 1969 },
  { rank: 23, artist: 'The Beatles', album: 'Abbey Road', year: 1969 },
  { rank: 24, artist: 'The Velvet Underground', album: 'The Velvet Underground', year: 1969 },
  { rank: 25, artist: 'Nick Drake', album: 'Five Leaves Left', year: 1969 },
  { rank: 26, artist: 'Nina Simone', album: 'Wild Is the Wind', year: 1966 },
  { rank: 27, artist: 'The Jimi Hendrix Experience', album: 'Electric Ladyland', year: 1968 },
  { rank: 28, artist: 'Nico', album: 'The Marble Index', year: 1968 },
  { rank: 29, artist: 'Serge Gainsbourg', album: 'Histoire de Melody Nelson', year: 1969 },
  { rank: 30, artist: 'The Band', album: 'Music From Big Pink', year: 1968 },
  { rank: 31, artist: 'The Rolling Stones', album: "Beggar's Banquet", year: 1968 },
  { rank: 32, artist: 'Dusty Springfield', album: 'Dusty in Memphis', year: 1969 },
  { rank: 33, artist: 'Arthur Russell', album: 'Instrumentals', year: 1969 },
  { rank: 34, artist: 'Joni Mitchell', album: 'Clouds', year: 1969 },
  { rank: 35, artist: 'Big Star', album: '#1 Record', year: 1969 },
  { rank: 36, artist: 'Leonard Cohen', album: 'Songs of Leonard Cohen', year: 1967 },
  { rank: 37, artist: 'Ennio Morricone', album: 'The Good, the Bad and the Ugly', year: 1966 },
  { rank: 38, artist: 'The Doors', album: 'The Doors', year: 1967 },
  { rank: 39, artist: 'Van Morrison', album: 'Astral Weeks', year: 1968 },
  { rank: 40, artist: 'The Who', album: 'The Who Sell Out', year: 1967 },
  { rank: 41, artist: 'Simon & Garfunkel', album: 'Bookends', year: 1968 },
  { rank: 42, artist: 'Fairport Convention', album: 'Liege & Lief', year: 1969 },
  { rank: 43, artist: 'Os Mutantes', album: 'Os Mutantes', year: 1968 },
  { rank: 44, artist: 'Marvin Gaye', album: "That's the Way Love Is", year: 1969 },
  { rank: 45, artist: 'The Byrds', album: 'Sweetheart of the Rodeo', year: 1968 },
  { rank: 46, artist: 'James Brown', album: 'Live at the Apollo', year: 1963 },
  { rank: 47, artist: 'Sly and the Family Stone', album: 'Stand!', year: 1969 },
  { rank: 48, artist: 'The 13th Floor Elevators', album: 'The Psychedelic Sounds of the 13th Floor Elevators', year: 1966 },
  { rank: 49, artist: 'Scott Walker', album: 'Scott 4', year: 1969 },
  { rank: 50, artist: 'MC5', album: 'Kick Out the Jams', year: 1969 }
];

// Top 50 from Pitchfork's The People's List: 25th Anniversary
// https://pitchfork.com/features/lists-and-guides/peoples-list-25th-anniversary/
const pitchfork25Years = [
  { rank: 1, artist: 'Radiohead', album: 'Kid A', year: 2000 },
  { rank: 2, artist: 'Kanye West', album: 'My Beautiful Dark Twisted Fantasy', year: 2010 },
  { rank: 3, artist: 'Kendrick Lamar', album: 'To Pimp a Butterfly', year: 2015 },
  { rank: 4, artist: 'Radiohead', album: 'In Rainbows', year: 2007 },
  { rank: 5, artist: 'D\'Angelo', album: 'Voodoo', year: 2000 },
  { rank: 6, artist: 'Kanye West', album: 'The College Dropout', year: 2004 },
  { rank: 7, artist: 'Daft Punk', album: 'Discovery', year: 2001 },
  { rank: 8, artist: 'Arcade Fire', album: 'Funeral', year: 2004 },
  { rank: 9, artist: 'The Strokes', album: 'Is This It', year: 2001 },
  { rank: 10, artist: 'OutKast', album: 'Stankonia', year: 2000 },
  { rank: 11, artist: 'Sufjan Stevens', album: 'Illinois', year: 2005 },
  { rank: 12, artist: 'Radiohead', album: 'OK Computer', year: 1997 },
  { rank: 13, artist: 'Frank Ocean', album: 'Blonde', year: 2016 },
  { rank: 14, artist: 'LCD Soundsystem', album: 'Sound of Silver', year: 2007 },
  { rank: 15, artist: 'Neutral Milk Hotel', album: 'In the Aeroplane Over the Sea', year: 1998 },
  { rank: 16, artist: 'Fiona Apple', album: 'The Idler Wheel...', year: 2012 },
  { rank: 17, artist: 'Wilco', album: 'Yankee Hotel Foxtrot', year: 2002 },
  { rank: 18, artist: 'The Avalanches', album: 'Since I Left You', year: 2000 },
  { rank: 19, artist: 'Jay-Z', album: 'The Blueprint', year: 2001 },
  { rank: 20, artist: 'Madvillain', album: 'Madvillainy', year: 2004 },
  { rank: 21, artist: 'Vampire Weekend', album: 'Vampire Weekend', year: 2008 },
  { rank: 22, artist: 'Animal Collective', album: 'Merriweather Post Pavilion', year: 2009 },
  { rank: 23, artist: 'Björk', album: 'Homogenic', year: 1997 },
  { rank: 24, artist: 'Modest Mouse', album: 'The Moon & Antarctica', year: 2000 },
  { rank: 25, artist: 'Amy Winehouse', album: 'Back to Black', year: 2006 },
  { rank: 26, artist: 'Beyoncé', album: 'Lemonade', year: 2016 },
  { rank: 27, artist: 'Fleet Foxes', album: 'Fleet Foxes', year: 2008 },
  { rank: 28, artist: 'Burial', album: 'Untrue', year: 2007 },
  { rank: 29, artist: 'Nas', album: 'Illmatic', year: 1994 },
  { rank: 30, artist: 'The xx', album: 'xx', year: 2009 },
  { rank: 31, artist: 'Portishead', album: 'Dummy', year: 1994 },
  { rank: 32, artist: 'TV on the Radio', album: 'Return to Cookie Mountain', year: 2006 },
  { rank: 33, artist: 'PJ Harvey', album: 'Stories From the City, Stories From the Sea', year: 2000 },
  { rank: 34, artist: 'Aphex Twin', album: 'Selected Ambient Works 85-92', year: 1992 },
  { rank: 35, artist: 'Joanna Newsom', album: 'Ys', year: 2006 },
  { rank: 36, artist: 'Bon Iver', album: 'For Emma, Forever Ago', year: 2007 },
  { rank: 37, artist: 'OutKast', album: 'Aquemini', year: 1998 },
  { rank: 38, artist: 'M.I.A.', album: 'Kala', year: 2007 },
  { rank: 39, artist: 'Pavement', album: 'Slanted and Enchanted', year: 1992 },
  { rank: 40, artist: 'Massive Attack', album: 'Mezzanine', year: 1998 },
  { rank: 41, artist: 'A Tribe Called Quest', album: 'The Low End Theory', year: 1991 },
  { rank: 42, artist: 'Panda Bear', album: 'Person Pitch', year: 2007 },
  { rank: 43, artist: 'Grimes', album: 'Visions', year: 2012 },
  { rank: 44, artist: 'Elliott Smith', album: 'Either/Or', year: 1997 },
  { rank: 45, artist: 'The National', album: 'Boxer', year: 2007 },
  { rank: 46, artist: 'Solange', album: 'A Seat at the Table', year: 2016 },
  { rank: 47, artist: 'Sleater-Kinney', album: 'Dig Me Out', year: 1997 },
  { rank: 48, artist: 'Björk', album: 'Vespertine', year: 2001 },
  { rank: 49, artist: 'Gorillaz', album: 'Demon Days', year: 2005 },
  { rank: 50, artist: 'Lauryn Hill', album: 'The Miseducation of Lauryn Hill', year: 1998 }
];

// Add both lists to cleaned albums
console.log('Adding Pitchfork Best Albums of the 1960s (Top 50)...');
pitchfork1960s.forEach(album => {
  cleanedAlbums.push({
    artist: album.artist,
    album: album.album,
    year: album.year,
    sources: [{
      publication: 'Pitchfork',
      rank: album.rank,
      blurb: '',
      list_url: 'https://pitchfork.com/features/lists-and-guides/the-200-best-albums-of-the-1960s/'
    }]
  });
  console.log(`✓ Added: ${album.artist} - ${album.album} (rank ${album.rank})`);
});

console.log('\nAdding Pitchfork 25th Anniversary (Top 50)...');
pitchfork25Years.forEach(album => {
  cleanedAlbums.push({
    artist: album.artist,
    album: album.album,
    year: album.year,
    sources: [{
      publication: 'Pitchfork',
      rank: album.rank,
      blurb: '',
      list_url: 'https://pitchfork.com/features/lists-and-guides/peoples-list-25th-anniversary/'
    }]
  });
  console.log(`✓ Added: ${album.artist} - ${album.album} (rank ${album.rank})`);
});

// Write the updated albums.json
fs.writeFileSync('./albums.json', JSON.stringify(cleanedAlbums, null, 2), 'utf-8');

console.log('\n✓ Done! albums.json has been updated.');
console.log(`  - Removed: ${removedCount} incorrect albums`);
console.log(`  - Kept: 1 album (John Coltrane - Olé Coltrane)`);
console.log(`  - Added: ${pitchfork1960s.length} albums from 1960s list`);
console.log(`  - Added: ${pitchfork25Years.length} albums from 25-year anniversary list`);
console.log(`  - Total Pitchfork albums now: ${pitchfork1960s.length + pitchfork25Years.length + 1}`);
