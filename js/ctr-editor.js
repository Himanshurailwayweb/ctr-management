/* =========================================================
   CTR MANAGEMENT SYSTEM
   COMPLETE SVG CTR EDITOR

   VERSION 3.1

   FEATURES
   ---------------------------------------------------------
   TERMINAL
   - Circuit / Signal Particular
   - Connected Location
   - Connected Terminal
   - SPARE / IN USE
   - Remarks

   CONNECTION
   - + Connect Terminals
   - First click = FROM
   - Second click = TO
   - FROM / TO can also be changed manually
   - Normal / Jumper / Fuse Link / Cable / External
   - Circuit / Particular
   - Cable / Core
   - Connected Location
   - Remarks
   - Edit existing connection
   - Remove existing connection

   ROUTING
   ---------------------------------------------------------
   Terminal bottom
        |
        |
        +----------------------+
                               |
                               |
                          Terminal bottom

   IMPORTANT
   ---------------------------------------------------------
   Drawing appearance stays engineering-style SVG.
   Station structure remains data-driven.
========================================================= */

(function () {

  "use strict";


  const EDITOR_VERSION =
    "3.1.0";


  /* =====================================================
     STATE
  ===================================================== */

  let selectedTerminalId =
    null;


  let selectedConnectionIndex =
    null;


  let connectMode =
    false;


  let connectStep =
    null;


  let pendingFromTerminal =
    null;


  let pendingToTerminal =
    null;


  /* =====================================================
     BASIC HELPERS
  ===================================================== */

  function getPrototype() {

    return (
      window.CTR_PROTOTYPE ||
      null
    );

  }


  function getDrawingHost() {

    return document.getElementById(
      "drawingHost"
    );

  }


  function createId(
    prefix = "OBJ"
  ) {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
      "function"
    ) {

      return (
        `${prefix}-` +
        window.crypto.randomUUID()
      );

    }


    return (
      `${prefix}-` +
      Date.now() +
      "-" +
      Math.random()
        .toString(16)
        .slice(2)
    );

  }


  /* =====================================================
     CONNECTION DATA
  ===================================================== */

  function getConnections() {

    const prototype =
      getPrototype();


    if (
      !prototype ||
      !prototype.data
    ) {

      return [];

    }


    if (
      !Array.isArray(
        prototype.data.connections
      )
    ) {

      prototype.data.connections =
        [];

    }


    return prototype.data
      .connections;

  }


  function ensureConnectionIds() {

    getConnections()
      .forEach(
        function (
          connection,
          index
        ) {

          if (
            !connection.id
          ) {

            connection.id =
              `CONNECTION-${index + 1}`;

          }

        }
      );

  }


  /* =====================================================
     TERMINAL LIST
  ===================================================== */

  function getTerminalIds() {

    const prototype =
      getPrototype();


    const registry =
      prototype
        ?.result
        ?.registry
        ?.terminals;


    if (!registry) {

      return [];

    }


    return Array.from(
      registry.keys()
    );

  }


  function populateTerminalSelects() {

    const ids =
      getTerminalIds();


    [
      "ctrConnectionFrom",
      "ctrConnectionTo"
    ]
      .forEach(
        function (
          selectId
        ) {

          const select =
            document.getElementById(
              selectId
            );


          if (!select) {

            return;

          }


          const oldValue =
            select.value;


          select.innerHTML = `
            <option value="">
              Select terminal
            </option>
          `;


          ids.forEach(
            function (
              terminalId
            ) {

              const option =
                document.createElement(
                  "option"
                );


              option.value =
                terminalId;


              option.textContent =
                terminalId;


              select.appendChild(
                option
              );

            }
          );


          if (
            ids.includes(
              oldValue
            )
          ) {

            select.value =
              oldValue;

          }

        }
      );

  }


  /* =====================================================
     TERMINAL DETAILS STORE
  ===================================================== */

  function ensureTerminalStore() {

    const prototype =
      getPrototype();


    if (
      !prototype ||
      !prototype.data
    ) {

      return null;

    }


    if (
      !prototype.data
        .terminalDetails ||
      typeof prototype.data
        .terminalDetails !==
      "object"
    ) {

      prototype.data
        .terminalDetails = {};

    }


    return prototype.data
      .terminalDetails;

  }


  /* =====================================================
     TERMINAL CONTEXT
  ===================================================== */

  function getTerminalContext(
    terminalId
  ) {

    const prototype =
      getPrototype();


    const terminal =
      prototype
        ?.result
        ?.registry
        ?.terminals
        ?.get(
          terminalId
        );


    if (!terminal) {

      return null;

    }


    const rows =
      Array.isArray(
        prototype.data
          .terminalRows
      )
        ? prototype.data
            .terminalRows
        : [];


    const row =
      rows.find(
        function (
          item
        ) {

          return (
            String(
              item.id
            ) ===
            String(
              terminal.rowId
            )
          );

        }
      );


    if (!row) {

      return null;

    }


    const store =
      ensureTerminalStore();


    if (!store) {

      return null;

    }


    const index =
      Number.isFinite(
        Number(
          terminal.index
        )
      )
        ? Number(
            terminal.index
          )
        : 0;


    const particular =
      Array.isArray(
        row.labels
      )
        ? (
            row.labels[
              index
            ] ||
            ""
          )
        : "";


    if (
      !store[
        terminalId
      ]
    ) {

      store[
        terminalId
      ] = {

        particular:
          particular,

        locationBox:
          "",

        locationTerminal:
          "",

        status:
          "SPARE",

        remarks:
          ""

      };

    }


    return {

      terminal:
        terminal,

      row:
        row,

      index:
        index,

      number:
        terminal.number ||
        (
          Number(
            row.startNumber ||
            1
          ) +
          index
        ),

      details:
        store[
          terminalId
        ]

    };

  }


  /* =====================================================
     STYLES
  ===================================================== */

  function injectStyles() {

    if (
      document.getElementById(
        "ctrEditorCompleteStyles"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "ctrEditorCompleteStyles";


    style.textContent = `

      /* ===============================================
         EDITING TOOLBAR
      =============================================== */

      #ctrDrawingEditorToolbar {

        display:
          flex;

        align-items:
          center;

        flex-wrap:
          wrap;

        gap:
          8px;

        min-height:
          48px;

        padding:
          8px 12px;

        border-top:
          1px solid #c3ccd5;

        border-bottom:
          1px solid #b8c4cf;

        background:
          #f4f6f8;

        font-family:
          Arial,
          sans-serif;

      }


      #ctrDrawingEditorToolbar button {

        min-height:
          33px;

        padding:
          0 13px;

        border:
          1px solid #173e6e;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #173e6e;

        cursor:
          pointer;

        font-size:
          10px;

        font-weight:
          700;

      }


      #ctrStartConnect.active {

        background:
          #173e6e;

        color:
          #ffffff;

      }


      #ctrCancelConnect {

        border-color:
          #9caab8 !important;

        color:
          #596b7c !important;

      }


      #ctrConnectStatus {

        margin-left:
          4px;

        color:
          #53687b;

        font-size:
          10px;

        font-weight:
          600;

      }


      /* ===============================================
         PROPERTIES PANEL
      =============================================== */

      .ctr-properties-panel {

        position:
          fixed;

        top:
          150px;

        right:
          18px;

        z-index:
          3000;

        width:
          360px;

        max-height:
          calc(100vh - 175px);

        overflow-y:
          auto;

        border:
          1px solid #b9c6d2;

        border-radius:
          4px;

        background:
          #ffffff;

        box-shadow:
          0 8px 30px
          rgba(0,0,0,0.20);

        font-family:
          Arial,
          sans-serif;

      }


      .ctr-properties-panel[hidden] {

        display:
          none !important;

      }


      .ctr-editor-head {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          12px;

        padding:
          12px 14px;

        border-bottom:
          1px solid #102f52;

        background:
          #173e6e;

        color:
          #ffffff;

      }


      .ctr-editor-head span {

        display:
          block;

        margin-bottom:
          3px;

        font-size:
          9px;

        font-weight:
          700;

        letter-spacing:
          1px;

        opacity:
          0.8;

      }


      .ctr-editor-head strong {

        display:
          block;

        font-size:
          14px;

      }


      .ctr-editor-close {

        width:
          29px;

        height:
          29px;

        padding:
          0;

        border:
          1px solid
          rgba(255,255,255,0.45);

        background:
          transparent;

        color:
          #ffffff;

        cursor:
          pointer;

        font-size:
          18px;

      }


      .ctr-editor-body {

        padding:
          14px;

      }


      .ctr-info-grid {

        display:
          grid;

        grid-template-columns:
          1fr 1fr;

        gap:
          8px;

        margin-bottom:
          13px;

      }


      .ctr-info-box {

        padding:
          9px;

        border:
          1px solid #d9e1e8;

        background:
          #f7f9fb;

      }


      .ctr-info-box span {

        display:
          block;

        margin-bottom:
          4px;

        color:
          #708091;

        font-size:
          8px;

        font-weight:
          700;

        text-transform:
          uppercase;

      }


      .ctr-info-box strong {

        color:
          #173e6e;

        font-size:
          13px;

      }


      .ctr-status-strip {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        margin-bottom:
          13px;

        padding:
          8px 10px;

        border:
          1px solid #d8e0e7;

        background:
          #f7f9fb;

      }


      .ctr-status-strip span {

        color:
          #68798a;

        font-size:
          9px;

        font-weight:
          700;

      }


      #ctrTerminalStatusDisplay {

        color:
          #173e6e;

        font-size:
          10px;

      }


      .ctr-editor-field {

        margin-bottom:
          12px;

      }


      .ctr-editor-field label {

        display:
          block;

        margin-bottom:
          5px;

        color:
          #30475d;

        font-size:
          10px;

        font-weight:
          700;

      }


      .ctr-editor-field input,
      .ctr-editor-field select,
      .ctr-editor-field textarea {

        width:
          100%;

        border:
          1px solid #bcc8d4;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #172d43;

        font-family:
          Arial,
          sans-serif;

        font-size:
          12px;

      }


      .ctr-editor-field input,
      .ctr-editor-field select {

        height:
          37px;

        padding:
          0 9px;

      }


      .ctr-editor-field textarea {

        min-height:
          70px;

        padding:
          8px 9px;

        resize:
          vertical;

      }


      .ctr-editor-field input:focus,
      .ctr-editor-field select:focus,
      .ctr-editor-field textarea:focus {

        outline:
          2px solid
          rgba(23,62,110,0.12);

        border-color:
          #173e6e;

      }


      .ctr-two-column {

        display:
          grid;

        grid-template-columns:
          1fr 1fr;

        gap:
          9px;

      }


      .ctr-editor-actions {

        display:
          flex;

        gap:
          8px;

      }


      .ctr-editor-actions button {

        min-height:
          37px;

        padding:
          0 12px;

        border-radius:
          3px;

        cursor:
          pointer;

        font-size:
          10px;

        font-weight:
          700;

      }


      .ctr-primary {

        flex:
          1;

        border:
          1px solid #173e6e;

        background:
          #173e6e;

        color:
          #ffffff;

      }


      .ctr-secondary {

        border:
          1px solid #bdc8d3;

        background:
          #ffffff;

        color:
          #43576b;

      }


      .ctr-danger {

        width:
          100%;

        min-height:
          37px;

        margin-top:
          8px;

        border:
          1px solid #b42318;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #a51f16;

        cursor:
          pointer;

        font-size:
          10px;

        font-weight:
          700;

      }


      /* ===============================================
         TERMINAL INTERACTION
      =============================================== */

      #drawingHost
      [data-object-type="terminal"] {

        cursor:
          pointer;

      }


      #drawingHost
      [data-object-type="terminal"]:hover
      circle {

        stroke:
          #1266b1 !important;

        stroke-width:
          2.5 !important;

      }


      #drawingHost
      [data-object-type="terminal"].ctr-terminal-selected
      circle {

        fill:
          #e8f2fb !important;

        stroke:
          #1266b1 !important;

        stroke-width:
          2.6 !important;

      }


      /* FROM terminal */

      #drawingHost
      [data-object-type="terminal"].ctr-connect-from
      circle {

        fill:
          #e9f7ed !important;

        stroke:
          #287841 !important;

        stroke-width:
          3 !important;

      }


      /* TO terminal */

      #drawingHost
      [data-object-type="terminal"].ctr-connect-to
      circle {

        fill:
          #fff2dd !important;

        stroke:
          #a56300 !important;

        stroke-width:
          3 !important;

      }


      /* ===============================================
         CONDUCTOR INTERACTION
      =============================================== */

      #drawingHost
      [data-object-type="conductor"] {

        cursor:
          pointer;

      }


      #drawingHost
      [data-conductor-role="visible"].ctr-conductor-selected {

        stroke:
          #1266b1 !important;

        stroke-width:
          3 !important;

      }


      @media
      (max-width: 760px) {

        .ctr-properties-panel {

          top:
            auto;

          left:
            8px;

          right:
            8px;

          bottom:
            8px;

          width:
            auto;

          max-height:
            60vh;

        }


        .ctr-two-column {

          grid-template-columns:
            1fr;

        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =====================================================
     CREATE TOOLBAR
  ===================================================== */

  function createToolbar() {

    if (
      document.getElementById(
        "ctrDrawingEditorToolbar"
      )
    ) {

      return;

    }


    const host =
      getDrawingHost();


    if (
      !host ||
      !host.parentNode
    ) {

      return;

    }


    const toolbar =
      document.createElement(
        "div"
      );


    toolbar.id =
      "ctrDrawingEditorToolbar";


    toolbar.innerHTML = `

      <button
        type="button"
        id="ctrStartConnect"
      >
        + Connect Terminals
      </button>


      <button
        type="button"
        id="ctrCancelConnect"
        hidden
      >
        Cancel
      </button>


      <span id="ctrConnectStatus">
        Click any terminal to edit.
      </span>

    `;


    host.parentNode.insertBefore(
      toolbar,
      host
    );

  }


  /* =====================================================
     CREATE TERMINAL PANEL
  ===================================================== */

  function createTerminalPanel() {

    if (
      document.getElementById(
        "ctrTerminalPanel"
      )
    ) {

      return;

    }


    const panel =
      document.createElement(
        "aside"
      );


    panel.id =
      "ctrTerminalPanel";


    panel.className =
      "ctr-properties-panel";


    panel.hidden =
      true;


    panel.innerHTML = `

      <div class="ctr-editor-head">

        <div>

          <span>
            TERMINAL PROPERTIES
          </span>

          <strong id="ctrTerminalTitle">
            Selected Terminal
          </strong>

        </div>


        <button
          type="button"
          class="ctr-editor-close"
          id="ctrTerminalClose"
        >
          ×
        </button>

      </div>


      <div class="ctr-editor-body">


        <div class="ctr-info-grid">


          <div class="ctr-info-box">

            <span>
              Row
            </span>

            <strong id="ctrTerminalRow">
              —
            </strong>

          </div>


          <div class="ctr-info-box">

            <span>
              Terminal
            </span>

            <strong id="ctrTerminalNumber">
              —
            </strong>

          </div>


        </div>


        <div class="ctr-status-strip">

          <span>
            Current Status
          </span>

          <strong id="ctrTerminalStatusDisplay">
            SPARE
          </strong>

        </div>


        <div class="ctr-editor-field">

          <label for="ctrTerminalParticular">
            Circuit / Signal Particular
          </label>

          <input
            id="ctrTerminalParticular"
            type="text"
            placeholder="Enter circuit / particular"
          >

        </div>


        <div class="ctr-two-column">


          <div class="ctr-editor-field">

            <label for="ctrTerminalLocation">
              Connected Location
            </label>

            <input
              id="ctrTerminalLocation"
              type="text"
              placeholder="Example: LOC-5"
            >

          </div>


          <div class="ctr-editor-field">

            <label for="ctrTerminalConnected">
              Connected Terminal / Conductor
            </label>

            <input
              id="ctrTerminalConnected"
              type="text"
              placeholder="Example: 12"
            >

          </div>


        </div>


        <div class="ctr-editor-field">

          <label for="ctrTerminalStatus">
            Terminal Status
          </label>

          <select id="ctrTerminalStatus">

            <option value="SPARE">
              SPARE
            </option>

            <option value="IN USE">
              IN USE
            </option>

          </select>

        </div>


        <div class="ctr-editor-field">

          <label for="ctrTerminalRemarks">
            Remarks
          </label>

          <textarea
            id="ctrTerminalRemarks"
            placeholder="Enter remarks"
          ></textarea>

        </div>


        <div class="ctr-editor-actions">

          <button
            type="button"
            class="ctr-primary"
            id="ctrTerminalSave"
          >
            Save Terminal
          </button>


          <button
            type="button"
            class="ctr-secondary"
            id="ctrTerminalClear"
          >
            Clear
          </button>

        </div>


      </div>

    `;


    document.body.appendChild(
      panel
    );

  }


  /* =====================================================
     CREATE CONNECTION PANEL
  ===================================================== */

  function createConnectionPanel() {

    if (
      document.getElementById(
        "ctrConnectionPanel"
      )
    ) {

      return;

    }


    const panel =
      document.createElement(
        "aside"
      );


    panel.id =
      "ctrConnectionPanel";


    panel.className =
      "ctr-properties-panel";


    panel.hidden =
      true;


    panel.innerHTML = `

      <div class="ctr-editor-head">

        <div>

          <span>
            CONDUCTOR / CONNECTION
          </span>

          <strong id="ctrConnectionTitle">
            New Connection
          </strong>

        </div>


        <button
          type="button"
          class="ctr-editor-close"
          id="ctrConnectionClose"
        >
          ×
        </button>

      </div>


      <div class="ctr-editor-body">


        <div class="ctr-editor-field">

          <label for="ctrConnectionFrom">
            FROM Terminal
          </label>

          <select id="ctrConnectionFrom">
          </select>

        </div>


        <div class="ctr-editor-field">

          <label for="ctrConnectionTo">
            TO Terminal
          </label>

          <select id="ctrConnectionTo">
          </select>

        </div>


        <div class="ctr-editor-field">

          <label for="ctrConnectionType">
            Connection Type
          </label>

          <select id="ctrConnectionType">

            <option value="NORMAL">
              Normal Conductor
            </option>

            <option value="JUMPER">
              Jumper
            </option>

            <option value="FUSE LINK">
              Fuse Link
            </option>

            <option value="CABLE">
              Cable
            </option>

            <option value="EXTERNAL">
              External Connection
            </option>

          </select>

        </div>


        <div class="ctr-editor-field">

          <label for="ctrConnectionParticular">
            Circuit / Particular
          </label>

          <input
            id="ctrConnectionParticular"
            type="text"
            placeholder="Example: S-2 RG"
          >

        </div>


        <div class="ctr-editor-field">

          <label for="ctrConnectionCable">
            Cable / Core
          </label>

          <input
            id="ctrConnectionCable"
            type="text"
            placeholder="Example: 12C / Core 5"
          >

        </div>


        <div class="ctr-editor-field">

          <label for="ctrConnectionLocation">
            Connected Location
          </label>

          <input
            id="ctrConnectionLocation"
            type="text"
            placeholder="Example: LOC-7"
          >

        </div>


        <div class="ctr-editor-field">

          <label for="ctrConnectionRemarks">
            Remarks
          </label>

          <textarea
            id="ctrConnectionRemarks"
            placeholder="Enter connection remarks"
          ></textarea>

        </div>


        <div class="ctr-editor-actions">

          <button
            type="button"
            class="ctr-primary"
            id="ctrConnectionSave"
          >
            Draw / Save Connection
          </button>

        </div>


        <button
          type="button"
          id="ctrConnectionRemove"
          class="ctr-danger"
          hidden
        >
          Remove Connection
        </button>


      </div>

    `;


    document.body.appendChild(
      panel
    );

  }


  /* =====================================================
     CLOSE TERMINAL PANEL
  ===================================================== */

  function closeTerminalPanel() {

    const panel =
      document.getElementById(
        "ctrTerminalPanel"
      );


    if (panel) {

      panel.hidden =
        true;

    }


    selectedTerminalId =
      null;


    highlightTerminals();

  }


  /* =====================================================
     CLOSE CONNECTION PANEL
  ===================================================== */

  function closeConnectionPanel() {

    const panel =
      document.getElementById(
        "ctrConnectionPanel"
      );


    if (panel) {

      panel.hidden =
        true;

    }


    selectedConnectionIndex =
      null;


    clearConductorHighlight();

  }


  /* =====================================================
     TERMINAL HIGHLIGHT
  ===================================================== */

  function highlightTerminals() {

    document
      .querySelectorAll(
        '#drawingHost [data-object-type="terminal"]'
      )
      .forEach(
        function (
          element
        ) {

          element.classList.remove(
            "ctr-terminal-selected",
            "ctr-connect-from",
            "ctr-connect-to"
          );


          const id =
            element.getAttribute(
              "data-object-id"
            );


          if (
            id ===
            selectedTerminalId
          ) {

            element.classList.add(
              "ctr-terminal-selected"
            );

          }


          if (
            id ===
            pendingFromTerminal
          ) {

            element.classList.add(
              "ctr-connect-from"
            );

          }


          if (
            id ===
            pendingToTerminal
          ) {

            element.classList.add(
              "ctr-connect-to"
            );

          }

        }
      );

  }


  /* =====================================================
     OPEN TERMINAL EDITOR
  ===================================================== */

  function openTerminalEditor(
    terminalId
  ) {

    const context =
      getTerminalContext(
        terminalId
      );


    if (!context) {

      return;

    }


    closeConnectionPanel();


    selectedTerminalId =
      terminalId;


    document.getElementById(
      "ctrTerminalTitle"
    ).textContent =
      `${context.row.name || context.row.id} / Terminal ${context.number}`;


    document.getElementById(
      "ctrTerminalRow"
    ).textContent =
      context.row.name ||
      context.row.id ||
      "—";


    document.getElementById(
      "ctrTerminalNumber"
    ).textContent =
      context.number;


    document.getElementById(
      "ctrTerminalParticular"
    ).value =
      context.details
        .particular ||
      "";


    document.getElementById(
      "ctrTerminalLocation"
    ).value =
      context.details
        .locationBox ||
      "";


    document.getElementById(
      "ctrTerminalConnected"
    ).value =
      context.details
        .locationTerminal ||
      "";


    const status =
      context.details.status ===
      "IN USE"
        ? "IN USE"
        : "SPARE";


    document.getElementById(
      "ctrTerminalStatus"
    ).value =
      status;


    document.getElementById(
      "ctrTerminalStatusDisplay"
    ).textContent =
      status;


    document.getElementById(
      "ctrTerminalRemarks"
    ).value =
      context.details
        .remarks ||
      "";


    document.getElementById(
      "ctrTerminalPanel"
    ).hidden =
      false;


    highlightTerminals();

  }


  /* =====================================================
     SAVE TERMINAL
  ===================================================== */

  function saveTerminal() {

    if (
      !selectedTerminalId
    ) {

      return;

    }


    const context =
      getTerminalContext(
        selectedTerminalId
      );


    if (!context) {

      return;

    }


    context.details.particular =
      document.getElementById(
        "ctrTerminalParticular"
      ).value.trim();


    context.details.locationBox =
      document.getElementById(
        "ctrTerminalLocation"
      ).value.trim();


    context.details.locationTerminal =
      document.getElementById(
        "ctrTerminalConnected"
      ).value.trim();


    context.details.status =
      document.getElementById(
        "ctrTerminalStatus"
      ).value ===
      "IN USE"

        ? "IN USE"

        : "SPARE";


    context.details.remarks =
      document.getElementById(
        "ctrTerminalRemarks"
      ).value.trim();


    if (
      !Array.isArray(
        context.row.labels
      )
    ) {

      context.row.labels =
        [];

    }


    while (
      context.row.labels.length <=
      context.index
    ) {

      context.row.labels.push(
        ""
      );

    }


    context.row.labels[
      context.index
    ] =
      context.details
        .particular;


    const keep =
      selectedTerminalId;


    rerenderDrawing();


    openTerminalEditor(
      keep
    );

  }


  /* =====================================================
     CLEAR TERMINAL
  ===================================================== */

  function clearTerminal() {

    if (
      !selectedTerminalId
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        "Clear this terminal data?"
      );


    if (!confirmed) {

      return;

    }


    document.getElementById(
      "ctrTerminalParticular"
    ).value =
      "";


    document.getElementById(
      "ctrTerminalLocation"
    ).value =
      "";


    document.getElementById(
      "ctrTerminalConnected"
    ).value =
      "";


    document.getElementById(
      "ctrTerminalStatus"
    ).value =
      "SPARE";


    document.getElementById(
      "ctrTerminalStatusDisplay"
    ).textContent =
      "SPARE";


    document.getElementById(
      "ctrTerminalRemarks"
    ).value =
      "";


    saveTerminal();

  }


  /* =====================================================
     START CONNECT MODE
  ===================================================== */

  function startConnectMode() {

    connectMode =
      true;


    connectStep =
      "FROM";


    pendingFromTerminal =
      null;


    pendingToTerminal =
      null;


    selectedTerminalId =
      null;


    closeTerminalPanel();

    closeConnectionPanel();


    const startButton =
      document.getElementById(
        "ctrStartConnect"
      );


    if (startButton) {

      startButton.classList.add(
        "active"
      );

    }


    document.getElementById(
      "ctrCancelConnect"
    ).hidden =
      false;


    document.getElementById(
      "ctrConnectStatus"
    ).textContent =
      "Select FROM terminal";


    highlightTerminals();

  }


  /* =====================================================
     CANCEL CONNECT MODE
  ===================================================== */

  function cancelConnectMode() {

    connectMode =
      false;


    connectStep =
      null;


    pendingFromTerminal =
      null;


    pendingToTerminal =
      null;


    document.getElementById(
      "ctrStartConnect"
    )
      ?.classList
      .remove(
        "active"
      );


    const cancel =
      document.getElementById(
        "ctrCancelConnect"
      );


    if (cancel) {

      cancel.hidden =
        true;

    }


    const status =
      document.getElementById(
        "ctrConnectStatus"
      );


    if (status) {

      status.textContent =
        "Click any terminal to edit.";

    }


    highlightTerminals();

  }


  /* =====================================================
     CONNECT TERMINAL CLICK
  ===================================================== */

  function handleConnectTerminal(
    terminalId
  ) {

    if (
      connectStep ===
      "FROM"
    ) {

      pendingFromTerminal =
        terminalId;


      connectStep =
        "TO";


      document.getElementById(
        "ctrConnectStatus"
      ).textContent =
        `FROM: ${terminalId} — now select TO terminal`;


      highlightTerminals();


      return;

    }


    if (
      connectStep ===
      "TO"
    ) {

      if (
        terminalId ===
        pendingFromTerminal
      ) {

        window.alert(
          "FROM and TO terminal cannot be same."
        );


        return;

      }


      pendingToTerminal =
        terminalId;


      document.getElementById(
        "ctrConnectStatus"
      ).textContent =
        `${pendingFromTerminal} → ${pendingToTerminal}`;


      highlightTerminals();


      openNewConnectionPanel();

    }

  }


  /* =====================================================
     OPEN NEW CONNECTION PANEL
  ===================================================== */

  function openNewConnectionPanel() {

    populateTerminalSelects();


    selectedConnectionIndex =
      null;


    document.getElementById(
      "ctrConnectionTitle"
    ).textContent =
      "New Connection";


    document.getElementById(
      "ctrConnectionFrom"
    ).value =
      pendingFromTerminal ||
      "";


    document.getElementById(
      "ctrConnectionTo"
    ).value =
      pendingToTerminal ||
      "";


    document.getElementById(
      "ctrConnectionType"
    ).value =
      "NORMAL";


    document.getElementById(
      "ctrConnectionParticular"
    ).value =
      "";


    document.getElementById(
      "ctrConnectionCable"
    ).value =
      "";


    document.getElementById(
      "ctrConnectionLocation"
    ).value =
      "";


    document.getElementById(
      "ctrConnectionRemarks"
    ).value =
      "";


    document.getElementById(
      "ctrConnectionRemove"
    ).hidden =
      true;


    document.getElementById(
      "ctrConnectionPanel"
    ).hidden =
      false;

  }


  /* =====================================================
     BUILD CTR STYLE ROUTE

     Prevents conductor from sticking directly
     to terminal bottom circles.
  ===================================================== */

  function buildConnectionRoute(
    fromId,
    toId,
    connectionIndex
  ) {

    const registry =
      getPrototype()
        ?.result
        ?.registry
        ?.terminals;


    const fromTerminal =
      registry
        ?.get(
          fromId
        );


    const toTerminal =
      registry
        ?.get(
          toId
        );


    if (
      !fromTerminal?.bottomPort ||
      !toTerminal?.bottomPort
    ) {

      return [];

    }


    /*
       Basic clearance below terminals.
    */

    const baseGap =
      34;


    /*
       Give nearby connections slightly different
       levels so multiple conductors do not all
       overlap at exactly the same Y position.
    */

    const laneGap =
      12;


    const lane =
      Number.isFinite(
        Number(
          connectionIndex
        )
      )
        ? (
            Number(
              connectionIndex
            ) %
            4
          )
        : 0;


    const routeY =
      Math.max(
        fromTerminal
          .bottomPort
          .y,

        toTerminal
          .bottomPort
          .y
      ) +
      baseGap +
      (
        lane *
        laneGap
      );


    return [

      {
        x:
          fromTerminal
            .bottomPort
            .x,

        y:
          routeY
      },

      {
        x:
          toTerminal
            .bottomPort
            .x,

        y:
          routeY
      }

    ];

  }


  /* =====================================================
     SAVE / DRAW CONNECTION
  ===================================================== */

  function saveConnection() {

    const from =
      document.getElementById(
        "ctrConnectionFrom"
      ).value;


    const to =
      document.getElementById(
        "ctrConnectionTo"
      ).value;


    if (
      !from ||
      !to
    ) {

      window.alert(
        "Select FROM and TO terminals."
      );


      return;

    }


    if (
      from ===
      to
    ) {

      window.alert(
        "FROM and TO terminal cannot be same."
      );


      return;

    }


    const connections =
      getConnections();


    let connection;


    let connectionIndex;


    /* -----------------------------------------------------
       EDIT EXISTING
    ----------------------------------------------------- */

    if (
      selectedConnectionIndex !==
      null
    ) {

      connectionIndex =
        selectedConnectionIndex;


      connection =
        connections[
          connectionIndex
        ];

    }

    /* -----------------------------------------------------
       CREATE NEW
    ----------------------------------------------------- */

    else {

      connection = {

        id:
          createId(
            "WIRE"
          )

      };


      connections.push(
        connection
      );


      connectionIndex =
        connections.length - 1;


      selectedConnectionIndex =
        connectionIndex;

    }


    /* -----------------------------------------------------
       CONNECTION STRUCTURE
    ----------------------------------------------------- */

    connection.type =
      "path";


    connection.from = {

      terminal:
        from,

      port:
        "bottom"

    };


    connection.to = {

      terminal:
        to,

      port:
        "bottom"

    };


    /* -----------------------------------------------------
       CTR STYLE ROUTING
    ----------------------------------------------------- */

    connection.via =
      buildConnectionRoute(
        from,
        to,
        connectionIndex
      );


    /* -----------------------------------------------------
       ENGINEERING PARTICULARS
    ----------------------------------------------------- */

    connection.connectionType =
      document.getElementById(
        "ctrConnectionType"
      ).value;


    connection.particular =
      document.getElementById(
        "ctrConnectionParticular"
      ).value.trim();


    connection.cableCore =
      document.getElementById(
        "ctrConnectionCable"
      ).value.trim();


    connection.connectedLocation =
      document.getElementById(
        "ctrConnectionLocation"
      ).value.trim();


    connection.remarks =
      document.getElementById(
        "ctrConnectionRemarks"
      ).value.trim();


    /* -----------------------------------------------------
       EXIT CONNECT MODE
    ----------------------------------------------------- */

    pendingFromTerminal =
      null;


    pendingToTerminal =
      null;


    connectMode =
      false;


    connectStep =
      null;


    document.getElementById(
      "ctrStartConnect"
    )
      ?.classList
      .remove(
        "active"
      );


    const cancelButton =
      document.getElementById(
        "ctrCancelConnect"
      );


    if (
      cancelButton
    ) {

      cancelButton.hidden =
        true;

    }


    document.getElementById(
      "ctrConnectStatus"
    ).textContent =
      `Connection saved: ${from} → ${to}`;


    rerenderDrawing();


    openExistingConnection(
      connectionIndex
    );

  }


  /* =====================================================
     OPEN EXISTING CONNECTION
  ===================================================== */

  function openExistingConnection(
    index
  ) {

    const connections =
      getConnections();


    const connection =
      connections[
        index
      ];


    if (!connection) {

      return;

    }


    populateTerminalSelects();


    closeTerminalPanel();


    selectedConnectionIndex =
      index;


    const from =
      connection
        .from
        ?.terminal ||
      connection
        .terminalA ||
      "";


    const to =
      connection
        .to
        ?.terminal ||
      connection
        .terminalB ||
      "";


    document.getElementById(
      "ctrConnectionTitle"
    ).textContent =
      connection.id ||
      `Connection ${index + 1}`;


    document.getElementById(
      "ctrConnectionFrom"
    ).value =
      from;


    document.getElementById(
      "ctrConnectionTo"
    ).value =
      to;


    document.getElementById(
      "ctrConnectionType"
    ).value =
      connection
        .connectionType ||
      "NORMAL";


    document.getElementById(
      "ctrConnectionParticular"
    ).value =
      connection
        .particular ||
      "";


    document.getElementById(
      "ctrConnectionCable"
    ).value =
      connection
        .cableCore ||
      "";


    document.getElementById(
      "ctrConnectionLocation"
    ).value =
      connection
        .connectedLocation ||
      "";


    document.getElementById(
      "ctrConnectionRemarks"
    ).value =
      connection
        .remarks ||
      "";


    document.getElementById(
      "ctrConnectionRemove"
    ).hidden =
      false;


    document.getElementById(
      "ctrConnectionPanel"
    ).hidden =
      false;


    highlightConductor(
      connection.id,
      index
    );

  }


  /* =====================================================
     REMOVE CONNECTION
  ===================================================== */

  function removeConnection() {

    if (
      selectedConnectionIndex ===
      null
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        "Remove this connection?"
      );


    if (!confirmed) {

      return;

    }


    const connections =
      getConnections();


    connections.splice(
      selectedConnectionIndex,
      1
    );


    selectedConnectionIndex =
      null;


    closeConnectionPanel();


    rerenderDrawing();


    document.getElementById(
      "ctrConnectStatus"
    ).textContent =
      "Connection removed.";

  }


  /* =====================================================
     CLEAR CONDUCTOR HIGHLIGHT
  ===================================================== */

  function clearConductorHighlight() {

    document
      .querySelectorAll(
        '#drawingHost [data-conductor-role="visible"]'
      )
      .forEach(
        function (
          element
        ) {

          element.classList.remove(
            "ctr-conductor-selected"
          );

        }
      );

  }


  /* =====================================================
     HIGHLIGHT CONDUCTOR
  ===================================================== */

  function highlightConductor(
    connectionId,
    fallbackIndex
  ) {

    clearConductorHighlight();


    const visible =
      Array.from(
        document.querySelectorAll(
          '#drawingHost [data-conductor-role="visible"]'
        )
      );


    const exact =
      visible.find(
        function (
          element
        ) {

          return (
            element.getAttribute(
              "data-object-id"
            ) ===
            connectionId
          );

        }
      );


    if (
      exact
    ) {

      exact.classList.add(
        "ctr-conductor-selected"
      );


      return;

    }


    if (
      visible[
        fallbackIndex
      ]
    ) {

      visible[
        fallbackIndex
      ].classList.add(
        "ctr-conductor-selected"
      );

    }

  }


  /* =====================================================
     FIND CONNECTION FROM CLICKED SVG
  ===================================================== */

  function getConnectionIndexFromElement(
    conductor
  ) {

    const connections =
      getConnections();


    const id =
      conductor.getAttribute(
        "data-object-id"
      );


    /* -----------------------------------------------------
       EXACT ID
    ----------------------------------------------------- */

    if (
      id
    ) {

      const indexById =
        connections.findIndex(
          function (
            connection
          ) {

            return (
              String(
                connection.id ||
                ""
              ) ===
              String(
                id
              )
            );

          }
        );


      if (
        indexById !==
        -1
      ) {

        return indexById;

      }

    }


    /* -----------------------------------------------------
       FALLBACK BY HIT-AREA ORDER
    ----------------------------------------------------- */

    const hitAreas =
      Array.from(
        document.querySelectorAll(
          '#drawingHost [data-conductor-role="hit-area"]'
        )
      );


    const hitIndex =
      hitAreas.indexOf(
        conductor
      );


    if (
      hitIndex !==
      -1 &&
      hitIndex <
      connections.length
    ) {

      return hitIndex;

    }


    /* -----------------------------------------------------
       FALLBACK BY VISIBLE ORDER
    ----------------------------------------------------- */

    const visible =
      Array.from(
        document.querySelectorAll(
          '#drawingHost [data-conductor-role="visible"]'
        )
      );


    const visibleIndex =
      visible.indexOf(
        conductor
      );


    if (
      visibleIndex !==
      -1 &&
      visibleIndex <
      connections.length
    ) {

      return visibleIndex;

    }


    return -1;

  }


  /* =====================================================
     DRAWING CLICK
  ===================================================== */

  function handleDrawingClick(
    event
  ) {

    /* -----------------------------------------------------
       TERMINAL
    ----------------------------------------------------- */

    const terminal =
      event.target.closest(
        '[data-object-type="terminal"]'
      );


    if (
      terminal
    ) {

      const terminalId =
        terminal.getAttribute(
          "data-object-id"
        );


      if (
        !terminalId
      ) {

        return;

      }


      event.preventDefault();

      event.stopPropagation();


      if (
        connectMode
      ) {

        handleConnectTerminal(
          terminalId
        );

      }

      else {

        openTerminalEditor(
          terminalId
        );

      }


      return;

    }


    /* -----------------------------------------------------
       CONDUCTOR
    ----------------------------------------------------- */

    const conductor =
      event.target.closest(
        '[data-object-type="conductor"]'
      );


    if (
      conductor &&
      !connectMode
    ) {

      const index =
        getConnectionIndexFromElement(
          conductor
        );


      if (
        index !==
        -1
      ) {

        event.preventDefault();

        event.stopPropagation();


        openExistingConnection(
          index
        );

      }

    }

  }


  /* =====================================================
     RE-RENDER DRAWING
  ===================================================== */

  function rerenderDrawing() {

    const prototype =
      getPrototype();


    const host =
      getDrawingHost();


    if (
      !prototype ||
      !host ||
      !window.CTR_SHEET_RENDERER
    ) {

      return false;

    }


    ensureConnectionIds();


    const result =
      window
        .CTR_SHEET_RENDERER
        .renderToHost(
          host,
          prototype.data
        );


    prototype.result =
      result;


    populateTerminalSelects();


    highlightTerminals();


    return true;

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  function bindEvents() {

    getDrawingHost()
      ?.addEventListener(
        "click",
        handleDrawingClick
      );


    document.getElementById(
      "ctrStartConnect"
    )
      ?.addEventListener(
        "click",
        startConnectMode
      );


    document.getElementById(
      "ctrCancelConnect"
    )
      ?.addEventListener(
        "click",
        cancelConnectMode
      );


    document.getElementById(
      "ctrTerminalClose"
    )
      ?.addEventListener(
        "click",
        closeTerminalPanel
      );


    document.getElementById(
      "ctrTerminalSave"
    )
      ?.addEventListener(
        "click",
        saveTerminal
      );


    document.getElementById(
      "ctrTerminalClear"
    )
      ?.addEventListener(
        "click",
        clearTerminal
      );


    document.getElementById(
      "ctrTerminalStatus"
    )
      ?.addEventListener(
        "change",
        function () {

          document.getElementById(
            "ctrTerminalStatusDisplay"
          ).textContent =
            this.value;

        }
      );


    document.getElementById(
      "ctrConnectionClose"
    )
      ?.addEventListener(
        "click",
        closeConnectionPanel
      );


    document.getElementById(
      "ctrConnectionSave"
    )
      ?.addEventListener(
        "click",
        saveConnection
      );


    document.getElementById(
      "ctrConnectionRemove"
    )
      ?.addEventListener(
        "click",
        removeConnection
      );

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  function initialize() {

    injectStyles();


    createToolbar();


    createTerminalPanel();


    createConnectionPanel();


    ensureConnectionIds();


    /*
       Re-render once so older prototype
       connections also receive IDs.
    */

    rerenderDrawing();


    bindEvents();


    window.CTR_EDITOR = {

      version:
        EDITOR_VERSION,

      rerender:
        rerenderDrawing,

      startConnect:
        startConnectMode,

      cancelConnect:
        cancelConnectMode

    };

  }


  if (
    document.readyState ===
    "loading"
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