/* =========================================================
   CTR MANAGEMENT SYSTEM
   NOTIFICATIONS & ACTIVITY REGISTER
   SECURE RPC VERSION

   DESIGN
   ---------------------------------------------------------
   Summary
      ↓
   Search / Filters
      ↓
   Serial-wise Activity Register
      ↓
   View Details
      ↓
   Exact OLD → NEW changes

   SECURITY
   ---------------------------------------------------------
   audit_logs is never selected directly.
   Data comes through:
   public.admin_list_activity_feed(...)
========================================================= */

(function () {

  "use strict";


  /* =========================================================
     DOM
  ========================================================= */

  const totalCount =
    document.getElementById(
      "activityTotalCount"
    );

  const unreadCount =
    document.getElementById(
      "activityUnreadCount"
    );

  const ctrCount =
    document.getElementById(
      "activityCtrCount"
    );

  const approvalCount =
    document.getElementById(
      "activityApprovalCount"
    );

  const searchInput =
    document.getElementById(
      "activitySearch"
    );

  const filterGroup =
    document.getElementById(
      "activityFilterGroup"
    );

  const refreshButton =
    document.getElementById(
      "refreshActivity"
    );

  const markAllButton =
    document.getElementById(
      "markAllActivityRead"
    );

  const statusBox =
    document.getElementById(
      "activityStatus"
    );

  const activityList =
    document.getElementById(
      "activityList"
    );


  /* =========================================================
     STATE
  ========================================================= */

  let activityRecords = [];

  let activeFilter =
    "ALL";

  let loading =
    false;

  let refreshTimer =
    null;

  let expandedNotificationId =
    null;


  const MAX_RECORDED_CHANGES =
    1000;


  /* =========================================================
     PAGE-SPECIFIC STYLES
  ========================================================= */

  function injectRegisterStyles() {

    if (
      document.getElementById(
        "ctrActivityRegisterStyles"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "ctrActivityRegisterStyles";


    style.textContent = `

      /* ===================================================
         REGISTER
      =================================================== */

      .ctr-activity-register-wrap {

        width: 100%;

        overflow-x: auto;

        border:
          1px solid #c9d4df;

        border-radius:
          5px;

        background:
          #ffffff;
      }


      .ctr-activity-register {

        width: 100%;

        min-width: 1050px;

        border-collapse:
          collapse;

        background:
          #ffffff;
      }


      .ctr-activity-register th {

        padding:
          11px 10px;

        border-right:
          1px solid #d4dde6;

        border-bottom:
          1px solid #bac7d3;

        background:
          #edf2f7;

        color:
          #294967;

        text-align:
          left;

        font-size:
          9px;

        font-weight:
          700;

        letter-spacing:
          0.6px;

        text-transform:
          uppercase;

        white-space:
          nowrap;
      }


      .ctr-activity-register td {

        padding:
          11px 10px;

        border-right:
          1px solid #e0e6ec;

        border-bottom:
          1px solid #dce3ea;

        color:
          #40576d;

        font-size:
          11px;

        vertical-align:
          middle;
      }


      .ctr-activity-register
      th:last-child,

      .ctr-activity-register
      td:last-child {

        border-right:
          0;
      }


      .ctr-register-row {

        background:
          #ffffff;
      }


      .ctr-register-row:hover {

        background:
          #f8fafc;
      }


      .ctr-register-row.unread {

        background:
          #f5f9fd;
      }


      .ctr-register-row.unread
      td:first-child {

        border-left:
          4px solid #1f5d98;
      }


      .ctr-register-sno {

        width:
          54px;

        color:
          #173e6e !important;

        text-align:
          center;

        font-weight:
          700;
      }


      .ctr-register-date {

        min-width:
          135px;

        white-space:
          nowrap;
      }


      .ctr-register-station {

        min-width:
          135px;

        color:
          #173e6e !important;

        font-weight:
          700;
      }


      .ctr-register-name {

        min-width:
          145px;

        font-weight:
          700;
      }


      .ctr-register-designation {

        min-width:
          150px;
      }


      .ctr-register-action {

        min-width:
          160px;

        font-weight:
          700;
      }


      .ctr-register-status {

        width:
          90px;

        white-space:
          nowrap;
      }


      .ctr-register-status-badge {

        display:
          inline-flex;

        align-items:
          center;

        gap:
          5px;

        font-size:
          9px;

        font-weight:
          700;
      }


      .ctr-register-status-dot {

        width:
          7px;

        height:
          7px;

        border-radius:
          50%;

        background:
          #1f5d98;
      }


      .ctr-register-status-badge.read
      .ctr-register-status-dot {

        background:
          #7c8996;
      }


      .ctr-register-view-btn {

        min-height:
          30px;

        padding:
          0 10px;

        border:
          1px solid #bfcbd7;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #173e6e;

        font-size:
          9px;

        font-weight:
          700;

        cursor:
          pointer;

        white-space:
          nowrap;
      }


      .ctr-register-view-btn:hover {

        border-color:
          #8099b1;

        background:
          #edf3f8;
      }


      /* ===================================================
         EXPANDED DETAIL ROW
      =================================================== */

      .ctr-register-detail-row
      > td {

        padding:
          0 !important;

        border-right:
          0 !important;

        background:
          #f8fafc;
      }


      .ctr-register-detail {

        margin:
          0;

        padding:
          18px;

        border-left:
          4px solid #173e6e;

        background:
          #f8fafc;
      }


      .ctr-detail-heading {

        display:
          flex;

        align-items:
          flex-start;

        justify-content:
          space-between;

        gap:
          20px;

        margin-bottom:
          15px;

        padding-bottom:
          12px;

        border-bottom:
          1px solid #d4dde6;
      }


      .ctr-detail-heading small {

        display:
          block;

        margin-bottom:
          4px;

        color:
          #718295;

        font-size:
          8px;

        font-weight:
          700;

        letter-spacing:
          0.8px;

        text-transform:
          uppercase;
      }


      .ctr-detail-heading h3 {

        margin:
          0;

        color:
          #173e6e;

        font-size:
          16px;

        font-weight:
          700;
      }


      .ctr-detail-heading-time {

        flex:
          0 0 auto;

        color:
          #708093;

        font-size:
          10px;

        white-space:
          nowrap;
      }


      /* ===================================================
         PERSON / ACTION INFORMATION
      =================================================== */

      .ctr-detail-information {

        display:
          grid;

        grid-template-columns:
          repeat(
            4,
            minmax(0, 1fr)
          );

        gap:
          1px;

        overflow:
          hidden;

        margin-bottom:
          17px;

        border:
          1px solid #ccd7e1;

        border-radius:
          4px;

        background:
          #ccd7e1;
      }


      .ctr-detail-information
      > div {

        padding:
          11px 12px;

        background:
          #ffffff;
      }


      .ctr-detail-information span {

        display:
          block;

        margin-bottom:
          4px;

        color:
          #728294;

        font-size:
          8px;

        font-weight:
          700;

        letter-spacing:
          0.5px;

        text-transform:
          uppercase;
      }


      .ctr-detail-information strong {

        display:
          block;

        color:
          #28445f;

        font-size:
          11px;

        font-weight:
          700;

        overflow-wrap:
          anywhere;
      }


      /* ===================================================
         DETAIL SECTIONS
      =================================================== */

      .ctr-detail-section {

        margin-top:
          16px;

        padding-top:
          15px;

        border-top:
          1px solid #dbe3ea;
      }


      .ctr-detail-section:first-of-type {

        margin-top:
          0;

        padding-top:
          0;

        border-top:
          0;
      }


      .ctr-detail-section-title {

        margin:
          0 0 9px;

        color:
          #31506e;

        font-size:
          10px;

        font-weight:
          700;

        letter-spacing:
          0.6px;

        text-transform:
          uppercase;
      }


      .ctr-detail-text {

        margin:
          0;

        color:
          #4d6377;

        font-size:
          11px;

        line-height:
          1.55;
      }


      /* ===================================================
         CHANGES
      =================================================== */

      .ctr-change-register {

        display:
          grid;

        gap:
          7px;
      }


      .ctr-change-record {

        display:
          grid;

        grid-template-columns:
          45px
          minmax(170px, 0.8fr)
          minmax(0, 1fr)
          34px
          minmax(0, 1fr);

        align-items:
          stretch;

        gap:
          7px;
      }


      .ctr-change-number,

      .ctr-change-field,

      .ctr-change-old,

      .ctr-change-new {

        display:
          flex;

        align-items:
          center;

        min-width:
          0;

        padding:
          8px 9px;

        border:
          1px solid #d5dee7;

        border-radius:
          3px;

        background:
          #ffffff;

        font-size:
          10px;

        overflow-wrap:
          anywhere;
      }


      .ctr-change-number {

        justify-content:
          center;

        color:
          #173e6e;

        font-weight:
          700;
      }


      .ctr-change-field {

        color:
          #304e6b;

        font-weight:
          700;
      }


      .ctr-change-old {

        color:
          #71484a;

        background:
          #fffafa;
      }


      .ctr-change-new {

        color:
          #365b48;

        background:
          #f9fdf9;
      }


      .ctr-change-arrow {

        display:
          flex;

        align-items:
          center;

        justify-content:
          center;

        color:
          #6f8295;

        font-size:
          15px;
      }


      /* ===================================================
         TECHNICAL REFERENCE
      =================================================== */

      .ctr-technical-record {

        display:
          grid;

        grid-template-columns:
          repeat(
            3,
            minmax(0, 1fr)
          );

        gap:
          8px;
      }


      .ctr-technical-record
      > div {

        padding:
          9px 10px;

        border:
          1px solid #d8e0e7;

        border-radius:
          3px;

        background:
          #ffffff;
      }


      .ctr-technical-record span {

        display:
          block;

        margin-bottom:
          4px;

        color:
          #7a8998;

        font-size:
          8px;

        font-weight:
          700;

        text-transform:
          uppercase;
      }


      .ctr-technical-record strong {

        display:
          block;

        color:
          #455e75;

        font-size:
          9px;

        font-weight:
          600;

        overflow-wrap:
          anywhere;
      }


      /* ===================================================
         DETAIL BUTTONS
      =================================================== */

      .ctr-detail-actions {

        display:
          flex;

        align-items:
          center;

        justify-content:
          flex-end;

        gap:
          7px;

        margin-top:
          17px;
      }


      .ctr-detail-actions a,

      .ctr-detail-actions button {

        min-height:
          32px;

        display:
          inline-flex;

        align-items:
          center;

        justify-content:
          center;

        padding:
          0 11px;

        border:
          1px solid #becbd7;

        border-radius:
          3px;

        background:
          #ffffff;

        color:
          #214c76;

        text-decoration:
          none;

        font-size:
          9px;

        font-weight:
          700;

        cursor:
          pointer;
      }


      .ctr-detail-actions a:hover,

      .ctr-detail-actions button:hover {

        background:
          #edf3f8;
      }


      /* ===================================================
         EMPTY
      =================================================== */

      .ctr-register-empty {

        padding:
          38px 20px;

        border:
          1px solid #d1dbe4;

        border-radius:
          5px;

        background:
          #ffffff;

        color:
          #718294;

        text-align:
          center;

        font-size:
          11px;
      }


      /* ===================================================
         RESPONSIVE
      =================================================== */

      @media
      (max-width: 950px) {

        .ctr-detail-information {

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );
        }


        .ctr-technical-record {

          grid-template-columns:
            1fr;
        }

      }


      @media
      (max-width: 650px) {

        .ctr-detail-heading {

          flex-direction:
            column;
        }


        .ctr-detail-heading-time {

          white-space:
            normal;
        }


        .ctr-detail-information {

          grid-template-columns:
            1fr;
        }


        .ctr-change-record {

          grid-template-columns:
            38px
            minmax(0, 1fr);
        }


        .ctr-change-old,

        .ctr-change-arrow,

        .ctr-change-new {

          grid-column:
            2;
        }


        .ctr-change-arrow {

          min-height:
            20px;

          transform:
            rotate(90deg);
        }


        .ctr-detail-actions {

          align-items:
            stretch;

          flex-direction:
            column;
        }


        .ctr-detail-actions a,

        .ctr-detail-actions button {

          width:
            100%;
        }

      }

    `;


    document.head
      .appendChild(
        style
      );

  }


  /* =========================================================
     WAIT FOR ACCESS
  ========================================================= */

  function waitForAccess(
    timeout = 10000
  ) {

    return new Promise(
      function (resolve) {

        const started =
          Date.now();


        function check() {

          if (
            window.ctrAccess &&
            window.ctrAccess.ready
          ) {

            resolve(true);

            return;

          }


          if (
            Date.now() -
            started >=
            timeout
          ) {

            resolve(false);

            return;

          }


          setTimeout(
            check,
            100
          );

        }


        check();

      }
    );

  }


  /* =========================================================
     ADMIN CHECK
  ========================================================= */

  function isSystemAdmin() {

    return Boolean(
      window.ctrAccess &&
      window.ctrAccess.ready &&
      typeof window.ctrAccess
        .isSystemAdmin ===
        "function" &&
      window.ctrAccess
        .isSystemAdmin()
    );

  }


  /* =========================================================
     VALUE DISPLAY
  ========================================================= */

  function displayValue(
    value
  ) {

    if (
      value === null ||
      typeof value ===
        "undefined"
    ) {

      return "—";

    }


    if (
      typeof value ===
      "boolean"
    ) {

      return value
        ? "Yes"
        : "No";

    }


    if (
      typeof value ===
      "object"
    ) {

      try {

        return JSON.stringify(
          value
        );

      }

      catch (error) {

        return String(value);

      }

    }


    const text =
      String(value)
        .trim();


    return text || "—";

  }


  /* =========================================================
     DATE
  ========================================================= */

  function formatDateTime(
    value
  ) {

    if (!value) {

      return "—";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return String(value);

    }


    return date
      .toLocaleString(
        "en-IN",
        {
          dateStyle:
            "medium",

          timeStyle:
            "short"
        }
      );

  }


  /* =========================================================
     ACTION LABEL
  ========================================================= */

  function humanizeAction(
    action
  ) {

    if (!action) {

      return "System Activity";

    }


    return String(action)
      .toLowerCase()
      .split("_")
      .map(
        function (word) {

          if (!word) {

            return "";

          }


          return (
            word.charAt(0)
              .toUpperCase() +
            word.slice(1)
          );

        }
      )
      .join(" ");

  }


  /* =========================================================
     FIELD NAME
  ========================================================= */

  function humanizePath(
    path
  ) {

    if (!path) {

      return "Data";

    }


    let value =
      String(path);


    value =
      value
        .replace(
          /^draft_data\./,
          ""
        )
        .replace(
          /^draftData\./,
          ""
        )
        .replace(
          /\[(\d+)\]/g,
          function (
            match,
            number
          ) {

            return (
              " " +
              (
                Number(number) +
                1
              )
            );

          }
        )
        .replaceAll(
          ".",
          " → "
        )
        .replace(
          /([a-z])([A-Z])/g,
          "$1 $2"
        )
        .replaceAll(
          "_",
          " "
        );


    return value
      .split(" ")
      .map(
        function (part) {

          if (
            part === "→"
          ) {

            return part;

          }


          if (!part) {

            return "";

          }


          return (
            part.charAt(0)
              .toUpperCase() +
            part.slice(1)
          );

        }
      )
      .join(" ");

  }


  /* =========================================================
     IGNORE NON-USEFUL AUTOMATIC CHANGES
  ========================================================= */

  const ignoredKeys =
    new Set([

      "savedAt",

      "saved_at",

      "created_at",

      "updated_at",

      /*
        User ID is already shown clearly as
        actor/name information.
        Do not show UUID → UUID as a normal
        engineering change.
      */

      "last_saved_by"

    ]);


  /* =========================================================
     DEEP DIFFERENCE
  ========================================================= */

  function compareData(
    oldValue,
    newValue,
    path,
    differences,
    depth = 0
  ) {

    if (
      differences.length >=
      MAX_RECORDED_CHANGES
    ) {

      return;

    }


    if (
      oldValue ===
      newValue
    ) {

      return;

    }


    if (
      depth >
      20
    ) {

      if (
        JSON.stringify(
          oldValue
        ) !==
        JSON.stringify(
          newValue
        )
      ) {

        differences.push(
          {
            path:
              path ||
              "Data",

            oldValue,

            newValue
          }
        );

      }


      return;

    }


    const oldObject =
      (
        oldValue !== null &&
        typeof oldValue ===
          "object"
      );


    const newObject =
      (
        newValue !== null &&
        typeof newValue ===
          "object"
      );


    /* -----------------------------------------------------
       SIMPLE
    ----------------------------------------------------- */

    if (
      !oldObject &&
      !newObject
    ) {

      differences.push(
        {
          path:
            path ||
            "Value",

          oldValue,

          newValue
        }
      );


      return;

    }


    /* -----------------------------------------------------
       ARRAY
    ----------------------------------------------------- */

    if (
      Array.isArray(
        oldValue
      ) ||
      Array.isArray(
        newValue
      )
    ) {

      const oldArray =
        Array.isArray(
          oldValue
        )
          ? oldValue
          : [];


      const newArray =
        Array.isArray(
          newValue
        )
          ? newValue
          : [];


      const size =
        Math.max(
          oldArray.length,
          newArray.length
        );


      for (
        let index = 0;
        index < size;
        index += 1
      ) {

        compareData(

          oldArray[index],

          newArray[index],

          `${path}[${index}]`,

          differences,

          depth + 1

        );


        if (
          differences.length >=
          MAX_RECORDED_CHANGES
        ) {

          break;

        }

      }


      return;

    }


    /* -----------------------------------------------------
       OBJECT
    ----------------------------------------------------- */

    const before =
      oldObject
        ? oldValue
        : {};


    const after =
      newObject
        ? newValue
        : {};


    const keys =
      new Set([
        ...Object.keys(before),
        ...Object.keys(after)
      ]);


    keys.forEach(
      function (key) {

        if (
          differences.length >=
          MAX_RECORDED_CHANGES
        ) {

          return;

        }


        if (
          ignoredKeys.has(
            key
          )
        ) {

          return;

        }


        const childPath =
          path
            ? `${path}.${key}`
            : key;


        compareData(

          before[key],

          after[key],

          childPath,

          differences,

          depth + 1

        );

      }
    );

  }


  function getDifferences(
    record
  ) {

    const differences =
      [];


    compareData(

      record.old_data,

      record.new_data,

      "",

      differences

    );


    return differences;

  }


  /* =========================================================
     USER
  ========================================================= */

  function getActorName(
    record
  ) {

    return (
      record.actor_name ||
      "Authenticated User"
    );

  }


  function getActorDesignation(
    record
  ) {

    return (
      record.actor_designation ||
      "Not recorded"
    );

  }


  /* =========================================================
     STATION
  ========================================================= */

  function getStationLabel(
    record
  ) {

    if (
      record.station_name &&
      record.station_code
    ) {

      return (
        `${record.station_name} (${record.station_code})`
      );

    }


    if (
      record.station_name
    ) {

      return record.station_name;

    }


    if (
      record.station_code
    ) {

      return record.station_code;

    }


    return record.station_id
      ? "Station"
      : "System";

  }


  /* =========================================================
     CATEGORY
  ========================================================= */

  function getCategory(
    record
  ) {

    const action =
      String(
        record.action ||
        record.event_type ||
        ""
      )
        .toUpperCase();


    if (
      action.includes(
        "DIGITALLY_SIGN"
      ) ||
      action.includes(
        "SIGNED"
      ) ||
      action.includes(
        "_SIGN"
      )
    ) {

      return "SIGN";

    }


    if (
      action.includes(
        "APPROVAL"
      ) ||
      action.includes(
        "APPROVED"
      ) ||
      action.includes(
        "REVIEW"
      ) ||
      action.includes(
        "RETURN"
      ) ||
      action.includes(
        "REJECT"
      )
    ) {

      return "APPROVAL";

    }


    if (
      action.includes(
        "ALTERATION"
      )
    ) {

      return "ALTERATION";

    }


    if (
      action.includes(
        "USER_ROLE"
      ) ||
      action.includes(
        "USER_PROFILE"
      )
    ) {

      return "ACCESS";

    }


    if (
      action.includes(
        "CTR_"
      ) ||
      action.includes(
        "STATION_CTR"
      )
    ) {

      return "CTR";

    }


    return "OTHER";

  }


  /* =========================================================
     STATUS MESSAGE
  ========================================================= */

  function showStatus(
    title,
    message,
    error = false
  ) {

    if (!statusBox) {

      return;

    }


    statusBox.hidden =
      false;


    statusBox.innerHTML =
      "";


    const heading =
      document.createElement(
        "strong"
      );


    heading.textContent =
      title;


    const paragraph =
      document.createElement(
        "p"
      );


    paragraph.textContent =
      message;


    statusBox.appendChild(
      heading
    );


    statusBox.appendChild(
      paragraph
    );


    if (error) {

      statusBox.style
        .borderColor =
        "#d9a0a0";


      statusBox.style
        .background =
        "#fff7f7";

    }

    else {

      statusBox.style
        .removeProperty(
          "border-color"
        );


      statusBox.style
        .removeProperty(
          "background"
        );

    }

  }


  function hideStatus() {

    if (statusBox) {

      statusBox.hidden =
        true;

    }

  }


  /* =========================================================
     SECURE RPC
  ========================================================= */

  async function fetchActivityFeed() {

    const {
      data,
      error
    } =
      await supabaseClient
        .rpc(
          "admin_list_activity_feed",
          {
            p_limit:
              500
          }
        );


    if (error) {

      throw error;

    }


    return data || [];

  }


  /* =========================================================
     LOAD
  ========================================================= */

  async function loadActivity() {

    if (loading) {

      return;

    }


    loading =
      true;


    showStatus(
      "Loading activity records",
      "Reading secure CTR audit and notification records..."
    );


    if (refreshButton) {

      refreshButton.disabled =
        true;


      refreshButton.textContent =
        "Loading...";

    }


    try {

      const rows =
        await fetchActivityFeed();


      activityRecords =
        rows.map(
          function (row) {

            return {

              ...row,

              category:
                getCategory(
                  row
                ),

              differences:
                getDifferences(
                  row
                )

            };

          }
        );


      updateSummary();

      renderRegister();

      hideStatus();

    }

    catch (error) {

      console.error(
        "Activity feed error:",
        error
      );


      showStatus(
        "Activity records could not be loaded",
        error.message ||
        "Secure activity feed failed.",
        true
      );


      if (activityList) {

        activityList.innerHTML =
          "";


        const message =
          document.createElement(
            "div"
          );


        message.className =
          "ctr-register-empty";


        message.textContent =
          error.message ||
          "Activity records could not be loaded.";


        activityList.appendChild(
          message
        );

      }

    }

    finally {

      loading =
        false;


      if (refreshButton) {

        refreshButton.disabled =
          false;


        refreshButton.textContent =
          "Refresh";

      }

    }

  }


  /* =========================================================
     SUMMARY
  ========================================================= */

  function updateSummary() {

    const total =
      activityRecords.length;


    const unread =
      activityRecords
        .filter(
          function (record) {

            return !record.is_read;

          }
        )
        .length;


    const ctr =
      activityRecords
        .filter(
          function (record) {

            return (
              record.category ===
              "CTR"
            );

          }
        )
        .length;


    const approval =
      activityRecords
        .filter(
          function (record) {

            return (
              record.category ===
                "APPROVAL" ||
              record.category ===
                "SIGN"
            );

          }
        )
        .length;


    if (totalCount) {

      totalCount.textContent =
        String(total);

    }


    if (unreadCount) {

      unreadCount.textContent =
        String(unread);

    }


    if (ctrCount) {

      ctrCount.textContent =
        String(ctr);

    }


    if (approvalCount) {

      approvalCount.textContent =
        String(approval);

    }

  }


  /* =========================================================
     FILTER
  ========================================================= */

  function getVisibleRecords() {

    const search =
      String(
        searchInput?.value ||
        ""
      )
        .trim()
        .toLowerCase();


    return activityRecords
      .filter(
        function (record) {

          if (
            activeFilter ===
              "UNREAD" &&
            record.is_read
          ) {

            return false;

          }


          if (
            ![
              "ALL",
              "UNREAD"
            ]
              .includes(
                activeFilter
              ) &&
            record.category !==
              activeFilter
          ) {

            return false;

          }


          if (!search) {

            return true;

          }


          const text =
            [

              getActorName(record),

              getActorDesignation(
                record
              ),

              getStationLabel(
                record
              ),

              record.action,

              record.event_type,

              record.notification_title,

              record.notification_message,

              record.remarks,

              record.entity_type,

              record.entity_id

            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();


          return text.includes(
            search
          );

        }
      );

  }


  /* =========================================================
     ELEMENT HELPER
  ========================================================= */

  function createElement(
    tag,
    className,
    text
  ) {

    const element =
      document.createElement(
        tag
      );


    if (className) {

      element.className =
        className;

    }


    if (
      typeof text !==
      "undefined"
    ) {

      element.textContent =
        text;

    }


    return element;

  }


  /* =========================================================
     INFO CELL
  ========================================================= */

  function createDetailInfo(
    label,
    value
  ) {

    const box =
      createElement(
        "div"
      );


    box.appendChild(
      createElement(
        "span",
        "",
        label
      )
    );


    box.appendChild(
      createElement(
        "strong",
        "",
        displayValue(value)
      )
    );


    return box;

  }


  /* =========================================================
     RECORDED CHANGES
  ========================================================= */

  function createChangesSection(
    record
  ) {

    const section =
      createElement(
        "section",
        "ctr-detail-section"
      );


    section.appendChild(
      createElement(
        "h4",
        "ctr-detail-section-title",
        "What Changed"
      )
    );


    const changes =
      record.differences ||
      [];


    if (
      !changes.length
    ) {

      let message =
        "No individual field difference was identified.";


      if (
        record.old_data ===
          null &&
        record.new_data !==
          null
      ) {

        message =
          "A new record was created. No previous value existed.";

      }


      if (
        record.old_data !==
          null &&
        record.new_data ===
          null
      ) {

        message =
          "The record was deleted. Previous data remains preserved in the audit trail.";

      }


      section.appendChild(
        createElement(
          "p",
          "ctr-detail-text",
          message
        )
      );


      return section;

    }


    const register =
      createElement(
        "div",
        "ctr-change-register"
      );


    changes.forEach(
      function (
        change,
        index
      ) {

        const row =
          createElement(
            "div",
            "ctr-change-record"
          );


        row.appendChild(
          createElement(
            "div",
            "ctr-change-number",
            String(index + 1)
          )
        );


        row.appendChild(
          createElement(
            "div",
            "ctr-change-field",
            humanizePath(
              change.path
            )
          )
        );


        row.appendChild(
          createElement(
            "div",
            "ctr-change-old",
            "OLD: " +
            displayValue(
              change.oldValue
            )
          )
        );


        row.appendChild(
          createElement(
            "div",
            "ctr-change-arrow",
            "→"
          )
        );


        row.appendChild(
          createElement(
            "div",
            "ctr-change-new",
            "NEW: " +
            displayValue(
              change.newValue
            )
          )
        );


        register.appendChild(
          row
        );

      }
    );


    section.appendChild(
      register
    );


    if (
      changes.length >=
      MAX_RECORDED_CHANGES
    ) {

      section.appendChild(
        createElement(
          "p",
          "ctr-detail-text",
          `More than ${MAX_RECORDED_CHANGES} differences were detected.`
        )
      );

    }


    return section;

  }


  /* =========================================================
     TECHNICAL REFERENCES
  ========================================================= */

  function createTechnicalSection(
    record
  ) {

    const section =
      createElement(
        "section",
        "ctr-detail-section"
      );


    section.appendChild(
      createElement(
        "h4",
        "ctr-detail-section-title",
        "Technical Record"
      )
    );


    const register =
      createElement(
        "div",
        "ctr-technical-record"
      );


    const values = [

      [
        "Audit Number",
        record.audit_log_id
          ? "#" +
            record.audit_log_id
          : "—"
      ],

      [
        "Entity",
        record.entity_type
      ],

      [
        "Record ID",
        record.entity_id
      ],

      [
        "Alteration ID",
        record.alteration_id
      ],

      [
        "Version ID",
        record.version_id
      ],

      [
        "Actor User ID",
        record.actor_user_id
      ]

    ];


    values.forEach(
      function (item) {

        const box =
          createElement(
            "div"
          );


        box.appendChild(
          createElement(
            "span",
            "",
            item[0]
          )
        );


        box.appendChild(
          createElement(
            "strong",
            "",
            displayValue(
              item[1]
            )
          )
        );


        register.appendChild(
          box
        );

      }
    );


    section.appendChild(
      register
    );


    return section;

  }


  /* =========================================================
     FULL DETAIL
  ========================================================= */

  function createDetailPanel(
    record,
    serial
  ) {

    const detail =
      createElement(
        "div",
        "ctr-register-detail"
      );


    /* -----------------------------------------------------
       HEADER
    ----------------------------------------------------- */

    const heading =
      createElement(
        "div",
        "ctr-detail-heading"
      );


    const headingLeft =
      createElement(
        "div"
      );


    headingLeft.appendChild(
      createElement(
        "small",
        "",
        `Notification ${serial}`
      )
    );


    headingLeft.appendChild(
      createElement(
        "h3",
        "",
        getStationLabel(record) +
        " • " +
        humanizeAction(
          record.action ||
          record.event_type
        )
      )
    );


    heading.appendChild(
      headingLeft
    );


    heading.appendChild(
      createElement(
        "div",
        "ctr-detail-heading-time",
        formatDateTime(
          record.audit_created_at ||
          record.notification_created_at
        )
      )
    );


    detail.appendChild(
      heading
    );


    /* -----------------------------------------------------
       MAIN DETAILS
    ----------------------------------------------------- */

    const info =
      createElement(
        "div",
        "ctr-detail-information"
      );


    info.appendChild(
      createDetailInfo(
        "Name",
        getActorName(record)
      )
    );


    info.appendChild(
      createDetailInfo(
        "Designation",
        getActorDesignation(
          record
        )
      )
    );


    info.appendChild(
      createDetailInfo(
        "Station",
        getStationLabel(
          record
        )
      )
    );


    info.appendChild(
      createDetailInfo(
        "Action",
        humanizeAction(
          record.action ||
          record.event_type
        )
      )
    );


    detail.appendChild(
      info
    );


    /* -----------------------------------------------------
       ACTIVITY DETAILS
    ----------------------------------------------------- */

    const activitySection =
      createElement(
        "section",
        "ctr-detail-section"
      );


    activitySection.appendChild(
      createElement(
        "h4",
        "ctr-detail-section-title",
        "Activity Details"
      )
    );


    activitySection.appendChild(
      createElement(
        "p",
        "ctr-detail-text",

        record.notification_message ||
        record.notification_title ||
        humanizeAction(
          record.action ||
          record.event_type
        )

      )
    );


    detail.appendChild(
      activitySection
    );


    /* -----------------------------------------------------
       REMARKS
    ----------------------------------------------------- */

    if (record.remarks) {

      const remarks =
        createElement(
          "section",
          "ctr-detail-section"
        );


      remarks.appendChild(
        createElement(
          "h4",
          "ctr-detail-section-title",
          "Remarks"
        )
      );


      remarks.appendChild(
        createElement(
          "p",
          "ctr-detail-text",
          record.remarks
        )
      );


      detail.appendChild(
        remarks
      );

    }


    /* -----------------------------------------------------
       CHANGES
    ----------------------------------------------------- */

    detail.appendChild(
      createChangesSection(
        record
      )
    );


    /* -----------------------------------------------------
       TECHNICAL
    ----------------------------------------------------- */

    detail.appendChild(
      createTechnicalSection(
        record
      )
    );


    /* -----------------------------------------------------
       BUTTONS
    ----------------------------------------------------- */

    const actions =
      createElement(
        "div",
        "ctr-detail-actions"
      );


    if (
      record.station_id
    ) {

      const stationLink =
        createElement(
          "a",
          "",
          "Open Station CTR"
        );


      stationLink.href =
        "station.html?id=" +
        encodeURIComponent(
          record.station_id
        );


      actions.appendChild(
        stationLink
      );

    }


    if (
      !record.is_read
    ) {

      const readButton =
        createElement(
          "button",
          "",
          "Mark Read"
        );


      readButton.type =
        "button";


      readButton.dataset
        .activityRead =
        String(
          record.notification_id
        );


      actions.appendChild(
        readButton
      );

    }


    const closeButton =
      createElement(
        "button",
        "",
        "Close Details"
      );


    closeButton.type =
      "button";


    closeButton.dataset
      .closeActivityDetails =
      String(
        record.notification_id
      );


    actions.appendChild(
      closeButton
    );


    detail.appendChild(
      actions
    );


    return detail;

  }


  /* =========================================================
     TABLE HEADER
  ========================================================= */

  function createHeaderCell(
    text
  ) {

    return createElement(
      "th",
      "",
      text
    );

  }


  /* =========================================================
     RENDER REGISTER
  ========================================================= */

  function renderRegister() {

    if (!activityList) {

      return;

    }


    const records =
      getVisibleRecords();


    activityList.innerHTML =
      "";


    if (
      !records.length
    ) {

      activityList.appendChild(
        createElement(
          "div",
          "ctr-register-empty",
          "No activity records match the selected search or filter."
        )
      );


      return;

    }


    const wrapper =
      createElement(
        "div",
        "ctr-activity-register-wrap"
      );


    const table =
      createElement(
        "table",
        "ctr-activity-register"
      );


    const thead =
      document.createElement(
        "thead"
      );


    const headRow =
      document.createElement(
        "tr"
      );


    [
      "S.No.",
      "Date / Time",
      "Station",
      "Name",
      "Designation",
      "Action",
      "Status",
      "Details"
    ]
      .forEach(
        function (text) {

          headRow.appendChild(
            createHeaderCell(
              text
            )
          );

        }
      );


    thead.appendChild(
      headRow
    );


    table.appendChild(
      thead
    );


    const tbody =
      document.createElement(
        "tbody"
      );


    records.forEach(
      function (
        record,
        index
      ) {

        const serial =
          index + 1;


        /* -------------------------------------------------
           MAIN REGISTER ROW
        ------------------------------------------------- */

        const row =
          document.createElement(
            "tr"
          );


        row.className =
          "ctr-register-row";


        if (
          !record.is_read
        ) {

          row.classList.add(
            "unread"
          );

        }


        row.appendChild(
          createElement(
            "td",
            "ctr-register-sno",
            String(serial)
          )
        );


        row.appendChild(
          createElement(
            "td",
            "ctr-register-date",
            formatDateTime(
              record.audit_created_at ||
              record.notification_created_at
            )
          )
        );


        row.appendChild(
          createElement(
            "td",
            "ctr-register-station",
            getStationLabel(
              record
            )
          )
        );


        row.appendChild(
          createElement(
            "td",
            "ctr-register-name",
            getActorName(
              record
            )
          )
        );


        row.appendChild(
          createElement(
            "td",
            "ctr-register-designation",
            getActorDesignation(
              record
            )
          )
        );


        row.appendChild(
          createElement(
            "td",
            "ctr-register-action",
            humanizeAction(
              record.action ||
              record.event_type
            )
          )
        );


        /* -------------------------------------------------
           STATUS
        ------------------------------------------------- */

        const statusCell =
          createElement(
            "td",
            "ctr-register-status"
          );


        const statusBadge =
          createElement(
            "span",
            "ctr-register-status-badge"
          );


        if (
          record.is_read
        ) {

          statusBadge.classList
            .add(
              "read"
            );

        }


        statusBadge.appendChild(
          createElement(
            "span",
            "ctr-register-status-dot"
          )
        );


        statusBadge.appendChild(
          document.createTextNode(
            record.is_read
              ? "Read"
              : "Unread"
          )
        );


        statusCell.appendChild(
          statusBadge
        );


        row.appendChild(
          statusCell
        );


        /* -------------------------------------------------
           VIEW DETAILS
        ------------------------------------------------- */

        const detailButtonCell =
          document.createElement(
            "td"
          );


        const viewButton =
          createElement(
            "button",
            "ctr-register-view-btn",

            expandedNotificationId ===
              String(
                record.notification_id
              )
              ? "Close Details"
              : "View Details"
          );


        viewButton.type =
          "button";


        viewButton.dataset
          .viewActivityDetails =
          String(
            record.notification_id
          );


        detailButtonCell.appendChild(
          viewButton
        );


        row.appendChild(
          detailButtonCell
        );


        tbody.appendChild(
          row
        );


        /* -------------------------------------------------
           EXPANDED DETAIL
        ------------------------------------------------- */

        if (
          expandedNotificationId ===
          String(
            record.notification_id
          )
        ) {

          const detailRow =
            document.createElement(
              "tr"
            );


          detailRow.className =
            "ctr-register-detail-row";


          const detailCell =
            document.createElement(
              "td"
            );


          detailCell.colSpan =
            8;


          detailCell.appendChild(
            createDetailPanel(
              record,
              serial
            )
          );


          detailRow.appendChild(
            detailCell
          );


          tbody.appendChild(
            detailRow
          );

        }

      }
    );


    table.appendChild(
      tbody
    );


    wrapper.appendChild(
      table
    );


    activityList.appendChild(
      wrapper
    );

  }


  /* =========================================================
     MARK ONE READ
  ========================================================= */

  async function markNotificationRead(
    notificationId
  ) {

    try {

      const {
        error
      } =
        await supabaseClient
          .rpc(
            "mark_notification_read",
            {
              p_notification_id:
                Number(
                  notificationId
                )
            }
          );


      if (error) {

        throw error;

      }


      await loadActivity();

    }

    catch (error) {

      console.error(
        "Mark notification read:",
        error
      );


      alert(
        error.message ||
        "Notification could not be marked as read."
      );

    }

  }


  /* =========================================================
     MARK ALL READ
  ========================================================= */

  async function markAllRead() {

    const hasUnread =
      activityRecords.some(
        function (record) {

          return !record.is_read;

        }
      );


    if (!hasUnread) {

      alert(
        "There are no unread notifications."
      );

      return;

    }


    const confirmed =
      confirm(
        "Mark all notifications as read?"
      );


    if (!confirmed) {

      return;

    }


    try {

      if (markAllButton) {

        markAllButton.disabled =
          true;


        markAllButton.textContent =
          "Updating...";

      }


      const {
        error
      } =
        await supabaseClient
          .rpc(
            "mark_all_notifications_read"
          );


      if (error) {

        throw error;

      }


      await loadActivity();

    }

    catch (error) {

      console.error(
        "Mark all notifications:",
        error
      );


      alert(
        error.message ||
        "Notifications could not be marked as read."
      );

    }

    finally {

      if (markAllButton) {

        markAllButton.disabled =
          false;


        markAllButton.textContent =
          "Mark All Read";

      }

    }

  }


  /* =========================================================
     FILTER BUTTONS
  ========================================================= */

  filterGroup
    ?.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest(
            "[data-activity-filter]"
          );


        if (!button) {

          return;

        }


        activeFilter =
          button.dataset
            .activityFilter ||
          "ALL";


        filterGroup
          .querySelectorAll(
            "[data-activity-filter]"
          )
          .forEach(
            function (item) {

              item.classList
                .toggle(
                  "active",
                  item ===
                    button
                );

            }
          );


        expandedNotificationId =
          null;


        renderRegister();

      }
    );


  /* =========================================================
     SEARCH
  ========================================================= */

  searchInput
    ?.addEventListener(
      "input",
      function () {

        expandedNotificationId =
          null;


        renderRegister();

      }
    );


  /* =========================================================
     REFRESH
  ========================================================= */

  refreshButton
    ?.addEventListener(
      "click",
      loadActivity
    );


  /* =========================================================
     MARK ALL
  ========================================================= */

  markAllButton
    ?.addEventListener(
      "click",
      markAllRead
    );


  /* =========================================================
     REGISTER ACTIONS
  ========================================================= */

  activityList
    ?.addEventListener(
      "click",
      function (event) {

        /* -----------------------------------------------
           VIEW DETAILS
        ----------------------------------------------- */

        const viewButton =
          event.target.closest(
            "[data-view-activity-details]"
          );


        if (viewButton) {

          const id =
            String(
              viewButton.dataset
                .viewActivityDetails
            );


          expandedNotificationId =
            expandedNotificationId ===
              id
              ? null
              : id;


          renderRegister();


          return;

        }


        /* -----------------------------------------------
           CLOSE
        ----------------------------------------------- */

        const closeButton =
          event.target.closest(
            "[data-close-activity-details]"
          );


        if (closeButton) {

          expandedNotificationId =
            null;


          renderRegister();


          return;

        }


        /* -----------------------------------------------
           MARK READ
        ----------------------------------------------- */

        const readButton =
          event.target.closest(
            "[data-activity-read]"
          );


        if (readButton) {

          markNotificationRead(
            readButton.dataset
              .activityRead
          );

        }

      }
    );


  /* =========================================================
     INITIALIZE
  ========================================================= */

  async function initialize() {

    injectRegisterStyles();


    try {

      const accessReady =
        await waitForAccess();


      if (!accessReady) {

        throw new Error(
          "User permission information could not be loaded."
        );

      }


      if (
        !isSystemAdmin()
      ) {

        alert(
          "System Admin permission is required to view the complete activity log."
        );


        window.location.replace(
          "index.html"
        );


        return;

      }


      await loadActivity();


      refreshTimer =
        window.setInterval(
          function () {

            if (
              document.visibilityState ===
              "visible"
            ) {

              loadActivity();

            }

          },
          30000
        );

    }

    catch (error) {

      console.error(
        "Activity page initialization:",
        error
      );


      showStatus(
        "Notification page could not be initialized",
        error.message ||
        "Unknown error.",
        true
      );

    }

  }


  /* =========================================================
     RETURN TO TAB
  ========================================================= */

  document.addEventListener(
    "visibilitychange",
    function () {

      if (
        document.visibilityState ===
          "visible" &&
        isSystemAdmin()
      ) {

        loadActivity();

      }

    }
  );


  /* =========================================================
     CLEANUP
  ========================================================= */

  window.addEventListener(
    "pagehide",
    function () {

      if (refreshTimer) {

        window.clearInterval(
          refreshTimer
        );


        refreshTimer =
          null;

      }

    }
  );


  /* =========================================================
     START
  ========================================================= */

  initialize();

})();