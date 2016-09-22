var Product = require('../models/product');

var products = [
  new Product({
    imagePath: 'https://images.primark.com/productsimages/D35397111968660-large.jpg?d=1',
    title: 'Reloj negro con eslogan',
    description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    price: 8
  })
];

var done = 0;
for (var i = 0; i < products.length; i++) {
  console.log(products[i]);
  products[i].save(function(err, result){
    done++;
    if(done === products.length){
        exit();
    }
  });
}

function exit(){
  mongoose.disconnect();
}
