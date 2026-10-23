// The resident check-in. This component keeps all the answers (the "state")
// and shows one screen at a time. It saves progress to localStorage after
// every change, so reloading the page picks up where the resident left off.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import AlertScreen from './AlertScreen.jsx';
import LocationStep from './LocationStep.jsx';
import QuestionStep from './QuestionStep.jsx';
import CountStep from './CountStep.jsx';
import ResultScreen from './ResultScreen.jsx';
import PhotosStep from './PhotosStep.jsx';
import DoneScreen from './DoneScreen.jsx';
import { COUNTS } from '../data/questions.js';
import { buildSteps, cleanAnswers, isQuestionStep, sectionCounter, progressPercent } from '../logic/flow.js';
import { colorFromAnswers } from '../logic/triage.js';
import { areaRisk, isTrapped } from '../logic/risk.js';
import { guidesFor } from '../logic/firstAid.js';
import { zoneForLocation } from '../logic/zone.js';

const SAVE_KEY = 'readynet-checkin';

// A brand-new, empty check-in
const START = {
  stepIndex: 0,
  answers: {},                                // questionId -> option position
  counts: { people: 1, hurt: 0, trappedN: 1 },
  address: '',
  location: null,                             // { lat, lng, accuracyM } from GPS
  photoCount: 0,                              // photos sent (shown on the Done screen)
};

// Load a saved check-in from this phone, or start fresh.
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return saved ? { ...START, ...saved } : START;
  } catch {
    return START;
  }
}

export default function CheckInFlow() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(loadSaved);
  const [photos, setPhotos] = useState([]); // photo previews; not saved to localStorage (too big)
  const { answers, counts } = checkIn;

  // Save after every change
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(checkIn));
    } catch {
      // Storage can be blocked (e.g. private browsing). The app still works, it just won't resume.
    }
  }, [checkIn]);

  const steps = buildSteps(answers);
  const stepIndex = Math.min(checkIn.stepIndex, steps.length - 1);
  const step = steps[stepIndex];
  const forOther = answers.who === 1; // "Someone else"

  // The result, worked out from the answers by the rules in src/logic/
  const trapped = isTrapped(answers);
  const color = colorFromAnswers(answers);
  const result = {
    color,
    risk: areaRisk(answers),
    trapped,
    guides: guidesFor(answers, color),
    peopleLine: `${counts.people} ${counts.people === 1 ? 'person' : 'people'}, ${counts.hurt} hurt` +
      (trapped ? `, ${counts.trappedN} trapped` : ''),
  };

  // When the screen changes: scroll to the top and move focus to the new heading
  // (so screen-reader users hear the new question).
  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector('.content h1')?.focus();
  }, [stepIndex]);

  // Helpers that change the state. "prev" is the state before the change.
  function goTo(index) {
    setCheckIn((prev) => ({ ...prev, stepIndex: Math.max(0, Math.min(steps.length - 1, index)) }));
  }
  const next = () => goTo(stepIndex + 1);
  const back = () => goTo(stepIndex - 1);

  function pickAnswer(questionId, optionIndex) {
    setCheckIn((prev) => ({
      ...prev,
      answers: cleanAnswers({ ...prev.answers, [questionId]: optionIndex }),
      stepIndex: stepIndex + 1,
    }));
  }

  function setCount(key, value) {
    setCheckIn((prev) => {
      const max = key === 'hurt' ? prev.counts.people : COUNTS[key].max;
      const newCounts = { ...prev.counts, [key]: Math.max(COUNTS[key].min, Math.min(max, value)) };
      // Fewer people than hurt doesn't make sense, so lower "hurt" too
      if (newCounts.hurt > newCounts.people) newCounts.hurt = newCounts.people;
      return { ...prev, counts: newCounts };
    });
  }

  function sendPhotos() {
    setCheckIn((prev) => ({ ...prev, photoCount: photos.length, stepIndex: stepIndex + 1 }));
  }

  function restart() {
    setCheckIn(START);
    setPhotos([]);
  }

  // Back is hidden on the Alert, Result and Done screens
  const showBack = !['alert', 'result', 'done'].includes(step.type);

  return (
    <div className="app-column">
      <Header onBack={showBack ? back : null} />
      {isQuestionStep(step) && <ProgressBar percent={progressPercent(steps, step)} />}
      <main className="content">
        {step.type === 'alert' && (
          <AlertScreen onStart={next} onOpenResponder={() => navigate('/responder')} />
        )}

        {step.type === 'location' && (
          <LocationStep
            location={checkIn.location}
            address={checkIn.address}
            onLocation={(location) => setCheckIn((prev) => ({ ...prev, location }))}
            onAddress={(address) => setCheckIn((prev) => ({ ...prev, address }))}
            onContinue={next}
          />
        )}

        {step.type === 'question' && (
          <QuestionStep
            key={step.question.id}
            question={step.question}
            counter={sectionCounter(steps, step)}
            forOther={forOther}
            selected={answers[step.question.id]}
            onPick={(optionIndex) => pickAnswer(step.question.id, optionIndex)}
          />
        )}

        {step.type === 'count' && (
          <CountStep
            key={step.key}
            countKey={step.key}
            counter={sectionCounter(steps, step)}
            value={counts[step.key]}
            onChange={(value) => setCount(step.key, value)}
            onContinue={next}
          />
        )}

        {step.type === 'result' && (
          <ResultScreen result={result} forOther={forOther} trappedCount={counts.trappedN} onContinue={next} />
        )}

        {step.type === 'photos' && (
          <PhotosStep
            photos={photos}
            onAddPhoto={(url) => setPhotos((prev) => [...prev, url])}
            onContinue={sendPhotos}
          />
        )}

        {step.type === 'done' && (
          <DoneScreen
            result={result}
            forOther={forOther}
            zone={checkIn.location ? zoneForLocation(checkIn.location.lat, checkIn.location.lng) : null}
            photoCount={checkIn.photoCount}
            onShowGuides={() => goTo(steps.findIndex((s) => s.type === 'result'))}
            onRestart={restart}
          />
        )}
      </main>
    </div>
  );
}
