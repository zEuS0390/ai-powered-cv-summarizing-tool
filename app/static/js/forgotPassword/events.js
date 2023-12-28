const content = document.querySelector("#content");
const loginForm = document.querySelector("#login-form");
const cancelButton = document.querySelector("#cancel-btn");
const submitButton = document.querySelector("#submit-btn");

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

  const email = document.querySelector("#email");
  email.disabled = true;
  email.readOnly = true;

  const formData = new FormData();
  formData.append("email", email.value);

  try {

    const response = await fetch("/forgotPassword", {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      const responseData = response.json();
      content.innerHTML = `
        <p class="mb-4">
          Thank you! If the email address exists in our system, you should receive an email shortly. If you don't, it means the email address is not registered.
        </p>
        <div class="d-flex justify-content-center mb-4">
          <button id="done-btn" class="btn btn-success mx-2">Done</button>
        </div>
      `;
      const doneButton = document.querySelector("#done-btn");
      doneButton.addEventListener("click", () => {
        doneButton.disabled = true;
        location.assign(
          location.protocol + "//" + location.host + "/login"
        );
      });
    }
  } catch (error) {
    email.disabled = false;
    email.readOnly = false;
    console.log(error);
  }
  
});