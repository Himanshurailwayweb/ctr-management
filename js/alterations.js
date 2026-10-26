/* =========================================================
   CTR MANAGEMENT SYSTEM
   ALTERATION MANAGEMENT
========================================================= */

(() => {

  "use strict";


  /* =====================================================
     STATE
  ===================================================== */

  const alterationState = {

    stations: [],

    versions: [],

    alterations: [],

    user: null,

    started: false

  };


  /* =====================================================
     HELPERS
  ===================================================== */

  function escapeHtml(value) {

    return String(
      value ?? ""
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


  function formatDate(value) {

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


  function getStation(
    stationId
  ) {

    return alterationState
      .stations
      .find(
        station =>
          station.id ===
          stationId
      );

  }


  function getLatestApprovedVersion(
    stationId
  ) {

    return alterationState
      .versions

      .filter(
        version =>

          version.station_id ===
            stationId

          &&

          version.status ===
            "APPROVED"
      )

      .sort(
        (
          a,
          b
        ) =>

          Number(
            b.version_number
          )

          -

          Number(
            a.version_number
          )
      )[0] || null;

  }


  /* =====================================================
     PAGE CARDS
  ===================================================== */

  function findModuleCard(
    heading
  ) {

    return Array.from(
      document.querySelectorAll(
        ".module-card"
      )
    )

      .find(
        card =>

          card
            .querySelector(
              "h3"
            )
            ?.textContent
            ?.trim() ===
          heading
      );

  }


  function getCardButton(
    heading
  ) {

    return findModuleCard(
      heading
    )
      ?.querySelector(
        "button"
      ) || null;

  }


  /* =====================================================
     STATUS
  ===================================================== */

  function ensureStatusArea() {

    let element =
      document.getElementById(
        "alterationPageStatus"
      );


    if (element) {
      return element;
    }


    element =
      document.createElement(
        "div"
      );


    element.id =
      "alterationPageStatus";


    element.style.cssText = `
      margin: 0 0 18px;
      padding: 12px 14px;
      border: 1px solid #d3dde7;
      background: #f8fafc;
      color: #526b82;
      font-size: 12px;
      display: none;
    `;


    document
      .querySelector(
        ".module-heading"
      )
      ?.after(
        element
      );


    return element;

  }


  function showStatus(
    message,
    type = "normal"
  ) {

    const element =
      ensureStatusArea();


    element.style.display =
      "block";


    element.textContent =
      message;


    if (
      type ===
      "error"
    ) {

      element.style.background =
        "#fff4f4";

      element.style.borderColor =
        "#dfbcbc";

      element.style.color =
        "#8a3434";

      return;

    }


    if (
      type ===
      "success"
    ) {

      element.style.background =
        "#f3f8f4";

      element.style.borderColor =
        "#bfd6c3";

      element.style.color =
        "#356345";

      return;

    }


    element.style.background =
      "#f8fafc";

    element.style.borderColor =
      "#d3dde7";

    element.style.color =
      "#526b82";

  }


  function hideStatus() {

    const element =
      document.getElementById(
        "alterationPageStatus"
      );


    if (element) {

      element.style.display =
        "none";

    }

  }


  /* =====================================================
     LOAD DATA
  ===================================================== */

  async function loadAlterationData() {

    const sessionResult =
      await supabaseClient
        .auth
        .getSession();


    alterationState.user =
      sessionResult
        ?.data
        ?.session
        ?.user || null;


    if (
      !alterationState.user
    ) {

      throw new Error(
        "Login session is unavailable."
      );

    }


    const [
      stationsResult,
      versionsResult,
      alterationsResult
    ] =

      await Promise.all([

        supabaseClient
          .from(
            "stations"
          )
          .select(`
            id,
            station_name,
            station_code,
            division,
            sectional_incharge_designation,
            ctr_status,
            current_version,
            is_active
          `)
          .eq(
            "is_active",
            true
          )
          .order(
            "station_name",
            {
              ascending:
                true
            }
          ),


        supabaseClient
          .from(
            "ctr_versions"
          )
          .select(`
            id,
            station_id,
            version_number,
            version_label,
            source_type,
            status,
            pdf_path,
            finalized_at,
            created_at
          `)
          .eq(
            "status",
            "APPROVED"
          )
          .order(
            "version_number",
            {
              ascending:
                false
            }
          ),


        supabaseClient
          .from(
            "alterations"
          )
          .select(`
            id,
            station_id,
            base_version_id,
            alteration_number,
            alteration_type,
            title,
            reason,
            change_summary,
            status,
            created_by,
            submitted_by,
            submitted_at,
            finalized_version_id,
            created_at,
            updated_at
          `)
          .order(
            "created_at",
            {
              ascending:
                false
            }
          )

      ]);


    if (
      stationsResult.error
    ) {

      throw stationsResult.error;

    }


    if (
      versionsResult.error
    ) {

      throw versionsResult.error;

    }


    if (
      alterationsResult.error
    ) {

      throw alterationsResult.error;

    }


    alterationState.stations =
      stationsResult.data || [];


    alterationState.versions =
      versionsResult.data || [];


    alterationState.alterations =
      alterationsResult.data || [];

  }


  /* =====================================================
     APPROVED STATIONS
  ===================================================== */

  function getApprovedStations() {

    return alterationState
      .stations
      .filter(
        station =>

          Boolean(
            getLatestApprovedVersion(
              station.id
            )
          )
      );

  }


  /* =====================================================
     UPDATE CARDS
  ===================================================== */

  function updateCards() {

    const approvedStations =
      getApprovedStations();


    const createButton =
      getCardButton(
        "Create CTR Alteration"
      );


    if (
      createButton
    ) {

      if (
        approvedStations.length >
        0
      ) {

        createButton.disabled =
          false;

        createButton.textContent =
          "Create Alteration";

        createButton.onclick =
          openCreateDialog;

      }

      else {

        createButton.disabled =
          true;

        createButton.textContent =
          "Available After Initial CTR";

      }

    }



    const submitted =
      alterationState
        .alterations
        .filter(
          record =>

            [
              "SUBMITTED",
              "UNDER_REVIEW",
              "APPROVED"
            ]
              .includes(
                record.status
              )
        );


    const submittedButton =
      getCardButton(
        "Submitted Alterations"
      );


    if (
      submittedButton
    ) {

      submittedButton.textContent =
        submitted.length

          ? `View ${submitted.length} Request${
              submitted.length === 1
                ? ""
                : "s"
            }`

          : "No Requests Yet";


      submittedButton.disabled =
        submitted.length ===
        0;


      if (
        submitted.length
      ) {

        submittedButton.onclick =
          () =>
            showFilteredRecords(
              [
                "SUBMITTED",
                "UNDER_REVIEW",
                "APPROVED"
              ]
            );

      }

    }



    const returned =
      alterationState
        .alterations
        .filter(
          record =>

            record.status ===
              "RETURNED_FOR_CORRECTION"
        );


    const returnedButton =
      getCardButton(
        "Returned for Correction"
      );


    if (
      returnedButton
    ) {

      returnedButton.textContent =
        returned.length

          ? `View ${returned.length} Returned`

          : "No Returned Requests";


      returnedButton.disabled =
        returned.length ===
        0;


      if (
        returned.length
      ) {

        returnedButton.onclick =
          () =>
            showFilteredRecords(
              [
                "RETURNED_FOR_CORRECTION"
              ]
            );

      }

    }



    const finalized =
      alterationState
        .alterations
        .filter(
          record =>

            record.status ===
              "FINALIZED"
        );


    const finalizedButton =
      getCardButton(
        "Finalized Alterations"
      );


    if (
      finalizedButton
    ) {

      finalizedButton.textContent =
        finalized.length

          ? `View ${finalized.length} Finalized`

          : "No Finalized Records";


      finalizedButton.disabled =
        finalized.length ===
        0;


      if (
        finalized.length
      ) {

        finalizedButton.onclick =
          () =>
            showFilteredRecords(
              [
                "FINALIZED"
              ]
            );

      }

    }

  }


  /* =====================================================
     CREATE ALTERATION DIALOG
  ===================================================== */

  function ensureCreateDialog() {

    let dialog =
      document.getElementById(
        "createAlterationDialog"
      );


    if (dialog) {
      return dialog;
    }


    const style =
      document.createElement(
        "style"
      );


    style.textContent = `

      #createAlterationDialog {
        width:
          min(
            620px,
            calc(100vw - 30px)
          );

        padding: 0;

        border:
          1px solid #bccbd8;

        border-radius:
          4px;

        background:
          #ffffff;

        box-shadow:
          0 20px 60px
          rgba(24, 54, 83, 0.22);
      }


      #createAlterationDialog::backdrop {
        background:
          rgba(19, 39, 59, 0.42);
      }


      .alteration-dialog-head {
        padding:
          17px 18px;

        border-bottom:
          1px solid #d9e1e8;

        background:
          #f4f7fa;
      }


      .alteration-dialog-head strong {
        display: block;

        color:
          #173e6e;

        font-size:
          15px;
      }


      .alteration-dialog-head span {
        display: block;

        margin-top:
          5px;

        color:
          #718294;

        font-size:
          11px;
      }


      .alteration-dialog-body {
        display: grid;

        gap:
          14px;

        padding:
          18px;
      }


      .alteration-dialog-field label {
        display: block;

        margin-bottom:
          6px;

        color:
          #415f78;

        font-size:
          10px;

        font-weight:
          700;
      }


      .alteration-dialog-field input,
      .alteration-dialog-field select,
      .alteration-dialog-field textarea {
        width:
          100%;

        box-sizing:
          border-box;

        padding:
          10px;

        border:
          1px solid #c6d3df;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #294967;

        font:
          inherit;

        font-size:
          11px;

        outline:
          none;
      }


      .alteration-dialog-field textarea {
        min-height:
          85px;

        resize:
          vertical;
      }


      .alteration-dialog-actions {
        display:
          flex;

        justify-content:
          flex-end;

        gap:
          8px;

        padding:
          0 18px 18px;
      }


      .alteration-dialog-actions button {
        min-height:
          36px;

        padding:
          0 14px;

        border:
          1px solid #bdcad6;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #173e6e;

        font-size:
          10px;

        font-weight:
          700;

        cursor:
          pointer;
      }


      #saveAlterationDraft {
        border-color:
          #345f89;

        background:
          #173e6e;

        color:
          #ffffff;
      }

    `;


    document.head.appendChild(
      style
    );


    dialog =
      document.createElement(
        "dialog"
      );


    dialog.id =
      "createAlterationDialog";


    dialog.innerHTML = `

      <div class="alteration-dialog-head">

        <strong>
          Create CTR Alteration
        </strong>

        <span>
          A controlled copy of the latest approved CTR will be created.
        </span>

      </div>


      <div class="alteration-dialog-body">


        <div class="alteration-dialog-field">

          <label for="alterationStation">
            Station
          </label>

          <select id="alterationStation"></select>

        </div>


        <div
          id="alterationBaseVersionInfo"
          style="
            padding:10px 12px;
            border:1px solid #d7e0e8;
            background:#f7f9fb;
            color:#526b82;
            font-size:11px;
          "
        ></div>


        <div class="alteration-dialog-field">

          <label for="alterationTitle">
            Alteration Title
          </label>

          <input
            id="alterationTitle"
            type="text"
            maxlength="150"
            placeholder="Example: Modification in K1 conductor details"
          >

        </div>


        <div class="alteration-dialog-field">

          <label for="alterationReason">
            Reason
          </label>

          <textarea
            id="alterationReason"
            placeholder="Why is this CTR alteration required?"
          ></textarea>

        </div>


        <div class="alteration-dialog-field">

          <label for="alterationSummary">
            Proposed Change Summary
          </label>

          <textarea
            id="alterationSummary"
            placeholder="Briefly describe the proposed CTR modification."
          ></textarea>

        </div>


      </div>


      <div class="alteration-dialog-actions">

        <button
          type="button"
          id="cancelAlterationDialog"
        >
          Cancel
        </button>


        <button
          type="button"
          id="saveAlterationDraft"
        >
          Create Draft
        </button>

      </div>

    `;


    document.body.appendChild(
      dialog
    );


    document
      .getElementById(
        "cancelAlterationDialog"
      )
      ?.addEventListener(
        "click",
        () =>
          dialog.close()
      );


    document
      .getElementById(
        "alterationStation"
      )
      ?.addEventListener(
        "change",
        updateDialogBaseVersion
      );


    document
      .getElementById(
        "saveAlterationDraft"
      )
      ?.addEventListener(
        "click",
        createAlterationDraft
      );


    return dialog;

  }


  function updateDialogBaseVersion() {

    const stationId =
      document
        .getElementById(
          "alterationStation"
        )
        ?.value;


    const version =
      getLatestApprovedVersion(
        stationId
      );


    const info =
      document.getElementById(
        "alterationBaseVersionInfo"
      );


    if (
      !info
    ) {

      return;

    }


    if (
      !version
    ) {

      info.textContent =
        "No approved CTR version available.";

      return;

    }


    info.textContent =
      `Base CTR: ${
        version.version_label ||
        `V${version.version_number}`
      } • Approved ${formatDate(
        version.finalized_at
      )}`;

  }


  function openCreateDialog() {

    const dialog =
      ensureCreateDialog();


    const stationSelect =
      document.getElementById(
        "alterationStation"
      );


    const approvedStations =
      getApprovedStations();


    stationSelect.innerHTML =
      approvedStations
        .map(
          station => {

            const version =
              getLatestApprovedVersion(
                station.id
              );


            return `

              <option
                value="${escapeHtml(
                  station.id
                )}"
              >
                ${escapeHtml(
                  station.station_name
                )}
                (${escapeHtml(
                  station.station_code
                )})
                —
                ${escapeHtml(
                  version?.version_label ||
                  `V${version?.version_number}`
                )}

              </option>

            `;

          }
        )
        .join("");


    document
      .getElementById(
        "alterationTitle"
      )
      .value = "";


    document
      .getElementById(
        "alterationReason"
      )
      .value = "";


    document
      .getElementById(
        "alterationSummary"
      )
      .value = "";


    updateDialogBaseVersion();


    dialog.showModal();

  }


  /* =====================================================
     CREATE DATABASE ALTERATION
  ===================================================== */

  async function createAlterationDraft() {

    const stationId =
      document
        .getElementById(
          "alterationStation"
        )
        ?.value;


    const title =
      document
        .getElementById(
          "alterationTitle"
        )
        ?.value
        ?.trim();


    const reason =
      document
        .getElementById(
          "alterationReason"
        )
        ?.value
        ?.trim();


    const summary =
      document
        .getElementById(
          "alterationSummary"
        )
        ?.value
        ?.trim();


    if (
      !stationId ||
      !title ||
      !reason ||
      !summary
    ) {

      alert(
        "Station, title, reason and change summary are required."
      );

      return;

    }


    const button =
      document.getElementById(
        "saveAlterationDraft"
      );


    button.disabled =
      true;


    button.textContent =
      "Creating...";


    try {

      const {
        data,
        error
      } =

        await supabaseClient
          .rpc(
            "create_ctr_alteration_draft",
            {

              p_station_id:
                stationId,

              p_title:
                title,

              p_reason:
                reason,

              p_change_summary:
                summary

            }
          );


      if (
        error
      ) {

        throw error;

      }


      document
        .getElementById(
          "createAlterationDialog"
        )
        ?.close();


      showStatus(
        `Alteration draft created successfully. Alteration ID: ${data}`,
        "success"
      );


      await loadAlterationData();


      updateCards();


      renderAlterationRecords();


    }

    catch (error) {

      console.error(
        "Create alteration error:",
        error
      );


      alert(
        error.message ||
        "Alteration draft could not be created."
      );

    }

    finally {

      button.disabled =
        false;


      button.textContent =
        "Create Draft";

    }

  }

  /* =====================================================
   SUBMIT ALTERATION FOR APPROVAL
===================================================== */

async function submitAlterationForApproval(
  alterationId
) {

  const record =
    alterationState.alterations.find(
      item =>
        item.id === alterationId
    );


  if (!record) {

    alert(
      "Alteration record was not found."
    );

    return;

  }


  if (
    ![
      "DRAFT",
      "RETURNED_FOR_CORRECTION"
    ].includes(
      record.status
    )
  ) {

    alert(
      "This alteration is no longer available for submission."
    );

    return;

  }


  const confirmed =
    window.confirm(
      "Submit this CTR Alteration for officer approval?\n\nAfter submission, the draft will become read-only unless it is returned for correction."
    );


  if (!confirmed) {
    return;
  }


  try {

    showStatus(
      "Submitting CTR alteration for approval..."
    );


    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "submit_ctr_alteration",
        {
          p_alteration_id:
            alterationId
        }
      );


    if (error) {
      throw error;
    }


    showStatus(
      "CTR Alteration submitted for approval successfully.",
      "success"
    );


    await loadAlterationData();

    updateCards();

    renderAlterationRecords();


    console.log(
      "ALTERATION SUBMITTED:",
      data
    );

  }

  catch (error) {

    console.error(
      "Submit alteration error:",
      error
    );


    showStatus(
      error?.message ||
      "CTR Alteration could not be submitted.",
      "error"
    );


    alert(
      error?.message ||
      "CTR Alteration could not be submitted."
    );

  }

}


/*
   Expose only this controlled page action because
   register buttons are rendered dynamically.
*/
window.submitAlterationForApproval =
  submitAlterationForApproval;

  /* =====================================================
     ALTERATION REGISTER
  ===================================================== */

  function ensureRecordsSection() {

    let section =
      document.getElementById(
        "alterationRecordsSection"
      );


    if (
      section
    ) {

      return section;

    }


    section =
      document.createElement(
        "section"
      );


    section.id =
      "alterationRecordsSection";


    section.className =
      "workflow-section";


    const workflowSection =
      document.querySelector(
        ".workflow-section"
      );


    workflowSection
      ?.before(
        section
      );


    return section;

  }


  function statusLabel(
    status
  ) {

    return String(
      status || "DRAFT"
    )
      .replaceAll(
        "_",
        " "
      );

  }


  function renderRecords(
    records,
    title =
      "Alteration Register"
  ) {

    const section =
      ensureRecordsSection();


    if (
      !records.length
    ) {

      section.innerHTML = `

        <div class="section-title">

          <h2>
            ${escapeHtml(
              title
            )}
          </h2>

          <p>
            No alteration records available.
          </p>

        </div>

      `;

      return;

    }


    const cards =
      records
        .map(
          record => {

            const station =
              getStation(
                record.station_id
              );


            const baseVersion =
              alterationState
                .versions
                .find(
                  version =>
                    version.id ===
                    record.base_version_id
                );


            return `

              <article
                class="module-card"
                style="margin-bottom:12px;"
              >

                <div class="card-content">

                  <span class="card-label">

                    ${escapeHtml(
                      record.alteration_number ||
                      "ALTERATION"
                    )}

                  </span>


                  <h3>

                    ${escapeHtml(
                      station?.station_name ||
                      "Station"
                    )}

                    (${escapeHtml(
                      station?.station_code ||
                      "—"
                    )})

                  </h3>


                  <p>

                    <strong>
                      ${escapeHtml(
                        record.title ||
                        "CTR Alteration"
                      )}
                    </strong>

                    <br>

                    Base:
                    ${escapeHtml(
                      baseVersion
                        ?.version_label ||
                      (
                        baseVersion
                          ?.version_number

                          ? `V${baseVersion.version_number}`

                          : "—"
                      )
                    )}

                    &nbsp; • &nbsp;

                    Status:
                    ${escapeHtml(
                      statusLabel(
                        record.status
                      )
                    )}

                    <br>

                    Created:
                    ${escapeHtml(
                      formatDate(
                        record.created_at
                      )
                    )}

                  </p>


                 ${
  [
    "DRAFT",
    "RETURNED_FOR_CORRECTION",
    "SUBMITTED",
    "UNDER_REVIEW",
    "APPROVED"
  ].includes(
    record.status
  )

    ?

    `
      <button
        type="button"
        onclick="
          window.location.href=
          'station.html?id=${encodeURIComponent(
            record.station_id
          )}&alteration=${encodeURIComponent(
            record.id
          )}&mode=alteration'
        "
      >

        ${
          record.status === "DRAFT"
            ? "Open Alteration Draft"

            : record.status ===
              "RETURNED_FOR_CORRECTION"
              ? "Open for Correction"

              : "View Submitted Alteration"
        }

      </button>
    `

    :

    ""
}

                </div>

              </article>

            `;

          }
        )
        .join("");


    section.innerHTML = `

      <div class="section-title">

        <h2>
          ${escapeHtml(
            title
          )}
        </h2>

        <p>
          Controlled station-wise CTR alteration records.
        </p>

      </div>


      <div class="module-grid">

        ${cards}

      </div>

    `;

  }


  function renderAlterationRecords() {

    renderRecords(
      alterationState
        .alterations
        .slice(
          0,
          20
        )
    );

  }


  function showFilteredRecords(
    statuses
  ) {

    const records =
      alterationState
        .alterations
        .filter(
          record =>
            statuses.includes(
              record.status
            )
        );


    renderRecords(
      records,
      "Filtered Alterations"
    );


    document
      .getElementById(
        "alterationRecordsSection"
      )
      ?.scrollIntoView(
        {
          behavior:
            "smooth"
        }
      );

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  async function initializeAlterations() {

    if (
      alterationState.started
    ) {

      return;

    }


    if (
      window.ctrAccess &&
      !window.ctrAccess.ready
    ) {

      return;

    }


    alterationState.started =
      true;


    showStatus(
      "Loading alteration records..."
    );


    try {

      await loadAlterationData();


      updateCards();


      renderAlterationRecords();


      hideStatus();


      console.log(
        "CTR ALTERATIONS READY:",
        {
          approvedStations:
            getApprovedStations()
              .length,

          alterations:
            alterationState
              .alterations
              .length
        }
      );

    }

    catch (error) {

      alterationState.started =
        false;


      console.error(
        "Alterations initialization error:",
        error
      );


      showStatus(
        error.message ||
        "Unable to load CTR alterations.",
        "error"
      );

    }

  }


  /* =====================================================
     START
  ===================================================== */

  window.addEventListener(
    "ctr-access-ready",
    initializeAlterations
  );


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initializeAlterations
    );

  }

  else {

    initializeAlterations();

  }


  setTimeout(
    initializeAlterations,
    500
  );


  setTimeout(
    initializeAlterations,
    1200
  );


})();