export default function StepDots({ active = 1, total = 4 }) {
  return (
    <div className="steps">
      {Array.from({ length: total }).map((_, index) => {
        const step = index + 1;

        return (
          <div key={step} className="flex items-center flex-1">
            <div className={`step-dot ${step === active ? "active" : ""}`}>{step}</div>
            {step < total ? <div className="step-line" /> : null}
          </div>
        );
      })}
    </div>
  );
}
