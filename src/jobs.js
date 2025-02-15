import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const firestore = getFirestore();
const jobsCollection = collection(firestore, "jobs");

// Fetch and display all jobs
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Function to fetch and display jobs
async function fetchJobs() {
  const querySnapshot = await getDocs(jobsCollection);
  const jobList = document.getElementById("job-list");

  jobList.innerHTML = ""; // Clear previous jobs

  const searchQuery = getQueryParam("search")
    ? getQueryParam("search").toLowerCase()
    : "";

  querySnapshot.forEach((doc) => {
    const job = doc.data();
    const jobTitle = job.title.toLowerCase();

    // Apply search filter if a query exists
    if (!searchQuery || jobTitle.includes(searchQuery)) {
      const jobElement = document.createElement("div");
      jobElement.classList.add("job-card");

      jobElement.innerHTML = `
              <div class="job-title">${job.title}</div>
              <div class="job-company"><strong>Company:</strong> ${job.company}</div>
              <div class="job-location"><strong>Location:</strong> ${job.location}</div>
              <div class="job-salary"><strong>Salary:</strong> ${job.salary}</div>
              <p>${job.description}</p>
              <a href="${job.applyLink}" target="_blank" class="apply-button" id="job-apply">Apply Now</a>
          `;

      jobList.appendChild(jobElement);
    }
  });

  if (jobList.innerHTML === "") {
    jobList.innerHTML = "<p>No jobs found.</p>";
  }
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
            <a href="${job.applyLink}" target="_blank" class="apply-button job-apply-button" id="job-apply-button">Apply Now</a>
          `;

      jobList.appendChild(jobElement);
    }
  });

  if (jobList.innerHTML === "") {
    jobList.innerHTML = "<p>No jobs found.</p>";
  }
}

// Filter function
async function filterJobs() {
  const querySnapshot = await getDocs(jobsCollection);
  const jobList = document.getElementById("job-list");
  jobList.innerHTML = ""; // Clear previous jobs

  // Get selected salary ranges
  const selectedSalaries = Array.from(
    document.querySelectorAll('input[name="salary-radio"]:checked')
  ).map((checkbox) => checkbox.value);

  // Get selected job categories
  const selectedCategories = Array.from(
    document.querySelectorAll('input[name="field-radio"]:checked')
  ).map((checkbox) => checkbox.value);

  // Get selected job types
  const selectedJobTypes = Array.from(
    document.querySelectorAll('input[name="jobtype-radio"]:checked')
  ).map((checkbox) => checkbox.value);

  querySnapshot.forEach((doc) => {
    const job = doc.data();
    const jobSalary = parseFloat(job.salary); // Ensure salary is a number
    const jobCategory = job.category ? job.category.toLowerCase() : "";
    const jobTypeData = job.jobType ? job.jobType.toLowerCase() : "";

    // Salary Filter (at least one must match)
    let salaryMatch =
      selectedSalaries.length === 0 ||
      selectedSalaries.some((salary) => {
        return (
          (salary === "Under15" && jobSalary < 15) ||
          (salary === "15-18" && jobSalary >= 15 && jobSalary <= 18) ||
          (salary === "18+" && jobSalary > 18)
        );
      });

    // Category Filter (at least one must match)
    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.includes(jobCategory);

    // Job Type Filter (at least one must match)
    const jobTypeMatch =
      selectedJobTypes.length === 0 || selectedJobTypes.includes(jobTypeData);

    // Only display jobs that match ALL selected filter groups
    if (salaryMatch && categoryMatch && jobTypeMatch) {
      const jobElement = document.createElement("div");
      jobElement.classList.add("job-card");

      jobElement.innerHTML = `
              <div class="job-title">${job.title}</div>
              <div class="job-company"><strong>Company:</strong> ${job.company}</div>
              <div class="job-location"><strong>Location:</strong> ${job.location}</div>
              <div class="job-salary"><strong>Salary:</strong> $${job.salary}/hr</div>
              <p>${job.description}</p>
              <a href="${job.applyLink}" target="_blank" class="apply-button">Apply Now</a>
          `;

      jobList.appendChild(jobElement);
    }
  });

  if (jobList.innerHTML === "") {
    jobList.innerHTML = "<p>No jobs match your filters.</p>";
  }
}

// Attach function to "Apply Filters" button
document.getElementById("filter-apply").addEventListener("click", (event) => {
  event.preventDefault(); // Prevent page reload
  filterJobs();
});

// Add event listener to trigger search on input change
document.getElementById("job-title").addEventListener("input", searchJobs);

fetchJobs();
