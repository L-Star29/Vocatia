import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp, orderBy, limit, deleteDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await loadEmployerJobs(user.uid);
            await loadEmployerApplicants(user.uid);
            await loadNotifications(user.uid);
            await loadRecentApplicants(user.uid);
            await loadJobStats(user.uid);
        } else {
            document.getElementById("applicants-section").innerHTML = "<p>Please log in to view applicants.</p>";
        }
    });
});

// Restore the original job card design for the postings tab
function renderEmployerJobCard(jobId, job) {
    const card = document.createElement('div');
    card.className = 'admin-job-card ' + (job.status ? job.status.toLowerCase() : '');
    card.innerHTML = `
        <div class="admin-job-title">${job.title || 'Untitled'}</div>
        <div class="admin-job-company"><strong>Company:</strong> ${job.company || ''}</div>
        <div class="admin-job-status ${job.status ? job.status.toLowerCase() : ''}">${job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'N/A'}</div>
        <div class="admin-job-detail">
            <span><strong>Location:</strong> ${job.location || ''}</span><br>
            <span><strong>Type:</strong> ${job.jobType || job.type || ''}</span><br>
            <span><strong>Salary:</strong> ${job.salary || ''}</span>
        </div>
        <div class="admin-job-actions">
            <button class="approve-button" onclick="showJobDetailsModal('${jobId}')">View Details</button>
        </div>
    `;
    return card;
}

async function loadEmployerJobs(employerId) {
    const jobListings = document.getElementById('job-listings');
    if (!jobListings) return;
    jobListings.innerHTML = '<p>Loading...</p>';
    try {
        const q = query(collection(db, 'jobs'), where('employerId', '==', employerId));
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

// Hide the job details modal by default and only show when triggered
function showJobDetailsModal(jobId) {
    const modal = document.getElementById('job-details-modal');
    if (!modal) return;
    // Populate modal with job details (implement as needed)
    modal.classList.add('active');
}

async function loadEmployerApplicants(employerId) {
    const applicantsSection = document.getElementById("applicants-section");
    if (!applicantsSection) return;

    try {
        const q = query(collection(db, "jobs"), where("employerId", "==", employerId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            applicantsSection.innerHTML = "<p>No job postings found.</p>";
            return;
        }

        applicantsSection.innerHTML = "";

        for (const jobDoc of querySnapshot.docs) {
            const job = jobDoc.data();
            const jobId = jobDoc.id;

            // Skip jobs with status 'rejected'
            if (job.status && job.status.toLowerCase() === 'rejected') continue;
            
            // Create job section
            const jobSection = document.createElement("div");
            jobSection.className = "job-applicants-section";
            
            const applicantCount = job.applications ? Object.keys(job.applications).length : 0;
            
            jobSection.innerHTML = `
                <div class="job-applicants-header">
                    <div class="job-applicants-info">
                        <h3>${job.title}</h3>
                        <p class="job-company">${job.company} • ${job.location}</p>
                        <span class="applicant-count">${applicantCount} applicant${applicantCount !== 1 ? 's' : ''}</span>
                    </div>
                </div>
                <div class="job-applicants-content" id="job-${jobId}-applicants">
                    ${applicantCount === 0 ? '<div class="no-applicants">No applicants yet for this job.</div>' : ''}
                </div>
            `;
            
            applicantsSection.appendChild(jobSection);
            
            // Add applicants for this job
            if (job.applications && Object.keys(job.applications).length > 0) {
                const applicantsContent = jobSection.querySelector(`#job-${jobId}-applicants`);
                applicantsContent.innerHTML = '<div class="applicants-grid"></div>';
                const applicantsGrid = applicantsContent.querySelector('.applicants-grid');
                
                for (const [studentId, application] of Object.entries(job.applications)) {
                    createApplicantElement(application, jobId, job, applicantsGrid);
                }
            }
        }

        if (applicantsSection.children.length === 0) {
            applicantsSection.innerHTML = "<p>No applicants yet.</p>";
        }
    } catch (error) {
        console.error("Error fetching applicants:", error);
        applicantsSection.innerHTML = "<p>Error loading applicants.</p>";
    }
}

function createApplicantElement(application, jobId, job, container) {
    const applicantElement = document.createElement("div");
    applicantElement.className = "applicant-card";
    
    const appliedDate = application.appliedAt ? new Date(application.appliedAt.toDate()).toLocaleDateString() : "Unknown";
    
    applicantElement.innerHTML = `
        <div class="applicant-card-header">
            <div class="applicant-info">
                <h4>${application.studentName}</h4>
                <p class="applicant-email">${application.studentEmail}</p>
            </div>
            <div class="applicant-status-container">
                <select class="status-select" onchange="updateApplicantStatus('${jobId}', '${application.studentId}', this.value)">
                    <option value="pending" ${application.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="reviewed" ${application.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
                    <option value="contacted" ${application.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="accepted" ${application.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="rejected" ${application.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                </select>
            </div>
        </div>
        <div class="applicant-card-body">
            <div class="applicant-details">
                <div class="detail-row">
                    <span class="detail-label">Applied:</span>
                    <span class="detail-value">${appliedDate}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Contact:</span>
                    <span class="detail-value">${application.contact || application.studentEmail}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Age:</span>
                    <span class="detail-value">${application.age || "Not specified"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">School:</span>
                    <span class="detail-value">${application.schoolName || "Not specified"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Grade:</span>
                    <span class="detail-value">${application.grade || "Not specified"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">GPA:</span>
                    <span class="detail-value">${application.gpa || "Not specified"}</span>
                </div>
            </div>
        </div>
        <div class="applicant-card-actions">
            <button class="view-profile-btn" onclick="viewApplicantProfile('${application.studentId}', '${jobId}')">View Full Profile</button>
            <button class="contact-btn" onclick="contactApplicant('${application.studentId}', '${application.studentEmail}')">Contact</button>
        </div>
    `;
    
    container.appendChild(applicantElement);
}

// Global functions for onclick handlers
window.viewJobDetails = function(jobId) {
    // Implementation for viewing job details
    console.log("View job details:", jobId);
};

window.viewApplicantProfile = function(studentId, jobId) {
    // Implementation for viewing full applicant profile
    console.log("View applicant profile:", studentId, jobId);
    showApplicantProfileModal(studentId, jobId);
};

window.contactApplicant = function(studentId, email) {
    // Implementation for contacting applicant
    console.log("Contact applicant:", studentId, email);
    window.open(`mailto:${email}`, '_blank');
};

async function showApplicantProfileModal(studentId, jobId) {
    try {
        // Get the job and application data
        const jobRef = doc(db, "jobs", jobId);
        const jobSnap = await getDoc(jobRef);
        
        if (!jobSnap.exists()) {
            showPopup("Job not found.");
            return;
        }
        
        const job = jobSnap.data();
        const application = job.applications[studentId];
        
        if (!application) {
            showPopup("Application not found.");
            return;
        }
        
        // Create and show modal with full profile information
        const modal = document.createElement("div");
        modal.className = "applicant-profile-modal";
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${application.studentName}'s Profile</h3>
                    <button class="close-button" onclick="this.closest('.applicant-profile-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="profile-section">
                        <h4>Basic Information</h4>
                        <p><strong>Name:</strong> ${application.studentName}</p>
                        <p><strong>Email:</strong> ${application.studentEmail}</p>
                        <p><strong>Contact:</strong> ${application.contact || "Not provided"}</p>
                        <p><strong>Age:</strong> ${application.age || "Not provided"}</p>
                        <p><strong>GPA:</strong> ${application.gpa || "Not provided"}</p>
                    </div>
                    
                    <div class="profile-section">
                        <h4>Education</h4>
                        <p><strong>School:</strong> ${application.schoolName || "Not provided"}</p>
                        <p><strong>Grade:</strong> ${application.grade || "Not provided"}</p>
                        <p><strong>Graduation Year:</strong> ${application.graduationYear || "Not provided"}</p>
                    </div>
                    
                    <div class="profile-section">
                        <h4>Bio</h4>
                        <p>${application.bio || "No bio provided"}</p>
                    </div>
                    
                    <div class="profile-section">
                        <h4>Skills</h4>
                        <p>${application.skills || "No skills listed"}</p>
                    </div>
                    
                    <div class="profile-section">
                        <h4>Experience</h4>
                        <p>${application.experience || "No experience listed"}</p>
                    </div>
                    
                    <div class="profile-section">
                        <h4>Additional Information</h4>
                        <p>${application.additionalInfo || "No additional information"}</p>
                    </div>
                    
                    <div class="profile-section">
                        <h4>Application Details</h4>
                        <p><strong>Applied for:</strong> ${application.jobTitle} at ${application.jobCompany}</p>
                        <p><strong>Applied on:</strong> ${application.appliedAt ? new Date(application.appliedAt.toDate()).toLocaleString() : "Unknown"}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${application.status}">${application.status}</span></p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="contact-btn" onclick="contactApplicant('${studentId}', '${application.studentEmail}')">Contact Applicant</button>
                    <button class="close-btn" onclick="this.closest('.applicant-profile-modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error("Error showing applicant profile:", error);
        showPopup("Error loading applicant profile.");
    }
};

// Popup functionality
function showPopup(message) {
    const popup = document.getElementById("popup-message");
    const popupText = document.getElementById("popup-text");
    
    if (popup && popupText) {
        popupText.textContent = message;
        popup.style.display = "flex";
        
        const okBtn = document.getElementById("popup-ok");
        if (okBtn) {
            okBtn.onclick = () => {
                popup.style.display = "none";
            };
        }
    }
}

window.updateApplicantStatus = async function(jobId, studentId, newStatus) {
    try {
        const jobRef = doc(db, "jobs", jobId);
        await updateDoc(jobRef, {
            [`applications.${studentId}.status`]: newStatus
        });
        showPopup(`Status updated to ${newStatus}`);
    } catch (error) {
        console.error("Error updating applicant status:", error);
        showPopup("Failed to update status. Please try again.");
    }
};

// --- PDF Download Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Populate job dropdown for PDF download
    onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        const select = document.getElementById('job-pdf-select');
        if (!select) return;
        select.innerHTML = '<option value="">Select Job</option>';
        const q = query(collection(db, 'jobs'), where('employerId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(docSnap => {
            const job = docSnap.data();
            select.innerHTML += `<option value="${docSnap.id}">${job.title || 'Untitled'} (${job.location || 'No location'})</option>`;
        });
    });

    // Download PDF button handler
    document.getElementById('download-applicants-pdf')?.addEventListener('click', async () => {
        const jobId = document.getElementById('job-pdf-select').value;
        if (!jobId) {
            showPopup('Please select a job first');
            return;
        }
        await generateApplicantsPDF(jobId);
    });
});

async function generateApplicantsPDF(jobId) {
    try {
        // Load jsPDF if not already loaded
        if (typeof window.jspdf === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            document.head.appendChild(script);
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                // Timeout after 10 seconds
                setTimeout(() => reject(new Error('jsPDF failed to load')), 10000);
            });
        }

        // Wait a moment for jsPDF to be available
        await new Promise(resolve => setTimeout(resolve, 100));

        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            throw new Error('jsPDF not available');
        }

        const pdfDoc = new jsPDF();
        
        // Get job details
        const jobDoc = await getDoc(doc(db, 'jobs', jobId));
        const job = jobDoc.data();
        
        // Set up styling
        pdfDoc.setFont('helvetica');
        pdfDoc.setFontSize(20);
        pdfDoc.setTextColor(108, 46, 183); // Purple color
        
        // Title
        pdfDoc.text('Applicants Report', 20, 30);
        
        // Job details
        pdfDoc.setFontSize(14);
        pdfDoc.setTextColor(60, 60, 60);
        pdfDoc.text(`Job: ${job.title || 'Untitled'}`, 20, 45);
        pdfDoc.text(`Location: ${job.location || 'Not specified'}`, 20, 55);
        pdfDoc.text(`Type: ${job.jobType || job.type || 'Not specified'}`, 20, 65);
        pdfDoc.text(`Salary: ${job.salary || 'Not specified'}`, 20, 75);
        
        // Line separator
        pdfDoc.setDrawColor(108, 46, 183);
        pdfDoc.line(20, 85, 190, 85);
        
        // Applicants section
        pdfDoc.setFontSize(16);
        pdfDoc.setTextColor(108, 46, 183);
        pdfDoc.text('Applicants', 20, 100);
        
        let yPosition = 115;
        const applications = job.applications || {};
        const applicantIds = Object.keys(applications);
        
        if (applicantIds.length === 0) {
            pdfDoc.setFontSize(12);
            pdfDoc.setTextColor(100, 100, 100);
            pdfDoc.text('No applicants for this job yet.', 20, yPosition);
        } else {
            for (let i = 0; i < applicantIds.length; i++) {
                const studentId = applicantIds[i];
                const application = applications[studentId];
                
                // Check if we need a new page
                if (yPosition > 250) {
                    pdfDoc.addPage();
                    yPosition = 30;
                }
                
                // Applicant header
                pdfDoc.setFontSize(14);
                pdfDoc.setTextColor(108, 46, 183);
                pdfDoc.text(`${i + 1}. ${application.studentName || 'Unknown Name'}`, 20, yPosition);
                
                // Contact info
                yPosition += 8;
                pdfDoc.setFontSize(10);
                pdfDoc.setTextColor(60, 60, 60);
                pdfDoc.text(`Email: ${application.studentEmail || 'Not provided'}`, 25, yPosition);
                
                yPosition += 6;
                pdfDoc.text(`Phone: ${application.contact || 'Not provided'}`, 25, yPosition);
                
                // Status
                yPosition += 6;
                const status = application.status || 'pending';
                const statusColor = status === 'approved' || status === 'accepted' ? [34, 197, 94] : 
                                  status === 'rejected' ? [239, 68, 68] : 
                                  [245, 158, 11];
                pdfDoc.setTextColor(...statusColor);
                pdfDoc.text(`Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`, 25, yPosition);
                
                // Basic info
                yPosition += 6;
                pdfDoc.setTextColor(60, 60, 60);
                const age = application.age || 'N/A';
                const gpa = application.gpa || 'N/A';
                const school = application.schoolName || 'Not specified';
                const grade = application.grade || 'Not specified';
                pdfDoc.text(`Age: ${age} | GPA: ${gpa} | School: ${school} | Grade: ${grade}`, 25, yPosition);
                
                // Skills
                if (application.skills && application.skills.trim()) {
                    yPosition += 6;
                    const skillsText = `Skills: ${application.skills}`;
                    const skillsLines = pdfDoc.splitTextToSize(skillsText, 150);
                    pdfDoc.text(skillsLines, 25, yPosition);
                    yPosition += (skillsLines.length * 5);
                }
                
                // Experience
                if (application.experience && application.experience.trim()) {
                    yPosition += 6;
                    const experienceText = `Experience: ${application.experience}`;
                    const experienceLines = pdfDoc.splitTextToSize(experienceText, 150);
                    pdfDoc.text(experienceLines, 25, yPosition);
                    yPosition += (experienceLines.length * 5);
                }
                
                // Bio
                if (application.bio && application.bio.trim()) {
                    yPosition += 6;
                    const bioText = `Bio: ${application.bio}`;
                    const bioLines = pdfDoc.splitTextToSize(bioText, 150);
                    pdfDoc.text(bioLines, 25, yPosition);
                    yPosition += (bioLines.length * 5);
                }
                
                // Additional Info
                if (application.additionalInfo && application.additionalInfo.trim()) {
                    yPosition += 6;
                    const additionalText = `Additional Info: ${application.additionalInfo}`;
                    const additionalLines = pdfDoc.splitTextToSize(additionalText, 150);
                    pdfDoc.text(additionalLines, 25, yPosition);
                    yPosition += (additionalLines.length * 5);
                }
                
                // Applied date
                yPosition += 6;
                const appliedDate = application.appliedAt ? new Date(application.appliedAt.toDate()).toLocaleDateString() : 'Unknown';
                pdfDoc.text(`Applied: ${appliedDate}`, 25, yPosition);
                
                // Spacing between applicants
                yPosition += 10;
                
                // Add separator line between applicants
                if (i < applicantIds.length - 1) {
                    pdfDoc.setDrawColor(200, 200, 200);
                    pdfDoc.line(20, yPosition - 5, 190, yPosition - 5);
                }
            }
        }
        
        // Footer
        pdfDoc.setFontSize(8);
        pdfDoc.setTextColor(100, 100, 100);
        pdfDoc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 280);
        
        // Save the PDF
        const fileName = `applicants_${job.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'job'}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdfDoc.save(fileName);
        
        showPopup('PDF downloaded successfully!');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showPopup('Failed to generate PDF. Please try again.');
    }
}

// Notification functions
async function addNotification(employerId, type, message, jobId = null, jobTitle = null) {
    try {
        const notificationData = {
            employerId: employerId,
            type: type, // 'application', 'job_approved', 'job_rejected'
            message: message,
            jobId: jobId,
            jobTitle: jobTitle,
            timestamp: serverTimestamp(),
            read: false
        };
        
        await addDoc(collection(db, "notifications"), notificationData);
    } catch (error) {
        console.error("Error adding notification:", error);
    }
}

async function loadNotifications(employerId) {
    const notificationsList = document.getElementById('notifications');
    if (!notificationsList) return;
    
    try {
        // Get notifications for this employer (without ordering to avoid index requirement)
        const q = query(
            collection(db, "notifications"),
            where("employerId", "==", employerId),
            limit(10) // Get more than needed to account for sorting
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            notificationsList.innerHTML = '<li>No updates yet</li>';
            return;
        }
        
        // Convert to array and sort by timestamp in JavaScript
        const notifications = [];
        querySnapshot.forEach(docSnap => {
            const notification = docSnap.data();
            notifications.push({
                ...notification,
                id: docSnap.id
            });
        });
        
        // Sort by timestamp (newest first) and take only the first 5
        notifications.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toDate() : new Date(0);
            const timeB = b.timestamp ? b.timestamp.toDate() : new Date(0);
            return timeB - timeA;
        });
        
        const recentNotifications = notifications.slice(0, 5);
        
        notificationsList.innerHTML = '';
        recentNotifications.forEach(notification => {
            const li = document.createElement('li');
            
            // Format timestamp
            const timestamp = notification.timestamp ? notification.timestamp.toDate() : new Date();
            const timeAgo = getTimeAgo(timestamp);
            
            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <span>${notification.message}</span>
                    <small style="opacity: 0.7; font-size: 0.75rem; margin-left: 8px;">${timeAgo}</small>
                </div>
            `;
            
            notificationsList.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading notifications:", error);
        notificationsList.innerHTML = '<li>Error loading updates</li>';
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
}

// Function to get current user ID
function getCurrentUserId() {
    const user = auth.currentUser;
    if (!user) {
        showPopup("Please log in to perform this action");
        return null;
    }
    return user.uid;
}

// Function to delete all notifications
async function deleteAllNotifications(employerId) {
    if (!employerId) {
        employerId = getCurrentUserId();
        if (!employerId) return;
    }
    
    try {
        const q = query(collection(db, "notifications"), where("employerId", "==", employerId));
        const querySnapshot = await getDocs(q);
        
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        
        console.log(`Deleted ${querySnapshot.docs.length} notifications`);
        showPopup(`Deleted ${querySnapshot.docs.length} notifications`);
        
        // Refresh the notifications display
        await loadNotifications(employerId);
    } catch (error) {
        console.error("Error deleting notifications:", error);
        showPopup("Error deleting notifications");
    }
}

// Make functions globally available
window.addNotification = addNotification;
window.loadNotifications = loadNotifications;
window.loadRecentApplicants = loadRecentApplicants;
window.loadJobStats = loadJobStats;
window.deleteAllNotifications = deleteAllNotifications;
window.getCurrentUserId = getCurrentUserId;

// Refresh notifications every 30 seconds
setInterval(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
        loadNotifications(currentUser.uid);
        loadRecentApplicants(currentUser.uid);
        loadJobStats(currentUser.uid);
    }
}, 30000);

// Add manual refresh function
window.refreshNotifications = function() {
    const currentUser = auth.currentUser;
    if (currentUser) {
        loadNotifications(currentUser.uid);
        loadRecentApplicants(currentUser.uid);
        loadJobStats(currentUser.uid);
    }
};

// Load recent applicants for the overview section
async function loadRecentApplicants(employerId) {
    const applicantsList = document.getElementById('applicants-list');
    if (!applicantsList) return;
    
    try {
        // Get all jobs for this employer
        const q = query(collection(db, 'jobs'), where('employerId', '==', employerId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            applicantsList.innerHTML = '<div style="text-align: center; color: #fff; padding: 20px;">No job postings yet</div>';
            return;
        }
        
        // Collect all applications from all jobs
        const allApplications = [];
        
        querySnapshot.forEach(docSnap => {
            const job = docSnap.data();
            const jobId = docSnap.id;
            
            if (job.applications && Object.keys(job.applications).length > 0) {
                Object.entries(job.applications).forEach(([studentId, application]) => {
                    allApplications.push({
                        ...application,
                        jobId: jobId,
                        jobTitle: job.title,
                        appliedAt: application.appliedAt
                    });
                });
            }
        });
        
        if (allApplications.length === 0) {
            applicantsList.innerHTML = '<div style="text-align: center; color: #fff; padding: 20px;">No applicants yet</div>';
            return;
        }
        
        // Sort by application date (newest first) and take the 8 most recent
        allApplications.sort((a, b) => {
            const timeA = a.appliedAt ? a.appliedAt.toDate() : new Date(0);
            const timeB = b.appliedAt ? b.appliedAt.toDate() : new Date(0);
            return timeB - timeA;
        });
        
        const recentApplications = allApplications.slice(0, 8);
        
        // Render the recent applicants
        applicantsList.innerHTML = '';
        recentApplications.forEach(application => {
            const applicantElement = document.createElement('div');
            applicantElement.className = 'applicant-item';
            
            // Generate initials from name
            const initials = getInitials(application.studentName);
            
            // Calculate time ago
            const appliedTime = application.appliedAt ? application.appliedAt.toDate() : new Date();
            const timeAgo = getTimeAgo(appliedTime);
            
            applicantElement.innerHTML = `
                <div class="applicant-avatar">${initials}</div>
                <div class="applicant-info">
                    <h4>${application.studentName}</h4>
                    <p>${application.jobTitle} - Applied ${timeAgo}</p>
                </div>
            `;
            
            applicantsList.appendChild(applicantElement);
        });
        
    } catch (error) {
        console.error("Error loading recent applicants:", error);
        applicantsList.innerHTML = '<div style="text-align: center; color: #fff; padding: 20px;">Error loading applicants</div>';
    }
}

// Helper function to get initials from a name
function getInitials(name) {
    if (!name) return '??';
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
}

// Load job statistics for the overview section
async function loadJobStats(employerId) {
    try {
        // Get all jobs for this employer
        const q = query(collection(db, 'jobs'), where('employerId', '==', employerId));
        const querySnapshot = await getDocs(q);
        
        let activeJobs = 0;
        let pendingApproval = 0;
        let totalApplicants = 0;
        
        querySnapshot.forEach(docSnap => {
            const job = docSnap.data();
            
            if (job.status === 'approved') {
                activeJobs++;
            } else if (job.status === 'pending') {
                pendingApproval++;
            }
            
            // Count total applicants across all jobs
            if (job.applications) {
                totalApplicants += Object.keys(job.applications).length;
            }
        });
        
        // Update the stats display
        const activeJobsElement = document.querySelector('.stat-item:nth-child(1) .stat-number');
        const pendingApprovalElement = document.querySelector('.stat-item:nth-child(2) .stat-number');
        
        if (activeJobsElement) {
            activeJobsElement.textContent = activeJobs;
        }
        if (pendingApprovalElement) {
            pendingApprovalElement.textContent = pendingApproval;
        }
        
        // Add a third stat for total applicants if there's space
        const statsGrid = document.querySelector('.stats-grid');
        if (statsGrid && statsGrid.children.length < 3) {
            const applicantsStat = document.createElement('div');
            applicantsStat.className = 'stat-item';
            applicantsStat.innerHTML = `
                <div class="stat-number">${totalApplicants}</div>
                <div class="stat-label">Total Applicants</div>
            `;
            statsGrid.appendChild(applicantsStat);
        }
        
    } catch (error) {
        console.error("Error loading job stats:", error);
    }
} 