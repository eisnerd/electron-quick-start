const model = require('./model');
const Vue = require('./node_modules/vue/dist/vue.common.js');
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
        letters: x => x.toLowerCase().replace(/[^\w\s]/g, '')
      },
      template: `<span @click="$emit('select')" :class="{ selected: option == current }">{{ option | letters }}</span>`
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
