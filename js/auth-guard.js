/* =========================================================
   CTR MANAGEMENT SYSTEM
   AUTHENTICATION GUARD

   RLS = actual security boundary.
   This guard only prevents unauthenticated page access.
========================================================= */

(async function () {

  "use strict";


  function goToLogin() {

    if (
      !window.location.pathname
        .endsWith("/login.html")
    ) {

      window.location.replace(
        "login.html"
      );

    }

  }


  async function getStableSession() {

    /* ---------------------------------------------
       FIRST CHECK
    --------------------------------------------- */

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getSession();


    if (error) {

      console.error(
        "CTR initial session check:",
        error
      );

    }


    if (data?.session) {

      return data.session;

    }


    /* ---------------------------------------------
       SUPABASE MAY STILL BE RESTORING LOCAL SESSION
       Wait briefly for INITIAL_SESSION / SIGNED_IN.
    --------------------------------------------- */

    return await new Promise(
      (resolve) => {

        let finished =
          false;

        let subscription =
          null;


        const finish =
          (session) => {

            if (finished) {
              return;
            }

            finished =
              true;


            if (subscription) {

              subscription
                .unsubscribe();

            }


            resolve(
              session || null
            );

          };


        const timer =
          window.setTimeout(
            () => {

              finish(null);

            },
            1500
          );


        const {
          data: listenerData
        } =
          supabaseClient
            .auth
            .onAuthStateChange(
              (
                event,
                session
              ) => {

                if (
                  event ===
                    "INITIAL_SESSION" ||
                  event ===
                    "SIGNED_IN" ||
                  event ===
                    "TOKEN_REFRESHED"
                ) {

                  if (session) {

                    window.clearTimeout(
                      timer
                    );

                    finish(
                      session
                    );

                  }

                }


                if (
                  event ===
                  "SIGNED_OUT"
                ) {

                  window.clearTimeout(
                    timer
                  );

                  finish(null);

                }

              }
            );


        subscription =
          listenerData
            ?.subscription ||
          null;

      }
    );

  }


  try {

    if (
      typeof supabaseClient ===
      "undefined"
    ) {

      console.error(
        "Supabase client is not loaded."
      );

      return;

    }


    const session =
      await getStableSession();


    if (!session) {

      goToLogin();

      return;

    }


    console.log(
      "CTR authenticated session:",
      session.user?.id
    );

  }

  catch (error) {

    /*
       Network/session refresh errors must NOT
       automatically throw an already logged-in
       user back to login.

       Database RLS continues protecting all data.
    */

    console.error(
      "CTR authentication guard error:",
      error
    );

  }

})();