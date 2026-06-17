const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/food', require('./routes/food'));
app.use('/api/meal-bank', require('./routes/mealBank'));
app.use('/api/lifts', require('./routes/lifts'));
app.use('/api/weigh-ins', require('./routes/weighIns'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/sport', require('./routes/sport'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => console.log(`FitLog server running on port ${PORT}`));
