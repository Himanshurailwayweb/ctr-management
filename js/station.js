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

    }
  );

}


function relabelRows(rack) {

  rack.rows.forEach(
    function (
      row,
      index
    ) {

      row.label =
        getRowLabel(
          index
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
   CAN EDIT?
========================================================= */

function canEditCurrentStationDraft() {

  if (
    !currentStationId ||
    !stationWorkflowStatusLoaded ||
    !window.ctrAccess?.ready
  ) {

    return false;

  }


  if (
    !EDITABLE_STATION_STATUSES.includes(
      currentStationWorkflowStatus
    )
  ) {

    return false;

  }


  try {

    if (
      window.ctrAccess
        .isSystemAdmin?.()
    ) {

      return true;

    }


    return Boolean(
      window.ctrAccess
        .hasStationRole?.(
          currentStationId,
          STATION_DRAFT_EDITOR_ROLES
        )
    );

  }
  catch (error) {

    console.error(
      "Station edit access error:",
      error
    );


    return false;

  }

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
    currentStationWorkflowStatus &&
    !EDITABLE_STATION_STATUSES.includes(
      currentStationWorkflowStatus
    )
  ) {

    message =
      "This station is no longer in editable draft stage.";

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


    initialDataEntryButton.textContent =

      currentStationWorkflowStatus ===
      "DRAFT"

        ? "Continue Data Entry"

        : "Initial Data Entry";

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

      /*
         Open/Close buttons must remain usable
         even in view-only mode.
      */

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


  selectedTerminal.particular =
    circuitParticular
      ?.value
      ?.trim() ||
    "";


  selectedTerminal.locationBox =
    locationBox
      ?.value
      ?.trim() ||
    "";


  selectedTerminal.locationTerminal =
    locationTerminal
      ?.value
      ?.trim() ||
    "";


  selectedTerminal.status =
    terminalStatus
      ?.value ||
    "SPARE";


  selectedTerminal.remarks =
    terminalRemarks
      ?.value
      ?.trim() ||
    "";


  if (
    selectedTerminalOwner ===
    "location"
  ) {

    renderConnectedEnds();

  }
  else {

    renderStationCtrRacks();

  }


  closeEditor();

}


closeTerminalEditorButton
  ?.addEventListener(
    "click",
    closeEditor
  );


cancelTerminalEditButton
  ?.addEventListener(
    "click",
    closeEditor
  );


saveTerminalPreviewButton
  ?.addEventListener(
    "click",
    saveTerminalData
  );


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
   RENDER STATION CTR RACKS - LAZY
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


      /* HEADER */

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


      summary.textContent =
        `${rack.rows.length} Rows • ${getTerminalCount(
          rack
        )} Terminals • ${rack.fuseDetails.length} Fuse Points`;


      titleArea.append(
        label,
        nameInput,
        summary
      );


      /* ACTIONS */

      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "rack-header-actions";


      const status =
        document.createElement(
          "div"
        );


      status.className =
        "rack-status";


      status.textContent =
        currentStationWorkflowStatus ===
        "DRAFT"

          ? "Draft"

          : "Initial Setup";


      const toggle =
        document.createElement(
          "button"
        );


      toggle.type =
        "button";


      toggle.className =
        "builder-action-btn ctr-view-toggle";


      toggle.textContent =
        isRackOpen(rack)
          ? "Close Rack"
          : "Open Rack";


      toggle.addEventListener(
        "click",
        function () {

          if (
            isRackOpen(
              rack
            )
          ) {

            openedStationRacks.delete(
              rack.id
            );

          }
          else {

            openedStationRacks.add(
              rack.id
            );

          }


          renderStationCtrRacks();

        }
      );


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


            openedStationRacks.delete(
              rack.id
            );


            renderStationCtrRacks();

          }

        }
      );


      actions.append(
        status,
        toggle,
        remove
      );


      header.append(
        titleArea,
        actions
      );


      card.appendChild(
        header
      );


      /* DRAWING ONLY WHEN OPEN */

      if (
        isRackOpen(
          rack
        )
      ) {

        const drawing =
          document.createElement(
            "div"
          );


        drawing.className =
          "rack-drawing";


        drawing.appendChild(
          buildFuseSection(
            rack,
            renderStationCtrRacks,
            "rack-fuse-section",
            "FIRST STAGE"
          )
        );


        const toolbar =
          document.createElement(
            "div"
          );


        toolbar.className =
          "rack-builder-toolbar";


        const title =
          document.createElement(
            "div"
          );


        title.innerHTML = `

          <span class="rack-sub-label">
            CTR TERMINALS
          </span>

          <h4>
            Row & Conductor Structure
          </h4>

        `;


        const addRow =
          document.createElement(
            "button"
          );


        addRow.type =
          "button";


        addRow.className =
          "builder-action-btn";


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
              rack.rows[0]
                ?.terminals
                ?.length ||
              12;


            const newRow =
              createRow(
                getRowLabel(
                  rack.rows.length
                ),
                columns
              );


            rack.rows.push(
              newRow
            );


            drawing.appendChild(
              buildRowBlock(
                rack,
                newRow,
                "station",
                renderStationCtrRacks,
                false
              )
            );


            scheduleStationAccessApply();


            window
              .ctrGridControls
              ?.refresh?.();

          }
        );


        toolbar.append(
          title,
          addRow
        );


        drawing.appendChild(
          toolbar
        );


        rack.rows.forEach(
          function (row) {

            drawing.appendChild(
              buildRowBlock(
                rack,
                row,
                "station",
                renderStationCtrRacks,
                false
              )
            );

          }
        );


        card.appendChild(
          drawing
        );

      }


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


      /*
         Newly added rack opens automatically.
      */

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


  /* TOOLBAR */

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


  /* ADD ROW */

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
          getRowLabel(
            location.rows.length
          ),
          columns
        )
      );


      renderConnectedEnds();

    }
  );


  /* ADD COLUMN */

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


  /* REMOVE ROW */

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


  /* REMOVE COLUMN */

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
   RENDER CONNECTED ENDS - LAZY
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


      /* ===================================================
         END HEADER
      =================================================== */

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


      summary.textContent =
        `${end.locations.length} Location Boxes`;


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


      const toggleEnd =
        document.createElement(
          "button"
        );


      toggleEnd.type =
        "button";


      toggleEnd.className =
        "builder-action-btn ctr-view-toggle";


      toggleEnd.textContent =
        isEndOpen(end)
          ? "Close End"
          : "Open End";


      toggleEnd.addEventListener(
        "click",
        function () {

          if (
            isEndOpen(
              end
            )
          ) {

            openedConnectedEnds.delete(
              end.id
            );

          }
          else {

            openedConnectedEnds.add(
              end.id
            );

          }


          renderConnectedEnds();

        }
      );


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


          const location =
            createLocation(
              end
            );


          end.locations.push(
            location
          );


          openedConnectedEnds.add(
            end.id
          );


          openedLocationBoxes.add(
            location.id
          );


          renderConnectedEnds();

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
              `Remove ${end.name}?`
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


            openedConnectedEnds.delete(
              end.id
            );


            renderConnectedEnds();

          }

        }
      );


      actions.append(
        toggleEnd,
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


      /* ===================================================
         LOCATIONS ONLY WHEN END OPEN
      =================================================== */

      if (
        isEndOpen(
          end
        )
      ) {

        const locationGrid =
          document.createElement(
            "div"
          );


        locationGrid.className =
          "dynamic-location-grid";


        if (
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
            "No location boxes added yet.";


          locationGrid.appendChild(
            empty
          );

        }


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


            locationSummary.textContent =
              `${location.rows.length} Rows • ${getTerminalCount(
                location
              )} Terminals • ${location.fuseDetails.length} Fuse Points`;


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


            const toggleLocation =
              document.createElement(
                "button"
              );


            toggleLocation.type =
              "button";


            toggleLocation.className =
              "builder-action-btn ctr-view-toggle";


            toggleLocation.textContent =
              isLocationOpen(
                location
              )

                ? "Close Location"

                : "Open Location";


            toggleLocation.addEventListener(
              "click",
              function () {

                if (
                  isLocationOpen(
                    location
                  )
                ) {

                  openedLocationBoxes.delete(
                    location.id
                  );

                }
                else {

                  openedLocationBoxes.add(
                    location.id
                  );

                }


                renderConnectedEnds();

              }
            );


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


                  openedLocationBoxes.delete(
                    location.id
                  );


                  renderConnectedEnds();

                }

              }
            );


            locationActions.append(
              toggleLocation,
              removeLocation
            );


            locationHeader.append(
              locationTitle,
              locationActions
            );


            locationCard.appendChild(
              locationHeader
            );


            /*
               Heavy terminal drawing only exists when
               Location Box is opened.
            */

            if (
              isLocationOpen(
                location
              )
            ) {

              locationCard.appendChild(
                createLocationRackView(
                  location
                )
              );

            }


            locationGrid.appendChild(
              locationCard
            );

          }
        );


        card.appendChild(
          locationGrid
        );

      }


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
              terminalIndex +
              1
            )
              .padStart(
                2,
                "0"
              );


          terminal.status =
            terminal.status ||
            "SPARE";


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
    "Saving draft..."
  );


  try {

    const user =
      await getCurrentUser();


    const savedAt =
      new Date()
        .toISOString();


    const draftData = {

      schemaVersion:
        2,

      stationCtrRacks:
        stationCtrRacks,

      connectedEnds:
        connectedEnds,

      savedAt:
        savedAt

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
      "CTR draft save error:",
      error
    );


    setDraftStatus(
      "Draft save failed"
    );


    alert(
      error.message ||
      "CTR Draft could not be saved."
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
    "Loading CTR data..."
  );


  try {

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
      data.draft_data
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
      "CTR draft load error:",
      error
    );


    setDraftStatus(
      "Unable to load draft"
    );

  }

}


/* =========================================================
   RESET DRAFT
========================================================= */

async function resetCtrDraft() {

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
   INITIAL DATA ENTRY
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
    "Loading station CTR..."
  );


  try {

    /*
       Status first so edit/view mode is correct.
    */

    await loadCurrentStationWorkflowStatus();


    /*
       Database data before rendering.
    */

    await loadCtrDraft();


    /*
       Allow browser to paint once before drawing.
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
       IMPORTANT:
       All racks/end/location remain collapsed initially.
       Heavy terminals are therefore not created.
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

        racks:
          stationCtrRacks.length,

        ends:
          connectedEnds.length,

        status:
          currentStationWorkflowStatus

      }
    );

  }

  catch (error) {

    console.error(
      "Station CTR initialization error:",
      error
    );


    setDraftStatus(
      "Unable to load station CTR"
    );


    renderStationCtrRacks();

    renderConnectedEnds();

  }

}


initializeStationBuilder();