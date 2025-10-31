"""
Cybersecurity Awareness Gamification Platform - Flask Prototype
---------------------------------------------------------------
Features:
 - User registration and login with password hashing (bcrypt)
 - JWT authentication for secure API access
 - Challenge list, attempt submission with scoring
 - Feedback submission and leaderboard
 - In-memory data store (no external DB for simplicity)
"""

from flask import Flask, jsonify, request
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Secret key for JWT
app.config['JWT_SECRET_KEY'] = 'super-secret-key'
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# -----------------------------
# In-memory "database"
# -----------------------------
users = []  # {id, email, password_hash, points}
feedbacks = []
challenges = [
    {
        "id": 1,
        "title": "Phishing Email Challenge",
        "type": "phishing",
        "difficulty": "easy",
        "question": "You receive an email asking for your password. What should you do?",
        "options": [
            "Reply with password to verify your account",
            "Ignore or report as phishing",
            "Click the link and log in immediately"
        ],
        "correctAnswer": 1
    },
    {
        "id": 2,
        "title": "Password Strength Challenge",
        "type": "password",
        "difficulty": "medium",
        "question": "Which of the following is the strongest password?",
        "options": [
            "123456",
            "MyPetDog2020",
            "A$gT8!zQr9#bL1"
        ],
        "correctAnswer": 2
    }
]

# -----------------------------
# Helper functions
# -----------------------------
def find_user_by_email(email):
    return next((u for u in users if u["email"] == email), None)

def find_user_by_id(uid):
    return next((u for u in users if u["id"] == uid), None)

# -----------------------------
# Routes
# -----------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "✅ Cybersecurity Awareness Game Backend Running!"})


# 🧩 Register user
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if find_user_by_email(email):
        return jsonify({"error": "User already exists"}), 400

    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = {"id": len(users) + 1, "email": email, "password_hash": password_hash, "points": 0}
    users.append(new_user)

    return jsonify({"message": "User registered successfully"})


# 🔐 Login user
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = find_user_by_email(email)
    if not user or not bcrypt.check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials"}), 400

    token = create_access_token(identity=user["id"])
    return jsonify({"message": "Login successful", "token": token})


# 🎯 Get all challenges
@app.route("/api/challenges", methods=["GET"])
@jwt_required()
def get_challenges():
    return jsonify([
        {"id": c["id"], "title": c["title"], "difficulty": c["difficulty"], "type": c["type"]}
        for c in challenges
    ])


# 🕹️ Get a specific challenge
@app.route("/api/challenges/<int:cid>", methods=["GET"])
@jwt_required()
def get_challenge(cid):
    challenge = next((c for c in challenges if c["id"] == cid), None)
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404
    return jsonify(challenge)


# 🏆 Submit attempt
@app.route("/api/attempts", methods=["POST"])
@jwt_required()
def submit_attempt():
    uid = get_jwt_identity()
    data = request.get_json()
    challenge_id = data.get("challengeId")
    selected_option = data.get("selectedOption")

    challenge = next((c for c in challenges if c["id"] == challenge_id), None)
    if not challenge:
        return jsonify({"error": "Challenge not found"}), 404

    correct = selected_option == challenge["correctAnswer"]
    base_points = 100 if challenge["difficulty"] == "easy" else 200 if challenge["difficulty"] == "medium" else 400
    earned = base_points if correct else 0

    user = find_user_by_id(uid)
    user["points"] += earned

    return jsonify({
        "correct": correct,
        "earned": earned,
        "totalPoints": user["points"],
        "message": "Correct! You earned points." if correct else "Incorrect, try again!"
    })


# 💬 Submit feedback
@app.route("/api/feedback", methods=["POST"])
@jwt_required()
def submit_feedback():
    uid = get_jwt_identity()
    data = request.get_json()
    feedbacks.append({
        "userId": uid,
        "challengeId": data.get("challengeId"),
        "rating": data.get("rating"),
        "comment": data.get("comment")
    })
    return jsonify({"message": "Feedback submitted"})


# 🧠 Leaderboard
@app.route("/api/leaderboard", methods=["GET"])
@jwt_required()
def leaderboard():
    sorted_users = sorted(users, key=lambda u: u["points"], reverse=True)
    return jsonify([{"email": u["email"], "points": u["points"]} for u in sorted_users])


# -----------------------------
# Run the app
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True, port=5000)
