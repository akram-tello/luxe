# MASTER AGENT PROMPT — LUXE SWISS WATCH CRM

## APPLICATION DESCRIPTION

A **premium clienteling CRM web application** designed for luxury Swiss watch boutiques.
The system is built to support high-touch sales environments where relationships, timing, and precision directly impact revenue.

Core purpose:

* manage high-value clients
* enforce disciplined follow-ups
* track full client lifecycle
* attribute revenue accurately to associates

The application replaces fragmented tools (spreadsheets, WhatsApp memory, manual notes) with a **single source of truth** for all client interactions.

Primary users:

* **Managers**: oversight, performance tracking, distribution control
* **Associates**: daily execution, follow-ups, client engagement

The system must feel:

* premium (luxury-grade UI)
* fast (low friction workflows)
* strict (no data gaps allowed)

## ROLE

Act as a senior Full-Stack Architect operating inside a production codebase. Priorities:

* correctness over speed
* enforceable business logic over convenience
* system consistency over shortcuts

Do not produce speculative or placeholder implementations.

---

## SYSTEM OBJECTIVE

Build a **Clienteling CRM** for a luxury Swiss watch boutique that enforces:

* strict lead ownership
* zero missed follow-ups
* complete activity traceability
* accurate revenue attribution per associate

System must function under real operational pressure (sales floor usage).

---

## NON-NEGOTIABLE RULES

### 1. DATA DISCIPLINE

* No client without assigned associate
* No pipeline stage without valid value
* No activity without client + associate linkage
* No silent updates (everything logged)

### 2. AUDITABILITY

* All mutations must generate audit logs
* Logs must include:

  * actor (user_id)
  * before/after state
  * timestamp

### 3. ACCESS CONTROL

* Associate → access only assigned clients
* Manager → full access
* Enforcement must be backend-level

### 4. SOFT DELETE STANDARD

* All entities use `deleted_at`
* Never hard delete business data

---

## ARCHITECTURE

### Pattern

* Monolith (Next.js App Router)
* Clear separation:

  * UI (app/)
  * domain modules (modules/)
  * backend logic (server/)
  * persistence (prisma/)

### Required Structure

```
/app
  /(auth)
  /(dashboard)
    /manager
    /associate

/modules
  /clients
  /tasks
  /pipeline
  /templates
  /reports

/server
  /services
  /repositories
  /jobs

/lib
  /db
  /auth
  /validators
  /utils

/prisma
```


---

## DATABASE (STRICT: MYSQL)

* Database engine: **MySQL**
* ORM: Prisma

### Requirements

* All relations enforced via foreign keys
* Use proper indexing
* Use `DATETIME` for timestamps
* Use `JSON` where flexibility is required (wishlist, collection)

### Mandatory Tables

* users
* clients
* activities
* sales
* pipeline_states
* templates
* audit_logs
* notifications

### Indexing (minimum)

* clients(name, phone)
* activities(due_date, status)
* pipeline_states(stage)
* sales(associate_id, purchase_date)

---

## CORE DOMAIN LOGIC

### CLIENT OWNERSHIP

* must be assigned at creation
* cannot be null
* reassignment logged in audit_logs

---

### PIPELINE

Stages:

```
PROSPECT → CONTACTED → ENGAGED → APPOINTMENT → NEGOTIATION → WON / LOST
```

Rules:

* no stage skipping (except manager)
* stage change requires note
* auto-create follow-up task

---

## TASK SYSTEM

Types:

* MESSAGE
* CALL
* APPOINTMENT
* FOLLOW_UP
* SERVICE

Rules:

* every task must have due_date
* overdue = due_date < now AND status != completed
* completion must set completed_at

---

## AUTOMATION ENGINE

Implemented via background jobs.

### Required Jobs

#### SLA BREACH

* condition: no activity within 24h of client creation
* action:

  * create HIGH priority task
  * notify manager

#### STAGNATION

* detect inactivity per pipeline stage
* auto-create follow-up

#### ANNIVERSARY

* yearly trigger → follow-up

#### SERVICE

* purchase_date + 5 years → service task

#### DORMANT CLIENT

* no activity > 30 days → re-engagement task

---

## MESSAGING ENGINE

### Template Variables

```
{{client_name}}
{{associate_name}}
{{store_name}}
{{wishlist_item}}
```

### Flow

1. select template
2. inject variables
3. preview message
4. generate WhatsApp deep link:

```
https://wa.me/<phone>?text=<encoded>
```

### Constraint

* system does NOT send messages
* only prepares message
* log as activity

---

## PERFORMANCE REQUIREMENTS

* support ≥10,000 clients
* server-side pagination required
* indexed search only
* avoid full table scans

---

## UI/UX RULES

### Design

* minimal
* high contrast
* typography-first

### Interaction

* ≤ 2 clicks for critical actions
* inline editing preferred

### Priority Handling

* overdue tasks must be visually dominant
* VIP clients clearly marked

---

## API STANDARDS

* consistent design (REST or RPC)
* all endpoints:

  * authenticated
  * role-validated
  * input validated (Zod)

---

## ERROR HANDLING

* no silent failures
* structured errors
* safe user-facing messages

---

## SECURITY

* validate all inputs
* enforce authorization server-side
* rate limit sensitive routes
* never expose sensitive data

---

## DEVELOPMENT WORKFLOW

Before coding:

* read README.md
* read package.json
* read AGENT.md

During coding:

* follow existing patterns strictly
* no unnecessary abstractions

After coding:

* build must pass
* types must pass
* no lint errors
* logic must be verified

---

## MVP PRIORITY

1. Authentication + roles
2. Client CRUD + assignment
3. Task system
4. Pipeline
5. Basic dashboards

Do not implement advanced features before MVP stability.

---

## EXTENSION RULES

* integrate into existing modules
* avoid duplication
* maintain auditability
* maintain performance guarantees

---

## FAILURE CONDITIONS

System is invalid if:

* clients exist without owners
* activities are missing
* pipeline rules are bypassable
* metrics do not match data

---

## SUMMARY

This system is a **strict, high-discipline CRM** designed for luxury retail operations.

It enforces:

* complete ownership of every client
* mandatory tracking of every interaction
* structured pipeline progression
* automated follow-up generation
* accurate, data-driven performance measurement

The implementation must prioritize:

* data integrity
* auditability
* performance at scale
* operational usability for daily sales workflows

No compromises on structure or correctness.