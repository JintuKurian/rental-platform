# Rental Management Platform

A web-based rental management platform that connects **property owners** and **tenants**.
The system allows users to list rental properties, search for available rentals, and manage listings through a simple dashboard.

🔗 **Live Website:**
https://rental-platform-c40l.onrender.com

---

## Overview

The Rental Management Platform is designed to simplify the process of listing and discovering rental properties. Owners can add and manage property listings, while tenants can browse and search for available rentals.

This project was developed as a **DBMS microproject**, demonstrating database design, user authentication, and full-stack integration using modern web technologies.

---

## Features

### User Authentication

* Secure user registration and login
* Role-based access (Owner / Tenant)
* Session handling using Supabase authentication

### Owner Features

* Add new rental property listings
* Edit property details
* Delete listings
* Manage properties through a dashboard

### Tenant Features

* Browse available rental properties
* View property details
* Search and filter listings

### General Features

* Responsive design for desktop and mobile
* User-friendly interface
* Toast notifications and alerts
* Secure database operations with Row Level Security (RLS)

---

## Tech Stack

**Frontend**

* HTML5
* CSS3
* Bootstrap
* JavaScript (ES6)

**Backend & Database**

* Supabase (PostgreSQL database)
* Supabase Authentication
* Supabase Storage

**Deployment**

* Render (Frontend hosting)

---

## Project Structure

```
rental-platform
│
├── frontend
│   ├── assets
│   │   ├── css
│   │   ├── js
│   │   └── icons
│   │
│   ├── pages
│   ├── index.html
│
├── backend
│
├── config
│
└── docs
```

---

## Database Design

The database contains the following core tables:

* **users** – stores user account details
* **owners** – stores owner-specific information
* **tenants** – stores tenant-specific information
* **properties** – stores rental property listings

Relationships between tables ensure proper linking between users and their roles.

---

## How It Works

1. Users register as either **Owner** or **Tenant**.
2. Authentication is handled using **Supabase Auth**.
3. Owners can add rental listings through the dashboard.
4. Tenants can browse and search available properties.
5. Data is securely stored and retrieved from the **Supabase PostgreSQL database**.

---

## Installation (Local Development)

1. Clone the repository

```
git clone https://github.com/your-username/rental-platform.git
```

2. Navigate to the project directory

```
cd rental-platform
```

3. Configure Supabase credentials in the project configuration.

4. Open the frontend in a browser or use a local development server.

---

## Security

* Supabase **Row Level Security (RLS)** policies are used to protect user data.
* Role-based access ensures that owners can only manage their own listings.

---

## Future Improvements

* Advanced search filters
* Property image uploads
* Booking or rental request system
* Messaging between owners and tenants
* Map integration for property locations

---

## Author

**Jeffy K Jose**
B.Tech Computer Science & Engineering
Mar Athanasius College of Engineering

Email: [jeffykjose10@gmail.com](mailto:jeffykjose10@gmail.com)

---

## License

This project is developed for educational purposes as part of a **Database Management Systems (DBMS) microproject**.
