// Import functions and variables from external modules
import { createSettingsModal, showModal, updateUsersTable, createAddUserModal } from "./functions.js";
import { gptConfigurationButton, backPageButton, addUser, administratorTitle } from "./variables.js";

// Event listener for the window onload event
window.onload = async () => {

  administratorTitle.innerHTML = 'Administrator (' + localStorage.getItem('username') + ')';

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

  // Call the function to update the users table when the window has loaded
  updateUsersTable();
}

addUser.addEventListener("click", () => {
  // Create and display the settings modal
  createAddUserModal();
})

// Event listener for the click event on the gptConfigurationButton
gptConfigurationButton.addEventListener('click', () => {
  // Create and display the settings modal
  createSettingsModal();
})

// Event listener for the click event on the backPageButton
backPageButton.addEventListener("click", () => {
  // Set a timeout to delay the redirection by 500 milliseconds
  setTimeout(() => {
    // Redirect to the logout page
    location.assign(
      location.protocol + "//" + location.host + "/logout"
    );
  }, 500);
})
