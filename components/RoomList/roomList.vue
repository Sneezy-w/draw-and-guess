<div class="space-y-8">
	<div class="bg-gray-50 p-4 md:p-6 rounded-lg">
		<h2 class="text-xl md:text-2xl font-bold mb-4">Create a Room</h2>
		<form @submit.prevent="createRoom" class="flex flex-col md:flex-row">
			<input v-model="newRoomName" type="text" placeholder="Room name"
				class="border rounded-lg md:rounded-r-none p-2 w-full md:w-auto mb-2 md:mb-0">
			<button type="submit"
				class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg md:rounded-l-none transition duration-300 ease-in-out">
				Create Room
			</button> 
		</form>
	</div>

	<div class="bg-gray-50 p-4 md:p-6 rounded-lg">
		<h2 class="text-xl md:text-2xl font-bold mb-4">Available Rooms</h2>
		<ul class="space-y-2">
			<li v-for="room in rooms" :key="room.id"
				class="bg-white p-4 rounded-lg flex flex-col md:flex-row justify-between items-center shadow-sm">
				<span class="font-medium mb-2 md:mb-0">{{ room.name }} ({{ room.players ?
					Object.keys(room.players).length : 0 }}/2)</span>
				<button @click="joinRoom(room.id)" :disabled="room.status === 'full'"
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out w-full md:w-auto"
					:class="{ 'opacity-50 cursor-not-allowed': room.status === 'full' }">
					Join
				</button>
			</li>
		</ul>
	</div>
</div>