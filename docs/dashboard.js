document.addEventListener("DOMContentLoaded", function () {
    // Mock data (replace with API calls later)
    document.getElementById("active-jobs").innerText = "5";
    document.getElementById("pending-jobs").innerText = "2";
    document.getElementById("closed-jobs").innerText = "3";

    // Mock applicants list
    const applicants = [
        "🔹 Alex Johnson - Web Developer",
        "🔹 Priya Sharma - UX Designer",
        "🔹 Jason Lee - Marketing Intern",
    ];
    document.getElementById("applicants-list").innerHTML = applicants.map(a => `<p>${a}</p>`).join("");

    // Mock notifications
    const notifications = [
        "📩 New application for Web Developer",
        "✅ Your job posting 'UX Designer' is approved!",
        "⏳ Your job 'Marketing Intern' is under review",
    ];
    document.getElementById("notifications").innerHTML = notifications.map(n => `<li>${n}</li>`).join("");

    // Mock job insights
    document.getElementById("job-views").innerText = "1,230";
    document.getElementById("job-applications").innerText = "45";
});
