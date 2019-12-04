module.exports = {
  state: {
    show_fingering: 0,
    mode: 0,
    score: 0
  },
  modes: [
    "Songs",
    "Drawing",
    "Simon says",
    "Exercises"
  ],
  scores: [{
    name: "Rain, Rain Go Away",
    music: "rain.mid",
    words: "rain rain go a- way come a- gain a- no- ther day rain rain go a- way some- thing la la la la",
    trainer: x => x.track == 1,
    playback: x=> true,
    offset: 0,
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
    words: "a- ma- zi- ng grace how sweet the sound that saved a- a wretch like me i once wa- s lost but now am found was blind bu- t now i see",
    trainer: x => x.track == 1,
    playback: x => x.track == 1 || x.track == 4,
    offset: -1,
    notes: 32,
    //tempo: 0.53 // without words
    tempo: 0.4
  }, {
    name: "Twinkle, Twinkle Little Star",
    music: "twinkle.mid",
    words: "twin- kle twin- kle lit- tle star how i won- der what you are up a- bove the world so high like a dia- mond in the sky twin- kle twin- kle lit- tle star how i won- der what you are",
    trainer: x => x.track == 1,
    playback: x => true,
    offset: -6,
    notes: 6*7,
    //tempo: 0.52 // without words
    tempo: 0.45
  }, {
    name: "Give me oil in my lamp",
    music: "sing_hosanna.mid",
    words: "give me oil in my lamp keep me bur- ning give me oil in my lamp i pray give me oil in my lamp keep my bur- ning keep me bur- ning til the break of day",
    //fingering: "5554323212555432435554323212234554321",
    fingering: "5553212121555321325553212121123554321",
    trainer: x => x.track == 0,
    playback: x => true,
    offset: 2,
    notes: 37,
    tempo: 0.2
  }, {
    name: "All the pretty little horses",
    music: "all_the_pretty_little_horses.mid",
    words: "hush a bye don't you cry go to sleep my lit- tle ba- by when you wake you shall have all the pret- ty lit- tle hor- ses blacks and bays dap- ples and grays all the pret- ty lit- le hor- ses",
    fingering: "144323543132111443235431321112233553214321114432354313211",
    trainer: x => x.track == 0,
    offset: 2,
    tempo: 0.2
  }, {
    name: "Dear, if you change",
    music: "downland_songes_or_ayres_i-book_7_(c)icking-archive.mid",
    words: "dear i- i- if you change i'll ne- ver choose a- gain sweet if you shrink i'll ne- ver think of love fair if you fail i'll judge all beau- ty vain wise if too weak more wit i'll ne- ver proove dear sweet fair wise change shrink nor be not weak and on my faith my faith shall ne- ver break dear sweet fair wise change shrink nor be not weak and on my faith my faith shall ne- ver break",
    trainer: x => x.track == 1,
    playback: x=> true,
    simon_start: 1,
    simon_increment: 3,
    offset: 0,
    tempo: 0.22
  }, {
    name: "Come, heavy sleep",
    music: "downland_songes_or_ayres_i-book_20_(c)icking-archive.mid",
    words: "come hea- vy sleep i- im- age of true death and clo- se up the- e- se my wea- ry weep- ing eyes whose spring of tears doth stop my vi- tal breath and tears my soul with sor- rows sign- swoll'n cries come and pos- sess my ti- red thoughts wor- or- orn soul that li- ving dies that li- ving dies that li- ving dies 'til thou on me be stole come and pos- sess my ti- red thoughts wor- or- orn soul that li- ving dies that li- ving dies that li- ving dies 'til thou on me be stole",
    trainer: x => x.track == 1,
    playback: x=> true,
    simon_start: 1,
    simon_increment: 3,
    offset: 0,
    tempo: 0.25
  }, {
    name: "Für Alina",
    music: "alina.mid",
    trainer: x => true,//x.track == 1,
    playback: x=> true,
    offset: 0,
    chord_threshold: 25,
    tempo: 0.75
  }],
  exercises: [{
    name: "Scale octave right CMaj",
    music: "scale_octave_right_cmaj.mid",
    tempo: 0.1
  }, {
    name: "Scale octave left CMaj",
    music: "scale_octave_left_cmaj.mid",
    tempo: 0.1
  }, {
    name: "Scale octave contrary CMaj",
    music: "scale_octave_contrary_cmaj.mid",
    tempo: 0.1
  }, {
    name: "Scale octave parallel CMaj",
    music: "scale_octave_parallel_cmaj.mid",
    tempo: 0.1
  }, {
    name: "Arp crab right CMaj",
    music: "arp_crab_right_cmaj.mid",
    tempo: 0.1
  }, {
    name: "Arp crab left CMaj",
    music: "arp_crab_left_cmaj.mid",
    offset: 12,
    tempo: 0.1
  }]
};
