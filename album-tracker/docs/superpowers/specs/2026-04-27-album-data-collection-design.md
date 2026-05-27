# Album Data Collection System Design

**Date:** 2026-04-27  
**Purpose:** Fetch and consolidate album data from multiple publication "best of" lists into a single deduplicated JSON file

## Overview

A Python-based web scraping system that collects album metadata from four music publication lists, deduplicates entries using fuzzy matching, and outputs a consolidated JSON file with all source information preserved.

## Architecture

### High-Level Flow

1. **Fetch data** from 4 publication websites
2. **Parse** HTML/JavaScript content to extract album information
3. **Deduplicate** using fuzzy matching on artist + album names
4. **Merge** duplicate entries, preserving all source metadata
5. **Output** single JSON file with consolidated data

### Modular Design

The script is organized with:
- **Separate scraper functions** for each publication (4 total)
- **Shared deduplication logic** that processes all scraped data
- **Standardized data structure** returned by all scrapers
- **JSON output formatter** that creates the final file

This modularity allows individual scrapers to be fixed or updated without affecting others, and makes adding new sources straightforward.

## Data Sources

### 1. NPR Music - "The 150 Greatest Albums Made By Women"
- **Amount:** Top 50 albums
- **Strategy:** Check if static HTML or JavaScript-rendered
- **Tool:** requests + BeautifulSoup or Playwright as needed

### 2. Rolling Stone - "2023 Best Albums of All Time"
- **Amount:** Top 50 albums
- **Strategy:** Likely JavaScript-heavy
- **Tool:** Playwright

### 3. Beehype - "SPECIAL: Classic Albums from Around the World"
- **Amount:** All albums from list
- **Strategy:** Inspect on first attempt
- **Tool:** BeautifulSoup first, Playwright fallback

### 4. Pitchfork - "Best Albums of the Last 25 Years"
- **Amount:** Top 50 albums
- **Strategy:** Likely static or lightly dynamic
- **Tool:** requests + BeautifulSoup first, Playwright if needed

## Data Structure

### Scraper Output Format

Each scraper returns a list of albums with this structure:

```python
{
    "artist": str,           # Artist name
    "album": str,            # Album title
    "year": int | None,      # Release year (if available)
    "genre": str | None,     # Genre/style (if available)
    "cover_url": str | None, # Album cover image URL (if available)
    "rank": int,             # Position in the source list
    "blurb": str,            # Publication's description/review text
    "publication": str,      # "NPR", "Rolling Stone", "Pitchfork", or "Beehype"
    "list_url": str          # URL to the publication's list page
}
```

### Final JSON Output Format

After deduplication, albums are merged with all source information:

```json
[
  {
    "artist": "Joni Mitchell",
    "album": "Blue",
    "year": 1971,
    "genre": "Folk Rock",
    "cover_url": "https://...",
    "sources": [
      {
        "publication": "NPR",
        "rank": 1,
        "blurb": "...",
        "list_url": "https://..."
      },
      {
        "publication": "Rolling Stone",
        "rank": 3,
        "blurb": "...",
        "list_url": "https://..."
      }
    ]
  }
]
```

**Metadata merge strategy:** When merging duplicates, metadata fields (year, genre, cover_url) prefer the first non-null value encountered.

## Fuzzy Matching & Deduplication

### Matching Algorithm

- **Library:** `thefuzz` (formerly fuzzywuzzy)
- **Method:** `fuzz.token_sort_ratio`
- **Threshold:** 85% similarity
- **Comparison key:** Combined "artist - album" string

### Normalization Steps

Before matching, strings are normalized:
1. Convert to lowercase
2. Remove extra whitespace
3. Remove common punctuation variations ("'", "'", etc.)
4. Handle "The" prefix inconsistencies (e.g., "The Beatles" vs "Beatles")

### Deduplication Process

1. Collect all albums from all scrapers into one list
2. For each album, compare against all others using fuzzy match
3. Group matches together (>= 85% similarity)
4. For each group:
   - Use first album's metadata (artist, album, year, genre, cover_url) as canonical
   - Merge all sources into the `sources` array
   - Prefer non-null metadata values when available

### Edge Cases

- Albums with identical artist but different album names won't match (intended)
- Same album name, different artists won't match (intended)
- False positives from fuzzy matching can be addressed by adjusting threshold
- Manual review may be needed for ambiguous cases

## Implementation Details

### Project Structure

```
/albums
├── scraper.py          # Main script with all logic
├── requirements.txt    # Python dependencies
├── albums.json         # Output file (generated)
└── README.md          # Usage instructions
```

### Dependencies

```
requests              # HTTP client for static pages
beautifulsoup4        # HTML parsing
lxml                  # Fast XML/HTML parser
playwright            # Browser automation for JS-heavy sites
thefuzz               # Fuzzy string matching
python-Levenshtein    # Speeds up fuzzy matching
```

### Script Organization

**Scraper functions:**
- `scrape_npr()` → Returns list of album dicts
- `scrape_rolling_stone()` → Returns list of album dicts
- `scrape_beehype()` → Returns list of album dicts
- `scrape_pitchfork()` → Returns list of album dicts

**Main logic:**
```python
def main():
    # Call all scrapers with progress indicators
    all_albums = []
    all_albums.extend(scrape_npr())
    all_albums.extend(scrape_rolling_stone())
    all_albums.extend(scrape_beehype())
    all_albums.extend(scrape_pitchfork())
    
    # Deduplicate
    deduplicated = deduplicate_albums(all_albums)
    
    # Write output
    with open('albums.json', 'w') as f:
        json.dump(deduplicated, f, indent=2)
```

**Error handling:**
- Each scraper wrapped in try/except
- Script continues even if one scraper fails
- Failed scrapers log errors but don't crash entire process

### Execution

```bash
# Install dependencies
pip install -r requirements.txt
playwright install chromium

# Run scraper
python scraper.py
```

**Output:** `albums.json` with deduplicated albums and source information.

## Success Criteria

1. Successfully fetches data from all 4 publication lists
2. Extracts all available metadata (artist, album, year, genre, cover art)
3. Identifies and merges duplicate albums across sources
4. Preserves all source information (publication, rank, blurb, URL)
5. Outputs valid JSON file with consolidated data
6. Handles network errors and missing data gracefully

## Future Considerations

- Add support for additional publication lists
- Implement caching to avoid re-scraping unchanged pages
- Add validation/manual review step for fuzzy match results
- Consider database storage instead of JSON file
- Build UI for tracking listening progress (future phase)
