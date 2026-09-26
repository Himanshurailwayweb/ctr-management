/* =========================================================
   CTR MANAGEMENT SYSTEM
   APPROVED CTR / PDF REGISTER

   DATA SOURCE:
   public.list_current_approved_ctr()

   USER DISPLAY:
   Initial CTR
   1st Modification
   2nd Modification
   3rd Modification...

   INTERNAL V1 / V2 / V3 VALUES ARE NOT SHOWN HERE.
========================================================= */


(() => {

  "use strict";


  /* =====================================================
     ELEMENTS
  ===================================================== */

  const approvedCtrList =
    document.getElementById(
      "approvedCtrList"
    );

  const approvedCtrSearch =
    document.getElementById(
      "approvedCtrSearch"
    );

  const refreshApprovedCtr =
    document.getElementById(
      "refreshApprovedCtr"
    );

  const approvedCtrStatus =
    document.getElementById(
      "approvedCtrStatus"
    );

  const approvedCtrCount =
    document.getElementById(
      "approvedCtrCount"
    );

  const initialCtrCount =
    document.getElementById(
      "initialCtrCount"
    );

  const approvedModificationCount =
    document.getElementById(
      "approvedModificationCount"
    );

  const finalPdfCount =
    document.getElementById(
      "finalPdfCount"
    );


  /* =====================================================
     STATE
  ===================================================== */

  let approvedRecords = [];

  let loading = false;


  /* =====================================================
     SAFE HTML
  ===================================================== */

  function escapeHtml(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    return String(value)

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
     DISPLAY VALUE
  ===================================================== */

  function displayValue(
    value,
    fallback = "—"
  ) {

    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {

      return fallback;

    }


    return String(value).trim();

  }


  /* =====================================================
     DATE / TIME
  ===================================================== */

  function formatDateTime(value) {

    if (!value) {

      return "—";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "—";

    }


    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  }


  /* =====================================================
     STATUS MESSAGE
  ===================================================== */

  function showStatus(
    message,
    type = "normal"
  ) {

    if (!approvedCtrStatus) {

      return;

    }


    approvedCtrStatus.hidden =
      false;


    approvedCtrStatus.textContent =
      message;


    if (type === "error") {

      approvedCtrStatus.style.background =
        "#fff4f4";

      approvedCtrStatus.style.borderColor =
        "#dfbcbc";

      approvedCtrStatus.style.color =
        "#8a3434";

      return;

    }


    approvedCtrStatus.style.background =
      "#f8fafc";

    approvedCtrStatus.style.borderColor =
      "#d3dde7";

    approvedCtrStatus.style.color =
      "#526b82";

  }


  function hideStatus() {

    if (approvedCtrStatus) {

      approvedCtrStatus.hidden =
        true;

    }

  }


  /* =====================================================
     LOADING
  ===================================================== */

  function renderLoading() {

    if (!approvedCtrList) {

      return;

    }


    approvedCtrList.innerHTML = `

      <div class="approved-empty">

        <strong>
          Loading approved CTR records...
        </strong>

        <p>
          Reading authorized final CTR records.
        </p>

      </div>

    `;

  }


  /* =====================================================
     EMPTY
  ===================================================== */

  function renderEmpty(
    searchActive = false
  ) {

    if (!approvedCtrList) {

      return;

    }


    approvedCtrList.innerHTML = `

      <div class="approved-empty">

        <strong>

          ${
            searchActive
              ? "No matching CTR record found."
              : "No approved CTR record available."
          }

        </strong>

        <p>

          ${
            searchActive
              ? "Try another station, code, division or CTR record."
              : "Final approved Initial CTR and Modification records will appear here."
          }

        </p>

      </div>

    `;

  }


  /* =====================================================
     SUMMARY
  ===================================================== */

  function updateSummary() {

    const total =
      approvedRecords.length;


    const initial =
      approvedRecords.filter(
        (record) =>
          Number(
            record.version_number
          ) === 1
      ).length;


    const modifications =
      approvedRecords.filter(
        (record) =>
          Number(
            record.version_number
          ) > 1
      ).length;


    const pdfCount =
      approvedRecords.filter(
        (record) => {

          const pdfPath =
            String(
              record.pdf_path || ""
            ).trim();


          return Boolean(
            pdfPath
          );

        }
      ).length;


    if (approvedCtrCount) {

      approvedCtrCount.textContent =
        String(total);

    }


    if (initialCtrCount) {

      initialCtrCount.textContent =
        String(initial);

    }


    if (approvedModificationCount) {

      approvedModificationCount.textContent =
        String(modifications);

    }


    if (finalPdfCount) {

      finalPdfCount.textContent =
        String(pdfCount);

    }

  }


  /* =====================================================
     PDF STATUS
  ===================================================== */

  function getPdfState(record) {

    const pdfPath =
      displayValue(
        record.pdf_path,
        ""
      );


    if (!pdfPath) {

      return `

        <span class="approved-pdf-state">

          Not Generated

        </span>

      `;

    }


    return `

      <span
        class="
          approved-pdf-state
          available
        "
      >

        Final PDF

      </span>

    `;

  }


  /* =====================================================
     PDF ACTION
  ===================================================== */

  function getPdfAction(record) {

    const pdfPath =
      displayValue(
        record.pdf_path,
        ""
      );


    if (!pdfPath) {

      return `

        <span class="disabled-action">

          PDF Pending

        </span>

      `;

    }


    /*
       If a full URL has already been saved,
       it can be opened directly.
    */

    if (
      pdfPath.startsWith("http://") ||
      pdfPath.startsWith("https://")
    ) {

      return `

        <a
          href="${escapeHtml(pdfPath)}"
          target="_blank"
          rel="noopener noreferrer"
        >

          Open PDF

        </a>

      `;

    }


    /*
       Supabase Storage path handling will be added
       with the final PDF workflow.
    */

    return `

      <span
        class="disabled-action"
        title="Final PDF storage connection will be handled by the PDF workflow."
      >

        PDF Stored

      </span>

    `;

  }


  /* =====================================================
     REGISTER
  ===================================================== */

  function renderRecords(records) {

    if (!approvedCtrList) {

      return;

    }


    if (
      !Array.isArray(records) ||
      records.length === 0
    ) {

      renderEmpty(
        Boolean(
          approvedCtrSearch
            ?.value
            ?.trim()
        )
      );

      return;

    }


    const rows =
      records.map(
        (
          record,
          index
        ) => {


          const stationName =
            escapeHtml(
              displayValue(
                record.station_name
              )
            );


          const stationCode =
            escapeHtml(
              displayValue(
                record.station_code
              )
            );


          const divisionName =
            escapeHtml(
              displayValue(
                record.division_name
              )
            );


          const divisionCode =
            escapeHtml(
              displayValue(
                record.division_code,
                ""
              )
            );


          const sectionalIncharge =
            escapeHtml(
              displayValue(
                record.sectional_incharge_designation
              )
            );


          const currentRecord =
            escapeHtml(
              displayValue(
                record.display_name,
                "Approved CTR"
              )
            );


          const approvedOn =
            escapeHtml(
              formatDateTime(
                record.approved_at ||
                record.version_created_at
              )
            );


          const approvedBy =
            escapeHtml(
              displayValue(
                record.approved_by_name,
                "Not recorded"
              )
            );


          const approvedDesignation =
            escapeHtml(
              displayValue(
                record.approved_by_designation,
                ""
              )
            );


          const stationId =
            encodeURIComponent(
              record.station_id
            );


          const versionNumber =
            Number(
              record.version_number
            ) || 1;


          return `

            <tr>


              <td class="approved-sno">

                ${index + 1}

              </td>


              <td class="approved-station">

                ${stationName}

                <span class="approved-station-code">

                  ${stationCode}

                </span>

              </td>


              <td>

                ${divisionName}

                ${
                  divisionCode

                    ? `

                      <span class="approved-record-sub">

                        ${divisionCode}

                      </span>

                    `

                    : ""
                }

              </td>


              <td>

                ${sectionalIncharge}

              </td>


              <td>

                <span class="approved-record-name">

                  ${currentRecord}

                </span>


                <span class="approved-record-sub">

                  ${
                    versionNumber === 1
                      ? "Initial approved station CTR"
                      : "Final approved modification"
                  }

                </span>

              </td>


              <td>

                ${approvedOn}

              </td>


              <td>

                ${approvedBy}

                ${
                  approvedDesignation

                    ? `

                      <span class="approved-record-sub">

                        ${approvedDesignation}

                      </span>

                    `

                    : ""
                }

              </td>


              <td>

                ${getPdfState(record)}

              </td>


              <td>

                <div class="approved-actions">


                  <a
                    class="open-ctr-action"
                    href="station.html?id=${stationId}"
                    title="Open CTR"
                  >

                    Open CTR

                  </a>


                  ${getPdfAction(record)}


                </div>

              </td>


            </tr>

          `;

        }
      ).join("");


    approvedCtrList.innerHTML = `

      <div class="approved-register-wrap">

        <table class="approved-register">


          <thead>

            <tr>

              <th>
                S.No
              </th>

              <th>
                Station
              </th>

              <th>
                Division
              </th>

              <th>
                Sectional Incharge
              </th>

              <th>
                Current Record
              </th>

              <th>
                Approved On
              </th>

              <th>
                Final Approved By
              </th>

              <th>
                PDF
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>


          <tbody>

            ${rows}

          </tbody>


        </table>

      </div>

    `;

  }


  /* =====================================================
     SEARCH
  ===================================================== */

  function applySearch() {

    const query =
      approvedCtrSearch
        ?.value
        ?.trim()
        ?.toLowerCase()
        || "";


    if (!query) {

      renderRecords(
        approvedRecords
      );

      return;

    }


    const filtered =
      approvedRecords.filter(
        (record) => {


          const searchableText = [

            record.station_name,

            record.station_code,

            record.division_name,

            record.division_code,

            record.sectional_incharge_designation,

            record.display_name,

            record.approved_by_name,

            record.approved_by_designation

          ]

            .filter(Boolean)

            .join(" ")

            .toLowerCase();


          return searchableText.includes(
            query
          );

        }
      );


    renderRecords(
      filtered
    );

  }


  /* =====================================================
     SUPABASE CLIENT
  ===================================================== */

  function getSupabaseClient() {

    try {

      if (
        typeof supabaseClient !== "undefined" &&
        supabaseClient &&
        typeof supabaseClient.rpc === "function"
      ) {

        return supabaseClient;

      }

    }

    catch (error) {

      console.warn(
        "Supabase global client check:",
        error
      );

    }


    if (
      window.supabaseClient &&
      typeof window.supabaseClient.rpc === "function"
    ) {

      return window.supabaseClient;

    }


    return null;

  }


  async function waitForSupabaseClient() {

    for (
      let attempt = 0;
      attempt < 100;
      attempt += 1
    ) {

      const client =
        getSupabaseClient();


      if (client) {

        return client;

      }


      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            50
          )
      );

    }


    return null;

  }


  /* =====================================================
     LOAD APPROVED CTR
  ===================================================== */

  async function loadApprovedCtr() {

    if (loading) {

      return;

    }


    loading =
      true;


    renderLoading();


    showStatus(
      "Loading approved CTR records..."
    );


    try {


      const client =
        await waitForSupabaseClient();


      if (!client) {

        throw new Error(
          "Supabase connection is not available."
        );

      }


      const {
        data,
        error
      } =
        await client.rpc(
          "list_current_approved_ctr"
        );


      if (error) {

        console.error(
          "Approved CTR feed error:",
          error
        );

        throw error;

      }


      approvedRecords =
        Array.isArray(data)
          ? data
          : [];


      console.log(
        "APPROVED CTR RECORDS:",
        approvedRecords
      );


      updateSummary();


      applySearch();


      hideStatus();


    }

    catch (error) {


      console.error(
        "Unable to load approved CTR:",
        error
      );


      approvedRecords =
        [];


      updateSummary();


      renderEmpty(false);


      showStatus(
        error?.message ||
        "Unable to load approved CTR records.",
        "error"
      );


    }

    finally {

      loading =
        false;

    }

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  if (approvedCtrSearch) {

    approvedCtrSearch.addEventListener(
      "input",
      applySearch
    );

  }


  if (refreshApprovedCtr) {

    refreshApprovedCtr.addEventListener(
      "click",
      loadApprovedCtr
    );

  }


  /* =====================================================
     START
  ===================================================== */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      loadApprovedCtr
    );

  }

  else {

    loadApprovedCtr();

  }


})();