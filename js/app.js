import firebaseConfig from "./firebaseConfig.js";
import Auth from "../components/Auth/auth.js";
import RoomList from "../components/RoomList/roomList.js";
import Room from "../components/Room/room.js";
import DrawingTools from "../components/DrawingTools/drawingTools.js";
import Canvas from "../components/Canvas/canvas.js";
import ReadyButton from "../components/ReadyButton/readyButton.js";
import GameInfo from "../components/GameInfo/GameInfo.js";

firebase.initializeApp(firebaseConfig);

async function loadTemplate(path) {
  const templateResponse = await fetch(`./components/${path}.vue`)

  const template = await templateResponse.text();
  return template;
}

Vue.component('auth-component', {
  template: await loadTemplate('Auth/auth'),
  ...Auth
});
Vue.component('room-list-component', {
  template: await loadTemplate('RoomList/roomList'),
  ...RoomList
});
Vue.component('room-component', {
  template: await loadTemplate('Room/room'),
  ...Room
});
Vue.component('drawing-tools-component', {
  template: await loadTemplate('DrawingTools/drawingTools'),
  ...DrawingTools
});
Vue.component('canvas-component', {
  template: await loadTemplate('Canvas/canvas'),
  ...Canvas
});
Vue.component('ready-button-component', {
  template: await loadTemplate('ReadyButton/readyButton'),
  ...ReadyButton
});
Vue.component('game-info-component', {
  template: await loadTemplate('GameInfo/GameInfo'),
  ...GameInfo
});

new Vue({
  el: "#app",
  data: {
    user: null,
    currentRoom: null,
    currentRoomData: null,

    isDrawing: false,
    isReady: false,
    gameState: null,
    currentRoomPlayers: [],
    currentWord: null,
    winner: null,
    scores: {},

    timer: 60,
    //timerInterval: null,

    currentColor: "#000000",
    currentSize: 5,
    isEraser: false,
    eraserSize: 20,
  },
  methods: {
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
    onUserChanged(user) {
      this.user = user;
      console.log("user changed", user);
    },
    onRoomJoined(roomId) {
      this.currentRoom = roomId;
    },
    onLeaveRoom() {
      this.$refs?.gameInfoComponent?.clearTimer();
      console.log("currentRoom", this.currentRoom);
      this.currentRoom = null;
    },
    onToggleReady() {
      if (!this.currentRoom) return;
      const playerRef = firebase
        .database()
        .ref(`rooms/${this.currentRoom}/players/${this.user.uid}`);
      playerRef.update({ ready: !this.isReady }).then(() => {
      }).catch((error) => {
        console.error("Error updating ready", error);
      });
    },
    onStartGame() {
      if (!this.currentRoom) return;
      const roomRef = firebase.database().ref(`rooms/${this.currentRoom}`);
      const word = this.generateWord(); // Implement this function
      const randomIndex = Math.floor(
        Math.random() * this.currentRoomPlayers.length
      );

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
        });
    },
    onColorChanged(color) {
      this.currentColor = color;
      this.isEraser = false;
      this.$refs?.canvasComponent?.updateBrush();
    },
    onSizeChanged(size) {
      this.currentSize = size;
      this.$refs?.canvasComponent?.updateBrush();
    },
    onEraserChanged(isEraser) {
      this.isEraser = isEraser;
      this.$refs?.canvasComponent?.updateBrush();
    },
    onClearCanvas() {
      this.$refs?.canvasComponent?.clearCanvas();
    },
    // saveDrawingData() {
    //   if (!this.currentRoom) return;
    //   const drawingData = this.canvas.toDataURL();
    //   firebase.database().ref(`rooms/${this.currentRoom}/drawingData`).set({
    //     data: drawingData,
    //     width: this.canvas.width,
    //     height: this.canvas.height,
    //   });
    // },
  },
  watch: {
    currentRoom(newRoom, oldRoom) {
      if (newRoom) {
        firebase.database().ref(`rooms/${newRoom}`).on('value', (snapshot) => {
          ;
          const currentRoomData = { id: newRoom, ...snapshot.val() };
          this.currentRoomData = currentRoomData;
          //console.log("loading room", currentRoomData, currentRoomData.timer)

          this.gameState = currentRoomData.status;
          this.currentWord = currentRoomData.currentWord;
          this.isDrawing = currentRoomData.drawerUid === this.user.uid;
          this.isReady =
            currentRoomData?.players?.[this.user.uid]?.ready || false;
          this.currentRoomPlayers =
            Object.keys(currentRoomData?.players || {}).map((uid) => ({
              uid,
              name: currentRoomData?.players?.[uid]?.name,
              ready: currentRoomData?.players?.[uid]?.ready,
            })) || [];
          this.scores = currentRoomData?.scores || {};
          this.winner = currentRoomData.winner || null;

          if (currentRoomData.status === "playing") {
            this.timer = currentRoomData.timer;
          }

          const drawingData = currentRoomData.drawingData;
          this.$refs?.canvasComponent?.loadDrawingData(drawingData);
        });
      } else {
        if (oldRoom) {
          firebase.database().ref(`rooms/${oldRoom}`).off();
          this.currentRoomData = null;
        }
      }
    },

    gameState(newState, oldState) {
      if (newState && newState !== oldState) {
        if (this.isDrawing) {
          if (newState === "roundEnd") {
            this.$refs?.gameInfoComponent?.clearTimer();
          }
        }

        if (newState === "playing") {
          //this.startTimer();

          this.$refs?.canvasComponent?.clearCanvas();
          if (this.isDrawing) {
            this.$nextTick(() => {
              this.$refs?.gameInfoComponent?.startTimer();
            });
          }
          this.$refs?.canvasComponent?.resizeCanvas();
        }
      }
    },
  }

});