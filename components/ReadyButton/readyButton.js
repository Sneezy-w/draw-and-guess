export default {
  props: {
    isReady: {
      type: Boolean,
      required: true
    },
    gameState: {
      type: String,
      required: true
    },
    currentRoomPlayers: {
      type: Array,
      required: true
    }
  },
  methods: {
    toggleReady() {
      this.$emit('toggle-ready');
    },
    startGame() {
      this.$emit('start-game');
    }
  }
};