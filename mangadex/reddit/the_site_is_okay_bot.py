import praw
import re
import logging
from praw.exceptions import APIException, RedditAPIException

# Credentials zone, client type must be "script" or it won't work!
CLIENT_ID = 'CLIENT_ID'
CLIENT_SECRET = 'CLIENT_SECRET'
USER_AGENT = 'dex_working_bot/1.0 by Bartolumiu'
USERNAME = 'BOT_ACCOUNT_USERNAME'
PASSWORD = 'BOT_ACCOUNT_PASSWORD'

# Other details
SUBREDDIT = 'mangadex'
INFO_POST_URL = 'https://www.reddit.com/r/mangadex/comments/ruhtsx'
DISCORD_URL = 'https://discord.gg/mangadex'
FLAIR_ID = 'THE_SITE_IS_FINE_FLAIR_ID'  # Replace with the actual flair ID ~Bartolumiu

# Automated message disclaimer with modmail link
BOT_DISCLAIMER = f"\n\n---\n\nThis message was sent by a bot. If you have any issues or concerns, please report them using [modmail](https://www.reddit.com/message/compose/?to=/r/{SUBREDDIT}&subject=Issues%20with%20bot%20{USERNAME})."

# Crappy regex that might or might not work...
patterns = [
    r"website\s+(is\s+)?down",
    r"website\s+(is\s+)?not\s+working",
    r"site\s+(is\s+)?down",
    r"site\s+(is\s+)?not\s+working",
    r"server\s+(is\s+)?down",
    r"server\s+(is\s+)?not\s+working",
    r"(no|not)\s+working",
    r"not\s+working"
]

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger()

def check_title(title):
    """ Check if the title matches any of the patterns. """
    return any(re.search(pattern, title, re.IGNORECASE) for pattern in patterns)

def apply_flair(submission):
    """ Apply flair to the submission using the flair ID. """
    try:
        # Apply the flair to the submission using the flair ID
        submission.flair.select(FLAIR_ID)
        logger.debug(f"Applied flair with ID '{FLAIR_ID}' to post: {submission.title}")
    except APIException as e:
        logger.error(f"APIException occurred while applying flair: {e}")
    except RedditAPIException as e:
        logger.error(f"RedditAPIException occurred while applying flair: {e}")
    except Exception as e:
        logger.error(f"An error occurred while applying flair: {e}")

def reply_to_post(submission):
    """ Reply to the post with diagnostic message and automated message disclaimer. """
    try:
        # Reply with the diagnostic message and automated message disclaimer
        reply_message = f"Please check this post for troubleshooting: {INFO_POST_URL}.\n\nIf that doesn't resolve the issue, join our Discord server: {DISCORD_URL}{BOT_DISCLAIMER}"
        submission.reply(reply_message)
        logger.debug(f"Replied to post: {submission.title}")
    except APIException as e:
        logger.error(f"APIException occurred while replying: {e}")
    except RedditAPIException as e:
        logger.error(f"RedditAPIException occurred while replying: {e}")
    except Exception as e:
        logger.error(f"An error occurred while replying: {e}")

def process_posts():
    """ Fetch posts, check titles, apply flair, and reply. """
    try:
        # Initialize the Reddit instance
        reddit = praw.Reddit(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            user_agent=USER_AGENT,
            username=USERNAME,
            password=PASSWORD
        )

        # Define the subreddit
        subreddit = reddit.subreddit(SUBREDDIT)
        logger.debug(f"Fetching posts from r/{SUBREDDIT}")

        # Track posts that the bot has already replied to
        replied_posts = set()
        
        # Fetch the latest posts
        for submission in subreddit.new(limit=10):  # Adjust the limit as needed
            logger.debug(f"Title: {submission.title}")

            # Skip posts that have already been replied to
            if submission.id in replied_posts:
                continue

            if check_title(submission.title):
                apply_flair(submission)
                reply_to_post(submission)
                # Mark this post as replied
                replied_posts.add(submission.id)

    except APIException as e:
        logger.error(f"APIException occurred while fetching posts: {e}")
    except RedditAPIException as e:
        logger.error(f"RedditAPIException occurred while fetching posts: {e}")
    except Exception as e:
        logger.error(f"An error occurred: {e}")

# Run the function
process_posts()
