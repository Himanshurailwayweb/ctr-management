/* =========================================================
   CTR MANAGEMENT SYSTEM
   PROFESSIONAL RAILWAY HEADER V3
   ORANGE VANDE BHARAT STYLE
   NON-STICKY / NON-FIXED
========================================================= */

(function () {

  "use strict";


  const NAV_ITEMS = [
    {
      label: "CTR Overview",
      href: "index.html"
    },
    {
      label: "Divisions & Stations",
      href: "divisions.html"
    },
    {
      label: "Alterations",
      href: "alterations.html"
    },
    {
      label: "Pending Approvals",
      href: "approvals.html"
    },
    {
      label: "Approved CTR / PDFs",
      href: "approved.html"
    },
    {
      label: "History",
      href: "history.html"
    },
    {
      label: "Administration",
      href: "administration.html",
      adminOnly: true
    },
  ];


  /* =====================================================
     REMOVE OLD EXPERIMENTAL HEADER STATE
  ===================================================== */

  function cleanupOldHeader() {

    document
      .getElementById("ctrRailwayHeader")
      ?.remove();


    document
      .getElementById("wcrRailwayHeader")
      ?.remove();


    document
      .querySelectorAll(".railway-system-header")
      .forEach(function (item) {
        item.remove();
      });


    [
      "ctrRailwayShellStyle",
      "wcrRailwayShellStyles"
    ].forEach(function (id) {

      document
        .getElementById(id)
        ?.remove();

    });


    /*
      Previous fixed-header test may have left
      this variable / padding behind.
    */

    document.documentElement
      .style
      .removeProperty(
        "--wcr-fixed-header-height"
      );


    const app =
      document.querySelector(
        "body > .app"
      );


    if (app) {
      app.style.paddingTop = "0";
    }

  }


  /* =====================================================
     CSS
  ===================================================== */

  function injectStyles() {

    const style =
      document.createElement(
        "style"
      );


    style.id =
      "ctrRailwayShellStyle";


    style.textContent = `

      /* ===============================================
         MAIN SHELL
      =============================================== */

      #ctrRailwayHeader {
        position: relative !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;

        z-index: 100;

        width: 100%;
        max-width: 100%;

        background: #ffffff;

        border-bottom: 1px solid #c6ced7;

        box-shadow:
          0 2px 5px
          rgba(0, 0, 0, 0.07);
      }


      body > .app {
        padding-top: 0 !important;
      }


      .sidebar {
        display: none !important;
      }


      .main-content {
        width: 100% !important;
        max-width: 100% !important;

        margin-left: 0 !important;
      }


      /* ===============================================
         TRAIN STRIP
      =============================================== */

      #ctrRailwayHeader
      .ctr-train-strip {

        position: relative;

        width: 100%;
        height: 102px;

        overflow: hidden;

        border-bottom:
          1px solid #d1d8df;

        background:
          linear-gradient(
            180deg,
            #f8fafc 0%,
            #ffffff 100%
          );
      }


      /* ===============================================
         MAIN SYSTEM TITLE
      =============================================== */

      #ctrRailwayHeader
      .ctr-system-title {

        position: absolute;

        top: 9px;
        left: 50%;

        z-index: 25;

        min-width: 390px;

        transform:
          translateX(-50%);

        text-align: center;

        pointer-events: none;
      }


      #ctrRailwayHeader
      .ctr-system-title small {

        display: block;

        margin-bottom: 2px;

        color: #637489;

        font-size: 10px;
        font-weight: 700;

        letter-spacing: 1.6px;
      }


      #ctrRailwayHeader
      .ctr-system-title strong {

        display: block;

        color: #173e6e;

        font-size: 20px;
        font-weight: 700;

        line-height: 1.1;

        letter-spacing: 0.5px;
      }


      #ctrRailwayHeader
      .ctr-system-title span {

        display: block;

        margin-top: 3px;

        color: #52687c;

        font-size: 10px;
        font-weight: 500;
      }


      /* ===============================================
         SIGNALS
      =============================================== */

      #ctrRailwayHeader
      .ctr-signal {

        position: absolute;

        bottom: 5px;

        z-index: 18;

        width: 29px;
        height: 62px;

        pointer-events: none;
      }


      #ctrRailwayHeader
      .ctr-signal-one {
        left: 29%;
      }


      #ctrRailwayHeader
      .ctr-signal-two {
        left: 74%;
      }


      #ctrRailwayHeader
      .ctr-signal-head {

        position: absolute;

        top: 0;
        left: 4px;

        width: 21px;

        padding: 4px 2px;

        border: 1px solid #161a1e;
        border-radius: 8px 8px 4px 4px;

        background: #252a2f;
      }


      #ctrRailwayHeader
      .ctr-signal-light {

        display: block;

        width: 11px;
        height: 11px;

        margin: 2px auto;

        border: 1px solid #111111;
        border-radius: 50%;

        background: #11181e;
      }


      #ctrRailwayHeader
      .ctr-signal-light.green.active {

        background: #11b75b;

        box-shadow:
          0 0 8px
          rgba(17, 183, 91, 0.95);
      }


      #ctrRailwayHeader
      .ctr-signal-light.red.active {

        background: #e32630;

        box-shadow:
          0 0 8px
          rgba(227, 38, 48, 0.95);
      }


      #ctrRailwayHeader
      .ctr-signal-post {

        position: absolute;

        top: 34px;
        left: 13px;

        width: 3px;
        height: 24px;

        background: #343a40;
      }


      #ctrRailwayHeader
      .ctr-signal-base {

        position: absolute;

        left: 5px;
        bottom: 0;

        width: 18px;
        height: 4px;

        background: #343a40;
      }


      /* ===============================================
         VANDE BHARAT
      =============================================== */

      #ctrVandeBharat {

        position: absolute;

        left: -620px;
        bottom: 1px;

        z-index: 12;

        display: flex;
        align-items: flex-end;

        width: max-content;
        height: 47px;

        animation:
          ctrVandeTravel
          15s
          linear
          infinite;

        will-change: transform;
      }


      #ctrVandeBharat
      .vb-car {

        position: relative;

        flex: 0 0 auto;

        width: 122px;
        height: 38px;

        margin-right: 1px;

        border-top: 1px solid #82909a;
        border-bottom: 2px solid #4f5961;

        background:
          linear-gradient(
            180deg,
            #ffffff 0%,
            #f7f8f9 58%,
            #e5eaed 100%
          );
      }


      #ctrVandeBharat
      .vb-rear {

        border-left: 1px solid #82909a;

        border-radius:
          17px
          2px
          2px
          7px;
      }


      /* orange lower band */

      #ctrVandeBharat
      .vb-car::after {

        content: "";

        position: absolute;

        left: 0;
        right: 0;
        bottom: 6px;

        height: 6px;

        background: #ee6c25;
      }


      /* dark window line */

      #ctrVandeBharat
      .vb-windows {

        position: absolute;

        top: 8px;
        left: 11px;
        right: 11px;

        display: flex;

        gap: 6px;
      }


      #ctrVandeBharat
      .vb-windows span {

        flex: 1;

        height: 11px;

        border: 1px solid #435d6e;
        border-radius: 2px;

        background:
          linear-gradient(
            180deg,
            #53768b,
            #93aebd
          );
      }


      #ctrVandeBharat
      .vb-door {

        position: absolute;

        top: 5px;
        right: 7px;

        width: 13px;
        height: 25px;

        border: 1px solid #ca581a;

        background: #f0782b;
      }


      /* front coach */

      #ctrVandeBharat
      .vb-front {

        width: 110px;

        margin-right: 49px;

        border-left: 1px solid #8f9aa2;
      }


      #ctrVandeBharat
      .vb-front
      .vb-windows {

        right: 31px;
      }


      #ctrVandeBharat
      .vb-windscreen {

        position: absolute;

        top: 5px;
        right: 5px;

        z-index: 6;

        width: 29px;
        height: 13px;

        border-radius:
          2px
          11px
          4px
          2px;

        background: #263d4a;
      }


      /* ===============================================
         ORANGE FRONT NOSE
      =============================================== */

      #ctrVandeNose {

        position: absolute;

        top: -1px;
        right: -50px;

        width: 54px;
        height: 40px;

        background:
          linear-gradient(
            150deg,
            #f78b3d 0%,
            #ef6d25 55%,
            #d95918 100%
          );

        clip-path:
          polygon(
            0 0,
            39% 1%,
            63% 8%,
            79% 19%,
            91% 34%,
            100% 52%,
            93% 65%,
            76% 79%,
            53% 90%,
            25% 98%,
            0 100%
          );
      }


      #ctrVandeNose::before {

        content: "";

        position: absolute;

        top: 6px;
        left: 8px;

        width: 28px;
        height: 11px;

        border-radius:
          4px
          13px
          4px
          4px;

        background: #273e4b;
      }


      #ctrVandeNose::after {

        content: "";

        position: absolute;

        left: 0;
        right: 8px;
        bottom: 7px;

        height: 3px;

        background: #ffffff;
      }


      /* wheels kept very subtle */

      #ctrVandeBharat
      .vb-wheel {

        position: absolute;

        bottom: -5px;

        width: 8px;
        height: 8px;

        border-radius: 50%;

        background: #394147;
      }


      #ctrVandeBharat
      .vb-wheel.left {
        left: 20px;
      }


      #ctrVandeBharat
      .vb-wheel.right {
        right: 20px;
      }


      @keyframes ctrVandeTravel {

        from {
          transform: translateX(0);
        }

        to {
          transform:
            translateX(
              calc(
                100vw +
                1300px
              )
            );
        }

      }


      /* ===============================================
         NAVIGATION ROW
      =============================================== */

      #ctrRailwayHeader
      .ctr-main-navigation {

        display: grid;

        grid-template-columns:
          175px
          minmax(0, 1fr)
          150px;

        align-items: center;

        column-gap: 10px;

        min-height: 66px;

        padding:
          5px
          20px;

        background: #ffffff;
      }


      /* ===============================================
         BRAND
      =============================================== */

      #ctrRailwayHeader
      .ctr-nav-brand {

        display: flex;
        align-items: center;

        gap: 10px;

        min-width: 0;

        padding-right: 10px;

        border-right:
          1px solid #d1d8df;
      }


      #ctrRailwayHeader
      .ctr-brand-mark {

        flex: 0 0 38px;

        width: 38px;
        height: 38px;

        display: grid;
        place-items: center;

        border-radius: 2px;

        background: #173e6e;

        color: #ffffff;

        font-size: 11px;
        font-weight: 700;
      }


      #ctrRailwayHeader
      .ctr-nav-brand strong {

        display: block;

        color: #102f52;

        font-size: 13px;
        font-weight: 700;

        white-space: nowrap;
      }


      #ctrRailwayHeader
      .ctr-nav-brand span {

        display: block;

        margin-top: 2px;

        color: #667789;

        font-size: 9px;
        font-weight: 500;

        white-space: nowrap;
      }


      /* ===============================================
         NAV LINKS
      =============================================== */

      #ctrRailwayHeader
      .ctr-nav-links {

        display: flex;
        align-items: center;

        width: 100%;
        min-width: 0;

        overflow-x: auto;
        overflow-y: hidden;

        scrollbar-width: none;

        white-space: nowrap;
      }


      #ctrRailwayHeader
      .ctr-nav-links::-webkit-scrollbar {
        display: none;
      }


      #ctrRailwayHeader
      .ctr-nav-links a {

        position: relative;

        flex:
          0
          0
          auto;

        min-height: 43px;

        display: inline-flex;
        align-items: center;

        padding:
          0
          9px;

        border:
          1px solid
          transparent;

        color: #293f57;

        text-decoration: none;

        font-size: 11px;
        font-weight: 700;
      }


      #ctrRailwayHeader
      .ctr-nav-links a:hover {

        background: #f4f6f8;

        border-color: #d8dfe5;

        color: #173e6e;
      }


      #ctrRailwayHeader
      .ctr-nav-links a.active {

        background: #edf2f7;

        border-color: #c9d3dc;

        color: #143b68;
      }


      #ctrRailwayHeader
      .ctr-nav-links a.active::after {

        content: "";

        position: absolute;

        left: 8px;
        right: 8px;
        bottom: -5px;

        height: 3px;

        background: #173e6e;
      }


      /* ===============================================
         USER
      =============================================== */

      #ctrRailwayHeader
      .ctr-header-user {

        min-width: 0;

        padding-left: 12px;

        border-left:
          1px solid #d1d8df;
      }


      #ctrRailwayHeader
      .ctr-header-user strong {

        display: block;

        overflow: hidden;

        color: #23384d;

        font-size: 11px;
        font-weight: 700;

        text-overflow: ellipsis;

        white-space: nowrap;
      }


      #ctrRailwayHeader
      .ctr-header-user span {

        display: block;

        margin-top: 3px;

        overflow: hidden;

        color: #68798a;

        font-size: 9px;
        font-weight: 500;

        text-overflow: ellipsis;

        white-space: nowrap;
      }


      /* ===============================================
         PAGE TITLE
      =============================================== */

      .main-content > .topbar h1 {

        font-size: 27px !important;
        font-weight: 700 !important;

        color: #102f52 !important;
      }


      .main-content > .topbar
      .eyebrow {

        font-size: 11px !important;
        font-weight: 700 !important;
      }


      /* ===============================================
         MEDIUM SCREEN
      =============================================== */

      @media
      (max-width: 1120px) {

        #ctrRailwayHeader
        .ctr-main-navigation {

          grid-template-columns:
            155px
            minmax(0, 1fr)
            125px;

          padding-left: 12px;
          padding-right: 12px;
        }


        #ctrRailwayHeader
        .ctr-nav-links a {

          padding-left: 7px;
          padding-right: 7px;

          font-size: 10px;
        }

      }


      /* ===============================================
         MOBILE
      =============================================== */

      @media
      (max-width: 760px) {

        #ctrRailwayHeader
        .ctr-train-strip {
          height: 88px;
        }


        #ctrRailwayHeader
        .ctr-system-title {

          top: 7px;

          min-width: 230px;
        }


        #ctrRailwayHeader
        .ctr-system-title strong {
          font-size: 15px;
        }


        #ctrRailwayHeader
        .ctr-system-title small {
          font-size: 8px;
        }


        #ctrRailwayHeader
        .ctr-system-title span {
          font-size: 8px;
        }


        #ctrRailwayHeader
        .ctr-main-navigation {

          display: block;

          min-height: auto;

          padding:
            4px
            7px;
        }


        #ctrRailwayHeader
        .ctr-nav-brand,
        #ctrRailwayHeader
        .ctr-header-user {

          display: none;
        }


        #ctrRailwayHeader
        .ctr-nav-links {

          width: 100%;
        }


        #ctrRailwayHeader
        .ctr-nav-links a {

          min-height: 40px;

          padding:
            0
            10px;

          font-size: 11px;
        }


        #ctrRailwayHeader
        .ctr-signal-one {
          left: 18%;
        }


        #ctrRailwayHeader
        .ctr-signal-two {
          left: 80%;
        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =====================================================
     PAGE
  ===================================================== */

  function getCurrentPage() {

    return (
      window.location.pathname
        .split("/")
        .pop() ||
      "index.html"
    );

  }


  function isActivePage(
    href
  ) {

    const page =
      getCurrentPage();


    if (
      href ===
      "divisions.html"
    ) {

      return [
        "divisions.html",
        "stations.html",
        "station.html"
      ].includes(page);

    }


    return page === href;

  }


  /* =====================================================
     NAV
  ===================================================== */

  function buildNavigation() {

    const nav =
      document.getElementById(
        "ctrTopNav"
      );


    if (!nav) {
      return;
    }


    nav.innerHTML = "";


    NAV_ITEMS.forEach(
      function (item) {

        const link =
          document.createElement(
            "a"
          );


        link.href =
          item.href;


        link.textContent =
          item.label;


        if (
          isActivePage(
            item.href
          )
        ) {

          link.classList.add(
            "active"
          );

        }


        if (
          item.adminOnly
        ) {

          link.dataset.systemAdminOnly =
            "";

          link.hidden = true;

        }


        nav.appendChild(
          link
        );

      }
    );


    /*
      Ensure first navigation item never loads
      already scrolled / cut off.
    */

    nav.scrollLeft = 0;


    requestAnimationFrame(
      function () {
        nav.scrollLeft = 0;
      }
    );


    setTimeout(
      function () {
        nav.scrollLeft = 0;
      },
      100
    );


    syncAccess();

  }


  /* =====================================================
     ACCESS + USER
  ===================================================== */

  function syncAccess() {

    const ready =
      !!window.ctrAccess?.ready;


    const isAdmin =
      !!(
        ready &&
        typeof window.ctrAccess
          .isSystemAdmin ===
          "function" &&
        window.ctrAccess
          .isSystemAdmin()
      );


    document
      .querySelectorAll(
        "#ctrRailwayHeader [data-system-admin-only]"
      )
      .forEach(
        function (item) {

          item.hidden =
            !isAdmin;

        }
      );


    const profile =
      window.ctrAccess?.profile;


    if (!profile) {
      return;
    }


    const name =
      document.querySelector(
        "#ctrRailwayHeader [data-current-user-name]"
      );


    const designation =
      document.querySelector(
        "#ctrRailwayHeader [data-current-user-designation]"
      );


    if (name) {

      name.textContent =
        profile.full_name ||
        "Railway User";

    }


    if (designation) {

      designation.textContent =
        profile.designation ||
        "Railway Employee";

    }

  }


  /* =====================================================
     SIGNAL STATES
  ===================================================== */

  function setGreen(signal) {

    signal
      .querySelector(".green")
      ?.classList
      .add("active");


    signal
      .querySelector(".red")
      ?.classList
      .remove("active");

  }


  function setRed(signal) {

    signal
      .querySelector(".green")
      ?.classList
      .remove("active");


    signal
      .querySelector(".red")
      ?.classList
      .add("active");

  }


  /* =====================================================
     SIGNAL MONITOR
  ===================================================== */

  function startSignalMonitor() {

    const train =
      document.getElementById(
        "ctrVandeBharat"
      );


    const nose =
      document.getElementById(
        "ctrVandeNose"
      );


    const signals =
      Array.from(
        document.querySelectorAll(
          "#ctrRailwayHeader .ctr-signal"
        )
      );


    if (
      !train ||
      !nose ||
      !signals.length
    ) {

      return;

    }


    let passed =
      new Set();


    function resetSignals() {

      passed =
        new Set();


      signals.forEach(
        setGreen
      );

    }


    resetSignals();


    train.addEventListener(
      "animationiteration",
      resetSignals
    );


    function monitor() {

      const noseRect =
        nose.getBoundingClientRect();


      /*
        The right-most edge is the first point
        of the moving train.
      */

      const frontPoint =
        noseRect.right;


      signals.forEach(
        function (
          signal,
          index
        ) {

          if (
            passed.has(index)
          ) {

            return;

          }


          const signalRect =
            signal.getBoundingClientRect();


          const signalPoint =
            signalRect.left +
            signalRect.width / 2;


          if (
            frontPoint >=
            signalPoint
          ) {

            passed.add(index);

            setRed(signal);

          }

        }
      );


      requestAnimationFrame(
        monitor
      );

    }


    requestAnimationFrame(
      monitor
    );

  }


  /* =====================================================
     CREATE HEADER
  ===================================================== */

  function createHeader() {

    cleanupOldHeader();

    injectStyles();


    const header =
      document.createElement(
        "header"
      );


    header.id =
      "ctrRailwayHeader";


    header.innerHTML = `

      <section class="ctr-train-strip">

        <div class="ctr-system-title">

          <small>
            WEST CENTRAL RAILWAY
          </small>

          <strong>
            CTR MANAGEMENT SYSTEM
          </strong>

          <span>
            Signalling Engineering
          </span>

        </div>


        <div
          class="
            ctr-signal
            ctr-signal-one
          "
        >

          <div class="ctr-signal-head">

            <span
              class="
                ctr-signal-light
                red
              "
            ></span>

            <span
              class="
                ctr-signal-light
                green
                active
              "
            ></span>

          </div>

          <div class="ctr-signal-post"></div>

          <div class="ctr-signal-base"></div>

        </div>


        <div
          class="
            ctr-signal
            ctr-signal-two
          "
        >

          <div class="ctr-signal-head">

            <span
              class="
                ctr-signal-light
                red
              "
            ></span>

            <span
              class="
                ctr-signal-light
                green
                active
              "
            ></span>

          </div>

          <div class="ctr-signal-post"></div>

          <div class="ctr-signal-base"></div>

        </div>


        <div id="ctrVandeBharat">

          <div
            class="
              vb-car
              vb-rear
            "
          >

            <div class="vb-windows">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <span class="vb-wheel left"></span>
            <span class="vb-wheel right"></span>

          </div>


          <div class="vb-car">

            <div class="vb-windows">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div class="vb-door"></div>

            <span class="vb-wheel left"></span>
            <span class="vb-wheel right"></span>

          </div>


          <div class="vb-car">

            <div class="vb-windows">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <span class="vb-wheel left"></span>
            <span class="vb-wheel right"></span>

          </div>


          <div
            class="
              vb-car
              vb-front
            "
          >

            <div class="vb-windows">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div class="vb-windscreen"></div>

            <span class="vb-wheel left"></span>
            <span class="vb-wheel right"></span>

            <div id="ctrVandeNose"></div>

          </div>

        </div>

      </section>


      <section class="ctr-main-navigation">

        <div class="ctr-nav-brand">

          <div class="ctr-brand-mark">
            CTR
          </div>

          <div>

            <strong>
              CTR Management
            </strong>

            <span>
              Engineering Records
            </span>

          </div>

        </div>


        <nav
          class="ctr-nav-links"
          id="ctrTopNav"
          aria-label="CTR Navigation"
        ></nav>


        <div class="ctr-header-user">

          <strong data-current-user-name>
            Railway User
          </strong>

          <span data-current-user-designation>
            Railway Employee
          </span>

        </div>

      </section>

    `;


    document.body.prepend(
      header
    );


    buildNavigation();

    syncAccess();

    startSignalMonitor();

  }


  /* =====================================================
     EVENTS
  ===================================================== */

  window.addEventListener(
    "ctr-access-ready",
    function () {

      syncAccess();


      const nav =
        document.getElementById(
          "ctrTopNav"
        );


      if (nav) {
        nav.scrollLeft = 0;
      }

    }
  );


  window.addEventListener(
    "pageshow",
    function () {

      const nav =
        document.getElementById(
          "ctrTopNav"
        );


      if (nav) {
        nav.scrollLeft = 0;
      }

    }
  );


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      createHeader
    );

  }

  else {

    createHeader();

  }

})();
/* =========================================================
   ADMINISTRATION NAVIGATION VISIBILITY
   SYSTEM_ADMIN ONLY
========================================================= */

(function () {

  let adminVisibilityObserver = null;


  function currentUserIsSystemAdmin() {

    if (
      !window.ctrAccess ||
      !window.ctrAccess.ready
    ) {
      return false;
    }


    if (
      typeof window.ctrAccess.isSystemAdmin ===
      "function"
    ) {

      return Boolean(
        window.ctrAccess.isSystemAdmin()
      );

    }


    if (
      typeof window.ctrAccess.getRoleCodes ===
      "function"
    ) {

      const roles =
        window.ctrAccess.getRoleCodes() || [];


      return roles.includes(
        "SYSTEM_ADMIN"
      );

    }


    return false;
  }


  function findAdministrationLinks() {

    const allLinks =
      document.querySelectorAll(
        "a"
      );


    return Array.from(
      allLinks
    )
      .filter(
        function (link) {

          const href =
            String(
              link.getAttribute(
                "href"
              ) || ""
            )
              .toLowerCase();


          const text =
            String(
              link.textContent || ""
            )
              .trim()
              .toLowerCase();


          return (
            href.includes(
              "administration.html"
            ) ||
            text ===
              "administration"
          );

        }
      );
  }


  function applyAdministrationVisibility() {

    /*
      Wait until role-access.js has
      finished loading the user's roles.
    */

    if (
      !window.ctrAccess ||
      !window.ctrAccess.ready
    ) {

      return;
    }


    const isAdmin =
      currentUserIsSystemAdmin();


    const adminLinks =
      findAdministrationLinks();


    adminLinks.forEach(
      function (link) {

        if (isAdmin) {

          link.hidden =
            false;

          link.style
            .removeProperty(
              "display"
            );

          link.removeAttribute(
            "aria-hidden"
          );

        }

        else {

          link.hidden =
            true;

          link.style.setProperty(
            "display",
            "none",
            "important"
          );

          link.setAttribute(
            "aria-hidden",
            "true"
          );

        }

      }
    );

  }


  /* -------------------------------------------------------
     ROLE ACCESS READY
  ------------------------------------------------------- */

  window.addEventListener(
    "ctr-access-ready",
    function () {

      applyAdministrationVisibility();

    }
  );


  /* -------------------------------------------------------
     NAVIGATION CAN BE CREATED DYNAMICALLY BY railway-shell.js

     MutationObserver makes sure Administration is hidden
     even if the menu is inserted after role loading.
  ------------------------------------------------------- */

  adminVisibilityObserver =
    new MutationObserver(
      function () {

        applyAdministrationVisibility();

      }
    );


  adminVisibilityObserver.observe(
    document.documentElement,
    {
      childList:
        true,

      subtree:
        true
    }
  );


  /* -------------------------------------------------------
     INITIAL CHECKS
  ------------------------------------------------------- */

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      applyAdministrationVisibility();

    }
  );


  setTimeout(
    applyAdministrationVisibility,
    200
  );


  setTimeout(
    applyAdministrationVisibility,
    600
  );


  setTimeout(
    applyAdministrationVisibility,
    1200
  );


  setTimeout(
    applyAdministrationVisibility,
    2500
  );

})();
/* =========================================================
   CTR NOTIFICATION BELL
   SYSTEM_ADMIN ONLY

   - Shows unread notification count
   - Opens full notifications.html page
   - Does NOT use dropdown
   - Existing railway header remains unchanged
========================================================= */

(function () {

  "use strict";


  let notificationRefreshTimer =
    null;


  /* =====================================================
     SUPABASE CLIENT
  ===================================================== */

  function getNotificationSupabaseClient() {

    try {

      if (
        typeof supabaseClient !==
        "undefined"
      ) {

        return supabaseClient;

      }

    }

    catch (error) {

      console.warn(
        "Notification client lookup:",
        error
      );

    }


    return null;

  }


  /* =====================================================
     SYSTEM ADMIN CHECK
  ===================================================== */

  function notificationUserIsSystemAdmin() {

    if (
      !window.ctrAccess ||
      !window.ctrAccess.ready
    ) {

      return false;

    }


    if (
      typeof window.ctrAccess
        .isSystemAdmin ===
      "function"
    ) {

      return Boolean(
        window.ctrAccess
          .isSystemAdmin()
      );

    }


    if (
      typeof window.ctrAccess
        .getRoleCodes ===
      "function"
    ) {

      const roles =
        window.ctrAccess
          .getRoleCodes() ||
        [];


      return roles.includes(
        "SYSTEM_ADMIN"
      );

    }


    return false;

  }


  /* =====================================================
     STYLES
  ===================================================== */

  function injectNotificationBellStyles() {

    if (
      document.getElementById(
        "ctrNotificationBellStyles"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "ctrNotificationBellStyles";


    style.textContent = `

      #ctrRailwayHeader
      .ctr-header-user {

        position:
          relative !important;

        min-height:
          44px !important;

        padding-left:
          54px !important;
      }


      #ctrNotificationBell {

        position:
          absolute;

        top:
          50%;

        left:
          8px;

        transform:
          translateY(-50%);

        width:
          36px;

        height:
          36px;

        display:
          inline-flex;

        align-items:
          center;

        justify-content:
          center;

        padding:
          0;

        border:
          1px solid #c5d1dc;

        border-radius:
          4px;

        background:
          #ffffff;

        color:
          #173e6e;

        cursor:
          pointer;

        font-size:
          17px;

        line-height:
          1;

        box-shadow:
          none;
      }


      #ctrNotificationBell:hover {

        border-color:
          #8ca2b7;

        background:
          #edf3f8;
      }


      #ctrNotificationBell:focus {

        outline:
          2px solid
          rgba(
            23,
            62,
            110,
            0.20
          );

        outline-offset:
          2px;
      }


      #ctrNotificationUnreadBadge {

        position:
          absolute;

        top:
          -6px;

        right:
          -6px;

        min-width:
          19px;

        height:
          19px;

        display:
          inline-flex;

        align-items:
          center;

        justify-content:
          center;

        padding:
          0 5px;

        border:
          2px solid #ffffff;

        border-radius:
          20px;

        background:
          #c62828;

        color:
          #ffffff;

        font-size:
          9px;

        font-weight:
          700;

        line-height:
          1;
      }


      #ctrNotificationUnreadBadge[hidden] {

        display:
          none !important;
      }


      @media
      (max-width: 760px) {

        #ctrRailwayHeader
        .ctr-header-user {

          display:
            block !important;

          min-width:
            46px !important;

          width:
            46px !important;

          padding:
            0 !important;

          border-left:
            0 !important;
        }


        #ctrRailwayHeader
        .ctr-header-user
        > strong,

        #ctrRailwayHeader
        .ctr-header-user
        > span {

          display:
            none !important;
        }


        #ctrNotificationBell {

          position:
            relative;

          top:
            auto;

          left:
            auto;

          transform:
            none;

          margin:
            2px 4px;
        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =====================================================
     CREATE BELL
  ===================================================== */

  function createNotificationBell() {

    const userArea =
      document.querySelector(
        "#ctrRailwayHeader .ctr-header-user"
      );


    if (!userArea) {

      return null;

    }


    let bell =
      document.getElementById(
        "ctrNotificationBell"
      );


    if (bell) {

      return bell;

    }


    bell =
      document.createElement(
        "button"
      );


    bell.id =
      "ctrNotificationBell";


    bell.type =
      "button";


    bell.title =
      "Notifications & Activity";


    bell.setAttribute(
      "aria-label",
      "Open Notifications and Activity"
    );


    bell.hidden =
      true;


    bell.innerHTML = `

      <span aria-hidden="true">
        🔔
      </span>

      <span
        id="ctrNotificationUnreadBadge"
        hidden
      ></span>

    `;


    bell.addEventListener(
      "click",
      function () {

        window.location.href =
          "notifications.html";

      }
    );


    userArea.prepend(
      bell
    );


    return bell;

  }


  /* =====================================================
     UPDATE BADGE
  ===================================================== */

  async function updateNotificationBell() {

    const bell =
      createNotificationBell();


    if (!bell) {

      return;

    }


    const isAdmin =
      notificationUserIsSystemAdmin();


    if (!isAdmin) {

      bell.hidden =
        true;


      bell.style
        .setProperty(
          "display",
          "none",
          "important"
        );


      return;

    }


    bell.hidden =
      false;


    bell.style
      .removeProperty(
        "display"
      );


    const badge =
      document.getElementById(
        "ctrNotificationUnreadBadge"
      );


    const client =
      getNotificationSupabaseClient();


    if (
      !client ||
      !badge
    ) {

      return;

    }


    try {

      const {
        count,
        error
      } =
        await client
          .from(
            "notifications"
          )
          .select(
            "id",
            {
              count:
                "exact",

              head:
                true
            }
          )
          .eq(
            "is_read",
            false
          );


      if (error) {

        throw error;

      }


      const unread =
        Number(
          count ||
          0
        );


      if (
        unread > 0
      ) {

        badge.hidden =
          false;


        badge.textContent =
          unread > 99
            ? "99+"
            : String(
                unread
              );


        bell.title =
          `${unread} unread notification${unread === 1 ? "" : "s"}`;

      }

      else {

        badge.hidden =
          true;

        badge.textContent =
          "";


        bell.title =
          "Notifications & Activity";

      }

    }

    catch (error) {

      console.error(
        "Notification badge load error:",
        error
      );

    }

  }


  /* =====================================================
     AUTO REFRESH
  ===================================================== */

  function startNotificationBellRefresh() {

    if (
      notificationRefreshTimer
    ) {

      return;

    }


    notificationRefreshTimer =
      window.setInterval(
        function () {

          if (
            document.visibilityState ===
            "visible"
          ) {

            updateNotificationBell();

          }

        },
        30000
      );

  }


  /* =====================================================
     INITIALIZE
  ===================================================== */

  function initializeNotificationBell() {

    injectNotificationBellStyles();

    createNotificationBell();

    updateNotificationBell();

    startNotificationBellRefresh();

  }


  /* =====================================================
     ROLE ACCESS READY
  ===================================================== */

  window.addEventListener(
    "ctr-access-ready",
    function () {

      initializeNotificationBell();

    }
  );


  /* =====================================================
     PAGE SHOW
  ===================================================== */

  window.addEventListener(
    "pageshow",
    function () {

      updateNotificationBell();

    }
  );


  /* =====================================================
     RETURN TO TAB
  ===================================================== */

  document.addEventListener(
    "visibilitychange",
    function () {

      if (
        document.visibilityState ===
        "visible"
      ) {

        updateNotificationBell();

      }

    }
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
      function () {

        initializeNotificationBell();

      }
    );

  }

  else {

    initializeNotificationBell();

  }

})();
/* =========================================================
   FIX NOTIFICATION BELL POSITION
   Bell + User information in one clean row
========================================================= */

(function () {

  const style =
    document.createElement("style");

  style.id =
    "ctrNotificationBellPositionFix";

  style.textContent = `

    /* Give right-side user area enough width */

    #ctrRailwayHeader
    .ctr-main-navigation {

      grid-template-columns:
        175px
        minmax(0, 1fr)
        205px !important;
    }


    /* User block becomes proper two-column layout */

    #ctrRailwayHeader
    .ctr-header-user {

      position:
        relative !important;

      display:
        grid !important;

      grid-template-columns:
        40px
        minmax(0, 1fr);

      grid-template-rows:
        auto
        auto;

      align-items:
        center;

      column-gap:
        9px;

      min-width:
        0 !important;

      min-height:
        46px !important;

      padding:
        4px 0 4px 12px !important;

      border-left:
        1px solid #d1d8df !important;
    }


    /* Bell */

    #ctrNotificationBell {

      position:
        relative !important;

      top:
        auto !important;

      left:
        auto !important;

      right:
        auto !important;

      bottom:
        auto !important;

      transform:
        none !important;

      grid-column:
        1;

      grid-row:
        1 / 3;

      align-self:
        center;

      justify-self:
        start;

      width:
        36px !important;

      height:
        36px !important;

      margin:
        0 !important;
    }


    /* User name */

    #ctrRailwayHeader
    .ctr-header-user
    > strong {

      grid-column:
        2;

      grid-row:
        1;

      align-self:
        end;

      width:
        100%;

      margin:
        0 !important;

      overflow:
        hidden;

      text-overflow:
        ellipsis;

      white-space:
        nowrap;
    }


    /* Designation */

    #ctrRailwayHeader
    .ctr-header-user
    > span {

      grid-column:
        2;

      grid-row:
        2;

      align-self:
        start;

      width:
        100%;

      margin-top:
        2px !important;

      overflow:
        hidden;

      text-overflow:
        ellipsis;

      white-space:
        nowrap;
    }


    /* Medium screen */

    @media
    (max-width: 1120px) {

      #ctrRailwayHeader
      .ctr-main-navigation {

        grid-template-columns:
          155px
          minmax(0, 1fr)
          190px !important;
      }

    }


    /* Mobile */

    @media
    (max-width: 760px) {

      #ctrRailwayHeader
      .ctr-main-navigation {

        display:
          flex !important;
      }


      #ctrRailwayHeader
      .ctr-nav-links {

        flex:
          1 1 auto;
      }


      #ctrRailwayHeader
      .ctr-header-user {

        display:
          block !important;

        flex:
          0 0 44px;

        width:
          44px !important;

        min-height:
          40px !important;

        padding:
          2px 3px !important;

        border-left:
          1px solid #d1d8df !important;
      }


      #ctrRailwayHeader
      .ctr-header-user
      > strong,

      #ctrRailwayHeader
      .ctr-header-user
      > span {

        display:
          none !important;
      }


      #ctrNotificationBell {

        display:
          inline-flex !important;

        width:
          36px !important;

        height:
          36px !important;
      }

    }

  `;


  document.head.appendChild(
    style
  );

})();