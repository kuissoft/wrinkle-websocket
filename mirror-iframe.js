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

window.addEventListener('DOMContentLoaded', function() {
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    
    iframe.src = 'javascript:void((function(){var script = document.createElement(\'script\');' +
      'script.innerHTML = "(function() {' +
      'document.open();document.domain=\'' + document.domain +
      '\';document.close();})();";' +
      'document.write("<head>" + script.outerHTML + "</head><body></body>");})())';
    
    var iframeDocument = iframe.contentWindow.document;
    iframeDocument.write('<div>Loading...</div>');

  var base;
  
  var createCursor = function() {
    cursor_img = iframeDocument.createElement("IMG");
    cursor_img.src = "https://getwrinkle.com/cobrowse/img/cursor.png";
    cursor_img.style.position = "absolute";
    cursor_img.style.zIndex = 99999;
    //cursor_img.style.transition = ".01s";
    cursor_img.id = "cursor";
		iframeDocument.getElementsByTagName('body')[0].appendChild(cursor_img);
  }
  var mirror = new TreeMirror(iframe, {
    createElement: function(tagName) {
      if (tagName == 'SCRIPT') {
        var node = iframeDocument.createElement('NO-SCRIPT');
        node.style.display = 'none';
        return node;
      }

      if (tagName == 'HEAD') {
        var node = iframeDocument.createElement('HEAD');
        node.appendChild(iframeDocument.createElement('BASE'));
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
    while (iframeDocument.firstChild) {
      iframeDocument.removeChild(iframeDocument.firstChild);
    }
  }

  function handleMessage(msg) {
    if (msg.clear) {
      clearPage();
    } else if (msg.base) {
      base = msg.base;
    } else if (msg.mm) {
      cursor_img.style.left = msg.mm[0];
      cursor_img.style.top = msg.mm[1];
    } else if (msg.scroll) {
      iframeDocument.scrollTo(msg.scroll[0], msg.scroll[1]);
    } else {
      mirror[msg.f].apply(mirror, msg.args);
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