# 🌾 RationFlow — Ration Shop Distribution & Stock Monitoring System

<div align="center">

![RationFlow Banner](https://img.shields.io/badge/RationFlow-Government%20ERP-16a34a?style=for-the-badge&logo=leaf&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

**A modern digital public distribution ecosystem for ration shops, government distribution centers, and supply chain monitoring.**

[Features](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [API Docs](#api-documentation) • [Deployment](#deployment)

</div>

---

## ✨ Features

### 📊 Analytics Dashboard
- Real-time stock monitoring with animated charts
- Monthly distribution trends (AreaChart)
- Stock category distribution (DonutChart)
- Low stock alerts with visual indicators
- Key metrics at a glance

### 👥 Beneficiary Management
- Complete ration card holder profiles
- Family member tracking
- Aadhaar-based verification
- Category management (APL/BPL/AAY/PHH)
- Distribution history per beneficiary

### 📦 Stock Management
- Multi-commodity tracking (Rice, Wheat, Sugar, Oil, Kerosene)
- Real-time quantity monitoring
- Low stock threshold alerts
- Expiry date tracking
- Batch number management
- Stock adjustment with audit trail

### 🚚 Distribution System
- Monthly distribution workflow
- Beneficiary verification by card number
- Quantity allocation per commodity
- Distribution status tracking (Pending/Completed/Partial)
- Complete transaction history

### 🏭 Warehouse & Shop Management
- Multi-warehouse inventory
- Multiple ration shops
- Stock transfers between locations
- Manager assignment

### 📈 Reports & Analytics
- Monthly distribution reports
- Stock summary reports
- Beneficiary reports
- Export to CSV/Excel/PDF
- Audit trails

### 🔔 Notification System
- Low stock alerts
- Distribution reminders
- System notifications
- Read/unread management

### 🔐 Security
- JWT authentication
- Role-based access control (Admin / Shop Manager / Distribution Staff)
- bcrypt password hashing
- Audit logging
- Session persistence

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript |
| **Styling** | Tailwind CSS v3, Framer Motion |
| **UI Components** | Radix UI, ShadCN patterns |
| **Charts** | Recharts |
| **State** | Zustand, React Query (TanStack) |
| **Backend** | Python FastAPI |
| **Database** | PostgreSQL 16 |
| **ORM** | SQLAlchemy 2.0 |
| **Auth** | JWT (python-jose), bcrypt (passlib) |
| **Deployment** | Docker, Railway/Render |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 16
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd p11_ration_shop_distribution

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Create PostgreSQL database
createdb rationflow

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@rationflow.gov.in | Admin@123456 |

> ⚠️ **Change these credentials immediately in production!**

---

## 📁 Project Structure

```
rationflow/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── core/               # Security, config
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── routers/            # API route handlers
│   │   ├── services/           # Business logic
│   │   ├── database.py         # DB connection
│   │   ├── dependencies.py     # Auth dependencies
│   │   └── main.py             # FastAPI app entry point
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Sidebar, Header, Layout
│   │   │   └── ui/             # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   ├── services/           # API service layer
│   │   ├── store/              # Zustand state management
│   │   ├── types/              # TypeScript interfaces
│   │   └── lib/                # Utility functions
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml          # Full stack Docker setup
├── .env.example                # Environment template
└── README.md
```

---

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key API Endpoints

```
POST   /auth/login                    # Login, get JWT
GET    /auth/me                       # Current user profile

GET    /beneficiaries                 # List beneficiaries (paginated)
POST   /beneficiaries                 # Add beneficiary
GET    /beneficiaries/{id}            # Get beneficiary details
PUT    /beneficiaries/{id}            # Update beneficiary

GET    /ration-cards                  # List ration cards
POST   /ration-cards                  # Issue new card
PATCH  /ration-cards/{id}/status      # Update card status

GET    /stock/items                   # List stock items
POST   /stock/items                   # Add stock
POST   /stock/items/{id}/adjust       # Adjust quantity
GET    /stock/low-alerts              # Low stock items

GET    /distributions                 # List distributions
POST   /distributions                 # Record distribution
GET    /distributions/monthly-summary # Monthly summary

GET    /reports/dashboard-stats       # Dashboard KPIs
GET    /reports/stock-summary         # Stock report
GET    /reports/export/csv            # Export data as CSV
```

---

## 🚢 Deployment

### Railway

1. Create a Railway project
2. Add PostgreSQL service from Railway dashboard
3. Deploy backend:
   ```bash
   cd backend
   railway up
   ```
4. Set environment variables in Railway dashboard
5. Deploy frontend (static site or Railway service)

### Render

1. Create a new Web Service for backend
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. Create a PostgreSQL database on Render
3. Create a Static Site for frontend
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Set environment variables

### Environment Variables (Production)

```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/rationflow
SECRET_KEY=<generate-strong-32-char-secret>
FIRST_ADMIN_EMAIL=admin@yourorg.gov.in
FIRST_ADMIN_PASSWORD=<strong-password>
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Frontend (build-time)
VITE_API_URL=https://your-backend-domain.com
```

---

## 🎨 UI Highlights

- **Glassmorphism cards** with subtle backdrop blur
- **Animated counters** on dashboard stats
- **Smooth page transitions** via Framer Motion
- **Dark / Light mode** toggle
- **Responsive** from mobile 320px to 4K desktop
- **Loading skeletons** for every data-fetching state
- **Toast notifications** for all actions
- **Staggered animations** on list/grid rendering

---

## 📊 Database Schema

```
users              → roles, shop assignments
ration_card_holders → beneficiary profiles
ration_cards       → card details, family size, entitlements
family_members     → family linked to ration cards
commodities        → rice, wheat, sugar, oil, kerosene
stock_items        → current inventory per warehouse/shop
stock_transactions → every stock movement (audit)
distributions      → monthly distribution records
warehouses         → storage locations
shops              → ration shops
notifications      → system alerts
audit_logs         → user action tracking
monthly_reports    → generated summary reports
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

<div align="center">
Built with ❤️ for transparent and efficient public distribution systems.

**RationFlow** — Streamlining Ration Distribution Across India
</div>
