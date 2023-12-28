// Importing variables and functions from external modules
import { 
  uploadFilesButton, 
  downloadSummariesButton, 
  backPageButton,
  userTitle
} from "./variables.js";
import {
  exportCSV,
  uploadFilesModal,
  cancelAllUploads,
  getSummaries,
  updateSummariesTable,
  confirmModal
} from "./functions.js";

// Calls cancelAllUploads() when the page is being unloaded.
window.addEventListener("unload", cancelAllUploads);

// Executed when the window is fully loaded
window.onload = async () => {

  userTitle.innerHTML = 'User (' + localStorage.getItem('username') + ')';

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

  // Get the current URL
  const currentURL = location.href;

  // Create a URL object
  const url = new URL(currentURL);

  // Create a URLSearchParams object using the search string
  const urlParams = new URLSearchParams(url.search);

  // Get the value of job_id from URL parameters
  const jobId = urlParams.get('job_id');

  // Get reference to the loader wrapper element
  const loaderWrapper = document.querySelector(".screen-loader-wrapper");
  loaderWrapper.classList.add("fade-in");

  // Fetch summaries for the specified job_id
  const summaries = await getSummaries(jobId);

  // Update the summaries table with the fetched data
  updateSummariesTable(summaries);
};

// Event listener for the "Upload Files" button
uploadFilesButton.addEventListener("click", uploadFilesModal);

// Event listener for the "Download Summaries" button
downloadSummariesButton.addEventListener("click", () => {
  // Get the current URL
  const currentURL = location.href;

  // Create a URL object
  const url = new URL(currentURL);

  // Create a URLSearchParams object using the search string
  const urlParams = new URLSearchParams(url.search);

  // Get the value of job_id from URL parameters
  const jobId = urlParams.get('job_id');

  // Show a confirmation modal before exporting CSV
  confirmModal(() => {
    exportCSV(jobId);
  });
});

// Event listener for the "Back" button
backPageButton.addEventListener("click", () => {
  // Get reference to the loader wrapper element
  const loaderWrapper = document.querySelector(".screen-loader-wrapper");
  loaderWrapper.classList.add("fade-out");
  loaderWrapper.classList.remove("fade-in");

  // Delay the page redirection for one second
  setTimeout(() => {
    // Redirect to the "jobs" page
    location.assign(
      location.protocol + "//" + location.host + "/jobs"
    );
  }, 1000);
});
