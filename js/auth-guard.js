/* =========================================================
   CTR MANAGEMENT SYSTEM
   AUTHENTICATION GUARD
========================================================= */

async function protectCtrPage() {

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getUser();


    if (error || !data.user) {

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