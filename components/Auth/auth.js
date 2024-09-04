export default {
  data() {
    return {
      user: null
    };
  },
  methods: {
    signIn() {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          this.user = result.user;
        })
        .catch((error) => {
          console.error("Error signing in:", error);
        });
    },
    signOut() {
      firebase.auth().signOut()
        .then(() => {
          this.user = null;
        })
        .catch((error) => {
          console.error("Error signing out:", error);
        });
    }
  },
  created() {
    firebase.auth().onAuthStateChanged((user) => {
      this.user = user;
    });
  },
  watch: {
    user(newUser) {
      this.$emit('user-changed', newUser);
    }
  }
};