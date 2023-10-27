const express = require('express');
const { createOrder, fetchOrderByUser, deleteOrder, updateOrder, fetchAllOrders } = require('../controller/OrderControl');


const router = express.Router();
//  /orders is already added in base path
router.post('/', createOrder)
      .get('/own/', fetchOrderByUser)
      .delete('/:id', deleteOrder)
      .patch('/:id', updateOrder)
      .get('/', fetchAllOrders)


exports.router = router; 