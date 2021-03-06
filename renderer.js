var fs = require("fs");
var retry = require("async/retry");
var MIDIFile = require("midifile");
var MIDIPlayer = require("midiplayer");
var SVG = require("svg.js");
var gs = require("gsap");
require("gsap/src/uncompressed/plugins/ScrollToPlugin.js");
window.scroller = gs.to(window, 1, {scrollTo: {x: 0}});

const model = require('./model');

var cleanup = () => {};
var init = () => {
  var s;
  while (s = document.getElementsByTagName('svg').item(0))
    s.remove();

  var game = model.state.mode - 1;
  var score = model.state.mode == 1;
  let book = game == 2 ? model.exercises : model.scores;
  if (game == 2) // Excercises use song mode
    game = -1;

  var current_midi = book[Math.min(book.length - 1, model.state.score)] || {};
  let True = () => true;
  current_midi.trainer = current_midi.trainer || True;
  current_midi.playback = current_midi.playback || True;
  current_midi.tempo = current_midi.tempo || 0.15;
  var offset = current_midi.offset || 0;

  var load_midi = (err, buffer) => {
    var midi = new MIDIFile(err ? undefined : buffer);

    var lastnoteon = {};
    var events = () => midi.getMidiEvents().map(x => {
      if (x.subtype == 9) {
        lastnoteon[x.param1] = x;
      } else if (x.subtype == 8) {
        var y = lastnoteon[x.param1];
        if (y) {
          x.noteoff = x;
          y.duration = x.playTime - y.playTime;
        }
      }
      return x;
    });

    seq = events().filter(x => x.subtype == 9 && current_midi.trainer(x)).filter((x, i) => !game || !current_midi.notes || i < current_midi.notes);
    var pitches = seq.map(x => x.param1 + offset);
    var low = Math.min(...pitches), _high = Math.max(...pitches), high = Math.max(96, _high);
    var t = Math.min(...seq.map(x => x.playTime)) - 600, tmax = Math.max(...seq.map(x => x.playTime)), toffmax = tmax;

    var i = 0;
    var playback = events()
      .filter(x => (x.subtype == 9 && x.playTime <= tmax && (toffmax = Math.max(toffmax, x.playTime + (x.duration || 0))) || x.subtype == 8 && x.playTime <= toffmax) && current_midi.playback(x))
      .map(x => { x.param1 += offset; x.playTime -= t + 600; return x; });
    midi.getMidiEvents = () => playback;

    var chord_threshold = current_midi.chord_threshold || 0;
    var any_chords = false;
    if (seq.length > 0) {
      var chord = [];
      var lastTime = seq[0].playTime + chord_threshold;
      seq.map(x => {
        if (x.playTime > lastTime) {
          if (chord.length > 1)
            any_chords = true;
          chord = [];
          lastTime = x.playTime + chord_threshold;
        }
        chord.push(x);
        x.chord = chord;
      });
      /*seq.map((x, i) => {
        if (x.chord.length == 1) {
          console.log(x.note, seq[i-1].playTime, seq[i].playTime, seq[i+1].playTime);
        }
        if (x.chord.length > 2) {
          console.log(x.chord.map(x => x.param1 + "@" + x.playTime));
        }
      });*/
    }
    var song_note_coalesce = any_chords? 1000 : 12;

    var scale = 20;
    var gap = 4;
    var note = scale - gap * 2;
    var tadj = scale/current_midi.tempo/1000;

    var draw = SVG('drawing').size(Math.max(0, (tmax-t+1000)*tadj || 0, window.outerWidth - 12), Math.max(0, window.outerHeight - 60, (high - low + 12)*7/12*scale || 0));
    var stave = draw.group();

    var degrees = [1, 1.5, 2, 2.5, 3, 4, 4.5, 5, 5.5, 6, 6.5, 7];
    var colours = ["red", "red", "cornflowerblue", "cornflowerblue", "saddlebrown", "lime", "lime", "yellow", "yellow", "darkviolet", "darkviolet", "grey"];
    var circle = draw.circle(note).move(-scale, -scale);
    circle.stroke({ color: "black", opacity: 0, width: 0 });
    var square = draw.rect(note, note).move(-scale, scale);
    square.stroke("black");
    var shapes = [circle, square, circle, square, circle, circle, square, circle, square, circle, square, circle];

    for (var i = low - 11; i <= _high; i++) {
      var p = i;
      var n = p % 12;
      var h = (p - n)*7/12 + degrees[n] - 1;
      if (degrees[i % 12] % 2 == 0 && i > low - (low % 12))
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
    var fingering = current_midi.fingering || "";
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

      if (i > 0) {
        var l = seq[i-1].word.bbox();
        var r = W.bbox();
        if (r.x - l.x2 <= 2 && l.y2 == r.y2) {
          W.dy(12);
          r = W.bbox();
        }
        if (word(i-1)[2]) {
          console.log(w[1], l, r);
          var g = r.x - l.x2 > gap * 6 ? gap * 2 : r.x - l.x2 > gap * 4 ? gap : gap / 2;
          draw.line(l.x2 + g, l.cy + 1, l.y2 == r.y2 ? r.x - g : l.x2 + g + gap * 2, l.cy + 1)
            .stroke("black")
        }
      }

      var shown = game > 0 ? 0 : 1;

      const interval_colours = ["blue", "red", "magenta", "green", "green", "blue", "red", "blue", "green", "green", "magenta", "red"]
      if (x.chord && x.chord.length > 1 && !x.chord.intervals) {
        x.chord.intervals = [];
        x.chord.sort((a,b) => a.param1 - b.param1);
        for (var j = 1; j < x.chord.length; j++) {
          var a = x.chord[j - 1], b = x.chord[j];
          var d = b.param1 - a.param1;
          var W = draw.plain((d % 12) + "'".repeat(d / 12));
          var r = W.bbox();
          x.chord.intervals.push(W);
          W
            .font({
              family:   'Helvetica',
              size: 12
            })
            .fill(interval_colours[d % 12])
            .opacity(model.state.show_fingering? 0 : shown)
            .move((x.playTime - t)*tadj - r.w/2 + scale/2, (high - a.param1 - offset - d / 2)*7/12*scale + r.h/4)
            ;
        }
      }
      x.intervals = x.chord? x.chord.intervals : [];

      W = draw.plain(fingering[i] || "")
        .font({
          family:   'Helvetica',
          size: 12
        })
        ;
      x.fingering = W
        .opacity(model.state.show_fingering? shown : 0)
        .move((x.playTime - t)*tadj - W.bbox().w + scale/2 - gap*3, (high*7/12-h)*scale - W.bbox().h/2 + shapes[n].bbox().h/2)
        ;

      return x.shape = shapes[n]
        .clone()
        .opacity(shown)
        .move((x.playTime - t)*tadj, (high*7/12-h)*scale)
        .fill(colours[n])
        ;
    });

    var mio = require("easymidi");
    var synths = [];//new mio.Output("synth", true)];

    chordTime = window.outerWidth - scale;
    chord = {};
    anim = new Set();
    var state = -1;
    var simon = {
      playthrough: false,
      length: current_midi.simon_start || 1
    };
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
    var last_markers = draw.set();
    var gamereset = () => {
      state = -1;
      last_markers.each(function() {
        this.remove();
      });
      last_markers.clear();
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
          console.log(Array.from(midiAccess.outputs.values()));
        // Creating player
        var midiPlayer = new MIDIPlayer({
          'outputs': Array.from(midiAccess.outputs.values()).filter(x => x.name == "score" || /^CH|usb|tim.*0|zyn|yoshimiX|midi thr/i.exec(x.name))
        });

        // Loading the midiFile instance in the player
        midiPlayer.load(midi);
console.log("loaded");
        // Playing
        midiPlayer.play(function() {
console.log("played");
            marker.opacity(1);
            for (var i in chord)
              chord[i].remove();
            chord = {};
            simon.playthrough = false;
	    playing = false;
            gamereset();
        });

      }, function() {
          console.log('No midi output');
      });
    };
    //gameplayback();
    var echo = true;
    var noteon;
    var synthchord = {};
    var gamechord = {};
    var simon_next = function() {
      let incr = current_midi.simon_increment || 1;
      var next_note = seq[simon.length].param1;
      for (var i = 1; i < incr + 3 /* max incr even for repeated notes */; i++)
         if (++simon.length < notes.length) {
            if (next_note != seq[simon.length].param1)
              next_note = undefined;
            if (i >= incr && next_note === undefined)
              break;
         }
    }
    var gamecheck = x => {
      console.log(state, game, simon.playthrough, simon.length, playing);
      if (!game || !seq.length)
        return;

      let note_coalesce = playing? 1000 : song_note_coalesce;

      if (state == -1 && game > 0 && !simon.playthrough) {
        game = -1;
        simon.playthrough = true;
        simon_next();
        seq.map((x, i) => {
          var shown = i < simon.length ? 1 : 0;
          x.shape.opacity(shown);
          x.intervals.forEach(x => x.opacity(model.state.show_fingering? 0 : shown));
          x.fingering.opacity(model.state.show_fingering? shown : 0);
        });
        var startTime = seq[0].playTime - 1000;
        var endTime;
        for (var i = 0; i < simon.length; i++) {
          setTimeout(x => {
            noteon({
              note: x.param1 + offset,
              velocity: x.param2
            });
          }, seq[i].playTime - startTime, seq[i]);
          setTimeout(x => {
            noteon({
              note: x.param1 + offset,
              velocity: 0
            });
          }, endTime = seq[i].playTime + (seq[i].duration || 500) - startTime, seq[i]);
          console.log(endTime);
        }
        setTimeout(() => {
          game = 1;
          gamereset();
          console.log("end playthrough");
          simon.playthrough = false;
          seq.forEach(x => {
            x.fingering.opacity(0);
            x.intervals.forEach(x => x.opacity(0));
            x.shape.opacity(0);
          });
        }, endTime + (simon.length <= (current_midi.simon_start || 1) + (current_midi.simon_increment || 1) ? 1500 : 500));
      }

      if (x) {
        if (x.velocity == 0) {
          delete gamechord[x.note%note_coalesce];
          delete synthchord[x.note];
          console.log('relaying note stop ' + x.note);
          synths.forEach(synth =>
            synth.send('noteoff', {
              note: x.note,
              velocity: 0,
              channel: 0
            })
          );
        } else
          gamechord[x.note%note_coalesce] = true;
      }

      var N = 1;
      console.log(x);
      if (playing && x.channel != 0)
        return true;
      if (state == -1 || state < seq.length && x.velocity > 0 && ((N = seq[state].chord.length) == 1 || Object.keys(gamechord).length >= N) && seq[state].chord.every((x, i) => gamechord[(x.param1 + offset)%note_coalesce])) {
        gamechord = {};
        if (x) {
          if (synthchord[x.note]) {
            console.log('stopping synthchord note ' + x.note);
            /*synths.forEach(synth =>
              synth.send('noteoff', {
                note: x.note,
                velocity: 0,
                channel: 0
              })
            );*/
          }

          synthchord[x.note] = true;
          if (echo && !playing)
          synths.forEach(synth =>
            synth.send('noteon', {
              note: x.note,
              velocity: Math.max(80, Math.min(127, 30 + x.velocity * 1.2)),
              channel: 0
            })
          );

          var w = seq[state].word;
          if (w)
            gs.to(w.node, 0.1, {scale: 1.8, transformOrigin: "center", yoyo: true, repeat: 1});
            /*w.animate(200)
              .scale(1.8)
              .situation.ease = pos => 1-(pos-0.5)*(pos-0.5)*4
              ;*/

          var note = notes[state];
          if (game > 0) {
            note.opacity(1);
            if (model.state.show_fingering)
              seq[state].fingering.opacity(1);
            else
              seq[state].intervals.forEach(x => x.opacity(1));
          }
          gs.fromTo(note.node, 0.1, {rotation: -20, scale: 1}, { rotation: 20, scale: 1.8, transformOrigin: "center", yoyo: true, repeat: 1, clearProps: "rotation" });
          /*note
            .rotate(-20)
            .animate(200)
            .scale(1.8)
            .rotate(40)
            .after(() => note.rotate(0))
            .situation.ease = pos => 1-(pos-0.5)*(pos-0.5)*4*/
        }

        state += N;
        if (state >= seq.length) {
          last_markers.each(function() {
            if (this.fx)
              this.fx.pause();
            this.opacity(0.3);
            markers.add(this);
          });
          if (!playing && !simon.playthrough)
            window.setTimeout(() => {
              marker.opacity(0);
              simon.playthrough = game > 0;
              gamereset();
              console.log("end game");
              simon.length = 0;
              gameplayback();
            }, 1000);
        } else {
          last_markers.each(function() {
            //if (this.fx)
              //this.fx.pause();
            //this.opacity(0.3);
            markers.add(this
              .clone()
              .opacity(0.3)
            );
          });

          chordTime = (seq[state].playTime - t)*tadj;
          if (seq[state].chord.length > 1) {
            var c = draw.set();
            seq[state].chord.map(x => {
              return c.add(x.shape);
            });
            var b = c.bbox();
            last_markers.add(
              draw.rect(b.width + gap*2, b.height + gap*2)
                .opacity(game > 0 ? 0 : 1)
                .move(b.x - gap, b.y - gap)
                .radius(scale/2.5)
                .fill('none')
                .stroke({ color: 'orange', width: 2 })
            );
          } else
            seq[state].chord.map((x, i) => {
              var p = x.param1 + offset;
              var n = p % 12;
              var h = (p - n)*7/12 + degrees[n] - 1;
              var last_marker = last_markers.members.length <= i ? marker.clone() : last_markers.members[i];
              last_marker
                  .opacity(game > 0 || simon.playthrough && state >= simon.length ? 0 : 1)
                  ;
              if (last_marker.fx)
                gs.to(last_marker.node, 0.1, {x: chordTime + scale/2 - gap, y: (high*7/12-h)*scale + scale/2 - gap});
              else {
                last_marker
                  .move(chordTime + scale/2 - gap, (high*7/12-h)*scale + scale/2 - gap)
                  ;
                  last_marker.fx = gs.to(last_marker.node, 1.5, {rotation: 360, transformOrigin: "center", repeat: -1, ease: gs.Linear.easeIn});
                /*last_marker
                  .animate(1000)
                  .rotate(360)
                  .loop()
                  ;*/
                last_markers.add(last_marker);
              }
            });

          window.scroller.kill();
          window.scroller = gs.to(window, 1, {scrollTo: {x: chordTime - window.outerWidth/3, y: Math.min(last_markers.bbox().y - scale*3, last_markers.bbox().y2 + scale*3 - window.outerHeight)}});
        }

        if (game > 0 && !simon.playthrough && state == simon.length && state < seq.length) {
          setTimeout(() => {
            simon.playthrough = true;
            gamereset();
            console.log("end simon");
            simon.playthrough = false;
            gamereset();
          }, 1000);
        }

        return true;
      } else if (echo && !playing)
        synths.forEach(synth =>
          synth.send('noteon', {
            note: x.note,
            velocity: x.velocity,
            channel: 1
          })
        );
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

    var usbout = mio.getOutputs().filter(/ /.exec.bind(/^CH|usb|tim.*0|zyn|yoshimiX|midi thr/i));
    if (usbout.length) {
      var mo = new mio.Output(usbout[0], false);
      synths.push(mo);
      mo.sendAllChannels = (m, data) => {
        var d = Object.assign({}, data);
        for (var i = 0; i < 10; i++) {
          d.channel = i;
          mo.send(m, d);
        }
      };
      mo.sendNotesOff = () =>
        mo.sendAllChannels('cc', {
          controller: 123,
          value: 0
        });
      mo.sendNotesOff();

        var mi = new mio.Input("score", true);
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
        noteon = x => {
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
              gs.to(y.node, 100, {x: -5000});
              /*y
                .animate(100000)
                .x(-5000)
                .after(() => {
                  y.remove();
                  anim.delete(y);
                })*/
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
        var usbin, mu, lastPhysical, hookup = () => {
          console.log(mio.getInputs());
          lastPhysical = lastPhysical || (usbin && usbin.length);
          usbin = mio.getInputs().filter(/ /.exec.bind(/^CH|usb|VMPK/i));
          if (lastPhysical && !usbin.length)
            return;
          if (mu)
            mu.removeAllListeners();
          mu = usbin.length ? new mio.Input(usbin[0], false) : new mio.Input("keyboard", true);
          console.log("Listening to midi device " + (usbin.length ? usbin[0] : "keyboard"));
          mu.on('noteon', noteon);
          mu.on('cc', x => {
            console.log(x);
          });
        };
        hookup();
        navigator.requestMIDIAccess().then(function(midiAccess) {
          midiAccess.onstatechange = function() {
            hookup();
          };
        });
        window.onbeforeunload = function (e) {
          console.log("cleaning up");
          mo.close();
          mi.removeAllListeners();
          mi.close();
        };
        var sustain = false;
        window.onkeypress = e => {
	  if (e.key == "s") {
            sustain = !sustain;
            if (sustain) {
              mo.sendAllChannels('cc', {
                controller: 64,
                value: 127,
              });
            } else {
              mo.sendNotesOff();

              mo.sendAllChannels('cc', {
                controller: 64,
                value: 0,
              });
            }
          }
          if (e.key == "e") {
            echo = !echo;
          }
          if (e.key == "f") {
            try {
              model.state.show_fingering = !model.state.show_fingering;
              seq.forEach(x => {
                let shown = x.shape.opacity();
                x.fingering.opacity(model.state.show_fingering? shown : 0)
                x.intervals.forEach(x => x.opacity(model.state.show_fingering? 0 : shown));
              })
              require('fs').writeFileSync('./state.json', JSON.stringify(model.state));
            } catch (e) {
              console.log(e);
            }
          }
          if (e.key == "p") {
            gameplayback();
          }
          if (e.key == " ") {
            if (game > 0)
              simon.length = 0;
            if (game)
              gamereset();
            else
              pause();
          }
          if (e.key == "Enter") {
            resume();
            if (state > 0)
              seq[state - 1].chord.map(x => noteon({note: x.param1 + offset, velocity: 0}));
            if (!e.shiftKey)
              setTimeout(x => x.map(x => noteon({note: x.param1 + offset, velocity: 0})), 500, seq[state].chord);
            seq[state].chord.map(x => noteon({note: x.param1 + offset, velocity: 80}));
          }
        };
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
    require('fs').writeFileSync('./state.json', JSON.stringify(model.state));
    location.reload();
  } catch (e) {
    console.log(e);
  }
};
vm.$watch('state.mode', change);
vm.$watch('state.score', change);
