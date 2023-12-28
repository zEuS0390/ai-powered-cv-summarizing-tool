# Importing necessary modules and components for the Flask app and background 
from sqlalchemy.orm import Session
from io import StringIO
from celery import Celery
from database import engine
from datetime import datetime, timedelta
import os, json, csv
from prompt import *
from forgot_password import *
from utils import *
from crud import *

# Defining the base directory for file operations
BASE_DIR = os.path.dirname(os.path.realpath(__file__))

# Configuring Celery for background task execution
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

celery = Celery(
    "tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND
)

# Task for saving a job and associated questions to the database
@celery.task(name="tasks.db_save_job")
def db_save_job(questions: list, **kwargs):
    with Session(engine) as session:
        try:
            user = get_record(session, UserAccount, id=kwargs["user_id"])
            if user:
                settings = { setting.name: setting.value for setting in get_all_records(session, Setting) }
                job_id = add_record(
                    session,
                    Form, 
                    user_account_id=user.id,
                    job_title=kwargs["job_title"], 
                    company_background=kwargs["company_background"], 
                    job_duties=kwargs["job_duties"], 
                    job_requirements=kwargs["job_requirements"],
                    manual_questions=kwargs["manual_questions"],
                    summarize_cv_prompt=settings.get("summarize_cv_prompt")
                )
                for question in questions:
                    add_record(session, Question, value=question, form_id=job_id)
        except Exception as e:
            print("error;", e)

# Task for saving a file associated with a job to the database
@celery.task(name="tasks.db_save_file")
def db_savefile(filename: str, job_id, user_id):
    with Session(engine) as session: 
        existing_tempfile = get_record(session, TempFile, filename=filename, form_id=job_id)
        if existing_tempfile: return existing_tempfile.id
        return add_record(session, TempFile, filename=filename, form_id=job_id)

# Task for deleting a file associated with a job from the database and filesystem
@celery.task(name="tasks.db_delete_file")
def db_delete_file(filename: str, job_id, user_id):
    with Session(engine) as session:
        try:
            filepath = os.path.join(BASE_DIR, "files", filename)
            os.remove(filepath)
            return delete_record(session, TempFile, filename=filename, form_id=job_id)
        except Exception as error:
            print(error)

# Task for retrieving all summaries associated with a job
@celery.task(name="tasks.get_summaries")
def get_summaries(job_id, user_id):
    with Session(engine) as session: return db_get_all_summaries(session, job_id, user_id)

# Task for retrieving a specific summary by its ID
@celery.task(name="tasks.get_summary")
def get_summary(summary_id):
    with Session(engine) as session: return db_get_summary(session, summary_id)

# Task for deleting a summary by its ID
@celery.task(name="tasks.delete_summary")
def delete_summary(summary_id):
    with Session(engine) as session: return delete_record(session, Summary, id=summary_id)

# Task for exporting all summaries associated with a job to a CSV file
@celery.task(name="tasks.export_summaries_csv")
def export_summaries_csv(job_id, user_id):
    with Session(engine) as session:
        stringio = StringIO()
        questions = [question.value for question in get_all_records(session, Question, form_id=job_id)]
        summaries = [summary["summary_items"] for summary in db_get_all_summaries(session, job_id, user_id)]
        rows = []
        for summary in summaries:
            row = {}
            values = list(summary.values())
            for index, value in enumerate(values):
                row[questions[index]] = values[index]
            rows.append(row)
        if len(summaries) > 0:
            dict_writer = csv.DictWriter(stringio, fieldnames=questions)
            dict_writer.writeheader()
            dict_writer.writerows(rows)
            return stringio.getvalue()
    return []

# Task for retrieving all jobs associated with a user account
@celery.task(name="tasks.get_jobs")
def get_jobs(user_id):
    with Session(engine) as session:
        return db_get_jobs(session, user_id)

# Task for deleting a job by its ID
@celery.task(name="tasks.delete_job")
def delete_job(job_id):
    with Session(engine) as session:
        return delete_record(session, Form, id=job_id)

# --------------------------------------------------------------------
# Additional tasks related to user management and settings

@celery.task(name="tasks.forgot_password_user")
def forgot_password_user(email, reset_link):
    # Establish a database session
    with Session(engine) as session:

        # Retrieve user information based on the provided email
        user = get_record(session, UserAccount, email=email)

        # Retrieve email address and email app password from settings
        sender_email_host = get_record(session, Setting, name='sender_email_host')
        sender_email_port = get_record(session, Setting, name='sender_email_port')
        sender_email_address = get_record(session, Setting, name='sender_email_address')
        sender_email_app_password = get_record(session, Setting, name='sender_email_app_password')
        
        # Check if user and necessary settings are available
        if user and sender_email_host and sender_email_port and sender_email_address and sender_email_app_password:
            # Generate a unique reset token
            reset_token = generate_reset_token()
            expiration_time = 3600
            created_at = datetime.utcnow().isoformat()
            expired_at = (datetime.utcnow() + timedelta(seconds=expiration_time)).isoformat()
            
            # Check if a password reset token already exists for the user_account
            password_reset_token = get_record(session, PasswordResetToken, user_account=user)
            result = False
            
            # Update or add a new password reset token based on the existence
            if password_reset_token:
                result = update_record(
                    session, 
                    PasswordResetToken, 
                    {
                        "user_account_id": user.id
                    },
                    {
                        "token": reset_token, 
                        "created_at": created_at,
                        "expired_at": expired_at
                    }
                )
            else:
                result = add_record(session, PasswordResetToken, user_account=user, token=reset_token, expired_at=expired_at)
            
            # If the update or addition was successful, send a reset email
            if result:
                send_reset_email(**{
                    "sender_email_host": sender_email_host.value,
                    "sender_email_port": sender_email_port.value,
                    "sender_email_address": sender_email_address.value, 
                    "sender_email_app_password": sender_email_app_password.value,
                    "user_id": user.id,
                    "user_email": email,
                    "reset_link": reset_link,
                    "reset_token": reset_token
                })
                return True
        # Return False if any required information is missing
        return False

@celery.task(name="tasks.reset_password_user")
def reset_password_user(user_id, reset_token, password):
    # Establish a database session
    with Session(engine) as session:
        # Retrieve user information based on the provided user_id
        user = get_record(session, UserAccount, id=user_id)
        # Check if the user exists
        if user:
            # Retrieve the password reset token associated with the provided token
            password_reset_token = get_record(session, PasswordResetToken, token=reset_token)
            
            # Check if the password reset token is valid and belongs to the user
            if password_reset_token and password_reset_token.user_account_id == user.id:
                # Check if the token is within its expiration time
                if password_reset_token.created_at < password_reset_token.expired_at:
                    # Update the user's password, delete the token, and commit the changes
                    user.password = hash_password(password)
                    session.delete(password_reset_token)
                    session.commit()
                    return True
    # Return False if any step fails
    return False

@celery.task(name="tasks.verify_password_reset_token")
def verify_password_reset_token(user_id, reset_token):
    try:
        # Establish a database session
        with Session(engine) as session:
            # Retrieve user information based on the provided user_id
            user = get_record(session, UserAccount, id=user_id)

            # Early exit if the user does not exist
            if not user:
                return False

            # Retrieve the password reset token associated with the provided token
            password_reset_token = get_record(session, PasswordResetToken, token=reset_token)

            # Check if the password reset token is valid and belongs to the user
            if password_reset_token and password_reset_token.created_at < password_reset_token.expired_at:
                return True

    except Exception as e:
        # Handle database or other exceptions (log, raise, etc.)
        print(f"An error occurred: {e}")

    return False

# Task for registering a new user
@celery.task(name="tasks.register_user")
def register_user(username, password, email):
    with Session(engine) as session:
        existing_user = get_record(session, UserAccount, username=username)
        existing_email = get_record(session, UserAccount, email=email)
        if existing_user: return None, "User already exist!"
        if existing_email: return None, "Email already used!"
        user_id = add_record(session, UserAccount, username=username, password=hash_password(password), email=email)
        return user_id, "User registered"

# Task for retrieving user information by various criteria
@celery.task(name="tasks.get_user")
def get_user(**kwargs):
    with Session(engine) as session:
        user = get_record(session, UserAccount, **kwargs)
        if user:
            return {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role,
                "gpt_api_key_permission": user.gpt_api_key_permission
            }

# Task for user login authentication
@celery.task(name="tasks.login_user")
def login_user(username, password):
    with Session(engine) as session:
        user = get_record(session, UserAccount, username=username)
        if user:
            if verify_password(password, user.password):
                return {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "password": user.password,
                    "role": user.role
                }

# Task for retrieving user settings
@celery.task(name="tasks.get_user_settings")
def get_user_settings(id):
    with Session(engine) as session:
        user = get_record(session, UserAccount, id=id)
        if user:
            return {
                "gpt_model": user.gpt_model,
                "gpt_api_key": user.gpt_api_key,
                "gpt_api_key_permission": user.gpt_api_key_permission,
                "gpt_api_key_preference": user.gpt_api_key_preference
            }

# Task for updating user settings
@celery.task(name="tasks.set_user_settings")
def set_user_settings(
        user_id,
        gpt_api_key_preference=None,
        gpt_model=None, 
        gpt_api_key=None
    ):
    with Session(engine) as session:
        user = get_record(session, UserAccount, id=user_id)
        if user:
            user.gpt_model = gpt_model if gpt_model else user.gpt_model
            user.gpt_api_key = gpt_api_key if gpt_api_key else user.gpt_api_key
            user.gpt_api_key_preference = gpt_api_key_preference if gpt_api_key_preference else user.gpt_api_key_preference
            session.commit()
            return True
        return False

# Tasks for user management

# Task for retrieving information about all users (excluding the requesting user)
@celery.task(name="tasks.get_users")
def get_users(user_id):
    with Session(engine) as session:
        users = get_all_records(session, UserAccount)
        if users:
            result = []
            for user in users:
                if int(user_id) != user.id:
                    result.append({
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                        "gpt_api_key_permission": user.gpt_api_key_permission
                    })
            return result

# Task for retrieving all application settings
@celery.task(name="tasks.get_settings")
def get_settings():
    with Session(engine) as session:
        settings = get_all_records(session, Setting)
        if settings:
            result = {setting.name: setting.value for setting in settings}
            return result

# Task for updating application settings
@celery.task(name="tasks.set_settings")
def set_settings(**kwargs):
    with Session(engine) as session:
        for name, value in kwargs.items():
            setting = get_record(session, Setting, name=name)
            if setting:
                setting.value = value
                session.commit()
            else:
                setting = Setting()
                setting.name = name
                setting.value = value
                session.add(setting)
                session.commit()

@celery.task(name="tasks.add_user")
def add_user(**kwargs):
    with Session(engine) as session:
        kwargs["password"] = hash_password(kwargs["password"])
        user_id = add_record(session, UserAccount, **kwargs)
        if user_id:
            return True
        return False

# Task for deleting a user by ID
@celery.task(name="tasks.delete_user")
def delete_user(user_id):
    with Session(engine) as session:
        return delete_record(session, UserAccount, id=user_id)

# Task for updating user information
@celery.task(name="tasks.update_user")
def update_user(user_id, **kwargs):
    with Session(engine) as session:
        return update_record(session, UserAccount, {"id": user_id}, kwargs)

@celery.task(name="tasks.get_contacts")
def get_contacts():
    with Session(engine) as session:
        settings = get_all_records(session, Setting)
        if settings:
            result = {}
            for setting in settings:
                if setting.name.startswith("contacts_"): 
                    result[setting.name] = setting.value
            return result