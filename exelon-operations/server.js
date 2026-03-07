import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Cache for data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Mock data - Replace with real Google Sheets API calls later
const mockProcurementData = {
  overview: {
    totalProjects: 23,
    activeOrders: 18,
    completedDeliveries: 156,
    pendingApprovals: 7,
    onTimeRate: 94.2,
    costSavings: 245000
  },
  items: [
    {
      id: 'S13101',
      name: 'VCT High Mast Tower',
      status: 'In Progress',
      progress: 65,
      budget: 450000,
      spent: 292500
    },
    {
      id: 'S13130',
      name: 'VCT Power House',
      status: 'Pending',
      progress: 40,
      budget: 380000,
      spent: 152000
    },
    {
      id: 'S13475',
      name: 'Architecture Abad',
      status: 'In Progress',
      progress: 78,
      budget: 520000,
      spent: 405600
    },
    {
      id: 'S12853',
      name: 'WalterMart San Juan',
      status: 'Completed',
      progress: 100,
      budget: 290000,
      spent: 290000
    }
  ]
};

const mockBillingData = {
  overview: {
    totalBilled: 2850000,
    collected: 2156000,
    pending: 694000,
    overdue: 45000,
    collectionRate: 75.6
  },
  invoices: [
    {
      id: 'VB001',
      client: 'ICTSI',
      amount: 450000,
      status: 'Paid',
      date: '2024-02-15'
    },
    {
      id: 'VB002',
      client: 'DataShield',
      amount: 320000,
      status: 'Pending',
      date: '2024-02-28'
    },
    {
      id: 'VB003',
      client: 'OptoTech',
      amount: 280000,
      status: 'Overdue',
      date: '2024-01-30'
    },
    {
      id: 'VB004',
      client: 'WalterMart',
      amount: 185000,
      status: 'Pending',
      date: '2024-03-05'
    }
  ]
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Exelon Operations Dashboard is running'
  });
});

// Procurement Overview
app.get('/api/procurement/overview', (req, res) => {
  try {
    const cacheKey = 'procurement-overview';
    
    // Check cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }
    }

    const data = {
      ...mockProcurementData.overview,
      lastFetch: new Date().toISOString()
    };

    // Store in cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    res.json(data);
  } catch (error) {
    console.error('Error fetching procurement:', error);
    res.status(500).json({ error: 'Failed to fetch procurement data' });
  }
});

// Procurement Items
app.get('/api/procurement/items', (req, res) => {
  try {
    res.json({
      items: mockProcurementData.items,
      total: mockProcurementData.items.length,
      lastFetch: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Billing Overview
app.get('/api/billing/overview', (req, res) => {
  try {
    const cacheKey = 'billing-overview';
    
    // Check cache
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }
    }

    const data = {
      ...mockBillingData.overview,
      lastFetch: new Date().toISOString()
    };

    // Store in cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    res.json(data);
  } catch (error) {
    console.error('Error fetching billing:', error);
    res.status(500).json({ error: 'Failed to fetch billing data' });
  }
});

// Billing Invoices
app.get('/api/billing/invoices', (req, res) => {
  try {
    res.json({
      invoices: mockBillingData.invoices,
      total: mockBillingData.invoices.length,
      lastFetch: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Sync endpoint (for future Google Sheets integration)
app.post('/api/sync', (req, res) => {
  try {
    const { changes, source } = req.body;

    if (!changes || Object.keys(changes).length === 0) {
      return res.json({
        synced: 0,
        message: 'No changes to sync',
        timestamp: new Date().toISOString()
      });
    }

    const synced = Object.keys(changes).length;

    // In future, this will sync with Google Sheets
    console.log(`Syncing ${synced} changes from ${source}`);

    res.json({
      synced,
      timestamp: new Date().toISOString(),
      message: `Successfully synced ${synced} changes`,
      source
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

// Clear cache endpoint
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({
    message: 'Cache cleared',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    message: 'Endpoint does not exist'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Exelon Operations Dashboard`);
  console.log(`📍 Running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⏰ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
