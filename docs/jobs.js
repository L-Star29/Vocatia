import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";


const firestore = getFirestore();
const jobsCollection = collection(firestore, "jobs");
const auth = getAuth();

// Global popup functions
function showPopup(message) {
  const popup = document.getElementById("popup-message");
  const popupText = document.getElementById("popup-text");
  
  if (popup && popupText) {
    popupText.textContent = message;
    popup.style.display = "flex";
  } else {
    // Fallback: create popup if it doesn't exist
    createPopupElement();
    showPopup(message);
  }
}

function closePopup() {
  const popup = document.getElementById("popup-message");
  if (popup) {
    popup.style.display = "none";
  }
}

function createPopupElement() {
  // Check if popup already exists
  if (document.getElementById("popup-message")) {
    return;
  }
  
  const popupHTML = `
    <div id="popup-message" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 1000; justify-content: center; align-items: center;">
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
        <h3 style="margin: 0 0 20px 0; color: #333;">Application Status</h3>
        <p id="popup-text" style="margin: 0 0 25px 0; color: #666; line-height: 1.5;"></p>
        <button id="ok-popup" style="background: #2c6fc7; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">OK</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', popupHTML);
  
  // Add event listeners
  const okBtn = document.getElementById("ok-popup");
  if (okBtn) {
    okBtn.addEventListener("click", closePopup);
  }
}

function getNumericSalary(salary) {
  if (typeof salary === 'number') {
    return salary;
  }
  if (typeof salary === 'string') {
    // Extracts the first number from the string.
    const match = salary.match(/(\d+\.?\d*)/);
    if (match) {
      return parseFloat(match[0]);
    }
  }
  return null; // Return null if no number can be parsed.
}

let currentPage = 1;
const jobsPerPage = 12;
let allJobs = [];
let selectedJobId = null;
let displayedJobs = [];

// POP-UP FUNCTIONALITY
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup-message");
  const popupText = document.getElementById("popup-text");
  let closeBtn = document.getElementById("close-popup");
  let okBtn = document.getElementById("ok-popup");
  
  if (popup && popupText && closeBtn && okBtn) {
    closeBtn.addEventListener("click", closePopup);
    okBtn.addEventListener("click", closePopup);
  } else {
    // Create popup if it doesn't exist
    createPopupElement();
  }

  if (closeBtn) closeBtn.addEventListener("click", closePopup);
  if (okBtn) okBtn.addEventListener("click", closePopup);

  // For testing: showPopup("Hello world!");
});

function showCustomConfirm(message) {
  return new Promise((resolve) => {
    const popup = document.getElementById("confirm-popup");
    const text = document.getElementById("confirm-text");
    const yesBtn = document.getElementById("confirm-yes");
    const noBtn = document.getElementById("confirm-no");
    const closeBtn = document.getElementById("confirm-close");

    text.textContent = message;
    popup.style.display = "flex";

    const cleanup = () => {
      popup.style.display = "none";
      yesBtn.removeEventListener("click", onYes);
      noBtn.removeEventListener("click", onNo);
      closeBtn.removeEventListener("click", onNo);
    };

    const onYes = () => {
      cleanup();
      resolve(true);
    };

    const onNo = () => {
      cleanup();
      resolve(false);
    };

    yesBtn.addEventListener("click", onYes);
    noBtn.addEventListener("click", onNo);
    closeBtn.addEventListener("click", onNo);
  });
}



// Fetch and display all jobs
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener("DOMContentLoaded", () => {
  fetchJobs();
});

//Fetch and display jobs
async function fetchJobs() {
  const jobList = document.getElementById("job-list");
  if (!jobList) {
    console.warn("Element with ID 'job-list' not found.");
    return;
  }

  const querySnapshot = await getDocs(jobsCollection);
  allJobs = []; // Reset jobs array

  querySnapshot.forEach((docSnapshot) => {
    const job = docSnapshot.data();

    // ✅ Only add jobs where status is 'approved'
    if (job.status?.toLowerCase() === "approved") {
      allJobs.push({ ...job, id: docSnapshot.id });
    }
  });

  displayedJobs = [...allJobs]; // Start with all approved jobs visible
  renderJobs(displayedJobs);
}

function renderJobs(jobListToRender = displayedJobs) {
  const jobList = document.getElementById("job-list");
  const pagination = document.getElementById("pagination");

  const start = (currentPage - 1) * jobsPerPage;
  const end = start + jobsPerPage;
  const currentJobs = jobListToRender.slice(start, end);

  jobList.innerHTML = "";

  if (currentJobs.length === 0) {
    jobList.innerHTML = "<p>No jobs found.</p>";
    if (pagination) pagination.style.width = '100%'; // reset width
    return;
  }

  currentJobs.forEach((job, index) => {
    const jobElement = document.createElement("div");
    jobElement.classList.add("job-card");

    const shouldSelect = selectedJobId === job.id || (!selectedJobId && currentPage === 1 && index === 0);
    if (shouldSelect) {
      jobElement.classList.add("selected");
      selectedJobId = job.id;
      renderJobDetail(job);
    }

  
    jobElement.innerHTML = `
      <div class="job-title">${job.title}</div>
      <div class="job-company"><strong>Company:</strong> ${job.company}</div>
      <div class="job-location">${job.location}</div>
      <p>${job.jobDescription}</p>
      <div class="job-btn-group">
        <button class="white-button">${job.jobType}</button>
        <button class="white-button">${job.experienceLevel}</button>
        <button class="white-button">${job.workType}</button>
      </div>
      <div class="job-salary"><div><strong>$${job.salary}</strong>/hour</div> <div class="small-font">Closes on: ${job.expiryDate}</div></div>
    `;
  
    // Add click listener to select and render job details
    jobElement.addEventListener("click", () => {
      // Update selection tracking
      selectedJobId = job.id;
    
      // Re-render to update selection styles
      renderJobs();
    });
    
  
    jobList.appendChild(jobElement);
  });
  


  // Calculate pagination width dynamically:
  if (pagination && jobList) {
    const containerStyle = getComputedStyle(jobList);
    const containerWidth = jobList.clientWidth;

    const cardStyle = getComputedStyle(jobList.querySelector(".job-card"));
    const cardWidth = jobList.querySelector(".job-card").offsetWidth;
    const gap = parseInt(containerStyle.gap) || 30; // fallback to 30px

    // Calculate how many cards fit per row (floor to handle partial fits)
    const cardsPerRow = Math.floor(containerWidth / (cardWidth + gap));

    // How many cards are displayed on this page
    const cardsInCurrentPage = currentJobs.length;

    // Calculate cards in last row (it might be partial)
    const cardsInLastRow = cardsInCurrentPage % cardsPerRow || cardsPerRow;

    // Calculate width for pagination container: (cardWidth + gap) * cardsInLastRow - gap
    const paginationWidth = cardsInLastRow * (cardWidth + gap) - gap;

    // Set the pagination container width
    pagination.style.width = `${paginationWidth}px`;
  }

  // Bind apply buttons (avoid duplicate handlers by removing first)
  document.querySelectorAll(".apply-button").forEach((button) => {
    button.removeEventListener("click", handleApplyClick); // safety remove
    button.addEventListener("click", handleApplyClick);
  });

  addPaginationControls();
}

function renderJobDetail(job) {
  const detailContainer = document.querySelector(".job-detail-container");
  if (!detailContainer || !job) return;

  detailContainer.querySelector(".job-header h2").textContent = job.title || "";
  detailContainer.querySelector(".job-header h3").textContent = job.location || "";

  // Update the apply button with job ID and event listener
  const applyButton = detailContainer.querySelector(".job-apply button");
  if (applyButton) {
    applyButton.setAttribute("data-job-id", job.id);
    applyButton.classList.add("apply-button");
    applyButton.textContent = "Apply Now";
    
    // Remove existing event listeners and add new one
    applyButton.removeEventListener("click", handleApplyClick);
    applyButton.addEventListener("click", handleApplyClick);
  }

  const stats = detailContainer.querySelectorAll(".job-stat");
  if (stats.length >= 4) {
    stats[0].querySelector("h2").textContent = job.experienceLevel || "";
    stats[1].querySelector("h2").textContent = job.jobType || "";
    stats[2].querySelector("h2").textContent = job.workType || "";
    const salaryValue = job.salary || "";
    const formattedSalary = salaryValue ? `$${salaryValue}/hour` : "";
    stats[3].querySelector("h2").textContent = formattedSalary;
  }

  detailContainer.querySelector(".job-about p").textContent = job.jobDescription || "";

  const responsibilitiesList = detailContainer.querySelector(".job-about ul");
  responsibilitiesList.innerHTML = "";
  (job.responsibilities || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    responsibilitiesList.appendChild(li);
  });

  const qualificationsList = detailContainer.querySelector(".job-prerequisites ul");
  qualificationsList.innerHTML = "";
  (job.qualifications || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    qualificationsList.appendChild(li);
  });

  const benefitsList = detailContainer.querySelector(".job-benefits ul");
  benefitsList.innerHTML = "";
  (job.benefits || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    benefitsList.appendChild(li);
  });
}


function handleApplyClick(event) {
  const jobId = event.target.getAttribute("data-job-id");
  if (!jobId) {
    console.error("No job ID found on apply button");
    return;
  }
  applyForJob(jobId);
}


function addPaginationControls() {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;

  // Remove old listeners first to prevent duplicates
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");

  if (prevBtn) {
    prevBtn.replaceWith(prevBtn.cloneNode(true)); // removes listeners
  }
  if (nextBtn) {
    nextBtn.replaceWith(nextBtn.cloneNode(true)); // removes listeners
  }

  // Re-assign buttons after cloning
  const newPrevBtn = document.getElementById("prev-page");
  const newNextBtn = document.getElementById("next-page");

  newPrevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderJobs();
    }
  });

  newNextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(allJobs.length / jobsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderJobs();
    }
  });
}


// Function to apply for a job with student profile information
async function applyForJob(jobId) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showPopup("Please log in to apply for jobs.");
      return;
    }

    const confirmed = await showCustomConfirm("Are you sure you want to apply for this job?");
    if (!confirmed) return;

    try {
      // Get student profile information
      const userDocRef = doc(firestore, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        showPopup("Profile not found. Please complete your profile first.");
        return;
      }

      const userData = userDocSnap.data();
      
      if (!userData.profileCompleted) {
        showPopup("Please complete your profile before applying for jobs.");
        window.location.href = "student-profile.html";
        return;
      }

      // Get the job details
      const jobRef = doc(firestore, "jobs", jobId);
      const jobSnap = await getDoc(jobRef);
      
      if (!jobSnap.exists()) {
        showPopup("Job not found.");
        return;
      }

      const jobData = jobSnap.data();

      // Create application data with student profile information
      const applicationData = {
        studentId: user.uid,
        studentName: userData.fullName || user.displayName || "Unknown",
        studentEmail: userData.email || user.email,
        appliedAt: new Date(),
        status: "pending", // pending, accepted, rejected
        // Student profile information
        bio: userData.bio || "",
        contact: userData.contact || "",
        age: userData.age || "",
        gpa: userData.gpa || "",
        schoolName: userData.schoolName || "",
        graduationYear: userData.graduationYear || "",
        grade: userData.grade || "",
        skills: userData.skills || "",
        experience: userData.experience || "",
        additionalInfo: userData.additionalInfo || "",
        // Job information
        jobTitle: jobData.title,
        jobCompany: jobData.company,
        jobLocation: jobData.location,
        jobSalary: jobData.salary,
        jobType: jobData.jobType,
        experienceLevel: jobData.experienceLevel,
        workType: jobData.workType
      };

      // Add the application to the job's applicants array
      await updateDoc(jobRef, {
        applicants: arrayUnion(user.uid),
        [`applications.${user.uid}`]: applicationData
      });

      // Add notification for the employer
      try {
        await addDoc(collection(firestore, "notifications"), {
          employerId: jobData.employerId,
          type: 'application',
          message: `New application from ${userData.fullName || user.displayName || "Unknown"} for ${jobData.title}`,
          jobId: jobId,
          jobTitle: jobData.title,
          timestamp: new Date(),
          read: false
        });
      } catch (notificationError) {
        console.error('Error adding application notification:', notificationError);
      }

      showPopup(`You have successfully applied for ${jobData.title} at ${jobData.company}!`);
    } catch (error) {
      console.error("Error applying for job:", error);
      showPopup("Failed to apply. Please try again.");
    }
  });
}


// Search function
function searchJobs() {
  const searchInput = document.getElementById("job-title").value.toLowerCase();

  // Filter from original list
  const filtered = displayedJobs.filter(job =>
    job.title.toLowerCase().includes(searchInput)
  );

  // Update selected job id to first match
  selectedJobId = filtered.length > 0 ? filtered[0].id : null;

  // Render jobs from filtered list
  renderJobs(filtered);
}


// Filter function
async function filterJobs() {
  const typeValue = document.getElementById("job-type")?.value?.toLowerCase();
  const expValue = normalizeExpLevel(document.getElementById("experience-level")?.value);
  const workValue = document.getElementById("work-type")?.value?.toLowerCase();
  const minSalary = parseFloat(document.getElementById("salary")?.value);

  // Reset to first page
  currentPage = 1;

  const filteredJobs = allJobs.filter(job => {
    const salary = getNumericSalary(job.salary);
    const jobType = job.jobType?.toLowerCase();
    const experienceLevel = normalizeExpLevel(job.experienceLevel);
    const workType = job.workType?.toLowerCase();


    const matchesType = !typeValue || jobType === typeValue;
    const matchesExp = !expValue || experienceLevel === expValue;
    const matchesWork = !workValue || workType === workValue;
    const matchesSalary = isNaN(minSalary) || (salary !== null && salary >= minSalary);

    return matchesType && matchesExp && matchesWork && matchesSalary;
  });

  displayedJobs = filteredJobs;
  selectedJobId = null;
  renderJobs();
}

function normalizeExpLevel(value) {
  return value?.toLowerCase().replace(/[-\s]+/g, " ").trim(); // convert hyphens and extra spaces to single space
}


// Clear filters function
function clearFilters() {
  document.getElementById("job-type").value = "";
  document.getElementById("experience-level").value = "";
  document.getElementById("work-type").value = "";
  document.getElementById("salary").value = "";

  displayedJobs = [...allJobs];
  selectedJobId = null;
  renderJobs(displayedJobs);
}


// Add event listeners for filters
document.addEventListener("DOMContentLoaded", () => {
  // Apply filters button
  const filterApplyButton = document.getElementById("filter-apply");
  if (filterApplyButton) {
    filterApplyButton.addEventListener("click", (e) => {
      e.preventDefault();
      filterJobs();
    });
  }


  // Clear filters button
  const clearButton = document.querySelector(".clear-button");
  if (clearButton) {
    clearButton.addEventListener("click", (e) => {
      e.preventDefault();
      clearFilters();
    });
  }

  // Search input
  const searchInput = document.getElementById("job-title");
  if (searchInput) {
    searchInput.addEventListener("input", searchJobs);
  }

  // Filter checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener("change", filterJobs);
  });

  ["job-type", "experience-level", "work-type"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", () => {
        filterJobs();
      });
    }
  });
  
  const salaryInput = document.getElementById("salary");
  if (salaryInput) {
    let salaryTimer;
    salaryInput.addEventListener("input", () => {
      clearTimeout(salaryTimer);
      salaryTimer = setTimeout(() => {
        filterJobs();
      }, 300);
    });
  }

});
