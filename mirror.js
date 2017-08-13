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

var receiverURL = 'wss://' + location.host + ':8080/receiver';
var cursor_img = null;
var msg_list = [];
window.hasloaded = false;

window.addEventListener('DOMContentLoaded', function() {
  clearPage();
  var base;
  
  var createCursor = function() {
    cursor_img = document.createElement("IMG");
    cursor_img.src = "https://getwrinkle.com/cobrowse/img/cursor.png";
    cursor_img.style.position = "absolute";
    cursor_img.style.zIndex = 99999;
    //cursor_img.style.transition = ".01s";
    cursor_img.id = "cursor";
		document.getElementsByTagName('body')[0].appendChild(cursor_img);
  }
  var mirror = new TreeMirror(document, {
    createElement: function(tagName) {
      if (tagName == 'SCRIPT') {
        var node = document.createElement('NO-SCRIPT');
        node.style.display = 'none';
        return node;
      }

      if (tagName == 'HEAD') {
        var node = document.createElement('HEAD');
        node.appendChild(document.createElement('BASE'));
        node.firstChild.href = base;
        return node;
      }
      
      if (tagName == 'BODY') {
        setTimeout(function() { createCursor(); }, 1000);
      }
    }
  });

  var socket = new WebSocket(receiverURL);

  function clearPage() {
    while (document.firstChild) {
      document.removeChild(document.firstChild);
    }
  }
  function handleMessage(msg) {
    if (msg.clear) {
      clearPage();
    } else if (msg.base) {
      base = msg.base;
    } else if (msg.mm) {
      if (cursor_img !== null) {
        cursor_img.style.left = msg.mm[0];
        cursor_img.style.top = msg.mm[1];
      }
    } else if (msg.scroll) {
      window.scrollTo(msg.scroll[0], msg.scroll[1]);
    } else if (msg.dims) {
      if (window.parent.dims !== undefined) window.parent.dims(msg.dims[0], msg.dims[1]);
    } else {
      if (msg.f == "initialize" && window.hasloaded) { location.reload(); }
      mirror[msg.f].apply(mirror, msg.args);
      window.hasloaded = true;
    }
  }

  socket.onmessage = function(event) {
    var msg = JSON.parse(event.data);
    if (msg instanceof Array) {
      msg.forEach(function(subMessage) {
        handleMessage(JSON.parse(subMessage));
      });
    } else {
      handleMessage(msg);
    }
  }

  socket.onclose = function() {
    socket = new WebSocket(receiverURL);
  }
});