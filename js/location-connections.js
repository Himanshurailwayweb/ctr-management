/* =========================================================
   CTR MANAGEMENT SYSTEM
   LOCATION BOX CONNECTION EDITOR

   VERSION 2.3.0

   FINAL CONNECTION RULES

   UPPER
   ---------------------------------------------------------
   Independent rectangular bridge.
   Multiple / nested bridge levels supported.

   LOWER
   ---------------------------------------------------------
   Only FROM and TO terminals connect to lower line.
   Middle terminals are NOT connected.

   Fuse
   ---------------------------------------------------------
   Fuse is NOT a connection.
   Fuse belongs to terminal.conductorStyle.

========================================================= */

(function () {

  "use strict";


  const SVG_NS =
    "http://www.w3.org/2000/svg";


  const VERSION =
    "2.3.0";


  let connectMode =
    false;


  let fromTerminalId =
    null;


  let toTerminalId =
    null;


  let editingConnectionId =
    null;


  let redrawTimer =
    null;


  let initialized =
    false;


  /* =====================================================
     ID
  ===================================================== */

  function createConnectionId() {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {

      return (
        "LOCATION-CONNECTION-" +
        window.crypto.randomUUID()
      );

    }


    return (
      "LOCATION-CONNECTION-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(16)
        .slice(2)
    );

  }


  /* =====================================================
     EDIT ACCESS
  ===================================================== */

  function requireEditAccess() {

    if (
      typeof requireCurrentStationDraftEdit === "function"
    ) {

      return (
        requireCurrentStationDraftEdit() === true
      );

    }


    return true;

  }


  /* =====================================================
     DATA
  ===================================================== */

  function getConnectedEnds() {

    try {

      if (
        typeof connectedEnds !== "undefined" &&
        Array.isArray(connectedEnds)
      ) {

        return connectedEnds;

      }

    }

    catch (error) {

      console.error(
        "Location Connections: connectedEnds unavailable.",
        error
      );

    }


    return [];

  }


  function getActiveEndIndex() {

    if (
      window.CTR_LOCATION_SVG_VIEW &&
      typeof window
        .CTR_LOCATION_SVG_VIEW
        .getActiveEndIndex === "function"
    ) {

      return (
        Number(
          window
            .CTR_LOCATION_SVG_VIEW
            .getActiveEndIndex()
        ) || 0
      );

    }


    return (
      Number(
        document.getElementById(
          "locationSvgEndSelect"
        )?.value
      ) || 0
    );

  }


  function getActiveLocationIndex() {

    if (
      window.CTR_LOCATION_SVG_VIEW &&
      typeof window
        .CTR_LOCATION_SVG_VIEW
        .getActiveLocationIndex === "function"
    ) {

      return (
        Number(
          window
            .CTR_LOCATION_SVG_VIEW
            .getActiveLocationIndex()
        ) || 0
      );

    }


    return (
      Number(
        document.getElementById(
          "locationSvgBoxSelect"
        )?.value
      ) || 0
    );

  }


  function getActiveEnd() {

    return (
      getConnectedEnds()[
        getActiveEndIndex()
      ] || null
    );

  }


  function getActiveLocation() {

    return (
      getActiveEnd()
        ?.locations?.[
          getActiveLocationIndex()
        ] || null
    );

  }


  /* =====================================================
     CONNECTION DATA
  ===================================================== */

  function ensureConnections(
    location
  ) {

    if (!location) {

      return [];

    }


    if (
      !Array.isArray(
        location.connections
      )
    ) {

      location.connections =
        [];

    }


    location.connections.forEach(
      function (
        connection
      ) {

        connection.id =
          connection.id ||
          createConnectionId();


        connection.position =
          connection.position === "LOWER"
            ? "LOWER"
            : "UPPER";


        connection.type =
          connection.type ||
          (
            connection.position === "LOWER"
              ? "CABLE"
              : "BRIDGE"
          );


        connection.particular =
          connection.particular ||
          "";


        connection.cableCore =
          connection.cableCore ||
          "";


        connection.connectedLocation =
          connection.connectedLocation ||
          "";


        connection.remarks =
          connection.remarks ||
          "";


        delete connection.style;

      }
    );


    return location.connections;

  }


  /* =====================================================
     TERMINAL LOOKUP
  ===================================================== */

  function findTerminalById(
    location,
    terminalId
  ) {

    if (
      !location ||
      !terminalId
    ) {

      return null;

    }


    const rows =
      Array.isArray(location.rows)
        ? location.rows
        : [];


    for (
      let rowIndex = 0;
      rowIndex < rows.length;
      rowIndex++
    ) {

      const row =
        rows[rowIndex];


      const terminals =
        Array.isArray(row.terminals)
          ? row.terminals
          : [];


      for (
        let terminalIndex = 0;
        terminalIndex < terminals.length;
        terminalIndex++
      ) {

        const terminal =
          terminals[terminalIndex];


        if (
          String(terminal.id) ===
          String(terminalId)
        ) {

          return {

            location,

            row,

            terminal,

            rowIndex,

            terminalIndex

          };

        }

      }

    }


    return null;

  }


  function describeTerminal(
    location,
    terminalId
  ) {

    const found =
      findTerminalById(
        location,
        terminalId
      );


    if (!found) {

      return "Unknown";

    }


    return (
      `${found.row.label}-` +
      `${
        Number(found.terminal.number) ||
        found.terminal.number
      }`
    );

  }


  function getTerminalOptions(
    location
  ) {

    const options =
      [];


    location?.rows?.forEach(
      function (
        row,
        rowIndex
      ) {

        row.terminals?.forEach(
          function (
            terminal,
            terminalIndex
          ) {

            options.push({

              id:
                terminal.id,

              label:
                `${row.label}-${
                  Number(terminal.number) ||
                  terminal.number ||
                  terminalIndex + 1
                }`,

              rowIndex,

              terminalIndex

            });

          }
        );

      }
    );


    return options;

  }


  /* =====================================================
     HEADER CONTROLS
  ===================================================== */

  function createHeaderControls() {

    const actions =
      document.querySelector(
        ".location-svg-actions"
      );


    if (!actions) {

      return false;

    }


    let button =
      document.getElementById(
        "locationAddConnection"
      );


    if (!button) {

      button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.id =
        "locationAddConnection";


      button.textContent =
        "+ Connection";


      const refresh =
        document.getElementById(
          "locationSvgRefresh"
        );


      actions.insertBefore(
        button,
        refresh
      );

    }


    let status =
      document.getElementById(
        "locationConnectionStatus"
      );


    if (!status) {

      status =
        document.createElement(
          "span"
        );


      status.id =
        "locationConnectionStatus";


      status.textContent =
        "Ready";


      const refresh =
        document.getElementById(
          "locationSvgRefresh"
        );


      actions.insertBefore(
        status,
        refresh
      );

    }


    return true;

  }


  function setStatus(
    text
  ) {

    const status =
      document.getElementById(
        "locationConnectionStatus"
      );


    if (status) {

      status.textContent =
        text;

    }

  }


  /* =====================================================
     PANEL
  ===================================================== */

  function createPanel() {

    document
      .getElementById(
        "locationConnectionPanel"
      )
      ?.remove();


    const panel =
      document.createElement(
        "aside"
      );


    panel.id =
      "locationConnectionPanel";


    panel.hidden =
      true;


    panel.innerHTML = `

      <div class="location-connection-head">

        <div>

          <span>
            LOCATION BOX ENGINEERING CONNECTION
          </span>

          <strong id="locationConnectionTitle">
            New Connection
          </strong>

        </div>

        <button
          type="button"
          id="locationConnectionClose"
        >
          ×
        </button>

      </div>


      <div class="location-connection-body">

        <div class="location-connection-field">

          <label for="locationConnectionPosition">
            Connection Position
          </label>

          <select id="locationConnectionPosition">

            <option value="UPPER">
              Upper Bridge
            </option>

            <option value="LOWER">
              Lower Cable / Location
            </option>

          </select>

        </div>


        <div
          class="location-connection-note"
          id="locationConnectionNote"
        >
          Bridge joins two terminal upper points.
        </div>


        <div class="location-connection-field">

          <label for="locationConnectionFrom">
            FROM / Start Terminal
          </label>

          <select id="locationConnectionFrom"></select>

        </div>


        <div class="location-connection-field">

          <label for="locationConnectionTo">
            TO / End Terminal
          </label>

          <select id="locationConnectionTo"></select>

        </div>


        <div class="location-connection-field">

          <label for="locationConnectionType">
            Engineering Type
          </label>

          <select id="locationConnectionType">

            <option value="BRIDGE">
              Bridge
            </option>

            <option value="JUMPER">
              Jumper
            </option>

            <option value="CABLE">
              Cable
            </option>

            <option value="EXTERNAL">
              External
            </option>

          </select>

        </div>


        <div class="location-connection-field">

          <label
            id="locationConnectionParticularLabel"
            for="locationConnectionParticular"
          >
            Circuit / Bridge Particular
          </label>

          <input
            id="locationConnectionParticular"
            type="text"
            placeholder="Circuit / connection particular"
          >

        </div>


        <div
          class="location-connection-field"
          id="locationConnectionCableField"
        >

          <label for="locationConnectionCable">
            Cable / Core
          </label>

          <input
            id="locationConnectionCable"
            type="text"
            placeholder="e.g. 1X12C"
          >

        </div>


        <div
          class="location-connection-field"
          id="locationConnectionLocationField"
        >

          <label for="locationConnectionLocation">
            Connected Location
          </label>

          <input
            id="locationConnectionLocation"
            type="text"
            placeholder="e.g. LOC-12"
          >

        </div>


        <div class="location-connection-field">

          <label for="locationConnectionRemarks">
            Remarks
          </label>

          <textarea
            id="locationConnectionRemarks"
            placeholder="Engineering remarks"
          ></textarea>

        </div>


        <div class="location-connection-actions">

          <button
            type="button"
            id="locationConnectionSave"
          >
            Save Connection
          </button>

          <button
            type="button"
            id="locationConnectionRemove"
            class="danger"
            hidden
          >
            Remove
          </button>

          <button
            type="button"
            id="locationConnectionCancel"
          >
            Cancel
          </button>

        </div>

      </div>

    `;


    document.body.appendChild(
      panel
    );

  }


  /* =====================================================
     CSS
  ===================================================== */

  function injectStyles() {

    document
      .getElementById(
        "locationConnectionStyles"
      )
      ?.remove();


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "locationConnectionStyles";


    style.textContent = `

      #locationAddConnection {

        min-height: 34px;

        padding: 0 11px;

        border: 1px solid #173e6e;

        border-radius: 3px;

        background: #ffffff;

        color: #173e6e;

        cursor: pointer;

        font-size: 10px;

        font-weight: 700;

      }


      #locationAddConnection.active {

        background: #173e6e;

        color: #ffffff;

      }


      #locationConnectionStatus {

        display: inline-flex;

        align-items: center;

        min-height: 25px;

        padding: 0 8px;

        border: 1px solid #c9d3dc;

        border-radius: 12px;

        background: #f7f9fb;

        color: #52697d;

        font-size: 9px;

        font-weight: 700;

        white-space: nowrap;

      }


      #locationConnectionPanel {

        position: fixed;

        top: 145px;

        right: 18px;

        z-index: 6500;

        width: 380px;

        max-height: calc(100vh - 170px);

        overflow-y: auto;

        border: 1px solid #b9c6d2;

        border-radius: 4px;

        background: #ffffff;

        box-shadow:
          0 8px 30px rgba(0,0,0,0.22);

        font-family:
          Arial,
          Helvetica,
          sans-serif;

      }


      #locationConnectionPanel[hidden] {

        display: none !important;

      }


      .location-connection-head {

        display: flex;

        align-items: center;

        justify-content: space-between;

        padding: 12px 14px;

        background: #173e6e;

        color: #ffffff;

      }


      .location-connection-head span {

        display: block;

        margin-bottom: 3px;

        font-size: 9px;

        font-weight: 700;

        letter-spacing: 1px;

      }


      .location-connection-head strong {

        font-size: 15px;

      }


      #locationConnectionClose {

        width: 30px;

        height: 30px;

        border: 1px solid
          rgba(255,255,255,.4);

        background: transparent;

        color: #ffffff;

        cursor: pointer;

        font-size: 19px;

      }


      .location-connection-body {

        padding: 14px;

      }


      .location-connection-note {

        margin-bottom: 13px;

        padding: 8px 10px;

        border-left: 3px solid #456f99;

        background: #f3f6f9;

        color: #536b81;

        font-size: 10px;

        line-height: 1.45;

      }


      .location-connection-field {

        margin-bottom: 12px;

      }


      .location-connection-field label {

        display: block;

        margin-bottom: 5px;

        color: #30475d;

        font-size: 11px;

        font-weight: 700;

      }


      .location-connection-field input,
      .location-connection-field select,
      .location-connection-field textarea {

        width: 100%;

        box-sizing: border-box;

        border: 1px solid #bcc8d4;

        border-radius: 3px;

        background: #ffffff;

        color: #172d43;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        font-size: 12px;

      }


      .location-connection-field input,
      .location-connection-field select {

        height: 37px;

        padding: 0 9px;

      }


      .location-connection-field textarea {

        min-height: 68px;

        padding: 8px;

        resize: vertical;

      }


      .location-connection-actions {

        display: flex;

        gap: 7px;

        margin-top: 15px;

      }


      .location-connection-actions button {

        min-height: 38px;

        padding: 0 12px;

        border: 1px solid #bdc8d3;

        border-radius: 3px;

        background: #ffffff;

        color: #42586d;

        cursor: pointer;

        font-size: 10px;

        font-weight: 700;

      }


      #locationConnectionSave {

        flex: 1;

        border-color: #173e6e;

        background: #173e6e;

        color: #ffffff;

      }


      .location-connection-actions .danger {

        border-color: #c79b98;

        color: #9f2922;

      }


      .location-connect-from circle {

        fill: #e7f1fa !important;

        stroke: #125b94 !important;

        stroke-width: 2.2 !important;

      }


      .location-connect-to circle {

        fill: #edf7eb !important;

        stroke: #407545 !important;

        stroke-width: 2.2 !important;

      }


      .ctr-location-connection-visible {

        fill: none;

        stroke: #111111;

        stroke-width: 1.5;

        stroke-linecap: square;

        stroke-linejoin: miter;

        pointer-events: none;

      }


      .ctr-location-connection-hit {

        fill: none;

        stroke: transparent;

        stroke-width: 16;

        cursor: pointer;

        pointer-events: stroke;

      }


      .ctr-location-connection-label {

        fill: #111111;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        font-size: 11.5px;

        font-weight: 700;

        text-anchor: middle;

        pointer-events: none;

        paint-order: stroke;

        stroke: #ffffff;

        stroke-width: 3px;

        stroke-linejoin: round;

      }


      [data-location-connection]:hover
      .ctr-location-connection-visible {

        stroke: #165b94;

        stroke-width: 2;

      }


      @media
      (max-width: 760px) {

        #locationConnectionPanel {

          top: auto;

          left: 8px;

          right: 8px;

          bottom: 8px;

          width: auto;

          max-height: 65vh;

        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =====================================================
     DROPDOWNS
  ===================================================== */

  function populateTerminalDropdowns(
    selectedFrom = "",
    selectedTo = ""
  ) {

    const location =
      getActiveLocation();


    const fromSelect =
      document.getElementById(
        "locationConnectionFrom"
      );


    const toSelect =
      document.getElementById(
        "locationConnectionTo"
      );


    if (
      !location ||
      !fromSelect ||
      !toSelect
    ) {

      return;

    }


    const options =
      getTerminalOptions(
        location
      );


    fromSelect.replaceChildren();

    toSelect.replaceChildren();


    options.forEach(
      function (
        item
      ) {

        const fromOption =
          document.createElement(
            "option"
          );


        fromOption.value =
          item.id;


        fromOption.textContent =
          item.label;


        fromSelect.appendChild(
          fromOption
        );


        const toOption =
          document.createElement(
            "option"
          );


        toOption.value =
          item.id;


        toOption.textContent =
          item.label;


        toSelect.appendChild(
          toOption
        );

      }
    );


    if (selectedFrom) {

      fromSelect.value =
        String(selectedFrom);

    }


    if (selectedTo) {

      toSelect.value =
        String(selectedTo);

    }


    fromTerminalId =
      fromSelect.value ||
      null;


    toTerminalId =
      toSelect.value ||
      null;

  }


  /* =====================================================
     POSITION UI
  ===================================================== */

  function updatePositionUi() {

    const position =
      document.getElementById(
        "locationConnectionPosition"
      )?.value ||
      "UPPER";


    const note =
      document.getElementById(
        "locationConnectionNote"
      );


    const label =
      document.getElementById(
        "locationConnectionParticularLabel"
      );


    const cableField =
      document.getElementById(
        "locationConnectionCableField"
      );


    const locationField =
      document.getElementById(
        "locationConnectionLocationField"
      );


    const type =
      document.getElementById(
        "locationConnectionType"
      );


    if (
      position === "LOWER"
    ) {

      if (note) {

        note.textContent =
          "Only FROM and TO terminals connect to the lower cable/location line. Middle terminals remain independent.";

      }


      if (label) {

        label.textContent =
          "Cable / Location Particular";

      }


      cableField.hidden =
        false;


      locationField.hidden =
        false;


      if (
        type &&
        (
          type.value === "BRIDGE" ||
          type.value === "JUMPER"
        )
      ) {

        type.value =
          "CABLE";

      }

    }

    else {

      if (note) {

        note.textContent =
          "Upper Bridge joins two terminal upper points. Overlapping bridges automatically move to higher levels.";

      }


      if (label) {

        label.textContent =
          "Circuit / Bridge Particular";

      }


      cableField.hidden =
        true;


      locationField.hidden =
        true;


      if (
        type &&
        (
          type.value === "CABLE" ||
          type.value === "EXTERNAL"
        )
      ) {

        type.value =
          "BRIDGE";

      }

    }

  }


  /* =====================================================
     HIGHLIGHT
  ===================================================== */

  function clearHighlights() {

    document
      .querySelectorAll(
        ".location-connect-from, .location-connect-to"
      )
      .forEach(
        function (
          element
        ) {

          element.classList.remove(
            "location-connect-from",
            "location-connect-to"
          );

        }
      );

  }


  function getTerminalFromSvg(
    element
  ) {

    const location =
      getActiveLocation();


    if (
      !location ||
      !element
    ) {

      return null;

    }


    const rowIndex =
      Number(
        element.dataset.rowIndex
      );


    const terminalIndex =
      Number(
        element.dataset.terminalIndex
      );


    const row =
      location.rows?.[
        rowIndex
      ];


    const terminal =
      row?.terminals?.[
        terminalIndex
      ];


    if (
      !row ||
      !terminal
    ) {

      return null;

    }


    return {

      row,

      terminal,

      rowIndex,

      terminalIndex

    };

  }


  function highlightSelected() {

    clearHighlights();


    const host =
      document.getElementById(
        "locationSvgHost"
      );


    if (!host) {

      return;

    }


    host
      .querySelectorAll(
        '[data-location-terminal="true"]'
      )
      .forEach(
        function (
          element
        ) {

          const data =
            getTerminalFromSvg(
              element
            );


          if (!data) {

            return;

          }


          if (
            String(data.terminal.id) ===
            String(fromTerminalId)
          ) {

            element.classList.add(
              "location-connect-from"
            );

          }


          if (
            String(data.terminal.id) ===
            String(toTerminalId)
          ) {

            element.classList.add(
              "location-connect-to"
            );

          }

        }
      );

  }


  /* =====================================================
     MODE
  ===================================================== */

  function startMode() {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    connectMode =
      true;


    fromTerminalId =
      null;


    toTerminalId =
      null;


    editingConnectionId =
      null;


    closePanel();

    clearHighlights();


    document
      .getElementById(
        "locationAddConnection"
      )
      ?.classList
      .add(
        "active"
      );


    setStatus(
      "Select FROM terminal"
    );

  }


  function cancelMode() {

    connectMode =
      false;


    fromTerminalId =
      null;


    toTerminalId =
      null;


    clearHighlights();


    document
      .getElementById(
        "locationAddConnection"
      )
      ?.classList
      .remove(
        "active"
      );


    setStatus(
      "Ready"
    );

  }


  /* =====================================================
     OPEN PANEL
  ===================================================== */

  function openPanel(
    connection = null
  ) {

    const panel =
      document.getElementById(
        "locationConnectionPanel"
      );


    if (!panel) {

      return;

    }


    editingConnectionId =
      connection?.id ||
      null;


    populateTerminalDropdowns(

      connection?.fromTerminalId ||
      fromTerminalId ||
      "",

      connection?.toTerminalId ||
      toTerminalId ||
      ""

    );


    document.getElementById(
      "locationConnectionTitle"
    ).textContent =
      connection
        ? "Edit Connection"
        : "New Connection";


    const position =
      document.getElementById(
        "locationConnectionPosition"
      );


    position.value =
      connection?.position ||
      "UPPER";


    document.getElementById(
      "locationConnectionType"
    ).value =
      connection?.type ||
      (
        position.value === "LOWER"
          ? "CABLE"
          : "BRIDGE"
      );


    document.getElementById(
      "locationConnectionParticular"
    ).value =
      connection?.particular ||
      "";


    document.getElementById(
      "locationConnectionCable"
    ).value =
      connection?.cableCore ||
      "";


    document.getElementById(
      "locationConnectionLocation"
    ).value =
      connection?.connectedLocation ||
      "";


    document.getElementById(
      "locationConnectionRemarks"
    ).value =
      connection?.remarks ||
      "";


    document.getElementById(
      "locationConnectionRemove"
    ).hidden =
      !connection;


    updatePositionUi();


    panel.hidden =
      false;

  }


  function closePanel() {

    const panel =
      document.getElementById(
        "locationConnectionPanel"
      );


    if (panel) {

      panel.hidden =
        true;

    }


    editingConnectionId =
      null;

  }


  /* =====================================================
     VALIDATE
  ===================================================== */

  function validateConnection(
    location,
    fromId,
    toId,
    position
  ) {

    if (
      !fromId ||
      !toId
    ) {

      alert(
        "FROM and TO terminals are required."
      );

      return false;

    }


    if (
      String(fromId) ===
      String(toId)
    ) {

      alert(
        "FROM and TO cannot be the same terminal."
      );

      return false;

    }


    const from =
      findTerminalById(
        location,
        fromId
      );


    const to =
      findTerminalById(
        location,
        toId
      );


    if (
      !from ||
      !to
    ) {

      alert(
        "Selected terminal was not found."
      );

      return false;

    }


    if (
      from.rowIndex !==
      to.rowIndex
    ) {

      alert(
        position === "LOWER"
          ? "Lower cable terminals must be in the same row."
          : "Bridge terminals must be in the same row."
      );

      return false;

    }


    return true;

  }


  /* =====================================================
     SAVE
  ===================================================== */

  function saveConnection() {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    const location =
      getActiveLocation();


    if (!location) {

      return;

    }


    const fromId =
      document.getElementById(
        "locationConnectionFrom"
      )?.value ||
      "";


    const toId =
      document.getElementById(
        "locationConnectionTo"
      )?.value ||
      "";


    const position =
      document.getElementById(
        "locationConnectionPosition"
      )?.value ||
      "UPPER";


    if (
      !validateConnection(
        location,
        fromId,
        toId,
        position
      )
    ) {

      return;

    }


    const connections =
      ensureConnections(
        location
      );


    let connection =
      editingConnectionId
        ? connections.find(
            function (
              item
            ) {

              return (
                String(item.id) ===
                String(editingConnectionId)
              );

            }
          )
        : null;


    if (!connection) {

      connection = {

        id:
          createConnectionId()

      };


      connections.push(
        connection
      );

    }


    connection.position =
      position;


    connection.fromTerminalId =
      fromId;


    connection.toTerminalId =
      toId;


    connection.type =
      document.getElementById(
        "locationConnectionType"
      )?.value ||
      (
        position === "LOWER"
          ? "CABLE"
          : "BRIDGE"
      );


    connection.particular =
      document.getElementById(
        "locationConnectionParticular"
      )?.value?.trim() ||
      "";


    connection.cableCore =
      position === "LOWER"
        ? (
            document.getElementById(
              "locationConnectionCable"
            )?.value?.trim() ||
            ""
          )
        : "";


    connection.connectedLocation =
      position === "LOWER"
        ? (
            document.getElementById(
              "locationConnectionLocation"
            )?.value?.trim() ||
            ""
          )
        : "";


    connection.remarks =
      document.getElementById(
        "locationConnectionRemarks"
      )?.value?.trim() ||
      "";


    connection.updatedAt =
      new Date()
        .toISOString();


    delete connection.style;


    closePanel();

    cancelMode();

    drawConnections();


    window
      .CTR_DRAWING_PROPERTIES
      ?.refresh?.();

  }


  /* =====================================================
     REMOVE
  ===================================================== */

  function removeConnection() {

    if (
      !requireEditAccess() ||
      !editingConnectionId
    ) {

      return;

    }


    const location =
      getActiveLocation();


    if (!location) {

      return;

    }


    if (
      !confirm(
        "Remove this connection?"
      )
    ) {

      return;

    }


    const connections =
      ensureConnections(
        location
      );


    const index =
      connections.findIndex(
        function (
          connection
        ) {

          return (
            String(connection.id) ===
            String(editingConnectionId)
          );

        }
      );


    if (
      index !== -1
    ) {

      connections.splice(
        index,
        1
      );

    }


    closePanel();

    cancelMode();

    drawConnections();

  }


  /* =====================================================
     SVG
  ===================================================== */

  function createSvgElement(
    name
  ) {

    return document.createElementNS(
      SVG_NS,
      name
    );

  }


  function getTerminalPoint(
    svg,
    location,
    terminalId,
    port
  ) {

    const found =
      findTerminalById(
        location,
        terminalId
      );


    if (!found) {

      return null;

    }


    const element =
      svg.querySelector(

        `[data-location-terminal="true"]` +
        `[data-row-index="${found.rowIndex}"]` +
        `[data-terminal-index="${found.terminalIndex}"]`

      );


    if (!element) {

      return null;

    }


    const circles =
      Array.from(
        element.querySelectorAll(
          "circle"
        )
      );


    if (!circles.length) {

      return null;

    }


    const circle =
      port === "BOTTOM"
        ? circles[
            circles.length - 1
          ]
        : circles[0];


    return {

      x:
        Number(
          circle.getAttribute("cx")
        ),

      y:
        Number(
          circle.getAttribute("cy")
        ),

      rowIndex:
        found.rowIndex,

      terminalIndex:
        found.terminalIndex

    };

  }


  /* =====================================================
     LABEL
  ===================================================== */

  function getConnectionLabel(
    connection
  ) {

    if (
      connection.particular
    ) {

      return connection.particular;

    }


    if (
      connection.position === "LOWER"
    ) {

      if (
        connection.cableCore &&
        connection.connectedLocation
      ) {

        return (
          `${connection.cableCore} TO ` +
          `${connection.connectedLocation}`
        );

      }


      if (
        connection.cableCore
      ) {

        return connection.cableCore;

      }


      if (
        connection.connectedLocation
      ) {

        return (
          `TO ${connection.connectedLocation}`
        );

      }

    }


    return "";

  }


  function drawLabel(
    group,
    text,
    x,
    y
  ) {

    if (!text) {

      return;

    }


    const label =
      createSvgElement(
        "text"
      );


    label.setAttribute(
      "x",
      x
    );


    label.setAttribute(
      "y",
      y
    );


    label.setAttribute(
      "class",
      "ctr-location-connection-label"
    );


    label.textContent =
      text;


    group.appendChild(
      label
    );

  }


  /* =====================================================
     UPPER BRIDGE LEVEL
  ===================================================== */

  function getBridgeSpan(
    location,
    connection
  ) {

    const from =
      findTerminalById(
        location,
        connection.fromTerminalId
      );


    const to =
      findTerminalById(
        location,
        connection.toTerminalId
      );


    if (
      !from ||
      !to ||
      from.rowIndex !== to.rowIndex
    ) {

      return null;

    }


    return {

      rowIndex:
        from.rowIndex,

      start:
        Math.min(
          from.terminalIndex,
          to.terminalIndex
        ),

      end:
        Math.max(
          from.terminalIndex,
          to.terminalIndex
        )

    };

  }


  function bridgeSpansOverlap(
    first,
    second
  ) {

    if (
      !first ||
      !second ||
      first.rowIndex !== second.rowIndex
    ) {

      return false;

    }


    return (
      first.start <= second.end &&
      second.start <= first.end
    );

  }


  function buildUpperBridgeLaneMap(
    location
  ) {

    const laneMap =
      new Map();


    const bridges =
      [];


    ensureConnections(
      location
    )
      .forEach(
        function (
          connection,
          originalIndex
        ) {

          if (
            (
              connection.position ||
              "UPPER"
            ) !== "UPPER"
          ) {

            return;

          }


          const span =
            getBridgeSpan(
              location,
              connection
            );


          if (!span) {

            return;

          }


          bridges.push({

            connection,

            originalIndex,

            rowIndex:
              span.rowIndex,

            start:
              span.start,

            end:
              span.end,

            width:
              span.end -
              span.start

          });

        }
      );


    bridges.sort(
      function (
        a,
        b
      ) {

        if (
          a.rowIndex !== b.rowIndex
        ) {

          return (
            a.rowIndex -
            b.rowIndex
          );

        }


        if (
          a.width !== b.width
        ) {

          return (
            a.width -
            b.width
          );

        }


        if (
          a.start !== b.start
        ) {

          return (
            a.start -
            b.start
          );

        }


        return (
          a.originalIndex -
          b.originalIndex
        );

      }
    );


    const assigned =
      [];


    bridges.forEach(
      function (
        bridge
      ) {

        const occupied =
          new Set();


        assigned.forEach(
          function (
            previous
          ) {

            if (
              bridgeSpansOverlap(
                bridge,
                previous
              )
            ) {

              occupied.add(
                previous.lane
              );

            }

          }
        );


        let lane =
          0;


        while (
          occupied.has(
            lane
          )
        ) {

          lane++;

        }


        laneMap.set(
          String(
            bridge.connection.id
          ),
          lane
        );


        assigned.push({

          ...bridge,

          lane

        });

      }
    );


    return laneMap;

  }


  /* =====================================================
     LOWER LANE
  ===================================================== */

  function getLowerLane(
    location,
    connection,
    currentIndex
  ) {

    const current =
      findTerminalById(
        location,
        connection.fromTerminalId
      );


    if (!current) {

      return 0;

    }


    let lane =
      0;


    const connections =
      ensureConnections(
        location
      );


    for (
      let index = 0;
      index < currentIndex;
      index++
    ) {

      const previous =
        connections[index];


      if (
        previous.position !== "LOWER"
      ) {

        continue;

      }


      const previousFrom =
        findTerminalById(
          location,
          previous.fromTerminalId
        );


      if (
        previousFrom &&
        previousFrom.rowIndex === current.rowIndex
      ) {

        lane++;

      }

    }


    return lane;

  }


  /* =====================================================
     DRAW UPPER
  ===================================================== */

  function drawUpper(
    group,
    svg,
    location,
    connection,
    lane
  ) {

    const from =
      getTerminalPoint(
        svg,
        location,
        connection.fromTerminalId,
        "TOP"
      );


    const to =
      getTerminalPoint(
        svg,
        location,
        connection.toTerminalId,
        "TOP"
      );


    if (
      !from ||
      !to ||
      from.rowIndex !== to.rowIndex
    ) {

      return false;

    }


    const bridgeY =
      Math.min(
        from.y,
        to.y
      )
      -
      42
      -
      (
        lane *
        30
      );


    const pathData =
      [

        `M ${from.x} ${from.y}`,

        `L ${from.x} ${bridgeY}`,

        `L ${to.x} ${bridgeY}`,

        `L ${to.x} ${to.y}`

      ].join(" ");


    const visible =
      createSvgElement(
        "path"
      );


    visible.setAttribute(
      "d",
      pathData
    );


    visible.setAttribute(
      "class",
      "ctr-location-connection-visible"
    );


    group.appendChild(
      visible
    );


    const hit =
      createSvgElement(
        "path"
      );


    hit.setAttribute(
      "d",
      pathData
    );


    hit.setAttribute(
      "class",
      "ctr-location-connection-hit"
    );


    group.appendChild(
      hit
    );


    drawLabel(

      group,

      getConnectionLabel(
        connection
      ),

      (
        from.x +
        to.x
      ) / 2,

      bridgeY - 10

    );


    return true;

  }


  /* =====================================================
     DRAW LOWER

     ONLY START + END TERMINALS CONNECT
  ===================================================== */

  function drawLower(
    group,
    svg,
    location,
    connection,
    index
  ) {

    const from =
      getTerminalPoint(
        svg,
        location,
        connection.fromTerminalId,
        "BOTTOM"
      );


    const to =
      getTerminalPoint(
        svg,
        location,
        connection.toTerminalId,
        "BOTTOM"
      );


    if (
      !from ||
      !to ||
      from.rowIndex !== to.rowIndex
    ) {

      return false;

    }


    const lane =
      getLowerLane(
        location,
        connection,
        index
      );


    const routeY =
      Math.max(
        from.y,
        to.y
      )
      +
      42
      +
      (
        lane *
        28
      );


    const left =
      from.x <= to.x
        ? from
        : to;


    const right =
      from.x <= to.x
        ? to
        : from;


    const pathData =
      [

        `M ${left.x} ${left.y}`,

        `L ${left.x} ${routeY}`,

        `L ${right.x} ${routeY}`,

        `L ${right.x} ${right.y}`

      ].join(" ");


    const visible =
      createSvgElement(
        "path"
      );


    visible.setAttribute(
      "d",
      pathData
    );


    visible.setAttribute(
      "class",
      "ctr-location-connection-visible"
    );


    group.appendChild(
      visible
    );


    const hit =
      createSvgElement(
        "path"
      );


    hit.setAttribute(
      "d",
      pathData
    );


    hit.setAttribute(
      "class",
      "ctr-location-connection-hit"
    );


    group.appendChild(
      hit
    );


    drawLabel(

      group,

      getConnectionLabel(
        connection
      ),

      (
        left.x +
        right.x
      ) / 2,

      routeY + 22

    );


    return true;

  }


  /* =====================================================
     DRAW ONE
  ===================================================== */

  function drawSingleConnection(
    layer,
    svg,
    location,
    connection,
    index,
    upperLaneMap
  ) {

    const group =
      createSvgElement(
        "g"
      );


    group.setAttribute(
      "data-location-connection",
      connection.id
    );


    group.style.cursor =
      "pointer";


    const position =
      connection.position ||
      "UPPER";


    let success =
      false;


    if (
      position === "LOWER"
    ) {

      success =
        drawLower(
          group,
          svg,
          location,
          connection,
          index
        );

    }

    else {

      const lane =
        upperLaneMap.get(
          String(
            connection.id
          )
        ) || 0;


      success =
        drawUpper(
          group,
          svg,
          location,
          connection,
          lane
        );

    }


    if (!success) {

      return;

    }


    const title =
      createSvgElement(
        "title"
      );


    title.textContent =
      [

        position === "LOWER"
          ? "Lower Cable / Location"
          : "Upper Bridge",

        `${describeTerminal(
          location,
          connection.fromTerminalId
        )} → ${describeTerminal(
          location,
          connection.toTerminalId
        )}`,

        getConnectionLabel(
          connection
        ),

        connection.remarks ||
        ""

      ]
        .filter(Boolean)
        .join(" | ");


    group.appendChild(
      title
    );


    layer.appendChild(
      group
    );

  }


  /* =====================================================
     DRAW ALL
  ===================================================== */

  function drawConnections() {

    const host =
      document.getElementById(
        "locationSvgHost"
      );


    const svg =
      host?.querySelector(
        "svg"
      );


    const location =
      getActiveLocation();


    if (
      !svg ||
      !location
    ) {

      return;

    }


    svg
      .querySelector(
        "#locationConnectionLayer"
      )
      ?.remove();


    const layer =
      createSvgElement(
        "g"
      );


    layer.id =
      "locationConnectionLayer";


    const upperLaneMap =
      buildUpperBridgeLaneMap(
        location
      );


    ensureConnections(
      location
    )
      .forEach(
        function (
          connection,
          index
        ) {

          drawSingleConnection(

            layer,

            svg,

            location,

            connection,

            index,

            upperLaneMap

          );

        }
      );


    svg.appendChild(
      layer
    );

  }


  function scheduleDraw(
    delay = 110
  ) {

    clearTimeout(
      redrawTimer
    );


    redrawTimer =
      setTimeout(
        drawConnections,
        delay
      );

  }


  /* =====================================================
     EXISTING CONNECTION
  ===================================================== */

  function openExisting(
    connectionId
  ) {

    const location =
      getActiveLocation();


    if (!location) {

      return;

    }


    const connection =
      ensureConnections(
        location
      )
        .find(
          function (
            item
          ) {

            return (
              String(item.id) ===
              String(connectionId)
            );

          }
        );


    if (!connection) {

      return;

    }


    cancelMode();


    fromTerminalId =
      connection.fromTerminalId;


    toTerminalId =
      connection.toTerminalId;


    highlightSelected();


    openPanel(
      connection
    );

  }


  /* =====================================================
     SVG CLICK
  ===================================================== */

  function handleSvgClick(
    event
  ) {

    const existing =
      event.target.closest(
        "[data-location-connection]"
      );


    if (
      existing &&
      !connectMode
    ) {

      event.preventDefault();

      event.stopPropagation();

      event.stopImmediatePropagation();


      openExisting(
        existing.getAttribute(
          "data-location-connection"
        )
      );


      return;

    }


    if (!connectMode) {

      return;

    }


    const terminalElement =
      event.target.closest(
        '[data-location-terminal="true"]'
      );


    if (!terminalElement) {

      return;

    }


    event.preventDefault();

    event.stopPropagation();

    event.stopImmediatePropagation();


    const data =
      getTerminalFromSvg(
        terminalElement
      );


    if (!data) {

      return;

    }


    if (!fromTerminalId) {

      fromTerminalId =
        data.terminal.id;


      setStatus(
        `FROM ${data.row.label}-${
          Number(data.terminal.number) ||
          data.terminal.number
        } · Select TO`
      );


      highlightSelected();


      return;

    }


    if (
      String(data.terminal.id) ===
      String(fromTerminalId)
    ) {

      alert(
        "FROM and TO cannot be the same terminal."
      );

      return;

    }


    toTerminalId =
      data.terminal.id;


    highlightSelected();


    setStatus(
      "Set connection details"
    );


    openPanel(
      null
    );

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  function bindEvents() {

    const addButton =
      document.getElementById(
        "locationAddConnection"
      );


    if (
      addButton &&
      !addButton.dataset.connectionBound
    ) {

      addButton.dataset.connectionBound =
        "true";


      addButton.addEventListener(
        "click",
        function () {

          if (connectMode) {

            cancelMode();

          }

          else {

            startMode();

          }

        }
      );

    }


    document
      .getElementById(
        "locationConnectionClose"
      )
      ?.addEventListener(
        "click",
        function () {

          closePanel();

          cancelMode();

        }
      );


    document
      .getElementById(
        "locationConnectionCancel"
      )
      ?.addEventListener(
        "click",
        function () {

          closePanel();

          cancelMode();

        }
      );


    document
      .getElementById(
        "locationConnectionSave"
      )
      ?.addEventListener(
        "click",
        saveConnection
      );


    document
      .getElementById(
        "locationConnectionRemove"
      )
      ?.addEventListener(
        "click",
        removeConnection
      );


    document
      .getElementById(
        "locationConnectionPosition"
      )
      ?.addEventListener(
        "change",
        updatePositionUi
      );


    document
      .getElementById(
        "locationConnectionFrom"
      )
      ?.addEventListener(
        "change",
        function () {

          fromTerminalId =
            this.value;


          highlightSelected();

        }
      );


    document
      .getElementById(
        "locationConnectionTo"
      )
      ?.addEventListener(
        "change",
        function () {

          toTerminalId =
            this.value;


          highlightSelected();

        }
      );


    document
      .getElementById(
        "locationSvgEndSelect"
      )
      ?.addEventListener(
        "change",
        function () {

          closePanel();

          cancelMode();


          setTimeout(
            drawConnections,
            150
          );

        }
      );


    document
      .getElementById(
        "locationSvgBoxSelect"
      )
      ?.addEventListener(
        "change",
        function () {

          closePanel();

          cancelMode();


          setTimeout(
            drawConnections,
            150
          );

        }
      );


    document
      .getElementById(
        "locationSvgRefresh"
      )
      ?.addEventListener(
        "click",
        function () {

          setTimeout(
            drawConnections,
            150
          );

        }
      );


    const host =
      document.getElementById(
        "locationSvgHost"
      );


    if (
      host &&
      !host.dataset.connectionClickBound
    ) {

      host.dataset.connectionClickBound =
        "true";


      host.addEventListener(
        "click",
        handleSvgClick,
        true
      );

    }

  }


  /* =====================================================
     OBSERVER
  ===================================================== */

  function observeDrawing() {

    const host =
      document.getElementById(
        "locationSvgHost"
      );


    if (
      !host ||
      host.dataset.locationConnectionsObserved
    ) {

      return;

    }


    host.dataset.locationConnectionsObserved =
      "true";


    const observer =
      new MutationObserver(
        function () {

          const svg =
            host.querySelector(
              "svg"
            );


          if (
            svg &&
            !svg.querySelector(
              "#locationConnectionLayer"
            )
          ) {

            scheduleDraw(
              120
            );

          }

        }
      );


    observer.observe(
      host,
      {

        childList:
          true,

        subtree:
          true

      }
    );

  }


  /* =====================================================
     INIT
  ===================================================== */

  function initialize() {

    if (initialized) {

      return;

    }


    injectStyles();


    let attempts =
      0;


    const timer =
      setInterval(
        function () {

          attempts++;


          const actions =
            document.querySelector(
              ".location-svg-actions"
            );


          const host =
            document.getElementById(
              "locationSvgHost"
            );


          if (
            actions &&
            host
          ) {

            clearInterval(
              timer
            );


            initialized =
              true;


            createHeaderControls();

            createPanel();

            bindEvents();

            observeDrawing();


            getConnectedEnds()
              .forEach(
                function (
                  end
                ) {

                  end.locations
                    ?.forEach(
                      function (
                        location
                      ) {

                        ensureConnections(
                          location
                        );

                      }
                    );

                }
              );


            setTimeout(
              drawConnections,
              300
            );


            setTimeout(
              drawConnections,
              1200
            );


            window.CTR_LOCATION_CONNECTIONS = {

              version:
                VERSION,

              redraw:
                drawConnections,

              start:
                startMode,

              cancel:
                cancelMode,

              getActiveConnections:
                function () {

                  return ensureConnections(
                    getActiveLocation()
                  );

                }

            };


            console.log(
              "CTR Location Connections:",
              VERSION,
              "ready"
            );


            return;

          }


          if (
            attempts >= 60
          ) {

            clearInterval(
              timer
            );


            console.error(
              "CTR Location Connections: Drawing View not found."
            );

          }

        },
        200
      );

  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );

  }

  else {

    initialize();

  }

})();