const express = require('express');
const { fetchBrands, createBrand } = require('../controller/BrandControl');

const router = express.Router();

// /brands is already added in base path 
router.get('/', fetchBrands)
      .post('/',createBrand);

exports.router = router;