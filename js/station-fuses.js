/* =========================================================
   CTR MANAGEMENT SYSTEM
   STATION SVG FUSE LINK EDITOR

   VERSION 1.0

   FEATURES
   ---------------------------------------------------------
   - + Fuse
   - Click SVG fuse to edit
   - Fuse No. / Label
   - Fuse Particular
   - Terminal A
   - Terminal B
   - Save / Edit / Remove Fuse
   - Actual engineering fuse link above terminals
   - Automatic route lanes
   - Editable particulars
   - Existing station draft storage preserved

   STORAGE
   ---------------------------------------------------------
   stationCtrRacks[n].fuseDetails[n] = {
     id,
     label,
     details,
     terminalAId,
     terminalBId
   }
========================================================= */

(function () {

  "use strict";


  const VERSION =
    "1.0.0";


  let editingFuseId =
    null;


  let redrawTimer =
    null;


  /* =====================================================
     BASIC
  ===================================================== */

  function createId() {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
      "function"
    ) {

      return (
        "FUSE-" +
        window.crypto.randomUUID()
      );

    }


    return (
      "FUSE-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(16)
        .slice(2)
    );

  }


  function requireEditAccess() {

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
     RACK ACCESS
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
        "CTR Fuse: Station racks unavailable.",
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
        ) ||
        0
      );

    }


    return (
      Number(
        document.getElementById(
          "stationSvgRackSelect"
        )?.value
      ) ||
      0
    );

  }


  function getActiveRack() {

    return (
      getStationRacks()[
        getActiveRackIndex()
      ] ||
      null
    );

  }


  function ensureFuseData(
    rack
  ) {

    if (!rack) {

      return [];

    }


    if (
      !Array.isArray(
        rack.fuseDetails
      )
    ) {

      rack.fuseDetails =
        [];

    }


    rack.fuseDetails
      .forEach(
        function (
          fuse,
          index
        ) {

          fuse.id =
            fuse.id ||
            createId();


          fuse.label =
            fuse.label ||
            `F${index + 1}`;


          fuse.details =
            fuse.details ||
            "";


          fuse.terminalAId =
            fuse.terminalAId ||
            "";


          fuse.terminalBId =
            fuse.terminalBId ||
            "";

        }
      );


    return rack.fuseDetails;

  }


  /* =====================================================
     TERMINAL LOOKUP
  ===================================================== */

  function findTerminal(
    rack,
    terminalId
  ) {

    if (
      !rack ||
      !terminalId
    ) {

      return null;

    }


    const rows =
      Array.isArray(
        rack.rows
      )
        ? rack.rows
        : [];


    for (
      let rowIndex = 0;
      rowIndex < rows.length;
      rowIndex += 1
    ) {

      const row =
        rows[
          rowIndex
        ];


      const terminals =
        Array.isArray(
          row.terminals
        )
          ? row.terminals
          : [];


      for (
        let terminalIndex = 0;
        terminalIndex <
        terminals.length;
        terminalIndex += 1
      ) {

        const terminal =
          terminals[
            terminalIndex
          ];


        if (
          String(
            terminal.id
          ) ===
          String(
            terminalId
          )
        ) {

          return {

            row:
              row,

            terminal:
              terminal,

            rowIndex:
              rowIndex,

            terminalIndex:
              terminalIndex

          };

        }

      }

    }


    return null;

  }


  function describeTerminal(
    rack,
    terminalId
  ) {

    const found =
      findTerminal(
        rack,
        terminalId
      );


    if (!found) {

      return "Unassigned";

    }


    return (
      `${found.row.label}-` +
      `${Number(
        found.terminal.number
      ) || found.terminal.number}`
    );

  }


  /* =====================================================
     STYLE
  ===================================================== */

  function injectStyles() {

    if (
      document.getElementById(
        "stationFuseStyles"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "stationFuseStyles";


    style.textContent = `

      #stationAddFuse {

        min-height:
          34px;

        padding:
          0 11px;

        border:
          1px solid #173e6e;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #173e6e;

        cursor:
          pointer;

        font-size:
          10px;

        font-weight:
          700;

      }


      #stationFusePanel {

        position:
          fixed;

        top:
          145px;

        right:
          18px;

        z-index:
          5100;

        width:
          360px;

        max-height:
          calc(100vh - 170px);

        overflow-y:
          auto;

        border:
          1px solid #b9c6d2;

        border-radius:
          4px;

        background:
          #ffffff;

        box-shadow:
          0 8px 30px
          rgba(0,0,0,0.22);

        font-family:
          Arial,
          Helvetica,
          sans-serif;

      }


      #stationFusePanel[hidden] {

        display:
          none !important;

      }


      .station-fuse-head {

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


      .station-fuse-head span {

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


      .station-fuse-head strong {

        font-size:
          14px;

      }


      .station-fuse-head button {

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


      .station-fuse-body {

        padding:
          14px;

      }


      .station-fuse-field {

        margin-bottom:
          12px;

      }


      .station-fuse-field label {

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


      .station-fuse-field input,
      .station-fuse-field select,
      .station-fuse-field textarea {

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

        font-family:
          Arial,
          sans-serif;

        font-size:
          12px;

      }


      .station-fuse-field input,
      .station-fuse-field select {

        height:
          37px;

        padding:
          0 9px;

      }


      .station-fuse-field textarea {

        min-height:
          75px;

        padding:
          8px;

        resize:
          vertical;

      }


      .station-fuse-info {

        margin-bottom:
          12px;

        padding:
          8px 9px;

        border-left:
          3px solid #7891aa;

        background:
          #f5f7f9;

        color:
          #647789;

        font-size:
          9px;

        line-height:
          1.45;

      }


      .station-fuse-actions {

        display:
          flex;

        gap:
          8px;

      }


      .station-fuse-actions button {

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


      #stationFuseSave {

        flex:
          1;

        border:
          1px solid #173e6e;

        background:
          #173e6e;

        color:
          #ffffff;

      }


      #stationFuseCancel {

        border:
          1px solid #bdc8d3;

        background:
          #ffffff;

        color:
          #42586d;

      }


      #stationFuseRemove {

        width:
          100%;

        min-height:
          37px;

        margin-top:
          8px;

        border:
          1px solid #b42318;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #a51f16;

        cursor:
          pointer;

        font-size:
          10px;

        font-weight:
          700;

      }


      /* ===============================================
         SVG FUSE LINK
      =============================================== */

      .ctr-fuse-link-visible {

        fill:
          none;

        stroke:
          #111111;

        stroke-width:
          1.4;

        stroke-linecap:
          round;

        stroke-linejoin:
          round;

      }


      .ctr-fuse-link-body {

        fill:
          #ffffff;

        stroke:
          #111111;

        stroke-width:
          1.2;

      }


      .ctr-fuse-link-hit {

        fill:
          none;

        stroke:
          transparent;

        stroke-width:
          14;

        pointer-events:
          stroke;

        cursor:
          pointer;

      }


      [data-ctr-fuse-link]:hover
      .ctr-fuse-link-visible {

        stroke:
          #165b94;

        stroke-width:
          2.3;

      }


      [data-ctr-fuse-link]:hover
      .ctr-fuse-link-body {

        stroke:
          #165b94;

        stroke-width:
          2;

      }


      .ctr-fuse-link-label {

        fill:
          #111111;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        font-size:
          7px;

        font-weight:
          600;

        text-anchor:
          middle;

        pointer-events:
          none;

      }


      @media
      (max-width: 760px) {

        #stationFusePanel {

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
     ADD HEADER BUTTON
  ===================================================== */

  function createHeaderButton() {

    const actions =
      document.querySelector(
        ".station-svg-actions"
      );


    if (
      !actions ||
      document.getElementById(
        "stationAddFuse"
      )
    ) {

      return;

    }


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.id =
      "stationAddFuse";


    button.textContent =
      "+ Fuse";


    const connectionButton =
      document.getElementById(
        "stationAddConnection"
      );


    if (
      connectionButton
    ) {

      actions.insertBefore(
        button,
        connectionButton
      );

    }

    else {

      actions.appendChild(
        button
      );

    }

  }


  /* =====================================================
     PANEL
  ===================================================== */

  function createPanel() {

    if (
      document.getElementById(
        "stationFusePanel"
      )
    ) {

      return;

    }


    const panel =
      document.createElement(
        "aside"
      );


    panel.id =
      "stationFusePanel";


    panel.hidden =
      true;


    panel.innerHTML = `

      <div class="station-fuse-head">

        <div>

          <span>
            FUSE PROPERTIES
          </span>

          <strong id="stationFuseTitle">
            New Fuse
          </strong>

        </div>


        <button
          type="button"
          id="stationFuseClose"
        >
          ×
        </button>

      </div>


      <div class="station-fuse-body">


        <div class="station-fuse-field">

          <label for="stationFuseLabel">
            Fuse No. / Label
          </label>

          <input
            type="text"
            id="stationFuseLabel"
            placeholder="Example: F1"
          >

        </div>


        <div class="station-fuse-field">

          <label for="stationFuseParticular">
            Fuse Particular / Circuit
          </label>

          <textarea
            id="stationFuseParticular"
            placeholder="Example: B24V BPAC(SB)"
          ></textarea>

        </div>


        <div class="station-fuse-field">

          <label for="stationFuseTerminalA">
            Terminal A
          </label>

          <select id="stationFuseTerminalA">
          </select>

        </div>


        <div class="station-fuse-field">

          <label for="stationFuseTerminalB">
            Terminal B
          </label>

          <select id="stationFuseTerminalB">
          </select>

        </div>


        <div class="station-fuse-info">

          Fuse link terminal ke upper contact se
          engineering drawing me automatically connect hoga.

        </div>


        <div class="station-fuse-actions">

          <button
            type="button"
            id="stationFuseSave"
          >
            Save Fuse
          </button>


          <button
            type="button"
            id="stationFuseCancel"
          >
            Cancel
          </button>

        </div>


        <button
          type="button"
          id="stationFuseRemove"
          hidden
        >
          Remove Fuse
        </button>


      </div>

    `;


    document.body.appendChild(
      panel
    );

  }


  /* =====================================================
     TERMINAL SELECT
  ===================================================== */

  function populateTerminalSelect(
    select,
    selectedValue = ""
  ) {

    const rack =
      getActiveRack();


    if (
      !select ||
      !rack
    ) {

      return;

    }


    select.replaceChildren();


    const empty =
      document.createElement(
        "option"
      );


    empty.value =
      "";


    empty.textContent =
      "Select terminal";


    select.appendChild(
      empty
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

                const option =
                  document.createElement(
                    "option"
                  );


                option.value =
                  terminal.id;


                option.textContent =
                  `${row.label}-${Number(
                    terminal.number
                  ) || terminal.number}`;


                select.appendChild(
                  option
                );

              }
            );

        }
      );


    if (
      selectedValue
    ) {

      select.value =
        selectedValue;

    }

  }


  function populateTerminalSelects(
    a = "",
    b = ""
  ) {

    populateTerminalSelect(
      document.getElementById(
        "stationFuseTerminalA"
      ),
      a
    );


    populateTerminalSelect(
      document.getElementById(
        "stationFuseTerminalB"
      ),
      b
    );

  }


  /* =====================================================
     PANEL OPEN
  ===================================================== */

  function openFusePanel(
    fuse = null
  ) {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    editingFuseId =
      fuse?.id ||
      null;


    populateTerminalSelects(
      fuse?.terminalAId ||
      "",

      fuse?.terminalBId ||
      ""
    );


    document.getElementById(
      "stationFuseTitle"
    ).textContent =
      fuse
        ? "Edit Fuse"
        : "New Fuse";


    document.getElementById(
      "stationFuseLabel"
    ).value =
      fuse?.label ||
      "";


    document.getElementById(
      "stationFuseParticular"
    ).value =
      fuse?.details ||
      "";


    document.getElementById(
      "stationFuseRemove"
    ).hidden =
      !fuse;


    document.getElementById(
      "stationFusePanel"
    ).hidden =
      false;

  }


  function closeFusePanel() {

    const panel =
      document.getElementById(
        "stationFusePanel"
      );


    if (panel) {

      panel.hidden =
        true;

    }


    editingFuseId =
      null;

  }


  /* =====================================================
     SAVE
  ===================================================== */

  function saveFuse() {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    const rack =
      getActiveRack();


    if (!rack) {

      return;

    }


    const fuses =
      ensureFuseData(
        rack
      );


    const terminalAId =
      document.getElementById(
        "stationFuseTerminalA"
      ).value;


    const terminalBId =
      document.getElementById(
        "stationFuseTerminalB"
      ).value;


    if (
      !terminalAId ||
      !terminalBId
    ) {

      alert(
        "Select Terminal A and Terminal B."
      );


      return;

    }


    if (
      terminalAId ===
      terminalBId
    ) {

      alert(
        "Both fuse terminals cannot be the same."
      );


      return;

    }


    let fuse =
      editingFuseId
        ? fuses.find(
            function (
              item
            ) {

              return (
                item.id ===
                editingFuseId
              );

            }
          )
        : null;


    if (!fuse) {

      fuse = {

        id:
          createId()

      };


      fuses.push(
        fuse
      );

    }


    fuse.label =
      document.getElementById(
        "stationFuseLabel"
      ).value.trim() ||
      `F${fuses.indexOf(fuse) + 1}`;


    fuse.details =
      document.getElementById(
        "stationFuseParticular"
      ).value.trim();


    fuse.terminalAId =
      terminalAId;


    fuse.terminalBId =
      terminalBId;


    fuse.updatedAt =
      new Date()
        .toISOString();


    /*
       Old builder refresh.
    */

    if (
      typeof renderStationCtrRacks ===
      "function"
    ) {

      renderStationCtrRacks();

    }


    /*
       SVG refresh.
    */

    window.CTR_STATION_SVG_VIEW
      ?.refresh();


    setTimeout(
      drawFuseLinks,
      120
    );


    closeFusePanel();

  }


  /* =====================================================
     REMOVE
  ===================================================== */

  function removeFuse() {

    if (
      !requireEditAccess()
    ) {

      return;

    }


    const rack =
      getActiveRack();


    if (
      !rack ||
      !editingFuseId
    ) {

      return;

    }


    const fuses =
      ensureFuseData(
        rack
      );


    const fuse =
      fuses.find(
        function (
          item
        ) {

          return (
            item.id ===
            editingFuseId
          );

        }
      );


    if (!fuse) {

      return;

    }


    if (
      !confirm(
        `Remove ${fuse.label || "this fuse"}?`
      )
    ) {

      return;

    }


    const index =
      fuses.indexOf(
        fuse
      );


    if (
      index !==
      -1
    ) {

      fuses.splice(
        index,
        1
      );

    }


    if (
      typeof renderStationCtrRacks ===
      "function"
    ) {

      renderStationCtrRacks();

    }


    window.CTR_STATION_SVG_VIEW
      ?.refresh();


    closeFusePanel();


    setTimeout(
      drawFuseLinks,
      120
    );

  }


  /* =====================================================
     SVG TERMINAL TOP POINT
  ===================================================== */

  function getTerminalTopPoint(
    svg,
    rack,
    terminalId
  ) {

    const found =
      findTerminal(
        rack,
        terminalId
      );


    if (!found) {

      return null;

    }


    const group =
      svg.querySelector(
        `[data-ctr-object="terminal"][data-row-index="${found.rowIndex}"][data-terminal-index="${found.terminalIndex}"]`
      );


    if (!group) {

      return null;

    }


    const circles =
      group.querySelectorAll(
        "circle"
      );


    if (
      !circles.length
    ) {

      return null;

    }


    /*
       First circle = top port.
    */

    const topCircle =
      circles[
        0
      ];


    return {

      x:
        Number(
          topCircle.getAttribute(
            "cx"
          )
        ),

      y:
        Number(
          topCircle.getAttribute(
            "cy"
          )
        ),

      rowIndex:
        found.rowIndex

    };

  }


  /* =====================================================
     SVG HELPERS
  ===================================================== */

  function createSvg(
    name
  ) {

    return document.createElementNS(
      "http://www.w3.org/2000/svg",
      name
    );

  }


  function addFuseLabel(
    group,
    text,
    x,
    y
  ) {

    const label =
      createSvg(
        "text"
      );


    label.setAttribute(
      "x",
      x
    );


    label.setAttribute(
      "y",
      y
    );


    label.setAttribute(
      "class",
      "ctr-fuse-link-label"
    );


    label.textContent =
      text;


    group.appendChild(
      label
    );


    return label;

  }


  /* =====================================================
     WRAP PARTICULAR
  ===================================================== */

  function wrapText(
    value,
    maxLength = 14
  ) {

    const words =
      String(
        value ||
        ""
      )
        .trim()
        .split(
          /\s+/
        )
        .filter(
          Boolean
        );


    const lines =
      [];


    let current =
      "";


    words.forEach(
      function (
        word
      ) {

        const candidate =
          current
            ? `${current} ${word}`
            : word;


        if (
          candidate.length <=
          maxLength
        ) {

          current =
            candidate;

        }

        else {

          if (
            current
          ) {

            lines.push(
              current
            );

          }


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


    return lines.slice(
      0,
      3
    );

  }


  /* =====================================================
     DRAW ONE FUSE LINK
  ===================================================== */

  function drawSingleFuseLink(
    layer,
    svg,
    rack,
    fuse,
    fuseIndex
  ) {

    if (
      !fuse.terminalAId ||
      !fuse.terminalBId
    ) {

      return;

    }


    const a =
      getTerminalTopPoint(
        svg,
        rack,
        fuse.terminalAId
      );


    const b =
      getTerminalTopPoint(
        svg,
        rack,
        fuse.terminalBId
      );


    if (
      !a ||
      !b
    ) {

      return;

    }


    /*
       Different lanes avoid fuse links sitting
       directly on top of each other.

       Each row gets its own lane sequence.
    */

    const sameRowFuseIndex =
      ensureFuseData(
        rack
      )
        .filter(
          function (
            item,
            index
          ) {

            if (
              index >= fuseIndex
            ) {

              return false;

            }


            const pointA =
              findTerminal(
                rack,
                item.terminalAId
              );


            return (
              pointA?.rowIndex ===
              a.rowIndex
            );

          }
        )
        .length;


    const lane =
      sameRowFuseIndex %
      4;


    const routeY =
      Math.min(
        a.y,
        b.y
      ) -
      30 -
      (
        lane *
        18
      );


    const leftX =
      Math.min(
        a.x,
        b.x
      );


    const rightX =
      Math.max(
        a.x,
        b.x
      );


    const middleX =
      (
        leftX +
        rightX
      ) /
      2;


    /*
       Fuse body width.
    */

    const bodyWidth =
      Math.min(
        34,
        Math.max(
          20,
          (
            rightX -
            leftX
          ) *
          0.25
        )
      );


    const bodyLeft =
      middleX -
      (
        bodyWidth /
        2
      );


    const bodyRight =
      middleX +
      (
        bodyWidth /
        2
      );


    const group =
      createSvg(
        "g"
      );


    group.setAttribute(
      "data-ctr-fuse-link",
      fuse.id
    );


    group.style.cursor =
      "pointer";


    /*
       Left route.
    */

    const leftPath =
      createSvg(
        "path"
      );


    leftPath.setAttribute(
      "d",
      [
        `M ${a.x} ${a.y}`,
        `L ${a.x} ${routeY}`,
        `L ${bodyLeft} ${routeY}`
      ].join(" ")
    );


    leftPath.setAttribute(
      "class",
      "ctr-fuse-link-visible"
    );


    group.appendChild(
      leftPath
    );


    /*
       Right route.
    */

    const rightPath =
      createSvg(
        "path"
      );


    rightPath.setAttribute(
      "d",
      [
        `M ${bodyRight} ${routeY}`,
        `L ${b.x} ${routeY}`,
        `L ${b.x} ${b.y}`
      ].join(" ")
    );


    rightPath.setAttribute(
      "class",
      "ctr-fuse-link-visible"
    );


    group.appendChild(
      rightPath
    );


    /*
       Fuse body.
    */

    const body =
      createSvg(
        "rect"
      );


    body.setAttribute(
      "x",
      bodyLeft
    );


    body.setAttribute(
      "y",
      routeY - 5
    );


    body.setAttribute(
      "width",
      bodyWidth
    );


    body.setAttribute(
      "height",
      10
    );


    body.setAttribute(
      "rx",
      4
    );


    body.setAttribute(
      "class",
      "ctr-fuse-link-body"
    );


    group.appendChild(
      body
    );


    /*
       Invisible hit path.
    */

    const hit =
      createSvg(
        "path"
      );


    hit.setAttribute(
      "d",
      [
        `M ${a.x} ${a.y}`,
        `L ${a.x} ${routeY}`,
        `L ${b.x} ${routeY}`,
        `L ${b.x} ${b.y}`
      ].join(" ")
    );


    hit.setAttribute(
      "class",
      "ctr-fuse-link-hit"
    );


    group.appendChild(
      hit
    );


    /*
       Fuse No.
    */

    addFuseLabel(
      group,
      fuse.label ||
      `F${fuseIndex + 1}`,
      middleX,
      routeY - 10
    );


    /*
       Particular gets wrapped.
       Text ek dusre ke upar chipkega nahi.
    */

    const lines =
      wrapText(
        fuse.details,
        14
      );


    lines.forEach(
      function (
        line,
        lineIndex
      ) {

        addFuseLabel(
          group,
          line,
          middleX,
          routeY -
          20 -
          (
            lineIndex *
            9
          )
        );

      }
    );


    const title =
      createSvg(
        "title"
      );


    title.textContent =
      [
        fuse.label ||
        `F${fuseIndex + 1}`,

        fuse.details ||
        "",

        `${describeTerminal(
          rack,
          fuse.terminalAId
        )} ↔ ${describeTerminal(
          rack,
          fuse.terminalBId
        )}`
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


    layer.appendChild(
      group
    );

  }


  /* =====================================================
     DRAW ALL FUSE LINKS
  ===================================================== */

  function drawFuseLinks() {

    const host =
      document.getElementById(
        "stationSvgHost"
      );


    const svg =
      host?.querySelector(
        "svg"
      );


    const rack =
      getActiveRack();


    if (
      !svg ||
      !rack
    ) {

      return;

    }


    const old =
      svg.querySelector(
        "#stationFuseLinkLayer"
      );


    old?.remove();


    const layer =
      createSvg(
        "g"
      );


    layer.id =
      "stationFuseLinkLayer";


    /*
       Put fuse links before conductor layer,
       but above terminals visually.
    */

    const connectionLayer =
      svg.querySelector(
        "#stationConnectionLayer"
      );


    if (
      connectionLayer
    ) {

      svg.insertBefore(
        layer,
        connectionLayer
      );

    }

    else {

      svg.appendChild(
        layer
      );

    }


    ensureFuseData(
      rack
    )
      .forEach(
        function (
          fuse,
          index
        ) {

          drawSingleFuseLink(
            layer,
            svg,
            rack,
            fuse,
            index
          );

        }
      );

  }


  function scheduleFuseDraw(
    delay = 80
  ) {

    clearTimeout(
      redrawTimer
    );


    redrawTimer =
      setTimeout(
        drawFuseLinks,
        delay
      );

  }


  /* =====================================================
     CLICK SVG FUSE
  ===================================================== */

  function openFuseFromSvg(
    fuseIndex
  ) {

    const rack =
      getActiveRack();


    const fuse =
      ensureFuseData(
        rack
      )[
        fuseIndex
      ];


    if (
      fuse
    ) {

      openFusePanel(
        fuse
      );

    }

  }


  function handleSvgClick(
    event
  ) {

    /*
       Actual fuse link has first priority.
    */

    const link =
      event.target.closest(
        "[data-ctr-fuse-link]"
      );


    if (
      link
    ) {

      event.preventDefault();

      event.stopPropagation();

      event.stopImmediatePropagation();


      const rack =
        getActiveRack();


      const fuse =
        ensureFuseData(
          rack
        )
          .find(
            function (
              item
            ) {

              return (
                item.id ===
                link.getAttribute(
                  "data-ctr-fuse-link"
                )
              );

            }
          );


      if (
        fuse
      ) {

        openFusePanel(
          fuse
        );

      }


      return;

    }


    /*
       Existing SVG fuse text block.
    */

    const fuseElement =
      event.target.closest(
        '[data-ctr-object="fuse"]'
      );


    if (
      !fuseElement
    ) {

      return;

    }


    event.preventDefault();

    event.stopPropagation();

    event.stopImmediatePropagation();


    openFuseFromSvg(
      Number(
        fuseElement.dataset
          .fuseIndex
      )
    );

  }


  /* =====================================================
     WATCH SVG REBUILD
  ===================================================== */

  function observeDrawing() {

    const host =
      document.getElementById(
        "stationSvgHost"
      );


    if (!host) {

      return;

    }


    const observer =
      new MutationObserver(
        function () {

          const svg =
            host.querySelector(
              "svg"
            );


          if (
            svg &&
            !svg.querySelector(
              "#stationFuseLinkLayer"
            )
          ) {

            scheduleFuseDraw(
              100
            );

          }

        }
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
     EVENTS
  ===================================================== */

  function bindEvents() {

    document
      .getElementById(
        "stationAddFuse"
      )
      ?.addEventListener(
        "click",
        function () {

          openFusePanel(
            null
          );

        }
      );


    document
      .getElementById(
        "stationFuseClose"
      )
      ?.addEventListener(
        "click",
        closeFusePanel
      );


    document
      .getElementById(
        "stationFuseCancel"
      )
      ?.addEventListener(
        "click",
        closeFusePanel
      );


    document
      .getElementById(
        "stationFuseSave"
      )
      ?.addEventListener(
        "click",
        saveFuse
      );


    document
      .getElementById(
        "stationFuseRemove"
      )
      ?.addEventListener(
        "click",
        removeFuse
      );


    document
      .getElementById(
        "stationSvgRackSelect"
      )
      ?.addEventListener(
        "change",
        function () {

          closeFusePanel();


          setTimeout(
            drawFuseLinks,
            130
          );

        }
      );


    document
      .getElementById(
        "stationSvgRefresh"
      )
      ?.addEventListener(
        "click",
        function () {

          setTimeout(
            drawFuseLinks,
            130
          );

        }
      );


    /*
       Capture phase overrides old SVG fuse click
       only when clicking a fuse.
    */

    document
      .getElementById(
        "stationSvgHost"
      )
      ?.addEventListener(
        "click",
        handleSvgClick,
        true
      );

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  function initialize() {

    injectStyles();

    createHeaderButton();

    createPanel();


    getStationRacks()
      .forEach(
        function (
          rack
        ) {

          ensureFuseData(
            rack
          );

        }
      );


    bindEvents();

    observeDrawing();


    setTimeout(
      drawFuseLinks,
      600
    );


    setTimeout(
      drawFuseLinks,
      1500
    );


    window.CTR_STATION_FUSES = {

      version:
        VERSION,

      redraw:
        drawFuseLinks

    };

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