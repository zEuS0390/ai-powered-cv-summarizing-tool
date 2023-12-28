// Importing 'form' from the 'variables.js' file, and functions from the 'functions.js' file
import { addJobButton, backPageButton, settingsButton, userTitle } from "./variables.js";
import { createJobModal, showModal, getJobs, updateJobsTable, createJobSettingsModal } from "./functions.js";

window.onload = async () => {

  userTitle.innerHTML = 'User (' + localStorage.getItem('username') + ')';

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

  const screenloaderWrapper = document.querySelector(".screen-loader-wrapper");
  screenloaderWrapper.classList.add("fade-in");
  
  const jobs = await getJobs();
  updateJobsTable(jobs);
}

// Event listener for the form submission
addJobButton.addEventListener("click", (event) => {
  event.preventDefault(); // Prevents the default form submission behavior
  showModal(); // Showing the modal
  createJobModal(); 
});

backPageButton.addEventListener("click", () => {
  const loaderWrapper = document.querySelector(".screen-loader-wrapper");
  loaderWrapper.classList.add("fade-out");
  loaderWrapper.classList.remove("fade-in");
  setTimeout(() => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('user_role');
    localStorage.removeItem('jwt_access_token');
    location.assign(
      location.protocol + "//" + location.host + "/logout"
    );
  }, 500);
})

settingsButton.addEventListener("click", () => {
  showModal(); // Showing the modal
  createJobSettingsModal();
})