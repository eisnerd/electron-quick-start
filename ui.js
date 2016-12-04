const model = require('./model');
const Vue = require('vue/dist/vue.common.js');
const debounce = require('debounce');

model.isMoving = false;
model.wasMoving = false;

var vm = new Vue({
  el: '.menu',
  data: model,
  components: {
    btn: {
      props: ['option', 'current'],
      filters: {
        letters: x => x.toLowerCase().replace(/[,.?!;:'"()&=+_-]/g, '')
      },
      template: `<span @click="$emit('select')" :class="{ selected: option == current }">{{ option | letters }}</span>`
    }
  },
  methods: {
    _mode: function(i) {
      this.state.mode = i
    },
    _score: function(i) {
      this.state.score = i
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
  try {
    if (window.scroller._timeline.rawTime() < window.scroller.endTime() + 0.1)
      return;
  } catch(e) {}
  vm.isMoving = true;
  vm.wasMoving = true;
  off();
  moreoff();
};
