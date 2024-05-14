# Series scraper for Webtoons
# Version: 1.0
# Author: https://github.com/Bartolumiu
# GitHub repository: https://github.com/Bartolumiu/random-tools
# This tool creates a JSON file with some important attributes about the series in the following format:
'''
{
  "title_no": {
    "title_slug": "sampleslug",
    "genre": "samplegenre",
    "language": "locale"
  }
}
'''

from bs4 import BeautifulSoup
import requests
import json

GENRES = ["drama", "fantasy", "comedy", "action", "slice-of-life", "romance", "super-hero", "sf", "thriller", "supernatural", "mystery", "sports", "historical", "heartwarming", "horror", "tiptoon"]
LANGUAGES = ["en", "zh-hant", "th", "id", "es", "fr", "de"]

def extract_title_info(soup, genre, language):
    title_info_dict = {}
    # Extract title information
    for card_item in soup.find_all('a', class_='card_item'):
        title_slug = card_item.get('href').split('/')[-2]
        title_no = card_item.get('href').split('=')[-1]
        title_info_dict[title_no] = {"title_slug": title_slug, "genre": genre, "language": language}
        
    return title_info_dict

def scrape_title_list(genre, language):
    title_info_dict = {}
    try:
        url = f"https://www.webtoons.com/{language}/genres/{genre}"
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        soup = BeautifulSoup(response.text, 'html.parser')

        print(f"[Webtoon] Checking for title information in {language}...")

        title_info_dict = extract_title_info(soup, genre, language)

    except Exception as e:
        print("[Webtoon] Error occurred:", e)

    return title_info_dict

if __name__ == "__main__":
    all_titles_info = {}
    for language in LANGUAGES:
        for genre in GENRES:
            titles_info = scrape_title_list(genre, language)
            all_titles_info.update(titles_info)
    
    # Export the extracted title information to JSON
    with open("titles_info.json", "w") as outfile:
        json.dump(all_titles_info, outfile)
