import httpx
import re
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

def is_valid_linkedin_url(url: str) -> bool:
    """Check if the given URL is a valid LinkedIn profile URL."""
    if not url:
        return False
        
    # Add https if not present
    if not url.startswith(('http://', 'https://')):
        url = f'https://{url}'
        
    parsed = urlparse(url)
    return (parsed.netloc == 'www.linkedin.com' or 
            parsed.netloc == 'linkedin.com') and '/in/' in parsed.path

def extract_linkedin_username(url: str) -> Optional[str]:
    """Extract the LinkedIn username from a URL."""
    if not url:
        return None
        
    # Add https if not present
    if not url.startswith(('http://', 'https://')):
        url = f'https://{url}'
    
    # Use regex to find the username
    match = re.search(r'linkedin\.com/in/([^/]+)', url)
    if match:
        return match.group(1)
    return None

async def scrape_linkedin_profile(url: str) -> Optional[Dict[str, Any]]:
    """
    Scrape basic information from a LinkedIn profile.
    
    Note: This is a simplified version and might not work reliably due to 
    LinkedIn's anti-scraping measures. For production use, consider using
    official LinkedIn APIs or third-party services.
    """
    if not is_valid_linkedin_url(url):
        logger.warning(f"Invalid LinkedIn URL: {url}")
        return None
        
    # Add https if not present
    if not url.startswith(('http://', 'https://')):
        url = f'https://{url}'
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, follow_redirects=True, timeout=10.0)
            if response.status_code != 200:
                logger.warning(f"Failed to fetch LinkedIn profile: {response.status_code}")
                return None
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract basic information
            data = {
                'name': None,
                'headline': None,
                'location': None,
                'about': None,
                'experience': [],
                'education': [],
                'skills': [],
                'raw_html': response.text  # Keep the raw HTML for AI processing
            }
            
            # This is simplified and likely won't work due to LinkedIn's dynamic loading
            # and anti-scraping measures. A more reliable approach would be to use
            # LinkedIn's official API or third-party services.
            return data
            
    except Exception as e:
        logger.error(f"Error scraping LinkedIn profile: {e}")
        return None 