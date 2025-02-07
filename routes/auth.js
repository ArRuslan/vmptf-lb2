const express = require("express");
const router = express.Router();

const DUMB_USER = {
  "id": 1,
  "name": "some user",
};

router.post('/login', (req, res, next) => {
  // TODO: check login, password, etc.
  res.status(200);
  res.json({
    "token": "some.jwt.token",
    "expires_at": Math.floor(new Date() / 1000),
    "user": DUMB_USER,
  });
});

router.post('/register', (req, res, next) => {
  // TODO: create new user
  res.status(200);
  res.json({
    "token": "some.jwt.token",
    "expires_at": Math.floor(new Date() / 1000),
    "user": DUMB_USER,
  });
});

module.exports = router;
