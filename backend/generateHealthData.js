// generateHealthData.js
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Connect to your health DB
mongoose.connect('mongodb://localhost:27017/health_quality_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to health_quality_db'))
.catch((err) => console.error(err));

// Health Schema
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

const genders = ['Male', 'Female', 'Other'];
const sanitationOptions = ['Toilet', 'Open Defecation', 'Community Toilet', 'Septic Tank'];
const waterSources = ['Tap', 'Well', 'Handpump', 'River', 'Tank', 'Borehole'];

const symptomsList = ['fever', 'cough', 'diarrhea', 'vomiting', 'skin_rash'];

// Generate N fake records
const generateData = (n = 1000) => {
  const data = [];
  for (let i = 0; i < n; i++) {
    // Generate random symptoms and severity
    const selectedSymptoms = {};
    const symptomSeverity = {};
    symptomsList.forEach(sym => {
      if (Math.random() > 0.6) { // ~40% chance person has the symptom
        selectedSymptoms[sym] = true;
        symptomSeverity[sym] = faker.number.int({ min: 1, max: 5 }); // severity 1-5
      }
    });

    data.push({
      houseId: faker.string.alphanumeric(8),
      age: faker.number.int({ min: 1, max: 90 }).toString(),
      gender: genders[Math.floor(Math.random() * genders.length)],
      sanitation: sanitationOptions[Math.floor(Math.random() * sanitationOptions.length)],
      symptoms: selectedSymptoms,
      symptomSeverity: symptomSeverity,
      waterSources: faker.helpers.arrayElements(waterSources, faker.number.int({ min: 1, max: 3 })),
    });
  }
  return data;
};

const seedDB = async () => {
  const data = generateData(1000);
  await HealthModel.insertMany(data);
  console.log('✅ 1000 health records inserted!');
  mongoose.connection.close();
};

seedDB();
