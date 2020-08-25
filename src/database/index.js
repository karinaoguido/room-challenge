const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://karina:karina@cluster0.2txdi.mongodb.net/Cluster0?retryWrites=true&w=majority', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
mongoose.Promise = global.Promise;

module.exports = mongoose;