var fs = require("fs");
var retry = require("async/retry");
var MIDIFile = require("midifile");
var MIDIPlayer = require("midiplayer");
var SVG = require("svg.js");

const model = require('./model');

var cleanup = () => {};
var init = () => {
  var s;
  while (s = document.getElementsByTagName('svg').item(0))
    s.remove();

  var game = model.state.mode == 0;
  var score = model.state.mode == 1;

  var current_midi = model.scores[model.state.score] || { offset: 0 };
  var offset = current_midi.offset;

  var load_midi = (err, buffer) => {
    var midi = new MIDIFile(err ? undefined : buffer);

    var seq = midi.getMidiEvents().filter(x => x.subtype == 9 && current_midi.trainer(x)).filter((x, i) => !game || i < current_midi.notes);
    var pitches = seq.map(x => x.param1 + offset);
    var low = Math.min(...pitches), high = 96, _high = Math.max(...pitches);
    var t = Math.min(...seq.map(x => x.playTime)) - 600, tmax = Math.max(...seq.map(x => x.playTime));

    var i = 0;
    var playback = midi.getMidiEvents()
      .filter(x => (x.subtype == 9 && x.playTime <= tmax || x.subtype == 8 && x.playTime <= tmax + 3000) && current_midi.playback(x))
      .map(x => { x.param1 += offset; x.playTime -= t + 600; return x; });
    midi.getMidiEvents = () => playback;

    var scale = 20;
    var gap = 4;
    var note = scale - gap * 2;
    var tadj = scale/current_midi.tempo/1000;

    var draw = SVG('drawing').size(Math.max(0, (tmax-t+1000)*tadj, window.outerWidth - 12), Math.max(0, game ? window.outerHeight : (high - low + 12)*7/12*scale));
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
    var words = (current_midi.words || "").split(" ");
    var word = i => /(.*[^-]+)(-)?(.)?|^$/.exec(words.length > i ? words[i] : "");
    var notes = seq.map((x, i) => {
      var p = x.param1+offset;
      var n = p % 12;
      var h = (p - n)*7/12 + degrees[n] - 1;
      var w = word(i);
      var W = draw.plain(w[1] || "");
      x.word = W
        .move((x.playTime - t)*tadj - W.bbox().w/2 + scale/2 - gap, (high - _high - 2)*7/12*scale)
        .font({
          family:   'Helvetica',
          size: 14
        })
        ;
      if (i > 0 && word(i-1)[2]) {
        var l = seq[i-1].word.bbox();
        var r = W.bbox();
        console.log(w[1], l, r);
        draw.line(l.x2 + gap*2, l.cy + 1, r.x - gap*2, l.cy + 1)
          .stroke("black")
      }

      return shapes[n]
        .clone()
        .move((x.playTime - t)*tadj, (high*7/12-h)*scale)
        .fill(colours[n])
        ;
    });

    var mio = require("easymidi");
    var synths = [new mio.Output("synth", true)];

    chordTime = window.outerWidth - scale;
    chord = {};
    anim = new Set();
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
      last_marker = null;
      markers.remove();
      markers = draw.group();
      gamecheck(0);
    };
    var playing = false;
    var gameplayback = () => {
      if (playing)
        return;
      playing = true;
      navigator.requestMIDIAccess().then(function(midiAccess) {
        // Creating player
        var midiPlayer = new MIDIPlayer({
          'outputs': Array.from(midiAccess.outputs.values()).filter(x => x.name == "score" || /^CH|usb|tim.*0/i.exec(x.name))
        });

        // Loading the midiFile instance in the player
        midiPlayer.load(midi);

        // Playing
        midiPlayer.play(function() {
            marker.opacity(1);
            for (var i in chord)
              chord[i].remove();
            chord = {};
            gamereset();
            playing = false;
        });

      }, function() {
          console.log('No midi output');
      });
    };
    //gameplayback();
    var gamecheck = x => {
      if (!game)
        return;
      if (x && x.velocity == 0)
        synths.forEach(synth =>
          synth.send('noteoff', {
            note: x.note,
            velocity: 0,
            channel: 0
          })
        );
      if (state == -1 || state < seq.length && x.velocity > 0 && x.note == seq[state].param1 + offset) {
        if (x) {
          synths.forEach(synth =>
            synth.send('noteon', {
              note: x.note,
              velocity: 127,
              channel: 0
            })
          );

          var w = seq[state].word;
          if (w)
            w.animate(200)
              .scale(1.8)
              .situation.ease = pos => 1-(pos-0.5)*(pos-0.5)*4
              ;

          var note = notes[state];
          note
            .rotate(-20)
            .animate(200)
            .scale(1.8)
            .rotate(40)
            .after(() => note.rotate(0))
            .situation.ease = pos => 1-(pos-0.5)*(pos-0.5)*4
        }

        if (++state == seq.length) {
            if (last_marker) {
            last_marker.fx.stop();
            last_marker.opacity(0.3);
            markers.add(last_marker);
          }
          if (!playing)
            window.setTimeout(() => {
              marker.opacity(0);
              gamereset();
              gameplayback();
            }, 1000);
        } else {
          var x = seq[state];
          chordTime = (x.playTime - t)*tadj;
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

    var usbout = mio.getOutputs().filter(/ /.exec.bind(/^CH|usb/i));
    if (usbout.length) {
      var mo = new mio.Output(usbout[0], false);
      synths.push(mo);
      var usbin = mio.getInputs().filter(/ /.exec.bind(/^CH|usb/i));
      if (usbin.length) {
        var mi = new mio.Input("score", true);
        var mu = new mio.Input(usbin[0], false);
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
        var noteon = x => {
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
            } else {
              if (chord[p])
                chord[p].remove();
              chord[p] = y;
            }
          } else {
            var y = chord[p];
            if (y) {
              y.remove();
              anim.delete(y);
              delete chord[p];
            }
          }
        };
        mi.on('noteon', noteon);
        mu.on('noteon', noteon);
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
  };
  if (current_midi.music)
    retry(
      10,
      cont => fs.readFile(current_midi.music, (err, f) => {
        if (err)
          cont(err);
        else
          cont(
            String.fromCharCode(new DataView(f.buffer, 0, 14).getUint8(0)) == "M" ? null : "No header",
            f.buffer);
      }),
      load_midi);
  else
    load_midi();
};
try {
  Object.assign(model.state, require('./state.json'));
} catch (e) {
}
const Vue = require('vue');
var vm = new Vue({data: model});
vm.$watch('state.mode', init);
vm.$watch('state.score', init);
init();
var change = () => {
  try {
    require('fs').writeFile('./state.json', JSON.stringify(model.state));
    location.reload();
  } catch (e) {
  }
};
vm.$watch('state.mode', change);
vm.$watch('state.score', change);
