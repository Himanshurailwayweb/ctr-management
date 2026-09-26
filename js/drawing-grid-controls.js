/* =========================================================
   CTR MANAGEMENT - DRAWING GRID CONTROLS

   PERFORMANCE VERSION

   PURPOSE
   ---------------------------------------------------------
   - Station CTR Fuse Row / Column Controls
   - Station CTR Terminal Row / Column Controls
   - Location Fuse Grid Controls
   - No full document MutationObserver
   - No full rack redraw for normal terminal add/remove
========================================================= */

(function () {

  "use strict";


  /* =======================================================
     ACCESS
  ======================================================= */

  function canEdit() {

    try {

      if (
        typeof canEditCurrentStationDraft ===
        "function"
      ) {

        return Boolean(
          canEditCurrentStationDraft()
        );

      }

    }
    catch (error) {

      console.warn(
        "CTR edit permission check:",
        error
      );

    }


    return false;

  }


  function requireEdit() {

    if (
      typeof requireCurrentStationDraftEdit ===
      "function"
    ) {

      return requireCurrentStationDraftEdit();

    }


    return canEdit();

  }


  /* =======================================================
     SAFE ACCESS APPLY
  ======================================================= */

  function applyAccessMode() {

    if (
      typeof scheduleStationAccessApply ===
      "function"
    ) {

      scheduleStationAccessApply();

      return;

    }


    if (
      typeof applyStationBuilderAccessMode ===
      "function"
    ) {

      applyStationBuilderAccessMode();

    }

  }


  /* =======================================================
     BUTTON
  ======================================================= */

  function createGridButton(
    text,
    handler,
    remove = false
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      remove
        ? "systematic-grid-btn systematic-remove-btn"
        : "systematic-grid-btn";


    button.textContent =
      text;


    button.hidden =
      !canEdit();


    if (
      typeof handler ===
      "function"
    ) {

      button.addEventListener(
        "click",
        handler
      );

    }


    return button;

  }


  /* =======================================================
     FUSE HELPERS
  ======================================================= */

  function createNewFuse(rack) {

    const fuseDetails =
      Array.isArray(
        rack.fuseDetails
      )
        ? rack.fuseDetails
        : [];


    const nextNumber =
      typeof getNextFuseNumber ===
      "function"

        ? getNextFuseNumber(
            fuseDetails
          )

        : fuseDetails.length + 1;


    if (
      typeof createFusePoint ===
      "function"
    ) {

      return createFusePoint(
        nextNumber
      );

    }


    return {

      id:
        (
          crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`
        ),

      label:
        `F${nextNumber}`,

      details:
        ""

    };

  }


  function getFuseColumns(rack) {

    const saved =
      Number(
        rack.fuseGridColumns
      );


    if (
      Number.isInteger(
        saved
      ) &&
      saved > 0
    ) {

      return saved;

    }


    const count =
      Array.isArray(
        rack.fuseDetails
      )
        ? rack.fuseDetails.length
        : 0;


    rack.fuseGridColumns =
      Math.max(
        1,
        count || 1
      );


    return rack.fuseGridColumns;

  }


  function getFuseRows(rack) {

    const columns =
      getFuseColumns(
        rack
      );


    const count =
      Array.isArray(
        rack.fuseDetails
      )
        ? rack.fuseDetails.length
        : 0;


    return Math.max(
      1,
      Math.ceil(
        count / columns
      )
    );

  }


  /* =======================================================
     FUSE ADD ROW
  ======================================================= */

  function addFuseRow(
    rack,
    rerender
  ) {

    if (
      !requireEdit()
    ) {

      return;

    }


    rack.fuseDetails =
      Array.isArray(
        rack.fuseDetails
      )
        ? rack.fuseDetails
        : [];


    const columns =
      getFuseColumns(
        rack
      );


    for (
      let i = 0;
      i < columns;
      i++
    ) {

      rack.fuseDetails.push(
        createNewFuse(
          rack
        )
      );

    }


    rerender();

  }


  /* =======================================================
     FUSE ADD COLUMN
  ======================================================= */

  function addFuseColumn(
    rack,
    rerender
  ) {

    if (
      !requireEdit()
    ) {

      return;

    }


    rack.fuseDetails =
      Array.isArray(
        rack.fuseDetails
      )
        ? rack.fuseDetails
        : [];


    const oldColumns =
      getFuseColumns(
        rack
      );


    const oldRows =
      getFuseRows(
        rack
      );


    const source =
      [
        ...rack.fuseDetails
      ];


    const rebuilt =
      [];


    for (
      let rowIndex = 0;
      rowIndex < oldRows;
      rowIndex++
    ) {

      const start =
        rowIndex *
        oldColumns;


      const rowItems =
        source.slice(
          start,
          start + oldColumns
        );


      while (
        rowItems.length <
        oldColumns
      ) {

        rowItems.push(
          createNewFuse(
            rack
          )
        );

      }


      rebuilt.push(
        ...rowItems
      );


      rebuilt.push(
        createNewFuse(
          rack
        )
      );

    }


    rack.fuseGridColumns =
      oldColumns + 1;


    rack.fuseDetails =
      rebuilt;


    rerender();

  }


  /* =======================================================
     FUSE REMOVE ROW
  ======================================================= */

  function removeFuseRow(
    rack,
    rerender
  ) {

    if (
      !requireEdit()
    ) {

      return;

    }


    const columns =
      getFuseColumns(
        rack
      );


    const rows =
      getFuseRows(
        rack
      );


    if (
      rows <= 1
    ) {

      alert(
        "At least one fuse row must remain."
      );

      return;

    }


    if (
      !confirm(
        "Remove the last fuse row?"
      )
    ) {

      return;

    }


    rack.fuseDetails.splice(
      Math.max(
        0,
        rack.fuseDetails.length -
        columns
      ),
      columns
    );


    rerender();

  }


  /* =======================================================
     FUSE REMOVE COLUMN
  ======================================================= */

  function removeFuseColumn(
    rack,
    rerender
  ) {

    if (
      !requireEdit()
    ) {

      return;

    }


    const oldColumns =
      getFuseColumns(
        rack
      );


    if (
      oldColumns <= 1
    ) {

      alert(
        "At least one fuse column must remain."
      );

      return;

    }


    if (
      !confirm(
        `Remove Fuse Column ${oldColumns}?`
      )
    ) {

      return;

    }


    const rows =
      getFuseRows(
        rack
      );


    const source =
      [
        ...rack.fuseDetails
      ];


    const rebuilt =
      [];


    const newColumns =
      oldColumns - 1;


    for (
      let rowIndex = 0;
      rowIndex < rows;
      rowIndex++
    ) {

      const start =
        rowIndex *
        oldColumns;


      const rowItems =
        source.slice(
          start,
          start + oldColumns
        );


      rebuilt.push(
        ...rowItems.slice(
          0,
          newColumns
        )
      );

    }


    rack.fuseGridColumns =
      newColumns;


    rack.fuseDetails =
      rebuilt;


    rerender();

  }


  /* =======================================================
     FUSE CONTROLS
  ======================================================= */

  function createFuseControls(
    rack,
    rerender
  ) {

    const actions =
      document.createElement(
        "div"
      );


    actions.className =
      "systematic-grid-actions";


    actions.dataset.gridKind =
      "fuse";


    actions.append(

      createGridButton(
        "+ Add Row",
        function () {

          addFuseRow(
            rack,
            rerender
          );

        }
      ),

      createGridButton(
        "+ Add Column",
        function () {

          addFuseColumn(
            rack,
            rerender
          );

        }
      ),

      createGridButton(
        "− Remove Row",
        function () {

          removeFuseRow(
            rack,
            rerender
          );

        },
        true
      ),

      createGridButton(
        "− Remove Column",
        function () {

          removeFuseColumn(
            rack,
            rerender
          );

        },
        true
      )

    );


    return actions;

  }


  /* =======================================================
     STATION TERMINAL CONTROLS

     Add Row / Add Column are intercepted by station.js
     capture handler and performed incrementally.
  ======================================================= */

  function createStationTerminalControls(
    rack,
    card
  ) {

    const actions =
      document.createElement(
        "div"
      );


    actions.className =
      "systematic-grid-actions";


    actions.dataset.gridKind =
      "terminal";


    /*
       station.js handles these two in capture phase.
    */

    actions.appendChild(
      createGridButton(
        "+ Add Row"
      )
    );


    actions.appendChild(
      createGridButton(
        "+ Add Column"
      )
    );


    /* -----------------------------------------------------
       REMOVE LAST ROW
    ----------------------------------------------------- */

    actions.appendChild(
      createGridButton(
        "− Remove Row",
        function () {

          if (
            !requireEdit()
          ) {

            return;

          }


          if (
            !Array.isArray(
              rack.rows
            ) ||
            rack.rows.length <= 1
          ) {

            alert(
              "At least one terminal row must remain."
            );

            return;

          }


          const lastRow =
            rack.rows[
              rack.rows.length - 1
            ];


          if (
            !confirm(
              `Remove Row ${lastRow.label}?`
            )
          ) {

            return;

          }


          rack.rows.pop();


          if (
            typeof relabelRows ===
            "function"
          ) {

            relabelRows(
              rack
            );

          }


          const rowBlocks =
            card.querySelectorAll(
              ".dynamic-rack-row"
            );


          rowBlocks[
            rowBlocks.length - 1
          ]?.remove();


          applyAccessMode();

        },
        true
      )
    );


    /* -----------------------------------------------------
       REMOVE LAST COLUMN
    ----------------------------------------------------- */

    actions.appendChild(
      createGridButton(
        "− Remove Column",
        function () {

          if (
            !requireEdit()
          ) {

            return;

          }


          if (
            !Array.isArray(
              rack.rows
            ) ||
            rack.rows.length === 0
          ) {

            return;

          }


          const columns =
            Math.max(
              ...rack.rows.map(
                function (row) {

                  return Array.isArray(
                    row.terminals
                  )
                    ? row.terminals.length
                    : 0;

                }
              )
            );


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
              `Remove Column ${columns} from all rows?`
            )
          ) {

            return;

          }


          const rowBlocks =
            card.querySelectorAll(
              ".dynamic-rack-row"
            );


          rack.rows.forEach(
            function (
              row,
              rowIndex
            ) {

              if (
                Array.isArray(
                  row.terminals
                ) &&
                row.terminals.length >
                  0
              ) {

                row.terminals.pop();

              }


              if (
                typeof renumberTerminals ===
                "function"
              ) {

                renumberTerminals(
                  row
                );

              }


              const strip =
                rowBlocks[
                  rowIndex
                ]
                  ?.querySelector(
                    ".terminal-strip"
                  );


              if (
                strip
              ) {

                /*
                   Each terminal uses:
                   terminal button
                   remove button
                */

                strip
                  .lastElementChild
                  ?.remove();


                strip
                  .lastElementChild
                  ?.remove();

              }

            }
          );


          applyAccessMode();

        },
        true
      )
    );


    return actions;

  }


  /* =======================================================
     ENHANCE FUSE SECTION
  ======================================================= */

  function enhanceFuseSection(
    section,
    rack,
    rerender
  ) {

    if (
      !section ||
      !rack
    ) {

      return;

    }


    const header =
      section.querySelector(
        ".fuse-builder-header"
      );


    if (
      !header
    ) {

      return;

    }


    /*
       Hide legacy single Add Fuse button.
    */

    header
      .querySelectorAll(
        ".add-conductor-btn"
      )
      .forEach(
        function (button) {

          button.style.display =
            "none";

        }
      );


    if (
      !header.querySelector(
        '[data-grid-kind="fuse"]'
      )
    ) {

      header.appendChild(
        createFuseControls(
          rack,
          rerender
        )
      );

    }


    const strip =
      section.querySelector(
        ".pdf-fuse-strip"
      );


    if (
      strip
    ) {

      const columns =
        getFuseColumns(
          rack
        );


      strip.classList.add(
        "systematic-fuse-grid"
      );


      strip.style.gridTemplateColumns =
        `repeat(${columns}, 145px)`;

    }


    let status =
      section.querySelector(
        ".fuse-grid-status"
      );


    if (
      !status
    ) {

      status =
        document.createElement(
          "div"
        );


      status.className =
        "fuse-grid-status";


      section.appendChild(
        status
      );

    }


    status.textContent =
      `Rows: ${getFuseRows(
        rack
      )}  •  Columns: ${getFuseColumns(
        rack
      )}`;

  }


  /* =======================================================
     STATION RACK ENHANCEMENT
  ======================================================= */

  function enhanceStationRacks() {

    let racks;


    try {

      racks =
        stationCtrRacks;

    }
    catch (error) {

      return;

    }


    if (
      !Array.isArray(
        racks
      )
    ) {

      return;

    }


    const cards =
      document.querySelectorAll(
        "#stationCtrRacksContainer .ctr-rack-card"
      );


    cards.forEach(
      function (
        card,
        index
      ) {

        const rack =
          racks[index];


        if (
          !rack
        ) {

          return;

        }


        const rerender =
          typeof renderStationCtrRacks ===
          "function"

            ? renderStationCtrRacks

            : function () {};


        enhanceFuseSection(
          card.querySelector(
            ".rack-fuse-section"
          ),
          rack,
          rerender
        );


        const toolbar =
          card.querySelector(
            ".rack-builder-toolbar"
          );


        if (
          !toolbar
        ) {

          return;

        }


        /*
           Hide legacy Add Row.
        */

        toolbar
          .querySelectorAll(
            ":scope > .builder-action-btn"
          )
          .forEach(
            function (button) {

              button.style.display =
                "none";

            }
          );


        if (
          !toolbar.querySelector(
            '[data-grid-kind="terminal"]'
          )
        ) {

          toolbar.appendChild(
            createStationTerminalControls(
              rack,
              card
            )
          );

        }


        /*
           Individual + Add Conductor button is hidden
           because systematic row/column control is used.
        */

        card
          .querySelectorAll(
            ".row-header-actions .add-conductor-btn"
          )
          .forEach(
            function (button) {

              button.style.display =
                "none";

            }
          );

      }
    );

  }


  /* =======================================================
     LOCATION FUSE ENHANCEMENT

     Location terminal controls already come directly
     from station.js.
  ======================================================= */

  function getLocations() {

    const locations =
      [];


    let ends;


    try {

      ends =
        connectedEnds;

    }
    catch (error) {

      return locations;

    }


    if (
      !Array.isArray(
        ends
      )
    ) {

      return locations;

    }


    ends.forEach(
      function (end) {

        (
          end.locations ||
          []
        )
          .forEach(
            function (location) {

              locations.push(
                location
              );

            }
          );

      }
    );


    return locations;

  }


  function enhanceLocations() {

    const locations =
      getLocations();


    const cards =
      document.querySelectorAll(
        "#connectedEndsContainer .dynamic-location-card"
      );


    cards.forEach(
      function (
        card,
        index
      ) {

        const location =
          locations[index];


        if (
          !location
        ) {

          return;

        }


        const fuseSection =
          card.querySelector(
            ".location-fuse-box"
          );


        if (
          fuseSection
        ) {

          enhanceFuseSection(
            fuseSection,
            location,
            typeof renderConnectedEnds ===
              "function"

              ? renderConnectedEnds

              : function () {}
          );

        }

      }
    );

  }


  /* =======================================================
     STYLES
  ======================================================= */

  function injectStyles() {

    if (
      document.getElementById(
        "lightGridControlsStyle"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "lightGridControlsStyle";


    style.textContent = `

      .systematic-grid-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 7px;
        flex-wrap: wrap;
      }

      .systematic-grid-btn {
        min-width: 105px;
        min-height: 32px;
        padding: 6px 10px;
        border: 1px solid #5d6975;
        border-radius: 2px;
        background: #ffffff;
        color: #1e344b;
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
      }

      .systematic-grid-btn:hover {
        background: #eef2f5;
      }

      .systematic-remove-btn {
        border-color: #bd3c3c;
        color: #a62020;
      }

      .systematic-remove-btn:hover {
        background: #fff3f3;
      }

      .fuse-builder-header {
        position: relative;
      }

      .fuse-builder-header
      .systematic-grid-actions {
        position: absolute;
        top: 0;
        right: 0;
      }

      .rack-builder-toolbar {
        position: relative;
      }

      .rack-builder-toolbar >
      .systematic-grid-actions {
        position: absolute;
        top: 13px;
        right: 0;
      }

      .systematic-fuse-grid {
        display: grid !important;
        align-items: start !important;
        justify-content: start !important;
        gap: 12px 8px !important;
        width: max-content !important;
        min-width: 100% !important;
      }

      .fuse-grid-status {
        margin-top: 8px;
        color: #667788;
        font-size: 9px;
        font-weight: 500;
        text-align: right;
      }

      body[data-station-edit-mode="view"]
      .systematic-grid-actions {
        display: none !important;
      }

      @media (max-width: 760px) {

        .fuse-builder-header {
          padding-bottom: 48px;
        }

        .fuse-builder-header
        .systematic-grid-actions,

        .rack-builder-toolbar >
        .systematic-grid-actions {

          position: static;
          margin-top: 8px;

        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =======================================================
     REFRESH SCHEDULER
  ======================================================= */

  let refreshFrame =
    null;


  function refresh() {

    refreshFrame =
      null;


    enhanceStationRacks();

    enhanceLocations();


    document
      .querySelectorAll(
        ".systematic-grid-btn"
      )
      .forEach(
        function (button) {

          button.hidden =
            !canEdit();

        }
      );

  }


  function scheduleRefresh() {

    if (
      refreshFrame !==
      null
    ) {

      return;

    }


    refreshFrame =
      requestAnimationFrame(
        refresh
      );

  }


  /* =======================================================
     SMALL OBSERVERS ONLY

     IMPORTANT:
     We observe only top-level rack/end replacement.
     We DO NOT observe the whole document subtree.
  ======================================================= */

  function startObservers() {

    const stationContainer =
      document.getElementById(
        "stationCtrRacksContainer"
      );


    const endsContainer =
      document.getElementById(
        "connectedEndsContainer"
      );


    if (
      stationContainer
    ) {

      const stationObserver =
        new MutationObserver(
          scheduleRefresh
        );


      stationObserver.observe(
        stationContainer,
        {
          childList:
            true,

          subtree:
            false
        }
      );

    }


    if (
      endsContainer
    ) {

      const endsObserver =
        new MutationObserver(
          scheduleRefresh
        );


      endsObserver.observe(
        endsContainer,
        {
          childList:
            true,

          subtree:
            false
        }
      );

    }

  }


  /* =======================================================
     PUBLIC REFRESH
  ======================================================= */

  window.ctrGridControls = {

    refresh:
      scheduleRefresh

  };


  /* =======================================================
     START
  ======================================================= */

  function start() {

    injectStyles();

    startObservers();


    /*
       station.js may still be loading data.
       Run once now and once after next paint.
    */

    scheduleRefresh();


    requestAnimationFrame(
      function () {

        scheduleRefresh();

      }
    );

  }


  window.addEventListener(
    "ctr-access-ready",
    scheduleRefresh
  );


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once:
          true
      }
    );

  }
  else {

    start();

  }

})();