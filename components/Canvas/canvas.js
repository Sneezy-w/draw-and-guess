export default {
  props: {
    currentRoom: {
      type: String,
      required: true,
    },
    gameState: {
      required: true,
    },
    isDrawing: {
      type: Boolean,
      required: true,
    },
    isEraser: {
      type: Boolean,
      required: true,
    },
    eraserSize: {
      type: Number,
      default: 20,
    },
    currentColor: {
      type: String,
      required: true,
    },
    currentSize: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      canvas: null,
      ctx: null,
      isDrawingNow: false,
    };
  },
  methods: {
    initCanvas() {
      this.$nextTick(() => {
        this.canvas = this.$refs.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas);
      });
    },

    updateBrush() {
      if (!this.ctx) return;
      this.ctx.lineWidth = this.isEraser ? this.eraserSize : this.currentSize;
      this.ctx.lineCap = "round";
      this.ctx.strokeStyle = this.isEraser ? "#FFFFFF" : this.currentColor;

      // Update cursor
      if (this.isEraser) {
        this.canvas.style.cursor = this.getEraserCursor();
      } else {
        this.canvas.style.cursor = "crosshair";
      }
    },

    getEraserCursor() {
      const size = this.eraserSize;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      return `url(${canvas.toDataURL()}) ${size / 2} ${size / 2}, auto`;
    },

    resizeCanvas() {
      const container = this.canvas.parentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const aspectRatio = 4 / 3;

      if (containerWidth / containerHeight > aspectRatio) {
        this.canvas.height = containerHeight;
        this.canvas.width = containerHeight * aspectRatio;
      } else {
        this.canvas.width = containerWidth;
        this.canvas.height = containerWidth / aspectRatio;
      }

      this.$emit('canvas-resized');
    },
    startDrawing(event) {
      if (!this.isDrawing || this.gameState !== 'playing') return;
      this.isDrawingNow = true;
      this.updateBrush();

      this.ctx.beginPath();
      const { x, y } = this.getEventCoordinates(event);
      this.ctx.moveTo(x, y);
      //this.$emit('drawing-started', { x, y });
    },
    draw(event) {
      if (!this.isDrawing || !this.isDrawingNow || this.gameState !== "playing")
        return;
      const { x, y } = this.getEventCoordinates(event);

      if (this.isEraser) {
        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.eraserSize / 2, 0, 2 * Math.PI);
        this.ctx.fill();
      } else {
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      }
      this.saveDrawingData();
    },
    stopDrawing() {
      if (!this.isDrawing || this.gameState !== "playing") return;
      this.isDrawingNow = false;
      this.ctx.closePath();
      this.saveDrawingData();
    },
    getEventCoordinates(event) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (event.clientX || event.touches[0].clientX) - rect.left;
      const y = (event.clientY || event.touches[0].clientY) - rect.top;
      return { x, y };
    },
    clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // this
      //if (!this.currentRoom) return;
      firebase.database().ref(`rooms/${this.currentRoom}/drawingData`).set({
        data: this.canvas.toDataURL(),
        width: this.canvas.width,
        height: this.canvas.height,
      });
    },
    saveDrawingData() {
      //if (!this.currentRoom) return;
      const drawingData = this.canvas.toDataURL();
      firebase.database().ref(`rooms/${this.currentRoom}/drawingData`).set({
        data: drawingData,
        width: this.canvas.width,
        height: this.canvas.height,
      });
    },
    loadDrawingData(drawingData) {
      //if (!this.currentRoom) return;
      if (drawingData && !this.isDrawing) {
        const img = new Image();
        img.onload = () => {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(
            img,
            0,
            0,
            drawingData.width,
            drawingData.height,
            0,
            0,
            this.canvas.width,
            this.canvas.height
          );
        };
        img.src = drawingData.data;
      }
    },
  },
  mounted() {
    this.initCanvas();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCanvas);
  },
};