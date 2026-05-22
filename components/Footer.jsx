"use client";

import { SadeemMark } from "./marks";

function FooterCol({ title, items }) {
  return (
    <div className="footer-col">
      <div className="footer-title">{title}</div>
      <ul className="footer-list">
        {items.map((i, k) => (
          <li key={k}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function SocialDot({ label }) {
  return <div className="social-dot">{label}</div>;
}

export default function Footer() {
  return (
    <footer className="footer dark" data-section="10">
      <div className="section-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <SadeemMark />
            <p className="body on-dark sm">
              Strategic growth advisory — helping ambitious companies achieve
              measurable results.
            </p>
            <div className="footer-social">
              <SocialDot label="LI" />
              <SocialDot label="X" />
              <SocialDot label="IG" />
            </div>
          </div>
          <FooterCol title="Company" items={["About us", "Our approach", "Careers", "Insights"]} />
          <FooterCol
            title="Services"
            items={["Strategy", "Growth & marketing", "Operations", "Transformation", "M&A advisory"]}
          />
          <FooterCol
            title="Industries"
            items={["Manufacturing", "Technology", "Retail", "Healthcare", "Real estate"]}
          />
          <div className="footer-col">
            <div className="footer-title">Contact</div>
            <ul className="footer-list">
              <li>hello@sadeem.co</li>
              <li>+966 11 000 0000</li>
              <li>Riyadh, Saudi Arabia</li>
            </ul>
          </div>
        </div>
        <div className="footer-rule" />
        <div className="footer-base">
          <span>© 2026 Sadeem. All rights reserved.</span>
          <span className="footer-base-right">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
