# Ntando Sithole — Actuarial Portfolio (`ntandosithole.com`)

Professional actuarial portfolio, reproducible R research repository, and interactive Automation & AI showcase for **Ntando Sithole** (Actuarial Specialist — Cell Captives, IFRS 17, MCEV & SAM Valuations, Capital Modelling, Data Insights, Applied AI, and Actuarial Systems Automation).

Live site: **https://ntandosithole.com**

---

## 1. Website Purpose & Strategic Positioning

This website serves as an authoritative, audit-grade technical portfolio for actuarial leadership, hiring managers, risk & finance stakeholders, and fellow actuaries. Rather than presenting generic claims, it demonstrates:

1. **Core Actuarial & Regulatory Mastery:** Practical depth across cell captive arrangements, credit-life and disability portfolios, IFRS 17 (BEL, RA, LFRC, CSM, Analysis of Surplus), SAM capital modelling, MCEV, employee benefits (IAS 19), and asset consulting.
2. **Focus on Data, Data Insights, Applied AI & Actuarial Systems Automation:** How modern scripting (R, Python, SQL, Prophet automation) and structured, evidence-grounded AI workflows reduce valuation-cycle friction, improve data quality, and surface clearer insights for boards and risk committees.
3. **First-Line Governance & Reproducibility:** Every quantitative article and interactive AI project explicitly separates synthetic inputs from production models, documents assumptions and limitations, enforces validation controls, and preserves human sign-off.

---

## 2. Site Map & Architecture

```
ntandosithole.com
├── Home (index.qmd)
│   ├── Professional Profile & Strategic Focus (Valuations, Data Insights, AI & Systems Automation)
│   ├── Areas of Practice (10 core competency pillars)
│   ├── Featured Research (dynamic Quarto grid of latest R articles)
│   └── Automation & AI Highlights (links to interactive demonstrations & Workflow Triage)
│
├── Resume (resume.qmd)
│   ├── Quick Actions: LinkedIn, Contact, & "Request CV (PDF / DOCX)" (automated email alert + requester form)
│   ├── Professional Summary & Current Focus (Actuarial Systems Automation, Data Insights, Applied AI)
│   ├── Professional Experience (OMART Cell Captives, Simeka Asset Consulting & Employee Benefits)
│   ├── Selected Achievements (Systems Automation, Board Insights, SAM Alignment, Audit Governance)
│   ├── Technical Capabilities (4-pillar capability grid)
│   └── Education (Wits BSc & BSc Hons Actuarial Science) & Actuarial Exam Progress
│
├── Research Hub (research.qmd)
│   ├── Life Insurance Cash Flow Projection and Reserve Sensitivity in R
│   │   └── (research/life-insurance-reserving/index.qmd)
│   └── Markov Chain Modelling of No-Claims Discount Systems
│       └── (research/markov-ncd/index.qmd)
│
├── Automation & AI Hub (projects/index.qmd)
│   ├── 01 · Rough Notes → Clear Handover (projects/notes-to-handover/index.qmd)
│   ├── 02 · Instructions → Missing Questions (projects/instruction-check/index.qmd)
│   ├── 03 · Two Versions → What Changed (projects/change-brief/index.qmd)
│   └── Flagship Project: AI-Assisted Workflow Triage (projects/workflow-triage/index.qmd + run.mjs)
│
├── Contact (contact.qmd)
│   └── AJAX-enabled FormSubmit contact form with honeypot protection & LinkedIn link
│
└── 404 Error Page (404.qmd)
```

---

## 3. Main Aims of Each Section & Project (and How Each Is Useful)

### A. Home (`index.qmd`)
- **Main Aim:** Establish immediate credibility and communicate Ntando's dual strength in statutory/corporate actuarial work (Cell Captives, IFRS 17, MCEV, SAM) and modern analytical engineering (Data Insights, Applied AI, and Actuarial Systems Automation).
- **How It Is Useful:**
  - Gives busy executives, recruiters, and actuarial heads a 30-second overview of domain expertise and technical capabilities.
  - Provides direct pathways to the Resume, reproducible R research, and live browser-based automation demos.
  - Includes `Person` JSON-LD structured data and Open Graph metadata for search engine discovery and professional sharing on LinkedIn.

### B. Resume (`resume.qmd`)
- **Main Aim:** Present a structured, verifiable record of career progression (from Employee Benefits and Asset Consulting at Simeka to Cell Captive IFRS 17 & SAM valuations at Old Mutual Alternative Risk Transfer), technical tooling, and professional exam progress.
- **How It Is Useful:**
  - **Controlled CV Request (`Request CV (PDF / DOCX)`):** Protects privacy and document distribution by not exposing static downloadable files to scrapers. Clicking **"Request CV (PDF / DOCX)"** automatically sends an instant email notification to Ntando via FormSubmit and opens an inline form where the requester can submit their email address, organisation, and preferred format (`PDF`, `DOCX`, or `Both`).
  - **Print-Optimised CSS:** Includes dedicated `@media print` rules in `styles.css` so the page formats cleanly if printed directly from a browser.

### C. Reproducible Actuarial Research (`research.qmd` & `research/*`)

#### 1. *Life Insurance Cash Flow Projection and Reserve Sensitivity in R* (`research/life-insurance-reserving/index.qmd`)
- **Main Aim:** Demonstrate transparent, auditable R implementation of life contingency mathematics—from Gompertz-Makeham mortality construction ($q_x$, ${}_tp_x$) and net/gross level premium calculation ($A^1_{x:\overline{n}|}$, $\ddot{a}_{x:\overline{n}|}$) to 20-year portfolio cash-flow projections, prospective reserve trajectories ($V_k$), and two-way valuation basis sensitivity testing (discount rate vs. mortality scaling).
- **How It Is Useful:**
  - Shows how policy-level actuarial formulae connect to portfolio-level cash flows and IFRS 17 / SAM valuation movement intuition.
  - Serves as a clean template for independent model validation, reasonableness checks, and sensitivity analysis outside black-box valuation engines.

#### 2. *Markov Chain Modelling of No-Claims Discount Systems* (`research/markov-ncd/index.qmd`)
- **Main Aim:** Formulate a four-class short-term insurance No-Claims Discount (NCD) rating system as a discrete-time Markov chain ($\mathbf{P}^t$), solve for the ergodic stationary distribution ($\boldsymbol{\pi}\mathbf{P} = \boldsymbol{\pi}$) via QR decomposition, and project 10-year expected premium emergence toward long-run equilibrium.
- **How It Is Useful:**
  - Cleanly separates **policyholder migration mechanics** (transition matrix $\mathbf{P}$) from **commercial pricing scales** (discount vector $\boldsymbol{d}$), enabling actuaries to test transition rules and discount scales independently.
  - Highlights practical diagnostics (such as long-run concentration in the maximum-discount class) alongside explicit discussion of model limitations (Markov memorylessness, time homogeneity, lapses, and portfolio heterogeneity).

### D. Automation & AI Projects (`projects/index.qmd` & `projects/*`)

#### 1. *Everyday AI Demonstrations* (`notes-to-handover`, `instruction-check`, `change-brief`)
- **Main Aim:** Show how small, high-friction operational and analytical tasks between major deliverables can be assisted by structured prompting without hallucinating facts, owners, or commitments:
  - **01 · Rough Notes → Clear Handover (`projects/notes-to-handover/index.qmd`):** Separates agreed decisions from tentative suggestions and flags unassigned owners or unstated deadlines.
  - **02 · Instructions → Missing Questions (`projects/instruction-check/index.qmd`):** Stress-tests process documentation from a newcomer's perspective to expose unstated assumptions, missing file rules, and approval ambiguities before a handoff fails.
  - **03 · Two Versions → What Changed (`projects/change-brief/index.qmd`):** Compares earlier and revised wording line-by-line to surface subtle shifts in dates, obligations (`may` vs. `must`), and conditions.
- **How It Is Useful:**
  - Visitors can inspect pre-verified worked outputs, edit the source text in the browser to generate a custom source-delimited prompt, and copy or download the prompt with an embedded human-review checklist.
  - Guardrails in `assets/automation/everyday-engine.js` ensure that if a user edits the input, the prewritten response is automatically hidden so an unverified output is never misrepresented as describing custom text.

#### 2. *Flagship Project: AI-Assisted Workflow Triage* (`projects/workflow-triage/index.qmd` & `run.mjs`)
- **Main Aim:** Demonstrate how deterministic validation rules and bounded AI summarise operational/analytical queues safely. The engine runs 5 automated intake controls (`C1` Missing required fields, `C2` Duplicate request IDs, `C3` Invalid age values, `C4` Unrecognised categories, `C5` Overdue follow-up threshold), builds a draft routing plan across queues, strips all record-level PII/identifiers, and passes only aggregate control evidence (with a SHA-256 fingerprint) to the AI review step.
- **How It Is Useful:**
  - **Dual Runtime (Browser + Node.js CLI):** The exact same engine (`assets/automation/review-engine.js`) powers the interactive browser console and the downloadable CLI runner (`projects/workflow-triage/run.mjs`).
  - **Fail-Closed Structural Grounding:** `validateDraft()` verifies that every flagged control appears in the AI output with its exact observed count unchanged, rejecting hallucinated controls, altered counts, or missing human-review flags.
  - **Privacy & Auditability by Design:** Demonstrates how actuarial and risk teams can adopt LLMs using structured outputs (`store: false`, strict JSON schema, zero PII exposure, and cryptographic evidence hashing).

---

## 4. Technical Stack & Repository Structure

| Path | Role |
| :--- | :--- |
| `_quarto.yml` | Global Quarto site configuration, navbar/footer, Open Graph & Twitter Card metadata |
| `theme.scss` / `styles.css` | Custom navy/teal design system, responsive grids, accessibility focus styles, and `@media print` rules |
| `_includes/accessibility.html` | Dynamic skip-link injection and keyboard `tabindex="0"` management for scrollable tables, code, and MathJax |
| `_includes/analytics.html` | Privacy-friendly GoatCounter analytics integration |
| `assets/automation/*` | Browser & Node.js engines (`everyday-engine.js`, `review-engine.js`), UI controllers, fixtures, and downloadable source zip |
| `tests/*.test.mjs` | 17 automated Node.js unit and integration tests covering prompt escaping, intake controls, SHA-256 grounding, and OpenAI Responses API error handling |
| `_freeze/` | Pre-computed Quarto execution outputs for R research articles, enabling fast, deterministic CI builds |
| `.github/workflows/publish.yml` | GitHub Actions CI/CD pipeline: runs `node --test tests/*.test.mjs`, renders Quarto, and publishes to `gh-pages` (`ntandosithole.com`) |

## 5. Running Tests & Rendering Locally

```bash
# Run the automated Node.js test suite (requires Node.js 22+)
node --test tests/*.test.mjs

# Run the Workflow Triage CLI offline
node projects/workflow-triage/run.mjs
node projects/workflow-triage/run.mjs --scenario clean --threshold 8

# Render the Quarto website
quarto render
```
