const express = require("express");
const router = express.Router();

const DUMB_ARTICLE = {
  "id": 1,
  "title": "test article",
  "text": "some test article",
  "category": {
    "id": 1,
    "name": "test category",
  },
  "publisher": {
    "id": 1,
    "name": "some user",
  },
}

router.get('/', (req, res, next) => {
  // TODO: fetch articles from database (with pagination)
  res.status(200);
  res.json([DUMB_ARTICLE]);
});

// TODO: search articles
// TODO: filter articles by category
// TODO: filter articles by user

router.post('/', (req, res, next) => {
  // TODO: create new article
  res.status(200);
  res.json(DUMB_ARTICLE);
});

router.get('/:articleId', (req, res, next) => {
  // TODO: fetch article from database
  res.status(200);
  res.json(DUMB_ARTICLE);
});

router.patch('/:articleId', (req, res, next) => {
  // TODO: update article
  res.status(200);
  res.json(DUMB_ARTICLE);
});

router.delete('/:articleId', (req, res, next) => {
  // TODO: delete article from database
  res.status(204);
});

module.exports = router;
