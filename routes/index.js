var express = require('express');
var router = express.Router();
var JSSDK = require('../sign.js');
var crypto = require('crypto');

/* GET home page. */
router.get('/', function(req, res, next) {
  var signature = req.signature;
  var timestamp = req.timestamp;
  var nonce = req.nonce;
  var arr = [signature,timestamp,nonce];
  var str =arr.sort().join();
  var sha1 = crypto.createHash('sha1');
  var swo = sha1(str);
  if( swo == signature ){
    return true;
  }else{
    return false;
  }
  res.render('index', { title: 'Express' });
});

router.get('/signPackag', function(req,res){
  res.render('signPackage');

});

router.get('/signPackage', function(req,res){
  console.log(JSSDK);
  new JSSDK('wx5823e69c73837190','d4624c36b6795d1d99dcf0547af5443d').getSignPackage('localhost:8080/signPackag/',function(signPackage) {
    console.log(req.host+'/'+req.url);
    //res.render('index',signPackage);
    console.log(signPackage,"1111");
    res.send(signPackage);
  });
});

router.get('/auth',function(req,res){
  console.log()
  var signature = req.query.signature;
  var timestamp = req.query.timestamp;
  var nonce = req.query.nonce;
  var token = 'timeface';
  var arr = [token,timestamp,nonce];
  var str =arr.sort().join('');
  var sha1 = crypto.createHash('sha1');
  sha1.update(str);
  var d = sha1.digest('hex');
  var echostr = req.query.echostr;
  console.log(signature);
  console.log()
  if( d == signature ){
    res.send(echostr);
  }else{
    return false;
  }
})

module.exports = router;
