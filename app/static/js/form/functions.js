import { data, tableContentWrapper, addJobButton, settingsButton } from "./variables.js";

/*
  The JavaScript code provided includes the following functions:

  1. getFormInputElements
  2. createFormInputElement
  3. showModal
  4. getJobs
  5. updateJobsTable
  6. confirmModal
  7. deleteJob
  8. createJobSettingsModal
  9. getUserSettings
  10. createJobModal
  11. showGenerateQuestionsModal
  12. generateQuestions
  13. editCellText
  14. submitQuestions
  15. showAlert
  16. showGenerateLoader
  17. showSuccess
  18. setActiveButtons
  19. showGeneratedQuestions
  20. setDownloadableCSV
  21. closeModal

*/

/*
  The getFormInputElements function retrieves an array of form input elements, 
  each represented by an object containing properties such as title, name, type, 
  and the corresponding HTML element. These input elements are specified using 
  the createFormInputElement helper function, making it convenient to access 
  and manipulate form data within the application.
*/
export function getFormInputElements() {
  const formInputIDs = [
    createFormInputElement(
      "Company Background",
      "company_background",
      "textarea",
      "#company-background-input"
    ),
    createFormInputElement(
      "Job Duties",
      "job_duties",
      "textarea",
      "#job-duties-input"
    ),
    createFormInputElement(
      "Job Requirements",
      "job_requirements",
      "textarea",
      "#job-requirements-input"
    ),
    createFormInputElement(
      "Manual Questions",
      "manual_questions",
      "textarea",
      "#manual-questions-input"
    ),
    createFormInputElement(
      "Job Title",
      "job_title",
      "text",
      "#job-title-input"
    ),
  ];

  return formInputIDs;
}

/*
  The createFormInputElement function is a helper function used by 
  getFormInputElements to create and organize form input elements. It takes 
  parameters such as title, name, type, and a CSS selector, and returns an 
  object representing a form input element. This object encapsulates properties 
  like title, name, type, and a reference to the HTML element obtained using 
  the provided selector. This abstraction aids in maintaining a clean and 
  structured representation of form inputs for further processing or 
  manipulation in the application.
*/
function createFormInputElement(title, name, type, selector) {
  return {
    title,
    name,
    type,
    element: document.querySelector(selector),
  };
}

let modalWrap = null;
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
  var modal = new bootstrap.Modal(document.querySelector(".modal"));
  modal.show();
}

// Get all jobs from API endpoint
export async function getJobs() {
  addJobButton.disabled = true;
  settingsButton.disabled = true;
  tableContentWrapper.innerHTML = `
    <div class="d-flex justify-content-center align-items-center" style="height: auto;">
      <span class="generate-loader"></span>
    </div>
  `;
  const result = await fetch("/getJobs", {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .catch((e) => {
      console.log(e);
    });
  return result
}

export function updateJobsTable(data) {

  addJobButton.disabled = false;
  settingsButton.disabled = false;

  if (data.length > 0) {
    tableContentWrapper.innerHTML = `
      <div class="table-responsive">
        <table
          id="jobs-table"
          class="table table-scrollable table-hover table-bordered rounded table-sm table-striped"
          style="font-size: 0.9rem;">
          <thead>
            <tr class="table-danger">
              <th class="text-center" style="width: 40%;">Job</th>
              <th class="text-center" style="width: 20%;">Summaries</th>
              <th class="text-center" style="width: 40%;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Jobs will be dynamically added here -->
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
          No Jobs
        </h1>
      </div>
    `;
    return;
  }

  const tableBodyRef = document
    .querySelector("#jobs-table")
    .getElementsByTagName("tbody")[0];

  tableBodyRef.innerHTML = '';

  data.forEach((job) => {

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
    }

    const jobID = createElement(`job-${job.id}`, job.job_title, "text");
    const summaries = createElement(`summaries-${job.id}`, job.summaries, "text");
    const infoButton = createElement(`info-button-${job.id}`, null, "button");
    const viewButton = createElement(`view-button-${job.id}`, null, "button");
    const deleteButton = createElement(`delete-button-${job.id}`, null, "button");

    const infoIcon = createElement(`info-icon-${job.id}`, null, "i");
    const viewIcon = createElement(`view-icon-${job.id}`, null, "i");
    const deleteIcon = createElement(`delete-icon-${job.id}`, null, "i");
    
    // Append icons to edit and delete buttons
    infoButton.appendChild(infoIcon);
    viewButton.appendChild(viewIcon);
    deleteButton.appendChild(deleteIcon);

    const jobIDCell = insertCell(jobID);
    const summariesCell = insertCell(summaries);
    const actionsCell = insertCell(infoButton, viewButton, deleteButton);

    // Add text-center class
    [summariesCell, jobIDCell, actionsCell].forEach((cell) => { 
      cell.style.textAlign = "center";
      cell.style.verticalAlign = "middle";
    });

    // Add classes to buttons
    [infoButton, viewButton, deleteButton].forEach((button) => {
      button.classList.add("btn", "me-1");
      new bootstrap.Tooltip(button, {
        placement: 'top'
      });
    });

    // Add classes to icons
    [infoIcon, viewIcon, deleteIcon].forEach((icon) => {
      icon.style.fontSize = "0.9rem";
      icon.classList.add("fi");
    });

    // Add specific classes to buttons for styling
    infoButton.classList.add("btn", "btn-info", "btn-sm");
    viewButton.classList.add("btn", "btn-primary", "btn-sm");
    deleteButton.classList.add("btn", "btn-danger", "btn-sm");
    new bootstrap.Tooltip(infoButton, {
      title: 'Details'
    });
    new bootstrap.Tooltip(viewButton, {
      title: 'Summaries'
    });
    new bootstrap.Tooltip(deleteButton, {
      title: 'Delete'
    });

    // Add specific icons to buttons for styling
    infoIcon.classList.add("fi-sr-info");
    viewIcon.classList.add("fi-sr-document");
    deleteIcon.classList.add("fi-sr-trash");

    // Add event listeners for edit and delete actions
    infoButton.addEventListener("click", () => {
      createJobInfoModal(job);
    });

    viewButton.addEventListener("click", () => {
      const loaderWrapper = document.querySelector(".screen-loader-wrapper");
      loaderWrapper.classList.add("fade-out");
      loaderWrapper.classList.remove("fade-in");
      setTimeout(() => {
        const currentURL = location.href;
        location.assign(
          currentURL + "/summaries" + "?job_id=" + job.id
        );
      }, 500);
    });

    deleteButton.addEventListener("click", () => {
      const rowIndex = deleteButton.parentNode.parentNode.rowIndex - 1;
      confirmModal( async ()=>{
        viewButton.disabled = true;
        deleteButton.disabled = true;
        await deleteJob(job.id);
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
                No Jobs
              </h1>
            </div>
          `;
        }
      });
    });

  });
    
}

export function createJobInfoModal(job) {

  showModal();

  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">&#128712; View Job Details</h5>
  `;

  footer.innerHTML = `
    <button id="done-btn" type="button" class="btn btn-success btn-sm" style="font-size: 0.9rem;" data-bs-dismiss="modal">Done</button>
  `;

  dialog.style = 'min-width: 50%;'
  header.classList.add("d-flex", "justify-content-between")
  body.style = "min-height: 65vh; font-size: 0.9rem;"

  /*
  Adds a click event listener to the button with the specified ID,
  triggering the provided function when the button is clicked.
  */
  function addButtonClickEvent(id, func) {
    modalWrap.querySelector(`#${id}`).addEventListener("click", func);
  }

  addButtonClickEvent("done-btn", () => {
    modalWrap.innerHTML = '';
  })

  const items = {
    'Job Title': job.job_title,
    'Summaries': job.summaries,
    'Company Background': job.company_background,
    'Job Duties': job.job_duties,
    'Job Requirements': job.job_requirements,
  };
  
  for (let item in items) {
    body.innerHTML += `
      <strong>${item}</strong>
      <p style="margin: 0;">${items[item]}</p>
      <br>
    `
  }

}

export function confirmModal(yesFunc = () => {}, noFunc = () => {}) {

  showModal();

  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">Confirm</h5>
  `;

  body.innerHTML = `
    <p style="margin: 0; font-size: 0.9rem;">Are you sure?</p>
  `;

  footer.innerHTML = `
    <button id="no-btn" type="button" class="btn btn-secondary btn-sm" style="font-size: 0.9rem;" data-bs-dismiss="modal">No</button>
    <button id="yes-btn" type="button" class="btn btn-success btn-sm" style="font-size: 0.9rem;" data-bs-dismiss="modal">Yes</button>
  `;

  modal.classList.add("d-flex", "justify-content-center", "align-items-center");
  dialog.style = 'width: 240px;';
  header.classList.add("d-flex", "justify-content-between");

  const addButtonClickEvent = (id, func) => {
    modalWrap.querySelector(`#${id}`).addEventListener("click", () => {
      func();
    });
  };

  addButtonClickEvent("no-btn", () => {
    noFunc();
    modalWrap.innerHTML = '';
  })

  addButtonClickEvent("yes-btn", () => {
    modalWrap.innerHTML = '';
    yesFunc();
  })

}

export async function deleteJob(job_id) {
  const formData = new FormData();
  formData.append("job_id", job_id);
  const response = await fetch("/deleteJob", {
    method: "POST",
    body: formData
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  }).then((responseData) => {

  }).catch((error) => {
    console.log(error);
  });
  return response;
}

export async function createJobSettingsModal() {

  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">
      <span class="me-1">	&#9881</span>
      Settings
    </h5>
    <div id="default-user-settings-wrapper" class="form-check form-switch" tabindex="0">
      <input class="form-check-input" type="checkbox" role="switch" id="use-default-input">
      <label class="form-check-label" style="font-size: 0.9rem;" for="use-default-input">Use Default</label>
    </div>
  `;

  body.innerHTML = `
  <form id="form-input" style="font-size: 14px">

  <!-- First Row -->
  <div class="row">

    <!-- First Column -->
    <div class="col">
      <label for="model-input" style="font-size: 0.9rem;">
      <i class="fi fi-sr-key me-1"></i>
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

  </div>

  <div class="row mt-3">
    <div class="col">
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
          autocomplete="off"
        />
        <button class="btn btn-sm text-white" style="background-color: #6610f2; font-size: 0.9rem;" type="button" id="update-api-key-btn">Show</button>
      </div>
    </div>
  </div>

  </form>
  `;

  footer.innerHTML = `
    <button id="cancel-btn" class="btn btn-secondary btn-sm mx-2" style="font-size: 0.9rem;"/>Cancel</button>
    <button id="submit-btn" class="btn btn-dark btn-sm mx-2" style="font-size: 0.9rem;"/>Submit</button>
  `;

  dialog.classList.add("modal-dialog-centered");
  dialog.style = 'min-width: 40vw';
  header.classList.add("d-flex", "justify-content-between");
  body.classList.add("m-2");
  body.style = "min-height: 100%;";

  let useDefaultOption = false;

  const useDefaultInput = document.querySelector("#use-default-input");
  const modelInput = document.querySelector("#model-input");
  const apiKeyInput = document.querySelector("#api-key-input");
  const updateApiKeyBtn = document.querySelector("#update-api-key-btn");

  useDefaultInput.checked = false;
  useDefaultInput.disabled = true;
  modelInput.disabled = true;
  apiKeyInput.disabled = true;
  updateApiKeyBtn.disabled = true;
  modelInput.readonly = true;
  apiKeyInput.readonly = true;

  const userSettingsTask = await getUserSettings();
  const intervalID = setInterval( async () => {
    const formData = new FormData();
    formData.append("task_id", userSettingsTask.task_id);
    await fetch("/getUserSettingsTask", {
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
        clearInterval(intervalID);

        const user_settings = responseData.user_settings;

        if (user_settings.gpt_api_key_permission === 'default') {
          useDefaultInput.disabled = false;
          if (user_settings.gpt_api_key_preference === 'default') {
            modelInput.value = '';
            apiKeyInput.value = '';
            useDefaultOption = true;
            useDefaultInput.checked = true;
            modelInput.readonly = true;
            apiKeyInput.readonly = true;
            modelInput.disabled = true;
            apiKeyInput.disabled = true;
            updateApiKeyBtn.disabled = true;
          } else {
            modelInput.value = user_settings.gpt_model;
            apiKeyInput.value = user_settings.gpt_api_key;
            useDefaultOption = false;
            modelInput.readonly = false;
            apiKeyInput.readonly = false;
            modelInput.disabled = false;
            apiKeyInput.disabled = false;
            updateApiKeyBtn.disabled = false;
          }
          useDefaultInput.addEventListener("change", () => {
            if (useDefaultInput.checked) {
              modelInput.value = '';
              apiKeyInput.value = '';
              useDefaultOption = true;
              modelInput.readonly = true;
              apiKeyInput.readonly = true;
              modelInput.disabled = true;
              apiKeyInput.disabled = true;
              updateApiKeyBtn.disabled = true;
            } else {
              modelInput.value = user_settings.gpt_model;
              apiKeyInput.value = user_settings.gpt_api_key;
              useDefaultOption = false;
              modelInput.readonly = false;
              apiKeyInput.readonly = false;
              modelInput.disabled = false;
              apiKeyInput.disabled = false;
              updateApiKeyBtn.disabled = false;
            }
          });
        } else {
          const wrapper = document.querySelector("#default-user-settings-wrapper");
          new bootstrap.Tooltip(wrapper, {
            placement: 'left',
            title: 'You are not allowed to use default settings. Please contact the company if you wish to enabled them'
          });
          modelInput.value = user_settings.gpt_model;
          apiKeyInput.value = user_settings.gpt_api_key;
          modelInput.disabled = false;
          apiKeyInput.disabled = false;
          updateApiKeyBtn.disabled = false;
        }
      }
    });
  }, 500);

  const addButtonClickEvent = (id, func) => {
    const element = modalWrap.querySelector(`#${id}`);
    element.addEventListener("click", () => {
      func(element);
    });
  };

  addButtonClickEvent("cancel-btn", (element) => {
    closeModal();
    modalWrap.innerHTML = ``;
  });

  addButtonClickEvent("submit-btn", async (element) => {
    // console.log(useDefaultOption);
    const formData = new FormData();
    if (useDefaultOption) {
      formData.append("gpt_api_key_preference", (useDefaultOption)? 'default': 'custom');
    } else {
      formData.append("gpt_model", modelInput.value);
      formData.append("gpt_api_key", apiKeyInput.value);
      formData.append("gpt_api_key_preference", (useDefaultOption)? 'default': 'custom');
    }

    await fetch("/setUserSettings", {
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

      const intervalID = setInterval( async () => {
        const formData = new FormData();
        formData.append("task_id", userSettingsTask.task_id);
        await fetch("/setUserSettingsTask", {
          method: "POST",
          body: formData
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject(response);
        }).then((responseData) => {
    
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

  })

  let apiKeyInputState = false;
  addButtonClickEvent("update-api-key-btn", (element) => {
    if (apiKeyInputState) {
      apiKeyInputState = false;
      apiKeyInput.type = "password";
      apiKeyInput.setAttribute("readonly", "true");
      element.style.backgroundColor = "#6610f2";
      element.innerHTML = "Show";
    } else {
      apiKeyInputState = true;
      apiKeyInput.type = "text";
      apiKeyInput.removeAttribute("readonly");
      element.style.backgroundColor = "green";
      element.innerHTML = "Hide";
    }
  });

}

export async function getUserSettings() {
  const result = await fetch("/getUserSettings", {
    method: "GET",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  }).catch((error) => {
    console.log(error);
  });
  return result;
}

export function createJobModal() {

  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">
    <span class="me-1">&#128218</span>
    Add Job</h5>
  `;

  body.innerHTML = `
  <!-- This div container holds the form element -->
    <form id="form-input">

      <!-- Seventh Row -->
      <div class="row">
        <!-- First Column -->
        <div class="col-md-5">
          <label for="job-title-input" class="required" style="font-size: 0.9rem;">
            <i class="fi fi-sr-user me-2"></i>
            Job Title</label
          >
        </div>
        <!-- Second Column -->
        <div class="col-md-7">
          <input
            id="job-title-input"
            type="text"
            class="form-control"
            style="font-size: 0.9rem;
            placeholder="e.g. Software Engineer"
            required
            value="Software Engineer"
          />
        </div>
      </div>

      <!-- Third Row -->
      <div class="mt-3 row">
        <!-- First Column -->
        <div class="col-md-5">
          <label for="company-background-input" class="required" style="font-size: 0.9rem;">
            <i class="fi fi-sr-info me-2"></i>
            Company's Background</label
          >
        </div>

        <!-- Second Column -->
        <div class="col-md-7">
          <textarea
            id="company-background-input"
            class="form-control"
            rows="5"
            style="min-height: 150px; font-size: 0.9rem;"
            placeholder="e.g. We are a tech company specializing in AI solutions"
            required
          >
We are a tech company specializing in AI solutions</textarea
          >
          <div class="char-count-wrapper">
            <p id="comapny-background-input-char-count" class="char-count-label"></p>
          </div>
        </div>
      </div>

      <!-- Fourth Row -->
      <div class="mt-3 row">
        <div class="col-md-5">
          <label for="job-duties-input" class="required" style="font-size: 0.9rem;">
            <i class="fi fi-sr-briefcase me-2"></i>
            Job Duties</label
          >
        </div>
        <div class="col-md-7">
          <textarea
            id="job-duties-input"
            class="form-control"
            rows="5"
            style="min-height: 150px; font-size: 0.9rem;"
            placeholder="e.g. Develop software applications and conduct testing"
            required
            value=""
          >
Develop software applications and conduct testing</textarea
          >
          <div class="char-count-wrapper">
            <p id="job-duties-input-char-count" class="char-count-label"></p>
          </div>
        </div>
      </div>

      <!-- Fifth Row -->
      <div class="mt-3 row">
        <div class="col-md-5">
          <label for="job-requirements-input" class="required" style="font-size: 0.9rem;">
            <i class="fi fi-sr-diploma me-2"></i>
            Job Requirements</label
          >
        </div>
        <div class="col-md-7">
          <textarea
            id="job-requirements-input"
            class="form-control"
            rows="5"
            style="min-height: 150px; font-size: 0.9rem;"
            placeholder="e.g. At least 2 years of experience in software development."
            required
          >
At least 2 years of experience in software development</textarea
          >
          <div class="char-count-wrapper">
            <p id="job-requirements-input-char-count" class="char-count-label"></p>
          </div>
        </div>
      </div>

      <!-- Sixth Row -->
      <div class="mt-3 row">
        <!-- First Column -->
        <div class="col-md-5">
          <label for="manual-questions-input" style="font-size: 0.9rem;">
            <i class="fi fi-sr-interrogation me-2"></i>
            Manual Questions</label
          >
        </div>
        <!-- Second Column -->
        <div class="col-md-7">
          <textarea
            id="manual-questions-input"
            class="form-control"
            rows="5"
            style="min-height: 150px; font-size: 0.9rem;"
            placeholder="e.g. Does the candidate have any experience working in China?"
          ></textarea>
          <div class="char-count-wrapper">
            <p id="manual-questions-input-char-count" class="char-count-label"></p>
          </div>
        </div>
      </div>
    </form>
  `;

  footer.innerHTML = `
    <button id="cancel-btn" class="btn btn-secondary btn-sm mx-2" style="font-size: 0.9rem;"/>Cancel</button>
    <button id="submit-btn" class="btn btn-dark btn-sm mx-2" style="font-size: 0.9rem;"/>Submit</button>
  `;

  dialog.style = 'min-width: 50%;';
  header.classList.add("d-flex", "justify-content-between");
  body.classList.add("m-2");
  body.style = "min-height: 60vh;";

  const addButtonClickEvent = (id, func) => {
    modalWrap.querySelector(`#${id}`).addEventListener("click", () => {
      func();
    });
  };

  const formInputElements = getFormInputElements();

  const textAreaElements = [
    [formInputElements[0].element, document.querySelector("#comapny-background-input-char-count")],
    [formInputElements[1].element, document.querySelector("#job-duties-input-char-count")],
    [formInputElements[2].element, document.querySelector("#job-requirements-input-char-count")],
    [formInputElements[3].element, document.querySelector("#manual-questions-input-char-count")]
  ];

  textAreaElements.forEach((item) => {
    const textAreaInput = item[0];
    const textAreaCountLabel = item[1]
    item[0].addEventListener('input', () => {
      updateTextCount(textAreaInput, textAreaCountLabel, 600);
    })
    updateTextCount(textAreaInput, textAreaCountLabel, 600);
  });

  addButtonClickEvent("cancel-btn", () => {
    closeModal();
    modalWrap.innerHTML = ``;
  });
  addButtonClickEvent("submit-btn", () => {

    let proceed = true;

    // Check empty inputs
    formInputElements.forEach((item) => {
      if (item.element.value === "" && item.name !== "manual_questions") {
        proceed = false;
      }
    })

    if (proceed) {
      formInputElements.forEach((item) => {
        data["form"][item.name] = item.element.value;
      });
      showGenerateQuestionsModal();
  
      body.style = "min-height: 65vh;"
  
      // Replaced the modal body
      generateQuestions();
    }

  });
}

export function showGenerateQuestionsModal() {
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const modalBody = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">&#128218 Questions</h5>
    <div>
      <a id="download-questions-link" style="display: none;"></a>
      <button 
        id="download-questions-btn" 
        class="btn btn-warning btn-sm"
        style="font-size: 0.9rem;">
        <i class="fi fi-sr-download"></i>
      </button>
    </div>
  `;

  footer.innerHTML = `
    <button id="cancel-btn" type="button" class="btn btn-secondary btn-sm" style="font-size: 0.9rem;" data-bs-dismiss="modal">Cancel</button>
    <button id="generate-btn" type="button" class="btn btn-primary btn-sm" style="font-size: 0.9rem;">Regenerate</button>
    <button id="submit-btn" type="button" class="btn btn-success btn-sm" style="font-size: 0.9rem;">Confirm & Submit</button>
  `;

  dialog.style = "min-width: 50%;";
  header.classList.add("d-flex", "justify-content-between");

  const addButtonClickEvent = (id, func) => {
    modalWrap.querySelector(`#${id}`).addEventListener("click", () => {
      func();
    });
  };

  const downloadQuestionsButton = document.querySelector("#download-questions-btn");
  new bootstrap.Tooltip(downloadQuestionsButton, {
    placement: 'left',
    title: 'Download'
  });

  addButtonClickEvent("cancel-btn", () => modalWrap.remove());
  addButtonClickEvent("generate-btn", () => {
    generateQuestions(); // Callback function for the 'Regenerate' button
  });
  addButtonClickEvent("submit-btn", () => {
    submitQuestions(); // Callback function for the 'Confirm & Submit' button
  });
  addButtonClickEvent("download-questions-btn", () => {
    document.querySelector("#download-questions-link").click();
  });
}

export async function generateQuestions() {
  
  // Prepare form inputs
  const formData = new FormData();

  for (let item in data["form"]) {
    formData.append(item, data["form"][item]);
  };

  showGenerateLoader();

  // Disable buttons
  setActiveButtons({
    generate: false,
    submit: false,
    "add-question": false,
    "download-questions": false,
  });

  // Send a POST request
  await fetch("/generateQuestions", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .then((responseData) => {

      const intervalID = setInterval( async () => {
        const formData = new FormData();
        formData.append("task_id", responseData.task_id);
        await fetch("/generateQuestionsTask", {
          method: "POST",
          body: formData
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject(response);
        }).then((responseData) => {

          if (responseData.status == "SUCCESS") {
            clearInterval(intervalID);

            if (responseData.task_status == 'SUCCESS') {
              data["questions"] = responseData.questions;
              showGeneratedQuestions(responseData.questions);
              setDownloadableCSV();
              // Enable buttons
              setActiveButtons({
                generate: true,
                submit: true,
                "add-question": true,
                "download-questions": true,
              });
            } else if (responseData.task_status == 'FAILED') {
              const modalBody = document.querySelector(".modal-body");
              modalBody.innerHTML = `${responseData.message}`;
            }
            
          }
        })
      }, 5000);

    })
    .catch((error) => {
      console.log(error);
    });
}

/*
  The editCellText function facilitates the editing of text content within a cell of a dynamically generated table.
  It takes an index parameter representing the position of the cell in the table and performs the following steps:
  1. Retrieves the element, button, and button icon associated with the specified index.
  2. Checks if the element is not a textarea; if true, replaces it with a textarea for editing.
     - Changes the button style and icon accordingly for a seamless user experience.
  3. If the element is already a textarea, replaces it with a div displaying the edited text.
     - Restores the button style and icon for a consistent UI.
  4. Returns the text value either from the original element or the edited textarea.

  Note: The function dynamically toggles between textarea and div elements for in-place editing.
*/
export function editCellText(index) {
  let textValue = "";
  const element = document.querySelector(`#question-${index}`);
  const button = document.querySelector(`#edit-button-${index}`);
  const buttonIcon = document.querySelector(`#edit-icon-${index}`);

  if (element.nodeName !== "TEXTAREA") {
    // Switch to textarea for editing
    const newElement = document.createElement("textarea");
    newElement.style.width = "100%";
    newElement.style.height = "auto";
    newElement.id = element.id;
    newElement.value = element.innerHTML;
    element.replaceWith(newElement);
    button.classList.remove("btn-primary");
    button.classList.add("btn-success");
    buttonIcon.classList.remove("fi-sr-pencil");
    buttonIcon.classList.add("fi-sr-check");
  } else {
    // Switch back to div after editing
    const newElement = document.createElement("div");
    newElement.style.cssText = `
      word-wrap: break-word;
    `;
    newElement.id = element.id;
    newElement.innerHTML = element.value;
    element.replaceWith(newElement);
    button.classList.remove("btn-success");
    button.classList.add("btn-primary");
    buttonIcon.classList.remove("fi-sr-check");
    buttonIcon.classList.add("fi-sr-pencil");
    textValue = element.value;
  }

  return textValue;
}

/*
  The submitQuestions function is triggered when a user submits questions. It 
  begins by disabling the "Generate" and "Submit" buttons to prevent multiple 
  submissions. It then sends a POST request to the "/addJob" endpoint 
  with form data. Upon a successful response, it initiates a fade-out animation 
  for a loader, and after a brief delay, redirects the user to the "/candidates" 
  page. In case of an error, the function enables the buttons after a delay, 
  displays an alert with the error message, and handles the rejection of the 
  promise returned by the fetch operation.
*/
export async function submitQuestions() {
  const formData = new FormData();

  showGenerateLoader();

  formData.append("form", JSON.stringify(data.form));
  formData.append("questions", JSON.stringify(data.questions));

  setActiveButtons({
    generate: false,
    submit: false,
    "add-question": false,
    "download-questions": false,
  });

  await fetch("/addJob", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .then((responseData) => {

      showSuccess();
      setTimeout(async () => {
        closeModal();
        modalWrap.innerHTML = ``;
        const jobs = await getJobs();
        updateJobsTable(jobs);
      }, 4000);

    })
    .catch((error) => {
      showAlert("", error.message, 2000);
    });
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
    <div class="alert alert-danger alert-dismissible fade show m-2" style="margin: 0; font-size: 0.9rem;" role="alert">
      <strong>${title}</strong> ${message}
      <button type="button" class="btn-close" style="font-size: 0.9rem;" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  alertWrapper.appendChild(alert);
  document.body.append(alertWrapper);

  setTimeout(() => {
    bootstrap.Alert.getOrCreateInstance(".alert").close();
  }, milliseconds);
}

/*
  The showGenerateLoader function is responsible for displaying a loading indicator in the modal body during the generation of questions.
  It replaces the modal body content with a loading spinner, creating a visual cue for users that the generation process is ongoing.

  The function first obtains a reference to the modal body using the selector ".modal-body." It then replaces the content of the modal body
  with a dynamically generated HTML structure containing a loading spinner. The spinner is centered within the modal body using flexbox
  alignment properties, and the minimum height of the container is set to ensure proper spacing.
*/
export function showGenerateLoader() {
  // Obtain a reference to the modal body
  const modalBody = document.querySelector(".modal-body");

  // Replace the modal body content with a loading spinner
  modalBody.innerHTML = `
    <div class="d-flex justify-content-center align-items-center" style="min-height: 60vh;">
      <span class="generate-loader"></span>
    </div>
  `;
}

export function showSuccess() {
  // Obtain a reference to the modal body
  const modalBody = document.querySelector(".modal-body");

  // Replace the modal body content with a loading spinner
  modalBody.innerHTML = `
    <div class="d-flex justify-content-center align-items-center" style="min-height: 60vh;">
    <svg version="1.1" id="icons_1_" xmlns="http://www.w3.org/2000/svg" x="0" y="0" width="40" height="40" viewBox="0 0 128 128" style="enable-background:new 0 0 128 128" xml:space="preserve"><style>.st0{display:none}.st1{display:inline}.st2{fill:#0a0a0a}</style><g id="row1_1_"><g id="_x35__2_"><path class="st2" d="M64 .3C28.7.3 0 28.8 0 64s28.7 63.7 64 63.7 64-28.5 64-63.7S99.3.3 64 .3zm0 121C32.2 121.3 6.4 95.7 6.4 64 6.4 32.3 32.2 6.7 64 6.7s57.6 25.7 57.6 57.3c0 31.7-25.8 57.3-57.6 57.3zm23.2-76.8c-.9-.9-2.3-.9-3.2 0L55.2 73.2 41.4 59.5c-.9-.9-2.3-.9-3.2 0l-4.8 4.8c-.9.9-.9 2.3 0 3.2l15.3 15.3 3.3 3.3.8.8.7.7c.9.9 2.3.9 3.2 0L92 52.5c.9-.9.9-2.3 0-3.2l-4.8-4.8z" id="error_transparent_copy"/></g></g></svg>
    </div>
  `;
}

/*
  The setActiveButtons function is designed to enable or disable specific buttons on a web page based on the provided buttons object.
  The function takes an object buttons as its parameter, where each property corresponds to a button name, and the associated value (boolean)
  indicates whether the button should be enabled (true) or disabled (false). The supported button names are "generate," "submit," "add-question,"
  and "download-questions."
*/
export function setActiveButtons(buttons) {
  // Array of supported button names
  const button_names = [
    "generate",
    "submit",
    "add-question",
    "download-questions",
  ];

  // Iterate through each button name
  button_names.forEach((button_name) => {
    // Check if the button_name is present in the buttons object
    if (button_name in buttons) {
      try {
        // Attempt to locate the corresponding HTML button element
        const button = document.querySelector(`#${button_name}-btn`);

        // Set the disabled attribute based on the corresponding value in the buttons object
        button.disabled = !buttons[button_name];
      } catch (error) {
        // Log an error message if the button is not found
        console.log(error + ": " + button_name);
      }
    }
  });
}

/*
  The showGeneratedQuestions function displays generated questions in a modal window. It creates a structured table
  within the modal body, adjusting its minimum height for proper spacing. The function populates the table with data
  from the provided array, including columns for ID, Question, and Actions. Edit and delete buttons are provided
  for each question, enabling user interaction.
*/
export function showGeneratedQuestions(responseData) {
  
  const modalBody = document.querySelector(".modal-body");

  // Create a table of questions dynamically
  const tableContainer = document.createElement("div");
  tableContainer.innerHTML = `
      <div class="table-responsive">
        <table id="questions-table" class="table table-hover table-bordered table-sm table-striped" style="font-size: 0.9rem;">
          <thead>
            <tr class="table-success">
              <th class="text-center" style="width: 10%;">ID</th>
              <th class="text-center" style="width: 70%;">Question</th>
              <th class="text-center" style="width: 20%;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Questions data -->
          </tbody>
        </table>
        <div class="d-grid">
          <button 
            id="add-question-btn" 
            class="btn btn-sm" 
            style="font-size: 0.9rem; background-color: #6200ea; color: white;">
            <i class="fi fi-sr-plus me-1" style="font-size: 0.9rem;"></i> Add More
          </button>
        </div>
      </div>
    `;

  // Set modal body content to the generated table
  modalBody.innerHTML = tableContainer.innerHTML;
  // Adjust minimum height of the modal body for proper spacing
  modalBody.style.minHeight = "65vh";

  // Populate the table with data from the provided array
  const tableBodyRef = document
    .querySelector("#questions-table")
    .getElementsByTagName("tbody")[0];

  // Function to insert cells into the new row
  const insertCell = (newRow, ...items) => {
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

  const addNewRow = (item, index) => {
    // Create a new row in the table
    const newRow = tableBodyRef.insertRow(-1);

    // Create elements for ID, Question, and Actions
    const id = createElement(`id-${index}`, item.id, "text");
    const question = createElement(`question-${index}`, null, "p");
    const editButton = createElement(`edit-button-${index}`, null, "button");
    const deleteButton = createElement(
      `delete-button-${index}`,
      null,
      "button"
    );
    const editIcon = createElement(`edit-icon-${index}`, null, "i");
    const deleteIcon = createElement(`delete-icon-${index}`, null, "i");

    // Set the question content
    question.innerHTML = item.question;

    // Append icons to edit and delete buttons
    editButton.appendChild(editIcon);
    deleteButton.appendChild(deleteIcon);

    // Insert cells for ID, Question, and Actions
    const idCell = insertCell(newRow, id);
    const questionCell = insertCell(newRow, question);
    const actionsCell = insertCell(newRow, editButton, deleteButton);

    // Add text-center class to cells
    [idCell, questionCell, actionsCell].forEach((cell) => {
      cell.style.textAlign = "center";
      cell.style.verticalAlign = "middle";
    });

    // Add classes to buttons
    [editButton, deleteButton].forEach((button) => {
      button.classList.add("btn", "me-1", "btn-sm");
      new bootstrap.Tooltip(button, {
        placement: 'top'
      });
    });

    // Add classes to icons
    [editIcon, deleteIcon].forEach((icon) => {
      icon.style.fontSize = "0.9rem";
      icon.classList.add("fi")
    });

    // Add specific classes to buttons for styling
    editButton.classList.add("btn-primary");
    deleteButton.classList.add("btn-danger");

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
      const rowIndex = deleteButton.parentNode.parentNode.rowIndex - 1;
      data["questions"][rowIndex].question = editCellText(index);
      setDownloadableCSV();
    });

    deleteButton.addEventListener("click", () => {
      let tooltip = bootstrap.Tooltip.getInstance(deleteButton);
      if (tooltip) {
        tooltip.dispose();
      }
      const rowIndex = deleteButton.parentNode.parentNode.rowIndex - 1;
      tableBodyRef.deleteRow(rowIndex);
      data["questions"].splice(rowIndex, 1);
      setDownloadableCSV();
    });
  };

  const addQuestionButton = document.querySelector("#add-question-btn");
  addQuestionButton.addEventListener("click", () => {
    const length = data["questions"].length;
    const lastRowId = data["questions"][length - 1].id;
    const id = (length > 0)? lastRowId + 1 : 1;
    const newQuestion = {
      "id": id,
      "question": "",
      "answer": ""
    };
    data["questions"].push(newQuestion);
    addNewRow(newQuestion, id);
    editCellText(id);
  });

  responseData.forEach((item, index) => {
    addNewRow(item, index);
  });
}

/*
  The setDownloadableCSV function creates a downloadable CSV file containing questions from the data.questions array.
  It iterates through each item in the data.questions array, extracts the question text, and forms rows in the CSV format.
  The CSV content is constructed by joining the rows with newline characters and encoding it as a data URI with UTF-8 charset.

  The function then locates the download button in the HTML document with the id "download-questions-link" using
  document.querySelector. It sets the "href" attribute to the encoded URI, making the CSV content downloadable.
  Additionally, it sets the "download" attribute to "questions.csv," providing a default filename for the downloaded file.
*/
export function setDownloadableCSV() {
  // Create an array to store rows in CSV format
  const rows = [];
  
  // Iterate through each question in the data.questions array
  data.questions.forEach((item) => rows.push([item.question]));

  // Prepare CSV content by joining rows with newline characters
  const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");

  // Encode the CSV content as a data URI
  const encodedUri = encodeURI(csvContent);

  // Locate the download button in the HTML document
  const downloadButton = document.querySelector("#download-questions-link");

  // Set attributes for the download button to enable CSV file download
  downloadButton.setAttribute("href", encodedUri);
  downloadButton.setAttribute("download", "questions.csv");
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