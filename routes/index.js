const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.status(200);
  res.json({"idk": "test"});
});

module.exports = router;
