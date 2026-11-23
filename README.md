# 🍕 PizzaHub — Backend API

PizzaHub Backend is a RESTful API built with Node.js, Express.js, TypeScript, and MongoDB. It powers the PizzaHub platform by handling authentication-related integrations, menu management, orders, users, vendor operations, subscriptions, and payment processing.

## 🌐 Live API

**Backend URL:** https://pizzahub-server-jet.vercel.app

**API Status:** `/`

## ✨ Key Features

- RESTful API architecture.
- MongoDB database integration.
- TypeScript-based backend development.
- Customer, vendor, and admin role management.
- Pizza menu management.
- Order management.
- Vendor management.
- Subscription management.
- Stripe payment integration.
- JWT-based authentication support.
- CORS configuration for frontend communication.
- Centralized error handling.
- Production deployment with Vercel.

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript Runtime |
| Express.js | Backend Framework |
| TypeScript | Type Safety |
| MongoDB | NoSQL Database |
| JWT | Token-based Authentication |
| Stripe | Payment Processing |
| Vercel | Deployment |

## 📁 Project Structure

```text
pizzahub-server/
│
├── src/
│   ├── config/
│   │   └── db.ts
│   │
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   ├── app.ts
│   └── server.ts
│
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone YOUR_BACKEND_REPOSITORY_URL
```

### 2. Navigate to the Project

```bash
cd pizzahub-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string
DB_NAME=pizza

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:3000

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID=your_stripe_price_id
```

**Important:** Never expose your database credentials, JWT secret, or Stripe secret keys in a public repository.

### 5. Run the Development Server

```bash
npm run dev
```

The backend server will run at:

```text
http://localhost:5000
```

## 🔗 API Information

**Base URL:**

```text
https://pizzahub-server-jet.vercel.app
```

### Health Check

```http
GET /
```

Checks whether the backend API is running.

### Public Menu

```http
GET /api/menu/public
```

Retrieves publicly available pizza menu items.

> Other API routes handle menu management, orders, users, vendors, subscriptions, and payments. Refer to the source code for the exact route definitions.

## 💳 Payment Integration

PizzaHub uses Stripe to process subscription payments.

The backend handles payment-related operations and subscription workflows.

Required Stripe environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`

## 🗄️ Database

PizzaHub uses MongoDB Atlas for database management.

The database stores application information such as:

- Users
- Pizza menu items
- Orders
- Vendor information
- Subscription records
- Payment information

## 🔐 Security

- Environment-based configuration.
- JWT-based authentication support.
- Role-based authorization.
- CORS protection.
- Secure payment processing through Stripe.
- Sensitive credentials excluded from version control.

## 🚀 Deployment

The backend is deployed using Vercel.

**Production API:**

https://pizzahub-server-jet.vercel.app

**Database:** MongoDB Atlas

## 👩‍💻 Developer

**Nazmin Akter**

Computer Science & Engineering Student

Full-Stack Web Development Enthusiast.

---

⭐ Built with passion as part of the PizzaHub Full-Stack Project.