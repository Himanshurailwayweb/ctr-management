/* =========================================================
   CTR MANAGEMENT SYSTEM
   HISTORY / AUDIT TRAIL
========================================================= */


/* =========================================================
   PAGE STATE
========================================================= */

const historyState = {

  stations: new Map(),

  alterations: [],

  approvals: [],

  versions: [],

  auditLogs: [],

  currentCategory: "AUDIT",

  currentRecords: []

};


/* =========================================================
   PAGE START
========================================================= */

/* =========================================================
   PAGE START

   Wait until authentication + role access are fully loaded.
   This prevents history queries from running as an
   unauthenticated / partially initialized session.
========================================================= */

let historyPageStarted = false;


async function startHistoryPage() {

  if (historyPageStarted) {
    return;
  }


  /*
     role-access.js sets ctrAccess.ready = true
     after the authenticated user and roles are loaded.
  */

  if (
    !window.ctrAccess ||
    !window.ctrAccess.ready
  ) {

    return;
  }


  historyPageStarted = true;


  await initializeHistoryPage();

}


/* =========================================================
   ROLE ACCESS READY
========================================================= */

window.addEventListener(
  "ctr-access-ready",
  function () {

    startHistoryPage();

  }
);


/* =========================================================
   DOM READY

   Covers the case where role-access.js finished before
   history.js attached the event listener.
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      startHistoryPage();

    }
  );

}

else {

  startHistoryPage();

}


/* =========================================================
   SAFE FALLBACK

   Does not bypass authentication.
   It only checks again whether ctrAccess is ready.
========================================================= */

setTimeout(
  startHistoryPage,
  500
);

setTimeout(
  startHistoryPage,
  1200
);

/* =========================================================
   INITIALIZE HISTORY PAGE
========================================================= */

async function initializeHistoryPage() {

  setHistoryStatus(
    "● Loading History..."
  );


  try {

    await loadHistoryData();

    prepareHistoryControls();

    updateHistoryCategoryCards();

    /*
       Default page view:
       complete audit trail.
    */

    showAuditTrail();

  }

  catch (error) {

    console.error(
      "CTR History initialization error:",
      error
    );


    setHistoryStatus(
      "● Unable to Load History",
      "error"
    );


    renderHistoryError(
      error.message ||
      "History records could not be loaded."
    );

  }

}


/* =========================================================
   LOAD COMPLETE HISTORY DATA
========================================================= */

async function loadHistoryData() {

  /*
     Each query is kept separate intentionally.

     RLS remains responsible for deciding which records
     the currently logged-in user may read.
  */


  const results =
    await Promise.allSettled([

      loadStations(),

      loadAlterations(),

      loadApprovalRecords(),

      loadCtrVersions(),

      loadAuditLogs()

    ]);


  let successCount = 0;


  results.forEach(
    function (result) {

      if (
        result.status ===
        "fulfilled"
      ) {

        successCount++;

      }

      else {

        console.warn(
          "History data source unavailable:",
          result.reason
        );

      }

    }
  );


  if (!successCount) {

    throw new Error(
      "No history data source could be accessed."
    );

  }

}


/* =========================================================
   LOAD STATIONS
========================================================= */

async function loadStations() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("stations")
      .select(
        `
          id,
          station_name,
          station_code,
          division,
          current_version,
          ctr_status
        `
      )
      .order(
        "station_name",
        {
          ascending: true
        }
      );


  if (error) {
    throw error;
  }


  historyState.stations.clear();


  (data || []).forEach(
    function (station) {

      historyState.stations.set(
        station.id,
        station
      );

    }
  );

}


/* =========================================================
   LOAD ALTERATION HISTORY
========================================================= */

async function loadAlterations() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("alterations")
      .select(
        `
          id,
          station_id,
          base_version_id,
          alteration_number,
          alteration_type,
          title,
          reason,
          change_summary,
          status,
          created_by,
          submitted_by,
          submitted_at,
          finalized_version_id,
          created_at,
          updated_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  historyState.alterations =
    Array.isArray(data)
      ? data
      : [];

}


/* =========================================================
   LOAD OFFICER APPROVAL HISTORY
========================================================= */

async function loadApprovalRecords() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("approval_records")
      .select(
        `
          id,
          alteration_id,
          stage_number,
          stage_name,
          officer_id,
          officer_name,
          officer_designation,
          action,
          remarks,
          action_at,
          created_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  historyState.approvals =
    Array.isArray(data)
      ? data
      : [];

}


/* =========================================================
   LOAD CTR VERSION HISTORY
========================================================= */

async function loadCtrVersions() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("ctr_versions")
      .select(
        `
          id,
          station_id,
          version_number,
          version_label,
          source_type,
          status,
          previous_version_id,
          pdf_path,
          digitally_signed,
          signed_by,
          signed_at,
          finalized_at,
          created_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  historyState.versions =
    Array.isArray(data)
      ? data
      : [];

}


/* =========================================================
   LOAD PERMANENT AUDIT LOG
========================================================= */

async function loadAuditLogs() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("audit_logs")
      .select(
        `
          id,
          station_id,
          alteration_id,
          version_id,
          user_id,
          user_name,
          user_designation,
          action,
          entity_type,
          entity_id,
          old_data,
          new_data,
          remarks,
          created_at
        `
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {
    throw error;
  }


  historyState.auditLogs =
    Array.isArray(data)
      ? data
      : [];

}


/* =========================================================
   PREPARE PAGE CONTROLS
========================================================= */

function prepareHistoryControls() {

  const searchInput =
    document.getElementById(
      "historySearch"
    );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      function () {

        filterCurrentHistory(
          searchInput.value
        );

      }
    );

  }


  const cards =
    document.querySelectorAll(
      ".page-content > .module-grid > .module-card"
    );


  if (
    cards.length < 4
  ) {
    return;
  }


  const alterationsButton =
    cards[0].querySelector(
      "button"
    );


  const approvalsButton =
    cards[1].querySelector(
      "button"
    );


  const versionsButton =
    cards[2].querySelector(
      "button"
    );


  const correctionsButton =
    cards[3].querySelector(
      "button"
    );


  if (alterationsButton) {

    alterationsButton.onclick =
      showAllAlterations;

  }


  if (approvalsButton) {

    approvalsButton.onclick =
      showApprovalHistory;

  }


  if (versionsButton) {

    versionsButton.onclick =
      showVersionHistory;

  }


  if (correctionsButton) {

    correctionsButton.onclick =
      showCorrectionHistory;

  }

}


/* =========================================================
   UPDATE CATEGORY CARDS
========================================================= */

function updateHistoryCategoryCards() {

  const cards =
    document.querySelectorAll(
      ".page-content > .module-grid > .module-card"
    );


  if (
    cards.length < 4
  ) {
    return;
  }


  const correctionRecords =
    getCorrectionRecords();


  configureHistoryButton(
    cards[0],
    historyState.alterations.length,
    "Alteration",
    "No Alterations Yet"
  );


  configureHistoryButton(
    cards[1],
    historyState.approvals.length,
    "Approval Record",
    "No Approval History"
  );


  configureHistoryButton(
    cards[2],
    historyState.versions.length,
    "CTR Version",
    "No Versions Yet"
  );


  configureHistoryButton(
    cards[3],
    correctionRecords.length,
    "Correction",
    "No Corrections Yet"
  );

}


/* =========================================================
   CONFIGURE CARD BUTTON
========================================================= */

function configureHistoryButton(
  card,
  count,
  label,
  emptyText
) {

  const button =
    card.querySelector(
      "button"
    );


  if (!button) {
    return;
  }


  if (!count) {

    button.disabled =
      true;

    button.textContent =
      emptyText;

    return;

  }


  button.disabled =
    false;


  button.textContent =
    count === 1
      ? `View 1 ${label}`
      : `View ${count} ${label}s`;

}


/* =========================================================
   COMPLETE AUDIT TRAIL
========================================================= */

function showAuditTrail() {

  historyState.currentCategory =
    "AUDIT";


  const combinedRecords = [];


  /* -------------------------------------------------------
     ALTERATIONS
  ------------------------------------------------------- */

  historyState.alterations.forEach(
    function (record) {

      combinedRecords.push({
        type: "ALTERATION",
        data: record
      });

    }
  );


  /* -------------------------------------------------------
     APPROVAL ACTIONS
  ------------------------------------------------------- */

  historyState.approvals.forEach(
    function (record) {

      combinedRecords.push({
        type: "APPROVAL",
        data: record
      });

    }
  );


  /* -------------------------------------------------------
     CTR VERSIONS
  ------------------------------------------------------- */

  historyState.versions.forEach(
    function (record) {

      combinedRecords.push({
        type: "VERSION",
        data: record
      });

    }
  );


  /* -------------------------------------------------------
     SYSTEM AUDIT LOG
  ------------------------------------------------------- */

  historyState.auditLogs.forEach(
    function (record) {

      combinedRecords.push({
        type: "AUDIT",
        data: record
      });

    }
  );


  /* -------------------------------------------------------
     NEWEST RECORD FIRST
  ------------------------------------------------------- */

  combinedRecords.sort(
    function (a, b) {

      return (
        getHistoryRecordTimestamp(b) -
        getHistoryRecordTimestamp(a)
      );

    }
  );


  historyState.currentRecords =
    combinedRecords;


  renderHistoryRecords(
    historyState.currentRecords,
    "Complete Audit Trail",
    "Combined chronological history of CTR alterations, officer actions, versions and system audit records."
  );

}

function getHistoryRecordTimestamp(
  wrappedRecord
) {

  const record =
    wrappedRecord.data;


  let value = null;


  switch (
    wrappedRecord.type
  ) {

    case "ALTERATION":

      value =
        record.updated_at ||
        record.submitted_at ||
        record.created_at;

      break;


    case "APPROVAL":

      value =
        record.action_at ||
        record.created_at;

      break;


    case "VERSION":

      value =
        record.finalized_at ||
        record.signed_at ||
        record.created_at;

      break;


    case "AUDIT":

      value =
        record.created_at;

      break;

  }


  const timestamp =
    new Date(
      value || 0
    ).getTime();


  return Number.isNaN(
    timestamp
  )
    ? 0
    : timestamp;

}


/* =========================================================
   ALL ALTERATIONS
========================================================= */

function showAllAlterations() {

  historyState.currentCategory =
    "ALTERATIONS";


  historyState.currentRecords =
    historyState.alterations.map(
      function (record) {

        return {
          type: "ALTERATION",
          data: record
        };

      }
    );


  clearHistorySearch();


  renderHistoryRecords(
    historyState.currentRecords,
    "All CTR Alterations",
    "Complete station-wise CTR alteration record."
  );

}


/* =========================================================
   APPROVAL HISTORY
========================================================= */

function showApprovalHistory() {

  historyState.currentCategory =
    "APPROVALS";


  historyState.currentRecords =
    historyState.approvals.map(
      function (record) {

        return {
          type: "APPROVAL",
          data: record
        };

      }
    );


  clearHistorySearch();


  renderHistoryRecords(
    historyState.currentRecords,
    "Approval History",
    "Review, return, approval and officer actions recorded during CTR workflow."
  );

}


/* =========================================================
   VERSION HISTORY
========================================================= */

function showVersionHistory() {

  historyState.currentCategory =
    "VERSIONS";


  historyState.currentRecords =
    historyState.versions.map(
      function (record) {

        return {
          type: "VERSION",
          data: record
        };

      }
    );


  clearHistorySearch();


  renderHistoryRecords(
    historyState.currentRecords,
    "CTR Version History",
    "Baseline, approved, current and superseded CTR versions."
  );

}


/* =========================================================
   CORRECTION HISTORY
========================================================= */

function showCorrectionHistory() {

  historyState.currentCategory =
    "CORRECTIONS";


  historyState.currentRecords =
    getCorrectionRecords().map(
      function (record) {

        return {
          type: "ALTERATION",
          data: record
        };

      }
    );


  clearHistorySearch();


  renderHistoryRecords(
    historyState.currentRecords,
    "Reopened / Corrected CTR",
    "CTR records returned or reopened through a controlled correction process."
  );

}


/* =========================================================
   GET CORRECTION RECORDS
========================================================= */

function getCorrectionRecords() {

  return historyState.alterations.filter(
    function (alteration) {

      return (

        alteration.alteration_type ===
          "CORRECTION"

        ||

        alteration.status ===
          "RETURNED_FOR_CORRECTION"

      );

    }
  );

}


/* =========================================================
   SEARCH CURRENT HISTORY CATEGORY
========================================================= */

function filterCurrentHistory(
  value
) {

  const search =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();


  if (!search) {

    renderHistoryRecords(
      historyState.currentRecords,
      getCurrentCategoryTitle(),
      getCurrentCategoryDescription()
    );

    return;

  }


  const filtered =
    historyState.currentRecords.filter(
      function (record) {

        return (
          buildHistorySearchText(
            record
          )
            .toLowerCase()
            .includes(search)
        );

      }
    );


  renderHistoryRecords(
    filtered,
    getCurrentCategoryTitle(),
    `Search results for "${value.trim()}"`
  );

}


/* =========================================================
   BUILD SEARCH TEXT
========================================================= */

function buildHistorySearchText(
  wrappedRecord
) {

  const record =
    wrappedRecord.data;


  const station =
    getStationForRecord(
      wrappedRecord
    );


  let values = [

    station?.station_name,

    station?.station_code,

    wrappedRecord.type

  ];


  if (
    wrappedRecord.type ===
    "ALTERATION"
  ) {

    values.push(

      record.alteration_number,

      record.alteration_type,

      record.title,

      record.reason,

      record.status,

      getAlterationUserName(
        record.id
      )

    );

  }


  if (
    wrappedRecord.type ===
    "APPROVAL"
  ) {

    values.push(

      record.stage_name,

      record.officer_name,

      record.officer_designation,

      record.action,

      record.remarks,

      getApprovalAlterationNumber(
        record
      )

    );

  }


  if (
    wrappedRecord.type ===
    "VERSION"
  ) {

    values.push(

      record.version_number,

      record.version_label,

      record.source_type,

      record.status

    );

  }


  if (
    wrappedRecord.type ===
    "AUDIT"
  ) {

    values.push(

      record.user_name,

      record.user_designation,

      record.action,

      record.entity_type,

      record.remarks

    );

  }


  return values
    .filter(
      value =>
        value !== null &&
        value !== undefined
    )
    .join(" ");

}


/* =========================================================
   RENDER HISTORY LIST
========================================================= */

function renderHistoryRecords(
  records,
  title,
  description
) {

  let section =
    document.getElementById(
      "historyResultsSection"
    );


  if (!section) {

    section =
      document.createElement(
        "section"
      );


    section.id =
      "historyResultsSection";


    section.className =
      "workflow-section";


    const categoryGrid =
      document.querySelector(
        ".page-content > .module-grid"
      );


    if (categoryGrid) {

      categoryGrid.insertAdjacentElement(
        "afterend",
        section
      );

    }

  }


  if (!section) {
    return;
  }


  section.innerHTML =
    `
      <div class="section-title">

        <h2>
          ${escapeHistoryHtml(title)}
        </h2>

        <p>
          ${escapeHistoryHtml(description)}
        </p>

      </div>

      <div
        id="historyRecordsGrid"
        class="module-grid"
      ></div>
    `;


  const grid =
    section.querySelector(
      "#historyRecordsGrid"
    );


  updateTotalRecordCount(
    records.length
  );


  updateHistoryHero(
    records.length
  );


  if (!records.length) {

    grid.innerHTML =
      `
        <article class="module-card">

          <div class="card-icon">
            ◷
          </div>

          <div class="card-content">

            <span class="card-label">
              NO RECORD
            </span>

            <h3>
              No history records found
            </h3>

            <p>
              There are no records available for this history category.
            </p>

          </div>

        </article>
      `;


    resetHistorySummary();

    return;

  }


  records.forEach(
    function (record) {

      grid.appendChild(
        createHistoryRecordCard(
          record
        )
      );

    }
  );


  updateHistorySummary(
    records[0]
  );

}


/* =========================================================
   CREATE HISTORY RECORD CARD
========================================================= */

function createHistoryRecordCard(
  wrappedRecord
) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "module-card";


  const display =
    getHistoryRecordDisplay(
      wrappedRecord
    );


  card.innerHTML =
    `
      <div class="card-icon">
        ${display.icon}
      </div>

      <div class="card-content">

        <span class="card-label">
          ${escapeHistoryHtml(
            display.label
          )}
        </span>

        <h3>
          ${escapeHistoryHtml(
            display.title
          )}
        </h3>

        <p>
          ${display.description}
        </p>

        <button
          type="button"
          class="history-detail-button"
        >
          View Details
        </button>

      </div>
    `;


  const button =
    card.querySelector(
      ".history-detail-button"
    );


  if (button) {

    button.addEventListener(
      "click",
      function () {

        updateHistorySummary(
          wrappedRecord
        );


        scrollToHistorySummary();

      }
    );

  }


  return card;

}


/* =========================================================
   HISTORY RECORD DISPLAY DATA
========================================================= */

function getHistoryRecordDisplay(
  wrappedRecord
) {

  const record =
    wrappedRecord.data;


  const station =
    getStationForRecord(
      wrappedRecord
    );


  const stationName =
    getStationDisplayName(
      station
    );


  if (
    wrappedRecord.type ===
    "ALTERATION"
  ) {

    return {

      icon: "✎",

      label:
        formatHistoryStatus(
          record.status
        ),

      title:
        `${stationName} — ${getAlterationNumber(record)}`,

      description:
        `
          <strong>Type:</strong>
          ${escapeHistoryHtml(
            formatHistoryStatus(
              record.alteration_type
            )
          )}
          <br>

          <strong>Title:</strong>
          ${escapeHistoryHtml(
            record.title || "—"
          )}
          <br>

          <strong>Created:</strong>
          ${escapeHistoryHtml(
            formatHistoryDateTime(
              record.created_at
            )
          )}
        `

    };

  }


  if (
    wrappedRecord.type ===
    "APPROVAL"
  ) {

    return {

      icon: "✓",

      label:
        formatHistoryStatus(
          record.action
        ),

      title:
        `${stationName} — ${getApprovalAlterationNumber(record)}`,

      description:
        `
          <strong>Stage:</strong>
          ${escapeHistoryHtml(
            record.stage_name || "—"
          )}
          <br>

          <strong>Officer:</strong>
          ${escapeHistoryHtml(
            getOfficerDisplayName(
              record
            )
          )}
          <br>

          <strong>Date:</strong>
          ${escapeHistoryHtml(
            formatHistoryDateTime(
              record.action_at ||
              record.created_at
            )
          )}
        `

    };

  }


  if (
    wrappedRecord.type ===
    "VERSION"
  ) {

    return {

      icon: "▤",

      label:
        formatHistoryStatus(
          record.status
        ),

      title:
        `${stationName} — ${getVersionDisplay(record)}`,

      description:
        `
          <strong>Source:</strong>
          ${escapeHistoryHtml(
            formatHistoryStatus(
              record.source_type
            )
          )}
          <br>

          <strong>Digitally Signed:</strong>
          ${
            record.digitally_signed
              ? "Yes"
              : "No"
          }
          <br>

          <strong>Finalized:</strong>
          ${escapeHistoryHtml(
            formatHistoryDateTime(
              record.finalized_at ||
              record.created_at
            )
          )}
        `

    };

  }


  return {

    icon: "◷",

    label:
      formatHistoryStatus(
        record.action
      ),

    title:
      `${stationName} — ${formatHistoryStatus(
        record.entity_type || "CTR"
      )}`,

    description:
      `
        <strong>Action By:</strong>
        ${escapeHistoryHtml(
          getAuditUserName(
            record
          )
        )}
        <br>

        <strong>Action:</strong>
        ${escapeHistoryHtml(
          formatHistoryStatus(
            record.action
          )
        )}
        <br>

        <strong>Date:</strong>
        ${escapeHistoryHtml(
          formatHistoryDateTime(
            record.created_at
          )
        )}
      `

  };

}


/* =========================================================
   UPDATE AUDIT SUMMARY
========================================================= */

function updateHistorySummary(
  wrappedRecord
) {

  const values =
    document.querySelectorAll(
      ".station-summary-grid .summary-card strong"
    );


  if (
    values.length < 4
  ) {
    return;
  }


  const station =
    getStationForRecord(
      wrappedRecord
    );


  values[0].textContent =
    getStationDisplayName(
      station
    );


  values[1].textContent =
    getSummaryAlterationNumber(
      wrappedRecord
    );


  values[2].textContent =
    getSummaryActionBy(
      wrappedRecord
    );


  values[3].textContent =
    getSummaryDate(
      wrappedRecord
    );

}


/* =========================================================
   SUMMARY ALTERATION NUMBER
========================================================= */

function getSummaryAlterationNumber(
  wrappedRecord
) {

  const record =
    wrappedRecord.data;


  if (
    wrappedRecord.type ===
    "ALTERATION"
  ) {

    return getAlterationNumber(
      record
    );

  }


  if (
    wrappedRecord.type ===
    "APPROVAL"
  ) {

    return getApprovalAlterationNumber(
      record
    );

  }


  if (
    wrappedRecord.type ===
    "AUDIT"
  ) {

    const alteration =
      getAlterationById(
        record.alteration_id
      );


    if (alteration) {

      return getAlterationNumber(
        alteration
      );

    }

  }


  return "—";

}


/* =========================================================
   SUMMARY ACTION BY
========================================================= */

function getSummaryActionBy(
  wrappedRecord
) {

  const record =
    wrappedRecord.data;


  if (
    wrappedRecord.type ===
    "APPROVAL"
  ) {

    return getOfficerDisplayName(
      record
    );

  }


  if (
    wrappedRecord.type ===
    "AUDIT"
  ) {

    return getAuditUserName(
      record
    );

  }


  if (
    wrappedRecord.type ===
    "ALTERATION"
  ) {

    return getAlterationUserName(
      record.id
    );

  }


  if (
    wrappedRecord.type ===
    "VERSION"
  ) {

    const audit =
      historyState.auditLogs.find(
        function (log) {

          return (
            log.version_id ===
            record.id
          );

        }
      );


    if (audit) {

      return getAuditUserName(
        audit
      );

    }

  }


  return "—";

}


/* =========================================================
   SUMMARY DATE
========================================================= */

function getSummaryDate(
  wrappedRecord
) {

  const record =
    wrappedRecord.data;


  if (
    wrappedRecord.type ===
    "APPROVAL"
  ) {

    return formatHistoryDateTime(
      record.action_at ||
      record.created_at
    );

  }


  if (
    wrappedRecord.type ===
    "VERSION"
  ) {

    return formatHistoryDateTime(

      record.finalized_at ||

      record.signed_at ||

      record.created_at

    );

  }


  if (
    wrappedRecord.type ===
    "ALTERATION"
  ) {

    return formatHistoryDateTime(

      record.updated_at ||

      record.created_at

    );

  }


  return formatHistoryDateTime(
    record.created_at
  );

}


/* =========================================================
   FIND STATION FOR RECORD
========================================================= */

function getStationForRecord(
  wrappedRecord
) {

  const record =
    wrappedRecord.data;


  let stationId =
    record.station_id;


  if (
    !stationId &&
    wrappedRecord.type ===
      "APPROVAL"
  ) {

    const alteration =
      getAlterationById(
        record.alteration_id
      );


    stationId =
      alteration?.station_id;

  }


  if (
    !stationId &&
    wrappedRecord.type ===
      "AUDIT"
  ) {

    if (
      record.alteration_id
    ) {

      const alteration =
        getAlterationById(
          record.alteration_id
        );


      stationId =
        alteration?.station_id;

    }

  }


  return (
    historyState.stations.get(
      stationId
    ) ||
    null
  );

}


/* =========================================================
   FIND ALTERATION
========================================================= */

function getAlterationById(
  alterationId
) {

  if (!alterationId) {
    return null;
  }


  return (
    historyState.alterations.find(
      function (alteration) {

        return (
          alteration.id ===
          alterationId
        );

      }
    ) ||
    null
  );

}


/* =========================================================
   APPROVAL ALTERATION NUMBER
========================================================= */

function getApprovalAlterationNumber(
  approval
) {

  const alteration =
    getAlterationById(
      approval.alteration_id
    );


  if (!alteration) {
    return "Alteration";
  }


  return getAlterationNumber(
    alteration
  );

}


/* =========================================================
   ALTERATION DISPLAY NUMBER
========================================================= */

function getAlterationNumber(
  alteration
) {

  if (
    alteration.alteration_number ===
      null ||
    alteration.alteration_number ===
      undefined ||
    alteration.alteration_number ===
      ""
  ) {

    return (
      alteration.alteration_type ===
        "CORRECTION"
        ? "Correction"
        : "Alteration"
    );

  }


  return (
    alteration.alteration_type ===
      "CORRECTION"
      ? `Correction ${alteration.alteration_number}`
      : `Alteration ${alteration.alteration_number}`
  );

}


/* =========================================================
   ALTERATION USER NAME FROM AUDIT LOG
========================================================= */

function getAlterationUserName(
  alterationId
) {

  const log =
    historyState.auditLogs.find(
      function (record) {

        return (
          record.alteration_id ===
          alterationId
        );

      }
    );


  if (log) {

    return getAuditUserName(
      log
    );

  }


  return "—";

}


/* =========================================================
   OFFICER DISPLAY NAME
========================================================= */

function getOfficerDisplayName(
  approval
) {

  const name =
    approval.officer_name ||
    "Authorized Officer";


  if (
    approval.officer_designation
  ) {

    return (
      `${name} (${approval.officer_designation})`
    );

  }


  return name;

}


/* =========================================================
   AUDIT USER NAME
========================================================= */

function getAuditUserName(
  record
) {

  const name =
    record.user_name ||
    "Authorized User";


  if (
    record.user_designation
  ) {

    return (
      `${name} (${record.user_designation})`
    );

  }


  return name;

}


/* =========================================================
   VERSION LABEL
========================================================= */

function getVersionDisplay(
  version
) {

  if (
    version.version_label
  ) {

    return version.version_label;

  }


  return (
    `V${Number(
      version.version_number ||
      0
    )}`
  );

}


/* =========================================================
   STATION DISPLAY NAME
========================================================= */

function getStationDisplayName(
  station
) {

  if (!station) {

    return "Unknown Station";

  }


  if (
    station.station_code
  ) {

    return (
      `${station.station_name} (${station.station_code})`
    );

  }


  return (
    station.station_name ||
    "Unknown Station"
  );

}


/* =========================================================
   CATEGORY TITLES
========================================================= */

function getCurrentCategoryTitle() {

  switch (
    historyState.currentCategory
  ) {

    case "ALTERATIONS":
      return "All CTR Alterations";

    case "APPROVALS":
      return "Approval History";

    case "VERSIONS":
      return "CTR Version History";

    case "CORRECTIONS":
      return "Reopened / Corrected CTR";

    default:
      return "Complete Audit Trail";

  }

}


/* =========================================================
   CATEGORY DESCRIPTIONS
========================================================= */

function getCurrentCategoryDescription() {

  switch (
    historyState.currentCategory
  ) {

    case "ALTERATIONS":

      return (
        "Complete station-wise CTR alteration record."
      );


    case "APPROVALS":

      return (
        "Review, return, approval and officer actions recorded during CTR workflow."
      );


    case "VERSIONS":

      return (
        "Baseline, approved, current and superseded CTR versions."
      );


    case "CORRECTIONS":

      return (
        "CTR records returned or reopened through a controlled correction process."
      );


    default:

      return (
        "Permanent trace of important CTR actions recorded by the system."
      );

  }

}


/* =========================================================
   CLEAR SEARCH
========================================================= */

function clearHistorySearch() {

  const search =
    document.getElementById(
      "historySearch"
    );


  if (search) {

    search.value = "";

  }

}


/* =========================================================
   TOTAL RECORD COUNT
========================================================= */

function updateTotalRecordCount(
  count
) {

  const total =
    document.querySelector(
      ".station-count strong"
    );


  if (total) {

    total.textContent =
      String(count);

  }

}


/* =========================================================
   HERO HISTORY STATUS
========================================================= */

function updateHistoryHero(
  count
) {

  if (!count) {

    setHistoryStatus(
      "● No Records Yet"
    );

    return;

  }


  setHistoryStatus(
    count === 1
      ? "● 1 History Record"
      : `● ${count} History Records`,
    "success"
  );

}


/* =========================================================
   SET HERO STATUS
========================================================= */

function setHistoryStatus(
  text,
  type
) {

  const status =
    document.querySelector(
      ".ctr-hero .hero-status strong"
    );


  if (!status) {
    return;
  }


  status.textContent =
    text;


  if (
    type ===
    "success"
  ) {

    status.style.color =
      "#15803d";

  }

  else if (
    type ===
    "error"
  ) {

    status.style.color =
      "#b91c1c";

  }

  else {

    status.style.color =
      "";

  }

}


/* =========================================================
   RESET SUMMARY
========================================================= */

function resetHistorySummary() {

  const values =
    document.querySelectorAll(
      ".station-summary-grid .summary-card strong"
    );


  values.forEach(
    function (element) {

      element.textContent =
        "—";

    }
  );

}


/* =========================================================
   SCROLL TO SUMMARY
========================================================= */

function scrollToHistorySummary() {

  const summary =
    document.querySelector(
      ".station-summary-grid"
    );


  if (summary) {

    summary.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }

}


/* =========================================================
   ERROR DISPLAY
========================================================= */

function renderHistoryError(
  message
) {

  const page =
    document.querySelector(
      ".page-content"
    );


  if (!page) {
    return;
  }


  const section =
    document.createElement(
      "section"
    );


  section.className =
    "station-info-note";


  section.innerHTML =
    `
      <strong>
        History could not be loaded
      </strong>

      <p>
        ${escapeHistoryHtml(message)}
      </p>
    `;


  const hero =
    page.querySelector(
      ".ctr-hero"
    );


  if (hero) {

    hero.insertAdjacentElement(
      "afterend",
      section
    );

  }

}


/* =========================================================
   FORMAT STATUS / ACTION TEXT
========================================================= */

function formatHistoryStatus(
  value
) {

  if (!value) {
    return "—";
  }


  return String(value)
    .replace(
      /_/g,
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      function (letter) {

        return letter.toUpperCase();

      }
    );

}


/* =========================================================
   DATE & TIME FORMAT
========================================================= */

function formatHistoryDateTime(
  value
) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";

  }


  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }
  ).format(date);

}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHistoryHtml(
  value
) {

  return String(
    value ?? ""
  )

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}