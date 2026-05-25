const STORAGE_KEY = "mockforge_attempt_v1";

const state = {
  bank: [],
  questions: [],
  currentIndex: 0,
  answers: {},
  durationMinutes: 30,
  startedAt: null,
  endsAt: null,
  timerId: null,
  submitted: false
};

const els = {
  setupPanel: document.getElementById("setupPanel"),
  examLayout: document.getElementById("examLayout"),
  resultPanel: document.getElementById("resultPanel"),
  setupForm: document.getElementById("examSetupForm"),
  durationInput: document.getElementById("durationInput"),
  questionMode: document.getElementById("questionMode"),
  questionCountWrap: document.getElementById("questionCountWrap"),
  questionCountInput: document.getElementById("questionCountInput"),
  randomQuestionOrder: document.getElementById("randomQuestionOrder"),
  randomOptionOrder: document.getElementById("randomOptionOrder"),
  examMeta: document.getElementById("examMeta"),
  timer: document.getElementById("timer"),
  timerCard: document.getElementById("timerCard"),
  questionGrid: document.getElementById("questionGrid"),
  answeredCount: document.getElementById("answeredCount"),
  questionCategory: document.getElementById("questionCategory"),
  questionDifficulty: document.getElementById("questionDifficulty"),
  questionNumber: document.getElementById("questionNumber"),
  questionText: document.getElementById("questionText"),
  optionsList: document.getElementById("optionsList"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  clearBtn: document.getElementById("clearBtn"),
  submitBtn: document.getElementById("submitBtn"),
  scoreGrid: document.getElementById("scoreGrid"),
  reviewList: document.getElementById("reviewList"),
  newExamBtn: document.getElementById("newExamBtn")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  await loadQuestionBank();
  bindEvents();
  restoreAttempt();
  updateTimerDisplay();
}

async function loadQuestionBank() {
  const response = await fetch("/api/questions");
  if (!response.ok) {
    throw new Error("Unable to load questions.");
  }

  const data = await response.json();
  state.bank = data.questions || [];
  els.examMeta.textContent = `${state.bank.length} questions loaded from questions.json`;
  els.questionCountInput.max = String(Math.max(state.bank.length, 1));
  els.questionCountInput.value = String(Math.min(10, Math.max(state.bank.length, 1)));
}

function bindEvents() {
  els.setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startExam();
  });

  els.questionMode.addEventListener("change", () => {
    els.questionCountWrap.classList.toggle("is-hidden", els.questionMode.value !== "fixed");
  });

  els.prevBtn.addEventListener("click", () => goToQuestion(state.currentIndex - 1));
  els.nextBtn.addEventListener("click", () => goToQuestion(state.currentIndex + 1));
  els.clearBtn.addEventListener("click", clearCurrentAnswer);
  els.submitBtn.addEventListener("click", () => submitExam(false));
  els.newExamBtn.addEventListener("click", resetExam);

  document.addEventListener("keydown", handleKeyboard);
}

function startExam() {
  if (!state.bank.length) {
    alert("No valid questions found in questions.json.");
    return;
  }

  const duration = Number.parseInt(els.durationInput.value, 10);
  const useFixedCount = els.questionMode.value === "fixed";
  const requestedCount = Number.parseInt(els.questionCountInput.value, 10);

  state.durationMinutes = Number.isFinite(duration) && duration > 0 ? duration : 30;
  state.questions = [...state.bank];

  if (els.randomQuestionOrder.checked || useFixedCount) {
    state.questions = shuffle(state.questions);
  }

  if (useFixedCount) {
    const count = clamp(requestedCount || 1, 1, state.bank.length);
    state.questions = state.questions.slice(0, count);
  }

  if (els.randomOptionOrder.checked) {
    state.questions = state.questions.map((question) => ({
      ...question,
      options: shuffle(question.options)
    }));
  }

  state.currentIndex = 0;
  state.answers = {};
  state.startedAt = Date.now();
  state.endsAt = state.startedAt + state.durationMinutes * 60 * 1000;
  state.submitted = false;

  showExam();
  renderSidebar();
  renderQuestion();
  startTimer();
  saveAttempt();
}

function showExam() {
  els.setupPanel.classList.add("is-hidden");
  els.resultPanel.classList.add("is-hidden");
  els.examLayout.classList.remove("is-hidden");
  els.examMeta.textContent = `${state.questions.length} question exam in progress`;
}

function renderSidebar() {
  els.questionGrid.innerHTML = "";

  state.questions.forEach((question, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "question-jump";
    button.textContent = String(index + 1);
    button.setAttribute("aria-label", `Go to question ${index + 1}`);
    button.addEventListener("click", () => goToQuestion(index));
    els.questionGrid.appendChild(button);
  });

  updateSidebarStatus();
}

function renderQuestion() {
  const question = state.questions[state.currentIndex];
  if (!question) {
    return;
  }

  els.questionCategory.textContent = question.category || "General";
  els.questionDifficulty.textContent = question.difficulty || "Medium";
  els.questionNumber.textContent = `Question ${state.currentIndex + 1} of ${state.questions.length}`;
  els.questionText.textContent = question.question;
  els.optionsList.innerHTML = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-card";
    button.dataset.option = option;
    button.innerHTML = `<span class="option-key">${String.fromCharCode(65 + index)}</span><span></span>`;
    button.querySelector("span:last-child").textContent = option;
    button.addEventListener("click", () => selectAnswer(question.id, option));

    if (state.answers[question.id] === option) {
      button.classList.add("selected");
    }

    els.optionsList.appendChild(button);
  });

  els.prevBtn.disabled = state.currentIndex === 0;
  els.nextBtn.disabled = state.currentIndex === state.questions.length - 1;
  updateSidebarStatus();
}

function selectAnswer(questionId, option) {
  if (state.submitted) {
    return;
  }

  state.answers[questionId] = option;
  saveAttempt();
  renderQuestion();
}

function clearCurrentAnswer() {
  const question = state.questions[state.currentIndex];
  if (!question || state.submitted) {
    return;
  }

  delete state.answers[question.id];
  saveAttempt();
  renderQuestion();
}

function goToQuestion(index) {
  if (index < 0 || index >= state.questions.length || state.submitted) {
    return;
  }

  state.currentIndex = index;
  saveAttempt();
  renderQuestion();
}

function updateSidebarStatus() {
  const buttons = [...els.questionGrid.querySelectorAll(".question-jump")];
  let answered = 0;

  buttons.forEach((button, index) => {
    const question = state.questions[index];
    const hasAnswer = Boolean(question && state.answers[question.id]);
    if (hasAnswer) {
      answered += 1;
    }

    button.classList.toggle("answered", hasAnswer);
    button.classList.toggle("current", index === state.currentIndex);
  });

  els.answeredCount.textContent = `${answered} answered`;
}

function startTimer() {
  window.clearInterval(state.timerId);
  state.timerId = window.setInterval(tickTimer, 1000);
  tickTimer();
}

function tickTimer() {
  const remainingMs = Math.max(0, state.endsAt - Date.now());
  updateTimerDisplay(remainingMs);

  if (remainingMs <= 0 && !state.submitted) {
    submitExam(true);
  }
}

function updateTimerDisplay(remainingMs = 0) {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  els.timer.textContent = `${pad(minutes)}:${pad(seconds)}`;
  els.timerCard.classList.toggle("low-time", remainingMs > 0 && remainingMs <= 5 * 60 * 1000);
}

async function submitExam(autoSubmitted) {
  if (state.submitted) {
    return;
  }

  if (!autoSubmitted) {
    const ok = window.confirm("Submit the exam now?");
    if (!ok) {
      return;
    }
  }

  state.submitted = true;
  window.clearInterval(state.timerId);
  saveAttempt();

  const response = await fetch("/api/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      answers: state.answers,
      questionIds: state.questions.map((question) => question.id),
      startedAt: state.startedAt
    })
  });

  if (!response.ok) {
    alert("Unable to submit exam. Please try again.");
    state.submitted = false;
    startTimer();
    return;
  }

  const result = await response.json();
  localStorage.removeItem(STORAGE_KEY);
  showResult(result);
}

function showResult(result) {
  els.examLayout.classList.add("is-hidden");
  els.setupPanel.classList.add("is-hidden");
  els.resultPanel.classList.remove("is-hidden");
  els.examMeta.textContent = "Result and review";
  updateTimerDisplay(0);

  const cards = [
    ["Total", result.total],
    ["Correct", result.correct],
    ["Wrong", result.wrong],
    ["Unanswered", result.unanswered],
    ["Percentage", `${result.percentage}%`],
    ["Time Taken", formatDuration(result.timeTakenSeconds)]
  ];

  els.scoreGrid.innerHTML = cards
    .map(([label, value]) => `<div class="score-card"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");

  els.reviewList.innerHTML = result.review
    .map((item, index) => {
      const status = item.isUnanswered ? "unanswered" : item.isCorrect ? "correct" : "wrong";
      const selected = item.selectedAnswer || "Not answered";

      return `
        <article class="review-item ${status}">
          <p class="review-meta">Question ${index + 1} • ${escapeHtml(item.category)} • ${escapeHtml(item.difficulty)}</p>
          <h4>${escapeHtml(item.question)}</h4>
          <p class="answer-line"><strong>Your answer:</strong> ${escapeHtml(selected)}</p>
          <p class="answer-line"><strong>Correct answer:</strong> ${escapeHtml(item.correctAnswer)}</p>
        </article>
      `;
    })
    .join("");
}

function saveAttempt() {
  if (!state.questions.length) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      questions: state.questions,
      currentIndex: state.currentIndex,
      answers: state.answers,
      durationMinutes: state.durationMinutes,
      startedAt: state.startedAt,
      endsAt: state.endsAt,
      submitted: state.submitted
    })
  );
}

function restoreAttempt() {
  const rawAttempt = localStorage.getItem(STORAGE_KEY);
  if (!rawAttempt) {
    return;
  }

  try {
    const attempt = JSON.parse(rawAttempt);
    if (!Array.isArray(attempt.questions) || !attempt.questions.length || attempt.submitted) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    Object.assign(state, {
      questions: attempt.questions,
      currentIndex: attempt.currentIndex || 0,
      answers: attempt.answers || {},
      durationMinutes: attempt.durationMinutes || 30,
      startedAt: attempt.startedAt,
      endsAt: attempt.endsAt,
      submitted: false
    });

    if (Date.now() >= state.endsAt) {
      submitExam(true);
      return;
    }

    showExam();
    renderSidebar();
    renderQuestion();
    startTimer();
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function resetExam() {
  window.clearInterval(state.timerId);
  localStorage.removeItem(STORAGE_KEY);

  Object.assign(state, {
    questions: [],
    currentIndex: 0,
    answers: {},
    startedAt: null,
    endsAt: null,
    submitted: false
  });

  els.resultPanel.classList.add("is-hidden");
  els.examLayout.classList.add("is-hidden");
  els.setupPanel.classList.remove("is-hidden");
  els.examMeta.textContent = `${state.bank.length} questions loaded from questions.json`;
  updateTimerDisplay(0);
}

function handleKeyboard(event) {
  if (els.examLayout.classList.contains("is-hidden")) {
    return;
  }

  if (event.key === "ArrowLeft") {
    goToQuestion(state.currentIndex - 1);
  }

  if (event.key === "ArrowRight") {
    goToQuestion(state.currentIndex + 1);
  }

  const optionIndex = Number.parseInt(event.key, 10) - 1;
  const question = state.questions[state.currentIndex];
  if (question && optionIndex >= 0 && optionIndex < question.options.length) {
    selectAnswer(question.id, question.options[optionIndex]);
  }
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
  }
  return copy;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${pad(seconds)}s`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
