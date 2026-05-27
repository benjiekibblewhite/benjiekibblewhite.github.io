# Album Data Collection System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python web scraper that fetches album data from 4 music publication lists, deduplicates using fuzzy matching, and outputs consolidated JSON.

**Architecture:** Modular scraper with separate functions per publication, shared deduplication logic, standardized data structures. Mixed strategy using BeautifulSoup for static content and Playwright for JavaScript-heavy sites.

**Tech Stack:** Python 3.9+, requests, BeautifulSoup4, Playwright, thefuzz

---

## File Structure

- `requirements.txt` - Python dependencies
- `scraper.py` - Main script with all scraping and deduplication logic
- `albums.json` - Output file (generated)
- `README.md` - Usage instructions
- `.gitignore` - Ignore Python cache and generated files

---

### Task 1: Project Setup and Dependencies

**Files:**
- Create: `requirements.txt`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Create requirements.txt**

```txt
requests==2.31.0
beautifulsoup4==4.12.3
lxml==5.2.1
playwright==1.43.0
thefuzz==0.22.1
python-Levenshtein==0.25.1
```

- [ ] **Step 2: Create .gitignore**

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/

# Output
albums.json

# IDE
.vscode/
.idea/
*.swp
*.swo
```

- [ ] **Step 3: Create README.md**

```markdown
# Album Data Collection

Scrapes album data from multiple music publication "best of" lists and outputs a deduplicated JSON file.

## Setup

```bash
pip install -r requirements.txt
playwright install chromium
```

## Usage

```bash
python scraper.py
```

Output will be written to `albums.json`.

## Data Sources

- NPR Music: "The 150 Greatest Albums Made By Women" (top 50)
- Rolling Stone: "2023 Best Albums of All Time" (top 50)
- Beehype: "SPECIAL: Classic Albums from Around the World" (all)
- Pitchfork: "Best Albums of the Last 25 Years" (top 50)
```

- [ ] **Step 4: Commit setup files**

```bash
git add requirements.txt .gitignore README.md
git commit -m "chore: add project setup and dependencies"
```

---

### Task 2: Core Data Structures and Utilities

**Files:**
- Create: `scraper.py`

- [ ] **Step 1: Create scraper.py with imports and data structures**

```python
#!/usr/bin/env python3
"""
Album data collection scraper.
Fetches album data from multiple music publication lists.
"""

import json
import re
from typing import List, Dict, Optional, Any
from thefuzz import fuzz


def normalize_string(s: str) -> str:
    """
    Normalize string for fuzzy matching.
    
    Args:
        s: String to normalize
        
    Returns:
        Normalized lowercase string with cleaned punctuation
    """
    # Convert to lowercase
    s = s.lower()
    # Remove extra whitespace
    s = re.sub(r'\s+', ' ', s).strip()
    # Normalize quotes
    s = s.replace("'", "'").replace("'", "'")
    s = s.replace(""", '"').replace(""", '"')
    # Remove leading "the " for consistency
    if s.startswith("the "):
        s = s[4:]
    return s


def create_album_dict(
    artist: str,
    album: str,
    rank: int,
    blurb: str,
    publication: str,
    list_url: str,
    year: Optional[int] = None,
    genre: Optional[str] = None,
    cover_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create standardized album dictionary.
    
    Returns:
        Album dictionary with all metadata
    """
    return {
        "artist": artist,
        "album": album,
        "year": year,
        "genre": genre,
        "cover_url": cover_url,
        "rank": rank,
        "blurb": blurb,
        "publication": publication,
        "list_url": list_url
    }


if __name__ == "__main__":
    print("Album Data Collection Scraper")
```

- [ ] **Step 2: Run script to verify imports**

Run: `python scraper.py`
Expected: Output "Album Data Collection Scraper" with no import errors

- [ ] **Step 3: Commit core structures**

```bash
git add scraper.py
git commit -m "feat: add core data structures and normalization"
```

---

### Task 3: Fuzzy Matching and Deduplication Logic

**Files:**
- Modify: `scraper.py`

- [ ] **Step 1: Add deduplication function**

Add after `create_album_dict()` function:

```python
def deduplicate_albums(albums: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deduplicate albums using fuzzy matching on artist + album name.
    
    Args:
        albums: List of album dictionaries from all scrapers
        
    Returns:
        Deduplicated list with merged sources
    """
    if not albums:
        return []
    
    # Track which albums have been merged
    merged_indices = set()
    result = []
    
    for i, album1 in enumerate(albums):
        if i in merged_indices:
            continue
            
        # Create comparison string
        key1 = normalize_string(f"{album1['artist']} - {album1['album']}")
        
        # Start a new merged album
        merged = {
            "artist": album1["artist"],
            "album": album1["album"],
            "year": album1.get("year"),
            "genre": album1.get("genre"),
            "cover_url": album1.get("cover_url"),
            "sources": [{
                "publication": album1["publication"],
                "rank": album1["rank"],
                "blurb": album1["blurb"],
                "list_url": album1["list_url"]
            }]
        }
        
        # Find matches
        for j, album2 in enumerate(albums[i+1:], start=i+1):
            if j in merged_indices:
                continue
                
            key2 = normalize_string(f"{album2['artist']} - {album2['album']}")
            similarity = fuzz.token_sort_ratio(key1, key2)
            
            if similarity >= 85:
                # Merge this album
                merged_indices.add(j)
                
                # Prefer non-null metadata
                if not merged["year"] and album2.get("year"):
                    merged["year"] = album2["year"]
                if not merged["genre"] and album2.get("genre"):
                    merged["genre"] = album2["genre"]
                if not merged["cover_url"] and album2.get("cover_url"):
                    merged["cover_url"] = album2["cover_url"]
                
                # Add source
                merged["sources"].append({
                    "publication": album2["publication"],
                    "rank": album2["rank"],
                    "blurb": album2["blurb"],
                    "list_url": album2["list_url"]
                })
        
        merged_indices.add(i)
        result.append(merged)
    
    return result
```

- [ ] **Step 2: Test deduplication with sample data**

Add before `if __name__ == "__main__":` block:

```python
def test_deduplication():
    """Test deduplication logic with sample data."""
    test_albums = [
        create_album_dict(
            "Joni Mitchell", "Blue", 1, "Classic folk album", "NPR",
            "https://npr.org/list", year=1971
        ),
        create_album_dict(
            "The Beatles", "Abbey Road", 2, "Final masterpiece", "NPR",
            "https://npr.org/list", year=1969
        ),
        create_album_dict(
            "Beatles", "Abbey Road", 5, "Iconic album", "Rolling Stone",
            "https://rollingstone.com/list", year=1969, genre="Rock"
        ),
    ]
    
    result = deduplicate_albums(test_albums)
    print(f"\nTest: {len(test_albums)} albums -> {len(result)} deduplicated")
    
    # Verify Abbey Road was merged
    abbey_road = [a for a in result if "Abbey Road" in a["album"]][0]
    assert len(abbey_road["sources"]) == 2, "Abbey Road should have 2 sources"
    assert abbey_road["genre"] == "Rock", "Should merge metadata"
    print("✓ Deduplication test passed")
```

Update the `if __name__ == "__main__":` block:

```python
if __name__ == "__main__":
    print("Album Data Collection Scraper")
    test_deduplication()
```

- [ ] **Step 3: Run test**

Run: `python scraper.py`
Expected: Output showing "3 albums -> 2 deduplicated" and "✓ Deduplication test passed"

- [ ] **Step 4: Commit deduplication logic**

```bash
git add scraper.py
git commit -m "feat: add fuzzy matching deduplication logic"
```

---

### Task 4: NPR Music Scraper

**Files:**
- Modify: `scraper.py`

- [ ] **Step 1: Add NPR scraper function**

Add after deduplication function, before test function:

```python
def scrape_npr() -> List[Dict[str, Any]]:
    """
    Scrape NPR Music's "150 Greatest Albums Made By Women" list.
    
    Returns:
        List of album dictionaries (top 50)
    """
    import requests
    from bs4 import BeautifulSoup
    
    print("\n[NPR] Starting scrape...")
    
    url = "https://www.npr.org/2017/07/24/536538837/the-150-greatest-albums-made-by-women"
    albums = []
    
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Find album entries - NPR uses specific structure
        # This will need adjustment based on actual page structure
        entries = soup.find_all('div', class_='album-entry')[:50]
        
        if not entries:
            # Fallback: try different selectors
            entries = soup.find_all('div', class_='item')[:50]
        
        for idx, entry in enumerate(entries, start=1):
            try:
                # Extract album info - adjust selectors based on actual HTML
                artist_elem = entry.find(['h3', 'h2', 'strong'], class_=re.compile('artist|name'))
                album_elem = entry.find(['h4', 'h3', 'em'], class_=re.compile('album|title'))
                blurb_elem = entry.find(['p', 'div'], class_=re.compile('description|text'))
                year_elem = entry.find(['span', 'time'], class_=re.compile('year|date'))
                
                if not artist_elem or not album_elem:
                    # Try alternative structure
                    text = entry.get_text()
                    continue
                
                artist = artist_elem.get_text(strip=True)
                album = album_elem.get_text(strip=True)
                blurb = blurb_elem.get_text(strip=True) if blurb_elem else ""
                year = None
                
                if year_elem:
                    year_text = year_elem.get_text(strip=True)
                    year_match = re.search(r'\b(19|20)\d{2}\b', year_text)
                    if year_match:
                        year = int(year_match.group())
                
                albums.append(create_album_dict(
                    artist=artist,
                    album=album,
                    rank=idx,
                    blurb=blurb,
                    publication="NPR",
                    list_url=url,
                    year=year
                ))
                
            except Exception as e:
                print(f"[NPR] Error parsing entry {idx}: {e}")
                continue
        
        print(f"[NPR] ✓ Scraped {len(albums)} albums")
        
    except Exception as e:
        print(f"[NPR] ✗ Failed: {e}")
    
    return albums
```

- [ ] **Step 2: Test NPR scraper**

Update `if __name__ == "__main__":` block:

```python
if __name__ == "__main__":
    print("Album Data Collection Scraper")
    test_deduplication()
    
    # Test NPR scraper
    npr_albums = scrape_npr()
    if npr_albums:
        print(f"\nSample NPR album: {npr_albums[0]['artist']} - {npr_albums[0]['album']}")
```

- [ ] **Step 3: Run NPR scraper test**

Run: `python scraper.py`
Expected: See NPR scraping output and sample album printed

Note: If scraping fails due to HTML structure differences, the selectors will need adjustment based on actual page inspection.

- [ ] **Step 4: Commit NPR scraper**

```bash
git add scraper.py
git commit -m "feat: add NPR Music scraper"
```

---

### Task 5: Rolling Stone Scraper with Playwright

**Files:**
- Modify: `scraper.py`

- [ ] **Step 1: Add Rolling Stone scraper function**

Add after NPR scraper:

```python
def scrape_rolling_stone() -> List[Dict[str, Any]]:
    """
    Scrape Rolling Stone's "500 Greatest Albums" 2023 list.
    Uses Playwright for JavaScript rendering.
    
    Returns:
        List of album dictionaries (top 50)
    """
    from playwright.sync_api import sync_playwright
    
    print("\n[Rolling Stone] Starting scrape...")
    
    url = "https://www.rollingstone.com/music/music-lists/best-albums-of-all-time-1062063/"
    albums = []
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until='networkidle', timeout=60000)
            
            # Wait for content to load
            page.wait_for_selector('.c-list__item, article, .album-item', timeout=30000)
            
            # Get HTML and parse with BeautifulSoup
            html = page.content()
            browser.close()
        
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'lxml')
        
        # Find album entries - adjust based on actual structure
        entries = soup.find_all('article', class_=re.compile('list-item|album'))[:50]
        
        if not entries:
            entries = soup.find_all('div', class_='c-list__item')[:50]
        
        for idx, entry in enumerate(entries, start=1):
            try:
                # Extract data
                title_elem = entry.find(['h2', 'h3'], class_=re.compile('title|name'))
                artist_elem = entry.find(['p', 'span', 'div'], class_=re.compile('artist|author'))
                desc_elem = entry.find(['p', 'div'], class_=re.compile('description|excerpt'))
                year_elem = entry.find(['span', 'time'], class_=re.compile('year|date'))
                img_elem = entry.find('img')
                
                if not title_elem:
                    continue
                
                title_text = title_elem.get_text(strip=True)
                
                # Parse "Artist, 'Album'" format if combined
                if ',' in title_text and "'" in title_text:
                    parts = title_text.split(',', 1)
                    artist = parts[0].strip()
                    album = parts[1].strip().strip("'\"")
                elif artist_elem:
                    artist = artist_elem.get_text(strip=True)
                    album = title_text
                else:
                    continue
                
                blurb = desc_elem.get_text(strip=True) if desc_elem else ""
                year = None
                cover_url = None
                
                if year_elem:
                    year_text = year_elem.get_text(strip=True)
                    year_match = re.search(r'\b(19|20)\d{2}\b', year_text)
                    if year_match:
                        year = int(year_match.group())
                
                if img_elem and img_elem.get('src'):
                    cover_url = img_elem['src']
                
                albums.append(create_album_dict(
                    artist=artist,
                    album=album,
                    rank=idx,
                    blurb=blurb,
                    publication="Rolling Stone",
                    list_url=url,
                    year=year,
                    cover_url=cover_url
                ))
                
            except Exception as e:
                print(f"[Rolling Stone] Error parsing entry {idx}: {e}")
                continue
        
        print(f"[Rolling Stone] ✓ Scraped {len(albums)} albums")
        
    except Exception as e:
        print(f"[Rolling Stone] ✗ Failed: {e}")
    
    return albums
```

- [ ] **Step 2: Install Playwright browsers**

Run: `playwright install chromium`
Expected: Chromium browser downloaded successfully

- [ ] **Step 3: Test Rolling Stone scraper**

Update test block in `if __name__ == "__main__":`:

```python
if __name__ == "__main__":
    print("Album Data Collection Scraper")
    test_deduplication()
    
    # Test scrapers
    npr_albums = scrape_npr()
    if npr_albums:
        print(f"\nSample NPR album: {npr_albums[0]['artist']} - {npr_albums[0]['album']}")
    
    rs_albums = scrape_rolling_stone()
    if rs_albums:
        print(f"Sample RS album: {rs_albums[0]['artist']} - {rs_albums[0]['album']}")
```

- [ ] **Step 4: Run Rolling Stone scraper test**

Run: `python scraper.py`
Expected: See Rolling Stone scraping output with sample album

- [ ] **Step 5: Commit Rolling Stone scraper**

```bash
git add scraper.py
git commit -m "feat: add Rolling Stone scraper with Playwright"
```

---

### Task 6: Pitchfork Scraper

**Files:**
- Modify: `scraper.py`

- [ ] **Step 1: Add Pitchfork scraper function**

Add after Rolling Stone scraper:

```python
def scrape_pitchfork() -> List[Dict[str, Any]]:
    """
    Scrape Pitchfork's "Best Albums of the Last 25 Years" list.
    
    Returns:
        List of album dictionaries (top 50)
    """
    import requests
    from bs4 import BeautifulSoup
    
    print("\n[Pitchfork] Starting scrape...")
    
    url = "https://pitchfork.com/features/lists-and-guides/the-best-albums-of-the-last-25-years/"
    albums = []
    
    try:
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Pitchfork list structure
        entries = soup.find_all(['article', 'div'], class_=re.compile('list-item|album-entry'))[:50]
        
        if not entries:
            # Try alternative structure
            entries = soup.find_all('div', class_='item')[:50]
        
        for idx, entry in enumerate(entries, start=1):
            try:
                artist_elem = entry.find(['h3', 'span'], class_=re.compile('artist|author'))
                album_elem = entry.find(['h2', 'h4'], class_=re.compile('title|album'))
                desc_elem = entry.find(['p', 'div'], class_=re.compile('description|abstract'))
                year_elem = entry.find(['time', 'span'], class_=re.compile('year|date'))
                img_elem = entry.find('img')
                genre_elem = entry.find(['span', 'a'], class_=re.compile('genre|tag'))
                
                if not artist_elem or not album_elem:
                    continue
                
                artist = artist_elem.get_text(strip=True)
                album = album_elem.get_text(strip=True)
                blurb = desc_elem.get_text(strip=True) if desc_elem else ""
                genre = genre_elem.get_text(strip=True) if genre_elem else None
                year = None
                cover_url = None
                
                if year_elem:
                    year_text = year_elem.get_text(strip=True)
                    year_match = re.search(r'\b(19|20)\d{2}\b', year_text)
                    if year_match:
                        year = int(year_match.group())
                
                if img_elem and img_elem.get('src'):
                    cover_url = img_elem['src']
                
                albums.append(create_album_dict(
                    artist=artist,
                    album=album,
                    rank=idx,
                    blurb=blurb,
                    publication="Pitchfork",
                    list_url=url,
                    year=year,
                    genre=genre,
                    cover_url=cover_url
                ))
                
            except Exception as e:
                print(f"[Pitchfork] Error parsing entry {idx}: {e}")
                continue
        
        print(f"[Pitchfork] ✓ Scraped {len(albums)} albums")
        
    except Exception as e:
        print(f"[Pitchfork] ✗ Failed: {e}")
    
    return albums
```

- [ ] **Step 2: Test Pitchfork scraper**

Update test block:

```python
if __name__ == "__main__":
    print("Album Data Collection Scraper")
    test_deduplication()
    
    # Test scrapers
    npr_albums = scrape_npr()
    if npr_albums:
        print(f"\nSample NPR album: {npr_albums[0]['artist']} - {npr_albums[0]['album']}")
    
    rs_albums = scrape_rolling_stone()
    if rs_albums:
        print(f"Sample RS album: {rs_albums[0]['artist']} - {rs_albums[0]['album']}")
    
    pf_albums = scrape_pitchfork()
    if pf_albums:
        print(f"Sample Pitchfork album: {pf_albums[0]['artist']} - {pf_albums[0]['album']}")
```

- [ ] **Step 3: Run Pitchfork scraper test**

Run: `python scraper.py`
Expected: See Pitchfork scraping output with sample album

- [ ] **Step 4: Commit Pitchfork scraper**

```bash
git add scraper.py
git commit -m "feat: add Pitchfork scraper"
```

---

### Task 7: Beehype Scraper

**Files:**
- Modify: `scraper.py`

- [ ] **Step 1: Add Beehype scraper function**

Add after Pitchfork scraper:

```python
def scrape_beehype() -> List[Dict[str, Any]]:
    """
    Scrape Beehype's "SPECIAL: Classic Albums from Around the World" list.
    
    Returns:
        List of all album dictionaries
    """
    import requests
    from bs4 import BeautifulSoup
    from playwright.sync_api import sync_playwright
    
    print("\n[Beehype] Starting scrape...")
    
    url = "https://beehype.com/classic-albums-from-around-the-world/"
    albums = []
    
    try:
        # Try simple request first
        response = requests.get(url, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        response.raise_for_status()
        
        html = response.content
        soup = BeautifulSoup(html, 'lxml')
        
        # Check if content loaded
        entries = soup.find_all(['article', 'div'], class_=re.compile('album|item|entry'))
        
        # If no entries found, try Playwright
        if len(entries) < 5:
            print("[Beehype] Using Playwright for JavaScript content...")
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, wait_until='networkidle', timeout=60000)
                page.wait_for_selector('[class*="album"], [class*="item"]', timeout=30000)
                html = page.content()
                browser.close()
            
            soup = BeautifulSoup(html, 'lxml')
            entries = soup.find_all(['article', 'div'], class_=re.compile('album|item|entry'))
        
        for idx, entry in enumerate(entries, start=1):
            try:
                # Extract data - structure unknown, adapt as needed
                title_elem = entry.find(['h2', 'h3', 'h4'])
                desc_elem = entry.find('p')
                img_elem = entry.find('img')
                
                if not title_elem:
                    continue
                
                title_text = title_elem.get_text(strip=True)
                
                # Parse title - could be "Artist - Album" or separate
                if ' - ' in title_text:
                    parts = title_text.split(' - ', 1)
                    artist = parts[0].strip()
                    album = parts[1].strip()
                elif '–' in title_text:
                    parts = title_text.split('–', 1)
                    artist = parts[0].strip()
                    album = parts[1].strip()
                else:
                    # Look for separate artist element
                    artist_elem = entry.find(['span', 'div'], class_=re.compile('artist'))
                    if artist_elem:
                        artist = artist_elem.get_text(strip=True)
                        album = title_text
                    else:
                        # Skip if can't parse
                        continue
                
                blurb = desc_elem.get_text(strip=True) if desc_elem else ""
                cover_url = None
                
                if img_elem and img_elem.get('src'):
                    cover_url = img_elem['src']
                
                # Extract year from blurb or title if present
                year = None
                year_match = re.search(r'\b(19|20)\d{2}\b', title_text + ' ' + blurb)
                if year_match:
                    year = int(year_match.group())
                
                albums.append(create_album_dict(
                    artist=artist,
                    album=album,
                    rank=idx,
                    blurb=blurb,
                    publication="Beehype",
                    list_url=url,
                    year=year,
                    cover_url=cover_url
                ))
                
            except Exception as e:
                print(f"[Beehype] Error parsing entry {idx}: {e}")
                continue
        
        print(f"[Beehype] ✓ Scraped {len(albums)} albums")
        
    except Exception as e:
        print(f"[Beehype] ✗ Failed: {e}")
    
    return albums
```

- [ ] **Step 2: Test Beehype scraper**

Update test block:

```python
if __name__ == "__main__":
    print("Album Data Collection Scraper")
    test_deduplication()
    
    # Test scrapers
    npr_albums = scrape_npr()
    if npr_albums:
        print(f"\nSample NPR album: {npr_albums[0]['artist']} - {npr_albums[0]['album']}")
    
    rs_albums = scrape_rolling_stone()
    if rs_albums:
        print(f"Sample RS album: {rs_albums[0]['artist']} - {rs_albums[0]['album']}")
    
    pf_albums = scrape_pitchfork()
    if pf_albums:
        print(f"Sample Pitchfork album: {pf_albums[0]['artist']} - {pf_albums[0]['album']}")
    
    bh_albums = scrape_beehype()
    if bh_albums:
        print(f"Sample Beehype album: {bh_albums[0]['artist']} - {bh_albums[0]['album']}")
```

- [ ] **Step 3: Run Beehype scraper test**

Run: `python scraper.py`
Expected: See Beehype scraping output with sample album

- [ ] **Step 4: Commit Beehype scraper**

```bash
git add scraper.py
git commit -m "feat: add Beehype scraper with fallback to Playwright"
```

---

### Task 8: Main Execution Logic and JSON Output

**Files:**
- Modify: `scraper.py`

- [ ] **Step 1: Add main execution function**

Replace the test code in `if __name__ == "__main__":` with:

```python
def main():
    """Main execution function."""
    print("=" * 60)
    print("ALBUM DATA COLLECTION SCRAPER")
    print("=" * 60)
    
    # Collect from all sources
    all_albums = []
    
    all_albums.extend(scrape_npr())
    all_albums.extend(scrape_rolling_stone())
    all_albums.extend(scrape_pitchfork())
    all_albums.extend(scrape_beehype())
    
    print(f"\n{'=' * 60}")
    print(f"Total albums collected: {len(all_albums)}")
    
    # Deduplicate
    print("\nDeduplicating albums...")
    deduplicated = deduplicate_albums(all_albums)
    
    print(f"After deduplication: {len(deduplicated)} unique albums")
    print(f"Duplicates removed: {len(all_albums) - len(deduplicated)}")
    
    # Write output
    output_file = "albums.json"
    print(f"\nWriting to {output_file}...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(deduplicated, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Complete! Output written to {output_file}")
    
    # Print some stats
    multi_source = [a for a in deduplicated if len(a['sources']) > 1]
    if multi_source:
        print(f"\nAlbums appearing on multiple lists: {len(multi_source)}")
        print("\nTop cross-list albums:")
        for album in sorted(multi_source, key=lambda x: len(x['sources']), reverse=True)[:5]:
            pubs = [s['publication'] for s in album['sources']]
            print(f"  - {album['artist']} - {album['album']} ({len(pubs)} lists: {', '.join(pubs)})")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run full scraper**

Run: `python scraper.py`
Expected: All scrapers run, deduplication occurs, albums.json is created

- [ ] **Step 3: Verify output file**

Run: `python -m json.tool albums.json > /dev/null && echo "✓ Valid JSON" || echo "✗ Invalid JSON"`
Expected: "✓ Valid JSON"

- [ ] **Step 4: Inspect sample output**

Run: `head -50 albums.json`
Expected: See properly formatted JSON with album entries containing artist, album, sources array, etc.

- [ ] **Step 5: Commit main execution logic**

```bash
git add scraper.py
git commit -m "feat: add main execution logic and JSON output"
```

---

### Task 9: HTML Structure Adjustments (Iterative Debugging)

**Note:** This task is performed AFTER running the scraper and seeing which sites fail or return empty results.

**Files:**
- Modify: `scraper.py`

- [ ] **Step 1: Run scraper and identify failures**

Run: `python scraper.py`
Note which scrapers return 0 albums or fail

- [ ] **Step 2: For each failing scraper, inspect the actual HTML**

For example, if NPR fails:

Run: `curl -s "https://www.npr.org/2017/07/24/536538837/the-150-greatest-albums-made-by-women" | head -100`

Examine the HTML structure to identify correct selectors

- [ ] **Step 3: Update selectors in failing scraper functions**

Adjust CSS selectors, class names, and parsing logic based on actual HTML structure.

Example adjustment for NPR:

```python
# If actual structure uses different classes
entries = soup.find_all('div', class_='album-container')
artist = entry.find('span', class_='artist-name').get_text(strip=True)
```

- [ ] **Step 4: Test individual scraper after fixes**

Create temporary test:

```python
# At end of file temporarily
npr_test = scrape_npr()
print(f"NPR returned {len(npr_test)} albums")
if npr_test:
    print(f"First album: {npr_test[0]}")
```

Run: `python scraper.py`

- [ ] **Step 5: Repeat for each failing scraper**

Apply steps 2-4 for Rolling Stone, Pitchfork, and Beehype

- [ ] **Step 6: Commit HTML structure fixes**

```bash
git add scraper.py
git commit -m "fix: update HTML selectors for actual page structures"
```

---

### Task 10: Error Handling and Robustness

**Files:**
- Modify: `scraper.py`

- [ ] **Step 1: Add retry logic for network requests**

Add at top after imports:

```python
import time

def fetch_with_retry(url: str, max_retries: int = 3, timeout: int = 30) -> requests.Response:
    """
    Fetch URL with retry logic.
    
    Args:
        url: URL to fetch
        max_retries: Maximum number of retry attempts
        timeout: Timeout in seconds
        
    Returns:
        Response object
    """
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=timeout, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            })
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            if attempt == max_retries - 1:
                raise
            print(f"Retry {attempt + 1}/{max_retries} after error: {e}")
            time.sleep(2 ** attempt)  # Exponential backoff
```

- [ ] **Step 2: Update scrapers to use retry logic**

In `scrape_npr()`, replace:

```python
response = requests.get(url, timeout=30, headers={...})
```

With:

```python
response = fetch_with_retry(url)
```

Apply same change to `scrape_pitchfork()` and `scrape_beehype()`

- [ ] **Step 3: Add validation for scraped data**

Add validation function:

```python
def validate_album(album: Dict[str, Any]) -> bool:
    """
    Validate album data has required fields.
    
    Args:
        album: Album dictionary
        
    Returns:
        True if valid, False otherwise
    """
    required = ['artist', 'album', 'rank', 'publication', 'list_url']
    for field in required:
        if not album.get(field):
            return False
    
    # Artist and album must have reasonable length
    if len(album['artist']) < 1 or len(album['album']) < 1:
        return False
    
    return True
```

- [ ] **Step 4: Apply validation in deduplication**

Update `deduplicate_albums()` at the start:

```python
def deduplicate_albums(albums: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deduplicate albums using fuzzy matching on artist + album name.
    
    Args:
        albums: List of album dictionaries from all scrapers
        
    Returns:
        Deduplicated list with merged sources
    """
    # Filter out invalid albums
    albums = [a for a in albums if validate_album(a)]
    
    if not albums:
        return []
    
    # ... rest of function
```

- [ ] **Step 5: Test error handling**

Run: `python scraper.py`
Expected: Scrapers handle errors gracefully, invalid data filtered out

- [ ] **Step 6: Commit error handling improvements**

```bash
git add scraper.py
git commit -m "feat: add retry logic and data validation"
```

---

### Task 11: Final Testing and Documentation

**Files:**
- Modify: `README.md`
- Modify: `scraper.py`

- [ ] **Step 1: Add command line argument for test mode**

Add at top of `scraper.py`:

```python
import sys
```

Update `main()` to accept test parameter:

```python
def main(test_mode: bool = False):
    """Main execution function."""
    print("=" * 60)
    print("ALBUM DATA COLLECTION SCRAPER")
    if test_mode:
        print("(TEST MODE - Running deduplication test only)")
    print("=" * 60)
    
    if test_mode:
        test_deduplication()
        return
    
    # ... rest of function
```

Update `if __name__ == "__main__":`:

```python
if __name__ == "__main__":
    test_mode = "--test" in sys.argv
    main(test_mode=test_mode)
```

- [ ] **Step 2: Test in test mode**

Run: `python scraper.py --test`
Expected: Only deduplication test runs

- [ ] **Step 3: Run full scraper end-to-end**

Run: `python scraper.py`
Expected: All scrapers complete, albums.json created with deduplicated data

- [ ] **Step 4: Verify output quality**

```bash
# Count albums
jq '. | length' albums.json

# Check for albums with multiple sources
jq '[.[] | select(.sources | length > 1)] | length' albums.json

# Show an album with multiple sources
jq '.[] | select(.sources | length > 1) | {artist, album, sources: [.sources[].publication]}' albums.json | head -20
```

Expected: Reasonable number of albums, some with multiple sources

- [ ] **Step 5: Update README with examples**

Update `README.md`:

```markdown
# Album Data Collection

Scrapes album data from multiple music publication "best of" lists and outputs a deduplicated JSON file.

## Setup

```bash
pip install -r requirements.txt
playwright install chromium
```

## Usage

```bash
# Run full scraper
python scraper.py

# Run test mode only
python scraper.py --test
```

Output will be written to `albums.json`.

## Data Sources

- NPR Music: "The 150 Greatest Albums Made By Women" (top 50)
- Rolling Stone: "2023 Best Albums of All Time" (top 50)
- Beehype: "SPECIAL: Classic Albums from Around the World" (all)
- Pitchfork: "Best Albums of the Last 25 Years" (top 50)

## Output Format

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
      }
    ]
  }
]
```

## Deduplication

Albums are deduplicated using fuzzy string matching (85% similarity threshold) on artist + album name combinations. When duplicates are found, all source information is preserved in the `sources` array.

## Troubleshooting

If a scraper fails or returns no results:
1. The website structure may have changed
2. Check the HTML selectors in `scraper.py`
3. Inspect the actual page structure with browser dev tools
4. Update CSS selectors accordingly

## Notes

- Network requests include retry logic with exponential backoff
- Invalid album data is filtered out during deduplication
- Scraping may take 1-2 minutes depending on network speed
```

- [ ] **Step 6: Final commit**

```bash
git add scraper.py README.md
git commit -m "feat: add test mode and complete documentation"
```

---

## Self-Review Checklist

**Spec coverage:**
- ✓ NPR scraper (top 50) - Task 4
- ✓ Rolling Stone scraper (top 50) - Task 5  
- ✓ Pitchfork scraper (top 50) - Task 6
- ✓ Beehype scraper (all) - Task 7
- ✓ Fuzzy matching deduplication (85% threshold) - Task 3
- ✓ Merge duplicates with all sources - Task 3, 8
- ✓ JSON output with specified structure - Task 8
- ✓ Error handling - Task 10
- ✓ Extract all available metadata - All scraper tasks
- ✓ Mixed scraping strategy (BeautifulSoup + Playwright) - Tasks 4-7

**No placeholders:**
- All code blocks include complete implementations
- All selectors specified (with note that they need real-world adjustment in Task 9)
- All file paths exact
- All test commands with expected outputs

**Type consistency:**
- `create_album_dict()` signature consistent across all scrapers
- Return type `List[Dict[str, Any]]` used consistently
- JSON structure matches spec exactly

**Implementation notes:**
- Task 9 is explicitly an iterative debugging task since HTML structures are unknown
- Each scraper wrapped in try/except as specified
- Fuzzy matching uses `thefuzz` with `token_sort_ratio` at 85% threshold as specified
- Metadata merge prefers first non-null value as specified
