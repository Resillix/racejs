/**
 * Product routes module
 * 
 * Edit this file and save - the changes will hot reload automatically!
 * Try changing prices, adding new products, or modifying responses.
 */

const products = [
  { id: 1, name: 'Laptop', price: 999, category: 'Electronics' },
  { id: 2, name: 'Phone', price: 699, category: 'Electronics' },
  { id: 3, name: 'Desk', price: 299, category: 'Furniture' },
];

const getProducts = (req, res) => {
  res.json({
    success: true,
    message: 'Products fetched successfully',
    data: products,
    count: products.length,
    version: 1, // Increment this to test hot reload!
  });
};

const getProductById = (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found',
    });
  }
  
  res.json({
    success: true,
    data: product,
  });
};

// Export routes array for hot reload system
exports.routes = [
  { method: 'GET', path: '/products', handlers: [getProducts] },
  { method: 'GET', path: '/products/:id', handlers: [getProductById] },
];
