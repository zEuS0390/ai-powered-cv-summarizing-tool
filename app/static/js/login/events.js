const loginForm = document.querySelector("#login-form");
const loginButton = document.querySelector("#login-btn");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = document.querySelector("#username");
  const password = document.querySelector("#password");

  const formData = new FormData();
  formData.append("username", username.value);
  formData.append("password", password.value);

  loginButton.disabled = true;

  const response = await fetch("/login", {
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
      await fetch("/loginTask", {
        method: "POST",
        body: formData
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      }).then((responseData) => {
        if (responseData.jwt_access_token) {
          clearInterval(intervalID);

          localStorage.setItem('user_id', responseData.user_id);
          localStorage.setItem('username', responseData.username);
          localStorage.setItem('user_role', responseData.user_role);
          localStorage.setItem('jwt_access_token', responseData.jwt_access_token);

          if (responseData.user_role == 'user') {
            location.assign(
              location.protocol + "//" + location.host + "/jobs"
            );
          } else if (responseData.user_role == 'admin') {
            location.assign(
              location.protocol + "//" + location.host + "/admin"
            );
          }

          loginButton.disabled = false;
        } else {
          clearInterval(intervalID);
          loginButton.disabled = false;
        }
      });
    }, 500);

  })
})