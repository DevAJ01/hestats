# HEStats Platform Expansion Plan

## Context

The user has provided a detailed brief (`hestats-platform-expansion.md`) to evolve HEStats from a financial intelligence platform into a comprehensive UK Higher Education intelligence ecosystem covering graduate outcomes, employer intelligence, degree analytics, AI career impact, industry profiles, and an interactive career explorer.

The platform currently has 12 routes, 154 institutions, 10 years of financial data, and an established pattern of deterministic seed-based mock data. All new data must follow that pattern (deterministic, seeded from institution/subject IDs) since there is no backend.

---

## What Gets Built

### 1. New Data Files (`src/app/data/`)

**`outcomes.ts`** — Graduate outcomes engine
- `GraduateOutcome` interface: `employment_rate_15mo`, `graduate_role_pct`, `unemployed_pct`, `further_study_pct`, `self_employed_pct`, `avg_salary_k`, `median_salary_k`, `salary_1yr`, `salary_3yr`, `salary_5yr`, `avg_months_to_job`, `working_internationally_pct`
- Per-institution outcomes derived deterministically from institution tier (russell-research → higher outcomes) + financial health score
- Sector averages computed as aggregates
- `getOutcomesByInstitution(id)`, `getSectorOutcomes()`, `getTopByOutcome(metric, n)`

**`employers.ts`** — 26 major UK graduate employers
- `Employer` interface: `id`, `name`, `sector`, `hq_city`, `annual_graduate_intake`, `top_universities` (array of institution IDs with hire counts), `top_subjects`, `avg_starting_salary_k`, `retention_rate`, `placement_partnerships` (institution IDs), `ai_exposure_pct`, `description`
- Hard-coded realistic data for: Google, Microsoft, Amazon, Apple, Meta, Rolls-Royce, BAE Systems, Deloitte, PwC, EY, KPMG, HSBC, Barclays, JP Morgan, Goldman Sachs, AstraZeneca, GSK, NHS, BBC, Jaguar Land Rover, ARM, Dyson, Siemens, NVIDIA, IBM, Civil Service
- `getEmployerById(id)`, `getEmployersBySector()`, `getTopEmployersForInstitution(id)`

**`degrees.ts`** — 20 degree subjects with full analytics
- `Degree` interface: `id`, `name`, `ucas_code`, `annual_enrolments`, `annual_graduations`, `employment_rate`, `avg_salary_k`, `further_study_pct`, `phd_progression_pct`, `gender_balance_female_pct`, `international_pct`, `ai_automation_risk_pct`, `ai_augmentation_pct`, `top_institutions` (ids), `top_employers` (employer ids), `industry_destinations`, `satisfaction_score`
- Subjects: Computer Science, Medicine, Law, Economics, Engineering (Mechanical), Physics, Business, Psychology, Nursing, Mathematics, Chemistry, History, English, Architecture, Finance, Education, Pharmacy, Biology, Data Science, Artificial Intelligence
- `getDegreeById(id)`, `getDegreesByAIRisk(order)`, `getDegreesForInstitution(id)`

**`industries.ts`** — 12 major industry profiles
- `Industry` interface: `id`, `name`, `top_universities`, `top_degrees`, `avg_salary_k`, `employment_growth_pct`, `ai_exposure_pct`, `regional_hubs`, `graduate_intake_annual`, `retention_rate`
- Industries: Technology, Finance, Healthcare, Manufacturing, Energy, Construction, Law, Education, Consulting, Government, Creative Industries, Life Sciences

---

### 2. New Pages (`src/app/pages/`)

**`GraduateOutcomesPage.tsx`** (`/graduate-outcomes`)
- Sector status bar with headline metrics (avg employment rate, avg salary, avg time to job)
- 4-tab layout: Overview | By Institution | By Subject | By Employer
- Overview: sector radar, outcome distribution chart, top/bottom 10 institutions, salary histogram
- By Institution: searchable sortable table of all 154 institutions with outcomes metrics
- By Subject: subject cards with employment, salary, AI risk for each of 20 degrees
- By Employer: which employers absorb the most graduates and from which institutions

**`EmployersPage.tsx`** (`/employers`)
- Status bar with total employer count, sector distribution
- Employer cards grid (sector-grouped, searchable)
- Each card: employer name, sector badge, annual intake, avg salary, top 3 universities supplying graduates
- Click through to employer detail (inline expand or drawer)
- Employer detail: top universities table, subject breakdown, salary, retention, placement partnerships, AI exposure, recruitment trend sparkline

**`DegreesPage.tsx`** (`/degrees`)
- Status bar: 20 subjects, sector enrolments, avg graduate employment
- Subject grid (2→3→4 columns responsive)
- Each subject card: name, annual graduations, employment rate, avg salary, AI risk indicator (color-coded), satisfaction score, top university
- Filter: by employment rate / salary / AI risk / further study / gender balance
- Subject detail (inline expand): full metrics, AI breakdown (automation vs augmentation), top employers, top institutions, industry destinations bar chart

**`CareerExplorerPage.tsx`** (`/career-explorer`)
- Step-by-step interactive explorer: Choose Degree → See Universities → See Employers → See Salary → See AI Outlook → See Regional Demand
- Step 1: degree picker grid (20 subjects with AI risk badges)
- Step 2: top 5 universities for that degree (with link to institution profile)
- Step 3: top employers hiring graduates (with links to employer profiles)
- Step 4: salary progression bars (1yr / 3yr / 5yr)
- Step 5: AI impact visualization (automation vs augmentation radar)
- Step 6: UK regional demand map (simplified SVG with regional hiring distribution)
- Each step links to full detail pages (Degrees, Employers, Institutions, GraduateOutcomes)

**`StudentJourneyPage.tsx`** (`/student-journey`)
- Full-screen animated timeline visualisation
- Vertical stages: Application → Offer → Enrolment → Placement → Graduation → Employment → Progression → Masters → PhD → Industry Leadership
- Each stage: stat cards with real sector data (e.g. UCAS applicants: 760k, Acceptance rate: 67%, Enrolments: 2.4M, etc.)
- National aggregate figures for each stage
- User can click any stage to see which institutions perform best at that transition
- Animated connecting lines between stages (CSS transitions)
- Cross-links: "See placement stats by university", "Explore graduate outcomes", "Compare degree paths"

---

### 3. Updated Existing Files

**`src/app/pages/RankingsPage.tsx`** — Add 3 new tab groups:
- **Employment tab**: Graduate Employment Rate, Avg Graduate Salary, Time to Employment, Placement Participation
- **Education tab**: Student Satisfaction, NSS Score, Masters Progression, PhD Progression
- **AI Resilience tab**: AI Automation Risk (lower = better), AI Augmentation Potential

All new sort keys derived from `outcomes.ts` data. Pattern: add new `SortKey` union members, extend `getValue()`, add new `TabDef` entries.

**`src/app/pages/InstitutionProfilePage.tsx`** — Enhance the existing `Outcomes` tab (currently minimal):
- Replace placeholder content with rich data from `outcomes.ts`
- Add: employment funnel chart (employed → graduate-level → international), salary progression bars, subject-level breakdown table, comparison vs sector average for all outcome metrics
- Add employer flow: top 5 employers hiring from this institution (links to EmployersPage)

**`src/app/components/layout/Navbar.tsx`** — Expand PRIMARY_NAV:
- Add "Outcomes" → `/graduate-outcomes`
- Add "Careers" → `/career-explorer`  
- Add "Employers" → `/employers`
- Add "Degrees" → `/degrees`
- Group in mobile drawer under "Intelligence" section heading

**`src/app/routes.tsx`** — Register 5 new routes:
```
/graduate-outcomes → GraduateOutcomesPage
/employers → EmployersPage
/degrees → DegreesPage
/career-explorer → CareerExplorerPage
/student-journey → StudentJourneyPage
```

**`src/app/pages/HomePage.tsx`** — Add a "Career Intelligence" indicators strip (same pattern as existing ERA_INDICATORS and DEBT_INDICATORS strips):
- Sector graduate employment rate, avg graduate salary, employer count, top-paying degree, most AI-resilient degree, fastest-to-employment subject

---

### 4. Data Design Principles

- All new data is **deterministic from seed**: `institution_id.split('').reduce((s,c) => s + c.charCodeAt(0), 0)` as the seed base, same pattern as Outcomes/Staff/Estates tabs already use
- **Institution outcomes** derived from: mission group tier (russell-research → +12pp employment, +£8k salary) + financial health score (each 10 points → +1pp employment) + nation adjustment
- **Degree data** is hardcoded realistic values (not seeded) since there are only 20 subjects — use real-world-order-of-magnitude figures from HESA/Graduate Outcomes Survey public data
- **Employer data** is hardcoded for 26 named employers — university supply rankings are plausible (Oxford, Cambridge, Imperial at top for tech; Leeds, Manchester for NHS) but clearly labelled as illustrative
- AI impact figures drawn from McKinsey/Oxford Future of Work research ranges (clearly labelled as modelled estimates per the expansion brief)

---

### 5. Navigation Structure After Expansion

```
Overview | Institutions | Rankings | Compare | Sector | Reports | Open Data | Map | API | Methodology
                                                    + mobile drawer adds:
                                                    Graduate Outcomes | Career Explorer | Employers | Degrees
```

The 4 new pages go in the mobile drawer under an "Intelligence" section to avoid overcrowding the desktop nav bar (which is already at 10 items). On desktop they appear in the drawer accessed via hamburger.

Alternatively, collapse existing nav items into a "Data" group and surface the new intelligence pages at the top level. Decision: keep existing desktop nav unchanged, add all 5 new routes to the mobile drawer under "New — Intelligence" heading.

---

### 6. File Creation & Edit Summary

**New files (7):**
- `src/app/data/outcomes.ts`
- `src/app/data/employers.ts`
- `src/app/data/degrees.ts`
- `src/app/data/industries.ts`
- `src/app/pages/GraduateOutcomesPage.tsx`
- `src/app/pages/EmployersPage.tsx`
- `src/app/pages/DegreesPage.tsx`
- `src/app/pages/CareerExplorerPage.tsx`
- `src/app/pages/StudentJourneyPage.tsx`

**Edited files (5):**
- `src/app/routes.tsx` — add 5 routes
- `src/app/components/layout/Navbar.tsx` — add new links to mobile drawer
- `src/app/pages/RankingsPage.tsx` — add Employment/Education/AI tabs
- `src/app/pages/InstitutionProfilePage.tsx` — enrich Outcomes tab
- `src/app/pages/HomePage.tsx` — add career intelligence indicators strip

---

### 7. Verification

After implementation:
1. Visit `/graduate-outcomes` — confirm all 4 tabs render with data, outcomes table shows 154 institutions
2. Visit `/employers` — confirm all 26 employers shown, detail expand works, university supply table renders
3. Visit `/degrees` — confirm 20 subjects with filter controls working
4. Visit `/career-explorer` — step through all 6 steps, confirm cross-links to institutions/employers/degrees
5. Visit `/student-journey` — confirm all 10 stages render with data
6. Visit `/rankings` — confirm Employment/Education/AI tabs appear and sort correctly
7. Visit `/institutions/oxford` → Outcomes tab — confirm richer data (employer flow, salary progression)
8. Check mobile — confirm new pages accessible via hamburger drawer
