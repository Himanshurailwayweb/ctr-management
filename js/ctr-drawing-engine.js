/* =========================================================
   CTR MANAGEMENT SYSTEM
   ENGINEERING DRAWING ENGINE
   VERSION 1.0

   PURPOSE
   ---------------------------------------------------------
   - Draw CTR terminal strips
   - Draw connected conductors
   - Draw fuse symbols
   - Draw jumpers / loop connections
   - Draw engineering labels
   - Draw terminal groups
   - Prepare reusable SVG sheets

   FINAL PDF:
   Individual sheets will later be combined into
   ONE complete station CTR PDF.
========================================================= */

(function () {

  "use strict";


  /* =====================================================
     CONSTANTS
  ===================================================== */

  const SVG_NS =
    "http://www.w3.org/2000/svg";


  const ENGINE_VERSION =
    "1.0.0";


  const DEFAULT_SHEET = {

    width:
      1600,

    height:
      1120,

    margin:
      45,

    terminalRadius:
      4,

    terminalPitch:
      34,

    rowPitch:
      115

  };


  /* =====================================================
     SVG ELEMENT HELPER
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
        function ([
          key,
          value
        ]) {

          if (
            value !==
            undefined &&
            value !==
            null
          ) {

            element.setAttribute(
              key,
              String(value)
            );

          }

        }
      );


    return element;

  }


  /* =====================================================
     DRAWING ROOT
  ===================================================== */

  function createSheet(
    options = {}
  ) {

    const config = {

      ...DEFAULT_SHEET,
      ...options

    };


    const svg =
      svgElement(
        "svg",
        {

          xmlns:
            SVG_NS,

          viewBox:
            `0 0 ${config.width} ${config.height}`,

          width:
            "100%",

          height:
            "100%",

          preserveAspectRatio:
            "xMidYMid meet"

        }
      );


    svg.classList.add(
      "ctr-engineering-sheet"
    );


    svg.style.background =
      "#ffffff";


    /*
      Main drawing groups
    */

    const borderLayer =
      svgElement(
        "g",
        {
          "data-layer":
            "border"
        }
      );


    const conductorLayer =
      svgElement(
        "g",
        {
          "data-layer":
            "conductors"
        }
      );


    const terminalLayer =
      svgElement(
        "g",
        {
          "data-layer":
            "terminals"
        }
      );


    const symbolLayer =
      svgElement(
        "g",
        {
          "data-layer":
            "symbols"
        }
      );


    const textLayer =
      svgElement(
        "g",
        {
          "data-layer":
            "text"
        }
      );


    svg.appendChild(
      borderLayer
    );

    svg.appendChild(
      conductorLayer
    );

    svg.appendChild(
      terminalLayer
    );

    svg.appendChild(
      symbolLayer
    );

    svg.appendChild(
      textLayer
    );


    drawSheetBorder(
      borderLayer,
      config
    );


    return {

      svg,

      config,

      layers: {

        border:
          borderLayer,

        conductors:
          conductorLayer,

        terminals:
          terminalLayer,

        symbols:
          symbolLayer,

        text:
          textLayer

      }

    };

  }


  /* =====================================================
     SHEET BORDER
  ===================================================== */

  function drawSheetBorder(
    layer,
    config
  ) {

    const outer =
      svgElement(
        "rect",
        {

          x:
            config.margin,

          y:
            config.margin,

          width:
            config.width -
            (
              config.margin * 2
            ),

          height:
            config.height -
            (
              config.margin * 2
            ),

          fill:
            "none",

          stroke:
            "#111111",

          "stroke-width":
            2

        }
      );


    layer.appendChild(
      outer
    );


    const inner =
      svgElement(
        "rect",
        {

          x:
            config.margin + 8,

          y:
            config.margin + 8,

          width:
            config.width -
            (
              config.margin * 2
            ) -
            16,

          height:
            config.height -
            (
              config.margin * 2
            ) -
            16,

          fill:
            "none",

          stroke:
            "#333333",

          "stroke-width":
            1

        }
      );


    layer.appendChild(
      inner
    );

  }


  /* =====================================================
     TERMINAL
  ===================================================== */

  function drawTerminal(
  sheet,
  terminal
) {

  const {
    x,
    y,
    number,
    label,
    id
  } = terminal;


  const halfHeight =
    18;


  const group =
    svgElement(
      "g",
      {
        "data-object-type":
          "terminal",

        "data-object-id":
          id || ""
      }
    );


  /* Top connection point */

  const topCircle =
    svgElement(
      "circle",
      {
        cx:
          x,

        cy:
          y - halfHeight,

        r:
          3.2,

        fill:
          "#ffffff",

        stroke:
          "#111111",

        "stroke-width":
          1.2
      }
    );


  /* Terminal conductor */

  const terminalLine =
    svgElement(
      "line",
      {
        x1:
          x,

        y1:
          y - halfHeight + 3,

        x2:
          x,

        y2:
          y + halfHeight - 3,

        stroke:
          "#111111",

        "stroke-width":
          1.25
      }
    );


  /* Bottom connection point */

  const bottomCircle =
    svgElement(
      "circle",
      {
        cx:
          x,

        cy:
          y + halfHeight,

        r:
          3.2,

        fill:
          "#ffffff",

        stroke:
          "#111111",

        "stroke-width":
          1.2
      }
    );


  group.appendChild(
    terminalLine
  );

  group.appendChild(
    topCircle
  );

  group.appendChild(
    bottomCircle
  );


  /* Terminal number between both points */

  if (
    number !== undefined
  ) {

    const numberText =
      svgElement(
        "text",
        {
          x:
            x + 7,

          y:
            y + 4,

          "text-anchor":
            "start",

          "font-family":
            "Arial, sans-serif",

          "font-size":
            10,

          fill:
            "#111111"
        }
      );


    numberText.textContent =
      String(
        number
      );


    group.appendChild(
      numberText
    );

  }


  /* Optional equipment / circuit label */

  if (
    label
  ) {

    const labelText =
      svgElement(
        "text",
        {
          x:
            x,

          y:
            y - halfHeight - 12,

          "text-anchor":
            "middle",

          "font-family":
            "Arial, sans-serif",

          "font-size":
            10,

          fill:
            "#111111"
        }
      );


    labelText.textContent =
      label;


    group.appendChild(
      labelText
    );

  }


  /*
    Store real connection points.
    These will later be used by wires,
    fuse links and jumpers.
  */

  terminal.topPort = {
    x:
      x,

    y:
      y - halfHeight
  };


  terminal.bottomPort = {
    x:
      x,

    y:
      y + halfHeight
  };


  sheet.layers
    .terminals
    .appendChild(
      group
    );


  return group;

}


  /* =====================================================
     TERMINAL STRIP
  ===================================================== */

  function drawTerminalStrip(
    sheet,
    options = {}
  ) {

    const {

      x = 150,

      y = 250,

      count = 12,

      startNumber = 1,

      pitch =
        sheet.config
          .terminalPitch,

      labels = [],

      idPrefix =
        "T"

    } = options;


    const terminals =
      [];


    for (
      let index = 0;
      index < count;
      index += 1
    ) {

      const terminal = {

        id:
          `${idPrefix}-${index + 1}`,

        x:
          x +
          (
            index * pitch
          ),

        y:
          y,

        number:
          startNumber +
          index,

        label:
          labels[index] ||
          ""

      };


      drawTerminal(
        sheet,
        terminal
      );


      terminals.push(
        terminal
      );

    }


    return terminals;

  }


  /* =====================================================
     ORTHOGONAL CONDUCTOR
  ===================================================== */

  function drawConductor(
  sheet,
  options = {}
) {

  const {

    points = [],

    id = "",

    width = 1.5,

    dashed = false

  } = options;


  if (
    points.length <
    2
  ) {

    return null;

  }


  let pathData =
    `M ${points[0].x} ${points[0].y}`;


  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {

    pathData +=
      ` L ${points[index].x} ${points[index].y}`;

  }


  /* =====================================================
     VISIBLE ENGINEERING LINE
  ===================================================== */

  const path =
    svgElement(
      "path",
      {

        d:
          pathData,

        fill:
          "none",

        stroke:
          "#111111",

        "stroke-width":
          width,

        "stroke-linejoin":
          "round",

        "stroke-linecap":
          "square",

        "data-object-type":
          "conductor",

        "data-object-id":
          id,

        "data-conductor-role":
          "visible"

      }
    );


  if (
    dashed
  ) {

    path.setAttribute(
      "stroke-dasharray",
      "6 4"
    );

  }


  sheet.layers
    .conductors
    .appendChild(
      path
    );


  /* =====================================================
     INVISIBLE CLICK AREA

     Actual conductor remains thin.
     This wider transparent path only makes
     the conductor easier to click/select.
  ===================================================== */

  const hitPath =
    svgElement(
      "path",
      {

        d:
          pathData,

        fill:
          "none",

        stroke:
          "transparent",

        "stroke-width":
          Math.max(
            Number(width) + 10,
            12
          ),

        "stroke-linejoin":
          "round",

        "stroke-linecap":
          "round",

        "pointer-events":
          "stroke",

        cursor:
          "pointer",

        "data-object-type":
          "conductor",

        "data-object-id":
          id,

        "data-conductor-role":
          "hit-area"

      }
    );


  sheet.layers
    .conductors
    .appendChild(
      hitPath
    );


  /*
     Return visible path so existing renderer
     behaviour remains unchanged.
  */

  return path;

}


  /* =====================================================
     CONNECT TWO TERMINALS

     Creates railway-drawing style
     U / rectangular conductor connection.
  ===================================================== */

  function connectTerminals(
    sheet,
    terminalA,
    terminalB,
    options = {}
  ) {

    const {

      offset =
        42,

      direction =
        "up",

      id =
        ""

    } = options;


    const connectionY =

      direction ===
      "down"

        ? Math.max(
            terminalA.y,
            terminalB.y
          ) + offset

        : Math.min(
            terminalA.y,
            terminalB.y
          ) - offset;


    return drawConductor(
      sheet,
      {

        id,

       points: [

  {
    x:
      terminalA.topPort.x,

    y:
      terminalA.topPort.y
  },

  {
    x:
      terminalA.topPort.x,

    y:
      connectionY
  },

  {
    x:
      terminalB.topPort.x,

    y:
      connectionY
  },

  {
    x:
      terminalB.topPort.x,

    y:
      terminalB.topPort.y
  }

]

      }
    );

  }


  /* =====================================================
     FUSE SYMBOL
  ===================================================== */

  function drawFuse(
    sheet,
    options = {}
  ) {

    const {

      x = 200,

      y = 150,

      width = 42,

      height = 16,

      id = "",

      label = "",

      rating = ""

    } = options;


    const group =
      svgElement(
        "g",
        {

          "data-object-type":
            "fuse",

          "data-object-id":
            id

        }
      );


    const leftLead =
      svgElement(
        "line",
        {

          x1:
            x - 18,

          y1:
            y,

          x2:
            x,

          y2:
            y,

          stroke:
            "#111111",

          "stroke-width":
            1.5

        }
      );


    const body =
      svgElement(
        "path",
        {

          d:
            [
              `M ${x} ${y}`,
              `Q ${x + width * 0.25} ${y - height}`,
              `${x + width * 0.5} ${y}`,
              `Q ${x + width * 0.75} ${y + height}`,
              `${x + width} ${y}`
            ]
              .join(" "),

          fill:
            "none",

          stroke:
            "#111111",

          "stroke-width":
            1.5

        }
      );


    const rightLead =
      svgElement(
        "line",
        {

          x1:
            x + width,

          y1:
            y,

          x2:
            x + width + 18,

          y2:
            y,

          stroke:
            "#111111",

          "stroke-width":
            1.5

        }
      );


    group.appendChild(
      leftLead
    );

    group.appendChild(
      body
    );

    group.appendChild(
      rightLead
    );


    if (
      label
    ) {

      const labelText =
        svgElement(
          "text",
          {

            x:
              x +
              (
                width / 2
              ),

            y:
              y - 22,

            "text-anchor":
              "middle",

            "font-family":
              "Arial, sans-serif",

            "font-size":
              12,

            "font-weight":
              "600",

            fill:
              "#111111"

          }
        );


      labelText.textContent =
        label;


      group.appendChild(
        labelText
      );

    }


    if (
      rating
    ) {

      const ratingText =
        svgElement(
          "text",
          {

            x:
              x +
              (
                width / 2
              ),

            y:
              y + 30,

            "text-anchor":
              "middle",

            "font-family":
              "Arial, sans-serif",

            "font-size":
              10,

            fill:
              "#333333"

          }
        );


      ratingText.textContent =
        rating;


      group.appendChild(
        ratingText
      );

    }


    sheet.layers
      .symbols
      .appendChild(
        group
      );


    return {

      group,

      input: {

        x:
          x - 18,

        y:
          y

      },

      output: {

        x:
          x +
          width +
          18,

        y:
          y

      }

    };

  }

  /* =====================================================
   CTR CURVED LINK

   Used for CTR terminals having:
   - S-shaped internal link
   - optional top bridge
   - optional bottom bridge

   Example:
   AA / BB linked terminals
===================================================== */

function drawCtrLink(
  sheet,
  terminalA,
  terminalB = null,
  options = {}
) {

  const {
    id = "",
    connectTop = false,
    connectBottom = false,
    curveAmount = 8
  } = options;


  function drawCurvedTerminal(
    terminal,
    suffix
  ) {

    if (
      !terminal ||
      !terminal.topPort ||
      !terminal.bottomPort
    ) {

      return;

    }


    const top =
      terminal.topPort;


    const bottom =
      terminal.bottomPort;


    const middleY =
      (
        top.y +
        bottom.y
      ) / 2;


    /*
      Hide original straight terminal line.
      Circles remain visible.
    */

    const mask =
      svgElement(
        "line",
        {
          x1:
            top.x,

          y1:
            top.y + 4,

          x2:
            bottom.x,

          y2:
            bottom.y - 4,

          stroke:
            "#ffffff",

          "stroke-width":
            4
        }
      );


    /*
      S-shaped CTR link.
    */

    const curve =
      svgElement(
        "path",
        {
          d:
            [
              `M ${top.x} ${top.y + 3}`,

              `C ${top.x - curveAmount} ${top.y + 8}`,
              `${top.x - curveAmount} ${middleY - 5}`,
              `${top.x} ${middleY}`,

              `C ${top.x + curveAmount} ${middleY + 5}`,
              `${top.x + curveAmount} ${bottom.y - 8}`,
              `${bottom.x} ${bottom.y - 3}`
            ]
              .join(" "),

          fill:
            "none",

          stroke:
            "#111111",

          "stroke-width":
            1.5,

          "stroke-linecap":
            "round",

          "data-object-type":
            "ctr-link",

          "data-object-id":
            `${id}-${suffix}`
        }
      );


    sheet.layers
      .symbols
      .appendChild(
        mask
      );


    sheet.layers
      .symbols
      .appendChild(
        curve
      );

  }


  /*
    First linked terminal.
  */

  drawCurvedTerminal(
    terminalA,
    "A"
  );


  /*
    Optional second linked terminal.
  */

  if (
    terminalB
  ) {

    drawCurvedTerminal(
      terminalB,
      "B"
    );


    /*
      Top horizontal bridge.
    */

    if (
      connectTop
    ) {

      const topBridge =
        svgElement(
          "line",
          {
            x1:
              terminalA.topPort.x,

            y1:
              terminalA.topPort.y,

            x2:
              terminalB.topPort.x,

            y2:
              terminalB.topPort.y,

            stroke:
              "#111111",

            "stroke-width":
              1.4
          }
        );


      sheet.layers
        .symbols
        .appendChild(
          topBridge
        );

    }


    /*
      Bottom horizontal bridge.
    */

    if (
      connectBottom
    ) {

      const bottomBridge =
        svgElement(
          "line",
          {
            x1:
              terminalA.bottomPort.x,

            y1:
              terminalA.bottomPort.y,

            x2:
              terminalB.bottomPort.x,

            y2:
              terminalB.bottomPort.y,

            stroke:
              "#111111",

            "stroke-width":
              1.4
          }
        );


      sheet.layers
        .symbols
        .appendChild(
          bottomBridge
        );

    }

  }

}

  /* =====================================================
     TEXT LABEL
  ===================================================== */

  function drawLabel(
  sheet,
  options = {}
) {

  const {

    x = 0,
    y = 0,
    text = "",
    size = 12,
    weight = 400,
    anchor = "middle",
    rotate = 0,
    id = "",
    lineHeight = null

  } = options;


  const label =
    svgElement(
      "text",
      {

        x:
          x,

        y:
          y,

        "text-anchor":
          anchor,

        "font-family":
          "Arial, sans-serif",

        "font-size":
          size,

        "font-weight":
          weight,

        fill:
          "#111111",

        "data-object-type":
          "label",

        "data-object-id":
          id

      }
    );


  if (
    rotate
  ) {

    label.setAttribute(
      "transform",
      `rotate(${rotate} ${x} ${y})`
    );

  }


  const lines =
    String(text)
      .split("\n");


  const actualLineHeight =
    Number.isFinite(
      Number(
        lineHeight
      )
    )
      ? Number(
          lineHeight
        )
      : size + 3;


  if (
    lines.length === 1
  ) {

    label.textContent =
      lines[0];

  }

  else {

    lines.forEach(
      function (
        line,
        index
      ) {

        const tspan =
          svgElement(
            "tspan",
            {

              x:
                x,

              dy:
                index === 0
                  ? 0
                  : actualLineHeight

            }
          );


        tspan.textContent =
          line;


        label.appendChild(
          tspan
        );

      }
    );

  }


  sheet.layers
    .text
    .appendChild(
      label
    );


  return label;

}


  /* =====================================================
     TERMINAL GROUP / BRACKET
  ===================================================== */

  function drawTerminalGroup(
    sheet,
    options = {}
  ) {

    const {

      x1,

      x2,

      y,

      height = 35,

      label = "",

      id = ""

    } = options;


    const path =
      svgElement(
        "path",
        {

          d:
            [
              `M ${x1} ${y}`,
              `L ${x1} ${y - height}`,
              `L ${x2} ${y - height}`,
              `L ${x2} ${y}`
            ]
              .join(" "),

          fill:
            "none",

          stroke:
            "#111111",

          "stroke-width":
            1.2,

          "data-object-type":
            "terminal-group",

          "data-object-id":
            id

        }
      );


    sheet.layers
      .conductors
      .appendChild(
        path
      );


    if (
      label
    ) {

      drawLabel(
        sheet,
        {

          x:
            (
              x1 + x2
            ) / 2,

          y:
            y -
            height -
            8,

          text:
            label,

          size:
            11,

          weight:
            600

        }
      );

    }


    return path;

  }


  /* =====================================================
     CONTINUATION MARKER
  ===================================================== */

  function drawContinuation(
    sheet,
    options = {}
  ) {

    const {

      x,

      y,

      text = "",

      direction =
        "right"

    } = options;


    const group =
      svgElement(
        "g"
      );


    const circle =
      svgElement(
        "circle",
        {

          cx:
            x,

          cy:
            y,

          r:
            10,

          fill:
            "#ffffff",

          stroke:
            "#111111",

          "stroke-width":
            1.2

        }
      );


    group.appendChild(
      circle
    );


    const markerText =
      svgElement(
        "text",
        {

          x:
            x,

          y:
            y + 4,

          "text-anchor":
            "middle",

          "font-family":
            "Arial, sans-serif",

          "font-size":
            9,

          fill:
            "#111111"

        }
      );


    markerText.textContent =
      text;


    group.appendChild(
      markerText
    );


    if (
      direction
    ) {

      const lineLength =
        25;


      const directionLine =
        svgElement(
          "line",
          {

            x1:
              x +
              (
                direction ===
                "right"
                  ? 10
                  : -10
              ),

            y1:
              y,

            x2:
              x +
              (
                direction ===
                "right"
                  ? lineLength
                  : -lineLength
              ),

            y2:
              y,

            stroke:
              "#111111",

            "stroke-width":
              1.2

          }
        );


      group.appendChild(
        directionLine
      );

    }


    sheet.layers
      .symbols
      .appendChild(
        group
      );


    return group;

  }


  /* =====================================================
     CLEAR SHEET CONTENT
     Border remains.
  ===================================================== */

  function clearDrawing(
    sheet
  ) {

    [

      sheet.layers
        .conductors,

      sheet.layers
        .terminals,

      sheet.layers
        .symbols,

      sheet.layers
        .text

    ]
      .forEach(
        function (layer) {

          layer.innerHTML =
            "";

        }
      );

  }


  /* =====================================================
     PUBLIC API
  ===================================================== */

  window.CTR_DRAWING_ENGINE = {

    version:
      ENGINE_VERSION,

    createSheet,

    drawTerminal,

    drawTerminalStrip,

    drawConductor,

    connectTerminals,

    drawFuse,

    drawCtrLink,

    drawLabel,

    drawTerminalGroup,

    drawContinuation,

    clearDrawing

  };


  /* =====================================================
     READY EVENT
  ===================================================== */

  window.dispatchEvent(

    new CustomEvent(
      "ctr-drawing-engine-ready",
      {

        detail: {

          version:
            ENGINE_VERSION

        }

      }
    )

  );


})();