const express = require("express");
const router = express.Router();

const DUMB_COMMENT = {
  "id": 1,
  "text": "some test comment",
  "user": {
    "id": 1,
    "name": "some user",
  },
}

router.get('/:articleId', (req, res, next) => {
  // TODO: fetch article comments from database (with pagination)
  res.status(200);
  res.json([DUMB_COMMENT]);
});

router.post('/:articleId', (req, res, next) => {
  // TODO: create new comment
  res.status(200);
  res.json(DUMB_COMMENT);
});

router.delete('/:articleId/:commentId', (req, res, next) => {
  // TODO: delete comment from database
  res.status(204);
});

module.exports = router;
