var fs = require("fs");
var MIDIFile = require("midifile");
var SVG = require("svg.js");

var offset = -1;

var midi = new MIDIFile(fs.readFileSync("a.mid").buffer);

var seq = midi.getMidiEvents().filter(x => x.subtype == 9 && x.track == 1);
var pitches = seq.map(x => x.param1 + offset);
var m = Math.min(...pitches), n = Math.max(...pitches);
var t = Math.min(...seq.map(x => x.playTime)) - 500;

var scale = 20;
var gap = 4;
var note = scale - gap * 2;

var draw = SVG('drawing').size(30000, (n-m+12)*scale);

var colours = ["red", "red", "blue", "blue", "saddlebrown", "lime", "lime", "yellow", "yellow", "darkviolet", "darkviolet", "grey"];
var circle = draw.circle(note).move(-scale, -scale);
circle.stroke({ color: "black", opacity: 0, width: 0 });
var square = draw.rect(note, note).move(-scale, scale);
square.stroke("black");
var shapes = [circle, square, circle, square, circle, circle, square, circle, square, circle, square, circle];

for (var i = m - 11; i < n; i++)
  if ((i % 12) == 0)
    draw.line(0, (n-i+1)*scale-gap, 30000, (n-i+1)*scale-gap).stroke("black");

seq.map(x =>
  shapes[(x.param1+offset) % 12]
    .clone()
    .move((x.playTime - t)/900*scale, (n-x.param1-offset)*scale)
    .fill(colours[(x.param1+offset) % 12])
);
