import os
import openai
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

async def generate_linkedin_summary(profile_data: Dict[str, Any]) -> Optional[str]:
    """
    Use OpenAI to generate a summary of LinkedIn profile data.
    
    Args:
        profile_data: Dictionary containing LinkedIn profile information
        
    Returns:
        A string summary of the profile, or None if generation fails
    """
    if not profile_data:
        return None
        
    try:
        # Extract key elements from profile data
        profile_text = ""
        if profile_data.get('name'):
            profile_text += f"Name: {profile_data['name']}\n"
        if profile_data.get('headline'):
            profile_text += f"Headline: {profile_data['headline']}\n"
        if profile_data.get('location'):
            profile_text += f"Location: {profile_data['location']}\n"
        if profile_data.get('about'):
            profile_text += f"About: {profile_data['about']}\n"
            
        # Add experience
        if profile_data.get('experience'):
            profile_text += "\nExperience:\n"
            for exp in profile_data['experience']:
                profile_text += f"- {exp}\n"
                
        # Add education
        if profile_data.get('education'):
            profile_text += "\nEducation:\n"
            for edu in profile_data['education']:
                profile_text += f"- {edu}\n"
                
        # Add skills
        if profile_data.get('skills'):
            profile_text += "\nSkills: " + ", ".join(profile_data['skills'])
            
        # If we have raw HTML but no structured data, pass a simplified prompt
        if profile_data.get('raw_html') and not profile_text.strip():
            prompt = f"""
            I have HTML content from a LinkedIn profile, but I can't parse it effectively.
            Please analyze it and provide a professional summary of this person including:
            
            1. Their likely professional background
            2. Key skills or expertise areas
            3. Experience level (entry, mid, senior)
            4. Industries they've worked in
            5. Educational background if evident
            
            Keep the summary concise but informative (max 200 words).
            """
        else:
            prompt = f"""
            Please provide a professional summary of this LinkedIn profile:
            
            {profile_text}
            
            Focus on their expertise, experience level, industry background, and what makes their 
            background relevant. Keep the summary concise but informative (max 200 words).
            """
            
        # Call OpenAI API
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a professional assistant that summarizes LinkedIn profiles concisely and accurately."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        summary = response.choices[0].message.content.strip()
        return summary
        
    except Exception as e:
        logger.error(f"Error generating LinkedIn summary: {e}")
        return None 