<div class="canvas-container relative w-full" style="padding-bottom: 75%;">
  <canvas ref="canvas" @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing" @mouseleave="stopDrawing"
    @touchstart.prevent="startDrawing" @touchmove.prevent="draw" @touchend.prevent="stopDrawing"
    v-show="currentRoom && (gameState === 'playing' || gameState === 'roundEnd')"
    class="border-4 border-blue-300 rounded-lg absolute top-0 left-0 w-full h-full shadow-lg">
  </canvas>
</div>