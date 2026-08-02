# 🚀 AI Resume Coach & Adaptive Career Intelligence Platform

[![Next.js 14](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-3.6_Flash-8e44ad?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)](#license)

> An enterprise-grade, full-stack career acceleration suite powered by Next.js 14 App Router, Google Gemini 3.6 Flash LLM engine, real-time A4 printable canvas, ATS keyword optimization, video mock interview simulator, and adaptive learning roadmap studio.

---

## 📋 Table of Contents
- [🌟 Key System Architecture & Core Modules](#-key-system-architecture--core-modules)
- [📁 Repository Directory Structure](#-repository-directory-structure)
- [⚡ Quick Start & Installation](#-quick-start--installation)
- [🔌 API Route Specifications](#-api-route-specifications)
- [🗄️ Database Schema & Data Models](#️-database-schema--data-models)
- [🤖 AI Prompt Engineering & Model Routing](#-ai-prompt-engineering--model-routing)
- [🛠️ Production Build & Docker Deployment](#️-production-build--docker-deployment)
- [🔒 Security, Performance & Print Optimization](#-security-performance--print-optimization)
- [📄 License](#-license)

---

## 🌟 Key System Architecture & Core Modules

### 1. 📄 Interactive A4 Resume Studio & PDF Importer
* **Real-Time Canvas**: Live Swiss-Modern split-view preview rendering target resume content instantly.
* **1-Click PDF Export**: Uses `@media print` rules with physical A4 margins (`210mm x 297mm`) for high-fidelity physical PDF generation without third-party canvas distortion.
* **AI PDF Importer & Parsing**: Converts uploaded resume PDFs into structured JSON (`summary`, `experience`, `skills`, `education`).

### 2. 🎯 Advanced ATS Scorer & Bullet Optimizer
* **Radial Score Gauge**: Computes semantic match percentages against raw job descriptions.
* **Google X-Y-Z Formula Bullet Rewriter**: Transforms basic bullet points into metric-driven accomplishments (*"Accomplished [X] as measured by [Y], by doing [Z]"*).
* **Keyword Hub**: Color-coded matched vs missing skill pill breakdown.

### 3. 🎥 Live Video & Speech Mock Interview Simulator
* **Interactive Video Stream**: Real-time webcam feed with live audio waveform microphone level monitoring.
* **Speech Synthesis & Speech-to-Text**: Speech-driven AI coach that speaks questions out loud and transcribes candidate verbal responses.
* **Historical Recharts Trend Analytics**: Graphs mock interview score progression over time alongside resume ATS match scores.

### 4. 🧠 Adaptive Learning Studio & Practice Suite
* **Role Curriculum Generator**: Generates step-by-step tech roadmaps based on target software engineering roles.
* **Verified HD Video Player**: YouTube course embeds with timestamped chapter buttons.
* **Pomodoro Focus Session Timer**: Built-in 25-minute study timer with pause/reset controls and streak tracking (`🔥 Daily Streak`).
* **Flashcard Drill Engine**: Flip cards for rapid technical concept review.
* **AI Code Challenge Playground**: Inline editor for coding challenges with automated Gemini code evaluation.

### 5. 🤖 Multi-Persona Career Coach Chat
* **Specialized Advisors**:
  * 🎯 **Marcus** (Warm Career Coach)
  * 💼 **Sarah** (FAANG & Tech Recruiter)
  * ✨ **Marcus** (Executive & Hidden Market Specialist)
  * 🪙 **Elena** (Total Compensation & Salary Negotiation Expert)
* **Real-Time Context Sync**: Chatbot dynamically inspects user's active resumes, saved target jobs, and interview logs on file.

### 6. 🎨 Advanced Dual-Theme Engine
* Powered by `next-themes` with custom CSS variables (`--background`, `--foreground`, `--card`).
* **4 Curated Color Palettes**: Aurora Electric, Emerald Mint, Sunset Ember, and Neon Cyan.
* **Inline AI Engine Selector**: Dynamically routes requests between **Gemini 3.6 Flash** (Deep reasoning) and **Gemini 3.1 Flash Lite** (Ultra-fast latency).

---

## 📁 Repository Directory Structure

```text
career-builder/
├── src/
│   ├── app/
│   │   ├── (auth)/                   # NextAuth Credentials Auth Pages (Login / Register)
│   │   ├── (app)/                    # Main Authenticated Application Routes (Sidebar Layout)
│   │   │   ├── dashboard/            # Executive Overview & Metrics Dashboard
│   │   │   ├── career-roadmap/       # Visual Career Milestones & Vertical Timeline
│   │   │   ├── resume-builder/       # A4 Real-Time Resume Studio & PDF Importer
│   │   │   ├── jobs/                 # AI Job Matching Board & One-Click Apply Modal
│   │   │   ├── learning/             # Adaptive Curriculum, Video Courses & Code Playground
│   │   │   ├── interview/            # Live Video Mock Interview Simulator & Recharts
│   │   │   ├── ai/
│   │   │   │   ├── analyzer/         # Resume Strengths & Weaknesses Breakdown
│   │   │   │   ├── ats-scorer/       # Radial ATS Dial & Prompt Generator Hub
│   │   │   │   ├── improver/         # Section & Bullet Point Rewrite Tool
│   │   │   │   ├── cover-letter/     # Live A4 Printable Cover Letter Workspace
│   │   │   │   └── coach-chat/       # Multi-Persona AI Advisory Assistant
│   │   │   └── settings/             # User Profile & Security Settings
│   │   ├── admin/                    # Admin Dashboard, User Management & Job Seeding
│   │   └── api/                      # App Router Serverless API Endpoints
│   ├── components/                   # Reusable UI & Feature Components
│   │   ├── dashboard/                # Sidebar, Navigation, and Roadmap Timeline
│   │   ├── resume/                   # Resume Form & Interactive Canvas
│   │   ├── theme-toggle.tsx          # Advanced Theme & Model Routing Toggle
│   │   └── ui/                       # Atomic Design System (Button, Card, Input, etc.)
│   └── lib/                          # Utility Singletons (Prisma Client, Auth, Gemini AI)
├── prisma/
│   └── schema.prisma                 # Database Schema Models (User, Resume, Job, Interview, etc.)
├── public/                           # Static Assets & Icons
├── .env.example                      # Environment Template
├── docker-compose.yml                # Docker Infrastructure Configuration
├── Dockerfile                        # Multi-Stage Production Build File
├── tailwind.config.ts                # Tailwind Theme Extensions & Glow Shadow Definitions
└── tsconfig.json                     # Strict TypeScript Compiler Options
```

---

## 🔌 API Route Specifications

| Endpoint Path | HTTP Method | Auth Required | Description / Payload |
| :--- | :--- | :--- | :--- |
| `/api/auth/[...nextauth]` | `GET` / `POST` | No | NextAuth handler for Credentials login and session JWT tokens. |
| `/api/resume` | `GET` / `POST` | Yes | Retrieves user's active resume or saves draft changes (`title`, `content`). |
| `/api/resume/parse-pdf` | `POST` | Yes | Multipart PDF upload endpoint; parses text using Gemini AI into structured JSON. |
| `/api/ai/analyze` | `POST` | Yes | Analyzes uploaded resume text for strengths, weaknesses, and section metrics. |
| `/api/ai/ats-score` | `POST` | Yes | Compares active resume content against a job description; outputs match score (0-100). |
| `/api/ai/improve` | `POST` | Yes | Generates Google X-Y-Z bullet rewrites and summary critiques. |
| `/api/ai/cover-letter` | `POST` | Yes | Generates tailored cover letter markdown by tone (Persuasive, Executive, Startup, Technical). |
| `/api/ai/coach-chat` | `GET` / `POST` / `DELETE` | Yes | Multi-persona AI chatbot assistant with conversation persistence per user. |
| `/api/jobs` | `GET` / `POST` | Yes | Searches seeded jobs, computes AI match scores, and handles job bookmarking. |
| `/api/learning/skills` | `GET` / `POST` / `DELETE` | Yes | Fetches or resets user skill progress tracker records. |
| `/api/learning/resources` | `GET` | Yes | Fetches curated documentation links, study notes, and YouTube video embeds per skill. |
| `/api/interview` | `GET` / `POST` | Yes | Generates mock interview questions (Technical, HR, Aptitude) and evaluates candidate answers. |
| `/api/admin/users` | `GET` / `PATCH` / `DELETE` | Admin | Admin user management (Role promotion/demotion and user deletion). |

---

## 🗄️ Database Schema & Data Models

The platform uses Prisma ORM connected to PostgreSQL (or in-memory mock fallback):

```prisma
model User {
  id             String          @id @default(cuid())
  email          String          @unique
  name           String?
  passwordHash   String
  role           Role            @default(USER)
  resumes        Resume[]
  savedJobs      SavedJob[]
  skillProgress  SkillProgress[]
  mockInterviews MockInterview[]
  coachChats     CoachChat[]
}

model Resume {
  id        String   @id @default(cuid())
  userId    String
  title     String   @default("My Resume")
  content   Json     // { summary, experience[], education[], skills[] }
  updatedAt DateTime @updatedAt
}

model Job {
  id          String   @id @default(cuid())
  title       String
  company     String
  location    String
  description String
  requirements String[]
}

model SkillProgress {
  id          String   @id @default(cuid())
  userId      String
  skillName   String
  status      String   @default("not_started") // not_started | in_progress | done
  proficiency String   @default("Beginner")    // Beginner | Intermediate | Advanced
}

model MockInterview {
  id        String   @id @default(cuid())
  userId    String
  type      String   // technical | hr | aptitude
  jobTitle  String
  questions Json     // string[]
  answers   Json     // string[]
  feedback  String   // JSON string with detailed scores and feedback
  createdAt DateTime @default(now())
}
```

---

## 🤖 AI Prompt Engineering & Model Routing

The core LLM engine leverages **Google Gemini 3.6 Flash** with structured JSON output enforcement:

```typescript
// Model Routing Singletons (src/lib/anthropic.ts)
export async function generateGeminiContent(prompt: string, modelName = "gemini-3.6-flash") {
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: { responseMimeType: "application/json" }
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Prompt Strategies Employed:
1. **Google X-Y-Z Bullet Formula**: Forces bullet point optimization to follow high-impact metric formats.
2. **Context Injection**: Coach Chat requests dynamically inject active user resume content, saved job titles, and recent interview scores into the prompt system message.
3. **Fallback JSON Extractor**: When LLMs return markdown wrapper blocks (` ```json ... ``` `), a custom regex stripper ensures clean JSON parsing without throwing runtime errors.

---

## ⚡ Quick Start & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/career-builder.git
cd career-builder
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in required credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/career_builder?schema=public"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-generate-with-openssl"
NEXTAUTH_URL="http://localhost:3000"
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
```

### 3. Initialize Database & Push Schema
```bash
npm run db:push
```

### 4. Launch Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Production Build & Docker Deployment

### Local Production Build Verification
```bash
npm run build
npm run start
```

### Multi-Stage Docker Build
Build and run using Docker Compose:
```bash
docker-compose up --build -d
```

---

## 🔒 Security, Performance & Print Optimization
* **Authentication**: Secured with `NextAuth.js` credentials strategy using `bcryptjs` password hashing.
* **Hydration Safety**: Hydration guard checks (`isMounted`) across client components prevent SSR mismatch errors.
* **Sanitized Print Output**: `@media print` CSS targets strictly printable DOM trees (`#printable-resume-page` & `#printable-cover-letter-page`), completely stripping sidebars, top headers, and UI controls during physical print / PDF saving.

---

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for details.
