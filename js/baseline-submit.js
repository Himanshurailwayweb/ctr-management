/* =========================================================
   CTR MANAGEMENT SYSTEM
   INITIAL CTR WORKFLOW PREPARATION

   FILE:
   ctr/js/baseline-submit.js

   NEW CONTROLLED WORKFLOW
   ---------------------------------------------------------
   Draft CTR
        ↓
   Prepare Initial CTR Workflow
        ↓
   Controlled PDF Generation
        ↓
   Digital Sign
        ↓
   Forward to Review Officer
        ↓
   Review / Write Back / Forward
        ↓
   Final Digital Sign & Final Approve

   IMPORTANT
   ---------------------------------------------------------
   This file DOES NOT directly submit a CTR for approval.

   OLD RPC REMOVED:
   submit_ctr_baseline_for_approval

   NEW RPC:
   prepare_initial_ctr_workflow
========================================================= */


(function () {

  "use strict";


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


  /* =====================================================
     SUBMIT / WORKFLOW BUTTON

     Multiple IDs are supported so this remains compatible
     with the current station page while we continue cleanup.
  ===================================================== */

  const submitButton =

    document.getElementById(
      "submitBaseline"
    )

    ||

    document.getElementById(
      "submitBaselineButton"
    )

    ||

    document.getElementById(
      "submitBaselineBtn"
    )

    ||

    document.getElementById(
      "submitCtrBaseline"
    )

    ||

    document.getElementById(
      "submitForApproval"
    )

    ||

    document.querySelector(
      '[data-action="submit-baseline"]'
    );


  /*
     If station.html does not contain the workflow button,
     simply stop this file without breaking the page.
  */

  if (!submitButton) {

    console.warn(
      "Initial CTR workflow button was not found."
    );

    return;

  }


  /* =====================================================
     STATION ID
  ===================================================== */

  function getCurrentStationId() {

    /*
       Preferred source:
       station-context.js / station.js
    */

    try {

      if (
        typeof currentStationId !== "undefined" &&
        currentStationId
      ) {

        return currentStationId;

      }

    }

    catch (error) {

      console.warn(
        "Station global context check:",
        error
      );

    }


    /*
       Fallback:
       station.html?station=<uuid>

       Also accepts:
       ?id=<uuid>
    */

    const parameters =
      new URLSearchParams(
        window.location.search
      );


    return (
      parameters.get("station") ||
      parameters.get("id") ||
      ""
    ).trim();

  }


  /* =====================================================
     CURRENT STATION STATUS
  ===================================================== */

  function getCurrentStationStatus() {

    try {

      if (
        typeof currentStationWorkflowStatus !==
        "undefined"
      ) {

        return (
          currentStationWorkflowStatus ||
          ""
        );

      }

    }

    catch (error) {

      console.warn(
        "Station workflow status check:",
        error
      );

    }


    return "";

  }


  /* =====================================================
     STATUS LOADED
  ===================================================== */

  function isStationWorkflowStatusLoaded() {

    try {

      if (
        typeof stationWorkflowStatusLoaded !==
        "undefined"
      ) {

        return (
          stationWorkflowStatusLoaded ===
          true
        );

      }

    }

    catch (error) {

      console.warn(
        "Station workflow load-state check:",
        error
      );

    }


    /*
       If old global is not available, do not block the
       button. The secure database RPC remains authoritative.
    */

    return true;

  }


  /* =====================================================
     USER STATUS MESSAGE
  ===================================================== */

  function setWorkflowMessage(message) {

    /*
       Existing station.js status display.
    */

    try {

      if (
        typeof setDraftStatus ===
        "function"
      ) {

        setDraftStatus(
          message
        );

        return;

      }

    }

    catch (error) {

      console.warn(
        "Draft status display:",
        error
      );

    }


    console.log(
      "CTR WORKFLOW:",
      message
    );

  }


  /* =====================================================
     BUTTON LABEL
  ===================================================== */

  function setDefaultButtonLabel() {

    submitButton.textContent =
      "Prepare Initial CTR Workflow";

  }


  /* =====================================================
     CAN PREPARE INITIAL CTR
  ===================================================== */

  function canPrepareInitialCtr() {

    const stationId =
      getCurrentStationId();


    if (!stationId) {

      return false;

    }


    if (
      !isStationWorkflowStatusLoaded()
    ) {

      return false;

    }


    const stationStatus =
      getCurrentStationStatus();


    /*
       Initial CTR workflow should normally start from DRAFT.

       If status is temporarily unavailable in the frontend,
       do not invent a decision here. The secure RPC will
       perform the authoritative database validation.
    */

    if (
      stationStatus &&
      stationStatus !== "DRAFT"
    ) {

      return false;

    }


    /*
       Respect station builder view-only mode if present.
    */

    if (
      document.body.dataset.stationEditMode ===
      "view"
    ) {

      return false;

    }


    return true;

  }


  /* =====================================================
     UPDATE BUTTON STATE
  ===================================================== */

  function updateSubmitButtonState() {

    const stationStatus =
      getCurrentStationStatus();


    /*
       Approved Initial CTR
    */

    if (
      stationStatus ===
      "BASELINE_APPROVED" ||
      stationStatus ===
      "APPROVED"
    ) {

      submitButton.disabled =
        true;


      submitButton.textContent =
        "Initial CTR Approved";


      return;

    }


    /*
       Old/active approval state.

       New PREPARATION workflow itself normally leaves the
       station in DRAFT until first signed forwarding.
    */

    if (
      stationStatus ===
      "UNDER_APPROVAL"
    ) {

      submitButton.disabled =
        true;


      submitButton.textContent =
        "CTR Under Approval";


      return;

    }


    /*
       Initial setup must first have a saved Draft.
    */

    if (
      stationStatus ===
      "INITIAL_SETUP"
    ) {

      submitButton.disabled =
        true;


      submitButton.textContent =
        "Save Draft First";


      return;

    }


    if (
      !isStationWorkflowStatusLoaded()
    ) {

      submitButton.disabled =
        true;


      submitButton.textContent =
        "Checking Workflow...";


      return;

    }


    submitButton.disabled =
      !canPrepareInitialCtr();


    setDefaultButtonLabel();

  }


  /* =====================================================
     PREPARE INITIAL CTR WORKFLOW
  ===================================================== */

  async function submitBaseline() {

    const client =
      getSupabaseClient();


    if (!client) {

      window.alert(
        "Supabase connection is not available."
      );

      return;

    }


    const stationId =
      getCurrentStationId();


    if (!stationId) {

      window.alert(
        "Station information is not available."
      );

      return;

    }


    /* ===================================================
       FRONTEND CHECK

       Backend RPC remains the final authority.
    =================================================== */

    if (
      !canPrepareInitialCtr()
    ) {

      const stationStatus =
        getCurrentStationStatus();


      if (
        stationStatus ===
        "INITIAL_SETUP"
      ) {

        window.alert(
          "Please save the Initial CTR as Draft before preparing the approval workflow."
        );

      }

      else if (
        stationStatus ===
        "BASELINE_APPROVED" ||
        stationStatus ===
        "APPROVED"
      ) {

        window.alert(
          "Initial CTR is already approved. Future changes must use the Modification workflow."
        );

      }

      else if (
        stationStatus ===
        "UNDER_APPROVAL"
      ) {

        window.alert(
          "This CTR is already under approval."
        );

      }

      else {

        window.alert(
          "This Initial CTR is not currently ready for workflow preparation."
        );

      }


      return;

    }


    /* ===================================================
       CONFIRMATION
    =================================================== */

    const confirmed =
      window.confirm(
        "Prepare Initial CTR Workflow?\n\n" +

        "This will create the controlled approval route for this station.\n\n" +

        "The CTR will remain at the Preparation stage until the controlled PDF is digitally signed and forwarded.\n\n" +

        "No Final Approval will occur at this stage."
      );


    if (!confirmed) {

      return;

    }


    const originalText =
      submitButton.textContent;


    submitButton.disabled =
      true;


    submitButton.textContent =
      "Preparing Workflow...";


    setWorkflowMessage(
      "Preparing Initial CTR workflow..."
    );


    try {


      /* =================================================
         CREATE DYNAMIC WORKFLOW

         Actual preparer becomes runtime Step 1.

         Remaining Review / Final Approval stages are copied
         from the configured approval route.
      ================================================= */

      const {
        data,
        error
      } =
        await client.rpc(
          "prepare_initial_ctr_workflow",
          {
            p_station_id:
              stationId
          }
        );


      if (error) {

        throw error;

      }


      console.log(
        "PREPARE INITIAL CTR WORKFLOW RESULT:",
        data
      );


      if (
        !data ||
        data.success !== true
      ) {

        throw new Error(
          data?.message ||
          "Initial CTR workflow could not be prepared."
        );

      }


      const workflowId =
        data.workflow_id;


      if (!workflowId) {

        throw new Error(
          "Workflow was created but Workflow ID was not returned."
        );

      }


      /* =================================================
         IMPORTANT WORKFLOW RULE

         Do NOT:
         - change station to UNDER_APPROVAL here
         - lock station builder here
         - change draft to READY_FOR_BASELINE here

         Those actions happen only when the preparer
         digitally signs and forwards the first controlled
         document.
      ================================================= */

      setWorkflowMessage(
        "Initial CTR workflow prepared — controlled PDF and digital signing pending."
      );


      submitButton.textContent =
        "Workflow Prepared";


      submitButton.disabled =
        true;


      /*
         Go to the controlled signing workspace.

         Current document may initially be empty.

         The next development step will generate the
         canonical CTR PDF, upload it to private storage,
         calculate SHA-256 and register it using:

         register_ctr_generated_pdf()
      */

      window.setTimeout(
        function () {

          window.location.href =
            "workflow-sign.html?workflow=" +
            encodeURIComponent(
              workflowId
            );

        },
        500
      );


    }

    catch (error) {


      console.error(
        "Initial CTR workflow preparation error:",
        error
      );


      const message =
        error?.message ||
        "Initial CTR workflow could not be prepared.";


      setWorkflowMessage(
        message
      );


      /*
         Typical controlled error:

         Approval route is not configured for this station.
         Please contact System Administrator.

         This is intentional until actual officers/routes
         are configured.
      */

      window.alert(
        message
      );


      submitButton.textContent =
        originalText;


      submitButton.disabled =
        false;


      updateSubmitButtonState();

    }

  }


  /* =====================================================
     BUTTON EVENT
  ===================================================== */

  submitButton.addEventListener(
    "click",
    submitBaseline
  );


  /* =====================================================
     KEEP BUTTON SYNCHRONIZED WITH STATION.JS

     station.js may finish loading the workflow status after
     this file has already executed.
  ===================================================== */

  let statusCheckCount =
    0;


  const statusCheckTimer =
    window.setInterval(
      function () {

        statusCheckCount +=
          1;


        updateSubmitButtonState();


        /*
           Stop after approximately 10 seconds.
        */

        if (
          statusCheckCount >=
          20
        ) {

          window.clearInterval(
            statusCheckTimer
          );

        }

      },
      500
    );


  /* =====================================================
     OPTIONAL EVENT SUPPORT

     Harmless if station.js does not emit these events.
  ===================================================== */

  window.addEventListener(
    "ctr-station-status-changed",
    updateSubmitButtonState
  );


  window.addEventListener(
    "ctr-draft-saved",
    updateSubmitButtonState
  );


  /* =====================================================
     INITIAL STATE
  ===================================================== */

  updateSubmitButtonState();


})();