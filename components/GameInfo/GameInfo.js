export default {
  props: {
    currentRoom: {
      type: String,
      required: true
    },
    currentRoomPlayers: {
      type: Array,
      required: true
    },
    currentRoomData: {
      type: Object,
      required: true
    },
    gameState: String,
    timer: Number,
    currentWord: String,
    isDrawing: Boolean,
    scores: Object,
    user: Object,

    winner: String,

    generateWord: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      guess: '',
      guessResult: null,
      timerInterval: null,
      //scores: {}
    }
  },
  methods: {

    startNewRound() {
      const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
      const newDrawerUid = this.getNextDrawer();
      const newWord = this.generateWord();
      roomRef.update({
        status: "playing",
        currentWord: newWord,
        drawerUid: newDrawerUid,
        drawingData: null,
        timer: 60,
        winner: null, // Reset winner at the start of a new round
      });
    },

    getNextDrawer() {
      //console.log(this.currentRoomData);
      //console.log(this.currentRoomPlayers);
      const currentDrawerIndex = this.currentRoomPlayers.findIndex(player => player.uid === this.currentRoomData.drawerUid);
      return this.currentRoomPlayers[(currentDrawerIndex + 1) % this.currentRoomPlayers.length].uid;
    },

    submitGuess() {
      //this.$emit('submit-guess', this.guess);
      const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
      roomRef
        .child("guesses")
        .push({
          uid: this.user.uid,
          guess: this.guess,
        })
        .then(() => {
          this.checkGuess({
            uid: this.user.uid,
            guess: this.guess,
            name: this.user.displayName,
          });
          this.guess = "";
        });
    },

    checkGuess(guessData) {
      if (guessData.guess.toLowerCase() === this.currentWord.toLowerCase()) {
        this.guessResult = "correct";
        const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
        roomRef
          .update({ status: "roundEnd", winner: guessData.uid })
          .then(() => {
            this.updateScores(guessData.uid, guessData.name);
            //this.endRound();
            // Remove this line as it's no longer needed
            // this.celebrateWinner();
          });
      } else {
        this.guessResult = "wrong";
      }
      setTimeout(() => {
        this.guessResult = null;
      }, 2000);
    },

    updateScores(winnerUid, winnerName) {
      const roomRef = firebase
        .database()
        .ref(`rooms/${this.currentRoom}/scores`);
      roomRef.transaction((scores) => {
        if (!scores) scores = {};
        if (!scores[winnerUid])
          scores[winnerUid] = { score: 0, name: winnerName };
        scores[winnerUid].score++;
        return scores;
      });
    },

    endRound() {
      this.clearTimer();
      const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
      roomRef.update({ status: "roundEnd" });
    },

    timerFunction() {

      this.$nextTick(() => {
        if (this.timer > 0) {
          const timer = this.timer - 1;
          const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
          roomRef.update({ timer: timer });
        } else {
          this.endRound();
        }
      });

    },

    startTimer() {
      //this.timer = 60;
      this.clearTimer();
      this.timerInterval = setInterval(this.timerFunction, 1000);
    },

    clearTimer() {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    },


    celebrateWinner(winnerUid) {
      // Intense confetti burst
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["star"],
        colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
      };

      function fire(particleRatio, opts) {
        confetti(
          Object.assign({}, defaults, opts, {
            particleCount: Math.floor(count * particleRatio),
          })
        );
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });

      // Show winner announcement
      this.showWinnerAnnouncement(winnerUid);

    },

    showWinnerAnnouncement(winnerUid) {
      const winnerName = this.scores[winnerUid].name;
      const announcement = document.createElement("div");
      announcement.innerHTML = `<h2 class="text-4xl font-bold text-yellow-400">${winnerName} wins!</h2>`;
      announcement.className =
        "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 p-8 rounded-xl animate__animated animate__zoomIn";
      document.body.appendChild(announcement);

      setTimeout(() => {
        announcement.classList.remove("animate__zoomIn");
        announcement.classList.add("animate__zoomOut");
        setTimeout(() => {
          document.body.removeChild(announcement);
        }, 1000);
      }, 3000);
    },

  },
  watch: {
    winner(newWinner) {
      if (newWinner) {
        this.celebrateWinner(newWinner);
        const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
        roomRef.child("winner").set(null);
      }
    }
  }
}