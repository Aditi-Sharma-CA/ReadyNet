// One multiple-choice question per screen. Tapping an answer saves it and moves on.
// forOther = true when checking in for someone else ("Are they injured?").
import { OTHER_PERSON_HINT } from '../data/questions.js';

export default function QuestionStep({ question, counter, forOther, selected, onPick }) {
  const text = forOther && question.textOther ? question.textOther : question.text;
  let hint = question.hint || '';
  if (forOther && question.section === 'Injuries' && !question.textOther && !hint) {
    hint = OTHER_PERSON_HINT;
  }

  return (
    <>
      <div className="eyebrow">{question.section} · {counter}</div>
      <h1 className="title" tabIndex={-1}>{text}</h1>
      {hint && <div className="hint">{hint}</div>}
      <div className="answers">
        {question.options.map((option, index) => (
          <button
            key={option.label}
            className={'answer' + (selected === index ? ' answer-selected' : '')}
            aria-pressed={selected === index}
            onClick={() => onPick(index)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}
