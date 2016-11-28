const Vue = require('./node_modules/vue/dist/vue.common.js');
const debounce = require('debounce');

var vm = new Vue({
  el: '.menu',
  data: {
    mode: 0,
    modes: [
      "songs",
      "drawing",
      "simon says"
    ],
    score: -1,
    scores: [
      "rain rain go away",
      "mary had a little lamb",
      "amazing grace"
    ],
    isMoving: false,
    wasMoving: false
  },
  components: {
    btn: {
      props: ['option', 'current'],
      template: `<span @click="$emit('select')" :class="{ selected: option == current }">{{ option }}</span>`
    }
  },
  methods: {
    _mode: function(i) {
      this.mode = i
    },
    _score: function(i) {
      this.score = i
    }
  }
});

var off = debounce(() => {
  vm.isMoving = false;
}, 600);
var moreoff = debounce(() => {
  vm.wasMoving = false;
}, 5000);

window.onmousemove = () => {
  console.log("move");
  vm.isMoving = true;
  vm.wasMoving = true;
  off();
  moreoff();
};
