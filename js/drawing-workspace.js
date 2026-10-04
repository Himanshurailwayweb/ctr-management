/* =========================================================
   CTR MANAGEMENT SYSTEM
   SINGLE DRAWING WORKSPACE
   VERSION 3.0
========================================================= */

(function () {

  "use strict";

  const VERSION = "3.0.0";

  let mounted = false;


  /* =====================================================
     STYLE
  ===================================================== */

  function addStyles() {

    document
      .getElementById("ctrSingleWorkspaceStyle")
      ?.remove();


    const style = document.createElement("style");

    style.id = "ctrSingleWorkspaceStyle";

    style.textContent = `

      #ctrUnifiedWorkspace {
        width: 100%;
        margin: 0 0 26px;
        border: 1px solid #aebcca;
        background: #ffffff;
        overflow: hidden;
      }


      .ctr-workspace-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;

        padding: 14px 16px;

        background: #0c2d53;
        color: #ffffff;
      }


      .ctr-workspace-heading span {
        display: block;

        margin-bottom: 3px;

        color: #bdccdb;

        font-size: 8px;
        font-weight: 700;
        letter-spacing: 1px;
      }


      .ctr-workspace-heading h2 {
        margin: 0;

        color: #ffffff;

        font-size: 18px;
      }


      .ctr-workspace-heading p {
        margin: 4px 0 0;

        color: #d3dde7;

        font-size: 9px;
      }


      .ctr-workspace-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }


      .ctr-workspace-controls label {
        color: #d7e1eb;

        font-size: 9px;
        font-weight: 700;
      }


      #ctrWorkspaceMode {
        min-width: 240px;
        min-height: 36px;

        padding: 0 10px;

        border: 1px solid rgba(255,255,255,.55);
        border-radius: 3px;

        background: #ffffff;
        color: #173e6e;

        font-size: 11px;
        font-weight: 700;
      }


      #ctrWorkspaceRefresh {
        min-height: 36px;

        padding: 0 12px;

        border: 1px solid rgba(255,255,255,.6);
        border-radius: 3px;

        background: transparent;
        color: #ffffff;

        cursor: pointer;

        font-size: 9px;
        font-weight: 700;
      }


      .ctr-workspace-status {
        display: flex;
        align-items: center;
        gap: 7px;

        min-height: 34px;

        padding: 6px 15px;

        border-bottom: 1px solid #d5dee7;

        background: #f4f7f9;

        color: #536b81;

        font-size: 9px;
        font-weight: 600;
      }


      .ctr-workspace-dot {
        width: 7px;
        height: 7px;

        border-radius: 50%;

        background: #287841;
      }


      #ctrWorkspaceBody {
        width: 100%;
        min-width: 0;

        background: #e9edf1;
      }


      .ctr-workspace-panel {
        display: none;

        width: 100%;
        min-width: 0;
      }


      .ctr-workspace-panel.active {
        display: block;
      }


      /*
        Old Station / Location drawing cards are now
        inside the same workspace.
      */

      #ctrWorkspaceBody
      #stationSvgDrawingSection,

      #ctrWorkspaceBody
      #locationSvgDrawingSection {
        margin: 0 !important;

        border: 0 !important;
        border-radius: 0 !important;

        box-shadow: none !important;
      }


      #ctrWorkspaceBody
      #stationSvgHost,

      #ctrWorkspaceBody
      #locationSvgHost {
        width: 100%;
        max-width: 100%;

        overflow-x: auto;
        overflow-y: hidden;
      }


      #ctrWorkspaceBody
      #stationSvgHost svg,

      #ctrWorkspaceBody
      #locationSvgHost svg {
        max-width: none !important;
      }


      .ctr-workspace-footer {
        padding: 8px 15px;

        border-top: 1px solid #d5dee7;

        background: #fafbfd;

        color: #617386;

        font-size: 8px;
      }


      @media (max-width: 760px) {

        .ctr-workspace-header {
          align-items: stretch;
          flex-direction: column;
        }


        .ctr-workspace-controls {
          align-items: stretch;
          flex-direction: column;
        }


        #ctrWorkspaceMode,
        #ctrWorkspaceRefresh {
          width: 100%;
        }

      }

    `;

    document.head.appendChild(style);

  }


  /* =====================================================
     FIND COMPLETE DRAWING CARD
  ===================================================== */

  function findDrawingCard(
    host,
    preferredId
  ) {

    const exact =
      document.getElementById(preferredId);


    if (exact) {
      return exact;
    }


    /*
      Search upwards until we find the card containing
      heading + SVG host.

      Stop before .page-content.
    */

    let current =
      host.parentElement;


    while (
      current &&
      current !== document.body
    ) {

      if (
        current.classList?.contains(
          "page-content"
        )
      ) {
        break;
      }


      const heading =
        current.querySelector(
          "h1, h2, h3"
        );


      if (
        heading &&
        current.contains(host)
      ) {

        return current;

      }


      current =
        current.parentElement;

    }


    return host.parentElement;

  }


  /* =====================================================
     CREATE WORKSPACE
  ===================================================== */

  function createWorkspace() {

    let workspace =
      document.getElementById(
        "ctrUnifiedWorkspace"
      );


    if (workspace) {
      return workspace;
    }


    const anchor =
      document.getElementById(
        "drawing-work-area"
      );


    if (!anchor) {

      console.error(
        "CTR Workspace: drawing-work-area not found."
      );

      return null;

    }


    workspace =
      document.createElement("section");


    workspace.id =
      "ctrUnifiedWorkspace";


    workspace.innerHTML = `

      <div class="ctr-workspace-header">

        <div class="ctr-workspace-heading">

          <span>
            CTR ENGINEERING DRAWING
          </span>

          <h2>
            Drawing Workspace
          </h2>

          <p>
            Complete Station CTR and Location Box engineering drawing
          </p>

        </div>


        <div class="ctr-workspace-controls">

          <label for="ctrWorkspaceMode">
            Drawing
          </label>


          <select id="ctrWorkspaceMode">

            <option value="STATION">
              Station CTR
            </option>

            <option value="LOCATION">
              Connected End / Location Box
            </option>

          </select>


          <button
            type="button"
            id="ctrWorkspaceRefresh"
          >
            Refresh Drawing
          </button>

        </div>

      </div>


      <div class="ctr-workspace-status">

        <span class="ctr-workspace-dot"></span>

        <span id="ctrWorkspaceStatus">
          Station CTR drawing active
        </span>

      </div>


      <div id="ctrWorkspaceBody">

        <div
          id="ctrWorkspaceStation"
          class="ctr-workspace-panel active"
        ></div>


        <div
          id="ctrWorkspaceLocation"
          class="ctr-workspace-panel"
        ></div>

      </div>


      <div class="ctr-workspace-footer">

        Click terminal, row, fuse, rack, Connected End or
        Location Box directly in the drawing to edit it.

      </div>

    `;


    anchor.replaceChildren(
      workspace
    );


    return workspace;

  }


  /* =====================================================
     DRAWING SWITCH
  ===================================================== */

  function setMode(mode) {

    const station =
      document.getElementById(
        "ctrWorkspaceStation"
      );


    const location =
      document.getElementById(
        "ctrWorkspaceLocation"
      );


    const select =
      document.getElementById(
        "ctrWorkspaceMode"
      );


    const status =
      document.getElementById(
        "ctrWorkspaceStatus"
      );


    if (
      !station ||
      !location
    ) {
      return;
    }


    if (
      mode === "LOCATION"
    ) {

      station.classList.remove(
        "active"
      );


      location.classList.add(
        "active"
      );


      if (select) {
        select.value = "LOCATION";
      }


      if (status) {

        status.textContent =
          "Connected End / Location Box drawing active";

      }


      setTimeout(
        function () {

          window
            .CTR_LOCATION_SVG_VIEW
            ?.refresh?.();


          window
            .CTR_LOCATION_CONNECTIONS
            ?.redraw?.();


          window
            .CTR_DRAWING_PROPERTIES
            ?.refresh?.();

        },
        120
      );

    }

    else {

      location.classList.remove(
        "active"
      );


      station.classList.add(
        "active"
      );


      if (select) {
        select.value = "STATION";
      }


      if (status) {

        status.textContent =
          "Station CTR drawing active";

      }


      setTimeout(
        function () {

          window
            .CTR_STATION_SVG_VIEW
            ?.refresh?.();


          window
            .CTR_STATION_CONNECTIONS
            ?.redraw?.();


          window
            .CTR_DRAWING_PROPERTIES
            ?.refresh?.();

        },
        120
      );

    }


    window
      .CTR_DRAWING_PROPERTIES
      ?.close?.();


    try {

      sessionStorage.setItem(
        "ctrDrawingWorkspaceMode",
        mode
      );

    }
    catch (error) {
      /* ignore */
    }

  }


  /* =====================================================
     MOUNT
  ===================================================== */

  function mountWorkspace() {

    if (mounted) {
      return true;
    }


    const stationHost =
      document.getElementById(
        "stationSvgHost"
      );


    const locationHost =
      document.getElementById(
        "locationSvgHost"
      );


    if (
      !stationHost ||
      !locationHost
    ) {

      return false;

    }


    const stationCard =
      findDrawingCard(
        stationHost,
        "stationSvgDrawingSection"
      );


    const locationCard =
      findDrawingCard(
        locationHost,
        "locationSvgDrawingSection"
      );


    if (
      !stationCard ||
      !locationCard
    ) {

      return false;

    }


    if (
      stationCard ===
      locationCard
    ) {

      console.error(
        "CTR Workspace: station and location card resolved to same element."
      );

      return false;

    }


    const workspace =
      createWorkspace();


    if (!workspace) {

      return false;

    }


    const stationPanel =
      document.getElementById(
        "ctrWorkspaceStation"
      );


    const locationPanel =
      document.getElementById(
        "ctrWorkspaceLocation"
      );


    /*
      MOVE original cards.
      There will no longer be separate copies below.
    */

    stationPanel.appendChild(
      stationCard
    );


    locationPanel.appendChild(
      locationCard
    );


    mounted = true;


    bindEvents();


    let savedMode =
      "STATION";


    try {

      if (
        sessionStorage.getItem(
          "ctrDrawingWorkspaceMode"
        ) === "LOCATION"
      ) {

        savedMode =
          "LOCATION";

      }

    }
    catch (error) {
      /* ignore */
    }


    setMode(
      savedMode
    );


    window.CTR_DRAWING_WORKSPACE = {

      version:
        VERSION,

      setMode:
        setMode,

      refresh:
        function () {

          const mode =
            document.getElementById(
              "ctrWorkspaceMode"
            )?.value ||
            "STATION";


          setMode(mode);

        }

    };


    console.log(
      "CTR Drawing Workspace V3 mounted successfully."
    );


    return true;

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  function bindEvents() {

    const select =
      document.getElementById(
        "ctrWorkspaceMode"
      );


    const refresh =
      document.getElementById(
        "ctrWorkspaceRefresh"
      );


    select?.addEventListener(
      "change",
      function () {

        setMode(
          select.value
        );

      }
    );


    refresh?.addEventListener(
      "click",
      function () {

        setMode(
          select?.value ||
          "STATION"
        );

      }
    );

  }


  /* =====================================================
     START

     Drawing sections are generated dynamically,
     so MutationObserver waits for both.
  ===================================================== */

  function start() {

    addStyles();


    if (
      mountWorkspace()
    ) {

      return;

    }


    const observer =
      new MutationObserver(
        function () {

          if (
            mountWorkspace()
          ) {

            observer.disconnect();

          }

        }
      );


    observer.observe(
      document.body,
      {
        childList:
          true,

        subtree:
          true
      }
    );


    /*
      Extra fallback because Supabase draft load may cause
      delayed rerender.
    */

    [
      500,
      1000,
      2000,
      3500,
      5000
    ]
      .forEach(
        function (delay) {

          setTimeout(
            mountWorkspace,
            delay
          );

        }
      );

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  }

  else {

    start();

  }

})();