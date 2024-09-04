export default {
  data() {
    return {
      currentColor: '#000000',
      currentSize: 5,
      isEraser: false,
      colorPalette: [
        "#1A1A1A", "#F44336", "#4CAF50", "#2196F3", "#FFC107", "#9C27B0",
      ],
    };
  },
  methods: {
    setColor(color) {
      this.currentColor = color;
      this.isEraser = false;
      this.$emit('color-changed', color);
    },
    setEraser() {
      this.isEraser = !this.isEraser;
      this.$emit('eraser-changed', this.isEraser);
    },
    clearCanvas() {
      this.$emit('clear-canvas');
    },
  },
  watch: {
    currentSize(newSize) {
      this.$emit('size-changed', newSize);
    },
  },
};