# NestFinder — Rental Management Platform

> A full-stack rental operations platform connecting property owners and tenants through a structured, transparent workflow — from discovery to signed agreement.

🔗 **Live:** [rental-platform-c40l.onrender.com](https://rental-platform-c40l.onrender.com)

---

## Overview

NestFinder is a web-based rental management platform built as a **DBMS microproject**. It demonstrates real-world database design, role-based authentication, and full-stack integration using modern web technologies.

The platform supports three distinct roles — **Owners**, **Tenants**, and **Admins** — each with their own dashboard, workflows, and access controls.

---

## Features

### 🔐 Authentication
- Secure registration and login via Supabase Auth
- Session management with local fallback for legacy accounts
- Role-based dashboard routing after login
- Flash messages for post-redirect feedback

### 🏠 Owner
- Add, edit, and manage rental property listings
- Upload and manage property images
- Review tenant interest requests
- Shortlist, select, or reject applicants
- Confirm rent payments submitted by tenants
- Track monthly income, active agreements, and maintenance requests

### 🔎 Tenant
- Browse and filter available properties by city, budget, and type
- Express interest in properties
- Track application status (Interested → Shortlisted → Selected)
- View and approve rental agreements
- Submit rent payments with month tracking
- Report and track maintenance issues

### 🛡️ Admin
- Full platform oversight — all users, properties, agreements
- View interest pipeline across all owners and tenants
- Monitor active and pending agreements
- Platform-wide KPI metrics

### 🌐 Public
- Browse available listings without an account
- Filter by city and budget
- View property details and owner information

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6 Modules) |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Deployment | Render |

---

## Project Structure

```
rental-platform/
├── frontend/
│   ├── assets/
│   │   ├── css/                  # Global page loader styles
│   │   ├── js/                   # Page loader + link prefetch script
│   │   └── icons/                # Favicon and PWA icons
│   ├── components/
│   │   ├── navbar.js             # Dynamic role-based navbar loader
│   │   └── navbars/
│   │       ├── ownerNavbar.html
│   │       ├── tenantNavbar.html
│   │       └── adminNavbar.html
│   ├── css/
│   │   ├── global.css            # Design tokens, layout, components
│   │   ├── forms.css             # Auth, forms, landing page styles
│   │   └── dashboard.css        # Dashboard layout and KPI cards
│   ├── dashboards/
│   │   ├── owner.html
│   │   ├── tenant.html
│   │   └── admin.html
│   ├── js/
│   │   ├── authGuard.js          # Route protection
│   │   ├── core/
│   │   │   ├── auth.js           # Session management
│   │   │   ├── supabaseClient.js # Supabase client init
│   │   │   └── toast.js          # Toast notifications
│   │   ├── modules/              # Page-specific logic
│   │   ├── services/             # Supabase data access layer
│   │   └── utils/                # Formatters and validators
│   ├── pages/                    # All inner pages
│   └── index.html                # Landing page
├── backend/
│   ├── database/
│   │   ├── schema.sql            # 9-table database schema
│   │   ├── seed.sql              # Sample data
│   │   └── *.sql                 # Migration scripts and triggers
│   └── policies/
│       └── rls.sql               # Row Level Security policies
├── config/
│   └── settings.js               # Supabase project config
└── docs/
    ├── architecture.md
    └── api-notes.md
```

---

## Database Schema

The database consists of **9 tables** with enforced relationships and Row Level Security:

| Table | Description |
|---|---|
| `users` | Core user accounts (name, email, role, auth link) |
| `owners` | Owner profile details |
| `tenants` | Tenant profile details |
| `properties` | Rental listings with type, city, rent, status |
| `property_images` | Images linked to properties |
| `applications` | Tenant interest requests and pipeline status |
| `agreements` | Rental agreements between owner and tenant |
| `payments` | Monthly rent payment records |
| `maintenance_requests` | Tenant-reported issues per agreement |

### Key Triggers
- **Prevent self-rental** — owners cannot apply to their own properties
- **Profile completion restrictions** — certain actions require a completed profile

---

## How It Works

```
Register → Login → Select Dashboard (Owner / Tenant)
                        │
         ┌──────────────┴──────────────┐
       Owner                        Tenant
         │                             │
   Add Property                  Browse Listings
         │                             │
   Review Interests              Express Interest
         │                             │
   Select Tenant            ← Owner Shortlists/Selects
         │                             │
   Admin creates Agreement    Tenant approves Agreement
         │                             │
   Track Payments  ←──────── Tenant submits Payment
         │                             │
   Confirm Payment            Report Maintenance
```

---

## Local Setup

### Prerequisites
- A [Supabase](https://supabase.com) project with the schema applied
- A static file server (e.g. VS Code Live Server, or any HTTP server)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/rental-platform.git
cd rental-platform

# 2. Configure Supabase credentials
# Edit config/settings.js with your Supabase URL and anon key

# 3. Apply the database schema
# Run backend/database/schema.sql in Supabase SQL Editor

# 4. Apply RLS policies
# Run backend/policies/rls.sql in Supabase SQL Editor

# 5. (Optional) Seed sample data
# Run backend/database/seed.sql

# 6. Serve the frontend
# Open frontend/index.html via a local server
```

> **Note:** Open via a local server (not directly as a file) to ensure ES6 module imports work correctly.

---

## Security

- **Row Level Security (RLS)** — all Supabase tables have RLS policies ensuring users can only access their own data
- **Auth guards** — protected pages redirect unauthenticated users to login
- **Role enforcement** — server-side role checks prevent unauthorized dashboard access
- **Input sanitisation** — HTML is escaped before rendering user-supplied content in tables

---

## Pages

| Page | Description |
|---|---|
| `/index.html` | Public landing page with live listings and location chips |
| `/pages/discover.html` | Browse and filter all available properties |
| `/pages/login.html` | User login |
| `/pages/register.html` | New user registration |
| `/pages/about.html` | Platform overview |
| `/pages/terms.html` | Terms and conditions |
| `/pages/add-property.html` | Owner: add a new listing |
| `/pages/browse-rentals.html` | Tenant: browse and apply |
| `/pages/agreements.html` | View and manage rental agreements |
| `/pages/payments.html` | Submit and track rent payments |
| `/pages/maintenance.html` | Report and track maintenance issues |
| `/pages/profile.html` | View and edit user profile |
| `/pages/property-list.html` | Admin: all platform properties |
| `/pages/public-property.html` | Public property detail view |
| `/dashboards/owner.html` | Owner dashboard |
| `/dashboards/tenant.html` | Tenant dashboard |
| `/dashboards/admin.html` | Admin dashboard |

---

## Author

**Jeffy K Jose**
B.Tech Computer Science & Engineering
Mar Athanasius College of Engineering\
**Jintu Kurian**
B.Tech Computer Science & Engineering
Mar Athanasius College of Engineering

📧 [jeffykjose10@gmail.com](mailto:jeffykjose10@gmail.com)

---

## License

Developed for educational purposes as part of a **Database Management Systems (DBMS) microproject**.