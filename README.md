# Book_N_Appointment

### WhatsApp Appointment Reminder System
> Built as a practical test.

**Live Link:** [Book N Appoint](https://book-n-appointment.onrender.com)

---

## What It Is

Book N Appoint is a full-stack appointment booking system that allows customers to schedule appointments through a web form and instantly receive a WhatsApp confirmation message. Admins can monitor all bookings through a password-protected live dashboard. An automated background job sends reminder messages one hour before each appointment.

This was built to demonstrate real-world automation skills: API integration, database management, scheduled jobs, and clean frontend design.

---

## Folder Structure

```
Book_N_Appointment/
├── public/
│   ├── index.html        # Customer booking form + success screen
│   └── admin.html        # Admin login + live dashboard
├── .env                  # Secret credentials (not in repo)
├── .gitignore            # Excludes .env and node_modules
├── package.json          # Project dependencies
├── server.js             # Express backend, API routes, cron job
└── README.md
```

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Runtime | Node.js v24 (portable) |
| Backend | Express.js |
| Database | Supabase (PostgreSQL) |
| Messaging | Twilio WhatsApp Sandbox |
| Scheduler | node-cron |
| Frontend | HTML + Vanilla JS |
| Hosting | Render (backend + frontend) |

---

## What It Does

### Customer Side (`/`)
- Customer fills in: Full Name, WhatsApp Number, Appointment Date & Time
- On submit: appointment is saved to Supabase database
- Twilio immediately sends a WhatsApp confirmation to the customer's number
- Success screen shows appointment summary with confirmed details

**WhatsApp Confirmation Message:**
```
Hello Rahul Sharma,
Your appointment has been confirmed at 12:00 am on Sunday, 7 June 2026.
For queries, contact: support@booknnappoint.com
— Book N Appoint
```

### Admin Side (`/admin.html`)
- Password-protected login (key stored in `.env`, never in code)
- Live dashboard showing all appointments
- Stats: Total appointments, Today's count, Reminders sent
- Table: Name, Phone, Appointment Time, Booked At, Reminder Status
- Auto-refreshes every 10 seconds without page reload

### Automatic Reminder
- Background cron job runs every 60 seconds
- Checks for appointments within the next 1 hour where reminder has not been sent
- Sends WhatsApp reminder automatically
- Marks `reminder_sent = true` in database to prevent duplicates

**WhatsApp Reminder Message:**
```
Hello Rahul Sharma,
Reminder: Your appointment is coming up at 12:00 am today!
For queries, contact: support@booknnappoint.com
— Book N Appoint
```

---

## Data Flow

```
[Customer fills form]
        |
        v
[POST /api/appointments]
        |
        +---> Save to Supabase (appointments table)
        |
        +---> Twilio API --> WhatsApp confirmation to customer
        |
        v
[Success screen shown to customer]

[node-cron — every 60 seconds]
        |
        v
[Query Supabase: appointment_time between NOW and NOW+1hr, reminder_sent = false]
        |
        +---> Twilio API --> WhatsApp reminder to customer
        |
        +---> Update reminder_sent = true in Supabase

[Admin opens /admin.html]
        |
        v
[Password prompt --> GET /api/appointments with x-admin-key header]
        |
        v
[Supabase returns all appointments --> rendered in live table]
```

---

## Database Schema

```sql
create table appointments (
  id uuid default gen_random_uuid() primary key,
  customer_name text,
  phone text,
  appointment_time timestamptz,
  reminder_sent boolean default false,
  created_at timestamptz default now()
);
```

---

## How to Run Locally

### 1. Prerequisites
- Node.js (portable or installed)
- Supabase account (free) — supabase.com
- Twilio account (free trial) — twilio.com

### 2. Clone the repo
```bash
git clone https://github.com/KapX09/Book_N_Appointment.git
cd Book_N_Appointment
```

### 3. Install dependencies
```bash
npm install
```

### 4. Create `.env` file in root
```
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE=whatsapp:+14155238886
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_KEY=your_admin_password
```

### 5. Set up Supabase table
Go to Supabase → SQL Editor → run:
```sql
create table appointments (
  id uuid default gen_random_uuid() primary key,
  customer_name text,
  phone text,
  appointment_time timestamptz,
  reminder_sent boolean default false,
  created_at timestamptz default now()
);
```

### 6. Join Twilio WhatsApp Sandbox
- Twilio Console → Messaging → Try it out → Send a WhatsApp message
- Send the join code from your WhatsApp to `+14155238886`

### 7. Run the server
```bash
node server.js
```

### 8. Open in browser
- Customer form: `http://localhost:3000`
- Admin dashboard: `http://localhost:3000/admin.html`

---

## Managing the System

| Task | How |
|------|-----|
| View all appointments | Login at `/admin.html` |
| Change admin password | Update `ADMIN_KEY` in `.env`, restart server |
| Check reminder logs | Watch CMD terminal for cron output |
| Add new sandbox numbers | Twilio Console → WhatsApp Sandbox settings |
| View raw database | Supabase → Table Editor → appointments |

---

## Summary

A system like this applies directly to any business that runs on scheduled appointments like medical clinics, sales teams, service centers, field operations. It can be extended to support multiple agents, two-way customer replies, cancellation handling, and CRM integration. The foundation is in place; scaling it is a matter of configuration, not rebuilding.

---
