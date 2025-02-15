/*import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLm2mKWmyyPVMov94Z8oU3tJH78Gwxl48",
  authDomain: "vocatia-754e1.firebaseapp.com",
  projectId: "vocatia-754e1",
  storageBucket: "vocatia-754e1.firebasestorage.app",
  messagingSenderId: "215074444047",
  appId: "1:215074444047:web:79d4317335608a78baa47a",
  measurementId: "G-PTR2HYGCEM",
};

initializeApp(firebaseConfig);

const db = getFirestore();

const colRef = collection(db, "jobs");

getDocs(colRef).then((snapshot) => {
  console.log(snapshot.docs);
});*/

import {
  initializeApp,
  getApp,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const firebaseApp = initializeApp({
  apiKey: "AIzaSyCLm2mKWmyyPVMov94Z8oU3tJH78Gwxl48",
  authDomain: "vocatia-754e1.firebaseapp.com",
  projectId: "vocatia-754e1",
  storageBucket: "vocatia-754e1.firebasestorage.app",
  messagingSenderId: "215074444047",
  appId: "1:215074444047:web:79d4317335608a78baa47a",
  measurementId: "G-PTR2HYGCEM",
});

const auth = getAuth(firebaseApp);
const firestore = getFirestore();

// Detect Auth State
onAuthStateChanged(auth, (user) => {
  const loginButton = document.querySelector(".log-in-button");

  if (user) {
    // If user is logged in, change button to "Log Out"
    loginButton.innerHTML = "Log Out";
    loginButton.onclick = () => {
      signOut(auth)
        .then(() => {
          console.log("User logged out");
          window.location.reload(); // Refresh the page after logout
        })
        .catch((error) => {
          console.error("Logout error:", error.message);
        });
    };
  } else if (!user) {
    // If no user is logged in, keep "Log In" button
    loginButton.innerHTML = "Log In";
    loginButton.onclick = () => {
      window.location.href = "login.html"; // Redirect to login page
    };
  }
});

// Sign-Up Function
async function signUpUser(event) {
  event.preventDefault();

  const fullName = document.getElementById("full-name").value;
  const email = document.getElementById("email").value;
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role-selection").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: fullName });

    await setDoc(doc(firestore, "users", user.uid), {
      fullName: fullName,
      email: email,
      username: username,
      role: role,
      uid: user.uid,
    });

    alert("User signed up successfully!");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error signing up:", error.message);
    alert(error.message);
  }
}

// Login Function
let userDataArray = [];

async function loginUser(event) {
  event.preventDefault();

  const email = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;
    console.log("Login successful:", user);

    // Get user data from Firestore
    const userRef = doc(firestore, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      console.log("User data retrieved:", userData);

      // Store the user role in localStorage
      localStorage.setItem("userRole", userData.role);

      // Redirect to the homepage
      window.location.href = "index.html";
    } else {
      console.log("No such user data!");
      alert("User data not found in Firestore.");
    }
  } catch (error) {
    console.error("Error logging in:", error.message);
    alert("Incorrect Username or Password");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const userRole = localStorage.getItem("userRole");
  const applyButton = document.querySelector(".apply-button span");
  const applyLink = document.querySelector(".apply-button").parentElement; // Get the <a> tag

  if (userRole === "student") {
    applyButton.textContent = "Apply Now";
    applyLink.setAttribute("href", "postings.html");
  } else if (userRole === "employer") {
    applyButton.textContent = "Add Job";
    applyLink.setAttribute("href", "add-job.html"); // Redirect to add job page
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const userRole = localStorage.getItem("userRole");
  const addJobDiv = document.querySelector(".jobs-add");

  if (userRole === "employer") {
    addJobDiv.style.display = "block";
  } else {
    addJobDiv.style.display = "none";
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const signUpButton = document.querySelector(".sign-up");
  if (signUpButton) {
    signUpButton.addEventListener("click", signUpUser);
  }

  const loginButton = document.querySelector(".login");
  if (loginButton) {
    loginButton.addEventListener("click", loginUser);
  }
});

// ADD JOB
document.querySelector(".form").addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = document.getElementById("title").value;
  const company = document.getElementById("company").value;
  const salary = document.getElementById("salary").value;
  const location = document.getElementById("location").value;
  const type = document.getElementById("type").value;
  const description = document.getElementById("description").value;
  const applyLink = document.getElementById("apply-link").value;

  try {
    await addDoc(collection(firestore, "jobs"), {
      title,
      company,
      salary,
      location,
      type,
      description,
      applyLink,
      createdAt: new Date(),
    });
    alert("Job added successfully!");
    document.querySelector(".form").reset();
  } catch (error) {
    console.error("Error adding job:", error);
    alert("Failed to add job. Please try again.");
  }
});
