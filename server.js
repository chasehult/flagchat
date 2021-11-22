/*
 * Author: Chase Hult
 * Purpose: FlagChat Server
 */

const mongoose = require('mongoose');
const express = require('express');
const parser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const upload = multer({dest: __dirname + '/public_html/uploads/images'});

const app = express();
app.use(parser.json());
app.use(parser.urlencoded({extended: true})); 
app.use(cookieParser());

const port = 80;

const db  = mongoose.connection;
const mongoDBURL = 'mongodb://127.0.0.1/flagchat';

// Some code for tracking the sessions on the server

// map usernames to timestamp
var sessions = {};
const LOGIN_TIME = 10 * 60 * 60;

function filterSessions() {
  var now = Date.now();
  for (x in sessions) {
    username = x;
    time = sessions[x];
    if (time + LOGIN_TIME < now) {
      delete sessions[username];
    }
  }
}

setInterval(filterSessions, 2 * 1000);


// Set up default mongoose connection
mongoose.connect(mongoDBURL, {useNewUrlParser: true});
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Schema = mongoose.Schema;
var Item = new Schema({
  title: String,
  description: String,
  image: String,
  price: Number,
  status: String,
});
var ItemModel = mongoose.model('ItemModel', Item);

var User = new Schema({
  username: String,
  password: String,
  listings: [Schema.Types.ObjectId],
  purchases: [Schema.Types.ObjectId],
});
var UserModel = mongoose.model('UserModel', User);

app.use('/app/*', authenticate);
app.use(express.static('public_html'));
app.get('/', (req, res) => {res.redirect('/app/index.html');});


function authenticate(req, res, next) {
  var c = req.cookies;
  if (c && c.login && JSON.parse(c.login).username in sessions)  {
    sessions[JSON.parse(c.login).username] = Date.now();
    next();
  } else {
    res.redirect('/login/index.html');
  }
}

// CRUD
app.get('/get/users', function(req, res) {
  UserModel.
  find()
  .exec(function(err, data) {
    if (err) {console.log(err); return;}
    res.end(JSON.stringify(data));
  });
});

app.get('/get/items', function(req, res) {
  ItemModel.
  find()
  .exec(function(err, data) {
    if (err) {console.log(err); return;}
    res.end(JSON.stringify(data));
  });
});

app.get('/get/users/:keyword', function(req, res) {
  UserModel.
  find({username: {$regex: `.*${req.params.keyword}.*`}})
  .exec(function(err, data) {
    if (err) {console.log(err); return;}
    res.end(JSON.stringify(data));
  });
});

app.get('/get/items/:keyword', function(req, res) {
  ItemModel.
  find({description: {$regex: `.*${req.params.keyword}.*`}})
  .exec(function(err, data) {
    if (err) {console.log(err); return;}
    res.end(JSON.stringify(data));
  });
});

app.get('/get/listings/:username', function(req, res) {
  UserModel.
  findOne({username: req.params.username})
  .exec(function(err, data) {
    if (err) {console.log(err); return;}
    ItemModel.
    find({_id: {$in: data.listings}})
    .exec(function(err, data) {
      if (err) {console.log(err); return;}
      res.end(JSON.stringify(data));
    });
  });
});

app.get('/get/purchases/:username', function(req, res) {
  UserModel.
  findOne({username: req.params.username})
  .exec(function(err, data) {
    if (err) {console.log(err); return;}
    ItemModel.
    find({_id: {$in: data.purchases}})
    .exec(function(err, data) {
      if (err) {console.log(err); return;}
      res.end(JSON.stringify(data));
    });
  });
});

app.post('/purchase', function(req, res) {
  UserModel.updateMany(
    {username: req.body.username}, 
    {$push: {purchases: req.body.itemId}},
    function(err, data) {
      if (err) {console.log(err); return;}
    }
  );
  ItemModel.updateMany(
    {_id: req.body.itemId}, 
    {$set: {status: "SOLD"}},
    function(err, data) {
      if (err) {console.log(err); return;}
    }
  );
  res.end("SUCCESS")
});

app.post('/add/user', function(req, res) {
  UserModel.create({
    username: req.body.username,
    password: req.body.password,
    listings: [],
    purchases: [],
  });
  res.end('SUCCESS');
});

app.post('/login', (req, res) => {
  UserModel.find({username: req.body.username, password: req.body.password})
    .exec( function (err, results) {
      if (err || results.length == 0) { 
        return res.end('failed to login');
      } else {
        sessions[req.body.username] = Date.now();
        res.cookie("login", JSON.stringify({username: req.body.username}), {maxAge: 120000});
        res.end('LOGIN');
      }
    });
});

app.post('/add/item/:username', function(req, res) {
  item = ItemModel.create({
    title: req.body.title,
    description: req.body.description,
    image: req.body.image,
    price: req.body.price,
    status: req.body.status,
  }, function (err, data) {
    if (err) {console.log(err); return;}
    UserModel.updateMany(
      {username: req.params.username}, 
      {$push: {listings: data._id}},
      function(err, data) {
        if (err) {console.log(err); return;}
      }
    );
  });
  res.end('OK');
});

app.post('/upload', upload.single('photo'), (req, res) => {
    if(req.file) {res.json(req.file);}
    else throw 'error';
});

app.listen(port, () => 
  console.log(`App listening at port ${port}`)
);
