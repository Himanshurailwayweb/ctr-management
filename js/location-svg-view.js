/* =========================================================
   CTR MANAGEMENT SYSTEM
   LOCATION BOX SVG DRAWING VIEW

   VERSION 1.3.0

   FINAL DRAWING READABILITY PASS
   ---------------------------------------------------------
   - Larger terminal numbers
   - Larger circuit particulars
   - Larger row labels
   - Wider spacing
   - Larger S-type Fuse conductor
   - No separate FUSE DETAILS visual area
   - Direct Location Box rows
   - Compatible with Location Connections
   - Compatible with Drawing Properties
========================================================= */

(function () {

  "use strict";


  const SVG_NS =
    "http://www.w3.org/2000/svg";


  const VERSION =
    "1.3.0";


  let activeEndIndex =
    0;


  let activeLocationIndex =
    0;


  let refreshTimer =
    null;


  /* =====================================================
     DATA
  ===================================================== */

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
        "Location SVG: connectedEnds unavailable.",
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
     SVG HELPER
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

    const item =
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


    item.textContent =
      text;


    parent.appendChild(
      item
    );


    return item;

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
     S TYPE FUSE
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


    drawLine(
      parent,
      x,
      startY,
      x,
      fuseTop,
      1.7
    );


    const fusePath =
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
      fusePath
    );


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
    terminal,
    rowIndex,
    terminalIndex,
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

          "data-location-terminal":
            "true",

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


    drawCircle(
      group,
      x,
      topY
    );


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


    /* Particular */

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

        terminal.locationBox ||
        "",

        terminal.locationTerminal ||
        "",

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
     SIZE
  ===================================================== */

  function calculateSize(
    location
  ) {

    const rows =
      Array.isArray(
        location?.rows
      )
        ? location.rows
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


    return {

      width:
        Math.max(
          1450,
          250 +
          (
            maxTerminals *
            54
          )
        ),

      height:
        Math.max(
          760,
          330 +
          (
            rows.length *
            175
          )
        )

    };

  }


  /* =====================================================
     BUILD LOCATION SVG
  ===================================================== */

  function buildLocationSvg(
    end,
    location
  ) {

    const size =
      calculateSize(
        location
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
            location?.name ||
            "Location Box"

        }
      );


    svg.style.background =
      "#ffffff";


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


    /* Station */

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


    /* End name */

    const endTitle =
      drawText(
        svg,
        end?.name ||
        "CONNECTED END",
        size.width / 2,
        86,
        {

          size:
            13,

          weight:
            700

        }
      );


    endTitle.setAttribute(
      "data-drawing-edit",
      "location-end"
    );


    /* Location name */

    const locationTitle =
      drawText(
        svg,
        location?.name ||
        "LOCATION BOX",
        size.width / 2,
        116,
        {

          size:
            16,

          weight:
            700

        }
      );


    locationTitle.setAttribute(
      "data-drawing-edit",
      "location-name"
    );


    /*
       No separate Fuse Details area.

       Upper space is reserved for nested bridges.
    */


    const rows =
      Array.isArray(
        location?.rows
      )
        ? location.rows
        : [];


    const startX =
      210;


    const pitch =
      54;


    const rowStartY =
      285;


    const rowGap =
      175;


    rows.forEach(
      function (
        row,
        rowIndex
      ) {

        const y =
          rowStartY +
          (
            rowIndex *
            rowGap
          );


        const rowTitle =
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


        rowTitle.setAttribute(
          "data-drawing-edit",
          "location-row"
        );


        rowTitle.setAttribute(
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

            drawTerminal(

              svg,

              terminal,

              rowIndex,

              terminalIndex,

              startX +
              (
                terminalIndex *
                pitch
              ),

              y

            );

          }
        );

      }
    );


    drawText(
      svg,
      location?.name ||
      "LOCATION BOX",
      size.width - 110,
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
     UI
  ===================================================== */

  function createSection() {

    if (
      document.getElementById(
        "locationSvgDrawingSection"
      )
    ) {

      return;

    }


    const section =
      document.createElement(
        "section"
      );


    section.id =
      "locationSvgDrawingSection";


    section.innerHTML = `

      <div class="location-svg-head">

        <div>

          <span>
            CONNECTED END DRAWING
          </span>

          <h2>
            Location Box Drawing View
          </h2>

          <p>
            Location Box engineering drawing generated
            from the current station draft.
          </p>

        </div>


        <div class="location-svg-actions">

          <select
            id="locationSvgEndSelect"
            aria-label="Connected End"
          ></select>


          <select
            id="locationSvgBoxSelect"
            aria-label="Location Box"
          ></select>


          <button
            type="button"
            id="locationSvgRefresh"
          >
            Refresh
          </button>

        </div>

      </div>


      <div class="location-svg-workspace">

        <div id="locationSvgHost"></div>

      </div>

    `;


    const stationSection =
      document.getElementById(
        "stationSvgDrawingSection"
      );


    if (
      stationSection
    ) {

      stationSection
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
        ?.appendChild(
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
        "locationSvgViewStyles"
      )
      ?.remove();


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "locationSvgViewStyles";


    style.textContent = `

      #locationSvgDrawingSection {

        margin:
          20px 0;

        border:
          1px solid #c8d3de;

        background:
          #ffffff;

      }


      .location-svg-head {

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


      .location-svg-head > div:first-child span {

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


      .location-svg-head h2 {

        margin:
          0;

        color:
          #173e6e;

        font-size:
          21px;

      }


      .location-svg-head p {

        margin:
          5px 0 0;

        color:
          #607487;

        font-size:
          11px;

      }


      .location-svg-actions {

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


      .location-svg-actions button,
      .location-svg-actions select {

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


      .location-svg-actions button {

        padding:
          0 12px;

        cursor:
          pointer;

      }


      .location-svg-actions select {

        padding:
          0 28px 0 10px;

      }


      .location-svg-workspace {

        overflow:
          auto;

        padding:
          18px;

        background:
          #eef2f5;

      }


      #locationSvgHost {

        min-width:
          1100px;

        background:
          #ffffff;

      }


      #locationSvgHost svg {

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
     SELECTORS
  ===================================================== */

  function populateEndSelector() {

    const select =
      document.getElementById(
        "locationSvgEndSelect"
      );


    if (!select) {

      return;

    }


    const ends =
      getConnectedEnds();


    if (
      activeEndIndex >=
      ends.length
    ) {

      activeEndIndex =
        Math.max(
          0,
          ends.length - 1
        );

    }


    select.replaceChildren();


    ends.forEach(
      function (
        end,
        index
      ) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          index;


        option.textContent =
          end?.name ||
          `Connected End ${index + 1}`;


        select.appendChild(
          option
        );

      }
    );


    select.value =
      String(
        activeEndIndex
      );

  }


  function populateLocationSelector() {

    const select =
      document.getElementById(
        "locationSvgBoxSelect"
      );


    if (!select) {

      return;

    }


    const end =
      getConnectedEnds()[
        activeEndIndex
      ];


    const locations =
      Array.isArray(
        end?.locations
      )
        ? end.locations
        : [];


    if (
      activeLocationIndex >=
      locations.length
    ) {

      activeLocationIndex =
        Math.max(
          0,
          locations.length - 1
        );

    }


    select.replaceChildren();


    locations.forEach(
      function (
        location,
        index
      ) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          index;


        option.textContent =
          location?.name ||
          `Location Box ${index + 1}`;


        select.appendChild(
          option
        );

      }
    );


    select.value =
      String(
        activeLocationIndex
      );

  }


  /* =====================================================
     RENDER
  ===================================================== */

  function render() {

    const host =
      document.getElementById(
        "locationSvgHost"
      );


    if (!host) {

      return;

    }


    const ends =
      getConnectedEnds();


    host.replaceChildren();


    if (
      ends.length === 0
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.style.padding =
        "30px";


      empty.textContent =
        "No Connected End available.";


      host.appendChild(
        empty
      );


      return;

    }


    if (
      activeEndIndex >=
      ends.length
    ) {

      activeEndIndex =
        0;

    }


    const end =
      ends[
        activeEndIndex
      ];


    const locations =
      Array.isArray(
        end?.locations
      )
        ? end.locations
        : [];


    if (
      locations.length === 0
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.style.padding =
        "30px";


      empty.textContent =
        "No Location Box available under this Connected End.";


      host.appendChild(
        empty
      );


      return;

    }


    if (
      activeLocationIndex >=
      locations.length
    ) {

      activeLocationIndex =
        0;

    }


    const location =
      locations[
        activeLocationIndex
      ];


    const svg =
      buildLocationSvg(
        end,
        location
      );


    host.appendChild(
      svg
    );


    setTimeout(
      function () {

        window
          .CTR_LOCATION_CONNECTIONS
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

    populateEndSelector();

    populateLocationSelector();

    render();

  }


  function scheduleRefresh(
    delay = 150
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
     EVENTS
  ===================================================== */

  function bindEvents() {

    document
      .getElementById(
        "locationSvgEndSelect"
      )
      ?.addEventListener(
        "change",
        function () {

          activeEndIndex =
            Number(
              this.value
            ) || 0;


          activeLocationIndex =
            0;


          populateLocationSelector();

          render();

        }
      );


    document
      .getElementById(
        "locationSvgBoxSelect"
      )
      ?.addEventListener(
        "change",
        function () {

          activeLocationIndex =
            Number(
              this.value
            ) || 0;


          render();

        }
      );


    document
      .getElementById(
        "locationSvgRefresh"
      )
      ?.addEventListener(
        "click",
        refresh
      );


    const container =
      document.getElementById(
        "connectedEndsContainer"
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
        "addConnectedEnd"
      )
      ?.addEventListener(
        "click",
        function () {

          scheduleRefresh(
            180
          );

        }
      );

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  function initialize() {

    injectStyles();

    createSection();

    bindEvents();

    refresh();


    setTimeout(
      refresh,
      700
    );


    setTimeout(
      refresh,
      1600
    );


    setTimeout(
      refresh,
      2800
    );


    window.CTR_LOCATION_SVG_VIEW = {

      version:
        VERSION,

      refresh,

      getActiveEndIndex:
        function () {

          return activeEndIndex;

        },

      getActiveLocationIndex:
        function () {

          return activeLocationIndex;

        }

    };


    console.log(
      "CTR Location SVG View:",
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