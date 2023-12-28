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

# Task for formulating questions using ChatGPT
@celery.task(name="tasks.formulate_questions")
def formulate_questions(user_id, job_title, company_background, job_duties, job_requirements, manualquestions):
    with Session(engine) as session:
        user = get_record(session, UserAccount, id=user_id)
        if user:
            settings = { setting.name: setting.value for setting in get_all_records(session, Setting) }
            formulate_questions_prompt = settings.get('formulate_questions_prompt')
            if user.gpt_api_key_preference == 'default' and user.gpt_api_key_permission == 'default':
                gpt_api_key = settings.get('gpt_api_key')
                gpt_model = settings.get('gpt_model')
                return formulate_question_using_chat_gpt(gpt_api_key, gpt_model, formulate_questions_prompt, job_title, company_background, job_duties, job_requirements, manualquestions)
            else:
                return formulate_question_using_chat_gpt(user.gpt_api_key, user.gpt_model, formulate_questions_prompt, job_title, company_background, job_duties, job_requirements, manualquestions)

# Task for summarizing CVs using ChatGPT
@celery.task(name="tasks.summarize_cvs_using_chat_gpt")
def summarize_cvs_using_chat_gpt(job_id, user_id):

    with Session(engine) as session:

        user = get_record(session, UserAccount, id=user_id)
        db_files = get_all_records(session, TempFile, form_id=job_id)
        db_questions = session.query(Question).join(Form).join(UserAccount).filter(and_(Form.id == job_id, UserAccount.id == user_id)).all()
        db_form = get_all_records(session, Form, id=job_id, user_account_id=user_id)[0]

        questions = [question.value for question in db_questions]

        summarize_cv_prompt = db_form.summarize_cv_prompt
        settings = { setting.name: setting.value for setting in get_all_records(session, Setting) }
        if user.gpt_api_key_preference == 'default' and user.gpt_api_key_permission == 'default':
            gpt_api_key = settings.get('gpt_api_key')
            gpt_model = settings.get('gpt_model')
        else:
            gpt_api_key = user.gpt_api_key
            gpt_model = user.gpt_model

        for db_file in db_files:

            filename: str = db_file.filename
            
            filepath = os.path.join(BASE_DIR, "files", filename)

            if filename.endswith(".pdf") or filename.endswith(".PDF"):
                text = extract_text_from_pdf(filepath)
            elif filename.endswith(".docx") or filename.endswith(".DOCX"):
                text = extract_text_from_docx(filepath)
            else:
                continue

            n = 0
            attempts = 1
            while True:
                
                summary_str = summarize_using_chat_gpt(
                    text,
                    gpt_api_key,
                    gpt_model,
                    summarize_cv_prompt,
                    questions,
                    db_form.job_title, 
                    db_form.company_background, 
                    db_form.job_duties, 
                    db_form.job_requirements
                )

                if n != 20 and summary_str[1] == 'SUCCESS':
                    try:
                        summary_str = summary_str[0].replace('```json', '').replace('```', '')
                        summary = json.loads(summary_str)

                        summary_id = db_add_summary(
                            session,
                            dict(zip(questions, [str(value) for value in summary.values()])),
                            job_id
                        )

                        db_file.summary_id = summary_id
                        db_file.form_id = None

                        session.commit()

                        n = len(summary)
                        break
                    except Exception as error:
                        print("error:", error)
                        continue
                
                attempts += 1
                if attempts > 3:
                    break
