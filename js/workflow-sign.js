/* =========================================================
   CTR MANAGEMENT - DIGITAL SIGNING
   DSC BRIDGE READY VERSION

   BACKEND
   ---------------------------------------------------------
   get_ctr_signing_workspace(uuid)

   sign_and_forward_ctr(...)

   final_sign_and_approve_initial_ctr(...)

   STORAGE
   ---------------------------------------------------------
   Private bucket:
   ctr-workflow-documents


   DSC SECURITY
   ---------------------------------------------------------
   Website never receives private DSC key.

   Website never asks for DSC token PIN.

   Signing occurs locally on the officer's PC/token.

   DSC Bridge must return the complete digitally-signed PDF.

   Existing PDF signatures must be preserved.
========================================================= */


(() => {

  "use strict";


  /* =====================================================
     CONFIGURATION
  ===================================================== */

  const STORAGE_BUCKET =
    "ctr-workflow-documents";


  const SIGNED_URL_LIFETIME_SECONDS =
    120;


  const MAX_PDF_SIZE =
    25 *
    1024 *
    1024;


  const DEFAULT_SIGNATURE_METHOD =
    "DSC";


  /* =====================================================
     ELEMENTS
  ===================================================== */

  const signingStatus =
    document.getElementById(
      "signingStatus"
    );


  const signingHeroStatus =
    document.getElementById(
      "signingHeroStatus"
    );


  const signingStation =
    document.getElementById(
      "signingStation"
    );


  const signingStationCode =
    document.getElementById(
      "signingStationCode"
    );


  const signingRecordName =
    document.getElementById(
      "signingRecordName"
    );


  const signingCurrentStage =
    document.getElementById(
      "signingCurrentStage"
    );


  const signingStepProgress =
    document.getElementById(
      "signingStepProgress"
    );


  const signingAssignedName =
    document.getElementById(
      "signingAssignedName"
    );


  const signingAssignedDesignation =
    document.getElementById(
      "signingAssignedDesignation"
    );


  /* CURRENT PDF */

  const currentDocumentStatus =
    document.getElementById(
      "currentDocumentStatus"
    );


  const currentDocumentType =
    document.getElementById(
      "currentDocumentType"
    );


  const currentDocumentSignedAt =
    document.getElementById(
      "currentDocumentSignedAt"
    );


  const openCurrentDocument =
    document.getElementById(
      "openCurrentDocument"
    );


  const downloadCurrentDocument =
    document.getElementById(
      "downloadCurrentDocument"
    );


  /* DSC */

  const dscBridgeStatusBox =
    document.getElementById(
      "dscBridgeStatusBox"
    );


  const dscBridgeStatus =
    document.getElementById(
      "dscBridgeStatus"
    );


  const dscBridgeDetail =
    document.getElementById(
      "dscBridgeDetail"
    );


  const refreshDscBridge =
    document.getElementById(
      "refreshDscBridge"
    );


  const signWithDscButton =
    document.getElementById(
      "signWithDscButton"
    );


  const dscSignerResult =
    document.getElementById(
      "dscSignerResult"
    );


  const dscSignerName =
    document.getElementById(
      "dscSignerName"
    );


  const dscCertificateInfo =
    document.getElementById(
      "dscCertificateInfo"
    );


  const dscSignedAt =
    document.getElementById(
      "dscSignedAt"
    );


  /* MANUAL FALLBACK */

  const signedPdfFile =
    document.getElementById(
      "signedPdfFile"
    );


  const signedFileResult =
    document.getElementById(
      "signedFileResult"
    );


  const signatureReference =
    document.getElementById(
      "signatureReference"
    );


  const manualSignedConfirmation =
    document.getElementById(
      "manualSignedConfirmation"
    );


  const verifySignedDocument =
    document.getElementById(
      "verifySignedDocument"
    );


  /* WORKFLOW */

  const signingRemarks =
    document.getElementById(
      "signingRemarks"
    );


  const completeSigningAction =
    document.getElementById(
      "completeSigningAction"
    );


  /* =====================================================
     STATE
  ===================================================== */

  let workflowId =
    null;


  let workspace =
    null;


  let selectedSignedFile =
    null;


  let selectedSignedFileHash =
    null;


  let selectedSignedFileVerified =
    false;


  /*
     bridge = signed directly through DSC bridge

     manual = officer selected signed PDF manually
  */

  let selectedSigningSource =
    null;


  let bridgeSignatureValidated =
    false;


  let signingActionRunning =
    false;


  let dscBridgeAvailable =
    false;


  let dscBridgeInfo =
    null;


  /* =====================================================
     SUPABASE
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

      typeof window
        .supabaseClient
        .rpc ===
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
        function (resolve) {

          setTimeout(
            resolve,
            50
          );

        }
      );

    }


    return null;

  }


  /* =====================================================
     BASIC HELPERS
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


  function displayValue(
    value,
    fallback = "—"
  ) {

    if (

      value === null ||

      value === undefined ||

      String(
        value
      ).trim() === ""

    ) {

      return fallback;

    }


    return String(
      value
    ).trim();

  }


  function formatDateTime(
    value
  ) {

    if (!value) {

      return "—";

    }


    const date =
      new Date(
        value
      );


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


  function formatFileSize(
    bytes
  ) {

    if (

      !Number.isFinite(
        bytes
      ) ||

      bytes < 0

    ) {

      return "—";

    }


    if (
      bytes <
      1024
    ) {

      return `${bytes} B`;

    }


    const kb =
      bytes /
      1024;


    if (
      kb <
      1024
    ) {

      return `${kb.toFixed(1)} KB`;

    }


    const mb =
      kb /
      1024;


    return `${mb.toFixed(2)} MB`;

  }


  function getWorkflowIdFromUrl() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    return (

      params.get(
        "workflow"
      ) ||

      params.get(
        "id"
      ) ||

      ""

    ).trim();

  }


  function getStageName(
    stepType
  ) {

    if (
      stepType ===
      "PREPARER"
    ) {

      return "Preparation";

    }


    if (
      stepType ===
      "FINAL_APPROVAL"
    ) {

      return "Final Approval";

    }


    return "Officer Review";

  }


  function getDocumentTypeName(
    type
  ) {

    if (
      type ===
      "GENERATED"
    ) {

      return "Initial CTR PDF";

    }


    if (
      type ===
      "SIGNED_FORWARD"
    ) {

      return "Digitally Signed PDF";

    }


    if (
      type ===
      "FINAL_SIGNED"
    ) {

      return "Final Signed CTR PDF";

    }


    return "CTR PDF";

  }


  function getDownloadFilename(
    suffix = ""
  ) {

    const stationCode =
      displayValue(
        workspace?.station_code,
        "STATION"
      )
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        );


    const record =
      displayValue(
        workspace?.record_name,
        "CTR"
      )
        .replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        );


    return (

      `${stationCode}_` +
      `${record}` +
      `${suffix}.pdf`

    );

  }


  /* =====================================================
     STATUS MESSAGE
  ===================================================== */

  function showStatus(
    message,
    type = "normal"
  ) {

    if (
      !signingStatus
    ) {

      return;

    }


    signingStatus.hidden =
      false;


    signingStatus.textContent =
      message;


    if (
      type ===
      "error"
    ) {

      signingStatus.style.background =
        "#fff4f4";


      signingStatus.style.borderColor =
        "#dfbcbc";


      signingStatus.style.color =
        "#8a3434";


      return;

    }


    if (
      type ===
      "success"
    ) {

      signingStatus.style.background =
        "#f3f8f4";


      signingStatus.style.borderColor =
        "#bfd6c3";


      signingStatus.style.color =
        "#356345";


      return;

    }


    signingStatus.style.background =
      "#f8fafc";


    signingStatus.style.borderColor =
      "#d3dde7";


    signingStatus.style.color =
      "#526b82";

  }


  /* =====================================================
     SUMMARY
  ===================================================== */

  function renderSummary() {

    const currentStep =
      workspace?.current_step ||
      {};


    if (
      signingStation
    ) {

      signingStation.textContent =
        displayValue(
          workspace?.station_name
        );

    }


    if (
      signingStationCode
    ) {

      const code =
        displayValue(
          workspace?.station_code,
          ""
        );


      const division =
        displayValue(
          workspace?.division_name,
          ""
        );


      signingStationCode.textContent =

        [
          code,
          division
        ]
          .filter(Boolean)
          .join(" · ") ||

        "—";

    }


    if (
      signingRecordName
    ) {

      signingRecordName.textContent =
        displayValue(
          workspace?.record_name,
          "CTR Record"
        );

    }


    if (
      signingCurrentStage
    ) {

      signingCurrentStage.textContent =
        getStageName(
          currentStep.step_type
        );

    }


    if (
      signingStepProgress
    ) {

      signingStepProgress.textContent =

        `Step ${
          workspace?.current_step_order ||
          "—"
        } of ${
          workspace?.total_steps ||
          "—"
        }`;

    }


    if (
      signingAssignedName
    ) {

      signingAssignedName.textContent =
        displayValue(
          currentStep.assigned_name,
          "Not recorded"
        );

    }


    if (
      signingAssignedDesignation
    ) {

      signingAssignedDesignation.textContent =
        displayValue(
          currentStep.assigned_designation
        );

    }

  }


  /* =====================================================
     CURRENT DOCUMENT
  ===================================================== */

  function renderCurrentDocument() {

    const documentRecord =
      workspace?.current_document;


    if (
      !documentRecord
    ) {

      currentDocumentStatus.textContent =
        "PDF not available";


      currentDocumentType.textContent =
        "—";


      currentDocumentSignedAt.textContent =
        "—";


      openCurrentDocument.disabled =
        true;


      downloadCurrentDocument.disabled =
        true;


      updateSigningReadiness();


      return;

    }


    currentDocumentStatus.textContent =

      documentRecord.is_final

        ? "Final signed document"

        : "Current document";


    currentDocumentType.textContent =
      getDocumentTypeName(
        documentRecord.document_type
      );


    currentDocumentSignedAt.textContent =
      formatDateTime(
        documentRecord.signed_at
      );


    openCurrentDocument.disabled =
      false;


    downloadCurrentDocument.disabled =
      false;


    updateSigningReadiness();

  }


  /* =====================================================
     WORKFLOW ACTION
  ===================================================== */

  function configureActionMode() {

    const canFinalApprove =

      workspace
        ?.can_final_approve ===
      true;


    const canForward =

      workspace
        ?.can_sign_and_forward ===
      true;


    const isCurrentHolder =

      workspace
        ?.is_current_holder ===
      true;


    if (
      canFinalApprove
    ) {

      signingHeroStatus.textContent =
        "● Final Approval";


      completeSigningAction.textContent =
        "Submit & Final Approve";

    }


    else if (
      canForward
    ) {

      signingHeroStatus.textContent =
        "● Ready for Signing";


      completeSigningAction.textContent =
        "Submit & Forward";

    }


    else {

      signingHeroStatus.textContent =

        isCurrentHolder

          ? "● Action Not Available"

          : "● Read Only";

    }


    updateSigningReadiness();

    updateDscButtonState();

  }


  function renderWorkspace() {

    renderSummary();

    renderCurrentDocument();

    configureActionMode();

  }


  /* =====================================================
     TEMPORARY PRIVATE PDF URL
  ===================================================== */

  async function createDocumentSignedUrl(
    storagePath,
    download = false
  ) {

    if (
      !storagePath
    ) {

      throw new Error(
        "PDF storage path is missing."
      );

    }


    const client =
      await waitForSupabaseClient();


    if (
      !client
    ) {

      throw new Error(
        "Supabase connection is unavailable."
      );

    }


    const options =

      download

        ? {

            download:
              getDownloadFilename()

          }

        : undefined;


    const {
      data,
      error
    } =
      await client
        .storage
        .from(
          STORAGE_BUCKET
        )
        .createSignedUrl(

          storagePath,

          SIGNED_URL_LIFETIME_SECONDS,

          options

        );


    if (
      error
    ) {

      throw error;

    }


    if (
      !data?.signedUrl
    ) {

      throw new Error(
        "Temporary PDF link could not be created."
      );

    }


    return data.signedUrl;

  }


  /* =====================================================
     OPEN PDF
  ===================================================== */

  async function openCurrentPdf() {

    const path =
      workspace
        ?.current_document
        ?.storage_path;


    if (
      !path
    ) {

      showStatus(
        "CTR PDF is not available.",
        "error"
      );


      return;

    }


    try {

      showStatus(
        "Opening CTR PDF..."
      );


      const url =
        await createDocumentSignedUrl(
          path,
          false
        );


      window.open(

        url,

        "_blank",

        "noopener,noreferrer"

      );


      showStatus(
        "CTR PDF opened."
      );

    }


    catch (error) {

      console.error(
        "Open PDF error:",
        error
      );


      showStatus(

        error?.message ||

        "Unable to open PDF.",

        "error"

      );

    }

  }


  /* =====================================================
     DOWNLOAD PDF
  ===================================================== */

  async function downloadCurrentPdf() {

    const path =
      workspace
        ?.current_document
        ?.storage_path;


    if (
      !path
    ) {

      showStatus(
        "CTR PDF is not available.",
        "error"
      );


      return;

    }


    try {

      showStatus(
        "Preparing PDF..."
      );


      const url =
        await createDocumentSignedUrl(
          path,
          true
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.rel =
        "noopener";


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      showStatus(
        "PDF ready."
      );

    }


    catch (error) {

      console.error(
        "Download PDF error:",
        error
      );


      showStatus(

        error?.message ||

        "Unable to download PDF.",

        "error"

      );

    }

  }


  /* =====================================================
     FETCH SOURCE PDF FOR DSC
  ===================================================== */

  async function fetchCurrentPdfBytes() {

    const path =
      workspace
        ?.current_document
        ?.storage_path;


    if (
      !path
    ) {

      throw new Error(
        "Current CTR PDF is unavailable."
      );

    }


    const url =
      await createDocumentSignedUrl(
        path,
        false
      );


    const response =
      await fetch(
        url,
        {
          cache:
            "no-store"
        }
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "Unable to read the current CTR PDF for DSC signing."
      );

    }


    return response.arrayBuffer();

  }


  /* =====================================================
     PDF CHECK
  ===================================================== */

  async function isPdfFile(
    file
  ) {

    if (
      !file
    ) {

      return false;

    }


    const firstBytes =
      await file
        .slice(
          0,
          5
        )
        .arrayBuffer();


    const bytes =
      new Uint8Array(
        firstBytes
      );


    const header =
      Array
        .from(
          bytes
        )
        .map(
          function (byte) {

            return String
              .fromCharCode(
                byte
              );

          }
        )
        .join("");


    return (
      header ===
      "%PDF-"
    );

  }


  /* =====================================================
     INTERNAL SHA-256

     Not shown to officer.
  ===================================================== */

  async function calculateSha256(
    file
  ) {

    if (
      !window.crypto?.subtle
    ) {

      throw new Error(
        "Browser document verification is unavailable."
      );

    }


    const fileBuffer =
      await file.arrayBuffer();


    const digest =
      await window
        .crypto
        .subtle
        .digest(
          "SHA-256",
          fileBuffer
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


  /* =====================================================
     RESET SIGNING FILE
  ===================================================== */

  function resetSignedFileState() {

    selectedSignedFile =
      null;


    selectedSignedFileHash =
      null;


    selectedSignedFileVerified =
      false;


    selectedSigningSource =
      null;


    bridgeSignatureValidated =
      false;


    if (
      signedFileResult
    ) {

      signedFileResult.hidden =
        true;


      signedFileResult.innerHTML =
        "";

    }


    if (
      dscSignerResult
    ) {

      dscSignerResult.hidden =
        true;

    }


    if (
      verifySignedDocument
    ) {

      verifySignedDocument.disabled =
        true;

    }


    updateSigningReadiness();

  }


  /* =====================================================
     VALIDATE PDF
  ===================================================== */

  async function validateSignedPdfFile(
    file
  ) {

    if (
      !file
    ) {

      throw new Error(
        "Signed PDF is unavailable."
      );

    }


    if (
      file.size >
      MAX_PDF_SIZE
    ) {

      throw new Error(
        "PDF exceeds the 25 MB limit."
      );

    }


    const validPdf =
      await isPdfFile(
        file
      );


    if (
      !validPdf
    ) {

      throw new Error(
        "Selected file is not a valid PDF."
      );

    }


    const calculatedHash =
      await calculateSha256(
        file
      );


    const sourceHash =
      workspace
        ?.current_document
        ?.sha256
        ?.toLowerCase();


    if (

      sourceHash &&

      calculatedHash ===
        sourceHash

    ) {

      throw new Error(
        "The selected PDF is identical to the current CTR PDF. Select the digitally signed PDF."
      );

    }


    return calculatedHash;

  }


  /* =====================================================
     FILE DISPLAY
  ===================================================== */

  function showSelectedFile(
    file,
    heading,
    note = ""
  ) {

    if (
      !signedFileResult
    ) {

      return;

    }


    signedFileResult.hidden =
      false;


    signedFileResult.innerHTML = `

      <strong>
        ${escapeHtml(
          heading
        )}
      </strong>

      <br>

      ${escapeHtml(
        file.name
      )}

      <br>

      Size:
      ${escapeHtml(
        formatFileSize(
          file.size
        )
      )}

      ${
        note

          ? `
            <br>
            <small>
              ${escapeHtml(
                note
              )}
            </small>
          `

          : ""
      }

    `;

  }


  /* =====================================================
     MANUAL FALLBACK
  ===================================================== */

  function handleManualFileSelection() {

    resetSignedFileState();


    const file =
      signedPdfFile
        ?.files
        ?.[0];


    if (
      !file
    ) {

      return;

    }


    selectedSignedFile =
      file;


    selectedSigningSource =
      "manual";


    showSelectedFile(

      file,

      "Selected signed PDF",

      "Check the PDF before submitting."

    );


    verifySignedDocument.disabled =
      false;


    updateSigningReadiness();

  }


  async function verifyManualSignedPdf() {

    if (

      !selectedSignedFile ||

      selectedSigningSource !==
        "manual"

    ) {

      showStatus(
        "Select the digitally signed PDF first.",
        "error"
      );


      return;

    }


    verifySignedDocument.disabled =
      true;


    showStatus(
      "Checking signed PDF..."
    );


    try {

      selectedSignedFileHash =
        await validateSignedPdfFile(
          selectedSignedFile
        );


      selectedSignedFileVerified =
        true;


      bridgeSignatureValidated =
        false;


      showSelectedFile(

        selectedSignedFile,

        "✓ Signed PDF Ready",

        "PDF structure checked. Manual fallback does not independently validate the DSC certificate chain in the browser."

      );


      showStatus(

        "Signed PDF is ready. Enter the DSC reference and confirm the manual fallback declaration.",

        "success"

      );

    }


    catch (error) {

      selectedSignedFileHash =
        null;


      selectedSignedFileVerified =
        false;


      showStatus(

        error?.message ||

        "Unable to check the PDF.",

        "error"

      );

    }


    finally {

      verifySignedDocument.disabled =
        false;


      updateSigningReadiness();

    }

  }


  /* =====================================================
     DSC BRIDGE

     emBridge adapter exposes:

     window.CTR_EMBRIDGE

     Required:

     getStatus()

     signPdf({
       pdfBytes,
       fileName,
       workflowId,
       documentId,
       stationName,
       recordName,
       preserveExistingSignatures
     })

     signPdf must return:

     signedPdf
     OR
     signedPdfBase64

     signatureReference
     signatureValid === true
     signerName
     certificateSubject
     certificateIssuer
     certificateSerial
     signedAt
  ===================================================== */

  function getDscBridge() {

    const bridge =
      window.CTR_EMBRIDGE;
    if (

      bridge &&

      typeof bridge.signPdf ===
        "function"

    ) {

      return bridge;

    }


    return null;

  }


  /* =====================================================
     DSC STATUS UI
  ===================================================== */

  function setDscBridgeUi(
    state,
    title,
    detail
  ) {

    dscBridgeStatusBox
      ?.classList
      .remove(
        "ready",
        "error"
      );


    if (
      state ===
      "ready"
    ) {

      dscBridgeStatusBox
        ?.classList
        .add(
          "ready"
        );

    }


    else if (
      state ===
      "error"
    ) {

      dscBridgeStatusBox
        ?.classList
        .add(
          "error"
        );

    }


    if (
      dscBridgeStatus
    ) {

      dscBridgeStatus.textContent =
        title;

    }


    if (
      dscBridgeDetail
    ) {

      dscBridgeDetail.textContent =
        detail;

    }

  }


  /* =====================================================
     CHECK DSC BRIDGE
  ===================================================== */

  async function checkDscBridge() {

    dscBridgeAvailable =
      false;


    dscBridgeInfo =
      null;


    setDscBridgeUi(

      "normal",

      "Checking DSC Bridge...",

      "Checking the local DSC integration on this computer."

    );


    const bridge =
      getDscBridge();


    if (
      !bridge
    ) {

      setDscBridgeUi(

        "error",

        "DSC Bridge not available",

        "Install/connect eMudhra emBridge to sign directly from this page. Manual signed-PDF fallback remains available below."

      );


      updateDscButtonState();


      return false;

    }


    try {

      const status =

        typeof bridge.getStatus ===
        "function"

          ? await bridge.getStatus()

          : {
              available:
                true
            };


      if (
        status?.available ===
        false
      ) {

        throw new Error(

          status?.message ||

          "DSC Bridge is not ready."

        );

      }


      dscBridgeAvailable =
        true;


      dscBridgeInfo =
        status ||
        {
          available:
            true
        };


      const detail =

        [

          status?.provider,

          status?.version
            ? `Bridge ${status.version}`
            : null

        ]
          .filter(Boolean)
          .join(" · ");


      setDscBridgeUi(

        "ready",

        "DSC Bridge ready",

        detail ||

        "Local DSC signing is available on this computer."

      );


      updateDscButtonState();


      return true;

    }


    catch (error) {

      console.error(
        "DSC Bridge check error:",
        error
      );


      setDscBridgeUi(

        "error",

        "DSC Bridge not ready",

        error?.message ||

        "The local DSC integration could not be used."

      );


      updateDscButtonState();


      return false;

    }

  }


  /* =====================================================
     DSC BUTTON STATE
  ===================================================== */

  function updateDscButtonState() {

    if (
      !signWithDscButton
    ) {

      return;

    }


    const canAct =

      workspace
        ?.can_sign_and_forward ===
      true ||

      workspace
        ?.can_final_approve ===
      true;


    signWithDscButton.disabled =

      !(

        dscBridgeAvailable &&

        workspace
          ?.current_document
          ?.document_id &&

        canAct &&

        !signingActionRunning

      );

  }


  /* =====================================================
     BASE64 HELPER
  ===================================================== */

  function base64ToUint8Array(
    base64
  ) {

    const clean =
      String(
        base64 ||
        ""
      )
        .replace(
          /^data:application\/pdf;base64,/i,
          ""
        )
        .replace(
          /\s+/g,
          ""
        );


    const binary =
      atob(
        clean
      );


    const bytes =
      new Uint8Array(
        binary.length
      );


    for (
      let i = 0;
      i < binary.length;
      i++
    ) {

      bytes[i] =
        binary.charCodeAt(
          i
        );

    }


    return bytes;

  }


  /* =====================================================
     NORMALIZE SIGNED PDF FROM BRIDGE
  ===================================================== */

  function normalizeBridgeSignedPdf(
    result
  ) {

    if (
      !result
    ) {

      throw new Error(
        "DSC Bridge did not return a signing result."
      );

    }


    let blob =
      null;


    if (
      result.signedPdf instanceof
      Blob
    ) {

      blob =
        result.signedPdf;

    }


    else if (
      result.signedPdf instanceof
      ArrayBuffer
    ) {

      blob =
        new Blob(
          [
            result.signedPdf
          ],
          {
            type:
              "application/pdf"
          }
        );

    }


    else if (
      ArrayBuffer.isView(
        result.signedPdf
      )
    ) {

      blob =
        new Blob(
          [
            result.signedPdf
          ],
          {
            type:
              "application/pdf"
          }
        );

    }


    else if (
      result.signedPdfBase64
    ) {

      blob =
        new Blob(
          [
            base64ToUint8Array(
              result.signedPdfBase64
            )
          ],
          {
            type:
              "application/pdf"
          }
        );

    }


    if (
      !blob
    ) {

      throw new Error(
        "DSC Bridge did not return the complete signed PDF."
      );

    }


    return new File(

      [
        blob
      ],

      getDownloadFilename(
        "_signed"
      ),

      {
        type:
          "application/pdf"
      }

    );

  }


  /* =====================================================
     SIGNER INFORMATION
  ===================================================== */

  function renderBridgeSigner(
    result
  ) {

    if (
      dscSignerResult
    ) {

      dscSignerResult.hidden =
        false;

    }


    if (
      dscSignerName
    ) {

      dscSignerName.textContent =
        displayValue(
          result?.signerName,
          "DSC Signer"
        );

    }


    const certificate =

      [

        result?.certificateSubject,

        result?.certificateIssuer
          ? `Issuer: ${result.certificateIssuer}`
          : null,

        result?.certificateSerial
          ? `Serial: ${result.certificateSerial}`
          : null

      ]
        .filter(Boolean)
        .join(" · ");


    if (
      dscCertificateInfo
    ) {

      dscCertificateInfo.textContent =

        certificate ||

        "Validated by DSC Bridge";

    }


    if (
      dscSignedAt
    ) {

      dscSignedAt.textContent =
        formatDateTime(

          result?.signedAt ||

          new Date()
            .toISOString()

        );

    }

  }


  /* =====================================================
     SIGN CURRENT PDF WITH DSC
  ===================================================== */

  async function signCurrentPdfWithDsc() {

    if (
      signingActionRunning
    ) {

      return;

    }


    let bridge =
      getDscBridge();


    if (

      !bridge ||

      !dscBridgeAvailable

    ) {

      await checkDscBridge();


      if (
        !dscBridgeAvailable
      ) {

        return;

      }


      bridge =
        getDscBridge();

    }


    if (
      !workspace
        ?.current_document
        ?.document_id
    ) {

      showStatus(
        "CTR PDF is not available for signing.",
        "error"
      );


      return;

    }


    if (

      workspace
        ?.can_sign_and_forward !==
      true &&

      workspace
        ?.can_final_approve !==
      true

    ) {

      showStatus(
        "This signing action is not assigned to you.",
        "error"
      );


      return;

    }


    signWithDscButton.disabled =
      true;


    refreshDscBridge.disabled =
      true;


    resetSignedFileState();


    try {

      showStatus(
        "Checking current workflow stage..."
      );


      await refreshWorkspaceBeforeAction();


      showStatus(
        "Preparing CTR PDF for DSC signing..."
      );


      const pdfBytes =
        await fetchCurrentPdfBytes();


      showStatus(
        "Waiting for DSC signing on this computer..."
      );


      const result =
        await bridge.signPdf(
          {

            pdfBytes:
              pdfBytes,

            fileName:
              getDownloadFilename(),

            workflowId:
              workflowId,

            documentId:
              workspace
                .current_document
                .document_id,

            stationName:
              workspace
                ?.station_name ||
              "",

            stationCode:
              workspace
                ?.station_code ||
              "",

            recordName:
              workspace
                ?.record_name ||
              "CTR",

            preserveExistingSignatures:
              true

          }
        );


      /*
         Bridge must verify the PDF digital signature
         before returning success.
      */

      if (
        result?.signatureValid !==
        true
      ) {

        throw new Error(

          result?.message ||

          "The DSC Bridge did not confirm a valid PDF digital signature."

        );

      }


      const reference =

        result?.signatureReference ||

        result?.transactionId ||

        result?.signatureId ||

        "";


      if (
        !reference
      ) {

        throw new Error(
          "DSC Bridge did not return a signature reference."
        );

      }


      const signedFile =
        normalizeBridgeSignedPdf(
          result
        );


      const hash =
        await validateSignedPdfFile(
          signedFile
        );


      selectedSignedFile =
        signedFile;


      selectedSignedFileHash =
        hash;


      selectedSignedFileVerified =
        true;


      selectedSigningSource =
        "bridge";


      bridgeSignatureValidated =
        true;


      /*
         Auto-record real signature reference.
      */

      signatureReference.value =
        reference;


      renderBridgeSigner(
        result
      );


      showStatus(

        "CTR PDF digitally signed with DSC and verified by the local bridge.",

        "success"

      );


      updateSigningReadiness();

    }


    catch (error) {

      console.error(
        "DSC signing error:",
        error
      );


      resetSignedFileState();


      showStatus(

        error?.message ||

        "DSC signing could not be completed.",

        "error"

      );

    }


    finally {

      refreshDscBridge.disabled =
        false;


      updateDscButtonState();

    }

  }


  /* =====================================================
     SIGNATURE REFERENCE
  ===================================================== */

  function getSignatureReference() {

    return (

      signatureReference
        ?.value
        ?.trim() ||

      ""

    );

  }


  /* =====================================================
     READY TO SUBMIT?
  ===================================================== */

  function isSigningReady() {

    const hasDocument =
      Boolean(
        workspace
          ?.current_document
          ?.document_id
      );


    const canAct =

      workspace
        ?.can_sign_and_forward ===
      true ||

      workspace
        ?.can_final_approve ===
      true;


    const commonReady =
      Boolean(

        getSignatureReference() &&

        selectedSignedFile &&

        selectedSignedFileVerified &&

        selectedSignedFileHash &&

        hasDocument &&

        canAct &&

        !signingActionRunning

      );


    if (
      !commonReady
    ) {

      return false;

    }


    if (
      selectedSigningSource ===
      "bridge"
    ) {

      return (
        bridgeSignatureValidated ===
        true
      );

    }


    if (
      selectedSigningSource ===
      "manual"
    ) {

      return (
        manualSignedConfirmation
          ?.checked ===
        true
      );

    }


    return false;

  }


  /* =====================================================
     UPDATE SUBMIT BUTTON
  ===================================================== */

  function updateSigningReadiness() {

    if (
      !completeSigningAction
    ) {

      return;

    }


    completeSigningAction.disabled =
      !isSigningReady();


    if (
      signingActionRunning
    ) {

      completeSigningAction.title =
        "Signing workflow action is being processed.";


      updateDscButtonState();


      return;

    }


    if (
      !workspace?.current_document
    ) {

      completeSigningAction.title =
        "A CTR PDF must exist before signing.";

    }


    else if (

      !workspace
        ?.can_sign_and_forward &&

      !workspace
        ?.can_final_approve

    ) {

      completeSigningAction.title =
        "This workflow is not currently assigned to you.";

    }


    else if (
      !selectedSignedFileVerified
    ) {

      completeSigningAction.title =
        "Sign the PDF with DSC or use the manual fallback.";

    }


    else if (
      !getSignatureReference()
    ) {

      completeSigningAction.title =
        "A real DSC / transaction reference is required.";

    }


    else if (

      selectedSigningSource ===
        "manual" &&

      manualSignedConfirmation
        ?.checked !==
      true

    ) {

      completeSigningAction.title =
        "Confirm the manual DSC declaration.";

    }


    else {

      completeSigningAction.title =

        workspace
          ?.can_final_approve

          ? "Submit the signed PDF and complete Final Approval."

          : "Submit the signed PDF and forward the CTR.";

    }


    updateDscButtonState();

  }


  /* =====================================================
     STORAGE PATH
  ===================================================== */

  function buildSignedStoragePath() {

    if (

      !workflowId ||

      !selectedSignedFileHash

    ) {

      throw new Error(
        "Workflow or signed PDF information is unavailable."
      );

    }


    const folder =

      workspace
        ?.can_final_approve

        ? "final"

        : "signed";


    return (

      `${workflowId}/` +
      `${folder}/` +
      `${selectedSignedFileHash}.pdf`

    );

  }


  /* =====================================================
     CHECK EXISTING STORAGE OBJECT
  ===================================================== */

  async function storageObjectExists(
    storagePath
  ) {

    const client =
      await waitForSupabaseClient();


    if (
      !client
    ) {

      throw new Error(
        "Supabase connection is unavailable."
      );

    }


    const slashIndex =
      storagePath.lastIndexOf(
        "/"
      );


    const folder =
      storagePath.substring(
        0,
        slashIndex
      );


    const filename =
      storagePath.substring(
        slashIndex + 1
      );


    const {
      data,
      error
    } =
      await client
        .storage
        .from(
          STORAGE_BUCKET
        )
        .list(
          folder,
          {

            search:
              filename,

            limit:
              10

          }
        );


    if (
      error
    ) {

      return false;

    }


    return (

      Array.isArray(
        data
      ) &&

      data.some(
        function (item) {

          return (
            item.name ===
            filename
          );

        }
      )

    );

  }


  /* =====================================================
     UPLOAD SIGNED PDF
  ===================================================== */

  async function uploadSignedPdf() {

    if (

      !selectedSignedFile ||

      !selectedSignedFileHash

    ) {

      throw new Error(
        "Verified signed PDF is unavailable."
      );

    }


    const client =
      await waitForSupabaseClient();


    if (
      !client
    ) {

      throw new Error(
        "Supabase connection is unavailable."
      );

    }


    const storagePath =
      buildSignedStoragePath();


    const {
      error
    } =
      await client
        .storage
        .from(
          STORAGE_BUCKET
        )
        .upload(

          storagePath,

          selectedSignedFile,

          {

            contentType:
              "application/pdf",

            cacheControl:
              "3600",

            upsert:
              false

          }

        );


    if (
      !error
    ) {

      return storagePath;

    }


    /*
       Never overwrite an existing signed PDF.

       Retry is allowed only if the exact same
       hash-named object already exists.
    */

    const exists =
      await storageObjectExists(
        storagePath
      );


    if (
      exists
    ) {

      return storagePath;

    }


    throw error;

  }


  /* =====================================================
     SIGN + FORWARD
  ===================================================== */

  async function performSignAndForward(
    storagePath
  ) {

    const client =
      await waitForSupabaseClient();


    if (
      !client
    ) {

      throw new Error(
        "Supabase connection is unavailable."
      );

    }


    const {
      data,
      error
    } =
      await client.rpc(

        "sign_and_forward_ctr",

        {

          p_workflow_id:
            workflowId,

          p_source_document_id:
            workspace
              .current_document
              .document_id,

          p_signature_method:
            DEFAULT_SIGNATURE_METHOD,

          p_signature_reference:
            getSignatureReference(),

          p_signed_document_path:
            storagePath,

          p_signed_document_sha256:
            selectedSignedFileHash,

          p_remarks:
            signingRemarks
              ?.value
              ?.trim() ||
            null

        }

      );


    if (
      error
    ) {

      throw error;

    }


    return data;

  }


  /* =====================================================
     FINAL APPROVAL
  ===================================================== */

  async function performFinalApproval(
    storagePath
  ) {

    const client =
      await waitForSupabaseClient();


    if (
      !client
    ) {

      throw new Error(
        "Supabase connection is unavailable."
      );

    }


    const {
      data,
      error
    } =
      await client.rpc(

        "final_sign_and_approve_initial_ctr",

        {

          p_workflow_id:
            workflowId,

          p_source_document_id:
            workspace
              .current_document
              .document_id,

          p_signature_method:
            DEFAULT_SIGNATURE_METHOD,

          p_signature_reference:
            getSignatureReference(),

          p_final_signed_document_path:
            storagePath,

          p_final_signed_document_sha256:
            selectedSignedFileHash,

          p_remarks:
            signingRemarks
              ?.value
              ?.trim() ||
            null

        }

      );


    if (
      error
    ) {

      throw error;

    }


    return data;

  }


  /* =====================================================
     FETCH WORKSPACE
  ===================================================== */

  async function fetchWorkspace() {

    const client =
      await waitForSupabaseClient();


    if (
      !client
    ) {

      throw new Error(
        "Supabase connection is unavailable."
      );

    }


    const {
      data,
      error
    } =
      await client.rpc(

        "get_ctr_signing_workspace",

        {

          p_workflow_id:
            workflowId

        }

      );


    if (
      error
    ) {

      throw error;

    }


    if (
      !data
    ) {

      throw new Error(
        "CTR signing workflow could not be loaded."
      );

    }


    return data;

  }


  /* =====================================================
     REFRESH WORKFLOW BEFORE IRREVERSIBLE ACTION
  ===================================================== */

  async function refreshWorkspaceBeforeAction() {

    const oldDocumentId =
      workspace
        ?.current_document
        ?.document_id;


    const latest =
      await fetchWorkspace();


    const newDocumentId =
      latest
        ?.current_document
        ?.document_id;


    if (
      oldDocumentId !==
      newDocumentId
    ) {

      workspace =
        latest;


      renderWorkspace();


      resetSignedFileState();


      throw new Error(
        "The CTR PDF changed while this page was open. Review the latest PDF before signing."
      );

    }


    workspace =
      latest;

  }


  /* =====================================================
     COMPLETE WORKFLOW ACTION
  ===================================================== */

  async function completeWorkflowSigning() {

    if (

      signingActionRunning ||

      !isSigningReady()

    ) {

      return;

    }


    const finalApproval =

      workspace
        ?.can_final_approve ===
      true;


    const confirmation =
      window.confirm(

        finalApproval

          ? (

              "Confirm Final Approval?\n\n" +

              "The digitally signed PDF will become the final approved CTR document."

            )

          : (

              "Confirm Submit & Forward?\n\n" +

              "The digitally signed PDF will be forwarded to the next workflow stage."

            )

      );


    if (
      !confirmation
    ) {

      return;

    }


    signingActionRunning =
      true;


    updateSigningReadiness();


    completeSigningAction.textContent =

      finalApproval

        ? "Final Approval Processing..."

        : "Forwarding...";


    try {

      showStatus(
        "Rechecking signed PDF..."
      );


      const freshHash =
        await calculateSha256(
          selectedSignedFile
        );


      if (
        freshHash !==
        selectedSignedFileHash
      ) {

        throw new Error(
          "Signed PDF changed after verification. Check it again."
        );

      }


      showStatus(
        "Checking current workflow stage..."
      );


      await refreshWorkspaceBeforeAction();


      if (

        finalApproval &&

        !workspace
          ?.can_final_approve

      ) {

        throw new Error(
          "Final Approval is no longer assigned to this user."
        );

      }


      if (

        !finalApproval &&

        !workspace
          ?.can_sign_and_forward

      ) {

        throw new Error(
          "This workflow is no longer available for forwarding."
        );

      }


      showStatus(
        "Saving digitally signed PDF..."
      );


      const storagePath =
        await uploadSignedPdf();


      showStatus(

        finalApproval

          ? "Completing Final Approval..."

          : "Forwarding CTR..."

      );


      if (
        finalApproval
      ) {

        await performFinalApproval(
          storagePath
        );

      }


      else {

        await performSignAndForward(
          storagePath
        );

      }


      signingHeroStatus.textContent =

        finalApproval

          ? "● Final Approved"

          : "● Forwarded";


      showStatus(

        finalApproval

          ? "Final signed CTR approved successfully."

          : "Signed CTR forwarded successfully.",

        "success"

      );


      completeSigningAction.disabled =
        true;


      signWithDscButton.disabled =
        true;


      refreshDscBridge.disabled =
        true;


      signedPdfFile.disabled =
        true;


      signatureReference.disabled =
        true;


      signingRemarks.disabled =
        true;


      manualSignedConfirmation.disabled =
        true;


      window.setTimeout(
        function () {

          window.location.href =

            finalApproval

              ? "approved.html"

              : "approvals.html";

        },
        1000
      );

    }


    catch (error) {

      console.error(
        "CTR signing action error:",
        error
      );


      showStatus(

        error?.message ||

        "Signing action could not be completed.",

        "error"

      );


      signingActionRunning =
        false;


      configureActionMode();

    }

  }


  /* =====================================================
     LOAD PAGE
  ===================================================== */

  async function loadSigningWorkspace() {

    workflowId =
      getWorkflowIdFromUrl();


    if (
      !workflowId
    ) {

      signingHeroStatus.textContent =
        "● Workflow Missing";


      showStatus(

        "Workflow ID is missing. Open Digital Signing from Pending Approvals.",

        "error"

      );


      return;

    }


    showStatus(
      "Loading signing page..."
    );


    try {

      workspace =
        await fetchWorkspace();


      renderWorkspace();


      if (
        !workspace
          ?.is_current_holder
      ) {

        showStatus(
          "This record is currently assigned to another user."
        );

      }


      else if (
        !workspace
          ?.current_document
      ) {

        showStatus(
          "Generate the CTR PDF before digital signing."
        );

      }


      else if (
        workspace
          ?.can_final_approve
      ) {

        showStatus(
          "Review the PDF and apply your DSC for Final Approval."
        );

      }


      else if (
        workspace
          ?.can_sign_and_forward
      ) {

        showStatus(
          "Review the PDF and apply your DSC to continue the workflow."
        );

      }


      else {

        showStatus(
          "No signing action is currently available."
        );

      }


      /*
         Check whether eMudhra emBridge is available
         on this officer's computer.
      */

      await checkDscBridge();

    }


    catch (error) {

      console.error(
        "Unable to load signing workspace:",
        error
      );


      signingHeroStatus.textContent =
        "● Load Error";


      showStatus(

        error?.message ||

        "Unable to load signing page.",

        "error"

      );

    }

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  openCurrentDocument
    ?.addEventListener(
      "click",
      openCurrentPdf
    );


  downloadCurrentDocument
    ?.addEventListener(
      "click",
      downloadCurrentPdf
    );


  refreshDscBridge
    ?.addEventListener(
      "click",
      checkDscBridge
    );


  signWithDscButton
    ?.addEventListener(
      "click",
      signCurrentPdfWithDsc
    );


  signedPdfFile
    ?.addEventListener(
      "change",
      handleManualFileSelection
    );


  verifySignedDocument
    ?.addEventListener(
      "click",
      verifyManualSignedPdf
    );


  signatureReference
    ?.addEventListener(
      "input",
      updateSigningReadiness
    );


  manualSignedConfirmation
    ?.addEventListener(
      "change",
      updateSigningReadiness
    );


  completeSigningAction
    ?.addEventListener(
      "click",
      completeWorkflowSigning
    );


  /*
     Future browser extension can fire this event
     after the native DSC Bridge becomes available.
  */

  window.addEventListener(
    "ctr-embridge-ready",
    checkDscBridge
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
      loadSigningWorkspace,
      {
        once:
          true
      }
    );

  }


  else {

    loadSigningWorkspace();

  }


})();