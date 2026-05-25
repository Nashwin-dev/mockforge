import json
import time
from pathlib import Path

from flask import Flask, jsonify, render_template, request


BASE_DIR = Path(__file__).resolve().parent
QUESTIONS_DIR = BASE_DIR / "Questions"
QUESTIONS_FILE = QUESTIONS_DIR / "SimpleAndCompoundIntrest.json"

app = Flask(__name__)


def load_questions():
    """Load and lightly validate the local JSON question bank."""
    if not QUESTIONS_FILE.exists():
        return []

    with QUESTIONS_FILE.open("r", encoding="utf-8") as file:
        raw_questions = json.load(file)

    questions = []
    for index, item in enumerate(raw_questions, start=1):
        question_text = str(item.get("question", "")).strip()
        options = item.get("options", [])
        correct_answer = str(item.get("answer", "")).strip()

        if not question_text or not isinstance(options, list) or len(options) < 2:
            continue
        if correct_answer not in options:
            continue

        questions.append(
            {
                "id": str(item.get("id", index)),
                "question": question_text,
                "options": [str(option) for option in options],
                "answer": correct_answer,
                "category": item.get("category", "General"),
                "difficulty": item.get("difficulty", "Medium"),
            }
        )

    return questions


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/questions")
def get_questions():
    questions = load_questions()
    public_questions = [
        {
            "id": question["id"],
            "question": question["question"],
            "options": question["options"],
            "category": question["category"],
            "difficulty": question["difficulty"],
        }
        for question in questions
    ]
    return jsonify({"questions": public_questions, "count": len(public_questions)})


@app.route("/api/submit", methods=["POST"])
def submit_exam():
    payload = request.get_json(silent=True) or {}
    answers = payload.get("answers", {})
    question_ids = payload.get("questionIds", [])
    started_at = payload.get("startedAt")

    questions_by_id = {question["id"]: question for question in load_questions()}
    selected_questions = [
        questions_by_id[question_id]
        for question_id in question_ids
        if question_id in questions_by_id
    ]

    if not selected_questions:
        return jsonify({"error": "No valid questions submitted."}), 400

    correct = 0
    wrong = 0
    unanswered = 0
    review = []

    for question in selected_questions:
        selected_answer = answers.get(question["id"])
        is_unanswered = selected_answer in (None, "")
        is_correct = selected_answer == question["answer"]

        if is_unanswered:
            unanswered += 1
        elif is_correct:
            correct += 1
        else:
            wrong += 1

        review.append(
            {
                "id": question["id"],
                "question": question["question"],
                "category": question["category"],
                "difficulty": question["difficulty"],
                "selectedAnswer": selected_answer,
                "correctAnswer": question["answer"],
                "isCorrect": is_correct,
                "isUnanswered": is_unanswered,
            }
        )

    total = len(selected_questions)
    percentage = round((correct / total) * 100, 2)
    now_ms = int(time.time() * 1000)
    time_taken_seconds = 0

    if isinstance(started_at, (int, float)):
        time_taken_seconds = max(0, round((now_ms - started_at) / 1000))

    return jsonify(
        {
            "total": total,
            "correct": correct,
            "wrong": wrong,
            "unanswered": unanswered,
            "percentage": percentage,
            "score": correct,
            "timeTakenSeconds": time_taken_seconds,
            "review": review,
        }
    )


if __name__ == "__main__":
    app.run(debug=True)
