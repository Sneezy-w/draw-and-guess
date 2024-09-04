<div v-if="!user" class="text-center">
  <button @click="signIn"
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105">
    Sign in with Google
  </button>
</div>
<div v-else>
  <div class="flex flex-col md:flex-row justify-between items-center mb-6">
    <p class="text-lg mb-2 md:mb-0">
      Welcome, <span class="font-semibold">{{ user.displayName }}</span>!
    </p>
    <button @click="signOut"
      class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out">
      Sign out
    </button>
  </div> 
</div>