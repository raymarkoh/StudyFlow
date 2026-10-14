# StudyFlow
Plan smarter. Study better.

StudyFlow is a responsive study companion prototype for organizing subjects, building a weekly plan, reviewing flashcards, taking short quizzes, and tracking focus sessions.

## Run locally

Open `index.html` in a modern browser. No build step, package install, or account is required. The app saves changes in the browser's local storage; use Settings → Reset demo to restore the sample workspace.

## Features

- Dashboard with daily tasks, deadlines, streak, study time, quiz average, and subject progress
- Subject manager with per-subject study modules, direct local-file uploads, and file attachments
- A weekly planner that extracts study objectives and topics from uploaded PDFs and text files, with checkable study lists
- Searchable, filterable notes with favorites and a text export
- Flashcards with Easy, Need practice, and Difficult review weighting
- Multiple-choice quizzes with immediate feedback, scores, and topic review
- Focus timer with 25-minute sessions and 5- and 15-minute breaks
- Progress summaries, settings, and a simulated Pro upgrade screen
- Responsive desktop and mobile layouts

## Project files

- `index.html` contains the page structure
- `styles.css` contains all styling and responsive breakpoints
- `app.js` contains view rendering, interactions, and local storage behavior

## Notes

This is a front-end demo. Data, modules, and attached files remain in the current browser and are not synced to an account or cloud service. Students can add up to five files per day across all subjects. Files are stored in IndexedDB with no app-imposed per-file size limit; browser storage availability still applies. PDF study-objective extraction loads PDF.js from a CDN and requires an internet connection; Markdown, plain-text, and CSV files are scanned locally. Other file types remain available to open, but their contents are not analyzed. Authentication, payments, and PDF export are not connected; the Pro screen is a demonstration only. Sample subjects, tasks, notes, flashcards, and quiz questions are included so the app can be explored immediately.
