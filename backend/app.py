import os
import csv
from io import StringIO
from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import desc, func, or_
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename   
from flask_cors import CORS 
from flasgger import Swagger
from flask_caching import Cache
from datetime import datetime as DateTime
from celery import Celery
import requests
from celery.schedules import crontab
from flask_mail import Mail, Message
from datetime import datetime
from flask import session
from flask_login import UserMixin
from flask_login import login_user, logout_user
from flask_login import LoginManager
from flask_login import current_user, login_required
import schedule
import time
import threading
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import datetime
from flask import Flask

from googleapiclient.discovery import build

from apscheduler.schedulers.background import BackgroundScheduler






# Initialize Flask App
app = Flask(__name__, template_folder='../frontend', static_folder='../frontend', static_url_path='/static')
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"
# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your_secret_key'
app.secret_key = "your_super_secret_key"

# Initialize Database
db = SQLAlchemy(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Models
class User(db.Model,UserMixin):
    __tablename__ = "users"  # Explicitly define table name
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(10), nullable=False)  # "admin" or "user"


class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    chapters = db.relationship("Chapter", backref="subject", cascade="all, delete", lazy=True)  # One-to-many relationship

class Chapter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"), nullable=False)
    name = db.Column(db.String(100), nullable=False)



class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100),nullable=False)
    chapter_id = db.Column(db.Integer, db.ForeignKey("chapter.id"), nullable=False)
    date_of_quiz = db.Column(db.Date, nullable=False)
    time_duration = db.Column(db.String(10), nullable=False)
    chapter = db.relationship("Chapter", backref=db.backref("quizzes", lazy=True))


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    question_statement = db.Column(db.Text, nullable=False)
    option1 = db.Column(db.String(255), nullable=False)
    option2 = db.Column(db.String(255), nullable=False)
    option3 = db.Column(db.String(255), nullable=False)
    option4 = db.Column(db.String(255), nullable=False)
    correct_option = db.Column(db.Integer, nullable=False)
    quiz = db.relationship("Quiz", backref=db.backref("questions", lazy=True))


class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)  # Fixed foreign key reference
    total_score = db.Column(db.Integer, nullable=False)
    timestamp_of_attempt = db.Column(db.DateTime, default=datetime.datetime.utcnow)


class QuizAttempt(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # ✅ Corrected foreign key reference
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    attempt_time = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    user = db.relationship('User', backref='quiz_attempts')
    quiz = db.relationship('Quiz', backref='attempts')

# Celery Configuration (Moved Above Initialization)
app.config['broker_url'] = 'redis://localhost:6379/0'
app.config['result_backend'] = 'redis://localhost:6379/0'

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['result_backend'],
        broker=app.config['broker_url'] 
    )
    celery.conf.update(app.config)
    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return super().__call__(*args, **kwargs)
    celery.Task = ContextTask
    return celery

celery = make_celery(app)
CORS(app, resources={r"/api/*": {"origins": ["http://127.0.0.1:5173", "http://localhost:5173"]}}, supports_credentials=True)


# File Upload Settings
app.config['UPLOAD_FOLDER'] = 'uploads/'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

# Cache Configuration
cache = Cache(app, config={
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 30,
    'CACHE_REDIS_HOST': 'localhost',
    'CACHE_REDIS_PORT': 6379,
    'CACHE_REDIS_DB': 0
})



# Swagger Configuration
swagger = Swagger(app)

# JWT Manager
jwt = JWTManager(app)


@app.route('/')
def index():
  """
  Home Page
  ---
  tags:
    - Home
  responses:
    200:
      description: Returns the rendered HTML for the homepage
  """
  return render_template('index.html') 

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')

    if not email or not password or not full_name:
        return jsonify({"error": "Missing required fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(email=email, password=hashed_password, full_name=full_name, role="user")

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201



# ✅ Admin Login (Session-based)
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    admin = User.query.filter_by(email=email, role="admin").first()
    if not admin or not check_password_hash(admin.password, password):
        return jsonify({"error": "Invalid admin credentials"}), 401

    # Set session for logged-in admin
    session["user_id"] = admin.id
    session["role"] = "admin"

    return jsonify({"message": "Admin logged in successfully", "role": "admin"}), 200
    

@app.route('/api/user/login', methods=['POST'])
def user_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email, role="user").first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid user credentials"}), 401
    login_user(user)
    # Set session for logged-in user
    session["user_id"] = user.id
    session["role"] = "user"

    return jsonify({"message": "User logged in successfully", "role": "user"}), 200


# ✅ Logout (Session-based for both Admin & User)
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()  # Clears the session
    return jsonify({"message": "Logged out successfully"}), 200

# ✅ Admin Dashboard (Protected)
@app.route('/admin/dashboard', methods=['GET'])
def admin_dashboard():
    if "user_id" not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify({"message": "Welcome to Admin Dashboard"}), 200


# ✅ Fetch all subjects (Session-based for admin)
@app.route('/api/admin/subject', methods=['GET'])
def get_subjects():
    if "user_id" not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    subjects = Subject.query.all()
    subjects_data = [{"id": sub.id, "name": sub.name, "description": sub.description} for sub in subjects]
    return jsonify(subjects_data), 200




# ✅ Add a new subject (Session-based for admin)
@app.route('/api/admin/add-subject', methods=['POST'])
def add_subject():
    if 'user_id' not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    name = data.get('name')
    description = data.get('description', '')

    if not name:
        return jsonify({"error": "Subject name is required"}), 400

    new_subject = Subject(name=name, description=description)
    db.session.add(new_subject)
    db.session.commit()

    return jsonify({"message": "Subject added successfully", "subject_id": new_subject.id}), 201




# ✅ Get subject details by ID (Session-based for admin)
@app.route('/api/admin/subject/<int:subject_id>', methods=['GET'])
def get_subject(subject_id):
    if "user_id" not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    return jsonify({
        "id": subject.id,
        "name": subject.name,
        "description": subject.description
    }), 200


# ✅ Edit an existing subject (Session-based for admin)
@app.route('/api/admin/edit-subject/<int:subject_id>', methods=['PUT'])
def edit_subject(subject_id):
    if "user_id" not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    data = request.json
    subject.name = data.get('name', subject.name)
    subject.description = data.get('description', subject.description)

    db.session.commit()
    return jsonify({"message": "Subject updated successfully"}), 200


# ✅ Delete a subject (Session-based for admin)
@app.route('/api/admin/subject/<int:subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    if 'user_id' not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    db.session.delete(subject)
    db.session.commit()
    return jsonify({"message": "Subject deleted successfully"}), 200


@app.route('/api/admin/subject/<int:subject_id>/chapters', methods=['GET'])
def get_chapters(subject_id):
    if 'user_id' not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    subject = Subject.query.get(subject_id)
    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    chapters = [{"id": ch.id, "name": ch.name} for ch in subject.chapters]
    return jsonify(chapters), 200

@app.route('/api/admin/chapter', methods=['POST'])
def add_chapter():
    if 'user_id' not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    if not data.get("subject_id") or not data.get("name"):
        return jsonify({"error": "Missing chapter details"}), 400

    subject = Subject.query.get(data["subject_id"])
    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    new_chapter = Chapter(name=data["name"], subject_id=data["subject_id"])
    db.session.add(new_chapter)
    db.session.commit()

    return jsonify({"message": "Chapter added successfully", "chapter_id": new_chapter.id}), 201

@app.route('/api/admin/chapter/<int:chapter_id>', methods=['PUT'])
def edit_chapter(chapter_id):
    if 'user_id' not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    chapter = Chapter.query.get(chapter_id)
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404

    data = request.json
    if not data.get("name"):
        return jsonify({"error": "Missing chapter details"}), 400

    chapter.name = data["name"]
    db.session.commit()

    return jsonify({"message": "Chapter updated successfully"}), 200



@app.route("/api/admin/chapter/<int:chapter_id>", methods=["GET"])
def get_chapter(chapter_id):
    chapter = Chapter.query.get(chapter_id)
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404
    return jsonify({"id": chapter.id, "name": chapter.name})

@app.route('/api/admin/subject/<int:subject_id>/chapter/<int:chapter_id>', methods=['DELETE'])
def delete_chapter(subject_id, chapter_id):
    # Check if user is logged in and is an admin
    if 'user_id' not in session or session.get("role") != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    # Find the chapter to delete
    chapter = Chapter.query.filter_by(id=chapter_id, subject_id=subject_id).first()
    if not chapter:
        return jsonify({"error": "Chapter not found"}), 404

    db.session.delete(chapter)
    db.session.commit()
    return jsonify({"message": "Chapter deleted successfully"}), 200







# Fetch all quizzes for a specific chapter
@app.route("/api/admin/subject/<int:subject_id>/chapter/<int:chapter_id>/quizzes", methods=["GET"])
def get_quizzes(subject_id, chapter_id):
    
    quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
    if not quizzes:
        print("no quizes")
        return jsonify({"message": "No quizzes available"}), 200
    return jsonify([{
        "id": quiz.id,
        "name": quiz.name,
        "date_of_quiz": quiz.date_of_quiz.strftime("%Y-%m-%d"),
        "time_duration": quiz.time_duration
    } for quiz in quizzes])

@app.route('/api/admin/subject/<int:subject_id>/chapter/<int:chapter_id>', methods=['GET'])
def get_chapter_details(subject_id, chapter_id):
    chapter = Chapter.query.filter_by(id=chapter_id, subject_id=subject_id).first()
    subject = Subject.query.filter_by(id=subject_id).first()

    if not chapter or not subject:
        return jsonify({'error': 'Chapter or Subject not found'}), 404

    return jsonify({
        'chapter_id': chapter.id,
        'chapter_name': chapter.name,
        'subject_id': subject_id,
        'subject_name': subject.name
    })





# 📧 Function to send emails
def send_email(to_email, subject, body):
    sender_email = "23b115@psgitech.ac.in"
    sender_password = "cshk nvpw flga werq"

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = to_email

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
        
    except Exception as e:
        print("❌ Error sending email:", e)

# 🔔 Function to send reminders for inactive users
def send_daily_reminders():
    inactive_days_threshold = 3  # Number of days of inactivity before reminder
    last_active_threshold = datetime.datetime.utcnow() - datetime.timedelta(days=inactive_days_threshold)

    # Fetch inactive users (those who haven't logged in for `inactive_days_threshold` days)
    inactive_users = User.query.filter(User.last_login < last_active_threshold).all()

    # Get the **nearest** upcoming quiz deadline
    upcoming_quiz = Quiz.query.filter(Quiz.date_of_quiz >= datetime.date.today()).order_by(Quiz.date_of_quiz).first()

    if upcoming_quiz:
        deadline_info = f"The next quiz is '{upcoming_quiz.name}' on {upcoming_quiz.date_of_quiz}."
    else:
        deadline_info = "No upcoming quizzes at the moment."

    for user in inactive_users:
        subject = "Reminder: Stay Active & Attempt Quizzes!"
        body = f"""
        Hello {user.username},

        You haven't been active on the quiz platform recently. Don't forget to attempt the latest quizzes!

        {deadline_info}

        Visit the platform now and participate!

        Regards,  
        Quiz Platform Team
        """
        send_email(user.email, subject, body)

# 🚀 Notify all users about a new quiz
def notify_users_about_new_quiz(quiz):
    users = User.query.all()  # Get all users

    for user in users:
        subject = f"New Quiz Available: {quiz.name}"
        body = f"""
        Hello {user.full_name},

        A new quiz '{quiz.name}' has been created on {quiz.date_of_quiz}.
        Make sure to attempt it before the deadline!

        Visit the platform to participate now.

        Regards,  
        Quiz Platform Team
        """
        send_email(user.email, subject, body)

# 🕕 Schedule the daily reminder job at 6 PM every day
scheduler = BackgroundScheduler()
scheduler.add_job(send_daily_reminders, 'cron', hour=18, minute=0)
scheduler.start()

# 📝 Add a new quiz and notify users
@app.route("/api/admin/subject/<int:subject_id>/chapter/<int:chapter_id>/quiz", methods=["POST"])
def add_quiz(subject_id, chapter_id):
    data = request.json

    new_quiz = Quiz(
        chapter_id=chapter_id,
        date_of_quiz=datetime.datetime.strptime(data["date_of_quiz"], "%Y-%m-%d").date(),
        name=data.get("name"),
        time_duration=data["time_duration"]
    )

    db.session.add(new_quiz)
    db.session.commit()

    # 🔔 Notify all users that a new quiz is available
    notify_users_about_new_quiz(new_quiz)

    return jsonify({"message": "Quiz added successfully"}), 201

# Edit a quiz
@app.route("/api/admin/subject/<int:subject_id>/chapter/<int:chapter_id>/quiz/<int:quiz_id>", methods=["PUT"])
def edit_quiz(subject_id, chapter_id, quiz_id):
    
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.json
    quiz.name=data["name"]
    quiz.date_of_quiz = datetime.strptime(data["date_of_quiz"], "%Y-%m-%d").date()
    quiz.time_duration = data["time_duration"]
    db.session.commit()
    return jsonify({"message": "Quiz updated successfully"})

# Delete a quiz
@app.route("/api/admin/subject/<int:subject_id>/chapter/<int:chapter_id>/quiz/<int:quiz_id>", methods=["DELETE"])
def delete_quiz(subject_id, chapter_id, quiz_id):
    
    quiz = Quiz.query.get_or_404(quiz_id)
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({"message": "Quiz deleted successfully"})

# Fetch questions for a specific quiz
@app.route("/api/admin/quiz/<int:quiz_id>/questions", methods=["GET"])
def get_questions(quiz_id):
    
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    if not questions:
        return jsonify({"message": "No questions added yet"}), 200
    return jsonify([{
        "id": q.id,
        "question_statement": q.question_statement,
        "options": [q.option1, q.option2, q.option3, q.option4],
        "correct_option": q.correct_option
    } for q in questions])

# Add a question to a quiz
@app.route("/api/admin/quiz/<int:quiz_id>/question", methods=["POST"])
def add_question(quiz_id):
    
    data = request.json
    new_question = Question(
        quiz_id=quiz_id,
        question_statement=data["question_statement"],
        option1=data["option1"],
        option2=data["option2"],
        option3=data["option3"],
        option4=data["option4"],
        correct_option=data["correct_option"]
    )
    db.session.add(new_question)
    db.session.commit()
    return jsonify({"message": "Question added successfully"}), 201

# Edit a question
@app.route("/api/admin/quiz/<int:quiz_id>/question/<int:question_id>", methods=["GET", "PUT"])
def edit_question(quiz_id, question_id):
    question = Question.query.get_or_404(question_id)

    if request.method == "GET":
        return jsonify({
            "question_statement": question.question_statement,
            "option1": question.option1,
            "option2": question.option2,
            "option3": question.option3,
            "option4": question.option4,
            "correct_option": question.correct_option
        })

    data = request.json
    question.question_statement = data["question_statement"]
    question.option1 = data["option1"]
    question.option2 = data["option2"]
    question.option3 = data["option3"]
    question.option4 = data["option4"]
    question.correct_option = data["correct_option"]
    db.session.commit()
    
    return jsonify({"message": "Question updated successfully"})

# Delete a question
@app.route("/api/admin/quiz/<int:quiz_id>/question/<int:question_id>", methods=["DELETE"])
def delete_question(quiz_id, question_id):
    # Fetch the question and delete it
    question = Question.query.filter_by(id=question_id, quiz_id=quiz_id).first()
    if not question:
        return jsonify({"error": "Question not found"}), 404
    
    db.session.delete(question)
    db.session.commit()
    
    return jsonify({"message": "Question deleted successfully"}), 200

@app.route("/api/admin/quiz/<int:quiz_id>", methods=["GET", "PUT"])
def manage_quiz(quiz_id):
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    if request.method == "GET":
        return jsonify({
            "id": quiz.id,
            "name":quiz.name,
            "date_of_quiz": quiz.date_of_quiz.strftime("%Y-%m-%d"),  # Convert Date to String
            "time_duration": quiz.time_duration
        })

    elif request.method == "PUT":
        data = request.json
        name=data.get("name")
        date_of_quiz_str = data.get("date_of_quiz")
        time_duration = data.get("time_duration")

        if not date_of_quiz_str or not time_duration:
            return jsonify({"error": "Missing required fields"}), 400

        try:
            # Convert string date to Python date object
            quiz.date_of_quiz = datetime.strptime(date_of_quiz_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

        quiz.time_duration = time_duration
        db.session.commit()

        return jsonify({"message": "Quiz updated successfully!"})



def login_required(func):
    from functools import wraps
    @wraps(func)  # ✅ This ensures the original function name is preserved
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Unauthorized access"}), 401
        return func(*args, **kwargs)
    return decorated_function

@app.route("/api/user/subject", methods=["GET"])
def get_user_subjects():
    subjects = Subject.query.all()
    subjects_list = [{"id": subject.id, "name": subject.name} for subject in subjects]
    return jsonify(subjects_list), 200

@app.route("/api/user/subjects/<int:subject_id>/chapters", methods=["GET"])
@login_required
def get_chapters_by_subject(subject_id):
    chapters = Chapter.query.filter_by(subject_id=subject_id).all()
    return jsonify([{"id": ch.id, "name": ch.name} for ch in chapters])

# ✅ Make sure this route is defined only ONCE
@app.route("/api/user/chapters/<int:chapter_id>/quizzes", methods=["GET"])
@login_required
def get_user_quizzes_by_chapter(chapter_id):
    quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
    return jsonify([
        {
            "id": quiz.id,
            "num_questions": len(quiz.questions),
            "name":quiz.name,  
            "date_of_quiz": quiz.date_of_quiz.strftime("%Y-%m-%d"),
            "time_duration": quiz.time_duration
        } for quiz in quizzes
    ])

# ✅ User Dashboard Route
@app.route('/api/user/dashboard', methods=['GET'])
def user_dashboard():
    if "user_id" not in session or session.get("role") != "user":
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify({"message": "Welcome to User Dashboard"}), 200


@app.route("/api/user/quizzes", methods=["GET"])
@login_required
def get_user_quizzes():
    quizzes = Quiz.query.all()
    return jsonify([
        {
            "id": quiz.id,
            "name":quiz.name,
            "date_of_quiz": quiz.date_of_quiz.strftime("%Y-%m-%d"),
            "time_duration": quiz.time_duration
        } for quiz in quizzes
    ])
@app.route("/api/user/quizzes/<int:quiz_id>/questions", methods=["GET"])
@login_required
def get_quiz_questions(quiz_id):
    if not current_user.is_authenticated:
        return jsonify({"error": "Unauthorized"}), 401

    # Debugging: Print user session
    print(f"User ID from session: {current_user.id}")

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    
    question_list = [
        {
            "id": q.id,
            "question_statement": q.question_statement,
            "options": [q.option1, q.option2, q.option3, q.option4]
        }
        for q in questions
    ]
    try:
        time_duration = int(quiz.time_duration)
    except (ValueError, TypeError):
        time_duration = 10 
    return jsonify({
        "questions": question_list,
        "time_duration": time_duration # Ensure it's not None
    })

@app.route("/api/user/quizzes/<int:quiz_id>/submit", methods=["POST"])
@login_required
def submit_quiz(quiz_id):
    data = request.get_json()
    user_answers = data.get("answers", {})

    print("Received User Answers:", user_answers)  # Debugging

    quiz = Quiz.query.get_or_404(quiz_id)
    questions = Question.query.filter_by(quiz_id=quiz_id).all()

    correct_answers = {}  # Stores { question_id : correct answer text }
    
    for q in questions:
        options = [q.option1, q.option2, q.option3, q.option4]  # Extract all options
        if 1 <= q.correct_option <= 4:  # Ensure correct_option is valid
            correct_answers[str(q.id)] = options[q.correct_option - 1].strip().lower()
        else:
            print(f"Warning: Invalid correct_option {q.correct_option} for question {q.id}")

    # Normalize user answers (convert to lowercase for comparison)
    user_answers = {str(q_id): str(ans).strip().lower() for q_id, ans in user_answers.items()}

    print("Correct Answers from DB:", correct_answers)  # Debugging

    # Score Calculation
    score = sum(1 for q_id in user_answers if user_answers.get(q_id, "") == correct_answers.get(q_id, ""))

    print("Calculated Score:", score)  # Debugging

    # Store Attempt in QuizAttempt Model
    new_attempt = QuizAttempt(user_id=current_user.id, quiz_id=quiz_id, score=score)
    db.session.add(new_attempt)

    # Update Score Model (Store Best Score)
    existing_score = Score.query.filter_by(user_id=current_user.id, quiz_id=quiz_id).first()
    
    if existing_score:
        print(f"Existing Score Found: {existing_score.total_score}")  # Debugging
        existing_score.total_score = max(existing_score.total_score, score)  # Keep highest score
        existing_score.timestamp_of_attempt = datetime.utcnow()
    else:
        print("Creating New Score Entry")  # Debugging
        new_score = Score(user_id=current_user.id, quiz_id=quiz_id, total_score=score)
        db.session.add(new_score)

    db.session.commit()

    return jsonify({"message": "Quiz submitted successfully!", "score": score})



@app.route("/api/user/quizzes/<int:quiz_id>/attempt-status", methods=["GET"])
@login_required
def check_attempt_status(quiz_id):
    if not current_user.is_authenticated:
        return jsonify({"error": "User not logged in"}), 401
    
    print(f"Current User ID: {current_user.id}")  # Debugging
    attempt = QuizAttempt.query.filter_by(user_id=current_user.id, quiz_id=quiz_id).first()
    
    return jsonify({"already_attempted": bool(attempt)})

@app.route("/debug-user")
def debug_user():
    return jsonify({
        "authenticated": current_user.is_authenticated,
        "user_id": getattr(current_user, "id", None),
        "user_type": str(type(current_user))  # Check the user type
    })

@app.route("/api/user/quizzes/<int:quiz_id>/score", methods=["GET"])
@login_required
def get_quiz_score(quiz_id):
    # Fetch max score for the user
    score_entry = Score.query.filter_by(user_id=current_user.id, quiz_id=quiz_id).first()
    max_score = score_entry.total_score if score_entry else 0

    # Fetch all attempts for the user
    attempts = QuizAttempt.query.filter_by(user_id=current_user.id, quiz_id=quiz_id).order_by(QuizAttempt.attempt_time.desc()).all()

    # Count the number of attempts
    attempt_count = len(attempts)

    # Format attempt details
    attempt_list = [
        {"score": attempt.score, "date": attempt.attempt_time.strftime("%Y-%m-%d %H:%M:%S")}
        for attempt in attempts
    ]

    return jsonify({
        "max_score": max_score,
        "attempt_count": attempt_count,
        "attempts": attempt_list  # Include past attempts in response
    })




# Setup Database (Fixed)
def setup_database():
    with app.app_context():
        db.create_all()  # Removed redundant db.init_app(app)

        # Check if admin user exists
        admin_user = User.query.filter_by(email="admin@example.com").first()
        if not admin_user:
            hashed_password = generate_password_hash("admin123", method="pbkdf2:sha256")
            admin_user = User(email="admin@example.com", password=hashed_password, full_name="Admin", role="admin")
            db.session.add(admin_user)
            db.session.commit()
            print("✅ Default admin user created.")
        else:
            print("⚠️ Admin user already exists.")

# Run the app
if __name__ == "__main__":
    setup_database()
    app.run(debug=True)
