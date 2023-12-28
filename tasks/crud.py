# Importing necessary modules and SQLAlchemy models
from sqlalchemy.orm import relationship
from sqlalchemy import (
    Column, Integer, 
    Text, ForeignKey,
    String, and_
)
from sqlalchemy.exc import (
    NoResultFound, 
    SQLAlchemyError
)
from io import StringIO
import os, json, csv
from models import *

# Function to add a record to the database
def add_record(session, model_class, **kwargs):
    """
    Add a record to the database.

    Parameters:
    - model_class: The SQLAlchemy model class for the table.
    - **kwargs: Keyword arguments representing the column values for the new record.

    Returns:
    - The ID of the added record if successful, None otherwise.
    """
    try:
        record = model_class(**kwargs)
        session.add(record)
        session.flush()
        session.commit()
        return record.id
    except SQLAlchemyError as error:
        print(error)

# Function to retrieve a single record from the database
def get_record(session, model_class, **kwargs):
    """
    Retrieve a single record from the database.

    Parameters:
    - model_class: The SQLAlchemy model class for the table.
    - **kwargs: Keyword arguments representing the filter criteria.

    Returns:
    - The retrieved record if found, None otherwise.
    """
    return session.query(model_class).filter_by(**kwargs).scalar()

# Function to update a record in the database
def update_record(session, model_class, target: dict, update: dict):
    """
    Update a record in the database.

    Parameters:
    - model_class: The SQLAlchemy model class for the table.
    - id: The ID of the record to be updated.
    - **kwargs: Keyword arguments representing the updated column values.

    Returns:
    - True if the update is successful, False otherwise.
    """
    try:
        record = get_record(session, model_class, **target)
        if record:
            for key, value in update.items():
                setattr(record, key, value)
            session.commit()
            return True
    except SQLAlchemyError as error:
        print("error", error)
    return False

# Function to delete a record from the database
def delete_record(session, model_class, **kwargs):
    """
    Delete a record from the database.

    Parameters:
    - model_class: The SQLAlchemy model class for the table.
    - **kwargs: Keyword arguments representing the filter criteria.

    Returns:
    - True if the deletion is successful, False otherwise.
    """
    try:
        record = session.query(model_class).filter_by(**kwargs).first()
        session.delete(record)
        session.commit()
        return True
    except SQLAlchemyError as error:
        print("error", error)
    return False

# Function to delete all records from a table
def delete_all_records(session, model_class):
    """
    Delete all records from a table in the database.

    Parameters:
    - model_class: The SQLAlchemy model class for the table.

    Returns:
    - True if all records are deleted successfully, False otherwise.
    """
    try:
        session.query(model_class).delete()
        session.commit()
        return True
    except SQLAlchemyError as error:
        print("error:", error)
        return False

# Function to retrieve all records from a table
def get_all_records(session, model_class, **kwargs):
    """
    Retrieve all records from a table in the database.

    Parameters:
    - model_class: The SQLAlchemy model class for the table.

    Returns:
    - A list of records from the specified table.
    """
    try:
        return session.query(model_class).filter_by(**kwargs).all()
    except SQLAlchemyError as error:
        print("error: ", error)
    return None

# Function to add a summary to the database
def db_add_summary(session, summary_data, job_id):
    """
    Add a summary to the database.

    Parameters:
    - session: The SQLAlchemy session.
    - summary_data: A dictionary containing summary details.
    - job_id: The ID of the job associated with the summary.

    Returns:
    - The ID of the added summary if successful, None otherwise.
    """
    try:
        job = get_record(session, Form, id=job_id)
        summary = Summary()
        session.add(summary)
        session.flush()
        for title in summary_data:
            summary_item = SummaryItem()
            summary_item.summary = summary
            summary_item.title = title
            summary_item.description = summary_data[title]
            session.add(summary_item)
        job.summaries.append(summary)
        session.flush()
        session.commit()
        return summary.id
    except SQLAlchemyError as error:
        print("error", error)

# Function to retrieve summary details from the database
def db_get_summary(session, summary_id):
    """
    Retrieve summary details from the database.

    Parameters:
    - session: The SQLAlchemy session.
    - summary_id: The ID of the summary.

    Returns:
    - A dictionary containing summary details if found, an empty dictionary otherwise.
    """
    summary = get_record(session, Summary, id=summary_id)
    summary_details = {}
    if summary:
        summary_details["summary_id"] = summary.id
        summary_details["summary_items"] = {}
        summary_items = session.query(SummaryItem).join(Summary).filter(SummaryItem.summary_id == summary_id).all()
        for summary_item in summary_items:
            summary_details["summary_items"][summary_item.title] = summary_item.description
    return summary_details

# Function to retrieve all summaries associated with a job
def db_get_all_summaries(session, job_id, user_id):
    """
    Retrieve all summaries associated with a job and user_account from the database.

    Parameters:
    - session: The SQLAlchemy session.
    - job_id: The ID of the job.
    - user_id: The ID of the user_account.

    Returns:
    - A list of dictionaries containing summary details.
    """
    result = []
    summaries = session.query(Summary).join(Form).join(UserAccount).filter(and_(Form.id == job_id, UserAccount.id == user_id)).all()
    for summary in summaries:
        summary_details = {"summary_id": summary.id, "summary_items": {}}
        for summary_item in summary.summary_items:
            summary_details["summary_items"][summary_item.title] = summary_item.description
        result.append(summary_details)
    return result

# Function to retrieve details of all jobs associated with a user_account
def db_get_jobs(session, user_id):
    """
    Retrieve details of all jobs associated with a user_account from the database.

    Parameters:
    - session: The SQLAlchemy session.
    - user_id: The ID of the user_account.

    Returns:
    - A list of dictionaries containing job details.
    """
    result = []
    jobs = get_all_records(session, Form, user_account_id=user_id)
    for job in jobs:
        summaries = session.query(Summary).filter_by(form_id=job.id).count()
        job_details = {
            "id": job.id,
            "job_title": job.job_title,
            "summaries": summaries,
            "company_background": job.company_background,
            "job_duties": job.job_duties,
            "job_requirements": job.job_requirements
        }
        result.append(job_details)
    return result
