# AWS Multi-Tier E-Commerce Catalog & Administrative Center

This is a modern, high-performance, and beautifully crafted multi-tier E-Commerce Catalog and Administrative Center built with a highly flexible full-stack architecture. 

The application is engineered with a **hybrid runtime design** that allows it to run in two modes:
1. **Integrated Full-Stack Mode** (Easiest Local Development) – A unified node server serving both the Express REST API and the React single-page application (SPA) on a single port.
2. **Decoupled Enterprise Mode** (AWS/EC2-Ready) – A separate, stand-alone Express backend API designed for cloud hosting (e.g., AWS EC2, Elastic Beanstalk) and a decoupled static frontend client designed for CDN delivery (e.g., AWS S3 + CloudFront).

---

## 🏗️ Technical Architecture

### 🎨 Frontend Client (React SPA)
- **Framework:** React 19 + Vite 6 + TypeScript.
- **Styling:** Tailwind CSS v4 (incorporating state-of-the-art native CSS variable theme directives).
- **Animations:** Fluid transitions, elegant hover effects, and responsive layout shifts powered by `motion` (`motion/react`).
- **Icons:** Unified vector iconography using `lucide-react`.
- **Aesthetics:** High-contrast Dark Bento-Grid design utilizing generous negative space, refined card layouts, and subtle glows.

### 🔌 Backend API (Express REST)
- **Engine:** Node.js + Express with TypeScript execution (`tsx` / `esbuild`).
- **Authentication:** Highly secure, Cookie-based stateful JWT Session Authentication.
- **Storage Tier:** Integrated image upload handling supporting **AWS S3 Multipart Uploads** or safe fallback to a local filesystem directory.
- **Error Handling:** Centralized, uniform middleware mapping database constraints to clean JSON error payloads.

### 💾 Dual-Database Persistence Layer
The database layer features an advanced **dual-driver fallback adapter** which detects environmental capabilities automatically on startup:
- **Production Mode:** Connects to a robust relational **PostgreSQL database (e.g., AWS RDS)**.
- **Development Fallback (Zero-Config):** Automatically falls back to **WebAssembly SQL.js (pure-JS SQLite)**, creating a local `database.sqlite` file. No database server installations, configurations, or Docker containers are required to start developing instantly!
- **Auto-Migrations:** Runs schema initialization and seeds default categories and items automatically on boot.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

---

## ⚡ Option A: Integrated Full-Stack Mode (Easiest Local Setup)

In this mode, Express is the master process. In development, it injects Vite HMR middleware, and in production, it serves the compiled React build directly on port `3000`.

### 1. Installation
Install all dependencies in the root directory:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file at the root by copying `.env.example`:
```bash
cp .env.example .env
```
*(By default, leaving the database variables empty triggers the WebAssembly SQLite fallback, meaning no database configuration is needed to run locally).*

### 3. Start Development Server
Launch the unified server:
```bash
npm run dev
```
The application will boot up at **`http://localhost:3000`**. Both your React application and all REST API endpoints under `/api/*` are accessible on this single port.

### 4. Build and Run in Production
To build the static React assets and compile the TypeScript Express server into a highly optimized bundle:
```bash
npm run build
npm run start
```
The compiled, production-ready server will launch on port `3000`.

---

## 🌐 Option B: Decoupled Multi-Tier Mode (AWS / Enterprise Ready)

Use this mode if you want to run or deploy the frontend and backend as completely independent, decoupled services (e.g., deploying the API to AWS EC2 and hosting the frontend on AWS S3).

### 1. Configure and Run the Standalone Backend
Navigate into the `/backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory using the template:
```bash
cp .env.example .env
```

Open `backend/.env` and configure your settings:
- **Database:** Provide your AWS RDS or PostgreSQL connection credentials in `DATABASE_URL` (or fine-grained host/user parameters).
- **Authentication:** Adjust `JWT_SECRET` for signing user login tokens.
- **AWS S3 (Optional):** Add S3 credentials to direct product image uploads straight to an S3 bucket. If omitted, uploads will write locally to `backend/uploads/`.

Run the backend standalone API:
```bash
npm run dev
```
By default, the standalone backend launches on **`http://localhost:5000`**. You can verify its health at `http://localhost:5000/api/health`.

### 2. Configure and Run the Standalone Frontend Client
Navigate back to the project root:
```bash
cd ..
```

Create or modify your root `.env` file and instruct the React application to route its fetches to the standalone backend instead of the local dev server:
```env
VITE_API_BASE_URL="http://localhost:5000"
```

Start the React development server:
```bash
npm install
npm run dev
```
The React frontend will boot on **`http://localhost:3000`** and stream API requests over CORS to the backend at `http://localhost:5000`.

---

## 🗄️ Database Schema & Auto-Migrations

The database is structured cleanly using 7 relational tables:
- `users`: Standard profiles with password hashing via `bcrypt`.
- `categories`: High-level group mappings for catalog items (e.g. Electronics, Apparel).
- `products`: Product listings containing stock, names, descriptions, pricing, and image URLs.
- `cart_items`: User-bound shopping carts.
- `orders` & `order_items`: Receipt trackers for catalog checkout.
- `reviews`: Product review logs linked to users and stars rating.

### Auto Migration on Startup
When the Express server boots up, it executes `runMigrations()`. If tables are missing:
1. It automatically compiles and injects the schema definitions.
2. It seeds the inventory database with 4 default category records: *Electronics, Apparel, Books, and Home & Kitchen*.
3. It creates pre-configured inventory products and registers a default Admin Account so you can log in right away.

### Default Credentials
- **Admin Account:** `admin@example.com` / `admin123`
- **Customer Account:** `user@example.com` / `user123`

---

## 🌟 Key Application Features

### 🛡️ Administrative Center (`/admin`)
Log in as the Administrator to unlock a dedicated control suite:
- **Real-Time SQL Stat Cards:** Instant calculations of Total Revenue, Order counts, cataloged SKUs, and registered user profiles.
- **SKU Creator Form:** Form with full image file upload handling, slug pointers, price validation, category mapping, and stock adjustments.
- **Relational Categories Manager:** Create and update product catalog categories instantly.
- **Order Fulfillment Desk:** Complete delivery/fulfillment state controller (Pending, Shipped, Delivered) updating the relational database immediately.

### 🛍️ Client Experience
- **Fluid Catalog Explorer:** Filter by categories, query items with dynamic sliders, and check live stock warnings.
- **Add-To-Cart & Checkout:** Fully integrated cart workflow with shipping address logs.
- **Reviews & Ratings:** Interactive star feedback loop letting buyers write reviews for catalog items.
- **Interactive UI Transitions:** Elegant page transitions and interactive micro-animations using `motion` for an immersive, premium user experience.

---

## 🛠️ Diagnostics & Verification

### Code Integrity
To verify TypeScript declarations compile cleanly and run diagnostic checks:
```bash
npm run lint
```

### Production Bundling
Ensure everything bundles cleanly for production releases:
```bash
npm run build
```
The output is generated cleanly under `/dist/` (static build assets) and `/dist/server.cjs` (the bundled Node application).
