/* =========================================================
   CTR MANAGEMENT SYSTEM
   PROTOTYPE DRAWING DATA

   REFERENCE:
   BELKHEDA STATION - CTR SHEET 1A

   IMPORTANT
   ---------------------------------------------------------
   This file is TEMPORARY SAMPLE DATA only.

   Future production data will come from Supabase.
   No BELD-specific logic belongs in drawing engine
   or sheet renderer.
========================================================= */

(function () {

  "use strict";


  /* =====================================================
     BASIC GEOMETRY
  ===================================================== */

  const START_X =
    285;

  const PITCH =
    36;


  function terminalX(
    terminalNumber
  ) {

    return (
      START_X +
      (
        (
          terminalNumber - 1
        ) *
        PITCH
      )
    );

  }


  function midpoint(
    first,
    last
  ) {

    return (
      terminalX(first) +
      terminalX(last)
    ) / 2;

  }


  /* =====================================================
     HELPERS
  ===================================================== */

  function pairConnection(
    row,
    first,
    options = {}
  ) {

    return {

      type:
        "terminal-to-terminal",

      from:
        `${row}-${first}`,

      to:
        `${row}-${first + 1}`,

      offset:
        options.offset || 34,

      direction:
        options.direction || "up"

    };

  }


  function pairLabel(
    first,
    second,
    y,
    text,
    options = {}
  ) {

    return {

      x:
        midpoint(
          first,
          second
        ),

      y:
        y,

      text:
        text,

      size:
        options.size || 11,

      weight:
        options.weight || 600

    };

  }


  function centeredLabel(
    first,
    last,
    y,
    text,
    options = {}
  ) {

    return {

      x:
        midpoint(
          first,
          last
        ),

      y:
        y,

      text:
        text,

      size:
        options.size || 11,

      weight:
        options.weight || 600

    };

  }


  function bottomBus(
    row,
    first,
    last,
    rowY,
    busY,
    text
  ) {

    return {

      connection: {

        type:
          "path",

        from: {
          terminal:
            `${row}-${first}`,

          port:
            "bottom"
        },

        via: [

          {
            x:
              terminalX(first),

            y:
              busY
          },

          {
            x:
              terminalX(last),

            y:
              busY
          }

        ],

        to: {
          terminal:
            `${row}-${last}`,

          port:
            "bottom"
        }

      },

      label: {

        x:
          midpoint(
            first,
            last
          ),

        y:
          busY + 18,

        text:
          text,

        size:
          10,

        weight:
          500

      }

    };

  }


  /* =====================================================
     ROW POSITIONS
  ===================================================== */

  const ROW_Y = {

    AA:
      220,

    BB:
      365,

    A:
      520,

    B:
      665,

    C:
      815,

    D:
      965

  };


  /* =====================================================
     TERMINAL ROWS
  ===================================================== */

  const terminalRows = [

    {
      id:
        "AA",

      name:
        "AA",

      x:
        START_X,

      y:
        ROW_Y.AA,

      count:
        32,

      startNumber:
        1,

      pitch:
        PITCH
    },


    {
      id:
        "BB",

      name:
        "BB",

      x:
        START_X,

      y:
        ROW_Y.BB,

      count:
        32,

      startNumber:
        1,

      pitch:
        PITCH
    },


    {
      id:
        "A",

      name:
        "A",

      x:
        START_X,

      y:
        ROW_Y.A,

      count:
        32,

      startNumber:
        1,

      pitch:
        PITCH
    },


    {
      id:
        "B",

      name:
        "B",

      x:
        START_X,

      y:
        ROW_Y.B,

      count:
        32,

      startNumber:
        1,

      pitch:
        PITCH
    },


    {
      id:
        "C",

      name:
        "C",

      x:
        START_X,

      y:
        ROW_Y.C,

      count:
        32,

      startNumber:
        1,

      pitch:
        PITCH
    },


    {
      id:
        "D",

      name:
        "D",

      x:
        START_X,

      y:
        ROW_Y.D,

      count:
        32,

      startNumber:
        1,

      pitch:
        PITCH
    }

  ];


  /* =====================================================
     CONNECTIONS
  ===================================================== */

  const connections = [];


  /* =====================================================
   CTR CURVED LINKS
===================================================== */

const links = [];


/* -----------------------------------------------------
   AA
----------------------------------------------------- */

[
  1,
  3,
  5,
  7
]
  .forEach(
    function (first) {

      links.push(
        {

          id:
            `AA-LINK-${first}`,

          terminalA:
            `AA-${first}`,

          terminalB:
            `AA-${first + 1}`,

          connectTop:
            true,

          connectBottom:
            true,

          curveAmount:
            7

        }
      );

    }
  );


/* -----------------------------------------------------
   BB
----------------------------------------------------- */

[
  1,
  3,
  5,
  7
]
  .forEach(
    function (first) {

      links.push(
        {

          id:
            `BB-LINK-${first}`,

          terminalA:
            `BB-${first}`,

          terminalB:
            `BB-${first + 1}`,

          connectTop:
            true,

          connectBottom:
            true,

          curveAmount:
            7

        }
      );

    }
  );


  /* -----------------------------------------------------
     A - pair connections
  ----------------------------------------------------- */

  for (
    let terminal = 1;
    terminal <= 31;
    terminal += 2
  ) {

    connections.push(
      pairConnection(
        "A",
        terminal,
        {
          offset:
            28
        }
      )
    );

  }


  /* -----------------------------------------------------
     B
  ----------------------------------------------------- */

  for (
    let terminal = 1;
    terminal <= 31;
    terminal += 2
  ) {

    connections.push(
      pairConnection(
        "B",
        terminal,
        {
          offset:
            28
        }
      )
    );

  }


  /* -----------------------------------------------------
     C
  ----------------------------------------------------- */

  for (
    let terminal = 1;
    terminal <= 31;
    terminal += 2
  ) {

    connections.push(
      pairConnection(
        "C",
        terminal,
        {
          offset:
            28
        }
      )
    );

  }


  /* -----------------------------------------------------
     D
  ----------------------------------------------------- */

  for (
    let terminal = 1;
    terminal <= 31;
    terminal += 2
  ) {

    connections.push(
      pairConnection(
        "D",
        terminal,
        {
          offset:
            28
        }
      )
    );

  }


  /* =====================================================
     LOWER GROUP CONNECTIONS / CABLE REFERENCES
  ===================================================== */

  const bottomItems = [

    bottomBus(
      "A",
      1,
      24,
      ROW_Y.A,
      ROW_Y.A + 45,
      "1X24C TO LOC-7 FOR DD & S-2"
    ),

    bottomBus(
      "A",
      25,
      32,
      ROW_Y.A,
      ROW_Y.A + 45,
      "1X6C TO LOC-5"
    ),


    bottomBus(
      "B",
      1,
      24,
      ROW_Y.B,
      ROW_Y.B + 45,
      "1X24C TO LOC-7 FOR S-29 / S-35 / S-36 / SH-13"
    ),


    bottomBus(
      "C",
      1,
      12,
      ROW_Y.C,
      ROW_Y.C + 42,
      "1X12C TO LOC-7 FOR PT-101"
    ),

    bottomBus(
      "C",
      13,
      24,
      ROW_Y.C,
      ROW_Y.C + 42,
      "1X12C TO LOC-8 FOR PT-102"
    ),

    bottomBus(
      "C",
      25,
      32,
      ROW_Y.C,
      ROW_Y.C + 42,
      "1X9C TO LOC-6A"
    ),


    bottomBus(
      "D",
      1,
      12,
      ROW_Y.D,
      ROW_Y.D + 42,
      "1X12C TO LOC-7 FOR DN TPR"
    ),

    bottomBus(
      "D",
      13,
      18,
      ROW_Y.D,
      ROW_Y.D + 42,
      "6C TO LOC-7 UP TPR"
    ),

    bottomBus(
      "D",
      19,
      30,
      ROW_Y.D,
      ROW_Y.D + 42,
      "1X12C TO LOC-7 (SP)"
    )

  ];


  bottomItems.forEach(
    function (item) {

      connections.push(
        item.connection
      );

  });


  /* =====================================================
     ENGINEERING LABELS
  ===================================================== */

  const labels = [

    /* ---------------------------------------------------
       AA
    --------------------------------------------------- */

    pairLabel(
  1,
  2,
  ROW_Y.AA - 82,
  "12C FROM\nN/RR\nBX110V T/CKT",
  {
    size: 8,
    weight: 600
  }
),

pairLabel(
  3,
  4,
  ROW_Y.AA - 82,
  "12C FROM\nN/RR\nB24V TPR",
  {
    size: 8,
    weight: 600
  }
),

pairLabel(
  5,
  6,
  ROW_Y.AA - 82,
  "12C FROM\nN/RR\nB24V A/C",
  {
    size: 8,
    weight: 600
  }
),

pairLabel(
  7,
  8,
  ROW_Y.AA - 82,
  "12C FROM\nN/RR\nB24V BPAC(SB)",
  {
    size: 8,
    weight: 600
  }
),


    /* ---------------------------------------------------
       BB
    --------------------------------------------------- */

    pairLabel(
  1,
  2,
  ROW_Y.BB - 82,
  "12C FROM\nN/RR\nNX110V T/CKT",
  {
    size: 8,
    weight: 600
  }
),

pairLabel(
  3,
  4,
  ROW_Y.BB - 82,
  "12C FROM\nN/RR\nN24V TPR",
  {
    size: 8,
    weight: 600
  }
),

pairLabel(
  5,
  6,
  ROW_Y.BB - 82,
  "12C FROM\nN/RR\nN24V A/C",
  {
    size: 8,
    weight: 600
  }
),

pairLabel(
  7,
  8,
  ROW_Y.BB - 82,
  "12C FROM\nN/RR\nN24V BPAC(SB)",
  {
    size: 8,
    weight: 600
  }
),


    /* ---------------------------------------------------
       ROW A
    --------------------------------------------------- */

    pairLabel(1, 2, ROW_Y.A - 42, "DD HG"),
    pairLabel(3, 4, ROW_Y.A - 42, "DD DG"),
    pairLabel(5, 6, ROW_Y.A - 42, "DD HHG"),
    pairLabel(7, 8, ROW_Y.A - 42, "SP"),
    pairLabel(9, 10, ROW_Y.A - 42, "SP"),
    pairLabel(11, 12, ROW_Y.A - 42, "SP"),
    pairLabel(13, 14, ROW_Y.A - 42, "S-2 RG"),
    pairLabel(15, 16, ROW_Y.A - 42, "S-2 HG"),
    pairLabel(17, 18, ROW_Y.A - 42, "S-2 DG"),
    pairLabel(19, 20, ROW_Y.A - 42, "SP"),
    pairLabel(21, 22, ROW_Y.A - 42, "SP"),
    pairLabel(23, 24, ROW_Y.A - 42, "S-36 HPR"),
    pairLabel(25, 26, ROW_Y.A - 42, "CO-2 HG"),
    pairLabel(27, 28, ROW_Y.A - 42, "S-2 UG"),
    pairLabel(29, 30, ROW_Y.A - 42, "SP"),
    pairLabel(31, 32, ROW_Y.A - 42, "SP"),


    /* ---------------------------------------------------
       ROW B
    --------------------------------------------------- */

    pairLabel(1, 2, ROW_Y.B - 42, "S-29 RG"),
    pairLabel(3, 4, ROW_Y.B - 42, "S-29 DG"),
    pairLabel(5, 6, ROW_Y.B - 42, "SP"),

    centeredLabel(
      7,
      10,
      ROW_Y.B - 60,
      "SH-13",
      {
        size:
          11,
        weight:
          700
      }
    ),

    {
      x: terminalX(7),
      y: ROW_Y.B - 30,
      text: "ON",
      size: 9,
      weight: 600
    },

    {
      x: terminalX(8),
      y: ROW_Y.B - 30,
      text: "OFF",
      size: 9,
      weight: 600
    },

    {
      x: terminalX(9),
      y: ROW_Y.B - 30,
      text: "PV",
      size: 9,
      weight: 600
    },

    {
      x: terminalX(10),
      y: ROW_Y.B - 30,
      text: "NX",
      size: 9,
      weight: 600
    },

    pairLabel(11, 12, ROW_Y.B - 42, "S-35 RG"),
    pairLabel(13, 14, ROW_Y.B - 42, "S-35 HG"),
    pairLabel(15, 16, ROW_Y.B - 42, "S-35 DG"),
    pairLabel(17, 18, ROW_Y.B - 42, "SP"),
    pairLabel(19, 20, ROW_Y.B - 42, "S-36 RG"),
    pairLabel(21, 22, ROW_Y.B - 42, "S-36 HG"),
    pairLabel(23, 24, ROW_Y.B - 42, "S-35 HPR"),
    pairLabel(25, 26, ROW_Y.B - 42, "SP"),
    pairLabel(27, 28, ROW_Y.B - 42, "SP"),
    pairLabel(29, 30, ROW_Y.B - 42, "SP"),
    pairLabel(31, 32, ROW_Y.B - 42, "SP"),


    /* ---------------------------------------------------
       ROW C
    --------------------------------------------------- */

    centeredLabel(
      1,
      12,
      ROW_Y.C - 65,
      "PT-101 FROM N/RR",
      {
        size:
          11,
        weight:
          700
      }
    ),

    pairLabel(1, 2, ROW_Y.C - 34, "NW"),
    pairLabel(3, 4, ROW_Y.C - 34, "RW"),
    pairLabel(5, 6, ROW_Y.C - 34, "N60V"),
    pairLabel(7, 8, ROW_Y.C - 34, "N110V"),
    pairLabel(9, 10, ROW_Y.C - 34, "SP"),
    pairLabel(11, 12, ROW_Y.C - 34, "SP"),

    centeredLabel(
      13,
      24,
      ROW_Y.C - 65,
      "PT-102 FROM N/RR",
      {
        size:
          11,
        weight:
          700
      }
    ),

    pairLabel(13, 14, ROW_Y.C - 34, "NW"),
    pairLabel(15, 16, ROW_Y.C - 34, "RW"),
    pairLabel(17, 18, ROW_Y.C - 34, "N60V"),
    pairLabel(19, 20, ROW_Y.C - 34, "N110V"),
    pairLabel(21, 22, ROW_Y.C - 34, "SP"),
    pairLabel(23, 24, ROW_Y.C - 34, "SP"),

    pairLabel(25, 26, ROW_Y.C - 42, "206 TPR"),
    pairLabel(27, 28, ROW_Y.C - 42, "LV 207 AXT"),
    pairLabel(29, 30, ROW_Y.C - 42, "RSTR 207 AXT"),
    pairLabel(31, 32, ROW_Y.C - 42, "TPR 207 AXT"),


    /* ---------------------------------------------------
       ROW D
    --------------------------------------------------- */

    pairLabel(1, 2, ROW_Y.D - 42, "201 TPR"),
    pairLabel(3, 4, ROW_Y.D - 42, "202 TPR"),
    pairLabel(5, 6, ROW_Y.D - 42, "213 TPR"),
    pairLabel(7, 8, ROW_Y.D - 42, "205 TPR"),
    pairLabel(9, 10, ROW_Y.D - 42, "211 TPR"),
    pairLabel(11, 12, ROW_Y.D - 42, "213 TPR"),
    pairLabel(13, 14, ROW_Y.D - 42, "230 TPR"),
    pairLabel(15, 16, ROW_Y.D - 42, "226 TPR"),
    pairLabel(17, 18, ROW_Y.D - 42, "227 TPR"),
    pairLabel(19, 20, ROW_Y.D - 42, "SP"),
    pairLabel(21, 22, ROW_Y.D - 42, "SP"),
    pairLabel(23, 24, ROW_Y.D - 42, "SP"),
    pairLabel(25, 26, ROW_Y.D - 42, "SP"),
    pairLabel(27, 28, ROW_Y.D - 42, "SP"),
    pairLabel(29, 30, ROW_Y.D - 42, "SP"),
    pairLabel(31, 32, ROW_Y.D - 42, "SP")

  ];


  /*
    Add cable/group labels generated above.
  */

  bottomItems.forEach(
    function (item) {

      labels.push(
        item.label
      );

    }
  );


  /* =====================================================
     PROTOTYPE DATA
  ===================================================== */

  const prototypeData = {

    schemaVersion:
      1,


    sheet: {

      stationName:
        "Belkheda Station",

      stationCode:
        "BELD",

      sheetNumber:
        "1A",

      documentType:
        "Completion CTR"

    },


    canvas: {

      width:
        1600,

      height:
        1120,

      margin:
        38,

      terminalRadius:
        3.2,

      terminalPitch:
        PITCH

    },


    terminalRows:
      terminalRows,


    /*
      Fuse objects will be added separately once
      vertical fuse-symbol geometry is finalized.
    */

    fuses:
      [],

    links:
        links,

    connections:
      connections,


    groups:
      [],


    labels:
      labels,


    continuations:
      []

  };


  /* =====================================================
     RENDER
  ===================================================== */

  function renderPrototype() {

    if (
      !window.CTR_SHEET_RENDERER
    ) {

      console.error(
        "CTR Sheet Renderer is unavailable."
      );

      return;

    }


    const host =
      document.getElementById(
        "drawingHost"
      );


    if (!host) {

      console.error(
        "Drawing host was not found."
      );

      return;

    }


    try {

      const result =
        window.CTR_SHEET_RENDERER
          .renderToHost(
            host,
            prototypeData
          );


      /*
        Expose prototype only for development inspection.
      */

      window.CTR_PROTOTYPE = {

        data:
          prototypeData,

        result:
          result

      };


      console.log(
        "CTR Sheet 1A prototype rendered."
      );

    }

    catch (error) {

      console.error(
        "CTR prototype render error:",
        error
      );

    }

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      renderPrototype
    );

  }

  else {

    renderPrototype();

  }

})();