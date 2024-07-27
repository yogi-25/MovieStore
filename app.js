const express = require('express');
const jsonParser = require('./middleware/jsonParser');
const moviesRoutes = require('./routes/moviesRoutes');

const app = express();
const port = 3000;

app.use(jsonParser);

app.use('/api', moviesRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
