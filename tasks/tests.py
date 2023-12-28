from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from crud import *
import os, unittest, re

DB_TEST_URL = "sqlite:///test_db.sqlite"

result = re.search("sqlite:///(.+)$", DB_TEST_URL)
if result and os.path.exists(result.group(1) if result else ""):
  os.remove(result.group(1))

# Define the event listener function
def set_sqlite_pragma(dbapi_connection, connection_record):
  cursor = dbapi_connection.cursor()
  cursor.execute("PRAGMA foreign_keys=ON")
  cursor.close()
  
engine = create_engine(url=DB_TEST_URL)
event.listen(engine, "connect", set_sqlite_pragma)

mapper_registry.metadata.create_all(engine)

class RecordTestCase(unittest.TestCase):

  def test_step_1_add_record(self):
    with Session(engine) as session:
      result = add_record(session, Question, value="What is the candidate's english name?")
      self.assertIsNotNone(result)

  def test_step_2_get_record(self):
    with Session(engine) as session:
      result = get_record(session, Question, value="What is the candidate's english name?")
      self.assertIsNotNone(result)

  def test_step_3_delete_record(self):
    with Session(engine) as session:
        result = delete_record(session, Question, id=1)
        self.assertTrue(result)

  def test_step_4_get_records(self):
    with Session(engine) as session:
      result = get_all_records(session, Question)
      self.assertIsNotNone(result)

  def test_step_5_delete_records(self):
    with Session(engine) as session:
      result = delete_all_records(session, Question)
      self.assertTrue(result)

class JobTestCase(unittest.TestCase):

  def test_step_1_add_job(self):
    with Session(engine) as session:
      form_id = add_record(
        session,
        Form,
        job_title="Software Engineer",
        company_background="We are a tech company specializing in AI solutions",
        job_duties="Develop software applications and conduct testing",
        job_requirements="At least 2 years of experience in software development"
      )
      self.assertIsNotNone(form_id)

      form_id = add_record(
        session,
        Form,
        job_title="AI Engineer",
        company_background="We are a tech company specializing in AI solutions",
        job_duties="Develop software applications and conduct testing",
        job_requirements="At least 2 years of experience in software development"
      )
      self.assertIsNotNone(form_id)

  def test_step_2_get_job(self):
    with Session(engine) as session:
      record = get_record(session, Form, id=1)
      self.assertIsNotNone(record)

  def test_step_4_delete_job(self):
    with Session(engine) as session:
      delete_job = delete_record(session, Form, id=1)
      self.assertTrue(delete_job)

  def test_step_3_get_jobs(self):
    with Session(engine) as session:
      records = db_get_jobs(session)
      self.assertNotEqual(len(records), 0)

class SummaryTestCase(unittest.TestCase):

  def test_step_1_add_summary(self):

    with Session(engine) as session:
      form_id = add_record(
        session,
        Form,
        job_title="Software Engineer",
        job_duties="asdfsadf",
        job_requirements="asdfasdf",
        company_background="asdfasdfasdf",
      )

      result = db_add_summary(session, {
        "What is the candidate's english name?": "Thomas A. Anderson",
        "What is the candidate's email address?": "example@example.com"
      }, form_id)

      self.assertIsNotNone(result)

      result = db_get_all_summaries(session, job_id=3)
      self.assertIsInstance(result, list)

  def test_step_2_get_summary(self):
    with Session(engine) as session:
      result = db_get_summary(session, 3)
      self.assertIsInstance(result, dict)

  def test_step_3_get_summaries(self):
    with Session(engine) as session:
      result = db_get_all_summaries(session, job_id=3)
      self.assertIsInstance(result, list)

  def test_step_4_delete_summary(self):
    with Session(engine) as session:
      result = delete_record(session, Summary, id=1)
      self.assertTrue(result)

  def test_step_5_get_summary_items(self):
    with Session(engine) as session:
      result = get_all_records(session, SummaryItem, summary_id=1)
      self.assertEqual(len(result), 0)

class UserTestCase(unittest.TestCase):

  def test_step_1_register_user(self):
    with Session(engine) as session:
      username = "john"
      password = "password"
      email = "emai@example.com"
      existing_user = session.query(User).filter_by(username=username).first()
      self.assertIsNone(existing_user)

      new_user = User(
        username=username,
        password=password,
        email=email
      )
      session.add(new_user)
      session.commit()

  def test_step_2_login_user(self):
    with Session(engine) as session:
      username = "john"
      password = "password"

      user = session.query(User).filter_by(username=username).first()
      self.assertIsNotNone(user)

  def test_step_3_check_user_role(self):
    with Session(engine) as session:
      username = "john"
      user = session.query(User).filter_by(username=username).first()
      self.assertEqual(user.role, 'user')