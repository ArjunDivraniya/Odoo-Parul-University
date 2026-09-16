
# The Coffee Concept

<div align="center">
  <h3><strong>Developed by Team Eklavya</strong></h3>
  <p>
    👤 Dhruvesh Shyara <br />
    👤 Mayank Dudhatra <br />
    👤 Priy Mavani <br />
    👤 Arjun Divraniya
  </p>
</div>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://github.com/pmndrs/zustand"><img src="https://img.shields.io/badge/Zustand-4A4A55?style=for-the-badge" alt="Zustand" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" /></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma" /></a>
</p>

## Project Overview

**The Coffee Concept** is a modern, decoupled Full-Stack web-based Restaurant Point-of-Sale (POS) system. Built for speed, reliability, and seamless restaurant operations, it leverages a robust JavaScript/TypeScript ecosystem to deliver a high-performance experience for admins, cashiers, and kitchen staff. 

Our system strictly adheres to the hackathon specification rules while introducing several key architectural optimizations to handle real-world edge cases like historical price compliance and concurrent table edits.

## Key Features & Architecture

### 1. Authentication & Role-Based Access Control (RBAC)
We implemented a secure authentication flow with strict Role-Based Access Control.
- **Implemented Roles**: Full support for `Admin` and `Cashier` roles.

> [!IMPORTANT]  
> **Hackathon Extra/Optimization:** Instead of relying on an unprotected public URL route for the kitchen display, we introduced a third explicit database-level `KITCHEN` role. This ensures dedicated, secure access specifically for kitchen staff.

### 2. Core Backend Settings & Menu Configuration
The backend serves as the central hub for managing the restaurant's offerings and operational settings.
- **Product Management**: Comprehensive management of Products (Name, Description, Price, Unit, Tax, and availability status) and their relationships to Categories.
- **Global Configuration**: Global toggle switches for payment methods including Cash, Digital, and Dynamic UPI QR code generation (with the ability to save custom UPI IDs).

> [!NOTE]  
> **Hackathon Extra/Optimization:** We built a robust `Variant` model mapped to products. This allows for custom modifiers out-of-the-box (e.g., small/medium/large sizes, or extra toppings with an `extraPrice`), significantly enhancing menu flexibility.

### 3. POS Terminal & Cart Workflows
A seamless and reliable point-of-sale terminal designed for high-volume environments.
- **Session Lifecycle**: Complete POS Terminal session lifecycle tracking, including `Open` and `Closed` session statuses, and tracking of initial opening cash and closing cash balances.
- **Order States**: Orders transition seamlessly across `Draft`, `Paid`, and `Cancelled` states.

> [!IMPORTANT]  
> **Hackathon Extra/Optimization (Snapshot Safety):** The `OrderItem` table captures immutable snapshots of the `productName` and item `price` at the exact second of sale. This guarantees historic compliance; if an admin updates product menu details in the backend later, past receipts remain accurate.

> [!IMPORTANT]  
> **Hackathon Extra/Optimization (Concurrency Control):** We added built-in Optimistic Concurrency Control using an auto-incrementing `version` integer column. This stops cashiers from colliding on concurrent table edits, ensuring data integrity during busy shifts.

### 4. Kitchen Display System (KDS)
A real-time, responsive display system to keep the kitchen synchronized with the front-of-house.
- **Workflow Tracking**: Fully responsive real-time workflow tracking (`Sent`, `Preparing`, `Completed`) mapped safely to kitchen tickets.
- **Selective Filtering**: Products utilize a `sendToKitchen` boolean parameter. This ensures that drinks or raw items only stream to the screens where they are relevant, reducing kitchen clutter.

> [!NOTE]  
> **Hackathon Extra/Optimization:** **Micro-Tracking Capability.** Each separate `OrderItem` keeps its own active preparation status flag. This allows cooks to cross items off or strike through progress item-by-item, rather than only being able to clear whole orders at once.

## Database Schema Deep-Dive

Our database is managed using Prisma ORM. While compatible with PostgreSQL for production, it is currently configured with SQLite for effortless, portable local development.

**Core Entities:**
- `User`: Manages authentication credentials and RBAC (`Admin`, `Cashier`, `KITCHEN`).
- `Session`: Tracks POS terminal sessions (opening/closing balances, status).
- `Order`: Represents a customer transaction (status, totals, linked session/user).
- `OrderItem`: Individual items within an order (includes snapshot pricing and item-level KDS status).
- `Product`: The core menu item (details, `sendToKitchen` flag).
- `Variant`: Custom modifiers for products (size, extra toppings, `extraPrice`).
- `Category`: Groupings for products to organize the menu.
- `Payment`: Records payment transactions linked to orders.
- `Settings`: Global configuration (UPI IDs, accepted payment methods).

## 🚀 Getting Started & Installation

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Project Setup & Configuration
Our repository is split into two main directories: `backend` for the Express API and `frontend` for the Next.js application.

First, set up the environment variables for the backend.
```bash
cd backend
cp .env.example .env
```

Ensure your `backend/.env` file is populated. Here are the exact variables required:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
PORT=4001
JWT_SECRET="your-strong-secret-key-here"
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
EMAIL_USER=""
EMAIL_PASS=""
```

### 2. Database Migration & Seeding
Navigate to the `backend` directory, install dependencies, run Prisma migrations to initialize the schema, and execute the seed script to populate mock products, tables, and roles.
```bash
# From the backend directory
npm install

# Run database migrations
npx prisma migrate dev

# Run the seed file to populate mock data
npm run seed
```

### 3. Running the Applications
Open two terminal windows to run both servers concurrently.

**Backend (Express):**
```bash
cd backend
npm run dev
# Server will start at http://localhost:4001
```

**Frontend (Next.js):**
```bash
cd frontend
npm install
npm run dev
# App will start at http://localhost:3000
```

## 📡 API Endpoints Reference

Here is a comprehensive reference of our backend API routes:

| HTTP Method | Endpoint | Description |
|---|---|---|
| **Auth** | | |
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive JWT |
| `GET` | `/api/auth/me` | Get current authenticated user profile |
| **Users** | | |
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create a new user |
| `PUT` | `/api/users/:id` | Update an existing user |
| `DELETE` | `/api/users/:id` | Delete a user |
| **Products & Categories** | | |
| `GET` | `/api/products` | Get all products |
| `POST` | `/api/products` | Create a new product (Admin) |
| `PUT` | `/api/products/:id` | Update a product (Admin) |
| `DELETE` | `/api/products/:id` | Delete a product (Admin) |
| `GET` | `/api/products/categories` | Get all categories |
| `POST` | `/api/products/categories` | Create a new category (Admin) |
| `DELETE` | `/api/products/categories/:id` | Delete a category (Admin) |
| **Orders** | | |
| `GET` | `/api/orders` | Get list of orders |
| `POST` | `/api/orders` | Create a new order |
| `GET` | `/api/orders/:id` | Get details of a specific order |
| `PUT` | `/api/orders/:id/status` | Update order status |
| `POST` | `/api/orders/:id/pay` | Process payment for an order |
| `POST` | `/api/orders/:id/email` | Send order receipt via email |
| **Sessions & Terminals** | | |
| `GET` | `/api/sessions/active` | Get the currently active session |
| `GET` | `/api/sessions/:id` | Get session details |
| `POST` | `/api/sessions/open` | Open a new POS session |
| `PUT` | `/api/sessions/:id/close` | Close an active POS session |
| `GET` | `/api/terminals` | List all POS terminals |
| `POST` | `/api/terminals` | Create a new terminal (Admin) |
| `DELETE` | `/api/terminals/:id` | Delete a terminal (Admin) |
| **Kitchen KDS** | | |
| `GET` | `/api/kitchen/active` | Get active kitchen orders (Kitchen/Admin) |
| `PUT` | `/api/kitchen/:id/status` | Update kitchen item status (Kitchen/Admin) |
| **Floors & Tables** | | |
| `GET` | `/api/floors` | Get all floors and tables |
| `POST` | `/api/floors` | Create a new floor (Admin) |
| `POST` | `/api/floors/:id/tables` | Add a table to a floor (Admin) |
| `PUT` | `/api/tables/:id` | Update a table (Admin) |
| `DELETE` | `/api/tables/:id` | Delete a table (Admin) |
| **Dashboard & Settings** | | |
| `GET` | `/api/dashboard/stats` | Get high-level dashboard statistics |
| `GET` | `/api/dashboard/recent-orders` | Get recently placed orders |
| `GET` | `/api/dashboard/sales-chart` | Get sales chart data |
| `GET` | `/api/dashboard/sales-trends` | Get sales trend data |
| `GET` | `/api/dashboard/top-products` | Get top-selling products |
| `GET` | `/api/dashboard/heatmap-data` | Get sales heatmap data |
| `GET` | `/api/settings` | Get global system settings |
| `PUT` | `/api/settings` | Update global settings (Admin) |

## Roadmap (Sprint V2)

We are continuously improving The Coffee Concept. The following features are planned for our upcoming Sprint V2:

- **Coupons & Promotion Engines**: A comprehensive system to manage discounts, promotional codes, and automated offers.
- **Dynamic UI Category Colors**: An automatic UI feature to color-code categories, making navigation even faster for cashiers.
