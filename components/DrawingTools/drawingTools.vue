<div class="drawing-tools flex flex-wrap space-x-2 mb-2">
  <div class="color-palette flex flex-wrap space-x-2 mb-2">
    <div v-for="color in colorPalette" :key="color" @click="setColor(color)" :style="{ backgroundColor: color }"
      class="w-8 h-8 rounded-full cursor-pointer border-2 transition-all duration-200 mb-2"
      :class="{ 'border-gray-400 scale-110': currentColor === color, 'border-transparent': currentColor !== color }">
    </div>
    <input type="color" v-model="currentColor" @input="setColor(currentColor)"
      class="w-8 h-8 rounded-full cursor-pointer mb-2">
  </div>
  <select v-model="currentSize" class="border rounded p-1 mb-2">
    <option :value="2">Small</option>
    <option :value="5">Medium</option>
    <option :value="10">Large</option>
  </select>
  <button @click="setEraser" class="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded mb-2">
    Eraser
  </button>
  <button @click="clearCanvas" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded mb-2">
    Clear
  </button>
</div>