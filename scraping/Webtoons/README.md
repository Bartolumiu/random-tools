# Webtoons Scraper

Tools for scraping and downloading Webtoon chapters and metadata.

## Requirements
- Python 3.x
- `requests`, `beautifulsoup4` (`pip install -r requirements.txt`)

## Scripts

### WebtoonsChapterScraper.py
List chapter metadata:
```pwsh
python WebtoonsChapterScraper.py https://www.webtoons.com/... --start_page 1
```

### webtoonsSeriesDownloader.py
Download images for a series (single-threaded):
```pwsh
python webtoonsSeriesDownloader.py https://www.webtoons.com/... --start_page 1
```

### webtoonsSeriesDownloaderThreaded.py
Download images concurrently:
```pwsh
python webtoonsSeriesDownloaderThreaded.py https://www.webtoons.com/... -t 4
```

### webtoonsSeriesScraper.py
Scrape series list by genre and language:
```pwsh
python webtoonsSeriesScraper.py
```

## License
MIT
