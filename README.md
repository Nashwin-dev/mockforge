# MockForge

MockForge is a local Flask-based mock test engine designed to simulate real computer-based placement and aptitude exams.

It supports:
- JSON-based question banks
- Timed exams
- Sidebar navigation
- Auto-submit on timeout
- Randomized questions
- Answer persistence
- Real exam-style UI

The project is lightweight, beginner-friendly, and runs completely offline.

---

# Features

## Real Exam Simulation
MockForge is designed to feel like an actual placement or competitive exam portal.

Features include:
- One question at a time
- Previous / Next navigation
- Fixed timer
- Sidebar question navigator
- Auto-submit when time expires

---

# JSON Question Bank System

Questions are loaded dynamically from JSON files.

Supports:
- Multiple JSON files
- Nested folders
- Topic-wise organization
- Difficulty-based organization

Example structure:

```plaintext
Questions/
├── aptitude.json
├── reasoning.json
├── verbal.json
├── tcs/
│   ├── quant.json
│   └── verbal.json
├── infosys/
│   ├── puzzle.json
│   └── aptitude.json
```

---

# Timer System

The timer:
- stays visible at all times
- updates in real-time
- automatically submits the exam at zero
- warns users when time is low

---

# Sidebar Navigation

Each question number displays status:

| Status | Color |
|--------|--------|
| Current Question | Blue |
| Answered | Green |
| Unanswered | Gray |

Users can instantly jump to any question.

---

# Result Analysis

After submission, MockForge displays:
- Total Questions
- Correct Answers
- Wrong Answers
- Unanswered Questions
- Percentage
- Final Score
- Time Taken

Also includes answer review:
- selected answer
- correct answer
- correctness status

---

# Tech Stack

## Backend
- Python
- Flask

## Frontend
- HTML
- CSS
- Vanilla JavaScript

---

# Project Structure

```plaintext
mockforge/
│
├── Questions/
│   ├── aptitude.json
│   ├── reasoning.json
│   └── verbal.json
│
├── static/
│   ├── style.css
│   └── script.js
│
├── templates/
│   └── index.html
│
├── .gitignore
├── requirements.txt
├── app.py
└── README.md
```

---

# Installation

## 1. Clone Repository

```bash
git clone https://github.com/Nashwin-dev/mockforge.git
```

---

## 2. Navigate Into Project

```bash
cd mockforge
```

---

## 3. Create Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 4. Install Dependencies

```bash
pip install -r requirements.txt
```

---

# Running the Application

Start Flask server:

```bash
python app.py
```

Then open:

```plaintext
http://127.0.0.1:5000
```

in your browser.

---

# JSON Question Format

Example:

```json
[
  {
    "id": "1",
    "question": "What is 2 + 2?",
    "options": ["2", "3", "4", "5"],
    "answer": "4",
    "category": "Quantitative Aptitude",
    "difficulty": "Easy"
  }
]
```

---

# Current Features

- Local Flask server
- JSON-based questions
- Dynamic question loading
- Timer system
- Sidebar question navigation
- Previous/Next buttons
- Auto-submit
- Score calculation
- Result analysis
- Responsive exam layout
- Local answer persistence

---

# Planned Features

Future improvements:
- Dark mode
- Topic-wise tests
- Mark for review
- CSV/Excel import
- Analytics dashboard
- Negative marking
- Multi-section exams
- User profiles
- Exam history
- Performance graphs

---

# Why MockForge?

MockForge was created to provide:
- a lightweight local mock exam platform
- an offline aptitude practice system
- a customizable exam engine
- a beginner-friendly Flask project

It can be used for:
- placement preparation
- aptitude practice
- exam simulation
- learning Flask development
- experimenting with quiz engines

---

# Screenshots

(Add screenshots here later)

Example:

```md
![Home Screen](screenshots/home.png)
```

---

# License

This project is licensed under the MIT License.

---

# Author

Developed by Nashwin Dsouza.

GitHub:
https://github.com/Nashwin-dev

---

# Contributing

Contributions, improvements, and suggestions are welcome.

You can:
- fork the repository
- create feature branches
- submit pull requests

---

# Acknowledgements

Inspired by:
- placement exam portals
- CBT interfaces
- aptitude testing platforms
- online coding assessments
