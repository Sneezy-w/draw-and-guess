import firebaseConfig from "./firebaseConfig.js";

firebase.initializeApp(firebaseConfig);
//const db = firebase.firestore();

new Vue({
  el: "#app",
  data: {
    user: null,
    rooms: [],
    currentRoom: null,
    newRoomName: "",
    isReady: false,
    gameState: null,
    currentRoomPlayers: [],
    currentWord: "",
    guess: "",
    isDrawing: false,
    canvas: null,
    ctx: null,
    isDrawingNow: false,
    timer: 0,
    timerInterval: null,
    scores: {},
    //showCanvas: false
  },
  methods: {
    signIn() {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase
        .auth()
        .signInWithPopup(provider)
        .then((result) => {
          this.user = result.user;
        })
        .catch((error) => {
          console.error("Error signing in:", error);
        });
    },
    signOut() {
      firebase
        .auth()
        .signOut()
        .then(() => {
          this.user = null;
        })
        .catch((error) => {
          console.error("Error signing out:", error);
        });
    },
    createRoom() {
      if (!this.newRoomName.trim()) return;

      const roomRef = firebase.database().ref("rooms").push();
      roomRef
        .set({
          name: this.newRoomName,
          creator: this.user.uid,
          players: {
            [this.user.uid]: {
              name: this.user.displayName,
              //role: null,
              ready: false,
            },
          },
          status: "waiting",
          currentWord: "",
          drawerUid: null,
          winner: null,
          guesses: {},
        })
        .then(() => {
          this.currentRoom = roomRef.key;
          this.newRoomName = "";
          //this.gameState = 'waiting';
        })
        .catch((error) => {
          console.error("Error creating room:", error);
        });
    },

    joinRoom(roomId) {
      const roomRef = firebase.database().ref(`rooms/${roomId}`);
      roomRef
        .transaction((room) => {
          if (room && (!room.players || Object.keys(room.players).length < 2)) {
            if (!room.players) room.players = {};
            room.players[this.user.uid] = {
              name: this.user.displayName,
              //role: null,
              ready: false,
            };
            if (Object.keys(room.players).length === 2) {
              room.status = "full";
            }
            this.currentRoom = roomId;
            return room;
          }
          return;
        })
        .then(() => {
          this.currentRoom = roomId;
          //this.initCanvas();
          this.loadDrawingData();
        })
        .catch((error) => {
          console.error("Error joining room:", error);
        });
    },

    leaveRoom() {
      if (!this.currentRoom) return;

      // const roomRef = firebase.database().ref(`rooms/${this.currentRoom}/players/${this.user.uid}`);
      // roomRef.remove().then(() => {
      //     this.currentRoom = null;
      //     firebase.database().ref('rooms').child(this.currentRoom)
      // }).catch((error) => {
      //     console.error("Error leaving room:", error);
      // });
      const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
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
          this.currentRoom = null;
          this.scores = {};
        })
        .catch((error) => {
          console.error("Error leaving room:", error);
        });
    },
    toggleReady() {
      if (!this.currentRoom) return;
      const playerRef = firebase
        .database()
        .ref(`rooms/${this.currentRoom}/players/${this.user.uid}`);
      playerRef.update({ ready: !this.isReady });
      //this.isReady = !this.isReady;
    },

    startGame() {
      if (!this.currentRoom) return;
      const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
      const word = this.generateWord(); // Implement this function
      const randomIndex = Math.floor(
        Math.random() * this.currentRoomPlayers.length
      );
      //console.log(this.currentRoomPlayers);

      const drawerUid = this.currentRoomPlayers[randomIndex].uid;
      let scores = {};
      this.currentRoomPlayers.forEach(player => {
        scores[player.uid] = { score: 0, name: player.name };
      });
      roomRef
        .update({
          status: "playing",
          currentWord: word,
          drawerUid: drawerUid,
          timer: 60,
          drawingData: null,
          scores: scores
        })
        .then(() => {
          //this.initCanvas();
          //this.startTimer();
        });
    },

    generateWord() {
      const words = [
        "apple",
        "banana",
        "cat",
        "dog",
        "elephant",
        "frog",
        "guitar",
        "house",
        "ice cream",
        "jellyfish",
      ];
      return words[Math.floor(Math.random() * words.length)];
    },

    initCanvas() {
      this.$nextTick(() => {
        //console.log("initCanvas");
        this.canvas = this.$refs.canvas;
        //console.log(this.canvas);
        if (this.canvas) {
          this.ctx = this.canvas.getContext("2d");
          // Update canvas width and height
          this.canvas.width = 800;
          this.canvas.height = 600;
          this.ctx.lineWidth = 2;
          this.ctx.lineCap = "round";
          this.ctx.strokeStyle = "#000000";
        }
      });
    },

    startDrawing(event) {
      if (!this.isDrawing || this.gameState !== 'playing') return;
      //console.log("startDrawing");
      this.isDrawingNow = true;
      this.ctx.beginPath();
      this.ctx.moveTo(event.offsetX, event.offsetY);
    },

    draw(event) {
      if (!this.isDrawing || !this.isDrawingNow || this.gameState !== 'playing') return;
      this.ctx.lineTo(event.offsetX, event.offsetY);
      this.ctx.stroke();
      this.saveDrawingData();
    },

    stopDrawing() {
      if (!this.isDrawing || this.gameState !== 'playing') return;
      this.isDrawingNow = false;
      this.ctx.closePath();
      this.saveDrawingData();
    },

    saveDrawingData() {
      if (!this.currentRoom) return;
      const drawingData = this.canvas.toDataURL();
      firebase
        .database()
        .ref(`rooms/${this.currentRoom}/drawingData`)
        .set(drawingData);
    },

    loadDrawingData() {
      if (!this.currentRoom) return;
      firebase
        .database()
        .ref(`rooms/${this.currentRoom}/drawingData`)
        .on("value", (snapshot) => {
          const drawingData = snapshot.val();
          if (drawingData && !this.isDrawing) {
            const img = new Image();
            img.onload = () => {
              this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
              this.ctx.drawImage(img, 0, 0);
            };
            img.src = drawingData;
          }
        });
    },

    submitGuess() {
      if (!this.currentRoom || this.isDrawing) return;
      const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
      roomRef
        .child("guesses")
        .push({
          uid: this.user.uid,
          guess: this.guess,
        })
        .then(() => {
          this.checkGuess({ uid: this.user.uid, guess: this.guess, name: this.user.displayName });
          this.guess = "";
        });
    },

    checkGuess(guessData) {
      if (guessData.guess.toLowerCase() === this.currentWord.toLowerCase()) {
        const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
        roomRef
          .update({ status: "roundEnd", winner: guessData.uid })
          .then(() => {
            this.updateScores(guessData.uid, guessData.name);
            this.endRound();
          });
      } else {
        alert("Wrong guess!");
      }
    },

    timerFunction() {
      if (this.timer > 0) {
        this.timer--;
        const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
        roomRef.update({ timer: this.timer });
      } else {
        this.endRound();
      }
    },
    startTimer() {
      this.timer = 60;
      this.timerInterval = setInterval(this.timerFunction, 1000);
    },

    endRound() {
      clearInterval(this.timerInterval);
      const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
      roomRef.update({ status: "roundEnd" });
    },

    updateScores(winnerUid, winnerName) {
      const roomRef = firebase
        .database()
        .ref(`rooms/${this.currentRoom}/scores`);
      roomRef.transaction((scores) => {
        if (!scores) scores = {};
        if (!scores[winnerUid]) scores[winnerUid] = { score: 0, name: winnerName };
        scores[winnerUid].score++;
        return scores;
      });
    },

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


      });
      //this.startTimer();
    },

    getNextDrawer() {
      const players = Object.keys(
        this.rooms.find((r) => r.id === this.currentRoom).players
      );
      const currentDrawerIndex = players.indexOf(
        this.rooms.find((r) => r.id === this.currentRoom).drawerUid
      );
      return players[(currentDrawerIndex + 1) % players.length];
    },
  },
  created() {
    firebase.auth().onAuthStateChanged((user) => {
      this.user = user;
      if (user) {
        firebase
          .database()
          .ref("rooms")
          .on("value", (snapshot) => {
            const roomsData = snapshot.val();
            this.rooms = roomsData
              ? Object.entries(roomsData).map(([id, room]) => ({ id, ...room }))
              : [];
            this.currentRoom =
              this.rooms.find((r) => r.players && r.players[this.user.uid])
                ?.id || null;
            if (this.currentRoom) {
              const currentRoomData = this.rooms.find(
                (r) => r.id === this.currentRoom
              );
              if (currentRoomData) {
                //this.initCanvas();

                this.gameState = currentRoomData.status;
                this.currentWord = currentRoomData.currentWord;
                this.isDrawing = currentRoomData.drawerUid === this.user.uid;
                this.drawerUid = currentRoomData.drawerUid;
                this.isReady =
                  currentRoomData.players[this.user.uid]?.ready || false;
                this.currentRoomPlayers =
                  Object.keys(currentRoomData.players).map((uid) => ({
                    uid,
                    name: currentRoomData.players[uid].name,
                    ready: currentRoomData.players[uid].ready,
                  })) || [];
                this.scores = currentRoomData.scores || {};
                if (currentRoomData.status === 'playing') {
                  this.timer = currentRoomData.timer;
                  this.$nextTick(() => {
                    if (!this.timerInterval && currentRoomData.drawerUid === this.user.uid) {
                      console.log("timerInterval");
                      //this.timer = currentRoomData.timer;
                      this.timerInterval = setInterval(this.timerFunction, 1000);
                    }

                  });
                }


                // if (this.gameState === 'playing' && this.isDrawing) {
                //     this.startTimer();
                // } else if (this.gameState === 'roundEnd') {
                //     clearInterval(this.timerInterval);
                //     setTimeout(() => this.startNewRound(), 5000);
                // }

                this.$nextTick(() => {
                  const drawingData = currentRoomData.drawingData;
                  if (drawingData && !this.isDrawing) {
                    const img = new Image();
                    img.onload = () => {
                      this.ctx.clearRect(
                        0,
                        0,
                        this.canvas.width,
                        this.canvas.height
                      );
                      this.ctx.drawImage(img, 0, 0);
                    };
                    img.src = drawingData;
                  }
                });
              }
            }
          });
      } else {
        firebase.database().ref("rooms").off();
        this.rooms = [];
        this.currentRoom = null;
      }

      //this.initCanvas();
    });
  },
  mounted() {
    // if (this.currentRoom && (this.gameState === 'playing' || this.gameState === 'roundEnd')) {
    //     this.initCanvas();
    //     console.log("mounted");
    //     this.loadDrawingData();
    // }
  },
  watch: {
    currentRoom(newRoom, oldRoom) {
      if (newRoom && newRoom !== oldRoom) {
        this.initCanvas();
        //this.loadDrawingData();
      } else if (!newRoom && oldRoom) {
        //this.currentRoom = null;
        clearInterval(this.timerInterval);
      }
    },
    gameState(newState, oldState) {
      if (newState && newState !== oldState) {
        if (this.isDrawing) {
          if (newState === "roundEnd") {
            clearInterval(this.timerInterval);
            //setTimeout(() => this.startNewRound(), 5000);
          }
        }

        if (newState === "playing") {
          //this.startTimer();
          this.$refs.canvas
            ?.getContext("2d")
            ?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

      }
    },
    // timer(newTimer, oldTimer) {
    //   if (newTimer && newTimer !== oldTimer) {
    //     if (!this.isDrawing) {
    //       if (newTimer === 0) {
    //         this.endRound();
    //       }
    //     }
    //   }
    // },
  },
});
