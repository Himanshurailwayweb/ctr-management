/* =========================================================
   CTR MANAGEMENT SYSTEM
   AUTHENTICATION GUARD

   Browser session check only.
   Actual data authorization remains protected by Supabase RLS.
========================================================= */

async function protectCtrPage() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getSession();


    if (error) {

      console.error(
        "CTR session check error:",
        error
      );

    }


    const session =
      data?.session;


    if (!session) {

      window.location.replace(
        "login.html"
      );

      return false;

    }


    return true;

  }

  catch (error) {

    console.error(
      "CTR authentication check failed:",
      error
    );


    window.location.replace(
      "login.html"
    );


    return false;

  }

}


/* =========================================================
   START SECURITY CHECK
========================================================= */

protectCtrPage();