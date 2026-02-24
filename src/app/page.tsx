import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <header className="container nav">
        <div className="logo">
          <span className="logo-mark">
            <Image
              src="/complysafe-logo.png"
              alt="ComplySafe logo"
              width={32}
              height={32}
            />
          </span>
          <div className="logo-text">
            <div className="logo-title">ComplySafe</div>
            <div className="logo-sub">Compliance Automation</div>
          </div>
        </div>
        <div className="nav-links">
          <a href="#company">Company</a>
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#plans">Plans</a>
          <a href="#terms">Terms</a>
          <a href="/public-scan">Scan Website</a>
        </div>
        <div className="nav-actions">
          <a className="cta secondary" href="/login">Log in</a>
          <a className="cta" href="/login">Get Started</a>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div className="hero-copy fade-up">
            <span className="tag">Compliance intelligence for modern teams</span>
            <h1>Turn public signals into policies, proof, and audit-ready reports.</h1>
            <p>
              ComplySafe scans websites and documents, maps requirements across
              global regulations, and generates remediation-ready policies that
              stand up to audits.
            </p>
            <div className="hero-actions">
              <a className="cta" href="/login">Start Free</a>
              <a className="cta secondary" href="/public-scan">Scan a Website</a>
              <a className="cta secondary" href="#services">Explore Services</a>
            </div>
            <div className="hero-badges">
              <span className="badge">GDPR</span>
              <span className="badge">DPDP</span>
              <span className="badge">ISO 27001</span>
              <span className="badge">PCI DSS</span>
              <span className="badge">HIPAA</span>
            </div>
          </div>
          <div className="hero-panel fade-up">
            <div className="panel-header">
              <h3>Compliance Command Center</h3>
              <p className="muted">Real-time readiness across every requirement.</p>
            </div>
            <div className="hero-metrics">
              <div className="metric">
                <div className="muted">Coverage</div>
                <strong>82%</strong>
              </div>
              <div className="metric">
                <div className="muted">Open Risks</div>
                <strong>9</strong>
              </div>
              <div className="metric">
                <div className="muted">Evidence Items</div>
                <strong>156</strong>
              </div>
              <div className="metric">
                <div className="muted">Audit ETA</div>
                <strong>14 days</strong>
              </div>
            </div>
            <div className="hero-alerts">
              <div className="alert-card">
                <span className="pill warn">Medium Risk</span>
                <div>
                  <strong>Cookie consent missing</strong>
                  <div className="muted">Public policy gap detected</div>
                </div>
              </div>
              <div className="alert-card">
                <span className="pill ok">Resolved</span>
                <div>
                  <strong>Data retention updated</strong>
                  <div className="muted">Policy evidence uploaded</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="company" className="section">
          <div className="split">
            <div>
              <h2>Company</h2>
              <p className="muted">
                ComplySafe is built for teams that need audit-grade compliance without
                slowing down product velocity. We turn public signals into defensible
                policies, mapped controls, and actionable remediation.
              </p>
              <div className="mini-grid">
                <div className="mini-card">
                  <strong>Mission</strong>
                  <div className="muted">Make compliance fast, explainable, and repeatable.</div>
                </div>
                <div className="mini-card">
                  <strong>Approach</strong>
                  <div className="muted">Evidence-first, automated, and auditor-friendly.</div>
                </div>
              </div>
            </div>
            <div className="panel">
              <h3>Why teams choose ComplySafe</h3>
              <ul className="list">
                <li>Public-only scanning with clear legal disclaimers.</li>
                <li>Regulation-aware checklists and remediation guidance.</li>
                <li>Policy packs that align to your industry and region.</li>
              </ul>
              <div className="cta-row">
                <a className="cta secondary" href="/public-scan">Run a public scan</a>
                <a className="cta" href="/login">Create workspace</a>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="section">
          <h2>Services</h2>
          <p className="muted">
            A unified compliance engine that connects scanning, policy generation,
            remediation, and audit-ready proof.
          </p>
          <div className="card-grid">
            <div className="card">
              <h3>Public Risk Scanner</h3>
              <p className="muted">Analyze public web signals, privacy disclosures, and consent flows.</p>
            </div>
            <div className="card">
              <h3>Policy Generation</h3>
              <p className="muted">Generate end-to-end policies mapped to regulation checklists.</p>
            </div>
            <div className="card">
              <h3>Remediation Workflows</h3>
              <p className="muted">Actionable fixes with evidence tracking and ownership.</p>
            </div>
            <div className="card">
              <h3>Audit-Ready Proof</h3>
              <p className="muted">Export branded reports with findings and remediation.</p>
            </div>
          </div>
        </section>

        <section id="pipeline" className="section">
          <h2>Scan → Detect → Generate → Fix → Prove</h2>
          <p className="muted">A single pipeline that replaces spreadsheets and consultants.</p>
          <div className="steps stagger">
            {[
              "Scan public pages and documents for compliance signals.",
              "Detect gaps mapped to regulations with transparent risk scoring.",
              "Generate policies tailored to your industry and jurisdictions.",
              "Fix issues with prioritized remediation guidance.",
              "Prove readiness with evidence vaults and PDF exports."
            ].map((text, index) => (
              <div key={text} className="step" style={{ ["--i" as never]: index }}>
                {text}
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="section">
          <h2>Pricing</h2>
          <p className="muted">Sample pricing layout (edit these later).</p>
          <div className="pricing-grid">
            <div className="price-card">
              <div className="price-tag">Starter</div>
              <div className="price">₹XX,XXX / month</div>
              <div className="muted">Short plan summary goes here.</div>
              <ul className="list compact">
                <li>Feature placeholder A</li>
                <li>Feature placeholder B</li>
                <li>Feature placeholder C</li>
              </ul>
              <a className="cta secondary" href="/login">Choose Starter</a>
            </div>
            <div className="price-card featured">
              <div className="price-tag">Growth</div>
              <div className="price">₹XX,XXX / month</div>
              <div className="muted">Short plan summary goes here.</div>
              <ul className="list compact">
                <li>Feature placeholder A</li>
                <li>Feature placeholder B</li>
                <li>Feature placeholder C</li>
              </ul>
              <a className="cta" href="/login">Choose Growth</a>
            </div>
            <div className="price-card">
              <div className="price-tag">Enterprise</div>
              <div className="price">Custom</div>
              <div className="muted">Short plan summary goes here.</div>
              <ul className="list compact">
                <li>Feature placeholder A</li>
                <li>Feature placeholder B</li>
                <li>Feature placeholder C</li>
              </ul>
              <a className="cta secondary" href="/login">Talk to sales</a>
            </div>
          </div>
        </section>

        <section id="plans" className="section">
          <h2>Plans</h2>
          <p className="muted">Pick the engagement that matches your compliance maturity.</p>
          <div className="plan-grid">
            <div className="plan-card">
              <h3>Foundation</h3>
              <p className="muted">Baseline policies, public scan, and initial risk score.</p>
              <div className="pill ok">2 weeks</div>
            </div>
            <div className="plan-card">
              <h3>Operational</h3>
              <p className="muted">Remediation workflows, evidence mapping, and dashboards.</p>
              <div className="pill warn">4 weeks</div>
            </div>
            <div className="plan-card">
              <h3>Audit Ready</h3>
              <p className="muted">Export-ready proof packs and auditor-friendly reports.</p>
              <div className="pill ok">6 weeks</div>
            </div>
          </div>
        </section>

        <section id="terms" className="section">
          <div className="panel">
            <h2>Terms &amp; Conditions</h2>
            <p className="muted">
              ComplySafe assessments use publicly available information only. Results are
              advisory and intended to guide compliance improvements, not certify compliance.
            </p>
            <ul className="list compact">
              <li>No access to private systems or authentication-required pages.</li>
              <li>Clear disclosure of assumptions and confidence levels.</li>
              <li>Reports include remediation guidance and evidence recommendations.</li>
            </ul>
            <div className="cta-row">
              <a className="cta secondary" href="/public-scan">View sample report</a>
              <a className="cta" href="/login">Accept &amp; continue</a>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Integrations</h2>
          <div className="card-grid">
            {["AWS", "GCP", "Azure", "Okta", "Google Workspace", "GitHub", "Jira", "Slack"].map((name) => (
              <div key={name} className="card">
                <strong>{name}</strong>
                <div className="muted">Connector ready</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="panel cta-panel">
            <h2>Start your compliance program today</h2>
            <p className="muted">Connect tools, scan public pages, and get audit-ready outputs fast.</p>
            <div className="cta-row">
              <a className="cta" href="/login">Create Workspace</a>
              <a className="cta secondary" href="/public-scan">Run Public Scan</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
