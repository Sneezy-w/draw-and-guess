<div class="bg-gradient-to-r from-blue-50 to-purple-50 p-4 md:p-6 rounded-lg shadow-md">
  <div class="flex flex-col md:flex-row justify-between items-center">
    <div class="mb-4 md:mb-0">
      <h2 class="text-xl md:text-2xl font-bold mb-2">Current Room</h2>
      <p>You are in room: <span class="font-semibold">{{ room?.name }}</span></p>
    </div>
    <div>
      <button @click="leaveRoom"
        class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
        Leave Room
      </button>
    </div>
  </div>
</div>