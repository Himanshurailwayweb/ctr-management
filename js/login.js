/* =========================================================
   CTR MANAGEMENT SYSTEM
   LOGIN + PASSWORD RECOVERY
========================================================= */


const loginForm =
  document.getElementById(
    "loginForm"
  );


const loginEmail =
  document.getElementById(
    "loginEmail"
  );


const loginPassword =
  document.getElementById(
    "loginPassword"
  );


const loginButton =
  document.getElementById(
    "loginButton"
  );


const loginMessage =
  document.getElementById(
    "loginMessage"
  );


const togglePassword =
  document.getElementById(
    "togglePassword"
  );


const forgotPasswordButton =
  document.getElementById(
    "forgotPasswordButton"
  );



/* =========================================================
   MESSAGE
========================================================= */

function showLoginMessage(
  message,
  type
) {

  if (!loginMessage) {
    return;
  }


  loginMessage.textContent =
    message || "";


  if (type === "error") {

    loginMessage.style.color =
      "#b91c1c";

  }

  else if (type === "success") {

    loginMessage.style.color =
      "#15803d";

  }

  else {

    loginMessage.style.color =
      "#66788a";

  }

}



/* =========================================================
   SHOW / HIDE PASSWORD
========================================================= */

togglePassword
  ?.addEventListener(
    "click",
    function () {

      const showingPassword =
        loginPassword.type ===
        "text";


      loginPassword.type =
        showingPassword
          ? "password"
          : "text";


      togglePassword.setAttribute(
        "aria-label",
        showingPassword
          ? "Show password"
          : "Hide password"
      );


      togglePassword.title =
        showingPassword
          ? "Show password"
          : "Hide password";


      /*
        Different symbol makes the
        current state obvious.
      */

      togglePassword.textContent =
        showingPassword
          ? "👁"
          : "◉";

    }
  );



/* =========================================================
   LOGIN
========================================================= */

loginForm
  ?.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const email =
        loginEmail.value
          .trim();


      const password =
        loginPassword.value;


      if (
        !email ||
        !password
      ) {

        showLoginMessage(
          "Please enter your email and password.",
          "error"
        );

        return;
      }


      loginButton.disabled =
        true;


      loginButton.textContent =
        "Signing In...";


      forgotPasswordButton.disabled =
        true;


      showLoginMessage(
        "Verifying authorized account...",
        ""
      );


      try {

        const {
          data,
          error
        } =
          await supabaseClient
            .auth
            .signInWithPassword({

              email:
                email,

              password:
                password

            });


        if (error) {
          throw error;
        }


        if (
          !data ||
          !data.session
        ) {

          throw new Error(
            "Login session could not be created."
          );

        }


        showLoginMessage(
          "Login successful. Opening CTR Management...",
          "success"
        );


        window.setTimeout(
          function () {

            window.location.href =
              "index.html";

          },
          650
        );

      }

      catch (error) {

        console.error(
          "CTR Login Error:",
          error
        );


        let message =
          error?.message ||
          "Unable to sign in.";


        /*
          Cleaner message for ordinary
          wrong-password situations.
        */

        if (
          String(message)
            .toLowerCase()
            .includes(
              "invalid login credentials"
            )
        ) {

          message =
            "Incorrect email or password.";

        }


        showLoginMessage(
          message,
          "error"
        );

      }

      finally {

        loginButton.disabled =
          false;


        loginButton.textContent =
          "Sign In";


        forgotPasswordButton.disabled =
          false;

      }

    }
  );



/* =========================================================
   PASSWORD RECOVERY
========================================================= */

forgotPasswordButton
  ?.addEventListener(
    "click",
    async function () {

      const email =
        loginEmail.value
          .trim();


      if (!email) {

        showLoginMessage(
          "Enter your registered email first, then click Forgot password.",
          "error"
        );


        loginEmail.focus();

        return;
      }


      forgotPasswordButton.disabled =
        true;


      loginButton.disabled =
        true;


      forgotPasswordButton.textContent =
        "Sending reset link...";


      showLoginMessage(
        "Requesting password reset...",
        ""
      );


      try {

        /*
          Works both on local development
          and GitHub Pages.

          Example production URL:
          /ctr-management/set-password.html
        */

        const redirectUrl =
          new URL(
            "set-password.html",
            window.location.href
          ).href;


        const {
          error
        } =
          await supabaseClient
            .auth
            .resetPasswordForEmail(
              email,
              {

                redirectTo:
                  redirectUrl

              }
            );


        if (error) {
          throw error;
        }


        showLoginMessage(
          "Password reset link sent. Please check your registered email.",
          "success"
        );

      }

      catch (error) {

        console.error(
          "CTR Password Recovery Error:",
          error
        );


        showLoginMessage(
          error?.message ||
          "Password reset link could not be sent.",
          "error"
        );

      }

      finally {

        forgotPasswordButton.disabled =
          false;


        loginButton.disabled =
          false;


        forgotPasswordButton.textContent =
          "Forgot password?";

      }

    }
  );



/* =========================================================
   CLEAR OLD ERROR WHEN USER TYPES AGAIN
========================================================= */

[
  loginEmail,
  loginPassword
]
  .forEach(
    function (input) {

      input
        ?.addEventListener(
          "input",
          function () {

            if (
              loginMessage
                ?.style
                ?.color ===
              "rgb(185, 28, 28)"
            ) {

              showLoginMessage(
                "",
                ""
              );

            }

          }
        );

    }
  );



/* =========================================================
   START
========================================================= */

loginEmail
  ?.focus();