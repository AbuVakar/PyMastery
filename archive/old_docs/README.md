# 🚀 PyMastery (PyVerse) - Modern Python Learning Platform

![PyMastery Logo](https://img.shields.io/badge/PyMastery-Python%20Learning%20Platform-blue?style=for-the-badge&logo=python&logoColor=white)

> **Transform beginners into placement-ready Python developers through hands-on coding, visual execution tracing, and AI-powered mentoring**

PyMastery is a cutting-edge Python-first placement preparation platform that teaches by making you code, run programs safely, and understand execution through trace-and-replay—then helps you ship a capstone you can confidently show recruiters.

## 🌟 **NEW: World-Class UI Experience!**

We've completely transformed PyMastery's interface with **modern design, advanced animations, and enterprise-quality user experience**:

### **✨ UI Enhancements (100% Complete)**
- 🎨 **Modern Dashboard** - Interactive stats with real-time updates
- 🤖 **AI Learning Assistant** - Voice input, file upload, rich chat interface
- 📊 **Advanced Analytics** - Interactive charts with export capabilities
- 🏗️ **Agile Development Tools** - Kanban board with real-time collaboration
- 🪟 **Enhanced Modal System** - Draggable, resizable components

### **🚀 Key Features**
- **Professional Lucide Icons** throughout the interface
- **Smooth 60fps Animations** with Framer Motion
- **Glassmorphism Effects** for modern visual appeal
- **Mobile-First Responsive Design** optimized for all devices
- **Real-time Collaboration** with live updates and presence indicators
- **Multi-format Export** (CSV, PDF, Excel) for analytics
- **Voice Input Support** for hands-free interaction
- **Drag & Drop Functionality** for intuitive task management
- **🔥 Live Code Execution** with Judge0 sandbox for 10+ languages
- **⚡ Real-time Code Testing** with instant feedback
- **🛡️ Secure Environment** isolated code execution
- **📊 Performance Analytics** execution time and memory tracking

This document is the single source of truth for the project plan: MVP scope, modules, tech stack, timeline, deliverables, and risks.

---

Contents
--------

- [Goal](#goal)
- [Why this is different](#why-this-is-different)
- [Build strategy (MVP first)](#build-strategy-mvp-first)
- [Recommended tech stack](#recommended-tech-stack)
- [Architecture overview](#architecture-overview)
- [Modules](#modules)
- [Minimal database schema (starter)](#minimal-database-schema-starter)
- [8-week roadmap (phased)](#8-week-roadmap-phased)
- [90-second demo script](#90-second-demo-script)
- [Deliverables](#deliverables)
- [Risks and mitigations](#risks-and-mitigations)
- [Repo layout](#repo-layout)
- [Phase 1 kickoff checklist](#phase-1-kickoff-checklist)

---

## Goal

Build a Python-first web platform that turns beginners into placement-ready candidates by combining:

- Hands-on coding in the browser
- Visual execution (trace and replay)
- Role-based roadmaps (Backend / Data / ML / Automation)
- Scaffolded mentoring (hints, not full solutions) with clear explainability

The focus is practical interview preparation for MAANG and top MNC patterns, while keeping learning honest and measurable.

---

## Why this is different

Core differentiators:

- Trace player: step-by-step execution with line focus and variable state (then stack/coroutines later)
- Scaffolded hints: nudge → approach/pseudocode → guided tests
- Explain-to-earn: short written explanations to unlock full credit and strengthen recruiter trust
- Local-first privacy: traces stay on-device by default; uploads are strictly opt-in

Optional “wow” features (only after MVP is stable):

- Counterfactual roadmap simulator (hours/week slider → readiness ETA)
- Branching replay (edit a line → simulate an alternate trace)
- Peer replay compare (anonymized, opt-in)

---

## Build strategy (MVP first)

This project can grow very large, so we ship it in phases. The rule is simple:

> Build a small end-to-end demo first, then iterate.

The MVP demo must work in one smooth flow:

Editor → Run → Trace → Hint

MVP scope:

- Authentication and a basic dashboard
- Problem list and a single problem page
- In-browser Monaco editor
- Safe code execution via a sandbox (Judge0 to start)
- Stdout/stderr and testcase results
- Trace playback v0 (line highlight + locals table)
- Hints v0 (2–3 hint levels stored per question)

Once this MVP works, you already have a strong 60–90 second demo.

---

## Recommended tech stack

Frontend:

- ⚛️ **React 18** with Vite for fast development
- 🎨 **Tailwind CSS** for modern, responsive styling
- 🎬 **Framer Motion** for smooth animations
- 🎯 **Lucide React** for professional icons
- 📝 **Monaco Editor** for VS Code-like editing experience
- 💾 **IndexedDB** for local-first trace storage

Backend (core APIs):

- 🐍 **FastAPI** (Python) for high-performance APIs
- 🔐 **JWT Authentication** for secure user sessions

Database and caching:

- 🗄️ **MongoDB Atlas** for primary data storage
- ⚡ **Redis** for caching, queues, and rate limiting

Code execution sandbox:

- 🛡️ **Judge0 CE** hosted API for secure code sandboxing
- 🔄 **Self-hosted Judge0** option for production scaling
- ⚙️ **10+ Languages Supported**: Python, JavaScript, Java, C++, Go, Rust, etc.
- 📊 **Performance Monitoring**: CPU time and memory tracking
- 🔧 **Batch Execution**: Multiple code submissions in parallel

AI and hints:

- 🧠 **MVP**: Rule-based feedback with stored hint levels
- 🚀 **Advanced**: Retrieval + prompt templates with LLM integration
- 🛡️ **Guardrails** and provenance tracking

Deployment:

- 🌐 **Frontend**: Netlify / Vercel
- ☁️ **Backend**: Render / Fly.io / Cloud Run
- 🗂️ **Database**: MongoDB Atlas
- 📦 **Storage**: S3-compatible object store
- 💳 **Payments**: Razorpay (India) for premium features

---

## Architecture overview

Run flow:

1. User writes code in Monaco
2. Frontend sends code + input + language to backend
3. Backend calls Judge0/Piston
4. Backend returns results: stdout/stderr, status, testcase summary

Trace flow (evolves over time):

- Trace v0 (MVP): backend instruments code to capture per-line frames
  - example shape: `[{ line, locals }, ...]`
- Trace v1+: add call stack, function frames, generator/coroutine state, and “what-if” replay

Privacy rule:

- Trace sessions are stored locally by default (IndexedDB)
- Upload only happens via explicit opt-in (analytics / peer comparison)

---

## Modules

Auth and dashboard:

- ✅ Modern login/signup with JWT
- 🎯 Career track selection (Backend/Data/ML/Automation)
- 📊 Interactive dashboard with real-time progress
- 🎨 Enhanced UI with animations and micro-interactions

Problem bank:

- Problems with tags, difficulty, constraints
- Visible and hidden testcases
- Submission history

Editor and runner (must-have):

- Monaco editor with run and input panels
- Output + error panel
- Testcase runner and summary view

Trace player (core USP):

- Step controls: next/prev, play/pause, slider
- Current line highlight
- Locals/variables panel
- Later: stack frames and heap view

AI mentor (scaffolded hints):

- Hint level 1: nudge
- Hint level 2: approach/pseudocode
- Hint level 3 (later): guided tests / interactive checks
- Explainability logs (show hint provenance)

Role composer and roadmaps:

- Weekly plans per role
- Personalized study plan generator
- Counterfactual simulator (hours/week → ETA)

Concept explorer:

- Concept pages (misconceptions + real-world usage)
- Micro-simulations (tiny code + trace)

Capstone and deploy:

- Capstone templates / scaffolds
- One-click deploy guidance/buttons
- Recruiter PDF export (skills + projects + proof)

Analytics and confusion heatmap:

- 🔥 Confusion heatmap tracking
- 🎯 Recovery micro-sprints
- 📊 Advanced KPI analytics with interactive charts
- 📤 Multi-format export capabilities

Company playbooks and mock OA:

- Company-flavored timed mocks
- Basic anti-cheat signals (time, focus changes, etc.)

Freemium and payments:

- Feature gating (free vs premium)
- Razorpay checkout and subscription tracking

---

## Minimal database schema (starter)

MongoDB collections (starter shape, can evolve):

- users
  - `_id, name, email, hashed_pwd, role_track, progress, preferences`
- questions
  - `_id, title, difficulty, tags, statement, constraints`
- testcases
  - `_id, question_id, input, expected, hidden`
- hints
  - `_id, question_id, level, content, hint_type`
- sessions
  - `_id, user_id, question_id, trace_ref, created_at, opt_in`
- roadmaps
  - `_id, role, weeks[], activities[]`

---

## 8-week roadmap (phased)

Week 1 (foundation):

- Auth and dashboard
- Problems list
- Editor UI skeleton

Week 2 (execution):

- Judge0 integration (run + testcases)
- Submission result UI

Week 3 (trace v0, priority):

- Line-by-line frames + locals snapshot
- Trace UI controls

Week 4 (hints v0 + concept seed):

- 2-level scaffolded hints
- 10 core concept/misconception pages

Week 5 (roadmaps v0 + capstone scaffold):

- One sample roadmap
- Capstone templates (backend/data/automation)

Week 6 (deploy + recruiter PDF):

- Capstone deploy flow
- Recruiter-ready PDF export (links + proofs)

Week 7 (analytics v0):

- Confusion heatmap
- Recovery micro-sprints

Week 8 (company playbooks + polish):

- Timed mocks
- UX polish + demo video + final packaging

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account
- Judge0 API key (optional for local development)

### **Installation**

#### **Frontend**
```bash
cd frontend
npm install
npm run dev
```

#### **Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### **Environment Variables**
```bash
# Backend (.env)
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=pymastery
JWT_SECRET=your_jwt_secret
JUDGE0_API_KEY=your_rapidapi_key
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com/submissions
JUDGE0_HOST=judge0-ce.p.rapidapi.com
REDIS_URL=your_redis_url

# Frontend (.env)
VITE_API_URL=http://localhost:8000
VITE_MONGODB_URI=your_mongodb_uri
```

#### **🗄️ MongoDB Setup (Required)**
1. **Install MongoDB**: Local, Atlas, or Docker
2. **Configure Connection**: Set `MONGODB_URL` in `.env`
3. **Initialize Database**: Auto-migrates on startup
4. **Verify Connection**: Check `/api/health` endpoint

📖 **Detailed Setup**: See [MONGODB_SETUP.md](./MONGODB_SETUP.md)

#### **🔥 Judge0 Setup (Required for Code Execution)**
1. **Get RapidAPI Key**: Sign up at [RapidAPI](https://rapidapi.com/hub)
2. **Subscribe to Judge0 CE**: Free tier (100 requests/day)
3. **Configure Environment**: Add `JUDGE0_API_KEY` to `.env`
4. **Test Integration**: Run code in the Code Editor component

📖 **Detailed Setup**: See [JUDGE0_SETUP.md](./JUDGE0_SETUP.md)

#### **🔐 Authentication Setup (Required)**
1. **Configure Email**: Set up SMTP for email verification
2. **Environment Variables**: Add JWT and email settings
3. **Test Registration**: Verify email verification flow
4. **Security Check**: Test password reset functionality

📖 **Detailed Setup**: See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)

## 🎬 **90-Second Demo Script**

1. **🔐 Login & Track Selection**
   - Modern login interface with animations
   - Choose Backend/Data/ML/Automation track
   - Interactive dashboard overview

2. **💻 Problem Solving**
   - Open a problem with modern UI
   - Write 8–10 lines in Monaco editor
   - Click Run with visual feedback

3. **📊 Results & Analysis**
   - Show testcase results + stdout
   - Interactive analytics dashboard
   - Performance metrics visualization

4. **🎮 Trace Player**
   - Open trace player with smooth animations
   - Step through variables with visual feedback
   - Interactive execution timeline

5. **🤖 AI Assistant**
   - Request a hint with voice input
   - Show scaffolded guidance (no full solution)
   - Rich chat interface with animations

6. **🚀 Capstone Deployment**
   - Show deployed capstone link
   - Generate recruiter PDF
   - Export analytics data

---

## 📦 **Deliverables**

### **✅ Completed**
- 🎨 **World-Class UI** with modern animations
- 📱 **Mobile-Responsive Design** optimized for all devices
- 🤖 **AI Learning Assistant** with voice support
- 📊 **Advanced Analytics** with interactive charts
- 🏗️ **Agile Development Tools** with real-time collaboration
- 🪟 **Enhanced Modal System** with drag & drop

### **🎯 MVP Features**
- 📝 Deployed demo: Editor → Run → Trace → Hint
- 🚀 One deployed capstone project with public URL
- 📄 Recruiter PDF export
- 🗂️ GitHub repo with clean commits and setup instructions
- 🎥 90-second demo video

---

## Risks and mitigations

Infinite loops / unsafe code:

- Enforce sandbox timeouts and memory limits
- Add rate limiting (later with Redis)

Privacy concerns:

- Default local trace storage
- Explicit opt-in for any uploads

Scope explosion:

- Keep MVP tight
- Add advanced modules only after the core loop is stable

---

## 📁 **Repository Structure**

```bash
PyMastery/
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/       # Enhanced UI components
│   │   │   ├── ModernDashboard.tsx
│   │   │   ├── AILearningAssistant.tsx
│   │   │   ├── KPIAnalytics.tsx
│   │   │   ├── AgileDevelopment.tsx
│   │   │   └── EnhancedModal.tsx
│   │   ├── pages/           # Route components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # FastAPI + MongoDB
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── models/         # Database models
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── tests/              # Test suite
│   └── requirements.txt
├── docs/                   # Documentation
│   ├── api/               # API specs
│   ├── architecture/     # Architecture docs
│   └── deployment/       # Deployment guides
├── scripts/              # Automation scripts
├── docker-compose.yml    # Development environment
└── README.md            # This file
```

---

## Phase 1 kickoff checklist

Define and lock:

- API endpoints: `/auth`, `/questions`, `/run`, `/trace`, `/hint`
- Starter problem set (10–20 problems)
- Trace v0 frame format (`frames[]`) + playback UI controls
- Hint levels for the starter problems

If you’re a beginner, that’s fine—this plan is designed so you learn while building, without getting stuck in “too much tech at once.”

---

## 🎯 **Next Steps**

### **Immediate Actions**
1. **Install Dependencies**: `npm install framer-motion lucide-react`
2. **Test Enhanced UI**: Verify all animations and interactions
3. **Deploy to Production**: Update production build
4. **Monitor Performance**: Track user engagement and metrics

### **Future Enhancements**
- 🌐 **Multi-language Support**: Expand beyond Python
- 🎮 **Gamification**: Points, badges, and leaderboards
- 🤝 **Team Features**: Collaborative coding sessions
- 📚 **Content Library**: More problems and concepts
- 🔗 **Integrations**: GitHub, LinkedIn, and recruiter platforms

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Style**
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Black + isort for Python
- **Commits**: Conventional commit messages
- **Documentation**: Markdown with consistent formatting

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Judge0** for providing secure code execution
- **Monaco Editor** for the excellent code editing experience
- **Framer Motion** for smooth animations
- **Lucide** for beautiful icons
- **FastAPI** for the high-performance backend framework

---

## 📞 **Contact**

- **Project Lead**: [Your Name]
- **Email**: [your.email@example.com]
- **Website**: [https://pymastery.com](https://pymastery.com)
- **Discord**: [Join our community]

---

<div align="center">

**🚀 PyMastery - Transform Your Python Journey Today!**

[![Website](https://img.shields.io/badge/Website-Live-green?style=for-the-badge)](https://pymastery.com)
[![GitHub](https://img.shields.io/badge/Github-Repository-blue?style=for-the-badge&logo=github)](https://github.com/yourusername/pymastery)
[![Discord](https://img.shields.io/badge/Discord-Community-purple?style=for-the-badge&logo=discord)](https://discord.gg/pymastery)

**Built with ❤️ for the Python Community**

</div>
