# Use an image
FROM ubuntu:latest

# Set the working directory here
WORKDIR /app

# Copy the current directory contents into the container here
COPY . /app

RUN apt update -y
RUN apt install python3-pip python3-venv -y

RUN python3 -m venv /venv

# Install any needed packages
RUN /venv/bin/python -m pip install --upgrade pip \ 
    && /venv/bin/python -m pip install --no-cache-dir -r requirements.txt

# Make port 1235 available to the world outside this container
EXPOSE 1235

# Set environment variables for Celery to use Redis as the broker and result backend
ENV CELERY_BROKER_URL redis://redis:6379/0
ENV CELERY_RESULT_BACKEND redis://redis:6379/0
ENV PYTHONUNBUFFERED=1

# Run app.py when the container launches
CMD ["/venv/bin/gunicorn", "--workers", "3", "--bind", "0.0.0.0:1235", "--log-level", "debug", "wsgi:app"]
