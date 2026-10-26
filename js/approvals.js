/* =========================================================
   CTR MANAGEMENT SYSTEM
   PENDING APPROVALS / WORKFLOW INBOX

   DATABASE RPC:
   public.list_ctr_workflow_inbox()

   ACTIONS:
   - Open CTR
   - Digital Sign & Forward
   - Write Back
   - Withdraw Forwarding
   - Digital Sign & Final Approve

   IMPORTANT:
   No fake digital signature is generated here.
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
     SUPABASE CLIENT
  ===================================================== */

  function getSupabaseClient() {

    try {

      if (
        typeof supabaseClient !==
          "undefined" &&
        supabaseClient &&
        typeof supabaseClient.rpc ===
          "function"
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
      typeof window.supabaseClient.rpc ===
        "function"
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
        resolve =>
          setTimeout(
            resolve,
            50
          )
      );

    }


    return null;

  }


  /* =====================================================
     PROMISE TIMEOUT

     Prevents page from staying on
     "Loading CTR workflow..." forever.
  ===================================================== */

  function timeoutResult(
    milliseconds
  ) {

    return new Promise(
      resolve => {

        window.setTimeout(
          () => {

            resolve({

              data:
                null,

              error: {

                message:
                  "CTR workflow request timed out."

              }

            });

          },
          milliseconds
        );

      }
    );

  }


  async function rpcWithTimeout(
    client,
    functionName,
    parameters,
    milliseconds = 8000
  ) {

    return await Promise.race([

      client.rpc(
        functionName,
        parameters
      ),

      timeoutResult(
        milliseconds
      )

    ]);

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


  function hideStatus() {

    if (!workflowInboxStatus) {

      return;

    }


    workflowInboxStatus.hidden =
      true;

  }


  /* =====================================================
     SIGNING WORKSPACE
  ===================================================== */

  function openSigningWorkspace(
    workflowId
  ) {

    if (!workflowId) {

      showStatus(
        "Workflow ID is missing. Unable to open Digital Signing.",
        "error"
      );

      return;

    }


    window.location.href =
      "workflow-sign.html?workflow=" +
      encodeURIComponent(
        workflowId
      );

  }


  /* =====================================================
     SUMMARY
  ===================================================== */

  function updateSummary() {

    const current =
      workflowRecords.filter(
        record =>
          record.task_relation ===
          "CURRENT"
      ).length;


    const forwarded =
      workflowRecords.filter(
        record =>
          record.task_relation ===
          "FORWARDED"
      ).length;


    const monitoring =
      workflowRecords.filter(
        record =>
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
     LOADING / EMPTY
  ===================================================== */

  function renderLoading() {

    if (!workflowInboxList) {

      return;

    }


    workflowInboxList.innerHTML =
      `
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


    workflowInboxList.innerHTML =
      `
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


    if (
      relation ===
      "CURRENT"
    ) {

      return `
        <span class="workflow-chip current">
          Requires My Action
        </span>
      `;

    }


    if (
      relation ===
      "FORWARDED"
    ) {

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
     WORKFLOW STAGE
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
     OPEN CTR URL

     Supports normal baseline workflow and future
     alteration workflow using same inbox.
  ===================================================== */

  function getCtrOpenUrl(
    record
  ) {

    const stationId =
      encodeURIComponent(
        record.station_id || ""
      );


    if (
      record.alteration_id
    ) {

      return (
        "station.html?id=" +
        stationId +
        "&alteration=" +
        encodeURIComponent(
          record.alteration_id
        ) +
        "&mode=alteration"
      );

    }


    return (
      "station.html?id=" +
      stationId
    );

  }


  /* =====================================================
     ACTION BUTTONS
  ===================================================== */

  function actionButtons(record) {

    const workflowId =
      escapeHtml(
        record.workflow_id
      );


    const openUrl =
      getCtrOpenUrl(
        record
      );


    const buttons = [];


    buttons.push(
      `
        <a
          href="${openUrl}"
          title="Open CTR"
        >
          Open CTR
        </a>
      `
    );


    if (
      record.can_sign_and_forward ===
      true
    ) {

      buttons.push(
        `
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
        `
      );

    }


    if (
      record.can_write_back ===
      true
    ) {

      buttons.push(
        `
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
        `
      );

    }


    if (
      record.can_final_approve ===
      true
    ) {

      buttons.push(
        `
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
        `
      );

    }


    if (
      record.can_withdraw_forwarding ===
      true
    ) {

      buttons.push(
        `
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
        `
      );

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
      records
        .map(
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

                    Step
                    ${currentStep}
                    of
                    ${totalSteps}

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


    workflowInboxList.innerHTML =
      `
        <div class="workflow-register-wrap">

          <table class="workflow-register">

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
                  CTR Record
                </th>

                <th>
                  Current Stage
                </th>

                <th>
                  Current Holder
                </th>

                <th>
                  Pending Since
                </th>

                <th>
                  My Relation
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
        ?.toLowerCase() ||
      "";


    if (!query) {

      renderRecords(
        workflowRecords
      );

      return;

    }


    const filtered =
      workflowRecords.filter(
        record => {


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


    style.textContent =
      `
        .workflow-remark-dialog {

          width:
            min(
              520px,
              calc(
                100vw - 30px
              )
            );

          padding:
            0;

          border:
            1px solid #bccbd8;

          border-radius:
            4px;

          background:
            #ffffff;

          box-shadow:
            0 20px 60px
            rgba(
              24,
              54,
              83,
              0.22
            );

        }


        .workflow-remark-dialog::backdrop {

          background:
            rgba(
              19,
              39,
              59,
              0.42
            );

        }


        .workflow-dialog-head {

          padding:
            16px 18px;

          border-bottom:
            1px solid #d9e1e8;

          background:
            #f4f7fa;

        }


        .workflow-dialog-head strong {

          display:
            block;

          color:
            #173e6e;

          font-size:
            14px;

        }


        .workflow-dialog-head span {

          display:
            block;

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

          display:
            block;

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


    dialog.innerHTML =
      `
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
      resolve => {


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


    const result =
      await rpcWithTimeout(

        client,

        "write_back_ctr",

        {

          p_workflow_id:
            workflowId,

          p_remarks:
            remarks

        },

        12000

      );


    if (result.error) {

      console.error(
        "Write Back error:",
        result.error
      );


      showStatus(
        result.error.message ||
        "Unable to Write Back CTR.",
        "error"
      );

      return;

    }


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


    const result =
      await rpcWithTimeout(

        client,

        "withdraw_ctr_forwarding",

        {

          p_workflow_id:
            workflowId,

          p_remarks:
            remarks

        },

        12000

      );


    if (result.error) {

      console.error(
        "Withdraw Forwarding error:",
        result.error
      );


      showStatus(
        result.error.message ||
        "Unable to withdraw forwarding.",
        "error"
      );

      return;

    }


    showStatus(
      "Forwarding withdrawn successfully.",
      "success"
    );


    await loadWorkflowInbox();

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
        button => {

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
        button => {

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
        button => {

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


    workflowInboxList
      ?.querySelectorAll(
        ".final-approve-action"
      )
      .forEach(
        button => {

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


  /* =====================================================
     AUTH / RPC RETRY CHECK
  ===================================================== */

  function shouldRetryWorkflowError(
    error
  ) {

    const message =
      String(
        error?.message ||
        ""
      )
        .toLowerCase();


    return (
      message.includes(
        "permission denied"
      ) ||
      message.includes(
        "authentication required"
      ) ||
      message.includes(
        "jwt"
      ) ||
      message.includes(
        "timed out"
      )
    );

  }


  /* =====================================================
     LOAD INBOX

     IMPORTANT:
     Do not call getUser/getSession here.

     Supabase restores its browser token automatically.
     We retry the actual secure RPC while restoration
     completes.

     Each RPC also has a timeout, so this page can never
     remain on Loading forever.
  ===================================================== */

  async function loadWorkflowInbox() {

    if (loading) {

      return;

    }


    loading =
      true;


    if (refreshWorkflowInbox) {

      refreshWorkflowInbox.disabled =
        true;

      refreshWorkflowInbox.textContent =
        "Loading...";

    }


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


      let result =
        null;


      const maxAttempts =
        8;


      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt += 1
      ) {

        console.log(
          `CTR workflow load attempt ${attempt}/${maxAttempts}`
        );


        result =
          await rpcWithTimeout(

            client,

            "list_ctr_workflow_inbox",

            undefined,

            6000

          );


        if (
          result &&
          !result.error
        ) {

          break;

        }


        console.warn(
          "CTR workflow attempt failed:",
          result?.error
        );


        if (
          !shouldRetryWorkflowError(
            result?.error
          )
        ) {

          break;

        }


        if (
          attempt <
          maxAttempts
        ) {

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                700
              )
          );

        }

      }


      if (
        !result ||
        result.error
      ) {

        throw (
          result?.error ||
          new Error(
            "CTR workflow could not be loaded."
          )
        );

      }


      workflowRecords =
        Array.isArray(
          result.data
        )

          ? result.data

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


      if (refreshWorkflowInbox) {

        refreshWorkflowInbox.disabled =
          false;

        refreshWorkflowInbox.textContent =
          "Refresh";

      }

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
     OPTIONAL DEBUG / MANUAL RELOAD
  ===================================================== */

  window.reloadCtrWorkflowInbox =
    loadWorkflowInbox;


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