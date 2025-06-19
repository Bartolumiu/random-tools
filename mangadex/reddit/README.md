# MangaDex Reddit Bot

Automatically apply flair and reply to posts on r/mangadex when users report site issues.

## Requirements
- Python 3.x
- `praw` library (`pip install praw`)

## Configuration
1. Create a Reddit script app [here](https://www.reddit.com/prefs/apps).
2. Set the following environment variables or edit the script directly:
   - `CLIENT_ID`
   - `CLIENT_SECRET`
   - `USER_AGENT`
   - `USERNAME`
   - `PASSWORD`
3. Update `FLAIR_ID`, `INFO_POST_URL`, and `DISCORD_URL` in `the_site_is_okay_bot.py`.

## Usage
```pwsh
python the_site_is_okay_bot.py
```

## License
GPL-3.0
