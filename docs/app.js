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


// SIGN-UP FUNCTION
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
          showPopup("Please fill in all required fields.");
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
  
          showPopup("User successfully registered!");
  
          // Redirect based on role
          if (role === "student") {
              window.location.href = "student-profile.html";
          } else {
              window.location.href = "employer-dashboard.html";
          }
      } catch (error) {
        console.error("Sign-Up Error:", error.code, error.message);
      
        if (error.code === "auth/email-already-in-use") {
          showPopup("An account with this email already exists. Please log in instead.");
        } else {
          showPopup("An error occurred while signing up. Please try again.");
        }
      }
      
    });
  }
});

async function completeStudentProfile(event) {
  event.preventDefault();

  const auth = getAuth(); // get fresh auth context
  const currentUser = auth.currentUser;

  if (!currentUser) {
    showPopup("User not logged in. Please sign in first.");
    return;
  }

  // Get all form fields from student profile
  const bio = document.getElementById("bio").value;
  const contact = document.getElementById("contact").value;
  const age = document.getElementById("age").value;
  const gpa = document.getElementById("gpa").value;
  const schoolName = document.getElementById("school-name").value;
  const graduationYear = document.getElementById("graduation-year").value;
  const grade = document.getElementById("grade").value;
  const skills = document.getElementById("skills").value;
  const experience = document.getElementById("experience").value;
  const additionalInfo = document.getElementById("additional-info").value;

  try {
    await setDoc(doc(firestore, "users", currentUser.uid), {
      bio,
      contact,
      age,
      gpa,
      schoolName,
      graduationYear,
      grade,
      skills,
      experience,
      additionalInfo,
      profileCompleted: true,
    }, { merge: true });

    showPopup("Profile saved successfully!");
    window.location.href = "postings.html";
  } catch (error) {
    console.error("Error saving profile:", error.message);
    showPopup("Error saving profile: " + error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("student-profile-form");

  if (profileForm) {
    profileForm.addEventListener("submit", completeStudentProfile);
  }
});



//LOGIN FUNCTION
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password) {
        showPopup("Please fill in both fields.");
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

// Drag and Drop PDF Upload Functionality
document.addEventListener("DOMContentLoaded", () => {
  const uploadArea = document.getElementById("upload-area");
  const fileInput = document.getElementById("pdf-upload");
  const uploadLink = document.getElementById("upload-link");
  const fileInfo = document.getElementById("file-info");
  const fileName = document.getElementById("file-name");
  const fileSize = document.getElementById("file-size");
  const removeFile = document.getElementById("remove-file");

  // Only run if we're on the student profile page
  if (uploadArea && fileInput) {
    
    // Click to select file
    uploadLink.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.click();
    });

    uploadArea.addEventListener("click", () => {
      fileInput.click();
    });

    // File input change handler
    fileInput.addEventListener("change", handleFileSelect);

    // Drag and drop event handlers
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    });

    // Remove file handler
    if (removeFile) {
      removeFile.addEventListener("click", () => {
        fileInput.value = "";
        fileInfo.style.display = "none";
        uploadArea.style.display = "flex";
      });
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  }

  function handleFile(file) {
    // Check if file is PDF
    if (file.type !== "application/pdf") {
      showPopup("Please select a PDF file.");
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showPopup("File size must be less than 10MB.");
      return;
    }

    // Display file info
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    
    // Show file info, hide upload area
    fileInfo.style.display = "flex";
    uploadArea.style.display = "none";

    console.log("File selected:", file.name, "Size:", formatFileSize(file.size));

    // Extract text from PDF and auto-fill form
    extractTextFromPDF(file);
  }

  async function extractTextFromPDF(file) {
    try {
      // Set up PDF.js worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      
      // Load the PDF file
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + ' ';
      }

      console.log("Extracted text:", fullText);
      
      // Auto-fill form based on extracted text
      autoFillForm(fullText);
      
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      showPopup("Error reading PDF. Please fill out the form manually.");
    }
  }

  function autoFillForm(text) {
    // Section headers to trim from values
    const sectionHeaders = [
      'Basic Information', 'Education', 'Experience and Skills', 'Experience', 'Skills', 'Additional Info'
    ];
    // Map of label regexes to form field ID
    const labelPatterns = [
      { regex: /^bio\s*:/i, field: 'bio' },
      { regex: /^contact information\s*:/i, field: 'contact' },
      { regex: /^age\s*:/i, field: 'age' },
      { regex: /^gpa\s*:/i, field: 'gpa' },
      { regex: /^school name\s*:/i, field: 'school-name' },
      { regex: /^graduation year\s*:/i, field: 'graduation-year' },
      { regex: /^(current )?grade\s*:/i, field: 'grade' },
      { regex: /^skills\s*:/i, field: 'skills' },
      { regex: /^(prior )?experience\s*:/i, field: 'experience' },
      { regex: /^additional info\s*:/i, field: 'additional-info' }
    ];
    
    // Find all main bullet positions (●)
    const mainBulletPositions = [];
    let pos = 0;
    while ((pos = text.indexOf('●', pos)) !== -1) {
      mainBulletPositions.push(pos);
      pos++;
    }
    
    const result = {};
    
    // Process each main bullet section
    for (let i = 0; i < mainBulletPositions.length; i++) {
      const startPos = mainBulletPositions[i];
      const endPos = mainBulletPositions[i + 1] || text.length;
      
      // Extract the content from this bullet to the next bullet or end
      let sectionText = text.substring(startPos, endPos).trim();
      
      // Remove the leading bullet if present
      if (sectionText.startsWith('●')) {
        sectionText = sectionText.substring(1).trim();
      }
      
      // Try to match each label pattern
      for (const { regex, field } of labelPatterns) {
        const match = sectionText.match(regex);
        if (match) {
          let value = sectionText.replace(regex, '').trim();
          
          // For multi-line fields like experience, collect until next main bullet
          if (field === 'experience' && i + 1 < mainBulletPositions.length) {
            // Look ahead to see if the next section is still part of experience
            const nextSectionStart = mainBulletPositions[i + 1];
            const nextSectionText = text.substring(nextSectionStart, mainBulletPositions[i + 2] || text.length).trim();
            
            // If next section doesn't start with a known label, it might be continuation
            const hasNextLabel = labelPatterns.some(({ regex }) => regex.test(nextSectionText));
            if (!hasNextLabel) {
              // Include the next section content
              value += ' ' + nextSectionText.replace(/^●\s*/, '');
            }
          }
          
          // Remove trailing section headers if present
          for (const header of sectionHeaders) {
            const headerIdx = value.indexOf(header);
            if (headerIdx !== -1) {
              value = value.slice(0, headerIdx).trim();
            }
          }
          
          if (value && !result[field]) {
            result[field] = value;
          }
          break;
        }
      }
    }
    
    // Fill form fields
    labelPatterns.forEach(({ field }) => {
      fillFormField(field, result[field] || '');
    });
    showPopup("PDF processed! Form has been auto-filled with available information.");
  }
});

// --- Utility functions for both student profile and add-job PDF logic ---
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function fillFormField(fieldId, value) {
  const field = document.getElementById(fieldId);
  if (field && value) {
    if (field.tagName === 'SELECT') {
      // For select elements, try to match the value
      const options = Array.from(field.options);
      const matchingOption = options.find(option => 
        option.value.toLowerCase() === value.toLowerCase() ||
        option.text.toLowerCase().includes(value.toLowerCase())
      );
      if (matchingOption) {
        field.value = matchingOption.value;
      }
    } else {
      field.value = value;
    }
  }
}

// --- Add Job PDF Upload and Extraction Logic (runs only if add-job upload area exists) ---
document.addEventListener("DOMContentLoaded", () => {
  const uploadAreaJob = document.getElementById("upload-area-job");
  const fileInputJob = document.getElementById("pdf-upload-job");
  const uploadLinkJob = document.getElementById("upload-link-job");
  const fileInfoJob = document.getElementById("file-info-job");
  const fileNameJob = document.getElementById("file-name-job");
  const fileSizeJob = document.getElementById("file-size-job");
  const removeFileJob = document.getElementById("remove-file-job");

  if (uploadAreaJob && fileInputJob) {
    uploadLinkJob.addEventListener("click", (e) => {
      e.preventDefault();
      fileInputJob.click();
    });
    uploadAreaJob.addEventListener("click", () => {
      fileInputJob.click();
    });
    fileInputJob.addEventListener("change", handleFileSelectJob);
    uploadAreaJob.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadAreaJob.classList.add("dragover");
    });
    uploadAreaJob.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadAreaJob.classList.remove("dragover");
    });
    uploadAreaJob.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadAreaJob.classList.remove("dragover");
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileJob(files[0]);
      }
    });
    if (removeFileJob) {
      removeFileJob.addEventListener("click", () => {
        fileInputJob.value = "";
        fileInfoJob.style.display = "none";
        uploadAreaJob.style.display = "flex";
      });
    }
  }

  function handleFileSelectJob(e) {
    const file = e.target.files[0];
    if (file) {
      handleFileJob(file);
    }
  }

  function handleFileJob(file) {
    if (file.type !== "application/pdf") {
      showPopup("Please select a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showPopup("File size must be less than 10MB.");
      return;
    }
    fileNameJob.textContent = file.name;
    fileSizeJob.textContent = formatFileSize(file.size);
    fileInfoJob.style.display = "flex";
    uploadAreaJob.style.display = "none";
    extractTextFromPDFJob(file);
  }

  async function extractTextFromPDFJob(file) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + ' ';
      }
      autoFillJobForm(fullText);
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      showPopup("Error reading PDF. Please fill out the form manually.");
    }
  }

  function autoFillJobForm(text) {
    console.log('[PDF-AutoFill] Raw extracted text:', text);
    const sectionHeaders = [
      'Basic Information', 'Work Information', 'Job Description', 'Benefits', 'Responsibilities', 'Pre-qualifications', 'Work Authorization'
    ];
    // Improved label patterns: allow parentheticals, whitespace, and case-insensitivity
    const labelPatterns = [
      { regex: /^title\s*:?/i, field: 'title' },
      { regex: /^company\s*:?/i, field: 'company' },
      { regex: /^salary(\s*\([^)]*\))?\s*:?/i, field: 'salary' },
      { regex: /^location\s*:?/i, field: 'location' },
      { regex: /^expiry date\s*:?/i, field: 'expiry-date' },
      { regex: /^job type\s*:?/i, field: 'job-type' },
      { regex: /^experience level\s*:?/i, field: 'experience-level' },
      { regex: /^work type\s*:?/i, field: 'work-type' },
      { regex: /^about the job\s*:?/i, field: 'job-description' },
      { regex: /^job description\s*:?/i, field: 'job-description' },
      { regex: /^benefits\s*:?/i, field: 'benefits' },
      { regex: /^responsibilities\s*:?/i, field: 'responsibility' },
      { regex: /^pre-qualifications\s*:?/i, field: 'pre-qualification' },
      { regex: /^work authorization\s*:?/i, field: 'work-authorization' }
    ];
    const multiValueFields = ['benefits', 'responsibility', 'pre-qualification'];
    const addButtonIds = {
      'benefits': 'add-benefit-btn',
      'responsibility': 'add-responsibility-btn',
      'pre-qualification': 'add-pre-qualification-btn'
    };
    const mainBulletPositions = [];
    let pos = 0;
    while ((pos = text.indexOf('●', pos)) !== -1) {
      mainBulletPositions.push(pos);
      pos++;
    }
    console.log('[PDF-AutoFill] mainBulletPositions:', mainBulletPositions);
    const result = {};
    // Track which field is currently being collected for multi-value fields
    let collectingField = null;
    let collectingItems = [];
    for (let i = 0; i < mainBulletPositions.length; i++) {
      const startPos = mainBulletPositions[i];
      const endPos = mainBulletPositions[i + 1] || text.length;
      let sectionText = text.substring(startPos, endPos).trim();
      if (sectionText.startsWith('●')) {
        sectionText = sectionText.substring(1).trim();
      }
      console.log(`[PDF-AutoFill] Bullet ${i}:`, sectionText);
      // --- NEW: Robust job description extraction if embedded in bullet ---
      if (!result['job-description']) {
        // Look for 'Job Description' or 'About the Job' anywhere in the bullet
        let descIdx = sectionText.toLowerCase().indexOf('job description');
        let aboutIdx = sectionText.toLowerCase().indexOf('about the job');
        let foundIdx = descIdx !== -1 ? descIdx : (aboutIdx !== -1 ? aboutIdx : -1);
        if (foundIdx !== -1) {
          // Find the start of the description (after the label)
          let afterLabel = sectionText.slice(foundIdx);
          afterLabel = afterLabel.replace(/^(job description|about the job)\s*:*/i, '').trim();
          // Cut off at the next section header if present
          let cutIdx = afterLabel.length;
          for (const header of sectionHeaders) {
            let headerIdx = afterLabel.toLowerCase().indexOf(header.toLowerCase());
            if (headerIdx !== -1 && headerIdx < cutIdx) {
              cutIdx = headerIdx;
            }
          }
          let descText = afterLabel.slice(0, cutIdx).trim();
          // If the description is empty, try to grab the next bullet(s) until a section header
          if (!descText) {
            let j = i + 1;
            while (j < mainBulletPositions.length) {
              let nextText = text.substring(mainBulletPositions[j], mainBulletPositions[j + 1] || text.length).trim();
              if (nextText.startsWith('●')) nextText = nextText.substring(1).trim();
              // Stop if nextText matches a label or section header
              let isSection = false;
              for (const { regex } of labelPatterns) {
                if (regex.test(nextText)) { isSection = true; break; }
              }
              for (const header of sectionHeaders) {
                if (nextText.toLowerCase().includes(header.toLowerCase())) { isSection = true; break; }
              }
              if (isSection) break;
              descText += (descText ? ' ' : '') + nextText;
              j++;
            }
          }
          // --- Clean any leading label from the description ---
          descText = descText.replace(/^(job description|about the job)\s*:*/i, '').trim();
          if (descText) {
            result['job-description'] = descText;
            console.log('[PDF-AutoFill] (embedded) Extracted job description:', descText);
          }
        }
      }
      // --- Detect if bullet contains a multi-value field label (embedded or at end) ---
      let foundLabel = null;
      let foundLabelIdx = -1;
      let foundLabelText = '';
      for (const { regex, field } of labelPatterns) {
        if (multiValueFields.includes(field)) {
          // Extract the label from the regex (e.g., /^benefits\s*:?/i -> 'benefits')
          let label = regex.source.replace(/^\^/, '').split('\\')[0].split('(')[0].split('\\s')[0].replace(/[^a-zA-Z-]/g, '').trim();
          // Look for label (case-insensitive, with or without colon)
          const pattern = new RegExp(label + '\\s*:?', 'i');
          const match = sectionText.match(pattern);
          if (match) {
            foundLabel = field;
            foundLabelIdx = match.index;
            foundLabelText = match[0];
            break;
          }
        }
      }
      if (foundLabel) {
        // If collecting for a previous field, save the part before the label as the last item
        if (collectingField && foundLabelIdx > 0) {
          let lastItem = sectionText.slice(0, foundLabelIdx).trim();
          for (const header of sectionHeaders) {
            let idx = lastItem.toLowerCase().indexOf(header.toLowerCase());
            if (idx !== -1) {
              lastItem = lastItem.slice(0, idx).trim();
            }
          }
          if (lastItem) collectingItems.push(lastItem);
          if (collectingItems.length > 0) {
            result[collectingField] = collectingItems.join('\n');
          }
        } else if (collectingField && collectingItems.length > 0) {
          result[collectingField] = collectingItems.join('\n');
        }
        // Switch to new field
        collectingField = foundLabel;
        collectingItems = [];
        // If there is text after the label, ignore it (start collecting from next bullet)
        continue;
      }
      // --- Robust multi-value field collection ---
      if (collectingField) {
        let isNewLabel = false;
        for (const { regex } of labelPatterns) {
          if (regex.test(sectionText)) {
            isNewLabel = true;
            break;
          }
        }
        if (!isNewLabel) {
          let cleaned = sectionText;
          for (const header of sectionHeaders) {
            let idx = cleaned.toLowerCase().indexOf(header.toLowerCase());
            if (idx !== -1) {
              cleaned = cleaned.slice(0, idx).trim();
            }
          }
          if (cleaned) collectingItems.push(cleaned);
          continue;
        } else {
          if (collectingItems.length > 0) {
            result[collectingField] = collectingItems.join('\n');
          }
          collectingField = null;
          collectingItems = [];
        }
      }
      // Try to match each label pattern
      let matchedMultiValue = false;
      for (const { regex, field } of labelPatterns) {
        const match = sectionText.match(regex);
        if (match) {
          let value = sectionText.replace(regex, '').trim();
          if (field === 'work-type') {
            // Robust: match 'work type' label anywhere, robust to extra spaces
            let workTypeLabel = /work\s*type\s*:*/i;
            let labelMatch = sectionText.match(workTypeLabel);
            if (labelMatch) {
              let afterLabel = sectionText.slice(labelMatch.index + labelMatch[0].length).trim();
              // --- NEW: Split at the next label or section header (robust to embedded labels) ---
              let allLabels = labelPatterns
                .filter(lp => lp.field !== field)
                .map(lp => {
                  let label = lp.regex.source.replace(/^\^/, '').split('\\')[0].split('(')[0].split('\\s')[0].replace(/[^a-zA-Z-]/g, '').trim();
                  return label;
                })
                .concat(sectionHeaders);
              let labelRegex = new RegExp('(?:' + allLabels.filter(Boolean).map(l => l.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*')).join('|') + ')', 'i');
              let labelMatch2 = afterLabel.match(labelRegex);
              let minIdx = labelMatch2 ? labelMatch2.index : afterLabel.length;
              value = afterLabel.slice(0, minIdx).trim();
            } else {
              value = '';
            }
          } else if (!multiValueFields.includes(field)) {
            // --- Robust split for other single-value fields ---
            let allLabels = labelPatterns
              .filter(lp => lp.field !== field) // Exclude current field
              .map(lp => {
                let label = lp.regex.source.replace(/^\^/, '').split('\\')[0].split('(')[0].split('\\s')[0].replace(/[^a-zA-Z-]/g, '').trim();
                return label;
              })
              .concat(sectionHeaders);
            let labelRegex = new RegExp('(?:' + allLabels.filter(Boolean).map(l => l.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*') ).join('|') + ')', 'i');
            let labelMatch = value.match(labelRegex);
            let minIdx = labelMatch ? labelMatch.index : value.length;
            value = value.slice(0, minIdx).trim();
          } else {
            // For multi-value fields, keep existing logic
            let allLabels = labelPatterns.map(lp => {
              let label = lp.regex.source.replace(/^\^/, '').split('\\')[0].split('(')[0].split('\\s')[0].replace(/[^a-zA-Z-]/g, '').trim();
              return label;
            }).concat(sectionHeaders);
            let labelRegex = new RegExp('(?:' + allLabels.filter(Boolean).map(l => l.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*') ).join('|') + ')', 'i');
            let labelMatch = value.match(labelRegex);
            let minIdx = labelMatch ? labelMatch.index : value.length;
            value = value.slice(0, minIdx).trim();
          }
          if (multiValueFields.includes(field)) {
            collectingField = field;
            collectingItems = [];
            if (value) {
              let cleaned = value;
              for (const header of sectionHeaders) {
                if (header.toLowerCase() === 'work authorization') continue;
                let idx = cleaned.toLowerCase().indexOf(header.toLowerCase());
                if (idx !== -1) {
                  cleaned = cleaned.slice(0, idx).trim();
                }
              }
              if (cleaned) collectingItems.push(cleaned);
            }
            matchedMultiValue = true;
            break;
          } else {
            // Special handling for expiry-date: parse and convert to YYYY-MM-DD
            if (field === 'expiry-date' && value) {
              let dateVal = value;
              const dateMatch = dateVal.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
              if (dateMatch) {
                let [ , mm, dd, yyyy ] = dateMatch;
                if (yyyy.length === 2) yyyy = '20' + yyyy;
                dateVal = `${yyyy.padStart(4, '0')}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
              }
              const isoMatch = dateVal.match(/(\d{4})-(\d{2})-(\d{2})/);
              if (isoMatch) {
                dateVal = isoMatch[0];
              }
              result[field] = dateVal;
            } else if (field === 'job-description') {
              // ... job-description logic ...
            } else {
              result[field] = value;
            }
          }
          break;
        }
      }
      if (matchedMultiValue) continue;
    }
    if (collectingField && collectingItems.length > 0) {
      result[collectingField] = collectingItems.join('\n');
    }
    // --- Clean work-authorization from pre-qualifications and set checkbox if found ---
    let workAuthNegationPhrases = [
      'does not require the applicant to have work authorization',
      'does not require work authorization',
      'not require work authorization',
      'no work authorization required',
      'authorization is not required',
      'without work authorization',
      'does not require the applicant to have',
      'does not require authorization',
      'does not require the applicant to have authorization',
      'does not require applicant to have work authorization',
      'does not require applicant to have authorization',
      'does not require applicant authorization',
      'does not require authorization',
      'does not require work permit',
      'no work permit required',
      'work authorization is not required',
      'work permit is not required'
    ];
    let foundWorkAuth = false;
    if (result['pre-qualification']) {
      let items = result['pre-qualification'].split(/\n+/).filter(Boolean);
      let cleanedItems = [];
      for (let item of items) {
        // Normalize whitespace and remove emoji/non-alphanumeric except spaces and letters
        let normalized = item.replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
        let foundPhrase = null;
        let matchText = null;
        for (let phrase of workAuthNegationPhrases) {
          // Build a regex that allows for variable whitespace between words
          let phrasePattern = new RegExp(phrase.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+'), 'i');
          let match = normalized.match(phrasePattern);
          if (match) {
            foundPhrase = phrase;
            matchText = match[0];
            break;
          }
        }
        if (foundPhrase && matchText) {
          foundWorkAuth = true;
          // Build a regex for the original item that allows for variable whitespace between words
          let phraseWords = foundPhrase.split(/\s+/).filter(Boolean);
          let phrasePatternOrig = new RegExp(phraseWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+.*?'), 'i');
          let matchOrig = item.match(phrasePatternOrig);
          let before = matchOrig ? item.slice(0, matchOrig.index).replace(/\s*✅\s*/g, '').trim() : item.replace(/\s*✅\s*/g, '').trim();
          if (before) cleanedItems.push(before);
        } else {
          // Remove trailing section headers EXCEPT 'work authorization'
          let cleaned = item;
          for (const header of sectionHeaders) {
            if (header.toLowerCase() === 'work authorization') continue;
            let idx = cleaned.toLowerCase().indexOf(header.toLowerCase());
            if (idx !== -1) {
              cleaned = cleaned.slice(0, idx).trim();
            }
          }
          if (cleaned) cleanedItems.push(cleaned);
        }
      }
      result['pre-qualification'] = cleanedItems.join('\n');
    }
    // Fallback: scan the entire text for work authorization negation if not found
    if (!foundWorkAuth) {
      let loweredText = text.toLowerCase();
      foundWorkAuth = workAuthNegationPhrases.some(phrase => loweredText.includes(phrase));
    }
    // Fill form fields
    labelPatterns.forEach(({ field }) => {
      if (multiValueFields.includes(field)) {
        const items = (result[field] || '').split(/\n+/).filter(Boolean);
        const containerId = field + '-container';
        const container = document.getElementById(containerId);
        let placeholder = '';
        if (field === 'benefits') placeholder = 'e.g. Gain real-world problem-solving skills.';
        if (field === 'responsibility') placeholder = 'e.g. Maintain volunteer records and reports.';
        if (field === 'pre-qualification') placeholder = 'e.g. Pass Geometry II with a C or above.';
        console.log(`[PDF-AutoFill] Filling ${field}:`, items, 'Container:', container);
        if (container && items.length > 0) {
          while (container.children.length > 1) {
            container.removeChild(container.lastChild);
          }
          for (let i = 1; i < items.length; i++) {
            addInputField(container, placeholder, 10);
          }
          const inputs = container.querySelectorAll('input');
          console.log(`[PDF-AutoFill] ${field} inputs:`, inputs);
          for (let i = 0; i < items.length; i++) {
            if (inputs[i]) inputs[i].value = items[i];
          }
        }
      } else if (field === 'work-authorization') {
        const checkbox = document.getElementById('work-authorization');
        // Use foundWorkAuth or result['work-authorization']
        let val = result['work-authorization'] ? result['work-authorization'].toLowerCase() : '';
        if (checkbox) {
          if (foundWorkAuth ||
            val.includes('not require') ||
            val.includes('no') ||
            val.includes('does not require') ||
            val.includes('without work authorization') ||
            val.includes('authorization is not required')) {
            checkbox.checked = true;
          } else {
            checkbox.checked = false;
          }
          console.log('[PDF-AutoFill] Set work-authorization checkbox:', checkbox.checked, 'from value:', val, 'foundWorkAuth:', foundWorkAuth);
        }
      } else {
        if (field === 'job-description') {
          console.log('[PDF-AutoFill] Filling job-description:', result[field]);
        }
        // Add debug log for all fields
        console.log(`[PDF-AutoFill] Filling ${field}:`, result[field]);
        fillFormField(field, result[field] || '');
      }
    });
    showPopup("PDF processed! Form has been auto-filled with available information.");
  }
});

// --- Shared addInputField and removeInputField for dynamic multi-value fields ---
function addInputField(container, placeholder, limit, button) {
  const inputCount = container.querySelectorAll("input").length;
  if (inputCount >= limit) {
    if (button) {
      button.disabled = true;
      button.classList.add("disabled-btn");
    }
    return;
  }
  const newInput = document.createElement("input");
  newInput.type = "text";
  newInput.name = "requirement";
  newInput.placeholder = placeholder;
  newInput.classList.add("requirement-input");
  container.appendChild(newInput);
  if (container.querySelectorAll("input").length >= limit && button) {
    button.disabled = true;
    button.classList.add("disabled-btn");
  }
}
function removeInputField(container) {
  const inputCount = container.querySelectorAll("input").length;
  if (inputCount > 1) {
    container.lastElementChild.remove();
  }
}

// === EMPLOYER DASHBOARD: Show Employer's Job Postings in Postings Tab ===
let currentJobData = null; // Store current job data for modal

function renderEmployerJobCard(jobId, job) {
  const card = document.createElement('div');
  card.className = 'admin-job-card';
  card.innerHTML = `
    <div class="admin-job-title">${job.title || 'Untitled'}</div>
    <div class="admin-job-company"><strong>Company:</strong> ${job.company || ''}</div>
    <div class="admin-job-status ${job.status ? job.status.toLowerCase() : ''}">${job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'N/A'}</div>
    <div class="admin-job-detail">
      <span><strong>Location:</strong> ${job.location || ''}</span>
      <span><strong>Type:</strong> ${job.jobType || job.type || ''}</span>
      <span><strong>Salary:</strong> ${job.salary || ''}</span>
    </div>
    <div class="admin-job-actions">
      <button class="approve-button" onclick="showJobDetailsModal('${jobId}')">View Details</button>
    </div>
  `;
  return card;
}

async function fetchAndRenderEmployerJobs(employerId) {
  const jobListings = document.getElementById('job-listings');
  if (!jobListings) return;
  jobListings.innerHTML = '<p>Loading...</p>';
  try {
    const q = query(jobsCollection, where('employerId', '==', employerId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      jobListings.innerHTML = '<p>No job postings yet.</p>';
      return;
    }
    jobListings.innerHTML = '';
    querySnapshot.forEach(docSnap => {
      const job = docSnap.data();
      const card = renderEmployerJobCard(docSnap.id, job);
      jobListings.appendChild(card);
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    jobListings.innerHTML = '<p>Error loading job postings.</p>';
  }
}

// Show job details modal
window.showJobDetailsModal = async function(jobId) {
  try {
    const jobDoc = await getDoc(doc(firestore, 'jobs', jobId));
    if (jobDoc.exists()) {
      const job = jobDoc.data();
      currentJobData = { id: jobId, ...job };
      
      // Fill modal with job data
      document.getElementById('modal-job-title').textContent = job.title || 'N/A';
      document.getElementById('modal-company').textContent = job.company || 'N/A';
      document.getElementById('modal-location').textContent = job.location || 'N/A';
      document.getElementById('modal-type').textContent = job.jobType || job.type || 'N/A';
      document.getElementById('modal-salary').textContent = job.salary || 'N/A';
      document.getElementById('modal-status').textContent = job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'N/A';
      document.getElementById('modal-description').textContent = job.jobDescription || job.description || 'N/A';
      
      // Show rejection reason if job is rejected
      const rejectionReasonElement = document.getElementById('modal-rejection-reason');
      if (rejectionReasonElement) {
        if (job.status === 'rejected' && job.rejectionReason) {
          rejectionReasonElement.style.display = 'block';
          rejectionReasonElement.querySelector('p').textContent = job.rejectionReason;
        } else {
          rejectionReasonElement.style.display = 'none';
        }
      }
      
      // Show modal
      document.getElementById('job-details-modal').classList.add('active');
      document.body.classList.add('modal-open');
    }
  } catch (error) {
    console.error('Error fetching job details:', error);
    showPopup('Error loading job details');
  }
};

// Edit job functionality
window.editJob = function() {
  if (!currentJobData) return;
  
  // Create edit form HTML
  const editFormHTML = `
    <div class="edit-job-form">
      <h4>Edit Job Details</h4>
      <div class="form-group">
        <label for="edit-title">Job Title:</label>
        <input type="text" id="edit-title" value="${currentJobData.title || ''}" required>
      </div>
      <div class="form-group">
        <label for="edit-company">Company:</label>
        <input type="text" id="edit-company" value="${currentJobData.company || ''}" required>
      </div>
      <div class="form-group">
        <label for="edit-location">Location:</label>
        <input type="text" id="edit-location" value="${currentJobData.location || ''}" required>
      </div>
      <div class="form-group">
        <label for="edit-type">Job Type:</label>
        <select id="edit-type" required>
          <option value="Full-time" ${(currentJobData.jobType || currentJobData.type) === 'Full-time' ? 'selected' : ''}>Full-time</option>
          <option value="Part-time" ${(currentJobData.jobType || currentJobData.type) === 'Part-time' ? 'selected' : ''}>Part-time</option>
          <option value="Internship" ${(currentJobData.jobType || currentJobData.type) === 'Internship' ? 'selected' : ''}>Internship</option>
          <option value="Seasonal" ${(currentJobData.jobType || currentJobData.type) === 'Seasonal' ? 'selected' : ''}>Seasonal</option>
        </select>
      </div>
      <div class="form-group">
        <label for="edit-salary">Salary:</label>
        <input type="text" id="edit-salary" value="${currentJobData.salary || ''}" required>
      </div>
      <div class="form-group">
        <label for="edit-description">Job Description:</label>
        <textarea id="edit-description" rows="4" required>${currentJobData.jobDescription || currentJobData.description || ''}</textarea>
      </div>
      <div class="edit-form-actions">
        <button type="button" class="approve-button" onclick="saveJobChanges()">Save Changes</button>
        <button type="button" class="cancel-button" onclick="cancelEdit()">Cancel</button>
      </div>
    </div>
  `;
  
  // Replace modal content with edit form
  document.querySelector('.job-review-body').innerHTML = editFormHTML;
};

// Save job changes
window.saveJobChanges = async function() {
  if (!currentJobData) return;
  
  const updatedData = {
    title: document.getElementById('edit-title').value.trim(),
    company: document.getElementById('edit-company').value.trim(),
    location: document.getElementById('edit-location').value.trim(),
    jobType: document.getElementById('edit-type').value,
    salary: document.getElementById('edit-salary').value.trim(),
    jobDescription: document.getElementById('edit-description').value.trim(),
    status: 'pending', // Reset status to pending for admin review
    updatedAt: serverTimestamp()
  };
  
  // Validate required fields
  if (!updatedData.title || !updatedData.company || !updatedData.location || !updatedData.salary || !updatedData.jobDescription) {
    showPopup('Please fill in all required fields');
    return;
  }
  
  try {
    await updateDoc(doc(firestore, 'jobs', currentJobData.id), updatedData);
    showPopup('Job updated successfully! Status reset to pending for admin review.');
    
    // Close modal and refresh job list
    closeJobDetailsModal();
    onAuthStateChanged(auth, user => {
      if (user) fetchAndRenderEmployerJobs(user.uid);
    });
  } catch (error) {
    console.error('Error updating job:', error);
    showPopup('Error updating job. Please try again.');
  }
};

// Cancel edit and restore original modal content
window.cancelEdit = function() {
  if (!currentJobData) return;
  
  // Restore original modal content
  const originalContent = `
    <div class="job-details">
      <div class="detail-group">
        <label>Job Title:</label>
        <p id="modal-job-title">${currentJobData.title || 'N/A'}</p>
      </div>
      <div class="detail-group">
        <label>Company:</label>
        <p id="modal-company">${currentJobData.company || 'N/A'}</p>
      </div>
      <div class="detail-group">
        <label>Location:</label>
        <p id="modal-location">${currentJobData.location || 'N/A'}</p>
      </div>
      <div class="detail-group">
        <label>Job Type:</label>
        <p id="modal-type">${currentJobData.jobType || currentJobData.type || 'N/A'}</p>
      </div>
      <div class="detail-group">
        <label>Salary:</label>
        <p id="modal-salary">${currentJobData.salary || 'N/A'}</p>
      </div>
      <div class="detail-group">
        <label>Status:</label>
        <p id="modal-status">${currentJobData.status ? currentJobData.status.charAt(0).toUpperCase() + currentJobData.status.slice(1) : 'N/A'}</p>
      </div>
      <div class="detail-group">
        <label>Description:</label>
        <p id="modal-description">${currentJobData.jobDescription || currentJobData.description || 'N/A'}</p>
      </div>
      <div class="detail-group" id="modal-rejection-reason" style="display: ${currentJobData.status === 'rejected' && currentJobData.rejectionReason ? 'block' : 'none'};">
        <label>Rejection Reason:</label>
        <p style="color: #dc2626; font-weight: 500;">${currentJobData.rejectionReason || ''}</p>
      </div>
    </div>
  `;
  
  document.querySelector('.job-review-body').innerHTML = originalContent;
};

// Close job details modal
function closeJobDetailsModal() {
  document.getElementById('job-details-modal').classList.remove('active');
  document.body.classList.remove('modal-open');
  currentJobData = null;
}

// Show jobs when Postings tab is shown
function setupEmployerDashboardJobTab() {
  const tabButton = document.querySelector('.tab-button[data-tab="postings"]');
  if (!tabButton) return;
  tabButton.addEventListener('click', () => {
    onAuthStateChanged(auth, user => {
      if (user) fetchAndRenderEmployerJobs(user.uid);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // If on employer dashboard, show jobs on load if Postings tab is active
  if (document.getElementById('job-listings')) {
    onAuthStateChanged(auth, user => {
      if (user && document.querySelector('.tab-button[data-tab="postings"]').classList.contains('active')) {
        fetchAndRenderEmployerJobs(user.uid);
      }
    });
    setupEmployerDashboardJobTab();
    
    // Setup modal close buttons
    const closeModalBtn = document.getElementById('close-job-modal');
    const cancelModalBtn = document.getElementById('cancel-job-modal');
    
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', closeJobDetailsModal);
    }
    if (cancelModalBtn) {
      cancelModalBtn.addEventListener('click', closeJobDetailsModal);
    }
  }
});
