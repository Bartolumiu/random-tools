# Simple Webtoon Chapter Scraper
# Version: 1.0
# Author: https://github.com/Bartolumiu
# GitHub repository: https://github.com/Bartolumiu/random-tools

import argparse
from bs4 import BeautifulSoup
import requests

def extract_chapters_and_next_page(soup):
    chapters = []
    # Extract chapter information
    for episode_item in soup.find_all('li', class_='_episodeItem'):
        episode_number = episode_item.get('data-episode-no')
        episode_title = episode_item.find('span', class_='subj').text.strip()
        episode_date = episode_item.find('span', class_='date').text.strip()
        episode_url = episode_item.find('a').get('href')
        chapters.append({'number': episode_number, 'title': episode_title, 'date': episode_date, 'url': episode_url})
    
    # Check if there's a next page
    next_page_link = soup.find('a', class_='pg_next')
    if not next_page_link:
        # If there's no next page link, look for the previous episode link, which indicates the next page
        # This is a workaround for Webtoon's inconsistent pagination
        # If I don't do this, for some reason it breaks before the last page
        # Blame Webtoon, not me ¯\_(ツ)_/¯
        next_page_link = soup.find('a', class_='pg_prev')

    next_page = next_page_link.get('href') if next_page_link else None
        
    return chapters, next_page

def scrape_chapter_list(base_url, current_page=1):
    all_chapters = []
    last_observed_page_number = None
    while True:
        try:
            # Construct the URL for the current page
            page_url = f"{base_url}&page={current_page}"
            
            response = requests.get(page_url)
            
            response.raise_for_status()  # Raise an exception for HTTP errors
            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract the last page number if the current page is beyond the last observed page number
            if last_observed_page_number is None or current_page > last_observed_page_number:
                last_observed_page_number = extract_last_page_number(soup)
                if last_observed_page_number is None or current_page > last_observed_page_number:
                    print("Current page is beyond the last observed page number. Breaking loop.")
                    break  # Exit the loop if last page number cannot be extracted
                else:
                    print("Last observed page number:", last_observed_page_number)
            
            print("Checking page number:", current_page)
            chapters_on_page, next_page = extract_chapters_and_next_page(soup)
            
            all_chapters.extend(chapters_on_page)
            
            # Break the loop if there are no more chapters on the page
            if not chapters_on_page:
                print("No chapters found on this page. Breaking loop.")
                break
            
            # Break the loop if the current page is the last page
            if next_page is None:
                print("Reached last page. Breaking loop.")
                break
            
            # Increment current page number 
            current_page += 1
            
        except Exception as e:
            print("Error occurred:", e)
            break  # Exit the loop if an error occurs
    
    return all_chapters

def extract_last_page_number(soup):
    pagination = soup.find('div', class_='paginate')
    if pagination:
        last_page_link = pagination.find_all('a')[-1]
        if last_page_link:
            if last_page_link.get_text().strip() == 'Next Page':
                last_page_link = last_page_link.find_previous('a')
            return int(last_page_link.get_text())
    return None

def parse_arguments():
    parser = argparse.ArgumentParser(description="Scrape chapter list from a Webtoon series")
    parser.add_argument("url", help="URL of the Webtoon series")
    parser.add_argument("--start_page", "--s", "--p", "-s", "-p", type=int, default=1, help="Page number to start scraping from")
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()
    base_url = args.url
    # Exit if the number of start page is less than 1
    if args.start_page < 1:
        print("Start page number should be greater than or equal to 1.")
        exit(1)
    # Not 0 or negative, nice
    start_page = args.start_page
    chapters = scrape_chapter_list(base_url, start_page)
    # Print the extracted chapters
    for chapter in chapters:
        print(chapter)
