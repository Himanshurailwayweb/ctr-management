/* =========================================================
   CTR MANAGEMENT SYSTEM
   LOCATION DRAWING CREATE CONTROLS

   VERSION 1.0

   PURPOSE
   ---------------------------------------------------------
   Location Drawing Workspace se directly:
   - Add Connected End
   - Add Location Box

   Existing drawing-properties.js handles:
   - Row
   - Column
   - Fuse
   - Rename
   - Remove
   - Terminal editing
========================================================= */

(function () {

  "use strict";


  const VERSION = "1.0.0";

  let initialized = false;


  /* =====================================================
     ACCESS
  ===================================================== */

  function requireEdit() {

    if (
      typeof requireCurrentStationDraftEdit ===
      "function"
    ) {

      return (
        requireCurrentStationDraftEdit() ===
        true
      );

    }

    return true;

  }


  /* =====================================================
     DATA
  ===================================================== */

  function getEnds() {

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
        "Location create controls:",
        error
      );

    }


    return [];

  }


  function getActiveEndIndex() {

    return (
      Number(
        document.getElementById(
          "locationSvgEndSelect"
        )?.value
      ) || 0
    );

  }


  function getActiveEnd() {

    return (
      getEnds()[
        getActiveEndIndex()
      ] ||
      null
    );

  }


  /* =====================================================
     STYLES
  ===================================================== */

  function injectStyles() {

    if (
      document.getElementById(
        "locationCreateControlStyles"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "locationCreateControlStyles";


    style.textContent = `

      .location-create-btn {

        min-height: 34px;

        padding:
          0
          10px;

        border:
          1px solid #7f93a7;

        border-radius:
          2px;

        background:
          #ffffff;

        color:
          #284864;

        cursor:
          pointer;

        font-size:
          9px;

        font-weight:
          700;

        white-space:
          nowrap;

        box-shadow:
          none;

      }


      .location-create-btn:hover {

        border-color:
          #526f8b;

        background:
          #f4f7f9;

      }


      .location-create-btn.primary {

        border-color:
          #173e6e;

        background:
          #173e6e;

        color:
          #ffffff;

      }


      .location-create-btn.primary:hover {

        background:
          #12345c;

      }


      body[data-station-edit-mode="view"]
      .location-create-btn {

        display:
          none !important;

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =====================================================
     REFRESH
  ===================================================== */

  function refreshLocation(
    targetEndIndex = null,
    targetLocationIndex = null
  ) {

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

        const endSelect =
          document.getElementById(
            "locationSvgEndSelect"
          );


        const locationSelect =
          document.getElementById(
            "locationSvgBoxSelect"
          );


        if (
          endSelect &&
          targetEndIndex !== null
        ) {

          endSelect.value =
            String(
              targetEndIndex
            );

        }


        if (
          locationSelect &&
          targetLocationIndex !== null
        ) {

          locationSelect.value =
            String(
              targetLocationIndex
            );

        }


        window
          .CTR_LOCATION_SVG_VIEW
          ?.refresh?.();


        setTimeout(
          function () {

            window
              .CTR_LOCATION_CONNECTIONS
              ?.redraw?.();


            window
              .CTR_DRAWING_PROPERTIES
              ?.refresh?.();

          },
          100
        );

      },
      140
    );

  }


  /* =====================================================
     ADD CONNECTED END
  ===================================================== */

  function addConnectedEnd() {

    if (
      !requireEdit()
    ) {

      return;

    }


    if (
      typeof createConnectedEnd !==
      "function"
    ) {

      alert(
        "Connected End function is not available."
      );

      return;

    }


    const ends =
      getEnds();


    const newEnd =
      createConnectedEnd();


    ends.push(
      newEnd
    );


    const newEndIndex =
      ends.length - 1;


    refreshLocation(
      newEndIndex,
      null
    );

  }


  /* =====================================================
     ADD LOCATION BOX
  ===================================================== */

  function addLocationBox() {

    if (
      !requireEdit()
    ) {

      return;

    }


    const ends =
      getEnds();


    if (
      !ends.length
    ) {

      alert(
        "Pehle Connected End add karo."
      );

      return;

    }


    const endIndex =
      getActiveEndIndex();


    const end =
      ends[
        endIndex
      ];


    if (!end) {

      alert(
        "Connected End select karo."
      );

      return;

    }


    if (
      typeof createLocation !==
      "function"
    ) {

      alert(
        "Location Box function is not available."
      );

      return;

    }


    end.locations =
      Array.isArray(
        end.locations
      )
        ? end.locations
        : [];


    const location =
      createLocation(
        end
      );


    end.locations.push(
      location
    );


    const locationIndex =
      end.locations.length - 1;


    refreshLocation(
      endIndex,
      locationIndex
    );

  }


  /* =====================================================
     CREATE BUTTONS
  ===================================================== */

  function createControls() {

    const actions =
      document.querySelector(
        ".location-svg-actions"
      );


    if (!actions) {

      return false;

    }


    if (
      document.getElementById(
        "locationAddEndFromDrawing"
      )
    ) {

      return true;

    }


    const addEnd =
      document.createElement(
        "button"
      );


    addEnd.type =
      "button";


    addEnd.id =
      "locationAddEndFromDrawing";


    addEnd.className =
      "location-create-btn";


    addEnd.textContent =
      "+ End";


    const addLocation =
      document.createElement(
        "button"
      );


    addLocation.type =
      "button";


    addLocation.id =
      "locationAddBoxFromDrawing";


    addLocation.className =
      "location-create-btn primary";


    addLocation.textContent =
      "+ Location Box";


    /*
      Keep selectors first,
      then creation controls,
      then Connection / Refresh controls.
    */

    const connectionButton =
      document.getElementById(
        "locationAddConnection"
      );


    if (connectionButton) {

      actions.insertBefore(
        addEnd,
        connectionButton
      );


      actions.insertBefore(
        addLocation,
        connectionButton
      );

    }

    else {

      actions.appendChild(
        addEnd
      );


      actions.appendChild(
        addLocation
      );

    }


    addEnd.addEventListener(
      "click",
      addConnectedEnd
    );


    addLocation.addEventListener(
      "click",
      addLocationBox
    );


    return true;

  }


  /* =====================================================
     START
  ===================================================== */

  function initialize() {

    if (
      initialized
    ) {

      return;

    }


    injectStyles();


    let attempts = 0;


    const timer =
      setInterval(
        function () {

          attempts += 1;


          if (
            createControls()
          ) {

            initialized =
              true;


            clearInterval(
              timer
            );


            window.CTR_LOCATION_CREATE_CONTROLS = {

              version:
                VERSION,

              addEnd:
                addConnectedEnd,

              addLocation:
                addLocationBox

            };


            return;

          }


          if (
            attempts >= 60
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