(()=>{
  var modules = {
    574(module, exports, require) {
      const configureTargets = () => {
        if (window.XR8 && window.XR8.XrController) {
          window.XR8.XrController.configure({
            imageTargetData: [require(111), require(924)]
          });
        }
      };
      if (window.XR8) {
        configureTargets();
      } else {
        window.addEventListener("xrloaded", configureTargets);
      }
    },
    111(module) {
      "use strict";
      module.exports = JSON.parse('{"type":"PLANAR","properties":{"top":48,"left":0,"width":1191,"height":1588,"isRotated":false,"originalWidth":1191,"originalHeight":1684},"imagePath":"image-targets/Dmc_luminance.png","metadata":null,"name":"Dmc","resources":{"originalImage":"Dmc_original.png","croppedImage":"Dmc_cropped.png","thumbnailImage":"Dmc_thumbnail.png","luminanceImage":"Dmc_luminance.png"},"created":1785773928634,"updated":1785773928634}');
    },
    924(module) {
      "use strict";
      module.exports = JSON.parse('{"type":"PLANAR","properties":{"top":125,"left":0,"width":600,"height":800,"isRotated":true,"originalWidth":600,"originalHeight":1050},"imagePath":"image-targets/TarjetaProfesional_luminance.png","metadata":null,"name":"TarjetaProfesional","resources":{"originalImage":"TarjetaProfesional_original.png","croppedImage":"TarjetaProfesional_cropped.png","thumbnailImage":"TarjetaProfesional_thumbnail.png","luminanceImage":"TarjetaProfesional_luminance.png"},"created":1785943650372,"updated":1785943650372}');
    }
  };

  const cache = {};
  function require(id) {
    if (cache[id] !== undefined) return cache[id].exports;
    const module = cache[id] = { exports: {} };
    modules[id](module, module.exports, require);
    return module.exports;
  }

  (() => {
    "use strict";
    try {
      require(574);
    } catch (e) {
      console.error("Error loading targets module:", e);
    }

    const ECS = window.ecs;
    if (!ECS) {
      console.error("8th Wall ECS not found on window.ecs");
      return;
    }

    // =========================================================================
    // 1. REDIRECCIÓN DE ENLACES EN LOGOS 3D / BOTONES (open-url-button.ts)
    // =========================================================================
    const SOCIAL_LINKS = {
      instagram: "https://www.instagram.com/samuel_aguirre22?igsh=eWRubXNxZW0wZW00",
      linkedin: "https://www.linkedin.com/in/samuel-aguirre-10404737a?utm_source=share_via&utm_content=profile&utm_medium=member_android",
      web: "https://legendary-sopapillas-2de101.netlify.app/",
      whatsapp: "https://wa.me/573017384737"
    };

    let lastUrlOpenTime = 0;

    function safeOpenUrl(url) {
      const now = Date.now();
      if (now - lastUrlOpenTime < 600) return;
      lastUrlOpenTime = now;
      console.log("[open-url-button] Abriendo URL segura:", url);

      try {
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
          window.location.href = url;
        }
      } catch (err) {
        window.location.href = url;
      }
    }

    function getUrlFromIdentifier(identifierStr, customUrl) {
      if (customUrl && customUrl.trim()) {
        return customUrl.trim();
      }
      const str = (identifierStr || "").toLowerCase();

      // 1. Instagram (Prioridad estricta para evitar falsos positivos)
      if (str.includes("instagram") || str.includes("insta") || str.includes("ig")) {
        return SOCIAL_LINKS.instagram;
      }
      // 2. LinkedIn
      if (str.includes("linkedin") || str.includes("linkeding") || str.includes("inportafolio")) {
        return SOCIAL_LINKS.linkedin;
      }
      // 3. Portafolio Web
      if (
        str.includes("webportafolio") ||
        str.includes("web") ||
        str.includes("netlify") ||
        str.includes("sopapillas") ||
        (str.includes("portafolio") && !str.includes("whatsapp") && !str.includes("whats"))
      ) {
        return SOCIAL_LINKS.web;
      }
      // 4. WhatsApp
      if (str.includes("whatsapp") || str.includes("whats") || str.includes("wa.me") || str.includes("wsp")) {
        return SOCIAL_LINKS.whatsapp;
      }
      return null;
    }

    function getEntityScreenDistance(camera, obj, clientX, clientY, canvasRect) {
      let minDistance = Infinity;
      let hasMeshes = false;
      try {
        obj.traverse((child) => {
          if (child.isMesh && child.geometry) {
            hasMeshes = true;
            if (!child.geometry.boundingSphere) {
              child.geometry.computeBoundingSphere();
            }
            if (child.geometry.boundingSphere) {
              const center = child.geometry.boundingSphere.center.clone();
              center.applyMatrix4(child.matrixWorld);

              if (camera.project) {
                const screenPoint = center.clone();
                camera.project(screenPoint);
                if (screenPoint.z > -1 && screenPoint.z < 1) {
                  const screenX = ((screenPoint.x + 1) / 2) * canvasRect.width + canvasRect.left;
                  const screenY = ((-screenPoint.y + 1) / 2) * canvasRect.height + canvasRect.top;
                  const dist = Math.hypot(screenX - clientX, screenY - clientY);
                  if (dist < minDistance) {
                    minDistance = dist;
                  }
                }
              }
            }
          }
        });

        if (!hasMeshes || minDistance === Infinity) {
          const Vector3Class = camera.position?.constructor;
          if (Vector3Class) {
            const worldPos = new Vector3Class();
            if (obj.getWorldPosition) obj.getWorldPosition(worldPos);
            else if (obj.matrixWorld) worldPos.setFromMatrixPosition(obj.matrixWorld);
            if (camera.project) {
              const screenPoint = worldPos.clone();
              camera.project(screenPoint);
              if (screenPoint.z > -1 && screenPoint.z < 1) {
                const screenX = ((screenPoint.x + 1) / 2) * canvasRect.width + canvasRect.left;
                const screenY = ((-screenPoint.y + 1) / 2) * canvasRect.height + canvasRect.top;
                minDistance = Math.hypot(screenX - clientX, screenY - clientY);
              }
            }
          }
        }
      } catch (e) {}
      return minDistance;
    }

    function pulseVisualFeedback(obj) {
      try {
        if (!obj || !obj.scale) return;
        const originalScale = { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z };
        obj.scale.set(originalScale.x * 1.25, originalScale.y * 1.25, originalScale.z * 1.25);
        setTimeout(() => {
          if (obj && obj.scale) {
            obj.scale.set(originalScale.x, originalScale.y, originalScale.z);
          }
        }, 200);
      } catch (e) {}
    }

    function handleTouchRaycast(world, clientX, clientY) {
      const threeState = world.three;
      if (!threeState) return;

      const camera = threeState.activeCamera;
      const renderer = threeState.renderer;
      const canvas = renderer?.domElement || document.querySelector("canvas");
      if (!camera || !canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const entityToObject = threeState.entityToObject;
      if (!entityToObject) return;

      let closestMatch = null;
      let minDistance = 125;

      for (const [eid, obj] of entityToObject.entries()) {
        if (!obj || obj.visible === false) continue;

        let entityName = "";
        try {
          if (ECS.Name && ECS.Name.has(world, eid)) {
            entityName = ECS.Name.get(world, eid).name || "";
          }
        } catch (e) {}

        let gltfSrc = "";
        try {
          if (ECS.GltfModel && ECS.GltfModel.has(world, eid)) {
            gltfSrc = ECS.GltfModel.get(world, eid).url || "";
          }
        } catch (e) {}

        const objName = obj.name || "";
        const fullId = `${entityName} ${gltfSrc} ${objName}`;

        if (
          fullId.toLowerCase().includes("yobailanding") ||
          fullId.toLowerCase().includes("plane") ||
          fullId.toLowerCase().includes("camera") ||
          fullId.toLowerCase().includes("whaltercat") ||
          fullId.toLowerCase().includes("pedestal")
        ) {
          continue;
        }

        const url = getUrlFromIdentifier(fullId);
        if (!url) continue;

        const distance = getEntityScreenDistance(camera, obj, clientX, clientY, canvasRect);
        if (distance < minDistance) {
          minDistance = distance;
          closestMatch = { eid, obj, url, dist: distance };
        }
      }

      if (closestMatch && closestMatch.url) {
        pulseVisualFeedback(closestMatch.obj);
        safeOpenUrl(closestMatch.url);
      }
    }

    try {
      ECS.registerComponent({
        name: "open-url-button",
        schema: {
          url: ECS.string,
          target: ECS.string
        },
        schemaDefaults: {
          url: "",
          target: "_blank"
        },
        add: (world, component) => {
          world.events.addListener(component.eid, ECS.input.UI_CLICK, () => {
            let entityName = "";
            try {
              if (ECS.Name && ECS.Name.has(world, component.eid)) {
                entityName = ECS.Name.get(world, component.eid).name || "";
              }
            } catch (e) {}
            const url = getUrlFromIdentifier(entityName, component.schema.url);
            if (url) safeOpenUrl(url);
          });
        }
      });

      let isGlobalListenerAttached = false;
      ECS.registerComponent({
        name: "open-url-global-behavior",
        add: (world) => {
          if (isGlobalListenerAttached) return;
          isGlobalListenerAttached = true;

          world.events.addListener(world.events.globalId, ECS.input.SCREEN_TOUCH_START, (event) => {
            if (event?.position) {
              handleTouchRaycast(world, event.position.x, event.position.y);
            }
          });

          world.events.addListener(world.events.globalId, ECS.input.UI_CLICK, (event) => {
            if (event?.target) {
              let entityName = "";
              try {
                if (ECS.Name && ECS.Name.has(world, event.target)) {
                  entityName = ECS.Name.get(world, event.target).name || "";
                }
              } catch (e) {}
              const url = getUrlFromIdentifier(entityName);
              if (url) safeOpenUrl(url);
            }
          });

          const canvas = world.three?.renderer?.domElement || document.querySelector("canvas") || window;
          canvas.addEventListener("touchend", (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
              handleTouchRaycast(world, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
          }, { passive: true });

          canvas.addEventListener("click", (e) => {
            handleTouchRaycast(world, e.clientX, e.clientY);
          });
        }
      });
    } catch (e) {
      console.error("Error registering open-url-button:", e);
    }

    // =========================================================================
    // 2. PAUSA Y REANUDACIÓN DE VIDEO (video-toggle-button.ts)
    // =========================================================================
    let lastVideoToggleTime = 0;

    function toggleVideoPlayback(world, planeEid) {
      const now = Date.now();
      if (now - lastVideoToggleTime < 500) return;
      lastVideoToggleTime = now;

      try {
        if (ECS.VideoControls && ECS.VideoControls.has(world, planeEid)) {
          ECS.VideoControls.mutate(world, planeEid, (cursor) => {
            cursor.paused = !cursor.paused;
            console.log(`[video-toggle-button] Video pausado: ${cursor.paused}`);
          });
        }
      } catch (err) {
        console.warn("[video-toggle-button] Error al mutar videoControls:", err);
      }
    }

    try {
      ECS.registerComponent({
        name: "video-toggle-button",
        add: (world, component) => {
          world.events.addListener(component.eid, ECS.input.UI_CLICK, () => {
            toggleVideoPlayback(world, component.eid);
          });
          world.events.addListener(component.eid, ECS.input.SCREEN_TOUCH_START, () => {
            toggleVideoPlayback(world, component.eid);
          });
        }
      });

      let isVideoGlobalAttached = false;
      ECS.registerComponent({
        name: "video-global-behavior",
        add: (world) => {
          if (isVideoGlobalAttached) return;
          isVideoGlobalAttached = true;

          const findVideoPlaneEid = () => {
            const threeState = world.three;
            if (!threeState?.entityToObject) return null;
            for (const [eid, obj] of threeState.entityToObject.entries()) {
              let entityName = "";
              try {
                if (ECS.Name && ECS.Name.has(world, eid)) {
                  entityName = ECS.Name.get(world, eid).name || "";
                }
              } catch (e) {}
              const objName = (obj?.name || "").toLowerCase();
              if (
                entityName.toLowerCase().includes("plane") ||
                objName.includes("plane") ||
                (ECS.VideoControls && ECS.VideoControls.has(world, eid))
              ) {
                return eid;
              }
            }
            return null;
          };

          world.events.addListener(world.events.globalId, ECS.input.UI_CLICK, (event) => {
            if (event?.target) {
              let entityName = "";
              try {
                if (ECS.Name && ECS.Name.has(world, event.target)) {
                  entityName = ECS.Name.get(world, event.target).name || "";
                }
              } catch (e) {}
              if (
                entityName.toLowerCase().includes("button") ||
                entityName.toLowerCase().includes("icon") ||
                entityName.toLowerCase().includes("text") ||
                entityName.toLowerCase().includes("plane")
              ) {
                const planeEid = findVideoPlaneEid();
                if (planeEid) toggleVideoPlayback(world, planeEid);
              }
            }
          });

          const onTargetFound = () => {
            const planeEid = findVideoPlaneEid();
            if (planeEid && ECS.VideoControls && ECS.VideoControls.has(world, planeEid)) {
              ECS.VideoControls.mutate(world, planeEid, (cursor) => {
                cursor.paused = false;
              });
            }
          };

          const onTargetLost = () => {
            const planeEid = findVideoPlaneEid();
            if (planeEid && ECS.VideoControls && ECS.VideoControls.has(world, planeEid)) {
              ECS.VideoControls.mutate(world, planeEid, (cursor) => {
                cursor.paused = true;
              });
            }
          };

          window.addEventListener("xrimagefound", onTargetFound);
          window.addEventListener("xrimagelost", onTargetLost);
        }
      });
    } catch (e) {
      console.error("Error registering video-toggle-button:", e);
    }

    // =========================================================================
    // 3. CAMBIO DE ANIMACIÓN DEL PERSONAJE 3D (character-animation-toggle.ts)
    // =========================================================================
    let lastAvatarToggleTime = 0;
    const CLIPS = [
      "Armature.001|mixamo.com|Layer0",
      "Armature|mixamo.com|Layer0"
    ];
    let currentClipIndex = 0;

    function toggleCharacterAnimation(world, eid) {
      const now = Date.now();
      if (now - lastAvatarToggleTime < 500) return;
      lastAvatarToggleTime = now;

      currentClipIndex = (currentClipIndex + 1) % CLIPS.length;
      const nextClip = CLIPS[currentClipIndex];
      console.log(`[character-animation-toggle] Cambiando animacion a: ${nextClip}`);

      try {
        if (ECS.GltfModel && ECS.GltfModel.has(world, eid)) {
          ECS.GltfModel.mutate(world, eid, (cursor) => {
            cursor.animationClip = nextClip;
            cursor.loop = true;
            cursor.paused = false;
          });
        }
      } catch (err) {
        console.error("[character-animation-toggle] Error al mutar animacion:", err);
      }
    }

    try {
      ECS.registerComponent({
        name: "character-animation-toggle",
        schema: {
          clip1: ECS.string,
          clip2: ECS.string
        },
        schemaDefaults: {
          clip1: "Armature.001|mixamo.com|Layer0",
          clip2: "Armature|mixamo.com|Layer0"
        },
        add: (world, component) => {
          world.events.addListener(component.eid, ECS.input.SCREEN_TOUCH_START, () => {
            toggleCharacterAnimation(world, component.eid);
          });
        }
      });

      let isCharacterGlobalAttached = false;
      ECS.registerComponent({
        name: "character-animation-global-behavior",
        add: (world) => {
          if (isCharacterGlobalAttached) return;
          isCharacterGlobalAttached = true;

          const findAvatarEid = () => {
            const threeState = world.three;
            if (!threeState?.entityToObject) return null;
            for (const [eid, obj] of threeState.entityToObject.entries()) {
              let entityName = "";
              try {
                if (ECS.Name && ECS.Name.has(world, eid)) {
                  entityName = ECS.Name.get(world, eid).name || "";
                }
              } catch (e) {}
              let gltfSrc = "";
              try {
                if (ECS.GltfModel && ECS.GltfModel.has(world, eid)) {
                  gltfSrc = ECS.GltfModel.get(world, eid).url || "";
                }
              } catch (e) {}
              const fullId = `${entityName} ${gltfSrc} ${obj?.name || ""}`.toLowerCase();
              if (fullId.includes("yobailanding") || fullId.includes("avatar") || fullId.includes("bailanding")) {
                return eid;
              }
            }
            return null;
          };

          const checkAvatarRaycast = (clientX, clientY) => {
            const threeState = world.three;
            if (!threeState) return;
            const avatarEid = findAvatarEid();
            if (!avatarEid) return;
            const avatarObj = threeState.entityToObject?.get(avatarEid);
            const camera = threeState.activeCamera;
            const canvas = threeState.renderer?.domElement || document.querySelector("canvas");
            if (!avatarObj || !camera || !canvas || avatarObj.visible === false) return;

            const canvasRect = canvas.getBoundingClientRect();
            let minDistance = Infinity;

            try {
              avatarObj.traverse((child) => {
                if (child.isMesh && child.geometry) {
                  if (!child.geometry.boundingSphere) {
                    child.geometry.computeBoundingSphere();
                  }
                  if (child.geometry.boundingSphere) {
                    const center = child.geometry.boundingSphere.center.clone();
                    center.applyMatrix4(child.matrixWorld);
                    if (camera.project) {
                      const screenPoint = center.clone();
                      camera.project(screenPoint);
                      if (screenPoint.z > -1 && screenPoint.z < 1) {
                        const screenX = ((screenPoint.x + 1) / 2) * canvasRect.width + canvasRect.left;
                        const screenY = ((-screenPoint.y + 1) / 2) * canvasRect.height + canvasRect.top;
                        const dist = Math.hypot(screenX - clientX, screenY - clientY);
                        if (dist < minDistance) minDistance = dist;
                      }
                    }
                  }
                }
              });
            } catch (e) {}

            if (minDistance <= 120) {
              toggleCharacterAnimation(world, avatarEid);
            }
          };

          world.events.addListener(world.events.globalId, ECS.input.SCREEN_TOUCH_START, (event) => {
            if (event?.position) {
              checkAvatarRaycast(event.position.x, event.position.y);
            }
          });

          const canvas = world.three?.renderer?.domElement || document.querySelector("canvas") || window;
          canvas.addEventListener("touchend", (e) => {
            if (e.changedTouches && e.changedTouches.length > 0) {
              checkAvatarRaycast(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
          }, { passive: true });
        }
      });
    } catch (e) {
      console.error("Error registering character-animation-toggle:", e);
    }

    // --- Component: Custom Component & example ---
    try {
      ECS.registerComponent({
        name: "Custom Component",
        schema: {
          target: ECS.eid,
          speed: ECS.f32,
          strength: ECS.f64,
          level: ECS.i32,
          armor: ECS.ui8,
          experience: ECS.ui32,
          guildName: ECS.string,
          isHostile: ECS.boolean
        },
        schemaDefaults: {
          speed: 3.14,
          strength: 5.8,
          level: 10,
          armor: 255,
          experience: 12,
          guildName: "Niantic Crew",
          isHostile: false
        }
      });
      ECS.registerComponent({
        name: "example-component",
        add: () => { console.log("Component attached."); }
      });
    } catch (e) {}

    // --- Scene Graph Initialization ---
    try {
      const sceneData = JSON.parse('{"objects":{"47699d9e-18a5-4f88-a4f9-b8be92e8f74a":{"components":{},"geometry":null,"id":"47699d9e-18a5-4f88-a4f9-b8be92e8f74a","light":{"type":"ambient"},"material":null,"name":"Ambient Light","position":[10,5,5],"rotation":[0,0,0,1],"scale":[1,1,1],"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","order":0.4038940050501252},"a608ddd9-9379-464d-966f-5d8d8674c83c":{"camera":{"type":"perspective","xr":{"desktop":"disabled","xrCameraType":"world","headset":"disabled","phone":"AR","world":{"disableWorldTracking":true}}},"components":{},"geometry":null,"id":"a608ddd9-9379-464d-966f-5d8d8674c83c","material":null,"name":"Camera","position":[0.11021234810228797,1.7103830500121502,2.9534682386621958],"rotation":[0.0004436887233141012,0.9659425615285845,-0.25875089860082223,0.0016563336561801576],"scale":[1,1,1],"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","order":1.0308214152219775},"ac1989e3-3b71-49e2-a05f-e682aeb18c36":{"components":{},"geometry":null,"id":"ac1989e3-3b71-49e2-a05f-e682aeb18c36","light":{"intensity":1,"type":"directional"},"material":null,"name":"Directional Light","position":[20,50,10],"rotation":[0,0,0,1],"scale":[1,1,1],"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","order":0.6644431107322474},"9dc7379b-05f8-4beb-af4b-a5cf038a56c3":{"id":"9dc7379b-05f8-4beb-af4b-a5cf038a56c3","position":[0.00775452111507066,0.10883949592772793,0.03443241969513731],"rotation":[0.700909264299852,0,0,0.7132504491541805],"scale":[0.38461538461538514,0.38461538461538564,0.38461538461538564],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-char-anim-global":{"id":"comp-char-anim-global","name":"character-animation-global-behavior","parameters":{}}},"gltfModel":{"src":{"type":"asset","asset":"assets/YoBailanding.glb"},"animationClip":"Armature.001|mixamo.com|Layer0","loop":true,"collider":true},"name":"YoBailanding.glb","order":2.295440257932817},"24337461-b0b2-47db-a68d-1061a6608f2a":{"id":"24337461-b0b2-47db-a68d-1061a6608f2a","position":[0,0,0],"rotation":[-0.7071067811865475,0,0,0.7071067811865476],"scale":[1.932103081440475,2.1513397123000333,1],"geometry":null,"material":null,"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","components":{},"name":"Image Target","imageTarget":{"name":"Dmc"},"order":3.6434105978200564,"disabled":true},"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8":{"id":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","position":[0,0,0],"rotation":[-0.7071067811865475,0,0,0.7071067811865476],"scale":[2.6000000000000014,2.6000000000000014,2.6000000000000014],"geometry":null,"material":null,"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","components":{"comp-open-url-global":{"id":"comp-open-url-global","name":"open-url-global-behavior","parameters":{}},"comp-video-global":{"id":"comp-video-global","name":"video-global-behavior","parameters":{}}},"name":"Image Target (1)","imageTarget":{"name":"TarjetaProfesional"},"order":5.363991776955565},"0ed0800c-e667-4d35-bf03-4ceaf9f9a0f3":{"id":"0ed0800c-e667-4d35-bf03-4ceaf9f9a0f3","position":[0,0.9144730089247948,0.5008703406106403],"rotation":[0.7071067811865475,0,0,0.7071067811865476],"scale":[1.8461538461538463,1.1538461538461537,1.1538461538461535],"geometry":{"type":"plane","width":1,"height":1},"material":{"type":"basic","color":"#FFFFFF","textureSrc":{"type":"asset","asset":"assets/Un_vagon_llamado_deseo_1.mp4"}},"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{},"name":"Plane","order":11.062780065811888,"videoControls":{"volume":0.2},"hidden":false},"21713d56-49e9-4e3f-8d8a-b0a0f7085733":{"id":"21713d56-49e9-4e3f-8d8a-b0a0f7085733","position":[0,-0.28556072730335924,1.2290907895080168],"rotation":[0,0,0,1],"scale":[0.19999999999999993,0.33333333333333304,0.33333333333333315],"geometry":null,"material":null,"parentId":"0ed0800c-e667-4d35-bf03-4ceaf9f9a0f3","components":{},"ui":{"type":"3d","width":100,"height":36,"background":"#bd0000","borderRadius":18,"flexDirection":"row","backgroundOpacity":1,"padding":"10","gap":"6","alignItems":"center","justifyContent":"center"},"name":"Button","order":8.636582721891168,"hidden":false},"d327f1b1-8f61-4023-a4cd-456996deb5fb":{"id":"d327f1b1-8f61-4023-a4cd-456996deb5fb","position":[-0.323,0,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"21713d56-49e9-4e3f-8d8a-b0a0f7085733","components":{},"name":"Icon","ui":{"width":16,"height":16,"image":{"type":"asset","asset":"assets/pause-button-png-31.png"},"backgroundOpacity":1,"backgroundSize":"contain"},"order":0.18712984955022477},"a298cc6d-1145-4202-a179-255438cccd27":{"id":"a298cc6d-1145-4202-a179-255438cccd27","position":[0,0,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"21713d56-49e9-4e3f-8d8a-b0a0f7085733","components":{},"name":"Text","ui":{"width":50,"height":14,"text":"Pausa","color":"#ffffff","fontSize":10,"font":{"type":"font","font":"Press Start 2p"},"verticalTextAlign":"center"},"order":1.2695086777501219},"1f71af66-4a5c-487d-9b9e-e30977b4ba60":{"id":"1f71af66-4a5c-487d-9b9e-e30977b4ba60","position":[0.9341143383423588,-0.05900518250259834,-0.0036841479705305128],"rotation":[0.6916548014520733,-0.14701576633820648,-0.14701576659219115,0.6916548015083777],"scale":[0.16023534923242233,0.16023534923242277,0.16023534923242272],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{},"gltfModel":{"src":{"type":"asset","asset":"assets/WhalterCatparao.glb"},"animationClip":"Armature|mixamo.com","loop":true},"name":"WhalterCatparao.glb","order":9.91298056231974},"9f7911be-c2d3-4494-b00a-0bfdbb528168":{"id":"9f7911be-c2d3-4494-b00a-0bfdbb528168","position":[0.6474458328172452,-0.17162021004049322,3.810734173559221e-17],"rotation":[0.7071067811865474,0,0,0.7071067811865476],"scale":[0.38461538461538464,0.38461538461538464,0.38461538461538464],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{},"gltfModel":{"src":{"type":"asset","asset":"assets/Pedestal.glb"},"animationClip":"","loop":true},"name":"Pedestal.glb 1","order":13.457810255242066},"82d25dee-400b-424e-b073-d322eec249d5":{"id":"82d25dee-400b-424e-b073-d322eec249d5","position":[0.36076923076923056,-0.3807692307692306,8.454775341376188e-17],"rotation":[0.7071067811865475,0,0,0.7071067811865476],"scale":[0.3846153846153844,0.3846153846153844,0.3846153846153844],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{},"gltfModel":{"src":{"type":"asset","asset":"assets/Pedestal.glb"},"animationClip":"","loop":true},"name":"Pedestal.glb 2","order":14.577194199066478},"cefb34db-f1a9-4330-9a30-c293e7081ea3":{"id":"cefb34db-f1a9-4330-9a30-c293e7081ea3","position":[-0.3606108304774588,-0.3807320452380352,8.453949656717868e-17],"rotation":[0.7071067811865475,0,0,0.7071067811865476],"scale":[0.3846153846153844,0.3846153846153844,0.3846153846153844],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{},"gltfModel":{"src":{"type":"asset","asset":"assets/Pedestal.glb"},"animationClip":"","loop":true},"name":"Pedestal.glb 3","order":16.386894735594232},"3ff6362a-77aa-4dff-9b59-1f1c0008b347":{"id":"3ff6362a-77aa-4dff-9b59-1f1c0008b347","position":[-0.650932659174738,-0.15907764183258916,3.532233213312289e-17],"rotation":[0.7071067811865475,0,0,0.7071067811865476],"scale":[0.3846153846153844,0.3846153846153844,0.3846153846153844],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{},"gltfModel":{"src":{"type":"asset","asset":"assets/Pedestal.glb"},"animationClip":"","loop":true},"name":"Pedestal.glb 4","order":17.941517099219258},"4673b2f0-ece2-44f8-bec2-928e6faccb72":{"id":"4673b2f0-ece2-44f8-bec2-928e6faccb72","position":[0.6516865139085489,-0.1714370471180299,1.2346844252184893e-16],"rotation":[0.7071067811865475,0,0,0.7071067811865476],"scale":[0.3846153846153844,0.3846153846153844,0.3846153846153844],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-open-url-logo-1":{"id":"comp-open-url-logo-1","name":"open-url-button","parameters":{"url":"https://wa.me/573017384737"}}},"gltfModel":{"src":{"type":"asset","asset":"assets/WhatsappPortafolio.glb"},"animationClip":"InstagramAction","loop":true},"name":"WhatsappPortafolio.glb","order":19.011843134639424},"3c299a20-8977-4ee1-b02f-e4801f6111a3":{"id":"3c299a20-8977-4ee1-b02f-e4801f6111a3","position":[0.36192307692307674,-0.380070862044895,8.439268440627478e-17],"rotation":[0.7071067811865475,0,0,0.7071067811865476],"scale":[0.3846153846153844,0.3846153846153844,0.3846153846153844],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-open-url-logo-2":{"id":"comp-open-url-logo-2","name":"open-url-button","parameters":{"url":"https://www.instagram.com/samuel_aguirre22?igsh=eWRubXNxZW0wZW00"}}},"gltfModel":{"src":{"type":"asset","asset":"assets/InstagramPortafolio.glb"},"animationClip":"InstagramAction.001","loop":true},"name":"InstagramPortafolio.glb","order":20.9084820881096},"5299ab2c-1e4c-462e-8dc0-6c66c5461060":{"id":"5299ab2c-1e4c-462e-8dc0-6c66c5461060","position":[-0.36179993794484655,-0.37962053296809967,-0.007805122189030431],"rotation":[0.7071067811865475,0,0,0.7071067811865476],"scale":[0.3846153846153844,0.3846153846153844,0.3846153846153844],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-open-url-logo-3":{"id":"comp-open-url-logo-3","name":"open-url-button","parameters":{"url":"https://legendary-sopapillas-2de101.netlify.app/"}}},"gltfModel":{"src":{"type":"asset","asset":"assets/WebPortafolio.glb"},"animationClip":"InstagramAction.002","loop":true},"name":"WebPortafolio.glb","order":22.730054866147196},"e3449b1b-844e-4052-91b6-5f4e62c48d26":{"id":"e3449b1b-844e-4052-91b6-5f4e62c48d26","position":[-0.6494082347277055,-0.1649388359122672,3.662377865693394e-17],"rotation":[0.7071067811865475,0,0,0.7071067811865476],"scale":[0.3846153846153844,0.3846153846153844,0.3846153846153844],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-open-url-logo-4":{"id":"comp-open-url-logo-4","name":"open-url-button","parameters":{"url":"https://www.linkedin.com/in/samuel-aguirre-10404737a?utm_source=share_via&utm_content=profile&utm_medium=member_android"}}},"gltfModel":{"src":{"type":"asset","asset":"assets/LinkedinPortafolio.glb"},"animationClip":"InstagramAction.002","loop":true},"name":"LinkedinPortafolio.glb","order":24.368432697627576},"214cee31-11c8-4ce1-bb49-6c715f1a78d9":{"id":"214cee31-11c8-4ce1-bb49-6c715f1a78d9","position":[-2.8539250092822845,1.5236108629367444,-0.8761926111013618],"rotation":[0.1191109501622727,0.379671050126133,-0.016397197487370285,0.9172750989545722],"scale":[2.3000000000000034,1.5812500764929427,1.437500076492944],"geometry":{"type":"plane","width":1,"height":1},"material":{"type":"basic","color":"#FFFFFF","textureSrc":{"type":"asset","asset":"assets/Talos.png"}},"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","components":{},"name":"Plane (1)","order":7.1937233329494195}},"spaces":{"88453035-dc0f-486d-868a-8ff7c2fda864":{"id":"88453035-dc0f-486d-868a-8ff7c2fda864","name":"Default Space","activeCamera":"a608ddd9-9379-464d-966f-5d8d8674c83c"}},"entrySpaceId":"88453035-dc0f-486d-868a-8ff7c2fda864"}');
      delete sceneData.history;
      delete sceneData.historyVersion;
      ECS.application.init(sceneData);
    } catch (e) {
      console.error("Error during ECS application init:", e);
    }
  })();
})();