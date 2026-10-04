/* =========================================================
   CTR MANAGEMENT SYSTEM
   STATION CTR SVG DRAWING VIEW

   VERSION 3.3.0

   FINAL DRAWING READABILITY PASS
   ---------------------------------------------------------
   - Larger terminal numbers
   - Larger circuit particulars
   - Larger row labels
   - Wider terminal spacing
   - Larger S-type fuse symbol
   - Straight / Fuse conductor support
   - Separate FUSE DETAILS visual area removed
   - Compatible with Station Connections
   - Compatible with Drawing Properties
========================================================= */

(function () {

  "use strict";


  const SVG_NS =
    "http://www.w3.org/2000/svg";


  const VERSION =
    "3.3.0";


  let activeRackIndex =
    0;


  let refreshTimer =
    null;


  /* =====================================================
     DATA
  ===================================================== */

  function getStationRacks() {

    try {

      if (
        typeof stationCtrRacks !== "undefined" &&
        Array.isArray(
          stationCtrRacks
        )
      ) {

        return stationCtrRacks;

      }

    }

    catch (error) {

      console.error(
        "Station SVG: stationCtrRacks unavailable.",
        error
      );

    }


    return [];

  }


  /* =====================================================
     STATION NAME
  ===================================================== */

  function getStationName() {

    return (

      document
        .querySelector(
          ".station-hero h2"
        )
        ?.textContent
        ?.trim()

      ||

      document
        .querySelector(
          ".topbar h1"
        )
        ?.textContent
        ?.replace(
          /\s+CTR$/i,
          ""
        )
        ?.trim()

      ||

      "STATION"

    );

  }


  /* =====================================================
     SVG ELEMENT
  ===================================================== */

  function svgElement(
    name,
    attributes = {}
  ) {

    const element =
      document.createElementNS(
        SVG_NS,
        name
      );


    Object.entries(
      attributes
    )
      .forEach(
        function (
          [key, value]
        ) {

          if (
            value === undefined ||
            value === null
          ) {

            return;

          }


          element.setAttribute(
            key,
            value
          );

        }
      );


    return element;

  }


  /* =====================================================
     TEXT
  ===================================================== */

  function drawText(
    parent,
    text,
    x,
    y,
    options = {}
  ) {

    const element =
      svgElement(
        "text",
        {

          x,

          y,

          fill:
            options.fill ||
            "#111111",

          "font-family":
            "Arial, Helvetica, sans-serif",

          "font-size":
            options.size ||
            11,

          "font-weight":
            options.weight ||
            500,

          "text-anchor":
            options.anchor ||
            "middle",

          "dominant-baseline":
            "alphabetic",

          "paint-order":
            options.halo
              ? "stroke"
              : null,

          stroke:
            options.halo
              ? "#ffffff"
              : null,

          "stroke-width":
            options.halo
              ? 3
              : null,

          "stroke-linejoin":
            options.halo
              ? "round"
              : null

        }
      );


    element.textContent =
      text;


    parent.appendChild(
      element
    );


    return element;

  }


  /* =====================================================
     LINE
  ===================================================== */

  function drawLine(
    parent,
    x1,
    y1,
    x2,
    y2,
    width = 1.5
  ) {

    const line =
      svgElement(
        "line",
        {

          x1,

          y1,

          x2,

          y2,

          stroke:
            "#111111",

          "stroke-width":
            width

        }
      );


    parent.appendChild(
      line
    );


    return line;

  }


  /* =====================================================
     CIRCLE
  ===================================================== */

  function drawCircle(
    parent,
    cx,
    cy,
    radius = 4.5
  ) {

    const circle =
      svgElement(
        "circle",
        {

          cx,

          cy,

          r:
            radius,

          fill:
            "#ffffff",

          stroke:
            "#111111",

          "stroke-width":
            1.5

        }
      );


    parent.appendChild(
      circle
    );


    return circle;

  }


  /* =====================================================
     STRAIGHT CONDUCTOR
  ===================================================== */

  function drawStraightConductor(
    parent,
    x,
    topY,
    bottomY
  ) {

    drawLine(
      parent,
      x,
      topY + 5,
      x,
      bottomY - 5,
      1.6
    );

  }


  /* =====================================================
     S TYPE FUSE CONDUCTOR

           ○
           │
          S
           │
           ○
  ===================================================== */

  function drawFuseConductor(
    parent,
    x,
    topY,
    bottomY
  ) {

    const startY =
      topY + 5;


    const endY =
      bottomY - 5;


    const fuseTop =
      startY + 4;


    const fuseBottom =
      endY - 4;


    const fuseMiddle =
      (
        fuseTop +
        fuseBottom
      ) / 2;


    /* Upper lead */

    drawLine(
      parent,
      x,
      startY,
      x,
      fuseTop,
      1.7
    );


    /* S-shaped fuse body */

    const path =
      svgElement(
        "path",
        {

          d:
            [

              `M ${x} ${fuseTop}`,

              `C
                ${x - 11} ${fuseTop + 2},
                ${x - 11} ${fuseMiddle - 4},
                ${x} ${fuseMiddle}`,

              `C
                ${x + 11} ${fuseMiddle + 4},
                ${x + 11} ${fuseBottom - 2},
                ${x} ${fuseBottom}`

            ].join(
              " "
            ),

          fill:
            "none",

          stroke:
            "#111111",

          "stroke-width":
            2,

          "stroke-linecap":
            "round",

          "stroke-linejoin":
            "round"

        }
      );


    parent.appendChild(
      path
    );


    /* Lower lead */

    drawLine(
      parent,
      x,
      fuseBottom,
      x,
      endY,
      1.7
    );

  }


  /* =====================================================
     TERMINAL
  ===================================================== */

  function drawTerminal(
    svg,
    rackIndex,
    rowIndex,
    terminalIndex,
    terminal,
    x,
    y
  ) {

    terminal.conductorStyle =
      terminal.conductorStyle ||
      "STRAIGHT";


    const group =
      svgElement(
        "g",
        {

          "data-ctr-object":
            "terminal",

          "data-rack-index":
            rackIndex,

          "data-row-index":
            rowIndex,

          "data-terminal-index":
            terminalIndex,

          tabindex:
            "0",

          role:
            "button",

          cursor:
            "pointer"

        }
      );


    const topY =
      y - 24;


    const bottomY =
      y + 24;


    /* Bigger click area */

    const hit =
      svgElement(
        "rect",
        {

          x:
            x - 20,

          y:
            topY - 28,

          width:
            45,

          height:
            82,

          fill:
            "transparent",

          "pointer-events":
            "all"

        }
      );


    group.appendChild(
      hit
    );


    /* Upper terminal point */

    drawCircle(
      group,
      x,
      topY
    );


    /* Conductor */

    if (
      String(
        terminal.conductorStyle
      )
        .toUpperCase() ===
      "FUSE"
    ) {

      drawFuseConductor(
        group,
        x,
        topY,
        bottomY
      );

    }

    else {

      drawStraightConductor(
        group,
        x,
        topY,
        bottomY
      );

    }


    /* Lower terminal point */

    drawCircle(
      group,
      x,
      bottomY
    );


    /* Terminal number */

    drawText(
      group,
      String(
        Number(
          terminal.number
        ) ||
        terminal.number ||
        terminalIndex + 1
      ),
      x + 12,
      y + 4,
      {

        size:
          11.5,

        weight:
          700,

        anchor:
          "start",

        halo:
          true

      }
    );


    /* Circuit / conductor particular */

    if (
      terminal.particular
    ) {

      drawText(
        group,
        terminal.particular,
        x,
        topY - 16,
        {

          size:
            10.5,

          weight:
            700,

          halo:
            true

        }
      );

    }


    const title =
      svgElement(
        "title"
      );


    title.textContent =
      [

        `Terminal ${
          terminal.number ||
          terminalIndex + 1
        }`,

        `Conductor: ${
          terminal.conductorStyle
        }`,

        terminal.status ||
        "SPARE",

        terminal.particular ||
        "",

        terminal.locationBox
          ? `Location: ${
              terminal.locationBox
            }`
          : "",

        terminal.locationTerminal
          ? `Connected Terminal: ${
              terminal.locationTerminal
            }`
          : "",

        terminal.remarks ||
        ""

      ]
        .filter(
          Boolean
        )
        .join(
          " | "
        );


    group.appendChild(
      title
    );


    svg.appendChild(
      group
    );

  }


  /* =====================================================
     SHEET SIZE
  ===================================================== */

  function calculateSheetSize(
    rack
  ) {

    const rows =
      Array.isArray(
        rack?.rows
      )
        ? rack.rows
        : [];


    let maxTerminals =
      12;


    rows.forEach(
      function (
        row
      ) {

        maxTerminals =
          Math.max(
            maxTerminals,
            row?.terminals?.length ||
            0
          );

      }
    );


    const width =
      Math.max(
        1450,
        250 +
        (
          maxTerminals *
          54
        )
      );


    const height =
      Math.max(
        760,
        340 +
        (
          rows.length *
          175
        )
      );


    return {

      width,

      height

    };

  }


  /* =====================================================
     BUILD RACK SVG
  ===================================================== */

  function buildRackSvg(
    rack,
    rackIndex
  ) {

    const size =
      calculateSheetSize(
        rack
      );


    const svg =
      svgElement(
        "svg",
        {

          viewBox:
            `0 0 ${size.width} ${size.height}`,

          width:
            "100%",

          height:
            size.height,

          role:
            "img",

          "aria-label":
            `CTR Rack ${
              rack?.name ||
              rackIndex + 1
            }`

        }
      );


    svg.style.background =
      "#ffffff";


    /* Outer engineering sheet border */

    const border =
      svgElement(
        "rect",
        {

          x:
            8,

          y:
            8,

          width:
            size.width - 16,

          height:
            size.height - 16,

          fill:
            "#ffffff",

          stroke:
            "#555555",

          "stroke-width":
            1.5

        }
      );


    svg.appendChild(
      border
    );


    /* Station title */

    drawText(
      svg,
      `${getStationName()} STATION`,
      size.width / 2,
      55,
      {

        size:
          20,

        weight:
          700

      }
    );


    /* Rack title */

    const rackTitle =
      drawText(
        svg,
        rack?.name ||
        `K${rackIndex + 1}`,
        size.width / 2,
        88,
        {

          size:
            15,

          weight:
            700

        }
      );


    rackTitle.setAttribute(
      "data-drawing-edit",
      "station-rack"
    );


    rackTitle.setAttribute(
      "data-rack-index",
      rackIndex
    );


    /*
       No separate FUSE DETAILS visual section.

       Space above terminal row is deliberately
       reserved for nested upper bridges.
    */


    const rows =
      Array.isArray(
        rack?.rows
      )
        ? rack.rows
        : [];


    const startX =
      210;


    const pitch =
      54;


    const startY =
      285;


    const rowGap =
      175;


    rows.forEach(
      function (
        row,
        rowIndex
      ) {

        const y =
          startY +
          (
            rowIndex *
            rowGap
          );


        /* Row label */

        const rowLabel =
          drawText(
            svg,
            row?.label ||
            String(
              rowIndex + 1
            ),
            78,
            y + 6,
            {

              size:
                19,

              weight:
                700,

              anchor:
                "start"

            }
          );


        rowLabel.setAttribute(
          "data-drawing-edit",
          "station-row"
        );


        rowLabel.setAttribute(
          "data-rack-index",
          rackIndex
        );


        rowLabel.setAttribute(
          "data-row-index",
          rowIndex
        );


        const terminals =
          Array.isArray(
            row?.terminals
          )
            ? row.terminals
            : [];


        terminals.forEach(
          function (
            terminal,
            terminalIndex
          ) {

            const x =
              startX +
              (
                terminalIndex *
                pitch
              );


            drawTerminal(

              svg,

              rackIndex,

              rowIndex,

              terminalIndex,

              terminal,

              x,

              y

            );

          }
        );

      }
    );


    /* Footer */

    drawText(
      svg,
      `RACK ${
        rack?.name ||
        ""
      }`,
      size.width - 100,
      size.height - 30,
      {

        size:
          11,

        weight:
          700

      }
    );


    return svg;

  }


  /* =====================================================
     CREATE DRAWING SECTION
  ===================================================== */

  function createDrawingSection() {

    if (
      document.getElementById(
        "stationSvgDrawingSection"
      )
    ) {

      return;

    }


    const section =
      document.createElement(
        "section"
      );


    section.id =
      "stationSvgDrawingSection";


    section.innerHTML = `

      <div class="station-svg-head">

        <div>

          <span>
            ENGINEERING DRAWING
          </span>

          <h2>
            CTR Drawing View
          </h2>

          <p>
            Live drawing generated from this station's
            current CTR data. Click a terminal to edit it.
          </p>

        </div>


        <div class="station-svg-actions">

          <span class="station-svg-live">
            LIVE
          </span>


          <button
            type="button"
            id="stationAddConnection"
          >
            + Connection
          </button>


          <span id="stationConnectionStatus">
            Ready
          </span>


          <select
            id="stationSvgRackSelect"
            aria-label="CTR Rack"
          ></select>


          <button
            type="button"
            id="stationSvgRefresh"
          >
            Refresh
          </button>

        </div>

      </div>


      <div class="station-svg-workspace">

        <div id="stationSvgHost"></div>

      </div>

    `;


    const quickNavigation =
      document.querySelector(
        ".quick-navigation"
      );


    if (
      quickNavigation
    ) {

      quickNavigation
        .insertAdjacentElement(
          "afterend",
          section
        );

    }

    else {

      document
        .querySelector(
          ".page-content"
        )
        ?.prepend(
          section
        );

    }

  }


  /* =====================================================
     CSS
  ===================================================== */

  function injectStyles() {

    document
      .getElementById(
        "stationSvgViewStyles"
      )
      ?.remove();


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "stationSvgViewStyles";


    style.textContent = `

      #stationSvgDrawingSection {

        margin:
          20px 0;

        border:
          1px solid #c8d3de;

        background:
          #ffffff;

      }


      .station-svg-head {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          20px;

        padding:
          16px 18px;

        border-bottom:
          1px solid #c8d3de;

        background:
          #ffffff;

      }


      .station-svg-head > div:first-child span {

        display:
          block;

        margin-bottom:
          5px;

        color:
          #52697d;

        font-size:
          10px;

        font-weight:
          700;

        letter-spacing:
          1px;

      }


      .station-svg-head h2 {

        margin:
          0;

        color:
          #173e6e;

        font-size:
          21px;

      }


      .station-svg-head p {

        margin:
          5px 0 0;

        color:
          #607487;

        font-size:
          11px;

      }


      .station-svg-actions {

        display:
          flex;

        align-items:
          center;

        justify-content:
          flex-end;

        flex-wrap:
          wrap;

        gap:
          8px;

      }


      .station-svg-actions button,
      .station-svg-actions select {

        min-height:
          34px;

        border:
          1px solid #173e6e;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #173e6e;

        font-size:
          10px;

        font-weight:
          700;

      }


      .station-svg-actions button {

        padding:
          0 12px;

        cursor:
          pointer;

      }


      .station-svg-actions select {

        padding:
          0 28px 0 10px;

      }


      .station-svg-live {

        display:
          inline-flex;

        align-items:
          center;

        min-height:
          25px;

        padding:
          0 8px;

        border:
          1px solid #aac7b0;

        border-radius:
          12px;

        background:
          #f0f8f2;

        color:
          #31663c;

        font-size:
          9px;

        font-weight:
          700;

      }


      .station-svg-workspace {

        overflow:
          auto;

        padding:
          18px;

        background:
          #eef2f5;

      }


      #stationSvgHost {

        min-width:
          1100px;

        background:
          #ffffff;

      }


      #stationSvgHost svg {

        display:
          block;

        min-width:
          100%;

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =====================================================
     RACK SELECT
  ===================================================== */

  function populateRackSelector() {

    const select =
      document.getElementById(
        "stationSvgRackSelect"
      );


    if (!select) {

      return;

    }


    const racks =
      getStationRacks();


    if (
      activeRackIndex >=
      racks.length
    ) {

      activeRackIndex =
        Math.max(
          0,
          racks.length - 1
        );

    }


    select.replaceChildren();


    racks.forEach(
      function (
        rack,
        index
      ) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          index;


        option.textContent =
          rack?.name ||
          `K${index + 1}`;


        select.appendChild(
          option
        );

      }
    );


    select.value =
      String(
        activeRackIndex
      );

  }


  /* =====================================================
     RENDER
  ===================================================== */

  function renderDrawing() {

    const host =
      document.getElementById(
        "stationSvgHost"
      );


    if (!host) {

      return;

    }


    const racks =
      getStationRacks();


    host.replaceChildren();


    if (
      racks.length === 0
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.style.padding =
        "30px";


      empty.textContent =
        "No Station CTR Rack available.";


      host.appendChild(
        empty
      );


      return;

    }


    if (
      activeRackIndex >=
      racks.length
    ) {

      activeRackIndex =
        0;

    }


    const rack =
      racks[
        activeRackIndex
      ];


    const svg =
      buildRackSvg(
        rack,
        activeRackIndex
      );


    host.appendChild(
      svg
    );


    setTimeout(
      function () {

        window
          .CTR_STATION_CONNECTIONS
          ?.redraw?.();


        window
          .CTR_DRAWING_PROPERTIES
          ?.refresh?.();

      },
      60
    );

  }


  /* =====================================================
     REFRESH
  ===================================================== */

  function refresh() {

    populateRackSelector();

    renderDrawing();

  }


  function scheduleRefresh(
    delay = 120
  ) {

    clearTimeout(
      refreshTimer
    );


    refreshTimer =
      setTimeout(
        refresh,
        delay
      );

  }


  /* =====================================================
     FALLBACK SVG INTERACTION
  ===================================================== */

  function bindSvgInteraction() {

    const host =
      document.getElementById(
        "stationSvgHost"
      );


    if (
      !host ||
      host.dataset.stationSvgBound
    ) {

      return;

    }


    host.dataset.stationSvgBound =
      "true";


    host.addEventListener(
      "click",
      function (
        event
      ) {

        /*
           Drawing Properties handles terminal
           interaction when available.

           This listener is kept only for compatibility.
        */

        const terminal =
          event.target.closest(
            '[data-ctr-object="terminal"]'
          );


        if (!terminal) {

          return;

        }


        if (
          document
            .getElementById(
              "stationAddConnection"
            )
            ?.classList
            .contains(
              "active"
            )
        ) {

          return;

        }

      }
    );

  }


  /* =====================================================
     WATCH BUILDER
  ===================================================== */

  function watchExistingBuilder() {

    const container =
      document.getElementById(
        "stationCtrRacksContainer"
      );


    if (
      container
    ) {

      const observer =
        new MutationObserver(
          function () {

            scheduleRefresh(
              160
            );

          }
        );


      observer.observe(
        container,
        {

          childList:
            true,

          subtree:
            true,

          characterData:
            true

        }
      );


      container.addEventListener(
        "input",
        function () {

          scheduleRefresh(
            120
          );

        }
      );


      container.addEventListener(
        "change",
        function () {

          scheduleRefresh(
            120
          );

        }
      );


      container.addEventListener(
        "click",
        function () {

          scheduleRefresh(
            180
          );

        }
      );

    }


    document
      .getElementById(
        "addStationCtrRack"
      )
      ?.addEventListener(
        "click",
        function () {

          scheduleRefresh(
            180
          );

        }
      );


    document
      .getElementById(
        "saveTerminalPreview"
      )
      ?.addEventListener(
        "click",
        function () {

          scheduleRefresh(
            120
          );

        }
      );

  }


  /* =====================================================
     CONTROLS
  ===================================================== */

  function bindControls() {

    document
      .getElementById(
        "stationSvgRackSelect"
      )
      ?.addEventListener(
        "change",
        function () {

          activeRackIndex =
            Number(
              this.value
            ) || 0;


          renderDrawing();

        }
      );


    document
      .getElementById(
        "stationSvgRefresh"
      )
      ?.addEventListener(
        "click",
        refresh
      );

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  function initialize() {

    injectStyles();

    createDrawingSection();

    populateRackSelector();

    bindControls();

    bindSvgInteraction();

    watchExistingBuilder();

    renderDrawing();


    setTimeout(
      refresh,
      500
    );


    setTimeout(
      refresh,
      1200
    );


    setTimeout(
      refresh,
      2500
    );


    window.CTR_STATION_SVG_VIEW = {

      version:
        VERSION,

      refresh,

      getActiveRackIndex:
        function () {

          return activeRackIndex;

        }

    };


    console.log(
      "CTR Station SVG View:",
      VERSION,
      "ready"
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