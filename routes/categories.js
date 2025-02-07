const express = require("express");
const router = express.Router();

const DUMB_CATEGORY = {
  "id": 1,
  "name": "test category",
};

router.get('/', (req, res, next) => {
  // TODO: fetch categories from database (with pagination)
  res.status(200);
  res.json([DUMB_CATEGORY]);
});

// TODO: search categories

router.post('/', (req, res, next) => {
  // TODO: create new category
  res.status(200);
  res.json(DUMB_CATEGORY);
});

router.get('/:categoryId', (req, res, next) => {
  // TODO: fetch category from database
  res.status(200);
  res.json(DUMB_CATEGORY);
});

router.patch('/:categoryId', (req, res, next) => {
  // TODO: update category
  res.status(200);
  res.json(DUMB_CATEGORY);
});

router.delete('/:categoryId', (req, res, next) => {
  // TODO: delete category from database
  res.status(204);
});

module.exports = router;
