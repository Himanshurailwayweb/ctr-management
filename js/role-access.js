/* =========================================================
   CTR MANAGEMENT SYSTEM
   COMMON ROLE ACCESS CONTROLLER

   PURPOSE:
   ---------------------------------------------------------
   This file controls frontend visibility and convenience.

   REAL SECURITY is still enforced by:
   - Supabase Authentication
   - Supabase Row Level Security
   - Secure Database RPC functions
========================================================= */


/* =========================================================
   ACCESS STATE
========================================================= */

window.ctrAccess = {

  ready: false,

  user: null,

  profile: null,

  roles: [],


  /* -------------------------------------------------------
     CHECK ONE ACTIVE ROLE
  ------------------------------------------------------- */

  hasRole(roleCode) {

    return this.roles.some(
      function (role) {

        return (
          role.role_code === roleCode &&
          role.is_active === true
        );

      }
    );

  },


  /* -------------------------------------------------------
     CHECK MULTIPLE ROLES
  ------------------------------------------------------- */

  hasAnyRole(roleCodes) {

    if (
      !Array.isArray(roleCodes) ||
      roleCodes.length === 0
    ) {

      return false;

    }


    return roleCodes.some(
      function (roleCode) {

        return window.ctrAccess.hasRole(
          roleCode
        );

      }
    );

  },


  /* -------------------------------------------------------
     SYSTEM ADMIN
  ------------------------------------------------------- */

  isSystemAdmin() {

    return this.roles.some(
      function (role) {

        return (

          role.role_code ===
            "SYSTEM_ADMIN" &&

          role.is_active ===
            true &&

          !role.station_id &&

          !role.division_id

        );

      }
    );

  },


  /* -------------------------------------------------------
     DIVISION ROLE ACCESS
  ------------------------------------------------------- */

  hasDivisionRole(
    divisionId,
    allowedRoles = null
  ) {

    return this.roles.some(
      function (role) {

        if (
          role.is_active !==
          true
        ) {

          return false;

        }


        if (
          role.division_id !==
          divisionId
        ) {

          return false;

        }


        if (
          role.station_id
        ) {

          return false;

        }


        if (
          Array.isArray(
            allowedRoles
          ) &&
          !allowedRoles.includes(
            role.role_code
          )
        ) {

          return false;

        }


        return true;

      }
    );

  },


  /* -------------------------------------------------------
     STATION ROLE ACCESS
  ------------------------------------------------------- */

  hasStationRole(
    stationId,
    allowedRoles = null
  ) {

    return this.roles.some(
      function (role) {

        if (
          role.is_active !==
          true
        ) {

          return false;

        }


        if (
          role.station_id !==
          stationId
        ) {

          return false;

        }


        if (
          Array.isArray(
            allowedRoles
          ) &&
          !allowedRoles.includes(
            role.role_code
          )
        ) {

          return false;

        }


        return true;

      }
    );

  },


  /* -------------------------------------------------------
     GET ACTIVE ROLE CODES
  ------------------------------------------------------- */

  getRoleCodes() {

    return this.roles
      .filter(
        function (role) {

          return role.is_active === true;

        }
      )
      .map(
        function (role) {

          return role.role_code;

        }
      );

  }

};


/* =========================================================
   LOAD CURRENT USER ACCESS
========================================================= */

async function loadCtrRoleAccess() {

  try {

    /* -----------------------------------------------------
       AUTHENTICATED USER
    ----------------------------------------------------- */

    const {
      data:
        authData,

      error:
        authError
    } =
      await supabaseClient
        .auth
        .getUser();


    if (
      authError ||
      !authData.user
    ) {

      console.warn(
        "CTR access could not load because no authenticated user was found."
      );


      return false;

    }


    window.ctrAccess.user =
      authData.user;


    /* -----------------------------------------------------
       LOAD CURRENT USER PROFILE
       AND CURRENT USER ACTIVE ROLES
    ----------------------------------------------------- */

    const [
      profileResult,
      rolesResult
    ] =
      await Promise.all([

        supabaseClient
          .from(
            "user_profiles"
          )
          .select(
            `
              id,
              full_name,
              employee_number,
              designation,
              phone,
              is_active
            `
          )
          .eq(
            "id",
            authData.user.id
          )
          .maybeSingle(),


        supabaseClient
          .from(
            "user_roles"
          )
          .select(
            `
              id,
              role_code,
              station_id,
              division_id,
              is_active
            `
          )
          .eq(
            "user_id",
            authData.user.id
          )
          .eq(
            "is_active",
            true
          )

      ]);


    if (
      profileResult.error
    ) {

      throw profileResult.error;

    }


    if (
      rolesResult.error
    ) {

      throw rolesResult.error;

    }


    window.ctrAccess.profile =
      profileResult.data ||
      null;


    window.ctrAccess.roles =
      rolesResult.data ||
      [];


    window.ctrAccess.ready =
      true;


    /* -----------------------------------------------------
       APPLY COMMON UI RULES
    ----------------------------------------------------- */

    applyCtrRoleVisibility();


    updateCurrentUserDisplay();


    /* -----------------------------------------------------
       ANNOUNCE ACCESS READY

       Other page scripts can listen for:
       window.addEventListener("ctr-access-ready", ...)
    ----------------------------------------------------- */

    window.dispatchEvent(
      new CustomEvent(
        "ctr-access-ready",
        {
          detail:
            window.ctrAccess
        }
      )
    );


    console.log(
      "CTR access loaded:",
      window.ctrAccess
    );


    return true;

  }

  catch (error) {

    console.error(
      "CTR role access load error:",
      error
    );


    return false;

  }

}


/* =========================================================
   COMMON ROLE-BASED VISIBILITY
========================================================= */

function applyCtrRoleVisibility() {

  const access =
    window.ctrAccess;


  /* =======================================================
     SYSTEM ADMIN ONLY ELEMENTS

     HTML example:
     data-system-admin-only
  ======================================================= */

  document
    .querySelectorAll(
      "[data-system-admin-only]"
    )
    .forEach(
      function (element) {

        element.hidden =
          !access.isSystemAdmin();

      }
    );


  /* =======================================================
     ANY SPECIFIED ROLE

     HTML example:
     data-role-any="REVIEW_OFFICER,APPROVING_OFFICER"

     SYSTEM_ADMIN is allowed automatically.
  ======================================================= */

  document
    .querySelectorAll(
      "[data-role-any]"
    )
    .forEach(
      function (element) {

        const requiredRoles =
          String(
            element.dataset.roleAny ||
            ""
          )
            .split(",")
            .map(
              function (role) {

                return role.trim();

              }
            )
            .filter(Boolean);


        element.hidden =
          !access.isSystemAdmin() &&
          !access.hasAnyRole(
            requiredRoles
          );

      }
    );


  /* =======================================================
     ADMINISTRATION NAVIGATION

     Only SYSTEM_ADMIN should see Administration.
  ======================================================= */

  document
    .querySelectorAll(
      'a[href="administration.html"]'
    )
    .forEach(
      function (element) {

        element.hidden =
          !access.isSystemAdmin();

      }
    );


  /* =======================================================
     SYSTEM ADMIN CLASS SUPPORT

     Optional HTML:
     class="system-admin-only"
  ======================================================= */

  document
    .querySelectorAll(
      ".system-admin-only"
    )
    .forEach(
      function (element) {

        element.hidden =
          !access.isSystemAdmin();

      }
    );

}


/* =========================================================
   CURRENT USER DISPLAY
========================================================= */

function updateCurrentUserDisplay() {

  const profile =
    window.ctrAccess.profile;


  const name =
    profile?.full_name ||
    "Railway User";


  const designation =
    profile?.designation ||
    "Authorized User";


  const employeeNumber =
    profile?.employee_number ||
    "";


  /* -------------------------------------------------------
     USER NAME
  ------------------------------------------------------- */

  document
    .querySelectorAll(
      "[data-current-user-name]"
    )
    .forEach(
      function (element) {

        element.textContent =
          name;

      }
    );


  /* -------------------------------------------------------
     DESIGNATION
  ------------------------------------------------------- */

  document
    .querySelectorAll(
      "[data-current-user-designation]"
    )
    .forEach(
      function (element) {

        element.textContent =
          designation;

      }
    );


  /* -------------------------------------------------------
     EMPLOYEE NUMBER
  ------------------------------------------------------- */

  document
    .querySelectorAll(
      "[data-current-user-employee-number]"
    )
    .forEach(
      function (element) {

        element.textContent =
          employeeNumber;

      }
    );

}


/* =========================================================
   OPTIONAL HELPER:
   SHOW OR HIDE AN ELEMENT MANUALLY
========================================================= */

function setCtrElementVisible(
  element,
  visible
) {

  if (!element) {

    return;

  }


  element.hidden =
    !visible;

}


/* =========================================================
   OPTIONAL HELPER:
   REQUIRE SYSTEM ADMIN FOR A PAGE
========================================================= */

function requireCtrSystemAdmin() {

  if (
    !window.ctrAccess.ready
  ) {

    return false;

  }


  if (
    window.ctrAccess.isSystemAdmin()
  ) {

    return true;

  }


  window.location.replace(
    "index.html"
  );


  return false;

}


/* =========================================================
   OPTIONAL HELPER:
   REQUIRE ANY ROLE
========================================================= */

function requireCtrAnyRole(
  allowedRoles
) {

  if (
    !window.ctrAccess.ready
  ) {

    return false;

  }


  if (
    window.ctrAccess.isSystemAdmin()
  ) {

    return true;

  }


  if (
    window.ctrAccess.hasAnyRole(
      allowedRoles
    )
  ) {

    return true;

  }


  window.location.replace(
    "index.html"
  );


  return false;

}


/* =========================================================
   START ROLE ACCESS SYSTEM
========================================================= */

loadCtrRoleAccess();