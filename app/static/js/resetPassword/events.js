const forgotPasswordContainer = document.querySelector("#forgot-password-container");

window.onload = async () => {

  let urlParams = getURLParameters();
  let user_id = urlParams.get('user_id');
  let token = urlParams.get('token');
  const formData = new FormData();
  formData.append("user_id", user_id);
  formData.append("reset_token", token);
  await fetch("/verifyResetPassword", {
    method: "POST",
    body: formData
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  }).then((responseData) => {

    const intervalID = setInterval(async () => {
      const formData = new FormData();
      formData.append("task_id", responseData.task_id);
      await fetch("/verifyResetPasswordTask", {
        method: "POST",
        body: formData
      })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      })
      .then(async (responseData) => {

        if (responseData.task_status == "SUCCESS") {

          clearInterval(intervalID);

          if (responseData.verify_reset_password_status) {

            forgotPasswordContainer.innerHTML = `
              <h1 class="mb-4" style="font-size: 1.6rem;">&#128274; Reset Password</h1>
              <form id="login-form">
                <div class="mb-4">
                  <label for="password-input" class="form-label" style="font-size: 0.8rem;">Password</label>
                  <div class="input-group">
                    <span class="input-group-text" id="basic-addon1"><i class="bi bi-lock-fill"></i></span>
                    <input type="password" class="form-control" id="password-input" placeholder="Enter your password" style="font-size: 0.8rem;" required>
                  </div>
                </div>
                <div class="mb-4">
                  <label for="confirm-password-input" class="form-label" style="font-size: 0.8rem;">Confirm Password</label>
                  <div class="input-group">
                    <span class="input-group-text" id="basic-addon1"><i class="bi bi-lock-fill"></i></span>
                    <input type="password" class="form-control" id="confirm-password-input" placeholder="Enter your confirm password" style="font-size: 0.8rem;" required>
                  </div>
                </div>
                <div class="d-flex justify-content-center mb-4">
                  <input id="cancel-btn" class="btn btn-secondary mx-2" type="reset" value="Cancel">
                  <input id="submit-btn" class="btn btn-success mx-2" type="submit" value="Submit">
                </div>
              </form>
            `;

            const loginForm = document.querySelector("#login-form");
            const cancelButton = document.querySelector("#cancel-btn");
            const submitButton = document.querySelector("#submit-btn");
            const passwordInput = document.querySelector("#password-input");
            const confirmPasswordInput = document.querySelector("#confirm-password-input");

            cancelButton.addEventListener("click", (event) => {
              event.preventDefault();
              loginForm.reset();
              cancelButton.disabled = true;
              submitButton.disabled = true;
              location.assign(
                location.protocol + "//" + location.host + "/login"
              );
            });

            submitButton.addEventListener("click", async (event) => {
              event.preventDefault();

              if (passwordInput.value !== confirmPasswordInput.value) return;

              try {

                urlParams = getURLParameters();
                user_id = urlParams.get('user_id');
                token = urlParams.get('token');

                console.log(user_id);
                console.log(token);

                if (!user_id && !token) return;

                const formData = new FormData();
                formData.append("user_id", user_id)
                formData.append("reset_token", token)
                formData.append("password", passwordInput.value);

                const response = await fetch("/resetPassword", {
                  method: "POST",
                  body: formData
                });

                if (response.ok) {

                  const responseData = response.json();

                  cancelButton.disabled = true;
                  submitButton.disabled = true;
                  location.assign(
                    location.protocol + "//" + location.host + "/login"
                  );

                }

              } catch (error) {
                console.log(error);
              }
              
            })

          } else {
            forgotPasswordContainer.innerHTML = `
              <h1 class="mb-4" style="font-size: 1.6rem;">&#128274; Reset Password</h1>
              <div style="font-size: 0.9rem;">
                <p>We're sorry, but it seems that the password reset link you used is not valid. This could be due to one of the following reasons:</p>
                  <ul>
                    <li>The password reset link has expired. Password reset links are time-sensitive for security reasons, and this link may no longer be valid.</li>
                    <li>The password reset link does not exist. Please make sure you are using the correct link from the most recent password reset email you received.</li>
                  </ul>
                <p>If you still need to reset your password, please initiate the password reset process again. Ensure that you use the most recent password reset email you received. Thank you for your understanding.</p>
              </p>
              </div>
              
            `;
          }

        }

      });

    }, 500);
  });
};

function getURLParameters() {
  // Get the current URL
  const currentURL = location.href;

  // Create a URL object
  const url = new URL(currentURL);

  // Create a URLSearchParams object using the search string
  const urlParams = new URLSearchParams(url.search);

  return urlParams;
}