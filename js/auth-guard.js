/* =========================================================
   CTR MANAGEMENT SYSTEM
   AUTHENTICATION GUARD

   PURPOSE
   ---------------------------------------------------------
   - Keep valid Supabase login session across CTR pages.
   - Do not force a fresh login on every navigation.
   - Redirect only when no valid browser session exists.
   - Database RLS remains the final security authority.
========================================================= */


let ctrAuthReady =
  false;

let ctrCurrentUser =
  null;


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToCtrLogin() {

  const currentPage =
    String(
      window.location.pathname || ""
    )
      .split("/")
      .pop()
      .toLowerCase();


  /*
     Prevent redirect loops.
  */

  if (
    currentPage === "login.html" ||
    currentPage === "set-password.html"
  ) {

    return;

  }


  window.location.replace(
    "login.html"
  );

}


/* =========================================================
   AUTHENTICATION GUARD
========================================================= */

async function protectCtrPage() {

  try {

    if (
      typeof supabaseClient ===
        "undefined" ||
      !supabaseClient?.auth
    ) {

      throw new Error(
        "Supabase authentication client is not available."
      );

    }


    /*
       getSession() first reads/restores the persisted
       browser session.

       This prevents unnecessary login redirects while
       moving between CTR pages.
    */

    const {
      data:
        sessionData,
      error:
        sessionError
    } =
      await supabaseClient
        .auth
        .getSession();


    if (sessionError) {

      throw sessionError;

    }


    let session =
      sessionData?.session ||
      null;


    /*
       No saved authenticated session.
    */

    if (!session) {

      ctrAuthReady =
        false;

      ctrCurrentUser =
        null;


      redirectToCtrLogin();

      return false;

    }


    /*
       Supabase normally refreshes sessions automatically.

       If the token is very close to expiry, explicitly
       request a refresh before continuing.
    */

    const expiresAt =
      Number(
        session.expires_at || 0
      );


    const nowSeconds =
      Math.floor(
        Date.now() / 1000
      );


    if (
      expiresAt &&
      expiresAt - nowSeconds < 60
    ) {

      const {
        data:
          refreshData,
        error:
          refreshError
      } =
        await supabaseClient
          .auth
          .refreshSession();


      if (refreshError) {

        console.warn(
          "CTR session refresh warning:",
          refreshError
        );

      }


      if (
        refreshData?.session
      ) {

        session =
          refreshData.session;

      }

    }


    /*
       Session exists.

       Store currently authenticated user for other
       frontend modules if required.
    */

    ctrCurrentUser =
      session.user ||
      null;


    ctrAuthReady =
      true;


    window.ctrAuth = {

      ready:
        true,

      user:
        ctrCurrentUser,

      session:
        session

    };


    window.dispatchEvent(
      new CustomEvent(
        "ctr-auth-ready",
        {
          detail: {
            user:
              ctrCurrentUser
          }
        }
      )
    );


    return true;

  }

  catch (error) {

    console.error(
      "CTR authentication check failed:",
      error
    );


    ctrAuthReady =
      false;

    ctrCurrentUser =
      null;


    /*
       A genuine missing/invalid session should return
       the user to Login.
    */

    redirectToCtrLogin();


    return false;

  }

}


/* =========================================================
   AUTH STATE CHANGES
========================================================= */

if (
  typeof supabaseClient !==
    "undefined" &&
  supabaseClient?.auth
) {

  supabaseClient
    .auth
    .onAuthStateChange(
      function (
        event,
        session
      ) {

        if (
          event ===
            "SIGNED_OUT"
        ) {

          ctrAuthReady =
            false;

          ctrCurrentUser =
            null;


          window.ctrAuth = {

            ready:
              false,

            user:
              null,

            session:
              null

          };


          redirectToCtrLogin();

          return;

        }


        if (session) {

          ctrAuthReady =
            true;

          ctrCurrentUser =
            session.user ||
            null;


          window.ctrAuth = {

            ready:
              true,

            user:
              ctrCurrentUser,

            session:
              session

          };

        }

      }
    );

}


/* =========================================================
   START SECURITY CHECK
========================================================= */

protectCtrPage();