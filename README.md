# Cyber ROI — Vulnerability Risk Prioritization

Cyber ROI is a React + TypeScript web application for prioritizing cybersecurity vulnerabilities when security teams have limited remediation time.

Instead of ranking vulnerabilities only by severity, the application combines multiple risk signals and uses a budget-aware optimization approach to identify the vulnerabilities that provide the greatest risk reduction for the available remediation hours.

## Features

- **Risk-based vulnerability scoring**
  - CVSS severity
  - EPSS exploit probability
  - CISA Known Exploited Vulnerability (KEV) status
  - Asset criticality
  - Internet-facing exposure
  - Estimated remediation/fix time

- **Budget-aware optimization**
  - Set the number of remediation hours available.
  - Select the vulnerability set that maximizes risk reduction within that time budget.
  - See selected and deferred findings, hours used, remaining capacity, and risk reduction.

- **Baseline comparisons**
  - Severity-first / CVSS-first prioritization
  - Top-down composite-risk prioritization
  - Optimized prioritization
  - Useful for demonstrating why severity-only triage can be inefficient.

- **Explainable recommendations**
  - The application provides reasons for why vulnerabilities are selected or deferred.
  - ROI is calculated as risk reduction per remediation hour.

- **Dashboard and visualizations**
  - Overview
  - Findings
  - Optimize
  - Plan
  - Insights
  - Import

- **Supabase authentication and per-user workspaces**
  - Demo login accounts are included and are created in Supabase on first sign-in.
  - Users can register additional accounts through Supabase Auth.
  - Each authenticated user receives an isolated profile, workspace, and vulnerability dataset.

- **Demo dataset**
  - The project includes sample vulnerability findings so the application can be demonstrated immediately.

- **Light/Dark theme**
  - Theme preference is persisted locally.

## Technology Stack

| Technology | Purpose |
|---|---|
| React 19 | User interface |
| TypeScript | Application logic and type safety |
| Vite | Development server and build tool |
| Tailwind CSS 4 | Styling |
| React DOM | Rendering |
| clsx | Conditional class handling |
| tailwind-merge | Tailwind class merging |

## Project Structure

```text
test12-main/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    │   ├── TopNav.tsx
    │   ├── TimeBudgetControl.tsx
    │   ├── common.tsx
    │   ├── pages/
    │   │   ├── AddThreat.tsx
    │   │   ├── Findings.tsx
    │   │   ├── Import.tsx
    │   │   ├── Insights.tsx
    │   │   ├── Login.tsx
    │   │   ├── Optimize.tsx
    │   │   ├── Overview.tsx
    │   │   └── Plan.tsx
    │   └── viz/
    │       ├── AreaRisk.tsx
    │       ├── BeforeAfter.tsx
    │       ├── CapacityTimeline.tsx
    │       ├── MethodBars.tsx
    │       ├── RadialGauge.tsx
    │       ├── RiskComposition.tsx
    │       ├── ScatterBubble.tsx
    │       └── SlopeChart.tsx
    ├── data/
    │   └── demo.ts
    ├── lib/
    │   ├── risk.ts
    │   ├── store.tsx
    │   ├── types.ts
    │   └── ui.ts
    └── utils/
        └── cn.ts
```

## How the Risk Model Works

Each vulnerability contains several security and operational attributes:

```text
CVSS
EPSS
KEV status
Asset criticality
Internet-facing exposure
Remediation time
```

These inputs are converted into a composite risk score.

The optimizer then considers:

```text
Risk reduction
        ÷
Remediation time
        =
Risk reduction per hour (ROI)
```

The goal is to maximize total risk reduction while staying within the available remediation-hour budget.

The project also includes two simple baseline strategies:

1. **Severity-first** — prioritizes the highest CVSS vulnerabilities.
2. **Top-down** — prioritizes the highest composite-risk vulnerabilities.

These baselines allow the dashboard to compare different triage strategies.

> **Important:** This is a decision-support/demo application. Its scoring model is implemented in `src/lib/risk.ts` and should be reviewed and calibrated before being used for real-world security operations.

## Getting Started

### Prerequisites

Install:

- Node.js
- npm

Check your installation:

```bash
node --version
npm --version
```

### Installation

Clone or download the repository, then open a terminal in the project directory:

```bash
npm install
```

### Run in Development Mode

```bash
npm run dev
```

Vite will provide a local development URL, normally similar to:

```text
http://localhost:5173
```

Open that address in your browser.

### Create a Production Build

```bash
npm run build
```

The production files are generated in:

```text
dist/
```

### Preview the Production Build

```bash
npm run preview
```

## Demo Login

The application seeds two demo accounts:

| Username | Password |
|---|---|
| `admin` | `cyber-roi-2026` |
| `analyst` | `risk-intel` |

These credentials are intended only for demonstration.

## Supabase Configuration and Data Storage

The application uses Supabase Auth and the tables defined in `supabase/schema.sql`. Before running or deploying it, create a `.env` file from `.env.example` and set the project URL and publishable anon key:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor. The browser calls `supabase.auth.signUp()` for new users, and authenticated requests persist profiles, workspaces, and vulnerability records under the signed-in user ID. Because this is a static Vite application, the `VITE_*` values are embedded at build time; rebuild and redeploy after changing them.

The username-only UI maps a normalized username to an internal email-shaped identifier such as `new.user@cyber-roi.local`. In Supabase Auth, disable **Confirm email** for this demo flow, because users do not enter a deliverable email address. For production, replace the username field with a real email field and keep email confirmation enabled.

The browser may retain a small list of usernames for convenience, but it is not the source of truth for authentication. The source of truth is Supabase Auth.

### Security Warning

The included demo credentials are not suitable for production. Use real user email addresses, strong password policies, email confirmation, appropriate redirect URLs, and server-side authorization policies before deploying this application for real users.

## Importing Vulnerability Data

The application includes an import workflow for vulnerability findings.

The expected vulnerability model contains fields such as:

```text
id
cve
title
description
cvss
epss
kev
assetCriticality
fixTime
internetFacing
```

Example:

```json
{
  "id": "v1",
  "cve": "CVE-2026-10421",
  "title": "Internet-facing RCE in edge gateway",
  "description": "Unauthenticated remote code execution in a public-facing gateway.",
  "cvss": 9.8,
  "epss": 0.94,
  "kev": true,
  "assetCriticality": 5,
  "fixTime": 4,
  "internetFacing": true
}
```

## Main Application Pages

### Overview

Provides a high-level view of the current vulnerability landscape, risk metrics, and remediation status.

### Findings

Displays vulnerability findings and their calculated risk characteristics.

### Optimize

Uses the available remediation-hour budget to identify a more efficient remediation set.

### Plan

Helps translate optimization results into a remediation plan based on the available capacity.

### Insights

Provides visual comparisons and analytical views of risk and prioritization methods.

### Import

Allows vulnerability data to be loaded into the application.

### Add Threat

Allows individual vulnerability findings to be added manually.

## Deployment

Because the project is a Vite/React frontend and does not require a real backend for its current functionality, it can be deployed as a static website.

Typical deployment options include:

- Vercel
- Netlify
- Render Static Site
- GitHub Pages

For static deployment, build the project first:

```bash
npm install
npm run build
```

Then deploy the generated `dist/` directory using the hosting provider's static-site workflow.

## Limitations

This repository is currently designed as a frontend/demo implementation.

It does **not** provide:

- A real server-side API
- A real external database
- Server-side authentication
- Multi-user synchronization across browsers/devices
- Real-time vulnerability-feed ingestion
- Automatic CVE/EPSS/KEV updates
- Production-grade password security
- Enterprise authorization/RBAC

If this is developed into a production security platform, these capabilities should be moved to a secure backend and connected to appropriate vulnerability intelligence sources.

## Development

Useful commands:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production version
npm run build

# Preview production build
npm run preview
```

The main risk and optimization logic is located in:

```text
src/lib/risk.ts
```

Application state, authentication, browser persistence, and user databases are handled in:

```text
src/lib/store.tsx
```

The vulnerability data model is defined in:

```text
src/lib/types.ts
```

The included demonstration dataset is located in:

```text
src/data/demo.ts
```

## License

This project does not currently specify a license.

If the project is intended for public distribution, add an appropriate `LICENSE` file and update this section.

## Project Purpose

Cyber ROI demonstrates a practical security-operations problem:

> **When remediation time is limited, which vulnerabilities should be fixed first to achieve the greatest reduction in overall security risk?**

The project is intended to demonstrate how vulnerability prioritization can move beyond simply fixing the highest CVSS scores and instead consider exploitability, exposure, asset importance, remediation effort, and risk reduction per unit of available time.
