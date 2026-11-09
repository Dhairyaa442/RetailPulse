# RetailPulse

RetailPulse is an end-to-end e-commerce analytics and decision-intelligence platform built to transform raw transactional data into business metrics, anomaly alerts, revenue forecasts, root-cause insights, and actionable recommendations.

The project uses the public Olist e-commerce dataset and implements a complete analytics workflow from data ingestion and PostgreSQL modeling to FastAPI services and an interactive Next.js dashboard.

## Dashboard Preview

![RetailPulse Analytics Dashboard](docs/images/dashboard.png)

## Key Features

- End-to-end ETL pipeline for e-commerce datasets
- PostgreSQL analytics layer with reusable SQL views
- Revenue, order, customer, category, and delivery KPIs
- Revenue anomaly detection with severity and deviation metrics
- Root-cause analysis for abnormal revenue movements
- Revenue forecasting using Holt linear trend
- Backtesting support for forecasting models
- Automated business recommendations based on analytics signals
- Interactive dashboard with KPI cards and visualizations
- REST APIs built with FastAPI


## Architecture

```text
Olist CSV Dataset
        |
        v
Python ETL Pipeline
        |
        v
PostgreSQL
        |
        +----------------------+
        | Analytics SQL Views  |
        +----------------------+
                  |
                  v
           FastAPI Backend
                  |
        +---------+----------+
        |         |          |
    Analytics  Forecasting  Anomaly/
                           Root Cause
        |         |          |
        +---------+----------+
                  |
                  v
          Next.js Dashboard
                  |
                  v
       Business Recommendations
```

## Tech Stack

**Backend**
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL

**Data & Analytics**
- Pandas
- SQL
- ETL pipelines
- Statistical anomaly detection
- Time-series forecasting

**Frontend**
- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts

## Analytics

RetailPulse calculates and exposes several business metrics, including:

- Total revenue
- Total orders
- Average order value
- Total customers
- Repeat customer rate
- Category-level revenue
- Delivery performance
- Review scores
- Monthly revenue trends

The current dataset contains approximately:

- **$13.2M** in analyzed revenue
- **96K+** orders
- **93K+** customers
- **112K+** order items

## Revenue Anomaly Detection

RetailPulse automatically analyzes monthly revenue and identifies unusual movements.

Each detected anomaly includes:

- Actual revenue
- Expected revenue
- Percentage deviation
- Z-score
- Severity classification

Severity levels allow unusually large movements to be surfaced directly in the dashboard for investigation.

## Root-Cause Analysis

Detected anomalies can be investigated at the product-category level.

For an anomalous month, RetailPulse compares category performance against historical behavior and identifies categories contributing most strongly to the revenue movement.

This connects anomaly detection with an interpretable business explanation instead of presenting alerts without context.

## Revenue Forecasting

RetailPulse includes a forecasting service for predicting future monthly revenue.

The forecasting layer supports:

- Moving-average baseline
- Linear trend model
- Holt linear trend model
- Forecast backtesting
- Multi-period future forecasts

The dashboard visualizes historical revenue alongside projected revenue.

## Business Recommendations

RetailPulse converts analytical signals into actionable recommendations.

The recommendation engine evaluates:

- Delivery performance
- Customer retention
- Revenue anomalies
- Revenue forecasts

It then generates prioritized recommendations with severity, supporting evidence, and suggested actions.

Example recommendations include investigating fulfillment bottlenecks when late deliveries correlate with poor review scores or launching retention initiatives when repeat purchase rates are low.

## API Endpoints

```text
GET /health

GET /api/analytics/revenue
GET /api/analytics/categories
GET /api/analytics/customers
GET /api/analytics/delivery
GET /api/analytics/anomalies

GET /api/analytics/root-cause?month=YYYY-MM

GET /api/analytics/forecast
GET /api/analytics/forecast/backtest
GET /api/analytics/forecast/backtest/linear
GET /api/analytics/forecast/backtest/holt

GET /api/analytics/recommendations
```

Interactive FastAPI documentation is available locally at:

```text
http://127.0.0.1:8000/docs
```

## Project Structure

```text
RetailPulse/
├── app/
│   ├── routes/
│   │   └── analytics.py
│   ├── services/
│   │   ├── anomaly_detection.py
│   │   ├── forecasting.py
│   │   ├── recommendations.py
│   │   └── root_cause.py
│   ├── database.py
│   └── main.py
│
├── dashboard/
│   └── app/
│       └── page.tsx
│
├── data/
├── pipelines/
│   └── load_data.py
│
├── sql/
│   ├── 001_create_schema.sql
│   ├── 002_business_metrics.sql
│   └── 003_analytics_views.sql
│
├── requirements.txt
└── README.md
```

## Running Locally

### 1. Backend

Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the PostgreSQL connection using the required environment variables.

Start the API:

```bash
uvicorn app.main:app --reload
```

The backend runs at:

```text
http://127.0.0.1:8000
```

### 2. Frontend

Open another terminal:

```bash
cd dashboard
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

### 3. Production Validation

The frontend can be validated with:

```bash
npm run lint
npm run build
```

## Data Pipeline

The ETL pipeline loads the Olist e-commerce datasets into PostgreSQL, including:

- Customers
- Orders
- Order items
- Payments
- Products
- Sellers
- Reviews
- Geolocation
- Product category translations

SQL views then transform the normalized transactional data into analytics-ready business metrics consumed by the FastAPI layer.

## What This Project Demonstrates

RetailPulse demonstrates practical experience across:

**Software Engineering:** REST API design, service-layer architecture, frontend/backend integration, modular application design, and production build validation.

**Data Engineering:** ETL pipelines, relational data modeling, PostgreSQL, SQL analytics views, data transformation, and large-dataset processing.

**Data Analytics:** KPI development, customer analysis, category performance, delivery analysis, anomaly detection, forecasting, root-cause analysis, and decision-oriented recommendations.

## Dataset

RetailPulse uses the public Brazilian E-Commerce Public Dataset by Olist.

The dataset contains anonymized information about orders, customers, products, sellers, payments, reviews, and delivery activity from the Olist marketplace.