/* =========================================================
   CTR MANAGEMENT SYSTEM
   COMMON SVG DRAWING PROPERTIES EDITOR

   VERSION 2.3.0

   SUPPORTED
   ---------------------------------------------------------
   STATION
   - Terminal
   - Straight / Fuse terminal conductor
   - Row
   - Rack
   - Fuse detail
   - Add / Remove Terminal
   - Add / Remove Row
   - Add / Remove Column
   - Add / Remove Rack

   LOCATION
   - Terminal
   - Straight / Fuse terminal conductor
   - Row
   - Connected End
   - Location Box
   - Fuse detail
   - Add / Remove Terminal
   - Add / Remove Row
   - Add / Remove Column
   - Add / Remove Location Box

   IMPORTANT
   ---------------------------------------------------------
   terminal.conductorStyle:
   - STRAIGHT
   - FUSE

   Bridge / cable connections are handled separately by:
   - station-connections.js
   - location-connections.js
========================================================= */

(function () {

  "use strict";

  const VERSION = "2.3.0";

  let selectedObject = null;
  let decorateTimer = null;


  /* =====================================================
     ACCESS
  ===================================================== */

  function requireEditAccess() {

    if (
      typeof requireCurrentStationDraftEdit ===
      "function"
    ) {

      return (
        requireCurrentStationDraftEdit() === true
      );

    }

    return true;

  }


  /* =====================================================
     CONNECTION MODE
  ===================================================== */

  function connectionModeActive() {

    return Boolean(

      document
        .getElementById(
          "stationAddConnection"
        )
        ?.classList
        .contains(
          "active"
        )

      ||

      document
        .getElementById(
          "locationAddConnection"
        )
        ?.classList
        .contains(
          "active"
        )

    );

  }


  /* =====================================================
     MAIN DATA
  ===================================================== */

  function getStationRacks() {

    try {

      if (
        typeof stationCtrRacks !==
          "undefined" &&
        Array.isArray(
          stationCtrRacks
        )
      ) {

        return stationCtrRacks;

      }

    }

    catch (error) {

      console.error(
        "stationCtrRacks unavailable",
        error
      );

    }

    return [];

  }


  function getConnectedEnds() {

    try {

      if (
        typeof connectedEnds !==
          "undefined" &&
        Array.isArray(
          connectedEnds
        )
      ) {

        return connectedEnds;

      }

    }

    catch (error) {

      console.error(
        "connectedEnds unavailable",
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
        .getActiveRackIndex ===
      "function"
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


  function getActiveEndIndex() {

    if (
      window.CTR_LOCATION_SVG_VIEW &&
      typeof window
        .CTR_LOCATION_SVG_VIEW
        .getActiveEndIndex ===
      "function"
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
        .getActiveLocationIndex ===
      "function"
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
     ID
  ===================================================== */

  function makeId() {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
      "function"
    ) {

      return window.crypto.randomUUID();

    }

    return (
      Date.now().toString() +
      "-" +
      Math.random()
        .toString(16)
        .slice(2)
    );

  }


  /* =====================================================
     ROW LABEL
  ===================================================== */

  function getLabel(index) {

    if (
      typeof getRowLabel ===
      "function"
    ) {

      return getRowLabel(
        index
      );

    }

    let number =
      index + 1;

    let label =
      "";


    while (
      number > 0
    ) {

      number--;

      label =
        String.fromCharCode(
          65 +
          (
            number %
            26
          )
        ) +
        label;

      number =
        Math.floor(
          number /
          26
        );

    }

    return label;

  }


  /*
     Existing custom labels AA / BB etc
     overwrite nahi honge.
  */

  function getNextUnusedRowLabel(
    owner
  ) {

    const used =
      new Set(

        (
          owner?.rows ||
          []
        )
          .map(
            function (row) {

              return String(
                row.label ||
                ""
              )
                .trim()
                .toUpperCase();

            }
          )

      );


    let index =
      0;


    while (
      used.has(
        getLabel(index)
          .toUpperCase()
      )
    ) {

      index++;

    }


    return getLabel(
      index
    );

  }


  /* =====================================================
     TERMINAL FACTORY
  ===================================================== */

  function makeTerminal(
    number
  ) {

    let terminal;


    if (
      typeof createTerminal ===
      "function"
    ) {

      terminal =
        createTerminal(
          number
        );

    }

    else {

      terminal = {

        id:
          makeId(),

        number:
          String(
            number
          )
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


    terminal.conductorStyle =
      terminal.conductorStyle ||
      "STRAIGHT";


    return terminal;

  }


  /* =====================================================
     ROW FACTORY
  ===================================================== */

  function makeRow(
    label,
    count = 12
  ) {

    let row;


    if (
      typeof createRow ===
      "function"
    ) {

      row =
        createRow(
          label,
          count
        );

    }

    else {

      row = {

        id:
          makeId(),

        label:
          label,

        terminals:
          []

      };


      for (
        let index = 1;
        index <= count;
        index++
      ) {

        row.terminals.push(
          makeTerminal(
            index
          )
        );

      }

    }


    row.terminals =
      Array.isArray(
        row.terminals
      )
        ? row.terminals
        : [];


    row.terminals
      .forEach(
        function (
          terminal
        ) {

          terminal.conductorStyle =
            terminal.conductorStyle ||
            "STRAIGHT";

        }
      );


    return row;

  }


  /* =====================================================
     FUSE FACTORY
  ===================================================== */

  function makeFuse(
    number
  ) {

    if (
      typeof createFusePoint ===
      "function"
    ) {

      return createFusePoint(
        number
      );

    }


    return {

      id:
        makeId(),

      label:
        `F${number}`,

      details:
        ""

    };

  }


  /* =====================================================
     RACK FACTORY
  ===================================================== */

  function makeRack(
    number
  ) {

    if (
      typeof createCtrRack ===
      "function"
    ) {

      const rack =
        createCtrRack(
          number
        );


      rack.rows
        ?.forEach(
          function (
            row
          ) {

            row.terminals
              ?.forEach(
                function (
                  terminal
                ) {

                  terminal.conductorStyle =
                    terminal.conductorStyle ||
                    "STRAIGHT";

                }
              );

          }
        );


      return rack;

    }


    return {

      id:
        makeId(),

      autoNumber:
        number,

      name:
        `K${number}`,

      fuseDetails:
        [],

      rows: [

        makeRow(
          "A",
          12
        )

      ]

    };

  }


  /* =====================================================
     TERMINAL NUMBERING
  ===================================================== */

  function renumberRow(
    row
  ) {

    row.terminals
      .forEach(
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


  /* =====================================================
     NEXT FUSE NUMBER
  ===================================================== */

  function nextFuseNumber(
    owner
  ) {

    let highest =
      0;


    (
      owner.fuseDetails ||
      []
    )
      .forEach(
        function (
          fuse
        ) {

          const match =
            String(
              fuse.label ||
              ""
            )
              .trim()
              .match(
                /^F(\d+)$/i
              );


          if (
            match
          ) {

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


  /* =====================================================
     NEXT RACK NUMBER
  ===================================================== */

  function nextRackNumber() {

    let highest =
      0;


    getStationRacks()
      .forEach(
        function (
          rack
        ) {

          highest =
            Math.max(
              highest,
              Number(
                rack.autoNumber
              ) || 0
            );


          const match =
            String(
              rack.name ||
              ""
            )
              .trim()
              .match(
                /^K(\d+)$/i
              );


          if (
            match
          ) {

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


  /* =====================================================
     CONNECTION CLEANUP
  ===================================================== */

  function pruneConnections(
    owner
  ) {

    if (
      !owner ||
      !Array.isArray(
        owner.connections
      )
    ) {

      return;

    }


    const validIds =
      new Set();


    owner.rows
      ?.forEach(
        function (
          row
        ) {

          row.terminals
            ?.forEach(
              function (
                terminal
              ) {

                validIds.add(
                  String(
                    terminal.id
                  )
                );

              }
            );

        }
      );


    owner.connections =
      owner.connections
        .filter(
          function (
            connection
          ) {

            return (

              validIds.has(
                String(
                  connection
                    .fromTerminalId
                )
              )

              &&

              validIds.has(
                String(
                  connection
                    .toTerminalId
                )
              )

            );

          }
        );

  }


  /* =====================================================
     REFRESH STATION
  ===================================================== */

  function refreshStation() {

    if (
      typeof renderStationCtrRacks ===
      "function"
    ) {

      renderStationCtrRacks();

    }


    window
      .CTR_STATION_SVG_VIEW
      ?.refresh?.();


    setTimeout(
      function () {

        window
          .CTR_STATION_CONNECTIONS
          ?.redraw?.();


        decorateDrawings();

      },
      150
    );

  }


  /* =====================================================
     REFRESH LOCATION
  ===================================================== */

  function refreshLocation() {

    if (
      typeof renderConnectedEnds ===
      "function"
    ) {

      renderConnectedEnds();

    }


    window
      .CTR_LOCATION_SVG_VIEW
      ?.refresh?.();


    setTimeout(
      function () {

        window
          .CTR_LOCATION_CONNECTIONS
          ?.redraw?.();


        decorateDrawings();

      },
      170
    );

  }


  function refreshContext(
    context
  ) {

    if (
      context ===
      "STATION"
    ) {

      refreshStation();

    }

    else {

      refreshLocation();

    }

  }


  /* =====================================================
     CSS
  ===================================================== */

  function injectStyles() {

    document
      .getElementById(
        "drawingPropertiesStyles"
      )
      ?.remove();


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "drawingPropertiesStyles";


    style.textContent = `

      #stationSvgHost [data-drawing-edit],
      #locationSvgHost [data-drawing-edit],
      #stationSvgHost [data-ctr-object="terminal"],
      #stationSvgHost [data-ctr-object="fuse"],
      #locationSvgHost [data-location-terminal="true"],
      #locationSvgHost [data-location-object="fuse"] {
        cursor: pointer;
      }


      .ctr-property-selected {
        filter:
          drop-shadow(
            0 0 3px
            rgba(21,91,148,0.95)
          ) !important;
      }


      #drawingPropertiesPanel {
        position: fixed;

        top: 135px;
        right: 18px;

        z-index: 6000;

        width: 390px;

        max-height:
          calc(100vh - 160px);

        overflow-y: auto;

        border:
          1px solid #aebdca;

        border-radius:
          4px;

        background:
          #ffffff;

        box-shadow:
          0 10px 34px
          rgba(0,0,0,0.23);

        font-family:
          Arial,
          Helvetica,
          sans-serif;
      }


      #drawingPropertiesPanel[hidden] {
        display: none !important;
      }


      .drawing-properties-head {
        display: flex;

        align-items: center;
        justify-content: space-between;

        padding:
          13px 14px;

        background:
          #0c2d53;

        color:
          #ffffff;
      }


      .drawing-properties-head span {
        display: block;

        margin-bottom:
          3px;

        color:
          #cbd9e6;

        font-size:
          8px;

        font-weight:
          700;

        letter-spacing:
          1px;
      }


      .drawing-properties-head strong {
        font-size:
          14px;
      }


      #drawingPropertiesClose {
        width:
          30px;

        height:
          30px;

        border:
          1px solid
          rgba(255,255,255,0.4);

        background:
          transparent;

        color:
          #ffffff;

        cursor:
          pointer;

        font-size:
          19px;
      }


      .drawing-properties-body {
        padding:
          14px;
      }


      .drawing-property-context {
        margin-bottom:
          14px;

        padding:
          8px 10px;

        border-left:
          3px solid #456f99;

        background:
          #f3f6f9;

        color:
          #536b81;

        font-size:
          9px;

        line-height:
          1.45;
      }


      .drawing-property-field {
        margin-bottom:
          12px;
      }


      .drawing-property-field label {
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


      .drawing-property-field input,
      .drawing-property-field select,
      .drawing-property-field textarea {
        width:
          100%;

        box-sizing:
          border-box;

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
          Helvetica,
          sans-serif;

        font-size:
          12px;
      }


      .drawing-property-field input,
      .drawing-property-field select {
        height:
          37px;

        padding:
          0 9px;
      }


      .drawing-property-field textarea {
        min-height:
          72px;

        padding:
          8px;

        resize:
          vertical;
      }


      .drawing-property-actions {
        display:
          flex;

        gap:
          8px;
      }


      #drawingPropertySave {
        flex:
          1;

        min-height:
          38px;

        border:
          1px solid #173e6e;

        border-radius:
          3px;

        background:
          #173e6e;

        color:
          #ffffff;

        cursor:
          pointer;

        font-size:
          10px;

        font-weight:
          700;
      }


      #drawingPropertyCancel {
        min-height:
          38px;

        padding:
          0 14px;

        border:
          1px solid #bdc8d3;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #42586d;

        cursor:
          pointer;

        font-size:
          10px;

        font-weight:
          700;
      }


      .drawing-structure-section {
        margin-top:
          16px;

        padding-top:
          13px;

        border-top:
          1px solid #d6dee6;
      }


      .drawing-structure-section > strong {
        display:
          block;

        margin-bottom:
          8px;

        color:
          #30475d;

        font-size:
          10px;

        letter-spacing:
          .5px;

        text-transform:
          uppercase;
      }


      #drawingStructureActions {
        display:
          grid;

        grid-template-columns:
          1fr 1fr;

        gap:
          7px;
      }


      .drawing-structure-btn {
        min-height:
          36px;

        padding:
          6px 8px;

        border:
          1px solid #aebdca;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #27445f;

        cursor:
          pointer;

        font-size:
          9px;

        font-weight:
          700;
      }


      .drawing-structure-btn:hover {
        background:
          #f3f6f9;
      }


      .drawing-structure-btn.danger {
        border-color:
          #d1a3a0;

        color:
          #a1261f;
      }


      .drawing-structure-btn.wide {
        grid-column:
          1 / -1;
      }


      @media
      (max-width: 760px) {

        #drawingPropertiesPanel {
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
            65vh;
        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =====================================================
     PANEL
  ===================================================== */

  function createPanel() {

    document
      .getElementById(
        "drawingPropertiesPanel"
      )
      ?.remove();


    const panel =
      document.createElement(
        "aside"
      );


    panel.id =
      "drawingPropertiesPanel";


    panel.hidden =
      true;


    panel.innerHTML = `

      <div class="drawing-properties-head">

        <div>

          <span>
            ENGINEERING DRAWING
          </span>

          <strong
            id="drawingPropertiesTitle"
          >
            Properties
          </strong>

        </div>


        <button
          type="button"
          id="drawingPropertiesClose"
        >
          ×
        </button>

      </div>


      <div class="drawing-properties-body">

        <div
          class="drawing-property-context"
          id="drawingPropertyContext"
        >
          Select an engineering object.
        </div>


        <div
          id="drawingPropertyFields"
        >
        </div>


        <div
          class="drawing-property-actions"
        >

          <button
            type="button"
            id="drawingPropertySave"
          >
            Save Changes
          </button>


          <button
            type="button"
            id="drawingPropertyCancel"
          >
            Cancel
          </button>

        </div>


        <div
          class="drawing-structure-section"
        >

          <strong>
            Structure Actions
          </strong>

          <div
            id="drawingStructureActions"
          >
          </div>

        </div>

      </div>

    `;


    document.body.appendChild(
      panel
    );

  }


  function fieldsHost() {

    return document.getElementById(
      "drawingPropertyFields"
    );

  }


  function actionsHost() {

    return document.getElementById(
      "drawingStructureActions"
    );

  }


  function clearPanel() {

    fieldsHost()
      ?.replaceChildren();


    actionsHost()
      ?.replaceChildren();

  }


  function setHeading(
    title,
    context
  ) {

    const titleNode =
      document.getElementById(
        "drawingPropertiesTitle"
      );


    const contextNode =
      document.getElementById(
        "drawingPropertyContext"
      );


    if (
      titleNode
    ) {

      titleNode.textContent =
        title;

    }


    if (
      contextNode
    ) {

      contextNode.textContent =
        context;

    }

  }


  function openPanel() {

    const panel =
      document.getElementById(
        "drawingPropertiesPanel"
      );


    if (
      panel
    ) {

      panel.hidden =
        false;

    }

  }


  function clearHighlight() {

    document
      .querySelectorAll(
        ".ctr-property-selected"
      )
      .forEach(
        function (
          item
        ) {

          item.classList.remove(
            "ctr-property-selected"
          );

        }
      );

  }


  function closePanel() {

    const panel =
      document.getElementById(
        "drawingPropertiesPanel"
      );


    if (
      panel
    ) {

      panel.hidden =
        true;

    }


    clearHighlight();


    selectedObject =
      null;

  }


  /* =====================================================
     FORM ELEMENTS
  ===================================================== */

  function addInput(
    id,
    label,
    currentValue = ""
  ) {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "drawing-property-field";


    const labelNode =
      document.createElement(
        "label"
      );


    labelNode.htmlFor =
      id;


    labelNode.textContent =
      label;


    const input =
      document.createElement(
        "input"
      );


    input.type =
      "text";


    input.id =
      id;


    input.value =
      currentValue ??
      "";


    wrapper.appendChild(
      labelNode
    );


    wrapper.appendChild(
      input
    );


    fieldsHost()
      ?.appendChild(
        wrapper
      );

  }


  function addSelect(
    id,
    label,
    currentValue,
    options
  ) {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "drawing-property-field";


    const labelNode =
      document.createElement(
        "label"
      );


    labelNode.htmlFor =
      id;


    labelNode.textContent =
      label;


    const select =
      document.createElement(
        "select"
      );


    select.id =
      id;


    options
      .forEach(
        function (
          data
        ) {

          const option =
            document.createElement(
              "option"
            );


          option.value =
            data.value;


          option.textContent =
            data.label;


          select.appendChild(
            option
          );

        }
      );


    select.value =
      currentValue;


    wrapper.appendChild(
      labelNode
    );


    wrapper.appendChild(
      select
    );


    fieldsHost()
      ?.appendChild(
        wrapper
      );

  }


  function addTextarea(
    id,
    label,
    currentValue = ""
  ) {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "drawing-property-field";


    const labelNode =
      document.createElement(
        "label"
      );


    labelNode.htmlFor =
      id;


    labelNode.textContent =
      label;


    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.id =
      id;


    textarea.value =
      currentValue ??
      "";


    wrapper.appendChild(
      labelNode
    );


    wrapper.appendChild(
      textarea
    );


    fieldsHost()
      ?.appendChild(
        wrapper
      );

  }


  function value(
    id
  ) {

    return (
      document.getElementById(
        id
      )?.value ??
      ""
    );

  }


  /* =====================================================
     ACTION BUTTON
  ===================================================== */

  function actionButton(
    label,
    action,
    options = {}
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      "drawing-structure-btn";


    if (
      options.danger
    ) {

      button.classList.add(
        "danger"
      );

    }


    if (
      options.wide
    ) {

      button.classList.add(
        "wide"
      );

    }


    button.textContent =
      label;


    button.dataset.action =
      action;


    actionsHost()
      ?.appendChild(
        button
      );

  }


  /* =====================================================
     TERMINAL PROPERTIES
  ===================================================== */

  function showTerminal(
    context,
    owner,
    row,
    terminal,
    sourceElement
  ) {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    terminal.conductorStyle =
      terminal.conductorStyle ||
      "STRAIGHT";


    selectedObject = {

      type:
        "TERMINAL",

      context:
        context,

      owner:
        owner,

      row:
        row,

      terminal:
        terminal

    };


    clearHighlight();


    sourceElement
      ?.classList
      .add(
        "ctr-property-selected"
      );


    clearPanel();


    setHeading(
      "Terminal Properties",

      `${context} · Row ${row.label} · Terminal ${
        Number(
          terminal.number
        ) ||
        terminal.number
      }`
    );


    addInput(
      "drawingTerminalNumber",
      "Terminal Number",
      terminal.number
    );


    addSelect(
      "drawingTerminalStatus",
      "Terminal Status",
      terminal.status ||
      "SPARE",
      [

        {
          value:
            "SPARE",

          label:
            "SPARE"
        },

        {
          value:
            "IN USE",

          label:
            "IN USE"
        }

      ]
    );


    /* =================================================
       INDIVIDUAL TERMINAL CONDUCTOR STYLE
    ================================================= */

    addSelect(
      "drawingTerminalConductorStyle",
      "Conductor Style",
      terminal.conductorStyle ||
      "STRAIGHT",
      [

        {
          value:
            "STRAIGHT",

          label:
            "Straight"
        },

        {
          value:
            "FUSE",

          label:
            "Fuse"
        }

      ]
    );


    addInput(
      "drawingTerminalParticular",
      "Circuit / Conductor Particular",
      terminal.particular ||
      ""
    );


    addInput(
      "drawingTerminalLocationBox",
      "Connected Location / Location Box",
      terminal.locationBox ||
      ""
    );


    addInput(
      "drawingTerminalLocationTerminal",
      "Location Terminal",
      terminal.locationTerminal ||
      ""
    );


    addTextarea(
      "drawingTerminalRemarks",
      "Remarks",
      terminal.remarks ||
      ""
    );


    actionButton(
      "+ Terminal After",
      "ADD_TERMINAL_AFTER"
    );


    actionButton(
      "Remove Terminal",
      "REMOVE_TERMINAL",
      {
        danger:
          true
      }
    );


    actionButton(
      "+ Row Below",
      "ADD_ROW_AFTER",
      {
        wide:
          true
      }
    );


    openPanel();

  }


  /* =====================================================
     ROW PROPERTIES
  ===================================================== */

  function showRow(
    context,
    owner,
    row,
    sourceElement
  ) {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    selectedObject = {

      type:
        "ROW",

      context:
        context,

      owner:
        owner,

      row:
        row

    };


    clearHighlight();


    sourceElement
      ?.classList
      .add(
        "ctr-property-selected"
      );


    clearPanel();


    setHeading(
      "Row Properties",
      `${context} · Row ${row.label}`
    );


    addInput(
      "drawingRowLabel",
      "Row Label",
      row.label
    );


    actionButton(
      "+ Row Below",
      "ADD_ROW_AFTER"
    );


    actionButton(
      "Remove Row",
      "REMOVE_ROW",
      {
        danger:
          true
      }
    );


    actionButton(
      "+ Terminal",
      "ADD_TERMINAL"
    );


    actionButton(
      "Remove Last Terminal",
      "REMOVE_LAST_TERMINAL",
      {
        danger:
          true
      }
    );


    openPanel();

  }


  /* =====================================================
     FUSE DETAILS PROPERTIES
  ===================================================== */

  function showFuse(
    context,
    owner,
    fuse,
    sourceElement
  ) {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    selectedObject = {

      type:
        "FUSE",

      context:
        context,

      owner:
        owner,

      fuse:
        fuse

    };


    clearHighlight();


    sourceElement
      ?.classList
      .add(
        "ctr-property-selected"
      );


    clearPanel();


    setHeading(
      "Fuse Properties",
      context
    );


    addInput(
      "drawingFuseLabel",
      "Fuse Label",
      fuse.label ||
      ""
    );


    addTextarea(
      "drawingFuseDetails",
      "Fuse Particular / Details",
      fuse.details ||
      ""
    );


    actionButton(
      "+ Fuse Point",
      "ADD_FUSE"
    );


    actionButton(
      "Remove Fuse",
      "REMOVE_FUSE",
      {
        danger:
          true
      }
    );


    openPanel();

  }


  /* =====================================================
     RACK PROPERTIES
  ===================================================== */

  function showRack(
    rack,
    sourceElement
  ) {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    selectedObject = {

      type:
        "RACK",

      context:
        "STATION",

      rack:
        rack

    };


    clearHighlight();


    sourceElement
      ?.classList
      .add(
        "ctr-property-selected"
      );


    clearPanel();


    setHeading(
      "CTR Rack Properties",
      "Station CTR Rack"
    );


    addInput(
      "drawingObjectName",
      "Rack Name",
      rack.name ||
      ""
    );


    actionButton(
      "+ CTR Rack",
      "ADD_RACK"
    );


    actionButton(
      "Remove Rack",
      "REMOVE_RACK",
      {
        danger:
          true
      }
    );


    actionButton(
      "+ Row",
      "ADD_ROW"
    );


    actionButton(
      "Remove Last Row",
      "REMOVE_LAST_ROW"
    );


    actionButton(
      "+ Column",
      "ADD_COLUMN"
    );


    actionButton(
      "Remove Column",
      "REMOVE_COLUMN",
      {
        danger:
          true
      }
    );


    actionButton(
      "+ Fuse Point",
      "ADD_FUSE",
      {
        wide:
          true
      }
    );


    openPanel();

  }


  /* =====================================================
     CONNECTED END PROPERTIES
  ===================================================== */

  function showEnd(
    end,
    sourceElement
  ) {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    selectedObject = {

      type:
        "END",

      context:
        "LOCATION",

      end:
        end

    };


    clearHighlight();


    sourceElement
      ?.classList
      .add(
        "ctr-property-selected"
      );


    clearPanel();


    setHeading(
      "Connected End Properties",
      "Connected End"
    );


    addInput(
      "drawingObjectName",
      "Connected End Name",
      end.name ||
      ""
    );


    actionButton(
      "+ Location Box",
      "ADD_LOCATION",
      {
        wide:
          true
      }
    );


    actionButton(
      "Remove Connected End",
      "REMOVE_END",
      {
        danger:
          true,

        wide:
          true
      }
    );


    openPanel();

  }


  /* =====================================================
     LOCATION BOX PROPERTIES
  ===================================================== */

  function showLocation(
    end,
    location,
    sourceElement
  ) {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    selectedObject = {

      type:
        "LOCATION",

      context:
        "LOCATION",

      end:
        end,

      location:
        location

    };


    clearHighlight();


    sourceElement
      ?.classList
      .add(
        "ctr-property-selected"
      );


    clearPanel();


    setHeading(
      "Location Box Properties",
      end.name ||
      "Connected End"
    );


    addInput(
      "drawingObjectName",
      "Location Box Name",
      location.name ||
      ""
    );


    actionButton(
      "+ Row",
      "ADD_ROW"
    );


    actionButton(
      "Remove Last Row",
      "REMOVE_LAST_ROW",
      {
        danger:
          true
      }
    );


    actionButton(
      "+ Column",
      "ADD_COLUMN"
    );


    actionButton(
      "Remove Column",
      "REMOVE_COLUMN",
      {
        danger:
          true
      }
    );


    actionButton(
      "+ Fuse Point",
      "ADD_FUSE",
      {
        wide:
          true
      }
    );


    actionButton(
      "Remove Location Box",
      "REMOVE_LOCATION",
      {
        danger:
          true,

        wide:
          true
      }
    );


    openPanel();

  }


  /* =====================================================
     SAVE
  ===================================================== */

  function saveProperties() {

    if (
      !selectedObject ||
      !requireEditAccess()
    ) {

      return;

    }


    const object =
      selectedObject;


    /* =================================================
       TERMINAL
    ================================================= */

    if (
      object.type ===
      "TERMINAL"
    ) {

      object.terminal.number =
        value(
          "drawingTerminalNumber"
        )
          .trim();


      object.terminal.status =
        value(
          "drawingTerminalStatus"
        ) ||
        "SPARE";


      object.terminal.conductorStyle =
        value(
          "drawingTerminalConductorStyle"
        ) ||
        "STRAIGHT";


      object.terminal.particular =
        value(
          "drawingTerminalParticular"
        )
          .trim();


      object.terminal.locationBox =
        value(
          "drawingTerminalLocationBox"
        )
          .trim();


      object.terminal.locationTerminal =
        value(
          "drawingTerminalLocationTerminal"
        )
          .trim();


      object.terminal.remarks =
        value(
          "drawingTerminalRemarks"
        )
          .trim();

    }


    /* =================================================
       ROW
    ================================================= */

    if (
      object.type ===
      "ROW"
    ) {

      const newLabel =
        value(
          "drawingRowLabel"
        )
          .trim();


      if (
        newLabel
      ) {

        object.row.label =
          newLabel;

      }

    }


    /* =================================================
       FUSE
    ================================================= */

    if (
      object.type ===
      "FUSE"
    ) {

      object.fuse.label =
        value(
          "drawingFuseLabel"
        )
          .trim();


      object.fuse.details =
        value(
          "drawingFuseDetails"
        )
          .trim();

    }


    /* =================================================
       RACK
    ================================================= */

    if (
      object.type ===
      "RACK"
    ) {

      object.rack.name =
        value(
          "drawingObjectName"
        )
          .trim();

    }


    /* =================================================
       END
    ================================================= */

    if (
      object.type ===
      "END"
    ) {

      object.end.name =
        value(
          "drawingObjectName"
        )
          .trim();

    }


    /* =================================================
       LOCATION
    ================================================= */

    if (
      object.type ===
      "LOCATION"
    ) {

      object.location.name =
        value(
          "drawingObjectName"
        )
          .trim();

    }


    const context =
      object.context;


    console.log(
      "CTR Drawing Properties saved:",
      object
    );


    closePanel();


    refreshContext(
      context
    );

  }


  /* =====================================================
     STRUCTURE ACTIONS
  ===================================================== */

  function handleStructureAction(
    action
  ) {

    if (
      !selectedObject ||
      !requireEditAccess()
    ) {

      return;

    }


    const data =
      selectedObject;


    /* =================================================
       ADD TERMINAL AFTER
    ================================================= */

    if (
      action ===
      "ADD_TERMINAL_AFTER" &&
      data.type ===
      "TERMINAL"
    ) {

      const row =
        data.row;


      const index =
        row.terminals
          .indexOf(
            data.terminal
          );


      if (
        index === -1
      ) {

        return;

      }


      row.terminals.splice(
        index + 1,
        0,
        makeTerminal(
          index + 2
        )
      );


      renumberRow(
        row
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       REMOVE TERMINAL
    ================================================= */

    if (
      action ===
      "REMOVE_TERMINAL" &&
      data.type ===
      "TERMINAL"
    ) {

      if (
        data.row
          .terminals
          .length <=
        1
      ) {

        alert(
          "At least one terminal must remain."
        );

        return;

      }


      if (
        !confirm(
          "Remove selected terminal?"
        )
      ) {

        return;

      }


      const index =
        data.row
          .terminals
          .indexOf(
            data.terminal
          );


      if (
        index !==
        -1
      ) {

        data.row
          .terminals
          .splice(
            index,
            1
          );

      }


      renumberRow(
        data.row
      );


      pruneConnections(
        data.owner
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       ADD TERMINAL
    ================================================= */

    if (
      action ===
      "ADD_TERMINAL" &&
      data.type ===
      "ROW"
    ) {

      data.row
        .terminals
        .push(
          makeTerminal(
            data.row
              .terminals
              .length +
            1
          )
        );


      renumberRow(
        data.row
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       REMOVE LAST TERMINAL
    ================================================= */

    if (
      action ===
      "REMOVE_LAST_TERMINAL" &&
      data.type ===
      "ROW"
    ) {

      if (
        data.row
          .terminals
          .length <=
        1
      ) {

        alert(
          "At least one terminal must remain."
        );

        return;

      }


      if (
        !confirm(
          "Remove last terminal?"
        )
      ) {

        return;

      }


      data.row
        .terminals
        .pop();


      renumberRow(
        data.row
      );


      pruneConnections(
        data.owner
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       ADD ROW AFTER

       Existing AA / BB custom row labels preserved.
    ================================================= */

    if (
      action ===
      "ADD_ROW_AFTER" &&
      (
        data.type ===
          "ROW" ||
        data.type ===
          "TERMINAL"
      )
    ) {

      const owner =
        data.owner;


      const currentRow =
        data.row;


      const index =
        owner.rows
          .indexOf(
            currentRow
          );


      if (
        index ===
        -1
      ) {

        return;

      }


      const columns =
        currentRow
          .terminals
          ?.length ||
        12;


      owner.rows.splice(
        index + 1,
        0,
        makeRow(
          getNextUnusedRowLabel(
            owner
          ),
          columns
        )
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       REMOVE SELECTED ROW
    ================================================= */

    if (
      action ===
      "REMOVE_ROW" &&
      data.type ===
      "ROW"
    ) {

      const owner =
        data.owner;


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
          `Remove Row ${data.row.label}?`
        )
      ) {

        return;

      }


      const index =
        owner.rows
          .indexOf(
            data.row
          );


      if (
        index !==
        -1
      ) {

        owner.rows
          .splice(
            index,
            1
          );

      }


      /*
        IMPORTANT:
        No automatic row relabelling.
        AA / BB / custom labels stay intact.
      */


      pruneConnections(
        owner
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       ADD ROW FROM RACK / LOCATION
    ================================================= */

    if (
      action ===
      "ADD_ROW"
    ) {

      let owner =
        null;


      if (
        data.type ===
        "RACK"
      ) {

        owner =
          data.rack;

      }


      if (
        data.type ===
        "LOCATION"
      ) {

        owner =
          data.location;

      }


      if (
        !owner
      ) {

        return;

      }


      owner.rows =
        Array.isArray(
          owner.rows
        )
          ? owner.rows
          : [];


      const columns =
        owner.rows?.[0]
          ?.terminals
          ?.length ||
        12;


      owner.rows.push(
        makeRow(
          getNextUnusedRowLabel(
            owner
          ),
          columns
        )
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       REMOVE LAST ROW
    ================================================= */

    if (
      action ===
      "REMOVE_LAST_ROW" &&
      (
        data.type ===
          "RACK" ||
        data.type ===
          "LOCATION"
      )
    ) {

      const owner =
        data.type ===
        "RACK"
          ? data.rack
          : data.location;


      if (
        !Array.isArray(
          owner.rows
        ) ||
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
          `Remove Row ${
            owner.rows[
              owner.rows.length - 1
            ]?.label || ""
          }?`
        )
      ) {

        return;

      }


      owner.rows.pop();


      pruneConnections(
        owner
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       ADD COLUMN

       Station Rack + Location Box
    ================================================= */

    if (
      action ===
      "ADD_COLUMN" &&
      (
        data.type ===
          "RACK" ||
        data.type ===
          "LOCATION"
      )
    ) {

      const owner =
        data.type ===
        "RACK"
          ? data.rack
          : data.location;


      if (
        !Array.isArray(
          owner.rows
        )
      ) {

        return;

      }


      owner.rows
        .forEach(
          function (
            row
          ) {

            row.terminals =
              Array.isArray(
                row.terminals
              )
                ? row.terminals
                : [];


            row.terminals.push(
              makeTerminal(
                row.terminals
                  .length +
                1
              )
            );


            renumberRow(
              row
            );

          }
        );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       REMOVE COLUMN

       Station Rack + Location Box
    ================================================= */

    if (
      action ===
      "REMOVE_COLUMN" &&
      (
        data.type ===
          "RACK" ||
        data.type ===
          "LOCATION"
      )
    ) {

      const owner =
        data.type ===
        "RACK"
          ? data.rack
          : data.location;


      const rows =
        owner.rows;


      const columns =
        rows?.[0]
          ?.terminals
          ?.length ||
        0;


      if (
        columns <=
        1
      ) {

        alert(
          "At least one column must remain."
        );

        return;

      }


      if (
        !confirm(
          `Remove Column ${columns} from all rows?`
        )
      ) {

        return;

      }


      rows.forEach(
        function (
          row
        ) {

          row.terminals.pop();


          renumberRow(
            row
          );

        }
      );


      pruneConnections(
        owner
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       ADD FUSE DETAIL
    ================================================= */

    if (
      action ===
      "ADD_FUSE"
    ) {

      let owner =
        null;


      if (
        data.type ===
        "FUSE"
      ) {

        owner =
          data.owner;

      }


      if (
        data.type ===
        "RACK"
      ) {

        owner =
          data.rack;

      }


      if (
        data.type ===
        "LOCATION"
      ) {

        owner =
          data.location;

      }


      if (
        !owner
      ) {

        return;

      }


      owner.fuseDetails =
        Array.isArray(
          owner.fuseDetails
        )
          ? owner.fuseDetails
          : [];


      owner.fuseDetails.push(
        makeFuse(
          nextFuseNumber(
            owner
          )
        )
      );


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       REMOVE FUSE DETAIL
    ================================================= */

    if (
      action ===
      "REMOVE_FUSE" &&
      data.type ===
      "FUSE"
    ) {

      if (
        !confirm(
          `Remove ${
            data.fuse.label ||
            "Fuse"
          }?`
        )
      ) {

        return;

      }


      const index =
        data.owner
          .fuseDetails
          .indexOf(
            data.fuse
          );


      if (
        index !==
        -1
      ) {

        data.owner
          .fuseDetails
          .splice(
            index,
            1
          );

      }


      closePanel();


      refreshContext(
        data.context
      );


      return;

    }


    /* =================================================
       ADD RACK
    ================================================= */

    if (
      action ===
      "ADD_RACK" &&
      data.type ===
      "RACK"
    ) {

      const number =
        nextRackNumber();


      getStationRacks()
        .push(
          makeRack(
            number
          )
        );


      closePanel();


      refreshStation();


      return;

    }


    /* =================================================
       REMOVE RACK
    ================================================= */

    if (
      action ===
      "REMOVE_RACK" &&
      data.type ===
      "RACK"
    ) {

      const racks =
        getStationRacks();


      if (
        racks.length <=
        1
      ) {

        alert(
          "At least one CTR Rack must remain."
        );

        return;

      }


      if (
        !confirm(
          `Remove ${data.rack.name}?`
        )
      ) {

        return;

      }


      const index =
        racks.indexOf(
          data.rack
        );


      if (
        index !==
        -1
      ) {

        racks.splice(
          index,
          1
        );

      }


      closePanel();


      refreshStation();


      return;

    }


    /* =================================================
       ADD LOCATION BOX
    ================================================= */

    if (
      action ===
      "ADD_LOCATION" &&
      data.type ===
      "END"
    ) {

      let location;


      if (
        typeof createLocation ===
        "function"
      ) {

        location =
          createLocation(
            data.end
          );

      }

      else {

        const number =
          (
            data.end
              .locations
              .length +
            1
          );


        location = {

          id:
            makeId(),

          autoNumber:
            number,

          name:
            `Location Box ${number}`,

          fuseDetails:
            [],

          rows: [

            makeRow(
              "A",
              12
            ),

            makeRow(
              "B",
              12
            ),

            makeRow(
              "C",
              12
            ),

            makeRow(
              "D",
              12
            )

          ]

        };

      }


      data.end.locations =
        Array.isArray(
          data.end.locations
        )
          ? data.end.locations
          : [];


      data.end
        .locations
        .push(
          location
        );


      closePanel();


      refreshLocation();


      return;

    }


    /* =================================================
       REMOVE LOCATION BOX
    ================================================= */

    if (
      action ===
      "REMOVE_LOCATION" &&
      data.type ===
      "LOCATION"
    ) {

      if (
        !confirm(
          `Remove ${data.location.name}?`
        )
      ) {

        return;

      }


      const index =
        data.end
          .locations
          .indexOf(
            data.location
          );


      if (
        index !==
        -1
      ) {

        data.end
          .locations
          .splice(
            index,
            1
          );

      }


      closePanel();


      refreshLocation();


      return;

    }


    /* =================================================
       REMOVE CONNECTED END
    ================================================= */

    if (
      action ===
      "REMOVE_END" &&
      data.type ===
      "END"
    ) {

      if (
        !confirm(
          `Remove ${data.end.name} and all Location Boxes under it?`
        )
      ) {

        return;

      }


      const ends =
        getConnectedEnds();


      const index =
        ends.indexOf(
          data.end
        );


      if (
        index !==
        -1
      ) {

        ends.splice(
          index,
          1
        );

      }


      closePanel();


      refreshLocation();


      return;

    }

  }


  /* =====================================================
     DECORATE STATION SVG
  ===================================================== */

  function decorateStationSvg() {

    const svg =
      document.querySelector(
        "#stationSvgHost svg"
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
      .querySelectorAll(
        "text"
      )
      .forEach(
        function (
          text
        ) {

          const content =
            text.textContent
              ?.trim() ||
            "";


          if (
            content ===
              rack.name ||

            content ===
              `CTR RACK ${rack.name}` ||

            content ===
              `RACK ${rack.name}`
          ) {

            text.dataset.drawingEdit =
              "station-rack";

          }

        }
      );


    rack.rows
      ?.forEach(
        function (
          row,
          rowIndex
        ) {

          svg
            .querySelectorAll(
              "text"
            )
            .forEach(
              function (
                text
              ) {

                const x =
                  Number(
                    text.getAttribute(
                      "x"
                    )
                  );


                if (
                  text.textContent
                    ?.trim() ===
                    row.label &&
                  x <
                    170
                ) {

                  text.dataset.drawingEdit =
                    "station-row";


                  text.dataset.rowIndex =
                    rowIndex;

                }

              }
            );

        }
      );

  }


  /* =====================================================
     DECORATE LOCATION SVG
  ===================================================== */

  function decorateLocationSvg() {

    const svg =
      document.querySelector(
        "#locationSvgHost svg"
      );


    const end =
      getActiveEnd();


    const location =
      getActiveLocation();


    if (
      !svg ||
      !end ||
      !location
    ) {

      return;

    }


    svg
      .querySelectorAll(
        "text"
      )
      .forEach(
        function (
          text
        ) {

          const content =
            text.textContent
              ?.trim() ||
            "";


          const endName =
            String(
              end.name ||
              ""
            )
              .toUpperCase();


          const locationName =
            String(
              location.name ||
              ""
            )
              .toUpperCase();


          if (
            content.toUpperCase() ===
            endName
          ) {

            text.dataset.drawingEdit =
              "location-end";

          }


          if (
            content.toUpperCase() ===
            locationName
          ) {

            text.dataset.drawingEdit =
              "location-name";

          }

        }
      );


    location.rows
      ?.forEach(
        function (
          row,
          rowIndex
        ) {

          svg
            .querySelectorAll(
              "text"
            )
            .forEach(
              function (
                text
              ) {

                const x =
                  Number(
                    text.getAttribute(
                      "x"
                    )
                  );


                if (
                  text.textContent
                    ?.trim() ===
                    row.label &&
                  x <
                    170
                ) {

                  text.dataset.drawingEdit =
                    "location-row";


                  text.dataset.rowIndex =
                    rowIndex;

                }

              }
            );

        }
      );

  }


  function decorateDrawings() {

    clearTimeout(
      decorateTimer
    );


    decorateTimer =
      setTimeout(
        function () {

          decorateStationSvg();

          decorateLocationSvg();

        },
        80
      );

  }


  /* =====================================================
     STATION SVG CLICK
  ===================================================== */

  function handleStationClick(
    event
  ) {

    if (
      connectionModeActive()
    ) {

      return;

    }


    /* =================================================
       TERMINAL
    ================================================= */

    const terminalElement =
      event.target.closest(
        '[data-ctr-object="terminal"]'
      );


    if (
      terminalElement
    ) {

      const rack =
        getActiveRack();


      const row =
        rack
          ?.rows?.[
            Number(
              terminalElement
                .dataset
                .rowIndex
            )
          ];


      const terminal =
        row
          ?.terminals?.[
            Number(
              terminalElement
                .dataset
                .terminalIndex
            )
          ];


      if (
        rack &&
        row &&
        terminal
      ) {

        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        showTerminal(
          "STATION",
          rack,
          row,
          terminal,
          terminalElement
        );

      }


      return;

    }


    /* =================================================
       FUSE DETAILS
    ================================================= */

    const fuseElement =
      event.target.closest(
        '[data-ctr-object="fuse"]'
      );


    if (
      fuseElement
    ) {

      const rack =
        getActiveRack();


      const fuse =
        rack
          ?.fuseDetails?.[
            Number(
              fuseElement
                .dataset
                .fuseIndex
            )
          ];


      if (
        rack &&
        fuse
      ) {

        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        showFuse(
          "STATION",
          rack,
          fuse,
          fuseElement
        );

      }


      return;

    }


    /* =================================================
       ROW / RACK TEXT
    ================================================= */

    const editable =
      event.target.closest(
        "[data-drawing-edit]"
      );


    if (
      !editable
    ) {

      return;

    }


    if (
      editable.dataset
        .drawingEdit ===
      "station-rack"
    ) {

      const rack =
        getActiveRack();


      if (
        rack
      ) {

        event.preventDefault();

        event.stopPropagation();


        showRack(
          rack,
          editable
        );

      }


      return;

    }


    if (
      editable.dataset
        .drawingEdit ===
      "station-row"
    ) {

      const rack =
        getActiveRack();


      const row =
        rack
          ?.rows?.[
            Number(
              editable
                .dataset
                .rowIndex
            )
          ];


      if (
        rack &&
        row
      ) {

        event.preventDefault();

        event.stopPropagation();


        showRow(
          "STATION",
          rack,
          row,
          editable
        );

      }

    }

  }


  /* =====================================================
     LOCATION SVG CLICK
  ===================================================== */

  function handleLocationClick(
    event
  ) {

    if (
      connectionModeActive()
    ) {

      return;

    }


    /* =================================================
       TERMINAL
    ================================================= */

    const terminalElement =
      event.target.closest(
        '[data-location-terminal="true"]'
      );


    if (
      terminalElement
    ) {

      const location =
        getActiveLocation();


      const row =
        location
          ?.rows?.[
            Number(
              terminalElement
                .dataset
                .rowIndex
            )
          ];


      const terminal =
        row
          ?.terminals?.[
            Number(
              terminalElement
                .dataset
                .terminalIndex
            )
          ];


      if (
        location &&
        row &&
        terminal
      ) {

        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        showTerminal(
          "LOCATION",
          location,
          row,
          terminal,
          terminalElement
        );

      }


      return;

    }


    /* =================================================
       LOCATION FUSE DETAILS
    ================================================= */

    const fuseElement =
      event.target.closest(
        '[data-location-object="fuse"]'
      );


    if (
      fuseElement
    ) {

      const location =
        getActiveLocation();


      const fuse =
        location
          ?.fuseDetails?.[
            Number(
              fuseElement
                .dataset
                .fuseIndex
            )
          ];


      if (
        location &&
        fuse
      ) {

        event.preventDefault();

        event.stopPropagation();

        event.stopImmediatePropagation();


        showFuse(
          "LOCATION",
          location,
          fuse,
          fuseElement
        );

      }


      return;

    }


    /* =================================================
       END / LOCATION / ROW TEXT
    ================================================= */

    const editable =
      event.target.closest(
        "[data-drawing-edit]"
      );


    if (
      !editable
    ) {

      return;

    }


    const end =
      getActiveEnd();


    const location =
      getActiveLocation();


    if (
      editable.dataset
        .drawingEdit ===
      "location-end"
    ) {

      if (
        end
      ) {

        event.preventDefault();

        event.stopPropagation();


        showEnd(
          end,
          editable
        );

      }


      return;

    }


    if (
      editable.dataset
        .drawingEdit ===
      "location-name"
    ) {

      if (
        end &&
        location
      ) {

        event.preventDefault();

        event.stopPropagation();


        showLocation(
          end,
          location,
          editable
        );

      }


      return;

    }


    if (
      editable.dataset
        .drawingEdit ===
      "location-row"
    ) {

      const row =
        location
          ?.rows?.[
            Number(
              editable
                .dataset
                .rowIndex
            )
          ];


      if (
        location &&
        row
      ) {

        event.preventDefault();

        event.stopPropagation();


        showRow(
          "LOCATION",
          location,
          row,
          editable
        );

      }

    }

  }


  /* =====================================================
     BIND DRAWING EVENTS
  ===================================================== */

  function bindDrawingEvents() {

    const stationHost =
      document.getElementById(
        "stationSvgHost"
      );


    if (
      stationHost &&
      !stationHost.dataset
        .propertiesBound
    ) {

      stationHost.dataset
        .propertiesBound =
        "true";


      stationHost.addEventListener(
        "click",
        handleStationClick,
        true
      );

    }


    const locationHost =
      document.getElementById(
        "locationSvgHost"
      );


    if (
      locationHost &&
      !locationHost.dataset
        .propertiesBound
    ) {

      locationHost.dataset
        .propertiesBound =
        "true";


      locationHost.addEventListener(
        "click",
        handleLocationClick,
        true
      );

    }

  }


  /* =====================================================
     OBSERVE DRAWINGS
  ===================================================== */

  function observeHost(
    host
  ) {

    if (
      !host ||
      host.dataset
        .propertiesObserved
    ) {

      return;

    }


    host.dataset
      .propertiesObserved =
      "true";


    const observer =
      new MutationObserver(
        decorateDrawings
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
     PANEL EVENTS
  ===================================================== */

  function bindPanelEvents() {

    document
      .getElementById(
        "drawingPropertiesClose"
      )
      ?.addEventListener(
        "click",
        closePanel
      );


    document
      .getElementById(
        "drawingPropertyCancel"
      )
      ?.addEventListener(
        "click",
        closePanel
      );


    document
      .getElementById(
        "drawingPropertySave"
      )
      ?.addEventListener(
        "click",
        saveProperties
      );


    document
      .getElementById(
        "drawingStructureActions"
      )
      ?.addEventListener(
        "click",
        function (
          event
        ) {

          const button =
            event.target.closest(
              "[data-action]"
            );


          if (
            !button
          ) {

            return;

          }


          handleStructureAction(
            button.dataset.action
          );

        }
      );

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  function initialize() {

    injectStyles();

    createPanel();

    bindPanelEvents();


    let attempts =
      0;


    const timer =
      setInterval(
        function () {

          attempts++;


          const stationHost =
            document.getElementById(
              "stationSvgHost"
            );


          const locationHost =
            document.getElementById(
              "locationSvgHost"
            );


          bindDrawingEvents();


          observeHost(
            stationHost
          );


          observeHost(
            locationHost
          );


          if (
            stationHost ||
            locationHost
          ) {

            decorateDrawings();


            setTimeout(
              decorateDrawings,
              700
            );


            setTimeout(
              decorateDrawings,
              1800
            );


            window.CTR_DRAWING_PROPERTIES = {

              version:
                VERSION,

              refresh:
                decorateDrawings,

              close:
                closePanel

            };


            console.log(
              "CTR Drawing Properties:",
              VERSION,
              "ready"
            );


            clearInterval(
              timer
            );

          }


          if (
            attempts >=
            60
          ) {

            clearInterval(
              timer
            );

          }

        },
        200
      );

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