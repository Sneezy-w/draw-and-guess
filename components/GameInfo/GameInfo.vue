<div class="w-full md:w-1/4 bg-gradient-to-b from-blue-50 to-purple-50 p-4 md:p-6 rounded-lg shadow-md">
  <h3 class="text-xl md:text-2xl font-bold mb-4 text-blue-600">Game Info</h3>
  <div v-if="gameState === 'playing' || gameState === 'roundEnd'">
    <p class="mb-2">Time remaining: {{ timer }} seconds</p>
    <p v-if="isDrawing" class="mb-2">Word to draw: {{ currentWord }}</p>
  </div>
  <div v-if="!isDrawing && gameState === 'playing'" class="mt-4">
    <p class="mb-2">Guess the word:</p>
    <input v-model="guess" @keyup.enter="submitGuess" type="text" class="border rounded-lg p-2 w-full mb-2">
    <button @click="submitGuess"
      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full transition duration-300 ease-in-out">
      Submit Guess
    </button>
    <p v-if="guessResult"
      :class="['mt-2', 'text-center', 'font-bold', guessResult === 'correct' ? 'text-green-500' : 'text-red-500', 'animate__animated', guessResult === 'correct' ? 'animate__bounceIn' : 'animate__shakeX']">
      {{ guessResult === 'correct' ? 'Correct!' : 'Wrong guess!' }}
    </p>
  </div>
  <button @click="startNewRound" v-if="gameState === 'roundEnd'"
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg w-full transition duration-300 ease-in-out mt-4">
    Start New Round
  </button>
  <div class="mt-6">
    <h4 class="text-lg md:text-xl font-bold mb-3 text-purple-600">Scores:</h4>
    <ul class="space-y-2">
      <li v-for="(score, uid) in scores" :key="uid"
        class="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm">
        <span>{{ score.name }}</span>
        <span class="font-bold text-blue-600">{{ score.score }}</span>
      </li>
    </ul>
  </div>
</div>