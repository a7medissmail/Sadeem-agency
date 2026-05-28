"use client";

/**
 * global-error.tsx — replaces the root layout on an unhandled error.
 * Must render its own <html> and <body>; no shared layout is available.
 * Keep styles inline — globals.css is not loaded here.
 */

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error — SADEEM</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: #09090b;
            color: #f5f3f0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 40px 24px;
            text-align: center;
          }
          .eyebrow {
            font-family: ui-monospace, "Cascadia Code", "Fira Mono", monospace;
            font-size: 10.5px;
            letter-spacing: 0.26em;
            text-transform: uppercase;
            color: rgba(245,243,240,0.28);
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          .eyebrow span { color: #FF6A00; }
          h1 {
            font-size: clamp(36px, 6vw, 56px);
            font-weight: 700;
            letter-spacing: -0.035em;
            line-height: 1;
            margin-bottom: 18px;
            color: #f5f3f0;
          }
          p {
            font-size: 15.5px;
            line-height: 1.68;
            color: rgba(245,243,240,0.42);
            max-width: 52ch;
            margin: 0 auto 40px;
          }
          .actions {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }
          button, a {
            font-family: ui-monospace, "Cascadia Code", "Fira Mono", monospace;
            font-size: 10.5px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            padding: 12px 28px;
            cursor: pointer;
            text-decoration: none;
            transition: border-color 0.15s, color 0.15s;
          }
          button {
            background: none;
            border: 1px solid rgba(245,243,240,0.18);
            color: rgba(245,243,240,0.6);
          }
          button:hover { border-color: rgba(245,243,240,0.4); color: #f5f3f0; }
          a.home-link {
            border: 1px solid #FF6A00;
            color: #FF6A00;
            background: none;
          }
          a.home-link:hover { background: rgba(255,106,0,0.08); }
        `}</style>
      </head>
      <body>
        <p className="eyebrow">
          <span>SADEEM</span>
          <span aria-hidden>·</span>
          ERR / 500
          <span aria-hidden>·</span>
          UNHANDLED EXCEPTION
        </p>
        <h1>Something broke.</h1>
        <p>
          An unexpected error interrupted this page. The team has been notified.
          You can attempt to recover — or return home.
        </p>
        <div className="actions">
          <button onClick={reset}>Try again</button>
          <a href="/" className="home-link">← Home</a>
        </div>
      </body>
    </html>
  );
}
