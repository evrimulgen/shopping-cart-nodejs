var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;

var Product = require('../models/product');
var Cart = require('../models/cart');
var Order = require('../models/order');
var User = require('../models/user');
var addProduct = require('../models/addProduct');

/* GET home page. */
router.get('/', function(req, res, next) {
  var success = req.flash('success')[0];
  addProduct.find(function(err, docs){
    var productChunks = [], chunkSize = 3;
    for (var i = 0; i < docs.length; i+= chunkSize) {
      productChunks.push(docs.slice(i, i + chunkSize))
    }
    console.log(productChunks);
    res.render('shop/index', { title: 'Express', products: productChunks, successMsg: success, noMessage: !success });
  });
});
/* admin routes */
router.get('/admin', requireRole('admin'), function(req, res, next){
  res.render('admin/index');
})

router.get('/admin/add-product', requireRole('admin'), function(req, res, err){
  res.render('admin/addProduct');
})

router.post('/admin/addProduct', function(req, res, err){
  /*
  sku: {type: String: require: true}, imagePath: {type: String, require: true},
  name: {type: String, require: true}, description: {type: String, require: true},
  category: {type: String, require: true}, size: {type: String, require: false},
  color: {type: String, require: false}, stock: {type: Number, require: true},
  price: {type: Number, require: true}
  */
   new addProduct({
    sku: req.body.sku,
    imagePath: req.body.imagePath,
    name: req.body.nameProduct,
    description: req.body.descriptionProduct,
    category: req.body.categoryProduct,
    size: req.body.sizeProduct,
    color: req.body.colorProduct,
    stock: req.body.stock,
    price: req.body.price
  }).save(function(err, doc){
    if(err) res.json(err);
    else res.redirect('all-products');
  })
})

router.get('/admin/all-products', requireRole('admin'), function(req, res, next){
  addProduct.find(function(err, docs){
    res.render('admin/products', {products: docs, errMsg: docs.length > 0})
  })
})

router.get('/admin/delete/:id', requireRole('admin'), function(req, res, next){
  var item = req.params.id;
  addProduct.remove({"_id": item}, function(err, result){
    res.redirect('/admin/all-products');
  });
})

router.get('/admin/:id/edit', requireRole('admin'), function(req, res, next){
  var item = req.params.id;
  var query = {'_id': item};
  addProduct.findOne(query, function(err, product){
    console.log(product);
    res.render('admin/updateProduct', {product: product});
  })
})

router.post('/admin/:id', requireRole('admin'), function(req, res, next){
  var item = req.params.id;
  addProduct.findOneAndUpdate(
    {_id: item},
    {
        sku: req.body.sku,
        imagePath: req.body.imagePath,
        name: req.body.nameProduct,
        description: req.body.descriptionProduct,
        category: req.body.categoryProduct,
        size: req.body.sizeProduct,
        color: req.body.colorProduct,
        stock: req.body.stock,
        price: req.body.price
      }, function(err, result){
        console.log(err);
        res.redirect('/')
      });
})

router.get('/add-to-cart/:id', function(req, res, next){
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  Product.findById(productId, function(err, product){
    if(err){
      return res.redirect('/');
    }
    cart.add(product, product.id);
    req.session.cart = cart;
    res.redirect('/product/'+productId)
  });
});

router.get('/reduce/:id', function(req, res, next){
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.reduceByOne(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

router.get('/remove/:id', function(req, res, next){
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.removeItem(productId);
  req.session.cart = cart;
  res.redirect('/shopping-cart');
});

router.get('/shopping-cart', function(req, res, next){
  if(!req.session.cart){
    return res.render('shop/shopping-cart', {product: null})
  }
  var cart = new Cart(req.session.cart);
  res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice})
})

router.get('/product/:id', function(req, res, next){
  var productId = req.params.id;
  var query = {'_id': productId};
  addProduct.findOne(query, function(err, product){
    res.render('shop/product', {'product': product, stock: product.stock > 0})
  })
})

router.get('/checkout', isLoggedIn, function(req, res, next){
  if(!req.session.cart){
    return res.render('shop/shopping-cart');
  }
  var cart = new Cart(req.session.cart);
  var errMsg = req.flash('error')[0]
  res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
})

router.post('/checkout', isLoggedIn, function(req, res, next){
    if(!req.session.cart){
      return res.render('shop/shopping-cart');
    }
    var cart = new Cart(req.session.cart);

    var stripe = require("stripe")(
      "sk_test_HlDkCyfD9c6miTXsRZew6aD3"
    );

    stripe.charges.create({
      amount: cart.totalPrice * 100,
      currency: "usd",
      source: req.body.stripeToken, // obtained with Stripe.js
      description: "Test charge"
    }, function(err, charge) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('/checkout');
      }
      var order = new Order({
        user: req.user,
        cart: cart,
        address: req.body.address,
        name: req.body.name,
        paymentId: charge.id
      });
      order.save(function(err, result){
        req.flash('success', 'Successfully bought product');
        req.session.cart = null;
        res.redirect('/');
      });
    });
})
module.exports = router;

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  req.session.oldUrl = req.url;
  res.redirect('/user/signin');
}

function requireRole(role){
  return function(req, res, next){
    if(req.user && req.user.role == role){
      next();
    } else {
      res.render('error/restricted');
    }
  }
}
