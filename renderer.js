var game = true;
var score = false;

var fs = require("fs");
var MIDIFile = require("midifile");
var SVG = require("svg.js");

var midis = [{
  name: "Amazing Grace",
  file: "amazing.mid",
  offset: -1,
  notes: 32
}];

var current_midi = midis[0];
var offset = current_midi.offset;

var midi = new MIDIFile(fs.readFileSync(current_midi.file).buffer);

var seq = midi.getMidiEvents().filter(x => x.subtype == 9 && x.track == 1).filter((x, i) => !game || i < current_midi.notes);
var pitches = seq.map(x => x.param1 + offset);
var low = Math.min(...pitches), high = 96, _high = Math.max(...pitches);
var t = Math.min(...seq.map(x => x.playTime)) - 2000;

var scale = 20;
var gap = 4;
var note = scale - gap * 2;

var draw = SVG('drawing').size((Math.max(...seq.map(x => x.playTime))-t+1000)/900*scale, game ? window.outerHeight : (high - low + 12)*7/12*scale);
var stave = draw.group();

var degrees = [1, 1.5, 2, 2.5, 3, 4, 4.5, 5, 5.5, 6, 6.5, 7];
var colours = ["red", "red", "blue", "blue", "saddlebrown", "lime", "lime", "yellow", "yellow", "darkviolet", "darkviolet", "grey"];
var circle = draw.circle(note).move(-scale, -scale);
circle.stroke({ color: "black", opacity: 0, width: 0 });
var square = draw.rect(note, note).move(-scale, scale);
square.stroke("black");
var shapes = [circle, square, circle, square, circle, circle, square, circle, square, circle, square, circle];

for (var i = low - 11; i <= _high; i++) {
  var p = i;
  var n = p % 12;
  var h = (p - n)*7/12 + degrees[n] - 1;
  if (degrees[i % 12] % 2 == 0 && i > low)
    stave.line(0, (high*7/12-h)*scale+scale/2-gap, 30000, (high*7/12-h)*scale+scale/2-gap).stroke("grey").attr({"style": "z-index: 2"});
  else if ((i % 12) == 0)
    stave.line(0, (high-i)*7/12*scale+scale-gap, 30000, (high-i)*7/12*scale+scale-gap).stroke("black");
}
/*j=1;
for (var i = low; i <= high; i++){
  var p = i;
  var n = p % 12;
  var h = (p - n)*7/12 + degrees[n] - 1;
  shapes[n]
    .clone()
    .move(j++*scale, (high*7/12-h)*scale)
    .fill(colours[n])
}
return*/
seq.map(x => {
  var p = x.param1+offset;
  var n = p % 12;
  var h = (p - n)*7/12 + degrees[n] - 1;
  shapes[n]
    .clone()
    .move((x.playTime - t)/900*scale, (high*7/12-h)*scale)
    .fill(colours[n])
});

var mio = require("easymidi");
var synth = new mio.Output("synth", true);

chordTime = window.outerWidth - scale;
var state = -1;
var marker = draw.group();
var ray = marker.path('M 12 2 H 30 a 1 1 0 0 1 -1 6 L 12 2');
for (var i = 0; i < 18; i++)
  ray.clone()
    .rotate(40*i, 0, 0)
ray.remove();
marker
  .move(-100, -100)
  .fill('orange')
var markers = draw.group();
var last_marker;
var gamereset = () => {
  state = -1;
  markers.remove();
  gamecheck(0);
};
var gamecheck = x => {
  if (!game)
    return;
  if (x && x.velocity == 0)
    synth.send('noteoff', {
      note: x.note,
      velocity: 0,
      channel: 10
    });
  if (state == -1 || x.velocity > 0 && x.note == seq[state].param1 + offset) {
    state = (state + 1) % seq.length;

    if (x)
      synth.send('noteon', {
        note: x.note,
        velocity: 127,
        channel: 10
      });

    var x = seq[state];
    chordTime = (x.playTime - t)/900*scale;
    var p = x.param1 + offset;
    var n = p % 12;
    var h = (p - n)*7/12 + degrees[n] - 1;
    if (last_marker) {
      last_marker.fx.stop();
      last_marker.opacity(0.3);
      markers.add(last_marker);
    }
    last_marker = marker.clone()
      .move(chordTime + scale/2 - gap, (high*7/12-h)*scale + scale/2 - gap)
      ;
    last_marker
      .animate(1000)
      .rotate(360)
      .loop()
      ;
    if (chordTime > window.outerWidth/3)
      window.scrollTo(window.outerWidth/3 - chordTime, 0);
    return true;
  }
};
gamecheck();

if (score && !game) {
  draw = SVG('score').size(window.outerWidth, window.outerHeight);
  circle = draw.circle(note).move(-scale, -scale);
  circle.stroke({ color: "black", opacity: 0, width: 0 });
  square = draw.rect(note, note).move(-scale, scale);
  square.stroke("black");
  shapes = [circle, square, circle, square, circle, circle, square, circle, square, circle, square, circle];
}

var usbout = mio.getOutputs().filter(/ /.exec.bind(/usb/i));
if (usbout.length) {
  var mo = new mio.Output(usbout[0], false);
  var usbin = mio.getInputs().filter(/ /.exec.bind(/usb/i));
  if (usbin.length) {
    var mi = new mio.Input(usbin[0], false);
    chord = {};
    anim = new Set();
    var paused = false;
    var pause = () => {
      anim.forEach(y => {
        if (paused)
          y.dx(scale);
        else
          y.fx.pause();
      });
      paused = true;
    };
    var resume = () => {
      if (paused)
        anim.forEach(y => {
          y.fx.play();
        });
      paused = false;
    };
    mi.on('noteon', x => {
      var p = x.note;
      if (!gamecheck(x) && x.velocity > 0) {
        var n = p % 12;
        var h = (p - n)*7/12 + degrees[n] - 1;
        var y = shapes[n]
          .clone()
          .move(chordTime, (high*7/12-h)*scale)
          .fill(colours[n])
        resume();
        if (score) {
          y
            .animate(100000)
            .x(-5000)
            .after(() => {
              y.remove();
              anim.delete(y);
            })
          anim.add(y);
        } else
          chord[p] = y;
      } else {
        var y = chord[p];
        if (y) {
          y.remove();
          anim.delete(y);
          delete chord[p];
        }
      }
    });
    window.onbeforeunload = function (e) {
      console.log("cleaning up");
      mo.close();
      mi.removeAllListeners();
      mi.close();
    };
    window.onkeypress = e => {
      console.log(e);
      if (e.key == " ") {
        if (game)
          gamereset();
        else
          pause();
      }
      if (e.key == "Enter") {
        resume();
      }
    };
  }
}
console.log("ready");
