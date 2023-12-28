# Importing necessary modules from SQLAlchemy and other dependencies
from sqlalchemy.orm import relationship
from sqlalchemy import (
    DateTime, Column, Integer, Text, ForeignKey, String, event
)
from sqlalchemy.orm import registry
from prompt import formulate_questions_prompt_default, summarize_cv_prompt_default
from datetime import datetime
import os

# Defining the base directory for file operations
BASE_DIR = os.path.dirname(os.path.realpath(__file__))

# Creating a SQLAlchemy registry
mapper_registry = registry()

"""

    Tables:
    
    1. Setting
    2. UserAccount
    3. Form
    4. TempFile
    5. Question
    6. Summary
    7. SummaryItem

"""

# Defining the Setting table
@mapper_registry.mapped
class Setting:
    __tablename__ = "setting"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    value = Column(Text, nullable=False)

# Defining the User table
@mapper_registry.mapped
class UserAccount:
    __tablename__ = "user_account"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(Text, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    role = Column(String(20), nullable=False, default='user')
    gpt_api_key_preference = Column(Text, default='custom')
    gpt_api_key_permission = Column(Text, default='custom')  # default or custom option
    gpt_model = Column(String(20))
    gpt_api_key = Column(Text)
    forms = relationship('Form', back_populates="user_account", cascade="all, delete", passive_deletes=True)
    password_reset_tokens = relationship('PasswordResetToken', back_populates="user_account", cascade="all, delete", passive_deletes=True)

@mapper_registry.mapped
class PasswordResetToken:
    __tablename__ = "password_reset_token"
    id = Column(Integer, primary_key=True)
    user_account_id = Column(Integer, ForeignKey('user_account.id', ondelete="CASCADE"))
    user_account = relationship("UserAccount", back_populates="password_reset_tokens")
    token = Column(String(100), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expired_at = Column(DateTime, nullable=False)

# Defining the Form table
@mapper_registry.mapped
class Form:
    __tablename__ = "form"
    id = Column(Integer, primary_key=True)
    job_title = Column(String(length=200))
    company_background = Column(Text)
    job_duties = Column(Text)
    job_requirements = Column(Text)
    manual_questions = Column(Text)
    summarize_cv_prompt = Column(Text, default=summarize_cv_prompt_default)
    user_account_id = Column(Integer, ForeignKey('user_account.id', ondelete="CASCADE"))
    user_account = relationship("UserAccount", back_populates="forms")
    tempfiles = relationship(
        'TempFile',
        back_populates="form",
        cascade="all, delete",
        passive_deletes=True
    )
    questions = relationship(
        "Question",
        back_populates="form",
        cascade="all, delete",
        passive_deletes=True
    )
    summaries = relationship(
        "Summary",
        back_populates="form",
        cascade="all, delete",
        passive_deletes=True
    )

# Defining the TempFile table
@mapper_registry.mapped
class TempFile:
    __tablename__ = "temp_file"
    id = Column(Integer, primary_key=True)
    filename = Column(String(length=200))
    form_id = Column(Integer, ForeignKey('form.id', ondelete="CASCADE"))
    form = relationship("Form", back_populates="tempfiles")
    summary_id = Column(Integer, ForeignKey("summary.id", ondelete="CASCADE"))
    summary = relationship("Summary", back_populates="tempfiles")

# Defining the Question table
@mapper_registry.mapped
class Question:
    __tablename__ = "question"
    id = Column(Integer, primary_key=True)
    form_id = Column(Integer, ForeignKey("form.id", ondelete="CASCADE"))
    form = relationship("Form", back_populates="questions")
    value = Column(Text)

# Defining the Summary table
@mapper_registry.mapped
class Summary:
    __tablename__ = "summary"
    id = Column(Integer, primary_key=True)
    form_id = Column(Integer, ForeignKey("form.id", ondelete="CASCADE"))
    form = relationship("Form", back_populates="summaries")
    summary_items = relationship(
        "SummaryItem",
        back_populates="summary",
        cascade="all, delete",
        passive_deletes=True
    )
    tempfiles = relationship(
        'TempFile',
        back_populates="summary",
        cascade="all, delete",
        passive_deletes=True
    )

# Defining the SummaryItem table
@mapper_registry.mapped
class SummaryItem:
    __tablename__ = "summary_item"
    id = Column(Integer, primary_key=True)
    summary_id = Column(Integer, ForeignKey("summary.id", ondelete="CASCADE"))
    summary = relationship('Summary', back_populates='summary_items')
    title = Column(Text)
    description = Column(Text)

# Event Hook Before Deleting a TempFile Instance
@event.listens_for(Summary, "before_delete")
def summary_before_delete(mapper, connect, target: Summary):
    for temp_file in target.tempfiles:
        try:
            # Constructing the file path and removing the file
            filepath = os.path.join(BASE_DIR, "files", temp_file.filename)
            os.remove(filepath)
            print(f"[TempFile DELETE SUCCESS]: {filepath}")
        except Exception as err:
            print(f"[TempFile '{temp_file.filename}' DELETE ERROR]: {err}")
