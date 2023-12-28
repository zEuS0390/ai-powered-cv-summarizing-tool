import argparse
from sqlalchemy.orm import Session
from database import engine
from utils import hash_password
from prompt import formulate_questions_prompt_default, summarize_cv_prompt_default
from crud import add_record, get_record, UserAccount, Setting

def register_user(session, username, password, email, role="user"):
    existing_user = get_record(session, UserAccount, username=username)
    if existing_user:
        return None
    user_id = add_record(session, UserAccount, username=username, password=hash_password(password), email=email, role=role)
    print("REGISTERED USER")
    return user_id

def set_settings(session, settings):
    for name, value in settings.items():
        setting = get_record(session, Setting, name=name)
        if setting:
            setting.value = value
            print(f"SETTING UPDATED: {name}")
        else:
            setting = Setting(name=name, value=value)
            session.add(setting)
            print(f"SETTING ADDED: {name}")

    session.commit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="User Registration and Settings Configuration")

    # Register User
    parser.add_argument("--username", required=True, help="Username for the admin user")
    parser.add_argument("--password", required=True, help="Password for the admin user")
    parser.add_argument("--email", required=True, help="Email for the admin user")

    # Sender Email Settings
    parser.add_argument("--sender_email_host", required=True, help="Sender email host")
    parser.add_argument("--sender_email_port", required=True, help="Sender email port")
    parser.add_argument("--sender_email_address", required=True, help="Sender email for password reset")
    parser.add_argument("--sender_email_app_password", required=True, help="Sender email password for password reset")

    # GPT Settings
    parser.add_argument("--gpt_model", required=True, type=str, help="GPT model name")
    parser.add_argument("--gpt_api_key", required=True, type=str, help="GPT API key")

    args = parser.parse_args()

    with Session(engine) as session:
        # Register User
        user_id = register_user(session, args.username, args.password, args.email, role="admin")

        # Set Sender Email Settings
        set_settings(session, {"sender_email_host": args.sender_email_host, "sender_email_port": args.sender_email_port, "sender_email_address": args.sender_email_address, "sender_email_app_password": args.sender_email_app_password})

        # Set GPT Settings
        set_settings(session, {
            "gpt_model": args.gpt_model,
            "gpt_api_key": args.gpt_api_key,
            "formulate_questions_prompt": formulate_questions_prompt_default,
            "summarize_cv_prompt": summarize_cv_prompt_default
        })
