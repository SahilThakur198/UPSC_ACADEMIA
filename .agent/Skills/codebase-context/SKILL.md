---
name: codebase-context
description: >
  Maintain a living AI-readable "brain" for any codebase. Use this skill whenever the user:
  - Starts working on an existing project and wants Claude to understand it
  - Adds new features, modules, or functions and wants the project context updated
  - Asks Claude to "remember" how a project is structured before making changes
  - Wants Claude to suggest how to structure or organize new code properly
  - Says things like "understand my code", "here's my project", "keep track of my codebase",
    "update the context", "what's the architecture", "how should I add this feature"
  - Asks about data flow, module dependencies, or how parts connect
  This skill keeps a CODEBASE_CONTEXT.md file in the project root that acts as Claude's
  long-term memory about the project. Always use this skill before making significant changes.
---

# Codebase Context Skill

You are the **architect's eye** — your job is to understand, track, and maintain a living knowledge map of a codebase. This context file is Claude's memory: it survives across sessions and keeps AI responses accurate and architecturally consistent.

---

## 🎯 What This Skill Does

1. **Scans** the project structure to understand what exists
2. **Analyzes** architecture, data flow, module relationships, and patterns
3. **Creates or updates** a `CODEBASE_CONTEXT.md` at the project root
4. **Guides** Claude to make structurally sound decisions when adding/changing code

---

## 📋 Workflow

### Step 1 — Locate the Project

```bash
# Find the project root (look for package.json, requirements.txt, go.mod, Cargo.toml, etc.)
ls -la
find . -maxdepth 2 -name "package.json" -o -name "requirements.txt" -o -name "go.mod" -o -name "*.csproj" 2>/dev/null | head -10
```

### Step 2 — Scan Structure

```bash
# Get full directory tree (exclude node_modules, .git, __pycache__, dist, build)
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/__pycache__/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/.next/*" \
  -not -path "*/venv/*" \
  | sort | head -200

# Count files by type
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -20
```

### Step 3 — Deep Analyze Key Files

Read these files to understand the project deeply:
- **Entry points**: `main.py`, `index.js`, `app.py`, `server.js`, `main.go`, `Program.cs`, etc.
- **Config files**: `package.json`, `requirements.txt`, `pyproject.toml`, `.env.example`, `config.py`
- **Core modules**: The most-imported files, utility layers, shared types/interfaces
- **README.md** if it exists
- **Any existing `CODEBASE_CONTEXT.md`** — read this first if it exists to do a delta update

For each key file, ask:
- What does this module **export/expose**?
- What does it **import/depend on**?
- What is its **single responsibility**?

### Step 4 — Build the Context Map

Identify:
- **Project Purpose**: 1-2 sentences on what this does
- **Tech Stack**: Languages, frameworks, major libraries
- **Architecture Pattern**: MVC, microservices, monolith, event-driven, layered, etc.
- **Module Map**: Each folder/file and what it's responsible for
- **Data Flow**: How data enters, transforms, and exits the system
- **Key Functions/Classes**: The important ones, their signatures, and roles
- **External Dependencies**: APIs, databases, services this talks to
- **Patterns Used**: Common conventions in this codebase (naming, error handling, etc.)
- **Known TODOs / Tech Debt**: Any FIXMEs, TODOs, or noted issues
- **Recent Changes**: What was just added/modified (fill this in during update mode)

### Step 5 — Write or Update CODEBASE_CONTEXT.md

**If creating fresh**: Write the full document (see template below).

**If updating** (file already exists):
1. Read the existing file first
2. Identify what has CHANGED — new files, modified functions, new dependencies
3. Do a targeted update: only touch the sections that changed
4. Append to the **Changelog** section with today's date and what changed
5. Never delete history from the Changelog

---

## 📄 CODEBASE_CONTEXT.md Template

```markdown
# 🧠 Codebase Context
> Auto-maintained by Claude. Last updated: {DATE}

---

## 🎯 Project Purpose
{1-3 sentence description of what this project does and why it exists}

**Status**: {Active development / Maintenance / Production / Prototype}

---

## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Language | {e.g., Python 3.11, TypeScript 5.x} |
| Framework | {e.g., FastAPI, React, Express} |
| Database | {e.g., PostgreSQL, SQLite, Redis} |
| Infra/Deploy | {e.g., Docker, AWS Lambda, Vercel} |
| Key Libraries | {List the important ones} |

---

## 🏗 Architecture
**Pattern**: {MVC / Layered / Event-Driven / Microservice / etc.}

```
{ASCII diagram of the high-level architecture}
Example:
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Client    │────▶│   API Layer │────▶│  DB / Cache  │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                    ┌──────▼──────┐
                    │  Services   │
                    └─────────────┘
```

---

## 📁 Module Map
> Every folder/file and its single responsibility

```
project-root/
├── {file/folder}        # {what it does — one line}
├── {file/folder}        # {what it does — one line}
│   ├── {sub}            # {what it does}
│   └── {sub}            # {what it does}
└── ...
```

**Critical Modules** (touch with care):
- `{path}` — {why it's critical}

---

## 🔄 Data Flow

### Primary Flow
```
{INPUT SOURCE}
    ↓ {transformation step}
{COMPONENT A}
    ↓ {transformation step}
{COMPONENT B}
    ↓ {transformation step}
{OUTPUT / STORAGE}
```

### Secondary Flows (if any)
{Describe background jobs, webhooks, scheduled tasks, etc.}

---

## ⚙️ Key Functions & Classes

| Name | Location | Purpose | Called By |
|------|----------|---------|-----------|
| `{FunctionName}` | `{file}:{line}` | {what it does} | {callers} |
| `{ClassName}` | `{file}` | {what it manages} | {users} |

---

## 🔌 External Integrations

| Service | How It's Used | Auth Method | Config Key |
|---------|--------------|-------------|------------|
| {e.g., Stripe} | {payment processing} | {API Key} | `STRIPE_KEY` |

---

## 🧩 Conventions & Patterns
> The unwritten rules of this codebase

- **Naming**: {e.g., snake_case for Python, camelCase for JS vars}
- **Error Handling**: {e.g., all errors return `{error, data}` tuple}
- **State Management**: {e.g., Redux, Zustand, context-only}
- **API Responses**: {e.g., always `{success, data, message}` shape}
- **File Organization**: {e.g., feature-based, layer-based}
- **Testing**: {e.g., pytest with fixtures in /tests/conftest.py}

---

## ⚠️ Known Issues & Tech Debt
{List any FIXMEs, TODOs, or architectural concerns found in the code}

- [ ] {issue}
- [ ] {issue}

---

## 📐 Structural Guidelines
> Rules for adding new code to this project

When adding a **new feature**:
1. {Step tailored to this project's architecture}
2. {Step tailored to this project's architecture}

When adding a **new module/file**:
1. Place it in `{correct folder}` if it handles `{type of logic}`
2. {Rule about imports, exports, naming}

When touching **{critical module}**:
- {Warning or requirement}

---

## 📜 Changelog
> Updated automatically when code changes

| Date | Change | Affected Modules |
|------|--------|-----------------|
| {DATE} | Initial context created | All |
```

---

## 🧭 Using Context to Guide Code Structure

When the user asks you to add something new, **before writing any code**:

1. Read `CODEBASE_CONTEXT.md` to understand where the new code belongs
2. Check the **Conventions** section to match the project's style
3. Check **Module Map** to avoid duplication
4. Follow the **Structural Guidelines** for the right placement
5. After writing the code, **update CODEBASE_CONTEXT.md** with:
   - New module added to Module Map
   - New function in Key Functions table
   - New dependency if any external service added
   - Changelog entry with today's date

---

## 🔄 Update Triggers

This context file should be updated when:
- ✅ New file/module created
- ✅ New function added that other modules will call
- ✅ New external API or service integrated
- ✅ Architecture pattern changes
- ✅ New environment variables added
- ✅ A bug in the architecture is discovered and fixed
- ✅ A significant refactor happens

**Micro-changes** (single bug fix, small UI tweak) → only update Changelog, skip the rest.

---

## 💡 Tips for Quality Context

- **Be specific with line numbers** for key functions — it ages, but is useful
- **One-line descriptions** per module — force clarity
- **The Data Flow section** is the most valuable — maintain it carefully
- **Structural Guidelines** should reflect the actual patterns found, not ideal patterns
- **Don't over-document** — keep this lean and useful, not exhaustive
