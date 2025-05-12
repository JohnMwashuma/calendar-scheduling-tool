import httpx

def get_hubspot_contact_by_email(email, access_token):
    url = "https://api.hubapi.com/crm/v3/objects/contacts/search"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    data = {
        "filterGroups": [{
            "filters": [{
                "propertyName": "email",
                "operator": "EQ",
                "value": email
            }]
        }],
        "properties": ["firstname", "lastname", "email", "phone", "company", "linkedinbio"]
    }
    resp = httpx.post(url, json=data, headers=headers)
    if resp.status_code == 200:
        results = resp.json().get("results", [])
        if results:
            return results[0]["properties"]
    return None 