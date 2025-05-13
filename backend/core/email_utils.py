import smtplib
from email.mime.text import MIMEText
from core.config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM

def send_email(to_email, subject, body, from_email=EMAIL_FROM):
    msg = MIMEText(body, "plain")
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            print(f"Sending email to {to_email} from {from_email}")
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(from_email, [to_email], msg.as_string())
    except Exception as e:
        print(f"Error sending email: {e}")
        # Optionally, re-raise or handle as needed 