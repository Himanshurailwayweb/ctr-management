/* =========================================================
   CTR MANAGEMENT SYSTEM
   eMudhra emBridge Adapter

   STATUS
   ---------------------------------------------------------
   ✓ Local emBridge Version API verified
   ✓ Secure local bridge request framework prepared
   ✓ PKCS signing request structure prepared

   PENDING
   ---------------------------------------------------------
   - Official encrypted request generation
   - Certificate listing integration
   - Complete PDF digital-signature generation

   SECURITY
   ---------------------------------------------------------
   - Private DSC key never reaches this website
   - DSC PIN must never be stored
   - DSC PIN must never be logged
   - DSC PIN must never be sent to Supabase
========================================================= */

(function () {

  "use strict";


  /* =====================================================
     ADAPTER VERSION
  ===================================================== */

  const ADAPTER_VERSION =
    "1.0.0-pre-dsc";


  /* =====================================================
     CONFIGURATION
  ===================================================== */

  const CONFIG = {

    serviceUrl:
      "https://localhost.emudhra.com:26769",

    endpoints: {

      version:
        "/DSC/Version",

      listCertificate:
        "/DSC/ListCertificate",

      pkcsSign:
        "/DSC/PKCSSign"

    },

    provider:
      "emBridge",

    requestTimeoutMs:
      5000,

    maxPdfBytes:
      25 * 1024 * 1024,

    /*
      Keep FALSE until complete PDF signing
      is actually implemented and verified.
    */
    apiReady:
      false

  };


  /* =====================================================
     INTERNAL STATE
  ===================================================== */

  let lastStatus = {

    available:
      false,

    serviceReachable:
      false,

    versionVerified:
      false,

    apiVerified:
      false,

    provider:
      CONFIG.provider,

    serviceUrl:
      CONFIG.serviceUrl,

    version:
      null,

    adapterVersion:
      ADAPTER_VERSION,

    checkedAt:
      null,

    message:
      "emBridge has not been checked yet."

  };


  /* =====================================================
     ERROR HELPER
  ===================================================== */

  function createAdapterError(
    code,
    message,
    originalError = null
  ) {

    const error =
      new Error(
        message ||
        "emBridge adapter error."
      );


    error.name =
      "CtrEmBridgeError";


    error.code =
      code ||
      "EMBRIDGE_ERROR";


    if (
      originalError
    ) {

      error.originalError =
        originalError;

    }


    return error;

  }


  /* =====================================================
     BINARY HELPERS
  ===================================================== */

  async function normalizeBinaryInput(
    value
  ) {

    if (
      value instanceof
      Uint8Array
    ) {

      return new Uint8Array(
        value
      );

    }


    if (
      value instanceof
      ArrayBuffer
    ) {

      return new Uint8Array(
        value
      );

    }


    if (
      typeof Blob !==
        "undefined" &&
      value instanceof Blob
    ) {

      const buffer =
        await value.arrayBuffer();


      return new Uint8Array(
        buffer
      );

    }


    throw createAdapterError(

      "INVALID_PDF_INPUT",

      "PDF must be supplied as File, Blob, ArrayBuffer or Uint8Array."

    );

  }


  /* =====================================================
     PDF VALIDATION
  ===================================================== */

  async function validatePdf(
    pdfInput
  ) {

    const bytes =
      await normalizeBinaryInput(
        pdfInput
      );


    if (
      bytes.byteLength ===
      0
    ) {

      throw createAdapterError(

        "EMPTY_PDF",

        "The PDF is empty."

      );

    }


    if (
      bytes.byteLength >
      CONFIG.maxPdfBytes
    ) {

      throw createAdapterError(

        "PDF_TOO_LARGE",

        "The PDF exceeds the maximum permitted size of 25 MB."

      );

    }


    if (
      bytes.byteLength <
      5
    ) {

      throw createAdapterError(

        "INVALID_PDF",

        "The selected file is not a valid PDF."

      );

    }


    const header =
      String.fromCharCode(
        bytes[0],
        bytes[1],
        bytes[2],
        bytes[3],
        bytes[4]
      );


    if (
      header !==
      "%PDF-"
    ) {

      throw createAdapterError(

        "INVALID_PDF_HEADER",

        "The selected document does not contain a valid PDF header."

      );

    }


    return {

      valid:
        true,

      bytes:
        bytes,

      byteLength:
        bytes.byteLength

    };

  }


  /* =====================================================
     EMBRIDGE VERSION / HEALTH CHECK
  ===================================================== */

  async function getStatus() {

    let serviceReachable =
      false;

    let versionVerified =
      false;

    let version =
      null;


    try {

      const controller =
        new AbortController();


      const timeoutId =
        window.setTimeout(

          function () {

            controller.abort();

          },

          CONFIG.requestTimeoutMs

        );


      try {

        const response =
          await fetch(

            CONFIG.serviceUrl +
            CONFIG.endpoints.version,

            {

              method:
                "GET",

              cache:
                "no-store",

              signal:
                controller.signal

            }

          );


        if (
          !response.ok
        ) {

          throw new Error(

            "emBridge Version request failed."

          );

        }


        const result =
          await response.json();


        serviceReachable =
          true;


        if (

          result &&

          Number(
            result.status
          ) === 1 &&

          result.version

        ) {

          version =
            String(
              result.version
            );


          versionVerified =
            true;

        }

      }

      finally {

        window.clearTimeout(
          timeoutId
        );

      }

    }

    catch (error) {

      console.warn(

        "emBridge Version check:",

        error

      );

    }


    /*
      This becomes TRUE only after our
      complete PDF signing integration
      is implemented and verified.
    */

    const apiVerified =
      CONFIG.apiReady ===
      true;


    let message;


    if (

      serviceReachable &&

      versionVerified &&

      apiVerified

    ) {

      message =
        "emBridge DSC integration is ready.";

    }

    else if (

      serviceReachable &&

      versionVerified

    ) {

      message =
        "emBridge service verified. PDF DSC integration is pending.";

    }

    else if (
      serviceReachable
    ) {

      message =
        "emBridge service is reachable, but Version API could not be verified.";

    }

    else {

      message =
        "emBridge local service could not be reached.";

    }


    lastStatus = {

      available:

        serviceReachable &&
        versionVerified &&
        apiVerified,

      serviceReachable:
        serviceReachable,

      versionVerified:
        versionVerified,

      apiVerified:
        apiVerified,

      provider:
        CONFIG.provider,

      serviceUrl:
        CONFIG.serviceUrl,

      version:
        version,

      adapterVersion:
        ADAPTER_VERSION,

      checkedAt:
        new Date()
          .toISOString(),

      message:
        message

    };


    return {

      ...lastStatus

    };

  }


  /* =====================================================
     SECURE API READINESS
  ===================================================== */

  function assertBridgeReadyForSecureApi(
    status
  ) {

    if (

      !status ||

      status.serviceReachable !==
        true ||

      status.versionVerified !==
        true

    ) {

      throw createAdapterError(

        "EMBRIDGE_NOT_AVAILABLE",

        "emBridge service is not ready."

      );

    }

  }


  /* =====================================================
     ENCRYPTED LOCAL EMBRIDGE REQUEST

     IMPORTANT:
     -------------------------------------------------------
     This function accepts ONLY an already-encrypted request.

     It does NOT create the encryptedRequest.

     We are deliberately not reproducing the undocumented
     remote helper used by the public test page.
  ===================================================== */

  async function callEncryptedBridgeApi({
    endpoint,
    encryptedRequest,
    encryptionKeyID = "default"
  }) {

    const status =
      await getStatus();


    assertBridgeReadyForSecureApi(
      status
    );


    if (

      typeof endpoint !==
        "string" ||

      !endpoint.trim()

    ) {

      throw createAdapterError(

        "INVALID_EMBRIDGE_ENDPOINT",

        "A valid emBridge endpoint is required."

      );

    }


    if (

      typeof encryptedRequest !==
        "string" ||

      !encryptedRequest.trim()

    ) {

      throw createAdapterError(

        "INVALID_ENCRYPTED_REQUEST",

        "Encrypted emBridge request data is required."

      );

    }


    const controller =
      new AbortController();


    const timeoutId =
      window.setTimeout(

        function () {

          controller.abort();

        },

        CONFIG.requestTimeoutMs

      );


    try {

      const response =
        await fetch(

          CONFIG.serviceUrl +
          endpoint,

          {

            method:
              "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify({

                encryptedRequest:
                  encryptedRequest,

                encryptionKeyID:
                  encryptionKeyID,

                errorMsg:
                  ""

              }),

            signal:
              controller.signal

          }

        );


      if (
        !response.ok
      ) {

        throw createAdapterError(

          "EMBRIDGE_REQUEST_FAILED",

          "emBridge request failed with HTTP " +
            response.status +
            "."

        );

      }


      const result =
        await response.json();


      if (

        !result ||

        Number(
          result.status
        ) !== 1

      ) {

        throw createAdapterError(

          "EMBRIDGE_OPERATION_FAILED",

          result?.errorMessage ||
            "emBridge operation failed."

        );

      }


      return result;

    }

    catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {

        throw createAdapterError(

          "EMBRIDGE_TIMEOUT",

          "emBridge request timed out.",

          error

        );

      }


      throw error;

    }

    finally {

      window.clearTimeout(
        timeoutId
      );

    }

  }


  /* =====================================================
     CREATE PKCS SIGN REQUEST

     SECURITY:
     -------------------------------------------------------
     passphrase exists ONLY in this temporary object.

     Never:
     - console.log this object
     - save it in localStorage
     - save it in sessionStorage
     - send it to Supabase
  ===================================================== */

  function createPkcsSignRequest({

    providerName,

    certificateId,

    passphrase,

    dataToSign,

    dataType

  }) {

    if (

      typeof providerName !==
        "string" ||

      !providerName.trim()

    ) {

      throw createAdapterError(

        "INVALID_DSC_PROVIDER",

        "DSC provider is required."

      );

    }


    if (

      typeof certificateId !==
        "string" ||

      !certificateId.trim()

    ) {

      throw createAdapterError(

        "INVALID_DSC_CERTIFICATE",

        "DSC certificate is required."

      );

    }


    if (

      typeof passphrase !==
        "string" ||

      !passphrase

    ) {

      throw createAdapterError(

        "INVALID_DSC_PASSPHRASE",

        "DSC token PIN/password is required."

      );

    }


    if (

      typeof dataToSign !==
        "string" ||

      !dataToSign

    ) {

      throw createAdapterError(

        "INVALID_SIGNING_DATA",

        "Signing data is required."

      );

    }


    if (

      typeof dataType !==
        "string" ||

      !dataType.trim()

    ) {

      throw createAdapterError(

        "INVALID_SIGNING_DATA_TYPE",

        "Signing data type is required."

      );

    }


    const appID =

      (
        window.crypto &&
        typeof window.crypto
          .randomUUID ===
          "function"
      )

        ? window.crypto
            .randomUUID()

        : (

            "ctr-" +
            Date.now() +
            "-" +
            Math.random()
              .toString(16)
              .slice(2)

          );


    return {

      appID:
        appID,

      keyStorePassphrase:
        passphrase,

      keyStoreDisplayName:
        providerName.trim(),

      keyId:
        certificateId.trim(),

      dataToSign:
        dataToSign,

      dataType:
        dataType.trim(),

      timeStamp:
        Date.now()

    };

  }


  /* =====================================================
     CERTIFICATE LISTING

     The local route is prepared.

     Actual encrypted request generation / response
     decryption is still pending.
  ===================================================== */

  async function listCertificates(
    filters = {}
  ) {

    if (

      filters ===
        null ||

      typeof filters !==
        "object" ||

      Array.isArray(
        filters
      )

    ) {

      throw createAdapterError(

        "INVALID_CERTIFICATE_FILTER",

        "Certificate filter must be an object."

      );

    }


    const status =
      await getStatus();


    if (

      !status.serviceReachable ||

      !status.versionVerified

    ) {

      throw createAdapterError(

        "EMBRIDGE_NOT_AVAILABLE",

        "emBridge service is not available."

      );

    }


    /*
      Prepared endpoint:

      POST /DSC/ListCertificate

      emBridge expects an encrypted request envelope.

      We will connect this after the official encryption
      integration method is available.
    */


    throw createAdapterError(

      "CERTIFICATE_API_NOT_CONNECTED",

      "emBridge is verified, but encrypted certificate listing is not connected yet."

    );

  }


  /* =====================================================
     PDF SIGNING

     IMPORTANT:
     -------------------------------------------------------
     PKCSSign alone does not automatically produce the
     complete digitally-signed PDF required by CTR workflow.

     workflow-sign.js expects this adapter to eventually
     return:

       signedPdf
       OR signedPdfBase64

       signatureReference
       signatureValid === true

       signerName
       certificateSubject
       certificateIssuer
       certificateSerial
       signedAt

     Until that complete PDF flow exists, signPdf MUST
     remain unavailable.
  ===================================================== */

  async function signPdf(options = {}) {

    if (

      options ===
        null ||

      typeof options !==
        "object" ||

      Array.isArray(
        options
      )

    ) {

      throw createAdapterError(

        "INVALID_SIGN_OPTIONS",

        "DSC signing options must be an object."

      );

    }


    if (
      !options.pdfBytes
    ) {

      throw createAdapterError(

        "PDF_REQUIRED",

        "CTR PDF data is required for DSC signing."

      );

    }


    /*
      Validate the controlled PDF before attempting
      any future signing operation.
    */

    await validatePdf(
      options.pdfBytes
    );


    const status =
      await getStatus();


    if (

      !status.serviceReachable ||

      !status.versionVerified

    ) {

      throw createAdapterError(

        "EMBRIDGE_NOT_AVAILABLE",

        "emBridge service is not available on this computer."

      );

    }


    /*
      DO NOT set signatureValid = true here.

      DO NOT return the original unsigned PDF.

      DO NOT simulate a successful DSC signature.
    */


    throw createAdapterError(

      "PDF_DSC_NOT_CONNECTED",

      "emBridge is detected, but complete PDF DSC signing is not connected yet."

    );

  }


  /* =====================================================
     DIAGNOSTICS

     Deliberately excludes:
     - token PIN
     - certificate private data
     - encrypted signing requests
     - PDF contents
  ===================================================== */

  function diagnostics() {

    return {

      adapter:
        "CTR eMudhra emBridge Adapter",

      adapterVersion:
        ADAPTER_VERSION,

      provider:
        CONFIG.provider,

      serviceUrl:
        CONFIG.serviceUrl,

      endpoints: {

        version:
          CONFIG.endpoints.version,

        listCertificate:
          CONFIG.endpoints.listCertificate,

        pkcsSign:
          CONFIG.endpoints.pkcsSign

      },

      apiReady:
        CONFIG.apiReady,

      maxPdfBytes:
        CONFIG.maxPdfBytes,

      lastStatus: {

        ...lastStatus

      }

    };

  }


  /* =====================================================
     PUBLIC API
  ===================================================== */

  window.CTR_EMBRIDGE = {

    name:
      "eMudhra emBridge",

    adapterVersion:
      ADAPTER_VERSION,

    getStatus:
      getStatus,

    listCertificates:
      listCertificates,

    signPdf:
      signPdf,

    validatePdf:
      validatePdf,

    diagnostics:
      diagnostics

  };


  /* =====================================================
     READY EVENT
  ===================================================== */

  window.dispatchEvent(

    new CustomEvent(
      "ctr-embridge-ready",
      {

        detail: {

          adapterVersion:
            ADAPTER_VERSION

        }

      }
    )

  );


})();