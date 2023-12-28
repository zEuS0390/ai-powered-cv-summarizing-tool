import { uploadProgressFiles, uploadFilesButton, downloadSummariesButton, tableContentWrapper } from "./variables.js";

/*
  These functions are responsible for various tasks, including interacting with the 
  DOM, making asynchronous requests, handling file uploads, and managing modals.

  Functions:
  
  1. uploadCSV
  2. getSummaries
  3. updateSummariesTable
  4. deleteSummary
  5. showModal
  6. addButtonClickEvent
  7. confirmModal
  8. viewSummary
  9. uploadFilesModal
  10. handleFileChange
  11. uploadFile
  12. cancelAllUploads
  13. createUploadProgressElement
  14. uploadChunk
  15. updateProgress
  16. formatFileSize
  17. submitToSummarize
  18. showGenerateLoader
  19. closeModal
  20. showSuccess
*/

let uploadFileCounter = 0;

/**
 * Async function to export CSV based on job_id.
 * @param {string} job_id - The job ID for which the CSV should be exported.
 * @returns {Promise} A Promise that resolves when the export is successful or rejects with an error.
 */
export async function exportCSV(job_id) {
  const formData = new FormData();
  formData.append("job_id", job_id);
  await fetch('/exportCSV', {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
    body: formData  
  })
  .then(response => {
    // Check if the response is successful (status code 200)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition.split(';')[1].trim().split('=')[1];

    // Create a blob representing the CSV file
    return response.blob().then(blob => ({ blob, filename }));
  })
  .then(({ blob, filename }) => {
    // Create a data URL from the blob
    const dataUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.style = "display: none";
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Clean up: revoke the data URL
    URL.revokeObjectURL(dataUrl);
  })
  .catch(error => console.error('Error:', error));
}

// Get all candidates from API endpoint
/**
 * Async function to get summaries based on job_id.
 * @param {string} job_id - The job ID for which summaries should be retrieved.
 * @returns {Promise} A Promise that resolves to the summaries data or rejects with an error.
 */
export async function getSummaries(job_id) {

  uploadFilesButton.disabled = true;
  downloadSummariesButton.disabled = true;
  
  tableContentWrapper.innerHTML = `
    <div class="d-flex justify-content-center align-items-center" style="height: auto;">
      <span class="generate-loader"></span>
    </div>
  `;

  const formData = new FormData();
  formData.append("job_id", job_id)
  const result = await fetch("/getSummaries", {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
    body: formData
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      return Promise.reject(response);
    })
    .catch((error) => {
      console.log(error);
    });
  return result
}

/**
 * Function to update the summaries table in the HTML document based on the provided data.
 * @param {Object[]} data - An array of summary data to update the table.
 */
export function updateSummariesTable(data) {

  uploadFilesButton.disabled = false;
  downloadSummariesButton.disabled = false;

  if (data.length > 0) {
    tableContentWrapper.innerHTML = `
      <div class="table-responsive">
        <table
          id="summaries-table"
          class="table table-scrollable table-hover table-bordered rounded table-sm table-striped"
          style="font-size: 0.9rem;">
          <thead>
            <tr class="table-success">
              <!-- <th class="text-center">ID</th> -->
              <th class="text-center">Summary</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <!-- Summaries will be dynamically added here -->
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
          No Summaries
        </h1>
      </div>
    `;
    return;
  }

  const tableBodyRef = document
    .querySelector("#summaries-table")
    .getElementsByTagName("tbody")[0];

  tableBodyRef.innerHTML = '';

  const englishNameRegex = /english[\s_]*name/i;
  // Function to check if the pattern is present in any object property
  function findKeyWithEnglishName(obj) {
    for (let key in obj) {
      if (englishNameRegex.test(key)) {
          return key;
      }
    }
    return null; // Return null if the pattern is not found in any key
  }

  data.forEach((summary) => {

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

    const englishName = findKeyWithEnglishName(summary.summary_items);
    const summaryID = createElement(`summary-${summary.summary_id}`, (englishName) ? summary.summary_items[englishName] : "None", "text");
    const viewButton = createElement(`view-button-${summary.summary_id}`, null, "button");
    const deleteButton = createElement(
      `delete-button-${summary.summary_id}`,
      null,
      "button"
    );
    const viewIcon = createElement(`view-icon-${summary.summary_id}`, null, "i");
    const deleteIcon = createElement(`delete-icon-${summary.summary_id}`, null, "i");

    // Append icons to edit and delete buttons
    viewButton.appendChild(viewIcon);
    deleteButton.appendChild(deleteIcon);

    const summaryIDCell = insertCell(summaryID);
    const actionsCell = insertCell(viewButton, deleteButton);

    // Add text-center class
    [summaryIDCell, actionsCell].forEach((cell) => { 
      cell.style.textAlign = "center";
      cell.style.verticalAlign = "middle";
    });

      // Add classes to buttons
    [viewButton, deleteButton].forEach((button) => {
      button.classList.add("btn", "me-1");
      new bootstrap.Tooltip(button, {
        placement: 'top'
      });
    });

    // Add classes to icons
    [viewIcon, deleteIcon].forEach((icon) => {
      icon.style.fontSize = "0.9rem";
      icon.classList.add("fi");
    });

    // Add specific classes to buttons for styling
    viewButton.classList.add("btn", "btn-primary", "btn-sm");
    deleteButton.classList.add("btn", "btn-danger", "btn-sm");

    new bootstrap.Tooltip(viewButton, {
      title: 'View'
    });
    new bootstrap.Tooltip(deleteButton, {
      title: 'Delete'
    });

    // Add specific icons to buttons for styling
    viewIcon.classList.add("fi-sr-eye");
    deleteIcon.classList.add("fi-sr-trash");

    // Add event listeners for edit and delete actions
    viewButton.addEventListener("click", () => {
      viewSummary(summary.summary_id);
    });

    deleteButton.addEventListener("click", () => {
      const rowIndex = deleteButton.parentNode.parentNode.rowIndex - 1;
      confirmModal( async ()=>{
        viewButton.disabled = true;
        deleteButton.disabled = true;
        await deleteSummary(summary.summary_id);
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
                No Summaries
              </h1>
            </div>
          `;
        }
      });
    });
  })
}

/**
 * Async function to delete a summary based on summary_id.
 * @param {string} summary_id - The ID of the summary to be deleted.
 * @returns {Promise} A Promise that resolves to the response data or rejects with an error.
 */
export async function deleteSummary(summary_id) {
  const formData = new FormData();
  formData.append("summary_id", summary_id);
  const response = await fetch("/deleteSummary", {
    method: "POST",
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

/**
 * Function to display a modal with Bootstrap styling.
 * Removes any existing modal and creates a new one.
 */
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

/*
Adds a click event listener to the button with the specified ID,
triggering the provided function when the button is clicked.
*/
function addButtonClickEvent(id, func) {
  modalWrap.querySelector(`#${id}`).addEventListener("click", func);
}

/**
 * Function to display a confirmation modal with "Yes" and "No" buttons.
 * Calls the provided functions for "Yes" and "No" actions.
 * @param {Function} yesFunc - The function to be executed on "Yes" action.
 * @param {Function} noFunc - The function to be executed on "No" action.
 */
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

  addButtonClickEvent("no-btn", () => {
    noFunc();
    modalWrap.innerHTML = '';
  })

  addButtonClickEvent("yes-btn", () => {
    modalWrap.innerHTML = '';
    yesFunc();
  })

}

/**
 * Function to display a modal with details of a summary based on summary_id.
 * Fetches summary details from "/getSummary" API endpoint and populates the modal body.
 * @param {string} summary_id - The ID of the summary to be viewed.
 */
export function viewSummary(summary_id) {
  
  showModal();

  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  header.innerHTML = `
    <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">&#128193 View Summary</h5>
  `;

  footer.innerHTML = `
    <button id="done-btn" type="button" class="btn btn-success btn-sm" style="font-size: 0.9rem;" data-bs-dismiss="modal">Done</button>
  `;

  dialog.style = 'min-width: 82%;'
  header.classList.add("d-flex", "justify-content-between")
  body.style = "min-height: 65vh; font-size: 0.9rem;"

  showGenerateLoader();

  const formData = new FormData();
  formData.append("summary_id", summary_id);
  fetch("/getSummary", {
    method: "POST",
    body: formData
  }).then((response) => {
    if (response.ok) {
      return response.json();
    }
    return Promise.reject(response);
  }).then((data) => {

    const contentElement = document.createElement("div");
    
    const summary_items = data.summary_items;

    for (let summary_item in summary_items) {
      contentElement.innerHTML += `
        <strong>${summary_item}</strong>
        <p style="margin: 0;">${summary_items[summary_item]}</p>
        <br>
      `
    }

    body.innerHTML = contentElement.innerHTML;

  }).catch((error) => {
    console.log(error);
  });

  addButtonClickEvent("done-btn", () => {
    modalWrap.innerHTML = '';
  })

}

/*
  Creates a modal for uploading CV files, dynamically generating HTML elements.
  Ensures that only one modal is present at a time. Disables modal keyboard
  interaction and backdrop closure. Shows the modal and adds event listeners for
  file input, cancel button, and file selection change.
*/
export function uploadFilesModal() {

  showModal();

  const modal = document.querySelector(".modal");
  const dialog = document.querySelector(".modal-dialog");
  const header = document.querySelector(".modal-header");
  const body = document.querySelector(".modal-body");
  const footer = document.querySelector(".modal-footer");

  header.innerHTML = `
    <div>
      <h5 class="modal-title" style="font-weight: bold; font-size: 1.2rem;">&#128193 Upload CV Files</h5>
      <p id="modal-number-of-selected-files" style="margin: 0; font-size: 0.9rem;">Selected 0 files</p>
    </div>
    <div>
      <form>
        <input
          style="display: none; width: 16rem;"
          id="files-input"
          class="form-control"
          type="file"
          name="file"
          value=""
          accept="application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          directory
          multiple
        />          
      </form>
      <button id="files-button" class="btn btn-warning btn-sm" style="font-size: 0.9rem;">Choose files</button>
    </div>
  `;

  body.innerHTML = `
    <div class="d-flex justify-content-center align-items-center" style="min-height: 60vh;">
      <h1 
        style="
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          color: #D3D3D3;
      ">
      PDF / DOCX
      </h1>
    </div>
  `;

  footer.innerHTML = `
    <button id="cancel-btn" type="button" class="btn btn-secondary btn-sm" style="font-size: 0.9rem;" data-bs-dismiss="modal">Cancel</button>
    <button id="submit-btn" type="button" class="btn btn-success btn-sm" style="font-size: 0.9rem;" disabled="true">Summarize</button>
  `;

  dialog.style = 'min-width: 50%;'
  header.classList.add("d-flex", "justify-content-between")
  body.style = "min-height: 65vh;"

  // Set up event listeners for file input, cancel button, and file selection change
  const filesInput = document.querySelector("#files-input");
  addButtonClickEvent("files-button", () => {
    filesInput.click();
  });
  addButtonClickEvent("cancel-btn", () => {
    modalWrap.innerHTML = ``;
    cancelAllUploads();
  });
  addButtonClickEvent("submit-btn", submitToSummarize);
  filesInput.addEventListener("change", handleFileChange);
}

// Function to handle file input change event
/**
 * Function to handle the file input change event.
 * Initiates the asynchronous upload of selected files.
 * @param {Event} event - The change event object from the file input.
 */
export async function handleFileChange(event) {
  // Get selected files and relevant DOM elements
  const files = event.target.files;
  const modalNumbeofSelectedFiles = document.querySelector(
    "#modal-number-of-selected-files"
  );
  const uploadButton = document.querySelector("#files-button");
  const submitButton = document.querySelector("#submit-btn");

  // Disable the upload button
  uploadButton.disabled = true;

  // Display the number of selected files
  modalNumbeofSelectedFiles.innerHTML = `Selected ${files.length} files`;

  // Initialize and track the number of files to be uploaded
  let uploadFileCounter = files.length;

  // Iterate through selected files
  for (const file of files) {
    // Asynchronously upload each file
    await uploadFile(file);

    // Decrement the upload counter
    uploadFileCounter--;

    // Disable the submit button if there are more files to upload
    submitButton.disabled = uploadFileCounter > 0;
  }
}

// Asynchronously uploads a file with progress tracking
/**
 * Async function to upload a file with progress tracking.
 * Uses FileReader to read the file as an ArrayBuffer and uploads it in chunks.
 * @param {File} file - The file to be uploaded.
 */
async function uploadFile(file) {
  return new Promise(async (resolve) => {
    // Generate a unique ID for tracking progress
    const uniqueID = Math.floor(Math.random() * 1024);
    const fileName = file.name;

    // Use FileReader to read file as ArrayBuffer
    const fileReader = new FileReader();

    // Event handler for when FileReader finishes reading the file
    fileReader.onload = async (event) => {
      // Create and append upload progress element to modal body
      const uploadProgressElement = createUploadProgressElement(
        uniqueID,
        fileName
      );
      const modalBody = document.querySelector(".modal-body");
      modalBody.innerHTML = '';
      modalBody.append(uploadProgressElement);

      // Get progress bar and cancel button elements
      const uploadProgressBar = document.querySelector(
        `#upload-progress-bar-${uniqueID}`
      );
      const uploadCancelButton = document.querySelector(
        `#upload-progress-cancel-${uniqueID}`
      );

      // Add event listener to cancel button for aborting upload
      uploadCancelButton.addEventListener("click", async () => {
        // Abort ongoing upload requests
        if (uploadProgressFiles[uniqueID]) {
          for (const controller of Object.values(
            uploadProgressFiles[uniqueID]["abortcontrollers"]
          )) {
            controller.abort();
          }
        }

        // Delete the upload progress
        delete uploadProgressFiles[uniqueID];

        // Call the API endpoint to cancel the upload progress
        const formData = new FormData();

        const currentURL = location.href;
        const current_url = new URL(currentURL);
        const urlParams = new URLSearchParams(current_url.search);
        const jobId = urlParams.get('job_id');

        formData.append("job_id", jobId);
        formData.append("file-name", fileName);
        await fetch("/cancelUpload", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
          },
          body: formData,
        });

        // Disable cancel button and update progress bar color
        uploadCancelButton.disabled = true;
        uploadProgressBar.classList.replace("bg-primary", "bg-danger");

        // Resolve the promise (upload canceled)
        resolve(true);
      });

      let currentSize = 0;
      const totalSize = event.target.result.byteLength;

      // Define chunk size and calculate total number of chunks
      const CHUNK_SIZE = 250000;
      const chunkCount = totalSize / CHUNK_SIZE;

      // Iterate through chunks and upload each chunk
      for (let chunkId = 0; chunkId < chunkCount + 1; chunkId++) {
        const chunk = event.target.result.slice(
          chunkId * CHUNK_SIZE,
          (chunkId + 1) * CHUNK_SIZE
        );

        // Upload chunk and update progress
        await uploadChunk(uniqueID, chunkId, "/upload", fileName, chunk);
        const progressValue = Math.round((chunkId * 100) / chunkCount);
        currentSize += currentSize >= totalSize ? 0 : chunk.byteLength;

        // Update progress bar with current progress values
        updateProgress(
          uniqueID,
          progressValue,
          formatFileSize(currentSize),
          formatFileSize(totalSize)
        );
      }

      // Resolve the promise (upload completed)
      resolve(true);
    };

    // Read the file as ArrayBuffer
    fileReader.readAsArrayBuffer(file);
  });
}

/*
  Cancels ongoing file uploads, disables associated cancel buttons,
  and sends a beacon request with file information to "/cancelUpload".
  Handles errors by asynchronously sending error data during page unload.
*/
export function cancelAllUploads() {
  try {
    // Iterate over ongoing uploads
    for (let uniqueID in uploadProgressFiles) {
      const uploadProgressFile = uploadProgressFiles[uniqueID];
      const fileName = uploadProgressFile["filename"];
      const abortController = uploadProgressFile["abortcontrollers"];

      // Abort ongoing chunks
      for (let [chunkID, controller] of Object.entries(abortController)) {
        controller.abort();
      }

      // Send beacon request with file name
      const formData = new FormData();

      const currentURL = location.href;
      const current_url = new URL(currentURL);
      const urlParams = new URLSearchParams(current_url.search);
      const jobId = urlParams.get('job_id');

      formData.append("job_id", jobId);
      formData.append("file-name", fileName);
      formData.append("Authorization", "Bearer " + localStorage.getItem("jwt_access_token"))
      
      navigator.sendBeacon("/cancelUpload", formData);

      // Remove file entry
      delete uploadProgressFiles[uniqueID];
    }
  } catch (error) {
    // Handle errors by sending error data asynchronously
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    const jsonData = JSON.stringify(errorData);
    navigator.sendBeacon("/cancelUpload", jsonData);
  }
}

/*
  Creates an HTML element representing an upload progress bar. The element includes
  details such as the file name, cancel button, progress bar, and remaining size.
*/
/**
 * Function to create an HTML element representing an upload progress bar.
 * Includes details such as the file name, cancel button, progress bar, and remaining size.
 * @param {string} uniqueID - The unique identifier for the progress element.
 * @param {string} fileName - The name of the file being uploaded.
 * @param {string} currentSize - The current size of the uploaded data.
 * @param {string} totalSize - The total size of the file being uploaded.
 * @returns {HTMLElement} The HTML element representing the upload progress.
 */
export function createUploadProgressElement(
  uniqueID,
  fileName,
  currentSize = formatFileSize(0),
  totalSize = formatFileSize(0)
) {
  const uploadProgressElement = document.createElement("div");
  uploadProgressElement.innerHTML = `
    <div id="upload-progress-container" class="my-2 mx-lg-4 mx-md-4 p-4 border rounded-3 shadow-sm">
      <div class="d-flex justify-content-between mb-2">
          <p class="d-flex align-items-center" style="margin: 0; font-size: 0.9rem;"><i class="fi fi-sr-document me-2"></i>${fileName}</p>
        <button id="upload-progress-cancel-${uniqueID}" class="btn btn-danger btn-sm" style="font-size: 0.9rem;">Cancel</button>
      </div>
      <div id="upload-progress-bar-wrapper-${uniqueID}" class="progress" role="progressbar" aria-label="Warning striped example" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
        <div id="upload-progress-bar-${uniqueID}" class="progress-bar progress-bar-striped progress-bar-animated bg-primary" style="width: 0%">0%</div>
      </div>
      <div class="d-flex justify-content-start">
        <p id="upload-size-remaining-${uniqueID}" style="margin: 0; font-size: 0.9rem; color: gray;" style="font-size: 0.6rem;">${currentSize} / ${totalSize}</p>
      </div>
    </div>
  `;
  return uploadProgressElement;
}

/*
  Uploads a chunk of a file to a specified URL using FormData. The chunk is appended
  to the form data along with additional information such as the file name and chunk length.
*/
/**
 * Async function to upload a chunk of a file to a specified URL.
 * Uses FormData to append the chunk and additional information such as file name and chunk length.
 * @param {string} uniqueID - The unique identifier for the progress element.
 * @param {number} chunkID - The ID of the current chunk being uploaded.
 * @param {string} url - The URL to which the chunk should be uploaded.
 * @param {string} fileName - The name of the file being uploaded.
 * @param {Blob} chunk - The chunk of the file to be uploaded.
 */
async function uploadChunk(uniqueID, chunkID, url, fileName, chunk) {
  if (!uploadProgressFiles[uniqueID]) {
    uploadProgressFiles[uniqueID] = {
      filename: fileName,
      abortcontrollers: {},
    };
  }
  uploadProgressFiles[uniqueID]["abortcontrollers"][chunkID] =
    new AbortController();

  const data = new FormData();

  const currentURL = location.href;
  const current_url = new URL(currentURL);
  const urlParams = new URLSearchParams(current_url.search);
  const jobId = urlParams.get('job_id');

  data.append("job_id", jobId)
  data.append("file-name", fileName);
  data.append("chunk-length", chunk.length);
  data.append("chunk", new Blob([chunk], { type: "application/octet-stream" }));

  await fetch(url, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${localStorage.getItem("jwt_access_token")}`,
    },
    body: data,
    signal: uploadProgressFiles[uniqueID]["abortcontrollers"][chunkID].signal,
  });
}

/*
  Updates the progress of an upload by adjusting the progress bar and displaying
  the remaining size. Takes parameters such as uniqueID, progressValue, currentSize,
  and totalSize to update the visual representation.
*/
/**
 * Function to update the progress of an upload.
 * Adjusts the progress bar width and updates the remaining size.
 * @param {string} uniqueID - The unique identifier for the progress element.
 * @param {number} progress - The current progress value.
 */
export function updateProgress(
  uniqueID,
  progressValue,
  currentSize = formatFileSize(0),
  totalSize = formatFileSize(0)
) {
  const progress = Math.min(progressValue, 100);
  const uploadProgressBar = document.querySelector(
    `#upload-progress-bar-${uniqueID}`
  );
  const uploadProgressWrapper = document.querySelector(
    `#upload-progress-bar-wrapper-${uniqueID}`
  );
  const sizeRemaining = document.querySelector(
    `#upload-size-remaining-${uniqueID}`
  );
  const cancelButton = document.querySelector(
    `#upload-progress-cancel-${uniqueID}`
  );

  uploadProgressWrapper.ariaValueNow = `${progress}`;
  uploadProgressBar.innerHTML = `${progress}%`;
  uploadProgressBar.style.width = `${progress}%`;
  sizeRemaining.innerHTML = `${currentSize} / ${totalSize}`;

  if (progress === 100) {
    uploadProgressBar.classList.replace("bg-primary", "bg-success");
    cancelButton.disabled = true;
  }
}

/*
  Formats a file size in bytes into a human-readable string with appropriate units
  such as B, KB, MB, or GB.
*/
export function formatFileSize(sizeInBytes) {
  const units = ["B", "KB", "MB", "GB"];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const formattedSize = size.toFixed(2);
  const unit = units[unitIndex];

  return `${formattedSize} ${unit}`;
}

export function submitToSummarize() {

  const submitButton = document.querySelector("#submit-btn");
  const cancelButton = document.querySelector("#cancel-btn");

  submitButton.disabled = true;
  cancelButton.disabled = true;

  showGenerateLoader();

  const formData = new FormData();

  const currentURL = location.href;

  // Create a URL object
  const url = new URL(currentURL);

  // Create a URLSearchParams object using the search string
  const urlParams = new URLSearchParams(url.search);

  // Get the value of job_id
  const jobId = urlParams.get('job_id');

  formData.append("job_id", jobId);

  fetch("/submitToSummarize", {
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
    .then((data) => {

      const intervalID = setInterval( async () => {
        const formData = new FormData();
        formData.append("task_id", data.task_id);
        await fetch("/submitToSummarizeTask", {
          method: "POST",
          body: formData
        }).then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject(response);
        }).then((data) => {
          if (data.status == "SUCCESS") {
            clearInterval(intervalID);
            showSuccess();
            setTimeout(async () => {

              const currentURL = location.href;

              // Create a URL object
              const url = new URL(currentURL);

              // Create a URLSearchParams object using the search string
              const urlParams = new URLSearchParams(url.search);

              // Get the value of job_id
              const jobId = urlParams.get('job_id');

              const summaries = await getSummaries(jobId);
              updateSummariesTable(summaries);
              closeModal();
              modalWrap.innerHTML = ``;
            }, 4000);
          }
        });
      }, 5000);

    })
    .catch((error) => {
      console.log(error);
    });
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

export function closeModal() {
  const modalWrapper = document.querySelector(".modal");
  const modal = bootstrap.Modal.getInstance(modalWrapper);
  modal.hide();
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
