import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";


const firestore = getFirestore();
const jobsCollection = collection(firestore, "jobs");
const auth = getAuth();

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


// POP-UP FUNCTIONALITY
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup-message");
  const popupText = document.getElementById("popup-text");
  let closeBtn = document.getElementById("close-popup");
  let okBtn = document.getElementById("ok-popup");
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
    console.log("Fetched job:", job); // Log each job

    allJobs.push({ ...job, id: docSnapshot.id });
  });

  console.log("All jobs:", allJobs); // Log all fetched jobs

  renderJobs();
}

function renderJobs(jobListToRender = allJobs) {
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

  // Header section
  detailContainer.querySelector(".job-header h2").textContent = job.title || "";
  detailContainer.querySelector(".job-header h3").textContent = job.location || "";

  // Stats section
  const stats = detailContainer.querySelectorAll(".job-stat");
  if (stats.length >= 4) {
    stats[0].querySelector("h2").textContent = job.experienceLevel || "";
    stats[1].querySelector("h2").textContent = job.jobType || "";
    stats[2].querySelector("h2").textContent = job.workType || "";
    stats[3].querySelector("h2").textContent = job.salary || "";
  }

  // About section
  detailContainer.querySelector(".job-about p").textContent = job.jobDescription || "";

  // Responsibilities
  const responsibilitiesList = detailContainer.querySelector(".job-about ul");
  responsibilitiesList.innerHTML = "";
  (job.responsibilities || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    responsibilitiesList.appendChild(li);
  });

  // Qualifications → Prerequisites
  const qualificationsList = detailContainer.querySelector(".job-prerequisites ul");
  qualificationsList.innerHTML = "";
  (job.qualifications || []).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    qualificationsList.appendChild(li);
  });

  // Benefits → Eligibility box
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


// Function to apply for a job with full name
async function applyForJob(jobId) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      showPopup("Please log in to apply for jobs.");
      return;
    }

    const confirmed = await showCustomConfirm("Are you sure you want to apply for this job?");
    if (!confirmed) return;



    try {
      const jobRef = doc(firestore, "jobs", jobId);
      await updateDoc(jobRef, {
        applicants: arrayUnion(user.uid), // Use the user's UID instead of fullName
      });

      showPopup(`You have successfully applied for this job!`);
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
  const filtered = allJobs.filter(job =>
    job.title.toLowerCase().includes(searchInput)
  );

  // Update selected job id to first match
  selectedJobId = filtered.length > 0 ? filtered[0].id : null;

  // Render jobs from filtered list
  renderJobs(filtered);
}


// Filter function
async function filterJobs() {
  const salaryFilters = Array.from(document.querySelectorAll('input[name="salary-radio"]:checked')).map(input => input.value);
  const fieldFilters = Array.from(document.querySelectorAll('input[name="field-radio"]:checked')).map(input => input.value);
  const jobTypeFilters = Array.from(document.querySelectorAll('input[name="jobtype-radio"]:checked')).map(input => input.value);
  const searchInput = document.getElementById("job-title").value.toLowerCase();

  // Reset current page when filtering
  currentPage = 1;

  // Filter jobs based on selected criteria
  const filteredJobs = allJobs.filter(job => {
    // Search text filter
    const matchesSearch = !searchInput || 
      job.title.toLowerCase().includes(searchInput) ||
      job.company.toLowerCase().includes(searchInput) ||
      job.description.toLowerCase().includes(searchInput);

    // Salary filter
    const numericSalary = getNumericSalary(job.salary);
    const matchesSalary = salaryFilters.length === 0 || salaryFilters.some(filter => {
      if (numericSalary === null) return false;
      switch(filter) {
        case 'Under15':
          return numericSalary < 15;
        case '15-18':
          return numericSalary >= 15 && numericSalary <= 18;
        case '18+':
          return numericSalary > 18;
        default:
          return true;
      }
      });

    // Field filter
    const matchesField = fieldFilters.length === 0 || fieldFilters.includes(job.category);

    // Job type filter
    const matchesJobType = jobTypeFilters.length === 0 || jobTypeFilters.includes(job.type);

    return matchesSearch && matchesSalary && matchesField && matchesJobType;
  });

  // Update the jobs count
  const jobsCount = document.querySelector('.jobs-count');
  if (jobsCount) {
    jobsCount.textContent = `${filteredJobs.length} results`;
  }

  // Update the displayed jobs
  allJobs = filteredJobs;
  renderJobs();
}

// Clear filters function
function clearFilters() {
  // Clear all checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  // Clear search input
  const searchInput = document.getElementById("job-title");
  if (searchInput) {
    searchInput.value = '';
  }

  // Reset to original jobs
  fetchJobs();
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
});
