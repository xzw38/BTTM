var router = require('express').Router();
var fs     = require('fs');
var User   = require('../../models/User');
var Trade  = require('../../models/TradingObject');
var config = require('../../config');
var multer = require('multer');
var path   = require('path');
const jimp = require("jimp");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/users/items/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()+ path.extname(file.originalname))
  }
});

// Check File Type
function checkFileType(file, cb){
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

var upload = multer({
  storage: storage,
  //limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
});

//creates a new item

router.post('/trading/addItem',function(req,res, next){
  var tempTrade = new Trade({
    name:req.body.name,
    description:req.body.description,
    image: {image:"nope"},
    user:req.body.user,
    user_id: req.body.user_id,
    traded: false
  });
  tempTrade.save(function(err,prog){
    if(err){return next(err)}
    res.json({status:"success",code:201,_id:prog._id});
  });
});

router.put("/trading/updateImage/:_id",upload.any(), function(req,res,next) {

    var fileDest;
    if(req.files.length>0){
    fileDest = req.files[0].destination
    }else{
    return res.sendStatus(500);
    }
    fileDest = fileDest.replace("uploads/","");
    var publicDir = __dirname+'/../../uploads/';
    var publicPath = publicDir+fileDest+req.files[0].filename;
    var usersImages = {};
    usersImages.path800 = fileDest + '-reSized-800-item-' + req.files[0].filename;
    usersImages.path400 = fileDest + '-reSized-400-item-' + req.files[0].filename;
    usersImages.path200 = fileDest + '-reSized-200-item-' + req.files[0].filename;

    jimp.read(publicPath, function (err, image) {
        if (err) {throw err;}
        image.resize(800,800)
            .write(publicDir+usersImages.path800,function (err, image){
                image.resize(400,400)
                .write(publicDir+usersImages.path400,function(err,image){
                    image.resize(200,200)
                    .write(publicDir+usersImages.path200,function(err,image){
                        Trade.findByIdAndUpdate({_id:req.params._id},{image:usersImages},function(err,docs){
                          if(err){return next(err)}
                          // deletes original image.
                          fs.unlink(publicPath, (err) => {if(err) console.log(err);});
                          res.json({"created":201,"_id":req.params._id});
                        });
                    });
                });
            });
    });
})

// gets all items
router.get("/trading/getAllItems/", function(req, res, next) {
    Trade.find()
        .exec(function (err,trading){
            res.send(trading);
        })
});

// returns all but user name.
router.get("/trading/getAllItemsBut/:username", function(req,res,next){
    Trade.find({"user":{"$ne":req.params.username}})
        .exec(function (err,trading){
            res.send(trading);
        })
})

// returns all items of the user
router.get("/trading/getItems/:username",function(req,res,next){
  var username = req.params.username;
  Trade.find({"user":username})
  .exec(function(err,user){
    if(err) {return next(err)}
    if(user.length == 0){
      res.send([{"status":"ERROR","description":"Empty number of items"}]);
      return;
    }
    user.unshift({"status": "OK"})
    res.send(user);
  })
})

router.get("/trading/getItemsByUsrID/:user_id", function(req, res, next) {
    var userId = req.params.user_id;
    Trad.find({"user_id":userId})
        .exec(function (err,items) {
            if(err) {return next(err)}
            if(user.length == 0){
              res.send([{"status":"ERROR","description":"Empty number of items"}]);
              return;
            }
            user.unshift({"status": "OK"})
            res.send(user);
        })
})

router.get("/trading/getItems/findOne/:id",function(req,res,next){
  var id = req.params.id;
  Trade.findOne({_id: id})
  .exec(function(err,user){
    if(err) {
      res.json({"error": "oh no."})
      return;
    }
    if(!user){
      res.json({"message":"no user"})
      return;
    }
    res.send(user);
  })
})

// deletes an item by id
router.delete("/trading/deleteItems/:id",function(req,res, next){
  var id = req.params.id;
  Trade.remove({_id: id},function(err,result){
    if(err){
      return res.json({error:"Missing sometig"})
    }
    res.sendStatus(200);
  });
});

// edits an item based on id
router.put("/trading/editItems/:id",function(req,res, next){
  var id = req.params.id;
  Trade.findByIdAndUpdate({_id : id},{
      name:req.body.name,
      description:req.body.description,
      image:["apple","pen"],
    },function(err,docs){
      if(err){return next(err)}
      res.sendStatus(200);
    });
});
// grabs everyones items in city-state.
  router.get("/trading/grabItemByCity-State/:city"+"-"+":state", function (req,res,next) {
      var p_city = req.params.city;
      var p_state = req.params.state;

      var Collection = [];
      var count = 0;
      User.find({"location.city": p_city, "location.state": p_state})
        .exec(function (err,Users) {
            if(!Users || Users.length === 0) {
                res.send([{"status":"ERROR","description":"no users in current location"}]);
                return;
            }

            Collection.push({"status":"OK"});
            for(x in Users) {
                Trade.find({"user_id": Users[x]._id})
                .exec(function (err,Items) {

                    if (Items.length > 0 )
                        Collection.push(Items);

                    count ++;

                    if(count === Users.length)
                        res.send(Collection);
                });
            }
        });
  });

// grabs city,state location items but avoids username.
 router.get("/trading/grabItemByCity-State/avoid-:username/:city"+"-"+":state", function (req,res,next) {
      var p_city = req.params.city;
      var p_state = req.params.state;
      var Collection = [];
      var count = 0;
      User.find({"username":{"$ne":req.params.username},"location.city": p_city, "location.state": p_state})
        .exec(function (err,Users) {
            if(!Users || Users.length === 0) {
                res.send([{"status":"ERROR","description":"no users in current location"}]);
                return;
            }
            Collection.push({"status":"OK"});
            for(x in Users) {
                Trade.find({"user_id": Users[x]._id})
                .exec(function (err,Items) {
                    if (Items.length > 0 )
                        Collection.push(Items);
                    count ++;
                    if(count === Users.length)
                        res.send(Collection);
                });
            }
        });
  });

  router.get("/trading/setTradeTrueById/:_id", function(req, res, next) {
      Trade.findByIdAndUpdate({_id : req.params._id},{ traded:true},function(err,docs){
          if(err){return next(err)}
          res.sendStatus(200);
        });
  });

  router.get("/trading/setTradeFalseById/:_id", function(req, res, next){
     Trade.findByIdAndUpdate({_id: req.params._id},{traded: false},function(err,docs){
         if(err){return next(err)}
         res.sendStatus(200);
     })
  });

module.exports = router;
