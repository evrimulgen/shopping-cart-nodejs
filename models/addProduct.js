var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//whishlist
var productSchema = new Schema({
  sku: {type: String, require: true},
  imagePath: {type: String, require: true},
  name: {type: String, require: true},
  description: {type: String, require: true},
  category: {type: String, require: true},
  size: {type: String, require: false},
  color: {type: String, require: false},
  stock: {type: Number, require: true},
  price: {type: Number, require: true}
});

module.exports = mongoose.model('Products', productSchema);
