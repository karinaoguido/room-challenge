const express = require('express');
const authMiddleware = require('../middlewares/auth');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();
const jwt = require('jsonwebtoken');

function generateToken(params = {}) {
    return jwt.sign(params, process.env.TOKEN_SECRET, { expiresIn: '86400s' });
}

// Register (no auth required): takes a username, password and optional string for mobile_token. Registers the user and authenticates the client as the newly created user
router.post('/register', async (req, res) => {  
    try {  
        const { username, password, mobile_token } = req.body;
        if (!username) {
            return res.status(400).send({ error: 'Username is required'});
        }
        if (!password) {
            return res.status(400).send({ error: 'Password is required'});
        }

        if (await User.findOne({ username })) {
            return res.status(400).send({ error: 'User already exists '});
        }
        const user = await User.create(req.body);
        console.log(user);

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        console.log(password);
        console.log(hashedPassword);

        await user.save();

        return res.status(200).send({ user, token: generateToken({ id: user.id }) });
    } catch (err) {
        return res.status(400).send({ error: 'Registration failed' }) ;
    }
});


// Sign in/authenticate: takes a username and password, and authenticates the user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user)
            return res.status(400).send({ error: 'User not found' });

        console.log(password);
        console.log(user.password);
        if (!await bcrypt.compare(password, user.password))
            return res.status(400).send({ error: 'Invalid password' });
        
        res.status(200).send({ user, token: generateToken({ id: user.id }) });
    } catch (err) {
        return res.status(400).send({ error: 'Error logging in' });
    }
});

// Get users (no auth required): returns a list of all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();

        res.status(200).send({ users });

    } catch (err) {
        return res.status(400).send({ error: 'Error loading users' });
    }
});

// Get users (no auth required): takes a username and return the user with matching username
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });

        if (!user) {
            return res.status(400).send({ error: 'User not found' });
        } else {
            res.status(200).send({ user });
        }
    } catch (err) {
        return res.status(400).send({ error: 'Error loading user' });
    }
});

// -- below are the functions which authetication is needed

router.use(authMiddleware);

// Update User (must be signed in as the user): updates password and/or mobile_token of the user
router.put('/', async (req, res) => {
    try {
        const { password, mobile_token } = req.body;
        console.log(password);
        
        if (!password && !mobile_token) {
            return res.status(400).send({ error: 'Please inform a password and/or mobile_token' });
        }
        const user = await User.findById(req.userId);

        console.log(user);
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        } 

        if (mobile_token) {
            //const user = await User.findByIdAndUpdate(req.userId, { '$set': { mobile_token: mobile_token }}, { useFindAndModify: false, new: true });
            user.mobile_token = mobile_token;
        }
        await user.save();
        res.status(200).send('User updated'); 
    } catch (err) {
        return res.status(400).send({ error: 'Update failed' });
    }       
});

// Delete User (must be signed in as the user): deletes the user
router.delete('/', async (req, res) => {
    try {
        const user = await User.findByIdAndRemove(req.userId);

        return res.status(200).send('User removed successfully');
    } catch (err) {
        return res.status(400).send({ error: 'Delete failed' });
    }   
});

module.exports = app => app.use('/users', router);