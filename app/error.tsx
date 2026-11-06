"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="guard">
      <strong className="error-code">500</strong>
      <h1>Sahifa ochilmadi</h1>
      <p>Qayta urinib ko‘ring yoki bosh sahifaga qayting.</p>
      <button className="btn" onClick={reset}>
        Qayta urinish
      </button>
      <a href="/">Bosh sahifa</a>
    </div>
  );
}
