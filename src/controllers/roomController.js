const express = require('express');
const authMiddleware = require('../middlewares/auth');
const crypto = require('crypto');

const User = require('../models/User');
const Room = require('../models/Room');

const router = express.Router();

// Get all rooms
router.get('/', async (req, res) => {
    try {
        const rooms = await Room.find();
        res.status(200).send({ rooms });
    } catch (err) {
        return res.status(400).send({ error: 'Error loading rooms' });
    }
});

// Get info (no auth): given a room guid, gets information about a room
router.get('/find', async (req, res) => {
    try { 
        const { guid } = req.body;
        // check if guid room exists
        const room = await Room.findOne({ guid: guid });
        if (!room) {
            return res.status(400).send({ error: 'Cannot find room' });
        } else {
            return res.status(200).send({ room });
        }
    } catch (err) {
        return res.status(400).send({ error: 'Error loading room' });
    }
});

// Search for the rooms that a user is in: given a username, returns a list of rooms that the user is in.
router.get('/user', async (req, res) => {
    try {
        const { username } = req.body;
        // find username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send({ error: 'Cannot find user' });
        } else {
            // find rooms in which user is participant
            const room = await Room.find({ participants: { $in: [user.username] }});
            if (!room)
                return res.status(400).send({ error: 'Cannot find room' });
            
            res.status(200).send({ rooms: room });
        }
    } catch (err) {
        return res.status(400).send({ error: 'Error loading room' });
    }
});

router.use(authMiddleware);

// Create a room (signed in as a user): creates a room hosted by the current user, with an optional capacity limit. Default is 5.
router.post('/', async (req, res) => {
    try {
        const { name, limit } = req.body;
        
        if (!name) {
            return res.status(400).send({ error: 'Room name is required'});
        }

        const guid = crypto.randomBytes(16).toString("hex");
        const user = await User.findById(req.userId).populate('user');
        var limitRoom = limit;
        if (!limitRoom) {
            limitRoom = 5;
        }
        const room = { name, guid: guid, host_name: user.username, limit: limitRoom, num_participants: 0, participants: [] };

        await Room.create(room);
        res.status(200).send(room);
    } catch (err) {
        return res.status(400).send({ error: 'Error creating room' });
    }
});

// Change host (must be signin as the host): changes the host of the user from the current user to another user
router.put('/', async (req, res) => {
    try {
        const { username, guid } = req.body;

        // search if there is this username
        const user = await User.findOne({ username });

        // search if there is a room for this guid
        const room = await Room.findOne({ guid });

        if (!room) {
            return res.status(400).send({ error: 'Cannot find room' });
        }
        if (!user) {
            return res.status(400).send({ error: 'Cannot find user' });
        } else {
            //search if there is a room for this host name
            const currentHost = await User.findById(req.userId);
            const room_update = await Room.findOne({ host_name: currentHost.username });
            if (!room_update) {
                return res.status(400).send({ error: 'You are not the host of this room' });
            }
            
            //const user = await User.findById(req.userId).populate('user');
            //await Room.findByIdAndUpdate(req.userId, { $set: req.params.username }, { useFindAndModify: false, new: true });
            room_update.host_name = username;
            await room_update.save();

            res.status(200).send('Host user changed');
        }
    } catch (err) {
        return res.status(400).send({ error: 'Error updating room' });
    }
});

// Join (signed in as a user): joins the room as the current user
router.post('/join', async (req, res) => {
    try {
        const { guid } = req.body;
        // check if guid room exists
        const room = await Room.findOne({ guid });
        if (!room) {
            return res.status(400).send({ error: 'Cannot find room' });
        } else {
            // search for user's username
            const user = await User.findById(req.userId).populate('user');
            // check if user is already in the room
            const participant = room.participants.find(username => username === user.username);
            
            if (participant) {
                return res.status(400).send({ error: 'User is already in the room' });
            } else {
                // check if room has reached its limit
                if (room.num_participants < room.limit) {
                    room.participants.push(user.username);
                    room.num_participants++;

                    await room.save();

                    res.status(200).send('User has joined the room');
                } else {
                    res.status(400).send({ error: 'Room has reached the limit of participants' });
                }
            }                
        }
    } catch (err) {
        return res.status(400).send({ error: 'Error joining room' });
    }    
});

// Leave (signed in as a user): leaves the room as the current user
router.post('/leave', async (req, res) => {
    try {
        const { guid } = req.body;
        // check if guid room exists
        const room = await Room.findOne({ guid });
        if (!room) {
            return res.status(400).send({ error: 'Cannot find room' });
        } else {
            // search for user's username
            const user = await User.findById(req.userId).populate('user');
            // check if user is not in the room
            const participantIndex = room.participants.findIndex(username => username === user.username);

            if (participantIndex == -1) {
                return res.status(400).send({ error: 'User is not in this room' });
            } else {
                // check if room has reached its limit
                room.participants.splice(participantIndex, 1);
                room.num_participants--;

                await room.save();

                res.status(200).send('User has left the room');
            }                
        }     
    } catch (err) {
        return res.status(400).send({ error: 'Error leaving room' });
    }  
});

module.exports = app => app.use('/rooms', router);