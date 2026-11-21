# Unicard — Python Backend Folder Structure

## 1. Project Overview

Unicard is a closed-loop contactless payment platform for transportation and retail merchants. Customers use an RFID card linked to a Unicard account or wallet. An ESP32-based payment terminal reads the card through an RFID reader and sends a transaction request to the backend for validation and processing.

This Python implementation follows a domain-oriented, clean layered architecture. Each business domain owns its API routes, request/response schemas, validation, service logic, and repository operations. Shared infrastructure—such as database configuration, authentication dependencies, security utilities, and integrations—stays outside the domain modules.

The backend is responsible for:

- Authenticating administrators, merchants, merchant staff, and other authorized users.
- Accepting merchant applications and allowing administrators to approve or reject them.
- Managing cardholders and the RFID cards assigned to them.
- Registering and authenticating payment terminals.
- Processing transportation and retail transactions.
- Maintaining wallet balances and transaction ledger records.
- Applying configured fare rules, fees, discounts, and loyalty rules.
- Recording important administrative and financial actions for audit purposes.

### Technology Stack

| Area | Technology |
|---|---|
| Backend API | Python, FastAPI |
| API validation and serialization | Pydantic |
| ORM | SQLAlchemy 2.x |
| Database | MySQL |
| Database driver | PyMySQL (or another SQLAlchemy-supported MySQL driver selected by the project) |
| Database migrations | Alembic |
| Authentication | JWT or secure session-based authentication; OTP for applicable verification flows |
| Password hashing | Argon2 or bcrypt through a maintained password-hashing library |
| Testing | pytest and FastAPI TestClient/httpx |
| Environment configuration | `.env` with a typed settings module |

The frontend can remain a separate application and communicate with the backend through the versioned REST API. The ESP32 terminals also communicate with the backend through dedicated device endpoints; they do not access the database directly.

---

## 2. Complete Directory Structure

```text
unicard/
├── frontend/                         # Existing web client, if maintained in this repository
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── pages/
│
├── backend/
│   ├── app/
│   │   ├── main.py                   # FastAPI application entry point
│   │   │
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── router.py          # Registers all version 1 domain routers
│   │   │
│   │   ├── core/                     # Application-wide configuration and security
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── logging.py
│   │   │   └── exceptions.py
│   │   │
│   │   ├── database/                 # SQLAlchemy engine, sessions, and base metadata
│   │   │   ├── session.py
│   │   │   └── base.py
│   │   │
│   │   ├── dependencies/             # Shared FastAPI dependencies
│   │   │   ├── database.py
│   │   │   ├── authentication.py
│   │   │   ├── authorization.py
│   │   │   └── terminal_auth.py
│   │   │
│   │   ├── middleware/               # HTTP-level cross-cutting concerns
│   │   │   ├── request_id.py
│   │   │   └── error_handler.py
│   │   │
│   │   ├── common/                   # Small, reusable application primitives
│   │   │   ├── enums.py
│   │   │   ├── pagination.py
│   │   │   ├── responses.py
│   │   │   └── time.py
│   │   │
│   │   ├── modules/                  # Business domains; each module owns its layers
│   │   │   ├── auth/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── validators.py
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── models.py
│   │   │   │   └── validators.py
│   │   │   │
│   │   │   ├── roles/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py
│   │   │   │
│   │   │   ├── merchants/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── models.py
│   │   │   │   └── validators.py
│   │   │   │
│   │   │   ├── merchant_applications/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── models.py
│   │   │   │   └── validators.py
│   │   │   │
│   │   │   ├── cardholders/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── models.py
│   │   │   │   └── validators.py
│   │   │   │
│   │   │   ├── cards/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── models.py
│   │   │   │   └── validators.py
│   │   │   │
│   │   │   ├── terminals/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── models.py
│   │   │   │   └── validators.py
│   │   │   │
│   │   │   ├── wallets/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py
│   │   │   │
│   │   │   ├── transactions/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── models.py
│   │   │   │   └── validators.py
│   │   │   │
│   │   │   ├── fare_rules/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py
│   │   │   │
│   │   │   ├── discounts/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── models.py
│   │   │   │   └── validators.py
│   │   │   │
│   │   │   ├── loyalty/
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── models.py
│   │   │   │
│   │   │   └── audit_logs/
│   │   │       ├── router.py
│   │   │       ├── service.py
│   │   │       ├── repository.py
│   │   │       ├── schemas.py
│   │   │       └── models.py
│   │   │
│   │   ├── integrations/             # External services; keep provider code isolated
│   │   │   ├── email/
│   │   │   │   └── client.py
│   │   │   └── payments/
│   │   │       └── xendit.py          # Include only if/when the integration is enabled
│   │   │
│   │   └── utils/                    # General helpers with no domain business rules
│   │       └── token_utils.py
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── test_auth_service.py
│   │   │   ├── test_transaction_service.py
│   │   │   ├── test_wallet_service.py
│   │   │   └── test_discount_service.py
│   │   ├── integration/
│   │   │   ├── test_auth_routes.py
│   │   │   ├── test_merchant_applications.py
│   │   │   ├── test_terminal_transactions.py
│   │   │   └── test_wallet_ledger.py
│   │   └── conftest.py
│   │
│   ├── alembic/                      # Database migration versions
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── .gitignore
├── README.md
└── FOLDER_STRUCTURE.md
```

The tree is a target structure, not a requirement to create every module immediately. Start with the core payment and onboarding flows, then add domains as their requirements become active.

---

## 3. Domain Responsibilities

| Module | Responsibility |
|---|---|
| `auth/` | Login, logout, token refresh, OTP verification, forgot-password, and password reset. It authenticates identities but does not own every user-management operation. |
| `users/` | User accounts, profile details, account status, and merchant-staff account management. |
| `roles/` | Roles and permissions for administrators, merchants, and merchant staff. Enforces role-based access rules. |
| `merchants/` | Merchant business profiles, business type, status, branches, and merchant settings. |
| `merchant_applications/` | Applicant registration, business-document submission, application review, approval, rejection, and status tracking. |
| `cardholders/` | Customer/cardholder profiles and the relationship between a Unicard account and its assigned cards or wallet. |
| `cards/` | RFID card registration, assignment, activation, blocking, loss reporting, replacement, and card status. Store the card identifier securely and do not treat possession of a card ID alone as proof of user authorization. |
| `terminals/` | ESP32/RFID terminal registration, credentials, merchant or branch assignment, activation, revocation, and device status. |
| `wallets/` | Wallet balances and the wallet ledger for top-ups, payments, refunds, and authorized adjustments. |
| `transactions/` | Transaction authorization and processing for transportation and retail, including duplicate-request protection, status changes, reversals, and refunds. |
| `fare_rules/` | Transportation routes, fare configuration, fare calculation rules, and effective dates. |
| `discounts/` | Discount eligibility and application, including validation of supported student, PWD, and senior discounts. |
| `loyalty/` | Loyalty-point earning, redemption (if enabled), expiration, and point-ledger records. |
| `audit_logs/` | Append-only records of important administrative, account, merchant, card, terminal, and financial actions. |
| `integrations/` | Adapters for external services such as email delivery and payment providers. Provider-specific code must not be mixed into transaction business logic. |

### Shared Application Folders

| Folder/File | Responsibility |
|---|---|
| `api/v1/` | Combines the domain routers under a versioned API prefix, such as `/api/v1`. |
| `core/` | Settings, security primitives, logging configuration, and application-wide exceptions. |
| `database/session.py` | Creates the SQLAlchemy engine and session factory. |
| `database/base.py` | Defines the declarative base and shared model metadata used by Alembic. |
| `dependencies/` | Provides database sessions, authenticated users, permission checks, and terminal authentication to routes. |
| `middleware/` | Handles request IDs and consistent HTTP error handling. Keep business authorization in dependencies/services rather than relying only on middleware. |
| `common/` | Shared enums, pagination types, response helpers, and small cross-domain primitives. Avoid turning this folder into a home for business logic. |
| `tests/` | Unit tests for business rules and integration tests for API/database behavior. |
| `alembic/` | Versioned database migrations. Do not modify production tables manually outside the migration process. |

---

## 4. Layer Responsibilities Within a Domain

Each domain module follows the same general pattern. For example, `transactions/` contains:

```text
transactions/
├── router.py       # HTTP endpoints and status-code mapping
├── service.py      # Transaction use cases and business rules
├── repository.py   # SQLAlchemy queries and persistence
├── schemas.py      # Pydantic request and response schemas
├── models.py       # SQLAlchemy table mappings
└── validators.py   # Domain-specific input validation, when needed
```

### Router — `router.py`

Defines FastAPI endpoints, declares dependencies, validates request/response contracts, and delegates work to the service. It should not contain SQL queries or financial business rules.

### Service — `service.py`

Coordinates the use case and enforces domain rules. For example, the transaction service checks that a terminal is authorized, the card is active, the requested operation is valid, and the wallet has sufficient available funds before posting a payment.

### Repository — `repository.py`

Contains database queries and persistence operations. Repositories should not decide whether a payment is allowed; that decision belongs to the service layer.

### Schemas — `schemas.py`

Defines Pydantic request and response models. Separate input schemas from output schemas so internal fields, credentials, and sensitive data are not accidentally returned by the API.

### Models — `models.py`

Defines SQLAlchemy mappings for the domain's database tables and relationships. Use database constraints and indexes to enforce important invariants where practical.

### Validators — `validators.py`

Contains reusable domain-specific validation that is more involved than basic Pydantic field validation. Do not duplicate the same rule across routers and services.

Not every module needs every file. Add a validator, repository abstraction, or other layer only when there is a real responsibility for it.

---

## 5. Main Request Flows

### A. User Authentication

```text
Web Client
   |
   v
Auth Router
   |
   v
Auth Service
   |
   +----> User Repository
   |
   v
SQLAlchemy Models
   |
   v
MySQL
```

The authentication service verifies credentials, checks the account status, and issues the configured access/refresh credentials. Protected endpoints use authentication and authorization dependencies.

### B. Merchant Onboarding

```text
Merchant Applicant
   |
   v
Auth / Merchant Application Router
   |
   v
Merchant Application Service
   |
   +----> User Repository
   +----> Merchant Application Repository
   |
   v
MySQL
   |
   v
Admin Review
   |
   +----> Approve: create/activate merchant records and permitted accounts
   |
   +----> Reject: record decision and reason
```

An applicant submits business details and required documents. The application remains pending until an authorized administrator reviews it. Approval and rejection decisions must be recorded, including the reviewing user and decision timestamp.

### C. RFID Payment Transaction

```text
RFID Card
   |
   v
ESP32 + RFID Reader
   |
   v
Terminal API Endpoint
   |
   v
Terminal Authentication
   |
   v
Transaction Service
   |
   +----> Validate terminal and merchant/branch assignment
   +----> Validate card and cardholder status
   +----> Check request idempotency / duplicate submission
   +----> Calculate applicable fare, fee, or discount
   +----> Check wallet balance and transaction limits
   |
   v
Database Transaction
   |
   +----> Create transaction record
   +----> Create wallet ledger entry
   +----> Update wallet balance (if a cached balance is maintained)
   +----> Record required audit event
   |
   v
Return Approved / Declined Result to Terminal
```

The transaction record and corresponding wallet ledger entry must be committed atomically. A repeated terminal request with the same idempotency key must not charge the cardholder twice. The terminal must receive a clear result that it can safely handle, including when a request is retried after a network interruption.

### D. Transportation Fare Calculation

```text
Terminal Transaction Request
   |
   v
Transaction Service
   |
   v
Fare Rules Service
   |
   +----> Resolve route / fare configuration
   +----> Apply active discount eligibility
   +----> Calculate final amount
   |
   v
Transaction Service
   |
   v
Wallet Ledger + Transaction Record
```

Fare values, fees, discount rates, and effective dates should be managed as configuration or database records where administrators need to update them. Avoid hardcoding business rates throughout the codebase.

### E. Retail Payment

```text
Merchant Terminal / POS
   |
   v
Terminal API Endpoint
   |
   v
Transaction Service
   |
   +----> Validate merchant and terminal
   +----> Validate card and wallet
   +----> Calculate applicable fee / discount / rewards
   |
   v
Wallet Ledger + Transaction Record
   |
   v
Return Transaction Result
```

The transaction should identify its business context (for example, transportation or retail) and the merchant/terminal responsible for it. Keep the rules for each transaction type explicit instead of scattering `if` statements across unrelated modules.

---

## 6. Go-to-Python Layer Mapping

The Python structure is organized by domain to remain close to Unicard's existing Go module structure.

| Existing Go Concept | Python / FastAPI Equivalent |
|---|---|
| `handler/` | `router.py` in each domain module |
| `service/` | `service.py` in each domain module |
| `repository/` | `repository.py` in each domain module |
| `model/` | `models.py` in each domain module |
| `dto/` | `schemas.py` (Pydantic) |
| `validator/` | `validators.py` and Pydantic field/model validators |
| `route/` | Domain `router.py` plus registration in `api/v1/router.py` |
| Database package | `database/` with SQLAlchemy engine and session factory |
| Dependency injection | FastAPI dependencies and constructor/function parameters |
| Middleware | `middleware/` for HTTP-wide concerns; dependencies for endpoint authorization |
| Configuration | `core/config.py` |

Python does not require a separate interface or abstract class for every service and repository. Use `Protocol` or an abstract base class when multiple implementations, clear boundaries, or test substitution make it useful. Prefer straightforward constructors and explicit dependencies over a custom dependency-injection framework.

---

## 7. Recommended Initial Development Scope

Do not implement every domain at once. Begin with the smallest set that allows a complete and testable payment workflow.

```text
app/
├── main.py
├── api/
│   └── v1/
│       └── router.py
├── core/
│   ├── config.py
│   └── security.py
├── database/
│   ├── session.py
│   └── base.py
├── dependencies/
│   ├── database.py
│   ├── authentication.py
│   └── terminal_auth.py
├── modules/
│   ├── auth/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   └── schemas.py
│   ├── users/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   ├── merchants/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   ├── merchant_applications/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   ├── cardholders/
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   ├── cards/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   ├── terminals/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   ├── wallets/
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── models.py
│   └── transactions/
│       ├── router.py
│       ├── service.py
│       ├── repository.py
│       ├── schemas.py
│       ├── models.py
│       └── validators.py
└── tests/
    ├── unit/
    ├── integration/
    └── conftest.py
```

### Initial implementation sequence

1. Configure FastAPI, application settings, SQLAlchemy, MySQL connection, and Alembic.
2. Create user and role models, then implement login, token handling, and protected routes.
3. Implement merchant applicant registration, OTP verification, application submission, and admin review.
4. Implement merchant and terminal registration, assignment, authentication, and revocation.
5. Implement cardholder creation and RFID card assignment, activation, and blocking.
6. Implement wallet and ledger records, including a safe top-up or administrative credit flow.
7. Implement a terminal transaction endpoint with idempotency, atomic database operations, and clear approval/decline responses.
8. Add transportation fare calculation and retail transaction rules.
9. Add discount, loyalty, refund/reversal, reporting, and external payment-provider integrations as their requirements are finalized.

---

## 8. Architecture and Financial Integrity Principles

1. Keep the frontend, backend API, and ESP32 terminal responsibilities separate. Devices must communicate with the API and must never connect directly to MySQL.
2. Keep HTTP request/response handling in routers.
3. Keep business rules and use-case orchestration in services.
4. Keep database queries and persistence in repositories.
5. Keep SQLAlchemy table mappings separate from Pydantic API schemas.
6. Manage SQLAlchemy sessions and transaction boundaries consistently.
7. Protect administrative and merchant endpoints with authentication and role/permission checks. Use a separate device-authentication mechanism for terminals.
8. Treat merchant application approval as an explicit, auditable state transition.
9. Record every value-changing wallet operation in a ledger. Do not permit arbitrary balance edits that bypass the ledger.
10. Use database transactions to commit a payment, its ledger entry, and related state changes atomically.
11. Use idempotency keys or equivalent unique request identifiers for terminal payment requests to prevent duplicate charges on retries.
12. Use an exact decimal representation for money in Python and an appropriate fixed-precision `DECIMAL` type in MySQL. Do not use binary floating-point values for currency calculations.
13. Store fee, fare, discount, and loyalty configurations centrally with clear effective dates and audit history where changes affect transactions.
14. Keep card, account, and terminal status checks inside the relevant domain services.
15. Keep transaction history and audit records traceable; use explicit reversal/refund records rather than silently rewriting completed financial transactions.
16. Use Alembic for database schema changes.
17. Never commit real credentials, signing keys, database passwords, or terminal secrets to Git.
18. Hash passwords and protect OTPs, reset tokens, and device credentials. Apply expiration and one-time-use rules where appropriate.
19. Return only the fields intended for each API consumer. Do not expose password hashes, secrets, or internal security data in response schemas.
20. Write unit tests for business rules and integration tests for database constraints, authorization, idempotency, and transaction atomicity.
21. Avoid unnecessary abstractions. Add layers and modules when they represent real domain responsibilities.

---

## 9. Example Application Entry Point

The following is a conceptual entry point. The router imports will become valid as the corresponding domain modules are implemented.

```python
from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title="Unicard API",
    version="1.0.0",
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
```

Example local development command, run from the `backend/` directory:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 3000 --reload
```

For access from other devices on the same local network, bind to the appropriate network interface (commonly `0.0.0.0`) and configure the host firewall and network access deliberately. Do not expose development mode or unauthenticated administrative endpoints to an untrusted network.

---

## 10. Goal

Build a maintainable Python implementation of Unicard's backend while preserving the domain boundaries and clean separation already established in the Go project. The backend should provide secure account and merchant onboarding, reliable RFID terminal communication, traceable wallet accounting, and consistent transaction processing for transportation and retail use cases.
