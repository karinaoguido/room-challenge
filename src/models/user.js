const mongoose = require('../database');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    mobile_token: {
        type: String,
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;