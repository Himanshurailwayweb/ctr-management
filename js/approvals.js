/* =========================================================
   CTR MANAGEMENT SYSTEM
   DYNAMIC WORKFLOW INBOX

   DATABASE:
   public.list_ctr_workflow_inbox()

   ACTIONS:
   - Digital Sign & Forward
   - Write Back
   - Withdraw Forwarding
   - Digital Sign & Final Approve

   IMPORTANT:
   Digital signing buttons do NOT create fake signatures.
   Signing UI/provider integration will be connected separately.
========================================================= */


(() => {

  "use strict";


  /* =====================================================
     ELEMENTS
  ===================================================== */

  const workflowInboxList =
    document.getElementById(
      "workflowInboxList"
    );

  const workflowInboxSearch =
    document.getElementById(
      "workflowInboxSearch"
    );

  const refreshWorkflowInbox =
    document.getElementById(
      "refreshWorkflowInbox"
    );

  const workflowInboxStatus =
    document.getElementById(
      "workflowInboxStatus"
    );

  const myActionCount =
    document.getElementById(
      "myActionCount"
    );

  const forwardedByMeCount =
    document.getElementById(
      "forwardedByMeCount"
    );

  const monitoringWorkflowCount =
    document.getElementById(
      "monitoringWorkflowCount"
    );

  const activeWorkflowCount =
    document.getElementById(
      "activeWorkflowCount"
    );


  /* =====================================================
     STATE
  ===================================================== */

  let workflowRecords = [];

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
     DATE
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
        "Supabase client check:",
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
     STATUS
  ===================================================== */

  function showStatus(
    message,
    type = "normal"
  ) {

    if (!workflowInboxStatus) {

      return;

    }


    workflowInboxStatus.hidden =
      false;


    workflowInboxStatus.textContent =
      message;


    if (type === "error") {

      workflowInboxStatus.style.background =
        "#fff4f4";

      workflowInboxStatus.style.borderColor =
        "#dfbcbc";

      workflowInboxStatus.style.color =
        "#8a3434";

      return;

    }


    if (type === "success") {

      workflowInboxStatus.style.background =
        "#f3f8f4";

      workflowInboxStatus.style.borderColor =
        "#bfd6c3";

      workflowInboxStatus.style.color =
        "#356345";

      return;

    }


    workflowInboxStatus.style.background =
      "#f8fafc";

    workflowInboxStatus.style.borderColor =
      "#d3dde7";

    workflowInboxStatus.style.color =
      "#526b82";

  }
  /* =========================================================
   OPEN DIGITAL SIGNING WORKSPACE
========================================================= */

function openSigningWorkspace(workflowId) {

  if (!workflowId) {

    showStatus(
      "Workflow ID is missing. Unable to open Digital Signing.",
      "error"
    );

    return;

  }

  window.location.href =
    "workflow-sign.html?workflow=" +
    encodeURIComponent(workflowId);

}

  function hideStatus() {

    if (workflowInboxStatus) {

      workflowInboxStatus.hidden =
        true;

    }

  }


  /* =====================================================
     SUMMARY
  ===================================================== */

  function updateSummary() {

    const current =
      workflowRecords.filter(
        (record) =>
          record.task_relation ===
          "CURRENT"
      ).length;


    const forwarded =
      workflowRecords.filter(
        (record) =>
          record.task_relation ===
          "FORWARDED"
      ).length;


    const monitoring =
      workflowRecords.filter(
        (record) =>
          record.task_relation ===
          "MONITORING"
      ).length;


    if (myActionCount) {

      myActionCount.textContent =
        String(current);

    }


    if (forwardedByMeCount) {

      forwardedByMeCount.textContent =
        String(forwarded);

    }


    if (monitoringWorkflowCount) {

      monitoringWorkflowCount.textContent =
        String(monitoring);

    }


    if (activeWorkflowCount) {

      activeWorkflowCount.textContent =
        String(
          workflowRecords.length
        );

    }

  }


  /* =====================================================
     EMPTY / LOADING
  ===================================================== */

  function renderLoading() {

    if (!workflowInboxList) {

      return;

    }


    workflowInboxList.innerHTML = `

      <div class="workflow-empty">

        <strong>
          Loading CTR workflow...
        </strong>

        <p>
          Reading authorized pending workflow records.
        </p>

      </div>

    `;

  }


  function renderEmpty(
    searchActive = false
  ) {

    if (!workflowInboxList) {

      return;

    }


    workflowInboxList.innerHTML = `

      <div class="workflow-empty">

        <strong>

          ${
            searchActive
              ? "No matching workflow found."
              : "No pending CTR workflow."
          }

        </strong>

        <p>

          ${
            searchActive
              ? "Try another station, officer or CTR record."
              : "CTR records requiring review or forwarding will appear here."
          }

        </p>

      </div>

    `;

  }


  /* =====================================================
     RELATION CHIP
  ===================================================== */

  function relationChip(record) {

    const relation =
      record.task_relation ||
      "MONITORING";


    if (relation === "CURRENT") {

      return `

        <span class="workflow-chip current">

          Requires My Action

        </span>

      `;

    }


    if (relation === "FORWARDED") {

      return `

        <span class="workflow-chip forwarded">

          Forwarded By Me

        </span>

      `;

    }


    return `

      <span class="workflow-chip monitoring">

        Monitoring

      </span>

    `;

  }


  /* =====================================================
     STAGE NAME
  ===================================================== */

  function getStageName(record) {

    if (
      record.current_step_type ===
      "PREPARER"
    ) {

      return "Preparation";

    }


    if (
      record.current_step_type ===
      "FINAL_APPROVAL"
    ) {

      return "Final Approval";

    }


    return "Officer Review";

  }


  /* =====================================================
     ACTION BUTTONS
  ===================================================== */

  function actionButtons(record) {

    const workflowId =
      escapeHtml(
        record.workflow_id
      );


    const stationId =
      encodeURIComponent(
        record.station_id
      );


    const buttons = [];


    /* ---------------------------------------------------
       OPEN CTR
    --------------------------------------------------- */

    buttons.push(`

      <a
        href="station.html?id=${stationId}"
        title="Open CTR"
      >

        Open CTR

      </a>

    `);


    /* ---------------------------------------------------
       SIGN + FORWARD
    --------------------------------------------------- */

    if (
      record.can_sign_and_forward === true
    ) {

      buttons.push(`

        <button
          type="button"
          class="
            primary-workflow-action
            sign-forward-action
          "
          data-workflow-id="${workflowId}"
        >

          Digital Sign & Forward

        </button>

      `);

    }


    /* ---------------------------------------------------
       WRITE BACK
    --------------------------------------------------- */

    if (
      record.can_write_back === true
    ) {

      buttons.push(`

        <button
          type="button"
          class="
            write-back-action
            workflow-write-back
          "
          data-workflow-id="${workflowId}"
        >

          Write Back

        </button>

      `);

    }


    /* ---------------------------------------------------
       FINAL APPROVAL
    --------------------------------------------------- */

    if (
      record.can_final_approve === true
    ) {

      buttons.push(`

        <button
          type="button"
          class="
            primary-workflow-action
            final-approve-action
          "
          data-workflow-id="${workflowId}"
        >

          Digital Sign & Final Approve

        </button>

      `);

    }


    /* ---------------------------------------------------
       WITHDRAW FORWARDING
    --------------------------------------------------- */

    if (
      record.can_withdraw_forwarding === true
    ) {

      buttons.push(`

        <button
          type="button"
          class="
            withdraw-action
            workflow-withdraw
          "
          data-workflow-id="${workflowId}"
        >

          Withdraw Forwarding

        </button>

      `);

    }


    return buttons.join("");

  }


  /* =====================================================
     REGISTER
  ===================================================== */

  function renderRecords(records) {

    if (!workflowInboxList) {

      return;

    }


    if (
      !Array.isArray(records) ||
      records.length === 0
    ) {

      renderEmpty(
        Boolean(
          workflowInboxSearch
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


          const division =
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


          const recordName =
            escapeHtml(
              displayValue(
                record.record_name,
                "CTR Record"
              )
            );


          const stageName =
            escapeHtml(
              getStageName(record)
            );


          const currentHolder =
            escapeHtml(
              displayValue(
                record.current_assigned_name,
                "Not recorded"
              )
            );


          const currentDesignation =
            escapeHtml(
              displayValue(
                record.current_assigned_designation,
                ""
              )
            );


          const pendingSince =
            escapeHtml(
              formatDateTime(
                record.last_action_at ||
                record.initiated_at
              )
            );


          const currentStep =
            Number(
              record.current_step_order
            ) || 1;


          const totalSteps =
            Number(
              record.total_steps
            ) || 1;


          return `

            <tr>


              <td class="workflow-sno">

                ${index + 1}

              </td>


              <td class="workflow-station">

                ${stationName}

                <span class="workflow-station-code">

                  ${stationCode}

                </span>

              </td>


              <td>

                ${division}

                ${
                  divisionCode

                    ? `

                      <span class="workflow-subtext">

                        ${divisionCode}

                      </span>

                    `

                    : ""
                }

              </td>


              <td>

                <span class="workflow-record-name">

                  ${recordName}

                </span>

              </td>


              <td>

                ${stageName}

                <span class="workflow-subtext">

                  Step ${currentStep}
                  of ${totalSteps}

                </span>

              </td>


              <td>

                ${currentHolder}

                ${
                  currentDesignation

                    ? `

                      <span class="workflow-subtext">

                        ${currentDesignation}

                      </span>

                    `

                    : ""
                }

              </td>


              <td>

                ${pendingSince}

              </td>


              <td>

                ${relationChip(record)}

              </td>


              <td>

                <div class="workflow-actions">

                  ${actionButtons(record)}

                </div>

              </td>


            </tr>

          `;

        }
      )
      .join("");


    workflowInboxList.innerHTML = `

      <div class="workflow-register-wrap">

        <table class="workflow-register">


          <thead>

            <tr>

              <th>S.No</th>

              <th>Station</th>

              <th>Division</th>

              <th>CTR Record</th>

              <th>Current Stage</th>

              <th>Current Holder</th>

              <th>Pending Since</th>

              <th>My Relation</th>

              <th>Action</th>

            </tr>

          </thead>


          <tbody>

            ${rows}

          </tbody>


        </table>

      </div>

    `;


    bindActionEvents();

  }


  /* =====================================================
     SEARCH
  ===================================================== */

  function applySearch() {

    const query =
      workflowInboxSearch
        ?.value
        ?.trim()
        ?.toLowerCase()
        || "";


    if (!query) {

      renderRecords(
        workflowRecords
      );

      return;

    }


    const filtered =
      workflowRecords.filter(
        (record) => {


          const text = [

            record.station_name,

            record.station_code,

            record.division_name,

            record.division_code,

            record.record_name,

            record.current_assigned_name,

            record.current_assigned_designation,

            getStageName(record),

            record.task_relation

          ]

            .filter(Boolean)

            .join(" ")

            .toLowerCase();


          return text.includes(
            query
          );

        }
      );


    renderRecords(
      filtered
    );

  }


  /* =====================================================
     REMARK DIALOG
  ===================================================== */

  function ensureRemarkDialog() {

    let dialog =
      document.getElementById(
        "workflowRemarkDialog"
      );


    if (dialog) {

      return dialog;

    }


    const style =
      document.createElement(
        "style"
      );


    style.textContent = `

      .workflow-remark-dialog {

        width: min(520px, calc(100vw - 30px));

        padding: 0;

        border: 1px solid #bccbd8;

        border-radius: 4px;

        background: #ffffff;

        box-shadow:
          0 20px 60px
          rgba(24, 54, 83, 0.22);

      }


      .workflow-remark-dialog::backdrop {

        background:
          rgba(19, 39, 59, 0.42);

      }


      .workflow-dialog-head {

        padding: 16px 18px;

        border-bottom:
          1px solid #d9e1e8;

        background:
          #f4f7fa;

      }


      .workflow-dialog-head strong {

        display: block;

        color:
          #173e6e;

        font-size:
          14px;

      }


      .workflow-dialog-head span {

        display: block;

        margin-top:
          5px;

        color:
          #718294;

        font-size:
          10px;

      }


      .workflow-dialog-body {

        padding:
          18px;

      }


      .workflow-dialog-body label {

        display: block;

        margin-bottom:
          7px;

        color:
          #415f78;

        font-size:
          10px;

        font-weight:
          700;

      }


      .workflow-dialog-body textarea {

        width:
          100%;

        min-height:
          110px;

        resize:
          vertical;

        box-sizing:
          border-box;

        padding:
          10px;

        border:
          1px solid #c6d3df;

        border-radius:
          3px;

        color:
          #294967;

        font:
          inherit;

        font-size:
          11px;

        outline:
          none;

      }


      .workflow-dialog-actions {

        display:
          flex;

        justify-content:
          flex-end;

        gap:
          8px;

        padding:
          0 18px 18px;

      }


      .workflow-dialog-actions button {

        min-height:
          35px;

        padding:
          0 13px;

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


      .workflow-dialog-actions
      .confirm-workflow-dialog {

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
      "workflowRemarkDialog";


    dialog.className =
      "workflow-remark-dialog";


    dialog.innerHTML = `

      <div class="workflow-dialog-head">

        <strong id="workflowDialogTitle">
          Workflow Action
        </strong>

        <span id="workflowDialogDescription">
          Enter remarks to continue.
        </span>

      </div>


      <div class="workflow-dialog-body">

        <label for="workflowDialogRemarks">

          Remarks *

        </label>

        <textarea
          id="workflowDialogRemarks"
          placeholder="Enter reason / remarks..."
        ></textarea>

      </div>


      <div class="workflow-dialog-actions">

        <button
          type="button"
          id="cancelWorkflowDialog"
        >
          Cancel
        </button>


        <button
          type="button"
          id="confirmWorkflowDialog"
          class="confirm-workflow-dialog"
        >
          Confirm
        </button>

      </div>

    `;


    document.body.appendChild(
      dialog
    );


    return dialog;

  }


  async function requestRemarks(
    title,
    description
  ) {

    const dialog =
      ensureRemarkDialog();


    const titleElement =
      document.getElementById(
        "workflowDialogTitle"
      );


    const descriptionElement =
      document.getElementById(
        "workflowDialogDescription"
      );


    const textarea =
      document.getElementById(
        "workflowDialogRemarks"
      );


    const cancelButton =
      document.getElementById(
        "cancelWorkflowDialog"
      );


    const confirmButton =
      document.getElementById(
        "confirmWorkflowDialog"
      );


    titleElement.textContent =
      title;


    descriptionElement.textContent =
      description;


    textarea.value =
      "";


    return new Promise(
      (resolve) => {


        function cleanup() {

          cancelButton.removeEventListener(
            "click",
            cancel
          );


          confirmButton.removeEventListener(
            "click",
            confirm
          );


          dialog.removeEventListener(
            "cancel",
            cancel
          );

        }


        function cancel(event) {

          event?.preventDefault();


          cleanup();


          dialog.close();


          resolve(null);

        }


        function confirm() {

          const remarks =
            textarea.value.trim();


          if (!remarks) {

            textarea.focus();

            return;

          }


          cleanup();


          dialog.close();


          resolve(remarks);

        }


        cancelButton.addEventListener(
          "click",
          cancel
        );


        confirmButton.addEventListener(
          "click",
          confirm
        );


        dialog.addEventListener(
          "cancel",
          cancel
        );


        dialog.showModal();


        textarea.focus();

      }
    );

  }


  /* =====================================================
     WRITE BACK
  ===================================================== */

  async function writeBack(
    workflowId
  ) {

    const remarks =
      await requestRemarks(

        "Write Back",

        "Return this CTR to the previous stage for correction. Remarks are compulsory."

      );


    if (!remarks) {

      return;

    }


    const client =
      await waitForSupabaseClient();


    if (!client) {

      showStatus(
        "Supabase connection is not available.",
        "error"
      );

      return;

    }


    showStatus(
      "Writing CTR back to previous stage..."
    );


    const {
      data,
      error
    } =
      await client.rpc(
        "write_back_ctr",
        {

          p_workflow_id:
            workflowId,

          p_remarks:
            remarks

        }
      );


    if (error) {

      console.error(
        "Write Back error:",
        error
      );


      showStatus(
        error.message ||
        "Unable to Write Back CTR.",
        "error"
      );

      return;

    }


    console.log(
      "WRITE BACK RESULT:",
      data
    );


    showStatus(
      "CTR written back successfully.",
      "success"
    );


    await loadWorkflowInbox();

  }


  /* =====================================================
     WITHDRAW FORWARDING
  ===================================================== */

  async function withdrawForwarding(
    workflowId
  ) {

    const remarks =
      await requestRemarks(

        "Withdraw Forwarding",

        "Withdraw the pending forwarding and return the CTR to your previous stage. Remarks are compulsory."

      );


    if (!remarks) {

      return;

    }


    const client =
      await waitForSupabaseClient();


    if (!client) {

      showStatus(
        "Supabase connection is not available.",
        "error"
      );

      return;

    }


    showStatus(
      "Withdrawing CTR forwarding..."
    );


    const {
      data,
      error
    } =
      await client.rpc(
        "withdraw_ctr_forwarding",
        {

          p_workflow_id:
            workflowId,

          p_remarks:
            remarks

        }
      );


    if (error) {

      console.error(
        "Withdraw Forwarding error:",
        error
      );


      showStatus(
        error.message ||
        "Unable to withdraw forwarding.",
        "error"
      );

      return;

    }


    console.log(
      "WITHDRAW RESULT:",
      data
    );


    showStatus(
      "Forwarding withdrawn successfully.",
      "success"
    );


    await loadWorkflowInbox();

  }


  /* =====================================================
     DIGITAL SIGN ACTION PLACEHOLDER

     We deliberately do NOT call sign_and_forward_ctr()
     with fake values.

     Real signing UI will provide:
       signature_method
       signature_reference
       signed_document_path
       document hash
  ===================================================== */

  function openSignForward() {

    showStatus(
      "Digital signing screen is not connected yet. The CTR has not been forwarded.",
      "normal"
    );

  }


  function openFinalApproval() {

    showStatus(
      "Final digital signing screen is not connected yet. The CTR has not been finally approved.",
      "normal"
    );

  }


  /* =====================================================
     BUTTON EVENTS
  ===================================================== */

  function bindActionEvents() {

    workflowInboxList
      ?.querySelectorAll(
        ".workflow-write-back"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              writeBack(
                button.dataset.workflowId
              );

            }
          );

        }
      );


    workflowInboxList
      ?.querySelectorAll(
        ".workflow-withdraw"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              withdrawForwarding(
                button.dataset.workflowId
              );

            }
          );

        }
      );


    workflowInboxList
  ?.querySelectorAll(
    ".sign-forward-action"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          openSigningWorkspace(
            button.dataset.workflowId
          );

        }
      );

    }
  );

}

workflowInboxList
  ?.querySelectorAll(
    ".final-approve-action"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          openSigningWorkspace(
            button.dataset.workflowId
          );

        }
      );

    }
  );


  /* =====================================================
     LOAD INBOX
  ===================================================== */

  async function loadWorkflowInbox() {

    if (loading) {

      return;

    }


    loading =
      true;


    renderLoading();


    showStatus(
      "Loading CTR workflow..."
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
          "list_ctr_workflow_inbox"
        );


      if (error) {

        console.error(
          "Workflow inbox error:",
          error
        );


        throw error;

      }


      workflowRecords =
        Array.isArray(data)
          ? data
          : [];


      console.log(
        "CTR WORKFLOW INBOX:",
        workflowRecords
      );


      updateSummary();


      applySearch();


      hideStatus();


    }

    catch (error) {


      console.error(
        "Unable to load workflow inbox:",
        error
      );


      workflowRecords =
        [];


      updateSummary();


      renderEmpty(false);


      showStatus(
        error?.message ||
        "Unable to load CTR workflow.",
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

  workflowInboxSearch
    ?.addEventListener(
      "input",
      applySearch
    );


  refreshWorkflowInbox
    ?.addEventListener(
      "click",
      loadWorkflowInbox
    );


  /* =====================================================
     START
  ===================================================== */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      loadWorkflowInbox
    );

  }

  else {

    loadWorkflowInbox();

  }


})();