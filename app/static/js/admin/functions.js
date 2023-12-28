// Function to fetch users from the server

import { tableContentWrapper } from "./variables.js";

/**
 * Fetches user data from the server.
 * @returns {Promise<Object>} A promise that resolves to the fetched user data.
 */
export async function getUsers() {
  // Fetch users with authorization header
  const result = await fetch("/getUsers", {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
  }).then((response) => {
    // Check if the response is okay, else reject the promise
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  })
  return result;
}

// Function to update the users table with the provided data
/**
 * Updates the users table periodically by fetching data from the server.
 * Uses an interval to check the task status and updates the table when the task is successful.
 */
export async function updateUsersTable() {
  tableContentWrapper.innerHTML = `
    <div class="d-flex justify-content-center align-items-center" style="height: auto;">
      <span class="generate-loader"></span>
    </div>
  `;

  // Get the task ID for updating users
  const getUsersTask = await getUsers();
  
  // Set an interval to check the task status and update the table
  const intervalID = setInterval(async () => {
    // Create a FormData object with the task ID
    const formData = new FormData();
    formData.append("task_id", getUsersTask.task_id);

    // Fetch the task status from the server
    await fetch("/getUsersTask", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
      },
      body: formData
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    }).then((responseData) => {
      // Check if the task is successful and clear the interval
      if (responseData.task_status == "SUCCESS") {
        clearInterval(intervalID);

        // Populate the users table with the received data
        populateUsersTable(responseData.users);
      }
    });
  }, 500);
}

// Function to update the users table with the provided data
/**
 * Populates the users table with data received from the server.
 * @param {Array<Object>} data - An array of user data to populate the table.
 */
export function populateUsersTable(data) {

  if (data.length > 0) {
    tableContentWrapper.innerHTML = `
      <div class="table-responsive">
        <!-- Users Table -->
        <table
          id="users-table"
          class="table table-scrollable table-hover table-bordered rounded table-sm table-striped"
          style="font-size: 0.9rem;">
          <!-- Table Headings -->
          <thead>
            <tr class="table-success">
              <!-- <th class="text-center">ID</th> -->
              <th class="text-center">Username</th>
              <th class="text-center">Email</th>
              <th class="text-center">Role</th>
              <th class="text-center">Allow</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <!-- Table Body -->
          <tbody>
            <!-- User data will be dynamically added here -->
          </tbody>
        </table>
      </div>
    `;
  } else {
    tableContentWrapper.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: auto;">
        <h1 
          style="
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            color: #D3D3D3;
        ">
          No Users
        </h1>
      </div>
    `;
    return;
  }
  

  // Get reference to the table body
  const tableBodyRef = document
    .querySelector("#users-table")
    .getElementsByTagName("tbody")[0];

  // Clear the existing table rows
  tableBodyRef.innerHTML = '';

  // Loop through the data to populate the table
  data.forEach((user) => {
    // Create a new row in the table
    const newRow = tableBodyRef.insertRow(-1);

    // Function to insert cells into the new row
    const insertCell = (...items) => {
      const cell = newRow.insertCell();
      items.forEach((item) => cell.appendChild(item));
      return cell;
    };

    // Function to create elements for the data
    const createElement = (id, value, type) => {
      const element =
        type === "text"
          ? document.createTextNode(value)
          : document.createElement(type);
      if (type != "text") {
        element.setAttribute("id", `${id}`);
      }
      return element;
    };

    // Create elements for user data
    const userIcon = createElement(`user-icon-${user.id}`, null, 'span');
    const userName = createElement(`username-${user.id}`, `${user.username}`, 'text');
    const email = createElement(`email-${user.id}`, `${user.email}`, 'text');
    const role = createElement(`role-${user.id}`, `${user.role}`, 'text');
    const apiKeyPermission = createElement(`api-key-permission-${user.id}`, `${user.gpt_api_key_permission}`, `text`);
    const editButton = createElement(`edit-button-${user.id}`, null, "button");
    const deleteButton = createElement(`delete-button-${user.id}`, null, "button");

    // Create icons for buttons
    const editIcon = createElement(`edit-icon-${user.id}`, null, "i");
    const deleteIcon = createElement(`delete-icon-${user.id}`, null, "i");

    // Append icons to edit and delete buttons
    editButton.appendChild(editIcon);
    deleteButton.appendChild(deleteIcon);

    // Insert cells into the row with user data `&#x1F464;`
    const userCell = insertCell(userIcon, userName);
    const emailCell = insertCell(email);
    const roleCell = insertCell(role);
    const apiKeyPermissionCell = insertCell(apiKeyPermission);
    const actionsCell = insertCell(editButton, deleteButton);

    userIcon.classList.add('me-1');
    userIcon.innerHTML = `&#x1F464;`;
 
    // Add styling classes to cells
    [userCell, emailCell, roleCell, apiKeyPermissionCell, actionsCell].forEach((cell) => { 
      cell.style.textAlign = "center";
      cell.style.verticalAlign = "middle";
    });

    // Add classes to buttons
    [editButton, deleteButton].forEach((button) => {
      button.classList.add("me-1");
      new bootstrap.Tooltip(button, {
        placement: 'top'
      });
    });

    // Add classes to icons
    [editIcon, deleteIcon].forEach((icon) => {
      icon.style.fontSize = "0.9rem";
      icon.classList.add("fi");
    });

    // Add specific classes to buttons for styling
    editButton.classList.add("btn", "btn-primary", "btn-sm");
    deleteButton.classList.add("btn", "btn-danger", "btn-sm");

    new bootstrap.Tooltip(editButton, {
      title: 'Edit'
    });
    new bootstrap.Tooltip(deleteButton, {
      title: 'Delete'
    });

    // Add specific icons to buttons for styling
    editIcon.classList.add("fi-sr-pencil");
    deleteIcon.classList.add("fi-sr-trash");

    // Add event listeners for edit and delete actions
    editButton.addEventListener("click", () => {
      // To be implemented
      createUpdateUserModal(user.id);
    });

    deleteButton.addEventListener("click", () => {
      // Show a confirmation modal before deleting
      confirmModal(async () => {
        // Disable buttons during the deletion process
        editButton.disabled = true;
        deleteButton.disabled = true;

        // Send a request to delete the user
        const deleteUserTaskResponse = await deleteUser(user.id);

        // Set an interval to check the task status
        const intervalID = setInterval( async () => {
          const formData = new FormData();
          formData.append("task_id", deleteUserTaskResponse.task_id);

          // Fetch the task status from the server
          await fetch("/deleteUserTask", {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
            },
            body: formData
          }).then((response) => {
            if (response.ok) {
              return response.json();
            }
            return Promise.reject(response);
          }).then((responseData) => {
            // Check if the deletion task is successful
            if (responseData.task_status == "SUCCESS") {
              clearInterval(intervalID);

              // Check if the user deletion is successful
              if (responseData.delete_user_status) {
                // Get the index of the row to be deleted
                const rowIndex = deleteButton.parentNode.parentNode.rowIndex - 1;
                // Delete the row from the table
                tableBodyRef.deleteRow(rowIndex);

                if (rowIndex === 0) {
                  tableContentWrapper.innerHTML = `
                    <div class="d-flex justify-content-center align-items-center" style="height: auto;">
                      <h1 
                        style="
                          -webkit-user-select: none;
                          -webkit-touch-callout: none;
                          -moz-user-select: none;
                          -ms-user-select: none;
                          user-select: none;
                          color: #D3D3D3;
                      ">
                        No Users
                      </h1>
                    </div>
                  `;
                }

              } else {
                // Enable buttons if the user deletion fails
                editButton.disabled = false;
                deleteButton.disabled = false;
              }
            } else {
              // Enable buttons if the task fails
              editButton.disabled = false;
              deleteButton.disabled = false;
            }
          });
        }, 500);
      });
    });
  });
}

// Function to delete a user
/**
 * Deletes a user with the specified user ID.
 * @param {string} user_id - The ID of the user to be deleted.
 * @returns {Promise<Object>} A promise that resolves to the response from the server.
 */
export async function deleteUser(user_id) {
  const formData = new FormData();
  formData.append("user_id", user_id);
  const response = await fetch("/deleteUser", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
    body: formData
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  }).catch((error) => {
    console.log(error);
  });
  return response;
}

// Function to get user details
/**
 * Retrieves details of a user with the specified user ID.
 * @param {string} user_id - The ID of the user to get details for.
 * @returns {Promise<Object>} A promise that resolves to the user details from the server.
 */
export async function getUser(user_id) {
  const formData = new FormData();
  formData.append("user_id", user_id);
  const response = await fetch("/getUser", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
    body: formData
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  }).catch((error) => {
    console.log(error);
  });
  return response;
}

// Function to create and update a user modal
/**
 * Creates and displays a modal for updating user information.
 * @param {string} user_id - The ID of the user to be updated.
 */
export async function createUpdateUserModal(user_id) {

  // Show the modal
  showModal();

  // Get references to modal elements
  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  // Set modal header content
  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">
      <span class="me-1">	&#x1F464;</span>
      Update User
    </h5>
  `;

  // Set modal body content
  body.innerHTML = `
    <form id="form-input" style="font-size: 14px">

      <!-- First Row -->
      <div class="row">

        <!-- First Column -->
        <div class="col">
          <label for="username-input" style="font-size: 0.9rem;">
            <i class="fi fi-sr-id-badge me-1"></i>
            Username
          </label>
          <input
            id="username-input"
            type="text"
            class="form-control"
            style="font-size: 0.9rem;"
            rows="30"
            placeholder=""
            required
          ></input>
        </div>
      </div>

      <!-- Second Row -->
      <div class="row mt-3">

        <!-- First Column -->
        <div class="col">
          <label for="email-input" style="font-size: 0.9rem;">
            <i class="fi fi-sr-info me-2"></i>
            Email
          </label>
          <input
            id="email-input"
            type="text"
            class="form-control"
            style="font-size: 0.9rem;"
            rows="30"
            placeholder=""
            required
          ></input>
        </div>
      </div>

      <!-- Third Row -->
      <div class="row mt-3">

        <!-- First Column -->
        <div class="col">
          <label for="role-input" style="font-size: 0.9rem;">
            <i class="fi fi-sr-user me-1"></i>
            Role
          </label>
          <select class="form-select form-select-md" id="role-input" style="font-size: 0.9rem;">
            <option selected disabled>---</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      <div class="row mt-3">
        <div class="col">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="allow-default-api-key-input" style="font-size: 0.9rem;">
            <label class="form-check-label" for="allow-default-api-key-input" style="font-size: 0.9rem;">Allow Default API Key</label>
          </div>
        </div>
      </div>

    </form>
  `;

  // Set modal footer content
  footer.innerHTML = `
    <button id="cancel-btn" class="btn btn-secondary btn-sm mx-2" style="font-size: 0.9rem;"/>Cancel</button>
    <button id="submit-btn" class="btn btn-dark btn-sm mx-2" style="font-size: 0.9rem;"/>Submit</button>
  `;

  // Adjust modal styles
  dialog.classList.add("modal-dialog-centered");
  header.classList.add("d-flex", "justify-content-between");
  body.classList.add("m-2");

  const addButtonClickEvent = (id, func) => {
    modalWrap.querySelector(`#${id}`).addEventListener("click", () => {
      func();
    });
  };

  const usernameInput = document.querySelector("#username-input");
  const emailInput = document.querySelector("#email-input");
  const roleInput = document.querySelector("#role-input");
  const allowDefaultApiKeyInput = document.querySelector("#allow-default-api-key-input");

  // Get references to modal elements
  const submitButton = document.querySelector("#submit-btn");
  const cancelButton = document.querySelector("#cancel-btn");

  // Add click event listeners to buttons
  addButtonClickEvent("cancel-btn", () => {
    closeModal();
    modalWrap.innerHTML = ``;
  });

  addButtonClickEvent("submit-btn", async () => {

    submitButton.disabled = true;
    cancelButton.disabled = true;

    if (removeWhitespaces(usernameInput.value) === '') {
      showAlert("Invalid", "Username is empty!", 2000);
      const intervalID = setInterval(async () => {
        clearInterval(intervalID);
        submitButton.disabled = false;
        cancelButton.disabled = false;
      }, 2000);
      return;
    }
    
    if (!isValidEmail(removeWhitespaces(emailInput.value))) {
      showAlert("Invalid", "Email address is not valid!", 2000);
      const intervalID = setInterval(async () => {
        clearInterval(intervalID);
        submitButton.disabled = false;
        cancelButton.disabled = false;
      }, 2000);
      return;
    }

    const formData = new FormData();
    formData.append("id", user_id)
    formData.append("username", removeWhitespaces(usernameInput.value));
    formData.append("email", removeWhitespaces(emailInput.value));
    formData.append("role", roleInput.value);
    formData.append("gpt_api_key_permission", (allowDefaultApiKeyInput.checked) ? 'default' : 'custom');
    await fetch("/updateUser", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
      },
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
        await fetch("/updateUserTask", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
          },
          body: formData
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject(response);
        }).then(async (responseData) => {

          if (responseData.task_status == "SUCCESS") {

            submitButton.disabled = false;
            cancelButton.disabled = false;

            clearInterval(intervalID);
            closeModal();
            modalWrap.innerHTML = ``;

            updateUsersTable();
          }

        });
      }, 500);

    }).catch((error) => {
      console.log(error);
    });

  });

  // Disable submit button initially
  usernameInput.disabled = true;
  emailInput.disabled = true;
  roleInput.disabled = true;
  allowDefaultApiKeyInput.disabled = true;
  submitButton.disabled = true;

  usernameInput.readonly = true;
  emailInput.readonly = true;

  // Fetch user details task
  const getUserTask = await getUser(user_id);

  // Set an interval to update modal with user details
  const intervalID = setInterval(async () => {
    const formData = new FormData();
    formData.append("task_id", getUserTask.task_id);
    await fetch("/getUserTask", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
      },
      body: formData
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    }).then((responseData) => {

      if (responseData.task_status == "SUCCESS") {
        submitButton.disabled = false;
        clearInterval(intervalID);

        const user = responseData.user;
        const username = user.username;
        const email = user.email;
        const role = user.role;
        const gpt_api_key_permission = user.gpt_api_key_permission;

        // Get references to modal input elements
        const usernameInput = document.querySelector("#username-input");
        const emailInput = document.querySelector("#email-input");
        const roleInput = document.querySelector("#role-input");
        const allowDefaultApiKeyInput = document.querySelector("#allow-default-api-key-input");

        // Set values based on user details
        usernameInput.value = username ? username : "";
        emailInput.value = email ? email : "";
        roleInput.value = role ? role : "";
        allowDefaultApiKeyInput.checked = (gpt_api_key_permission === 'default') ? true : false;

        usernameInput.disabled = false;
        emailInput.disabled = false;
        roleInput.disabled = false;
        allowDefaultApiKeyInput.disabled = false;

        usernameInput.readonly = false;
        emailInput.readonly = false;

      }

    });
  }, 500);

}

/**
 * Displays a confirmation modal with "Yes" and "No" buttons.
 * @param {Function} yesFunc - The function to be executed when the user clicks "Yes". Defaults to an empty function.
 * @param {Function} noFunc - The function to be executed when the user clicks "No". Defaults to an empty function.
 */
export function confirmModal(yesFunc = () => {}, noFunc = () => {}) {

  // Show the modal
  showModal();

  // Get references to modal elements
  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  // Set modal header content
  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">Confirm</h5>
  `;

  // Set modal body content
  body.innerHTML = `
    <p style="margin: 0; font-size: 0.9rem;">Are you sure?</p>
  `;

  // Set modal footer content with "Yes" and "No" buttons
  footer.innerHTML = `
    <button id="no-btn" type="button" class="btn btn-secondary btn-sm" style="font-size: 0.9rem;" data-bs-dismiss="modal">No</button>
    <button id="yes-btn" type="button" class="btn btn-success btn-sm" style="font-size: 0.9rem;" data-bs-dismiss="modal">Yes</button>
  `;

  // Adjust modal styles
  modal.classList.add("d-flex", "justify-content-center", "align-items-center");
  dialog.style = 'width: 240px;';
  header.classList.add("d-flex", "justify-content-between");

  // Add click event listeners to buttons
  const addButtonClickEvent = (id, func) => {
    modalWrap.querySelector(`#${id}`).addEventListener("click", () => {
      func();
    });
  };

  // Add click event for "No" button
  addButtonClickEvent("no-btn", () => {
    noFunc();
    modalWrap.innerHTML = '';
  });

  // Add click event for "Yes" button
  addButtonClickEvent("yes-btn", () => {
    modalWrap.innerHTML = '';
    yesFunc();
  });

}

// Variable to store the modal
let modalWrap = null;

/**
 * Creates and displays a modal dialog.
 */
export function showModal() {
  // Remove existing modal if present
  if (modalWrap !== null) {
    modalWrap.remove();
  }

  // Create and append a new modal
  modalWrap = document.createElement("div");
  modalWrap.innerHTML = `
    <div class="modal fade" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
          </div>
          <div class="modal-body">
          </div>
          <div class="modal-footer">
          </div>
        </div>
      </div>
    </div>
  `;

  // Configure modal attributes
  modalWrap.querySelector(".modal").setAttribute("data-bs-keyboard", "false");
  modalWrap.querySelector(".modal").setAttribute("data-bs-backdrop", "static");

  // Append modal to the document body
  document.body.append(modalWrap);

  // Initialize Bootstrap modal and show it
  var modal = new bootstrap.Modal(modalWrap.querySelector(".modal"));
  modal.show();
}

export async function createAddUserModal() {

  showModal();

  // Retrieve modal elements
  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  // Set modal header content
  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">
      <span class="me-1">	&#x1F464;</span>
      Add User
    </h5>
  `;

  // Set modal body content
  body.innerHTML = `
    <form id="form-input" style="font-size: 14px">

      <!-- First Row -->
      <div class="row">

        <!-- First Column -->
        <div class="col">
          <label for="username-input" style="font-size: 0.9rem;">
            <i class="fi fi-sr-id-badge me-1"></i>
            Username
          </label>
          <input
            id="username-input"
            type="text"
            class="form-control"
            style="font-size: 0.9rem;"
            rows="30"
            placeholder=""
            required
          ></input>
        </div>
      </div>

      <!-- Second Row -->
      <div class="row mt-3">
        <div class="col">
          <label for="password-input" style="font-size: 0.9rem;">
            <i class="fi fi-sr-key me-1"></i>
            Password
          </label>
          <div class="input-group">
            <input
              id="password-input"
              type="password"
              class="form-control"
              style="font-size: 0.9rem;"
              placeholder=""
              required
            />
            <button class="btn btn-sm text-white" style="background-color: #6610f2; font-size: 0.9rem;" type="button" id="password-btn">Show</button>
          </div>
        </div>
      </div>

      <!-- Third Row -->
      <div class="row mt-3">

        <!-- First Column -->
        <div class="col">
          <label for="email-input" style="font-size: 0.9rem;">
            <i class="fi fi-sr-info me-2"></i>
            Email
          </label>
          <input
            id="email-input"
            type="text"
            class="form-control"
            style="font-size: 0.9rem;"
            rows="30"
            placeholder=""
            required
          ></input>
        </div>
      </div>

      <!-- Fourth Row -->
      <div class="row mt-3">

        <!-- First Column -->
        <div class="col">
          <label for="role-input" style="font-size: 0.9rem;">
            <i class="fi fi-sr-user me-1"></i>
            Role
          </label>
          <select class="form-select form-select-md" id="role-input" style="font-size: 0.9rem;">
            <option selected disabled>---</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      <!-- Fifth Row -->
      <div class="row mt-3">

        <!-- First Column -->
        <div class="col">
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="allow-default-api-key-input" style="font-size: 0.9rem;">
            <label class="form-check-label" for="allow-default-api-key-input" style="font-size: 0.9rem;">Allow Default API Key</label>
          </div>
        </div>
      </div>

    </form>
  `;

  // Set modal footer content
  footer.innerHTML = `
    <button id="cancel-btn" class="btn btn-secondary btn-sm mx-2" style="font-size: 0.9rem;"/>Cancel</button>
    <button id="submit-btn" class="btn btn-dark btn-sm mx-2" style="font-size: 0.9rem;"/>Submit</button>
  `;

  // Adjust modal styles
  dialog.classList.add("modal-dialog-centered");
  header.classList.add("d-flex", "justify-content-between");
  body.classList.add("m-2");

  const usernameInput = document.querySelector("#username-input");
  const passwordInput = document.querySelector("#password-input");
  const emailInput = document.querySelector("#email-input");
  const roleInput = document.querySelector("#role-input");
  const allowDefaultApiKeyInput = document.querySelector("#allow-default-api-key-input");

  // Get references to modal elements
  const submitButton = document.querySelector("#submit-btn");
  const cancelButton = document.querySelector("#cancel-btn");

  roleInput.value = 'user';

  const addButtonClickEvent = (id, func) => {
    const element = modalWrap.querySelector(`#${id}`);
    element.addEventListener("click", () => {
      func(element);
    });
  };

  // Add click event listeners to buttons
  addButtonClickEvent("cancel-btn", (element) => {
    closeModal();
    modalWrap.innerHTML = ``;
  });

  addButtonClickEvent("submit-btn", async (element) => {

    element.disabled = true;

    if (removeWhitespaces(usernameInput.value) === '') {
      showAlert("Invalid", "Username is empty!", 2000);
      const intervalID = setInterval(async () => {
        clearInterval(intervalID);
        element.disabled = false;
      }, 2000);
      return;
    }

    if (removeWhitespaces(passwordInput.value) === '') {
      showAlert("Invalid", "Password is empty!", 2000);
      const intervalID = setInterval(async () => {
        clearInterval(intervalID);
        element.disabled = false;
      }, 2000);
      return;
    }

    if (!isValidEmail(removeWhitespaces(emailInput.value))) {
      showAlert("Invalid", "Email address is not valid!", 2000);
      const intervalID = setInterval(async () => {
        clearInterval(intervalID);
        element.disabled = false;
      }, 2000);
      return;
    }

    submitButton.disabled = true;
    cancelButton.disabled = true;

    const formData = new FormData();
    formData.append("username", removeWhitespaces(usernameInput.value));
    formData.append("password", removeWhitespaces(passwordInput.value));
    formData.append("email", removeWhitespaces(emailInput.value));
    formData.append("role", roleInput.value);
    formData.append("gpt_api_key_permission", (allowDefaultApiKeyInput.checked) ? 'default' : 'custom');
    await fetch("/addUser", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
      },
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
        await fetch("/addUserTask", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
          },
          body: formData
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject(response);
        }).then(async (responseData) => {

          if (responseData.task_status == "SUCCESS") {

            clearInterval(intervalID);

            submitButton.disabled = false;
            cancelButton.disabled = false;

            if (responseData.add_user_status == true) {
              closeModal();
              modalWrap.innerHTML = ``;
              updateUsersTable();
            } else {
              showAlert("Invalid:", "Failed to add the user!", 5000);
            }
          }

        });
      }, 500);

    }).catch((error) => {
      console.log(error);
    });
  });

  let passwordState = false;
  addButtonClickEvent("password-btn", (element) => {
    // Toggle Email App Password Visibility
    if (passwordState) {
      passwordState = false;
      passwordInput.type = "password";
      element.style.backgroundColor = "#6610f2";
      element.innerHTML = "Show";
    } else {
      passwordState = true;
      passwordInput.type = "text";
      element.style.backgroundColor = "green";
      element.innerHTML = "Hide";
    }
  });

}

// Function to create and display the settings modal
export async function createSettingsModal() {
  
  // Show the modal
  showModal();

  // Retrieve modal elements
  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  // Set the modal header content
  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">
      <span class="me-1">	&#9881</span>
      Settings
    </h5>
  `;

  // Set the modal body content with a form
  body.innerHTML = `
    <nav>
      <div class="nav nav-tabs" id="nav-tab" role="tablist">
        <button class="nav-link active" style="font-size: 0.9rem;" id="nav-gpt-tab" data-bs-toggle="tab" data-bs-target="#nav-gpt" type="button" role="tab" aria-controls="nav-gpt" aria-selected="true">GPT</button>
        <button class="nav-link" style="font-size: 0.9rem;" id="nav-sender-email-tab" data-bs-toggle="tab" data-bs-target="#sender-nav-email" type="button" role="tab" aria-controls="sender-nav-email">Sender Email</button>
        <button class="nav-link" style="font-size: 0.9rem;" id="nav-contacts-tab" data-bs-toggle="tab" data-bs-target="#nav-contacts" type="button" role="tab" aria-controls="nav-contacts">Contacts</button>
      </div>
    </nav>

    <div class="tab-content" id="nav-tabContent">

      <div class="tab-pane show active p-3" id="nav-gpt" role="tabpanel" aria-labelledby="nav-gpt-tab">
        <!-- First Row -->
        <div class="row">
          <!-- First Column -->
          <div class="col-md-6">
            <label for="model-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-computer me-1"></i>
              Model
            </label>
            <input
              id="model-input"
              type="text"
              class="form-control"
              style="font-size: 0.9rem;"
              placeholder=""
              required
            />
          </div>
          <div class="col-md-6 mt-sm-4 mt-md-0">
            <label for="api-key-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-key me-1"></i>
              API Key
            </label>
            <div class="input-group">
              <input
                id="api-key-input"
                type="password"
                class="form-control"
                style="font-size: 0.9rem;"
                placeholder=""
                required
              />
              <button class="btn btn-sm text-white" style="background-color: #6610f2; font-size: 0.9rem;" type="button" id="update-api-key-btn">Show</button>
            </div>
          </div>
        </div>
        <!-- Third Row -->
        <div class="row mt-3">
          <!-- First Column -->
          <div class="col">
            <label for="formulate-questions-prompt-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-info me-2"></i>
              Formulate Questions Prompt
            </label>
            <textarea
              id="formulate-questions-prompt-input"
              class="form-control"
              style="font-size: 0.9rem;"
              rows="30"
              placeholder=""
              required
            ></textarea>
            <div class="char-count-wrapper">
              <p id="formulate-questions-prompt-input-char-count" class="char-count-label"></p>
            </div>
          </div>
        </div>
        <!-- Fourth Row -->
        <div class="row mt-3">
          <!-- First Column -->
          <div class="col">
            <label for="summarize-cv-prompt-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-info me-2"></i>
              Summarize CV Prompt
            </label>
            <textarea
              id="summarize-cv-prompt-input"
              class="form-control"
              style="font-size: 0.9rem;"
              rows="30"
              placeholder=""
              required
            ></textarea>
            <div class="char-count-wrapper">
              <p id="summarize-cv-prompt-input-char-count" class="char-count-label"></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sender Email Tab -->
      <div class="tab-pane p-3" id="sender-nav-email" role="tabpanel" aria-labelledby="nav-sender-email-tab">

        <!-- First Row -->
        <div class="row">

          <!-- First Column -->
          <div class="col-md-9">
            <label for="sender-email-host-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-computer me-1"></i>
              Host Server
            </label>
            <input
              id="sender-email-host-input"
              type="text"
              class="form-control"
              style="font-size: 0.9rem;"
              placeholder=""
              required
            />
          </div>

          <div class="col-md-3 mt-sm-4 mt-md-0">
            <label for="sender-email-port-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-key me-1"></i>
              Server Port
              </label>
            <div class="input-group">
              <input
                id="sender-email-port-input"
                type="number"
                class="form-control"
                style="font-size: 0.9rem;"
                placeholder=""
                required
                value="587"
              />
            </div>
          </div>

        </div>

        <!-- Second Row -->
        <div class="row mt-3">

          <div class="col-md-8">
            <label for="sender-email-address-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-info me-2"></i>
              Email Address
            </label>
            <input
              id="sender-email-address-input"
              type="text"
              class="form-control"
              style="font-size: 0.9rem;"
              placeholder=""
              required
            />
          </div>

          <div class="col-md-4 mt-sm-4 mt-md-0">
            <label for="sender-email-app-password-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-key me-1"></i>
              Email App Password
            </label>
            <div class="input-group">
              <input
                id="sender-email-app-password-input"
                type="password"
                class="form-control"
                style="font-size: 0.9rem;"
                placeholder=""
                required
              />
              <button class="btn btn-sm text-white" style="background-color: #6610f2; font-size: 0.9rem;" type="button" id="update-email-app-password-btn">Show</button>
            </div>
          </div>
        </div>

      </div>

      <!-- Contacts Tab -->
      <div class="tab-pane p-3" id="nav-contacts" role="tabpanel" aria-labelledby="nav-contacts-tab">
   
        <div class="row">
          <div class="col">
            <label for="contacts-wechat-input" style="font-size: 0.9rem;">
              <i class="fab fa-weixin me-1"></i>
              WeChat
            </label>
            <input
              id="contacts-wechat-input"
              type="text"
              class="form-control"
              style="font-size: 0.9rem;"
              placeholder=""
              required
            />
          </div>
        </div>

        <div class="row mt-4">
          <div class="col">
            <label for="contacts-phone-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-phone-flip me-1"></i>
              Phone
            </label>
            <input
              id="contacts-phone-input"
              type="text"
              class="form-control"
              style="font-size: 0.9rem;"
              placeholder=""
              required
            />
          </div>
        </div>

        <div class="row mt-4">
          <div class="col">
            <label for="contacts-whatsapp-input" style="font-size: 0.9rem;">
              <i class="fi fi-brands-whatsapp me-1"></i>
              WhatsApp
            </label>
            <input
              id="contacts-whatsapp-input"
              type="text"
              class="form-control"
              style="font-size: 0.9rem;"
              placeholder=""
              required
            />
          </div>
        </div>

        <div class="row mt-4">
          <div class="col">
            <label for="contacts-email-input" style="font-size: 0.9rem;">
              <i class="fi fi-sr-envelope me-1"></i>
              Email
            </label>
            <input
              id="contacts-email-input"
              type="text"
              class="form-control"
              style="font-size: 0.9rem;"
              placeholder=""
              required
            />
          </div>
        </div>

        <div class="row mt-4">
          <div class="col">
            <label for="contacts-linkedin-input" style="font-size: 0.9rem;">
              <i class="fi fi-brands-linkedin me-1"></i>
              LinkedIn
            </label>
            <input
              id="contacts-linkedin-input"
              type="text"
              class="form-control"
              style="font-size: 0.9rem;"
              placeholder=""
              required
            />
          </div>
        </div>

      </div>

    </div>
    
  `;

  // Set the modal footer content with buttons
  footer.innerHTML = `
    <button id="cancel-btn" class="btn btn-secondary btn-sm mx-2" style="font-size: 0.9rem;"/>Cancel</button>
    <button id="submit-btn" class="btn btn-dark btn-sm mx-2" style="font-size: 0.9rem;"/>Submit</button>
  `;

  // Configure modal styles and classes
  dialog.classList.add("shadow-lg");
  dialog.style = 'min-width: 85vw';
  header.classList.add("d-flex", "justify-content-between");
  body.classList.add("m-2");
  body.style = "min-height: 60vh;";

  // Retrieve input elements
  const modelInput = document.querySelector("#model-input");
  const apiKeyInput = document.querySelector("#api-key-input");
  const formulateQuestionsPromptInput = document.querySelector("#formulate-questions-prompt-input");
  const summarizeCVPromptInput = document.querySelector("#summarize-cv-prompt-input");
  const formulateQuestionsPromptCountLabel = document.querySelector("#formulate-questions-prompt-input-char-count");
  const summarizeCVPrompCountLabel = document.querySelector("#summarize-cv-prompt-input-char-count");

  const senderEmailHostInput = document.querySelector("#sender-email-host-input");
  const senderEmailPortInput = document.querySelector("#sender-email-port-input");
  const senderEmailAddressInput = document.querySelector("#sender-email-address-input");
  const senderEmailAppPasswordInput = document.querySelector("#sender-email-app-password-input");

  const contactsWeChatInput = document.querySelector("#contacts-wechat-input");
  const contactsPhoneInput = document.querySelector("#contacts-phone-input");
  const contactsWhatsAppInput = document.querySelector("#contacts-whatsapp-input");
  const contactsEmailInput = document.querySelector("#contacts-email-input");
  const contactsLinkedInInput = document.querySelector("#contacts-linkedin-input");

  modelInput.disabled = true;
  apiKeyInput.disabled = true;
  formulateQuestionsPromptInput.disabled = true;
  summarizeCVPromptInput.disabled = true;
  senderEmailHostInput.disabled = true;
  senderEmailPortInput.disabled = true;
  senderEmailAddressInput.disabled = true;
  senderEmailAppPasswordInput.disabled = true;
  contactsWeChatInput.disabled = true;
  contactsPhoneInput.disabled = true;
  contactsWhatsAppInput.disabled = true;
  contactsEmailInput.disabled = true;
  contactsLinkedInInput.disabled = true;

  const textAreaElements = [
    [formulateQuestionsPromptInput, formulateQuestionsPromptCountLabel],
    [summarizeCVPromptInput, summarizeCVPrompCountLabel]
  ];

  // Function to add click event to a button element
  const addButtonClickEvent = (id, func) => {
    const element = modalWrap.querySelector(`#${id}`);
    element.addEventListener("click", () => {
      func(element);
    });
  };

  // Add click events to modal buttons
  addButtonClickEvent("cancel-btn", (element) => {
    closeModal();
    modalWrap.innerHTML = ``;
  });

  let apiKeyInputState = false;
  addButtonClickEvent("update-api-key-btn", (element) => {
    // Toggle API key visibility
    if (apiKeyInputState) {
      apiKeyInputState = false;
      apiKeyInput.type = "password";
      apiKeyInput.readonly = true;
      apiKeyInput.disabled = true;
      element.style.backgroundColor = "#6610f2";
      element.innerHTML = "Show";
    } else {
      apiKeyInputState = true;
      apiKeyInput.type = "text";
      apiKeyInput.readonly = false;
      apiKeyInput.disabled = false;
      element.style.backgroundColor = "green";
      element.innerHTML = "Hide";
    }
  });

  let emailAppPasswordState = false;
  addButtonClickEvent("update-email-app-password-btn", (element) => {
    // Toggle Email App Password Visibility
    if (emailAppPasswordState) {
      emailAppPasswordState = false;
      senderEmailAppPasswordInput.type = "password";
      senderEmailAppPasswordInput.readonly = true;
      senderEmailAppPasswordInput.disabled = true;
      element.style.backgroundColor = "#6610f2";
      element.innerHTML = "Show";
    } else {
      emailAppPasswordState = true;
      senderEmailAppPasswordInput.type = "text";
      senderEmailAppPasswordInput.readonly = false;
      senderEmailAppPasswordInput.disabled = false;
      element.style.backgroundColor = "green";
      element.innerHTML = "Hide";
    }
  });

  addButtonClickEvent("submit-btn", async (element) => {
    // Handle form submission
    element.disabled = true;
    const formData = new FormData();
    formData.append("gpt_model", modelInput.value);
    formData.append("gpt_api_key", apiKeyInput.value);
    formData.append("formulate_questions_prompt", formulateQuestionsPromptInput.value);
    formData.append("summarize_cv_prompt", summarizeCVPromptInput.value);
    formData.append("sender_email_host", senderEmailHostInput.value);
    formData.append("sender_email_port", senderEmailPortInput.value);
    formData.append("sender_email_address", senderEmailAddressInput.value);
    formData.append("sender_email_app_password", senderEmailAppPasswordInput.value);
    formData.append("contacts_wechat", contactsWeChatInput.value);
    formData.append("contacts_phone", contactsPhoneInput.value);
    formData.append("contacts_whatsapp", contactsWhatsAppInput.value);
    formData.append("contacts_email", contactsEmailInput.value);
    formData.append("contacts_linkedin", contactsLinkedInInput.value);
    await fetch("/setSettings", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
      },
      body: formData
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    }).then((responseData) => {
      // Check task status and close modal
      const intervalID = setInterval( async () => {
        const formData = new FormData();
        formData.append("task_id", responseData.task_id);
        await fetch("/setSettingsTask", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
          },
          body: formData
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject(response);
        }).then((responseData) => {
          element.disabled = false;
          if (responseData.task_status == "SUCCESS") {
            clearInterval(intervalID);
            closeModal();
            modalWrap.innerHTML = ``;
          }
        });
      }, 500);
    }).catch((error) => {
      console.log(error);
    });
  });

  // Fetch settings data and update inputs
  const settingsTask = await getSettings();
  const intervalID = setInterval( async () => {
    const formData = new FormData();
    formData.append("task_id", settingsTask.task_id);
    await fetch("/getSettingsTask", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
      },
      body: formData
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    }).then((responseData) => {
      // Update input values with fetched settings
      if (responseData.task_status == "SUCCESS") {
        clearInterval(intervalID);

        const settings = responseData.settings;
        const model = settings.gpt_model;
        const apiKey = settings.gpt_api_key;
        const formulateQuestionsPrompt = settings.formulate_questions_prompt;
        const summarizeCVPrompt = settings.summarize_cv_prompt;
        const senderEmailHost = settings.sender_email_host;
        const senderEmailPort = settings.sender_email_port;
        const senderEmailAddress = settings.sender_email_address;
        const senderEmailAppPassword = settings.sender_email_app_password;
        const contactsWeChat = settings.contacts_wechat;
        const contactsPhone = settings.contacts_phone;
        const contactsWhatsApp = settings.contacts_whatsapp;
        const contactsEmail = settings.contacts_email;
        const contactsLinkedIn = settings.contacts_linkedin;

        modelInput.value = model ? model : "";
        apiKeyInput.value = apiKey ? apiKey : "";
        formulateQuestionsPromptInput.value = formulateQuestionsPrompt ? formulateQuestionsPrompt : "";
        summarizeCVPromptInput.value = summarizeCVPrompt ? summarizeCVPrompt : "";
        senderEmailHostInput.value = senderEmailHost ? senderEmailHost : "";
        senderEmailPortInput.value = senderEmailPort ? senderEmailPort : "";
        senderEmailAddressInput.value = senderEmailAddress ? senderEmailAddress : "";
        senderEmailAppPasswordInput.value = senderEmailAppPassword ? senderEmailAppPassword : "";
        contactsWeChatInput.value = contactsWeChat ? contactsWeChat : "";
        contactsPhoneInput.value = contactsPhone ? contactsPhone : "";
        contactsWhatsAppInput.value = contactsWhatsApp ? contactsWhatsApp : "";
        contactsEmailInput.value = contactsEmail ? contactsEmail : "";
        contactsLinkedInInput.value = contactsLinkedIn ? contactsLinkedIn : "";

        modelInput.disabled = false;
        formulateQuestionsPromptInput.disabled = false;
        summarizeCVPromptInput.disabled = false;
        senderEmailHostInput.disabled = false;
        senderEmailPortInput.disabled = false;
        senderEmailAddressInput.disabled = false;
        contactsWeChatInput.disabled = false;
        contactsPhoneInput.disabled = false;
        contactsWhatsAppInput.disabled = false;
        contactsEmailInput.disabled = false;
        contactsLinkedInInput.disabled = false;

        textAreaElements.forEach((item) => {
          const textAreaInput = item[0];
          const textAreaCountLabel = item[1]
          item[0].addEventListener('input', () => {
            updateTextCount(textAreaInput, textAreaCountLabel, 2500);
          })
          updateTextCount(textAreaInput, textAreaCountLabel, 2500);
        });
      }
    });
  }, 500);
}

/**
 * Fetches settings from the server.
 *
 * @returns {Promise} A Promise that resolves to the fetched settings.
 */
export async function getSettings() {
  try {
    // Fetch settings with authorization header
    const result = await fetch("/getSettings", {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
      },
    }).then((response) => {
      // Check if the response is okay, else reject the promise
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    });
    
    return result;
  } catch (error) {
    // Log any errors that occur during the fetch process
    console.log(error);
    throw error; // Re-throw the error to propagate it further
  }
}

/*
  The closeModal function retrieves the modal wrapper element in the HTML document using
  document.querySelector with the selector ".modal." It then uses the Bootstrap Modal
  API to get the modal instance and hides it, effectively closing the modal window.
*/
export function closeModal() {
  // Retrieve the modal wrapper element
  const modalWrapper = document.querySelector(".modal");
  
  // Get the Bootstrap Modal instance associated with the modal wrapper
  const modal = bootstrap.Modal.getInstance(modalWrapper);
  
  // Hide the modal, closing the modal window
  modal.hide();
}

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
export function showAlert(title, message, milliseconds) {
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

export function updateTextCount(element, textCountLabelElement, maxLength) {
  const textLength = Number(element.value.length);

  if (textLength >= maxLength) {
    element.value = element.value.slice(0, maxLength);
    textCountLabelElement.innerHTML = String(maxLength) + " / " + String(maxLength);
    textCountLabelElement.style.color = "red";
  } else {
    textCountLabelElement.innerHTML = String(textLength) + " / " + String(maxLength);
    textCountLabelElement.style.color = "rgb(164, 164, 164)";
    textCountLabelElement.style.fontWeight = "normal";
  }
}