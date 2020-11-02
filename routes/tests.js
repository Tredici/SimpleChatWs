var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render("video", {title:"Test Video"});
});

router.get('/screen', function(req, res, next) {
  res.render("screen", {title:"Test Schermo"});
});


module.exports = router;
