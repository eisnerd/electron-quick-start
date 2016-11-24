var fs = require("fs");
var MIDIFile = require("midifile");
var SVG = require("svg.js");

var offset = -1;

var midi = new MIDIFile(fs.readFileSync("a.mid").buffer);

var seq = midi.getMidiEvents().filter(x => x.subtype == 9 && x.track == 1);
var pitches = seq.map(x => x.param1 + offset);
var low = Math.min(...pitches), high = Math.max(...pitches);
var t = Math.min(...seq.map(x => x.playTime)) - 500;

var scale = 20;
var gap = 4;
var note = scale - gap * 2;

var draw = SVG('drawing').size((Math.max(...seq.map(x => x.playTime))-t+1000)/900*scale, (high-low+12)*scale);
var stave = draw.group();

var degrees = [1, 1.5, 2, 2.5, 3, 4, 4.5, 5, 5.5, 6, 6.5, 7];
var colours = ["red", "red", "blue", "blue", "saddlebrown", "lime", "lime", "yellow", "yellow", "darkviolet", "darkviolet", "grey"];
var circle = draw.circle(note).move(-scale, -scale);
circle.stroke({ color: "black", opacity: 0, width: 0 });
var square = draw.rect(note, note).move(-scale, scale);
square.stroke("black");
var shapes = [circle, square, circle, square, circle, circle, square, circle, square, circle, square, circle];

for (var i = low - 11; i <= high; i++) {
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
