/* =========================================================
   CTR MANAGEMENT SYSTEM
   DIVISION -> STATION MANAGEMENT
   ROLE-AWARE SUPABASE VERSION

   ROLE RULES:
   ---------------------------------------------------------
   View / Open Station CTR:
   - Authorized users according to database access

   Add / Edit / Deactivate Station:
   - SYSTEM_ADMIN only

   IMPORTANT:
   Real security remains in Supabase RLS.
========================================================= */


/* =========================================================
   URL / DIVISION CONTEXT
========================================================= */

const urlParameters =
  new URLSearchParams(
    window.location.search
  );


const selectedDivisionId =
  urlParameters.get(
    "division"
  );


/*
  stations.html should always open from a Division.

  Example:
  stations.html?division=<division-uuid>
*/

if (!selectedDivisionId) {

  window.location.replace(
    "divisions.html"
  );

}


/* =========================================================
   DOM REFERENCES
========================================================= */

const showAddStationButton =
  document.getElementById(
    "showAddStation"
  );


const addStationPanel =
  document.getElementById(
    "addStationPanel"
  );


const closeAddStationButton =
  document.getElementById(
    "closeAddStation"
  );


const cancelAddStationButton =
  document.getElementById(
    "cancelAddStation"
  );


const saveNewStationButton =
  document.getElementById(
    "saveNewStation"
  );


const stationFormTitle =
  document.getElementById(
    "stationFormTitle"
  );


const stationFormEyebrow =
  document.getElementById(
    "stationFormEyebrow"
  );


const stationNameInput =
  document.getElementById(
    "stationName"
  );


const stationCodeInput =
  document.getElementById(
    "stationCode"
  );


const stationSectionInput =
  document.getElementById(
    "stationSection"
  );


const stationDivisionInput =
  document.getElementById(
    "stationDivision"
  );


const stationSearchInput =
  document.getElementById(
    "stationSearch"
  );


const stationCount =
  document.getElementById(
    "stationCount"
  );


const stationList =
  document.getElementById(
    "stationList"
  );


const stationsEmptyState =
  document.getElementById(
    "stationsEmptyState"
  );


const divisionPageTitle =
  document.getElementById(
    "divisionPageTitle"
  );


const selectedDivisionHeading =
  document.getElementById(
    "selectedDivisionHeading"
  );


const selectedDivisionDescription =
  document.getElementById(
    "selectedDivisionDescription"
  );


const divisionContextName =
  document.getElementById(
    "divisionContextName"
  );


const divisionContextCode =
  document.getElementById(
    "divisionContextCode"
  );


const divisionZone =
  document.getElementById(
    "divisionZone"
  );


/* =========================================================
   APPLICATION STATE
========================================================= */

let stations = [];


let selectedDivision = null;


let editingStationId = null;


/* =========================================================
   INITIAL UI SAFETY

   Keep management controls hidden until role-access.js
   finishes loading the current user's role.
========================================================= */

if (showAddStationButton) {

  showAddStationButton.hidden =
    true;

}


if (addStationPanel) {

  addStationPanel.hidden =
    true;

}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   CTR STATUS LABEL
========================================================= */

function getStatusLabel(status) {

  const labels = {

    INITIAL_SETUP:
      "Initial Setup",

    DRAFT:
      "Draft",

    BASELINE_APPROVED:
      "Baseline Approved",

    UNDER_ALTERATION:
      "Under Alteration",

    UNDER_APPROVAL:
      "Under Approval",

    APPROVED:
      "Approved"

  };


  return (
    labels[status] ||
    status ||
    "Unknown"
  );

}


/* =========================================================
   SYSTEM ADMIN CHECK
========================================================= */

function canManageStations() {

  if (
    !window.ctrAccess ||
    !window.ctrAccess.ready
  ) {

    return false;

  }


  return (
    window.ctrAccess.isSystemAdmin()
  );

}


/* =========================================================
   REQUIRE SYSTEM ADMIN
========================================================= */

function requireStationAdmin() {

  if (
    canManageStations()
  ) {

    return true;

  }


  alert(
    "System Administrator permission is required for this action."
  );


  return false;

}


/* =========================================================
   APPLY STATION ROLE VISIBILITY
========================================================= */

function applyStationRoleVisibility() {

  /*
    Wait until role-access.js has finished.
  */

  if (
    !window.ctrAccess ||
    !window.ctrAccess.ready
  ) {

    return;

  }


  const isAdmin =
    canManageStations();


  /* -------------------------------------------------------
     ADD STATION BUTTON
  ------------------------------------------------------- */

  if (
    showAddStationButton
  ) {

    showAddStationButton.hidden =
      !isAdmin;

  }


  /* -------------------------------------------------------
     FORM PANEL

     Non-admin must never see station management form.
  ------------------------------------------------------- */

  if (
    addStationPanel
  ) {

    if (
      !isAdmin
    ) {

      addStationPanel.classList.remove(
        "open"
      );


      addStationPanel.hidden =
        true;

    }

    else {

      /*
        Panel remains visually closed until Add/Edit
        is clicked, but it is allowed to exist.
      */

      if (
        !addStationPanel.classList.contains(
          "open"
        )
      ) {

        addStationPanel.hidden =
          true;

      }

    }

  }


  /*
    Cards contain dynamically generated admin buttons.
    Re-render when role becomes available.
  */

  renderStations();

}


/* =========================================================
   LOAD SELECTED DIVISION
========================================================= */

async function loadSelectedDivision() {

  if (
    !selectedDivisionId
  ) {

    return false;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "divisions"
        )
        .select(
          `
            id,
            division_name,
            division_code,
            zone_name,
            display_order,
            is_active
          `
        )
        .eq(
          "id",
          selectedDivisionId
        )
        .eq(
          "is_active",
          true
        )
        .maybeSingle();


    if (
      error
    ) {

      throw error;

    }


    if (
      !data
    ) {

      alert(
        "Division not found or is no longer active."
      );


      window.location.replace(
        "divisions.html"
      );


      return false;

    }


    selectedDivision =
      data;


    updateDivisionDisplay();


    return true;

  }

  catch (error) {

    console.error(
      "Load division error:",
      error
    );


    alert(
      error.message ||
      "Unable to load division."
    );


    window.location.replace(
      "divisions.html"
    );


    return false;

  }

}


/* =========================================================
   UPDATE DIVISION PAGE DISPLAY
========================================================= */

function updateDivisionDisplay() {

  if (
    !selectedDivision
  ) {

    return;

  }


  const divisionName =
    selectedDivision.division_name ||
    "Division";


  const divisionCode =
    selectedDivision.division_code ||
    "-";


  const zoneName =
    selectedDivision.zone_name ||
    "-";


  document.title =
    `${divisionName} Stations | CTR Management`;


  if (
    divisionPageTitle
  ) {

    divisionPageTitle.textContent =
      `${divisionName} Stations`;

  }


  if (
    selectedDivisionHeading
  ) {

    selectedDivisionHeading.textContent =
      divisionName;

  }


  if (
    selectedDivisionDescription
  ) {

    selectedDivisionDescription.textContent =
      canManageStations()
        ? `View and manage CTR stations under ${divisionName}.`
        : `View accessible CTR stations under ${divisionName}.`;

  }


  if (
    divisionContextName
  ) {

    divisionContextName.textContent =
      divisionName;

  }


  if (
    divisionContextCode
  ) {

    divisionContextCode.textContent =
      `Code: ${divisionCode}`;

  }


  if (
    divisionZone
  ) {

    divisionZone.textContent =
      zoneName;

  }


  if (
    stationDivisionInput
  ) {

    stationDivisionInput.value =
      divisionName;

  }

}


/* =========================================================
   RESET STATION FORM
========================================================= */

function resetStationForm() {

  editingStationId =
    null;


  if (
    stationNameInput
  ) {

    stationNameInput.value =
      "";

  }


  if (
    stationCodeInput
  ) {

    stationCodeInput.value =
      "";

  }


  if (
    stationSectionInput
  ) {

    stationSectionInput.value =
      "";

  }


  if (
    selectedDivision &&
    stationDivisionInput
  ) {

    stationDivisionInput.value =
      selectedDivision.division_name ||
      "";

  }


  if (
    stationFormEyebrow
  ) {

    stationFormEyebrow.textContent =
      "NEW STATION";

  }


  if (
    stationFormTitle
  ) {

    stationFormTitle.textContent =
      "Add Station";

  }


  if (
    saveNewStationButton
  ) {

    saveNewStationButton.textContent =
      "Save Station";

  }

}


/* =========================================================
   OPEN STATION FORM
========================================================= */

function openStationForm() {

  /*
    Only SYSTEM_ADMIN may open this form.
  */

  if (
    !requireStationAdmin()
  ) {

    return;

  }


  if (
    !selectedDivision
  ) {

    alert(
      "Division information is not available."
    );


    return;

  }


  if (
    addStationPanel
  ) {

    addStationPanel.hidden =
      false;


    addStationPanel.classList.add(
      "open"
    );

  }


  stationNameInput
    ?.focus();

}


/* =========================================================
   CLOSE STATION FORM
========================================================= */

function closeStationForm() {

  if (
    addStationPanel
  ) {

    addStationPanel.classList.remove(
      "open"
    );


    addStationPanel.hidden =
      true;

  }


  resetStationForm();

}


/* =========================================================
   LOAD STATIONS FOR SELECTED DIVISION
========================================================= */

async function loadStations() {

  if (
    !selectedDivisionId
  ) {

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "stations"
        )
        .select(
          `
            id,
            station_name,
            station_code,
            sectional_incharge_designation,
            division_id,
            division,
            ctr_status,
            current_version,
            is_active,
            created_at,
            updated_at
          `
        )
        .eq(
          "division_id",
          selectedDivisionId
        )
        .eq(
          "is_active",
          true
        )
        .order(
          "station_name",
          {
            ascending:
              true
          }
        );


    if (
      error
    ) {

      throw error;

    }


    /*
      RLS decides which stations the current
      authenticated user may actually receive.
    */

    stations =
      data || [];


    renderStations();

  }

  catch (error) {

    console.error(
      "Load stations error:",
      error
    );


    if (
      stationList
    ) {

      stationList.innerHTML = `

        <div class="stations-empty-state show">

          <strong>
            Unable to load stations
          </strong>

          <p>
            ${escapeHtml(
              error.message ||
              "Database error."
            )}
          </p>

        </div>

      `;

    }

  }

}


/* =========================================================
   SAVE / UPDATE STATION
========================================================= */

async function saveStation() {

  /*
    Frontend protection.
    Database RLS remains the real security boundary.
  */

  if (
    !requireStationAdmin()
  ) {

    return;

  }


  if (
    !selectedDivision
  ) {

    alert(
      "Division is not loaded."
    );


    return;

  }


  const stationName =
    stationNameInput
      .value
      .trim();


  const stationCode =
    stationCodeInput
      .value
      .trim()
      .toUpperCase();


  const sectionalIncharge =
    stationSectionInput
      .value
      .trim();


  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */

  if (
    !stationName
  ) {

    alert(
      "Please enter Station Name."
    );


    stationNameInput.focus();


    return;

  }


  if (
    !stationCode
  ) {

    alert(
      "Please enter Station Code."
    );


    stationCodeInput.focus();


    return;

  }


  const isEditing =
    Boolean(
      editingStationId
    );


  saveNewStationButton.disabled =
    true;


  saveNewStationButton.textContent =
    isEditing
      ? "Updating..."
      : "Saving...";


  try {

    /*
      division_id is the official relationship.

      The legacy division text is maintained
      temporarily for compatibility with older
      frontend code.
    */

    const stationData = {

      station_name:
        stationName,

      station_code:
        stationCode,

      sectional_incharge_designation:
        sectionalIncharge,

      division_id:
        selectedDivision.id,

      division:
        selectedDivision.division_name

    };


    /* =====================================================
       UPDATE EXISTING STATION
    ===================================================== */

    if (
      isEditing
    ) {

      const {
        error
      } =
        await supabaseClient
          .from(
            "stations"
          )
          .update(
            stationData
          )
          .eq(
            "id",
            editingStationId
          )
          .eq(
            "division_id",
            selectedDivision.id
          );


      if (
        error
      ) {

        throw error;

      }

    }


    /* =====================================================
       CREATE NEW STATION
    ===================================================== */

    else {

      const {
        error
      } =
        await supabaseClient
          .from(
            "stations"
          )
          .insert({

            ...stationData,

            ctr_status:
              "INITIAL_SETUP",

            current_version:
              0,

            is_active:
              true

          });


      if (
        error
      ) {

        throw error;

      }

    }


    closeStationForm();


    await loadStations();

  }

  catch (error) {

    console.error(
      "Save station error:",
      error
    );


    if (
      error.code ===
      "23505"
    ) {

      alert(
        "A station with this name or station code already exists."
      );

    }

    else {

      alert(
        error.message ||
        "Station could not be saved."
      );

    }

  }

  finally {

    saveNewStationButton.disabled =
      false;


    saveNewStationButton.textContent =
      "Save Station";

  }

}


/* =========================================================
   EDIT STATION
========================================================= */

function editStation(
  stationId
) {

  /*
    SYSTEM_ADMIN only.
  */

  if (
    !requireStationAdmin()
  ) {

    return;

  }


  const station =
    stations.find(
      function (item) {

        return (
          item.id ===
          stationId
        );

      }
    );


  if (
    !station
  ) {

    return;

  }


  editingStationId =
    station.id;


  stationNameInput.value =
    station.station_name ||
    "";


  stationCodeInput.value =
    station.station_code ||
    "";


  stationSectionInput.value =
    station.sectional_incharge_designation ||
    "";


  if (
    stationDivisionInput
  ) {

    stationDivisionInput.value =
      selectedDivision
        ? selectedDivision.division_name
        : "";

  }


  if (
    stationFormEyebrow
  ) {

    stationFormEyebrow.textContent =
      "EDIT STATION";

  }


  if (
    stationFormTitle
  ) {

    stationFormTitle.textContent =
      "Edit Station";

  }


  saveNewStationButton.textContent =
    "Update Station";


  openStationForm();

}


/* =========================================================
   DEACTIVATE STATION
========================================================= */

async function removeStation(
  stationId
) {

  /*
    SYSTEM_ADMIN only.
  */

  if (
    !requireStationAdmin()
  ) {

    return;

  }


  const station =
    stations.find(
      function (item) {

        return (
          item.id ===
          stationId
        );

      }
    );


  if (
    !station
  ) {

    return;

  }


  const confirmed =
    confirm(
      `Deactivate ${station.station_name}? The station record and CTR history will remain preserved.`
    );


  if (
    !confirmed
  ) {

    return;

  }


  try {

    /*
      Station is not permanently deleted.

      This preserves:
      - CTR drafts
      - CTR versions
      - alterations
      - approvals
      - audit/history records
    */

    const {
      error
    } =
      await supabaseClient
        .from(
          "stations"
        )
        .update({

          is_active:
            false,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          stationId
        )
        .eq(
          "division_id",
          selectedDivisionId
        );


    if (
      error
    ) {

      throw error;

    }


    await loadStations();

  }

  catch (error) {

    console.error(
      "Deactivate station error:",
      error
    );


    alert(
      error.message ||
      "Station could not be deactivated."
    );

  }

}


/* =========================================================
   RENDER STATIONS
========================================================= */

function renderStations() {

  if (
    !stationList ||
    !stationSearchInput ||
    !stationCount
  ) {

    return;

  }


  const searchTerm =
    stationSearchInput
      .value
      .trim()
      .toLowerCase();


  const filteredStations =
    stations.filter(
      function (station) {

        const searchableText =
          [

            station.station_name,

            station.station_code,

            station.sectional_incharge_designation,

            selectedDivision
              ? selectedDivision.division_name
              : ""

          ]
            .join(" ")
            .toLowerCase();


        return searchableText.includes(
          searchTerm
        );

      }
    );


  stationCount.textContent =
    `${filteredStations.length} ${
      filteredStations.length === 1
        ? "Station"
        : "Stations"
    }`;


  stationList.innerHTML =
    "";


  /* -------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------- */

  if (
    filteredStations.length ===
    0
  ) {

    stationsEmptyState
      ?.classList
      .add(
        "show"
      );


    return;

  }


  stationsEmptyState
    ?.classList
    .remove(
      "show"
    );


  /*
    Management buttons appear only after
    role-access.js confirms SYSTEM_ADMIN.
  */

  const showManagementButtons =
    canManageStations();


  /* -------------------------------------------------------
     BUILD STATION CARDS
  ------------------------------------------------------- */

  filteredStations.forEach(
    function (station) {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "station-management-card";


      const managementButtons =
        showManagementButtons
          ? `

            <button
              type="button"
              class="secondary-action"
              data-action="edit"
              data-id="${escapeHtml(
                station.id
              )}"
            >
              Edit Station
            </button>


            <button
              type="button"
              class="remove-rack-btn"
              data-action="remove"
              data-id="${escapeHtml(
                station.id
              )}"
            >
              Deactivate Station
            </button>

          `
          : "";


      card.innerHTML = `

        <div class="station-card-top">

          <div>

            <span>
              ${escapeHtml(
                station.station_code ||
                "NO CODE"
              )}
            </span>

            <h3>
              ${escapeHtml(
                station.station_name
              )}
            </h3>

          </div>


          <span class="station-status-badge">

            ${escapeHtml(
              getStatusLabel(
                station.ctr_status
              )
            )}

          </span>

        </div>


        <div class="station-card-details">

          <div>

            <span>
              Station Code
            </span>

            <strong>
              ${escapeHtml(
                station.station_code ||
                "-"
              )}
            </strong>

          </div>


          <div>

            <span>
              Division
            </span>

            <strong>
              ${escapeHtml(
                selectedDivision
                  ? selectedDivision.division_name
                  : "-"
              )}
            </strong>

          </div>


          <div>

            <span>
              Sectional Incharge Designation
            </span>

            <strong>
              ${escapeHtml(
                station.sectional_incharge_designation ||
                "-"
              )}
            </strong>

          </div>


          <div>

            <span>
              CTR Version
            </span>

            <strong>
              V${Number(
                station.current_version ||
                0
              )}
            </strong>

          </div>

        </div>


        <div class="station-card-actions">

          <!-- =============================================
               AVAILABLE TO AUTHORIZED USERS
          ============================================== -->

          <a
            class="primary-action station-open-button"
            href="station.html?id=${encodeURIComponent(
              station.id
            )}"
          >
            Open Station CTR
          </a>


          <!-- =============================================
               SYSTEM ADMIN ONLY
          ============================================== -->

          ${managementButtons}

        </div>

      `;


      stationList.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   STATION CARD ACTIONS
========================================================= */

stationList
  ?.addEventListener(
    "click",
    function (event) {

      const button =
        event.target.closest(
          "[data-action]"
        );


      if (
        !button
      ) {

        return;

      }


      /*
        Additional frontend protection.
      */

      if (
        !requireStationAdmin()
      ) {

        return;

      }


      const stationId =
        button.dataset.id;


      const action =
        button.dataset.action;


      if (
        action ===
        "edit"
      ) {

        editStation(
          stationId
        );


        return;

      }


      if (
        action ===
        "remove"
      ) {

        removeStation(
          stationId
        );

      }

    }
  );


/* =========================================================
   EVENTS
========================================================= */

showAddStationButton
  ?.addEventListener(
    "click",
    function () {

      if (
        !requireStationAdmin()
      ) {

        return;

      }


      resetStationForm();


      openStationForm();

    }
  );


closeAddStationButton
  ?.addEventListener(
    "click",
    closeStationForm
  );


cancelAddStationButton
  ?.addEventListener(
    "click",
    closeStationForm
  );


saveNewStationButton
  ?.addEventListener(
    "click",
    saveStation
  );


stationSearchInput
  ?.addEventListener(
    "input",
    renderStations
  );


/* =========================================================
   ROLE ACCESS READY

   role-access.js loads asynchronously.
   When it finishes, update management controls.
========================================================= */

window.addEventListener(
  "ctr-access-ready",
  function () {

    applyStationRoleVisibility();


    /*
      Also refresh description because it says
      "manage" only for SYSTEM_ADMIN.
    */

    updateDivisionDisplay();

  }
);


/* =========================================================
   INITIAL START
========================================================= */

async function initializeStationManagement() {

  /*
    First establish which Division is open.
  */

  const divisionLoaded =
    await loadSelectedDivision();


  if (
    !divisionLoaded
  ) {

    return;

  }


  /*
    Then load stations belonging to that Division.

    Supabase RLS decides which of them are
    accessible to the current user.
  */

  await loadStations();


  /*
    If role access already finished before this
    page script completed, apply it immediately.
  */

  if (
    window.ctrAccess?.ready
  ) {

    applyStationRoleVisibility();


    updateDivisionDisplay();

  }

}


initializeStationManagement();