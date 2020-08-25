const mongoose = require('../database');

const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    guid: {
        type: String,
        required: true,
    },
    host_name: {
        type: String,
        required: true,
    },
    limit: {
        type: Number,
        required: true,
    },
    num_participants: {
        type: Number,
        required: true,
    },
    participants: [{
        type: String,
    }],
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;