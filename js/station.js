/* =========================================================
   CTR MANAGEMENT - STATION CTR BUILDER
   COMPLETE PERFORMANCE + LAZY LOAD VERSION

   IMPORTANT
   ---------------------------------------------------------
   - Station racks are lazy loaded.
   - Connected Ends are lazy loaded.
   - Location Boxes are lazy loaded.
   - Large terminal drawings are NOT created until opened.
   - Draft remains stored in Supabase.
   - Existing CTR data structure is preserved.
   - Legacy Location K-rack data is migrated automatically.
========================================================= */


/* =========================================================
   BASIC HELPERS
========================================================= */

function createId() {

  if (
    window.crypto &&
    typeof window.crypto.randomUUID === "function"
  ) {

    return window.crypto.randomUUID();

  }

  return (
    Date.now().toString() +
    "-" +
    Math.random().toString(16).slice(2)
  );

}


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


function cloneCtrData(value) {

  if (
    typeof window.structuredClone === "function"
  ) {

    try {

      return window.structuredClone(
        value
      );

    }
    catch (error) {

      console.warn(
        "CTR structured clone fallback:",
        error
      );

    }

  }


  return JSON.parse(
    JSON.stringify(
      value
    )
  );

}


function getRowLabel(index) {

  let number =
    index + 1;

  let result =
    "";


  while (
    number > 0
  ) {

    number--;


    result =
      String.fromCharCode(
        65 +
        (
          number % 26
        )
      ) +
      result;


    number =
      Math.floor(
        number / 26
      );

  }


  return result;

}


/* =========================================================
   CREATE ENGINEERING DATA
========================================================= */

function createFusePoint(number) {

  return {

    id:
      createId(),

    label:
      `F${number}`,

    details:
      ""

  };

}


function createTerminal(number) {

  return {

    id:
      createId(),

    number:
      String(number)
        .padStart(
          2,
          "0"
        ),

    status:
      "SPARE",

    conductorStyle:
      "STRAIGHT",

    particular:
      "",

    locationBox:
      "",

    locationTerminal:
      "",

    remarks:
      ""

  };

}


function createRow(
  label,
  terminalCount = 12
) {

  const terminals =
    [];


  for (
    let i = 1;
    i <= terminalCount;
    i++
  ) {

    terminals.push(
      createTerminal(i)
    );

  }


  return {

    id:
      createId(),

    label:
      label,

    terminals:
      terminals

  };

}


function createCtrRack(number) {

  return {

    id:
      createId(),

    autoNumber:
      number,

    name:
      `K${number}`,

    fuseDetails:
      [],

    rows: [

      createRow(
        "A",
        12
      )

    ]

  };

}


/* =========================================================
   NUMBER HELPERS
========================================================= */

function getNextRackNumber(racks) {

  let highest =
    0;


  racks.forEach(
    function (rack) {

      highest =
        Math.max(
          highest,
          Number(
            rack.autoNumber
          ) || 0
        );


      const match =
        String(
          rack.name || ""
        )
          .trim()
          .match(
            /^K(\d+)$/i
          );


      if (match) {

        highest =
          Math.max(
            highest,
            Number(
              match[1]
            )
          );

      }

    }
  );


  return highest + 1;

}


function getNextFuseNumber(
  fuseDetails
) {

  let highest =
    0;


  fuseDetails.forEach(
    function (fuse) {

      const match =
        String(
          fuse.label || ""
        )
          .trim()
          .match(
            /^F(\d+)$/i
          );


      if (match) {

        highest =
          Math.max(
            highest,
            Number(
              match[1]
            )
          );

      }

    }
  );


  return highest + 1;

}


function renumberTerminals(row) {

  row.terminals.forEach(
    function (
      terminal,
      index
    ) {

      terminal.number =
        String(
          index + 1
        )
          .padStart(
            2,
            "0"
          );


      terminal.conductorStyle =
        terminal.conductorStyle ||
        "STRAIGHT";

    }
  );

}


function relabelRows(
  owner
) {

  if (
    !owner ||
    !Array.isArray(
      owner.rows
    )
  ) {

    return;

  }


  const usedLabels =
    new Set();


  owner.rows.forEach(
    function (
      row
    ) {

      let currentLabel =
        String(
          row.label || ""
        )
          .trim()
          .toUpperCase();


      if (
        currentLabel &&
        !usedLabels.has(
          currentLabel
        )
      ) {

        row.label =
          currentLabel;


        usedLabels.add(
          currentLabel
        );


        return;

      }


      let labelIndex =
        0;


      let newLabel =
        "";


      do {

        newLabel =
          getRowLabel(
            labelIndex
          );


        labelIndex++;

      }

      while (
        usedLabels.has(
          newLabel
        )
      );


      row.label =
        newLabel;


      usedLabels.add(
        newLabel
      );

    }
  );

}


/* =========================================================
   MAIN DATA
========================================================= */

const stationCtrRacks = [

  createCtrRack(1)

];


const connectedEnds =
  [];


/* =========================================================
   LAZY OPEN STATE
========================================================= */

const openedStationRacks =
  new Set();


const openedConnectedEnds =
  new Set();


const openedLocationBoxes =
  new Set();


function isRackOpen(rack) {

  return openedStationRacks.has(
    rack.id
  );

}


function isEndOpen(end) {

  return openedConnectedEnds.has(
    end.id
  );

}


function isLocationOpen(location) {

  return openedLocationBoxes.has(
    location.id
  );

}


function getTerminalCount(owner) {

  if (
    !Array.isArray(
      owner?.rows
    )
  ) {

    return 0;

  }


  return owner.rows.reduce(
    function (
      total,
      row
    ) {

      return (
        total +
        (
          Array.isArray(
            row.terminals
          )
            ? row.terminals.length
            : 0
        )
      );

    },
    0
  );

}


/* =========================================================
   CURRENT STATION
========================================================= */

const stationUrlParams =
  new URLSearchParams(
    window.location.search
  );


const currentStationId =

  document.body.dataset.stationId ||

  stationUrlParams.get("id") ||

  null;


/* =========================================================
   ALTERATION MODE CONTEXT
========================================================= */

const currentAlterationId =
  stationUrlParams.get(
    "alteration"
  );


const stationPageMode =
  stationUrlParams.get(
    "mode"
  );


const isAlterationMode =
  stationPageMode === "alteration" &&
  Boolean(
    currentAlterationId
  );


let currentAlterationStatus =
  null;


let alterationContextLoaded =
  false;


const ALTERATION_DRAFT_EDITOR_ROLES = [
  "STATION_USER",
  "EMPLOYEE",
  "CORRECTION_AUTHORITY"
];


/* =========================================================
   CONNECTED END DATA HELPERS
========================================================= */

function getNextEndNumber() {

  let highest =
    0;


  connectedEnds.forEach(
    function (end) {

      highest =
        Math.max(
          highest,
          Number(
            end.autoNumber
          ) || 0
        );

    }
  );


  return highest + 1;

}


function getNextLocationNumber(end) {

  let highest =
    0;


  (
    end.locations ||
    []
  )
    .forEach(
      function (location) {

        highest =
          Math.max(
            highest,
            Number(
              location.autoNumber
            ) || 0
          );

      }
    );


  return highest + 1;

}


function createConnectedEnd() {

  const number =
    getNextEndNumber();


  return {

    id:
      createId(),

    autoNumber:
      number,

    name:
      `Connected End ${number}`,

    locations:
      []

  };

}


function createLocation(end) {

  const number =
    getNextLocationNumber(
      end
    );


  return {

    id:
      createId(),

    autoNumber:
      number,

    name:
      `Location Box ${number}`,

    fuseDetails:
      [],

    rows: [

      createRow(
        "A",
        12
      ),

      createRow(
        "B",
        12
      ),

      createRow(
        "C",
        12
      ),

      createRow(
        "D",
        12
      )

    ]

  };

}


/* =========================================================
   DOM REFERENCES
========================================================= */

const stationCtrRacksContainer =
  document.getElementById(
    "stationCtrRacksContainer"
  );


const addStationCtrRackButton =
  document.getElementById(
    "addStationCtrRack"
  );


const connectedEndsContainer =
  document.getElementById(
    "connectedEndsContainer"
  );


const addConnectedEndButton =
  document.getElementById(
    "addConnectedEnd"
  );


const terminalEditor =
  document.getElementById(
    "terminalEditor"
  );


const selectedTerminalTitle =
  document.getElementById(
    "selectedTerminalTitle"
  );


const currentTerminalStatus =
  document.getElementById(
    "currentTerminalStatus"
  );


const circuitParticular =
  document.getElementById(
    "circuitParticular"
  );


const locationBox =
  document.getElementById(
    "locationBox"
  );


const locationTerminal =
  document.getElementById(
    "locationTerminal"
  );


const terminalStatus =
  document.getElementById(
    "terminalStatus"
  );


const terminalRemarks =
  document.getElementById(
    "terminalRemarks"
  );


const closeTerminalEditorButton =
  document.getElementById(
    "closeTerminalEditor"
  );


const cancelTerminalEditButton =
  document.getElementById(
    "cancelTerminalEdit"
  );


const saveTerminalPreviewButton =
  document.getElementById(
    "saveTerminalPreview"
  );


const saveCtrDraftButton =
  document.getElementById(
    "saveCtrDraft"
  );


const resetCtrDraftButton =
  document.getElementById(
    "resetCtrDraft"
  );


const initialDataEntryButton =
  document.getElementById(
    "initialDataEntryButton"
  );


const draftSaveStatus =
  document.getElementById(
    "draftSaveStatus"
  );


const fuseEditor =
  document.getElementById(
    "fuseEditor"
  );


const selectedFuseTitle =
  document.getElementById(
    "selectedFuseTitle"
  );


const fuseLabelInput =
  document.getElementById(
    "fuseLabelInput"
  );


const fuseDetailsInput =
  document.getElementById(
    "fuseDetailsInput"
  );


const closeFuseEditorButton =
  document.getElementById(
    "closeFuseEditor"
  );


const cancelFuseEditButton =
  document.getElementById(
    "cancelFuseEdit"
  );


const saveFuseEditButton =
  document.getElementById(
    "saveFuseEdit"
  );


/* =========================================================
   STATUS DISPLAY
========================================================= */

function setDraftStatus(message) {

  if (
    draftSaveStatus
  ) {

    draftSaveStatus.textContent =
      message;

  }

}


/* =========================================================
   ROLE + WORKFLOW ACCESS
========================================================= */

const EDITABLE_STATION_STATUSES = [

  "INITIAL_SETUP",
  "DRAFT"

];


const STATION_DRAFT_EDITOR_ROLES = [

  "STATION_USER"

];


let currentStationWorkflowStatus =
  null;


let stationWorkflowStatusLoaded =
  false;


/* =========================================================
   LOAD STATION WORKFLOW STATUS
========================================================= */

async function loadCurrentStationWorkflowStatus() {

  if (
    !currentStationId
  ) {

    stationWorkflowStatusLoaded =
      true;

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
            ctr_status,
            current_version,
            is_active
          `
        )
        .eq(
          "id",
          currentStationId
        )
        .maybeSingle();


    if (
      error
    ) {

      throw error;

    }


    currentStationWorkflowStatus =
      data?.ctr_status ||
      "INITIAL_SETUP";


    stationWorkflowStatusLoaded =
      true;

  }

  catch (error) {

    console.error(
      "Station workflow status error:",
      error
    );


    stationWorkflowStatusLoaded =
      true;

  }

}


/* =========================================================
   LOAD ALTERATION CONTEXT
========================================================= */

async function loadCurrentAlterationContext() {

  if (
    !isAlterationMode
  ) {

    alterationContextLoaded =
      true;

    return null;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "alteration_drafts"
      )
      .select(`
        alteration_id,
        station_id,
        status,
        draft_data,
        updated_at
      `)
      .eq(
        "alteration_id",
        currentAlterationId
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

    throw new Error(
      "Alteration working copy was not found."
    );

  }


  if (
    data.station_id !==
    currentStationId
  ) {

    throw new Error(
      "This alteration does not belong to the selected station."
    );

  }


  currentAlterationStatus =
    data.status ||
    "DRAFT";


  alterationContextLoaded =
    true;


  return data;

}


/* =========================================================
   CAN EDIT?
========================================================= */

function canEditCurrentStationDraft() {

  if (
    !currentStationId ||
    !window.ctrAccess ||
    !window.ctrAccess.ready
  ) {

    return false;

  }


  /* =====================================================
     ALTERATION MODE
  ===================================================== */

  if (
    isAlterationMode
  ) {

    if (
      !alterationContextLoaded
    ) {

      return false;

    }


    if (
      ![
        "DRAFT",
        "RETURNED_FOR_CORRECTION"
      ].includes(
        currentAlterationStatus
      )
    ) {

      return false;

    }


    if (
      window.ctrAccess
        .isSystemAdmin()
    ) {

      return true;

    }


    return window.ctrAccess
      .hasStationRole(
        currentStationId,
        ALTERATION_DRAFT_EDITOR_ROLES
      );

  }


  /* =====================================================
     NORMAL INITIAL CTR MODE
  ===================================================== */

  if (
    !stationWorkflowStatusLoaded
  ) {

    return false;

  }


  if (
    !EDITABLE_STATION_STATUSES
      .includes(
        currentStationWorkflowStatus
      )
  ) {

    return false;

  }


  if (
    window.ctrAccess
      .isSystemAdmin()
  ) {

    return true;

  }


  return window.ctrAccess
    .hasStationRole(
      currentStationId,
      STATION_DRAFT_EDITOR_ROLES
    );

}


/* =========================================================
   REQUIRE EDIT
========================================================= */

function requireCurrentStationDraftEdit() {

  if (
    canEditCurrentStationDraft()
  ) {

    return true;

  }


  let message =
    "You have view-only access to this station CTR.";


  if (
    isAlterationMode
  ) {

    if (
      !alterationContextLoaded
    ) {

      message =
        "Alteration data is still loading. Please try again.";

    }

    else if (
      currentAlterationStatus &&
      ![
        "DRAFT",
        "RETURNED_FOR_CORRECTION"
      ].includes(
        currentAlterationStatus
      )
    ) {

      message =
        `This alteration is ${currentAlterationStatus} and is no longer editable.`;

    }

    else {

      message =
        "You do not have permission to edit this CTR alteration.";

    }

  }

  else if (
    currentStationWorkflowStatus &&
    !EDITABLE_STATION_STATUSES.includes(
      currentStationWorkflowStatus
    )
  ) {

    message =
      "This approved/workflow-controlled CTR cannot be edited directly. Create or open an alteration instead.";

  }


  alert(
    message
  );


  return false;

}


/* =========================================================
   APPLY ACCESS MODE
========================================================= */

function applyStationBuilderAccessMode() {

  const editable =
    canEditCurrentStationDraft();


  document.body.dataset.stationEditMode =
    editable
      ? "edit"
      : "view";


  document.body.dataset.ctrMode =
    isAlterationMode
      ? "alteration"
      : "initial";


  if (
    currentAlterationId
  ) {

    document.body.dataset.alterationId =
      currentAlterationId;

  }


  document
    .querySelectorAll(
      "[data-station-edit-control]"
    )
    .forEach(
      function (element) {

        element.hidden =
          !editable;

      }
    );


  if (
    initialDataEntryButton
  ) {

    initialDataEntryButton.disabled =
      !editable;


    if (
      isAlterationMode
    ) {

      initialDataEntryButton.hidden =
        false;


      initialDataEntryButton.textContent =
        currentAlterationStatus ===
        "RETURNED_FOR_CORRECTION"

          ? "Continue Correction"

          : "Continue Alteration";


      initialDataEntryButton.title =
        "Edit the working copy of the approved CTR. The approved version remains unchanged.";

    }

    else {

      initialDataEntryButton.textContent =
        currentStationWorkflowStatus ===
        "DRAFT"

          ? "Continue Data Entry"

          : "Initial Data Entry";

    }

  }


  if (
    resetCtrDraftButton
  ) {

    resetCtrDraftButton.hidden =
      isAlterationMode ||
      !editable;

  }


  const modifyButton =
    document.getElementById(
      "modifyCtrButton"
    );


  if (
    modifyButton &&
    isAlterationMode
  ) {

    modifyButton.hidden =
      true;

  }


  const editElements =
    document.querySelectorAll(
      [
        ".remove-conductor-btn",
        ".pdf-fuse-remove",
        ".add-conductor-btn",
        ".remove-row-btn",
        ".remove-rack-btn",
        ".systematic-grid-btn",
        "#stationCtrRacksContainer .builder-action-btn",
        "#connectedEndsContainer .builder-action-btn"
      ].join(",")
    );


  editElements.forEach(
    function (element) {

      if (
        element.classList.contains(
          "ctr-view-toggle"
        )
      ) {

        element.hidden =
          false;

        return;

      }


      element.hidden =
        !editable;

    }
  );


  document
    .querySelectorAll(
      [
        ".station-rack-name-input",
        ".end-name-input",
        ".location-name-input"
      ].join(",")
    )
    .forEach(
      function (input) {

        input.readOnly =
          !editable;

      }
    );


  document
    .querySelectorAll(
      ".terminal, .pdf-fuse-symbol-btn"
    )
    .forEach(
      function (button) {

        button.disabled =
          !editable;

      }
    );

}


/* =========================================================
   THROTTLED ACCESS APPLY
========================================================= */

let stationAccessFrame =
  null;


function scheduleStationAccessApply() {

  if (
    stationAccessFrame !==
    null
  ) {

    return;

  }


  stationAccessFrame =
    requestAnimationFrame(
      function () {

        stationAccessFrame =
          null;


        if (
          window.ctrAccess?.ready
        ) {

          applyStationBuilderAccessMode();

        }

      }
    );

}


/* =========================================================
   ACCESS EVENT
========================================================= */

window.addEventListener(
  "ctr-access-ready",
  scheduleStationAccessApply
);


/* =========================================================
   TERMINAL EDITOR
========================================================= */

let selectedTerminal =
  null;


let selectedTerminalOwner =
  null;


let selectedTerminalRack =
  null;


let selectedTerminalRow =
  null;


function openTerminalEditor(
  rack,
  row,
  terminal,
  owner
) {

  if (
    !canEditCurrentStationDraft()
  ) {

    return;

  }


  if (
    !terminalEditor
  ) {

    return;

  }


  selectedTerminal =
    terminal;


  selectedTerminalOwner =
    owner;


  selectedTerminalRack =
    rack;


  selectedTerminalRow =
    row;


  if (
    selectedTerminalTitle
  ) {

    selectedTerminalTitle.textContent =
      `${rack.name || "CTR"} / Row ${row.label} / Terminal ${terminal.number}`;

  }


  if (
    currentTerminalStatus
  ) {

    currentTerminalStatus.textContent =
      terminal.status;

  }


  if (
    circuitParticular
  ) {

    circuitParticular.value =
      terminal.particular;

  }


  if (
    locationBox
  ) {

    locationBox.value =
      terminal.locationBox;

  }


  if (
    locationTerminal
  ) {

    locationTerminal.value =
      terminal.locationTerminal;

  }


  if (
    terminalStatus
  ) {

    terminalStatus.value =
      terminal.status;

  }


  if (
    terminalRemarks
  ) {

    terminalRemarks.value =
      terminal.remarks;

  }


  terminalEditor.classList.add(
    "open"
  );


  terminalEditor.scrollIntoView(
    {

      behavior:
        "smooth",

      block:
        "center"

    }
  );

}


function closeEditor() {

  terminalEditor
    ?.classList
    .remove(
      "open"
    );


  selectedTerminal =
    null;


  selectedTerminalRack =
    null;


  selectedTerminalRow =
    null;


  selectedTerminalOwner =
    null;

}


function saveTerminalData() {

  if (
    !requireCurrentStationDraftEdit()
  ) {
    return;
  }


  if (
    !selectedTerminal
  ) {
    return;
  }


  /* =====================================================
     FIND THE REAL TERMINAL INSIDE MASTER CTR DATA

     Important:
     The terminal opened by drawing/UI may sometimes be a
     rendered/copied object. We therefore locate the real
     terminal again inside stationCtrRacks / connectedEnds
     before applying changes.
  ===================================================== */

  let realTerminal =
    null;


  if (
    selectedTerminalOwner ===
    "location"
  ) {

    for (
      const end of connectedEnds
    ) {

      const location =
        (
          end.locations ||
          []
        ).find(
          function (item) {

            return (
              item.id ===
              selectedTerminalRack?.id
            );

          }
        );


      if (
        !location
      ) {
        continue;
      }


      const row =
        (
          location.rows ||
          []
        ).find(
          function (item) {

            return (
              item.id ===
              selectedTerminalRow?.id
            );

          }
        );


      if (
        !row
      ) {
        continue;
      }


      realTerminal =
        (
          row.terminals ||
          []
        ).find(
          function (item) {

            return (
              item.id ===
              selectedTerminal.id
            );

          }
        );


      if (
        !realTerminal
      ) {

        realTerminal =
          (
            row.terminals ||
            []
          ).find(
            function (item) {

              return (
                item.number ===
                selectedTerminal.number
              );

            }
          );

      }


      if (
        realTerminal
      ) {
        break;
      }

    }

  }

  else {

    const rack =
      stationCtrRacks.find(
        function (item) {

          return (
            item.id ===
            selectedTerminalRack?.id
          );

        }
      );


    const row =
      rack
        ?.rows
        ?.find(
          function (item) {

            return (
              item.id ===
              selectedTerminalRow?.id
            );

          }
        );


    if (
      row
    ) {

      realTerminal =
        row.terminals.find(
          function (item) {

            return (
              item.id ===
              selectedTerminal.id
            );

          }
        );


      if (
        !realTerminal
      ) {

        realTerminal =
          row.terminals.find(
            function (item) {

              return (
                item.number ===
                selectedTerminal.number
              );

            }
          );

      }

    }

  }


  /*
     Fallback only if the selected terminal already is the
     real model object.
  */

  if (
    !realTerminal
  ) {

    realTerminal =
      selectedTerminal;

  }


  /* =====================================================
     APPLY EDITED VALUES TO MASTER DATA
  ===================================================== */

  realTerminal.particular =
    circuitParticular
      ?.value
      ?.trim() ||
    "";


  realTerminal.locationBox =
    locationBox
      ?.value
      ?.trim() ||
    "";


  realTerminal.locationTerminal =
    locationTerminal
      ?.value
      ?.trim() ||
    "";


  realTerminal.status =
    terminalStatus
      ?.value ||
    "SPARE";


  realTerminal.remarks =
    terminalRemarks
      ?.value
      ?.trim() ||
    "";


  /*
     Keep selected object synchronized as well.
  */

  if (
    selectedTerminal !==
    realTerminal
  ) {

    selectedTerminal.particular =
      realTerminal.particular;

    selectedTerminal.locationBox =
      realTerminal.locationBox;

    selectedTerminal.locationTerminal =
      realTerminal.locationTerminal;

    selectedTerminal.status =
      realTerminal.status;

    selectedTerminal.remarks =
      realTerminal.remarks;

  }


  console.log(
    "CTR terminal committed to master data:",
    {
      owner:
        selectedTerminalOwner,

      terminalId:
        realTerminal.id,

      number:
        realTerminal.number,

      status:
        realTerminal.status,

      particular:
        realTerminal.particular,

      remarks:
        realTerminal.remarks
    }
  );


  const owner =
    selectedTerminalOwner;


  closeEditor();


  if (
    owner ===
    "location"
  ) {

    renderConnectedEnds();

    window
      .CTR_LOCATION_SVG_VIEW
      ?.refresh?.();

  }

  else {

    renderStationCtrRacks();

    window
      .CTR_STATION_SVG_VIEW
      ?.refresh?.();

  }

}


/* =========================================================
   TERMINAL VISUAL
========================================================= */

function createTerminalVisual(
  rack,
  row,
  terminal,
  owner
) {

  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    terminal.status ===
    "IN USE"

      ? "terminal in-use"

      : "terminal";


  button.innerHTML = `

    <span class="terminal-number">
      ${escapeHtml(
        terminal.number
      )}
    </span>

    <span class="terminal-line"></span>

    <span class="terminal-point"></span>

    <span class="terminal-line"></span>

    <strong>
      ${escapeHtml(
        terminal.status
      )}
    </strong>

    <span class="terminal-particular">
      ${escapeHtml(
        terminal.particular
      )}
    </span>

  `;


  button.addEventListener(
    "click",
    function () {

      openTerminalEditor(
        rack,
        row,
        terminal,
        owner
      );

    }
  );


  return button;

}


/* =========================================================
   REMOVE TERMINAL BUTTON
========================================================= */

function createRemoveTerminalButton(
  row,
  terminal,
  rerender
) {

  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "remove-conductor-btn";


  button.textContent =
    "×";


  button.title =
    `Remove Terminal ${terminal.number}`;


  button.addEventListener(
    "click",
    function (event) {

      event.stopPropagation();


      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      if (
        !confirm(
          `Remove Terminal ${terminal.number}?`
        )
      ) {

        return;

      }


      const index =
        row.terminals.indexOf(
          terminal
        );


      if (
        index !== -1
      ) {

        row.terminals.splice(
          index,
          1
        );


        renumberTerminals(
          row
        );


        rerender();

      }

    }
  );


  return button;

}
/* =========================================================
   FUSE EDITOR
========================================================= */

let selectedFuse =
  null;


let selectedFuseRerender =
  null;


function openFuseEditor(
  fuse,
  owner,
  rerender
) {

  if (
    !canEditCurrentStationDraft()
  ) {

    return;

  }


  if (
    !fuseEditor
  ) {

    return;

  }


  selectedFuse =
    fuse;


  selectedFuseRerender =
    rerender;


  if (
    selectedFuseTitle
  ) {

    selectedFuseTitle.textContent =
      `${owner.name || "CTR"} / ${fuse.label || "Fuse Point"}`;

  }


  if (
    fuseLabelInput
  ) {

    fuseLabelInput.value =
      fuse.label ||
      "";

  }


  if (
    fuseDetailsInput
  ) {

    fuseDetailsInput.value =
      fuse.details ||
      "";

  }


  fuseEditor.classList.add(
    "open"
  );

}


function closeFuseEditor() {

  fuseEditor
    ?.classList
    .remove(
      "open"
    );


  selectedFuse =
    null;


  selectedFuseRerender =
    null;

}


function saveFuseData() {

  if (
    !requireCurrentStationDraftEdit()
  ) {

    return;

  }


  if (
    !selectedFuse
  ) {

    return;

  }


  selectedFuse.label =
    fuseLabelInput
      ?.value
      ?.trim() ||
    selectedFuse.label ||
    "F1";


  selectedFuse.details =
    fuseDetailsInput
      ?.value
      ?.trim() ||
    "";


  const rerender =
    selectedFuseRerender;


  closeFuseEditor();


  if (
    typeof rerender ===
    "function"
  ) {

    rerender();

  }

}


closeFuseEditorButton
  ?.addEventListener(
    "click",
    closeFuseEditor
  );


cancelFuseEditButton
  ?.addEventListener(
    "click",
    closeFuseEditor
  );


saveFuseEditButton
  ?.addEventListener(
    "click",
    saveFuseData
  );


/* =========================================================
   FUSE VISUAL
========================================================= */

function createPdfFuseItem(
  fuse,
  owner,
  rerender
) {

  const item =
    document.createElement(
      "div"
    );


  item.className =
    "pdf-fuse-item";


  const remove =
    document.createElement(
      "button"
    );


  remove.type =
    "button";


  remove.className =
    "pdf-fuse-remove";


  remove.textContent =
    "×";


  remove.addEventListener(
    "click",
    function (event) {

      event.stopPropagation();


      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      if (
        !confirm(
          `Remove ${fuse.label}?`
        )
      ) {

        return;

      }


      const index =
        owner.fuseDetails.indexOf(
          fuse
        );


      if (
        index !== -1
      ) {

        owner.fuseDetails.splice(
          index,
          1
        );


        rerender();

      }

    }
  );


  const caption =
    document.createElement(
      "div"
    );


  caption.className =
    "pdf-fuse-caption";


  caption.innerHTML = `

    <strong>
      ${escapeHtml(
        fuse.details ||
        "Enter fuse details"
      )}
    </strong>

    <span>
      ${escapeHtml(
        owner.name ||
        "CTR"
      )} FUSE
    </span>

  `;


  const symbol =
    document.createElement(
      "button"
    );


  symbol.type =
    "button";


  symbol.className =
    "pdf-fuse-symbol-btn";


  symbol.innerHTML = `

    <svg
      width="82"
      height="68"
      viewBox="0 0 82 68"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >

      <line
        x1="41"
        y1="2"
        x2="41"
        y2="14"
        stroke="currentColor"
        stroke-width="1.5"
      />

      <circle
        cx="41"
        cy="16"
        r="2.6"
        fill="white"
        stroke="currentColor"
        stroke-width="1.4"
      />

      <line
        x1="41"
        y1="19"
        x2="30"
        y2="30"
        stroke="currentColor"
        stroke-width="1.5"
      />

      <line
        x1="30"
        y1="30"
        x2="52"
        y2="30"
        stroke="currentColor"
        stroke-width="1.5"
      />

      <line
        x1="52"
        y1="30"
        x2="41"
        y2="41"
        stroke="currentColor"
        stroke-width="1.5"
      />

      <line
        x1="41"
        y1="41"
        x2="41"
        y2="51"
        stroke="currentColor"
        stroke-width="1.5"
      />

      <circle
        cx="41"
        cy="54"
        r="3"
        fill="white"
        stroke="currentColor"
        stroke-width="1.5"
      />

      <line
        x1="41"
        y1="57"
        x2="41"
        y2="64"
        stroke="currentColor"
        stroke-width="1.5"
      />

    </svg>

  `;


  symbol.addEventListener(
    "click",
    function () {

      openFuseEditor(
        fuse,
        owner,
        rerender
      );

    }
  );


  const fuseLabel =
    document.createElement(
      "div"
    );


  fuseLabel.className =
    "pdf-fuse-label";


  fuseLabel.textContent =
    fuse.label;


  item.append(
    remove,
    caption,
    symbol,
    fuseLabel
  );


  return item;

}


/* =========================================================
   BUILD FUSE SECTION
========================================================= */

function buildFuseSection(
  owner,
  rerender,
  className,
  heading
) {

  owner.fuseDetails =
    Array.isArray(
      owner.fuseDetails
    )
      ? owner.fuseDetails
      : [];


  const section =
    document.createElement(
      className ===
      "rack-fuse-section"

        ? "section"

        : "div"
    );


  section.className =
    className;


  const header =
    document.createElement(
      "div"
    );


  header.className =
    "fuse-builder-header";


  const title =
    document.createElement(
      "div"
    );


  title.innerHTML = `

    <span>
      ${escapeHtml(
        heading
      )}
    </span>

    <strong>
      ${escapeHtml(
        owner.name ||
        "CTR"
      )} Fuse Details
    </strong>

  `;


  const addFuse =
    document.createElement(
      "button"
    );


  addFuse.type =
    "button";


  addFuse.className =
    "add-conductor-btn";


  addFuse.textContent =
    "+ Add Fuse Point";


  addFuse.addEventListener(
    "click",
    function () {

      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      const fuse =
        createFusePoint(
          getNextFuseNumber(
            owner.fuseDetails
          )
        );


      owner.fuseDetails.push(
        fuse
      );


      rerender();

    }
  );


  header.append(
    title,
    addFuse
  );


  section.appendChild(
    header
  );


  if (
    owner.fuseDetails.length ===
    0
  ) {

    const empty =
      document.createElement(
        "p"
      );


    empty.className =
      "fuse-empty-state";


    empty.textContent =
      "No fuse points added yet.";


    section.appendChild(
      empty
    );


    return section;

  }


  const strip =
    document.createElement(
      "div"
    );


  strip.className =
    "pdf-fuse-strip";


  owner.fuseDetails.forEach(
    function (fuse) {

      strip.appendChild(
        createPdfFuseItem(
          fuse,
          owner,
          rerender
        )
      );

    }
  );


  section.appendChild(
    strip
  );


  return section;

}


/* =========================================================
   BUILD TERMINAL ROW
========================================================= */

function buildRowBlock(
  owner,
  row,
  terminalOwner,
  rerender,
  locationMode = false
) {

  const block =
    document.createElement(
      locationMode
        ? "div"
        : "section"
    );


  block.className =
    locationMode
      ? "location-row-block"
      : "dynamic-rack-row";


  const header =
    document.createElement(
      "div"
    );


  header.className =
    "dynamic-row-header";


  const title =
    document.createElement(
      locationMode
        ? "strong"
        : "div"
    );


  if (
    locationMode
  ) {

    title.textContent =
      `ROW ${row.label}`;

  }

  else {

    title.innerHTML = `

      <span>
        CTR TERMINAL ROW
      </span>

      <h4>
        ROW ${escapeHtml(
          row.label
        )}
      </h4>

    `;

  }


  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "row-header-actions";


  const addTerminal =
    document.createElement(
      "button"
    );


  addTerminal.type =
    "button";


  addTerminal.className =
    "add-conductor-btn";


  addTerminal.textContent =
    "+ Add Conductor";


  const removeRow =
    document.createElement(
      "button"
    );


  removeRow.type =
    "button";


  removeRow.className =
    "remove-row-btn";


  removeRow.textContent =
    "Remove Row";


  const strip =
    document.createElement(
      "div"
    );


  strip.className =
    "terminal-strip dynamic-strip";


  addTerminal.addEventListener(
    "click",
    function () {

      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      const newTerminal =
        createTerminal(
          row.terminals.length +
          1
        );


      row.terminals.push(
        newTerminal
      );


      strip.appendChild(
        createTerminalVisual(
          owner,
          row,
          newTerminal,
          terminalOwner
        )
      );


      strip.appendChild(
        createRemoveTerminalButton(
          row,
          newTerminal,
          rerender
        )
      );


      scheduleStationAccessApply();

    }
  );


  removeRow.addEventListener(
    "click",
    function () {

      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      if (
        owner.rows.length <=
        1
      ) {

        alert(
          "At least one row must remain."
        );

        return;

      }


      if (
        !confirm(
          `Remove Row ${row.label}?`
        )
      ) {

        return;

      }


      const index =
        owner.rows.indexOf(
          row
        );


      if (
        index !== -1
      ) {

        owner.rows.splice(
          index,
          1
        );


        relabelRows(
          owner
        );


        rerender();

      }

    }
  );


  actions.append(
    addTerminal,
    removeRow
  );


  header.append(
    title,
    actions
  );


  block.appendChild(
    header
  );


  row.terminals.forEach(
    function (terminal) {

      strip.appendChild(
        createTerminalVisual(
          owner,
          row,
          terminal,
          terminalOwner
        )
      );


      strip.appendChild(
        createRemoveTerminalButton(
          row,
          terminal,
          rerender
        )
      );

    }
  );


  block.appendChild(
    strip
  );


  return block;

}


/* =========================================================
   RENDER STATION CTR RACKS
========================================================= */

function renderStationCtrRacks() {

  if (
    !stationCtrRacksContainer
  ) {

    return;

  }


  const fragment =
    document.createDocumentFragment();


  stationCtrRacks.forEach(
    function (rack) {

      const card =
        document.createElement(
          "section"
        );


      card.className =
        "ctr-rack-card";


      card.dataset.rackId =
        rack.id;


      const header =
        document.createElement(
          "div"
        );


      header.className =
        "rack-header";


      const titleArea =
        document.createElement(
          "div"
        );


      titleArea.className =
        "station-rack-title-area";


      const label =
        document.createElement(
          "span"
        );
              label.textContent =
        "CTR RACK";


      const nameInput =
        document.createElement(
          "input"
        );


      nameInput.type =
        "text";


      nameInput.className =
        "station-rack-name-input";


      nameInput.value =
        rack.name;


      nameInput.placeholder =
        "Enter CTR Rack name";


      nameInput.addEventListener(
        "input",
        function () {

          rack.name =
            nameInput.value;

        }
      );


      const summary =
        document.createElement(
          "small"
        );


      summary.className =
        "ctr-lazy-summary";


      const rowCount =
        Array.isArray(
          rack.rows
        )
          ? rack.rows.length
          : 0;


      const terminalCount =
        getTerminalCount(
          rack
        );


      summary.textContent =
        `${rowCount} ${
          rowCount === 1
            ? "Row"
            : "Rows"
        } • ${terminalCount} Terminals`;


      titleArea.append(
        label,
        nameInput,
        summary
      );


      /* ===============================================
         RACK ACTIONS
      =============================================== */

      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "rack-header-actions";


      const remove =
        document.createElement(
          "button"
        );


      remove.type =
        "button";


      remove.className =
        "remove-rack-btn";


      remove.textContent =
        "Remove Rack";


      remove.addEventListener(
        "click",
        function () {

          if (
            !requireCurrentStationDraftEdit()
          ) {

            return;

          }


          if (
            stationCtrRacks.length <=
            1
          ) {

            alert(
              "At least one CTR Rack must remain."
            );

            return;

          }


          if (
            !confirm(
              `Remove ${rack.name}?`
            )
          ) {

            return;

          }


          const index =
            stationCtrRacks.indexOf(
              rack
            );


          if (
            index !== -1
          ) {

            stationCtrRacks.splice(
              index,
              1
            );


            renderStationCtrRacks();


            window
              .CTR_STATION_SVG_VIEW
              ?.refresh?.();

          }

        }
      );


      actions.appendChild(
        remove
      );


      header.append(
        titleArea,
        actions
      );


      card.appendChild(
        header
      );


      fragment.appendChild(
        card
      );

    }
  );


  stationCtrRacksContainer
    .replaceChildren(
      fragment
    );


  scheduleStationAccessApply();


  window
    .ctrGridControls
    ?.refresh?.();

}


/* =========================================================
   ADD STATION RACK
========================================================= */

addStationCtrRackButton
  ?.addEventListener(
    "click",
    function () {

      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      const rack =
        createCtrRack(
          getNextRackNumber(
            stationCtrRacks
          )
        );


      stationCtrRacks.push(
        rack
      );


      openedStationRacks.add(
        rack.id
      );


      renderStationCtrRacks();

    }
  );


/* =========================================================
   LOCATION BOX DRAWING
========================================================= */

function createLocationRackView(
  location
) {

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "location-racks-wrapper";


  location.fuseDetails =
    Array.isArray(
      location.fuseDetails
    )
      ? location.fuseDetails
      : [];


  location.rows =
    Array.isArray(
      location.rows
    )
      ? location.rows
      : [];


  if (
    location.rows.length ===
    0
  ) {

    location.rows = [

      createRow(
        "A",
        12
      ),

      createRow(
        "B",
        12
      ),

      createRow(
        "C",
        12
      ),

      createRow(
        "D",
        12
      )

    ];

  }


  wrapper.appendChild(
    buildFuseSection(
      location,
      renderConnectedEnds,
      "location-fuse-box",
      "FUSE DETAILS"
    )
  );


  const toolbar =
    document.createElement(
      "div"
    );


  toolbar.className =
    "systematic-terminal-toolbar location-terminal-toolbar";


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "systematic-toolbar-title";


  title.innerHTML = `

    <span>
      LOCATION BOX TERMINALS
    </span>

    <strong>
      Row & Column Structure
    </strong>

  `;


  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "systematic-grid-actions";


  const addRow =
    document.createElement(
      "button"
    );


  addRow.type =
    "button";


  addRow.className =
    "systematic-grid-btn";


  addRow.textContent =
    "+ Add Row";


  addRow.addEventListener(
    "click",
    function () {

      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      const columns =
        location.rows[0]
          ?.terminals
          ?.length ||
        12;


      location.rows.push(
        createRow(
          getNextUnusedRowLabel(
            location
          ),
          columns
        )
      );


      renderConnectedEnds();

    }
  );


  const addColumn =
    document.createElement(
      "button"
    );


  addColumn.type =
    "button";


  addColumn.className =
    "systematic-grid-btn";


  addColumn.textContent =
    "+ Add Column";


  addColumn.addEventListener(
    "click",
    function () {

      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      location.rows.forEach(
        function (row) {

          row.terminals.push(
            createTerminal(
              row.terminals.length +
              1
            )
          );


          renumberTerminals(
            row
          );

        }
      );


      renderConnectedEnds();

    }
  );


  const removeRow =
    document.createElement(
      "button"
    );


  removeRow.type =
    "button";


  removeRow.className =
    "systematic-grid-btn systematic-remove-btn";


  removeRow.textContent =
    "− Remove Row";


  removeRow.addEventListener(
    "click",
    function () {

      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      if (
        location.rows.length <=
        1
      ) {

        alert(
          "At least one terminal row must remain."
        );

        return;

      }


      if (
        !confirm(
          "Remove last row?"
        )
      ) {

        return;

      }


      location.rows.pop();


      relabelRows(
        location
      );


      renderConnectedEnds();

    }
  );


  const removeColumn =
    document.createElement(
      "button"
    );


  removeColumn.type =
    "button";


  removeColumn.className =
    "systematic-grid-btn systematic-remove-btn";


  removeColumn.textContent =
    "− Remove Column";


  removeColumn.addEventListener(
    "click",
    function () {

      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      const columns =
        location.rows[0]
          ?.terminals
          ?.length ||
        0;


      if (
        columns <= 1
      ) {

        alert(
          "At least one terminal column must remain."
        );

        return;

      }


      if (
        !confirm(
          `Remove Column ${columns}?`
        )
      ) {

        return;

      }


      location.rows.forEach(
        function (row) {

          row.terminals.pop();


          renumberTerminals(
            row
          );

        }
      );


      renderConnectedEnds();

    }
  );


  actions.append(
    addRow,
    addColumn,
    removeRow,
    removeColumn
  );


  toolbar.append(
    title,
    actions
  );


  wrapper.appendChild(
    toolbar
  );


  location.rows.forEach(
    function (row) {

      wrapper.appendChild(
        buildRowBlock(
          location,
          row,
          "location",
          renderConnectedEnds,
          true
        )
      );

    }
  );


  return wrapper;

}


/* =========================================================
   RENDER CONNECTED ENDS
========================================================= */

function renderConnectedEnds() {

  if (
    !connectedEndsContainer
  ) {

    return;

  }


  const fragment =
    document.createDocumentFragment();


  connectedEnds.forEach(
    function (end) {

      const card =
        document.createElement(
          "section"
        );


      card.className =
        "connected-end-card";


      const header =
        document.createElement(
          "div"
        );


      header.className =
        "connected-end-header";


      const titleArea =
        document.createElement(
          "div"
        );


      const label =
        document.createElement(
          "span"
        );


      label.textContent =
        "CONNECTED END";


      const endName =
        document.createElement(
          "input"
        );


      endName.type =
        "text";


      endName.className =
        "end-name-input";


      endName.value =
        end.name;


      endName.placeholder =
        "Enter Connected End name";


      endName.addEventListener(
        "input",
        function () {

          end.name =
            endName.value;

        }
      );


      const summary =
        document.createElement(
          "small"
        );


      summary.className =
        "ctr-lazy-summary";


      const locationCount =
        Array.isArray(
          end.locations
        )
          ? end.locations.length
          : 0;


      summary.textContent =
        `${locationCount} ${
          locationCount === 1
            ? "Location Box"
            : "Location Boxes"
        }`;


      titleArea.append(
        label,
        endName,
        summary
      );


      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "end-header-actions";


      const addLocation =
        document.createElement(
          "button"
        );


      addLocation.type =
        "button";


      addLocation.className =
        "builder-action-btn";


      addLocation.textContent =
        "+ Add Location Box";


      addLocation.addEventListener(
        "click",
        function () {

          if (
            !requireCurrentStationDraftEdit()
          ) {

            return;

          }


          end.locations =
            Array.isArray(
              end.locations
            )
              ? end.locations
              : [];


          const location =
            createLocation(
              end
            );


          end.locations.push(
            location
          );


          renderConnectedEnds();


          window
            .CTR_LOCATION_SVG_VIEW
            ?.refresh?.();

        }
      );


      const removeEnd =
        document.createElement(
          "button"
        );


      removeEnd.type =
        "button";


      removeEnd.className =
        "remove-rack-btn";


      removeEnd.textContent =
        "Remove End";


      removeEnd.addEventListener(
        "click",
        function () {

          if (
            !requireCurrentStationDraftEdit()
          ) {

            return;

          }


          if (
            !confirm(
              `Remove ${end.name} and all Location Boxes under it?`
            )
          ) {

            return;

          }


          const index =
            connectedEnds.indexOf(
              end
            );


          if (
            index !== -1
          ) {

            connectedEnds.splice(
              index,
              1
            );


            renderConnectedEnds();


            window
              .CTR_LOCATION_SVG_VIEW
              ?.refresh?.();

          }

        }
      );


      actions.append(
        addLocation,
        removeEnd
      );


      header.append(
        titleArea,
        actions
      );


      card.appendChild(
        header
      );


      const locationGrid =
        document.createElement(
          "div"
        );


      locationGrid.className =
        "dynamic-location-grid";


      if (
        !Array.isArray(
          end.locations
        ) ||
        end.locations.length ===
        0
      ) {

        const empty =
          document.createElement(
            "div"
          );


        empty.className =
          "location-empty-state";


        empty.textContent =
          "No Location Boxes added yet.";


        locationGrid.appendChild(
          empty
        );

      }

      else {

        end.locations.forEach(
          function (location) {

            const locationCard =
              document.createElement(
                "article"
              );


            locationCard.className =
              "dynamic-location-card";


            const locationHeader =
              document.createElement(
                "div"
              );


            locationHeader.className =
              "location-box-header";


            const locationTitle =
              document.createElement(
                "div"
              );


            locationTitle.className =
              "location-box-title-area";


            const locationLabel =
              document.createElement(
                "span"
              );


            locationLabel.textContent =
              "LOCATION BOX";


            const locationName =
              document.createElement(
                "input"
              );


            locationName.type =
              "text";


            locationName.className =
              "location-name-input";


            locationName.value =
              location.name;


            locationName.placeholder =
              "Enter Location Box name";


            locationName.addEventListener(
              "input",
              function () {

                location.name =
                  locationName.value;

              }
            );


            const locationSummary =
              document.createElement(
                "small"
              );


            locationSummary.className =
              "ctr-lazy-summary";


            const rowCount =
              Array.isArray(
                location.rows
              )
                ? location.rows.length
                : 0;


            const terminalCount =
              getTerminalCount(
                location
              );


            locationSummary.textContent =
              `${rowCount} ${
                rowCount === 1
                  ? "Row"
                  : "Rows"
              } • ${terminalCount} Terminals`;


            locationTitle.append(
              locationLabel,
              locationName,
              locationSummary
            );


            const locationActions =
              document.createElement(
                "div"
              );


            locationActions.className =
              "end-header-actions";


            const removeLocation =
              document.createElement(
                "button"
              );


            removeLocation.type =
              "button";


            removeLocation.className =
              "remove-rack-btn";


            removeLocation.textContent =
              "Remove Location Box";


            removeLocation.addEventListener(
              "click",
              function () {

                if (
                  !requireCurrentStationDraftEdit()
                ) {

                  return;

                }


                if (
                  !confirm(
                    `Remove ${location.name}?`
                  )
                ) {

                  return;

                }


                const index =
                  end.locations.indexOf(
                    location
                  );


                if (
                  index !== -1
                ) {

                  end.locations.splice(
                    index,
                    1
                  );


                  renderConnectedEnds();


                  window
                    .CTR_LOCATION_SVG_VIEW
                    ?.refresh?.();

                }

              }
            );


            locationActions.appendChild(
              removeLocation
            );


            locationHeader.append(
              locationTitle,
              locationActions
            );


            locationCard.appendChild(
              locationHeader
            );


            locationGrid.appendChild(
              locationCard
            );

          }
        );

      }


      card.appendChild(
        locationGrid
      );


      fragment.appendChild(
        card
      );

    }
  );


  connectedEndsContainer
    .replaceChildren(
      fragment
    );


  scheduleStationAccessApply();


  window
    .ctrGridControls
    ?.refresh?.();

}


/* =========================================================
   ADD CONNECTED END
========================================================= */

addConnectedEndButton
  ?.addEventListener(
    "click",
    function () {

      if (
        !requireCurrentStationDraftEdit()
      ) {

        return;

      }


      const end =
        createConnectedEnd();


      connectedEnds.push(
        end
      );


      openedConnectedEnds.add(
        end.id
      );


      renderConnectedEnds();

    }
  );
  /* =========================================================
   NORMALIZE SAVED RACK
========================================================= */

function normalizeRack(
  source,
  fallbackNumber
) {

  const rack =
    (
      source &&
      typeof source ===
      "object"
    )

      ? source

      : {};


  rack.id =
    rack.id ||
    createId();


  rack.autoNumber =
    Number(
      rack.autoNumber
    ) ||
    fallbackNumber;


  rack.name =
    rack.name ||
    `K${rack.autoNumber}`;


  rack.fuseDetails =
    Array.isArray(
      rack.fuseDetails
    )
      ? rack.fuseDetails
      : [];


  rack.rows =
    Array.isArray(
      rack.rows
    )
      ? rack.rows
      : [];


  rack.fuseDetails.forEach(
    function (
      fuse,
      index
    ) {

      fuse.id =
        fuse.id ||
        createId();


      fuse.label =
        fuse.label ||
        `F${index + 1}`;


      fuse.details =
        fuse.details ||
        "";

    }
  );


  rack.rows.forEach(
    function (
      row,
      rowIndex
    ) {

      row.id =
        row.id ||
        createId();


      row.label =
        row.label ||
        getRowLabel(
          rowIndex
        );


      row.terminals =
        Array.isArray(
          row.terminals
        )
          ? row.terminals
          : [];


      row.terminals.forEach(
        function (
          terminal,
          terminalIndex
        ) {

          terminal.id =
            terminal.id ||
            createId();


          terminal.number =
            String(
              terminalIndex + 1
            )
              .padStart(
                2,
                "0"
              );


          terminal.status =
            terminal.status ||
            "SPARE";


          terminal.conductorStyle =
            terminal.conductorStyle ||
            "STRAIGHT";


          terminal.particular =
            terminal.particular ||
            "";


          terminal.locationBox =
            terminal.locationBox ||
            "";


          terminal.locationTerminal =
            terminal.locationTerminal ||
            "";


          terminal.remarks =
            terminal.remarks ||
            "";

        }
      );

    }
  );


  return rack;

}


/* =========================================================
   APPLY SAVED DRAFT DATA
========================================================= */

function applyDraftData(data) {

  if (
    !data ||
    typeof data !==
    "object"
  ) {

    return;

  }


  /* STATION RACKS */

  if (
    Array.isArray(
      data.stationCtrRacks
    )
  ) {

    const racks =
      data.stationCtrRacks.map(
        function (
          rack,
          index
        ) {

          return normalizeRack(
            rack,
            index + 1
          );

        }
      );


    stationCtrRacks.splice(
      0,
      stationCtrRacks.length,
      ...racks
    );

  }


  /* CONNECTED ENDS */

  if (
    Array.isArray(
      data.connectedEnds
    )
  ) {

    const ends =
      data.connectedEnds.map(
        function (
          sourceEnd,
          endIndex
        ) {

          const end =
            sourceEnd &&
            typeof sourceEnd ===
            "object"

              ? sourceEnd

              : {};


          end.id =
            end.id ||
            createId();


          end.autoNumber =
            Number(
              end.autoNumber
            ) ||
            endIndex + 1;


          end.name =
            end.name ||
            `Connected End ${end.autoNumber}`;


          end.locations =
            Array.isArray(
              end.locations
            )
              ? end.locations
              : [];


          end.locations =
            end.locations.map(
              function (
                sourceLocation,
                locationIndex
              ) {

                const location =
                  sourceLocation &&
                  typeof sourceLocation ===
                  "object"

                    ? sourceLocation

                    : {};


                location.id =
                  location.id ||
                  createId();


                location.autoNumber =
                  Number(
                    location.autoNumber
                  ) ||
                  locationIndex + 1;


                location.name =
                  location.name ||
                  `Location Box ${location.autoNumber}`;


                let fuses =
                  Array.isArray(
                    location.fuseDetails
                  )

                    ? location.fuseDetails

                    : [];


                let rows =
                  Array.isArray(
                    location.rows
                  )

                    ? location.rows

                    : [];


                /* =================================================
                   MIGRATE OLD LOCATION K-RACK FORMAT
                ================================================= */

                if (
                  Array.isArray(
                    location.racks
                  )
                ) {

                  location.racks.forEach(
                    function (legacyRack) {

                      if (
                        fuses.length ===
                          0 &&
                        Array.isArray(
                          legacyRack
                            ?.fuseDetails
                        )
                      ) {

                        fuses.push(
                          ...legacyRack
                            .fuseDetails
                        );

                      }


                      if (
                        rows.length ===
                          0 &&
                        Array.isArray(
                          legacyRack
                            ?.rows
                        )
                      ) {

                        rows.push(
                          ...legacyRack.rows
                        );

                      }

                    }
                  );

                }


                if (
                  rows.length ===
                  0
                ) {

                  rows = [

                    createRow(
                      "A",
                      12
                    ),

                    createRow(
                      "B",
                      12
                    ),

                    createRow(
                      "C",
                      12
                    ),

                    createRow(
                      "D",
                      12
                    )

                  ];

                }


                const normalized =
                  normalizeRack(
                    {
                      fuseDetails:
                        fuses,

                      rows:
                        rows
                    },
                    1
                  );


                location.fuseDetails =
                  normalized.fuseDetails;


                location.rows =
                  normalized.rows;


                relabelRows(
                  location
                );


                delete location.racks;


                return location;

              }
            );


          return end;

        }
      );


    connectedEnds.splice(
      0,
      connectedEnds.length,
      ...ends
    );

  }

}


/* =========================================================
   AUTH USER
========================================================= */

async function getCurrentUser() {

  const {
    data: sessionData,
    error: sessionError
  } =
    await supabaseClient
      .auth
      .getSession();


  if (
    !sessionError &&
    sessionData?.session?.user
  ) {

    return sessionData.session.user;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .getUser();


  if (
    error ||
    !data?.user
  ) {

    throw new Error(
      "Login session not available."
    );

  }


  return data.user;

}


/* =========================================================
   SAVE ALTERATION WORKING COPY
========================================================= */

async function saveAlterationDraftSnapshot(
  draftData,
  savedAt
) {

  if (
    !currentAlterationId
  ) {

    throw new Error(
      "Alteration ID is missing."
    );

  }


  const {
    data: alterationStatus,
    error: alterationError
  } =
    await supabaseClient
      .rpc(
        "save_ctr_alteration_draft",
        {

          p_alteration_id:
            currentAlterationId,

          p_draft_data:
            draftData

        }
      );


  if (
    alterationError
  ) {

    console.error(
      "Alteration RPC save error:",
      alterationError
    );


    throw alterationError;

  }


  /*
     Re-read saved alteration working copy.

     This confirms that data was really persisted before
     showing a success message.
  */

  const {
    data: verification,
    error: verificationError
  } =
    await supabaseClient
      .from(
        "alteration_drafts"
      )
      .select(`
        alteration_id,
        station_id,
        status,
        draft_data,
        updated_at
      `)
      .eq(
        "alteration_id",
        currentAlterationId
      )
      .maybeSingle();


  if (
    verificationError
  ) {

    throw verificationError;

  }


  if (
    !verification
  ) {

    throw new Error(
      "Alteration was sent for saving but the saved working copy could not be verified."
    );

  }


  if (
    verification.station_id !==
    currentStationId
  ) {

    throw new Error(
      "Saved alteration belongs to a different station."
    );

  }


  const verifiedSavedAt =
    verification
      .draft_data
      ?.savedAt ||
    null;


  if (
    verifiedSavedAt !==
    savedAt
  ) {

    throw new Error(
      "Alteration save was not persisted. Please do not leave this page and try Save Draft again."
    );

  }


  currentAlterationStatus =
    verification.status ||
    alterationStatus ||
    currentAlterationStatus ||
    "DRAFT";


  alterationContextLoaded =
    true;


  console.log(
    "CTR alteration draft saved and verified:",
    {

      alterationId:
        currentAlterationId,

      stationId:
        currentStationId,

      status:
        currentAlterationStatus,

      savedAt:
        verifiedSavedAt

    }
  );


  return verification;

}


/* =========================================================
   SAVE CTR DRAFT
========================================================= */

async function saveCtrDraft() {

  if (
    !requireCurrentStationDraftEdit()
  ) {

    return;

  }


  if (
    !currentStationId
  ) {

    alert(
      "Station ID is missing."
    );

    return;

  }


  if (
    saveCtrDraftButton
  ) {

    saveCtrDraftButton.disabled =
      true;


    saveCtrDraftButton.textContent =
      "Saving...";

  }


  setDraftStatus(
    isAlterationMode
      ? "Saving alteration draft..."
      : "Saving draft..."
  );


  try {

    /*
       If terminal editor is still open,
       first copy visible values into CTR data.
    */

    if (
      selectedTerminal &&
      terminalEditor
        ?.classList
        .contains(
          "open"
        )
    ) {

      saveTerminalData();

    }


    /*
       Same rule for fuse editor.
    */

    if (
      selectedFuse &&
      fuseEditor
        ?.classList
        .contains(
          "open"
        )
    ) {

      saveFuseData();

    }


    const user =
      await getCurrentUser();


    const savedAt =
      new Date()
        .toISOString();


    const draftData = {

      schemaVersion:
        2,

      stationCtrRacks:
        cloneCtrData(
          stationCtrRacks
        ),

      connectedEnds:
        cloneCtrData(
          connectedEnds
        ),

      savedAt:
        savedAt

    };


    /* =====================================================
       ALTERATION MODE

       IMPORTANT:
       Approved V1 and normal ctr_drafts are NOT touched.
    ===================================================== */

    if (
      isAlterationMode
    ) {

      const verification =
        await saveAlterationDraftSnapshot(
          draftData,
          savedAt
        );


      currentAlterationStatus =
        verification.status ||
        currentAlterationStatus;


      scheduleStationAccessApply();


      setDraftStatus(
        `Alteration saved: ${new Date(
          verification.updated_at ||
          savedAt
        ).toLocaleString()}`
      );


      alert(
        "CTR Alteration Draft saved successfully."
      );


      return;

    }


    /* =====================================================
       NORMAL INITIAL CTR SAVE
    ===================================================== */

    const {
      error
    } =
      await supabaseClient
        .from(
          "ctr_drafts"
        )
        .upsert(
          {

            station_id:
              currentStationId,

            draft_data:
              draftData,

            status:
              "DRAFT",

            last_saved_by:
              user.id

          },
          {

            onConflict:
              "station_id"

          }
        );


    if (
      error
    ) {

      throw error;

    }


    const {
      data:
        stationStatus,

      error:
        statusError
    } =
      await supabaseClient
        .rpc(
          "mark_station_as_draft",
          {

            p_station_id:
              currentStationId

          }
        );


    if (
      statusError
    ) {

      throw statusError;

    }


    currentStationWorkflowStatus =
      typeof stationStatus ===
      "string"

        ? stationStatus

        : "DRAFT";


    stationWorkflowStatusLoaded =
      true;


    setDraftStatus(
      `Saved: ${new Date(
        savedAt
      ).toLocaleString()}`
    );


    scheduleStationAccessApply();


    alert(
      "CTR Draft saved successfully."
    );

  }

  catch (error) {

    console.error(
      isAlterationMode
        ? "CTR alteration save error:"
        : "CTR draft save error:",
      error
    );


    setDraftStatus(
      isAlterationMode
        ? "Alteration save failed"
        : "Draft save failed"
    );


    alert(
      error.message ||
      (
        isAlterationMode
          ? "CTR Alteration Draft could not be saved."
          : "CTR Draft could not be saved."
      )
    );

  }

  finally {

    if (
      saveCtrDraftButton
    ) {

      saveCtrDraftButton.disabled =
        false;


      saveCtrDraftButton.textContent =
        "Save Draft";

    }

  }

}
/* =========================================================
   LOAD DRAFT
========================================================= */

async function loadCtrDraft() {

  if (
    !currentStationId
  ) {

    setDraftStatus(
      "Station ID missing"
    );

    return;

  }


  setDraftStatus(
    isAlterationMode
      ? "Loading alteration working copy..."
      : "Loading CTR data..."
  );


  try {

    /* =====================================================
       ALTERATION MODE
    ===================================================== */

    if (
      isAlterationMode
    ) {

      const alterationData =
        await loadCurrentAlterationContext();


      if (
        !alterationData?.draft_data ||
        typeof alterationData.draft_data !==
        "object"
      ) {

        throw new Error(
          "Alteration working copy has no CTR snapshot."
        );

      }


      applyDraftData(
        cloneCtrData(
          alterationData.draft_data
        )
      );


      const savedDate =
        alterationData.updated_at

          ? new Date(
              alterationData.updated_at
            )

          : null;


      setDraftStatus(
        savedDate

          ? `Alteration draft loaded: ${savedDate.toLocaleString()}`

          : "Alteration draft loaded"
      );


      console.log(
        "CTR alteration working copy loaded:",
        {

          alterationId:
            currentAlterationId,

          stationId:
            currentStationId,

          status:
            currentAlterationStatus,

          savedAt:
            alterationData
              .draft_data
              ?.savedAt ||
            null

        }
      );


      return;

    }


    /* =====================================================
       NORMAL INITIAL CTR DRAFT
    ===================================================== */

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "ctr_drafts"
        )
        .select(
          `
            draft_data,
            status,
            updated_at
          `
        )
        .eq(
          "station_id",
          currentStationId
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

      setDraftStatus(
        "No saved draft yet"
      );

      return;

    }


    applyDraftData(
      cloneCtrData(
        data.draft_data
      )
    );


    if (
      data.updated_at
    ) {

      setDraftStatus(
        `Loaded: ${new Date(
          data.updated_at
        ).toLocaleString()}`
      );

    }

    else {

      setDraftStatus(
        "Draft loaded"
      );

    }

  }

  catch (error) {

    console.error(
      isAlterationMode
        ? "CTR alteration load error:"
        : "CTR draft load error:",
      error
    );


    setDraftStatus(
      isAlterationMode
        ? "Unable to load alteration draft"
        : "Unable to load draft"
    );


    throw error;

  }

}


/* =========================================================
   RESET DRAFT
========================================================= */

async function resetCtrDraft() {

  /*
     Alteration mode me blank reset allow nahi hai.

     Alteration hamesha approved CTR ki copied working
     version hoti hai.
  */

  if (
    isAlterationMode
  ) {

    alert(
      "Alteration drafts cannot be reset to a blank CTR. Edit the copied approved CTR instead."
    );

    return;

  }


  if (
    !requireCurrentStationDraftEdit()
  ) {

    return;

  }


  if (
    !confirm(
      "Reset this CTR draft?"
    )
  ) {

    return;

  }


  try {

    const user =
      await getCurrentUser();


    const freshRack =
      createCtrRack(1);


    const resetAt =
      new Date()
        .toISOString();


    const draftData = {

      schemaVersion:
        2,

      stationCtrRacks: [
        freshRack
      ],

      connectedEnds:
        [],

      savedAt:
        resetAt

    };


    const {
      error
    } =
      await supabaseClient
        .from(
          "ctr_drafts"
        )
        .upsert(
          {

            station_id:
              currentStationId,

            draft_data:
              draftData,

            status:
              "INITIAL_SETUP",

            last_saved_by:
              user.id

          },
          {

            onConflict:
              "station_id"

          }
        );


    if (
      error
    ) {

      throw error;

    }


    stationCtrRacks.splice(
      0,
      stationCtrRacks.length,
      freshRack
    );


    connectedEnds.splice(
      0,
      connectedEnds.length
    );


    openedStationRacks.clear();

    openedConnectedEnds.clear();

    openedLocationBoxes.clear();


    renderStationCtrRacks();

    renderConnectedEnds();


    setDraftStatus(
      "Draft reset"
    );


    alert(
      "CTR Draft reset successfully."
    );

  }

  catch (error) {

    console.error(
      "Reset error:",
      error
    );


    alert(
      error.message ||
      "Draft could not be reset."
    );

  }

}


/* =========================================================
   INITIAL DATA ENTRY / ALTERATION EDIT ENTRY
========================================================= */

function openInitialDataEntryMode() {

  if (
    !requireCurrentStationDraftEdit()
  ) {

    return;

  }


  stationCtrRacksContainer
    ?.scrollIntoView(
      {

        behavior:
          "smooth",

        block:
          "start"

      }
    );

}

/* =========================================================
   SUBMIT CTR ALTERATION
========================================================= */

let submitAlterationButton = null;


function ensureSubmitAlterationButton() {

  if (
    !isAlterationMode ||
    !saveCtrDraftButton
  ) {
    return;
  }


  if (
    document.getElementById(
      "submitAlterationButton"
    )
  ) {

    submitAlterationButton =
      document.getElementById(
        "submitAlterationButton"
      );

    return;

  }


  submitAlterationButton =
    document.createElement(
      "button"
    );


  submitAlterationButton.id =
    "submitAlterationButton";


  submitAlterationButton.type =
    "button";


  submitAlterationButton.textContent =
    "Submit Alteration";


  submitAlterationButton.className =
    saveCtrDraftButton.className;


  submitAlterationButton.style.marginLeft =
    "10px";


  saveCtrDraftButton.insertAdjacentElement(
    "afterend",
    submitAlterationButton
  );


  submitAlterationButton.addEventListener(
    "click",
    submitCtrAlteration
  );

}


async function submitCtrAlteration() {

  if (
    !isAlterationMode ||
    !currentAlterationId
  ) {

    alert(
      "Alteration context is missing."
    );

    return;

  }


  if (
    ![
      "DRAFT",
      "RETURNED_FOR_CORRECTION"
    ].includes(
      currentAlterationStatus
    )
  ) {

    alert(
      "This alteration is no longer available for submission."
    );

    return;

  }


  if (
    !confirm(
      "Submit this CTR alteration for officer review? After submission it will become read-only."
    )
  ) {

    return;

  }


  submitAlterationButton.disabled =
    true;


  submitAlterationButton.textContent =
    "Submitting...";


  try {

    /* Commit any currently open editor first */

    if (
      selectedTerminal &&
      terminalEditor
        ?.classList
        .contains(
          "open"
        )
    ) {

      saveTerminalData();

    }


    if (
      typeof selectedFuse !==
        "undefined" &&
      selectedFuse &&
      fuseEditor
        ?.classList
        .contains(
          "open"
        )
    ) {

      saveFuseData();

    }


    /* Save latest snapshot before submission */

    const savedAt =
      new Date()
        .toISOString();


    const draftData = {

      schemaVersion:
        2,

      stationCtrRacks:
        cloneCtrData(
          stationCtrRacks
        ),

      connectedEnds:
        cloneCtrData(
          connectedEnds
        ),

      savedAt:
        savedAt

    };


    await saveAlterationDraftSnapshot(
      draftData,
      savedAt
    );


    /* Submit workflow */

    const {
      data,
      error
    } =
      await supabaseClient
        .rpc(
          "submit_ctr_alteration",
          {

            p_alteration_id:
              currentAlterationId

          }
        );


    if (
      error
    ) {

      throw error;

    }


    currentAlterationStatus =
      data ||
      "SUBMITTED";


    alterationContextLoaded =
      true;


    applyStationBuilderAccessMode();


    submitAlterationButton.disabled =
      true;


    submitAlterationButton.textContent =
      "Submitted";


    setDraftStatus(
      "Alteration submitted for officer review."
    );


    alert(
      "CTR Alteration submitted successfully."
    );

  }

  catch (error) {

    console.error(
      "Alteration submit error:",
      error
    );


    submitAlterationButton.disabled =
      false;


    submitAlterationButton.textContent =
      "Submit Alteration";


    alert(
      error.message ||
      "CTR Alteration could not be submitted."
    );

  }

}
/* =========================================================
   EVENTS
========================================================= */

initialDataEntryButton
  ?.addEventListener(
    "click",
    openInitialDataEntryMode
  );


saveCtrDraftButton
  ?.addEventListener(
    "click",
    saveCtrDraft
  );


resetCtrDraftButton
  ?.addEventListener(
    "click",
    resetCtrDraft
  );


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeStationBuilder() {

  setDraftStatus(
    isAlterationMode
      ? "Loading CTR alteration..."
      : "Loading station CTR..."
  );


  try {

    /*
       Station workflow status pehle load hoga.

       IMPORTANT:
       Alteration mode me station APPROVED reh sakta hai.
       Edit permission alteration draft status se decide hogi.
    */

    await loadCurrentStationWorkflowStatus();


    /*
       loadCtrDraft() automatically decide karega:

       ALTERATION MODE
       -> alteration_drafts

       NORMAL INITIAL MODE
       -> ctr_drafts
    */

    await loadCtrDraft();

    ensureSubmitAlterationButton();
    /*
       Browser ko ek paint cycle dena useful hai,
       especially large CTR drawings ke liye.
    */

    await new Promise(
      function (resolve) {

        requestAnimationFrame(
          function () {

            requestAnimationFrame(
              resolve
            );

          }
        );

      }
    );


    /*
       Heavy drawings default collapsed/open-state reset.
    */

    openedStationRacks.clear();

    openedConnectedEnds.clear();

    openedLocationBoxes.clear();


    renderStationCtrRacks();

    renderConnectedEnds();


    scheduleStationAccessApply();


    console.log(
      "CTR station loaded:",
      {

        station:
          currentStationId,

        mode:
          isAlterationMode
            ? "ALTERATION"
            : "INITIAL",

        alterationId:
          currentAlterationId,

        alterationStatus:
          currentAlterationStatus,

        racks:
          stationCtrRacks.length,

        ends:
          connectedEnds.length,

        stationStatus:
          currentStationWorkflowStatus,

        editAllowed:
          canEditCurrentStationDraft()

      }
    );

  }

  catch (error) {

    console.error(
      "Station CTR initialization error:",
      error
    );


    setDraftStatus(
      isAlterationMode
        ? "Unable to load CTR alteration"
        : "Unable to load station CTR"
    );


    renderStationCtrRacks();

    renderConnectedEnds();


    scheduleStationAccessApply();

  }

}


/* =========================================================
   START
========================================================= */

initializeStationBuilder();
/* =========================================================
   ALTERATION APPROVAL PDF REGISTRATION
========================================================= */

(() => {

  "use strict";


  const STORAGE_BUCKET =
    "ctr-workflow-documents";


  function getApprovalWorkflowId() {

    return (
      new URLSearchParams(
        window.location.search
      )
        .get(
          "workflow"
        ) || ""
    ).trim();

  }


  async function calculateGeneratedPdfSha256(
    blob
  ) {

    const buffer =
      await blob.arrayBuffer();


    const digest =
      await window.crypto.subtle.digest(
        "SHA-256",
        buffer
      );


    return Array
      .from(
        new Uint8Array(
          digest
        )
      )
      .map(
        byte =>
          byte
            .toString(16)
            .padStart(
              2,
              "0"
            )
      )
      .join("");

  }


  function isExistingStorageObjectError(
    error
  ) {

    const message =
      String(
        error?.message || ""
      )
        .toLowerCase();


    return (
      String(
        error?.statusCode || ""
      ) === "409"
      ||
      message.includes(
        "already exists"
      )
      ||
      message.includes(
        "duplicate"
      )
    );

  }


  async function registerGeneratedApprovalPdf(
    event
  ) {

    const workflowId =
      getApprovalWorkflowId();


    /*
       Only run when CTR was opened from
       Pending Approvals alteration workflow.
    */

    if (
      !workflowId ||
      !currentAlterationId ||
      !isAlterationMode
    ) {

      return;

    }


    const blob =
      event?.detail?.blob;


    if (
      !(blob instanceof Blob)
    ) {

      return;

    }


    try {

      setDraftStatus(
        "Registering approval PDF..."
      );


      const pdfHash =
        await calculateGeneratedPdfSha256(
          blob
        );


      const storagePath =
        (
          workflowId +
          "/generated/" +
          pdfHash +
          ".pdf"
        );


      /* ===============================================
         PRIVATE STORAGE
      =============================================== */

      const {
        error: uploadError
      } =
        await supabaseClient
          .storage
          .from(
            STORAGE_BUCKET
          )
          .upload(
            storagePath,
            blob,
            {

              contentType:
                "application/pdf",

              cacheControl:
                "3600",

              upsert:
                false

            }
          );


      if (
        uploadError &&
        !isExistingStorageObjectError(
          uploadError
        )
      ) {

        throw uploadError;

      }


      /* ===============================================
         DATABASE REGISTRATION
      =============================================== */

      const {
        data,
        error
      } =
        await supabaseClient.rpc(
          "register_generated_ctr_pdf",
          {

            p_workflow_id:
              workflowId,

            p_storage_path:
              storagePath,

            p_document_sha256:
              pdfHash

          }
        );


      if (error) {

        throw error;

      }


      console.log(
        "CTR approval PDF registered:",
        data
      );


      setDraftStatus(
        "Approval PDF registered"
      );


      alert(
        "CTR PDF generated and registered successfully."
      );


      window.location.href =
        (
          "workflow-sign.html?workflow=" +
          encodeURIComponent(
            workflowId
          )
        );

    }

    catch (error) {

      console.error(
        "CTR approval PDF registration error:",
        error
      );


      setDraftStatus(
        "Approval PDF registration failed"
      );


      alert(
        error?.message ||
        "CTR PDF could not be registered for approval."
      );

    }

  }


  window.addEventListener(
    "ctr-pdf-generated",
    registerGeneratedApprovalPdf
  );

})();