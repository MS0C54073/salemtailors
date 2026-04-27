# Salem Tailors — Digital Shop Management System

A mobile-first, low-bandwidth optimized web platform that digitises the operations of **Salem Tailors** in Lusaka, Zambia. The system replaces manual paper records with a unified workflow covering customer registration, measurement profiles, order tracking, appointments, a public product catalogue, finance, and real-time client/staff messaging.

**Live URLs**
- Production: https://salemtailors.lovable.app
- Lovable Project: https://lovable.dev/projects/e92e2d92-99f1-4361-9b39-65a9e707e00f

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Key Features](#key-features)
3. [User Roles](#user-roles)
4. [Architecture (UML Component Diagram)](#architecture-uml-component-diagram)
5. [Database Schema (ERM Diagram)](#database-schema-erm-diagram)
6. [Key Workflow (Sequence Diagram)](#key-workflow-sequence-diagram)
7. [Use Cases](#use-cases)
8. [Local Development](#local-development)
9. [Project Structure](#project-structure)
10. [Deployment](#deployment)

---

## Tech Stack

| Layer            | Technology                                                  |
| ---------------- | ----------------------------------------------------------- |
| Frontend         | React 18, Vite 5, TypeScript 5                              |
| Styling          | Tailwind CSS v3 + shadcn/ui (semantic HSL design tokens)    |
| Routing / State  | react-router-dom v6, @tanstack/react-query                  |
| Forms / Validation | react-hook-form + Zod                                     |
| Backend (BaaS)   | Lovable Cloud (Supabase: Postgres, Auth, Storage, RLS, Edge Functions) |
| Realtime         | Supabase Realtime (Postgres changes for messages)           |
| Notifications    | Email + WhatsApp deep-links (manual click from admin)       |
| Hosting          | Lovable (auto-deploys on each change)                       |

---

## Key Features

### Public site
- Landing page with portfolio highlights and CTAs
- **Product Catalogue** — browse bags, caps, fabrics, and merchandise with images, variants (size/color), and stock status
- Catalogue item detail page with inquiry-by-chat or WhatsApp
- Booking page for first-time consultation requests

### Client dashboard
- Order request submission with reference images and preferences
- 8-stage order tracking (request → completed/ready for pickup)
- **Measurement profiles** with separate male / female / child templates
- Appointment self-booking against staff-published slots
- Real-time chat with assigned staff
- Tier badge (Regular / Member) with discount visibility

### Admin / Staff dashboard
- **Customer management** — search, filter by tier/source, CSV export, promote to Member
- **Orders** — auto-detects member tier by phone, applies member discount + priority badge
- **Catalogue management** — categories, items, variants, multi-image upload (Supabase Storage)
- **Appointments & Slots** — publish availability, confirm bookings
- **Finance** — payments, expenses, deposit/balance tracking
- **Portfolio** — featured work gallery
- **Staff Management** — Super Admin creates staff via Edge Function
- **Settings** — member discount %, notification email/WhatsApp number
- Real-time chat panel with all clients

### Cross-cutting
- Supabase RLS on every table, with `is_staff()` and `has_role()` security-definer functions
- Strict mobile-first responsive layout with overflow "More" sheet for staff nav
- Persistent back navigation across all dashboard routes

---

## User Roles

Four roles are stored in a separate `user_roles` table (never on `profiles`) to prevent privilege escalation:

| Role          | Capabilities                                                              |
| ------------- | ------------------------------------------------------------------------- |
| `super_admin` | Everything + create/remove staff accounts, manage roles                   |
| `admin`       | All operational features (customers, orders, catalogue, finance, settings) |
| `sub_admin`   | Sees only requests assigned to them; can chat and update status           |
| `client`      | Own profile, measurements, orders, appointments, chat                     |

Permission checks use the SQL function `has_role(_user_id, _role)` (SECURITY DEFINER) inside RLS policies to avoid recursion.

---

## Architecture (UML Component Diagram)

```mermaid
graph TB
    subgraph Browser["Browser - React SPA"]
        Public["Public Pages<br/>Index, Catalogue, Book"]
        Auth["Auth<br/>Sign in / Register"]
        ClientDash["Client Dashboard<br/>Orders, Profile, Chat"]
        AdminDash["Admin Dashboard<br/>Customers, Orders,<br/>Catalogue, Finance"]
        Shared["Shared UI<br/>shadcn/ui + Tailwind"]
    end

    subgraph Cloud["Lovable Cloud (Supabase)"]
        SupaAuth["Auth<br/>JWT + Email"]
        Postgres[("Postgres<br/>+ RLS Policies")]
        Storage["Storage<br/>catalogue, references"]
        Realtime["Realtime<br/>postgres_changes"]
        Edge["Edge Functions<br/>create-staff"]
    end

    subgraph External["External Channels"]
        WA["WhatsApp<br/>deep links"]
        Email["Email<br/>notifications"]
    end

    Public --> SupaAuth
    Auth --> SupaAuth
    ClientDash --> SupaAuth
    AdminDash --> SupaAuth
    ClientDash --> Postgres
    AdminDash --> Postgres
    AdminDash --> Storage
    Public --> Storage
    ClientDash --> Realtime
    AdminDash --> Realtime
    AdminDash --> Edge
    Edge --> SupaAuth
    AdminDash --> WA
    AdminDash --> Email
    Shared -.-> Public
    Shared -.-> ClientDash
    Shared -.-> AdminDash
```

---

## Database Schema (ERM Diagram)

```mermaid
erDiagram
    profiles ||--o{ user_roles : "has"
    profiles ||--o{ customer_measurements : "owns"
    profiles ||--o{ garment_requests : "submits"
    profiles ||--o{ appointments : "books"
    profiles ||--o{ messages : "sends/receives"
    customers ||--o{ customer_measurements : "has"
    customers ||--o{ garment_requests : "linked to"
    customers ||--o{ payments : "pays"
    garment_requests ||--o{ appointments : "schedules"
    garment_requests ||--o{ messages : "discussed in"
    garment_requests ||--o{ payments : "billed"
    catalogue_categories ||--o{ catalogue_items : "groups"
    catalogue_items ||--o{ catalogue_item_images : "has"
    catalogue_items ||--o{ catalogue_item_variants : "offers"
    appointment_slots }o--|| profiles : "booked by"

    profiles {
        uuid user_id PK
        text full_name
        text phone
        text email
        enum tier "regular|member"
        timestamptz tier_since
    }
    user_roles {
        uuid user_id FK
        enum role "super_admin|admin|sub_admin|client"
    }
    customers {
        uuid id PK
        text full_name
        text phone
        enum tier
        jsonb measurements
    }
    customer_measurements {
        uuid id PK
        uuid profile_user_id FK
        uuid customer_id FK
        enum template "male|female|child"
        jsonb measurements
    }
    garment_requests {
        uuid id PK
        uuid client_id FK
        uuid customer_id FK
        uuid assigned_to FK
        enum category
        enum status "8 stages"
        enum payment_status
        numeric total_price
        numeric discount_percent
        bool is_member_priority
    }
    appointments {
        uuid id PK
        uuid client_id FK
        uuid garment_request_id FK
        enum appointment_type
        enum status
        timestamptz scheduled_at
    }
    appointment_slots {
        uuid id PK
        timestamptz slot_at
        bool is_available
        uuid booked_by FK
    }
    payments {
        uuid id PK
        uuid garment_request_id FK
        numeric amount
        enum payment_type
    }
    messages {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK
        uuid garment_request_id FK
        text content
        bool is_read
    }
    catalogue_categories {
        uuid id PK
        text name
        text slug
    }
    catalogue_items {
        uuid id PK
        uuid category_id FK
        text name
        numeric base_price
        enum status
        enum stock_status
    }
    catalogue_item_images {
        uuid id PK
        uuid item_id FK
        text image_url
    }
    catalogue_item_variants {
        uuid id PK
        uuid item_id FK
        text name
        enum stock_status
    }
    app_settings {
        uuid id PK
        numeric member_discount_percent
        bool member_priority_enabled
    }
```

---

## Key Workflow (Sequence Diagram)

End-to-end flow from a client placing an order to staff fulfilment.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Web as React App
    participant Auth as Cloud Auth
    participant DB as Postgres + RLS
    participant RT as Realtime
    actor Staff as Admin/Sub-Admin

    Client->>Web: Register (full name, phone, email)
    Web->>Auth: signUp + metadata
    Auth-->>DB: trigger creates profile (tier=regular)
    Client->>Web: Submit garment request + images
    Web->>DB: INSERT garment_requests
    DB-->>RT: postgres_changes
    RT-->>Staff: New order notification

    Staff->>Web: Open order, detect tier by phone
    Web->>DB: SELECT profile/customer by phone
    DB-->>Web: tier=member ? apply discount + priority
    Staff->>Web: Publish appointment slot
    Web->>DB: INSERT appointment_slots

    Client->>Web: Book slot
    Web->>DB: UPDATE slot.booked_by = client
    Web->>DB: INSERT appointments

    Client->>Web: Send chat message
    Web->>DB: INSERT messages
    DB-->>RT: postgres_changes
    RT-->>Staff: New message

    Staff->>Web: Update status (in_progress, fitting, ready)
    Web->>DB: UPDATE garment_requests.status
    DB-->>RT: postgres_changes
    RT-->>Client: Status update

    Staff->>Web: Record payment
    Web->>DB: INSERT payments
    Staff->>Web: Click WhatsApp/Email notify
    Web->>Client: External "ready for pickup" message
```

---

## Use Cases

```mermaid
graph LR
    Visitor((Visitor))
    Client((Client))
    SubAdmin((Sub-Admin))
    Admin((Admin))
    SuperAdmin((Super Admin))

    subgraph System["Salem Tailors System"]
        UC1[Browse catalogue]
        UC2[Inquire about item]
        UC3[Register / Sign in]
        UC4[Submit garment request]
        UC5[Manage measurement profile]
        UC6[Book appointment]
        UC7[Chat with staff]
        UC8[View order status]
        UC9[Manage assigned orders]
        UC10[Update order status]
        UC11[Manage all customers]
        UC12[Promote to Member]
        UC13[Manage catalogue & stock]
        UC14[Publish appointment slots]
        UC15[Record payments & expenses]
        UC16[Configure member discount]
        UC17[Create staff accounts]
        UC18[Manage roles]
    end

    Visitor --> UC1
    Visitor --> UC2
    Visitor --> UC3

    Client --> UC4
    Client --> UC5
    Client --> UC6
    Client --> UC7
    Client --> UC8
    Client --> UC1

    SubAdmin --> UC9
    SubAdmin --> UC10
    SubAdmin --> UC7

    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC7

    SuperAdmin --> UC17
    SuperAdmin --> UC18
    SuperAdmin -.inherits.-> Admin
```

---

## Local Development

Requirements: Node.js 18+ and npm (or bun).

```sh
# 1. Clone
git clone <YOUR_GIT_URL>
cd salem-tailors

# 2. Install
npm install        # or: bun install

# 3. Run dev server (Vite, port 8080)
npm run dev        # or: bun run dev
```

Environment variables (`.env`) are auto-managed by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

> **Do not edit** `.env`, `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, or files under `supabase/migrations/`. They are regenerated automatically.

### Useful commands

```sh
npm run build       # production bundle
npm run lint        # ESLint
bunx vitest run     # run unit tests (src/test/)
```

---

## Project Structure

```
src/
├── components/
│   ├── DashboardLayout.tsx        # responsive nav + "More" sheet
│   ├── ProtectedRoute.tsx         # role-aware route guard
│   └── ui/                        # shadcn/ui primitives
├── hooks/
│   └── useAuth.tsx                # session + role hook
├── integrations/supabase/         # auto-generated client + types
├── lib/
│   ├── measurements.ts            # male/female/child templates
│   ├── csv-export.ts
│   └── supabase-helpers.ts
├── pages/
│   ├── Index.tsx                  # landing
│   ├── Auth.tsx                   # sign in / register (Zod)
│   ├── Catalogue.tsx              # public shop
│   ├── CatalogueItem.tsx          # product detail + inquiry
│   ├── Book.tsx                   # consultation booking
│   └── dashboard/
│       ├── ClientDashboard.tsx
│       ├── ClientProfile.tsx      # measurements
│       ├── ClientOrders.tsx
│       ├── ClientAppointments.tsx
│       ├── AdminDashboard.tsx
│       ├── AdminCustomers.tsx     # tier mgmt + CSV export
│       ├── AdminOrders.tsx        # auto member discount
│       ├── AdminCatalogue.tsx
│       ├── AdminAppointments.tsx
│       ├── AdminSlots.tsx
│       ├── AdminFinance.tsx
│       ├── AdminPortfolio.tsx
│       ├── StaffManagement.tsx    # super_admin only
│       ├── Settings.tsx
│       └── Messages.tsx           # realtime chat
└── index.css                      # HSL design tokens

supabase/
├── config.toml
├── migrations/                    # auto-generated
└── functions/
    └── create-staff/              # Edge Function for staff onboarding
```

---

## Deployment

The project is hosted on Lovable. To publish a new version, open the [Lovable project](https://lovable.dev/projects/e92e2d92-99f1-4361-9b39-65a9e707e00f) and click **Share → Publish**. Edge functions and database migrations are deployed automatically.

To attach a custom domain, go to **Project → Settings → Domains → Connect Domain**.

---

## Security Notes

- Roles are stored only in `user_roles` and validated server-side via `has_role()` SECURITY DEFINER functions.
- Every table has RLS enabled; clients can only read/write their own rows, staff are gated by `is_staff()`.
- Storage bucket `catalogue` is public-read, staff-write.
- Authentication uses email + password (no anonymous sign-ups). Email verification is required by default.
