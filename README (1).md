# StudySprint

A small React study assistant that turns notes or a topic into interactive flashcards and a multiple-choice quiz.

## Features
- Free-form notes/topic input with character limits and example prompts.
- Gemini-powered structured JSON generation through a backend (the API key is never exposed to the browser).
- Flashcards with flip, next/previous, and progress navigation.
- Multiple-choice quiz with scoring, explanations, and retesting missed questions.
- Loading, validation, empty, error, and retry states.
- Backend validation for malformed JSON and incorrect response shapes.
- Request cancellation and request IDs prevent stale responses from replacing newer results.
- Responsive layout for mobile and desktop.

## Setup

Requires Node.js 18+.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root (copy `.env.example`) and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_key_here
   PORT=4000
   ```
   Get a key at https://aistudio.google.com/app/apikey.
3. Start both frontend and backend:
   ```bash
   npm start
   ```
4. Open the Vite URL shown in the terminal (usually http://localhost:5173).

For a production frontend build, run `npm run build`. The API server is a small Express service.

## Usage
Paste notes or a topic (at least 10 characters), then select **Create study set**. Review flashcards, take the quiz, check your answers, and use **Retest missed** to focus on incorrect answers.

## AI usage note
AI assistance (ChatGPT) was used to help scaffold the React UI, backend route, validation logic, and documentation. Gemini generates the study content at runtime. The generated content is validated for shape before it is rendered; users should still verify factual accuracy against their course material.

## Failure handling
- Empty/short input and oversized input are rejected.
- Missing API key, provider errors, rate limits, timeouts, empty output, malformed JSON, and invalid schema produce readable errors.
- The frontend validates the returned arrays before rendering.
- Previous in-flight requests are aborted, and a monotonically increasing request ID guards against stale responses.
- A user can retry by selecting **Create study set** again.

## Known limitations
- The app currently supports one study session at a time; sessions are not persisted.
- Generated content is not guaranteed to be factually perfect.
- The quiz uses four-option multiple-choice questions only.
- No authentication or database is included.
- Gemini free-tier quotas and model availability may vary.

## Time spent
Approximately 30–45 minutes for the initial implementation and setup. Update this estimate to reflect your actual work before submission.

## Suggested next steps
- Add automated tests for API validation and quiz interactions.
- Persist study sets locally or in a database.
- Add keyboard shortcuts and accessibility testing.
- Add an optional regeneration/refinement workflow.
