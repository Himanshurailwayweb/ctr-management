/* =========================================================
   CTR MANAGEMENT SYSTEM
   CTR PDF GENERATOR

   VERSION 1.0.0

   PURPOSE
   ---------------------------------------------------------
   - Generate one controlled engineering PDF.
   - All Station CTR racks included.
   - All Location Box drawings included.
   - Uses the SAME live SVG drawing already visible.
   - Does not duplicate drawing logic.
   - A3 Landscape engineering pages.
   - Draft / Version / Date metadata.
   - Exposes generated PDF Blob for later workflow upload.

========================================================= */

(function () {

  "use strict";


  const VERSION =
    "1.0.0";


  const PAGE_FORMAT =
    "a3";


  const PAGE_ORIENTATION =
    "landscape";


  const PAGE_MARGIN =
    10;


  const HEADER_HEIGHT =
    17;


  const FOOTER_HEIGHT =
    10;


  const SVG_CAPTURE_DELAY =
    180;


  let pdfBusy =
    false;


  let lastGeneratedPdf =
    null;


  let lastGeneratedFileName =
    "";


  let lastGeneratedPageCount =
    0;


  /* =====================================================
     BASIC HELPERS
  ===================================================== */

  function delay(
    milliseconds
  ) {

    return new Promise(
      function (resolve) {

        window.setTimeout(
          resolve,
          milliseconds
        );

      }
    );

  }


  async function waitFrames(
    count = 2
  ) {

    for (
      let index = 0;
      index < count;
      index++
    ) {

      await new Promise(
        function (resolve) {

          window.requestAnimationFrame(
            resolve
          );

        }
      );

    }

  }


  function cleanText(
    value,
    fallback = ""
  ) {

    const text =
      String(
        value ?? ""
      )
        .replace(
          /\s+/g,
          " "
        )
        .trim();


    return text ||
      fallback;

  }


  function safeFileName(
    value
  ) {

    return cleanText(
      value,
      "STATION"
    )
      .replace(
        /[^a-zA-Z0-9_-]+/g,
        "_"
      )
      .replace(
        /_+/g,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      );

  }


  function formatDateTime(
    value = new Date()
  ) {

    const date =
      value instanceof Date
        ? value
        : new Date(value);


    return date.toLocaleString(
      "en-IN",
      {

        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit"

      }
    );

  }


  /* =====================================================
     PAGE INFORMATION
  ===================================================== */

  function getStationName() {

    return (

      cleanText(
        document
          .querySelector(
            ".station-hero h2"
          )
          ?.textContent
      )

      ||

      cleanText(
        document
          .querySelector(
            ".topbar h1"
          )
          ?.textContent
          ?.replace(
            /\s+CTR$/i,
            ""
          )
      )

      ||

      "STATION"

    );

  }


  function getSummaryValue(
    labelText
  ) {

    const cards =
      Array.from(
        document.querySelectorAll(
          ".station-summary-grid .summary-card"
        )
      );


    const target =
      cards.find(
        function (card) {

          const label =
            cleanText(
              card
                .querySelector(
                  "span"
                )
                ?.textContent
            )
              .toLowerCase();


          return (
            label ===
            labelText
              .toLowerCase()
          );

        }
      );


    if (!target) {

      return "";

    }


    return cleanText(
      target
        .querySelector(
          "strong"
        )
        ?.textContent
    );

  }


  function getDocumentVersion() {

  const rawVersion =
    getSummaryValue(
      "Current Version"
    );


  const normalized =
    String(
      rawVersion || ""
    )
      .trim()
      .toUpperCase();


  if (
    !normalized ||
    normalized === "V0" ||
    normalized === "0" ||
    normalized === "INITIAL"
  ) {

    return "Initial CTR";

  }


  return rawVersion;

}


  function getCtrStatus() {

    return (
      getSummaryValue(
        "CTR Status"
      ) ||
      "DRAFT"
    );

  }


  /* =====================================================
     PDF STATUS
  ===================================================== */

  function ensurePdfStatus() {

    let status =
      document.getElementById(
        "ctrPdfStatus"
      );


    if (status) {

      return status;

    }


    const saveSection =
      document.querySelector(
        ".ctr-save-controls > div:first-child"
      );


    if (!saveSection) {

      return null;

    }


    status =
      document.createElement(
        "small"
      );


    status.id =
      "ctrPdfStatus";


    status.textContent =
      "PDF Ready";


    status.style.display =
      "block";


    status.style.marginTop =
      "4px";


    status.style.color =
      "#607487";


    saveSection.appendChild(
      status
    );


    return status;

  }


  function setPdfStatus(
    message,
    type = "normal"
  ) {

    const status =
      ensurePdfStatus();


    if (!status) {

      return;

    }


    status.textContent =
      message;


    if (
      type === "error"
    ) {

      status.style.color =
        "#9b2d2d";

      return;

    }


    if (
      type === "success"
    ) {

      status.style.color =
        "#31663c";

      return;

    }


    status.style.color =
      "#607487";

  }


  /* =====================================================
     JSPDF
  ===================================================== */

  function getJsPdfClass() {

    return (
      window
        .jspdf
        ?.jsPDF ||
      null
    );

  }


  function requirePdfLibrary() {

    const JsPdf =
      getJsPdfClass();


    if (!JsPdf) {

      throw new Error(
        "PDF library is not loaded. Check the jsPDF script in station.html."
      );

    }


    return JsPdf;

  }


  /* =====================================================
     SVG STYLE INLINE

     Connection drawings use CSS classes.
     Before converting to an image, computed CSS is copied
     directly into the cloned SVG.
  ===================================================== */

  const SVG_STYLE_PROPERTIES = [

    "fill",

    "fill-opacity",

    "stroke",

    "stroke-width",

    "stroke-opacity",

    "stroke-linecap",

    "stroke-linejoin",

    "stroke-dasharray",

    "font-family",

    "font-size",

    "font-weight",

    "font-style",

    "text-anchor",

    "dominant-baseline",

    "paint-order",

    "opacity",

    "visibility",

    "display",

    "shape-rendering"

  ];


  function copyComputedStyle(
    source,
    target
  ) {

    if (
      !source ||
      !target ||
      source.nodeType !== 1 ||
      target.nodeType !== 1
    ) {

      return;

    }


    const computed =
      window.getComputedStyle(
        source
      );


    SVG_STYLE_PROPERTIES.forEach(
      function (
        property
      ) {

        const value =
          computed.getPropertyValue(
            property
          );


        if (
          value &&
          value !== "normal"
        ) {

          target.style.setProperty(
            property,
            value
          );

        }

      }
    );

  }


  function cloneSvgWithStyles(
    originalSvg
  ) {

    const clone =
      originalSvg.cloneNode(
        true
      );


    clone.setAttribute(
      "xmlns",
      "http://www.w3.org/2000/svg"
    );


    clone.setAttribute(
      "xmlns:xlink",
      "http://www.w3.org/1999/xlink"
    );


    copyComputedStyle(
      originalSvg,
      clone
    );


    const sourceElements =
      originalSvg.querySelectorAll(
        "*"
      );


    const clonedElements =
      clone.querySelectorAll(
        "*"
      );


    sourceElements.forEach(
      function (
        source,
        index
      ) {

        const target =
          clonedElements[
            index
          ];


        if (target) {

          copyComputedStyle(
            source,
            target
          );

        }

      }
    );


    /*
       Remove browser-only interaction styling.
    */

    clone
      .querySelectorAll(
        "[tabindex]"
      )
      .forEach(
        function (
          element
        ) {

          element.removeAttribute(
            "tabindex"
          );

        }
      );


    clone
      .querySelectorAll(
        "[role]"
      )
      .forEach(
        function (
          element
        ) {

          element.removeAttribute(
            "role"
          );

        }
      );


    return clone;

  }


  /* =====================================================
     SVG SIZE
  ===================================================== */

  function getSvgSize(
    svg
  ) {

    const viewBox =
      cleanText(
        svg.getAttribute(
          "viewBox"
        )
      );


    if (viewBox) {

      const parts =
        viewBox
          .split(
            /[\s,]+/
          )
          .map(
            Number
          );


      if (
        parts.length ===
          4 &&
        Number.isFinite(
          parts[2]
        ) &&
        Number.isFinite(
          parts[3]
        ) &&
        parts[2] > 0 &&
        parts[3] > 0
      ) {

        return {

          width:
            parts[2],

          height:
            parts[3]

        };

      }

    }


    const width =
      parseFloat(
        svg.getAttribute(
          "width"
        )
      );


    const height =
      parseFloat(
        svg.getAttribute(
          "height"
        )
      );


    return {

      width:
        Number.isFinite(
          width
        )
          ? width
          : 1400,

      height:
        Number.isFinite(
          height
        )
          ? height
          : 800

    };

  }


  /* =====================================================
     SVG -> PNG

     High resolution is used so terminal text and engineering
     lines remain clear in the PDF.
  ===================================================== */

  async function svgToPng(
    svg
  ) {

    const size =
      getSvgSize(
        svg
      );


    const maxWidth =
      3000;


    const maxHeight =
      2100;


    let scale =
      Math.min(

        maxWidth /
          size.width,

        maxHeight /
          size.height,

        2.2

      );


    scale =
      Math.max(
        scale,
        0.5
      );


    const canvasWidth =
      Math.max(
        1,
        Math.round(
          size.width *
          scale
        )
      );


    const canvasHeight =
      Math.max(
        1,
        Math.round(
          size.height *
          scale
        )
      );


    svg.setAttribute(
      "width",
      size.width
    );


    svg.setAttribute(
      "height",
      size.height
    );


    const serialized =
      new XMLSerializer()
        .serializeToString(
          svg
        );


    const blob =
      new Blob(
        [
          serialized
        ],
        {
          type:
            "image/svg+xml;charset=utf-8"
        }
      );


    const objectUrl =
      URL.createObjectURL(
        blob
      );


    try {

      const image =
        await new Promise(
          function (
            resolve,
            reject
          ) {

            const img =
              new Image();


            img.onload =
              function () {

                resolve(
                  img
                );

              };


            img.onerror =
              function () {

                reject(
                  new Error(
                    "SVG drawing could not be converted for PDF."
                  )
                );

              };


            img.src =
              objectUrl;

          }
        );


      const canvas =
        document.createElement(
          "canvas"
        );


      canvas.width =
        canvasWidth;


      canvas.height =
        canvasHeight;


      const context =
        canvas.getContext(
          "2d"
        );


      if (!context) {

        throw new Error(
          "Browser canvas is unavailable."
        );

      }


      context.fillStyle =
        "#ffffff";


      context.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
      );


      context.drawImage(
        image,
        0,
        0,
        canvasWidth,
        canvasHeight
      );


      return {

        dataUrl:
          canvas.toDataURL(
            "image/png"
          ),

        width:
          canvasWidth,

        height:
          canvasHeight

      };

    }

    finally {

      URL.revokeObjectURL(
        objectUrl
      );

    }

  }


  /* =====================================================
     CURRENT SVG SNAPSHOT
  ===================================================== */

  function getSvgFromHost(
    hostId
  ) {

    return (
      document
        .getElementById(
          hostId
        )
        ?.querySelector(
          "svg"
        ) ||
      null
    );

  }


  async function captureHostSvg(
    hostId
  ) {

    await waitFrames(
      2
    );


    await delay(
      SVG_CAPTURE_DELAY
    );


    const svg =
      getSvgFromHost(
        hostId
      );


    if (!svg) {

      return null;

    }


    return cloneSvgWithStyles(
      svg
    );

  }


  /* =====================================================
     SELECT CHANGE
  ===================================================== */

  function changeSelect(
    select,
    value
  ) {

    if (!select) {

      return;

    }


    select.value =
      String(
        value
      );


    select.dispatchEvent(
      new Event(
        "change",
        {
          bubbles:
            true
        }
      )
    );

  }


  /* =====================================================
     STATION RACK PAGES
  ===================================================== */

  async function captureStationPages() {

    const pages =
      [];


    const select =
      document.getElementById(
        "stationSvgRackSelect"
      );


    if (
      !select ||
      select.options.length ===
      0
    ) {

      return pages;

    }


    const originalValue =
      select.value;


    const options =
      Array.from(
        select.options
      )
        .map(
          function (
            option
          ) {

            return {

              value:
                option.value,

              label:
                cleanText(
                  option.textContent,
                  "CTR Rack"
                )

            };

          }
        );


    for (
      let index = 0;
      index < options.length;
      index++
    ) {

      const option =
        options[
          index
        ];


      setPdfStatus(
        `Preparing Station CTR ${index + 1} of ${options.length}...`
      );


      changeSelect(
        select,
        option.value
      );


      await delay(
        SVG_CAPTURE_DELAY
      );


      window
        .CTR_STATION_CONNECTIONS
        ?.redraw?.();


      await delay(
        80
      );


      const svg =
        await captureHostSvg(
          "stationSvgHost"
        );


      if (svg) {

        pages.push({

          kind:
            "STATION",

          title:
            `Station CTR - ${option.label}`,

          subtitle:
            option.label,

          svg

        });

      }

    }


    changeSelect(
      select,
      originalValue
    );


    await delay(
      100
    );


    return pages;

  }


  /* =====================================================
     LOCATION BOX PAGES
  ===================================================== */

  async function captureLocationPages() {

    const pages =
      [];


    const endSelect =
      document.getElementById(
        "locationSvgEndSelect"
      );


    const boxSelect =
      document.getElementById(
        "locationSvgBoxSelect"
      );


    if (
      !endSelect ||
      !boxSelect ||
      endSelect.options.length ===
      0
    ) {

      return pages;

    }


    const originalEndValue =
      endSelect.value;


    const originalBoxValue =
      boxSelect.value;


    const ends =
      Array.from(
        endSelect.options
      )
        .map(
          function (
            option
          ) {

            return {

              value:
                option.value,

              label:
                cleanText(
                  option.textContent,
                  "Connected End"
                )

            };

          }
        );


    for (
      let endIndex = 0;
      endIndex < ends.length;
      endIndex++
    ) {

      const end =
        ends[
          endIndex
        ];


      changeSelect(
        endSelect,
        end.value
      );


      await delay(
        SVG_CAPTURE_DELAY
      );


      /*
         Changing End repopulates Location Box selector.
      */

      const locations =
        Array.from(
          boxSelect.options
        )
          .map(
            function (
              option
            ) {

              return {

                value:
                  option.value,

                label:
                  cleanText(
                    option.textContent,
                    "Location Box"
                  )

              };

            }
          );


      for (
        let locationIndex = 0;
        locationIndex <
          locations.length;
        locationIndex++
      ) {

        const location =
          locations[
            locationIndex
          ];


        setPdfStatus(
          `Preparing ${end.label} / ${location.label}...`
        );


        changeSelect(
          boxSelect,
          location.value
        );


        await delay(
          SVG_CAPTURE_DELAY
        );


        window
          .CTR_LOCATION_CONNECTIONS
          ?.redraw?.();


        await delay(
          80
        );


        const svg =
          await captureHostSvg(
            "locationSvgHost"
          );


        if (svg) {

          pages.push({

            kind:
              "LOCATION",

            title:
              `${end.label} - ${location.label}`,

            subtitle:
              `${end.label} / ${location.label}`,

            svg

          });

        }

      }

    }


    changeSelect(
      endSelect,
      originalEndValue
    );


    await delay(
      100
    );


    if (
      Array.from(
        boxSelect.options
      )
        .some(
          function (
            option
          ) {

            return (
              String(
                option.value
              ) ===
              String(
                originalBoxValue
              )
            );

          }
        )
    ) {

      changeSelect(
        boxSelect,
        originalBoxValue
      );

    }


    await delay(
      100
    );


    return pages;

  }


  /* =====================================================
     COLLECT ALL DRAWINGS
  ===================================================== */

  async function collectDrawingPages() {

    const stationPages =
      await captureStationPages();


    const locationPages =
      await captureLocationPages();


    return [

      ...stationPages,

      ...locationPages

    ];

  }


  /* =====================================================
     PDF HEADER
  ===================================================== */

  function drawPageHeader(
    pdf,
    pageInfo
  ) {

    const pageWidth =
      pdf.internal.pageSize
        .getWidth();


    const stationName =
      getStationName();


    const version =
      getDocumentVersion();


    const status =
      getCtrStatus();


    pdf.setDrawColor(
      70,
      70,
      70
    );


    pdf.setLineWidth(
      0.3
    );


    pdf.line(
      PAGE_MARGIN,
      PAGE_MARGIN +
        HEADER_HEIGHT,
      pageWidth -
        PAGE_MARGIN,
      PAGE_MARGIN +
        HEADER_HEIGHT
    );


    pdf.setTextColor(
      20,
      20,
      20
    );


    pdf.setFont(
      "helvetica",
      "bold"
    );


    pdf.setFontSize(
      12
    );


    pdf.text(
      stationName,
      PAGE_MARGIN,
      PAGE_MARGIN + 5
    );


    pdf.setFontSize(
      9
    );


    pdf.text(
      pageInfo.title,
      PAGE_MARGIN,
      PAGE_MARGIN + 10
    );


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(
      8
    );


    const rightText =
      `${version}  |  ${status}`;


    pdf.text(
      rightText,
      pageWidth -
        PAGE_MARGIN,
      PAGE_MARGIN + 5,
      {
        align:
          "right"
      }
    );


    pdf.text(
      formatDateTime(),
      pageWidth -
        PAGE_MARGIN,
      PAGE_MARGIN + 10,
      {
        align:
          "right"
      }
    );

  }


  /* =====================================================
     PDF DRAWING
  ===================================================== */

  async function drawSvgOnPage(
    pdf,
    pageInfo
  ) {

    drawPageHeader(
      pdf,
      pageInfo
    );


    const image =
      await svgToPng(
        pageInfo.svg
      );


    const pageWidth =
      pdf.internal.pageSize
        .getWidth();


    const pageHeight =
      pdf.internal.pageSize
        .getHeight();


    const availableWidth =
      pageWidth -
      (
        PAGE_MARGIN *
        2
      );


    const drawingTop =
      PAGE_MARGIN +
      HEADER_HEIGHT +
      4;


    const drawingBottom =
      pageHeight -
      PAGE_MARGIN -
      FOOTER_HEIGHT;


    const availableHeight =
      drawingBottom -
      drawingTop;


    const imageRatio =
      image.width /
      image.height;


    const areaRatio =
      availableWidth /
      availableHeight;


    let drawWidth;

    let drawHeight;


    if (
      imageRatio >
      areaRatio
    ) {

      drawWidth =
        availableWidth;


      drawHeight =
        drawWidth /
        imageRatio;

    }

    else {

      drawHeight =
        availableHeight;


      drawWidth =
        drawHeight *
        imageRatio;

    }


    const x =
      (
        pageWidth -
        drawWidth
      ) / 2;


    const y =
      drawingTop +
      (
        availableHeight -
        drawHeight
      ) / 2;


    pdf.addImage(
      image.dataUrl,
      "PNG",
      x,
      y,
      drawWidth,
      drawHeight,
      undefined,
      "FAST"
    );

  }


  /* =====================================================
     PAGE FOOTER
  ===================================================== */

  function drawPageFooter(
    pdf,
    pageNumber,
    totalPages
  ) {

    const pageWidth =
      pdf.internal.pageSize
        .getWidth();


    const pageHeight =
      pdf.internal.pageSize
        .getHeight();


    const lineY =
      pageHeight -
      PAGE_MARGIN -
      FOOTER_HEIGHT +
      2;


    pdf.setDrawColor(
      100,
      100,
      100
    );


    pdf.setLineWidth(
      0.25
    );


    pdf.line(
      PAGE_MARGIN,
      lineY,
      pageWidth -
        PAGE_MARGIN,
      lineY
    );


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.setFontSize(
      7.5
    );


    pdf.setTextColor(
      70,
      70,
      70
    );


    pdf.text(
      "CTR Management - Engineering Drawing",
      PAGE_MARGIN,
      pageHeight -
        PAGE_MARGIN -
        2
    );


    pdf.setFont(
      "helvetica",
      "bold"
    );


    pdf.text(
      "DRAFT / CONTROLLED COPY",
      pageWidth / 2,
      pageHeight -
        PAGE_MARGIN -
        2,
      {
        align:
          "center"
      }
    );


    pdf.setFont(
      "helvetica",
      "normal"
    );


    pdf.text(
      `Page ${pageNumber} of ${totalPages}`,
      pageWidth -
        PAGE_MARGIN,
      pageHeight -
        PAGE_MARGIN -
        2,
      {
        align:
          "right"
      }
    );

  }


  /* =====================================================
     FILE NAME
  ===================================================== */

  function buildFileName() {

  const station =
    safeFileName(
      getStationName()
    );


  const version =
    getDocumentVersion();


  if (
    String(version)
      .trim()
      .toUpperCase() ===
    "INITIAL CTR"
  ) {

    return (
      `${station}_Initial_CTR.pdf`
    );

  }


  return (
    `${station}_CTR_${safeFileName(version)}.pdf`
  );

}


  /* =====================================================
     GENERATE BLOB
  ===================================================== */

  async function generatePdfBlob() {

    if (
      pdfBusy
    ) {

      throw new Error(
        "PDF generation is already running."
      );

    }


    pdfBusy =
      true;


    updateButtonState();


    setPdfStatus(
      "Preparing CTR drawings..."
    );


    try {

      const JsPdf =
        requirePdfLibrary();


      const pages =
        await collectDrawingPages();


      if (
        pages.length ===
        0
      ) {

        throw new Error(
          "No CTR drawing is available for PDF generation."
        );

      }


      setPdfStatus(
        `Generating ${pages.length} PDF page(s)...`
      );


      const pdf =
        new JsPdf(
          {

            orientation:
              PAGE_ORIENTATION,

            unit:
              "mm",

            format:
              PAGE_FORMAT,

            compress:
              true,

            putOnlyUsedFonts:
              true

          }
        );


      for (
        let index = 0;
        index < pages.length;
        index++
      ) {

        if (
          index > 0
        ) {

          pdf.addPage(
            PAGE_FORMAT,
            PAGE_ORIENTATION
          );

        }


        setPdfStatus(
          `Rendering PDF page ${index + 1} of ${pages.length}...`
        );


        await drawSvgOnPage(
          pdf,
          pages[index]
        );

      }


      /*
         Add final page numbers only after total count is known.
      */

      for (
        let pageIndex = 1;
        pageIndex <= pages.length;
        pageIndex++
      ) {

        pdf.setPage(
          pageIndex
        );


        drawPageFooter(
          pdf,
          pageIndex,
          pages.length
        );

      }


      const blob =
        pdf.output(
          "blob"
        );


      const fileName =
        buildFileName();


      lastGeneratedPdf =
        blob;


      lastGeneratedFileName =
        fileName;


      lastGeneratedPageCount =
        pages.length;


      setPdfStatus(
        `PDF ready - ${pages.length} page(s)`,
        "success"
      );


      /*
         Later workflow/registration system can listen
         to this event and use the SAME Blob.
      */

      window.dispatchEvent(
        new CustomEvent(
          "ctr-pdf-generated",
          {

            detail: {

              blob,

              fileName,

              pageCount:
                pages.length,

              stationName:
                getStationName(),

              version:
                getDocumentVersion(),

              generatedAt:
                new Date()
                  .toISOString()

            }

          }
        )
      );


      return {

        blob,

        fileName,

        pageCount:
          pages.length

      };

    }

    catch (error) {

      console.error(
        "CTR PDF generation error:",
        error
      );


      setPdfStatus(
        error?.message ||
        "PDF generation failed.",
        "error"
      );


      throw error;

    }

    finally {

      pdfBusy =
        false;


      updateButtonState();

    }

  }


  /* =====================================================
     DOWNLOAD
  ===================================================== */

  async function downloadPdf() {

    try {

      const result =
        await generatePdfBlob();


      const objectUrl =
        URL.createObjectURL(
          result.blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        objectUrl;


      link.download =
        result.fileName;


      link.rel =
        "noopener";


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      window.setTimeout(
        function () {

          URL.revokeObjectURL(
            objectUrl
          );

        },
        3000
      );


      setPdfStatus(
        "CTR PDF downloaded successfully.",
        "success"
      );

    }

    catch (error) {

      alert(
        error?.message ||
        "CTR PDF could not be generated."
      );

    }

  }


  /* =====================================================
     BUTTON
  ===================================================== */

  function createPdfButton() {

    if (
      document.getElementById(
        "generateCtrPdf"
      )
    ) {

      return;

    }


    const actions =
      document.querySelector(
        ".ctr-save-actions"
      );


    if (!actions) {

      return;

    }


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.id =
      "generateCtrPdf";


    button.className =
      "secondary-action";


    button.textContent =
      "Generate CTR PDF";


    button.addEventListener(
      "click",
      downloadPdf
    );


    actions.insertBefore(
      button,
      actions.firstChild
    );

  }


  function updateButtonState() {

    const button =
      document.getElementById(
        "generateCtrPdf"
      );


    if (!button) {

      return;

    }


    button.disabled =
      pdfBusy;


    button.textContent =
      pdfBusy

        ? "Generating PDF..."

        : "Generate CTR PDF";

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  function initialize() {

    /*
       This script is also referenced by the Digital Signing
       page. Button should only appear on station page.
    */

    if (
      document.querySelector(
        ".ctr-save-actions"
      )
    ) {

      createPdfButton();

      ensurePdfStatus();

    }


    window.CTR_PDF_GENERATOR = {

      version:
        VERSION,


      generateBlob:
        generatePdfBlob,


      download:
        downloadPdf,


      getLastGenerated:
        function () {

          return {

            blob:
              lastGeneratedPdf,

            fileName:
              lastGeneratedFileName,

            pageCount:
              lastGeneratedPageCount

          };

        },


      isBusy:
        function () {

          return pdfBusy;

        }

    };


    console.log(
      "CTR PDF Generator:",
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