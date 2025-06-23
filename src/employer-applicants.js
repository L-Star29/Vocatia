import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await loadEmployerApplicants(user.uid);
        } else {
            document.getElementById("applicants-section").innerHTML = "<p>Please log in to view applicants.</p>";
        }
    });
});

function toggleApplicants(id, button) {
    const section = document.getElementById(id);
    if (section) {
        if (section.style.display === "none") {
            section.style.display = "block";
            button.textContent = "Hide Applicants";
        } else {
            section.style.display = "none";
            button.textContent = "Show Applicants";
        }
    } else {
        console.error(`Element with ID ${id} not found.`);
    }
}

// Attach function to the global window object
window.toggleApplicants = (id, button) => toggleApplicants(id, button);

// Open email client to contact an applicant
function contactApplicant(email) {
    window.location.href = `mailto:${email}`;
}

window.contactApplicant = contactApplicant;

// Fetch employer's jobs and display their applicants
async function loadEmployerApplicants(employerId) {
    const jobsRef = collection(db, "jobs");
    const q = query(jobsRef, where("employerId", "==", employerId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        document.getElementById("applicants-section").innerHTML = "<p>No job postings found.</p>";
        return;
    }

    let applicantsHTML = "<h2>📋 Applicants for Your Jobs</h2>";

    for (const jobDoc of querySnapshot.docs) {
        const job = jobDoc.data();
        const jobId = jobDoc.id;
        console.log(`Job ID: ${jobId}`);

        applicantsHTML += `
            <div class="employer-applicants-card">
                <h3>${job.title}</h3>
                <button class="toggle-btn secondary-button" onclick="toggleApplicants('${jobId}-applicants', this)">Show Applicants</button>
                <div class="applicants-list" id="${jobId}-applicants" style="display: none;">
                    <table class="applicants-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="${jobId}-applicants-list">
                            <tr><td colspan="4">Loading...</td></tr>
                        </tbody>

                    </table>
                </div>
            </div>
        `;

        // Fetch applicants for this job
        fetchApplicants(jobId);
    }

    document.getElementById("applicants-section").innerHTML = applicantsHTML;
}

// Fetch and display applicants for a specific job
async function fetchApplicants(jobId) {
    const jobRef = doc(db, "jobs", jobId);
    const jobSnap = await getDoc(jobRef);

    if (!jobSnap.exists()) {
        console.error(`Job ${jobId} not found`);
        return;
    }

    const jobData = jobSnap.data();
    const applicantsTable = document.getElementById(`${jobId}-applicants-list`);

    if (!jobData.applicants || jobData.applicants.length === 0) {
        applicantsTable.innerHTML = "<tr><td colspan='5'>No applicants yet.</td></tr>";
        return;
    }

    let applicantsHTML = "";

    for (const userId of jobData.applicants) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            applicantsHTML += `
                <tr>
                    <td>${userData.fullName}</td>
                    <td><a href="mailto:${userData.email}">${userData.email}</a></td>
                    <td>
                        <select onchange="updateApplicantStatus('${jobId}', '${userId}', this.value)">
                            <option value="Pending" ${jobData.applicantStatus?.[userId] === "Pending" ? "selected" : ""}>Pending</option>
                            <option value="Reviewed" ${jobData.applicantStatus?.[userId] === "Reviewed" ? "selected" : ""}>Reviewed</option>
                            <option value="Rejected" ${jobData.applicantStatus?.[userId] === "Rejected" ? "selected" : ""}>Rejected</option>
                            <option value="Hired" ${jobData.applicantStatus?.[userId] === "Hired" ? "selected" : ""}>Hired</option>
                        </select>
                    </td>
                    <td><button class="contact-btn" onclick="contactApplicant('${userData.email}')">✉️ Contact</button></td>
                </tr>
            `;


        } else {
            applicantsHTML += `<tr><td colspan="5">Unknown Applicant (ID: ${userId})</td></tr>`;
        }
    }

    applicantsTable.innerHTML = applicantsHTML;
}

async function updateApplicantStatus(jobId, userId, status) {
    const jobRef = doc(db, "jobs", jobId);

    try {
        await updateDoc(jobRef, {
            [`applicantStatus.${userId}`]: status
        });

        console.log(`Updated status for ${userId} to ${status}`);
    } catch (error) {
        console.error("Error updating applicant status:", error);
    }
}

// Make it available globally
window.updateApplicantStatus = updateApplicantStatus;
