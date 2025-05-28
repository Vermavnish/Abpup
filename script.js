const auth = firebase.auth();

document.getElementById('showLogin').onclick = () => {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('signupForm').style.display = 'none';
};

document.getElementById('showSignup').onclick = () => {
  document.getElementById('signupForm').style.display = 'block';
  document.getElementById('loginForm').style.display = 'none';
};

function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      document.getElementById('message').innerText = "Login successful!";
    })
    .catch(error => {
      document.getElementById('message').innerText = error.message;
    });
}

function signup() {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      document.getElementById('message').innerText = "Signup successful!";
    })
    .catch(error => {
      document.getElementById('message').innerText = error.message;
    });
}
