const express = require('express');
const router = express.Router();
const userService = require('./user.service');

// routes
router.get('/audit/:id', getAuditors);
router.post('/logout/:id', logout);
router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get('/current', getCurrent);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', _delete);

function authenticate(req, res, next) {
    const timestamp = Date.now(); // Getting the current timestamp in milliseconds
    const clientIp = req.connection.remoteAddress ? req.connection.remoteAddress : req.headers.origin; // Getting client remote IPAddress
   
    userService.authenticate(req.body)
        .then(user => {
            if(user){
                userService.update(user._id, {lastActive : timestamp, clientIpAddress : clientIp}).then(data => {
                    res.json(user);
                }).catch(err => {
                    console.log(err);
                    res.status(400).json({ message: 'Please try again after sometime' });
                });
            } else {
                res.status(400).json({ message: 'Username or password is incorrect' });
            } 
        }).catch(err =>  {
            res.status(400).json({ message: 'Please try again after sometime' });
        });
}

function register(req, res, next) {
    userService.create(req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

/**
 * @desc Fetch all reocrds for user
 * @param string req.params.id: Logged user id
 * @returns If valid user list of records else status code 401
 */
function getAuditors(req, res, next) {
    // Verifying user by using id
    userService.getById(req.params.id)
        .then(user => {
            if(user.userType && user.userType.toLowerCase() === 'auditor') {
                // Confirmed, Current user role is an auditor so display all records to user
                // Fetching all records
                userService.getAll()
                    .then(users => res.json(users))
                    .catch(err => next(err));
            } else {
                // Current user role not an auditor prevent user to see all records
                res.json([]);
            }
        })
        .catch(err => next(err));
}

/**
 * @desc Loggin out user and updating last active time of user
 * @param string req.params.id: Logged user id
 * @returns Updating last active time of user
 */
 function logout(req, res, next) {
    // Verifying user by using id
    userService.getById(req.params.id)
        .then(user => {
            // User matched do logout
            if(user) {
                // Updating last active time of user
                const payload = {
                    lastActive: Date.now(),
                    clientIpAddress: req.connection.remoteAddress ? req.connection.remoteAddress : req.headers.origin
                }
                userService.update(req.params.id, payload)
                    .then(() => res.json({}))
                    .catch(err => next(err));
            } else {
                res.status(401).json({message: 'Logout failure!'})
            }
        })
        .catch(err => next(err));
}

function getAll(req, res, next) {
    userService.getAll()
        .then(users => {
            // console.log('userList',users);
            res.json(users)
        })
        .catch(err => next(err));
}

function getCurrent(req, res, next) {
    userService.getById(req.user.sub)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function getById(req, res, next) {
    userService.getById(req.params.id)
        .then(user => user ? res.json(user) : res.sendStatus(404))
        .catch(err => next(err));
}

function update(req, res, next) {
    userService.update(req.params.id, req.body)
        .then(() => res.json({}))
        .catch(err => next(err));
}

function _delete(req, res, next) {
    userService.delete(req.params.id)
        .then(() => res.json({}))
        .catch(err => next(err));
}

module.exports = router;
