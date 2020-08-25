const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader){
        return res.status(400).send({ error: 'No token provided' });
    }

    const parts = authHeader.split(' ');

    if (!parts.length === 2) {
        return res.status(400).send({ error: 'Token is malformed' });
    }

    if (parts[0].toString() != 'Bearer' ) {
        return res.status(400).send({ error: 'Token is malformed' });
    }

    jwt.verify(parts[1], process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(400).send({ error: 'Token is invalid' });
        }

        req.userId = decoded.id;
            
        return next();
    });
};