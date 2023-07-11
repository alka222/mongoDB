const Product = require('../models/product');


let limit_items = 2;

exports.getProducts = (req, res, next) => {
  let page = req.query.page || 1;
  let totalItems;

  Product.count()
    .then((totalProducts) => {
      totalItems = totalProducts;
      return Product.findAll({
        offset: (page - 1) * limit_items,
        limit: limit_items,
      });
    })
    .then((products) => {
      res.status(200).json({
        products,
        success: true,
        data: {
          currentPage: page,
          hasNextPage: totalItems > page * limit_items,
          hasPreviousPage: page > 1,
          nextPage: +page + 1,
          previousPage: +page - 1,
          lastPage: Math.ceil(totalItems / limit_items),
        },
      });
      // res.render("shop/product-list", {
      //   prods: products,
      //   pageTitle: "All Products",
      //   path: "/products",
      // });
    })
    .catch((err) => {
      res
        .status(500)
        .json({  message: "Error getting products " });
    });
};
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // Product.findAll({ where: { id: prodId } })
  //   .then(products => {
  //     res.render('shop/product-detail', {
  //       product: products[0],
  //       pageTitle: products[0].title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));
  Product.findByPk(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then(cart => {
      return cart
        .getProducts()
        .then(products => {
          res.status(200).json({
            success:true,
            products:products
          })
        /*  res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products
          });
          */
        })
        .catch(err => {res.status(500).json({success:false,message:err})});
    })
    .catch(err => {res.status(500).json({success:false,message:err})});
};

exports.postCart = (req, res, next) => {
  if(!req.body.productId){
    return res.status(400).json({success:false,message:'Product id is missing'})
  }
  const prodId = req.body.productId;
  let fetchedCart;
  let newQuantity = 1;
  req.user
    .getCart()
    .then(cart => {
      fetchedCart = cart;
      return cart.getProducts({ where: { id: prodId } });
    })
    .then(products => {
      let product;
      if (products.length > 0) {
        product = products[0];
      }

      if (product) {
        const oldQuantity = product.cartItem.quantity;
        newQuantity = oldQuantity + 1;
        return product;
      }
      return Product.findByPk(prodId);
    })
    .then(product => {
      return fetchedCart.addProduct(product, {
        through: { quantity: newQuantity }
      });
    })
    .then(() => {
      res.status(200).json({success:true, message:'Successfully added the Product'})
    })
    .catch(err =>{
      res.status(500).json({success:false,message:'Error Occured'})
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .getCart()
    .then(cart => {
      return cart.getProducts({ where: { id: prodId } });
    })
    .then(products => {
      const product = products[0];
      return product.cartItem.destroy();
    })
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  let fetchedCart ;
  req.user
    .getCart()
    .then((cart) => {
      fetchedCart = cart ;
      return cart.getProducts();
    })
    .then((products) => {
      return req.user.createOrder().then(order=>{
        order.addProducts(products.map(product => {
          product.orderItem = {quantity : product.cartItem.quantity}
          return product
        }))
      })
      .catch(err=>console.log(err))
    })
    .then(result=>{
      fetchedCart.setProducts(null);
      res.status(200).json({message:'successfully posted orders'})
    })
    .catch((err) => {
      res.status(500).json({message:'error posting orders'})
    });
};

exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({include: ['products']})
    .then(orders=>{
      res.status(200).json(orders)
    })
    .catch(err=>{
      res.status(400).json('unable to fetch orders')
    })
  };