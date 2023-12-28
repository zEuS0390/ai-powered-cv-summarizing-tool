# Import necessary modules and libraries
from flask import (
    Flask, 
    render_template, 
    session,
    request, 
    make_response,
    jsonify,
    redirect,
    url_for
)
from celery.exceptions import TimeoutError
import os, json, time, random
from celery import Celery
import jwt

# Create a Flask application instance with session and JWT configuration for secure access
app = Flask(__name__)

# Secret key for Flask session management
app.config['SECRET_KEY'] = 'ecca66a3bd190fc96aac16dc1d1b149cec4ee1b4173b5d84'

# Secret key for JWT (JSON Web Token) authentication
app.config['JWT_SECRET_KEY'] = '7c975dfb9c4e71a67b76b91c2a17f0b678830ecac162f70b'

# Configure Celery settings using environment variables or default values
app.config['CELERY_BROKER_URL'] = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/0')
app.config['CELERY_RESULT_BACKEND'] = os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')
app.config['CELERY_RESULT_EXPIRES'] = 60

# Create a Celery instance
celery = Celery(
    "tasks",
    broker=app.config['CELERY_BROKER_URL'],
    backend=app.config['CELERY_RESULT_BACKEND']
)
celery.conf.update(app.config)

"""
    Celery Workers:
    1. queue1 - worker
    2. queue2 - ai_worker

    Routes and Functions:
    1. generate_access_token
    2. decode_and_validate_token
    3. login_user
    4. logout_user
    5. login_required
    6. requires_role
    7. login
    8. loginTask
    9. register
    10. registerTask
    11. logout
    12. is_token_valid
    13. landing
    14. admin
    15. jobs
    16. summaries
    17. footer
    18. getUsers
    19. getUsersTask
    20. getSettings
    21. getSettingsTask
    22. setSettings
    23. setSettingsTask
    24. getUser
    25. getUserTask
    26. updateUser
    27. updateUserTask
    28. deleteUser
    29. deleteUserTask
    30. getUserSettings
    31. getUserSettingsTask
    32. setUserSettings
    33. setUserSettingsTask
    34. generateQuestions
    35. generateQuestionsTask
    36. addJob
    37. getJobs
    38. deleteJob
    39. upload
    40. cancelUpload
    41. submitToSummarize
    42. submitToSummarizeTask
    43. getSummaries
    44. getSummary
    45. deleteSummary
    46. exportCSV
    47. getContacts
    48. getContactsTask
"""

# Define routes and views

# Helper functions for user authentication and authorization

def generate_access_token(user_id):
    """
    Generate a JWT access token for the given user ID.

    Parameters:
    - user_id (int): The ID of the user.

    Returns:
    - str: JWT access token.
    """
    return jwt.encode({'user_id': user_id}, app.config['JWT_SECRET_KEY'], algorithm='HS256')

def decode_and_validate_token(token):
    """
    Decode and validate a JWT access token.

    Parameters:
    - token (str): JWT access token.

    Returns:
    - dict or None: Decoded token data if valid, None otherwise.
    """
    try:
        decoded_data = jwt.decode(token.split(' ')[1], app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return decoded_data
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_user(user_id):
    """
    Set the user ID in the session to log in the user.

    Parameters:
    - user_id (int): The ID of the user.
    """
    session['user_id'] = user_id

def logout_user():
    """Log out the user by removing the user ID from the session."""
    session.pop('user_id', None)

# Decorators for view function authorization and roles

def login_required(view_function):
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        task = celery.send_task("tasks.get_user", kwargs={"id": user_id}, queue="queue1")
        current_user_id = task.get(timeout=10)
        if not current_user_id:
            return redirect(url_for('login'))
        return view_function(*args, **kwargs)
    return wrapper

def requires_role(required_role):
    def decorator(view_function):
        def wrapper(*args, **kwargs):
            user_id = session.get('user_id')
            task = celery.send_task("tasks.get_user", kwargs={"id": user_id}, queue="queue1")
            user = task.get(timeout=10)
            if user and user['role'] == required_role:
                return view_function(*args, **kwargs)
            else:
                if user and user['role'] == 'admin':
                    return redirect(url_for("admin"))
                elif user and user['role'] == 'user':
                    return redirect(url_for("jobs"))
                else:
                    return redirect("/")
        return wrapper
    return decorator

@app.route("/login", methods=['GET', 'POST'])
def login():
    """
    Handle user login.

    If the request method is POST, initiate a login task using Celery.
    If the login is successful, return a JWT access token.

    Returns:
    - str: JSON response containing the task ID or login status.
    """
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        task = celery.send_task("tasks.login_user", kwargs={"username": username, "password": password}, queue="queue1")
        return make_response(jsonify({'task_id': task.id}), 200)
    return render_template("login.html")

@app.route("/loginTask", methods=['POST'])
def loginTask():
    """
    Handle the result of the login task.

    Returns:
    - str: JSON response containing the task status, user details, and JWT access token.
    """
    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)
    response = {
        "task_status": task_instance.status,
        "message": "",
        "user_id": None,
        "username": None,
        "user_role": None,
        "jwt_access_token": None
    }
    try:
        user = task_instance.get(timeout=5)
        if user:
            response["user_id"] = user['id']
            response["username"] = user['username']
            response["user_role"] = user['role']
            login_user(user['id'])
            response["jwt_access_token"] = generate_access_token(user['id'])
            response["message"] = "Successfully logged in"
        else:
            response["message"] = "Invalid username or password"
    except TimeoutError as e:
        print(e)
    return make_response(jsonify(response), 200)

@app.route("/register", methods=['GET', 'POST'])
def register():
    """
    Handle user registration.

    If the request method is POST, initiate a registration task using Celery.

    Returns:
    - str: JSON response containing the task ID or registration status.
    """
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        email = request.form.get("email")
        task = celery.send_task("tasks.register_user", args=[username, password, email], queue="queue1")
        return make_response(jsonify({"task_id": task.id}), 200)
    return render_template("register.html")

@app.route("/registerTask", methods=['POST'])
def registerTask():
    """
    Handle the result of the registration task.

    Returns:
    - str: JSON response containing the task status and user ID.
    """
    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    task_status = task_instance.status
    response = {
        "task_status": task_status,
        "message": "",
        "user_id": None,
        "register_status": None
    }

    try:
        user_id, message = task_instance.get(timeout=5)
        response["message"] = message
        if user_id:
            response["user_id"] = user_id
            response["register_status"] = "SUCCESS"
        else:
            response["register_status"] = "FAILED"
    except TimeoutError as e:
        print(e) 
    return make_response(jsonify(response), 200)

@app.route('/forgotPassword', methods=['GET', 'POST'])
def forgotPassword():

    if request.method == 'POST':

        email = request.form.get('email')
        reset_link = url_for("reset_password", _external=True)

        # Send a Celery task to execute forgot password
        task = celery.send_task("tasks.forgot_password_user", args=[email, reset_link], queue="queue1")

        return make_response(jsonify({'task_id': task.id}), 200)

    return render_template("forgot_password.html")

@app.route("/verifyResetPassword", methods=["POST"])
def verifyResetPassword():

    user_id = request.form.get("user_id")
    reset_token = request.form.get("reset_token")

    # Send a Celery task to verify reset token
    task = celery.send_task("tasks.verify_password_reset_token", args=[user_id, reset_token], queue="queue1")

    return make_response(jsonify({"task_id": task.id}), 200)

@app.route("/verifyResetPasswordTask", methods=["POST"])
def verifyResetPasswordTask():

    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    task_status = task_instance.status
    response = {
        "task_status": task_status,
        "message": "",
        "verify_reset_password_status": None
    }

    try:
        response["verify_reset_password_status"] = task_instance.get(timeout=5)
    except TimeoutError as e:
        print(e)

    return make_response(jsonify(response), 200)

@app.route("/resetPassword", methods=['GET', 'POST'], endpoint="reset_password")
def resetPassword():
    if request.method == "POST":
        
        user_id = request.form.get("user_id")
        reset_token = request.form.get("reset_token")
        password = request.form.get("password")

        # Send a Celery task to reset the user's password
        task = celery.send_task("tasks.reset_password_user", args=[user_id, reset_token, password], queue="queue1")

        return make_response(jsonify({'task_id': task.id}), 200)

    return render_template("reset_password.html")

# Logout route
@app.route('/logout')
def logout():
    """Handle user logout."""
    logout_user()
    return redirect(url_for('login'))

def is_token_valid(token):
    """
    Validate a JWT access token.

    Parameters:
    - token (str): JWT access token.

    Returns:
    - bool: True if the token is valid, False otherwise.
    """
    decoded_data = decode_and_validate_token(token)
    if decoded_data is None: return False
    # Check if the user is still logged in (e.g., check a server-side session)
    return True if session.get('user_id') == decoded_data.get('user_id') else False

# --------------------------------------------------------------------

# Define routes and views

# Landing View
@app.route("/")
def landing(): 
    """
    Render the landing page.

    Returns:
        HTML template: Landing page template.
    """
    return render_template("landing.html")

@app.route("/admin", endpoint='admin')
@login_required
@requires_role('admin')
def admin(): 
    """
    Render the admin page. Requires login and admin role.

    Returns:
        HTML template: Admin page template.
    """
    return render_template("admin.html")

# Jobs View
@app.route('/jobs', methods=['GET'], endpoint="jobs")
@login_required
@requires_role('user')
def jobs(): 
    """
    Render the jobs page. Requires login and user role.

    Returns:
        HTML template: Jobs page template.
    """
    return render_template('form.html')

# Summaries View
@app.route("/jobs/summaries", methods=["GET"], endpoint="summaries")
@login_required
@requires_role('user')
def summaries(): 
    """
    Render the summaries page. Requires login and user role.

    Returns:
        HTML template: Summaries page template.
    """
    return render_template("candidates.html")

# Footer View
@app.route("/footer")
def footer(): 
    """
    Render the footer page.

    Returns:
        HTML template: Footer page template.
    """
    return render_template("footer.html")


# --------------------------------------------------------------------

# Get Users
@app.route("/getUsers")
def getUsers():
    """
    Get a list of users.

    Returns:
        JSON response: Task ID for the asynchronous operation.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    user_id = decode_and_validate_token(token).get('user_id')

    task = celery.send_task("tasks.get_users", args=[user_id,], queue="queue1")

    return make_response(jsonify({"task_id": task.id}), 200)

# Get Users Task
@app.route("/getUsersTask", methods=["POST"])
def getUsersTask():
    """
    Retrieve the result of the get users operation.

    Returns:
        JSON response: Task status, message, and list of users.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    response = {
        "task_status": task_instance.status,
        "message": "",
        "users": []
    }

    try:
        users = task_instance.get(timeout=5)
        if users:
            response["users"] = users
    except TimeoutError as e:
        print(e)

    return make_response(jsonify(response), 200)

# Get Settings
@app.route("/getSettings")
def getSettings():
    """
    Get system settings.

    Returns:
        JSON response: Task ID for the asynchronous operation.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    user_id = decode_and_validate_token(token).get('user_id')

    task = celery.send_task("tasks.get_settings", queue="queue1")

    return make_response(jsonify({"task_id": task.id}), 200)

# Get Settings Task
@app.route("/getSettingsTask", methods=["POST"])
def getSettingsTask():
    """
    Retrieve the result of the get settings operation.

    Returns:
        JSON response: Task status, message, and system settings.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    response = {
        "task_status": task_instance.status,
        "message": "",
        "settings": None,
    }

    try:
        settings = task_instance.get(timeout=5)
        print(settings)
        if settings:
            response["settings"] = settings
    except TimeoutError as e:
        print(e)

    return make_response(jsonify(response), 200)

# Set Settings
@app.route("/setSettings", methods=["POST"])
def setSettings():
    """
    Set system settings.

    Returns:
        JSON response: Task ID for the asynchronous operation.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    gpt_model = request.form.get("gpt_model")
    gpt_api_key = request.form.get("gpt_api_key")
    formulate_questions_prompt = request.form.get("formulate_questions_prompt")
    summarize_cv_prompt = request.form.get("summarize_cv_prompt")

    sender_email_host = request.form.get("sender_email_host")
    sender_email_port = request.form.get("sender_email_port")
    sender_email_address = request.form.get("sender_email_address")
    sender_email_app_password = request.form.get("sender_email_app_password")
    contacts_wechat = request.form.get("contacts_wechat")
    contacts_phone = request.form.get("contacts_phone")
    contacts_whatsapp = request.form.get("contacts_whatsapp")
    contacts_email = request.form.get("contacts_email")
    contacts_linkedin = request.form.get("contacts_linkedin")

    task = celery.send_task("tasks.set_settings", kwargs={
        "gpt_model": gpt_model,
        "gpt_api_key": gpt_api_key,
        "formulate_questions_prompt": formulate_questions_prompt,
        "summarize_cv_prompt": summarize_cv_prompt,
        "sender_email_host": sender_email_host,
        "sender_email_port": sender_email_port,
        "sender_email_address": sender_email_address,
        "sender_email_app_password": sender_email_app_password,
        "contacts_wechat": contacts_wechat,
        "contacts_phone": contacts_phone,
        "contacts_whatsapp": contacts_whatsapp,
        "contacts_email": contacts_email,
        "contacts_linkedin": contacts_linkedin
    }, queue="queue1")

    return make_response(jsonify({"task_id": task.id}), 200)

# Set Settings Task
@app.route("/setSettingsTask", methods=["POST"])
def setSettingsTask():
    """
    Retrieve the result of the set settings operation.

    Returns:
        JSON response: Task status and message.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    response = {
        "task_status": task_instance.status,
        "message": ""
    }

    try:
        task_instance.get(timeout=5)
    except TimeoutError as e:
        print(e)

    return make_response(jsonify(response), 200)

# Get User
@app.route("/getUser", methods=["POST"])
def getUser():
    """
    Get user information.

    Returns:
        JSON response: Task ID for the asynchronous operation.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    user_id = request.form.get("user_id")

    task = celery.send_task("tasks.get_user", kwargs={"id": int(user_id)}, queue="queue1")

    return make_response(jsonify({"task_id": task.id}), 200)

# Get User Task
@app.route("/getUserTask", methods=["POST"])
def getUserTask():
    """
    Retrieve the result of the get user operation.

    Returns:
        JSON response: Task status, message, and user information.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    response = {
        "task_status": task_instance.status,
        "message": "",
        "user": None
    }

    try:
        user = task_instance.get(timeout=5)
        if user: response["user"] = user
    except TimeoutError as e:
        print(e)

    return make_response(jsonify(response), 200)

@app.route("/addUser", methods=["POST"])
def addUser():
    """
    Add user information.

    Returns:
        JSON response: Task ID for the asynchronous operation.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    username = request.form.get("username")
    password = request.form.get("password")
    email = request.form.get("email")
    role = request.form.get("role")
    gpt_api_key_permission = request.form.get("gpt_api_key_permission")

    task = celery.send_task("tasks.add_user", kwargs={
        "username": username,
        "password": password,
        "email": email,
        "role": role,
        "gpt_api_key_permission": gpt_api_key_permission
    }, queue="queue1")

    return make_response(jsonify({"task_id": task.id}), 200)

@app.route("/addUserTask", methods=["POST"])
def addUserTask():
    """
    Retrieve the result of the add user operation.

    Returns:
        JSON response: Task status, message, and add user status.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    response = {
        "task_status": task_instance.status,
        "message": "",
        "add_user_status": None
    }

    try:
        response["add_user_status"] = task_instance.get(timeout=5)
    except TimeoutError as e:
        print(e)

    return make_response(jsonify(response), 200)

# Update User
@app.route("/updateUser", methods=["POST"])
def updateUser():
    """
    Update user information.

    Returns:
        JSON response: Task ID for the asynchronous operation.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    user_id = request.form.get("id")
    username = request.form.get("username")
    email = request.form.get("email")
    role = request.form.get("role")
    gpt_api_key_permission = request.form.get("gpt_api_key_permission")

    task = celery.send_task("tasks.update_user", args=[user_id,], kwargs={
        "username": username,
        "email": email,
        "role": role,
        "gpt_api_key_permission": gpt_api_key_permission
    }, queue="queue1")

    return make_response(jsonify({"task_id": task.id}), 200)

# Update User Task
@app.route("/updateUserTask", methods=["POST"])
def updateUserTask():
    """
    Retrieve the result of the update user operation.

    Returns:
        JSON response: Task status, message, and update user status.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    response = {
        "task_status": task_instance.status,
        "message": "",
        "update_user_status": None
    }

    try:
        response["update_user_status"] = task_instance.get(timeout=5)
    except TimeoutError as e:
        print(e)

    return make_response(jsonify(response), 200)

# Delete User
@app.route("/deleteUser", methods=["POST"])
def deleteUser():
    """
    Delete a user.

    Returns:
        JSON response: Task ID for the asynchronous operation.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    user_id = request.form.get("user_id")

    task = celery.send_task("tasks.delete_user", args=[user_id,], queue="queue1")

    return make_response(jsonify({"task_id": task.id}), 200)

# Delete User Task
@app.route("/deleteUserTask", methods=["POST"])
def deleteUserTask():
    """
    Retrieve the result of the delete user operation.

    Returns:
        JSON response: Task status, message, and delete user status.
    """
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    response = {
        "task_status": task_instance.status,
        "message": "",
        "delete_user_status": None
    }

    try:
        response["delete_user_status"] = task_instance.get(timeout=5)
    except TimeoutError as e:
        print(e)

    return make_response(jsonify(response), 200)

# --------------------------------------------------------------------

# Route to get user settings
@app.route("/getUserSettings")
def getUserSettings():
    """
    Get user settings endpoint.

    Retrieves user settings by sending an asynchronous task to Celery.

    Returns:
        JSON: Task ID in the response.
    """
    # Get the authorization token from the request headers
    token = request.headers.get('Authorization')
    # Check if the token is valid
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    # Decode the token to get the user ID
    user_id = decode_and_validate_token(token).get('user_id')

    # Send a Celery task to retrieve user settings
    task = celery.send_task("tasks.get_user_settings", kwargs={"id": user_id}, queue="queue1")

    # Return the task ID in the response
    return make_response(jsonify({"task_id": task.id}), 200)


# Route to handle the asynchronous task for getting user settings
@app.route("/getUserSettingsTask", methods=["POST"])
def getUserSettingsTask():
    """
    Get user settings task endpoint.

    Retrieves the result of the asynchronous task for getting user settings.

    Returns:
        JSON: Task status, message, and user settings in the response.
    """
    # Get the authorization token from the request headers
    token = request.headers.get('Authorization')
    # Check if the token is valid
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    # Decode the token to get the user ID
    user_id = decode_and_validate_token(token).get('user_id')

    # Get the task ID from the request form data
    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    # Initialize the response dictionary
    response = {
        "task_status": task_instance.status,
        "message": "",
        "user_settings": None,
    }

    try:
        # Get the result of the task (user settings) with a timeout
        user_settings = task_instance.get(timeout=5)
        if user_settings:
            response["user_settings"] = user_settings
    except TimeoutError as e:
        print(e)

    # Return the response as JSON
    return make_response(jsonify(response), 200)


# Route to set user settings
@app.route("/setUserSettings", methods=["POST"])
def setUserSettings():
    """
    Set user settings endpoint.

    Sets user settings based on the provided preferences, such as GPT API key.

    Returns:
        JSON: Task ID in the response.
    """
    # Get the authorization token from the request headers
    token = request.headers.get('Authorization')
    # Check if the token is valid
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    # Decode the token to get the user ID
    user_id = decode_and_validate_token(token).get('user_id')

    # Get the user's preference for GPT API key (custom or default)
    gpt_api_key_preference = request.form.get('gpt_api_key_preference')

    # Check the preference and set user settings accordingly
    if gpt_api_key_preference == 'custom':
        # If custom, get additional settings (GPT model and API key)
        gpt_model = request.form.get("gpt_model")
        gpt_api_key = request.form.get("gpt_api_key")

        # Send a Celery task to set user settings with custom values
        task = celery.send_task("tasks.set_user_settings", args=[user_id,], kwargs={
            "gpt_model": gpt_model,
            "gpt_api_key": gpt_api_key,
            "gpt_api_key_preference": gpt_api_key_preference
        }, queue="queue1")
    else:
        # If default, send a Celery task to set user settings to default (use system settings)
        task = celery.send_task("tasks.set_user_settings", args=[user_id,], kwargs={
            "gpt_api_key_preference": gpt_api_key_preference
        }, queue="queue1")

    # Return the task ID in the response
    return make_response(jsonify({"task_id": task.id}), 200)


# Route to handle the asynchronous task for setting user settings
@app.route("/setUserSettingsTask", methods=["POST"])
def setUserSettingsTask():
    """
    Set user settings task endpoint.

    Retrieves the result of the asynchronous task for setting user settings.

    Returns:
        JSON: Task status, message, and status of setting user settings in the response.
    """
    # Get the task ID from the request form data
    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    # Initialize the response dictionary
    response = {
        "task_status": task_instance.status,
        "message": "",
        "set_settings_status": None
    }

    try:
        # Get the result of the task (status of setting user settings) with a timeout
        set_settings_status = task_instance.get(timeout=5)
        response["set_settings_status"] = set_settings_status
    except TimeoutError as e:
        print(e)

    # Return the response as JSON
    return make_response(jsonify(response), 200)

# Utilize GPT and Generate Questions
@app.route("/generateQuestions", methods=["POST"])
def generateQuestions():
    """
    Endpoint for generating questions using GPT.

    Extracts user input from the request form, sends a Celery task to formulate questions,
    and returns a task ID for tracking the status.

    Returns:
        JSON response containing the task ID.
    """
    # Retrieve and validate user token from request headers
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    # Extract user_id from the validated token
    user_id = decode_and_validate_token(token).get('user_id')

    # Extract input data from the request form
    company_background = request.form["company_background"]
    job_duties = request.form["job_duties"]
    job_requirements = request.form["job_requirements"]
    manual_questions = request.form["manual_questions"]
    job_title = request.form["job_title"]

    # Send a Celery task to formulate questions using GPT
    async_result = celery.send_task("tasks.formulate_questions", kwargs={
        "user_id": user_id,
        "job_title": job_title,
        "company_background": company_background,
        "job_duties": job_duties,
        "job_requirements": job_requirements,
        "manualquestions": manual_questions
    }, queue="queue2")

    return make_response(jsonify({"task_id": async_result.id}), 200)

@app.route("/generateQuestionsTask", methods=["POST"])
def generateQuestionsTask():
    """
    Endpoint for checking the status of the generated questions task.

    Retrieves the task ID from the request form, checks the status, and returns the result.

    Returns:
        JSON response containing the task status and generated questions.
    """
    # Retrieve task_id from the request form
    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)

    # Initialize status and questions variables
    status = task_instance.status
    questions = []

    try:
        # Get the result from the Celery task with a timeout of 5 seconds
        result = task_instance.get(timeout=5)
        
        # Check the task status and format the questions if successful
        if result[1] == 'SUCCESS':
            try:
                # Parse the generated questions and format them
                questions = result[0].replace('```json', '').replace('```', '')
                generated_questions = json.loads(questions)
                questions = [{"id": i+1, "question": q, "answer": generated_questions[q]} for i, q in enumerate(generated_questions)]
                return make_response(jsonify({"status": status, "task_status": result[1], "questions": questions}), 200)
            except Exception as error:
                # Handle malformed output
                return make_response(jsonify({"status": status, "task_status": 'FAILED', "message": 'The given output is malformed. Try again.'}), 200)
        else:
            # Handle unsuccessful task
            return make_response(jsonify({"status": status, "task_status": result[1], "message": result[0]}), 200)
    except TimeoutError as e:
        print(e)

    return make_response(jsonify({"status": status, "questions": questions}), 200)

# Add job to the database
@app.route("/addJob", methods=["POST"])
def addJob():
    """
    Endpoint for adding a job to the database.

    Retrieves user data and job details from the request form, sends a Celery task to save
    the job details in the database, and returns a success response.

    Returns:
        JSON response indicating the success of the operation.
    """
    if request.method == "POST":

        # Retrieve and validate user token from request headers
        token = request.headers.get('Authorization')
        if not token or not is_token_valid(token):
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Extract form data and add user_id to it
        form_data = json.loads(request.form.get("form"))
        form_data['user_id'] = decode_and_validate_token(token).get('user_id')

        # Extract question data from the request form
        question_data = json.loads(request.form.get("questions"))
        questions = [item["question"] for item in question_data]
        
        # Send a Celery task to save the job details in the database
        question_async_result = celery.send_task("tasks.db_save_job", args=[questions,], kwargs=form_data, queue="queue1")

        # Return a success response
        return make_response(jsonify({}), 200)

    # Return a success response
    return make_response(jsonify({}), 200)


# Retrieve user's jobs
@app.route("/getJobs")
def getJobs():
    """
    Endpoint for retrieving user's jobs.

    Retrieves the user's ID from the token, sends a Celery task to get jobs,
    and returns the list of jobs as a JSON response.

    Returns:
        JSON response containing the user's jobs.
    """
    # Retrieve and validate user token from request headers
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401

    # Extract user_id from the validated token
    user_id = decode_and_validate_token(token).get('user_id')

    # Send a Celery task to get user's jobs
    async_result = celery.send_task("tasks.get_jobs", args=[user_id,], queue="queue1")
    
    # Retrieve the result of the task
    jobs = async_result.get()
    
    # Return jobs as a JSON response
    return make_response(jsonify(jobs), 200)

# Delete a job
@app.route("/deleteJob", methods=["POST"])
def deleteJob():
    """
    Endpoint for deleting a job.

    Retrieves the job ID from the request form, sends a Celery task to delete the job,
    and returns the task ID as a JSON response.

    Returns:
        JSON response containing the task ID for job deletion.
    """
    # Retrieve job_id from the request form
    job_id = request.form.get("job_id")

    # Send a Celery task to delete the job
    task = celery.send_task("tasks.delete_job", args=[job_id,], queue="queue1")
    
    # Wait for the task to complete
    task.get()
    
    # Return the task ID as a JSON response
    return make_response(jsonify({"task_id": task.id}), 200)

# Upload a file
@app.route("/upload", methods=["POST"])
def upload():
    """
    Endpoint for uploading a file.

    Retrieves user information and file details from the request,
    sends a Celery task to save the file in the database, and writes
    the file chunk to the file on the server.

    Returns:
        JSON response indicating success.
    """
    # Retrieve and validate user token from request headers
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Extract user_id from the validated token
    user_id = decode_and_validate_token(token).get('user_id')

    # Retrieve file details from the request
    filename = request.form.get('file-name')
    job_id = request.form.get('job_id')
    chunk = request.files.get("chunk")

    # Send a Celery task to save the file in the database
    async_result = celery.send_task("tasks.db_save_file", args=[filename, job_id, user_id], queue="queue1")

    # Write the file chunk to the file
    with open(os.path.join("files", filename), "ab") as file:
        file.write(chunk.read())

    # Return a success response
    return make_response(jsonify({}), 204)

# Cancel file upload
@app.route("/cancelUpload", methods=["POST"])
def cancelUpload():
    """
    Endpoint for canceling file upload.

    Retrieves user information and file details from the request,
    sends a Celery task to delete the file from the database.

    Returns:
        JSON response indicating success.
    """
    # Retrieve and validate user token from request headers
    token = request.form.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Extract user_id from the validated token
    user_id = decode_and_validate_token(token).get('user_id')

    try:
        # Attempt to remove the file on cancel request
        filename = request.form.get("file-name")
        job_id = request.form.get("job_id")
        async_result = celery.send_task("tasks.db_delete_file", args=[filename, job_id, user_id], queue="queue1")

    except Exception as e:
        # Handle exceptions if any
        data = request.data

    # Return a success response
    return make_response(jsonify({}), 204)


# Route to submit job for summarization
@app.route("/submitToSummarize", methods=["POST"])
def submitToSummarize():

    """
    Submit a job for summarization using ChatGPT.

    Returns:
        JSON: Task ID for tracking the summarization progress.
    """

    # Retrieve and validate user token
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    user_id = decode_and_validate_token(token).get('user_id')

    # Extract job_id from the request form
    job_id = request.form.get("job_id")
    
    # Send a Celery task to summarize CVs using ChatGPT
    async_result = celery.send_task("tasks.summarize_cvs_using_chat_gpt", args=[job_id, user_id], queue="queue2")

    return make_response(jsonify({"task_id": async_result.id}), 200)

# Route to check status of summarization task
@app.route("/submitToSummarizeTask", methods=["POST"])
def submitToSummarizeTask():

    """
    Check the status of a summarization task.

    Returns:
        JSON: Status of the summarization task.
    """

    # Retrieve task_id from the request form
    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)
    status = task_instance.status

    return make_response(jsonify({"status": status}), 200)

# Route to get summaries for a job
@app.route("/getSummaries", methods=["POST"])
def getSummaries():

    """
    Get summaries for a specified job.

    Returns:
        JSON: Summaries for the specified job.
    """

    # Retrieve and validate user token
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    user_id = decode_and_validate_token(token).get('user_id')

    # Extract job_id from the request form
    job_id = request.form.get("job_id")

    # Send a Celery task to get summaries for the specified job
    async_result = celery.send_task("tasks.get_summaries", args=[job_id, user_id], queue="queue1")
    summaries = async_result.get()

    return make_response(jsonify(summaries), 200)

# Route to get a specific summary
@app.route("/getSummary", methods=["POST"])
def getSummary():

    """
    Get a specific summary.

    Returns:
        JSON: Details of the specified summary.
    """

    # Retrieve summary_id from the request form
    summary_id = request.form.get("summary_id")

    # Send a Celery task to get the specified summary
    async_result = celery.send_task("tasks.get_summary", args=[summary_id,], queue="queue1")
    summary = async_result.get()

    return make_response(jsonify(summary), 200)

# Route to delete a summary
@app.route("/deleteSummary", methods=["POST"])
def deleteSummary():

    """
    Delete a specific summary.

    Returns:
        JSON: Result of the deletion operation.
    """

    # Retrieve summary_id from the request form
    summary_id = request.form.get("summary_id")

    # Send a Celery task to delete the specified summary
    async_result = celery.send_task("tasks.delete_summary", args=[summary_id,], queue="queue1")
    result = async_result.get()

    return make_response(jsonify({"RESULT": result}), 200)

# Route to export summaries as CSV
@app.route("/exportCSV", methods=["POST"])
def exportCSV():

    """
    Export summaries for a job as a CSV file.

    Returns:
        CSV: Exported CSV file.
    """

    # Retrieve and validate user token
    token = request.headers.get('Authorization')
    if not token or not is_token_valid(token):
        return jsonify({'error': 'Invalid or expired token'}), 401
    user_id = decode_and_validate_token(token).get('user_id')

    # Extract job_id from the request form
    job_id = request.form.get("job_id")

    # Send a Celery task to export summaries as CSV
    async_result = celery.send_task("tasks.export_summaries_csv", args=[job_id, user_id], queue="queue1")
    output = make_response(async_result.get())
    output.headers["Content-Disposition"] = "attachment; filename=output_file.csv"
    output.headers["Content-type"] = "text/csv"
    
    return output

@app.route("/getContacts")
def getContacts():
    task = celery.send_task("tasks.get_contacts", queue="queue1")
    return make_response(jsonify({"task_id": task.id}), 200)

@app.route("/getContactsTask", methods=["POST"])
def getContactsTask():
    task_id = request.form.get("task_id")
    task_instance = celery.AsyncResult(task_id)
    response = {
        "task_status": task_instance.status,
        "contacts": {}
    }
    try:
        contacts = task_instance.get(timeout=5)
        if contacts: response["contacts"] = contacts
    except TimeoutError as e:
        print(e)

    return make_response(jsonify(response), 200)

# Run the Flask application
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=1235, debug=True)
