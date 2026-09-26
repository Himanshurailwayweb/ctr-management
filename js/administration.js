/* =========================================================
   CTR MANAGEMENT SYSTEM
   ADMINISTRATION / USER & ROLE MANAGEMENT

   IMPORTANT SECURITY PRINCIPLE
   ---------------------------------------------------------
   Frontend controls are only UI convenience.

   Actual authorization remains enforced by:
   - Supabase Authentication
   - PostgreSQL Row Level Security
   - Secure database RPC functions

   SYSTEM_ADMIN is the only role allowed to use this page.
========================================================= */


/* =========================================================
   DOM REFERENCES
========================================================= */

const roleUser =
  document.getElementById(
    "roleUser"
  );

const roleCode =
  document.getElementById(
    "roleCode"
  );

const roleScopeType =
  document.getElementById(
    "roleScopeType"
  );

const roleDivisionField =
  document.getElementById(
    "roleDivisionField"
  );

const roleDivision =
  document.getElementById(
    "roleDivision"
  );

const roleStationField =
  document.getElementById(
    "roleStationField"
  );

const roleStation =
  document.getElementById(
    "roleStation"
  );

const roleMessage =
  document.getElementById(
    "roleMessage"
  );

const clearRoleFormButton =
  document.getElementById(
    "clearRoleForm"
  );

const assignRoleButton =
  document.getElementById(
    "assignRole"
  );

const userSearch =
  document.getElementById(
    "userSearch"
  );

const userCount =
  document.getElementById(
    "userCount"
  );

const userList =
  document.getElementById(
    "userList"
  );

const usersEmptyState =
  document.getElementById(
    "usersEmptyState"
  );


/* =========================================================
   STATE
========================================================= */

let administrationProfiles = [];

let administrationDivisions = [];

let administrationStations = [];

let administrationRoles = [];

let administrationStarted = false;


/* =========================================================
   ROLE DEFINITIONS
========================================================= */

const ROLE_LABELS = {

  SYSTEM_ADMIN:
    "System Admin",

  STATION_USER:
    "Station User",

  EMPLOYEE:
    "Employee",

  REVIEW_OFFICER:
    "Review Officer",

  APPROVING_OFFICER:
    "Approving Officer",

  FINAL_SIGNATORY:
    "Final Signatory",

  CORRECTION_AUTHORITY:
    "Correction Authority",

  VIEWER:
    "Viewer"

};


const GLOBAL_ONLY_ROLES = [
  "SYSTEM_ADMIN"
];


const STATION_ONLY_ROLES = [
  "STATION_USER",
  "EMPLOYEE"
];


const DIVISION_OR_STATION_ROLES = [
  "REVIEW_OFFICER",
  "APPROVING_OFFICER",
  "FINAL_SIGNATORY",
  "CORRECTION_AUTHORITY",
  "VIEWER"
];


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =========================================================
   MESSAGE
========================================================= */

function showRoleMessage(
  message,
  type = ""
) {

  if (!roleMessage) {
    return;
  }


  roleMessage.textContent =
    message || "";


  roleMessage.style.fontSize =
    "13px";

  roleMessage.style.fontWeight =
    "600";


  if (
    type ===
    "success"
  ) {

    roleMessage.style.color =
      "#15803d";

  }

  else if (
    type ===
    "error"
  ) {

    roleMessage.style.color =
      "#b42318";

  }

  else {

    roleMessage.style.color =
      "#52697f";

  }

}


/* =========================================================
   PROFILE DISPLAY NAME
========================================================= */

function getProfileDisplayName(
  profile
) {

  const fullName =
    String(
      profile?.full_name ||
      ""
    )
      .trim();


  if (fullName) {
    return fullName;
  }


  const employeeNumber =
    String(
      profile?.employee_number ||
      ""
    )
      .trim();


  if (employeeNumber) {

    return (
      "Employee " +
      employeeNumber
    );

  }


  const designation =
    String(
      profile?.designation ||
      ""
    )
      .trim();


  if (designation) {
    return designation;
  }


  const shortId =
    String(
      profile?.id ||
      ""
    )
      .slice(
        0,
        8
      );


  return shortId
    ? `User ${shortId}`
    : "Railway User";

}


/* =========================================================
   ROLE LABEL
========================================================= */

function getRoleLabel(
  roleCodeValue
) {

  return (
    ROLE_LABELS[
      roleCodeValue
    ] ||
    roleCodeValue ||
    "-"
  );

}


/* =========================================================
   DIVISION NAME
========================================================= */

function getDivisionName(
  divisionId
) {

  if (!divisionId) {
    return "";
  }


  const division =
    administrationDivisions
      .find(
        function (item) {

          return (
            item.id ===
            divisionId
          );

        }
      );


  return (
    division?.division_name ||
    ""
  );

}


/* =========================================================
   STATION NAME
========================================================= */

function getStationName(
  stationId
) {

  if (!stationId) {
    return "";
  }


  const station =
    administrationStations
      .find(
        function (item) {

          return (
            item.id ===
            stationId
          );

        }
      );


  if (!station) {
    return "";
  }


  const stationCode =
    station.station_code
      ? ` (${station.station_code})`
      : "";


  return (
    `${station.station_name}${stationCode}`
  );

}


/* =========================================================
   WAIT FOR ROLE-ACCESS.JS
========================================================= */

function waitForCtrAccess(
  timeoutMs = 10000
) {

  return new Promise(
    function (resolve) {

      const startTime =
        Date.now();


      function checkAccess() {

        if (
          window.ctrAccess &&
          window.ctrAccess.ready
        ) {

          resolve(
            true
          );

          return;
        }


        if (
          Date.now() -
          startTime >=
          timeoutMs
        ) {

          resolve(
            false
          );

          return;
        }


        setTimeout(
          checkAccess,
          100
        );

      }


      checkAccess();

    }
  );

}


/* =========================================================
   SYSTEM ADMIN CHECK
========================================================= */

function isCurrentUserSystemAdmin() {

  return Boolean(
    window.ctrAccess &&
    window.ctrAccess.ready &&
    window.ctrAccess
      .isSystemAdmin?.()
  );

}


/* =========================================================
   LOAD USER PROFILES
========================================================= */

async function loadUserProfiles() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "user_profiles"
      )
      .select(
        `
          id,
          full_name,
          employee_number,
          phone,
          designation,
          is_active
        `
      );


  if (error) {
    throw error;
  }


  administrationProfiles =
    (data || [])
      .sort(
        function (
          first,
          second
        ) {

          return (
            getProfileDisplayName(
              first
            )
              .localeCompare(
                getProfileDisplayName(
                  second
                )
              )
          );

        }
      );

}


/* =========================================================
   LOAD DIVISIONS
========================================================= */

async function loadAdministrationDivisions() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "divisions"
      )
      .select(
        `
          id,
          division_name,
          division_code,
          zone_name,
          display_order,
          is_active
        `
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "display_order",
        {
          ascending:
            true
        }
      )
      .order(
        "division_name",
        {
          ascending:
            true
        }
      );


  if (error) {
    throw error;
  }


  administrationDivisions =
    data || [];

}


/* =========================================================
   LOAD STATIONS
========================================================= */

async function loadAdministrationStations() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "stations"
      )
      .select(
        `
          id,
          station_name,
          station_code,
          division_id,
          is_active
        `
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "station_name",
        {
          ascending:
            true
        }
      );


  if (error) {
    throw error;
  }


  administrationStations =
    data || [];

}


/* =========================================================
   LOAD ACTIVE USER ROLES
========================================================= */

async function loadAdministrationRoles() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "user_roles"
      )
      .select(
        `
          id,
          user_id,
          role_code,
          division_id,
          station_id,
          is_active
        `
      )
      .eq(
        "is_active",
        true
      );


  if (error) {
    throw error;
  }


  administrationRoles =
    data || [];

}


/* =========================================================
   POPULATE USER SELECT
========================================================= */

function populateUserSelect() {

  if (!roleUser) {
    return;
  }


  const oldValue =
    roleUser.value;


  roleUser.innerHTML = `
    <option value="">
      Select User
    </option>
  `;


  administrationProfiles
    .filter(
      function (profile) {

        return (
          profile.is_active !==
          false
        );

      }
    )
    .forEach(
      function (profile) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          profile.id;


        const designation =
          String(
            profile.designation ||
            ""
          )
            .trim();


        option.textContent =
          designation
            ? `${getProfileDisplayName(
                profile
              )} — ${designation}`
            : getProfileDisplayName(
                profile
              );


        roleUser.appendChild(
          option
        );

      }
    );


  if (
    administrationProfiles
      .some(
        function (profile) {

          return (
            profile.id ===
            oldValue
          );

        }
      )
  ) {

    roleUser.value =
      oldValue;

  }

}


/* =========================================================
   POPULATE DIVISION SELECT
========================================================= */

function populateDivisionSelect() {

  if (!roleDivision) {
    return;
  }


  const oldValue =
    roleDivision.value;


  roleDivision.innerHTML = `
    <option value="">
      Select Division
    </option>
  `;


  administrationDivisions
    .forEach(
      function (division) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          division.id;


        option.textContent =
          division.division_code
            ? `${division.division_name} (${division.division_code})`
            : division.division_name;


        roleDivision.appendChild(
          option
        );

      }
    );


  if (
    administrationDivisions
      .some(
        function (division) {

          return (
            division.id ===
            oldValue
          );

        }
      )
  ) {

    roleDivision.value =
      oldValue;

  }

}


/* =========================================================
   POPULATE STATION SELECT
========================================================= */

function populateStationSelect() {

  if (!roleStation) {
    return;
  }


  const selectedDivisionId =
    roleDivision
      ? roleDivision.value
      : "";


  const previousValue =
    roleStation.value;


  roleStation.innerHTML = `
    <option value="">
      ${
        selectedDivisionId
          ? "Select Station"
          : "Select Division First"
      }
    </option>
  `;


  if (!selectedDivisionId) {

    roleStation.disabled =
      true;

    return;

  }


  const filteredStations =
    administrationStations
      .filter(
        function (station) {

          return (
            station.division_id ===
            selectedDivisionId
          );

        }
      );


  filteredStations
    .forEach(
      function (station) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          station.id;


        option.textContent =
          station.station_code
            ? `${station.station_name} (${station.station_code})`
            : station.station_name;


        roleStation.appendChild(
          option
        );

      }
    );


  roleStation.disabled =
    false;


  if (
    filteredStations
      .some(
        function (station) {

          return (
            station.id ===
            previousValue
          );

        }
      )
  ) {

    roleStation.value =
      previousValue;

  }

}


/* =========================================================
   CONFIGURE SCOPE OPTIONS
========================================================= */

function configureScopeOptions() {

  if (
    !roleCode ||
    !roleScopeType
  ) {

    return;
  }


  const selectedRole =
    roleCode.value;


  let allowedScopes =
    [];


  if (
    GLOBAL_ONLY_ROLES
      .includes(
        selectedRole
      )
  ) {

    allowedScopes = [
      "GLOBAL"
    ];

  }

  else if (
    STATION_ONLY_ROLES
      .includes(
        selectedRole
      )
  ) {

    allowedScopes = [
      "STATION"
    ];

  }

  else if (
    DIVISION_OR_STATION_ROLES
      .includes(
        selectedRole
      )
  ) {

    allowedScopes = [
      "DIVISION",
      "STATION"
    ];

  }


  Array
    .from(
      roleScopeType.options
    )
    .forEach(
      function (option) {

        if (
          option.value ===
          ""
        ) {

          option.disabled =
            false;

          return;
        }


        option.disabled =
          !allowedScopes
            .includes(
              option.value
            );

      }
    );


  if (
    allowedScopes.length ===
    1
  ) {

    roleScopeType.value =
      allowedScopes[0];

  }

  else if (
    !allowedScopes
      .includes(
        roleScopeType.value
      )
  ) {

    roleScopeType.value =
      "";

  }


  updateScopeFields();

}


/* =========================================================
   UPDATE SCOPE FIELDS
========================================================= */

function updateScopeFields() {

  const scope =
    roleScopeType
      ? roleScopeType.value
      : "";


  /* -------------------------------------------------------
     DIVISION FIELD
  ------------------------------------------------------- */

  if (roleDivisionField) {

    roleDivisionField.hidden =
      (
        scope !==
        "DIVISION" &&
        scope !==
        "STATION"
      );

  }


  if (roleDivision) {

    roleDivision.disabled =
      (
        scope !==
        "DIVISION" &&
        scope !==
        "STATION"
      );


    if (
      scope !==
      "DIVISION" &&
      scope !==
      "STATION"
    ) {

      roleDivision.value =
        "";

    }

  }


  /* -------------------------------------------------------
     STATION FIELD
  ------------------------------------------------------- */

  if (roleStationField) {

    roleStationField.hidden =
      (
        scope !==
        "STATION"
      );

  }


  if (roleStation) {

    if (
      scope !==
      "STATION"
    ) {

      roleStation.value =
        "";

      roleStation.disabled =
        true;

    }

  }


  if (
    scope ===
    "STATION"
  ) {

    populateStationSelect();

  }

}


/* =========================================================
   RESET ROLE FORM
========================================================= */

function clearRoleForm() {

  if (roleUser) {
    roleUser.value = "";
  }


  if (roleCode) {
    roleCode.value = "";
  }


  if (roleScopeType) {
    roleScopeType.value = "";
  }


  if (roleDivision) {
    roleDivision.value = "";
  }


  if (roleStation) {

    roleStation.innerHTML = `
      <option value="">
        Select Division First
      </option>
    `;

    roleStation.value = "";

    roleStation.disabled =
      true;

  }


  configureScopeOptions();

  showRoleMessage(
    ""
  );

}


/* =========================================================
   VALIDATE ROLE FORM
========================================================= */

function validateRoleAssignment() {

  const selectedUserId =
    roleUser
      ? roleUser.value
      : "";

  const selectedRole =
    roleCode
      ? roleCode.value
      : "";

  const selectedScope =
    roleScopeType
      ? roleScopeType.value
      : "";

  const selectedDivision =
    roleDivision
      ? roleDivision.value
      : "";

  const selectedStation =
    roleStation
      ? roleStation.value
      : "";


  if (!selectedUserId) {

    throw new Error(
      "Please select a user."
    );

  }


  if (!selectedRole) {

    throw new Error(
      "Please select a role."
    );

  }


  if (!selectedScope) {

    throw new Error(
      "Please select an access scope."
    );

  }


  if (
    selectedRole ===
    "SYSTEM_ADMIN" &&
    selectedScope !==
    "GLOBAL"
  ) {

    throw new Error(
      "System Admin must use Global scope."
    );

  }


  if (
    STATION_ONLY_ROLES
      .includes(
        selectedRole
      ) &&
    selectedScope !==
    "STATION"
  ) {

    throw new Error(
      `${getRoleLabel(
        selectedRole
      )} must use Station scope.`
    );

  }


  if (
    DIVISION_OR_STATION_ROLES
      .includes(
        selectedRole
      ) &&
    ![
      "DIVISION",
      "STATION"
    ]
      .includes(
        selectedScope
      )
  ) {

    throw new Error(
      `${getRoleLabel(
        selectedRole
      )} must use Division or Station scope.`
    );

  }


  if (
    selectedScope ===
    "DIVISION" &&
    !selectedDivision
  ) {

    throw new Error(
      "Please select a division."
    );

  }


  if (
    selectedScope ===
    "STATION"
  ) {

    if (!selectedDivision) {

      throw new Error(
        "Please select a division first."
      );

    }


    if (!selectedStation) {

      throw new Error(
        "Please select a station."
      );

    }


    const station =
      administrationStations
        .find(
          function (item) {

            return (
              item.id ===
              selectedStation
            );

          }
        );


    if (
      !station ||
      station.division_id !==
      selectedDivision
    ) {

      throw new Error(
        "Selected station does not belong to the selected division."
      );

    }

  }


  return {

    userId:
      selectedUserId,

    roleCode:
      selectedRole,

    scope:
      selectedScope,

    /*
      IMPORTANT:
      A role is either global, division-scoped
      OR station-scoped.

      For station scope we use station_id only.
      division_id is kept null in user_roles so
      we do not create two scopes at the same time.
    */

    divisionId:
      selectedScope ===
      "DIVISION"
        ? selectedDivision
        : null,

    stationId:
      selectedScope ===
      "STATION"
        ? selectedStation
        : null

  };

}


/* =========================================================
   ASSIGN ROLE
   SECURE DATABASE RPC
========================================================= */

async function assignUserRole() {

  if (
    !isCurrentUserSystemAdmin()
  ) {

    showRoleMessage(
      "System Admin permission required for this action.",
      "error"
    );

    return;

  }


  let assignment;


  try {

    assignment =
      validateRoleAssignment();

  }

  catch (error) {

    showRoleMessage(
      error.message,
      "error"
    );

    return;

  }


  if (assignRoleButton) {

    assignRoleButton.disabled =
      true;

    assignRoleButton.textContent =
      "Assigning...";

  }


  showRoleMessage(
    "Assigning role...",
    ""
  );


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .rpc(
          "admin_assign_user_role",
          {

            p_user_id:
              assignment.userId,

            p_role_code:
              assignment.roleCode,

            p_station_id:
              assignment.stationId,

            p_division_id:
              assignment.divisionId

          }
        );


    if (error) {
      throw error;
    }


    if (
      data &&
      typeof data ===
      "object" &&
      data.success ===
      false
    ) {

      throw new Error(
        data.message ||
        "Role could not be assigned."
      );

    }


    showRoleMessage(
      "Role assigned successfully.",
      "success"
    );


    await loadAdministrationRoles();

    renderUsers();


    /*
      Keep selected user visible so another role
      can be assigned if required.
    */

    if (roleCode) {
      roleCode.value = "";
    }


    if (roleScopeType) {
      roleScopeType.value = "";
    }


    if (roleDivision) {
      roleDivision.value = "";
    }


    if (roleStation) {

      roleStation.value = "";

      roleStation.innerHTML = `
        <option value="">
          Select Division First
        </option>
      `;

    }


    configureScopeOptions();

  }

  catch (error) {

    console.error(
      "Assign role error:",
      error
    );


    showRoleMessage(
      error.message ||
      "Role could not be assigned.",
      "error"
    );

  }

  finally {

    if (assignRoleButton) {

      assignRoleButton.disabled =
        false;

      assignRoleButton.textContent =
        "Assign Role";

    }

  }

}


/* =========================================================
   DEACTIVATE ROLE
   SECURE DATABASE RPC
========================================================= */

async function deactivateUserRole(
  roleId
) {

  if (
    !isCurrentUserSystemAdmin()
  ) {

    alert(
      "System Admin permission required for this action."
    );

    return;

  }


  const role =
    administrationRoles
      .find(
        function (item) {

          return (
            String(
              item.id
            ) ===
            String(
              roleId
            )
          );

        }
      );


  if (!role) {
    return;
  }


  const profile =
    administrationProfiles
      .find(
        function (item) {

          return (
            item.id ===
            role.user_id
          );

        }
      );


  const userName =
    profile
      ? getProfileDisplayName(
          profile
        )
      : "this user";


  const confirmed =
    confirm(
      `Deactivate ${getRoleLabel(
        role.role_code
      )} role for ${userName}?`
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .rpc(
          "admin_deactivate_user_role",
          {

            p_role_id:
              String(
                roleId
              )

          }
        );


    if (error) {
      throw error;
    }


    if (
      data &&
      typeof data ===
      "object" &&
      data.success ===
      false
    ) {

      throw new Error(
        data.message ||
        "Role could not be deactivated."
      );

    }


    await loadAdministrationRoles();

    renderUsers();


    showRoleMessage(
      "Role deactivated successfully.",
      "success"
    );

  }

  catch (error) {

    console.error(
      "Deactivate role error:",
      error
    );


    alert(
      error.message ||
      "Role could not be deactivated."
    );

  }

}


/* =========================================================
   ROLE SCOPE DESCRIPTION
========================================================= */

function getRoleScopeText(
  role
) {

  if (
    role.station_id
  ) {

    return (
      "Station: " +
      (
        getStationName(
          role.station_id
        ) ||
        "Assigned Station"
      )
    );

  }


  if (
    role.division_id
  ) {

    return (
      "Division: " +
      (
        getDivisionName(
          role.division_id
        ) ||
        "Assigned Division"
      )
    );

  }


  if (
    role.role_code ===
    "SYSTEM_ADMIN"
  ) {

    return "Global Access";

  }


  return "Scope Not Available";

}


/* =========================================================
   RENDER USER DIRECTORY
========================================================= */

function renderUsers() {

  if (
    !userList
  ) {

    return;
  }


  const searchValue =
    userSearch
      ? userSearch.value
          .trim()
          .toLowerCase()
      : "";


  const filteredProfiles =
    administrationProfiles
      .filter(
        function (profile) {

          const searchableText =
            `
              ${profile.full_name || ""}
              ${profile.employee_number || ""}
              ${profile.phone || ""}
              ${profile.designation || ""}
              ${profile.id || ""}
            `
              .toLowerCase();


          return (
            searchableText
              .includes(
                searchValue
              )
          );

        }
      );


  userList.innerHTML =
    "";


  if (userCount) {

    userCount.textContent =
      `${filteredProfiles.length} ${
        filteredProfiles.length ===
        1
          ? "User"
          : "Users"
      }`;

  }


  if (
    filteredProfiles.length ===
    0
  ) {

    usersEmptyState
      ?.classList
      .add(
        "show"
      );

    return;

  }


  usersEmptyState
    ?.classList
    .remove(
      "show"
    );


  filteredProfiles
    .forEach(
      function (profile) {

        const roles =
          administrationRoles
            .filter(
              function (role) {

                return (
                  role.user_id ===
                  profile.id &&
                  role.is_active !==
                  false
                );

              }
            );


        const article =
          document.createElement(
            "article"
          );


        article.className =
          "station-management-card";


        const profileStatus =
          profile.is_active ===
          false
            ? "INACTIVE"
            : "ACTIVE";


        const roleMarkup =
          roles.length > 0

            ? roles
                .map(
                  function (role) {

                    return `
                      <div
                        style="
                          border: 1px solid #d3dde7;
                          background: #f7f9fb;
                          padding: 10px 12px;
                          margin-top: 8px;
                          display: flex;
                          align-items: center;
                          justify-content: space-between;
                          gap: 12px;
                          flex-wrap: wrap;
                        "
                      >

                        <div>

                          <strong>
                            ${escapeHtml(
                              getRoleLabel(
                                role.role_code
                              )
                            )}
                          </strong>

                          <div
                            style="
                              margin-top: 4px;
                              font-size: 12px;
                              color: #5c7084;
                            "
                          >
                            ${escapeHtml(
                              getRoleScopeText(
                                role
                              )
                            )}
                          </div>

                        </div>


                        <button
                          type="button"
                          class="remove-rack-btn"
                          data-deactivate-role="${escapeHtml(
                            role.id
                          )}"
                        >
                          Deactivate Role
                        </button>

                      </div>
                    `;

                  }
                )
                .join(
                  ""
                )

            : `
                <div
                  style="
                    margin-top: 8px;
                    padding: 10px 12px;
                    border: 1px dashed #c9d4df;
                    color: #65788b;
                    font-size: 12px;
                  "
                >
                  No active role assigned
                </div>
              `;


        article.innerHTML = `

          <div class="station-card-top">

            <div>

              <span>
                RAILWAY USER
              </span>

              <h3>
                ${escapeHtml(
                  getProfileDisplayName(
                    profile
                  )
                )}
              </h3>

            </div>


            <span class="station-status-badge">
              ${escapeHtml(
                profileStatus
              )}
            </span>

          </div>


          <div class="station-card-details">

            <div>

              <span>
                Employee Number
              </span>

              <strong>
                ${escapeHtml(
                  profile.employee_number ||
                  "-"
                )}
              </strong>

            </div>


            <div>

              <span>
                Designation
              </span>

              <strong>
                ${escapeHtml(
                  profile.designation ||
                  "-"
                )}
              </strong>

            </div>


            <div>

              <span>
                Phone
              </span>

              <strong>
                ${escapeHtml(
                  profile.phone ||
                  "-"
                )}
              </strong>

            </div>


            <div>

              <span>
                Active Roles
              </span>

              <strong>
                ${roles.length}
              </strong>

            </div>

          </div>


          <div
            style="
              padding: 12px 16px 16px;
              border-top: 1px solid #d8e0e8;
            "
          >

            <div
              style="
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.8px;
                color: #42688e;
              "
            >
              ASSIGNED ACCESS
            </div>

            ${roleMarkup}

          </div>

        `;


        userList.appendChild(
          article
        );

      }
    );

}


/* =========================================================
   LOAD ALL ADMINISTRATION DATA
========================================================= */

async function loadAdministrationData() {

  await Promise.all([

    loadUserProfiles(),

    loadAdministrationDivisions(),

    loadAdministrationStations(),

    loadAdministrationRoles()

  ]);


  populateUserSelect();

  populateDivisionSelect();

  configureScopeOptions();

  renderUsers();

}


/* =========================================================
   ROLE FORM EVENTS
========================================================= */

roleCode
  ?.addEventListener(
    "change",
    function () {

      configureScopeOptions();

      showRoleMessage(
        ""
      );

    }
  );


roleScopeType
  ?.addEventListener(
    "change",
    function () {

      updateScopeFields();

      showRoleMessage(
        ""
      );

    }
  );


roleDivision
  ?.addEventListener(
    "change",
    function () {

      if (
        roleScopeType?.value ===
        "STATION"
      ) {

        populateStationSelect();

      }

    }
  );


clearRoleFormButton
  ?.addEventListener(
    "click",
    clearRoleForm
  );


assignRoleButton
  ?.addEventListener(
    "click",
    assignUserRole
  );


userSearch
  ?.addEventListener(
    "input",
    renderUsers
  );


/* =========================================================
   USER LIST ACTIONS
========================================================= */

userList
  ?.addEventListener(
    "click",
    function (event) {

      const deactivateButton =
        event.target.closest(
          "[data-deactivate-role]"
        );


      if (!deactivateButton) {
        return;
      }


      deactivateUserRole(
        deactivateButton.dataset
          .deactivateRole
      );

    }
  );


/* =========================================================
   INITIALIZE ADMINISTRATION
========================================================= */

async function initializeAdministration() {

  if (
    administrationStarted
  ) {

    return;

  }


  administrationStarted =
    true;


  showRoleMessage(
    "Loading administration data...",
    ""
  );


  try {

    const accessReady =
      await waitForCtrAccess();


    if (!accessReady) {

      throw new Error(
        "User permission information could not be loaded."
      );

    }


    if (
      !isCurrentUserSystemAdmin()
    ) {

      alert(
        "System Admin permission is required to open Administration."
      );


      window.location.replace(
        "index.html"
      );


      return;

    }


    await loadAdministrationData();


    showRoleMessage(
      ""
    );


    console.log(
      "CTR Administration loaded:",
      {
        profiles:
          administrationProfiles.length,

        divisions:
          administrationDivisions.length,

        stations:
          administrationStations.length,

        activeRoles:
          administrationRoles.length
      }
    );

  }

  catch (error) {

    console.error(
      "Administration initialization error:",
      error
    );


    showRoleMessage(
      error.message ||
      "Administration data could not be loaded.",
      "error"
    );


    if (userList) {

      userList.innerHTML = `
        <div class="stations-empty-state show">

          <strong>
            Administration could not be loaded
          </strong>

          <p>
            ${escapeHtml(
              error.message ||
              "Database error."
            )}
          </p>

        </div>
      `;

    }

  }

}


/* =========================================================
   START
========================================================= */

initializeAdministration();