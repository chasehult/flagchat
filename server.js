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
const md5 = require("md5");

const app = express();
app.use(parser.json());
app.use(parser.urlencoded({extended: true})); 
app.use(cookieParser());

const port = 80;

// Set up MongoDB
mongoose.connect('mongodb://127.0.0.1/flagchat', {useNewUrlParser: true});
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

var ObjectId = mongoose.Schema.ObjectId
var User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String,  // Salted MD5 hash (md5(username+'&&&'+password))
  following: [ObjectId],  // User
  picture: String,  // or NULL
}));
var Post = mongoose.model('Post', new mongoose.Schema({
  content: String,
  poster: ObjectId,  // User
  reply: ObjectId,  // Post (or NULL)
  likes: [ObjectId],  // User
  timestamp: Date,
}));
var Message = mongoose.model('Message', new mongoose.Schema({
  content: String,
  poster: ObjectId,  // User
  receiver: ObjectId,  // User
  timestamp: Date,
}));

// Login and authentification
var sessions = {};
function filterSessions() {
  var now = Date.now();
  for (x in sessions) {
    username = x;  // TODO: Find out if this is necessary?
    time = sessions[x];
    if (time + 10 * 60 * 1000 < now) {
      delete sessions[username];
    }
  }
}
setInterval(filterSessions, 2 * 1000);

function authenticate(req, res, next) {
  var c = req.cookies;
  if (c && c.login && JSON.parse(c.login).username in sessions)  {
    sessions[JSON.parse(c.login).username] = Date.now();
    next();
  } else {
    res.redirect('/login/login.html');
  }
}

app.post('/post/login', (req, res) => {
  User.find({username: req.body.username, password: md5(req.body.username+'&&&'+req.body.password)})
  .exec( function (err, results) {
    if (err || results.length == 0) { 
      return res.end('Failed to login');
    } else {
      sessions[req.body.username] = Date.now();
      res.cookie("login", JSON.stringify({username: req.body.username}), {maxAge: 10 * 60 * 1000});
      res.end('LOGIN');
    }
  });
});

app.use('/app/*', authenticate);

// Set up routes
app.use(express.static('public_html'));
app.get('/', (req, res) => {res.redirect('/app/index.html');});

// CRUD
// Create
app.post('/post/signup', function(req, res) {
  User.find({username: req.body.username})
  .exec(function (err, results) {
    if (err || results.length == 0) { 
      User.create({
        username: req.body.username,
        password: md5(req.body.username+'&&&'+req.body.password)
      });
      res.end('OK');
    } else {
      res.status(409).send({error: 'Username already taken.'});
    }
  });
});

app.post('/post/post', function(req, res) {
  User.findOne({username: req.body.poster})
  .exec(function (err, user) {
    if (err) {console.error(err); return res.status(500).send(err);}
    Post.create({
      content: req.body.content,
      poster: user._id,
      reply: undefined,
      likes: [],
      timestamp: Date.now(),
    });
    res.end('OK');
  });
});

app.post('/post/reply', function(req, res) {
  User.findOne({username: req.body.poster})
  .exec(function (err, user) {
    if (err) {console.error(err); return res.status(500).send(err);}
    Post.create({
      content: req.body.content,
      poster: user._id,
      // This is bad if someone *tries* to break it, but we shoudln't need to validate parent.
      reply: mongoose.Types.ObjectId(req.body.parent),  
      likes: [],
      timestamp: Date.now(),
    });
    res.end('OK');
  });
});

app.post('/post/chat', function(req, res) {
  User.findOne({username: req.body.from})
  .exec(function (err, fromUser) {
    if (err) {console.error(err); return res.status(500).send(err);}
    User.findOne({username: req.body.to})
    .exec(function (err, toUser) {
      if (err) {console.error(err); return res.status(500).send(err);}
      if (toUser == null) {return res.status(400).send("Invalid user.");}
      Message.create({
        content: req.body.content,
        poster: fromUser._id,
        receiver: toUser._id,
        timestamp: Date.now(),
      });
      res.end('OK');
    });
  });
});

app.post('/upload', upload.single('photo'), (req, res) => {
    if(req.file) {res.json(req.file);}
    else throw 'error';
});


// Read
app.get('/get/username/:userId', function(req, res) {
  User.findOne({_id: req.params.userId})
  .exec(function(err, user) {
    if (err) {console.error(err); return res.status(500).send(err);}
    res.send(user.username);
  });
});

app.get('/get/feed/:username', function(req, res) {
  User.findOne({username: req.params.username})
  .exec(function(err, user) {
    if (err) {console.error(err); return res.status(500).send(err);}
    User.find({$or: [{_id: {$in: user.following}}, {username: req.params.username}]})
    .exec(function(err, followees) {
      if (err) {console.error(err); return res.status(500).send(err);}
      Post.find({poster: {$in: followees.map(u => u._id)}})
      .exec(function(err, posts) {
        if (err) {console.error(err); return res.status(500).send(err);} 
        res.send(posts);
      });
    });
  });
});

app.get('/get/posts/:username', function (req, res) {
  User.findOne({ username: req.params.username })
  .exec(function (err, user) {
    if (err) { console.error(err); return res.status(500).send(err); }
    Post.find({ poster: user._id })
    .exec(function (err, posts) {
      if (err) { console.error(err); return res.status(500).send(err); }
      res.send(posts);
    });
  });
});

app.get('/get/replies/:postId', function(req, res) {
  Post.findOne({_id: req.params.postId})
  .exec(function(err, parent) {
    if (err) {console.error(err); return res.status(500).send(err);}
    Post.find({parent: parent._id})
    .exec(function(err, replies) {
      if (err) {console.error(err); return res.status(500).send(err);}
      res.send(replies);
    });
  });
});

app.get('/get/dms/:user1/:user2', function(req, res) {
  User.findOne({username: req.params.user1})
  .exec(function(err, user1) {
    if (err) {console.error(err); return res.status(500).send(err);}
    User.findOne({username: req.params.user2})
    .exec(function(err, user2) {
      if (err) {console.error(err); return res.status(500).send(err);}
      if (user1 == null || user2 == null) {return res.status(400).send("Invalid user.");}
      Message.find({$or: [{poster: user1._id, receiver: user2._id},
                          {poster: user2._id, receiver: user1._id}]})
      .exec(function(err, messages) {
        if (err) {console.error(err); return res.status(500).send(err);} 
        res.send(messages);
      });
    });
  });
});

app.get('/get/dms/:user', function (req, res) {
  User.findOne({ username: req.params.user })
  .exec(function (err, user) {
    if (err) { console.error(err); return res.status(500).send(err); }
    Message.find({ $or: [{ poster: user._id }, { receiver: user._id }] })
    .exec(function (err, messages) {
      if (err) { console.error(err); return res.status(500).send(err); }
      User.find({ _id: { $in: messages.map(m => [m.poster, m.receiver]).flat() } })
      .exec(function (err, users) {
        if (err) { console.error(err); return res.status(500).send(err); }
        res.send(users.filter(u => u.username != req.params.user));
      })
    });
  });
});

app.get('/get/pfp/:username', function(req, res) {
  User.findOne({username: req.params.username})
  .exec(function(err, user) {
    if (err) {console.error(err); return res.status(500).send(err);}
    if (user.picture == null) {return res.status(400).send(err);}
    res.send(user.picture);
  });
});


// Update
app.post('/post/follow', function(req, res) {
  User.findOne({username: req.body.follower})
  .exec(function(err, user) {
    if (err) {console.error(err); return res.status(500).send(err);}
    User.updateOne(
      {username: req.body.followee}, 
      {$push: {following: user._id}},
      function(err, data) {
        if (err) {console.error(err); return res.status(500).send(err);}
        res.end("OK");
      }
    );
  });
});

app.post('/post/like', function(req, res) {
  User.findOne({username: req.body.username})
  .exec(function(err, user) {
    if (err) {console.error(err); return res.status(500).send(err);}
    Post.updateOne(
      {_id: mongoose.Types.ObjectId(req.body.post)}, 
      {$push: {likes: user._id}},
      function(err, data) {
        if (err) {console.error(err); return res.status(500).send(err);}
        res.end("OK");
      }
    );
  });
});

app.post('/post/pfp', function(req, res) {
  User.updateOne(
  	{username: req.body.username},
    {$set: {picture: req.body.filename}},
    function(err, data) {
      if (err) {console.error(err); return res.status(500).send(err);}
      res.end("OK");
    }
  );
});


//Path that fetches the user's posts for profile page


// Delete


// Start Server
app.listen(port, () => console.log(`App listening at port ${port}`));