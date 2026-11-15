import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Brain, Check, CheckCircle2, ChevronDown,
  CircleHelp, Clock3, GraduationCap, Layers3, LoaderCircle, RotateCcw,
  Sparkles, Target, X
} from "lucide-react";

const examples = [
  { label: "Photosynthesis", text: "Photosynthesis is the process by which green plants convert light energy into chemical energy. It occurs mainly in chloroplasts. Chlorophyll absorbs light, and the process uses carbon dioxide and water to produce glucose and oxygen. It has light-dependent reactions in the thylakoid membranes and the Calvin cycle in the stroma." },
  { label: "JavaScript closures", text: "A closure is the combination of a function bundled together with references to its surrounding lexical environment. A function forms a closure when it remembers variables from its outer scope, even after that outer function has finished executing. Closures are useful for data privacy, function factories, and callbacks." },
  { label: "SQL joins", text: "SQL joins combine rows from two or more tables using a related column. INNER JOIN returns matching rows from both tables. LEFT JOIN returns every row from the left table and matching rows from the right table, with NULL when there is no match. RIGHT JOIN does the reverse. FULL OUTER JOIN returns matched and unmatched rows from both tables." }
];

function App() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState("cards");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [wrongOnly, setWrongOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestId = useRef(0);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const cards = result?.flashcards || [];
  const quiz = result?.quiz || [];
  const wrongQuestions = useMemo(
    () => quiz.filter((_, i) => answers[i] !== undefined && answers[i] !== quiz[i].correctIndex),
    [quiz, answers]
  );
  const activeQuiz = wrongOnly ? wrongQuestions : quiz;
  const score = quiz.reduce((total, q, i) => total + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const allAnswered = quiz.length > 0 && quiz.every((_, i) => answers[i] !== undefined);

  async function generate() {
    if (input.trim().length < 10) {
      setError("Add at least 10 characters so the AI has enough context.");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const currentId = ++requestId.current;
    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);
    setAnswers({});
    setSubmitted(false);
    setWrongOnly(false);
    setMode("cards");
    try {
      const response = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate study material. Please retry.");
      if (!data || !Array.isArray(data.flashcards) || !Array.isArray(data.quiz) || !data.flashcards.length || !data.quiz.length) {
        throw new Error("The response did not match the expected study format. Please retry.");
      }
      if (currentId !== requestId.current) return;
      setResult(data);
      setCardIndex(0);
      setFlipped(false);
      setNotice("Your study set is ready. Start with the flashcards or test your knowledge.");
    } catch (err) {
      if (err.name !== "AbortError" && currentId === requestId.current) setError(err.message || "Something went wrong. Please try again.");
    } finally {
      if (currentId === requestId.current) setLoading(false);
    }
  }

  function resetQuiz() {
    setAnswers({});
    setSubmitted(false);
    setWrongOnly(false);
  }

  function selectAnswer(index, option) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [index]: option }));
  }

  const currentCard = cards[cardIndex];

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={e => { e.preventDefault(); setResult(null); }}>
          <span className="brand-mark"><GraduationCap size={21} /></span>
          <span>study<span className="brand-accent">sprint</span></span>
        </a>
        <div className="topbar-right"><span className="status-dot" /> YOUR PERSONAL STUDY SPACE</div>
      </header>

      <main className="main-wrap">
        {!result ? (
          <section className="hero">
            <div className="eyebrow"><Sparkles size={14} /> LEARN SMARTER, NOT LONGER</div>
            <h1>Turn your notes into<br /><span>something you remember.</span></h1>
            <p className="hero-copy">Drop in your notes or a topic. Get clear flashcards and a quick quiz, built for active recall.</p>

            <div className="input-card">
              <div className="input-heading">
                <div><span className="step-number">01</span><strong>What are you studying today?</strong></div>
                <span className="char-count">{input.length.toLocaleString()} / 12,000</span>
              </div>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value.slice(0, 12000))}
                placeholder="Paste your class notes, a chapter summary, or simply type a topic you want to master..."
                maxLength={12000}
                aria-label="Study notes or topic"
              />
              <div className="input-footer">
                <span><BookOpen size={15} /> Your notes stay in this session</span>
                <button className="generate-btn" onClick={generate} disabled={loading || input.trim().length < 10}>
                  {loading ? <><LoaderCircle className="spin" size={17} /> Building your set...</> : <>Create study set <ArrowRight size={17} /></>}
                </button>
              </div>
              {error && <div className="alert error-alert" role="alert"><X size={17} /> <span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={15}/></button></div>}
            </div>

            <div className="examples">
              <span className="examples-label">NEED A STARTING POINT?</span>
              {examples.map(item => <button key={item.label} onClick={() => { setInput(item.text); setError(""); }}>{item.label}<ArrowRight size={13}/></button>)}
            </div>
            <div className="feature-row">
              <div><span className="feature-icon purple"><Layers3 size={18}/></span><span><b>Active recall</b><small>Flip through smart cards</small></span></div>
              <div><span className="feature-icon green"><Target size={18}/></span><span><b>Check understanding</b><small>Practice with a quick quiz</small></span></div>
              <div><span className="feature-icon orange"><RotateCcw size={18}/></span><span><b>Learn from mistakes</b><small>Retest what you missed</small></span></div>
            </div>
          </section>
        ) : (
          <section className="workspace">
            <div className="workspace-top">
              <button className="back-btn" onClick={() => { setResult(null); setError(""); }}><ArrowLeft size={16}/> New study set</button>
              <span className="ready-pill"><CheckCircle2 size={14}/> STUDY SET READY</span>
            </div>
            <div className="study-heading">
              <div className="eyebrow"><Sparkles size={14}/> YOUR STUDY SET</div>
              <h1>{result.title}</h1>
              <p>{result.summary}</p>
            </div>
            <div className="mode-tabs" role="tablist" aria-label="Study mode">
              <button className={mode === "cards" ? "active" : ""} onClick={() => setMode("cards")} role="tab" aria-selected={mode === "cards"}><Layers3 size={17}/> Flashcards <span>{cards.length}</span></button>
              <button className={mode === "quiz" ? "active" : ""} onClick={() => setMode("quiz")} role="tab" aria-selected={mode === "quiz"}><CircleHelp size={17}/> Quick quiz <span>{quiz.length}</span></button>
            </div>

            {mode === "cards" ? (
              <div className="cards-panel">
                <div className="panel-meta"><span>FLASHCARD <b>{String(cardIndex + 1).padStart(2, "0")}</b> <i>/ {String(cards.length).padStart(2, "0")}</i></span><span><Clock3 size={14}/> Take your time</span></div>
                <button className={`flashcard ${flipped ? "is-flipped" : ""}`} onClick={() => setFlipped(v => !v)} aria-label={flipped ? "Show question" : "Reveal answer"}>
                  <span className="card-kicker">{flipped ? "THE ANSWER" : "QUESTION"}</span>
                  <span className="card-content">{flipped ? currentCard.answer : currentCard.question}</span>
                  <span className="flip-hint"><RotateCcw size={15}/> Click to {flipped ? "see question" : "reveal answer"}</span>
                </button>
                <div className="card-controls">
                  <button className="secondary-btn" onClick={() => { setCardIndex(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={cardIndex === 0}><ArrowLeft size={16}/> Previous</button>
                  <div className="dots">{cards.map((_, i) => <button key={i} className={i === cardIndex ? "current" : i < cardIndex ? "visited" : ""} onClick={() => { setCardIndex(i); setFlipped(false); }} aria-label={`Go to flashcard ${i + 1}`}/>)}</div>
                  <button className="primary-btn" onClick={() => { if (cardIndex === cards.length - 1) setMode("quiz"); else setCardIndex(i => i + 1); setFlipped(false); }}>{cardIndex === cards.length - 1 ? "Take the quiz" : "Next card"} <ArrowRight size={16}/></button>
                </div>
              </div>
            ) : (
              <div className="quiz-panel">
                <div className="quiz-topline">
                  <div><span className="panel-label">KNOWLEDGE CHECK</span><h2>{wrongOnly ? "Let's fix those gaps." : "Ready to test yourself?"}</h2></div>
                  {submitted && <div className="score-badge"><b>{score}/{quiz.length}</b><small>YOUR SCORE</small></div>}
                </div>
                {wrongOnly && <div className="review-note">You're reviewing {activeQuiz.length} question{activeQuiz.length === 1 ? "" : "s"} you missed.</div>}
                {activeQuiz.length === 0 ? (
                  <div className="empty-review"><CheckCircle2 size={30}/><h3>Nothing to retest!</h3><p>You got every question right. Great work.</p><button className="primary-btn" onClick={() => { setWrongOnly(false); resetQuiz(); }}>Try the full quiz <ArrowRight size={16}/></button></div>
                ) : (
                  <>
                    <div className="questions-list">
                      {activeQuiz.map((q, displayIndex) => {
                        const originalIndex = quiz.indexOf(q);
                        const selected = answers[originalIndex];
                        const isCorrect = selected === q.correctIndex;
                        return <article className="question-card" key={originalIndex}>
                          <div className="question-number">QUESTION {String(displayIndex + 1).padStart(2, "0")}</div>
                          <h3>{q.question}</h3>
                          <div className="options-grid">
                            {q.options.map((option, optionIndex) => {
                              const chosen = selected === optionIndex;
                              const correct = submitted && optionIndex === q.correctIndex;
                              const incorrect = submitted && chosen && !isCorrect;
                              return <button key={optionIndex} className={`option ${chosen ? "selected" : ""} ${correct ? "correct" : ""} ${incorrect ? "incorrect" : ""}`} onClick={() => selectAnswer(originalIndex, optionIndex)} disabled={submitted}>
                                <span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{correct && <Check size={17}/ >}{incorrect && <X size={17}/>}
                              </button>;
                            })}
                          </div>
                          {submitted && <div className={`explanation ${isCorrect ? "good" : "needs-work"}`}><b>{isCorrect ? "Correct!" : "Not quite."}</b> {q.explanation}</div>}
                        </article>;
                      })}
                    </div>
                    {!submitted ? <button className="generate-btn submit-quiz" disabled={Object.keys(answers).length !== activeQuiz.length} onClick={() => setSubmitted(true)}>Check my answers <ArrowRight size={17}/></button> :
                      <div className="quiz-actions">
                        <button className="secondary-btn" onClick={resetQuiz}><RotateCcw size={16}/> Retake quiz</button>
                        {!wrongOnly && wrongQuestions.length > 0 && <button className="primary-btn" onClick={() => { setWrongOnly(true); setSubmitted(true); }}>Retest missed ({wrongQuestions.length}) <ArrowRight size={16}/></button>}
                        {wrongOnly && <button className="primary-btn" onClick={() => { setWrongOnly(false); resetQuiz(); }}>Back to full quiz <ArrowRight size={16}/></button>}
                      </div>}
                  </>
                )}
              </div>
            )}
            <div className="workspace-foot"><span><Brain size={15}/> Small sessions. Strong memory.</span><span>STUDYSPRINT <i>·</i> BUILT FOR FOCUS</span></div>
          </section>
        )}
      </main>
      <footer className="footer"><span>© 2026 StudySprint</span><span>Made for curious minds <span className="footer-star">✳</span></span></footer>
    </div>
  );
}

export default App;