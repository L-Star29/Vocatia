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

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  setPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  doc,
  query,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
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
const jobsCollection = collection(firestore, "jobs");

const user = auth.currentUser;


let currentUser = null;

// Detect Auth State
onAuthStateChanged(auth, (user) => {
  const loginButton = document.querySelector(".log-in-button");

  if (loginButton) { // Only run if login button exists
    if (user) {
      // If user is logged in, change button to "Log Out"
      currentUser = user;
      loginButton.innerHTML = "<span>Log Out</span>";
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
      loginButton.innerHTML = "<span>Log In</span>";
      loginButton.onclick = () => {
        window.location.href = "login.html"; // Redirect to login page
      };
    }
  }
});

// POP-UP FUNCTIONALITY
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup-message");
  const popupText = document.getElementById("popup-text");
  let closeBtn = document.getElementById("popup-close");
  let okBtn = document.getElementById("popup-ok");
  if (popup && popupText && closeBtn && okBtn) {
    closeBtn.addEventListener("click", closePopup);
    okBtn.addEventListener("click", closePopup);
  }
  

  function showPopup(message) {
    popupText.textContent = message;
    popup.style.display = "flex";
  }

  function closePopup() {
    popup.style.display = "none";
  }

  if (closeBtn) closeBtn.addEventListener("click", closePopup);
  if (okBtn) okBtn.addEventListener("click", closePopup);

  // For testing: showPopup("Hello world!");
});

function showPopup(message) {
  const popup = document.getElementById("popup-message");
  const popupText = document.getElementById("popup-text");

  if (popup && popupText) {
    popupText.textContent = message;
    popup.style.display = "flex";
  }
}

function closePopup() {
  const popup = document.getElementById("popup-message");
  if (popup) {
    popup.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.querySelector(".popup-close");
  const okBtn = document.querySelector(".popup-ok");

  if (closeBtn) closeBtn.addEventListener("click", closePopup);
  if (okBtn) okBtn.addEventListener("click", closePopup);
});


// Sign-Up Function
document.addEventListener("DOMContentLoaded", () => {
  const signUpForm = document.getElementById("sign-up-form");
  if (signUpForm) {
    signUpForm.addEventListener("submit", async function (e) {
      e.preventDefault();
  
      const fullName = document.getElementById("full-name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const role = document.getElementById("role-selection").value;
  
      if (!fullName || !email || !password) {
          alert("Please fill in all required fields.");
          return;
      }
  
      try {
          await setPersistence(auth, browserSessionPersistence); // ensure persistence
  
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
  
          await updateProfile(user, { displayName: fullName });
  
          await setDoc(doc(firestore, "users", user.uid), {
              fullName,
              email,
              role,
              timestamp: new Date(),
          });
  
          alert("User successfully registered!");
  
          // Redirect based on role
          if (role === "student") {
              window.location.href = "student-profile.html";
          } else {
              window.location.href = "employer-dashboard.html";
          }
      } catch (error) {
          console.error("Sign-Up Error:", error.message);
          alert("Error occurred while signing up: " + error.message);
      }
    });
  }
});

async function completeStudentProfile(event) {
  event.preventDefault();

  if (!user) {
    showPopup("User not logged in. Please sign in first.");
    return;
  }

  const bio = document.getElementById("bio").value;
  const education = document.getElementById("education").value;
  const skills = document.getElementById("skills").value;
  const workExperience = document.getElementById("work-experience").value;

  try {
    await setDoc(doc(firestore, "users", currentUser.uid), {
      bio,
      education,
      skills,
      workExperience,
      profileCompleted: true,
    }, { merge: true });

    alert("Profile saved successfully!");
    window.location.href = "postings.html";
  } catch (error) {
    console.error("Error saving profile:", error.message);
    alert("Error saving profile: " + error.message);
  }
}

// Attach after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");

  // Only attach on student-profile.html
  if (form && window.location.href.includes("student-profile.html")) {
    form.addEventListener("submit", completeStudentProfile);
  }
});


//LOGIN FUNCTION
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password) {
        alert("Please fill in both fields.");
        return;
      }

      try {
        // Optional: keep session active while tab is open
        await setPersistence(auth, browserSessionPersistence);

        // Use Firebase Auth to sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user details from Firestore
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
        
          showPopup("Login successful!");
        
          if (userData.role === "employer") {
            window.location.href = "employer-dashboard.html";
          } else if (userData.role === "student") {
            if (userData.profileCompleted) {
              window.location.href = "postings.html";
            } else {
              window.location.href = "student-profile.html";
            }
          } else {
            showPopup("Role not recognized. Please contact support.");
            await signOut(auth);
          }
        }        
      } catch (error) {
        console.error("Login error:", error);
        showPopup("Login Failed! Please try again.");
      }
    });
  }
});

// GOOGLE SIGN-IN FUNCTION
document.addEventListener("DOMContentLoaded", () => {
  const googleButton = document.querySelector(".google");

  if (googleButton) {
    googleButton.addEventListener("click", async () => {
      const provider = new GoogleAuthProvider();

      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user already exists in Firestore
        const userDocRef = doc(firestore, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          window.location.href = "role-selection.html";

          const selectedRole = document.getElementById("role-selection").value;

          await setDoc(userDocRef, {
            fullName: user.displayName,
            email: user.email,
            role: selectedRole, // Default role, you can change this
            profileCompleted: false,
            createdAt: new Date(),
          });
        }

        // Redirect based on role
        const userData = (await getDoc(userDocRef)).data();
        if (userData.role === "employer") {
          window.location.href = "employer-dashboard.html";
        } else if( userData.profileCompleted === true) {
          window.location.href = "postings.html";
        } else {
          window.location.href = "student-profile.html";
        }

      } catch (error) {
        console.error("Google Sign-In Error:", error);
        showPopup("Google Sign-In failed.");
      }
    });
  }
});


function getMultipleValues(containerId) {
  const container = document.getElementById(containerId);
  const inputs = container.querySelectorAll("input");
  return Array.from(inputs)
      .map(input => input.value.trim())
      .filter(val => val !== "");
}

// ADD JOB FUNCTION
const addJobForm = document.getElementById("add-job-form");
if (addJobForm) {
  addJobForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const title = form["title"].value.trim();
    const company = form["company"].value.trim();
    const salaryRaw = form["salary"].value.trim();
    const salary = salaryRaw.replace(/[^\d.]/g, "");
    const location = form["location"].value.trim();
    const expiryDate = form["expiry-date"].value;
    const jobDescription = form["job-description"].value.trim();

    const jobType = form.querySelectorAll("select")[0].value;
    const experienceLevel = form.querySelectorAll("select")[1].value;
    const workType = form.querySelectorAll("select")[2].value;

    const benefits = getMultipleValues("benefits-container");
    const responsibilities = getMultipleValues("responsibility-container");
    const qualifications = getMultipleValues("pre-qualification-container");

    const requiresWorkAuth = !form["work-authorization"].checked;

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            alert("Please log in to submit a job posting.");
            return;
        }

        const jobData = {
            title,
            company,
            salary,
            location,
            expiryDate,
            jobType,
            experienceLevel,
            workType,
            jobDescription,
            benefits,
            responsibilities,
            qualifications,
            requiresWorkAuth,
            employerId: user.uid,
            createdAt: serverTimestamp(),
            status: 'pending',
        };

        try {
            await addDoc(jobsCollection, jobData);
            showPopup("Job posted successfully!");
            form.reset();
        } catch (error) {
            console.error("Error posting job:", error);
            showPopup("There was an error posting the job.");
        }
    });
  });
}


// ADD LIST FUNCTION
document.addEventListener("DOMContentLoaded", () => {
  const benefitsContainer = document.getElementById("benefits-container");
  const responsibilityContainer = document.getElementById("responsibility-container");
  const preQualificationContainer = document.getElementById("pre-qualification-container");

  const addBenefitBtn = document.getElementById("add-benefit-btn");
  const removeBenefitBtn = document.getElementById("remove-benefit-btn");

  const addResponsibilityBtn = document.getElementById("add-responsibility-btn");
  const removeResponsibilityBtn = document.getElementById("remove-responsibility-btn");

  const addPreQualificationBtn = document.getElementById("add-pre-qualification-btn");
  const removePreQualificationBtn = document.getElementById("remove-pre-qualification-btn");

  // Only run if we're on a page with these elements
  if (benefitsContainer && responsibilityContainer && preQualificationContainer) {
    // Helper function to add input fields
    const addInputField = (container, placeholder, limit, button) => {
      const inputCount = container.querySelectorAll("input").length;
      if (inputCount >= limit) {
        button.disabled = true; // Disable the button
        button.classList.add("disabled-btn"); // Add disabled styling
        return;
      }

      const newInput = document.createElement("input");
      newInput.type = "text";
      newInput.name = "requirement";
      newInput.placeholder = placeholder;
      newInput.classList.add("requirement-input");
      container.appendChild(newInput);

      // Check if the limit is reached after adding the input
      if (container.querySelectorAll("input").length >= limit) {
        button.disabled = true; // Disable the button
        button.classList.add("disabled-btn"); // Add disabled styling
      }
    };

    // Helper function to remove input fields
    const removeInputField = (container) => {
      const inputCount = container.querySelectorAll("input").length;
      if (inputCount > 1) {
        container.lastElementChild.remove(); // Remove the last input field
      }
    };

    // Add and Remove Benefits
    if (addBenefitBtn) {
      addBenefitBtn.addEventListener("click", () => {
        addInputField(benefitsContainer, "e.g. Gain real-world problem-solving skills.", 10, addBenefitBtn);
      });
    }

    if (removeBenefitBtn) {
      removeBenefitBtn.addEventListener("click", () => {
        removeInputField(benefitsContainer);
      });
    }

    // Add and Remove Responsibilities
    if (addResponsibilityBtn) {
      addResponsibilityBtn.addEventListener("click", () => {
        addInputField(responsibilityContainer, "e.g. Maintain volunteer records and reports.", 10, addResponsibilityBtn);
      });
    }

    if (removeResponsibilityBtn) {
      removeResponsibilityBtn.addEventListener("click", () => {
        removeInputField(responsibilityContainer);
      });
    }

    // Add and Remove Pre-Qualifications
    if (addPreQualificationBtn) {
      addPreQualificationBtn.addEventListener("click", () => {
        addInputField(preQualificationContainer, "e.g. Pass Geometry II with a C or above.", 10, addPreQualificationBtn);
      });
    }

    if (removePreQualificationBtn) {
      removePreQualificationBtn.addEventListener("click", () => {
        removeInputField(preQualificationContainer);
      });
    }
  }
});
