const request = require('request')
const querystring = require('querystring')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Users = require('../models/users')

const { sendResponse } = require('../utils/responseUtils')

let redirect_uri = process.env.REDIRECT_URI || 'http://localhost:5000/api/callback'
const saltRounds = 13;

module.exports.login = async (req, res) => {
  let { username, password } = req.body
  let user
  try {
    user = await Users.findOne({username})
  } catch (error) {
    return sendResponse(res, 400, error);
  }
  if (!user) {
    return sendResponse(res, 400, {auth: false, message: "Failed to Authenticate"});
  }
  bcrypt.compare(password, user.password, function(err, match) {
    console.log('\n---> match <---\n', match, '\n');
    if (match) {
      const token = jwt.sign({ id: user._id }, process.env.APP_SECRET, { expiresIn: 86400 });
      sendResponse(res, 200, {auth: true, token})
    } else {
      return sendResponse(res, 500, {auth: false, message: "Failed to Authenticate"});
    }
});
}

module.exports.signup = async (req, res) => {
  let { username, password } = req.body
  bcrypt.hash(password, saltRounds, async function(err, hash) {
    let user
    try {
      user = await Users.create({username, password: hash})
    } catch (error) {
      return sendResponse(res, 400, error);
    }
    return sendResponse(res, 200, {user})
  });
}
  
module.exports.authLogin = (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: 'user-read-private user-read-email',
      redirect_uri
    }))
}

module.exports.callback = (req, res) => {
  let code = req.query.code || null
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'))
    },
    json: true
  }
  console.log('\n=== HERE ===\n');
  request.post(authOptions, function(error, response, body) {
    var access_token = body.access_token
    let uri = process.env.FRONTEND_URI || 'http://localhost:3000'
    
    res.redirect(uri + '?access_token=' + access_token)
  })
}

module.exports.authorize = (req, res, next) => {
  var token = req.headers['x-access-token'];
  if (!token) return sendResponse(res, 401, { error: true, auth: false, message: 'No token provided.' })
  
  jwt.verify(token, process.env.APP_SECRET, function(err, decoded) {
    if (err) return sendResponse(res, 401, { error: true, auth: false, message: 'Failed to authenticate.' })
    return next()
  })
}

module.exports.refresh = async (req, res, next) => {
  var token = req.headers['x-access-token'];
  if (!token) return sendResponse(res, 401, { auth: false, message: 'No token provided.' });
  
  jwt.verify(token, process.env.APP_SECRET, async function(err, decoded) {
    if (err) return sendResponse(res, 401, { auth: false, message: 'Failed to authenticate token.' });
    console.log('\n---> decoded <---\n', decoded, '\n');
    let user
    try {
      user =  await Users.findById(decoded.id)
    } catch (error) {
      return sendResponse(res, 400, error);
    }
    if (!user) return sendResponse(res, 401, { auth: false, message: 'Failed to authenticate user.' });
    const token = jwt.sign({ id: user._id }, process.env.APP_SECRET, { expiresIn: 86400 });
    return sendResponse(res, 200, {auth: true, token})
  })
}