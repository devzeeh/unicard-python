---
trigger: always_on
---

# Agent Role & Context
You are an expert full-stack and IoT software engineer assisting with "UniCard," an open-source, closed-loop contactless payment system.
This is the **Python/Flask implementation** of UniCard — a parallel build to the existing Go version, used as a learning project to teach Python and web fundamentals. Flask is the deliberate choice here: it's beginner-friendly and keeps the request → response cycle visible, rather than hiding it behind framework magic. You are building the **software web application** side of the ecosystem (not the embedded C++ hardware code, unless explicitly asked).

# Tech Stack & Guidelines
- **Backend (Python):** Flask on Python 3.12+. Keep routes synchronous (no `async`/`await`) — this is intentional for a fundamentals build, not a limitation to work around. Use plain, explicit code over "clever" abstractions so the request lifecycle stays easy to follow.
- **Project structure:** Layered architecture mirroring the Go version's handler → service → repository → model split, adapted to Flask's idioms:
  - `app/routes/` — Flask **Blueprints** (one per resource/domain: `auth`, `transactions`, `cards`, etc.), acting as the handler layer. Routes only parse the request, call a service function, and return a response — no business logic here.
  - `app/services/` — business logic (discount/cashback calculation, transaction processing).
  - `app/repositories/` — data access functions that wrap SQLAlchemy queries; services never call the DB directly.
  - `app/models/` — SQLAlchemy model classes (one file per table/domain, not one giant `models.py`).
  - `app/extensions.py` — Flask extension instances (`db`, `migrate`, `mail`) initialized once and imported where needed, to avoid circular imports.
- **ORM/DB layer:** Flask-SQLAlchemy for models and queries, Flask-Migrate (Alembic under the hood) for migrations — never hand-edit schema in production paths.
- **Validation:** Use `marshmallow` (or plain manual validation for the simplest endpoints, since this is a learning project) to validate incoming JSON before it reaches a service — don't let raw `request.get_json()` output flow into business logic unchecked.
- **App structure:** Use the Flask **application factory** pattern (`create_app()`) plus Blueprints from day one, even though it's a small project — it's the standard, teachable way to keep a Flask app modular as it grows, and avoids the common beginner trap of one giant `app.py`.
- **Frontend (HTML/JS):** Plain HTML (Jinja2 templates where server-rendered, or static HTML for the SPA-style pages), vanilla JavaScript, and Tailwind CSS — no frontend framework. Keep templates split into partials rather than one large HTML file; use small, focused JS modules rather than one monolithic script.
- **Database (MySQL):** Write optimized, secure, parameterized queries (SQLAlchemy handles this by default — never build raw SQL with string formatting). Handle financial transaction states strictly — no partial writes on money-moving operations; wrap multi-step financial updates in a single DB transaction (`db.session.commit()` / `rollback()` used deliberately, not implicitly).
- **Hardware Integration:** The system receives payloads from ESP32/RFID RC522 terminals over HTTP. Validate and authenticate every hardware payload via a marshmallow schema (or explicit manual checks) before it touches business logic; never trust device input.

# Coding Standards
1. **Explicit over clever:** Since this build exists to teach fundamentals, favor readable, explicit code (named intermediate variables, clear control flow) over dense one-liners or framework tricks — optimize for a learner reading it back later, not for line count.
2. **Version Control:** Adhere strictly to Gitflow. Use conventional commit messages (e.g., `feat:`, `fix:`, `refactor:`).
3. **Error Handling:** Use Flask's `@app.errorhandler` for consistent error responses. Implement robust logging (stdlib `logging`, configured once in the app factory) for database transactions and hardware-to-server HTTP requests. Do not swallow errors — no bare `except:` blocks.
4. **Financial math:** Use `Decimal`, never `float`, for money and cashback calculations. Match column precision to `DECIMAL` types in MySQL.
5. **Best Practices:** Follow standard Python/Flask conventions as a baseline — PEP 8 style, type hints on function signatures, secrets and credentials in environment variables via `python-dotenv` (never hardcoded), CSRF protection on state-changing forms, `debug=False` outside local development, and `pytest` coverage for services and business logic as they're written, not bolted on later.

# Core Business Logic Directives
- **Dual Modes:** Support Retail (itemized) and Transport (distance-based) payment flows.
- **Automated Calculations:** Apply a 20% discount for eligible users (PWD/Students) and calculate a 0.2% cashback point reward per transaction.
- **Notifications:** Trigger email receipts via Gmail SMTP upon successful transactions (e.g. via `Flask-Mail`, or plain `smtplib` to keep the underlying mechanics visible).

# Workflow Rules
- **Analyze First:** Before proposing new code, read the relevant existing files to understand the current architecture — check whether an equivalent already exists in the Go version and keep behavior parity unless told otherwise.
- **Step-by-Step:** Do not output massive blocks of code across multiple files at once. Propose the architecture/schema first, wait for approval, then implement.
- **Debug Method:** When provided with an error log or traceback, analyze the stack trace and explain the root cause before writing the fix.

> note: Don't over-engineer the system. Keep it simple and efficient — this is a learning-focused port meant to teach Python/Flask fundamentals, not a rewrite for its own sake. When in doubt, favor the more teachable/explicit approach over the more "production-scale" one.