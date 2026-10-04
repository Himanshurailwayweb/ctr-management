/* =========================================================
   CTR MANAGEMENT SYSTEM
   STATION CONNECTION EDITOR

   VERSION 5.2.0

   FINAL CONNECTION RULES
   ---------------------------------------------------------
   UPPER:
   - Independent bridge.
   - Multiple / nested bridges allowed.
   - Overlapping bridges automatically move upward.
   - Fuse is NOT a connection type.

   LOWER:
   - Only FROM and TO terminal connect to lower route.
   - Middle terminals remain untouched.
   - Multiple lower connections get separate levels.

   TERMINAL:
   - Straight / Fuse controlled separately by:
       terminal.conductorStyle

========================================================= */

(function () {

  "use strict";


  const SVG_NS =
    "http://www.w3.org/2000/svg";


  const VERSION =
    "5.2.0";


  let connectMode =
    false;


  let fromTerminalId =
    null;


  let toTerminalId =
    null;


  let editingConnectionId =
    null;


  let initialized =
    false;


  let bootTimer =
    null;


  let redrawTimer =
    null;


  /* =====================================================
     ID
  ===================================================== */

  function createConnectionId() {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {

      return (
        "CONNECTION-" +
        window.crypto.randomUUID()
      );

    }


    return (
      "CONNECTION-" +
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

  function getStationRacks() {

    try {

      if (
        typeof stationCtrRacks !== "undefined" &&
        Array.isArray(stationCtrRacks)
      ) {

        return stationCtrRacks;

      }

    }

    catch (error) {

      console.error(
        "CTR Connections: stationCtrRacks unavailable.",
        error
      );

    }


    return [];

  }


  function getActiveRackIndex() {

    if (
      window.CTR_STATION_SVG_VIEW &&
      typeof window
        .CTR_STATION_SVG_VIEW
        .getActiveRackIndex === "function"
    ) {

      return (
        Number(
          window
            .CTR_STATION_SVG_VIEW
            .getActiveRackIndex()
        ) || 0
      );

    }


    return (
      Number(
        document.getElementById(
          "stationSvgRackSelect"
        )?.value
      ) || 0
    );

  }


  function getActiveRack() {

    return (
      getStationRacks()[
        getActiveRackIndex()
      ] || null
    );

  }


  /* =====================================================
     CONNECTION DATA
  ===================================================== */

  function ensureRackConnections(
    rack
  ) {

    if (!rack) {

      return [];

    }


    if (
      !Array.isArray(
        rack.connections
      )
    ) {

      rack.connections =
        [];

    }


    rack.connections.forEach(
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


        /*
           OLD BRIDGE/FUSE connection style
           no longer exists.
        */

        if (
          Object.prototype.hasOwnProperty.call(
            connection,
            "style"
          )
        ) {

          delete connection.style;

        }

      }
    );


    return rack.connections;

  }


  /* =====================================================
     TERMINAL LOOKUP
  ===================================================== */

  function findTerminalById(
    rack,
    terminalId
  ) {

    if (
      !rack ||
      !terminalId
    ) {

      return null;

    }


    const rows =
      Array.isArray(rack.rows)
        ? rack.rows
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

            rack,

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
    rack,
    terminalId
  ) {

    const found =
      findTerminalById(
        rack,
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
    rack
  ) {

    const options =
      [];


    rack?.rows?.forEach(
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
     STATUS
  ===================================================== */

  function setStatus(
    text
  ) {

    const status =
      document.getElementById(
        "stationConnectionStatus"
      );


    if (status) {

      status.textContent =
        text;

    }

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


  /* =====================================================
     PANEL
  ===================================================== */

  function createPanel() {

    document
      .getElementById(
        "stationConnectionPanel"
      )
      ?.remove();


    const panel =
      document.createElement(
        "aside"
      );


    panel.id =
      "stationConnectionPanel";


    panel.hidden =
      true;


    panel.innerHTML = `

      <div class="station-connection-head">

        <div>

          <span>
            CTR ENGINEERING CONNECTION
          </span>

          <strong id="stationConnectionTitle">
            New Connection
          </strong>

        </div>

        <button
          type="button"
          id="stationConnectionClose"
        >
          ×
        </button>

      </div>


      <div class="station-connection-body">

        <div class="station-connection-field">

          <label for="stationConnectionPosition">
            Connection Position
          </label>

          <select id="stationConnectionPosition">

            <option value="UPPER">
              Upper Bridge
            </option>

            <option value="LOWER">
              Lower Cable / Location
            </option>

          </select>

        </div>


        <div
          class="station-connection-note"
          id="stationConnectionNote"
        >
          Bridge joins two terminal upper points.
        </div>


        <div class="station-connection-field">

          <label for="stationConnectionFrom">
            FROM / Start Terminal
          </label>

          <select id="stationConnectionFrom"></select>

        </div>


        <div class="station-connection-field">

          <label for="stationConnectionTo">
            TO / End Terminal
          </label>

          <select id="stationConnectionTo"></select>

        </div>


        <div class="station-connection-field">

          <label for="stationConnectionType">
            Engineering Type
          </label>

          <select id="stationConnectionType">

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


        <div class="station-connection-field">

          <label
            id="stationConnectionParticularLabel"
            for="stationConnectionParticular"
          >
            Circuit / Bridge Particular
          </label>

          <input
            type="text"
            id="stationConnectionParticular"
            placeholder="Circuit / connection particular"
          >

        </div>


        <div
          class="station-connection-field"
          id="stationConnectionCableField"
        >

          <label for="stationConnectionCable">
            Cable / Core
          </label>

          <input
            type="text"
            id="stationConnectionCable"
            placeholder="e.g. 1X12C"
          >

        </div>


        <div
          class="station-connection-field"
          id="stationConnectionLocationField"
        >

          <label for="stationConnectionLocation">
            Connected Location
          </label>

          <input
            type="text"
            id="stationConnectionLocation"
            placeholder="e.g. LOC-12"
          >

        </div>


        <div class="station-connection-field">

          <label for="stationConnectionRemarks">
            Remarks
          </label>

          <textarea
            id="stationConnectionRemarks"
            placeholder="Engineering remarks"
          ></textarea>

        </div>


        <div class="station-connection-actions">

          <button
            type="button"
            id="stationConnectionSave"
          >
            Save Connection
          </button>

          <button
            type="button"
            id="stationConnectionRemove"
            class="danger"
            hidden
          >
            Remove
          </button>

          <button
            type="button"
            id="stationConnectionCancel"
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
        "stationConnectionStyles"
      )
      ?.remove();


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "stationConnectionStyles";


    style.textContent = `

      #stationAddConnection {

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


      #stationAddConnection.active {

        background: #173e6e;

        color: #ffffff;

      }


      #stationConnectionStatus {

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


      #stationConnectionPanel {

        position: fixed;

        top: 135px;

        right: 18px;

        z-index: 6500;

        width: 380px;

        max-height: calc(100vh - 160px);

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


      #stationConnectionPanel[hidden] {

        display: none !important;

      }


      .station-connection-head {

        display: flex;

        align-items: center;

        justify-content: space-between;

        padding: 12px 14px;

        background: #173e6e;

        color: #ffffff;

      }


      .station-connection-head span {

        display: block;

        margin-bottom: 3px;

        font-size: 9px;

        font-weight: 700;

        letter-spacing: 1px;

      }


      .station-connection-head strong {

        font-size: 15px;

      }


      #stationConnectionClose {

        width: 30px;

        height: 30px;

        border: 1px solid
          rgba(255,255,255,.4);

        background: transparent;

        color: #ffffff;

        cursor: pointer;

        font-size: 19px;

      }


      .station-connection-body {

        padding: 14px;

      }


      .station-connection-note {

        margin-bottom: 13px;

        padding: 8px 10px;

        border-left: 3px solid #456f99;

        background: #f3f6f9;

        color: #536b81;

        font-size: 10px;

        line-height: 1.45;

      }


      .station-connection-field {

        margin-bottom: 12px;

      }


      .station-connection-field label {

        display: block;

        margin-bottom: 5px;

        color: #30475d;

        font-size: 11px;

        font-weight: 700;

      }


      .station-connection-field input,
      .station-connection-field select,
      .station-connection-field textarea {

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


      .station-connection-field input,
      .station-connection-field select {

        height: 37px;

        padding: 0 9px;

      }


      .station-connection-field textarea {

        min-height: 68px;

        padding: 8px;

        resize: vertical;

      }


      .station-connection-actions {

        display: flex;

        gap: 7px;

        margin-top: 15px;

      }


      .station-connection-actions button {

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


      #stationConnectionSave {

        flex: 1;

        border-color: #173e6e;

        background: #173e6e;

        color: #ffffff;

      }


      .station-connection-actions .danger {

        border-color: #c79b98;

        color: #9f2922;

      }


      .ctr-connect-from circle {

        fill: #e7f1fa !important;

        stroke: #125b94 !important;

        stroke-width: 2.2 !important;

      }


      .ctr-connect-to circle {

        fill: #edf7eb !important;

        stroke: #407545 !important;

        stroke-width: 2.2 !important;

      }


      .ctr-station-connection-visible {

        fill: none;

        stroke: #111111;

        stroke-width: 1.5;

        stroke-linecap: square;

        stroke-linejoin: miter;

        pointer-events: none;

      }


      .ctr-station-connection-hit {

        fill: none;

        stroke: transparent;

        stroke-width: 16;

        cursor: pointer;

        pointer-events: stroke;

      }


      .ctr-connection-label {

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


      [data-ctr-connection]:hover
      .ctr-station-connection-visible {

        stroke: #165b94;

        stroke-width: 2;

      }


      @media
      (max-width: 760px) {

        #stationConnectionPanel {

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

    const rack =
      getActiveRack();


    const fromSelect =
      document.getElementById(
        "stationConnectionFrom"
      );


    const toSelect =
      document.getElementById(
        "stationConnectionTo"
      );


    if (
      !rack ||
      !fromSelect ||
      !toSelect
    ) {

      return;

    }


    const options =
      getTerminalOptions(
        rack
      );


    fromSelect.replaceChildren();

    toSelect.replaceChildren();


    options.forEach(
      function (
        item
      ) {

        const optionFrom =
          document.createElement(
            "option"
          );


        optionFrom.value =
          item.id;


        optionFrom.textContent =
          item.label;


        fromSelect.appendChild(
          optionFrom
        );


        const optionTo =
          document.createElement(
            "option"
          );


        optionTo.value =
          item.id;


        optionTo.textContent =
          item.label;


        toSelect.appendChild(
          optionTo
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
        "stationConnectionPosition"
      )?.value ||
      "UPPER";


    const note =
      document.getElementById(
        "stationConnectionNote"
      );


    const label =
      document.getElementById(
        "stationConnectionParticularLabel"
      );


    const cableField =
      document.getElementById(
        "stationConnectionCableField"
      );


    const locationField =
      document.getElementById(
        "stationConnectionLocationField"
      );


    const type =
      document.getElementById(
        "stationConnectionType"
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


      if (cableField) {

        cableField.hidden =
          false;

      }


      if (locationField) {

        locationField.hidden =
          false;

      }


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
          "Upper Bridge joins two terminal upper points. Overlapping bridges are automatically placed on higher levels.";

      }


      if (label) {

        label.textContent =
          "Circuit / Bridge Particular";

      }


      if (cableField) {

        cableField.hidden =
          true;

      }


      if (locationField) {

        locationField.hidden =
          true;

      }


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
     OPEN PANEL
  ===================================================== */

  function openPanel(
    connection = null
  ) {

    const panel =
      document.getElementById(
        "stationConnectionPanel"
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
      "stationConnectionTitle"
    ).textContent =
      connection
        ? "Edit Connection"
        : "New Connection";


    const position =
      document.getElementById(
        "stationConnectionPosition"
      );


    position.value =
      connection?.position ||
      "UPPER";


    const type =
      document.getElementById(
        "stationConnectionType"
      );


    type.value =
      connection?.type ||
      (
        position.value === "LOWER"
          ? "CABLE"
          : "BRIDGE"
      );


    document.getElementById(
      "stationConnectionParticular"
    ).value =
      connection?.particular ||
      "";


    document.getElementById(
      "stationConnectionCable"
    ).value =
      connection?.cableCore ||
      "";


    document.getElementById(
      "stationConnectionLocation"
    ).value =
      connection?.connectedLocation ||
      "";


    document.getElementById(
      "stationConnectionRemarks"
    ).value =
      connection?.remarks ||
      "";


    document.getElementById(
      "stationConnectionRemove"
    ).hidden =
      !connection;


    updatePositionUi();


    panel.hidden =
      false;

  }


  function closePanel() {

    const panel =
      document.getElementById(
        "stationConnectionPanel"
      );


    if (panel) {

      panel.hidden =
        true;

    }


    editingConnectionId =
      null;

  }


  /* =====================================================
     VALIDATION
  ===================================================== */

  function validateConnection(
    rack,
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
        rack,
        fromId
      );


    const to =
      findTerminalById(
        rack,
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


    const rack =
      getActiveRack();


    if (!rack) {

      return;

    }


    const fromId =
      document.getElementById(
        "stationConnectionFrom"
      )?.value ||
      "";


    const toId =
      document.getElementById(
        "stationConnectionTo"
      )?.value ||
      "";


    const position =
      document.getElementById(
        "stationConnectionPosition"
      )?.value ||
      "UPPER";


    if (
      !validateConnection(
        rack,
        fromId,
        toId,
        position
      )
    ) {

      return;

    }


    const connections =
      ensureRackConnections(
        rack
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
        "stationConnectionType"
      )?.value ||
      (
        position === "LOWER"
          ? "CABLE"
          : "BRIDGE"
      );


    connection.particular =
      document.getElementById(
        "stationConnectionParticular"
      )?.value?.trim() ||
      "";


    connection.cableCore =
      position === "LOWER"
        ? (
            document.getElementById(
              "stationConnectionCable"
            )?.value?.trim() ||
            ""
          )
        : "";


    connection.connectedLocation =
      position === "LOWER"
        ? (
            document.getElementById(
              "stationConnectionLocation"
            )?.value?.trim() ||
            ""
          )
        : "";


    connection.remarks =
      document.getElementById(
        "stationConnectionRemarks"
      )?.value?.trim() ||
      "";


    connection.updatedAt =
      new Date()
        .toISOString();


    delete connection.style;


    closePanel();

    cancelConnectMode();

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


    const rack =
      getActiveRack();


    if (!rack) {

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
      ensureRackConnections(
        rack
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

    cancelConnectMode();

    drawConnections();

  }


  /* =====================================================
     CONNECT MODE
  ===================================================== */

  function startConnectMode() {

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

    clearTerminalHighlights();


    document
      .getElementById(
        "stationAddConnection"
      )
      ?.classList
      .add(
        "active"
      );


    setStatus(
      "Select FROM terminal"
    );

  }


  function cancelConnectMode() {

    connectMode =
      false;


    fromTerminalId =
      null;


    toTerminalId =
      null;


    clearTerminalHighlights();


    document
      .getElementById(
        "stationAddConnection"
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
     TERMINAL SVG
  ===================================================== */

  function getTerminalFromSvgElement(
    element
  ) {

    const rack =
      getActiveRack();


    if (
      !rack ||
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
      rack.rows?.[rowIndex];


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


  function clearTerminalHighlights() {

    document
      .querySelectorAll(
        ".ctr-connect-from, .ctr-connect-to"
      )
      .forEach(
        function (
          element
        ) {

          element.classList.remove(
            "ctr-connect-from",
            "ctr-connect-to"
          );

        }
      );

  }


  function highlightPickedTerminals() {

    clearTerminalHighlights();


    const host =
      document.getElementById(
        "stationSvgHost"
      );


    if (!host) {

      return;

    }


    host
      .querySelectorAll(
        '[data-ctr-object="terminal"]'
      )
      .forEach(
        function (
          element
        ) {

          const data =
            getTerminalFromSvgElement(
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
              "ctr-connect-from"
            );

          }


          if (
            String(data.terminal.id) ===
            String(toTerminalId)
          ) {

            element.classList.add(
              "ctr-connect-to"
            );

          }

        }
      );

  }


  function getTerminalSvgPoint(
    svg,
    rack,
    terminalId,
    port
  ) {

    const found =
      findTerminalById(
        rack,
        terminalId
      );


    if (!found) {

      return null;

    }


    const element =
      svg.querySelector(

        `[data-ctr-object="terminal"]` +
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


  function drawConnectionLabel(
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
      "ctr-connection-label"
    );


    label.textContent =
      text;


    group.appendChild(
      label
    );

  }


  /* =====================================================
     BRIDGE LEVEL SYSTEM
  ===================================================== */

  function getBridgeSpan(
    rack,
    connection
  ) {

    const from =
      findTerminalById(
        rack,
        connection.fromTerminalId
      );


    const to =
      findTerminalById(
        rack,
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
    rack
  ) {

    const laneMap =
      new Map();


    const bridges =
      [];


    ensureRackConnections(
      rack
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
              rack,
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


    /*
       Small bridges stay near terminals.
       Large overlapping bridges move upward.
    */

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
     LOWER LEVEL
  ===================================================== */

  function getLowerConnectionLane(
    rack,
    connection,
    currentIndex
  ) {

    const current =
      findTerminalById(
        rack,
        connection.fromTerminalId
      );


    if (!current) {

      return 0;

    }


    let lane =
      0;


    const connections =
      ensureRackConnections(
        rack
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
          rack,
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

  function drawUpperConnection(
    group,
    svg,
    rack,
    connection,
    lane
  ) {

    const from =
      getTerminalSvgPoint(
        svg,
        rack,
        connection.fromTerminalId,
        "TOP"
      );


    const to =
      getTerminalSvgPoint(
        svg,
        rack,
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
      "ctr-station-connection-visible"
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
      "ctr-station-connection-hit"
    );


    group.appendChild(
      hit
    );


    drawConnectionLabel(

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

     IMPORTANT:
     ONLY FROM + TO TERMINAL CONNECT.
  ===================================================== */

  function drawLowerConnection(
    group,
    svg,
    rack,
    connection,
    index
  ) {

    const from =
      getTerminalSvgPoint(
        svg,
        rack,
        connection.fromTerminalId,
        "BOTTOM"
      );


    const to =
      getTerminalSvgPoint(
        svg,
        rack,
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
      getLowerConnectionLane(
        rack,
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
      "ctr-station-connection-visible"
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
      "ctr-station-connection-hit"
    );


    group.appendChild(
      hit
    );


    drawConnectionLabel(

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
    rack,
    connection,
    index,
    upperLaneMap
  ) {

    const group =
      createSvgElement(
        "g"
      );


    group.setAttribute(
      "data-ctr-connection",
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
        drawLowerConnection(
          group,
          svg,
          rack,
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
        drawUpperConnection(
          group,
          svg,
          rack,
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
          rack,
          connection.fromTerminalId
        )} → ${describeTerminal(
          rack,
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
        "stationSvgHost"
      );


    const svg =
      host?.querySelector(
        "svg"
      );


    const rack =
      getActiveRack();


    if (
      !svg ||
      !rack
    ) {

      return;

    }


    svg
      .querySelector(
        "#stationConnectionLayer"
      )
      ?.remove();


    const layer =
      createSvgElement(
        "g"
      );


    layer.id =
      "stationConnectionLayer";


    const upperLaneMap =
      buildUpperBridgeLaneMap(
        rack
      );


    ensureRackConnections(
      rack
    )
      .forEach(
        function (
          connection,
          index
        ) {

          drawSingleConnection(

            layer,

            svg,

            rack,

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


  function scheduleConnectionDraw(
    delay = 100
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

  function openExistingConnection(
    connectionId
  ) {

    const rack =
      getActiveRack();


    if (!rack) {

      return;

    }


    const connection =
      ensureRackConnections(
        rack
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


    cancelConnectMode();


    fromTerminalId =
      connection.fromTerminalId;


    toTerminalId =
      connection.toTerminalId;


    highlightPickedTerminals();


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
        "[data-ctr-connection]"
      );


    if (
      existing &&
      !connectMode
    ) {

      event.preventDefault();

      event.stopPropagation();

      event.stopImmediatePropagation();


      openExistingConnection(
        existing.getAttribute(
          "data-ctr-connection"
        )
      );


      return;

    }


    if (!connectMode) {

      return;

    }


    const terminalElement =
      event.target.closest(
        '[data-ctr-object="terminal"]'
      );


    if (!terminalElement) {

      return;

    }


    event.preventDefault();

    event.stopPropagation();

    event.stopImmediatePropagation();


    const data =
      getTerminalFromSvgElement(
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


      highlightPickedTerminals();


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


    highlightPickedTerminals();


    setStatus(
      "Set connection details"
    );


    openPanel(
      null
    );

  }


  /* =====================================================
     OBSERVER
  ===================================================== */

  function observeSvgHost() {

    const host =
      document.getElementById(
        "stationSvgHost"
      );


    if (
      !host ||
      host.dataset.stationConnectionsObserved
    ) {

      return;

    }


    host.dataset.stationConnectionsObserved =
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
              "#stationConnectionLayer"
            )
          ) {

            scheduleConnectionDraw(
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
     EVENTS
  ===================================================== */

  function bindEvents() {

    const addButton =
      document.getElementById(
        "stationAddConnection"
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

            cancelConnectMode();

          }

          else {

            startConnectMode();

          }

        }
      );

    }


    document
      .getElementById(
        "stationConnectionClose"
      )
      ?.addEventListener(
        "click",
        function () {

          closePanel();

          cancelConnectMode();

        }
      );


    document
      .getElementById(
        "stationConnectionCancel"
      )
      ?.addEventListener(
        "click",
        function () {

          closePanel();

          cancelConnectMode();

        }
      );


    document
      .getElementById(
        "stationConnectionSave"
      )
      ?.addEventListener(
        "click",
        saveConnection
      );


    document
      .getElementById(
        "stationConnectionRemove"
      )
      ?.addEventListener(
        "click",
        removeConnection
      );


    document
      .getElementById(
        "stationConnectionPosition"
      )
      ?.addEventListener(
        "change",
        updatePositionUi
      );


    document
      .getElementById(
        "stationConnectionFrom"
      )
      ?.addEventListener(
        "change",
        function () {

          fromTerminalId =
            this.value;


          highlightPickedTerminals();

        }
      );


    document
      .getElementById(
        "stationConnectionTo"
      )
      ?.addEventListener(
        "change",
        function () {

          toTerminalId =
            this.value;


          highlightPickedTerminals();

        }
      );


    document
      .getElementById(
        "stationSvgRackSelect"
      )
      ?.addEventListener(
        "change",
        function () {

          closePanel();

          cancelConnectMode();


          setTimeout(
            drawConnections,
            150
          );

        }
      );


    document
      .getElementById(
        "stationSvgRefresh"
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
        "stationSvgHost"
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
     READY
  ===================================================== */

  function ensureReady() {

    const actions =
      document.querySelector(
        ".station-svg-actions"
      );


    const host =
      document.getElementById(
        "stationSvgHost"
      );


    if (
      !actions ||
      !host
    ) {

      return false;

    }


    createPanel();

    bindEvents();


    getStationRacks()
      .forEach(
        function (
          rack
        ) {

          ensureRackConnections(
            rack
          );

        }
      );


    return true;

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


    bootTimer =
      setInterval(
        function () {

          attempts++;


          if (
            ensureReady()
          ) {

            clearInterval(
              bootTimer
            );


            initialized =
              true;


            observeSvgHost();


            setTimeout(
              drawConnections,
              300
            );


            setTimeout(
              drawConnections,
              1000
            );


            window.CTR_STATION_CONNECTIONS = {

              version:
                VERSION,

              redraw:
                drawConnections,

              start:
                startConnectMode,

              cancel:
                cancelConnectMode,

              getActiveConnections:
                function () {

                  return ensureRackConnections(
                    getActiveRack()
                  );

                }

            };


            console.log(
              "CTR Station Connections:",
              VERSION,
              "ready"
            );


            return;

          }


          if (
            attempts >= 60
          ) {

            clearInterval(
              bootTimer
            );


            console.error(
              "CTR Station Connections: Drawing View not found."
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