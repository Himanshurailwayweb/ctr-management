/* =========================================================
   CTR MANAGEMENT SYSTEM
   ENGINEERING DRAWING UI V3

   Purpose:
   - Larger readable fuse / terminal drawing
   - PDF-like engineering presentation
   - Row A / B / C shown correctly
   - Fuse column terminology
   - Existing station.js logic remains untouched
========================================================= */

(function () {

  "use strict";


  /* =====================================================
     DRAWING CSS
  ===================================================== */

  function injectDrawingStyles() {

    document
      .getElementById(
        "ctrEngineeringDrawingV3"
      )
      ?.remove();


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "ctrEngineeringDrawingV3";


    style.textContent = `

      /* ===============================================
         MAIN DRAWING PAPER
      =============================================== */

      .ctr-rack-card {

        border:
          1px solid #303030 !important;

        border-radius:
          0 !important;

        background:
          #ffffff !important;

        box-shadow:
          none !important;
      }


      .rack-drawing {

        width:
          100% !important;

        max-width:
          100% !important;

        padding:
          22px
          28px
          32px !important;

        overflow-x:
          auto !important;

        background:
          #ffffff !important;

        color:
          #111111 !important;

        overscroll-behavior-x:
          contain;
      }


      /* ===============================================
         RACK HEADING
      =============================================== */

      .station-rack-title-area {

        text-align:
          center !important;
      }


      .station-rack-title-area > span {

        color:
          #111111 !important;

        font-size:
          11px !important;

        font-weight:
          500 !important;
      }


      .station-rack-name-input {

        width:
          230px !important;

        max-width:
          100% !important;

        color:
          #111111 !important;

        font-size:
          20px !important;

        font-weight:
          700 !important;

        text-align:
          center !important;
      }


      /* ===============================================
         FUSE DRAWING SECTION
      =============================================== */

      .rack-fuse-section,
      .location-fuse-box {

        width:
          100% !important;

        min-height:
          0 !important;

        height:
          auto !important;

        margin:
          0 !important;

        padding:
          12px
          10px
          22px !important;

        overflow-x:
          auto !important;

        border:
          0 !important;

        border-bottom:
          1px solid #8d8d8d !important;

        border-radius:
          0 !important;

        background:
          #ffffff !important;
      }


      /* ===============================================
         FUSE HEADING
      =============================================== */

      .fuse-builder-header {

        position:
          relative !important;

        display:
          flex !important;

        justify-content:
          center !important;

        align-items:
          flex-start !important;

        min-height:
          62px !important;

        margin:
          0
          0
          10px !important;

        padding:
          0 !important;
      }


      .fuse-builder-header > div {

        text-align:
          center !important;
      }


      .fuse-builder-header span {

        display:
          block !important;

        margin-bottom:
          4px !important;

        color:
          #222222 !important;

        font-size:
          11px !important;

        font-weight:
          500 !important;

        letter-spacing:
          0.3px !important;
      }


      .fuse-builder-header strong {

        display:
          inline-block !important;

        color:
          #111111 !important;

        font-size:
          18px !important;

        font-weight:
          700 !important;

        line-height:
          1.2 !important;

        text-decoration:
          underline !important;

        text-underline-offset:
          4px !important;
      }


      /* ===============================================
         ADD FUSE COLUMN BUTTON
      =============================================== */

      .fuse-builder-header
      .add-conductor-btn {

        position:
          absolute !important;

        top:
          0 !important;

        right:
          0 !important;

        min-width:
          145px !important;

        min-height:
          34px !important;

        margin:
          0 !important;

        padding:
          6px
          12px !important;

        border:
          1px solid #59636c !important;

        border-radius:
          2px !important;

        background:
          #ffffff !important;

        color:
          #222222 !important;

        font-size:
          11px !important;

        font-weight:
          700 !important;

        white-space:
          nowrap !important;

        box-shadow:
          none !important;
      }


      .fuse-builder-header
      .add-conductor-btn:hover {

        background:
          #edf1f4 !important;
      }


      /* ===============================================
         FUSE STRIP
      =============================================== */

      .pdf-fuse-strip {

        display:
          flex !important;

        align-items:
          flex-start !important;

        justify-content:
          flex-start !important;

        gap:
          8px !important;

        width:
          max-content !important;

        min-width:
          100% !important;

        min-height:
          175px !important;

        padding:
          14px
          24px
          18px !important;

        overflow:
          visible !important;

        border:
          0 !important;

        background:
          #ffffff !important;
      }


      /* ===============================================
         EACH FUSE COLUMN
      =============================================== */

      .pdf-fuse-item {

        position:
          relative !important;

        flex:
          0
          0
          145px !important;

        width:
          145px !important;

        min-width:
          145px !important;

        display:
          flex !important;

        flex-direction:
          column !important;

        align-items:
          center !important;

        padding:
          2px
          5px !important;

        border:
          0 !important;

        border-radius:
          0 !important;

        background:
          transparent !important;

        color:
          #111111 !important;

        box-shadow:
          none !important;
      }


      /* ===============================================
         TEXT ABOVE FUSE SYMBOL
      =============================================== */

      .pdf-fuse-caption {

        width:
          100% !important;

        min-height:
          62px !important;

        display:
          flex !important;

        flex-direction:
          column !important;

        align-items:
          center !important;

        justify-content:
          flex-end !important;

        gap:
          3px !important;

        padding:
          0
          3px
          7px !important;

        color:
          #111111 !important;

        text-align:
          center !important;
      }


      .pdf-fuse-caption strong {

        width:
          100% !important;

        max-width:
          138px !important;

        color:
          #111111 !important;

        font-size:
          11px !important;

        font-weight:
          500 !important;

        line-height:
          1.15 !important;

        white-space:
          normal !important;

        overflow:
          visible !important;

        text-overflow:
          clip !important;

        overflow-wrap:
          anywhere !important;
      }


      .pdf-fuse-caption span {

        color:
          #444444 !important;

        font-size:
          9px !important;

        font-weight:
          400 !important;

        line-height:
          1.1 !important;
      }


      /* ===============================================
         LARGE FUSE SYMBOL
      =============================================== */

      .pdf-fuse-symbol-btn {

        width:
          116px !important;

        height:
          100px !important;

        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          center !important;

        padding:
          0 !important;

        border:
          0 !important;

        border-radius:
          0 !important;

        background:
          transparent !important;

        color:
          #111111 !important;

        box-shadow:
          none !important;
      }


      .pdf-fuse-symbol-btn:hover {

        background:
          #f3f3f3 !important;
      }


      .pdf-fuse-symbol-btn svg {

        width:
          108px !important;

        height:
          92px !important;

        max-width:
          none !important;

        overflow:
          visible !important;
      }


      .pdf-fuse-label {

        min-height:
          20px !important;

        margin-top:
          2px !important;

        color:
          #111111 !important;

        font-size:
          10px !important;

        font-weight:
          500 !important;
      }


      /* "Click symbol to edit" not part of technical sheet */

      .pdf-fuse-note {

        display:
          none !important;
      }


      /* ===============================================
         FUSE REMOVE
      =============================================== */

      .pdf-fuse-remove {

        position:
          absolute !important;

        top:
          0 !important;

        right:
          5px !important;

        z-index:
          5 !important;

        width:
          19px !important;

        height:
          19px !important;

        padding:
          0 !important;

        border:
          1px solid #c70000 !important;

        border-radius:
          50% !important;

        background:
          #ffffff !important;

        color:
          #c70000 !important;

        font-size:
          11px !important;

        font-weight:
          500 !important;

        line-height:
          16px !important;
      }


      /* ===============================================
         TERMINAL SECTION HEADING
      =============================================== */

      .rack-builder-toolbar {

        position:
          relative !important;

        display:
          flex !important;

        align-items:
          center !important;

        justify-content:
          center !important;

        min-height:
          70px !important;

        margin:
          0 !important;

        padding:
          14px
          0
          11px !important;

        text-align:
          center !important;
      }


      .rack-builder-toolbar > div {

        text-align:
          center !important;
      }


      .rack-sub-label {

        display:
          block !important;

        color:
          #222222 !important;

        font-size:
          11px !important;

        font-weight:
          500 !important;
      }


      .rack-builder-toolbar h4 {

        margin:
          4px
          0
          0 !important;

        color:
          #111111 !important;

        font-size:
          18px !important;

        font-weight:
          700 !important;

        text-decoration:
          underline !important;

        text-underline-offset:
          4px !important;
      }


      .rack-builder-toolbar
      > .builder-action-btn {

        position:
          absolute !important;

        top:
          14px !important;

        right:
          0 !important;
      }


      /* ===============================================
         ROW DRAWING
      =============================================== */

      .dynamic-rack-row,
      .location-row-block {

        position:
          relative !important;

        display:
          grid !important;

        grid-template-columns:
          72px
          max-content !important;

        column-gap:
          10px !important;

        width:
          100% !important;

        max-width:
          100% !important;

        min-height:
          205px !important;

        margin:
          0 !important;

        padding:
          16px
          12px
          22px !important;

        overflow-x:
          auto !important;

        overflow-y:
          hidden !important;

        border:
          0 !important;

        border-top:
          1px solid #8e8e8e !important;

        border-radius:
          0 !important;

        background:
          #ffffff !important;

        box-shadow:
          none !important;

        overscroll-behavior-x:
          contain;
      }


      /* ===============================================
         ROW CIRCLE A / B / C / D
      =============================================== */

      .dynamic-row-header {

        grid-column:
          1 !important;

        display:
          flex !important;

        flex-direction:
          column !important;

        align-items:
          center !important;

        justify-content:
          flex-start !important;

        gap:
          8px !important;

        padding:
          70px
          0
          0 !important;

        margin:
          0 !important;
      }


      .dynamic-row-header
      > div:first-child > span {

        display:
          none !important;
      }


      .dynamic-row-header h4,
      .location-row-block
      .dynamic-row-header > strong {

        width:
          36px !important;

        height:
          36px !important;

        display:
          grid !important;

        place-items:
          center !important;

        margin:
          0 !important;

        padding:
          0 !important;

        border:
          1px solid #333333 !important;

        border-radius:
          50% !important;

        background:
          #ffffff !important;

        color:
          #111111 !important;

        font-size:
          13px !important;

        font-weight:
          500 !important;

        line-height:
          1 !important;

        white-space:
          nowrap !important;
      }


      /* ===============================================
         EDIT CONTROLS AWAY FROM DRAWING
      =============================================== */

      .row-header-actions {

        position:
          absolute !important;

        top:
          9px !important;

        right:
          10px !important;

        z-index:
          10 !important;

        display:
          flex !important;

        flex-direction:
          row !important;

        gap:
          8px !important;

        width:
          auto !important;

        margin:
          0 !important;
      }


      .row-header-actions button {

        width:
          auto !important;

        min-width:
          105px !important;

        height:
          32px !important;

        min-height:
          32px !important;

        margin:
          0 !important;

        padding:
          5px
          10px !important;

        font-size:
          10px !important;

        font-weight:
          700 !important;

        line-height:
          1 !important;

        white-space:
          nowrap !important;
      }


      /* ===============================================
         TERMINAL STRIP
      =============================================== */

      .terminal-strip,
      .dynamic-strip {

        position:
          relative !important;

        grid-column:
          2 !important;

        display:
          flex !important;

        align-items:
          flex-start !important;

        gap:
          5px !important;

        width:
          max-content !important;

        min-width:
          100% !important;

        max-width:
          none !important;

        padding:
          60px
          22px
          24px !important;

        overflow:
          visible !important;

        border:
          0 !important;

        background:
          #ffffff !important;
      }


      /* continuous line behind terminals */

      .terminal-strip::before,
      .dynamic-strip::before {

        content:
          "" !important;

        position:
          absolute !important;

        left:
          22px !important;

        right:
          22px !important;

        top:
          137px !important;

        z-index:
          0 !important;

        height:
          1px !important;

        background:
          #111111 !important;
      }


      /* ===============================================
         TERMINAL SYMBOL
      =============================================== */

      .terminal {

        position:
          relative !important;

        z-index:
          2 !important;

        flex:
          0
          0
          82px !important;

        width:
          82px !important;

        min-width:
          82px !important;

        min-height:
          155px !important;

        display:
          flex !important;

        flex-direction:
          column !important;

        align-items:
          center !important;

        justify-content:
          flex-start !important;

        padding:
          0
          5px !important;

        border:
          0 !important;

        border-radius:
          0 !important;

        background:
          transparent !important;

        color:
          #111111 !important;

        box-shadow:
          none !important;
      }


      .terminal:hover {

        background:
          #f3f3f3 !important;
      }


      .terminal.in-use {

        background:
          transparent !important;
      }


      /* ===============================================
         PARTICULAR ABOVE TERMINAL
      =============================================== */

      .terminal-particular {

        order:
          1 !important;

        width:
          100% !important;

        max-width:
          78px !important;

        height:
          50px !important;

        display:
          flex !important;

        align-items:
          flex-end !important;

        justify-content:
          center !important;

        margin:
          0 !important;

        padding:
          0
          2px
          7px !important;

        overflow:
          visible !important;

        color:
          #111111 !important;

        font-size:
          10px !important;

        font-weight:
          500 !important;

        line-height:
          1.1 !important;

        text-align:
          center !important;

        white-space:
          normal !important;

        text-overflow:
          clip !important;

        overflow-wrap:
          anywhere !important;
      }


      /* ===============================================
         STATUS
      =============================================== */

      .terminal strong {

        order:
          2 !important;

        height:
          16px !important;

        margin:
          0 !important;

        color:
          #111111 !important;

        font-size:
          8px !important;

        font-weight:
          400 !important;
      }


      /* ===============================================
         VERTICAL TERMINAL LINE
      =============================================== */

      .terminal
      > .terminal-line:nth-child(2) {

        order:
          3 !important;

        width:
          1px !important;

        height:
          27px !important;

        margin:
          0 !important;

        background:
          #111111 !important;
      }


      /* connection point */

      .terminal-point {

        order:
          4 !important;

        width:
          10px !important;

        height:
          10px !important;

        flex:
          0
          0
          10px !important;

        margin:
          0 !important;

        border:
          1.5px solid #111111 !important;

        border-radius:
          50% !important;

        background:
          #ffffff !important;
      }


      /* second line unnecessary in PDF row */

      .terminal
      > .terminal-line:nth-child(4) {

        display:
          none !important;
      }


      /* terminal number below point */

      .terminal-number {

        order:
          5 !important;

        min-width:
          24px !important;

        margin-top:
          8px !important;

        padding:
          0
          2px !important;

        background:
          #ffffff !important;

        color:
          #111111 !important;

        font-size:
          10px !important;

        font-weight:
          500 !important;

        line-height:
          1 !important;
      }


      /* ===============================================
         REMOVE TERMINAL X
      =============================================== */

      .remove-conductor-btn {

        position:
          relative !important;

        z-index:
          5 !important;

        flex:
          0
          0
          18px !important;

        width:
          18px !important;

        min-width:
          18px !important;

        height:
          18px !important;

        margin:
          128px
          0
          0
          -10px !important;

        padding:
          0 !important;

        border:
          1px solid #c70000 !important;

        border-radius:
          50% !important;

        background:
          #ffffff !important;

        color:
          #c70000 !important;

        font-size:
          10px !important;

        font-weight:
          500 !important;

        line-height:
          15px !important;
      }


      /* ===============================================
         VIEW MODE = CLEAN DRAWING
      =============================================== */

      body[data-station-edit-mode="view"]
      .row-header-actions,

      body[data-station-edit-mode="view"]
      .pdf-fuse-remove,

      body[data-station-edit-mode="view"]
      .remove-conductor-btn,

      body[data-station-edit-mode="view"]
      .fuse-builder-header
      .add-conductor-btn,

      body[data-station-edit-mode="view"]
      .rack-builder-toolbar
      > .builder-action-btn {

        display:
          none !important;
      }


      /* ===============================================
         MOBILE

         Page itself stays inside viewport.
         Engineering drawing scrolls internally.
      =============================================== */

      @media
      (max-width: 760px) {

        .rack-drawing {

          padding:
            14px
            10px
            24px !important;
        }


        .pdf-fuse-item {

          flex-basis:
            125px !important;

          width:
            125px !important;

          min-width:
            125px !important;
        }


        .pdf-fuse-symbol-btn {

          width:
            100px !important;

          height:
            90px !important;
        }


        .pdf-fuse-symbol-btn svg {

          width:
            94px !important;

          height:
            84px !important;
        }


        .dynamic-rack-row,
        .location-row-block {

          display:
            block !important;

          padding-top:
            12px !important;
        }


        .dynamic-row-header {

          position:
            relative !important;

          width:
            100% !important;

          flex-direction:
            row !important;

          justify-content:
            flex-start !important;

          padding:
            0
            6px
            10px !important;
        }


        .row-header-actions {

          position:
            static !important;

          margin-left:
            auto !important;
        }


        .terminal-strip,
        .dynamic-strip {

          width:
            max-content !important;

          min-width:
            900px !important;

          padding-top:
            60px !important;
        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =====================================================
     CORRECT ROW LABEL

     Existing station.js writes "ROW A".
     PDF-style circle should show just "A".
  ===================================================== */

  function fixRowLabels() {

    document
      .querySelectorAll(
        ".dynamic-row-header h4"
      )
      .forEach(
        function (heading) {

          const text =
            heading.textContent
              .trim();


          const match =
            text.match(
              /^ROW\\s+(.+)$/i
            );


          if (
            match &&
            heading.textContent !==
            match[1]
          ) {

            heading.textContent =
              match[1];

          }

        }
      );


    document
      .querySelectorAll(
        ".location-row-block .dynamic-row-header > strong"
      )
      .forEach(
        function (heading) {

          const text =
            heading.textContent
              .trim();


          const match =
            text.match(
              /^ROW\\s+(.+)$/i
            );


          if (
            match &&
            heading.textContent !==
            match[1]
          ) {

            heading.textContent =
              match[1];

          }

        }
      );

  }


  /* =====================================================
     FUSE COLUMN BUTTON

     Current data model stores each fuse drawing item as
     one item inside rack.fuseDetails, which is rendered
     horizontally. Therefore one added fuse item is one
     visible fuse column.
  ===================================================== */

  function updateFuseButtons() {

    document
      .querySelectorAll(
        ".fuse-builder-header .add-conductor-btn"
      )
      .forEach(
        function (button) {

          const text =
            button.textContent
              .trim()
              .toLowerCase();


          if (
            text.includes("fuse") &&
            button.textContent !==
            "+ Add Fuse Column"
          ) {

            button.textContent =
              "+ Add Fuse Column";


            button.title =
              "Add a new fuse column";

          }

        }
      );

  }


  /* =====================================================
     DRAWING ENHANCEMENTS
  ===================================================== */

  function applyDrawingEnhancements() {

    fixRowLabels();

    updateFuseButtons();

  }


  /* =====================================================
     START
  ===================================================== */

  function start() {

    injectDrawingStyles();

    applyDrawingEnhancements();


    /*
      station.js recreates drawing elements whenever
      racks, rows, terminals or fuse points change.
    */

    const observer =
      new MutationObserver(
        function () {

          applyDrawingEnhancements();

        }
      );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
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