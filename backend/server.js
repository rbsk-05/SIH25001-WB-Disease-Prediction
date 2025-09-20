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

// Use default mongoose connection for health
const HealthModel = mongoose.model('Health', HealthSchema, 'health_submissions');

// -----------------------------
// Water Schema
// -----------------------------
const WaterSchema = new mongoose.Schema({
  waterSourceName: { type: String, required: true },
  waterSourceType: { type: String, required: true },
  rainfall: String,
  temperature: String,
  dissolvedOxygen: String,
  chlorine: String,
  month: String,
  fecalColiform: String,
  season: String,
  ph: String,
  turbidity: String,
  personsWithSymptoms: String,
  hardness: String,
  nitrate: String,
  tds: String,
  timestamp: { type: Date, default: Date.now }
});

// Use waterConnection for water submissions
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

// Water POST
app.post('/water/submit', async (req, res) => {
  try {
    const form = req.body;
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

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
