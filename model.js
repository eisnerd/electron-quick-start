module.exports = {
  mode: 0,
  modes: [
    "Songs",
    "Drawing",
    "Simon says"
  ],
  score: 0,
  scores: [{
    name: "Rain, Rain Go Away",
    music: "rain.mid",
    words: "rain rain go a- way come a- gain a- no- ther day rain rain go a- way some- thing la la la la",
    trainer: x => x.track == 1,
    playback: x=> true,
    offset: 0,
    notes: 100,
    tempo: 0.17
  }, {
    name: "Mary had a Little Lamb",
    music: "maryhadalittlelamb.mid",
    words: "ma- ry had a lit- tle lamb lit- tle lamb lit- tle lamb ma- ry had a lit- tle lamb its fleece was white as snow",
    trainer: x => x.track == 1,
    playback: x=> true,
    offset: 7,
    notes: 26,
    tempo: 0.14
  }, {
    name: "Amazing Grace",
    music: "amazing.mid",
    trainer: x => x.track == 1,
    playback: x => x.track == 1 || x.track == 4,
    offset: -1,
    notes: 32,
    tempo: 0.53
  }, {
    name: "Dear, if you change",
    music: "downland_songes_or_ayres_i-book_7_(c)icking-archive.mid",
    trainer: x => x.track == 1,
    playback: x=> true,
    offset: 0,
    notes: 100000,
    tempo: 1.22
  }, {
    name: "Come, heavy sleep",
    music: "downland_songes_or_ayres_i-book_20_(c)icking-archive.mid",
    trainer: x => x.track == 1,
    playback: x=> true,
    offset: 0,
    notes: 100000,
    tempo: 1
  }]
};
