/* =========================================================
   CTR - SET PASSWORD
========================================================= */

const passwordForm =
  document.getElementById("passwordForm");

const newPassword =
  document.getElementById("newPassword");

const confirmPassword =
  document.getElementById("confirmPassword");

const passwordButton =
  document.getElementById("passwordButton");

const passwordMessage =
  document.getElementById("passwordMessage");

const inviteStatus =
  document.getElementById("inviteStatus");


let invitationValid = false;


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message, type) {

  passwordMessage.textContent = message;

  if (type === "error") {
    passwordMessage.style.color = "#b91c1c";
  }

  else if (type === "success") {
    passwordMessage.style.color = "#15803d";
  }

  else {
    passwordMessage.style.color = "#66788a";
  }

}


/* =========================================================
   INVALID INVITATION
========================================================= */

function showInvalidInvitation(message) {

  invitationValid = false;

  inviteStatus.textContent =
    message ||
    "Invitation is invalid or expired.";

  inviteStatus.style.color =
    "#b91c1c";

  passwordButton.disabled =
    true;

}


/* =========================================================
   VALID INVITATION
========================================================= */

function showValidInvitation(user) {

  invitationValid = true;

  inviteStatus.textContent =
    user?.email
      ? `Invitation verified for ${user.email}`
      : "Invitation verified.";

  inviteStatus.style.color =
    "#15803d";

  passwordButton.disabled =
    false;

}


/* =========================================================
   CHECK INVITATION
========================================================= */

async function checkInvitation() {

  /*
    Check if Supabase returned an error
    in URL.
  */

  const queryParams =
    new URLSearchParams(
      window.location.search
    );

  const hashParams =
    new URLSearchParams(
      window.location.hash.replace("#", "")
    );


  const authError =
    queryParams.get("error_description") ||
    hashParams.get("error_description");


  if (authError) {

    showInvalidInvitation(
      decodeURIComponent(authError)
    );

    return;
  }


  /*
    Listen for Supabase session created
    from invitation link.
  */

  supabaseClient.auth.onAuthStateChange(
    function (event, session) {

      if (session && session.user) {

        showValidInvitation(
          session.user
        );

      }

    }
  );


  try {

    /*
      If Supabase sends an Auth Code,
      exchange it for a session.
    */

    const code =
      queryParams.get("code");


    if (code) {

      const {
        error
      } =
        await supabaseClient
          .auth
          .exchangeCodeForSession(code);


      if (error) {
        throw error;
      }

    }


    /*
      Give Supabase a moment to process
      the invitation URL.
    */

    await new Promise(
      function (resolve) {

        setTimeout(resolve, 500);

      }
    );


    /*
      Verify actual authenticated user.
    */

    const {
      data,
      error
    } =
      await supabaseClient
        .auth
        .getUser();


    if (
      !error &&
      data &&
      data.user
    ) {

      showValidInvitation(
        data.user
      );

      return;
    }


    /*
      Wait once more because invitation
      session can take a moment to load.
    */

    setTimeout(
      async function () {

        if (invitationValid) {
          return;
        }


        const {
          data: retryData,
          error: retryError
        } =
          await supabaseClient
            .auth
            .getUser();


        if (
          !retryError &&
          retryData &&
          retryData.user
        ) {

          showValidInvitation(
            retryData.user
          );

        }

        else {

          showInvalidInvitation(
            "Invitation is invalid, expired, or has already been used."
          );

        }

      },
      1200
    );

  }

  catch (error) {

    console.error(
      "Invitation verification error:",
      error
    );


    showInvalidInvitation(
      error.message
    );

  }

}


/* =========================================================
   SET NEW PASSWORD
========================================================= */

passwordForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    if (!invitationValid) {

      showMessage(
        "Valid invitation required.",
        "error"
      );

      return;
    }


    const password =
      newPassword.value;

    const confirmation =
      confirmPassword.value;


    if (password.length < 10) {

      showMessage(
        "Password must contain at least 10 characters.",
        "error"
      );

      return;
    }


    if (password !== confirmation) {

      showMessage(
        "Passwords do not match.",
        "error"
      );

      return;
    }


    passwordButton.disabled =
      true;

    passwordButton.textContent =
      "Saving Password...";


    try {

      const {
        error
      } =
        await supabaseClient
          .auth
          .updateUser({
            password: password
          });


      if (error) {
        throw error;
      }


      showMessage(
        "Password created successfully.",
        "success"
      );


      await supabaseClient
        .auth
        .signOut();


      setTimeout(
        function () {

          window.location.href =
            "login.html";

        },
        1200
      );

    }

    catch (error) {

      console.error(
        "Password update error:",
        error
      );


      showMessage(
        error.message ||
        "Password could not be saved.",
        "error"
      );


      passwordButton.disabled =
        false;

      passwordButton.textContent =
        "Set Password";

    }

  }
);


/* =========================================================
   START
========================================================= */

passwordButton.disabled = true;

checkInvitation();