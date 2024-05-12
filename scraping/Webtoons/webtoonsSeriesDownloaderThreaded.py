import argparse
from bs4 import BeautifulSoup
import requests
import os
import threading

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

def download_images(chapter_url, series_id, chapter_number, force_download=False):
    # Set the referer header
    headers = {
        'Referer': 'https://webtoons.com/'
    }

    # Make an HTTP GET request to fetch the HTML content
    response = requests.get(chapter_url, headers=headers)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse HTML
        soup = BeautifulSoup(response.content, 'html.parser')

        # Find the div containing images
        image_div = soup.find('div', id='_imageList')

        # Extract all image tags within the div
        image_tags = image_div.find_all('img', class_='_images')

        # Create a directory to save the images
        series_directory = os.path.join('images', str(series_id))
        chapter_directory = os.path.join(series_directory, str(chapter_number))
        os.makedirs(chapter_directory, exist_ok=True)

        # Download and save images
        for i, img_tag in enumerate(image_tags, start=1):
            img_url = img_tag['data-url']
            img_filename = os.path.join(chapter_directory, f"{str(i).zfill(3)}.jpg")
            # Check if the image file already exists
            if not force_download and os.path.exists(img_filename):
                print(f"Skipped: {img_filename} (Already downloaded)")
                continue
            img_response = requests.get(img_url, headers=headers)
            with open(img_filename, 'wb') as img_file:
                img_file.write(img_response.content)
            print(f"Downloaded: {img_filename}")
    else:
        print(f"Failed to fetch chapter images from {chapter_url}")

def download_images_threaded(chapters, thread_count=4, force_download=False):
    threads = []
    for chapter in chapters:
        series_id = base_url.split('=')[-1].split('&')[0]
        thread = threading.Thread(target=download_images, args=(chapter['url'], series_id, chapter['number'], force_download))
        threads.append(thread)
        thread.start()
        if len(threads) >= thread_count:
            for t in threads:
                t.join()
            threads = []
    for thread in threads:
        thread.join()

def parse_arguments():
    parser = argparse.ArgumentParser(description="Scrape chapter list from a Webtoon series")
    parser.add_argument("url", help="URL of the Webtoon series")
    parser.add_argument("--start_page", "--s", "--p", "-s", "-p", type=int, default=1, help="Page number to start scraping from")
    parser.add_argument("--threads", "-t", type=int, default=4, help="Number of threads for concurrent downloading")
    parser.add_argument("--force", "-f", action="store_true", help="Force download even if images already exist")
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
    download_images_threaded(chapters, args.threads, args.force)
