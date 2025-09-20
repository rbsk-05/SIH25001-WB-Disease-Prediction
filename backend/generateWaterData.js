// generateWaterData.js
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');

// Connect to your water database
mongoose.connect('mongodb://localhost:27017/water_quality_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to water_quality_db'))
.catch((err) => console.error(err));

// Water Schema
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

const WaterModel = mongoose.model('Water', WaterSchema, 'water_submissions');

const waterSourceTypes = [
  'deep_borehole','piped_protected','community_tank','shallow_well',
  'spring','river','pond','reservoir','canal','rooftop_rainwater','open_catchment'
];
const months = [
  'January','February','March','April','May','June','July','August',
  'September','October','November','December'
];
const seasons = ['Winter','Summer','Autumn','Rain'];

// Generate N fake records
const generateData = (n = 1000) => {
  const data = [];
  for (let i = 0; i < n; i++) {
    data.push({
      waterSourceName: faker.location.city(),
      waterSourceType: waterSourceTypes[Math.floor(Math.random() * waterSourceTypes.length)],
      rainfall: faker.number.int({ min: 0, max: 500 }).toString(),
      temperature: faker.number.int({ min: 0, max: 45 }).toString(),
      dissolvedOxygen: faker.number.int({ min: 0, max: 20 }).toString(),
      chlorine: faker.number.int({ min: 0, max: 5 }).toString(),
      month: months[Math.floor(Math.random() * months.length)],
      fecalColiform: faker.number.int({ min: 0, max: 1000 }).toString(),
      season: seasons[Math.floor(Math.random() * seasons.length)],
      ph: faker.number.float({ min: 5, max: 9, precision: 0.1 }).toString(),
      turbidity: faker.number.int({ min: 0, max: 100 }).toString(),
      personsWithSymptoms: faker.number.int({ min: 0, max: 50 }).toString(),
      hardness: faker.number.int({ min: 0, max: 500 }).toString(),
      nitrate: faker.number.int({ min: 0, max: 50 }).toString(),
      tds: faker.number.int({ min: 0, max: 2000 }).toString(),
    });
  }
  return data;
};

const seedDB = async () => {
  const data = generateData(1000);
  await WaterModel.insertMany(data);
  console.log('✅ 1000 water records inserted!');
  mongoose.connection.close();
};

seedDB();
