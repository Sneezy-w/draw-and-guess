export default {
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      rooms: [],
      newRoomName: "",
      currentRoom: null,
    };
  },
  methods: {
    createRoom() {
      if (!this.newRoomName.trim()) return;

      const roomRef = firebase.database().ref("rooms").push();
      roomRef.set({
        name: this.newRoomName,
        creator: this.user.uid,
        players: {
          [this.user.uid]: {
            name: this.user.displayName,
            ready: false,
          },
        },
        status: "waiting",
        currentWord: "",
        drawerUid: null,
        winner: null,
        guesses: {},
      }).then(() => {
        this.currentRoom = roomRef.key;
        this.newRoomName = "";
      }).catch((error) => {
        console.error("Error creating room:", error);
      });
    },
    joinRoom(roomId) {
      const roomRef = firebase.database().ref(`rooms/${roomId}`);
      roomRef.transaction((room) => {
        if (room && (!room.players || Object.keys(room.players).length < 2)) {
          if (!room.players) room.players = {};
          room.players[this.user.uid] = {
            name: this.user.displayName,
            ready: false,
          };
          // if (Object.keys(room.players).length === 2) {
          //     room.status = "full";
          // }
          //this.currentRoom = roomId;
          return room;
        }
        return;
      }).then(() => {
        this.currentRoom = roomId;
      }).catch((error) => {
        console.error("Error joining room:", error);
      });
    }
  },
  mounted() {
    firebase.database().ref("rooms").on("value", (snapshot) => {
      const roomsData = snapshot.val();
      this.rooms = roomsData ? Object.entries(roomsData).map(([id, room]) => ({ id, ...room })) : [];
      this.currentRoom =
        this.rooms.find((r) => r.players && r.players[this.user.uid])
          ?.id || null;
    });
  },
  beforeDestroy() {
    firebase.database().ref("rooms").off();
    // if (this.currentRoom) {
    //   firebase.database().ref(`rooms/${this.currentRoom}`).off();
    // }

  },
  watch: {
    currentRoom(newRoom) {
      if (newRoom) {
        this.$emit('room-joined', newRoom);
      }
    }
  },
};