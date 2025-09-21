// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// -----------------------------
// MongoDB Connections
// -----------------------------

// Health DB (unchanged)
mongoose.connect('mongodb://localhost:27017/health_quality_db')
  .then(() => console.log('✅ MongoDB connected to health_quality_db'))
  .catch((err) => console.error('❌ MongoDB connection error (health):', err));

// Water DB
const waterConnection = mongoose.createConnection('mongodb://localhost:27017/water_quality_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

waterConnection.once('open', () => {
  console.log('✅ MongoDB connected to water_quality_db');
});
waterConnection.on('error', (err) => {
  console.error('❌ MongoDB connection error (water):', err);
});

// -----------------------------
// Health Schema
// -----------------------------
const HealthSchema = new mongoose.Schema({
  houseId: String,
  age: String,
  gender: String,
  sanitation: String,
  symptoms: Object,
  symptomSeverity: Object,
  waterSources: Array,
  timestamp: { type: Date, default: Date.now }
});

const HealthModel = mongoose.model('Health', HealthSchema, 'health_submissions');

// -----------------------------
// Water Schema (fixed: numeric fields as Number)
// -----------------------------
const WaterSchema = new mongoose.Schema({
  waterSourceName: { type: String, required: true },
  waterSourceType: { type: String, required: true },
  rainfall: Number,
  temperature: Number,
  dissolvedOxygen: Number,
  chlorine: Number,
  month: String,
  fecalColiform: Number,
  season: String,
  ph: Number,
  turbidity: Number,
  personsWithSymptoms: Number,
  hardness: Number,
  nitrate: Number,
  tds: Number,
  timestamp: { type: Date, default: Date.now }
});

const WaterModel = waterConnection.model('Water', WaterSchema, 'water_submissions');

// -----------------------------
// Routes
// -----------------------------

// Health POST
app.post('/submit', async (req, res) => {
  try {
    const form = req.body;
    const newHealth = new HealthModel(form);
    const saved = await newHealth.save();
    console.log('✅ Health form saved to DB:', saved);
    res.status(200).json({ message: 'Health form saved', id: saved._id });
  } catch (err) {
    console.error('❌ Failed to save health form:', err);
    res.status(500).json({ error: 'Failed to save health form' });
  }
});

// Water POST (auto-cast numbers)
app.post('/water/submit', async (req, res) => {
  try {
    const form = req.body;

    // Ensure numeric fields are numbers
    const numericFields = [
      "rainfall", "temperature", "dissolvedOxygen", "chlorine",
      "fecalColiform", "ph", "turbidity", "personsWithSymptoms",
      "hardness", "nitrate", "tds"
    ];

    numericFields.forEach(field => {
      if (form[field] !== undefined) {
        form[field] = parseFloat(form[field]) || 0;
      }
    });

    const newWater = new WaterModel(form);
    const saved = await newWater.save();
    console.log('✅ Water form saved to DB:', saved);
    res.status(200).json({ message: 'Water form saved', id: saved._id });
  } catch (err) {
    console.error('❌ Failed to save water form:', err);
    res.status(500).json({ error: 'Failed to save water form' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// -----------------------------
// GET Routes for Government Dashboard
// -----------------------------

app.get('/health', async (req, res) => {
  try {
    const data = await HealthModel.find().sort({ timestamp: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch health data" });
  }
});

app.get('/water', async (req, res) => {
  try {
    const data = await WaterModel.find().sort({ timestamp: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch water data" });
  }
});

// Alternative endpoints
app.get("/health/all", async (req, res) => {
  try {
    const records = await HealthModel.find();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch health data" });
  }
});

app.get("/water/all", async (req, res) => {
  try {
    const records = await WaterModel.find();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch water data" });
  }
});

// -----------------------------
// Analytics Endpoints (Optional)
// -----------------------------

app.get('/analytics/health', async (req, res) => {
  try {
    const records = await HealthModel.find();
    const totalSubmissions = records.length;
    const avgAge = records.reduce((sum, record) => sum + (parseInt(record.age) || 0), 0) / totalSubmissions;

    const genderCounts = records.reduce((acc, record) => {
      acc[record.gender || 'unknown'] = (acc[record.gender || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    const symptomCounts = {};
    records.forEach(record => {
      if (record.symptoms) {
        Object.entries(record.symptoms).forEach(([symptom, value]) => {
          if (value) {
            symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
          }
        });
      }
    });

    res.json({ totalSubmissions, avgAge, genderDistribution: genderCounts, topSymptoms: symptomCounts });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch health analytics" });
  }
});

app.get('/analytics/water', async (req, res) => {
  try {
    const records = await WaterModel.find();
    const totalSubmissions = records.length;

    const sourceTypeCounts = records.reduce((acc, record) => {
      acc[record.waterSourceType || 'unknown'] = (acc[record.waterSourceType || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    const avgPh = records.reduce((sum, record) => sum + (record.ph || 0), 0) / (totalSubmissions || 1);
    const avgTurbidity = records.reduce((sum, record) => sum + (record.turbidity || 0), 0) / (totalSubmissions || 1);

    res.json({ totalSubmissions, sourceTypeDistribution: sourceTypeCounts, averageParameters: { ph: avgPh, turbidity: avgTurbidity } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch water analytics" });
  }
});

// -----------------------------
// Start server
// -----------------------------
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
