export default {
  props: {
    room: {
      type: Object,
      required: true
    },
    user: {
      type: Object,
      required: true
    }
  },
  methods: {
    leaveRoom() {
      const roomRef = firebase.database().ref(`rooms/${this.room.id}`);
      roomRef
        .transaction((room) => {
          if (room && room.players && room.players[this.user.uid]) {
            delete room.players[this.user.uid];
            room.scores = {};
            if (Object.keys(room.players).length === 0) {
              return null;
            } else {
              room.status = "waiting";
              return room;
            }
          }
          return room;
        })
        .then(() => {
          this.$emit('leave-room');
        })
        .catch((error) => {
          console.error("Error leaving room:", error);
        });
    }
  }
};