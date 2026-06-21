import express from 'express';
import pool from './db.js';
import groupRoutes from './routes/group.routes.js';
import expenseRoutes from './routes/expense.routes.js';

const app = express();
app.use(express.json());

// Health checks
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'expense-service' });
});

app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Routes
app.use('/groups', groupRoutes);
app.use('/expenses', expenseRoutes);

const PORT = process.env.PORT || 3002;
app.start = () => app.listen(PORT, () => {
  console.log(`Expense Service running on port ${PORT}`);
});

app.start();

export default app;
