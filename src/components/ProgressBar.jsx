// Thin orange bar under the header showing how far through the questions you are.
export default function ProgressBar({ percent }) {
  return (
    <div className="progress" role="progressbar" aria-label="Progress" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-fill" style={{ width: percent + '%' }} />
    </div>
  );
}
