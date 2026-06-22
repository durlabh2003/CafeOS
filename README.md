# ☕ CaféOS

> **A Next-Generation Omni-Channel Cafe Management Platform.**

CaféOS is a comprehensive, end-to-end B2B SaaS platform designed to modernize cafe operations. Built as a unified ecosystem, CaféOS bridges the gap between customer-facing self-service, staff POS operations, kitchen display systems, and multi-branch executive analytics.

## 🚀 Product Vision & Highlights
Traditional cafes suffer from fragmented operations—waiters scribbling orders, cashiers acting as bottlenecks, and owners struggling to track multi-branch inventory. **CaféOS solves this.** 

- **Customer-First Self Service:** Diners scan a QR code at their table to view the digital menu, place orders directly to the kitchen, and pay their bills online without ever waiting for a waiter.
- **Unified POS & Cashier Dashboard:** A beautiful, responsive interface that combines Dine-in, Takeaway, and Third-Party Delivery (Zomato/Swiggy) orders into a single, manageable view.
- **Automated KDS (Kitchen Display System):** Orders instantly flow from the customer's phone or the cashier's tablet directly to the kitchen screens, categorized by prep time.
- **Enterprise-Grade Executive Analytics:** Owners can monitor real-time sales, track low inventory, manage vendors, and switch between multi-branch contexts (e.g., Downtown vs. Airport) from a single dashboard.

## 🏗️ Architecture & Tech Stack

CaféOS is built for speed, reliability, and scale:
- **Frontend Framework:** React 18 + Vite (Zero-config lightning fast builds)
- **Styling:** Pure Vanilla CSS with a bespoke, zero-dependency design system (`index.css`). We prioritize premium aesthetics, glassmorphism, and micro-animations to deliver a native app feel.
- **State Management:** Centralized React Context (`CafeContext.jsx`) handling complex synchronized states across POS, KDS, and Customer UI.
- **Backend & Database:** Supabase (PostgreSQL) handling all CRUD operations, user sessions, and persistent CRM/Inventory data.

## 🗄️ Database Schema
The complete schema can be found in `database_schema.sql`. It features a highly relational structure covering:
- **Core Operations:** `cafes`, `tables`, `orders`, `order_items`, `bills`, `payments`.
- **Management:** `menu_categories`, `menu_items`, `staff`, `shift_logs`.
- **Supply Chain (Phase 3):** `inventory_items`, `recipes`, `vendors`, `purchase_orders`.

## 🛠️ Setup Instructions

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Installation
Clone the repository and install the dependencies:
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Initialization
Copy the contents of `database_schema.sql` and run it in your Supabase SQL Editor to instantly generate all required tables and relationships.

### 5. Run the Application
Start the development server:
```bash
npm run dev
```
Navigate to `http://localhost:5173` to experience CaféOS.

---

*This project was developed as a comprehensive 0-to-1 Product Management execution exercise.*
