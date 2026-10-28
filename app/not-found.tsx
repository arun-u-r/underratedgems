import Link from "next/link";

export default function NotFound() {
  return (
    <main className="content-page">
      <section className="store-status">
        <p className="eyebrow">UR / 404</p>
        <h1>Not quite what you were looking for.</h1>
        <p>That page may have moved, or it may not exist anymore.</p>
        <Link className="button button--dark" href="/">
          Back to the edit
        </Link>
      </section>
    </main>
  );
}
