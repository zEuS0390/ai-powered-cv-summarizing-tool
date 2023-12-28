import { updateContactLinks } from "./functions.js"

// Wait for the window to fully load before executing any code
window.onload = () => {
  // Find the HTML element with the class "screen-loader-wrapper" and store it in a variable
  const screenloaderWrapper = document.querySelector(".screen-loader-wrapper");
  
  // Add the "fade-in" class to the found element, triggering a fade-in effect
  screenloaderWrapper.classList.add("fade-in");

  updateContactLinks();
};

// Find the HTML element with the ID "scan-btn" and store it in a variable
const scanbutton = document.querySelector("#scan-btn");

// Attach a click event listener to the "scanbutton" element
scanbutton.addEventListener("click", () => {
  // Find the HTML element with the class "screen-loader-wrapper" and store it in a variable
  const loaderWrapper = document.querySelector(".screen-loader-wrapper");
  
  // Add the "fade-out" class to the loader wrapper, triggering a fade-out effect
  loaderWrapper.classList.add("fade-out");
  
  // Remove the "fade-in" class from the loader wrapper
  loaderWrapper.classList.remove("fade-in");

  // Set a timeout function to delay the redirection by 1000 milliseconds (1 second)
  setTimeout(() => {
    // Redirect to the "/jobs" page by updating the location.href
    location.assign(
      location.protocol + "//" + location.host + "/jobs"
    );
  }, 1000);
});
