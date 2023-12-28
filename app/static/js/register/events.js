const loginForm = document.querySelector("#login-form");
const cancelButton = document.querySelector("#cancel-btn");
const loginButton = document.querySelector("#register-btn");

cancelButton.addEventListener("click", (event) => {
  event.preventDefault();
  loginForm.reset();
  cancelButton.disabled = true;
  loginButton.disabled = true;
  location.assign(
    location.protocol + "//" + location.host + "/login"
  );
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.querySelector("#username");
  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  const confirmPassword = document.querySelector("#confirm-password");

  loginButton.disabled = true;

  if (!isValidEmail(email.value)) {
    showAlert("Invalid", "Email address is not valid!", 2000);
    const intervalID = setInterval(async () => {
      clearInterval(intervalID);
      loginButton.disabled = false;
    }, 2000);
    return;
  }

  const validatePasswordResult = validatePasswords(password.value, confirmPassword.value);
  if (!validatePasswordResult[0]) {
    showAlert("Invalid", validatePasswordResult[1], 2000);
    const intervalID = setInterval(async () => {
      clearInterval(intervalID);
      loginButton.disabled = false;
    }, 2000);
    return;
  }

  const formData = new FormData();
  formData.append("username", removeWhitespaces(username.value));
  formData.append("password", removeWhitespaces(password.value));
  formData.append("email", removeWhitespaces(email.value));

  cancelButton.disabled = true;
  loginButton.disabled = true;

  const response = await fetch("/register", {
    method: "POST",
    body: formData
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  }).then((responseData) => {

    const intervalID = setInterval( async () => {
    const formData = new FormData();
    formData.append("task_id", responseData.task_id);
    await fetch("/registerTask", {
      method: "POST",
      body: formData
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    }).then((responseData) => {

      if (responseData.task_status === "SUCCESS") {
        clearInterval(intervalID);
        cancelButton.disabled = true;
        loginButton.disabled = true;

        if (responseData.register_status === "SUCCESS") {
          location.assign(
            location.protocol + "//" + location.host + "/login"
          );
        } else {
          showAlert("Failed:", responseData.message, 5000);
          cancelButton.disabled = false;
          loginButton.disabled = false;
        }

      } else {
        clearInterval(intervalID);
        cancelButton.disabled = false;
        loginButton.disabled = false;
      }
    });
  }, 1000);

  })
})

/*
  The showAlert function is a utility function designed to display a dynamic 
  alert message on a web page. It accepts three parameters: title (the title 
  of the alert), message (the main content of the alert), and milliseconds 
  (the duration the alert is visible). The function creates a new alert 
  element dynamically, inserts it into the designated wrapper in the HTML 
  document, and sets a timeout to automatically close the alert after the 
  specified duration. The alerts are styled using Bootstrap classes for a 
  consistent and visually appealing presentation.
*/
function showAlert(title, message, milliseconds) {
  const alertWrapper = document.querySelector(".alert-wrapper");
  const alert = document.createElement("div");
  alert.innerHTML = `
    <div class="alert alert-danger alert-dismissible fade show m-2" style="margin: 0;" role="alert">
      <strong>${title}</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  alertWrapper.appendChild(alert);
  document.body.append(alertWrapper);

  setTimeout(() => {
    bootstrap.Alert.getOrCreateInstance(".alert").close();
  }, milliseconds);
}

function isValidEmail(email) {
  // Regular expression for basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Test the email against the regular expression
  return emailRegex.test(email);
}

function removeWhitespaces(inputValue) {
  return inputValue.replace(/\s/g, '');
}

function validatePasswords(password, confirmPassword) {
  // Check if password are not empty
  if (!password || !confirmPassword) {
    return [false, "Password is empty"];
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return [false, "Passwords do not match"];
  }

  return true, "Passwords matched";
}