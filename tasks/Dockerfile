# Use the latest Ubuntu base image
FROM ubuntu:latest

# Set the working directory inside the container
WORKDIR /tasks

# Copy the contents of the current directory into the container's working directory
COPY . /tasks

# Update package list and install Python 3 and pip
RUN apt update -y \
    && apt install python3-pip python3-venv -y \
    && apt install libpq-dev -y

RUN python3 -m venv /venv

# Install Python dependencies listed in requirements.txt
RUN /venv/bin/python -m pip install --upgrade pip \
    && /venv/bin/python -m pip install --no-cache-dir -r requirements.txt

# Set environment variables for Celery to use Redis as the broker and result backend
ENV CELERY_BROKER_URL redis://redis:6379/0
ENV CELERY_RESULT_BACKEND redis://redis:6379/0
ENV DATABASE_URI=$DATABASE_URI
ENV GPT_API_KEY=$API_KEY
