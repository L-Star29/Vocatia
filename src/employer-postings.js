import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Initialize Firebase
const db = getFirestore();
const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
    const jobListings = document.getElementById("job-listings");
    const addJobForm = document.getElementById("add-job-form");

    // Check if user is logged in
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const employerId = user.uid;
            fetchEmployerJobs(employerId);
            addJobForm.addEventListener("submit", (e) => addJob(e, employerId));
        } else {
            jobListings.innerHTML = "<p>Please log in to view and manage your job postings.</p>";
        }
    });

    /** 🔥 Fetch Employer Jobs from Firestore */
    async function fetchEmployerJobs(employerId) {
        jobListings.innerHTML = "<p>Loading...</p>";

        try {
            const q = query(collection(db, "jobs"), where("employerId", "==", employerId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                jobListings.innerHTML = "<p>No job postings yet.</p>";
                return;
            }

            jobListings.innerHTML = ""; // Clear existing content

            querySnapshot.forEach((doc) => {
                const job = doc.data();
                createJobElement(doc.id, job);
            });
        } catch (error) {
            console.error("Error fetching jobs:", error);
            jobListings.innerHTML = "<p>Error loading job postings.</p>";
        }
    }

    /** ✨ Create Job Card */
    function createJobElement(jobId, job) {
        const jobElement = document.createElement("div");
        jobElement.classList.add("employer-job-card");
        jobElement.innerHTML = `
            <h3>${job.title}</h3>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Type:</strong> ${job.type}</p>
            <p><strong>Salary:</strong> ${job.salary}</p>
            <p>${job.description}</p>
            <button class="secondary-button edit-job-button" onclick="editJob('${jobId}', '${job.title}', '${job.company}', '${job.location}', '${job.type}', '${job.salary}', '${job.description}')">✏️ Edit</button>
            <button class="secondary-button delete-job-button" onclick="deleteJob('${jobId}')">❌ Delete</button>
        `;
        jobListings.appendChild(jobElement);
    }

    /** ➕ Add Job */
    async function addJob(event, employerId) {
        event.preventDefault();

        const jobData = {
            employerId,
            title: document.getElementById("job-title").value,
            company: document.getElementById("company-name").value,
            location: document.getElementById("location").value,
            type: document.getElementById("type").value,
            salary: document.getElementById("salary").value,
            description: document.getElementById("job-description").value
        };

        try {
            await addDoc(collection(db, "jobs"), jobData);
            alert("Job added successfully!");
            addJobForm.reset();
            fetchEmployerJobs(employerId);
        } catch (error) {
            console.error("Error adding job:", error);
        }
    }

    /** ❌ Delete Job */
    window.deleteJob = async function(jobId) {
        if (!confirm("Are you sure you want to delete this job?")) return;

        try {
            await deleteDoc(doc(db, "jobs", jobId));
            alert("Job deleted successfully!");
            fetchEmployerJobs(auth.currentUser.uid);
        } catch (error) {
            console.error("Error deleting job:", error);
        }
    };

    /** ✏️ Edit Job */
    window.editJob = function(jobId, title, company, location, type, salary, description) {
        const newTitle = prompt("Edit Job Title:", title);
        const newCompany = prompt("Edit Company Name:", company);
        const newLocation = prompt("Edit Location:", location);
        const newType = prompt("Edit Job Type:", type);
        const newSalary = prompt("Edit Salary:", salary);
        const newDescription = prompt("Edit Job Description:", description);

        if (newTitle && newCompany && newLocation && newType && newSalary && newDescription) {
            updateJob(jobId, {
                title: newTitle,
                company: newCompany,
                location: newLocation,
                type: newType,
                salary: newSalary,
                description: newDescription
            });
        }
    };

    /** 🔄 Update Job in Firestore */
    async function updateJob(jobId, updatedData) {
        try {
            await updateDoc(doc(db, "jobs", jobId), updatedData);
            alert("Job updated successfully!");
            fetchEmployerJobs(auth.currentUser.uid);
        } catch (error) {
            console.error("Error updating job:", error);
        }
    }
});
