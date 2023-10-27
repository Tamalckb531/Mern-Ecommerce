const { Product } = require("../model/ProductModel");

exports.createProduct = async (req, res) => {
  //we have to get this product from API body

  const product = new Product(req.body);
  product.discountPrice = Math.round(product.price * (1 - product.discountPercentage / 100));

  //mongoose saving the data in database while validating the schema
  try {
    const doc = await product.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
}

exports.fetchAllProducts = async (req, res) => {
  //here the product will be fetched considering pagination, sort, categories and brands

  //for product manipulating
  //this deleted query help to hide product form user interface
  let condition = {};
  if (!req.query.admin) {
    condition.deleted = { $ne: true };
  }

  let query = Product.find(condition);
  //for total count
  let totalProductsQuery = Product.find(condition);

  if (req.query.category) {
    query = query.find({ category: { $in: req.query.category.split(',') } });
    totalProductsQuery = totalProductsQuery.find({
      category: { $in: req.query.category.split(',') },
    });
  }

  if (req.query.brand) {
    query = query.find({ brand: { $in: req.query.brand.split(',') } });
    totalProductsQuery = totalProductsQuery.find({ brand: { $in: req.query.brand.split(',') } });
  }

  //How to get sort on discounted price not on actual price 
  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
    totalProductsQuery = totalProductsQuery.sort({ [req.query._sort]: req.query._order });
  }

  const totalDocs = await totalProductsQuery.count().exec();

  if (req.query._page && req.query._limit) {
    const pageSize = req.query._limit;
    const page = req.query._page;
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  //mongoose saving the data in database while validating the schema
  try {
    const doc = await query.exec();
    //setting the headers for X-Total-Count
    res.set('X-Total-Count', totalDocs);
    res.status(200).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
}

exports.fetchProductById = async (req, res) => {

  const { id } = req.params;

  //mongoose saving the data in database while validating the schema
  try {
    const product = await Product.findById(id);
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err);
  }
}

exports.updateProduct = async (req, res) => {

  const { id } = req.params;

  //mongoose saving the data in database while validating the schema
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    product.discountPrice = Math.round(product.price*(1-product.discountPercentage/100))
    const updatedProduct = await product.save()
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(400).json(err);
  }
}