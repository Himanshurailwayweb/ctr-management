(function () {
  "use strict";

  const STORAGE_BUCKET =
    "ctr-workflow-documents";

  const JSPDF_URL =
    "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js";

  const MAX_FILE_SIZE =
    25 * 1024 * 1024;

  /*
    Website ki standard drawing me 12 terminals
    ek strip me naturally fit hote hain.

    Agar future me 12 se zyada columns hue,
    PDF automatically continuation strip banayega.
  */
  const MAX_TERMINALS_PER_STRIP =
    12;

  let generatorBusy =
    false;


  /* =========================================================
     BASIC HELPERS
  ========================================================= */

  function safeArray(value) {

    return Array.isArray(value)
      ? value
      : [];

  }


  function cleanText(value) {

    return String(
      value ?? ""
    ).trim();

  }


  function displayText(
    value,
    fallback = "-"
  ) {

    const result =
      cleanText(value);

    return result || fallback;

  }


  function firstValue(
    ...values
  ) {

    for (
      const value
      of values
    ) {

      const result =
        cleanText(value);

      if (result) {
        return result;
      }

    }

    return "";

  }


  function formatDateTime(value) {

    const date =
      value
        ? new Date(value)
        : new Date();

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "-";

    }

    return date.toLocaleString();

  }


  function getWorkflowId() {

    return new URLSearchParams(
      window.location.search
    ).get(
      "workflow"
    );

  }


  /* =========================================================
     SUPABASE CLIENT
  ========================================================= */

  function getSupabaseClient() {

    if (
      typeof supabaseClient !==
        "undefined" &&
      supabaseClient
    ) {

      return supabaseClient;

    }


    if (
      window.supabaseClient
    ) {

      return window.supabaseClient;

    }


    if (
      window.ctrSupabaseClient
    ) {

      return window.ctrSupabaseClient;

    }


    throw new Error(
      "Supabase client is not available."
    );

  }


  /* =========================================================
     GENERATOR STATUS
  ========================================================= */

  function getStatusElement() {

    let element =
      document.getElementById(
        "ctrPdfGeneratorStatus"
      );


    if (element) {

      return element;

    }


    const host =

      document.getElementById(
        "currentDocumentActions"
      ) ||

      document.querySelector(
        "[data-current-document-actions]"
      ) ||

      document.querySelector(
        ".current-document-actions"
      ) ||

      document.querySelector(
        ".document-actions"
      ) ||

      document.querySelector(
        ".current-pdf-actions"
      ) ||

      document.querySelector(
        ".pdf-actions"
      );


    if (!host) {

      return null;

    }


    element =
      document.createElement(
        "div"
      );


    element.id =
      "ctrPdfGeneratorStatus";


    element.style.marginTop =
      "10px";

    element.style.fontSize =
      "12px";

    element.style.lineHeight =
      "1.5";


    host.appendChild(
      element
    );


    return element;

  }


  function showGeneratorStatus(
    message,
    type = "info"
  ) {

    const element =
      getStatusElement();


    if (!element) {

      return;

    }


    element.textContent =
      message || "";


    element.dataset.statusType =
      type;


    if (
      type ===
      "error"
    ) {

      element.style.color =
        "#a61b1b";

    }

    else if (
      type ===
      "success"
    ) {

      element.style.color =
        "#166534";

    }

    else {

      element.style.color =
        "#35516d";

    }

  }


  /* =========================================================
     LOAD JSPDF
  ========================================================= */

  function loadJsPdf() {

    return new Promise(
      function (
        resolve,
        reject
      ) {

        if (
          window.jspdf?.jsPDF
        ) {

          resolve(
            window.jspdf.jsPDF
          );

          return;

        }


        const existing =
          document.querySelector(
            'script[data-ctr-jspdf="true"]'
          );


        if (existing) {

          existing.addEventListener(
            "load",
            function () {

              if (
                window.jspdf?.jsPDF
              ) {

                resolve(
                  window.jspdf.jsPDF
                );

              }

              else {

                reject(
                  new Error(
                    "jsPDF loaded but is unavailable."
                  )
                );

              }

            },
            {
              once:
                true
            }
          );


          existing.addEventListener(
            "error",
            function () {

              reject(
                new Error(
                  "Unable to load jsPDF."
                )
              );

            },
            {
              once:
                true
            }
          );


          return;

        }


        const script =
          document.createElement(
            "script"
          );


        script.src =
          JSPDF_URL;


        script.async =
          true;


        script.dataset.ctrJspdf =
          "true";


        script.onload =
          function () {

            if (
              window.jspdf?.jsPDF
            ) {

              resolve(
                window.jspdf.jsPDF
              );

            }

            else {

              reject(
                new Error(
                  "jsPDF loaded but is unavailable."
                )
              );

            }

          };


        script.onerror =
          function () {

            reject(
              new Error(
                "Unable to load jsPDF."
              )
            );

          };


        document.head.appendChild(
          script
        );

      }
    );

  }


  /* =========================================================
     LOAD CONTROLLED PDF SOURCE
  ========================================================= */

  async function loadPdfSource(
    workflowId
  ) {

    const client =
      getSupabaseClient();


    const {
      data,
      error
    } =
      await client.rpc(
        "get_initial_ctr_pdf_source",
        {

          p_workflow_id:
            workflowId

        }
      );


    if (error) {

      throw error;

    }


    if (!data) {

      throw new Error(
        "CTR PDF source is not available."
      );

    }


    return Array.isArray(data)
      ? data[0]
      : data;

  }


  /* =========================================================
     SHA-256
  ========================================================= */

  async function sha256Hex(
    arrayBuffer
  ) {

    if (
      !window.crypto?.subtle
    ) {

      throw new Error(
        "Browser SHA-256 support is not available."
      );

    }


    const digest =
      await window.crypto.subtle.digest(
        "SHA-256",
        arrayBuffer
      );


    return Array
      .from(
        new Uint8Array(
          digest
        )
      )
      .map(
        function (byte) {

          return byte
            .toString(16)
            .padStart(
              2,
              "0"
            );

        }
      )
      .join("");

  }


  /* =========================================================
     ARRAY CHUNK
  ========================================================= */

  function chunkArray(
    items,
    size
  ) {

    const result =
      [];


    for (
      let index = 0;
      index < items.length;
      index += size
    ) {

      result.push(
        items.slice(
          index,
          index + size
        )
      );

    }


    return result;

  }


  /* =========================================================
     PDF ENGINEERING DRAWING WRITER
  ========================================================= */

  function createPdfWriter(
    jsPDF,
    source
  ) {

    const doc =
      new jsPDF({

        orientation:
          "landscape",

        unit:
          "mm",

        format:
          "a4",

        compress:
          true

      });


    /* -------------------------------------------------------
       PAGE CONSTANTS
    ------------------------------------------------------- */

    const PAGE_WIDTH =
      297;

    const PAGE_HEIGHT =
      210;

    const MARGIN_X =
      10;

    const TOP_Y =
      11;

    const BOTTOM_Y =
      196;

    const USABLE_WIDTH =
      PAGE_WIDTH -
      MARGIN_X * 2;


    /* -------------------------------------------------------
       SOURCE DETAILS
    ------------------------------------------------------- */

    const station =
      source?.station ||
      {};


    const division =
      station?.division ||
      {};


    const stationName =
      firstValue(

        station.name,

        station.station_name,

        source.station_name,

        "Station"

      );


    const stationCode =
      firstValue(

        station.code,

        station.station_code,

        source.station_code,

        "-"

      );


    const recordName =
      firstValue(

        source.record_name,

        "Initial CTR"

      );


    let y =
      TOP_Y;


    /* =====================================================
       FONT
    ===================================================== */

    function setFont(
      size = 9,
      style = "normal"
    ) {

      doc.setFont(
        "helvetica",
        style
      );


      doc.setFontSize(
        size
      );


      doc.setTextColor(
        20,
        20,
        20
      );

    }


    /* =====================================================
       PAGE BREAK
    ===================================================== */

    function addPage() {

      doc.addPage(
        "a4",
        "landscape"
      );


      y =
        TOP_Y;


      drawContinuationHeader();

    }


    function ensureSpace(
      height
    ) {

      if (
        y + height >
        BOTTOM_Y
      ) {

        addPage();

      }

    }


    function move(
      amount
    ) {

      y +=
        amount;

    }


    /* =====================================================
       CONTINUATION HEADER
    ===================================================== */

    function drawContinuationHeader() {

      setFont(
        8,
        "bold"
      );


      doc.text(
        `${stationName} (${stationCode})`,
        MARGIN_X,
        y
      );


      doc.text(
        recordName,
        PAGE_WIDTH - MARGIN_X,
        y,
        {
          align:
            "right"
        }
      );


      doc.setDrawColor(
        120,
        120,
        120
      );


      doc.setLineWidth(
        0.25
      );


      doc.line(

        MARGIN_X,

        y + 2.2,

        PAGE_WIDTH -
          MARGIN_X,

        y + 2.2

      );


      y +=
        7;

    }


    /* =====================================================
       MAIN DOCUMENT HEADER
    ===================================================== */

    function drawMainHeader() {

      setFont(
        7.5,
        "normal"
      );


      doc.text(
        "CTR MANAGEMENT SYSTEM - CONTROLLED ENGINEERING DRAWING",
        MARGIN_X,
        y
      );


      y +=
        5;


      setFont(
        18,
        "bold"
      );


      doc.text(
        "CTR DRAWING",
        PAGE_WIDTH / 2,
        y,
        {
          align:
            "center"
        }
      );


      y +=
        6;


      setFont(
        11,
        "bold"
      );


      doc.text(
        recordName,
        PAGE_WIDTH / 2,
        y,
        {
          align:
            "center"
        }
      );


      y +=
        5;


      doc.setDrawColor(
        30,
        30,
        30
      );


      doc.setLineWidth(
        0.35
      );


      doc.line(

        MARGIN_X,

        y,

        PAGE_WIDTH -
          MARGIN_X,

        y

      );


      y +=
        5;


      const divisionName =
        firstValue(

          division.name,

          division.division_name,

          station.division_name,

          source.division_name,

          "-"

        );


      const divisionCode =
        firstValue(

          division.code,

          division.division_code,

          station.division_code,

          source.division_code,

          "-"

        );


      const zone =
        firstValue(

          division.zone,

          division.zone_name,

          station.zone,

          station.zone_name,

          source.zone_name,

          "-"

        );


      const sectionalIncharge =
        firstValue(

          station.sectional_incharge,

          station.sectional_incharge_designation,

          source.sectional_incharge,

          source.sectional_incharge_designation,

          "-"

        );


      const preparedBy =
        firstValue(

          source?.preparer?.name,

          source?.preparer?.full_name,

          source.preparer_name,

          "-"

        );


      const preparedDesignation =
        firstValue(

          source?.preparer?.designation,

          source.preparer_designation,

          "-"

        );


      const leftX =
        MARGIN_X;

      const midX =
        82;

      const rightX =
        154;

      const fourthX =
        225;


      setFont(
        7,
        "normal"
      );


      doc.text(
        "STATION",
        leftX,
        y
      );


      doc.text(
        "STATION CODE",
        midX,
        y
      );


      doc.text(
        "DIVISION",
        rightX,
        y
      );


      doc.text(
        "RAILWAY ZONE",
        fourthX,
        y
      );


      y +=
        4;


      setFont(
        10,
        "bold"
      );


      doc.text(
        displayText(
          stationName
        ),
        leftX,
        y
      );


      doc.text(
        displayText(
          stationCode
        ),
        midX,
        y
      );


      doc.text(

        `${displayText(
          divisionName
        )} (${displayText(
          divisionCode
        )})`,

        rightX,

        y,

        {
          maxWidth:
            63
        }

      );


      doc.text(

        displayText(
          zone
        ),

        fourthX,

        y,

        {
          maxWidth:
            60
        }

      );


      y +=
        7;


      setFont(
        7,
        "normal"
      );


      doc.text(
        "SECTIONAL INCHARGE",
        leftX,
        y
      );


      doc.text(
        "PREPARED BY",
        rightX,
        y
      );


      doc.text(
        "GENERATED ON",
        fourthX,
        y
      );


      y +=
        4;


      setFont(
        9,
        "bold"
      );


      doc.text(

        displayText(
          sectionalIncharge
        ),

        leftX,

        y,

        {
          maxWidth:
            120
        }

      );


      doc.text(

        `${displayText(
          preparedBy
        )} / ${displayText(
          preparedDesignation
        )}`,

        rightX,

        y,

        {
          maxWidth:
            65
        }

      );


      doc.text(

        formatDateTime(),

        fourthX,

        y,

        {
          maxWidth:
            60
        }

      );


      y +=
        7;


      doc.setDrawColor(
        120,
        120,
        120
      );


      doc.setLineWidth(
        0.25
      );


      doc.line(

        MARGIN_X,

        y,

        PAGE_WIDTH -
          MARGIN_X,

        y

      );


      y +=
        5;

    }


    /* =====================================================
       SECTION BAND
    ===================================================== */

    function drawBand(
      title,
      subtitle
    ) {

      ensureSpace(
        subtitle
          ? 15
          : 11
      );


      doc.setFillColor(
        242,
        245,
        247
      );


      doc.setDrawColor(
        65,
        65,
        65
      );


      doc.setLineWidth(
        0.3
      );


      doc.rect(

        MARGIN_X,

        y,

        USABLE_WIDTH,

        subtitle
          ? 13
          : 9,

        "FD"

      );


      setFont(
        subtitle
          ? 7
          : 9,
        "bold"
      );


      if (
        subtitle
      ) {

        doc.text(

          cleanText(
            subtitle
          ).toUpperCase(),

          MARGIN_X + 4,

          y + 4.2

        );


        setFont(
          11,
          "bold"
        );


        doc.text(

          displayText(
            title
          ),

          MARGIN_X + 4,

          y + 9.4

        );

      }

      else {

        doc.text(

          displayText(
            title
          ),

          MARGIN_X + 4,

          y + 5.8

        );

      }


      y +=
        subtitle
          ? 17
          : 13;

    }


    /* =====================================================
       CTR RACK HEADER
    ===================================================== */

    function drawCenteredRackHeader(
      rackName
    ) {

      ensureSpace(
        20
      );


      doc.setDrawColor(
        35,
        35,
        35
      );


      doc.setLineWidth(
        0.35
      );


      doc.rect(

        MARGIN_X,

        y,

        USABLE_WIDTH,

        17

      );


      setFont(
        7,
        "bold"
      );


      doc.text(

        "CTR RACK",

        PAGE_WIDTH / 2,

        y + 5,

        {
          align:
            "center"
        }

      );


      setFont(
        14,
        "bold"
      );


      doc.text(

        displayText(
          rackName
        ),

        PAGE_WIDTH / 2,

        y + 11.7,

        {
          align:
            "center"
        }

      );


      doc.setLineWidth(
        0.25
      );


      doc.line(

        PAGE_WIDTH / 2 - 24,

        y + 14,

        PAGE_WIDTH / 2 + 24,

        y + 14

      );


      y +=
        21;

    }


    /* =====================================================
       DRAWING SUB HEADING
    ===================================================== */

    function drawSubHeading(
      kicker,
      title
    ) {

      ensureSpace(
        12
      );


      setFont(
        6.7,
        "bold"
      );


      doc.text(

        cleanText(
          kicker
        ).toUpperCase(),

        PAGE_WIDTH / 2,

        y + 3,

        {
          align:
            "center"
        }

      );


      setFont(
        10.5,
        "bold"
      );


      doc.text(

        displayText(
          title
        ),

        PAGE_WIDTH / 2,

        y + 8,

        {
          align:
            "center"
        }

      );


      const width =
        Math.min(

          65,

          Math.max(

            28,

            doc.getTextWidth(
              displayText(
                title
              )
            ) + 6

          )

        );


      doc.setLineWidth(
        0.25
      );


      doc.line(

        PAGE_WIDTH / 2 -
          width / 2,

        y + 10,

        PAGE_WIDTH / 2 +
          width / 2,

        y + 10

      );


      y +=
        14;

    }


    /* =====================================================
       TECHNICAL FUSE SYMBOL

       Same visual logic as website:
       conductor
       connection point
       fuse link
       bottom terminal
    ===================================================== */

    function drawFuseSymbol(
      centreX,
      topY
    ) {

      doc.setDrawColor(
        20,
        20,
        20
      );


      doc.setLineWidth(
        0.35
      );


      /* Incoming conductor */

      doc.line(

        centreX,

        topY,

        centreX,

        topY + 4

      );


      /* Upper connection */

      doc.circle(

        centreX,

        topY + 5.2,

        0.8,

        "S"

      );


      /* Fuse diagonal */

      doc.line(

        centreX,

        topY + 6.3,

        centreX - 3.4,

        topY + 9.7

      );


      doc.line(

        centreX - 3.4,

        topY + 9.7,

        centreX + 3.4,

        topY + 9.7

      );


      doc.line(

        centreX + 3.4,

        topY + 9.7,

        centreX,

        topY + 13.1

      );


      /* Lower conductor */

      doc.line(

        centreX,

        topY + 13.1,

        centreX,

        topY + 16.1

      );


      /* Lower terminal */

      doc.circle(

        centreX,

        topY + 17.2,

        0.9,

        "S"

      );


      /* Tail */

      doc.line(

        centreX,

        topY + 18.1,

        centreX,

        topY + 20.5

      );

    }


    /* =====================================================
       FUSE DETAILS DRAWING
    ===================================================== */

    function drawFuseSection(
      owner,
      heading
    ) {

      const fuses =
        safeArray(
          owner?.fuseDetails
        );


      drawSubHeading(

        "FUSE DETAILS",

        heading

      );


      if (
        fuses.length ===
        0
      ) {

        ensureSpace(
          9
        );


        setFont(
          7.5,
          "normal"
        );


        doc.text(

          "No fuse points configured.",

          MARGIN_X + 2,

          y + 3

        );


        y +=
          9;


        return;

      }


      const itemWidth =
        36;


      const itemsPerLine =
        Math.max(

          1,

          Math.floor(
            USABLE_WIDTH /
            itemWidth
          )

        );


      const groups =
        chunkArray(

          fuses,

          itemsPerLine

        );


      groups.forEach(
        function (group) {

          ensureSpace(
            42
          );


          const groupWidth =
            group.length *
            itemWidth;


          const startX =

            MARGIN_X +

            (
              USABLE_WIDTH -
              groupWidth
            ) / 2;


          group.forEach(
            function (
              fuse,
              index
            ) {

              const centreX =

                startX +

                index *
                itemWidth +

                itemWidth / 2;


              const details =
                displayText(

                  fuse?.details,

                  "Fuse"

                );


              const wrapped =
                doc
                  .splitTextToSize(

                    details,

                    itemWidth - 4

                  )
                  .slice(
                    0,
                    2
                  );


              setFont(
                6.5,
                "bold"
              );


              doc.text(

                wrapped,

                centreX,

                y + 3,

                {
                  align:
                    "center",

                  maxWidth:
                    itemWidth - 4
                }

              );


              setFont(
                5.5,
                "normal"
              );


              doc.text(

                `${displayText(
                  owner?.name,
                  "CTR"
                )} FUSE`,

                centreX,

                y + 9,

                {
                  align:
                    "center"
                }

              );


              drawFuseSymbol(

                centreX,

                y + 11

              );


              setFont(
                7.5,
                "bold"
              );


              doc.text(

                displayText(

                  fuse?.label,

                  `F${index + 1}`

                ),

                centreX,

                y + 35,

                {
                  align:
                    "center"
                }

              );

            }
          );


          y +=
            40;

        }
      );

    }


    /* =====================================================
       TERMINAL ROW DRAWING

       Website style:
       Particular / SPARE
             |
       ---------------------------
             |
             O
            01
    ===================================================== */

    function drawTerminalBlock(
      row,
      terminals,
      segmentIndex,
      segmentCount
    ) {

      ensureSpace(
        42
      );


      const rowLabel =
        displayText(
          row?.label,
          "-"
        );


      const circleX =
        MARGIN_X + 10;


      const baselineStart =
        MARGIN_X + 26;


      const baselineEnd =

        PAGE_WIDTH -

        MARGIN_X -

        4;


      const baselineY =
        y + 22;


      /* ---------------------------------------------------
         ROW A / B / C CIRCLE
      --------------------------------------------------- */

      doc.setDrawColor(
        35,
        35,
        35
      );


      doc.setLineWidth(
        0.3
      );


      doc.circle(

        circleX,

        y + 18,

        4,

        "S"

      );


      setFont(
        8.5,
        "normal"
      );


      doc.text(

        rowLabel,

        circleX,

        y + 19.2,

        {
          align:
            "center"
        }

      );


      /* ---------------------------------------------------
         COLUMN CONTINUATION
      --------------------------------------------------- */

      if (
        segmentCount >
        1
      ) {

        setFont(
          5.5,
          "normal"
        );


        doc.text(

          `Columns ${
            segmentIndex *
            MAX_TERMINALS_PER_STRIP +
            1
          }-${
            segmentIndex *
            MAX_TERMINALS_PER_STRIP +
            terminals.length
          }`,

          circleX,

          y + 25.5,

          {
            align:
              "center"
          }

        );

      }


      /* ---------------------------------------------------
         MAIN HORIZONTAL CONDUCTOR LINE
      --------------------------------------------------- */

      doc.line(

        baselineStart,

        baselineY,

        baselineEnd,

        baselineY

      );


      if (
        terminals.length ===
        0
      ) {

        setFont(
          7,
          "normal"
        );


        doc.text(

          "No terminals configured.",

          baselineStart + 4,

          y + 14

        );


        y +=
          36;


        return;

      }


      const span =

        baselineEnd -

        baselineStart;


      const cellWidth =

        span /

        terminals.length;


      terminals.forEach(
        function (
          terminal,
          index
        ) {

          const centreX =

            baselineStart +

            cellWidth *
            (
              index +
              0.5
            );


          const particular =
            firstValue(

              terminal?.particular,

              terminal?.status,

              "SPARE"

            );


          const textWidth =
            Math.max(

              10,

              cellWidth - 2

            );


          const lines =
            doc
              .splitTextToSize(

                particular,

                textWidth

              )
              .slice(
                0,
                2
              );


          /* -----------------------------------------------
             PARTICULAR ABOVE TERMINAL
          ----------------------------------------------- */

          setFont(
            5.3,
            "normal"
          );


          doc.text(

            lines,

            centreX,

            y + 7,

            {
              align:
                "center",

              maxWidth:
                textWidth
            }

          );


          /*
            If terminal has actual particular,
            show status in tiny text below it.
          */

          if (
            terminal?.particular &&
            terminal?.status
          ) {

            setFont(
              4.8,
              "normal"
            );


            doc.text(

              cleanText(
                terminal.status
              ),

              centreX,

              y + 13.5,

              {
                align:
                  "center"
              }

            );

          }


          /* -----------------------------------------------
             VERTICAL TERMINAL LINE
          ----------------------------------------------- */

          doc.setDrawColor(
            25,
            25,
            25
          );


          doc.setLineWidth(
            0.28
          );


          doc.line(

            centreX,

            baselineY - 4,

            centreX,

            baselineY + 5.5

          );


          /* -----------------------------------------------
             TERMINAL CONNECTION POINT
          ----------------------------------------------- */

          doc.circle(

            centreX,

            baselineY + 8.2,

            1.15,

            "S"

          );


          /* -----------------------------------------------
             TERMINAL NUMBER
          ----------------------------------------------- */

          setFont(
            6.2,
            "normal"
          );


          doc.text(

            displayText(

              terminal?.number,

              String(
                index + 1
              ).padStart(
                2,
                "0"
              )

            ),

            centreX,

            baselineY + 13.6,

            {
              align:
                "center"
            }

          );


          /* -----------------------------------------------
             CONNECTED LOCATION REFERENCE

             Only shown when entered.
          ----------------------------------------------- */

          const connection =
            firstValue(

              terminal?.locationBox &&
              terminal?.locationTerminal

                ? `${terminal.locationBox}/${terminal.locationTerminal}`

                : "",

              terminal?.locationBox,

              ""

            );


          if (
            connection
          ) {

            setFont(
              4.5,
              "normal"
            );


            const connectionLines =
              doc
                .splitTextToSize(

                  connection,

                  textWidth

                )
                .slice(
                  0,
                  1
                );


            doc.text(

              connectionLines,

              centreX,

              baselineY + 17.2,

              {
                align:
                  "center",

                maxWidth:
                  textWidth
              }

            );

          }

        }
      );


      y +=
        40;

    }


    /* =====================================================
       COMPLETE TERMINAL ROWS
    ===================================================== */

    function drawTerminalRows(
      owner,
      headingLabel = "CTR TERMINALS"
    ) {

      const rows =
        safeArray(
          owner?.rows
        );


      drawSubHeading(

        headingLabel,

        "Row & Column Structure"

      );


      if (
        rows.length ===
        0
      ) {

        ensureSpace(
          9
        );


        setFont(
          7.5,
          "normal"
        );


        doc.text(

          "No terminal rows configured.",

          MARGIN_X + 2,

          y + 3

        );


        y +=
          9;


        return;

      }


      rows.forEach(
        function (row) {

          const terminals =
            safeArray(
              row?.terminals
            );


          const groups =

            terminals.length

              ? chunkArray(

                  terminals,

                  MAX_TERMINALS_PER_STRIP

                )

              : [
                  []
                ];


          groups.forEach(
            function (
              group,
              groupIndex
            ) {

              drawTerminalBlock(

                row,

                group,

                groupIndex,

                groups.length

              );

            }
          );

        }
      );

    }


    /* =====================================================
       STATION CTR RACK
    ===================================================== */

    function drawStationRack(
      rack,
      rackIndex
    ) {

      const rackName =
        displayText(

          rack?.name,

          `K${rackIndex + 1}`

        );


      drawCenteredRackHeader(
        rackName
      );


      drawFuseSection(

        rack,

        `${rackName} Fuse Details`

      );


      drawTerminalRows(

        rack,

        "CTR TERMINALS"

      );


      move(
        4
      );

    }


    /* =====================================================
       LOCATION BOX

       IMPORTANT:
       Location Box has NO K1 / K2 / K3 layer.

       LOCATION BOX
          -> Fuse Details
          -> Rows
          -> Columns / Terminals
    ===================================================== */

    function drawLocationBox(
      location,
      locationIndex
    ) {

      const locationName =
        displayText(

          location?.name,

          `Location Box ${
            locationIndex + 1
          }`

        );


      drawBand(

        locationName,

        "LOCATION BOX"

      );


      drawFuseSection(

        location,

        `${locationName} Fuse Details`

      );


      drawTerminalRows(

        location,

        "LOCATION BOX TERMINALS"

      );


      move(
        4
      );

    }


    /* =====================================================
       CONNECTED END
    ===================================================== */

    function drawConnectedEnd(
      end,
      endIndex
    ) {

      const endName =
        displayText(

          end?.name,

          `Connected End ${
            endIndex + 1
          }`

        );


      drawBand(

        endName,

        "CONNECTED END"

      );


      const locations =
        safeArray(
          end?.locations
        );


      if (
        locations.length ===
        0
      ) {

        ensureSpace(
          9
        );


        setFont(
          7.5,
          "normal"
        );


        doc.text(

          "No Location Boxes configured for this Connected End.",

          MARGIN_X + 2,

          y + 3

        );


        y +=
          10;


        return;

      }


      locations.forEach(
        function (
          location,
          locationIndex
        ) {

          drawLocationBox(

            location,

            locationIndex

          );

        }
      );

    }


    /* =====================================================
       CONTROLLED DOCUMENT INFORMATION
    ===================================================== */

    function drawControlledInfo() {

      ensureSpace(
        33
      );


      drawBand(
        "Controlled Document Information"
      );


      setFont(
        6.5,
        "normal"
      );


      const note =

        "This PDF is generated from the controlled CTR workflow draft stored in the database. Digital signing and final approval are performed separately through the CTR signing workflow.";


      const lines =
        doc.splitTextToSize(

          note,

          USABLE_WIDTH - 4

        );


      doc.text(

        lines,

        MARGIN_X + 2,

        y

      );


      y +=

        lines.length *
        3.1 +

        2;


      setFont(
        6.2,
        "normal"
      );


      doc.text(

        `Workflow ID: ${displayText(
          source.workflow_id ||
          getWorkflowId()
        )}`,

        MARGIN_X + 2,

        y

      );


      y +=
        3.5;


      doc.text(

        `Draft ID: ${displayText(
          source.draft_id
        )}`,

        MARGIN_X + 2,

        y

      );


      y +=
        3.5;


      doc.text(

        `Document State: ${displayText(
          source.document_state,
          "Generated"
        )}`,

        MARGIN_X + 2,

        y

      );


      y +=
        5;

    }


    /* =====================================================
       FINAL FOOTERS
    ===================================================== */

    function finish() {

      const totalPages =
        doc.getNumberOfPages();


      for (
        let page = 1;
        page <= totalPages;
        page += 1
      ) {

        doc.setPage(
          page
        );


        doc.setDrawColor(
          160,
          160,
          160
        );


        doc.setLineWidth(
          0.2
        );


        doc.line(

          MARGIN_X,

          PAGE_HEIGHT - 10,

          PAGE_WIDTH -
            MARGIN_X,

          PAGE_HEIGHT - 10

        );


        setFont(
          5.8,
          "normal"
        );


        doc.text(

          "CTR Management System - Controlled Workflow Document",

          MARGIN_X,

          PAGE_HEIGHT - 6

        );


        doc.text(

          `Page ${page} of ${totalPages}`,

          PAGE_WIDTH -
            MARGIN_X,

          PAGE_HEIGHT - 6,

          {
            align:
              "right"
          }

        );

      }


      return doc;

    }


    /* -------------------------------------------------------
       BEGIN FIRST PAGE
    ------------------------------------------------------- */

    drawMainHeader();


    return {

      doc,


      get y() {

        return y;

      },


      set y(value) {

        y =
          value;

      },


      ensureSpace,

      move,

      drawBand,

      drawStationRack,

      drawConnectedEnd,

      drawControlledInfo,

      finish

    };

  }


  /* =========================================================
     BUILD COMPLETE CONTROLLED PDF
  ========================================================= */

  function buildControlledPdf(
    jsPDF,
    source
  ) {

    const writer =
      createPdfWriter(
        jsPDF,
        source
      );


    const drawing =

      source?.drawing ||

      source?.draft_data ||

      {};


    /* =====================================================
       STATION CTR RACKS
    ===================================================== */

    const racks =
      safeArray(

        drawing.stationCtrRacks ||

        drawing.station_ctr_racks

      );


    writer.drawBand(
      "Station CTR Racks"
    );


    if (
      racks.length ===
      0
    ) {

      writer.ensureSpace(
        10
      );


      const doc =
        writer.doc;


      doc.setFont(
        "helvetica",
        "normal"
      );


      doc.setFontSize(
        8
      );


      doc.text(

        "No Station CTR racks configured.",

        12,

        writer.y + 3

      );


      writer.move(
        10
      );

    }

    else {

      racks.forEach(
        function (
          rack,
          index
        ) {

          writer.drawStationRack(

            rack,

            index

          );

        }
      );

    }


    /* =====================================================
       CONNECTED ENDS + LOCATION BOXES
    ===================================================== */

    const ends =
      safeArray(

        drawing.connectedEnds ||

        drawing.connected_ends

      );


    writer.drawBand(
      "Connected Ends & Location Boxes"
    );


    if (
      ends.length ===
      0
    ) {

      writer.ensureSpace(
        10
      );


      const doc =
        writer.doc;


      doc.setFont(
        "helvetica",
        "normal"
      );


      doc.setFontSize(
        8
      );


      doc.text(

        "No Connected Ends configured.",

        12,

        writer.y + 3

      );


      writer.move(
        10
      );

    }

    else {

      ends.forEach(
        function (
          end,
          index
        ) {

          writer.drawConnectedEnd(

            end,

            index

          );

        }
      );

    }


    /* =====================================================
       CONTROL INFO
    ===================================================== */

    writer.drawControlledInfo();


    const doc =
      writer.finish();


    /* =====================================================
       PDF METADATA
    ===================================================== */

    doc.setProperties({

      title:
        `${
          displayText(
            source?.station?.name ||
            source?.station?.station_name,
            "Station"
          )
        } - ${
          displayText(
            source?.record_name,
            "Initial CTR"
          )
        }`,

      subject:
        "Controlled CTR Engineering Drawing",

      author:
        "CTR Management System",

      creator:
        "CTR Management System"

    });


    return doc;

  }


  /* =========================================================
     VALIDATE GENERATED PDF
  ========================================================= */

  function validatePdfArrayBuffer(
    arrayBuffer
  ) {

    if (
      !(
        arrayBuffer
        instanceof
        ArrayBuffer
      )
    ) {

      throw new Error(
        "Generated PDF data is invalid."
      );

    }


    if (
      arrayBuffer.byteLength <
      5
    ) {

      throw new Error(
        "Generated PDF is empty."
      );

    }


    if (
      arrayBuffer.byteLength >
      MAX_FILE_SIZE
    ) {

      throw new Error(
        "Generated PDF exceeds the 25 MB storage limit."
      );

    }


    const headerBytes =
      new Uint8Array(

        arrayBuffer.slice(
          0,
          5
        )

      );


    const header =
      String.fromCharCode(
        ...headerBytes
      );


    if (
      header !==
      "%PDF-"
    ) {

      throw new Error(
        "Generated file is not a valid PDF document."
      );

    }

  }


  /* =========================================================
     CHECK EXISTING STORAGE FILE
  ========================================================= */

  async function storageFileExists(
    client,
    folder,
    fileName
  ) {

    const {
      data,
      error
    } =
      await client.storage
        .from(
          STORAGE_BUCKET
        )
        .list(
          folder,
          {

            limit:
              100,

            search:
              fileName

          }
        );


    if (error) {

      throw error;

    }


    return safeArray(
      data
    ).some(
      function (item) {

        return (
          item?.name ===
          fileName
        );

      }
    );

  }


  /* =========================================================
     UPLOAD GENERATED PDF
  ========================================================= */

  async function uploadGeneratedPdf(
    client,
    workflowId,
    hash,
    blob
  ) {

    const folder =
      `${workflowId}/generated`;


    const fileName =
      `${hash}.pdf`;


    const storagePath =
      `${folder}/${fileName}`;


    const exists =
      await storageFileExists(

        client,

        folder,

        fileName

      );


    if (exists) {

      return storagePath;

    }


    const {
      error
    } =
      await client.storage
        .from(
          STORAGE_BUCKET
        )
        .upload(
          storagePath,
          blob,
          {

            contentType:
              "application/pdf",

            cacheControl:
              "3600",

            upsert:
              false

          }
        );


    if (error) {

      const message =
        cleanText(
          error.message
        ).toLowerCase();


      const duplicate =

        message.includes(
          "already exists"
        ) ||

        message.includes(
          "duplicate"
        );


      if (
        !duplicate
      ) {

        throw error;

      }

    }


    return storagePath;

  }


  /* =========================================================
     REGISTER GENERATED PDF
  ========================================================= */

  async function registerGeneratedPdf(
    client,
    workflowId,
    storagePath,
    hash
  ) {

    const {
      data,
      error
    } =
      await client.rpc(
        "register_ctr_generated_pdf",
        {

          p_workflow_id:
            workflowId,

          p_storage_path:
            storagePath,

          p_document_sha256:
            hash

        }
      );


    if (error) {

      throw error;

    }


    return data;

  }


  /* =========================================================
     GENERATE CONTROLLED PDF
  ========================================================= */

  async function generateControlledPdf(
    button
  ) {

    if (
      generatorBusy
    ) {

      return;

    }


    const workflowId =
      getWorkflowId();


    if (
      !workflowId
    ) {

      showGeneratorStatus(
        "Workflow ID is missing.",
        "error"
      );


      return;

    }


    generatorBusy =
      true;


    const originalText =
      button?.textContent ||
      "Generate Controlled PDF";


    if (button) {

      button.disabled =
        true;


      button.textContent =
        "Generating PDF...";

    }


    showGeneratorStatus(

      "Loading the latest controlled CTR draft...",

      "info"

    );


    try {

      const client =
        getSupabaseClient();


      /*
        IMPORTANT:
        Source is loaded again immediately before generation,
        so stale draft data is not used.
      */

      const source =
        await loadPdfSource(
          workflowId
        );


      if (
        source?.can_generate_pdf ===
        false
      ) {

        throw new Error(
          "This workflow is not currently eligible for controlled PDF generation."
        );

      }


      const jsPDF =
        await loadJsPdf();


      showGeneratorStatus(

        "Creating engineering drawing PDF...",

        "info"

      );


      const pdf =
        buildControlledPdf(

          jsPDF,

          source

        );


      const arrayBuffer =
        pdf.output(
          "arraybuffer"
        );


      validatePdfArrayBuffer(
        arrayBuffer
      );


      const hash =
        await sha256Hex(
          arrayBuffer
        );


      const blob =
        new Blob(

          [
            arrayBuffer
          ],

          {
            type:
              "application/pdf"
          }

        );


      showGeneratorStatus(

        "Uploading controlled PDF...",

        "info"

      );


      const storagePath =
        await uploadGeneratedPdf(

          client,

          workflowId,

          hash,

          blob

        );


      showGeneratorStatus(

        "Registering controlled document...",

        "info"

      );


      await registerGeneratedPdf(

        client,

        workflowId,

        storagePath,

        hash

      );


      showGeneratorStatus(

        "Controlled engineering drawing PDF generated successfully.",

        "success"

      );


      window.dispatchEvent(

        new CustomEvent(
          "ctr-controlled-pdf-generated",
          {

            detail: {

              workflowId:
                workflowId,

              storagePath:
                storagePath,

              documentSha256:
                hash

            }

          }
        )

      );


      setTimeout(
        function () {

          window.location.reload();

        },
        700
      );

    }

    catch (error) {

      console.error(

        "Controlled PDF generation error:",

        error

      );


      showGeneratorStatus(

        error?.message ||

        "Controlled PDF could not be generated.",

        "error"

      );


      if (button) {

        button.disabled =
          false;


        button.textContent =
          originalText;

      }

    }

    finally {

      generatorBusy =
        false;

    }

  }


  /* =========================================================
     FIND BUTTON HOST
  ========================================================= */

  function findGeneratorHost() {

    return (

      document.getElementById(
        "currentDocumentActions"
      ) ||

      document.querySelector(
        "[data-current-document-actions]"
      ) ||

      document.querySelector(
        ".current-document-actions"
      ) ||

      document.querySelector(
        ".document-actions"
      ) ||

      document.querySelector(
        ".current-pdf-actions"
      ) ||

      document.querySelector(
        ".pdf-actions"
      )

    );

  }


  /* =========================================================
     FALLBACK BUTTON LOCATION
  ========================================================= */

  function findFallbackActionButton() {

    const candidates =
      Array.from(

        document.querySelectorAll(
          "button, a"
        )

      );


    return candidates.find(
      function (element) {

        const label =
          cleanText(
            element.textContent
          ).toLowerCase();


        return (

          label.includes(
            "open current pdf"
          ) ||

          label.includes(
            "download for digital signing"
          ) ||

          label.includes(
            "download current pdf"
          )

        );

      }
    ) || null;

  }


  /* =========================================================
     ENSURE GENERATE BUTTON
  ========================================================= */

  function ensureGeneratorButton(
    source
  ) {

    let button =
      document.getElementById(
        "generateControlledCtrPdf"
      );


    if (!button) {

      button =
        document.createElement(
          "button"
        );


      button.type =
        "button";


      button.id =
        "generateControlledCtrPdf";


      button.className =
        "primary-action builder-action-btn";


      const host =
        findGeneratorHost();


      if (host) {

        host.appendChild(
          button
        );

      }

      else {

        const fallbackButton =
          findFallbackActionButton();


        if (
          fallbackButton
            ?.parentElement
        ) {

          fallbackButton
            .parentElement
            .appendChild(
              button
            );

        }

        else {

          const fallbackHost =

            document.querySelector(
              ".page-content"
            ) ||

            document.querySelector(
              "main"
            ) ||

            document.body;


          const wrapper =
            document.createElement(
              "div"
            );


          wrapper.style.margin =
            "14px 0";


          wrapper.appendChild(
            button
          );


          fallbackHost.appendChild(
            wrapper
          );

        }

      }

    }


    const isRegeneration =

      source?.document_state ===
        "REGENERATED_AFTER_CORRECTION" ||

      !!source
        ?.current_document_id;


    button.textContent =

      isRegeneration

        ? "Regenerate Controlled PDF"

        : "Generate Controlled PDF";


    button.disabled =
      false;


    if (
      !button.dataset
        .ctrPdfBound
    ) {

      button.dataset.ctrPdfBound =
        "true";


      button.addEventListener(
        "click",
        function () {

          generateControlledPdf(
            button
          );

        }
      );

    }


    return button;

  }


  /* =========================================================
     INITIALIZE GENERATOR
  ========================================================= */

  async function initializeGenerator() {

    const workflowId =
      getWorkflowId();


    if (
      !workflowId
    ) {

      return;

    }


    try {

      const source =
        await loadPdfSource(
          workflowId
        );


      if (
        source?.can_generate_pdf ===
        false
      ) {

        return;

      }


      ensureGeneratorButton(
        source
      );

    }

    catch (error) {

      console.info(

        "Controlled PDF generator unavailable for this workflow state:",

        error?.message ||
        error

      );

    }

  }


  /* =========================================================
     OPTIONAL GLOBAL ACCESS
  ========================================================= */

  window.CTRControlledPdfGenerator = {

    generate:
      function () {

        const button =
          document.getElementById(
            "generateControlledCtrPdf"
          );


        return generateControlledPdf(
          button
        );

      }

  };


  /* =========================================================
     START
  ========================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      function () {

        setTimeout(
          initializeGenerator,
          300
        );

      }
    );

  }

  else {

    setTimeout(
      initializeGenerator,
      300
    );

  }

})();