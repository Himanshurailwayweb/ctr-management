/* =========================================================
   CTR MANAGEMENT SYSTEM
   APPROVAL ROUTE ADMINISTRATION

   DATABASE RPCs
   ---------------------------------------------------------
   admin_ctr_route_options()
   admin_list_ctr_approval_routes()
   admin_save_ctr_approval_route()

   IMPORTANT
   ---------------------------------------------------------
   - Actual CTR preparer / SSE is NOT configured here.
   - Actual submitting user later becomes workflow Step 1.
   - Administration configures review officers after SSE.
   - Exactly one Final Approval officer is always last.
   - Unlimited review officers can be added.
========================================================= */


(() => {

  "use strict";


  /* =====================================================
     ELEMENTS
  ===================================================== */

  const routeScopeType =
    document.getElementById(
      "routeScopeType"
    );

  const routeDivision =
    document.getElementById(
      "routeDivision"
    );

  const routeStation =
    document.getElementById(
      "routeStation"
    );

  const routeDivisionField =
    document.getElementById(
      "routeDivisionField"
    );

  const routeStationField =
    document.getElementById(
      "routeStationField"
    );

  const routeName =
    document.getElementById(
      "routeName"
    );

  const routeStepList =
    document.getElementById(
      "routeStepList"
    );

  const addReviewOfficer =
    document.getElementById(
      "addReviewOfficer"
    );

  const clearApprovalRoute =
    document.getElementById(
      "clearApprovalRoute"
    );

  const saveApprovalRoute =
    document.getElementById(
      "saveApprovalRoute"
    );

  const approvalRouteMessage =
    document.getElementById(
      "approvalRouteMessage"
    );

  const approvalRouteList =
    document.getElementById(
      "approvalRouteList"
    );


  /* =====================================================
     STATE
  ===================================================== */

  let routeOptions = {

    divisions: [],

    stations: [],

    review_officers: [],

    final_signatories: []

  };


  let existingRoutes = [];


  let routeSteps = [];


  let loading = false;


  /* =====================================================
     HELPERS
  ===================================================== */

  function escapeHtml(value) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }


    return String(value)

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


  function cleanText(value) {

    return String(
      value || ""
    ).trim();

  }


  function newStepId() {

    return `route-step-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;

  }


  /* =====================================================
     SUPABASE CLIENT
  ===================================================== */

  function getSupabaseClient() {

    try {

      if (
        typeof supabaseClient !== "undefined" &&
        supabaseClient &&
        typeof supabaseClient.rpc === "function"
      ) {

        return supabaseClient;

      }

    }

    catch (error) {

      console.warn(
        "Supabase client check:",
        error
      );

    }


    if (
      window.supabaseClient &&
      typeof window.supabaseClient.rpc === "function"
    ) {

      return window.supabaseClient;

    }


    return null;

  }


  async function waitForSupabaseClient() {

    for (
      let attempt = 0;
      attempt < 100;
      attempt += 1
    ) {

      const client =
        getSupabaseClient();


      if (client) {

        return client;

      }


      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            50
          )
      );

    }


    return null;

  }


  /* =====================================================
     MESSAGE
  ===================================================== */

  function showMessage(
    message,
    type = "normal"
  ) {

    if (!approvalRouteMessage) {

      return;

    }


    approvalRouteMessage.hidden =
      false;


    approvalRouteMessage.textContent =
      message;


    if (type === "error") {

      approvalRouteMessage.style.background =
        "#fff4f4";

      approvalRouteMessage.style.borderColor =
        "#dfbcbc";

      approvalRouteMessage.style.color =
        "#8a3434";

      return;

    }


    if (type === "success") {

      approvalRouteMessage.style.background =
        "#f3f8f4";

      approvalRouteMessage.style.borderColor =
        "#bfd6c3";

      approvalRouteMessage.style.color =
        "#356345";

      return;

    }


    approvalRouteMessage.style.background =
      "#f8fafc";

    approvalRouteMessage.style.borderColor =
      "#d3dde7";

    approvalRouteMessage.style.color =
      "#526b82";

  }


  function hideMessage() {

    if (approvalRouteMessage) {

      approvalRouteMessage.hidden =
        true;

    }

  }


  /* =====================================================
     NORMALISE OPTIONS
  ===================================================== */

  function normaliseOptions(data) {

    return {

      divisions:
        Array.isArray(
          data?.divisions
        )
          ? data.divisions
          : [],


      stations:
        Array.isArray(
          data?.stations
        )
          ? data.stations
          : [],


      review_officers:
        Array.isArray(
          data?.review_officers
        )
          ? data.review_officers
          : [],


      final_signatories:
        Array.isArray(
          data?.final_signatories
        )
          ? data.final_signatories
          : []

    };

  }


  /* =====================================================
     DIVISION OPTIONS
  ===================================================== */

  function renderDivisionOptions() {

    if (!routeDivision) {

      return;

    }


    const currentValue =
      routeDivision.value;


    routeDivision.innerHTML = `

      <option value="">
        Select Division
      </option>

      ${
        routeOptions.divisions
          .map(
            (division) => {

              const id =
                escapeHtml(
                  division.id
                );


              const name =
                escapeHtml(
                  division.division_name ||
                  "Division"
                );


              const code =
                escapeHtml(
                  division.division_code ||
                  ""
                );


              return `

                <option value="${id}">

                  ${name}
                  ${
                    code
                      ? ` (${code})`
                      : ""
                  }

                </option>

              `;

            }
          )
          .join("")
      }

    `;


    if (
      currentValue &&
      routeOptions.divisions.some(
        (division) =>
          division.id === currentValue
      )
    ) {

      routeDivision.value =
        currentValue;

    }

  }


  /* =====================================================
     STATION OPTIONS
  ===================================================== */

  function renderStationOptions() {

    if (!routeStation) {

      return;

    }


    const divisionId =
      routeDivision?.value || "";


    const currentValue =
      routeStation.value;


    const stations =
      routeOptions.stations.filter(
        (station) => {

          if (!divisionId) {

            return true;

          }


          return (
            station.division_id ===
            divisionId
          );

        }
      );


    routeStation.innerHTML = `

      <option value="">
        Select Station
      </option>

      ${
        stations
          .map(
            (station) => {

              const id =
                escapeHtml(
                  station.id
                );


              const name =
                escapeHtml(
                  station.station_name ||
                  "Station"
                );


              const code =
                escapeHtml(
                  station.station_code ||
                  ""
                );


              return `

                <option value="${id}">

                  ${name}
                  ${
                    code
                      ? ` (${code})`
                      : ""
                  }

                </option>

              `;

            }
          )
          .join("")
      }

    `;


    if (
      currentValue &&
      stations.some(
        (station) =>
          station.id === currentValue
      )
    ) {

      routeStation.value =
        currentValue;

    }

  }


  /* =====================================================
     SCOPE UI
  ===================================================== */

  function updateScopeUi() {

    const scope =
      routeScopeType?.value || "";


    if (routeDivisionField) {

      routeDivisionField.style.display =
        scope
          ? ""
          : "none";

    }


    if (routeStationField) {

      routeStationField.style.display =
        scope === "STATION"
          ? ""
          : "none";

    }


    if (
      scope === "DIVISION" &&
      routeStation
    ) {

      routeStation.value =
        "";

    }


    renderStationOptions();


    validateExistingStepSelections();

  }


  /* =====================================================
     CURRENT SCOPE
  ===================================================== */

  function getCurrentScope() {

    const scopeType =
      routeScopeType?.value || "";


    const divisionId =
      routeDivision?.value || "";


    const stationId =
      routeStation?.value || "";


    let station =
      null;


    if (stationId) {

      station =
        routeOptions.stations.find(
          (item) =>
            item.id === stationId
        ) || null;

    }


    const effectiveDivisionId =
      station?.division_id ||
      divisionId ||
      "";


    return {

      scopeType,

      divisionId,

      stationId,

      effectiveDivisionId

    };

  }


  /* =====================================================
     OFFICER SCOPE CHECK
  ===================================================== */

  function officerMatchesScope(
    officer
  ) {

    const scope =
      getCurrentScope();


    if (!scope.scopeType) {

      return false;

    }


    if (
      scope.scopeType === "STATION"
    ) {

      if (!scope.stationId) {

        return false;

      }


      if (
        officer.station_id ===
        scope.stationId
      ) {

        return true;

      }


      if (
        !officer.station_id &&
        officer.division_id ===
          scope.effectiveDivisionId
      ) {

        return true;

      }


      return false;

    }


    if (
      scope.scopeType === "DIVISION"
    ) {

      if (!scope.divisionId) {

        return false;

      }


      return (
        !officer.station_id &&
        officer.division_id ===
          scope.divisionId
      );

    }


    return false;

  }


  /* =====================================================
     DEDUPLICATE USERS
  ===================================================== */

  function dedupeOfficers(
    officers
  ) {

    const map =
      new Map();


    officers.forEach(
      (officer) => {

        if (!officer?.user_id) {

          return;

        }


        if (
          !map.has(
            officer.user_id
          )
        ) {

          map.set(
            officer.user_id,
            officer
          );

        }

      }
    );


    return Array.from(
      map.values()
    );

  }


  /* =====================================================
     VALID OFFICERS FOR STEP
  ===================================================== */

  function getValidOfficers(
    stepType
  ) {

    const source =
      stepType === "FINAL_APPROVAL"
        ? routeOptions.final_signatories
        : routeOptions.review_officers;


    return dedupeOfficers(
      source.filter(
        officerMatchesScope
      )
    );

  }


  /* =====================================================
     CREATE STEP
  ===================================================== */

  function createReviewStep() {

    return {

      local_id:
        newStepId(),

      step_type:
        "REVIEW",

      assigned_user_id:
        "",

      step_label:
        ""

    };

  }


  function createFinalStep() {

    return {

      local_id:
        newStepId(),

      step_type:
        "FINAL_APPROVAL",

      assigned_user_id:
        "",

      step_label:
        "Final Approval"

    };

  }


  /* =====================================================
     DEFAULT ROUTE
  ===================================================== */

  function resetStepStructure() {

    routeSteps = [

      createReviewStep(),

      createFinalStep()

    ];


    renderRouteSteps();

  }


  /* =====================================================
     OFFICER OPTIONS HTML
  ===================================================== */

  function officerOptionsHtml(
    step
  ) {

    const officers =
      getValidOfficers(
        step.step_type
      );


    const selectedUser =
      step.assigned_user_id;


    const options =
      officers.map(
        (officer) => {

          const userId =
            escapeHtml(
              officer.user_id
            );


          const fullName =
            escapeHtml(
              officer.full_name ||
              "Name not recorded"
            );


          const designation =
            escapeHtml(
              officer.designation ||
              "Designation not recorded"
            );


          const employeeNumber =
            escapeHtml(
              officer.employee_number ||
              ""
            );


          return `

            <option
              value="${userId}"
              ${
                selectedUser === officer.user_id
                  ? "selected"
                  : ""
              }
            >

              ${fullName}
              — ${designation}
              ${
                employeeNumber
                  ? ` — ${employeeNumber}`
                  : ""
              }

            </option>

          `;

        }
      )
      .join("");


    return `

      <option value="">

        ${
          step.step_type ===
          "FINAL_APPROVAL"

            ? "Select Final Officer"

            : "Select Review Officer"
        }

      </option>

      ${options}

    `;

  }


  /* =====================================================
     RENDER ROUTE STEPS
  ===================================================== */

  function renderRouteSteps() {

    if (!routeStepList) {

      return;

    }


    if (
      !Array.isArray(routeSteps) ||
      routeSteps.length === 0
    ) {

      resetStepStructure();

      return;

    }


    routeStepList.innerHTML =
      routeSteps.map(
        (
          step,
          index
        ) => {


          const finalStep =
            step.step_type ===
            "FINAL_APPROVAL";


          const stepLabel =
            escapeHtml(
              step.step_label || ""
            );


          return `

            <div
              class="route-step-row"
              data-route-step-id="${escapeHtml(
                step.local_id
              )}"
            >


              <div
                class="route-step-order"
                title="Route order"
              >

                ${index + 1}

              </div>


              <select
                class="route-step-user"
                data-route-step-id="${escapeHtml(
                  step.local_id
                )}"
              >

                ${officerOptionsHtml(step)}

              </select>


              <input
                type="text"
                class="route-step-label"
                data-route-step-id="${escapeHtml(
                  step.local_id
                )}"
                value="${stepLabel}"
                placeholder="${
                  finalStep
                    ? "Final Approval"
                    : "Example: Technical Review"
                }"
              >


              <div>

                <strong
                  style="
                    color:#294967;
                    font-size:10px;
                  "
                >

                  ${
                    finalStep
                      ? "FINAL APPROVAL"
                      : "REVIEW"
                  }

                </strong>

              </div>


              <div class="route-step-controls">


                ${
                  !finalStep

                    ? `

                      <button
                        type="button"
                        class="move-route-step-up"
                        data-route-step-id="${escapeHtml(
                          step.local_id
                        )}"
                        title="Move Up"
                      >
                        ↑
                      </button>


                      <button
                        type="button"
                        class="move-route-step-down"
                        data-route-step-id="${escapeHtml(
                          step.local_id
                        )}"
                        title="Move Down"
                      >
                        ↓
                      </button>


                      <button
                        type="button"
                        class="remove-route-step"
                        data-route-step-id="${escapeHtml(
                          step.local_id
                        )}"
                        title="Remove Review Officer"
                      >
                        Remove
                      </button>

                    `

                    : `

                      <span
                        style="
                          color:#718294;
                          font-size:9px;
                          white-space:nowrap;
                        "
                      >
                        Final Stage
                      </span>

                    `
                }


              </div>


            </div>

          `;

        }
      )
      .join("");


    bindStepEvents();

  }


  /* =====================================================
     STEP EVENTS
  ===================================================== */

  function bindStepEvents() {

    routeStepList
      ?.querySelectorAll(
        ".route-step-user"
      )
      .forEach(
        (select) => {

          select.addEventListener(
            "change",
            () => {

              const id =
                select.dataset.routeStepId;


              const step =
                routeSteps.find(
                  (item) =>
                    item.local_id === id
                );


              if (step) {

                step.assigned_user_id =
                  select.value;

              }

            }
          );

        }
      );


    routeStepList
      ?.querySelectorAll(
        ".route-step-label"
      )
      .forEach(
        (input) => {

          input.addEventListener(
            "input",
            () => {

              const id =
                input.dataset.routeStepId;


              const step =
                routeSteps.find(
                  (item) =>
                    item.local_id === id
                );


              if (step) {

                step.step_label =
                  input.value;

              }

            }
          );

        }
      );


    routeStepList
      ?.querySelectorAll(
        ".move-route-step-up"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              moveStep(
                button.dataset.routeStepId,
                -1
              );

            }
          );

        }
      );


    routeStepList
      ?.querySelectorAll(
        ".move-route-step-down"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              moveStep(
                button.dataset.routeStepId,
                1
              );

            }
          );

        }
      );


    routeStepList
      ?.querySelectorAll(
        ".remove-route-step"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              removeStep(
                button.dataset.routeStepId
              );

            }
          );

        }
      );

  }


  /* =====================================================
     MOVE STEP

     Final approval always remains last.
  ===================================================== */

  function moveStep(
    localId,
    direction
  ) {

    const index =
      routeSteps.findIndex(
        (step) =>
          step.local_id === localId
      );


    if (index < 0) {

      return;

    }


    const step =
      routeSteps[index];


    if (
      step.step_type ===
      "FINAL_APPROVAL"
    ) {

      return;

    }


    const finalIndex =
      routeSteps.findIndex(
        (item) =>
          item.step_type ===
          "FINAL_APPROVAL"
      );


    const targetIndex =
      index + direction;


    if (
      targetIndex < 0 ||
      targetIndex >= finalIndex
    ) {

      return;

    }


    const temporary =
      routeSteps[targetIndex];


    routeSteps[targetIndex] =
      routeSteps[index];


    routeSteps[index] =
      temporary;


    renderRouteSteps();

  }


  /* =====================================================
     REMOVE REVIEW STEP
  ===================================================== */

  function removeStep(localId) {

    const step =
      routeSteps.find(
        (item) =>
          item.local_id === localId
      );


    if (!step) {

      return;

    }


    if (
      step.step_type ===
      "FINAL_APPROVAL"
    ) {

      return;

    }


    routeSteps =
      routeSteps.filter(
        (item) =>
          item.local_id !== localId
      );


    renderRouteSteps();

  }


  /* =====================================================
     ADD REVIEW STEP
  ===================================================== */

  function addReviewStep() {

    const finalIndex =
      routeSteps.findIndex(
        (step) =>
          step.step_type ===
          "FINAL_APPROVAL"
      );


    const newStep =
      createReviewStep();


    if (finalIndex < 0) {

      routeSteps.push(
        newStep
      );


      routeSteps.push(
        createFinalStep()
      );

    }

    else {

      routeSteps.splice(
        finalIndex,
        0,
        newStep
      );

    }


    renderRouteSteps();

  }


  /* =====================================================
     CLEAR INVALID OFFICER SELECTIONS
  ===================================================== */

  function validateExistingStepSelections() {

    routeSteps.forEach(
      (step) => {

        if (
          !step.assigned_user_id
        ) {

          return;

        }


        const valid =
          getValidOfficers(
            step.step_type
          ).some(
            (officer) =>
              officer.user_id ===
              step.assigned_user_id
          );


        if (!valid) {

          step.assigned_user_id =
            "";

        }

      }
    );


    renderRouteSteps();

  }


  /* =====================================================
     AUTO ROUTE NAME
  ===================================================== */

  function suggestRouteName() {

    if (
      cleanText(
        routeName?.value
      )
    ) {

      return;

    }


    const scope =
      getCurrentScope();


    if (
      scope.scopeType === "STATION" &&
      scope.stationId
    ) {

      const station =
        routeOptions.stations.find(
          (item) =>
            item.id ===
            scope.stationId
        );


      if (station && routeName) {

        routeName.value =
          `${station.station_name} CTR Approval Route`;

      }


      return;

    }


    if (
      scope.scopeType === "DIVISION" &&
      scope.divisionId
    ) {

      const division =
        routeOptions.divisions.find(
          (item) =>
            item.id ===
            scope.divisionId
        );


      if (division && routeName) {

        routeName.value =
          `${division.division_name} CTR Approval Route`;

      }

    }

  }


  /* =====================================================
     VALIDATE ROUTE
  ===================================================== */

  function validateRouteForm() {

    const scope =
      getCurrentScope();


    if (
      !scope.scopeType
    ) {

      throw new Error(
        "Select Route Scope."
      );

    }


    if (
      !scope.divisionId
    ) {

      throw new Error(
        "Select Division."
      );

    }


    if (
      scope.scopeType === "STATION" &&
      !scope.stationId
    ) {

      throw new Error(
        "Select Station."
      );

    }


    const name =
      cleanText(
        routeName?.value
      );


    if (!name) {

      throw new Error(
        "Route Name is required."
      );

    }


    if (
      !Array.isArray(routeSteps) ||
      routeSteps.length < 1
    ) {

      throw new Error(
        "Approval route requires at least one officer."
      );

    }


    const finalSteps =
      routeSteps.filter(
        (step) =>
          step.step_type ===
          "FINAL_APPROVAL"
      );


    if (
      finalSteps.length !== 1
    ) {

      throw new Error(
        "Exactly one Final Approval officer is required."
      );

    }


    if (
      routeSteps[
        routeSteps.length - 1
      ].step_type !==
      "FINAL_APPROVAL"
    ) {

      throw new Error(
        "Final Approval officer must be last."
      );

    }


    const selectedUsers =
      new Set();


    routeSteps.forEach(
      (
        step,
        index
      ) => {

        if (
          !step.assigned_user_id
        ) {

          throw new Error(
            `Select officer for route step ${index + 1}.`
          );

        }


        if (
          selectedUsers.has(
            step.assigned_user_id
          )
        ) {

          throw new Error(
            `The same officer cannot be assigned twice in the same route.`
          );

        }


        selectedUsers.add(
          step.assigned_user_id
        );

      }
    );


    return {

      scope,

      name

    };

  }


  /* =====================================================
     SAVE ROUTE
  ===================================================== */

  async function saveRoute() {

    if (loading) {

      return;

    }


    try {


      const validation =
        validateRouteForm();


      loading =
        true;


      saveApprovalRoute.disabled =
        true;


      showMessage(
        "Saving approval route..."
      );


      const client =
        await waitForSupabaseClient();


      if (!client) {

        throw new Error(
          "Supabase connection is not available."
        );

      }


      const steps =
        routeSteps.map(
          (step) => ({

            assigned_user_id:
              step.assigned_user_id,

            step_type:
              step.step_type,

            step_label:
              cleanText(
                step.step_label
              ) || null

          })
        );


      const {
        data,
        error
      } =
        await client.rpc(
          "admin_save_ctr_approval_route",
          {

            p_scope_type:
              validation.scope.scopeType,

            p_station_id:
              validation.scope.scopeType ===
              "STATION"

                ? validation.scope.stationId

                : null,

            p_division_id:
              validation.scope.scopeType ===
              "DIVISION"

                ? validation.scope.divisionId

                : null,

            p_route_name:
              validation.name,

            p_steps:
              steps

          }
        );


      if (error) {

        console.error(
          "Save approval route error:",
          error
        );

        throw error;

      }


      console.log(
        "APPROVAL ROUTE SAVED:",
        data
      );


      showMessage(
        "Approval route saved successfully.",
        "success"
      );


      await loadExistingRoutes();


    }

    catch (error) {


      console.error(
        "Unable to save approval route:",
        error
      );


      showMessage(
        error?.message ||
        "Unable to save approval route.",
        "error"
      );


    }

    finally {


      loading =
        false;


      if (saveApprovalRoute) {

        saveApprovalRoute.disabled =
          false;

      }

    }

  }


  /* =====================================================
     CLEAR FORM
  ===================================================== */

  function clearRouteForm() {

    if (routeScopeType) {

      routeScopeType.value =
        "";

    }


    if (routeDivision) {

      routeDivision.value =
        "";

    }


    if (routeStation) {

      routeStation.value =
        "";

    }


    if (routeName) {

      routeName.value =
        "";

    }


    hideMessage();


    resetStepStructure();


    updateScopeUi();

  }


  /* =====================================================
     EXISTING ROUTES
  ===================================================== */

  function renderExistingRoutes() {

    if (!approvalRouteList) {

      return;

    }


    if (
      !Array.isArray(existingRoutes) ||
      existingRoutes.length === 0
    ) {

      approvalRouteList.innerHTML = `

        <div class="route-existing-card">

          <strong>
            No approval route configured
          </strong>

          <small>
            Create a station or division approval route above.
          </small>

        </div>

      `;

      return;

    }


    approvalRouteList.innerHTML =
      existingRoutes.map(
        (route) => {


          const routeId =
            escapeHtml(
              route.route_id
            );


          const routeTitle =
            escapeHtml(
              route.route_name ||
              "CTR Approval Route"
            );


          const scopeText =
            route.scope_type ===
            "STATION"

              ? `${route.station_name || "Station"}${
                  route.station_code
                    ? ` (${route.station_code})`
                    : ""
                }`

              : `${route.division_name || "Division"}${
                  route.division_code
                    ? ` (${route.division_code})`
                    : ""
                }`;


          const steps =
            Array.isArray(
              route.route_steps
            )
              ? route.route_steps
              : [];


          const stepsHtml =
            steps.map(
              (step) => {


                const name =
                  escapeHtml(
                    step.assigned_name ||
                    "Name not recorded"
                  );


                const designation =
                  escapeHtml(
                    step.assigned_designation ||
                    "Designation not recorded"
                  );


                const finalStep =
                  step.step_type ===
                  "FINAL_APPROVAL";


                return `

                  <span class="route-existing-step">

                    ${escapeHtml(
                      step.step_order
                    )}.
                    ${name}
                    — ${designation}

                    ${
                      finalStep
                        ? " — FINAL"
                        : ""
                    }

                  </span>

                `;

              }
            )
            .join("");


          return `

            <div
              class="route-existing-card"
              data-existing-route-id="${routeId}"
            >

              <strong>
                ${routeTitle}
              </strong>

              <small>

                ${escapeHtml(scopeText)}
                ·
                ${
                  route.configured_officer_count || 0
                }
                configured officer(s)

              </small>


              <div class="route-existing-steps">

                ${stepsHtml}

              </div>


              <div
                style="
                  margin-top:10px;
                "
              >

                <button
                  type="button"
                  class="secondary-action edit-existing-route"
                  data-existing-route-id="${routeId}"
                >
                  Edit Route
                </button>

              </div>

            </div>

          `;

        }
      )
      .join("");


    approvalRouteList
      .querySelectorAll(
        ".edit-existing-route"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            () => {

              loadRouteIntoForm(
                button.dataset.existingRouteId
              );

            }
          );

        }
      );

  }


  /* =====================================================
     LOAD ROUTE INTO FORM
  ===================================================== */

  function loadRouteIntoForm(
    routeId
  ) {

    const route =
      existingRoutes.find(
        (item) =>
          item.route_id === routeId
      );


    if (!route) {

      return;

    }


    if (routeScopeType) {

      routeScopeType.value =
        route.scope_type || "";

    }


    if (routeDivision) {

      routeDivision.value =
        route.division_id || "";

    }


    updateScopeUi();


    if (
      route.scope_type ===
      "STATION" &&
      routeStation
    ) {

      routeStation.value =
        route.station_id || "";

    }


    if (routeName) {

      routeName.value =
        route.route_name || "";

    }


    const existingSteps =
      Array.isArray(
        route.route_steps
      )
        ? route.route_steps
        : [];


    routeSteps =
      existingSteps.map(
        (step) => ({

          local_id:
            newStepId(),

          step_type:
            step.step_type,

          assigned_user_id:
            step.assigned_user_id,

          step_label:
            step.step_label || ""

        })
      );


    if (
      !routeSteps.some(
        (step) =>
          step.step_type ===
          "FINAL_APPROVAL"
      )
    ) {

      routeSteps.push(
        createFinalStep()
      );

    }


    renderRouteSteps();


    hideMessage();


    document.getElementById(
      "approvalRoutePanel"
    )?.scrollIntoView(
      {
        behavior: "smooth",
        block: "start"
      }
    );

  }


  /* =====================================================
     LOAD EXISTING ROUTES
  ===================================================== */

  async function loadExistingRoutes() {

    const client =
      await waitForSupabaseClient();


    if (!client) {

      throw new Error(
        "Supabase connection is not available."
      );

    }


    const {
      data,
      error
    } =
      await client.rpc(
        "admin_list_ctr_approval_routes"
      );


    if (error) {

      console.error(
        "Route list error:",
        error
      );

      throw error;

    }


    existingRoutes =
      Array.isArray(data)
        ? data
        : [];


    renderExistingRoutes();

  }


  /* =====================================================
     LOAD OPTIONS
  ===================================================== */

  async function loadRouteOptions() {

    const client =
      await waitForSupabaseClient();


    if (!client) {

      throw new Error(
        "Supabase connection is not available."
      );

    }


    const {
      data,
      error
    } =
      await client.rpc(
        "admin_ctr_route_options"
      );


    if (error) {

      console.error(
        "Route options error:",
        error
      );

      throw error;

    }


    routeOptions =
      normaliseOptions(
        data
      );


    renderDivisionOptions();


    renderStationOptions();

  }


  /* =====================================================
     INITIALISE
  ===================================================== */

  async function initialiseRouteAdmin() {

    try {


      showMessage(
        "Loading approval route configuration..."
      );


      await loadRouteOptions();


      resetStepStructure();


      updateScopeUi();


      await loadExistingRoutes();


      hideMessage();


    }

    catch (error) {


      console.error(
        "Approval route administration error:",
        error
      );


      showMessage(
        error?.message ||
        "Unable to load approval route administration.",
        "error"
      );


      if (approvalRouteList) {

        approvalRouteList.innerHTML = `

          <div class="route-existing-card">

            <strong>
              Unable to load approval routes
            </strong>

            <small>
              Check the browser console for details.
            </small>

          </div>

        `;

      }

    }

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  routeScopeType
    ?.addEventListener(
      "change",
      () => {

        if (routeDivision) {

          routeDivision.value =
            "";

        }


        if (routeStation) {

          routeStation.value =
            "";

        }


        if (routeName) {

          routeName.value =
            "";

        }


        updateScopeUi();

      }
    );


  routeDivision
    ?.addEventListener(
      "change",
      () => {

        if (routeStation) {

          routeStation.value =
            "";

        }


        if (routeName) {

          routeName.value =
            "";

        }


        renderStationOptions();


        validateExistingStepSelections();


        suggestRouteName();

      }
    );


  routeStation
    ?.addEventListener(
      "change",
      () => {

        if (routeName) {

          routeName.value =
            "";

        }


        validateExistingStepSelections();


        suggestRouteName();

      }
    );


  addReviewOfficer
    ?.addEventListener(
      "click",
      addReviewStep
    );


  clearApprovalRoute
    ?.addEventListener(
      "click",
      clearRouteForm
    );


  saveApprovalRoute
    ?.addEventListener(
      "click",
      saveRoute
    );


  /* =====================================================
     START
  ===================================================== */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialiseRouteAdmin
    );

  }

  else {

    initialiseRouteAdmin();

  }


})();