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
let allJobs = []; // Stores all fetched jobs

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

function renderJobs() {
  const jobList = document.getElementById("job-list");
  const pagination = document.getElementById("pagination");

  const start = (currentPage - 1) * jobsPerPage;
  const end = start + jobsPerPage;
  const currentJobs = allJobs.slice(start, end);

  jobList.innerHTML = "";

  if (currentJobs.length === 0) {
    jobList.innerHTML = "<p>No jobs found.</p>";
    if (pagination) pagination.style.width = '100%'; // reset width
    return;
  }

  currentJobs.forEach((job) => {
    const jobElement = document.createElement("div");
    jobElement.classList.add("job-card");

    let salaryHTML = 'Not specified';
    if (job.salary) {
        let salaryValue = String(job.salary);
        if (salaryValue.includes('/')) {
            const parts = salaryValue.split('/');
            salaryHTML = `<strong>${parts[0]}</strong>/${parts.slice(1).join('/')}`;
        } else {
            if (!salaryValue.startsWith('$')) {
                salaryValue = '$' + salaryValue;
            }
            salaryHTML = `<strong>${salaryValue}</strong>/hour`;
        }
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
      <div class="job-salary">${salaryHTML}</div>

    `;
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
async function searchJobs() {
  const searchInput = document.getElementById("job-title").value.toLowerCase();
  const querySnapshot = await getDocs(jobsCollection);
  const jobList = document.getElementById("job-list");

  jobList.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const job = doc.data();

    if (job.title.toLowerCase().includes(searchInput)) {
      const jobElement = document.createElement("div");
      jobElement.classList.add("job-card");

      jobElement.innerHTML = `
            <div class="job-title">${job.title}</div>
            <div class="job-company"><strong>Company:</strong> ${job.company}</div>
            <div class="job-location"><strong>Location:</strong> ${job.location}</div>
            <div class="job-salary"><strong>Salary:</strong> ${job.salary}</div>
            <p>${job.description}</p>
            <button class="primary-button apply-button">Apply Now</button>
          `;

      jobList.appendChild(jobElement);
    }
  });

  if (jobList.innerHTML === "") {
    jobList.innerHTML = "<p>No jobs found.</p>";
  }

  document.querySelectorAll(".apply-button").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const jobId = event.target.getAttribute("data-job-id");

      // Ask for user confirmation before applying
      const userConfirmed = window.confirm("Are you sure you want to apply for this job?");
      
      if (userConfirmed) {
        await applyForJob(jobId);
      }
    });
  });
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
    searchInput.addEventListener("input", filterJobs);
  }

  // Filter checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener("change", filterJobs);
  });
});
