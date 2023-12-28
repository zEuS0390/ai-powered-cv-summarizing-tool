from smtplib import SMTPConnectError, SMTPAuthenticationError, SMTPException
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib, secrets, ssl

def generate_reset_token():
    return secrets.token_urlsafe(20)

def generate_url(url, **kwargs):
    # Simulate building a URL with parameters
    if kwargs:
        params = '&'.join([f'{key}={value}' for key, value in kwargs.items()])
        url += f'?{params}'
    return url

def send_reset_email(sender_email_host, sender_email_port, sender_email_address, sender_email_app_password, user_id, user_email, reset_link, reset_token):

    try:
  
        subject = 'Password Reset'
        html_body = f"""
            <html>
                <body>
                    <p>We received a request to reset the password for your account. If you didn't make this request, you can ignore this email. No changes will be made to your account.
                    <br>
                    <p>To reset your password, click the following link: <a href="{generate_url(reset_link, user_id=user_id, token=reset_token)}">Reset Password</a></p>
                </body>
            </html>
            """

        msg = MIMEMultipart('alternative')
        msg['From'] = sender_email_address
        msg['To'] = user_email
        msg['Subject'] = subject

        html = MIMEText(html_body, 'html')
        msg.attach(html)

        with smtplib.SMTP(sender_email_host, 587, timeout=2) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(sender_email_address, sender_email_app_password)
            server.sendmail(sender_email_address, [user_email], msg.as_string())
    
    except (SMTPConnectError, SMTPAuthenticationError, SMTPException) as e:
        print(f"Error: Unable to send email. {e}")

    except OSError as e:
        print(f"Error: Unable to send email. {e}")