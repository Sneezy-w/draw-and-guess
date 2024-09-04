<div>
  <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
    <button v-if="gameState === 'waiting' && !isReady" @click="toggleReady"
      class="w-32 h-32 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white font-bold text-2xl transition duration-300 ease-in-out mb-6 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300">
      Ready
    </button>
    <button v-if="isReady && currentRoomPlayers.length >= 2 && currentRoomPlayers.every(player => player.ready)"
      @click="startGame"
      class="w-32 h-32 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold text-2xl transition duration-300 ease-in-out flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300">
      Start Game
    </button>
  </div>
  <div v-if="(isReady && currentRoomPlayers.some(player => !player.ready))|| (isReady && currentRoomPlayers.length < 2)"
    class="waiting-animation absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 ">
    <div class="text-center">
      <div class="spinner-container mb-4">
        <div class="spinner"></div>
      </div>
      <p class="text-lg font-semibold text-blue-600">Waiting for another player...</p>
    </div>
  </div>
</div>