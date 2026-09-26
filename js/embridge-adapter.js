/* =========================================================
   CTR - EMUDHRA EMBRIDGE ADAPTER

   PURPOSE
   ---------------------------------------------------------
   This file isolates all emBridge-specific integration.

   CTR workflow-sign.js will communicate only with this
   adapter.

   When the exact official emBridge API/library is connected,
   only this file should need changes.

   IMPORTANT
   ---------------------------------------------------------
   - Never store DSC PIN.
   - Never send DSC PIN to Supabase.
   - Never export DSC private key.
   - Signing must be performed by the local DSC middleware.
========================================================= */


(() => {

  "use strict";


  /* =====================================================
     CONFIGURATION
  ===================================================== */

  const CONFIG = {

    serviceUrl:
      "https://localhost.emudhra.com:26769",

    provider:
      "emBridge",

    /*
       Actual emBridge signing API/library bindings will be
       configured here after we test with a real DSC token.
    */

    apiReady:
      false

  };


  /* =====================================================
     STATE
  ===================================================== */

  let lastStatus = {

    available:
      false,

    provider:
      CONFIG.provider,

    serviceUrl:
      CONFIG.serviceUrl,

    message:
      "emBridge integration is waiting for DSC API verification."

  };


  /* =====================================================
     BASIC SERVICE CHECK

     Note:
     The root URL itself may return XML / route-not-found.
     That still proves that the local emBridge service is
     listening.

     Browser CORS rules may prevent JavaScript from reading
     the response, therefore this is not used as proof of
     signing capability.
  ===================================================== */

  async function checkServiceReachability() {

    try {

      await fetch(
        CONFIG.serviceUrl,
        {

          method:
            "GET",

          mode:
            "no-cors",

          cache:
            "no-store"

        }
      );


      return true;

    }

    catch (error) {

      console.warn(
        "emBridge local service check:",
        error
      );


      return false;

    }

  }


  /* =====================================================
     GET STATUS
  ===================================================== */

  async function getStatus() {

    const serviceReachable =
      await checkServiceReachability();


    /*
       Service reachable does NOT mean certificate/signing API
       has been validated.

       We deliberately keep available=false until actual
       emBridge DSC calls are tested with the token.
    */

    lastStatus = {

      available:
        CONFIG.apiReady ===
        true,

      serviceReachable:
        serviceReachable,

      provider:
        CONFIG.provider,

      serviceUrl:
        CONFIG.serviceUrl,

      version:
        null,

      message:

        CONFIG.apiReady

          ? "emBridge DSC integration is ready."

          : serviceReachable

            ? "emBridge service is running. DSC API verification is pending."

            : "emBridge local service could not be reached."

    };


    return {

      ...lastStatus

    };

  }


  /* =====================================================
     LIST CERTIFICATES

     We will connect this to the official emBridge
     certificate API after DSC testing.

     Expected future output:

     [
       {
         id: "...",
         subject: "...",
         issuer: "...",
         serialNumber: "...",
         validFrom: "...",
         validTo: "...",
         provider: "ProxKey"
       }
     ]
  ===================================================== */

  async function listCertificates() {

    if (
      CONFIG.apiReady !==
      true
    ) {

      throw new Error(
        "emBridge certificate API has not been configured yet."
      );

    }


    /*
       FUTURE:
       Official emBridge certificate call goes here.
    */


    return [];

  }


  /* =====================================================
     SIGN PDF

     Expected input:

     {
       pdfBytes,
       fileName,
       workflowId,
       documentId,
       stationName,
       stationCode,
       recordName,
       preserveExistingSignatures
     }

     Expected output:

     {
       signedPdf,
       signatureReference,
       signatureValid,
       signerName,
       certificateSubject,
       certificateIssuer,
       certificateSerial,
       signedAt
     }
  ===================================================== */

  async function signPdf(options) {

    if (
      CONFIG.apiReady !==
      true
    ) {

      throw new Error(
        "Actual emBridge DSC signing API has not been connected yet."
      );

    }


    if (
      !options?.pdfBytes
    ) {

      throw new Error(
        "PDF data is missing."
      );

    }


    /*
       IMPORTANT

       Actual emBridge call will be placed here only after
       we confirm the official API/library using the real
       DSC token.

       Do not put token PIN in this JavaScript.

       PIN must be handled by emBridge / token middleware.
    */


    throw new Error(
      "emBridge PDF signing implementation is pending DSC testing."
    );

  }


  /* =====================================================
     PUBLIC ADAPTER
  ===================================================== */

  window.CTR_EMBRIDGE = {

    name:
      "eMudhra emBridge",

    getStatus:
      getStatus,

    listCertificates:
      listCertificates,

    signPdf:
      signPdf,

    getLastStatus() {

      return {

        ...lastStatus

      };

    }

  };


  /*
     Notify CTR in case workflow-sign.js
     is already loaded.
  */

  window.dispatchEvent(
    new CustomEvent(
      "ctr-embridge-ready"
    )
  );


})();