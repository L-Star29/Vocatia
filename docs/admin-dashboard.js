import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
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

// Initialize Firebase (only if not already initialized)
const firebaseConfig = {
  apiKey: "AIzaSyCLm2mKWmyyPVMov94Z8oU3tJH78Gwxl48",
  authDomain: "vocatia-754e1.firebaseapp.com",
  projectId: "vocatia-754e1",
  storageBucket: "vocatia-754e1.firebasestorage.app",
  messagingSenderId: "215074444047",
  appId: "1:215074444047:web:79d4317335608a78baa47a",
  measurementId: "G-PTR2HYGCEM",
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  // Already initialized
  app = null;
}
const db = getFirestore();

// Admin Dashboard JavaScript
let allJobs = [];
let currentTab = 'pending';
let currentReviewJobId = null;

// --- Admin Popup Overlay Logic ---
const popup = document.getElementById('admin-popup-message');
const popupText = document.getElementById('admin-popup-text');
const popupTitle = document.getElementById('admin-popup-title');
const closeBtn = document.getElementById('admin-close-popup');
const okBtn = document.getElementById('admin-ok-popup');

function showPopup(message, title = 'Success') {
    if (popupText) popupText.textContent = message;
    if (popupTitle) popupTitle.textContent = title;
    if (popup) popup.style.display = 'flex';
}

function closePopup() {
    if (popup) popup.style.display = 'none';
}

window.showPopup = showPopup;

if (closeBtn) closeBtn.addEventListener('click', closePopup);
if (okBtn) okBtn.addEventListener('click', closePopup);

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin dashboard initializing...');
    
    // Check if admin is authenticated
    if (!isAdminAuthenticated()) {
        showAuthModal();
        document.getElementById('admin-dashboard').style.display = 'none';
        return;
    }
    document.getElementById('admin-auth-modal').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    initializeAdminDashboard();

    // Attach approval modal listeners ONCE
    // attachApprovalModalListeners(); // Move this to initializeAdminDashboard

    // Event delegation for approve buttons (works after DOM updates)
    // document.body.addEventListener('click', function(e) {
    //     const approveBtn = e.target.closest('.approve-button');
    //     if (approveBtn) {
    //         e.stopPropagation();
    //         currentReviewJobId = approveBtn.getAttribute('data-job-id');
    //         document.getElementById('approval-modal').classList.add('active');
    //         document.body.classList.add('modal-open');
    //     }
    // });
});

function attachApprovalModalListeners() {
    const confirmApprovalBtn = document.getElementById('confirm-approval');
    const cancelApprovalBtn = document.getElementById('cancel-approval');
    const closeApprovalBtn = document.getElementById('close-approval-modal');

    if (confirmApprovalBtn) {
        confirmApprovalBtn.onclick = async function() {
            console.log('Confirm clicked, currentReviewJobId:', currentReviewJobId);
            if (currentReviewJobId) {
                await approveJob(currentReviewJobId);
                document.getElementById('approval-modal').classList.remove('active');
                document.body.classList.remove('modal-open');
                currentReviewJobId = null;
                await loadAllJobs();
            } else {
                console.warn('No currentReviewJobId set.');
            }
        };
    }
    if (cancelApprovalBtn) {
        cancelApprovalBtn.onclick = function() {
            document.getElementById('approval-modal').classList.remove('active');
            document.body.classList.remove('modal-open');
            currentReviewJobId = null;
        };
    }
    if (closeApprovalBtn) {
        closeApprovalBtn.onclick = function() {
            document.getElementById('approval-modal').classList.remove('active');
            document.body.classList.remove('modal-open');
            currentReviewJobId = null;
        };
    }
}

// Admin authentication functions
function isAdminAuthenticated() {
    // Always require password on refresh
    return false;
}

function showAuthModal() {
    const modal = document.getElementById('admin-auth-modal');
    if (modal) {
        modal.style.display = 'flex';
        setupAuthModal();
    }
}

let authModalInitialized = false;
function setupAuthModal() {
    if (authModalInitialized) return;
    authModalInitialized = true;

    const passwordInput = document.getElementById('admin-password');
    const authForm = document.getElementById('admin-auth-form');
    const errorDiv = document.getElementById('auth-error');
    const eyeToggle = document.querySelector('.password-toggle');
    let passwordVisible = false;

    // Show/hide password logic
    if (eyeToggle && passwordInput) {
        eyeToggle.addEventListener('click', function() {
            passwordVisible = !passwordVisible;
            passwordInput.type = passwordVisible ? 'text' : 'password';
        });
    }

    // Form submit logic
    if (authForm && passwordInput) {
        authForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const password = passwordInput.value.trim();
            if (password === 'admin123') {
                document.getElementById('admin-auth-modal').style.display = 'none';
                document.getElementById('admin-dashboard').style.display = 'block';
                errorDiv.style.display = 'none';
                initializeAdminDashboard();
            } else {
                if (errorDiv) {
                    errorDiv.style.display = 'block';
                }
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
}

function initializeAdminDashboard() {
    console.log('Initializing admin dashboard...');
    
    // Setup tab switching
    setupTabSwitching();
    
    // Setup refresh buttons
    setupRefreshButtons();
    
    // Load all jobs
    loadAllJobs();

    // Attach approval modal listeners after dashboard is visible
    attachApprovalModalListeners();
}

function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Update active tab button
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update active section
    document.querySelectorAll('.admin-tab-content').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tabName}-jobs`).classList.add('active');
    
    currentTab = tabName;
    
    // Display jobs for current tab
    displayJobsForTab(tabName);
}

function setupRefreshButtons() {
    const refreshButtons = ['refresh-pending', 'refresh-approved', 'refresh-rejected'];
    
    refreshButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function() {
                loadAllJobs();
            });
        }
    });
}

async function loadAllJobs() {
    console.log('Loading all jobs...');
    
    try {
        const jobsRef = collection(db, 'jobs');
        const snapshot = await getDocs(jobsRef);
        
        allJobs = [];
        snapshot.forEach(doc => {
            const jobData = doc.data();
            allJobs.push({
                ...jobData,
                id: doc.id
            });
        });
        
        console.log('Loaded jobs:', allJobs.length);
        
        // Update stats
        updateStats();
        
        // Display jobs for current tab
        displayJobsForTab(currentTab);
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        showError('Failed to load jobs. Please try again.');
    }
}

function updateStats() {
    const pendingCount = allJobs.filter(job => (job.status === 'pending' || (!job.status))).length;
    const approvedCount = allJobs.filter(job => job.status === 'approved').length;
    const rejectedCount = allJobs.filter(job => job.status === 'rejected').length;
    const totalCount = allJobs.length;
    
    // Update stat cards
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('approved-count').textContent = approvedCount;
    document.getElementById('rejected-count').textContent = rejectedCount;
    document.getElementById('total-jobs').textContent = totalCount;
    
    // Update tab counts
    document.getElementById('pending-tab-count').textContent = pendingCount;
    document.getElementById('approved-tab-count').textContent = approvedCount;
    document.getElementById('rejected-tab-count').textContent = rejectedCount;
}

function displayJobsForTab(tabName) {
    console.log('Displaying jobs for tab:', tabName);
    let jobs;
    if (tabName === 'pending') {
        jobs = allJobs.filter(job => (job.status === 'pending' || (!job.status)));
    } else if (tabName === 'approved') {
        jobs = allJobs.filter(job => job.status === 'approved');
    } else if (tabName === 'rejected') {
        jobs = allJobs.filter(job => job.status === 'rejected');
    } else {
        jobs = [];
    }
    const jobsList = document.getElementById(`${tabName}-jobs-list`);
    const noJobsMessage = document.getElementById(`no-${tabName}-message`);
    
    if (jobs.length === 0) {
        if (jobsList) jobsList.innerHTML = '';
        if (noJobsMessage) noJobsMessage.style.display = 'block';
        return;
    }
    
    if (noJobsMessage) noJobsMessage.style.display = 'none';
    
    if (jobsList) {
        jobsList.innerHTML = '';
        jobs.forEach(job => {
            jobsList.insertAdjacentHTML('beforeend', createJobCard(job, tabName));
        });
        void jobsList.offsetHeight; // Force a reflow just in case
        // Force SVGs to be visible after dynamic injection
        requestAnimationFrame(() => {
            document.querySelectorAll('.admin-job-actions svg').forEach(el => el.style.opacity = '1');
        });
        setupJobCardListeners(tabName);
    }
}

function createJobCard(job, tabName) {
    const statusClass = job.status || 'pending';
    const statusText = (job.status || 'pending').charAt(0).toUpperCase() + (job.status || 'pending').slice(1);
    
    let actions = '';
    if (tabName === 'pending') {
        actions = `
            <button class="review-button" data-job-id="${job.id}">Review</button>
            <button class="approve-button" data-job-id="${job.id}">Approve</button>
            <button class="reject-button" data-job-id="${job.id}">Reject</button>
        `;
    } else {
        actions = `
            <button class="view-button" data-job-id="${job.id}">View</button>
        `;
    }
    
    return `
        <div class="admin-job-card ${statusClass}" data-job-id="${job.id}">
            <div class="admin-job-header">
                <div>
                    <h3 class="admin-job-title">${job.title || 'Untitled Job'}</h3>
                    <p class="admin-job-company">${job.company || 'Unknown Company'}</p>
                </div>
                <span class="admin-job-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="admin-job-details">
                <div class="admin-job-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>${job.location || 'Location not specified'}</span>
                </div>
                <div class="admin-job-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    <span>${job.jobType || job.type || 'Type not specified'}</span>
                </div>
                <div class="admin-job-detail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <span>Posted: ${job.createdAt && job.createdAt.toDate ? formatDate(job.createdAt.toDate()) : 'Unknown'}</span>
                </div>
            </div>
            
            <div class="admin-job-actions">
                ${actions}
            </div>
        </div>
    `;
}

function setupJobCardListeners(tabName) {
    if (tabName === 'pending') {
        // Only select buttons inside the jobs list, not in modals
        const jobsList = document.getElementById('pending-jobs-list');
        if (!jobsList) return;
        // Review button
        jobsList.querySelectorAll('.review-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const jobId = this.getAttribute('data-job-id');
                reviewJob(jobId);
            });
        });
        // Approve button (job card only)
        jobsList.querySelectorAll('.approve-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const jobId = this.getAttribute('data-job-id');
                currentReviewJobId = jobId;
                document.getElementById('approval-modal').classList.add('active');
                document.body.classList.add('modal-open');
            });
        });
        // Reject button (job card only)
        jobsList.querySelectorAll('.reject-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const jobId = this.getAttribute('data-job-id');
                currentReviewJobId = jobId;
                document.getElementById('rejection-modal').classList.add('active');
                document.body.classList.add('modal-open');
            });
        });
    } else {
        // View button for approved/rejected jobs
        const jobsList = document.getElementById(`${tabName}-jobs-list`);
        if (!jobsList) return;
        jobsList.querySelectorAll('.view-button').forEach(button => {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                const jobId = this.getAttribute('data-job-id');
                viewJobDetails(jobId);
            });
        });
    }
}

async function approveJob(jobId) {
    try {
        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);
        
        if (!jobSnap.exists()) {
            showError('Job not found.');
            return;
        }
        
        const jobData = jobSnap.data();
        
        await updateDoc(jobRef, {
            status: 'approved',
            approvedAt: serverTimestamp(),
            approvedBy: 'admin'
        });
        
        // Add notification for the employer
        try {
            await addDoc(collection(db, "notifications"), {
                employerId: jobData.employerId,
                type: 'job_approved',
                message: `Your job posting "${jobData.title}" has been approved!`,
                jobId: jobId,
                jobTitle: jobData.title,
                timestamp: serverTimestamp(),
                read: false
            });
        } catch (notificationError) {
            console.error('Error adding approval notification:', notificationError);
        }
        
        showSuccess('Job approved successfully!');
        loadAllJobs(); // Refresh the data
        
    } catch (error) {
        console.error('Error approving job:', error);
        showError('Failed to approve job. Please try again.');
    }
}

function showJobDetailModal() {
    // Hide all modals first
    document.querySelectorAll('.job-review-modal').forEach(modal => modal.classList.remove('active'));
    document.getElementById('job-detail-modal').classList.add('active');
    document.body.classList.add('modal-open');
}

function hideJobDetailModal() {
    document.getElementById('job-detail-modal').classList.remove('active');
    document.body.classList.remove('modal-open');
}

// Helper to fetch employer name from users collection
async function getEmployerNameById(employerId) {
    if (!employerId) return null;
    try {
        const userRef = doc(db, 'users', employerId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            return userData.fullName || userData.name || userData.company || employerId;
        }
    } catch (e) {
        console.error('Error fetching employer name:', e);
    }
    return employerId;
}

async function reviewJob(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) {
        showError('Job not found.');
        return;
    }
    // Fill in the review modal fields
    document.getElementById('review-job-title').textContent = job.title || 'N/A';
    document.getElementById('review-company').textContent = job.company || 'N/A';
    document.getElementById('review-location').textContent = job.location || 'N/A';
    document.getElementById('review-type').textContent = job.jobType || job.type || 'N/A';
    document.getElementById('review-salary').textContent = job.salary || 'N/A';
    document.getElementById('review-description').textContent = job.jobDescription || job.description || 'N/A';
    // Fetch employer name from users collection
    const employerId = job.employerId || job.employer;
    const employerName = await getEmployerNameById(employerId);
    document.getElementById('review-employer').textContent = employerName || employerId || 'N/A';
    document.getElementById('review-date').textContent = job.createdAt && job.createdAt.toDate ? formatDate(job.createdAt.toDate()) : 'N/A';
    // Show the review modal
    document.getElementById('job-review-modal').classList.add('active');
    document.body.classList.add('modal-open');
    currentReviewJobId = jobId;
}

function viewJobDetails(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) {
        showError('Job not found.');
        return;
    }
    document.getElementById('job-detail-title').textContent = job.title || 'N/A';
    document.getElementById('job-detail-company').textContent = job.company || 'N/A';
    document.getElementById('job-detail-location').textContent = job.location || 'N/A';
    document.getElementById('job-detail-type').textContent = job.jobType || job.type || 'N/A';
    document.getElementById('job-detail-salary').textContent = job.salary || 'N/A';
    document.getElementById('job-detail-description').textContent = job.jobDescription || job.description || 'N/A';
    document.getElementById('job-detail-date').textContent = job.createdAt && job.createdAt.toDate ? formatDate(job.createdAt.toDate()) : 'N/A';
    document.getElementById('job-detail-status').textContent = job.status || 'N/A';
    showJobDetailModal();
}

// Update close logic for modal
if (document.getElementById('close-job-detail-modal')) {
    document.getElementById('close-job-detail-modal').onclick = function() {
        hideJobDetailModal();
    };
}

// For the review modal (if used elsewhere)
if (document.getElementById('close-review-modal')) {
    document.getElementById('close-review-modal').onclick = function() {
        document.getElementById('job-review-modal').classList.remove('active');
        document.body.classList.remove('modal-open');
    };
}

// Rejection modal logic
const confirmRejectionBtn = document.getElementById('confirm-rejection');
const cancelRejectionBtn = document.getElementById('cancel-rejection');
const closeRejectionBtn = document.getElementById('close-rejection-modal');

if (confirmRejectionBtn) {
    confirmRejectionBtn.onclick = async function() {
        const reason = document.getElementById('rejection-reason').value;
        if (!reason || reason.trim() === '') {
            showError('Rejection reason is required.');
            return;
        }
        if (currentReviewJobId) {
            await rejectJobWithReason(currentReviewJobId, reason);
            document.getElementById('rejection-modal').classList.remove('active');
            document.body.classList.remove('modal-open');
            currentReviewJobId = null;
            document.getElementById('rejection-reason').value = '';
        }
    };
}
if (cancelRejectionBtn) {
    cancelRejectionBtn.onclick = function() {
        document.getElementById('rejection-modal').classList.remove('active');
        document.body.classList.remove('modal-open');
        currentReviewJobId = null;
        document.getElementById('rejection-reason').value = '';
    };
}
if (closeRejectionBtn) {
    closeRejectionBtn.onclick = function() {
        document.getElementById('rejection-modal').classList.remove('active');
        document.body.classList.remove('modal-open');
        currentReviewJobId = null;
        document.getElementById('rejection-reason').value = '';
    };
}

// Helper for rejection with reason
async function rejectJobWithReason(jobId, reason) {
    try {
        const jobRef = doc(db, 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);
        
        if (!jobSnap.exists()) {
            showError('Job not found.');
            return;
        }
        
        const jobData = jobSnap.data();
        
        await updateDoc(jobRef, {
            status: 'rejected',
            rejectedAt: serverTimestamp(),
            rejectedBy: 'admin',
            rejectionReason: reason.trim()
        });
        
        // Add notification for the employer
        try {
            await addDoc(collection(db, "notifications"), {
                employerId: jobData.employerId,
                type: 'job_rejected',
                message: `Your job posting "${jobData.title}" was rejected. Reason: ${reason.trim()}`,
                jobId: jobId,
                jobTitle: jobData.title,
                timestamp: serverTimestamp(),
                read: false
            });
        } catch (notificationError) {
            console.error('Error adding rejection notification:', notificationError);
        }
        
        showSuccess('Job rejected successfully!');
        loadAllJobs();
    } catch (error) {
        console.error('Error rejecting job:', error);
        showError('Failed to reject job. Please try again.');
    }
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Invalid date';
    }
}

function showSuccess(message) {
    window.showPopup(message, 'Success');
}

function showError(message) {
    window.showPopup(message, 'Error');
}

// Force Chrome to repaint icons after everything is loaded
window.addEventListener("load", () => {
  document.body.style.transform = "scale(1)";
}); 

// Attach review modal button listeners
const reviewApproveBtn = document.getElementById('review-approve-btn');
const reviewRejectBtn = document.getElementById('review-reject-btn');
const reviewCancelBtn = document.getElementById('review-cancel-btn');

if (reviewApproveBtn) {
    reviewApproveBtn.addEventListener('click', async function() {
        if (currentReviewJobId) {
            await approveJob(currentReviewJobId);
            document.getElementById('job-review-modal').classList.remove('active');
            document.body.classList.remove('modal-open');
            currentReviewJobId = null;
        }
    });
}
if (reviewRejectBtn) {
    reviewRejectBtn.addEventListener('click', function() {
        if (currentReviewJobId) {
            document.getElementById('job-review-modal').classList.remove('active');
            document.getElementById('rejection-modal').classList.add('active');
            document.body.classList.add('modal-open');
        }
    });
}
if (reviewCancelBtn) {
    reviewCancelBtn.addEventListener('click', function() {
        document.getElementById('job-review-modal').classList.remove('active');
        document.body.classList.remove('modal-open');
        currentReviewJobId = null;
    });
} 