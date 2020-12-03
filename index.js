var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat', (req, res) => {
  res.sendFile(__dirname + "/chat.html");
});

io.on('connection', (socket) => {
  try {
    if(!fs.existsSync("./chat_logs")) {
      fs.mkdirSync("./chat_logs");
    }
  } catch (err) {
    console.log(err);
  }

  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
  socket.on('chat message', (code, msg, user) => {
    var date = new Date();

    fs.readFile("./chat_logs/" + code + ".json", 'utf8', function(err, data) {
      if(err) console.error(err);

      let json = JSON.parse(data); 

      let message = {
        author: user,
        datePosted: date,
        content: msg
      };

      json.messages[Object.keys(json.messages).length + 1] = message;

      var file = fs.createWriteStream("./chat_logs/" + code + ".json");
      file.write(JSON.stringify(json));
      file.end();

      io.emit('logged in', code, user, "");
    });
    io.emit('chat message', code, user, msg, date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + " ob " + date.getHours() + ":" + date.getMinutes());
  });
  socket.on('login', (code, user) => {
    let json = {
      users: [user],
      createdOn: new Date(),
      messages: {

      }
    }
    if(code.trim() === "") {
      let fileExists = true;
      while(fileExists) {
        code = "";
        for(var i = 0; i < 6; i++) {
          code += Math.floor(Math.random() * 10)
        }

        try {
            if(!fs.existsSync("./chat_logs/" + code + ".json")) {
              fileExists = false;
              var file = fs.createWriteStream("./chat_logs/" + code + ".json");
              file.write(JSON.stringify(json));

              file.end();
            }
        } catch (err) {
            console.error(err);
        }
      }

      io.emit('logged in', code, user, "");
    } else {
      try {
        if(!fs.existsSync("./chat_logs/" + code + ".json")) {
          io.emit('logged in', code, user, "Soba s to kodo ne obstaja.");
        } else {
          fs.readFile("./chat_logs/" + code + ".json", 'utf8', function(err, data) {
            if(err) console.error(err);

            json = JSON.parse(data); 

            if(!json.users.includes(user)) {
              json.users.push(user);
            }

            var file = fs.createWriteStream("./chat_logs/" + code + ".json");
            file.write(JSON.stringify(json));
            file.end();

            io.emit('logged in', code, user, "");
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  })
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});