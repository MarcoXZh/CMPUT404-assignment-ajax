var canvas = document.getElementById('c');
var host = window.location.host;
var context = canvas.getContext("2d");
var W = canvas.width = window.innerWidth - 6;
var H = canvas.height = window.innerHeight - 50;

function sendJSONXMLHTTPRequest(url, objects, callback) {
  try {
    var xhr = new XMLHttpRequest();
    if (xhr.readyState == 4 && xhr.status == 200) {
      xhr.onreadystatechange = function() {
        //XXX: parse some JSON from the request!
        //XXX: Pass the data to the callback!
      } // xhr.onreadystatechange = function()
    } // if (xhr.readyState == 4 && xhr.status == 200)
    //XXX: POST to a URL
    //XXX: set the mimetype and the accept headers!
    // Remember to use application/json !
  } catch (e) {
    alert('Error: ' + e.name);
  } // try - catch (e)
} // function sendJSONXMLHTTPRequest(url, objects, callback)

world = {};

//XXX: TODO Make this prettier!
function drawCircle(context, entity) {
  context.beginPath();
  context.lineWidth = 3;
  var x = entity['x'], y = entity['y'];
  //context.moveTo(x, y);
  context.fillStyle = entity['colour'];
  context.strokeStyle = context.fillStyle;
  context.arc(x, y, (entity['radius']) ? entity['radius'] : 50, 0, 2.0 * Math.PI, false);
  context.stroke();
} // function drawCircle(context, entity)

function prepEntity(entity) {
  if (!entity['colour'])
    entity['colour'] = '#FF0000';
  if (!entity['radius'])
    entity['radius'] = 50;
  return entity;
}

function clearFrame() {
  context.moveTo(0, 0);
  context.fillStyle = '#000';
  context. fillRect(0, 0, W, H);
} // function clearFrame()

// This actually draws the frame
function renderFrame() {
  clearFrame();
  for (var key in world) {
    var entity = world[key];
    drawCircle(context, prepEntity(entity));
  } // for (var key in world)
} // function renderFrame()

var drawNext = true;

// Signals that there's something to be drawn
function drawNextFrame() {
  drawNext = true;
} // function drawNextFrame()

// This optionally draws the frame, call this if you're not sure if you should update the canvas
function drawFrame() {
  if (drawNext) {
    renderFrame();
    drawNext = false;
  } // if (drawNext)
} // function drawFrame()

// This is unpleasent, canvas clicks are not handled well
// So use this code, it works well on multitouch devices as well.
function getPosition(e) {
  if (e.targetTouches && e.targetTouches.length > 0) {
    var touch = e.targetTouches[0];
    var x = touch.pageX - canvas.offsetLeft;
    var y = touch.pageY - canvas.offsetTop;
    return [x, y];
  } else {
    var rect = e.target.getBoundingClientRect();
    var x = e.offsetX || e.pageX - rect.left - window.scrollX;
    var y = e.offsetY || e.pageY - rect.top  - window.scrollY;
    var x = e.pageX - canvas.offsetLeft;
    var y = e.pageY - canvas.offsetTop;
    return [x, y];
  } // else - if (e.targetTouches && e.targetTouches.length > 0)
} // function getPosition(e)

function addEntity(entity, data) {
  world[entity] = data;
  drawNextFrame(); // (but should we?)
  //XXX: Send a XHTML Request that updates the entity you just modified!
} // function addEntity(entity, data)

var counter = 0;
function addEntityWithoutName(data) {
  //var name = "X" + Math.floor((Math.random() * 100) + 1);
  var name = 'X'+ (counter ++) % 100;
  addEntity(name, data);
} // function addEntityWithoutName(data)

// canvas + mouse/touch is complicated 
// I give you this because well the mouse/touch stuff is a total
// pain to get right. This has some out of context bug too.
mouse = (function() {
  // Now this isn't the most popular way of doing OO in 
  // Javascript, but it relies on lexical scope and I like it
  // This isn't 301 so I'm not totally bound to OO :)
  var self;
  self = {
    clicked: 0,
    // these are listener lists append to them
    mousemovers: [],
    mousedraggers: [],
    mousedowners: [],
    mouseuppers: [],
    callListeners: function(listeners, x, y, clicked, e) {
      for (i in listeners)
        listeners[i](x, y, clicked, e);
    }, // callListeners: function(listeners, x, y, clicked, e)
    wasClicked: function(e) {
      var pos = getPosition(e), x = pos[0], y = pos[1];
      if (x >= 0 && x <= W && y >= 0 && y <= H)
        return 1;
      else
        return 0;
    }, // wasClicked: function(e)
    mousedown: function(e) {
      e.preventDefault();
      if (self.wasClicked(e)) {
        var pos = getPosition(e), x = pos[0], y = pos[1];
        self.clicked = 1;
        self.callListeners(self.mousedowners, x, y, self.clicked, e);
        //addEntityWithoutName({'x':x, 'y':y, 'colour':'red'});
      } // if (self.wasClicked(e))
    }, // mousedown: function(e)
    mouseup: function(e) {
      e.preventDefault();
      //alert(getPosition(e));
      if (self.wasClicked(e)) {
        var pos = getPosition(e), x = pos[0], y = pos[1];
        //self.poppin(x, y);
        self.clicked = 0;
        self.selected = -1;
        self.callListeners(self.mouseuppers, x, y, self.clicked, e);
        //addEntityWithoutName({'x':x, 'y':y, 'colour':'blue'});
      } // if (self.wasClicked(e))
    }, // mouseup: function(e)
    touchstart: function(e) {
      self.lasttouch = e;
      return self.mousedown(e);
    }, // touchstart: function(e)
    touchend: function(e) {
      var touch = (self.lasttouch) ? self.lasttouch : e;
      return self.mouseup(touch);
    }, // touchend: function(e)
    mousemove: function(e) {
      e.preventDefault();
      if (self.wasClicked(e)) {
        var pos = getPosition(e), x = pos[0], y = pos[1];
        if (self.clicked != 0) {
          //self.squeakin(x,y);
          self.callListeners(self.mousedraggers, x, y, self.clicked, e);
        } // if (self.clicked != 0)
        self.callListeners(self.mousemovers, x, y, self.clicked, e);
      } // if (self.wasClicked(e))
    }, // mousemove: function(e)
    touchmove: function(e) {
      self.lasttouch = e;
      return self.mousemove(e);
    }, // touchmove: function(e)
    // Install the mouse listeners
    mouseinstall: function() {
      canvas.addEventListener("mousedown", self.mousedown, false);
      canvas.addEventListener("mousemove", self.mousemove, false);
      canvas.addEventListener("mouseup", self.mouseup, false);
      canvas.addEventListener("mouseout", self.mouseout, false);
      canvas.addEventListener("touchstart", self.touchstart, false);
      canvas.addEventListener("touchmove", self.touchmove, false);
      canvas.addEventListener("touchend", self.touchend, false);
    } // mouseinstall: function()
  };
  // Force install!
  self.mouseinstall();
  return self;
})(); // mouse = (function()

// Add the application specific mouse listeners!
//XXX: TODO Make these prettier!
mouse.mousedowners.push(function(x, y, clicked, e) {
  addEntityWithoutName({'x':x, 'y':y, 'colour':'blue'});
}); // mouse.mousedowners.push(function(x, y, clicked, e) {});

mouse.mouseuppers.push(function(x, y, clicked, e) {
  addEntityWithoutName({'x':x, 'y':y, 'colour':'red'});
}); // mouse.mouseuppers.push(function(x, y, clicked, e) {});

mouse.mousedraggers.push(function(x, y, clicked, e) {
  addEntityWithoutName({'x':x, 'y':y, 'colour':'green', 'radius':10});
}); // mouse.mousedraggers.push(function(x, y, clicked, e) {});

function update() {
  //XXX: TODO Get the world from the webservice using a XMLHTTPRequest
  drawFrame();
} // function update()

// 30 frames per second
setInterval(update, 1000 / 30.0);

