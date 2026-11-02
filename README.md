# Expense Dashboard
Node.js backend (no dependencies) + Chart.js frontend.
- `server.js`: generates 12 months of sample expenses and aggregates stats server-side at `/api/stats?months=&category=`.
- Dashboard: 4 stat cards, line chart (monthly), donut (category), bar (weekday). Filters: date range + category.
- Responsive grid; loading, empty and error states.

## Run
`node server.js` then open http://localhost:3000

## Deploy (Render, free)
New > Web Service > connect repo. Build command: leave empty. Start command: `node server.js`.


