/* =========================================================
   CTR MANAGEMENT SYSTEM
   GENERIC CTR SHEET RENDERER
   VERSION 1.1

   PURPOSE
   ---------------------------------------------------------
   Structured CTR sheet data
            ↓
   Generic renderer
            ↓
   SVG engineering drawing

   IMPORTANT
   ---------------------------------------------------------
   - No station-specific code in this file.
   - BELD / KTE / JBP / future stations provide DATA only.
   - Supports terminal top + bottom connection ports.
   - Supports fuse-to-terminal connections.
   - Supports custom conductor paths.
========================================================= */

(function () {

  "use strict";


  /* =====================================================
     VERSION
  ===================================================== */

  const RENDERER_VERSION =
    "1.1.0";


  /* =====================================================
     ENGINE
  ===================================================== */

  function getEngine() {

    const engine =
      window.CTR_DRAWING_ENGINE;


    if (!engine) {

      throw new Error(
        "CTR Drawing Engine is not loaded."
      );

    }


    return engine;

  }


  /* =====================================================
     VALIDATE SHEET DATA
  ===================================================== */

  function validateSheetData(
    data
  ) {

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {

      throw new Error(
        "Invalid CTR sheet data."
      );

    }


    if (
      !data.sheet ||
      typeof data.sheet !== "object"
    ) {

      throw new Error(
        "CTR sheet metadata is required."
      );

    }


    return true;

  }


  /* =====================================================
     OBJECT REGISTRY

     Keeps references to drawing objects so conductors
     can connect to them later.
  ===================================================== */

  function createRegistry() {

    return {

      terminals:
        new Map(),

      fuses:
        new Map(),

      objects:
        new Map()

    };

  }


  /* =====================================================
     TERMINAL ROWS
  ===================================================== */

  function renderTerminalRows(
    engine,
    sheet,
    data,
    registry
  ) {

    const rows =
      Array.isArray(
        data.terminalRows
      )
        ? data.terminalRows
        : [];


    rows.forEach(
      function (
        row,
        rowIndex
      ) {

        const rowId =
          String(
            row.id ||
            `ROW-${rowIndex + 1}`
          );


        const rowX =
          Number.isFinite(
            Number(row.x)
          )
            ? Number(row.x)
            : 150;


        const rowY =
          Number.isFinite(
            Number(row.y)
          )
            ? Number(row.y)
            : 250;


        const terminalCount =
          Number.isFinite(
            Number(row.count)
          )
            ? Math.max(
                1,
                Number(row.count)
              )
            : 12;


        const startNumber =
          Number.isFinite(
            Number(
              row.startNumber
            )
          )
            ? Number(
                row.startNumber
              )
            : 1;


        const pitch =
          Number.isFinite(
            Number(row.pitch)
          )
            ? Number(row.pitch)
            : sheet.config
                .terminalPitch;


        const terminals =
          engine.drawTerminalStrip(
            sheet,
            {

              x:
                rowX,

              y:
                rowY,

              count:
                terminalCount,

              startNumber:
                startNumber,

              pitch:
                pitch,

              labels:
                Array.isArray(
                  row.labels
                )
                  ? row.labels
                  : [],

              idPrefix:
                rowId

            }
          );


        terminals.forEach(
          function (
            terminal,
            index
          ) {

            /*
              Terminal ID used everywhere in data:

              AA-1
              AA-2
              BB-1
              A-12
              etc.
            */

            const id =
              `${rowId}-${index + 1}`;


            terminal.id =
              id;


            terminal.rowId =
              rowId;


            terminal.index =
              index;


            /*
              Fallback connection ports.

              New drawing engine creates topPort /
              bottomPort itself, but these fallbacks
              keep renderer safe.
            */

            if (
              !terminal.topPort
            ) {

              terminal.topPort = {

                x:
                  terminal.x,

                y:
                  terminal.y - 18

              };

            }


            if (
              !terminal.bottomPort
            ) {

              terminal.bottomPort = {

                x:
                  terminal.x,

                y:
                  terminal.y + 18

              };

            }


            registry.terminals.set(
              id,
              terminal
            );

          }
        );


        /* -----------------------------------------------
           ROW NAME

           Example:
           AA
           BB
           A
           B
           C
           D
        ------------------------------------------------ */

        if (
          row.name
        ) {

          engine.drawLabel(
            sheet,
            {

              x:
                Number.isFinite(
                  Number(
                    row.nameX
                  )
                )
                  ? Number(
                      row.nameX
                    )
                  : rowX - 55,

              y:
                Number.isFinite(
                  Number(
                    row.nameY
                  )
                )
                  ? Number(
                      row.nameY
                    )
                  : rowY + 5,

              text:
                String(
                  row.name
                ),

              size:
                Number.isFinite(
                  Number(
                    row.nameSize
                  )
                )
                  ? Number(
                      row.nameSize
                    )
                  : 16,

              weight:
                700

            }
          );

        }

      }
    );

  }


  /* =====================================================
     FUSES
  ===================================================== */

  function renderFuses(
    engine,
    sheet,
    data,
    registry
  ) {

    const fuses =
      Array.isArray(
        data.fuses
      )
        ? data.fuses
        : [];


    fuses.forEach(
      function (
        fuse,
        index
      ) {

        const id =
          String(
            fuse.id ||
            `FUSE-${index + 1}`
          );


        const result =
          engine.drawFuse(
            sheet,
            {

              id:
                id,

              x:
                Number.isFinite(
                  Number(fuse.x)
                )
                  ? Number(fuse.x)
                  : 200,

              y:
                Number.isFinite(
                  Number(fuse.y)
                )
                  ? Number(fuse.y)
                  : 150,

              width:
                Number.isFinite(
                  Number(
                    fuse.width
                  )
                )
                  ? Number(
                      fuse.width
                    )
                  : 42,

              height:
                Number.isFinite(
                  Number(
                    fuse.height
                  )
                )
                  ? Number(
                      fuse.height
                    )
                  : 16,

              label:
                fuse.label ||
                "",

              rating:
                fuse.rating ||
                ""

            }
          );


        registry.fuses.set(
          id,
          {

            id:
              id,

            input:
              result.input,

            output:
              result.output,

            data:
              fuse

          }
        );

      }
    );

  }
  

  /* =====================================================
   CTR CURVED LINKS
===================================================== */

function renderCtrLinks(
  engine,
  sheet,
  data,
  registry
) {

  const links =
    Array.isArray(
      data.links
    )
      ? data.links
      : [];


  links.forEach(
    function (
      link,
      index
    ) {

      const terminalA =
        registry.terminals.get(
          String(
            link.terminalA || ""
          )
        );


      const terminalB =
        link.terminalB
          ? registry.terminals.get(
              String(
                link.terminalB
              )
            )
          : null;


      if (!terminalA) {

        console.warn(
          "CTR Renderer: link terminal not found:",
          link.terminalA
        );

        return;

      }


      engine.drawCtrLink(
        sheet,
        terminalA,
        terminalB,
        {

          id:
            String(
              link.id ||
              `LINK-${index + 1}`
            ),

          connectTop:
            link.connectTop === true,

          connectBottom:
            link.connectBottom === true,

          curveAmount:
            Number.isFinite(
              Number(
                link.curveAmount
              )
            )
              ? Number(
                  link.curveAmount
                )
              : 8

        }
      );

    }
  );

}

  /* =====================================================
     TERMINAL GROUPS / BRACKETS
  ===================================================== */

  function renderGroups(
    engine,
    sheet,
    data
  ) {

    const groups =
      Array.isArray(
        data.groups
      )
        ? data.groups
        : [];


    groups.forEach(
      function (
        group,
        index
      ) {

        const x1 =
          Number(
            group.x1
          );


        const x2 =
          Number(
            group.x2
          );


        const y =
          Number(
            group.y
          );


        if (
          !Number.isFinite(x1) ||
          !Number.isFinite(x2) ||
          !Number.isFinite(y)
        ) {

          return;

        }


        engine.drawTerminalGroup(
          sheet,
          {

            id:
              String(
                group.id ||
                `GROUP-${index + 1}`
              ),

            x1:
              x1,

            x2:
              x2,

            y:
              y,

            height:
              Number.isFinite(
                Number(
                  group.height
                )
              )
                ? Number(
                    group.height
                  )
                : 35,

            label:
              group.label ||
              ""

          }
        );

      }
    );

  }


  /* =====================================================
     LABELS
  ===================================================== */

  function renderLabels(
    engine,
    sheet,
    data
  ) {

    const labels =
      Array.isArray(
        data.labels
      )
        ? data.labels
        : [];


    labels.forEach(
      function (
        label,
        index
      ) {

        engine.drawLabel(
          sheet,
          {

            id:
              String(
                label.id ||
                `LABEL-${index + 1}`
              ),

            x:
              Number.isFinite(
                Number(label.x)
              )
                ? Number(label.x)
                : 0,

            y:
              Number.isFinite(
                Number(label.y)
              )
                ? Number(label.y)
                : 0,

            text:
              label.text ||
              "",

            size:
              Number.isFinite(
                Number(
                  label.size
                )
              )
                ? Number(
                    label.size
                  )
                : 12,

            weight:
              Number.isFinite(
                Number(
                  label.weight
                )
              )
                ? Number(
                    label.weight
                  )
                : 400,

            anchor:
              label.anchor ||
              "middle",

            rotate:
              Number.isFinite(
                Number(
                  label.rotate
                )
              )
                ? Number(
                    label.rotate
                  )
                : 0

          }
        );

      }
    );

  }


  /* =====================================================
     CONTINUATION MARKERS
  ===================================================== */

  function renderContinuations(
    engine,
    sheet,
    data
  ) {

    const markers =
      Array.isArray(
        data.continuations
      )
        ? data.continuations
        : [];


    markers.forEach(
      function (marker) {

        const x =
          Number(
            marker.x
          );


        const y =
          Number(
            marker.y
          );


        if (
          !Number.isFinite(x) ||
          !Number.isFinite(y)
        ) {

          return;

        }


        engine.drawContinuation(
          sheet,
          {

            x:
              x,

            y:
              y,

            text:
              marker.text ||
              "",

            direction:
              marker.direction ||
              "right"

          }
        );

      }
    );

  }


  /* =====================================================
     RESOLVE CONNECTION POINT

     Supports:

     Direct coordinate:
     { x: 100, y: 200 }

     Terminal top:
     {
       terminal: "AA-1",
       port: "top"
     }

     Terminal bottom:
     {
       terminal: "AA-1",
       port: "bottom"
     }

     Fuse:
     {
       fuse: "F1",
       port: "input"
     }
  ===================================================== */

  function resolvePoint(
    reference,
    registry
  ) {

    if (
      !reference ||
      typeof reference !==
        "object"
    ) {

      return null;

    }


    /* -----------------------------------------------
       DIRECT COORDINATE
    ------------------------------------------------ */

    if (
      Number.isFinite(
        Number(
          reference.x
        )
      ) &&
      Number.isFinite(
        Number(
          reference.y
        )
      )
    ) {

      return {

        x:
          Number(
            reference.x
          ),

        y:
          Number(
            reference.y
          )

      };

    }


    /* -----------------------------------------------
       TERMINAL PORT
    ------------------------------------------------ */

    if (
      reference.terminal
    ) {

      const terminal =
        registry.terminals.get(
          String(
            reference.terminal
          )
        );


      if (!terminal) {

        console.warn(
          "CTR Renderer: terminal not found:",
          reference.terminal
        );


        return null;

      }


      const useBottomPort =
        String(
          reference.port ||
          "top"
        )
          .toLowerCase() ===
        "bottom";


      const selectedPort =
        useBottomPort
          ? terminal.bottomPort
          : terminal.topPort;


      /*
        Backward-safe fallback
      */

      if (
        selectedPort &&
        Number.isFinite(
          Number(
            selectedPort.x
          )
        ) &&
        Number.isFinite(
          Number(
            selectedPort.y
          )
        )
      ) {

        return {

          x:
            Number(
              selectedPort.x
            ),

          y:
            Number(
              selectedPort.y
            )

        };

      }


      return {

        x:
          terminal.x,

        y:
          terminal.y +
          (
            useBottomPort
              ? 18
              : -18
          )

      };

    }


    /* -----------------------------------------------
       FUSE PORT
    ------------------------------------------------ */

    if (
      reference.fuse
    ) {

      const fuse =
        registry.fuses.get(
          String(
            reference.fuse
          )
        );


      if (!fuse) {

        console.warn(
          "CTR Renderer: fuse not found:",
          reference.fuse
        );


        return null;

      }


      const side =
        String(
          reference.port ||
          "output"
        )
          .toLowerCase() ===
        "input"

          ? "input"

          : "output";


      return {

        x:
          fuse[side].x,

        y:
          fuse[side].y

      };

    }


    return null;

  }


  /* =====================================================
     CONNECTIONS
  ===================================================== */

  function renderConnections(
    engine,
    sheet,
    data,
    registry
  ) {

    const connections =
      Array.isArray(
        data.connections
      )
        ? data.connections
        : [];


    connections.forEach(
      function (
        connection,
        index
      ) {

        const id =
          String(
            connection.id ||
            `CONNECTION-${index + 1}`
          );


        /* -----------------------------------------------
           TERMINAL → TERMINAL

           Convenient rectangular / U type connection.
        ------------------------------------------------ */

        if (
          connection.type ===
          "terminal-to-terminal"
        ) {

          const terminalA =
            registry.terminals.get(
              String(
                connection.from
              )
            );


          const terminalB =
            registry.terminals.get(
              String(
                connection.to
              )
            );


          if (
            !terminalA ||
            !terminalB
          ) {

            console.warn(
              "CTR Renderer: terminal connection could not be resolved:",
              connection
            );


            return;

          }


          engine.connectTerminals(
            sheet,
            terminalA,
            terminalB,
            {

              id:
                id,

              offset:
                Number.isFinite(
                  Number(
                    connection.offset
                  )
                )
                  ? Number(
                      connection.offset
                    )
                  : 42,

              direction:
                connection.direction ||
                "up"

            }
          );


          return;

        }


        /* -----------------------------------------------
           PATH CONNECTION

           Supports:
           fuse → terminal
           terminal → fuse
           terminal → terminal
           coordinate → terminal
           etc.
        ------------------------------------------------ */

        if (
          connection.type ===
          "path"
        ) {

          const source =
            resolvePoint(
              connection.from,
              registry
            );


          const target =
            resolvePoint(
              connection.to,
              registry
            );


          if (
            !source ||
            !target
          ) {

            console.warn(
              "CTR Renderer: path connection could not be resolved:",
              connection
            );


            return;

          }


          const points =
            [
              source
            ];


          if (
            Array.isArray(
              connection.via
            )
          ) {

            connection.via.forEach(
              function (point) {

                const x =
                  Number(
                    point.x
                  );


                const y =
                  Number(
                    point.y
                  );


                if (
                  Number.isFinite(x) &&
                  Number.isFinite(y)
                ) {

                  points.push(
                    {

                      x:
                        x,

                      y:
                        y

                    }
                  );

                }

              }
            );

          }


          points.push(
            target
          );


          engine.drawConductor(
            sheet,
            {

              id:
                id,

              points:
                points,

              width:
                Number.isFinite(
                  Number(
                    connection.width
                  )
                )
                  ? Number(
                      connection.width
                    )
                  : 1.5,

              dashed:
                connection.dashed ===
                true

            }
          );


          return;

        }


        /* -----------------------------------------------
           CUSTOM CONDUCTOR

           Complete path manually supplied as coordinates.
        ------------------------------------------------ */

        if (
          connection.type ===
          "custom" &&
          Array.isArray(
            connection.points
          )
        ) {

          const points =
            connection.points
              .map(
                function (point) {

                  return {

                    x:
                      Number(
                        point.x
                      ),

                    y:
                      Number(
                        point.y
                      )

                  };

                }
              )
              .filter(
                function (point) {

                  return (

                    Number.isFinite(
                      point.x
                    ) &&

                    Number.isFinite(
                      point.y
                    )

                  );

                }
              );


          if (
            points.length <
            2
          ) {

            return;

          }


          engine.drawConductor(
            sheet,
            {

              id:
                id,

              points:
                points,

              width:
                Number.isFinite(
                  Number(
                    connection.width
                  )
                )
                  ? Number(
                      connection.width
                    )
                  : 1.5,

              dashed:
                connection.dashed ===
                true

            }
          );

        }

      }
    );

  }


  /* =====================================================
     BASIC SHEET INFORMATION
  ===================================================== */

  function renderSheetInformation(
    engine,
    sheet,
    data
  ) {

    const metadata =
      data.sheet ||
      {};


    if (
      metadata.stationName
    ) {

      engine.drawLabel(
        sheet,
        {

          x:
            sheet.config.width /
            2,

          y:
            82,

          text:
            String(
              metadata.stationName
            )
              .toUpperCase(),

          size:
            18,

          weight:
            700

        }
      );

    }


    if (
      metadata.stationCode
    ) {

      engine.drawLabel(
        sheet,
        {

          x:
            sheet.config.width /
            2,

          y:
            102,

          text:
            `(${String(
              metadata.stationCode
            ).toUpperCase()})`,

          size:
            10,

          weight:
            600

        }
      );

    }


    if (
      metadata.sheetNumber
    ) {

      engine.drawLabel(
        sheet,
        {

          x:
            sheet.config.width -
            115,

          y:
            sheet.config.height -
            70,

          text:
            `SHEET ${metadata.sheetNumber}`,

          size:
            12,

          weight:
            700

        }
      );

    }

  }


  /* =====================================================
     COMPLETE SHEET RENDER
  ===================================================== */

  function renderSheet(
    data
  ) {

    validateSheetData(
      data
    );


    const engine =
      getEngine();


    const registry =
      createRegistry();


    const sheet =
      engine.createSheet(
        data.canvas ||
        {}
      );


    /*
      1. Sheet information
    */

    renderSheetInformation(
      engine,
      sheet,
      data
    );


    /*
      2. Terminals first
    */

    renderTerminalRows(
      engine,
      sheet,
      data,
      registry
    );

    renderCtrLinks(
      engine,
      sheet,
      data,
      registry
    );
    /*
      3. Fuses
    */

    renderFuses(
      engine,
      sheet,
      data,
      registry
    );


    /*
      4. Connections after objects exist
    */

    renderConnections(
      engine,
      sheet,
      data,
      registry
    );


    /*
      5. Terminal group brackets
    */

    renderGroups(
      engine,
      sheet,
      data
    );


    /*
      6. Engineering text labels
    */

    renderLabels(
      engine,
      sheet,
      data
    );


    /*
      7. Continuation markers
    */

    renderContinuations(
      engine,
      sheet,
      data
    );


    return {

      sheet:
        sheet,

      svg:
        sheet.svg,

      registry:
        registry,

      data:
        data

    };

  }


  /* =====================================================
     RENDER INTO HTML HOST
  ===================================================== */

  function renderToHost(
    host,
    data
  ) {

    let element =
      host;


    if (
      typeof host ===
      "string"
    ) {

      element =
        document.querySelector(
          host
        );

    }


    if (!element) {

      throw new Error(
        "CTR drawing host element was not found."
      );

    }


    const result =
      renderSheet(
        data
      );


    element.innerHTML =
      "";


    element.appendChild(
      result.svg
    );


    return result;

  }


  /* =====================================================
     PUBLIC API
  ===================================================== */

  window.CTR_SHEET_RENDERER = {

    version:
      RENDERER_VERSION,

    renderSheet:
      renderSheet,

    renderToHost:
      renderToHost

  };


  /* =====================================================
     READY EVENT
  ===================================================== */

  window.dispatchEvent(

    new CustomEvent(
      "ctr-sheet-renderer-ready",
      {

        detail: {

          version:
            RENDERER_VERSION

        }

      }
    )

  );


})();