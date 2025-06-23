window.addEventListener("scroll", function () {
  const banner = document.querySelector(".banner");
  if (window.scrollY > 100) {
    banner.classList.add("scrolled");
  } else {
    banner.classList.remove("scrolled");
  }
});

function showFullMenu() {
  const banner = document.querySelector(".banner");
  const links = document.querySelector(".link-group");
  if (window.innerWidth < 600) {
    if (!banner.classList.contains("full")) {
      banner.classList.add("full");
      links.classList.add("full");
    } else {
      banner.classList.remove("full");
      links.classList.remove("full");
    }
  } else {
    if (banner.classList.contains("full")) {
      banner.classList.remove("full");
      links.classList.remove("full");
    }
  }
}

function searchJobsAndRedirect() {
  const searchQuery = document.getElementById("job-title").value.trim();
  if (searchQuery) {
    window.location.href = `postings.html?search=${encodeURIComponent(
      searchQuery
    )}`;
  } else {
    window.location.href = `postings.html`;
  }
}
