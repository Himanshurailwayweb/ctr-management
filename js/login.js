/* =========================================================
   CTR LOGIN
========================================================= */

const loginForm =
  document.getElementById("loginForm");

const loginEmail =
  document.getElementById("loginEmail");

const loginPassword =
  document.getElementById("loginPassword");

const loginButton =
  document.getElementById("loginButton");

const loginMessage =
  document.getElementById("loginMessage");


/* =========================================================
   SHOW MESSAGE
========================================================= */

function showLoginMessage(message, type) {

  loginMessage.textContent = message;

  if (type === "error") {
    loginMessage.style.color = "#b91c1c";
  }

  else if (type === "success") {
    loginMessage.style.color = "#15803d";
  }

  else {
    loginMessage.style.color = "#66788a";
  }

}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    const email =
      loginEmail.value.trim();

    const password =
      loginPassword.value;


    if (!email || !password) {

      showLoginMessage(
        "Please enter email and password.",
        "error"
      );

      return;
    }


    loginButton.disabled = true;

    loginButton.textContent =
      "Signing In...";


    showLoginMessage(
      "Checking account...",
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
            email: email,
            password: password
          });


      if (error) {
        throw error;
      }


      if (!data.session) {

        throw new Error(
          "Login session could not be created."
        );

      }


      showLoginMessage(
        "Login successful.",
        "success"
      );


      setTimeout(
        function () {

          window.location.href =
            "index.html";

        },
        700
      );

    }

    catch (error) {

      console.error(
        "CTR Login Error:",
        error
      );


      showLoginMessage(
        error.message ||
        "Unable to sign in.",
        "error"
      );

    }

    finally {

      loginButton.disabled = false;

      loginButton.textContent =
        "Sign In";

    }

  }
);