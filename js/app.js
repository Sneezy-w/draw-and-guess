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
    guessResult: null,
    canvasWidth: 800,
    canvasHeight: 600,
    currentColor: "#000000",
    currentSize: 5,
    isEraser: false,
    eraserSize: 20,
    colorPalette: [
      "#1A1A1A", // Almost Black
      "#F44336", // Red
      "#4CAF50", // Green
      "#2196F3", // Blue
      "#FFC107", // Amber
      "#9C27B0", // Purple
    ],
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
      this.currentRoomPlayers.forEach((player) => {
        scores[player.uid] = { score: 0, name: player.name };
      });
      roomRef
        .update({
          status: "playing",
          currentWord: word,
          drawerUid: drawerUid,
          timer: 60,
          drawingData: null,
          scores: scores,
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
        this.canvas = this.$refs.canvas;
        if (this.canvas) {
          this.ctx = this.canvas.getContext("2d");
          this.resizeCanvas();
          this.updateBrush();
          window.addEventListener("resize", this.resizeCanvas);
          this.canvas.addEventListener("mousedown", this.startDrawing);
          this.canvas.addEventListener("mousemove", this.draw);
          this.canvas.addEventListener("mouseup", this.stopDrawing);
          this.canvas.addEventListener("mouseout", this.stopDrawing);
          // Add touch event listeners
          this.canvas.addEventListener("touchstart", this.handleStart);
          this.canvas.addEventListener("touchmove", this.handleMove);
          this.canvas.addEventListener("touchend", this.handleEnd);
          // Prevent default scrolling behavior
          this.canvas.addEventListener(
            "touchmove",
            function (e) {
              e.preventDefault();
            },
            { passive: false }
          );
        }
      });
    },

    updateBrush() {
      if (!this.ctx) return;
      this.ctx.lineWidth = this.isEraser ? this.eraserSize : this.currentSize;
      this.ctx.lineCap = "round";
      this.ctx.strokeStyle = this.isEraser ? "#FFFFFF" : this.currentColor;

      // Update cursor
      if (this.isEraser) {
        this.canvas.style.cursor = this.getEraserCursor();
      } else {
        this.canvas.style.cursor = "crosshair";
      }
    },

    setColor(color) {
      this.currentColor = color;
      this.isEraser = false;
      this.updateBrush();
    },

    setEraser() {
      this.isEraser = !this.isEraser;
      this.updateBrush();
    },

    getEraserCursor() {
      const size = this.eraserSize;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      return `url(${canvas.toDataURL()}) ${size / 2} ${size / 2}, auto`;
    },

    clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.saveDrawingData();
    },

    resizeCanvas() {
      const container = this.canvas.parentElement;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const aspectRatio = this.canvasWidth / this.canvasHeight;

      if (containerWidth / containerHeight > aspectRatio) {
        this.canvas.height = containerHeight;
        this.canvas.width = containerHeight * aspectRatio;
      } else {
        this.canvas.width = containerWidth;
        this.canvas.height = containerWidth / aspectRatio;
      }

      this.loadDrawingData();
    },

    // Update these methods to handle both mouse and touch events
    startDrawing(event) {
      if (!this.isDrawing || this.gameState !== "playing") return;
      this.isDrawingNow = true;
      this.updateBrush();
      this.ctx.beginPath();
      const { x, y } = this.getEventCoordinates(event);
      this.ctx.moveTo(x, y);
    },

    draw(event) {
      if (!this.isDrawing || !this.isDrawingNow || this.gameState !== "playing")
        return;
      const { x, y } = this.getEventCoordinates(event);

      if (this.isEraser) {
        this.ctx.globalCompositeOperation = "destination-out";
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.eraserSize / 2, 0, 2 * Math.PI);
        this.ctx.fill();
      } else {
        this.ctx.globalCompositeOperation = "source-over";
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
      }
      this.saveDrawingData();
    },

    stopDrawing() {
      if (!this.isDrawing || this.gameState !== "playing") return;
      this.isDrawingNow = false;
      this.ctx.closePath();
      this.saveDrawingData();
    },

    // Add these new methods for touch events
    handleStart(event) {
      event.preventDefault();
      this.startDrawing(event.touches[0]);
    },

    handleMove(event) {
      event.preventDefault();
      this.draw(event.touches[0]);
    },

    handleEnd(event) {
      event.preventDefault();
      this.stopDrawing();
    },

    // Helper method to get coordinates for both mouse and touch events
    getEventCoordinates(event) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (event.clientX || event.touches[0].clientX) - rect.left;
      const y = (event.clientY || event.touches[0].clientY) - rect.top;
      return { x, y };
    },

    saveDrawingData() {
      if (!this.currentRoom) return;
      const drawingData = this.canvas.toDataURL();
      firebase.database().ref(`rooms/${this.currentRoom}/drawingData`).set({
        data: drawingData,
        width: this.canvas.width,
        height: this.canvas.height,
      });
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
              this.ctx.drawImage(
                img,
                0,
                0,
                drawingData.width,
                drawingData.height,
                0,
                0,
                this.canvas.width,
                this.canvas.height
              );
            };
            img.src = drawingData.data;
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
            this.endRound();
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

    listenForWinner() {
      if (!this.currentRoom) return;
      const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
      roomRef.child("winner").on("value", (snapshot) => {
        const winnerUid = snapshot.val();
        if (winnerUid && this.gameState === "roundEnd") {
          this.celebrateWinner(winnerUid);
          // Reset the winner after celebration
          roomRef.child("winner").set(null);
        }
      });
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
        if (!scores[winnerUid])
          scores[winnerUid] = { score: 0, name: winnerName };
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
        winner: null, // Reset winner at the start of a new round
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

    listenToPlayerChanges(roomId) {
      const playersRef = firebase.database().ref(`rooms/${roomId}/players`);
      playersRef.on("value", (snapshot) => {
        const players = snapshot.val();
        console.log("Players:", players);
        if (players) {
          this.currentRoomPlayers = Object.keys(players).map((uid) => ({
            uid,
            name: players[uid].name,
            ready: players[uid].ready,
          }));
          console.log("Players updated:", this.currentRoomPlayers);
          // You can add additional logic here based on the number of players
          if (this.currentRoomPlayers.length === 2) {
            console.log("Room is full");
            // Add any specific logic for when the room is full
          }
        } else {
          this.currentRoomPlayers = [];
          console.log("No players in the room");
        }
      });
    },

    handleStart(e) {
      let touch = e.touches[0];
      this.startDrawing(touch.clientX, touch.clientY);
    },

    handleMove(e) {
      let touch = e.touches[0];
      this.draw(touch.clientX, touch.clientY);
    },

    handleEnd() {
      this.stopDrawing();
    },

    getCanvasCoordinates(e) {
      let rect = this.canvas.getBoundingClientRect();
      let touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
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
                if (currentRoomData.status === "playing") {
                  this.timer = currentRoomData.timer;
                  this.$nextTick(() => {
                    if (
                      !this.timerInterval &&
                      currentRoomData.drawerUid === this.user.uid
                    ) {
                      console.log("timerInterval");
                      //this.timer = currentRoomData.timer;
                      this.timerInterval = setInterval(
                        this.timerFunction,
                        1000
                      );
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

                this.listenForWinner(); // Add this line to start listening for winner updates
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

          // Reset winner when a new round starts
          if (this.currentRoom) {
            firebase
              .database()
              .ref(`rooms/${this.currentRoom}/winner`)
              .set(null);
          }
        }
      }
    },
    currentColor() {
      this.updateBrush();
    },
    currentSize() {
      this.updateBrush();
    },
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeCanvas);
  },
});
