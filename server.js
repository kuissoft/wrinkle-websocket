// Copyright 2012 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var WebSocket = require('faye-websocket'),
    // deflate   = require('permessage-deflate'),
    fs        = require('fs'),
    http      = require('http'),
    https     = require('https');

var port    = process.argv[2] || 8080,
    secure  = true; // process.argv[3] === 'tls',
    // options = {extensions: [deflate], ping: 5};

var messages = [];
var receivers = [];
var projector;

var upgradeHandler = function(request, rawsocket, head) {
  debugger;
  var socket = new WebSocket(request, rawsocket, head);

  // Projector.
  if (request.url == '/projector') {
    debugger;
    console.log('projector connection initiating.');

    if (projector) {
      console.log('closing existing projector. setting messages to 0');
      projector.close();
      messages.length = 0;
    }

    projector = socket;

    messages.push(JSON.stringify({ clear: true }));

    receivers.forEach(function(socket) {
      socket.send(messages[0]);
    });


    socket.onmessage = function(event) {
      console.log('message received. now at ' + messages.length + ' . sending to ' + receivers.length);
      receivers.forEach(function(receiver) {
        receiver.send(event.data);
      });

      messages.push(event.data);
    };

    socket.onclose = function() {
      console.log('projector closing, clearing messages');
      messages.length = 0;
      receivers.forEach(function(socket) {
        socket.send(JSON.stringify({ clear: true }));
      });

      projector = undefined;
    }

    console.log('projector open completed.')
    return;
  }

  // Receivers.
  if (request.url == '/receiver') {
    debugger;
    receivers.push(socket);

    console.log('receiver opened. now at ' + receivers.length + ' sending ' + messages.length + ' messages');
    socket.send(JSON.stringify(messages));


    socket.onclose = function() {
      var index = receivers.indexOf(socket);
      receivers.splice(index, 1);
      console.log('receiver closed. now at ' + receivers.length);
    }
  }
}

var server = secure
           ? https.createServer({
              key: fs.readFileSync('/etc/letsencrypt/live/getwrinkle.com/privkey.pem'),
              cert: fs.readFileSync('/etc/letsencrypt/live/getwrinkle.com/fullchain.pem')
             })
           : http.createServer();

server.on('upgrade', upgradeHandler);
server.listen(port);