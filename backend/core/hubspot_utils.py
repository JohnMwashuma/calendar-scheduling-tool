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
        "properties": [
            "firstname", "lastname", "email", "phone", "company", "linkedinbio"
        ]
    }
    resp = httpx.post(url, json=data, headers=headers)
    if resp.status_code == 200:
        results = resp.json().get("results", [])
        if results:
            return results[0]["properties"]
    return None 

def get_hubspot_contact_by_email_with_notes(email, access_token):
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
        "properties": [
            "firstname",
            "lastname",
            "email",
            "phone",
            "company",
            "linkedinbio"
        ]
    }
    resp = httpx.post(url, json=data, headers=headers)
    if resp.status_code != 200:
        return None

    results = resp.json().get("results", [])
    if not results:
        return None

    contact = results[0]
    contact_id = contact["id"]
    contact_properties = contact["properties"]

    notes_url = "https://api.hubapi.com/crm/v3/objects/notes/search"
    search_payload = {
        "filterGroups": [
            {
                "filters": [
                    {
                        "propertyName": "associations.contact",
                        "operator": "EQ",
                        "value": contact_id
                    }
                ]
            }
        ],
        "properties": ["hs_note_body"]
    }
    notes_resp = httpx.post(notes_url, json=search_payload, headers=headers)
    notes = []
    if notes_resp.status_code == 200:
        for note in notes_resp.json().get("results", []):
            notes.append({
                "id": note["id"],
                "content": note["properties"].get("hs_note_body", ""),
                "createdAt": note.get("createdAt"),
                "updatedAt": note.get("updatedAt"),
            })
    contact_properties["notes"] = notes
    return contact_properties 