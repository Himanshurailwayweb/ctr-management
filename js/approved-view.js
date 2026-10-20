/* =========================================================
   CTR MANAGEMENT SYSTEM
   APPROVED CTR READ-ONLY VIEW

   PURPOSE
   ---------------------------------------------------------
   - Load one approved CTR version from ctr_versions.
   - Read the immutable ctr_snapshot.
   - Never load the live ctr_drafts record.
   - Never allow editing from this page.
========================================================= */

(() => {

  "use strict";


  /* =======================================================
     STATE
  ======================================================= */

  const approvedViewState = {

    started: false,

    stationId: null,

    versionId: null,

    versionNumber: null,

    versionRecord: null,

    stationRecord: null,

    snapshot: null

  };


  /* =======================================================
     DOM
  ======================================================= */

  const approvedViewTitle =
    document.getElementById(
      "approvedViewTitle"
    );


  const approvedViewHeroStatus =
    document.getElementById(
      "approvedViewHeroStatus"
    );


  const approvedViewStatus =
    document.getElementById(
      "approvedViewStatus"
    );


  const approvedViewStation =
    document.getElementById(
      "approvedViewStation"
    );


  const approvedViewStationCode =
    document.getElementById(
      "approvedViewStationCode"
    );


  const approvedViewVersion =
    document.getElementById(
      "approvedViewVersion"
    );


  const approvedViewRecordStatus =
    document.getElementById(
      "approvedViewRecordStatus"
    );


  const approvedViewSource =
    document.getElementById(
      "approvedViewSource"
    );


  const approvedViewFinalizedAt =
    document.getElementById(
      "approvedViewFinalizedAt"
    );


  const approvedViewSigned =
    document.getElementById(
      "approvedViewSigned"
    );


  const approvedViewApprovedBy =
    document.getElementById(
      "approvedViewApprovedBy"
    );


  const approvedSnapshotDrawing =
    document.getElementById(
      "approvedSnapshotDrawing"
    );


  const approvedSnapshotStructure =
    document.getElementById(
      "approvedSnapshotStructure"
    );


  /* =======================================================
     URL PARAMETERS
  ======================================================= */

  function readUrlParameters() {

    const params =
      new URLSearchParams(
        window.location.search
      );


    approvedViewState.versionId =
      params.get("versionId") ||
      params.get("version_id") ||
      null;


    approvedViewState.stationId =
      params.get("station") ||
      params.get("stationId") ||
      null;


    const versionValue =
      params.get("version") ||
      params.get("v");


    approvedViewState.versionNumber =
      versionValue
        ? Number(versionValue)
        : null;

  }


  /* =======================================================
     STATUS
  ======================================================= */

  function setPageStatus(
    message,
    type = "info"
  ) {

    if (!approvedViewStatus) {
      return;
    }


    if (!message) {

      approvedViewStatus.hidden =
        true;

      approvedViewStatus.textContent =
        "";

      return;

    }


    approvedViewStatus.hidden =
      false;


    approvedViewStatus.textContent =
      message;


    approvedViewStatus.dataset.type =
      type;

  }


  /* =======================================================
     LOAD VERSION
  ======================================================= */

  async function loadApprovedVersion() {

    let query =
      supabaseClient
        .from(
          "ctr_versions"
        )
        .select(
          `
            id,
            station_id,
            version_number,
            version_label,
            source_type,
            status,
            previous_version_id,
            ctr_snapshot,
            pdf_path,
            digitally_signed,
            signed_by,
            signed_at,
            finalized_at,
            created_at
          `
        );


    /* -----------------------------------------------------
       Prefer exact version ID when available
    ----------------------------------------------------- */

    if (
      approvedViewState.versionId
    ) {

      query =
        query.eq(
          "id",
          approvedViewState.versionId
        );

    }

    else {

      if (
        !approvedViewState.stationId ||
        !Number.isFinite(
          approvedViewState.versionNumber
        )
      ) {

        throw new Error(
          "Approved CTR version reference is missing."
        );

      }


      query =
        query
          .eq(
            "station_id",
            approvedViewState.stationId
          )
          .eq(
            "version_number",
            approvedViewState.versionNumber
          );

    }


    const {
      data,
      error
    } =
      await query
        .limit(1)
        .maybeSingle();


    if (error) {
      throw error;
    }


    if (!data) {

      throw new Error(
        "Approved CTR version was not found."
      );

    }


    approvedViewState.versionRecord =
      data;


    approvedViewState.stationId =
      data.station_id;


    approvedViewState.versionNumber =
      Number(
        data.version_number
      );


    approvedViewState.snapshot =
      data.ctr_snapshot || null;

  }


  /* =======================================================
     LOAD STATION
  ======================================================= */

  async function loadStationRecord() {

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
            division,
            sectional_incharge_designation
          `
        )
        .eq(
          "id",
          approvedViewState.stationId
        )
        .maybeSingle();


    if (error) {
      throw error;
    }


    approvedViewState.stationRecord =
      data || {};

  }


  /* =======================================================
     SNAPSHOT HELPERS
  ======================================================= */

  function getDrawingData() {

    const snapshot =
      approvedViewState.snapshot;


    if (
      !snapshot ||
      typeof snapshot !== "object"
    ) {

      return null;

    }


    /*
      Current approved versions store the actual
      station drawing inside ctr_snapshot.drawing.
    */

    if (
      snapshot.drawing &&
      typeof snapshot.drawing === "object"
    ) {

      return snapshot.drawing;

    }


    /*
      Backward compatibility for older versions.
    */

    if (
      snapshot.stationCtrRacks ||
      snapshot.connectedEnds
    ) {

      return snapshot;

    }


    if (
      snapshot.draft_data &&
      typeof snapshot.draft_data === "object"
    ) {

      return snapshot.draft_data;

    }


    return null;

  }


  function getStationRacks() {

    const drawing =
      getDrawingData();


    return Array.isArray(
      drawing?.stationCtrRacks
    )
      ? drawing.stationCtrRacks
      : [];

  }


  function getConnectedEnds() {

    const drawing =
      getDrawingData();


    return Array.isArray(
      drawing?.connectedEnds
    )
      ? drawing.connectedEnds
      : [];

  }


  /* =======================================================
     RECORD INFORMATION
  ======================================================= */

  function renderRecordInformation() {

    const record =
      approvedViewState.versionRecord || {};


    const station =
      approvedViewState.stationRecord || {};


    const stationName =
      displayValue(
        station.station_name
      );


    const stationCode =
      displayValue(
        station.station_code
      );


    const versionLabel =
      record.version_label ||
      (
        record.version_number
          ? `V${record.version_number}`
          : "—"
      );


    if (
      approvedViewTitle
    ) {

      approvedViewTitle.textContent =
        `${stationName} (${stationCode}) — ${versionLabel}`;

    }


    setText(
      approvedViewStation,
      stationName
    );


    setText(
      approvedViewStationCode,
      stationCode
    );


    setText(
      approvedViewVersion,
      versionLabel
    );


    setText(
      approvedViewRecordStatus,
      displayValue(
        record.status
      )
    );


    setText(
      approvedViewSource,
      formatSourceType(
        record.source_type
      )
    );


    setText(
      approvedViewFinalizedAt,
      formatDateTime(
        record.finalized_at ||
        record.created_at
      )
    );


    setText(
      approvedViewSigned,
      record.digitally_signed
        ? "Yes"
        : "No"
    );


    /*
      signed_by may be a UUID.

      We do not display a raw internal user UUID as
      an officer name.
    */

    setText(
      approvedViewApprovedBy,
      getReadableApprover(
        record.signed_by
      )
    );


    if (
      approvedViewHeroStatus
    ) {

      approvedViewHeroStatus.textContent =
        `● ${displayValue(
          record.status
        )}`;

    }

  }


  /* =======================================================
     MAIN DRAWING
  ======================================================= */

  function renderApprovedDrawing() {

    if (
      !approvedSnapshotDrawing
    ) {
      return;
    }


    const racks =
      getStationRacks();


    const ends =
      getConnectedEnds();


    if (
      racks.length === 0 &&
      ends.length === 0
    ) {

      approvedSnapshotDrawing.innerHTML =
        `
          <div class="approval-empty">

            <strong>
              No drawing data stored
            </strong>

            <p>
              This approved version does not contain
              station CTR drawing data.
            </p>

          </div>
        `;

      return;

    }


    approvedSnapshotDrawing.innerHTML =
      "";


    const station =
      approvedViewState.stationRecord || {};


    /* -----------------------------------------------------
       STATION RACK DRAWINGS
    ----------------------------------------------------- */

    racks.forEach(
      function (
        rack,
        rackIndex
      ) {

        const wrapper =
          document.createElement(
            "section"
          );


        wrapper.style.marginBottom =
          "26px";


        wrapper.innerHTML =
          `
            <div
              style="
                margin-bottom: 10px;
                font-weight: 700;
                color: #0c2d53;
              "
            >
              ${escapeHtml(
                displayValue(
                  station.station_name
                )
              )}
              STATION —
              ${escapeHtml(
                rack.name ||
                `K${rackIndex + 1}`
              )}
            </div>
          `;


        wrapper.appendChild(
          createRackSvg(
            rack
          )
        );


        approvedSnapshotDrawing.appendChild(
          wrapper
        );

      }
    );


    /* -----------------------------------------------------
       CONNECTED ENDS
    ----------------------------------------------------- */

    if (
      ends.length > 0
    ) {

      const endHeading =
        document.createElement(
          "div"
        );


      endHeading.style.cssText =
        `
          margin-top: 32px;
          margin-bottom: 14px;
          padding-top: 20px;
          border-top: 1px solid #dbe3ed;
          font-size: 16px;
          font-weight: 700;
          color: #0c2d53;
        `;


      endHeading.textContent =
        "Connected Ends / Location Boxes";


      approvedSnapshotDrawing.appendChild(
        endHeading
      );


      ends.forEach(
        function (
          end,
          endIndex
        ) {

          const endCard =
            document.createElement(
              "div"
            );


          endCard.style.cssText =
            `
              border: 1px solid #dbe3ed;
              border-radius: 6px;
              padding: 16px;
              margin-bottom: 14px;
              background: #f9fbfd;
            `;


          const locations =
            Array.isArray(
              end.locations
            )
              ? end.locations
              : [];


          endCard.innerHTML =
            `
              <strong
                style="
                  color: #0c2d53;
                  font-size: 15px;
                "
              >
                ${escapeHtml(
                  end.name ||
                  `Connected End ${endIndex + 1}`
                )}
              </strong>

              <div
                style="
                  margin-top: 5px;
                  color: #60758a;
                  font-size: 12px;
                "
              >
                ${locations.length}
                Location Box${locations.length === 1 ? "" : "es"}
              </div>
            `;


          locations.forEach(
            function (
              location,
              locationIndex
            ) {

              const locationBlock =
                document.createElement(
                  "div"
                );


              locationBlock.style.cssText =
                `
                  margin-top: 14px;
                  padding-top: 14px;
                  border-top: 1px solid #e1e8f0;
                `;


              const title =
                document.createElement(
                  "div"
                );


              title.style.cssText =
                `
                  font-weight: 700;
                  color: #173e6e;
                  margin-bottom: 10px;
                `;


              title.textContent =
                location.name ||
                `Location Box ${locationIndex + 1}`;


              locationBlock.appendChild(
                title
              );


              const locationRacks =
                Array.isArray(
                  location.racks
                )
                  ? location.racks
                  : [];


              locationRacks.forEach(
                function (rack) {

                  locationBlock.appendChild(
                    createRackSvg(
                      rack
                    )
                  );

                }
              );


              endCard.appendChild(
                locationBlock
              );

            }
          );


          approvedSnapshotDrawing.appendChild(
            endCard
          );

        }
      );

    }

  }


  /* =======================================================
     SVG RACK DRAWING
  ======================================================= */

  function createRackSvg(
    rack
  ) {

    const rows =
      Array.isArray(
        rack?.rows
      )
        ? rack.rows
        : [];


    const maxTerminals =
      rows.reduce(
        function (
          highest,
          row
        ) {

          const count =
            Array.isArray(
              row?.terminals
            )
              ? row.terminals.length
              : 0;


          return Math.max(
            highest,
            count
          );

        },
        0
      );


    const width =
      Math.max(
        900,
        150 +
        (
          maxTerminals *
          52
        )
      );


    const height =
      Math.max(
        160,
        80 +
        (
          rows.length *
          120
        )
      );


    const svgNamespace =
      "http://www.w3.org/2000/svg";


    const svg =
      document.createElementNS(
        svgNamespace,
        "svg"
      );


    svg.setAttribute(
      "viewBox",
      `0 0 ${width} ${height}`
    );


    svg.setAttribute(
      "width",
      "100%"
    );


    svg.style.minWidth =
      `${Math.min(
        width,
        900
      )}px`;


    svg.style.background =
      "#ffffff";


    svg.style.border =
      "1px solid #dbe3ed";


    svg.style.borderRadius =
      "4px";


    /* -----------------------------------------------------
       RACK NAME
    ----------------------------------------------------- */

    addSvgText(
      svg,
      width / 2,
      30,
      rack?.name || "CTR Rack",
      {
        anchor: "middle",
        weight: "700",
        size: "14"
      }
    );


    /* -----------------------------------------------------
       ROWS + TERMINALS
    ----------------------------------------------------- */

    rows.forEach(
      function (
        row,
        rowIndex
      ) {

        const y =
          80 +
          (
            rowIndex *
            120
          );


        addSvgText(
          svg,
          35,
          y + 20,
          row.label ||
          String(
            rowIndex + 1
          ),
          {
            weight: "700",
            size: "14"
          }
        );


        const terminals =
          Array.isArray(
            row.terminals
          )
            ? row.terminals
            : [];


        terminals.forEach(
          function (
            terminal,
            terminalIndex
          ) {

            const x =
              110 +
              (
                terminalIndex *
                52
              );


            const topY =
              y;


            const bottomY =
              y + 40;


            /* vertical terminal line */

            const line =
              document.createElementNS(
                svgNamespace,
                "line"
              );


            line.setAttribute(
              "x1",
              x
            );


            line.setAttribute(
              "y1",
              topY
            );


            line.setAttribute(
              "x2",
              x
            );


            line.setAttribute(
              "y2",
              bottomY
            );


            line.setAttribute(
              "stroke",
              "#111111"
            );


            line.setAttribute(
              "stroke-width",
              "1.3"
            );


            svg.appendChild(
              line
            );


            addSvgCircle(
              svg,
              x,
              topY,
              4
            );


            addSvgCircle(
              svg,
              x,
              bottomY,
              4
            );


            addSvgText(
              svg,
              x + 11,
              y + 24,
              displayTerminalNumber(
                terminal,
                terminalIndex
              ),
              {
                size: "10",
                weight: "600"
              }
            );


            /*
              Display circuit particulars only when
              meaningful data exists.
            */

            const particular =
              String(
                terminal?.particular ||
                ""
              )
                .trim();


            if (
              particular
            ) {

              addSvgText(
                svg,
                x,
                y + 62,
                particular,
                {
                  anchor: "middle",
                  size: "8"
                }
              );

            }

          }
        );

      }
    );


    return svg;

  }


  function addSvgCircle(
    svg,
    x,
    y,
    radius
  ) {

    const circle =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );


    circle.setAttribute(
      "cx",
      x
    );


    circle.setAttribute(
      "cy",
      y
    );


    circle.setAttribute(
      "r",
      radius
    );


    circle.setAttribute(
      "fill",
      "#ffffff"
    );


    circle.setAttribute(
      "stroke",
      "#111111"
    );


    circle.setAttribute(
      "stroke-width",
      "1.2"
    );


    svg.appendChild(
      circle
    );

  }


  function addSvgText(
    svg,
    x,
    y,
    value,
    options = {}
  ) {

    const text =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );


    text.setAttribute(
      "x",
      x
    );


    text.setAttribute(
      "y",
      y
    );


    text.setAttribute(
      "fill",
      "#0b1725"
    );


    text.setAttribute(
      "font-family",
      "Arial, sans-serif"
    );


    text.setAttribute(
      "font-size",
      options.size || "11"
    );


    text.setAttribute(
      "font-weight",
      options.weight || "400"
    );


    if (
      options.anchor
    ) {

      text.setAttribute(
        "text-anchor",
        options.anchor
      );

    }


    text.textContent =
      String(
        value ?? ""
      );


    svg.appendChild(
      text
    );

  }


  /* =======================================================
     STRUCTURE VIEW
  ======================================================= */

  function renderApprovedStructure() {

    if (
      !approvedSnapshotStructure
    ) {
      return;
    }


    approvedSnapshotStructure.innerHTML =
      "";


    const racks =
      getStationRacks();


    const ends =
      getConnectedEnds();


    if (
      racks.length === 0 &&
      ends.length === 0
    ) {

      approvedSnapshotStructure.innerHTML =
        `
          <div class="approval-empty">

            <strong>
              No CTR structure available
            </strong>

          </div>
        `;

      return;

    }


    racks.forEach(
      function (
        rack,
        rackIndex
      ) {

        approvedSnapshotStructure.appendChild(
          createRackStructureCard(
            rack,
            `Station CTR — ${
              rack.name ||
              `K${rackIndex + 1}`
            }`
          )
        );

      }
    );


    ends.forEach(
      function (
        end,
        endIndex
      ) {

        const endSection =
          document.createElement(
            "section"
          );


        endSection.style.cssText =
          `
            margin-top: 24px;
            border: 1px solid #cfd9e5;
            border-radius: 6px;
            background: #ffffff;
            padding: 18px;
          `;


        const locations =
          Array.isArray(
            end.locations
          )
            ? end.locations
            : [];


        endSection.innerHTML =
          `
            <div
              style="
                margin-bottom: 14px;
              "
            >

              <span
                style="
                  color: #2563eb;
                  font-size: 11px;
                  font-weight: 700;
                  letter-spacing: .08em;
                "
              >
                CONNECTED END
              </span>

              <h3
                style="
                  margin: 5px 0;
                  color: #0c2d53;
                "
              >
                ${escapeHtml(
                  end.name ||
                  `Connected End ${endIndex + 1}`
                )}
              </h3>

              <small>
                ${locations.length}
                location box${locations.length === 1 ? "" : "es"}
              </small>

            </div>
          `;


        locations.forEach(
          function (
            location,
            locationIndex
          ) {

            const locationTitle =
              document.createElement(
                "h4"
              );


            locationTitle.style.cssText =
              `
                margin:
                  20px 0 10px;
                color: #173e6e;
              `;


            locationTitle.textContent =
              location.name ||
              `Location Box ${locationIndex + 1}`;


            endSection.appendChild(
              locationTitle
            );


            const locationRacks =
              Array.isArray(
                location.racks
              )
                ? location.racks
                : [];


            locationRacks.forEach(
              function (
                rack,
                rackIndex
              ) {

                endSection.appendChild(
                  createRackStructureCard(
                    rack,
                    `${
                      location.name ||
                      `Location Box ${locationIndex + 1}`
                    } — ${
                      rack.name ||
                      `K${rackIndex + 1}`
                    }`
                  )
                );

              }
            );

          }
        );


        approvedSnapshotStructure.appendChild(
          endSection
        );

      }
    );

  }


  /* =======================================================
     RACK STRUCTURE CARD
  ======================================================= */

  function createRackStructureCard(
    rack,
    title
  ) {

    const card =
      document.createElement(
        "section"
      );


    card.style.cssText =
      `
        margin-bottom: 18px;
        border: 1px solid #dbe3ed;
        border-radius: 6px;
        background: #ffffff;
        overflow: hidden;
      `;


    const header =
      document.createElement(
        "div"
      );


    header.style.cssText =
      `
        padding: 14px 16px;
        background: #f4f7fb;
        border-bottom: 1px solid #dbe3ed;
      `;


    header.innerHTML =
      `
        <strong
          style="
            color: #0c2d53;
          "
        >
          ${escapeHtml(title)}
        </strong>
      `;


    card.appendChild(
      header
    );


    /* -----------------------------------------------------
       FUSE DETAILS
    ----------------------------------------------------- */

    const fuseDetails =
      Array.isArray(
        rack?.fuseDetails
      )
        ? rack.fuseDetails
        : Array.isArray(
            rack?.fuses
          )
          ? rack.fuses
          : [];


    if (
      fuseDetails.length > 0
    ) {

      const fuseRow =
        document.createElement(
          "div"
        );


      fuseRow.style.cssText =
        `
          padding: 12px 16px;
          border-bottom: 1px solid #e4eaf1;
          font-size: 12px;
        `;


      fuseRow.innerHTML =
        `
          <strong>
            Fuse:
          </strong>

          ${escapeHtml(
            fuseDetails
              .map(
                getFuseDisplayText
              )
              .join(", ")
          )}
        `;


      card.appendChild(
        fuseRow
      );

    }


    const rows =
      Array.isArray(
        rack?.rows
      )
        ? rack.rows
        : [];


    if (
      rows.length === 0
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.style.padding =
        "16px";


      empty.textContent =
        "No rows stored in this rack.";


      card.appendChild(
        empty
      );


      return card;

    }


    rows.forEach(
      function (
        row,
        rowIndex
      ) {

        const rowSection =
          document.createElement(
            "div"
          );


        rowSection.style.padding =
          "14px 16px";


        if (
          rowIndex > 0
        ) {

          rowSection.style.borderTop =
            "1px solid #e4eaf1";

        }


        const rowTitle =
          document.createElement(
            "strong"
          );


        rowTitle.style.cssText =
          `
            display: block;
            margin-bottom: 10px;
            color: #173e6e;
          `;


        rowTitle.textContent =
          `Row ${
            row?.label ||
            rowIndex + 1
          }`;


        rowSection.appendChild(
          rowTitle
        );


        const terminals =
          Array.isArray(
            row?.terminals
          )
            ? row.terminals
            : [];


        const tableWrap =
          document.createElement(
            "div"
          );


        tableWrap.style.overflowX =
          "auto";


        const table =
          document.createElement(
            "table"
          );


        table.style.cssText =
          `
            width: 100%;
            border-collapse: collapse;
            min-width: 760px;
            font-size: 12px;
          `;


        table.innerHTML =
          `
            <thead>

              <tr>

                <th>Terminal</th>

                <th>Status</th>

                <th>Particular</th>

                <th>Location Box</th>

                <th>Location Terminal</th>

                <th>Remarks</th>

              </tr>

            </thead>

            <tbody>

              ${
                terminals
                  .map(
                    function (
                      terminal,
                      terminalIndex
                    ) {

                      return `
                        <tr>

                          <td>
                            ${escapeHtml(
                              displayTerminalNumber(
                                terminal,
                                terminalIndex
                              )
                            )}
                          </td>

                          <td>
                            ${escapeHtml(
                              displayValue(
                                terminal.status
                              )
                            )}
                          </td>

                          <td>
                            ${escapeHtml(
                              displayValue(
                                terminal.particular
                              )
                            )}
                          </td>

                          <td>
                            ${escapeHtml(
                              displayValue(
                                terminal.locationBox
                              )
                            )}
                          </td>

                          <td>
                            ${escapeHtml(
                              displayValue(
                                terminal.locationTerminal
                              )
                            )}
                          </td>

                          <td>
                            ${escapeHtml(
                              displayValue(
                                terminal.remarks
                              )
                            )}
                          </td>

                        </tr>
                      `;

                    }
                  )
                  .join("")
              }

            </tbody>
          `;


        /*
          Small local styling so this viewer does not
          depend on editable station-table classes.
        */

        table
          .querySelectorAll(
            "th"
          )
          .forEach(
            function (cell) {

              cell.style.cssText =
                `
                  text-align: left;
                  padding: 8px;
                  background: #edf2f7;
                  border: 1px solid #dbe3ed;
                  color: #0c2d53;
                `;

            }
          );


        table
          .querySelectorAll(
            "td"
          )
          .forEach(
            function (cell) {

              cell.style.cssText =
                `
                  padding: 8px;
                  border: 1px solid #dbe3ed;
                  vertical-align: top;
                `;

            }
          );


        tableWrap.appendChild(
          table
        );


        rowSection.appendChild(
          tableWrap
        );


        card.appendChild(
          rowSection
        );

      }
    );


    return card;

  }


  /* =======================================================
     UTILITY
  ======================================================= */

  function setText(
    element,
    value
  ) {

    if (!element) {
      return;
    }


    element.textContent =
      displayValue(
        value
      );

  }


  function displayValue(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {

      return "—";

    }


    return String(value);

  }


  function formatSourceType(
    value
  ) {

    const source =
      String(
        value || ""
      )
        .trim()
        .toUpperCase();


    if (
      source === "BASELINE"
    ) {

      return "Baseline";

    }


    if (
      source === "ALTERATION"
    ) {

      return "Alteration";

    }


    if (
      source === "CORRECTION"
    ) {

      return "Correction";

    }


    return displayValue(
      value
    );

  }


  function formatDateTime(
    value
  ) {

    if (!value) {
      return "—";
    }


    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "—";

    }


    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    )
      .format(
        date
      );

  }


  function displayTerminalNumber(
    terminal,
    index
  ) {

    const number =
      terminal?.number;


    if (
      number !== null &&
      number !== undefined &&
      String(number).trim() !== ""
    ) {

      const numeric =
        Number(number);


      if (
        Number.isFinite(
          numeric
        )
      ) {

        return String(
          numeric
        );

      }


      return String(
        number
      );

    }


    return String(
      index + 1
    );

  }


  function getFuseDisplayText(
    fuse,
    index
  ) {

    if (
      fuse === null ||
      fuse === undefined
    ) {

      return `Fuse ${index + 1}`;

    }


    if (
      typeof fuse !== "object"
    ) {

      return String(fuse);

    }


    return (
      fuse.label ||
      fuse.name ||
      fuse.number ||
      fuse.rating ||
      `Fuse ${index + 1}`
    );

  }


  function getReadableApprover(
    value
  ) {

    if (!value) {
      return "—";
    }


    const text =
      String(value)
        .trim();


    /*
      Do not expose an internal Supabase UUID
      as if it were an officer name.
    */

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


    if (
      uuidPattern.test(
        text
      )
    ) {

      return "—";

    }


    return text;

  }


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
        "\"",
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );

  }
  /* =========================================================
   APPROVED SNAPSHOT -> PDF GENERATOR COMPATIBILITY
========================================================= */

function setupApprovedPdfCompatibility() {

  const stationSelect =
    document.getElementById("stationSvgRackSelect");

  const stationHost =
    document.getElementById("stationSvgHost");

  const endSelect =
    document.getElementById("locationSvgEndSelect");

  const boxSelect =
    document.getElementById("locationSvgBoxSelect");

  const locationHost =
    document.getElementById("locationSvgHost");


  if (
    !stationSelect ||
    !stationHost ||
    !endSelect ||
    !boxSelect ||
    !locationHost
  ) {

    console.warn(
      "Approved PDF compatibility elements missing."
    );

    return;
  }


  const racks =
    getStationRacks();

  const ends =
    getConnectedEnds();


  /* ==============================
     STATION CTR RACKS
  ============================== */

  stationSelect.innerHTML = "";


  racks.forEach((rack, index) => {

    const option =
      document.createElement("option");

    option.value =
      rack.id || `rack-${index}`;

    option.textContent =
      rack.name || `K${index + 1}`;

    stationSelect.appendChild(option);

  });


  function redrawStation() {

    stationHost.innerHTML = "";


    const rack =
      racks.find(
        (item, index) =>
          (
            item.id ||
            `rack-${index}`
          ) === stationSelect.value
      ) || racks[0];


    if (!rack) {
      return;
    }


    stationHost.appendChild(
      createRackSvg(rack)
    );

  }


  stationSelect.addEventListener(
    "change",
    redrawStation
  );


  /* ==============================
     CONNECTED ENDS
  ============================== */

  endSelect.innerHTML = "";


  ends.forEach((end, index) => {

    const option =
      document.createElement("option");

    option.value =
      end.id || `end-${index}`;

    option.textContent =
      end.name ||
      `Connected End ${index + 1}`;

    endSelect.appendChild(option);

  });


  function getSelectedEnd() {

    return (
      ends.find(
        (end, index) =>
          (
            end.id ||
            `end-${index}`
          ) === endSelect.value
      ) ||
      ends[0] ||
      null
    );

  }


  function populateLocations() {

    boxSelect.innerHTML = "";


    const end =
      getSelectedEnd();


    const locations =
      Array.isArray(end?.locations)
        ? end.locations
        : [];


    locations.forEach(
      (location, index) => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          location.id ||
          `location-${index}`;


        option.textContent =
          location.name ||
          `Location Box ${index + 1}`;


        boxSelect.appendChild(
          option
        );

      }
    );


    redrawLocation();

  }


  function getSelectedLocation() {

    const end =
      getSelectedEnd();


    const locations =
      Array.isArray(end?.locations)
        ? end.locations
        : [];


    return (
      locations.find(
        (location, index) =>
          (
            location.id ||
            `location-${index}`
          ) === boxSelect.value
      ) ||
      locations[0] ||
      null
    );

  }


  function redrawLocation() {

    locationHost.innerHTML = "";


    const location =
      getSelectedLocation();


    if (!location) {
      return;
    }


    let rows =
      Array.isArray(location.rows)
        ? location.rows
        : [];


    if (
      rows.length === 0 &&
      Array.isArray(location.racks)
    ) {

      rows =
        location.racks.flatMap(
          rack =>
            Array.isArray(rack.rows)
              ? rack.rows
              : []
        );

    }


    locationHost.appendChild(
      createRackSvg({
        name:
          location.name ||
          "Location Box",

        rows:
          rows
      })
    );

  }


  endSelect.addEventListener(
    "change",
    populateLocations
  );


  boxSelect.addEventListener(
    "change",
    redrawLocation
  );


  /* ==============================
     API EXPECTED BY EXISTING
     ctr-pdf-generator.js
  ============================== */

  window.CTR_STATION_CONNECTIONS = {
    ...(window.CTR_STATION_CONNECTIONS || {}),
    redraw: redrawStation
  };


  window.CTR_LOCATION_CONNECTIONS = {
    ...(window.CTR_LOCATION_CONNECTIONS || {}),
    redraw: redrawLocation
  };


  redrawStation();

  populateLocations();


  console.log(
    "Approved PDF compatibility ready:",
    {
      stationRacks: racks.length,
      connectedEnds: ends.length
    }
  );

}

  /* =======================================================
     INITIALIZE
  ======================================================= */

  async function initializeApprovedView() {

    if (
      approvedViewState.started
    ) {
      return;
    }


    approvedViewState.started =
      true;


    try {

      setPageStatus(
        "Loading approved CTR version..."
      );


      readUrlParameters();


      await loadApprovedVersion();


      await loadStationRecord();


      if (
        !approvedViewState.snapshot
      ) {

        throw new Error(
          "This approved version does not contain a retained CTR snapshot."
        );

      }


      renderRecordInformation();


      renderApprovedDrawing();


      renderApprovedStructure();

      setupApprovedPdfCompatibility();


      setPageStatus(
        ""
      );


      console.log(
        "Approved CTR snapshot loaded:",
        {
          version:
            approvedViewState.versionRecord,

          station:
            approvedViewState.stationRecord,

          snapshot:
            approvedViewState.snapshot
        }
      );

    }

    catch (error) {

      console.error(
        "Approved CTR viewer error:",
        error
      );


      if (
        approvedViewHeroStatus
      ) {

        approvedViewHeroStatus.textContent =
          "● Record Load Failed";

      }


      setPageStatus(
        error.message ||
        "Approved CTR version could not be loaded.",
        "error"
      );


      if (
        approvedSnapshotDrawing
      ) {

        approvedSnapshotDrawing.innerHTML =
          `
            <div class="approval-empty">

              <strong>
                Approved CTR could not be loaded
              </strong>

              <p>
                ${escapeHtml(
                  error.message ||
                  "Unknown error"
                )}
              </p>

            </div>
          `;

      }

    }

  }


  /* =======================================================
     PAGE START

     Wait for the same role-access initialization used
     across the CTR application.
  ======================================================= */

  function startApprovedView() {

    if (
      approvedViewState.started
    ) {
      return;
    }


    if (
      window.ctrAccess &&
      !window.ctrAccess.ready
    ) {

      return;
    }


    initializeApprovedView();

  }


  window.addEventListener(
    "ctr-access-ready",
    startApprovedView
  );


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      startApprovedView
    );

  }

  else {

    startApprovedView();

  }


  setTimeout(
    startApprovedView,
    500
  );


  setTimeout(
    startApprovedView,
    1200
  );

/* =========================================================
   SAVE APPROVED CTR PDF TO ARCHIVE
========================================================= */

async function saveApprovedCtrPdfToArchive() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const stationId =
    params.get("station");


  const versionNumber =
    Number(
      params.get("version")
    );


  if (
    !stationId ||
    !versionNumber
  ) {

    throw new Error(
      "Station or version is missing from URL."
    );

  }


  /* -------------------------------------------------------
     FIND VERSION RECORD
  ------------------------------------------------------- */

  const {
    data: versionRecord,
    error: versionError
  } =
    await supabaseClient
      .from("ctr_versions")
      .select(`
        id,
        station_id,
        version_number,
        pdf_path,
        status
      `)
      .eq(
        "station_id",
        stationId
      )
      .eq(
        "version_number",
        versionNumber
      )
      .maybeSingle();


  if (versionError) {
    throw versionError;
  }


  if (!versionRecord) {

    throw new Error(
      "CTR version record was not found."
    );

  }


  if (versionRecord.pdf_path) {

    console.log(
      "PDF already archived:",
      versionRecord.pdf_path
    );

    return versionRecord.pdf_path;

  }


  /* -------------------------------------------------------
     GENERATE PDF
  ------------------------------------------------------- */

  await window
    .CTR_PDF_GENERATOR
    .generateBlob();


  const generated =
    window
      .CTR_PDF_GENERATOR
      .getLastGenerated();


  const blob =
    generated?.blob;


  if (!(blob instanceof Blob)) {

    throw new Error(
      "Generated PDF Blob is unavailable."
    );

  }


  /* -------------------------------------------------------
     STORAGE PATH

     Immutable path:
     station / version / version-record-id
  ------------------------------------------------------- */

  const storagePath =
    `approved/${stationId}/V${versionNumber}/${versionRecord.id}.pdf`;


  /* -------------------------------------------------------
     UPLOAD PRIVATE PDF
  ------------------------------------------------------- */

  const {
    error: uploadError
  } =
    await supabaseClient
      .storage
      .from(
        "ctr-workflow-documents"
      )
      .upload(
        storagePath,
        blob,
        {
          contentType:
            "application/pdf",

          cacheControl:
            "3600",

          upsert:
            false
        }
      );


  if (uploadError) {

    throw uploadError;

  }


  /* -------------------------------------------------------
     LINK PDF WITH CTR VERSION
  ------------------------------------------------------- */

  const {
    error: updateError
  } =
    await supabaseClient
      .from(
        "ctr_versions"
      )
      .update({
        pdf_path:
          storagePath
      })
      .eq(
        "id",
        versionRecord.id
      );


  if (updateError) {

    throw updateError;

  }


  console.log(
    "APPROVED PDF ARCHIVED:",
    {
      version:
        `V${versionNumber}`,

      path:
        storagePath,

      size:
        blob.size
    }
  );


  return storagePath;

}


/* =========================================================
   EXPOSE ARCHIVE ACTION
========================================================= */

window.saveApprovedCtrPdfToArchive =
  saveApprovedCtrPdfToArchive;

})();