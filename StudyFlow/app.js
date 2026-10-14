const palette = ["#779aca", "#ed8a6c", "#77a985", "#c49a54", "#9b8bb8", "#58a6a0"];
const starterState = {
  subjects: [
    { id: "math", name: "Mathematics", color: "#779aca", icon: "∑", topics: 12, completed: 8, demo: true },
    { id: "programming", name: "Programming", color: "#ed8a6c", icon: "⌘", topics: 9, completed: 5, demo: true },
    { id: "networking", name: "Networking", color: "#77a985", icon: "⌁", topics: 14, completed: 7, demo: true },
    { id: "english", name: "English", color: "#c49a54", icon: "Aa", topics: 8, completed: 6, demo: true }
  ],
  tasks: [
    { id: "t1", title: "Review subnet masks", subject: "Networking", time: "9:00 AM", done: false },
    { id: "t2", title: "Practice quadratic equations", subject: "Mathematics", time: "11:30 AM", done: false },
    { id: "t3", title: "Read: functions & scope", subject: "Programming", time: "2:00 PM", done: true },
    { id: "t4", title: "Write vocabulary notes", subject: "English", time: "4:15 PM", done: false }
  ],
  notes: [
    { id: "n1", title: "CIDR notation essentials", subject: "Networking", topic: "IP addressing", content: "CIDR notation represents an IP address and its network mask with a slash. A /24 means the first 24 bits identify the network, leaving 8 host bits.", tags: ["exam prep", "networks"], favorite: true, updated: "Today" },
    { id: "n2", title: "Quadratic formula", subject: "Mathematics", topic: "Algebra", content: "For ax² + bx + c = 0, the solutions are x = (-b ± √(b² - 4ac)) / 2a. The discriminant tells you how many real roots to expect.", tags: ["formula"], favorite: false, updated: "Yesterday" },
    { id: "n3", title: "JavaScript closures", subject: "Programming", topic: "Functions", content: "A closure is the combination of a function bundled with references to its surrounding state. It gives the function access to its outer scope even after that scope has returned.", tags: ["javascript", "review"], favorite: true, updated: "Mon, Oct 12" },
    { id: "n4", title: "Thesis statement checklist", subject: "English", topic: "Essay writing", content: "A strong thesis is specific, arguable, and gives the reader a clear map of the argument that follows.", tags: ["writing"], favorite: false, updated: "Oct 10" }
  ],
  cards: [
    { id: "c1", subject: "Networking", question: "What does /24 mean in CIDR notation?", answer: "The first 24 bits identify the network, leaving 8 bits for host addresses.", difficulty: "practice" },
    { id: "c2", subject: "Mathematics", question: "What is the discriminant of a quadratic?", answer: "b² - 4ac. It tells you whether the equation has two, one, or no real roots.", difficulty: "easy" },
    { id: "c3", subject: "Programming", question: "What is a closure in JavaScript?", answer: "A function bundled with its lexical environment, preserving access to its outer scope.", difficulty: "hard" },
    { id: "c4", subject: "English", question: "What makes a thesis statement effective?", answer: "It is specific, arguable, and previews the structure of the argument.", difficulty: "practice" }
  ],
  questions: [
    { id: "q1", subject: "Networking", topic: "IP addressing", question: "How many usable host addresses are in a typical /24 IPv4 subnet?", options: ["126", "254", "256", "510"], answer: 1, explanation: "A /24 leaves 8 host bits: 2⁸ = 256 addresses, minus the network and broadcast addresses = 254 usable hosts." },
    { id: "q2", subject: "Mathematics", topic: "Algebra", question: "What is the discriminant of x² - 5x + 6 = 0?", options: ["1", "5", "-1", "49"], answer: 0, explanation: "For a=1, b=-5, c=6: b² - 4ac = 25 - 24 = 1." },
    { id: "q3", subject: "Programming", topic: "JavaScript", question: "Which keyword declares a block-scoped variable that can be reassigned?", options: ["const", "var", "let", "static"], answer: 2, explanation: "let declares a block-scoped variable that can be reassigned." },
    { id: "q4", subject: "English", topic: "Writing", question: "Which is the strongest thesis statement?", options: ["Social media exists.", "This essay is about social media.", "Social media has pros and cons.", "Schools should teach media literacy because it helps students evaluate online claims."], answer: 3, explanation: "A strong thesis makes a specific, arguable claim and points toward its reasoning." },
    { id: "q5", subject: "Networking", topic: "Subnetting", question: "Which device primarily forwards packets between different networks?", options: ["Switch", "Router", "Repeater", "Access point"], answer: 1, explanation: "Routers forward packets between IP networks using routing tables." }
  ],
  sessions: [],
  quizHistory: [],
  fileUploads: [],
  plan: null,
  settings: { darkMode: false, reminders: true, pro: false, name: "Jamie Davis" }
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("studyflow-state"));
    return saved ? { ...structuredClone(starterState), ...saved, settings: { ...starterState.settings, ...saved.settings } } : structuredClone(starterState);
  } catch { return structuredClone(starterState); }
}
let state = loadState();
state.fileUploads = state.fileUploads || [];
let activeView = "dashboard";
let activeCardIndex = 0;
let showingAnswer = false;
let timerMode = "focus";
let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;
let quizRun = null;
let toastTimeout;

const root = document.querySelector("#view-root");
const modalBackdrop = document.querySelector("#modal-backdrop");
const modal = document.querySelector("#modal");
const pageNames = { dashboard: "Overview", subjects: "Subjects", planner: "Study planner", notes: "Notes", flashcards: "Flashcards", quizzes: "Quizzes", focus: "Focus timer", progress: "Progress", upgrade: "StudyFlow Pro", settings: "Settings" };
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const subjectColor = name => state.subjects.find(subject => subject.name === name)?.color || palette[0];
const subjectProgress = subject => subject.topics ? Math.round(subject.completed / subject.topics * 100) : 0;
const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
document.querySelector("#today-date").textContent = today;

function save() {
  try {
    localStorage.setItem("studyflow-state", JSON.stringify(state));
    return true;
  } catch {
    showToast("Browser storage is full. Remove a file and try again.");
    return false;
  }
}
function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2300);
}
function setView(view) {
  activeView = pageNames[view] ? view : "dashboard";
  document.querySelector("#page-label").textContent = pageNames[activeView];
  document.querySelectorAll("[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === activeView));
  document.querySelector("#sidebar").classList.remove("open");
  render();
  if (activeView === "planner") analyzePlannerFiles();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function heading(eyebrow, title, subtitle, action = "") {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ""}</div>`;
}
function progressMarkup(subject) {
  const amount = subjectProgress(subject);
  return `<div class="subject-progress-item"><div class="subject-progress-head"><span>${escapeHtml(subject.name)}</span><span>${amount}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${amount}%;--bar-color:${subject.color}"></div></div></div>`;
}
function getStreak() { return state.sessions.length ? Math.min(12, new Set(state.sessions.map(session => session.day)).size + 3) : 4; }
function completedMinutes() { return state.sessions.reduce((total, session) => total + session.duration, 0); }
function motivationalLine() {
  const messages = [
    `${state.tasks.filter(task => task.done).length} tasks checked off today. Small steps add up.`,
    `You've logged ${state.sessions.length} focus ${state.sessions.length === 1 ? "session" : "sessions"}. Keep your momentum going.`,
    `You're making steady progress across ${state.subjects.length} subjects. Keep showing up.`,
    "A short review today makes tomorrow's study session easier."
  ];
  return messages[new Date().getDate() % messages.length];
}
function dashboardView() {
  const minutes = completedMinutes();
  const doneTasks = state.tasks.filter(task => task.done).length;
  const tasks = state.tasks.slice(0, 4).map(task => `<div class="task-row ${task.done ? "is-done" : ""}"><input class="task-check" type="checkbox" data-task="${task.id}" ${task.done ? "checked" : ""} aria-label="Mark ${escapeHtml(task.title)} complete"><span class="subject-dot" style="background:${subjectColor(task.subject)}"></span><div class="task-copy"><strong>${escapeHtml(task.title)}</strong><small>${escapeHtml(task.subject)}</small></div><span class="task-time">${escapeHtml(task.time)}</span></div>`).join("") || `<div class="empty-state"><strong>A clear day.</strong>Add a task when you're ready.</div>`;
  const subjects = state.subjects.slice(0, 4).map(progressMarkup).join("") || `<div class="empty-state"><strong>No subjects yet.</strong>Create your first subject to get started.</div>`;
  return `${heading("THURSDAY, OCTOBER 15", `Good morning, ${escapeHtml(state.settings.name.split(" ")[0])} <span aria-hidden="true">✳</span>`, "A little progress each day adds up to big results.", `<button class="button button-light" data-action="start-quiz">◉ &nbsp; Quick quiz</button><button class="button button-primary" data-view="focus">▶ &nbsp; Start studying</button>`)}
    <div class="dashboard-grid"><div class="dashboard-main">
      <section class="welcome-banner"><div class="welcome-copy"><div class="eyebrow">YOUR STUDY SPACE</div><h2>Make today count.</h2><p>You have ${state.tasks.filter(task => !task.done).length} tasks waiting. Start with one and build your momentum.</p><button class="button" data-view="planner">View your plan <span>→</span></button></div><div class="welcome-art" aria-hidden="true"><div class="art-orbit"></div><div class="art-book"></div><span class="art-spark">✳</span></div></section>
      <div class="metric-row"><div class="metric-card"><div class="metric-top">Study streak <span class="metric-symbol symbol-coral">↗</span></div><div class="metric-value">${getStreak()} <small>days</small></div><div class="metric-note">You're building a habit</div></div><div class="metric-card"><div class="metric-top">This week <span class="metric-symbol symbol-green">◷</span></div><div class="metric-value">${Math.floor(minutes / 60)}h ${minutes % 60}m</div><div class="metric-note">Across ${state.sessions.length} focus sessions</div></div><div class="metric-card"><div class="metric-top">Tasks done <span class="metric-symbol symbol-yellow">✓</span></div><div class="metric-value">${doneTasks}<small> / ${state.tasks.length}</small></div><div class="metric-note">Keep the good work going</div></div><div class="metric-card"><div class="metric-top">Quiz average <span class="metric-symbol symbol-blue">◎</span></div><div class="metric-value">${quizAverage()}<small>%</small></div><div class="metric-note">${state.quizHistory.length ? `From ${state.quizHistory.length} quizzes` : "Ready when you are"}</div></div></div>
      <section class="panel"><div class="panel-heading"><h2>Today's plan</h2><button class="text-link" data-view="planner">See full plan →</button></div><div class="today-list">${tasks}</div></section>
      <section class="panel"><div class="panel-heading"><h2>Subject progress</h2><button class="text-link" data-view="subjects">All subjects →</button></div><div class="subject-progress-list">${subjects}</div></section>
    </div><div class="dashboard-side">
      <section class="panel"><div class="panel-heading"><h2>Upcoming deadlines</h2><button class="text-link" data-view="planner">See all</button></div><div class="deadline-list"><div class="deadline-row"><div class="deadline-date"><strong>20</strong><small>Oct</small></div><div class="deadline-copy"><strong>Networking midterm</strong><small>Networking · 10:00 AM</small></div><span class="deadline-count">5 days</span></div><div class="deadline-row"><div class="deadline-date"><strong>24</strong><small>Oct</small></div><div class="deadline-copy"><strong>Quadratics problem set</strong><small>Mathematics · 11:59 PM</small></div><span class="deadline-count">9 days</span></div><div class="deadline-row"><div class="deadline-date"><strong>29</strong><small>Oct</small></div><div class="deadline-copy"><strong>Essay first draft</strong><small>English · 5:00 PM</small></div><span class="deadline-count">14 days</span></div></div></section>
      <section class="panel"><div class="panel-heading"><h2>Pick up where you left off</h2></div><div class="subject-progress-item"><div class="subject-progress-head"><span>Subnet masks</span><span>Networking</span></div><div class="progress-track"><div class="progress-fill" style="width:62%;--bar-color:#77a985"></div></div><div class="metric-note">Last studied yesterday · 12 min read</div><button class="button button-light button-small" style="margin-top:12px" data-view="notes">Open notes →</button></div></section>
      <aside class="motivation"><span class="motivation-icon">✳</span><div><strong>A note for today</strong><p>${escapeHtml(motivationalLine())}</p></div></aside>
    </div></div>`;
}
function subjectsView() {
  const cards = state.subjects.map(subject => `<button class="subject-card" data-subject="${subject.id}"><div class="subject-card-top"><span class="subject-color" style="color:${subject.color};background:${subject.color}20">${escapeHtml(subject.icon || "▦")}</span><span class="text-link">Open →</span></div><h3>${escapeHtml(subject.name)}</h3><p>${subject.completed} of ${subject.topics} topics complete</p><div class="progress-track"><div class="progress-fill" style="width:${subjectProgress(subject)}%;--bar-color:${subject.color}"></div></div><div class="subject-card-foot"><span>${subjectProgress(subject)}% complete</span><span>${(subject.modules || []).length} ${(subject.modules || []).length === 1 ? "module" : "modules"}</span></div></button>`).join("");
  return `${heading("YOUR LEARNING LIBRARY", "Your subjects", "Keep every topic, note, and practice session in one place.", `<button class="button button-primary" data-action="add-subject">＋ &nbsp; New subject</button>`)}<div class="subject-grid">${cards || `<div class="empty-state"><strong>Start with a subject.</strong>Add one to organize your study materials.</div>`}</div>`;
}
function defaultWeekPlan() {
  return [
    [{ title: "CIDR notation", subject: "Networking", duration: "25 min" }],
    [{ title: "Subnet masks", subject: "Networking", duration: "30 min" }],
    [{ title: "Practice questions", subject: "Networking", duration: "25 min" }],
    [{ title: "Review mistakes", subject: "Networking", duration: "20 min" }],
    [{ title: "Quadratic equations", subject: "Mathematics", duration: "30 min" }]
  ];
}
function plannerView() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const plan = state.plan || defaultWeekPlan();
  const materials = state.subjects.flatMap(subject => (subject.modules || [])
    .filter(module => (module.files || []).length)
    .map(module => ({ subject, module })));
  const columns = days.map((day, index) => {
    const tasks = (plan[index] || []).map(item => {
      const module = item.moduleId ? state.subjects.flatMap(subject => subject.modules || []).find(candidate => candidate.id === item.moduleId) : null;
      const objectives = item.studyObjectives?.length ? item.studyObjectives : [...new Set((module?.files || []).flatMap(file => (file.studyGuide?.objectives || []).map(objective => objective.text)))];
      const fileNames = item.fileNames?.length ? item.fileNames : (module?.files || []).map(file => file.name);
      return `<div class="plan-item" style="--bar-color:${subjectColor(item.subject)}"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.subject)} · ${escapeHtml(item.duration)}</small>${objectives.length ? `<ul class="plan-objectives">${objectives.map(objective => `<li>${escapeHtml(objective)}</li>`).join("")}</ul>` : ""}${fileNames.length ? `<small class="plan-material-files">Files: ${escapeHtml(fileNames.join(", "))}</small>` : ""}</div>`;
    }).join("");
    return `<div class="day-column"><h3>${day}</h3>${tasks}</div>`;
  }).join("");
  const materialCards = materials.map(({ subject, module }) => {
    const alreadyPlanned = plan.some(day => day.some(item => item.moduleId === module.id));
    const files = module.files.map(file => `<div class="planner-file-row"><span class="file-symbol">↳</span><div class="file-details"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(formatFileSize(file.size))} · ${escapeHtml(file.type.split("/").pop().toUpperCase())}</small></div><button class="text-link" data-download-file="${escapeHtml(file.id)}" data-subject-id="${escapeHtml(subject.id)}" data-module-id="${escapeHtml(module.id)}">Open file</button></div>`).join("");
    const objectives = module.files.flatMap(file => (file.studyGuide?.objectives || []).map((objective, index) => `<label class="planner-objective ${objective.done ? "is-done" : ""}"><input type="checkbox" data-study-objective data-subject-id="${escapeHtml(subject.id)}" data-module-id="${escapeHtml(module.id)}" data-file-id="${escapeHtml(file.id)}" data-objective-index="${index}" ${objective.done ? "checked" : ""}><span>${escapeHtml(objective.text)}</span></label>`));
    const topics = [...new Set(module.files.flatMap(file => file.studyGuide?.topics || []))];
    const guides = module.files.map(file => file.studyGuide).filter(Boolean);
    const preview = guides.map(guide => guide.excerpt).filter(Boolean).join(" ").slice(0, 1100);
    const analysisMessage = guides.some(guide => guide.status === "processing") ? "Reading the file and finding study objectives…" : guides.some(guide => guide.status === "unavailable") ? "Could not scan this file here. Open it and use the module description to guide your review." : "No objectives were detected. Open the file and use its headings to decide what to review.";
    const studyGuide = `<div class="planner-study-guide">${objectives.length ? `<h4>What to study</h4><div class="planner-objectives">${objectives.join("")}</div>` : `<p class="planner-guide-message">${escapeHtml(analysisMessage)}</p>`}${topics.length ? `<div class="planner-topic-tags">${topics.map(topic => `<span class="tag">${escapeHtml(topic)}</span>`).join("")}</div>` : ""}${preview ? `<details class="planner-preview"><summary>File text preview</summary><p>${escapeHtml(preview)}</p></details>` : ""}</div>`;
    return `<article class="planner-material" style="--bar-color:${subject.color}"><div class="planner-material-heading"><div><span class="planner-subject-label">${escapeHtml(subject.name)}</span><h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.description || "Study the attached material and review its key ideas.")}</p></div><button class="button button-light button-small" data-action="plan-study-module" data-subject-id="${escapeHtml(subject.id)}" data-module-id="${escapeHtml(module.id)}" ${alreadyPlanned ? "disabled" : ""}>${alreadyPlanned ? "In this week’s plan" : "Add to plan →"}</button></div>${studyGuide}<div class="planner-file-list">${files}</div></article>`;
  }).join("") || `<div class="empty-state"><strong>No uploaded study files yet.</strong>Add files to a subject module and they’ll appear here with a one-click way to plan a study session.</div>`;
  return `${heading("A LITTLE STRUCTURE GOES A LONG WAY", "Study planner", "Plan your week from topics and the files you’ve added to each subject.", `<button class="button button-primary" data-action="create-plan">✳ &nbsp; Build a plan</button>`)}<div class="planner-layout"><div class="planner-main"><section class="panel"><div class="panel-heading"><h2>This week</h2><span class="metric-note">${state.plan ? "Your custom plan" : "Suggested study week"}</span></div><div class="week-grid">${columns}</div></section><section class="panel planner-materials-panel"><div class="panel-heading"><div><h2>Study from your files</h2><p class="panel-subtitle">Review the module goal, open its files, or add the module to this week.</p></div><span class="metric-symbol symbol-blue">↗</span></div><div class="planner-material-list">${materialCards}</div></section></div><aside class="panel"><div class="panel-heading"><h2>Your next exam</h2><span class="metric-symbol symbol-coral">⌁</span></div><h3 style="font:700 15px Manrope;margin:2px 0 5px">Networking midterm</h3><p style="color:var(--muted);font-size:10px;margin:0 0 16px">Monday, October 20 · 10:00 AM</p><div class="subject-progress-head"><span>Preparation</span><span>7 of 12 topics</span></div><div class="progress-track" style="margin:8px 0 15px"><div class="progress-fill" style="width:58%;--bar-color:#77a985"></div></div><div class="planner-note"><h3>Plan around your time</h3><p>Choose a subject, exam date, and daily study time. StudyFlow will spread your topics across the week.</p><button class="button button-light button-small" data-action="create-plan">Customize plan →</button></div></aside></div>`;
}
function scheduleStudyModule(subjectId, moduleId) {
  const subject = state.subjects.find(item => item.id === subjectId);
  const module = subject?.modules?.find(item => item.id === moduleId);
  if (!subject || !module) return;
  const plan = state.plan || defaultWeekPlan();
  if (plan.some(day => day.some(item => item.moduleId === module.id))) {
    showToast("This module is already in your plan.");
    return;
  }
  const targetDay = plan.reduce((lightest, day, index) => day.length < plan[lightest].length ? index : lightest, 0);
  const studyObjectives = [...new Set((module.files || []).flatMap(file => (file.studyGuide?.objectives || []).map(objective => objective.text)))];
  plan[targetDay].push({ title: module.title, subject: subject.name, duration: "25 min", moduleId: module.id, fileNames: (module.files || []).map(file => file.name), studyObjectives });
  state.plan = plan;
  if (!save()) return;
  setView("planner");
  showToast(`${module.title} added to your study week.`);
}
function notesView() {
  const notes = state.notes;
  const cards = notes.map(note => `<article class="note-card" data-note="${note.id}"><div class="note-card-top"><span class="note-subject">${escapeHtml(note.subject)} · ${escapeHtml(note.topic)}</span><button class="favorite-button ${note.favorite ? "is-favorite" : ""}" data-favorite="${note.id}" aria-label="Toggle favorite">★</button></div><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.content)}</p><div class="note-tags">${note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}<span class="tag">${escapeHtml(note.updated)}</span></div></article>`).join("");
  return `${heading("YOUR IDEAS, IN ONE PLACE", "Notes", "Quick to capture, easy to find when you need them.", `<button class="button button-primary" data-action="add-note">＋ &nbsp; New note</button>`)}<div class="section-toolbar"><input class="search-input" id="note-search" placeholder="⌕  Search your notes" aria-label="Search notes"><select class="filter-select" id="note-filter"><option value="all">All notes</option><option value="recent">Recent</option><option value="favorites">Favorites</option>${state.subjects.map(subject => `<option value="${escapeHtml(subject.name)}">${escapeHtml(subject.name)}</option>`).join("")}</select></div><div class="notes-grid">${cards || `<div class="empty-state"><strong>No notes match.</strong>Try another filter, or create a note.</div>`}</div>`;
}
function flashcardsView() {
  const cards = getStudyDeck();
  if (!cards.length) return `${heading("ACTIVE RECALL", "Flashcards", "Create a card to start practicing.", `<button class="button button-primary" data-action="add-card">＋ &nbsp; New card</button>`)}<div class="empty-state"><strong>Your deck is ready for its first card.</strong>Add a question and answer to begin.</div>`;
  const card = cards[activeCardIndex % cards.length];
  return `${heading("ACTIVE RECALL", "Flashcards", "A quick round of retrieval practice helps ideas stick.", `<button class="button button-light" data-action="add-card">＋ &nbsp; New card</button>`)}<div class="flashcard-wrap"><div class="flashcard-progress"><span>${escapeHtml(card.subject)} · ${escapeHtml(card.difficulty)} review</span><span>${activeCardIndex % cards.length + 1} / ${cards.length}</span></div><button class="flashcard" id="flashcard" aria-label="Flip flashcard"><span class="flashcard-label">${showingAnswer ? "Answer" : "Question"}</span><h2>${escapeHtml(showingAnswer ? card.answer : card.question)}</h2><span class="flashcard-hint">Click the card to ${showingAnswer ? "see question" : "reveal answer"}</span></button><div class="flashcard-controls"><button class="button" data-rate="hard">Difficult</button><button class="button" data-rate="practice">Need practice</button><button class="button" data-rate="easy">Easy</button></div><div style="text-align:center;margin-top:13px"><button class="text-link" data-action="next-card">Skip to next →</button></div></div>`;
}
function quizzesView() {
  const rows = state.subjects.map(subject => {
    const history = state.quizHistory.filter(item => item.subject === subject.name);
    const score = history.length ? `${Math.round(history.reduce((total, item) => total + item.score, 0) / history.length)}% avg` : "Not started";
    return `<div class="quiz-row"><span class="quiz-icon">◉</span><div class="quiz-copy"><strong>${escapeHtml(subject.name)} check-in</strong><small>${state.questions.filter(question => question.subject === subject.name).length} practice questions · ${history.length} completed</small></div><span class="quiz-score">${score}</span><button class="button button-light button-small" data-start-subject-quiz="${escapeHtml(subject.name)}">Start →</button></div>`;
  }).join("");
  return `${heading("PRACTICE MAKES PROGRESS", "Quick quizzes", "Short, focused checks that show what’s sticking.", `<button class="button button-primary" data-action="start-quiz">◉ &nbsp; Start a quick quiz</button>`)}<section class="panel"><div class="panel-heading"><h2>Choose a subject</h2><span class="metric-note">${5 - dailyQuizCount()} free quizzes left today</span></div><div class="quiz-list">${rows || `<div class="empty-state"><strong>Add a subject first.</strong>Then you can practice its topics here.</div>`}</div></section><div class="progress-layout" style="margin-top:15px"><section class="panel"><div class="panel-heading"><h2>Recent quiz results</h2><span class="metric-note">Your last attempts</span></div>${state.quizHistory.length ? `<div class="session-history">${state.quizHistory.slice(-4).reverse().map(result => `<div class="history-row"><span>${escapeHtml(result.subject)} · ${escapeHtml(result.date)}</span><span>${result.score}%</span></div>`).join("")}</div>` : `<div class="empty-state"><strong>Your results will show up here.</strong>Take a quick quiz to see how you're doing.</div>`}</section><section class="panel"><div class="panel-heading"><h2>How it works</h2></div><p style="font-size:10px;color:var(--muted);line-height:1.7;margin:0">Each quiz gives you up to five questions, instant feedback, and a score you can use to spot topics worth revisiting.</p></section></div>`;
}
function dailyQuizCount() { const key = new Date().toDateString(); return state.quizHistory.filter(item => item.day === key).length; }
function focusView() {
  const minutes = completedMinutes();
  return `${heading("ONE THING AT A TIME", "Focus timer", "Give your attention somewhere to land.", "")}<div class="timer-layout"><section class="timer-panel"><div class="timer-tabs"><button class="${timerMode === "focus" ? "active" : ""}" data-timer-mode="focus">Focus · 25 min</button><button class="${timerMode === "short" ? "active" : ""}" data-timer-mode="short">Short break · 5 min</button><button class="${timerMode === "long" ? "active" : ""}" data-timer-mode="long">Long break · 15 min</button></div><div class="timer-clock" id="timer-clock">${formatTime(timerSeconds)}</div><div class="timer-caption" id="timer-caption">${timerRunning ? "You're in a focus session. Keep going." : "Ready when you are. Pick one thing to focus on."}</div><div class="timer-controls"><button class="button button-primary" data-action="timer-toggle">${timerRunning ? "Ⅱ  Pause" : "▶  Start focus"}</button><button class="button button-light" data-action="timer-reset">↻ &nbsp; Reset</button></div></section><div class="dashboard-side"><section class="panel"><div class="panel-heading"><h2>Today's focus</h2><span class="metric-symbol symbol-green">◷</span></div><div class="session-stat"><span>Time studied</span><strong>${Math.floor(minutes / 60)}h ${minutes % 60}m</strong></div><div class="session-stat"><span>Sessions completed</span><strong>${state.sessions.length}</strong></div><div class="session-stat"><span>Study streak</span><strong>${getStreak()} days</strong></div></section><section class="panel"><div class="panel-heading"><h2>Recent sessions</h2></div>${state.sessions.length ? `<div class="session-history">${state.sessions.slice(-4).reverse().map(session => `<div class="history-row"><span>${escapeHtml(session.subject || "Study session")}</span><span>${session.duration} min</span></div>`).join("")}</div>` : `<p style="color:var(--muted);font-size:10px;line-height:1.6;margin:0">Your completed sessions will appear here. Start with one focused 25-minute block.</p>`}</section></div></div>`;
}
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function progressView() {
  const dailyMinutes = Array(7).fill(0);
  state.sessions.forEach(session => { const index = Math.max(0, Math.min(6, Math.floor((Date.now() - new Date(session.date).getTime()) / 86400000))); dailyMinutes[6 - index] += session.duration; });
  const max = Math.max(30, ...dailyMinutes);
  const labels = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
  const bars = dailyMinutes.map((value, index) => `<div class="chart-day"><div class="chart-bar" style="--bar-height:${Math.max(value ? 7 : 2, value / max * 155)}px" title="${value} minutes"></div><small>${labels[index]}</small></div>`).join("");
  const quizTopicStats = {};
  state.quizHistory.forEach(result => result.mistakes.forEach(topic => { quizTopicStats[topic] = (quizTopicStats[topic] || 0) + 1; }));
  const weakTopics = Object.entries(quizTopicStats).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const weakMarkup = weakTopics.length ? weakTopics.map(([topic, count], index) => `<div class="topic-row"><span class="topic-rank">${index + 1}</span><div class="topic-copy">${escapeHtml(topic)}<small>${count} missed ${count === 1 ? "question" : "questions"}</small></div><span class="topic-score">Review</span></div>`).join("") : `<div class="empty-state"><strong>No weak spots yet.</strong>Take a quiz to find what to revisit.</div>`;
  return `${heading("THE WORK IS ADDING UP", "Your progress", "A clear view of your time, consistency, and next steps.", "")}<div class="metric-row" style="margin-bottom:15px"><div class="metric-card"><div class="metric-top">Quiz average <span class="metric-symbol symbol-blue">◎</span></div><div class="metric-value">${quizAverage()}<small>%</small></div><div class="metric-note">${state.quizHistory.length} quizzes taken</div></div><div class="metric-card"><div class="metric-top">Topics completed <span class="metric-symbol symbol-green">✓</span></div><div class="metric-value">${state.subjects.reduce((total, subject) => total + subject.completed, 0)}<small> / ${state.subjects.reduce((total, subject) => total + subject.topics, 0)}</small></div><div class="metric-note">Across ${state.subjects.length} subjects</div></div><div class="metric-card"><div class="metric-top">Study streak <span class="metric-symbol symbol-coral">↗</span></div><div class="metric-value">${getStreak()}<small> days</small></div><div class="metric-note">Keep showing up</div></div><div class="metric-card"><div class="metric-top">Total study time <span class="metric-symbol symbol-yellow">◷</span></div><div class="metric-value">${Math.floor(completedMinutes() / 60)}<small>h ${completedMinutes() % 60}m</small></div><div class="metric-note">${state.sessions.length} sessions logged</div></div></div><div class="progress-layout"><section class="panel"><div class="panel-heading"><h2>Study time</h2><span class="metric-note">Last 7 days</span></div><div class="chart-bars">${bars}</div></section><section class="panel"><div class="panel-heading"><h2>Topics to revisit</h2><span class="metric-symbol symbol-yellow">↗</span></div><div class="topic-list">${weakMarkup}</div></section><section class="panel"><div class="panel-heading"><h2>Subject progress</h2><button class="text-link" data-view="subjects">View subjects →</button></div><div class="subject-progress-list">${state.subjects.map(progressMarkup).join("")}</div></section><section class="panel"><div class="panel-heading"><h2>Study consistency</h2></div><div class="motivation"><span class="motivation-icon">✳</span><div><strong>You're making progress.</strong><p>${escapeHtml(motivationalLine())}</p></div></div></section></div>`;
}
function settingsView() {
  return `${heading("YOUR ACCOUNT", "Settings", "Make StudyFlow feel like your space.", `<button class="button button-primary" data-action="save-settings">Save changes</button>`)}<div class="settings-grid"><section class="panel"><div class="panel-heading"><h2>Profile</h2></div><div class="field"><label for="profile-name">Your name</label><input id="profile-name" value="${escapeHtml(state.settings.name)}"></div><div class="field"><label for="profile-email">Email address</label><input id="profile-email" type="email" value="jamie.davis@example.com"></div><div class="settings-row"><div><strong>Current plan</strong><small>Free · Your core study tools are included</small></div><button class="text-link" data-view="upgrade">See Pro →</button></div></section><section class="panel"><div class="panel-heading"><h2>Preferences</h2></div><div class="settings-row"><div><strong>Study reminders</strong><small>A gentle nudge to keep your routine</small></div><input class="toggle" type="checkbox" id="reminder-toggle" ${state.settings.reminders ? "checked" : ""} aria-label="Study reminders"></div><div class="settings-row"><div><strong>Dark mode</strong><small>Switch to a darker color theme</small></div><input class="toggle" type="checkbox" id="dark-toggle" ${state.settings.darkMode ? "checked" : ""} aria-label="Dark mode"></div><div class="settings-row"><div><strong>Demo data</strong><small>Explore the app with sample content</small></div><button class="text-link" data-action="reset-demo">Reset demo</button></div></section><section class="panel"><div class="panel-heading"><h2>About StudyFlow</h2></div><p style="font-size:10px;color:var(--muted);line-height:1.7;margin:0">StudyFlow is your personal study companion. Your data is stored in this browser and stays on this device.</p><div class="settings-row" style="margin-top:10px"><div><strong>Data storage</strong><small>Local browser storage</small></div><span class="subject-color" style="color:var(--green);background:var(--mint)">✓</span></div></section><section class="panel"><div class="panel-heading"><h2>Quick actions</h2></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="button button-light button-small" data-action="export-notes">↓ &nbsp; Export notes</button><button class="button button-light button-small" data-view="upgrade">✳ &nbsp; Explore Pro</button></div></section></div>`;
}
function upgradeView() {
  return `${heading("MORE ROOM FOR YOUR ROUTINE", "Choose how you study", "Start free. Upgrade when a little more flexibility makes a difference.", "")}<section class="upgrade-hero"><div class="eyebrow">STUDYFLOW PRO</div><h2>Make your study time work harder.</h2><p>More room for your ideas, clearer insight into your progress, and a study routine that fits you.</p></section><div class="plan-grid"><section class="plan-card"><h3>Free</h3><div class="plan-price">$0 <small>/ forever</small></div><p style="color:var(--muted);font-size:10px">Everything you need to build a solid study habit.</p><ul><li>Up to 3 subjects</li><li>Basic notes and flashcards</li><li>5 quizzes per day</li><li>Pomodoro focus timer</li><li>Weekly progress summary</li></ul><button class="button button-light" style="width:100%" disabled>Current plan</button></section><section class="plan-card featured"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Pro</h3><span class="tag" style="color:#48764e;background:#eaf4eb">MOST FLEXIBLE</span></div><div class="plan-price">$3.99 <small>/ month</small></div><p style="color:var(--muted);font-size:10px">More tools for a study routine that keeps growing.</p><ul><li>Unlimited subjects, notes, and cards</li><li>Advanced progress insights</li><li>Custom study plans</li><li>Dark mode and PDF export</li><li>Cloud backup and exam countdowns</li></ul><button class="button button-primary" style="width:100%" data-action="unlock-pro">Try Pro demo →</button></section></div><p style="color:#909a92;font-size:9px;text-align:center;margin-top:13px">Demo only · No payment details needed. Upgrade screens are simulated for this portfolio project.</p>`;
}
const views = { dashboard: dashboardView, subjects: subjectsView, planner: plannerView, notes: notesView, flashcards: flashcardsView, quizzes: quizzesView, focus: focusView, progress: progressView, settings: settingsView, upgrade: upgradeView };
function render() {
  root.innerHTML = (views[activeView] || dashboardView)();
  const planLabel = document.querySelector(".profile-copy small");
  if (planLabel) planLabel.textContent = state.settings.pro ? "Pro demo" : "Free plan";
  if (activeView === "settings") {
    const planDescription = document.querySelector(".settings-grid .panel:first-child .settings-row small");
    if (planDescription) planDescription.textContent = state.settings.pro ? "Pro demo · Advanced tools enabled" : "Free · Your core study tools are included";
    const darkToggle = document.querySelector("#dark-toggle");
    if (darkToggle && !state.settings.pro) {
      const unlockButton = document.createElement("button");
      unlockButton.className = "text-link";
      unlockButton.dataset.view = "upgrade";
      unlockButton.textContent = "Unlock with Pro →";
      darkToggle.replaceWith(unlockButton);
      const description = unlockButton.closest(".settings-row").querySelector("small");
      if (description) description.textContent = "Included with the Pro demo";
    }
  }
  if (activeView === "upgrade") {
    const freeLimit = document.querySelector(".plan-card:first-child li");
    if (freeLimit) freeLimit.textContent = "3 personal subjects + sample library";
    const proButton = document.querySelector('[data-action="unlock-pro"]');
    if (proButton && state.settings.pro) { proButton.textContent = "Pro demo enabled"; proButton.disabled = true; }
    const freeButton = document.querySelector(".plan-card:first-child button");
    if (freeButton && state.settings.pro) { freeButton.textContent = "Switch to Free"; freeButton.disabled = false; freeButton.dataset.action = "reset-plan"; }
  }
  if (activeView === "quizzes" && state.settings.pro) {
    const quizLimit = document.querySelector(".panel .panel-heading .metric-note");
    if (quizLimit) quizLimit.textContent = "Unlimited quizzes";
  }
  document.querySelectorAll(".mobile-nav [data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === activeView));
  if (activeView === "focus") updateTimerDisplay();
}
function quizAverage() { return state.quizHistory.length ? Math.round(state.quizHistory.reduce((total, result) => total + result.score, 0) / state.quizHistory.length) : 0; }
function openModal(title, subtitle, content, wide = false) {
  modal.className = `modal${wide ? " modal-wide" : ""}`;
  modal.innerHTML = `<div class="modal-header"><div><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">×</button></div>${content}`;
  const workspaceActions = modal.querySelector(".subject-workspace-actions");
  const addModuleButton = workspaceActions?.querySelector('[data-action="add-study-module"]');
  if (workspaceActions && addModuleButton) {
    const buttonGroup = document.createElement("div");
    buttonGroup.className = "module-action-buttons";
    const addFilesButton = document.createElement("button");
    addFilesButton.className = "button button-light";
    addFilesButton.dataset.action = "add-subject-files";
    addFilesButton.dataset.subjectId = addModuleButton.dataset.subjectId;
    addFilesButton.textContent = "↑ Add local files";
    workspaceActions.append(buttonGroup);
    buttonGroup.append(addFilesButton, addModuleButton);
  }
  const fileInput = modal.querySelector('input[type="file"]');
  if (fileInput) {
    const remainingUploads = Math.max(0, 5 - dailyFileUploadCount());
    const hint = fileInput.closest(".field")?.querySelector(".file-input-hint");
    if (hint) hint.textContent = `${remainingUploads} of 5 file uploads remain today. File size depends on available browser storage.`;
    fileInput.disabled = remainingUploads === 0;
    const submitButton = modal.querySelector(".modal-actions .button-primary");
    if (submitButton && remainingUploads === 0) submitButton.disabled = true;
  }
  const storageNote = modal.querySelector(".file-storage-note");
  if (storageNote) storageNote.textContent = "Daily limit: 5 files across all subjects. File size depends on available browser storage.";
  modalBackdrop.hidden = false;
  modal.querySelector("input, select, textarea, button")?.focus();
}
function closeModal() { modalBackdrop.hidden = true; modal.innerHTML = ""; quizRun = null; }
function subjectOptions(selected = "") { return state.subjects.map(subject => `<option value="${escapeHtml(subject.name)}" ${subject.name === selected ? "selected" : ""}>${escapeHtml(subject.name)}</option>`).join(""); }
function formatFileSize(size) { return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`; }
let pdfJsModulePromise;
function buildStudyGuide(text, pageCount = null) {
  const normalized = text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const objectiveHeader = normalized.match(/(?:learning objectives|objectives|learning outcomes)/i);
  let objectiveText = objectiveHeader ? normalized.slice(objectiveHeader.index + objectiveHeader[0].length, objectiveHeader.index + objectiveHeader[0].length + 2600) : normalized;
  const nextSection = objectiveText.search(/\b(?:What is|Introduction to|Overview|Definition of)\b/i);
  if (nextSection > 0) objectiveText = objectiveText.slice(0, nextSection);
  const objectivePattern = /\b(?:Define|Explain|Illustrate|Apply|Discuss|Identify|Compare|Describe|Calculate|Determine|Analyze|Summarize|Distinguish|Demonstrate|Configure|List|Recognize|Evaluate|Outline|Classify)\b[^.!?]{3,260}[.!?]?/gi;
  const objectives = [...objectiveText.matchAll(objectivePattern)].map(match => match[0].trim()).filter((text, index, list) => list.findIndex(item => item.toLowerCase() === text.toLowerCase()) === index).slice(0, 10).map(text => ({ text, done: false }));
  const topicPattern = /\b(?:What is|Why use|Benefits of|Limitations of|Understanding|Introduction to)\s+[^.!?]{2,90}/gi;
  const topics = [...normalized.matchAll(topicPattern)].map(match => match[0].trim()).filter((text, index, list) => list.findIndex(item => item.toLowerCase() === text.toLowerCase()) === index).slice(0, 8);
  return { version: 1, status: "ready", pageCount, objectives, topics, excerpt: normalized.slice(0, 900) };
}
async function extractStudyGuide(file, blob) {
  const extension = file.name.split(".").pop().toLowerCase();
  if (file.type === "application/pdf" || extension === "pdf") {
    try {
      pdfJsModulePromise ||= import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.min.mjs");
      const pdfjs = await pdfJsModulePromise;
      pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs";
      const pdf = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
      const pages = [];
      for (let firstPage = 1; firstPage <= pdf.numPages; firstPage += 4) {
        const batch = await Promise.all(Array.from({ length: Math.min(4, pdf.numPages - firstPage + 1) }, async (_, offset) => {
          const page = await pdf.getPage(firstPage + offset);
          const content = await page.getTextContent();
          return content.items.map(item => item.str).join(" ");
        }));
        pages.push(...batch);
      }
      return buildStudyGuide(pages.join(" "), pdf.numPages);
    } catch {
      return { version: 1, status: "unavailable", objectives: [], topics: [], excerpt: "PDF text could not be read in this browser. Open the file to review it manually." };
    }
  }
  if (["txt", "md", "markdown", "csv"].includes(extension) || file.type.startsWith("text/")) {
    const text = await blob.text();
    const headings = [...text.matchAll(/^#{1,3}\s+(.+)$/gm)].map(match => match[1].trim()).slice(0, 8);
    const bulletItems = [...text.matchAll(/^(?:[-*•]|\d+[.)])\s+(.+)$/gm)].map(match => ({ text: match[1].trim(), done: false })).slice(0, 10);
    const guide = buildStudyGuide(text);
    guide.topics = [...new Set([...headings, ...guide.topics])].slice(0, 8);
    if (!guide.objectives.length) guide.objectives = bulletItems;
    return guide;
  }
  return { version: 1, status: "unsupported", objectives: [], topics: [], excerpt: "This file type cannot be text-scanned here. Open the original file and use the module description to guide your review." };
}
function dailyFileUploadCount() {
  const todayKey = new Date().toDateString();
  return state.fileUploads.filter(upload => upload.day === todayKey).length;
}
function openStudyFileDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("studyflow-file-data", 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("files")) request.result.createObjectStore("files", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function storeStudyFiles(files) {
  const database = await openStudyFileDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      files.forEach(item => store.put({ id: item.id, blob: item.file }));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}
async function getStudyFileBlob(id) {
  const database = await openStudyFileDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction("files", "readonly").objectStore("files").get(id);
      request.onsuccess = () => resolve(request.result?.blob || null);
      request.onerror = () => reject(request.error);
    });
  } finally { database.close(); }
}
async function getAttachmentBlob(file) {
  if (!file.data) return getStudyFileBlob(file.id);
  const binary = atob(file.data.split(",")[1] || "");
  return new Blob([Uint8Array.from(binary, character => character.charCodeAt(0))], { type: file.type });
}
let plannerFileAnalysisRunning = false;
async function analyzePlannerFiles() {
  if (plannerFileAnalysisRunning) return;
  const pending = state.subjects.flatMap(subject => (subject.modules || []).flatMap(module => (module.files || []).filter(file => file.studyGuide?.version !== 1).map(file => ({ file, previousGuide: file.studyGuide }))));
  if (!pending.length) return;
  plannerFileAnalysisRunning = true;
  pending.forEach(({ file }) => { file.studyGuide = { version: 1, status: "processing", objectives: [], topics: [], excerpt: "" }; });
  render();
  for (const { file, previousGuide } of pending) {
    try {
      const blob = await getAttachmentBlob(file);
      const previousObjectives = previousGuide?.objectives || [];
      const studyGuide = blob ? await extractStudyGuide(file, blob) : { version: 1, status: "unavailable", objectives: [], topics: [], excerpt: "The stored file data is unavailable." };
      studyGuide.objectives = studyGuide.objectives.map(objective => ({ ...objective, done: previousObjectives.some(previous => previous.text === objective.text && previous.done) }));
      file.studyGuide = studyGuide;
    } catch {
      file.studyGuide = { version: 1, status: "unavailable", objectives: [], topics: [], excerpt: "The file could not be analyzed in this browser." };
    }
    save();
    if (activeView === "planner") render();
  }
  plannerFileAnalysisRunning = false;
}
async function deleteStudyFileBlobs(ids) {
  if (!ids.length) return;
  const database = await openStudyFileDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("files", "readwrite");
      const store = transaction.objectStore("files");
      ids.forEach(id => store.delete(id));
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { database.close(); }
}
async function downloadStudyFile(file) {
  let blob;
  if (file.data) {
    const binary = atob(file.data.split(",")[1] || "");
    blob = new Blob([Uint8Array.from(binary, character => character.charCodeAt(0))], { type: file.type });
  } else blob = await getStudyFileBlob(file.id);
  if (!blob) throw new Error("Stored file data is missing.");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function subjectWorkspace(subjectId) {
  const subject = state.subjects.find(item => item.id === subjectId);
  if (!subject) return;
  const modules = subject.modules || [];
  const moduleMarkup = modules.map(module => `<article class="study-module"><div class="module-heading"><div><h3>${escapeHtml(module.title)}</h3><p>${escapeHtml(module.description || "No description added.")}</p></div><button class="module-remove" data-action="remove-study-module" data-subject-id="${escapeHtml(subject.id)}" data-module-id="${escapeHtml(module.id)}" aria-label="Remove ${escapeHtml(module.title)}">×</button></div><div class="module-files">${(module.files || []).map(file => `<div class="module-file"><span class="file-symbol">↳</span><div class="file-details"><strong>${escapeHtml(file.name)}</strong><small>${escapeHtml(formatFileSize(file.size))} · ${escapeHtml(file.type.split("/").pop().toUpperCase())}</small></div><button class="text-link" data-download-file="${escapeHtml(file.id)}" data-subject-id="${escapeHtml(subject.id)}" data-module-id="${escapeHtml(module.id)}">Download</button><button class="module-remove" data-action="remove-study-file" data-subject-id="${escapeHtml(subject.id)}" data-module-id="${escapeHtml(module.id)}" data-file-id="${escapeHtml(file.id)}" aria-label="Remove ${escapeHtml(file.name)}">×</button></div>`).join("") || `<p class="module-empty">No files yet. Add a document, slide deck, or other study material.</p>`}</div><button class="button button-light button-small" data-action="attach-study-files" data-subject-id="${escapeHtml(subject.id)}" data-module-id="${escapeHtml(module.id)}">＋ Add files</button></article>`).join("");
  openModal(escapeHtml(subject.name), `${subject.completed} of ${subject.topics} topics complete · ${modules.length} study modules`, `<div class="subject-workspace"><div class="subject-workspace-actions"><p>Keep course materials organized by topic. Files stay in this browser.</p><button class="button button-primary" data-action="add-study-module" data-subject-id="${escapeHtml(subject.id)}">＋ &nbsp; New module</button></div><div class="study-module-list">${moduleMarkup || `<div class="empty-state"><strong>No study modules yet.</strong>Add a module for a topic, then attach files to it.</div>`}</div><p class="file-storage-note">Files up to 1 MB each are stored in this browser. Download important files before clearing browser data.</p></div>`, true);
}
function addStudyModuleModal(subjectId) {
  const subject = state.subjects.find(item => item.id === subjectId);
  if (!subject) return;
  openModal("New study module", `Add a topic module to ${escapeHtml(subject.name)}.`, `<form id="study-module-form" data-subject-id="${escapeHtml(subject.id)}"><div class="field"><label for="module-title">Module name</label><input id="module-title" name="title" placeholder="e.g. Network addressing" required maxlength="80"></div><div class="field"><label for="module-description">What are you studying?</label><textarea id="module-description" name="description" placeholder="Add a short description or learning goal"></textarea></div><div class="modal-actions"><button type="button" class="button button-light" data-action="subject-workspace" data-subject-id="${escapeHtml(subject.id)}">Cancel</button><button class="button button-primary">Create module</button></div></form>`);
}
function addStudyFilesModal(subjectId, moduleId) {
  const subject = state.subjects.find(item => item.id === subjectId);
  const module = subject?.modules?.find(item => item.id === moduleId);
  if (!subject || !module) return;
  openModal("Add study files", `Attach files to ${escapeHtml(module.title)}.`, `<form id="study-files-form" data-subject-id="${escapeHtml(subject.id)}" data-module-id="${escapeHtml(module.id)}"><div class="field"><label for="study-files">Choose files</label><input id="study-files" name="files" type="file" multiple required><small class="file-input-hint">Up to 1 MB per file. Common documents, slides, images, and text files are supported.</small></div><div class="modal-actions"><button type="button" class="button button-light" data-action="subject-workspace" data-subject-id="${escapeHtml(subject.id)}">Cancel</button><button class="button button-primary">Attach files</button></div></form>`);
}
function addSubjectFilesModal(subjectId) {
  const subject = state.subjects.find(item => item.id === subjectId);
  if (!subject) return;
  const modules = subject.modules || [];
  const destination = modules.length
    ? `<div class="field"><label for="subject-file-module">Add files to module</label><select id="subject-file-module" name="moduleId">${modules.map(module => `<option value="${escapeHtml(module.id)}">${escapeHtml(module.title)}</option>`).join("")}</select></div>`
    : `<div class="field"><label for="subject-file-module-title">Module name</label><input id="subject-file-module-title" name="moduleTitle" value="Study files" required maxlength="80"><small class="file-input-hint">A module will be created automatically for these files.</small></div>`;
  openModal("Add local files", `Choose files from this device for ${escapeHtml(subject.name)}.`, `<form id="subject-files-form" data-subject-id="${escapeHtml(subject.id)}">${destination}<div class="field"><label for="subject-study-files">Choose files</label><input id="subject-study-files" name="files" type="file" multiple required><small class="file-input-hint">Up to 1 MB per file. Files stay in this browser.</small></div><div class="modal-actions"><button type="button" class="button button-light" data-action="subject-workspace" data-subject-id="${escapeHtml(subject.id)}">Cancel</button><button class="button button-primary">Add to subject</button></div></form>`);
}
function addSubjectModal() {
  openModal("Create a subject", "Give a subject its own space.", `<form id="subject-form"><div class="field"><label for="subject-name">Subject name</label><input id="subject-name" name="name" placeholder="e.g. Biology" required maxlength="36"></div><div class="form-grid"><div class="field"><label for="subject-topics">Number of topics</label><input id="subject-topics" name="topics" type="number" min="1" max="100" value="8" required></div><div class="field"><label for="subject-color">Color</label><select id="subject-color" name="color">${palette.map(color => `<option value="${color}" style="color:${color}">● ${color}</option>`).join("")}</select></div></div><div class="modal-actions"><button type="button" class="button button-light" data-action="close-modal">Cancel</button><button class="button button-primary">Create subject</button></div></form>`);
}
function addNoteModal(note = null) {
  const data = note || { title: "", subject: state.subjects[0]?.name || "", topic: "", content: "", tags: [], favorite: false };
  openModal(note ? "Edit note" : "Create a note", "Capture the useful bits while they're fresh.", `<form id="note-form" data-id="${note?.id || ""}"><div class="field"><label for="note-title">Title</label><input id="note-title" name="title" value="${escapeHtml(data.title)}" placeholder="Give this note a name" required maxlength="80"></div><div class="form-grid"><div class="field"><label for="note-subject">Subject</label><select id="note-subject" name="subject" required>${subjectOptions(data.subject)}</select></div><div class="field"><label for="note-topic">Topic</label><input id="note-topic" name="topic" value="${escapeHtml(data.topic)}" placeholder="e.g. IP addressing"></div></div><div class="field"><label for="note-content">Note</label><textarea id="note-content" name="content" placeholder="Write something worth remembering..." required>${escapeHtml(data.content)}</textarea></div><div class="field"><label for="note-tags">Tags <span style="color:#929b94;font-weight:400">(comma separated)</span></label><input id="note-tags" name="tags" value="${escapeHtml(data.tags.join(", "))}" placeholder="exam prep, review"></div><div class="settings-row"><div><strong>Favorite</strong><small>Keep this note close at hand</small></div><input type="checkbox" class="toggle" name="favorite" ${data.favorite ? "checked" : ""} aria-label="Favorite note"></div><div class="modal-actions"><button type="button" class="button button-light" data-action="close-modal">Cancel</button><button class="button button-primary">Save note</button></div></form>`, true);
}
function addCardModal() {
  openModal("Create a flashcard", "A good question makes a great study prompt.", `<form id="card-form"><div class="field"><label for="card-subject">Subject</label><select id="card-subject" name="subject" required>${subjectOptions()}</select></div><div class="field"><label for="card-question">Question</label><textarea id="card-question" name="question" placeholder="What do you want to remember?" required></textarea></div><div class="field"><label for="card-answer">Answer</label><textarea id="card-answer" name="answer" placeholder="Add a clear, concise answer" required></textarea></div><div class="field"><label for="card-difficulty">Difficulty</label><select id="card-difficulty" name="difficulty"><option value="practice">Need practice</option><option value="easy">Easy</option><option value="hard">Difficult</option></select></div><div class="modal-actions"><button type="button" class="button button-light" data-action="close-modal">Cancel</button><button class="button button-primary">Save flashcard</button></div></form>`);
}
function createPlanModal() {
  openModal("Build a study plan", "We’ll spread the work into short, realistic sessions.", `<form id="plan-form"><div class="field"><label for="plan-subject">Subject</label><select id="plan-subject" name="subject">${subjectOptions("Networking")}</select></div><div class="field"><label for="plan-exam">Exam date</label><input id="plan-exam" name="exam" type="date" required></div><div class="field"><label for="plan-hours">Available study hours per week</label><input id="plan-hours" name="hours" type="number" min="1" max="40" value="5" required></div><div class="field"><label for="plan-topics">Topics to cover <span style="color:#929b94;font-weight:400">(comma separated)</span></label><textarea id="plan-topics" name="topics" placeholder="CIDR notation, Subnet masks, Practice questions" required></textarea></div><div class="modal-actions"><button type="button" class="button button-light" data-action="close-modal">Cancel</button><button class="button button-primary">Build my plan</button></div></form>`);
}
function startQuiz(subject = null) {
  if (dailyQuizCount() >= 5 && !state.settings.pro) { showToast("That's your five free quizzes for today. Come back tomorrow!"); return; }
  let questions = subject ? state.questions.filter(question => question.subject === subject) : state.questions;
  if (!questions.length) { showToast("Add quiz questions for this subject first."); return; }
  questions = [...questions].sort(() => Math.random() - .5).slice(0, Math.min(5, questions.length));
  quizRun = { questions, index: 0, correct: 0, mistakes: [] };
  showQuizQuestion();
}
function showQuizQuestion() {
  const q = quizRun.questions[quizRun.index];
  openModal(`Question ${quizRun.index + 1} of ${quizRun.questions.length}`, `${q.subject} · ${q.topic}`, `<p class="quiz-question">${escapeHtml(q.question)}</p><div class="quiz-options">${q.options.map((option, index) => `<button class="quiz-option" data-answer="${index}">${escapeHtml(option)}</button>`).join("")}</div><div id="quiz-feedback"></div>`, true);
}
function finishQuiz() {
  const score = Math.round(quizRun.correct / quizRun.questions.length * 100);
  const subjects = [...new Set(quizRun.questions.map(question => question.subject))];
  const subject = subjects.length === 1 ? subjects[0] : "Mixed subjects";
  const result = { subject, score, correct: quizRun.correct, total: quizRun.questions.length, mistakes: [...new Set(quizRun.mistakes)], day: new Date().toDateString(), date: new Date().toLocaleDateString("en", { month: "short", day: "numeric" }) };
  state.quizHistory.push(result);
  save();
  quizRun = null;
  openModal("Quiz complete", "A little practice goes a long way.", `<div style="text-align:center;padding:12px 0"><div style="font:800 48px Manrope;color:var(--green)">${score}%</div><p style="font-size:11px;color:var(--muted)">You got ${result.correct} out of ${result.total} questions right.</p>${result.mistakes.length ? `<div class="quiz-feedback" style="text-align:left"><strong>Review these topics:</strong> ${result.mistakes.map(escapeHtml).join(", ")}</div>` : `<div class="quiz-feedback">Great work. Keep up the steady practice.</div>`}</div><div class="modal-actions"><button class="button button-light" data-action="close-modal">Close</button><button class="button button-primary" data-action="quiz-done">See progress</button></div>`);
}
function getStudyDeck() {
  return state.cards.flatMap(card => Array(card.difficulty === "hard" ? 3 : card.difficulty === "practice" ? 2 : 1).fill(card));
}
function updateTimerDisplay() {
  const clock = document.querySelector("#timer-clock");
  if (clock) clock.textContent = formatTime(timerSeconds);
}
function chooseTimerMode(mode) {
  timerMode = mode;
  timerRunning = false;
  clearInterval(timerInterval);
  timerSeconds = mode === "focus" ? 25 * 60 : mode === "short" ? 5 * 60 : 15 * 60;
  render();
}
function toggleTimer() {
  if (timerRunning) { timerRunning = false; clearInterval(timerInterval); render(); return; }
  timerRunning = true;
  render();
  timerInterval = setInterval(() => {
    timerSeconds -= 1;
    updateTimerDisplay();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      if (timerMode === "focus") {
        state.sessions.push({ duration: 25, date: new Date().toISOString(), day: new Date().toDateString(), subject: "Focus session" });
        save();
        showToast("Focus session complete. Nice work!");
      } else showToast("Break's over. Ready to focus?");
      timerSeconds = timerMode === "focus" ? 25 * 60 : timerMode === "short" ? 5 * 60 : 15 * 60;
      render();
    }
  }, 1000);
}

document.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) { event.preventDefault(); setView(viewButton.dataset.view); return; }
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === "add-subject") addSubjectModal();
    if (action === "add-subject-files") addSubjectFilesModal(actionButton.dataset.subjectId);
    if (action === "subject-workspace") subjectWorkspace(actionButton.dataset.subjectId);
    if (action === "add-study-module") addStudyModuleModal(actionButton.dataset.subjectId);
    if (action === "attach-study-files") addStudyFilesModal(actionButton.dataset.subjectId, actionButton.dataset.moduleId);
    if (action === "remove-study-module") {
      const subject = state.subjects.find(item => item.id === actionButton.dataset.subjectId);
      if (subject) {
        const module = (subject.modules || []).find(item => item.id === actionButton.dataset.moduleId);
        const fileIds = (module?.files || []).filter(file => !file.data).map(file => file.id);
        subject.modules = (subject.modules || []).filter(item => item.id !== actionButton.dataset.moduleId);
        save(); deleteStudyFileBlobs(fileIds).catch(() => {}); subjectWorkspace(subject.id); showToast("Study module removed.");
      }
    }
    if (action === "remove-study-file") {
      const subject = state.subjects.find(item => item.id === actionButton.dataset.subjectId);
      const module = subject?.modules?.find(item => item.id === actionButton.dataset.moduleId);
      if (module) {
        const removedFile = (module.files || []).find(file => file.id === actionButton.dataset.fileId);
        module.files = (module.files || []).filter(file => file.id !== actionButton.dataset.fileId);
        save();
        if (removedFile && !removedFile.data) deleteStudyFileBlobs([removedFile.id]).catch(() => {});
        subjectWorkspace(subject.id); showToast("Study file removed.");
      }
    }
    if (action === "add-note") addNoteModal();
    if (action === "add-card") addCardModal();
    if (action === "close-modal") closeModal();
    if (action === "create-plan") createPlanModal();
    if (action === "plan-study-module") scheduleStudyModule(actionButton.dataset.subjectId, actionButton.dataset.moduleId);
    if (action === "start-quiz") startQuiz();
    if (action === "next-card") { activeCardIndex = (activeCardIndex + 1) % state.cards.length; showingAnswer = false; render(); }
    if (action === "timer-toggle") toggleTimer();
    if (action === "timer-reset") { timerRunning = false; clearInterval(timerInterval); timerSeconds = timerMode === "focus" ? 25 * 60 : timerMode === "short" ? 5 * 60 : 15 * 60; render(); }
    if (action === "save-settings") {
      const name = document.querySelector("#profile-name")?.value.trim();
      if (name) state.settings.name = name;
      save(); render(); showToast("Your settings are saved.");
    }
    if (action === "reset-demo") {
      const fileIds = state.subjects.flatMap(subject => (subject.modules || []).flatMap(module => (module.files || []).filter(file => !file.data).map(file => file.id)));
      state = structuredClone(starterState);
      save(); deleteStudyFileBlobs(fileIds).catch(() => {}); render(); showToast("Demo data restored.");
    }
    if (action === "unlock-pro") { state.settings.pro = true; save(); render(); showToast("Pro demo enabled. Advanced limits are unlocked."); }
    if (action === "reset-plan") { state.settings.pro = false; state.settings.darkMode = false; document.body.classList.remove("dark-mode"); save(); render(); showToast("Switched back to the free plan."); }
    if (action === "quiz-done") { closeModal(); setView("progress"); }
    if (action === "export-notes") exportNotes();
    return;
  }
  const downloadButton = event.target.closest("[data-download-file]");
  if (downloadButton) {
    const subject = state.subjects.find(item => item.id === downloadButton.dataset.subjectId);
    const module = subject?.modules?.find(item => item.id === downloadButton.dataset.moduleId);
    const file = module?.files?.find(item => item.id === downloadButton.dataset.downloadFile);
    if (file) downloadStudyFile(file).catch(() => showToast("Could not retrieve this file from browser storage."));
    return;
  }
  const rateButton = event.target.closest("[data-rate]");
  if (rateButton) {
    const card = state.cards[activeCardIndex % state.cards.length];
    card.difficulty = rateButton.dataset.rate;
    save(); activeCardIndex = (activeCardIndex + 1) % state.cards.length; showingAnswer = false; render();
    showToast(rateButton.dataset.rate === "easy" ? "Marked easy. Nice recall!" : "Saved for another review."); return;
  }
  const answerButton = event.target.closest("[data-answer]");
  if (answerButton && quizRun) {
    const question = quizRun.questions[quizRun.index];
    const answer = Number(answerButton.dataset.answer);
    const correct = answer === question.answer;
    if (correct) quizRun.correct += 1; else quizRun.mistakes.push(question.topic);
    modal.querySelectorAll(".quiz-option").forEach((option, index) => {
      option.disabled = true;
      if (index === question.answer) option.classList.add("correct");
      else if (index === answer) option.classList.add("incorrect");
    });
    document.querySelector("#quiz-feedback").innerHTML = `<div class="quiz-feedback"><strong>${correct ? "That's right." : "Not quite."}</strong> ${escapeHtml(question.explanation)}<div class="modal-actions"><button class="button button-primary" id="quiz-next">${quizRun.index + 1 === quizRun.questions.length ? "See results" : "Next question →"}</button></div></div>`;
    document.querySelector("#quiz-next").addEventListener("click", () => { quizRun.index += 1; if (quizRun.index >= quizRun.questions.length) finishQuiz(); else showQuizQuestion(); });
    return;
  }
  const quizSubject = event.target.closest("[data-start-subject-quiz]");
  if (quizSubject) { startQuiz(quizSubject.dataset.startSubjectQuiz); return; }
  const favorite = event.target.closest("[data-favorite]");
  if (favorite) { const note = state.notes.find(item => item.id === favorite.dataset.favorite); if (note) { note.favorite = !note.favorite; save(); render(); } return; }
  const noteCard = event.target.closest("[data-note]");
  if (noteCard && !event.target.closest("button")) { const note = state.notes.find(item => item.id === noteCard.dataset.note); if (note) addNoteModal(note); return; }
  const subjectCard = event.target.closest("[data-subject]");
  if (subjectCard) { subjectWorkspace(subjectCard.dataset.subject); return; }
  if (event.target.closest("#flashcard")) { showingAnswer = !showingAnswer; render(); return; }
  if (event.target === modalBackdrop) closeModal();
});

document.addEventListener("change", event => {
  if (event.target.matches("[data-study-objective]")) {
    const subject = state.subjects.find(item => item.id === event.target.dataset.subjectId);
    const module = subject?.modules?.find(item => item.id === event.target.dataset.moduleId);
    const file = module?.files?.find(item => item.id === event.target.dataset.fileId);
    const objective = file?.studyGuide?.objectives?.[Number(event.target.dataset.objectiveIndex)];
    if (objective) { objective.done = event.target.checked; save(); render(); }
  }
  if (event.target.matches("[data-task]")) {
    const task = state.tasks.find(item => item.id === event.target.dataset.task);
    if (task) { task.done = event.target.checked; save(); render(); }
  }
  if (event.target.matches("#note-filter, #note-search")) filterNotes();
  if (event.target.matches("#reminder-toggle")) { state.settings.reminders = event.target.checked; save(); }
  if (event.target.matches("#dark-toggle")) { state.settings.darkMode = event.target.checked; document.body.classList.toggle("dark-mode", event.target.checked); save(); }
  if (event.target.matches("[data-timer-mode]")) chooseTimerMode(event.target.dataset.timerMode);
});
document.addEventListener("input", event => { if (event.target.matches("#note-search")) filterNotes(); });
document.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.target;
  const values = Object.fromEntries(new FormData(form).entries());
  if (form.id === "study-module-form") {
    const subject = state.subjects.find(item => item.id === form.dataset.subjectId);
    if (!subject) return;
    subject.modules = subject.modules || [];
    subject.modules.push({ id: `m${Date.now()}`, title: values.title.trim(), description: values.description.trim(), files: [] });
    if (!save()) { subject.modules.pop(); return; }
    closeModal(); subjectWorkspace(subject.id); showToast("Study module created.");
    return;
  }
  if (form.id === "study-files-form" || form.id === "subject-files-form") {
    const subject = state.subjects.find(item => item.id === form.dataset.subjectId);
    if (!subject) return;
    subject.modules = subject.modules || [];
    let module = form.id === "study-files-form"
      ? subject.modules.find(item => item.id === form.dataset.moduleId)
      : subject.modules.find(item => item.id === form.elements.moduleId?.value);
    let createdModule = false;
    if (!module && form.id === "subject-files-form" && !form.elements.moduleId) {
      module = { id: `m${Date.now()}`, title: values.moduleTitle.trim() || "Study files", description: "Files uploaded directly to this subject.", files: [] };
      subject.modules.push(module);
      createdModule = true;
    }
    const files = Array.from(form.elements.files.files);
    if (!module || !files.length) return;
    const remainingUploads = Math.max(0, 5 - dailyFileUploadCount());
    if (files.length > remainingUploads) {
      if (createdModule) subject.modules.pop();
      showToast(`You can add ${remainingUploads} more ${remainingUploads === 1 ? "file" : "files"} today.`);
      return;
    }
    const uploadIds = files.map((file, index) => `f${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`);
    const attachments = files.map((file, index) => ({ id: uploadIds[index], name: file.name, type: file.type || "application/octet-stream", size: file.size }));
    try { await storeStudyFiles(files.map((file, index) => ({ id: uploadIds[index], file }))); }
    catch {
      if (createdModule) subject.modules.pop();
      showToast("The browser could not store these files. Check available device storage and try again.");
      return;
    }
    module.files = module.files || [];
    const previousFiles = module.files;
    const previousUploads = state.fileUploads;
    module.files = [...previousFiles, ...attachments];
    const uploadDay = new Date().toDateString();
    state.fileUploads = [...previousUploads, ...attachments.map(file => ({ id: file.id, day: uploadDay, subjectId: subject.id, moduleId: module.id, name: file.name }))];
    if (!save()) {
      module.files = previousFiles;
      state.fileUploads = previousUploads;
      if (createdModule) subject.modules.pop();
      await deleteStudyFileBlobs(uploadIds).catch(() => {});
      return;
    }
    closeModal(); subjectWorkspace(subject.id); showToast(`${attachments.length} ${attachments.length === 1 ? "file" : "files"} attached.`);
    return;
  }
  if (form.id === "subject-form") {
    if (!state.settings.pro && state.subjects.filter(subject => !subject.demo).length >= 3) { showToast("Free plan includes 3 personal subjects. Explore Pro for unlimited subjects."); return; }
    const name = values.name.trim();
    if (state.subjects.some(subject => subject.name.toLowerCase() === name.toLowerCase())) { showToast("That subject already exists."); return; }
    state.subjects.push({ id: `s${Date.now()}`, name, color: values.color, icon: "✳", topics: Number(values.topics), completed: 0, demo: false });
    save(); closeModal(); render(); showToast(`${name} added to your subjects.`);
  }
  if (form.id === "note-form") {
    const tags = (values.tags || "").split(",").map(tag => tag.trim()).filter(Boolean);
    const note = { id: form.dataset.id || `n${Date.now()}`, title: values.title.trim(), subject: values.subject, topic: values.topic.trim() || "General", content: values.content.trim(), tags, favorite: form.elements.favorite.checked, updated: "Today" };
    const index = state.notes.findIndex(item => item.id === note.id);
    if (index >= 0) state.notes[index] = note; else state.notes.unshift(note);
    save(); closeModal(); setView("notes"); showToast("Note saved.");
  }
  if (form.id === "card-form") {
    if (!state.settings.pro && state.cards.length >= 30) { showToast("Free plan includes up to 30 flashcards. Explore Pro for unlimited cards."); return; }
    state.cards.push({ id: `c${Date.now()}`, subject: values.subject, question: values.question.trim(), answer: values.answer.trim(), difficulty: values.difficulty });
    save(); closeModal(); setView("flashcards"); showToast("Flashcard added to your deck.");
  }
  if (form.id === "plan-form") {
    const topics = values.topics.split(",").map(topic => topic.trim()).filter(Boolean);
    const subject = values.subject;
    const perDay = Math.max(1, Math.ceil(topics.length / 5));
    state.plan = Array.from({ length: 5 }, (_, day) => topics.slice(day * perDay, (day + 1) * perDay).map(title => ({ title, subject, duration: `${Math.max(15, Math.round(Number(values.hours) * 60 / Math.max(1, topics.length)))} min` })));
    save(); closeModal(); setView("planner"); showToast("Your study plan is ready.");
  }
});
function filterNotes() {
  if (activeView !== "notes") return;
  const query = (document.querySelector("#note-search")?.value || "").toLowerCase();
  const filter = document.querySelector("#note-filter")?.value || "all";
  let filtered = state.notes.filter(note => `${note.title} ${note.content} ${note.subject} ${note.topic} ${note.tags.join(" ")}`.toLowerCase().includes(query));
  if (filter === "favorites") filtered = filtered.filter(note => note.favorite);
  else if (filter === "recent") filtered = filtered.slice(0, 3);
  else if (filter !== "all") filtered = filtered.filter(note => note.subject === filter);
  const grid = document.querySelector(".notes-grid");
  if (grid) grid.innerHTML = filtered.map(note => `<article class="note-card" data-note="${note.id}"><div class="note-card-top"><span class="note-subject">${escapeHtml(note.subject)} · ${escapeHtml(note.topic)}</span><button class="favorite-button ${note.favorite ? "is-favorite" : ""}" data-favorite="${note.id}" aria-label="Toggle favorite">★</button></div><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.content)}</p><div class="note-tags">${note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}<span class="tag">${escapeHtml(note.updated)}</span></div></article>`).join("") || `<div class="empty-state"><strong>No notes match.</strong>Try another filter, or create a note.</div>`;
}
function exportNotes() {
  const text = state.notes.map(note => `# ${note.title}\n${note.subject} · ${note.topic}\n\n${note.content}\n\nTags: ${note.tags.join(", ")}\n`).join("\n---\n\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  link.download = "studyflow-notes.txt";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Your notes export is ready.");
}
document.querySelector("#menu-toggle").addEventListener("click", () => document.querySelector("#sidebar").classList.toggle("open"));
document.addEventListener("keydown", event => { if (event.key === "Escape" && !modalBackdrop.hidden) closeModal(); });
if (state.settings.darkMode) document.body.classList.add("dark-mode");
render();