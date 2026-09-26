/* =========================================================
   CTR MANAGEMENT SYSTEM
   STATION CONTEXT - SUPABASE VERSION
========================================================= */


/* =========================================================
   GET STATION ID FROM URL
========================================================= */

const stationParams =
  new URLSearchParams(
    window.location.search
  );


const selectedStationId =
  stationParams.get("id");


/*
  Important:
  station.js needs station ID immediately
  for its draft storage key.
*/

if (selectedStationId) {

  document.body.dataset.stationId =
    selectedStationId;

}


/* =========================================================
   LOAD STATION FROM SUPABASE
========================================================= */

async function loadStationContext() {

  if (!selectedStationId) {

    console.error(
      "No station ID supplied."
    );


    window.location.replace(
      "stations.html"
    );

    return;

  }


  try {

    const {
      data: station,
      error
    } =
      await supabaseClient
        .from("stations")
        .select(
          `
            id,
            station_name,
            station_code,
            sectional_incharge_designation,
            division,
            ctr_status,
            current_version,
            is_active
          `
        )
        .eq(
          "id",
          selectedStationId
        )
        .eq(
          "is_active",
          true
        )
        .single();


    if (error) {
      throw error;
    }


    if (!station) {

      throw new Error(
        "Station record not found."
      );

    }


    /* =====================================================
       DOCUMENT TITLE
    ====================================================== */

    document.title =
      `${station.station_name} CTR | CTR Management`


    /* =====================================================
       TOPBAR
    ====================================================== */

    const topbarTitle =
      document.querySelector(
        ".topbar h1"
      );


    if (topbarTitle) {

      topbarTitle.textContent =
        `${station.station_name} CTR`;

    }


    /* =====================================================
       HERO TITLE
    ====================================================== */

    const heroTitle =
      document.querySelector(
        ".station-hero h2"
      );


    if (heroTitle) {

      heroTitle.textContent =
        station.station_name;

    }


    /* =====================================================
       HERO DESCRIPTION
    ====================================================== */

    const heroDescription =
      document.querySelector(
        ".station-hero p"
      );


    if (heroDescription) {

      const details = [];


      if (station.station_code) {

        details.push(
          `Code: ${station.station_code}`
        );

      }


      if (
        station.sectional_incharge_designation
      ) {

        details.push(
          `Sectional Incharge: ${station.sectional_incharge_designation}`
        );

      }


      if (station.division) {

        details.push(
          `Division: ${station.division}`
        );

      }


      heroDescription.textContent =
        details.length
          ? details.join(" • ")
          : "Station CTR engineering record.";

    }


    /* =====================================================
       SUMMARY CARDS
    ====================================================== */

    const summaryCards =
      document.querySelectorAll(
        ".summary-card"
      );


    /*
      First summary card = station
    */

    if (summaryCards[0]) {

      const stationValue =
        summaryCards[0]
          .querySelector("strong");


      if (stationValue) {

        stationValue.textContent =
          station.station_name;

      }

    }


    /*
      Status card
    */

    const statusLabels = {

      INITIAL_SETUP:
        "Initial Setup",

      DRAFT:
        "Draft",

      BASELINE_APPROVED:
        "Baseline Approved",

      UNDER_ALTERATION:
        "Under Alteration",

      UNDER_APPROVAL:
        "Under Approval",

      APPROVED:
        "Approved"

    };


    summaryCards.forEach(
      function (card) {

        const label =
          card.querySelector("span");

        const value =
          card.querySelector("strong");


        if (
          label &&
          value &&
          label.textContent
            .toLowerCase()
            .includes("status")
        ) {

          value.textContent =
            statusLabels[
              station.ctr_status
            ] ||
            station.ctr_status;

        }

      }
    );


    console.log(
      "Current CTR Station:",
      station
    );

  }

  catch (error) {

    console.error(
      "Station context error:",
      error
    );


    alert(
      "Station could not be loaded."
    );


    window.location.replace(
      "stations.html"
    );

  }

}


/* =========================================================
   START
========================================================= */

loadStationContext();