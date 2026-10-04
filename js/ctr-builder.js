/* =========================================================
   CTR MANAGEMENT SYSTEM
   SVG CTR STRUCTURE BUILDER

   VERSION 1.0

   ARCHITECTURE
   ---------------------------------------------------------
   STATION
     └── K1 / K2 / K3 / ...
           ├── Fuse / Fuse Links
           ├── Rows
           ├── Columns / Conductors
           └── Connections

   CONNECTED END
     └── Location Box
           ├── Fuse / Fuse Links
           └── Direct Rows A / B / C / D / ...

   IMPORTANT
   ---------------------------------------------------------
   - Location Boxes DO NOT contain K1/K2/K3.
   - Every station may have a different structure.
   - BELD is only prototype/reference data.
   - Engineering SVG appearance remains separate from
     editing controls.
========================================================= */

(function () {

  "use strict";


  const BUILDER_VERSION =
    "1.0.0";


  /* =====================================================
     STATE
  ===================================================== */

  let activeContext =
    null;


  let selectedFuseId =
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


  function getData() {

    return (
      getPrototype()
        ?.data ||
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


  function nextAlphabetLabel(
    index
  ) {

    let number =
      index + 1;


    let label =
      "";


    while (
      number >
      0
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


  /* =====================================================
     SHEET DATA
  ===================================================== */

  function createEmptySheetData(
    locationMode = false
  ) {

    const rows =
      [];


    if (
      locationMode
    ) {

      [
        "A",
        "B",
        "C",
        "D"
      ]
        .forEach(
          function (
            label,
            index
          ) {

            rows.push(
              createSvgRow(
                label,
                12,
                index,
                rows
              )
            );

          }
        );

    }

    else {

      rows.push(
        createSvgRow(
          "A",
          12,
          0,
          rows
        )
      );

    }


    return {

      terminalRows:
        rows,

      fuses:
        [],

      links:
        [],

      connections:
        [],

      groups:
        [],

      labels:
        [],

      continuations:
        [],

      terminalDetails:
        {},

      fuseRecords:
        []

    };

  }


  function adoptCurrentSheetData() {

    const data =
      getData();


    if (!data) {

      return createEmptySheetData(
        false
      );

    }


    return {

      terminalRows:
        Array.isArray(
          data.terminalRows
        )
          ? data.terminalRows
          : [],

      fuses:
        Array.isArray(
          data.fuses
        )
          ? data.fuses
          : [],

      links:
        Array.isArray(
          data.links
        )
          ? data.links
          : [],

      connections:
        Array.isArray(
          data.connections
        )
          ? data.connections
          : [],

      groups:
        Array.isArray(
          data.groups
        )
          ? data.groups
          : [],

      labels:
        Array.isArray(
          data.labels
        )
          ? data.labels
          : [],

      continuations:
        Array.isArray(
          data.continuations
        )
          ? data.continuations
          : [],

      terminalDetails:

        data.terminalDetails &&
        typeof data.terminalDetails ===
        "object"

          ? data.terminalDetails

          : {},

      fuseRecords:
        []

    };

  }


  /* =====================================================
     SVG ROW FACTORY
  ===================================================== */

  function createSvgRow(
    label,
    count = 12,
    rowIndex = 0,
    existingRows = []
  ) {

    const reference =
      existingRows[
        0
      ] ||
      null;


    const startX =
      Number(
        reference?.startX
      ) ||
      285;


    const pitch =
      Number(
        reference?.pitch
      ) ||
      36;


    let y;


    if (
      existingRows.length
    ) {

      const maximumY =
        Math.max(
          ...existingRows.map(
            function (
              row
            ) {

              return (
                Number(
                  row.y
                ) ||
                0
              );

            }
          )
        );


      y =
        maximumY +
        145;

    }

    else {

      y =
        220 +
        (
          rowIndex *
          145
        );

    }


    return {

      id:
        String(
          label
        ),

      name:
        String(
          label
        ),

      y:
        y,

      startX:
        startX,

      pitch:
        pitch,

      count:
        Math.max(
          1,
          Number(
            count
          ) ||
          12
        ),

      startNumber:
        1,

      labels:
        []

    };

  }


  /* =====================================================
     BUILDER ROOT DATA
  ===================================================== */

  function ensureBuilderState() {

    const data =
      getData();


    if (!data) {

      return null;

    }


    if (
      !data.builderState ||
      typeof data.builderState !==
      "object"
    ) {

      data.builderState = {

        stationCtrRacks:
          [],

        connectedEnds:
          []

      };

    }


    const state =
      data.builderState;


    if (
      !Array.isArray(
        state.stationCtrRacks
      )
    ) {

      state.stationCtrRacks =
        [];

    }


    if (
      !Array.isArray(
        state.connectedEnds
      )
    ) {

      state.connectedEnds =
        [];

    }


    /*
       First prototype drawing becomes K1.

       BELD is only the currently loaded sample.
       Other stations can have completely different
       rack structures.
    */

    if (
      state.stationCtrRacks.length ===
      0
    ) {

      state.stationCtrRacks.push(
        {

          id:
            createId(
              "RACK"
            ),

          number:
            1,

          name:
            "K1",

          sheetData:
            adoptCurrentSheetData()

        }
      );

    }


    return state;

  }


  /* =====================================================
     ACTIVE CONTEXT
  ===================================================== */

  function getActiveSheetData() {

    return (
      activeContext
        ?.sheetData ||
      null
    );

  }


  function loadContext(
    context
  ) {

    if (
      !context ||
      !context.sheetData
    ) {

      return;

    }


    activeContext =
      context;


    const data =
      getData();


    const sheet =
      context.sheetData;


    data.terminalRows =
      sheet.terminalRows;


    data.fuses =
      sheet.fuses;


    data.links =
      sheet.links;


    data.connections =
      sheet.connections;


    data.groups =
      sheet.groups;


    data.labels =
      sheet.labels;


    data.continuations =
      sheet.continuations;


    data.terminalDetails =
      sheet.terminalDetails;


    normalizeLongLabels();


    migrateExistingLinksToFuseRecords();


    rerenderDrawing();


    renderBuilderControls();

  }


  /* =====================================================
     RENDER DRAWING
  ===================================================== */

  function rerenderDrawing() {

    /*
       Prefer main editor rerender because it
       also refreshes terminal / conductor interaction.
    */

    if (
      window.CTR_EDITOR &&
      typeof window.CTR_EDITOR.rerender ===
      "function"
    ) {

      window.CTR_EDITOR
        .rerender();


      return;

    }


    const prototype =
      getPrototype();


    const host =
      getDrawingHost();


    if (
      !prototype ||
      !host ||
      !window.CTR_SHEET_RENDERER
    ) {

      return;

    }


    prototype.result =
      window
        .CTR_SHEET_RENDERER
        .renderToHost(
          host,
          prototype.data
        );

  }


  /* =====================================================
     CLEAN CONNECTIONS AFTER GRID CHANGE
  ===================================================== */

  function getValidTerminalIds() {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return new Set();

    }


    const valid =
      new Set();


    sheet.terminalRows
      .forEach(
        function (
          row
        ) {

          const start =
            Number(
              row.startNumber ||
              1
            );


          for (
            let index = 0;
            index <
            Number(
              row.count ||
              0
            );
            index += 1
          ) {

            valid.add(
              `${row.id}-${start + index}`
            );

          }

        }
      );


    return valid;

  }


  function cleanInvalidReferences() {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return;

    }


    const valid =
      getValidTerminalIds();


    sheet.connections =
      sheet.connections.filter(
        function (
          connection
        ) {

          const terminalA =
            connection
              ?.terminalA;


          const terminalB =
            connection
              ?.terminalB;


          const from =
            connection
              ?.from
              ?.terminal;


          const to =
            connection
              ?.to
              ?.terminal;


          if (
            terminalA &&
            !valid.has(
              terminalA
            )
          ) {

            return false;

          }


          if (
            terminalB &&
            !valid.has(
              terminalB
            )
          ) {

            return false;

          }


          if (
            from &&
            !valid.has(
              from
            )
          ) {

            return false;

          }


          if (
            to &&
            !valid.has(
              to
            )
          ) {

            return false;

          }


          return true;

        }
      );


    sheet.links =
      sheet.links.filter(
        function (
          link
        ) {

          if (
            link.terminalA &&
            !valid.has(
              link.terminalA
            )
          ) {

            return false;

          }


          if (
            link.terminalB &&
            !valid.has(
              link.terminalB
            )
          ) {

            return false;

          }


          return true;

        }
      );


    const store =
      sheet.terminalDetails;


    Object.keys(
      store
    )
      .forEach(
        function (
          key
        ) {

          if (
            !valid.has(
              key
            )
          ) {

            delete store[
              key
            ];

          }

        }
      );

  }


  /* =====================================================
     RACK HELPERS
  ===================================================== */

  function nextRackNumber() {

    const state =
      ensureBuilderState();


    let highest =
      0;


    state.stationCtrRacks
      .forEach(
        function (
          rack
        ) {

          highest =
            Math.max(
              highest,
              Number(
                rack.number
              ) ||
              0
            );

        }
      );


    return highest + 1;

  }


  function addRack() {

    const state =
      ensureBuilderState();


    const number =
      nextRackNumber();


    const rack = {

      id:
        createId(
          "RACK"
        ),

      number:
        number,

      name:
        `K${number}`,

      sheetData:
        createEmptySheetData(
          false
        )

    };


    state.stationCtrRacks
      .push(
        rack
      );


    loadContext(
      rack
    );

  }


  function removeActiveRack() {

    if (
      activeContext?.type ===
      "location"
    ) {

      window.alert(
        "Open a Station CTR rack first."
      );


      return;

    }


    const state =
      ensureBuilderState();


    if (
      state.stationCtrRacks.length <=
      1
    ) {

      window.alert(
        "At least one Station CTR rack must remain."
      );


      return;

    }


    const index =
      state.stationCtrRacks
        .indexOf(
          activeContext
        );


    if (
      index ===
      -1
    ) {

      return;

    }


    const confirmed =
      window.confirm(
        `Remove ${activeContext.name}?`
      );


    if (!confirmed) {

      return;

    }


    state.stationCtrRacks.splice(
      index,
      1
    );


    loadContext(
      state.stationCtrRacks[
        Math.max(
          0,
          index - 1
        )
      ]
    );

  }


  function renameActiveContext() {

    if (!activeContext) {

      return;

    }


    const value =
      window.prompt(
        "Enter name:",
        activeContext.name
      );


    if (
      value ===
      null
    ) {

      return;

    }


    const cleaned =
      String(
        value
      ).trim();


    if (!cleaned) {

      return;

    }


    activeContext.name =
      cleaned;


    renderBuilderControls();

  }


  /* =====================================================
     ROW / COLUMN
  ===================================================== */

  function getSelectedRow() {

    const selector =
      document.getElementById(
        "ctrBuilderRowSelect"
      );


    const sheet =
      getActiveSheetData();


    if (
      !selector ||
      !sheet
    ) {

      return null;

    }


    return (
      sheet.terminalRows.find(
        function (
          row
        ) {

          return (
            String(
              row.id
            ) ===
            String(
              selector.value
            )
          );

        }
      ) ||
      null
    );

  }


  function addRow() {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return;

    }


    const suggested =
      nextAlphabetLabel(
        sheet.terminalRows.length
      );


    const entered =
      window.prompt(
        "Row name / label:",
        suggested
      );


    if (
      entered ===
      null
    ) {

      return;

    }


    const label =
      String(
        entered
      )
        .trim()
        .toUpperCase();


    if (!label) {

      return;

    }


    if (
      sheet.terminalRows.some(
        function (
          row
        ) {

          return (
            String(
              row.id
            ).toUpperCase() ===
            label
          );

        }
      )
    ) {

      window.alert(
        `Row ${label} already exists.`
      );


      return;

    }


    const columns =
      Math.max(
        1,
        ...sheet.terminalRows.map(
          function (
            row
          ) {

            return (
              Number(
                row.count
              ) ||
              0
            );

          }
        )
      );


    sheet.terminalRows.push(
      createSvgRow(
        label,
        columns,
        sheet.terminalRows.length,
        sheet.terminalRows
      )
    );


    rerenderDrawing();

    renderBuilderControls();

  }


  function removeRow() {

    const sheet =
      getActiveSheetData();


    const row =
      getSelectedRow();


    if (
      !sheet ||
      !row
    ) {

      return;

    }


    if (
      sheet.terminalRows.length <=
      1
    ) {

      window.alert(
        "At least one row must remain."
      );


      return;

    }


    if (
      !window.confirm(
        `Remove Row ${row.id}?`
      )
    ) {

      return;

    }


    const index =
      sheet.terminalRows
        .indexOf(
          row
        );


    if (
      index !==
      -1
    ) {

      sheet.terminalRows.splice(
        index,
        1
      );

    }


    cleanInvalidReferences();

    rerenderDrawing();

    renderBuilderControls();

  }


  /* =====================================================
     ADD / REMOVE COLUMN
     Whole grid remains rectangular.
  ===================================================== */

  function addColumn() {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return;

    }


    sheet.terminalRows
      .forEach(
        function (
          row
        ) {

          row.count =
            Math.max(
              1,
              Number(
                row.count
              ) ||
              0
            ) +
            1;


          if (
            !Array.isArray(
              row.labels
            )
          ) {

            row.labels =
              [];

          }


          row.labels.push(
            ""
          );

        }
      );


    rerenderDrawing();

    renderBuilderControls();

  }


  function removeColumn() {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return;

    }


    const minimum =
      Math.min(
        ...sheet.terminalRows.map(
          function (
            row
          ) {

            return (
              Number(
                row.count
              ) ||
              0
            );

          }
        )
      );


    if (
      minimum <=
      1
    ) {

      window.alert(
        "At least one column must remain."
      );


      return;

    }


    if (
      !window.confirm(
        "Remove the last terminal column from every row?"
      )
    ) {

      return;

    }


    sheet.terminalRows
      .forEach(
        function (
          row
        ) {

          row.count =
            Math.max(
              1,
              Number(
                row.count
              ) -
              1
            );


          if (
            Array.isArray(
              row.labels
            )
          ) {

            row.labels.length =
              Math.min(
                row.labels.length,
                row.count
              );

          }

        }
      );


    cleanInvalidReferences();

    rerenderDrawing();

    renderBuilderControls();

  }


  /* =====================================================
     ADD / REMOVE CONDUCTOR
     Only selected row.
  ===================================================== */

  function addConductor() {

    const row =
      getSelectedRow();


    if (!row) {

      window.alert(
        "Select a row first."
      );


      return;

    }


    row.count =
      Math.max(
        1,
        Number(
          row.count
        ) ||
        0
      ) +
      1;


    if (
      !Array.isArray(
        row.labels
      )
    ) {

      row.labels =
        [];

    }


    row.labels.push(
      ""
    );


    rerenderDrawing();

    renderBuilderControls();

  }


  function removeConductor() {

    const row =
      getSelectedRow();


    if (!row) {

      window.alert(
        "Select a row first."
      );


      return;

    }


    if (
      Number(
        row.count
      ) <=
      1
    ) {

      window.alert(
        "At least one conductor must remain in the row."
      );


      return;

    }


    const number =
      Number(
        row.startNumber ||
        1
      ) +
      Number(
        row.count
      ) -
      1;


    if (
      !window.confirm(
        `Remove terminal / conductor ${row.id}-${number}?`
      )
    ) {

      return;

    }


    row.count =
      Number(
        row.count
      ) -
      1;


    if (
      Array.isArray(
        row.labels
      )
    ) {

      row.labels.length =
        Math.min(
          row.labels.length,
          row.count
        );

    }


    cleanInvalidReferences();

    rerenderDrawing();

    renderBuilderControls();

  }


  /* =====================================================
     CONNECTED ENDS
  ===================================================== */

  function nextEndNumber() {

    const state =
      ensureBuilderState();


    let highest =
      0;


    state.connectedEnds
      .forEach(
        function (
          end
        ) {

          highest =
            Math.max(
              highest,
              Number(
                end.number
              ) ||
              0
            );

        }
      );


    return highest + 1;

  }


  function addConnectedEnd() {

    const state =
      ensureBuilderState();


    const number =
      nextEndNumber();


    const name =
      window.prompt(
        "Connected End name:",
        `End ${number}`
      );


    if (
      name ===
      null
    ) {

      return;

    }


    state.connectedEnds.push(
      {

        id:
          createId(
            "END"
          ),

        number:
          number,

        name:
          String(
            name
          ).trim() ||
          `End ${number}`,

        locations:
          []

      }
    );


    renderBuilderControls();

  }


  function getSelectedEnd() {

    const state =
      ensureBuilderState();


    const select =
      document.getElementById(
        "ctrBuilderEndSelect"
      );


    if (
      !select
    ) {

      return null;

    }


    return (
      state.connectedEnds.find(
        function (
          end
        ) {

          return (
            end.id ===
            select.value
          );

        }
      ) ||
      null
    );

  }


  function removeConnectedEnd() {

    const state =
      ensureBuilderState();


    const end =
      getSelectedEnd();


    if (!end) {

      return;

    }


    if (
      !window.confirm(
        `Remove ${end.name} and all its Location Boxes?`
      )
    ) {

      return;

    }


    const index =
      state.connectedEnds
        .indexOf(
          end
        );


    if (
      index !==
      -1
    ) {

      state.connectedEnds.splice(
        index,
        1
      );

    }


    /*
       If a location inside removed end was open,
       return to first station rack.
    */

    if (
      activeContext?.type ===
      "location" &&
      activeContext.endId ===
      end.id
    ) {

      loadContext(
        state.stationCtrRacks[
          0
        ]
      );


      return;

    }


    renderBuilderControls();

  }


  /* =====================================================
     LOCATION BOX
  ===================================================== */

  function nextLocationNumber(
    end
  ) {

    let highest =
      0;


    end.locations
      .forEach(
        function (
          location
        ) {

          highest =
            Math.max(
              highest,
              Number(
                location.number
              ) ||
              0
            );

        }
      );


    return highest + 1;

  }


  function addLocation() {

    const end =
      getSelectedEnd();


    if (!end) {

      window.alert(
        "Add or select a Connected End first."
      );


      return;

    }


    const number =
      nextLocationNumber(
        end
      );


    const entered =
      window.prompt(
        "Location Box name:",
        `Location Box ${number}`
      );


    if (
      entered ===
      null
    ) {

      return;

    }


    end.locations.push(
      {

        id:
          createId(
            "LOCATION"
          ),

        number:
          number,

        name:
          String(
            entered
          ).trim() ||
          `Location Box ${number}`,

        type:
          "location",

        endId:
          end.id,

        sheetData:
          createEmptySheetData(
            true
          )

      }
    );


    renderBuilderControls();

  }


  function getSelectedLocation() {

    const end =
      getSelectedEnd();


    const select =
      document.getElementById(
        "ctrBuilderLocationSelect"
      );


    if (
      !end ||
      !select
    ) {

      return null;

    }


    return (
      end.locations.find(
        function (
          location
        ) {

          return (
            location.id ===
            select.value
          );

        }
      ) ||
      null
    );

  }


  function openSelectedLocation() {

    const location =
      getSelectedLocation();


    if (!location) {

      window.alert(
        "Select a Location Box."
      );


      return;

    }


    loadContext(
      location
    );

  }


  function removeLocation() {

    const end =
      getSelectedEnd();


    const location =
      getSelectedLocation();


    if (
      !end ||
      !location
    ) {

      return;

    }


    if (
      !window.confirm(
        `Remove ${location.name}?`
      )
    ) {

      return;

    }


    const index =
      end.locations
        .indexOf(
          location
        );


    if (
      index !==
      -1
    ) {

      end.locations.splice(
        index,
        1
      );

    }


    if (
      activeContext ===
      location
    ) {

      const state =
        ensureBuilderState();


      loadContext(
        state.stationCtrRacks[
          0
        ]
      );


      return;

    }


    renderBuilderControls();

  }


  /* =====================================================
     FUSE TEXT WRAPPING
     Resolves overlapping long particulars.
  ===================================================== */

  function wrapText(
    value,
    maxCharacters = 10
  ) {

    const text =
      String(
        value ||
        ""
      )
        .replace(
          /\s+/g,
          " "
        )
        .trim();


    if (!text) {

      return "";

    }


    if (
      text.includes(
        "\n"
      )
    ) {

      return text;

    }


    const words =
      text.split(
        " "
      );


    const lines =
      [];


    let current =
      "";


    words.forEach(
      function (
        word
      ) {

        if (
          !current
        ) {

          current =
            word;


          return;

        }


        if (
          (
            current.length +
            1 +
            word.length
          ) <=
          maxCharacters
        ) {

          current +=
            " " +
            word;

        }

        else {

          lines.push(
            current
          );


          current =
            word;

        }

      }
    );


    if (
      current
    ) {

      lines.push(
        current
      );

    }


    /*
       Very long single words also get
       broken into manageable pieces.
    */

    const finalLines =
      [];


    lines.forEach(
      function (
        line
      ) {

        if (
          line.length <=
          maxCharacters
        ) {

          finalLines.push(
            line
          );


          return;

        }


        for (
          let index = 0;
          index <
          line.length;
          index +=
          maxCharacters
        ) {

          finalLines.push(
            line.slice(
              index,
              index +
              maxCharacters
            )
          );

        }

      }
    );


    return finalLines.join(
      "\n"
    );

  }


  function normalizeLongLabels() {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return;

    }


    sheet.labels
      .forEach(
        function (
          label
        ) {

          const original =
            String(
              label.text ||
              ""
            );


          if (
            original.length >
            10
          ) {

            label.text =
              wrapText(
                original,
                10
              );


            label.size =
              Math.min(
                Number(
                  label.size
                ) ||
                8,
                7
              );


            label.lineHeight =
              8.5;

          }

        }
      );

  }


  /* =====================================================
     TERMINAL COORDINATE
  ===================================================== */

  function getTerminalPoint(
    terminalId
  ) {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return null;

    }


    const match =
      String(
        terminalId ||
        ""
      )
        .match(
          /^(.*)-(\d+)$/
        );


    if (!match) {

      return null;

    }


    const rowId =
      match[
        1
      ];


    const terminalNumber =
      Number(
        match[
          2
        ]
      );


    const row =
      sheet.terminalRows.find(
        function (
          item
        ) {

          return (
            String(
              item.id
            ) ===
            rowId
          );

        }
      );


    if (!row) {

      return null;

    }


    const start =
      Number(
        row.startNumber ||
        1
      );


    const index =
      terminalNumber -
      start;


    if (
      index <
      0 ||
      index >=
      Number(
        row.count
      )
    ) {

      return null;

    }


    return {

      x:
        Number(
          row.startX
        ) +
        (
          index *
          Number(
            row.pitch
          )
        ),

      y:
        Number(
          row.y
        ),

      row:
        row

    };

  }


  /* =====================================================
     FUSE RECORD MIGRATION

     Existing BELD curved links are converted to
     editable Fuse records without changing drawing.
  ===================================================== */

  function migrateExistingLinksToFuseRecords() {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return;

    }


    if (
      !Array.isArray(
        sheet.fuseRecords
      )
    ) {

      sheet.fuseRecords =
        [];

    }


    sheet.links
      .forEach(
        function (
          link,
          index
        ) {

          if (
            sheet.fuseRecords.some(
              function (
                fuse
              ) {

                return (
                  fuse.linkId ===
                  link.id
                );

              }
            )
          ) {

            return;

          }


          let nearestLabel =
            null;


          const a =
            getTerminalPoint(
              link.terminalA
            );


          const b =
            getTerminalPoint(
              link.terminalB
            );


          if (
            a &&
            b
          ) {

            const middleX =
              (
                a.x +
                b.x
              ) /
              2;


            let bestDistance =
              Infinity;


            sheet.labels
              .forEach(
                function (
                  label
                ) {

                  const dx =
                    Math.abs(
                      Number(
                        label.x
                      ) -
                      middleX
                    );


                  const dy =
                    Math.abs(
                      Number(
                        label.y
                      ) -
                      (
                        a.y -
                        80
                      )
                    );


                  const distance =
                    dx +
                    dy;


                  if (
                    dx <
                    60 &&
                    distance <
                    bestDistance
                  ) {

                    nearestLabel =
                      label;


                    bestDistance =
                      distance;

                  }

                }
              );

          }


          if (
            nearestLabel &&
            !nearestLabel.id
          ) {

            nearestLabel.id =
              createId(
                "FUSE-LABEL"
              );

          }


          sheet.fuseRecords.push(
            {

              id:
                createId(
                  "FUSE"
                ),

              label:
                `F${sheet.fuseRecords.length + 1}`,

              particular:
                nearestLabel
                  ?.text ||
                "",

              terminalA:
                link.terminalA ||
                "",

              terminalB:
                link.terminalB ||
                "",

              connectTop:
                link.connectTop ===
                true,

              connectBottom:
                link.connectBottom ===
                true,

              linkId:
                link.id,

              labelId:
                nearestLabel
                  ?.id ||
                ""

            }
          );

        }
      );

  }


  /* =====================================================
     FUSE TERMINAL SELECT
  ===================================================== */

  function populateFuseTerminalSelects() {

    const ids =
      [];


    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return;

    }


    sheet.terminalRows
      .forEach(
        function (
          row
        ) {

          const start =
            Number(
              row.startNumber ||
              1
            );


          for (
            let index = 0;
            index <
            Number(
              row.count
            );
            index += 1
          ) {

            ids.push(
              `${row.id}-${start + index}`
            );

          }

        }
      );


    [
      "ctrFuseTerminalA",
      "ctrFuseTerminalB"
    ]
      .forEach(
        function (
          id
        ) {

          const select =
            document.getElementById(
              id
            );


          if (!select) {

            return;

          }


          const oldValue =
            select.value;


          select.innerHTML =
            `<option value="">
               Select terminal
             </option>`;


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
     FUSE PANEL
  ===================================================== */

  function openFusePanel(
    fuse = null
  ) {

    const panel =
      document.getElementById(
        "ctrFusePanel"
      );


    if (!panel) {

      return;

    }


    populateFuseTerminalSelects();


    selectedFuseId =
      fuse
        ?.id ||
      null;


    document.getElementById(
      "ctrFuseEditorTitle"
    ).textContent =
      fuse
        ? "Edit Fuse"
        : "Add Fuse";


    document.getElementById(
      "ctrFuseLabel"
    ).value =
      fuse
        ?.label ||
      "";


    document.getElementById(
      "ctrFuseParticular"
    ).value =
      String(
        fuse
          ?.particular ||
        ""
      )
        .replaceAll(
          "\n",
          " "
        );


    document.getElementById(
      "ctrFuseTerminalA"
    ).value =
      fuse
        ?.terminalA ||
      "";


    document.getElementById(
      "ctrFuseTerminalB"
    ).value =
      fuse
        ?.terminalB ||
      "";


    document.getElementById(
      "ctrFuseTopBridge"
    ).checked =
      fuse
        ? fuse.connectTop !==
          false
        : true;


    document.getElementById(
      "ctrFuseBottomBridge"
    ).checked =
      fuse
        ? fuse.connectBottom !==
          false
        : true;


    document.getElementById(
      "ctrFuseDelete"
    ).hidden =
      !fuse;


    panel.hidden =
      false;

  }


  function closeFusePanel() {

    const panel =
      document.getElementById(
        "ctrFusePanel"
      );


    if (panel) {

      panel.hidden =
        true;

    }


    selectedFuseId =
      null;

  }


  function findFuseRecord(
    id
  ) {

    return (
      getActiveSheetData()
        ?.fuseRecords
        ?.find(
          function (
            fuse
          ) {

            return (
              fuse.id ===
              id
            );

          }
        ) ||
      null
    );

  }


  function saveFuse() {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return;

    }


    const terminalA =
      document.getElementById(
        "ctrFuseTerminalA"
      ).value;


    const terminalB =
      document.getElementById(
        "ctrFuseTerminalB"
      ).value;


    if (
      !terminalA ||
      !terminalB
    ) {

      window.alert(
        "Select both fuse terminals."
      );


      return;

    }


    if (
      terminalA ===
      terminalB
    ) {

      window.alert(
        "Fuse terminals cannot be the same."
      );


      return;

    }


    let fuse =
      selectedFuseId
        ? findFuseRecord(
            selectedFuseId
          )
        : null;


    if (!fuse) {

      fuse = {

        id:
          createId(
            "FUSE"
          ),

        linkId:
          createId(
            "FUSE-LINK"
          ),

        labelId:
          createId(
            "FUSE-LABEL"
          )

      };


      sheet.fuseRecords.push(
        fuse
      );


      selectedFuseId =
        fuse.id;

    }


    fuse.label =
      document.getElementById(
        "ctrFuseLabel"
      ).value.trim() ||
      `F${sheet.fuseRecords.indexOf(fuse) + 1}`;


    fuse.particular =
      document.getElementById(
        "ctrFuseParticular"
      ).value.trim();


    fuse.terminalA =
      terminalA;


    fuse.terminalB =
      terminalB;


    fuse.connectTop =
      document.getElementById(
        "ctrFuseTopBridge"
      ).checked;


    fuse.connectBottom =
      document.getElementById(
        "ctrFuseBottomBridge"
      ).checked;


    syncFuseVisual(
      fuse
    );


    normalizeLongLabels();

    rerenderDrawing();

    closeFusePanel();

    renderBuilderControls();

  }


  /* =====================================================
     FUSE VISUAL SYNC
  ===================================================== */

  function syncFuseVisual(
    fuse
  ) {

    const sheet =
      getActiveSheetData();


    if (!sheet) {

      return;

    }


    let link =
      sheet.links.find(
        function (
          item
        ) {

          return (
            item.id ===
            fuse.linkId
          );

        }
      );


    if (!link) {

      link = {

        id:
          fuse.linkId

      };


      sheet.links.push(
        link
      );

    }


    link.terminalA =
      fuse.terminalA;


    link.terminalB =
      fuse.terminalB;


    link.connectTop =
      fuse.connectTop;


    link.connectBottom =
      fuse.connectBottom;


    link.curveAmount =
      7;


    const a =
      getTerminalPoint(
        fuse.terminalA
      );


    const b =
      getTerminalPoint(
        fuse.terminalB
      );


    if (
      !a ||
      !b
    ) {

      return;

    }


    let label =
      sheet.labels.find(
        function (
          item
        ) {

          return (
            item.id ===
            fuse.labelId
          );

        }
      );


    if (!label) {

      label = {

        id:
          fuse.labelId

      };


      sheet.labels.push(
        label
      );

    }


    const particular =
      wrapText(
        fuse.particular,
        10
      );


    /*
       Fuse number and particular get separate lines.
       This prevents one long text line from overlapping
       the next fuse.
    */

    label.text =
      [
        fuse.label,
        particular
      ]
        .filter(
          Boolean
        )
        .join(
          "\n"
        );


    label.x =
      (
        a.x +
        b.x
      ) /
      2;


    label.y =
      Math.min(
        a.y,
        b.y
      ) -
      84;


    label.size =
      6.5;


    label.weight =
      600;


    label.anchor =
      "middle";


    label.lineHeight =
      8;

  }


  function removeSelectedFuse() {

    const sheet =
      getActiveSheetData();


    const fuse =
      selectedFuseId
        ? findFuseRecord(
            selectedFuseId
          )
        : null;


    if (
      !sheet ||
      !fuse
    ) {

      return;

    }


    if (
      !window.confirm(
        `Remove ${fuse.label}?`
      )
    ) {

      return;

    }


    sheet.fuseRecords =
      sheet.fuseRecords.filter(
        function (
          item
        ) {

          return (
            item.id !==
            fuse.id
          );

        }
      );


    sheet.links =
      sheet.links.filter(
        function (
          item
        ) {

          return (
            item.id !==
            fuse.linkId
          );

        }
      );


    sheet.labels =
      sheet.labels.filter(
        function (
          item
        ) {

          return (
            item.id !==
            fuse.labelId
          );

        }
      );


    closeFusePanel();

    rerenderDrawing();

    renderBuilderControls();

  }


  /* =====================================================
     BUILDER PANEL STYLE
  ===================================================== */

  function injectStyles() {

    if (
      document.getElementById(
        "ctrBuilderStyles"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "ctrBuilderStyles";


    style.textContent = `

      #ctrStructureBuilder {

        width:
          100%;

        padding:
          10px 12px;

        border-top:
          1px solid #bcc6d0;

        border-bottom:
          1px solid #aebbc7;

        background:
          #ffffff;

        font-family:
          Arial,
          sans-serif;

      }


      .ctr-builder-status {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          15px;

        margin-bottom:
          9px;

        padding-bottom:
          8px;

        border-bottom:
          1px solid #e0e5ea;

      }


      .ctr-builder-status span {

        color:
          #66798c;

        font-size:
          9px;

        font-weight:
          700;

        letter-spacing:
          0.8px;

      }


      .ctr-builder-status strong {

        color:
          #173e6e;

        font-size:
          12px;

      }


      .ctr-builder-groups {

        display:
          flex;

        align-items:
          flex-end;

        flex-wrap:
          wrap;

        gap:
          9px;

      }


      .ctr-builder-group {

        display:
          flex;

        align-items:
          flex-end;

        flex-wrap:
          wrap;

        gap:
          5px;

        padding:
          7px;

        border:
          1px solid #d6dde4;

        background:
          #f8fafb;

      }


      .ctr-builder-group-title {

        width:
          100%;

        margin-bottom:
          2px;

        color:
          #576c80;

        font-size:
          8px;

        font-weight:
          700;

        letter-spacing:
          0.7px;

        text-transform:
          uppercase;

      }


      .ctr-builder-group button,
      .ctr-builder-group select {

        min-height:
          31px;

        padding:
          0 8px;

        border:
          1px solid #aebbc7;

        border-radius:
          2px;

        background:
          #ffffff;

        color:
          #27445f;

        font-size:
          9px;

      }


      .ctr-builder-group button {

        cursor:
          pointer;

        font-weight:
          700;

      }


      .ctr-builder-group button:hover {

        background:
          #edf2f7;

      }


      .ctr-builder-danger {

        border-color:
          #c58a86 !important;

        color:
          #a62b22 !important;

      }


      /* ===============================================
         FUSE EDITOR
      =============================================== */

      #ctrFusePanel {

        position:
          fixed;

        top:
          150px;

        right:
          18px;

        z-index:
          5000;

        width:
          355px;

        max-height:
          calc(100vh - 175px);

        overflow-y:
          auto;

        border:
          1px solid #b9c6d2;

        background:
          #ffffff;

        box-shadow:
          0 8px 30px
          rgba(0,0,0,0.20);

        font-family:
          Arial,
          sans-serif;

      }


      #ctrFusePanel[hidden] {

        display:
          none !important;

      }


      .ctr-fuse-head {

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        padding:
          12px 14px;

        background:
          #173e6e;

        color:
          #ffffff;

      }


      .ctr-fuse-head span {

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


      .ctr-fuse-head strong {

        font-size:
          14px;

      }


      .ctr-fuse-head button {

        width:
          29px;

        height:
          29px;

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


      .ctr-fuse-body {

        padding:
          14px;

      }


      .ctr-fuse-field {

        margin-bottom:
          12px;

      }


      .ctr-fuse-field label {

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


      .ctr-fuse-field input,
      .ctr-fuse-field select,
      .ctr-fuse-field textarea {

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

        font-size:
          12px;

      }


      .ctr-fuse-field input,
      .ctr-fuse-field select {

        height:
          37px;

        padding:
          0 9px;

      }


      .ctr-fuse-field textarea {

        min-height:
          80px;

        padding:
          8px;

        resize:
          vertical;

      }


      .ctr-fuse-checks {

        display:
          flex;

        gap:
          18px;

        margin-bottom:
          14px;

        color:
          #40576c;

        font-size:
          10px;

      }


      .ctr-fuse-actions {

        display:
          flex;

        gap:
          8px;

      }


      .ctr-fuse-actions button {

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


      #ctrFuseSave {

        flex:
          1;

        border:
          1px solid #173e6e;

        background:
          #173e6e;

        color:
          #ffffff;

      }


      #ctrFuseDelete {

        border:
          1px solid #b42318;

        background:
          #ffffff;

        color:
          #a51f16;

      }


      @media
      (max-width: 760px) {

        #ctrFusePanel {

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
     CREATE BUILDER DOM
  ===================================================== */

  function createBuilder() {

    if (
      document.getElementById(
        "ctrStructureBuilder"
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


    const builder =
      document.createElement(
        "section"
      );


    builder.id =
      "ctrStructureBuilder";


    /*
       Place builder above current connection toolbar.
    */

    const connectionToolbar =
      document.getElementById(
        "ctrDrawingEditorToolbar"
      );


    if (
      connectionToolbar
    ) {

      connectionToolbar.parentNode
        .insertBefore(
          builder,
          connectionToolbar
        );

    }

    else {

      host.parentNode
        .insertBefore(
          builder,
          host
        );

    }

  }


  /* =====================================================
     FUSE PANEL DOM
  ===================================================== */

  function createFusePanel() {

    if (
      document.getElementById(
        "ctrFusePanel"
      )
    ) {

      return;

    }


    const panel =
      document.createElement(
        "aside"
      );


    panel.id =
      "ctrFusePanel";


    panel.hidden =
      true;


    panel.innerHTML = `

      <div class="ctr-fuse-head">

        <div>

          <span>
            FUSE PROPERTIES
          </span>

          <strong id="ctrFuseEditorTitle">
            Add Fuse
          </strong>

        </div>


        <button
          type="button"
          id="ctrFuseClose"
        >
          ×
        </button>

      </div>


      <div class="ctr-fuse-body">


        <div class="ctr-fuse-field">

          <label for="ctrFuseLabel">
            Fuse No. / Label
          </label>

          <input
            type="text"
            id="ctrFuseLabel"
            placeholder="Example: F1"
          >

        </div>


        <div class="ctr-fuse-field">

          <label for="ctrFuseParticular">
            Fuse Particular / Circuit
          </label>

          <textarea
            id="ctrFuseParticular"
            placeholder="Example: B24V BPAC(SB)"
          ></textarea>

        </div>


        <div class="ctr-fuse-field">

          <label for="ctrFuseTerminalA">
            Terminal A
          </label>

          <select id="ctrFuseTerminalA">
          </select>

        </div>


        <div class="ctr-fuse-field">

          <label for="ctrFuseTerminalB">
            Terminal B
          </label>

          <select id="ctrFuseTerminalB">
          </select>

        </div>


        <div class="ctr-fuse-checks">

          <label>

            <input
              type="checkbox"
              id="ctrFuseTopBridge"
              checked
            >

            Top Bridge

          </label>


          <label>

            <input
              type="checkbox"
              id="ctrFuseBottomBridge"
              checked
            >

            Bottom Bridge

          </label>

        </div>


        <div class="ctr-fuse-actions">

          <button
            type="button"
            id="ctrFuseSave"
          >
            Save Fuse
          </button>


          <button
            type="button"
            id="ctrFuseDelete"
            hidden
          >
            Remove
          </button>

        </div>


      </div>

    `;


    document.body.appendChild(
      panel
    );

  }


  /* =====================================================
     RENDER BUILDER CONTROLS
  ===================================================== */

  function renderBuilderControls() {

    const builder =
      document.getElementById(
        "ctrStructureBuilder"
      );


    const state =
      ensureBuilderState();


    if (
      !builder ||
      !state
    ) {

      return;

    }


    const activeName =
      activeContext
        ?.name ||
      "—";


    const isLocation =
      activeContext?.type ===
      "location";


    builder.innerHTML = `

      <div class="ctr-builder-status">

        <span>
          CTR STRUCTURE BUILDER
        </span>

        <strong>
          Editing:
          ${escapeHtml(activeName)}
          ${isLocation ? " · LOCATION BOX" : " · STATION CTR"}
        </strong>

      </div>


      <div class="ctr-builder-groups">


        <!-- ==========================================
             STATION CTR RACKS
        =========================================== -->

        <div class="ctr-builder-group">

          <div class="ctr-builder-group-title">
            Station CTR Racks
          </div>


          <select id="ctrBuilderRackSelect">

            ${state.stationCtrRacks
              .map(
                function (
                  rack
                ) {

                  return `
                    <option
                      value="${rack.id}"
                      ${activeContext === rack ? "selected" : ""}
                    >
                      ${escapeHtml(rack.name)}
                    </option>
                  `;

                }
              )
              .join("")}

          </select>


          <button
            type="button"
            id="ctrBuilderOpenRack"
          >
            Open Rack
          </button>


          <button
            type="button"
            id="ctrBuilderAddRack"
          >
            + Rack
          </button>


          <button
            type="button"
            id="ctrBuilderRename"
          >
            Rename
          </button>


          <button
            type="button"
            class="ctr-builder-danger"
            id="ctrBuilderRemoveRack"
          >
            − Rack
          </button>

        </div>


        <!-- ==========================================
             ROW / COLUMN
        =========================================== -->

        <div class="ctr-builder-group">

          <div class="ctr-builder-group-title">
            Row / Column
          </div>


          <select id="ctrBuilderRowSelect">

            ${getActiveSheetData()
              ?.terminalRows
              ?.map(
                function (
                  row
                ) {

                  return `
                    <option value="${escapeHtml(row.id)}">
                      Row ${escapeHtml(row.id)}
                    </option>
                  `;

                }
              )
              .join("") || ""}

          </select>


          <button
            type="button"
            id="ctrBuilderAddRow"
          >
            + Row
          </button>


          <button
            type="button"
            class="ctr-builder-danger"
            id="ctrBuilderRemoveRow"
          >
            − Row
          </button>


          <button
            type="button"
            id="ctrBuilderAddColumn"
          >
            + Column
          </button>


          <button
            type="button"
            class="ctr-builder-danger"
            id="ctrBuilderRemoveColumn"
          >
            − Column
          </button>

        </div>


        <!-- ==========================================
             CONDUCTORS
        =========================================== -->

        <div class="ctr-builder-group">

          <div class="ctr-builder-group-title">
            Conductors / Terminals
          </div>


          <button
            type="button"
            id="ctrBuilderAddConductor"
          >
            + Conductor
          </button>


          <button
            type="button"
            class="ctr-builder-danger"
            id="ctrBuilderRemoveConductor"
          >
            − Conductor
          </button>


          <button
            type="button"
            id="ctrBuilderAddConnection"
          >
            + Connection
          </button>

        </div>


        <!-- ==========================================
             FUSES
        =========================================== -->

        <div class="ctr-builder-group">

          <div class="ctr-builder-group-title">
            Fuse Details
          </div>


          <select id="ctrBuilderFuseSelect">

            <option value="">
              Select Fuse
            </option>

            ${getActiveSheetData()
              ?.fuseRecords
              ?.map(
                function (
                  fuse
                ) {

                  return `
                    <option value="${fuse.id}">
                      ${escapeHtml(fuse.label)}
                      ${fuse.particular
                        ? " · " + escapeHtml(String(fuse.particular).replaceAll("\n", " "))
                        : ""}
                    </option>
                  `;

                }
              )
              .join("") || ""}

          </select>


          <button
            type="button"
            id="ctrBuilderAddFuse"
          >
            + Fuse
          </button>


          <button
            type="button"
            id="ctrBuilderEditFuse"
          >
            Edit Fuse
          </button>

        </div>


        <!-- ==========================================
             CONNECTED ENDS / LOCATIONS
        =========================================== -->

        <div class="ctr-builder-group">

          <div class="ctr-builder-group-title">
            Connected Ends / Location Boxes
          </div>


          <select id="ctrBuilderEndSelect">

            <option value="">
              Select End
            </option>

            ${state.connectedEnds
              .map(
                function (
                  end
                ) {

                  return `
                    <option value="${end.id}">
                      ${escapeHtml(end.name)}
                    </option>
                  `;

                }
              )
              .join("")}

          </select>


          <button
            type="button"
            id="ctrBuilderAddEnd"
          >
            + End
          </button>


          <button
            type="button"
            class="ctr-builder-danger"
            id="ctrBuilderRemoveEnd"
          >
            − End
          </button>


          <select id="ctrBuilderLocationSelect">

            <option value="">
              Select Location
            </option>

          </select>


          <button
            type="button"
            id="ctrBuilderAddLocation"
          >
            + Location
          </button>


          <button
            type="button"
            id="ctrBuilderOpenLocation"
          >
            Open Location
          </button>


          <button
            type="button"
            class="ctr-builder-danger"
            id="ctrBuilderRemoveLocation"
          >
            − Location
          </button>

        </div>


      </div>

    `;


    bindBuilderControls();


    updateLocationSelect();

  }


  /* =====================================================
     HTML ESCAPE
  ===================================================== */

  function escapeHtml(
    value
  ) {

    return String(
      value ??
      ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );

  }


  /* =====================================================
     UPDATE LOCATION SELECT
  ===================================================== */

  function updateLocationSelect() {

    const end =
      getSelectedEnd();


    const select =
      document.getElementById(
        "ctrBuilderLocationSelect"
      );


    if (!select) {

      return;

    }


    select.innerHTML =
      `<option value="">
         Select Location
       </option>`;


    end
      ?.locations
      ?.forEach(
        function (
          location
        ) {

          const option =
            document.createElement(
              "option"
            );


          option.value =
            location.id;


          option.textContent =
            location.name;


          if (
            activeContext ===
            location
          ) {

            option.selected =
              true;

          }


          select.appendChild(
            option
          );

        }
      );

  }


  /* =====================================================
     BUILDER EVENTS
  ===================================================== */

  function bindBuilderControls() {

    const state =
      ensureBuilderState();


    document.getElementById(
      "ctrBuilderOpenRack"
    )
      ?.addEventListener(
        "click",
        function () {

          const id =
            document.getElementById(
              "ctrBuilderRackSelect"
            ).value;


          const rack =
            state.stationCtrRacks.find(
              function (
                item
              ) {

                return (
                  item.id ===
                  id
                );

              }
            );


          if (
            rack
          ) {

            loadContext(
              rack
            );

          }

        }
      );


    document.getElementById(
      "ctrBuilderAddRack"
    )
      ?.addEventListener(
        "click",
        addRack
      );


    document.getElementById(
      "ctrBuilderRemoveRack"
    )
      ?.addEventListener(
        "click",
        removeActiveRack
      );


    document.getElementById(
      "ctrBuilderRename"
    )
      ?.addEventListener(
        "click",
        renameActiveContext
      );


    document.getElementById(
      "ctrBuilderAddRow"
    )
      ?.addEventListener(
        "click",
        addRow
      );


    document.getElementById(
      "ctrBuilderRemoveRow"
    )
      ?.addEventListener(
        "click",
        removeRow
      );


    document.getElementById(
      "ctrBuilderAddColumn"
    )
      ?.addEventListener(
        "click",
        addColumn
      );


    document.getElementById(
      "ctrBuilderRemoveColumn"
    )
      ?.addEventListener(
        "click",
        removeColumn
      );


    document.getElementById(
      "ctrBuilderAddConductor"
    )
      ?.addEventListener(
        "click",
        addConductor
      );


    document.getElementById(
      "ctrBuilderRemoveConductor"
    )
      ?.addEventListener(
        "click",
        removeConductor
      );


    document.getElementById(
      "ctrBuilderAddConnection"
    )
      ?.addEventListener(
        "click",
        function () {

          if (
            window.CTR_EDITOR &&
            typeof window.CTR_EDITOR.startConnect ===
            "function"
          ) {

            window.CTR_EDITOR
              .startConnect();

          }

          else {

            window.alert(
              "Connection editor is not ready."
            );

          }

        }
      );


    document.getElementById(
      "ctrBuilderAddFuse"
    )
      ?.addEventListener(
        "click",
        function () {

          openFusePanel(
            null
          );

        }
      );


    document.getElementById(
      "ctrBuilderEditFuse"
    )
      ?.addEventListener(
        "click",
        function () {

          const id =
            document.getElementById(
              "ctrBuilderFuseSelect"
            ).value;


          const fuse =
            findFuseRecord(
              id
            );


          if (
            !fuse
          ) {

            window.alert(
              "Select a fuse first."
            );


            return;

          }


          openFusePanel(
            fuse
          );

        }
      );


    document.getElementById(
      "ctrBuilderEndSelect"
    )
      ?.addEventListener(
        "change",
        updateLocationSelect
      );


    document.getElementById(
      "ctrBuilderAddEnd"
    )
      ?.addEventListener(
        "click",
        addConnectedEnd
      );


    document.getElementById(
      "ctrBuilderRemoveEnd"
    )
      ?.addEventListener(
        "click",
        removeConnectedEnd
      );


    document.getElementById(
      "ctrBuilderAddLocation"
    )
      ?.addEventListener(
        "click",
        addLocation
      );


    document.getElementById(
      "ctrBuilderOpenLocation"
    )
      ?.addEventListener(
        "click",
        openSelectedLocation
      );


    document.getElementById(
      "ctrBuilderRemoveLocation"
    )
      ?.addEventListener(
        "click",
        removeLocation
      );

  }


  /* =====================================================
     FUSE PANEL EVENTS
  ===================================================== */

  function bindFusePanel() {

    document.getElementById(
      "ctrFuseClose"
    )
      ?.addEventListener(
        "click",
        closeFusePanel
      );


    document.getElementById(
      "ctrFuseSave"
    )
      ?.addEventListener(
        "click",
        saveFuse
      );


    document.getElementById(
      "ctrFuseDelete"
    )
      ?.addEventListener(
        "click",
        removeSelectedFuse
      );

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  function initialize() {

    const prototype =
      getPrototype();


    if (
      !prototype ||
      !prototype.data
    ) {

      console.error(
        "CTR Builder: prototype data not available."
      );


      return;

    }


    injectStyles();


    createBuilder();


    createFusePanel();


    const state =
      ensureBuilderState();


    /*
       First station rack becomes active.
    */

    activeContext =
      state.stationCtrRacks[
        0
      ];


    /*
       Mark station racks explicitly.
    */

    state.stationCtrRacks
      .forEach(
        function (
          rack
        ) {

          rack.type =
            "rack";

        }
      );


    normalizeLongLabels();


    migrateExistingLinksToFuseRecords();


    bindFusePanel();


    rerenderDrawing();


    renderBuilderControls();


    window.CTR_BUILDER = {

      version:
        BUILDER_VERSION,

      getState:
        function () {

          return ensureBuilderState();

        },

      getActiveContext:
        function () {

          return activeContext;

        },

      rerender:
        rerenderDrawing,

      addRack:
        addRack,

      addRow:
        addRow,

      addColumn:
        addColumn,

      addConductor:
        addConductor

    };


    window.dispatchEvent(
      new CustomEvent(
        "ctr-builder-ready"
      )
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