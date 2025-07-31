import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('OK');
});

app.listen(PORT, () => {
  console.log(`Ping server running on port ${PORT}`);
});
