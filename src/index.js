const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
dotenv.config();

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

require('./controllers/userController')(app);
require('./controllers/roomController')(app);


app.listen(3000, () => console.log('Server started on port 3000'));