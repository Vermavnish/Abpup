function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "admin.html";
    })
    .catch((error) => {
      alert("Login Failed: " + error.message);
    });
}

// Optional: protect admin page
if (window.location.pathname.includes('admin.html')) {
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "index.html";
    }
  });
}
