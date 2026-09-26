/* =========================================================
   CTR MANAGEMENT SYSTEM
   DIVISION MANAGEMENT

   ROLE RULES:
   ---------------------------------------------------------
   View / Open Stations:
   - Authorized users

   Add / Edit / Deactivate Division:
   - SYSTEM_ADMIN only

   IMPORTANT:
   Real security is enforced by Supabase RLS.
========================================================= */


/* =========================================================
   DOM
========================================================= */

const showAddDivisionButton =
  document.getElementById(
    "showAddDivision"
  );

const addDivisionPanel =
  document.getElementById(
    "addDivisionPanel"
  );

const closeAddDivisionButton =
  document.getElementById(
    "closeAddDivision"
  );

const cancelAddDivisionButton =
  document.getElementById(
    "cancelAddDivision"
  );

const saveDivisionButton =
  document.getElementById(
    "saveDivision"
  );

const divisionFormTitle =
  document.getElementById(
    "divisionFormTitle"
  );


const divisionNameInput =
  document.getElementById(
    "divisionName"
  );

const divisionCodeInput =
  document.getElementById(
    "divisionCode"
  );

const zoneNameInput =
  document.getElementById(
    "zoneName"
  );

const displayOrderInput =
  document.getElementById(
    "displayOrder"
  );


const divisionSearchInput =
  document.getElementById(
    "divisionSearch"
  );

const divisionCount =
  document.getElementById(
    "divisionCount"
  );

const divisionList =
  document.getElementById(
    "divisionList"
  );

const divisionsEmptyState =
  document.getElementById(
    "divisionsEmptyState"
  );


/* =========================================================
   STATE
========================================================= */

let divisions = [];

let stationDivisionCounts = {};

let editingDivisionId = null;


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   SYSTEM ADMIN CHECK
========================================================= */

function canManageDivisions() {

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
   ADMIN REQUIRED
========================================================= */

function requireDivisionAdmin() {

  if (
    canManageDivisions()
  ) {

    return true;

  }


  alert(
    "System Administrator permission is required for this action."
  );


  return false;

}


/* =========================================================
   APPLY ROLE VISIBILITY
========================================================= */

function refreshDivisionRoleVisibility() {

  if (
    window.ctrAccess?.ready &&
    typeof applyCtrRoleVisibility ===
      "function"
  ) {

    applyCtrRoleVisibility();

  }

}


/* =========================================================
   FORM
========================================================= */

function resetDivisionForm() {

  editingDivisionId =
    null;


  divisionNameInput.value =
    "";


  divisionCodeInput.value =
    "";


  zoneNameInput.value =
    "";


  displayOrderInput.value =
    "0";


  divisionFormTitle.textContent =
    "Add Division";


  saveDivisionButton.textContent =
    "Save Division";

}


/* =========================================================
   OPEN DIVISION FORM
========================================================= */

function openDivisionForm() {

  /*
    Division form is SYSTEM_ADMIN only.
  */

  if (
    !requireDivisionAdmin()
  ) {

    return;

  }


  addDivisionPanel.hidden =
    false;


  addDivisionPanel.classList.add(
    "open"
  );


  divisionNameInput.focus();

}


/* =========================================================
   CLOSE DIVISION FORM
========================================================= */

function closeDivisionForm() {

  addDivisionPanel.classList.remove(
    "open"
  );


  resetDivisionForm();


  /*
    Restore role visibility after closing.
  */

  refreshDivisionRoleVisibility();

}


/* =========================================================
   LOAD DIVISIONS
========================================================= */

async function loadDivisions() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "divisions"
        )
        .select(`
          id,
          division_name,
          division_code,
          zone_name,
          display_order,
          is_active,
          created_at,
          updated_at
        `)
        .eq(
          "is_active",
          true
        )
        .order(
          "display_order",
          {
            ascending: true
          }
        )
        .order(
          "division_name",
          {
            ascending: true
          }
        );


    if (error) {

      throw error;

    }


    divisions =
      data || [];


    await loadStationCounts();


    renderDivisions();

  }

  catch (error) {

    console.error(
      "Load divisions error:",
      error
    );


    divisionList.innerHTML = `

      <div class="stations-empty-state show">

        <strong>
          Unable to load divisions
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


/* =========================================================
   LOAD STATION COUNTS
========================================================= */

async function loadStationCounts() {

  stationDivisionCounts =
    {};


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "stations"
      )
      .select(`
        id,
        division_id
      `)
      .eq(
        "is_active",
        true
      );


  if (error) {

    console.error(
      "Station count load error:",
      error
    );


    return;

  }


  (data || []).forEach(
    function (station) {

      if (
        !station.division_id
      ) {

        return;

      }


      stationDivisionCounts[
        station.division_id
      ] =
        (
          stationDivisionCounts[
            station.division_id
          ] || 0
        ) + 1;

    }
  );

}


/* =========================================================
   SAVE DIVISION
========================================================= */

async function saveDivision() {

  /*
    Frontend protection.

    Supabase RLS must still be considered
    the real security boundary.
  */

  if (
    !requireDivisionAdmin()
  ) {

    return;

  }


  const divisionName =
    divisionNameInput
      .value
      .trim();


  const divisionCode =
    divisionCodeInput
      .value
      .trim()
      .toUpperCase();


  const zoneName =
    zoneNameInput
      .value
      .trim();


  const displayOrder =
    Number(
      displayOrderInput.value
    ) || 0;


  /* -------------------------------------------------------
     VALIDATION
  ------------------------------------------------------- */

  if (
    !divisionName
  ) {

    alert(
      "Please enter Division Name."
    );


    divisionNameInput.focus();


    return;

  }


  if (
    !divisionCode
  ) {

    alert(
      "Please enter Division Code."
    );


    divisionCodeInput.focus();


    return;

  }


  saveDivisionButton.disabled =
    true;


  saveDivisionButton.textContent =
    "Saving...";


  try {

    let error;


    /* =====================================================
       UPDATE EXISTING DIVISION
    ===================================================== */

    if (
      editingDivisionId
    ) {

      const result =
        await supabaseClient
          .from(
            "divisions"
          )
          .update({

            division_name:
              divisionName,

            division_code:
              divisionCode,

            zone_name:
              zoneName,

            display_order:
              displayOrder,

            updated_at:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            editingDivisionId
          );


      error =
        result.error;

    }


    /* =====================================================
       CREATE NEW DIVISION
    ===================================================== */

    else {

      const result =
        await supabaseClient
          .from(
            "divisions"
          )
          .insert({

            division_name:
              divisionName,

            division_code:
              divisionCode,

            zone_name:
              zoneName,

            display_order:
              displayOrder,

            is_active:
              true

          });


      error =
        result.error;

    }


    if (
      error
    ) {

      throw error;

    }


    closeDivisionForm();


    await loadDivisions();

  }

  catch (error) {

    console.error(
      "Save division error:",
      error
    );


    if (
      error.code ===
      "23505"
    ) {

      alert(
        "A division with this name or code already exists."
      );

    }

    else {

      alert(
        error.message ||
        "Division could not be saved."
      );

    }

  }

  finally {

    saveDivisionButton.disabled =
      false;


    if (
      !editingDivisionId
    ) {

      saveDivisionButton.textContent =
        "Save Division";

    }

  }

}


/* =========================================================
   EDIT DIVISION
========================================================= */

function editDivision(
  divisionId
) {

  /*
    SYSTEM_ADMIN only.
  */

  if (
    !requireDivisionAdmin()
  ) {

    return;

  }


  const division =
    divisions.find(
      function (item) {

        return (
          item.id ===
          divisionId
        );

      }
    );


  if (
    !division
  ) {

    return;

  }


  editingDivisionId =
    division.id;


  divisionNameInput.value =
    division.division_name ||
    "";


  divisionCodeInput.value =
    division.division_code ||
    "";


  zoneNameInput.value =
    division.zone_name ||
    "";


  displayOrderInput.value =
    division.display_order ??
    0;


  divisionFormTitle.textContent =
    "Edit Division";


  saveDivisionButton.textContent =
    "Update Division";


  openDivisionForm();

}


/* =========================================================
   DEACTIVATE DIVISION
========================================================= */

async function deactivateDivision(
  divisionId
) {

  /*
    SYSTEM_ADMIN only.
  */

  if (
    !requireDivisionAdmin()
  ) {

    return;

  }


  const division =
    divisions.find(
      function (item) {

        return (
          item.id ===
          divisionId
        );

      }
    );


  if (
    !division
  ) {

    return;

  }


  const stationTotal =
    stationDivisionCounts[
      division.id
    ] || 0;


  /* -------------------------------------------------------
     BLOCK IF ACTIVE STATIONS EXIST
  ------------------------------------------------------- */

  if (
    stationTotal > 0
  ) {

    alert(
      "This division currently contains active stations. Move or deactivate those stations before deactivating the division."
    );


    return;

  }


  const confirmed =
    confirm(
      `Deactivate ${division.division_name}?`
    );


  if (
    !confirmed
  ) {

    return;

  }


  try {

    const {
      error
    } =
      await supabaseClient
        .from(
          "divisions"
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
          divisionId
        );


    if (
      error
    ) {

      throw error;

    }


    await loadDivisions();

  }

  catch (error) {

    console.error(
      "Deactivate division error:",
      error
    );


    alert(
      error.message ||
      "Division could not be deactivated."
    );

  }

}


/* =========================================================
   RENDER DIVISIONS
========================================================= */

function renderDivisions() {

  const searchValue =
    divisionSearchInput
      .value
      .trim()
      .toLowerCase();


  const filtered =
    divisions.filter(
      function (division) {

        const searchable =
          `
            ${division.division_name || ""}
            ${division.division_code || ""}
            ${division.zone_name || ""}
          `
            .toLowerCase();


        return searchable.includes(
          searchValue
        );

      }
    );


  divisionList.innerHTML =
    "";


  divisionCount.textContent =
    `${filtered.length} ${
      filtered.length === 1
        ? "Division"
        : "Divisions"
    }`;


  /* -------------------------------------------------------
     EMPTY STATE
  ------------------------------------------------------- */

  if (
    filtered.length ===
    0
  ) {

    divisionsEmptyState
      .classList
      .add(
        "show"
      );


    return;

  }


  divisionsEmptyState
    .classList
    .remove(
      "show"
    );


  /* -------------------------------------------------------
     BUILD CARDS
  ------------------------------------------------------- */

  filtered.forEach(
    function (division) {

      const stationTotal =
        stationDivisionCounts[
          division.id
        ] || 0;


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "station-management-card";


      card.innerHTML = `

        <div class="station-card-top">

          <div>

            <span>
              DIVISION
            </span>

            <h3>
              ${escapeHtml(
                division.division_name
              )}
            </h3>

          </div>


          <span class="station-status-badge">
            ACTIVE
          </span>

        </div>


        <div class="station-card-details">

          <div>

            <span>
              Division Code
            </span>

            <strong>
              ${escapeHtml(
                division.division_code ||
                "-"
              )}
            </strong>

          </div>


          <div>

            <span>
              Railway Zone
            </span>

            <strong>
              ${escapeHtml(
                division.zone_name ||
                "-"
              )}
            </strong>

          </div>


          <div>

            <span>
              Stations
            </span>

            <strong>
              ${stationTotal}
            </strong>

          </div>


          <div>

            <span>
              Display Order
            </span>

            <strong>
              ${division.display_order ?? 0}
            </strong>

          </div>

        </div>


        <div class="station-card-actions">

          <!-- =============================================
               AVAILABLE TO AUTHORIZED USERS
          ============================================== -->

          <a
            class="builder-action-btn station-open-button"
            href="stations.html?division=${encodeURIComponent(
              division.id
            )}"
          >
            Open Stations
          </a>


          <!-- =============================================
               SYSTEM ADMIN ONLY
          ============================================== -->

          <button
            type="button"
            class="secondary-action"
            data-edit-division="${escapeHtml(
              division.id
            )}"
            data-system-admin-only
            hidden
          >
            Edit
          </button>


          <!-- =============================================
               SYSTEM ADMIN ONLY
          ============================================== -->

          <button
            type="button"
            class="remove-rack-btn"
            data-remove-division="${escapeHtml(
              division.id
            )}"
            data-system-admin-only
            hidden
          >
            Deactivate
          </button>

        </div>

      `;


      divisionList.appendChild(
        card
      );

    }
  );


  /* =======================================================
     EDIT BUTTON EVENTS
  ======================================================= */

  document
    .querySelectorAll(
      "[data-edit-division]"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            editDivision(
              button.dataset
                .editDivision
            );

          }
        );

      }
    );


  /* =======================================================
     DEACTIVATE BUTTON EVENTS
  ======================================================= */

  document
    .querySelectorAll(
      "[data-remove-division]"
    )
    .forEach(
      function (button) {

        button.addEventListener(
          "click",
          function () {

            deactivateDivision(
              button.dataset
                .removeDivision
            );

          }
        );

      }
    );


  /*
    These buttons were created dynamically.

    Apply role visibility again after rendering.
  */

  refreshDivisionRoleVisibility();

}


/* =========================================================
   EVENTS
========================================================= */

showAddDivisionButton
  ?.addEventListener(
    "click",
    function () {

      if (
        !requireDivisionAdmin()
      ) {

        return;

      }


      resetDivisionForm();


      openDivisionForm();

    }
  );


closeAddDivisionButton
  ?.addEventListener(
    "click",
    closeDivisionForm
  );


cancelAddDivisionButton
  ?.addEventListener(
    "click",
    closeDivisionForm
  );


saveDivisionButton
  ?.addEventListener(
    "click",
    saveDivision
  );


divisionSearchInput
  ?.addEventListener(
    "input",
    renderDivisions
  );


/* =========================================================
   ROLE ACCESS READY EVENT

   This handles the case where division cards load before
   role-access.js finishes loading the user's role.
========================================================= */

window.addEventListener(
  "ctr-access-ready",
  function () {

    refreshDivisionRoleVisibility();

  }
);


/* =========================================================
   INITIAL START
========================================================= */

loadDivisions();