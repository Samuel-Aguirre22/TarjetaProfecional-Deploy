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

    // --- Component: AvatarAnimationComponent ---
    try {
      ECS.registerComponent({
        name: "AvatarAnimationComponent",
        schema: {
          clip1: ECS.string,
          clip2: ECS.string
        },
        schemaDefaults: {
          clip1: "Armature.001|mixamo.com|Layer0",
          clip2: "Armature|mixamo.com|Layer0"
        },
        data: {
          currentClipIndex: ECS.i32
        },
        add: (world, component) => {
          try {
            component.data.currentClipIndex = 0;
            let lastToggleTime = 0;
            const clips = [
              component.schema.clip1 || "Armature.001|mixamo.com|Layer0",
              component.schema.clip2 || "Armature|mixamo.com|Layer0"
            ];

            const toggleAnimation = () => {
              const now = Date.now();
              if (now - lastToggleTime < 600) return;
              lastToggleTime = now;
              component.data.currentClipIndex = (component.data.currentClipIndex + 1) % clips.length;
              const nextClip = clips[component.data.currentClipIndex];
              console.log("[AvatarAnimationComponent] Alternando animacion a:", nextClip);
              try {
                if (ECS.GltfModel && ECS.GltfModel.has(world, component.eid)) {
                  ECS.GltfModel.mutate(world, component.eid, (cursor) => {
                    cursor.animationClip = nextClip;
                    cursor.loop = true;
                    cursor.paused = false;
                  });
                }
              } catch (err) {
                console.error("[AvatarAnimationComponent] Error al cambiar animacion:", err);
              }
            };

            const checkAvatarHit = (event) => {
              try {
                const threeState = world.three;
                const camera = threeState?.activeCamera;
                const obj = threeState?.entityToObject?.get(component.eid);
                const renderer = threeState?.renderer;
                const canvas = renderer?.domElement || document.querySelector("canvas");
                const THREE = window.THREE;

                if (!camera || !obj || !canvas || obj.visible === false) return;

                const rect = canvas.getBoundingClientRect();
                let clientX, clientY;

                if (event.changedTouches && event.changedTouches.length > 0) {
                  clientX = event.changedTouches[0].clientX;
                  clientY = event.changedTouches[0].clientY;
                } else if (event.touches && event.touches.length > 0) {
                  clientX = event.touches[0].clientX;
                  clientY = event.touches[0].clientY;
                } else if (typeof event.clientX === "number") {
                  clientX = event.clientX;
                  clientY = event.clientY;
                }

                if (clientX === undefined || clientY === undefined) return;

                // A. Raycast directo
                if (THREE?.Raycaster && THREE?.Vector2) {
                  const mouse = new THREE.Vector2(
                    ((clientX - rect.left) / rect.width) * 2 - 1,
                    -((clientY - rect.top) / rect.height) * 2 + 1
                  );
                  const raycaster = new THREE.Raycaster();
                  raycaster.setFromCamera(mouse, camera);
                  const intersects = raycaster.intersectObject(obj, true);
                  if (intersects && intersects.length > 0) {
                    toggleAnimation();
                    return;
                  }
                }

                // B. Fallback de proyeccion de pantalla
                let wx = 0, wy = 0, wz = 0;
                if (obj.getWorldPosition) {
                  const posVec = { x: 0, y: 0, z: 0 };
                  obj.getWorldPosition(posVec);
                  wx = posVec.x; wy = posVec.y; wz = posVec.z;
                } else if (obj.matrixWorld) {
                  wx = obj.matrixWorld.elements[12];
                  wy = obj.matrixWorld.elements[13];
                  wz = obj.matrixWorld.elements[14];
                }

                const screenPos = { x: wx, y: wy, z: wz };
                if (camera.project) {
                  camera.project(screenPos);
                  if (screenPos.z < 1 && screenPos.z > -1) {
                    const screenX = ((screenPos.x + 1) / 2) * rect.width + rect.left;
                    const screenY = ((-screenPos.y + 1) / 2) * rect.height + rect.top;
                    if (Math.hypot(screenX - clientX, screenY - clientY) < 80) {
                      toggleAnimation();
                    }
                  }
                }
              } catch (hitErr) {}
            };

            const canvas = world.three?.renderer?.domElement || document.querySelector("canvas") || window;
            canvas.addEventListener("click", checkAvatarHit);
            canvas.addEventListener("touchend", checkAvatarHit, { passive: true });
          } catch (initErr) {
            console.error("[AvatarAnimationComponent] Init error:", initErr);
          }
        }
      });
    } catch (e) {
      console.error("Error registering AvatarAnimationComponent:", e);
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

    // --- Component: LinkOpenerComponent ---
    try {
      ECS.registerComponent({
        name: "LinkOpenerComponent",
        schema: {
          url: ECS.string,
          target: ECS.string
        },
        schemaDefaults: {
          url: "",
          target: "_blank"
        },
        add: (world, component) => {
          try {
            let lastOpenTime = 0;
            const openLink = () => {
              const now = Date.now();
              if (now - lastOpenTime < 600) return;
              lastOpenTime = now;
              const targetUrl = (component.schema.url || "").trim();
              if (!targetUrl) return;
              console.log("[LinkOpenerComponent] Abriendo URL:", targetUrl);
              const targetWindow = component.schema.target || "_blank";
              window.open(targetUrl, targetWindow);
            };

            const checkSocialHit = (event) => {
              try {
                const threeState = world.three;
                const camera = threeState?.activeCamera;
                const obj = threeState?.entityToObject?.get(component.eid);
                const renderer = threeState?.renderer;
                const canvas = renderer?.domElement || document.querySelector("canvas");
                const THREE = window.THREE;

                if (!camera || !obj || !canvas || obj.visible === false) return;

                const rect = canvas.getBoundingClientRect();
                let clientX, clientY;

                if (event.changedTouches && event.changedTouches.length > 0) {
                  clientX = event.changedTouches[0].clientX;
                  clientY = event.changedTouches[0].clientY;
                } else if (event.touches && event.touches.length > 0) {
                  clientX = event.touches[0].clientX;
                  clientY = event.touches[0].clientY;
                } else if (typeof event.clientX === "number") {
                  clientX = event.clientX;
                  clientY = event.clientY;
                }

                if (clientX === undefined || clientY === undefined) return;

                // A. Raycast directo
                if (THREE?.Raycaster && THREE?.Vector2) {
                  const mouse = new THREE.Vector2(
                    ((clientX - rect.left) / rect.width) * 2 - 1,
                    -((clientY - rect.top) / rect.height) * 2 + 1
                  );
                  const raycaster = new THREE.Raycaster();
                  raycaster.setFromCamera(mouse, camera);
                  const intersects = raycaster.intersectObject(obj, true);
                  if (intersects && intersects.length > 0) {
                    openLink();
                    return;
                  }
                }

                // B. Fallback de proyeccion de pantalla
                let wx = 0, wy = 0, wz = 0;
                if (obj.getWorldPosition) {
                  const posVec = { x: 0, y: 0, z: 0 };
                  obj.getWorldPosition(posVec);
                  wx = posVec.x; wy = posVec.y; wz = posVec.z;
                } else if (obj.matrixWorld) {
                  wx = obj.matrixWorld.elements[12];
                  wy = obj.matrixWorld.elements[13];
                  wz = obj.matrixWorld.elements[14];
                }

                const screenPos = { x: wx, y: wy, z: wz };
                if (camera.project) {
                  camera.project(screenPos);
                  if (screenPos.z < 1 && screenPos.z > -1) {
                    const screenX = ((screenPos.x + 1) / 2) * rect.width + rect.left;
                    const screenY = ((-screenPos.y + 1) / 2) * rect.height + rect.top;
                    if (Math.hypot(screenX - clientX, screenY - clientY) < 65) {
                      openLink();
                    }
                  }
                }
              } catch (hitErr) {}
            };

            const canvas = world.three?.renderer?.domElement || document.querySelector("canvas") || window;
            canvas.addEventListener("click", checkSocialHit);
            canvas.addEventListener("touchend", checkSocialHit, { passive: true });
          } catch (initErr) {
            console.error("[LinkOpenerComponent] Init error:", initErr);
          }
        }
      });
    } catch (e) {
      console.error("Error registering LinkOpenerComponent:", e);
    }

    // --- Component: VideoControlComponent ---
    try {
      ECS.registerComponent({
        name: "VideoControlComponent",
        schema: {
          targetName: ECS.string,
          videoSrc: ECS.string
        },
        schemaDefaults: {
          targetName: "TarjetaProfesional",
          videoSrc: "assets/Un_vagon_llamado_deseo_1.mp4"
        },
        data: {
          isPlaying: ECS.boolean
        },
        add: (world, component) => {
          try {
            component.data.isPlaying = false;
            let videoElement = null;
            let uiButton = null;
            const targetName = component.schema.targetName || "TarjetaProfesional";

            const findOrCreateVideo = () => {
              if (videoElement && videoElement.readyState >= 1) return videoElement;
              try {
                const obj = world.three?.entityToObject?.get(component.eid);
                if (obj) {
                  obj.traverse((child) => {
                    if (child.material?.map?.image instanceof HTMLVideoElement) {
                      videoElement = child.material.map.image;
                    }
                  });
                }
              } catch (e) {}

              if (!videoElement) {
                const videos = Array.from(document.querySelectorAll("video"));
                const matchedVideo = videos.find((v) => {
                  const src = v.src || v.querySelector("source")?.src || "";
                  return src.includes("Un_vagon_llamado_deseo") || src.includes("un_vagon") || src.includes(".mp4");
                });
                if (matchedVideo) {
                  videoElement = matchedVideo;
                } else if (videos.length > 0) {
                  videoElement = videos[0];
                }
              }

              if (!videoElement) {
                videoElement = document.createElement("video");
                videoElement.src = component.schema.videoSrc || "assets/Un_vagon_llamado_deseo_1.mp4";
                videoElement.crossOrigin = "anonymous";
                videoElement.loop = true;
                videoElement.setAttribute("playsinline", "true");
                videoElement.setAttribute("webkit-playsinline", "true");
                videoElement.style.display = "none";
                document.body.appendChild(videoElement);
              }

              if (videoElement) {
                videoElement.playsInline = true;
                videoElement.loop = true;
              }
              return videoElement;
            };

            const updateUiState = (playing) => {
              if (!uiButton) return;
              if (playing) {
                uiButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5" /><rect x="14" y="4" width="4" height="16" rx="1.5" /></svg>';
                uiButton.style.backgroundColor = "rgba(15, 23, 42, 0.85)";
              } else {
                uiButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="margin-left: 3px;"><polygon points="5,3 19,12 5,21" /></svg>';
                uiButton.style.backgroundColor = "rgba(239, 68, 68, 0.85)";
              }
            };

            const playVideo = async () => {
              const vid = findOrCreateVideo();
              if (!vid) return;
              try {
                await vid.play();
                component.data.isPlaying = true;
                updateUiState(true);
                console.log("[VideoControlComponent] Video reproduciondose con sonido");
              } catch (error) {
                console.warn("[VideoControlComponent] Autoplay seguro...", error);
                try {
                  vid.muted = true;
                  await vid.play();
                  component.data.isPlaying = true;
                  updateUiState(true);
                  const unlockSound = () => {
                    if (vid) {
                      vid.muted = false;
                      vid.volume = 1.0;
                    }
                    window.removeEventListener("touchstart", unlockSound);
                    window.removeEventListener("click", unlockSound);
                    console.log("[VideoControlComponent] Audio desbloqueado");
                  };
                  window.addEventListener("touchstart", unlockSound, { once: true });
                  window.addEventListener("click", unlockSound, { once: true });
                } catch (innerErr) {}
              }
            };

            const pauseVideo = () => {
              const vid = findOrCreateVideo();
              if (!vid) return;
              vid.pause();
              component.data.isPlaying = false;
              updateUiState(false);
              console.log("[VideoControlComponent] Video pausado");
            };

            const togglePlayPause = () => {
              const vid = findOrCreateVideo();
              if (!vid) return;
              if (vid.paused) {
                vid.muted = false;
                playVideo();
              } else {
                pauseVideo();
              }
            };

            const createUiButton = () => {
              if (document.getElementById("video-control-toggle-btn")) {
                uiButton = document.getElementById("video-control-toggle-btn");
                return;
              }
              uiButton = document.createElement("button");
              uiButton.id = "video-control-toggle-btn";
              uiButton.setAttribute("aria-label", "Pausar o Reanudar Video");
              Object.assign(uiButton.style, {
                position: "fixed",
                bottom: "24px",
                right: "24px",
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(8px)",
                webkitBackdropFilter: "blur(8px)",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
                color: "#FFFFFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: "9999",
                outline: "none",
                transition: "transform 0.15s ease, background-color 0.2s ease",
                userSelect: "none",
                webkitUserSelect: "none",
                touchAction: "manipulation"
              });
              updateUiState(false);
              uiButton.addEventListener("pointerdown", (e) => {
                e.stopPropagation();
                uiButton.style.transform = "scale(0.92)";
              });
              const resetScale = () => {
                if (uiButton) uiButton.style.transform = "scale(1)";
              };
              uiButton.addEventListener("pointerup", resetScale);
              uiButton.addEventListener("pointercancel", resetScale);
              uiButton.addEventListener("click", (e) => {
                e.stopPropagation();
                togglePlayPause();
              });
              document.body.appendChild(uiButton);
            };

            createUiButton();

            const handleImageFound = (evt) => {
              const foundName = evt?.detail?.name || evt?.name;
              if (!foundName || foundName === targetName) {
                console.log(`[VideoControlComponent] Tarjeta "${targetName}" detectada. Iniciando video...`);
                playVideo();
              }
            };

            const handleImageLost = (evt) => {
              const lostName = evt?.detail?.name || evt?.name;
              if (!lostName || lostName === targetName) {
                console.log(`[VideoControlComponent] Tarjeta "${targetName}" perdida. Pausando video...`);
                pauseVideo();
              }
            };

            window.addEventListener("xrimagefound", handleImageFound);
            window.addEventListener("xrimagelost", handleImageLost);

            const XR8 = window.XR8;
            if (XR8 && XR8.addCameraPipelineModules) {
              XR8.addCameraPipelineModules([
                {
                  name: "VideoTargetTrackingObserver",
                  onImageFound: handleImageFound,
                  onImageLost: handleImageLost
                }
              ]);
            }
          } catch (initErr) {
            console.error("[VideoControlComponent] Init error:", initErr);
          }
        }
      });
    } catch (e) {
      console.error("Error registering VideoControlComponent:", e);
    }

    // --- Scene Graph Initialization ---
    try {
      const sceneData = JSON.parse('{"objects":{"47699d9e-18a5-4f88-a4f9-b8be92e8f74a":{"components":{},"geometry":null,"id":"47699d9e-18a5-4f88-a4f9-b8be92e8f74a","light":{"type":"ambient"},"material":null,"name":"Ambient Light","position":[10,5,5],"rotation":[0,0,0,1],"scale":[1,1,1],"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","order":0.4038940050501252},"a608ddd9-9379-464d-966f-5d8d8674c83c":{"camera":{"type":"perspective","xr":{"desktop":"disabled","xrCameraType":"world","headset":"disabled","phone":"AR","world":{"disableWorldTracking":true}}},"components":{},"geometry":null,"id":"a608ddd9-9379-464d-966f-5d8d8674c83c","material":null,"name":"Camera","position":[0.11021234810228797,1.7103830500121502,2.9534682386621958],"rotation":[0.0004436887233141012,0.9659425615285845,-0.25875089860082223,0.0016563336561801576],"scale":[1,1,1],"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","order":1.0308214152219775},"ac1989e3-3b71-49e2-a05f-e682aeb18c36":{"components":{},"geometry":null,"id":"ac1989e3-3b71-49e2-a05f-e682aeb18c36","light":{"intensity":1,"type":"directional"},"material":null,"name":"Directional Light","position":[20,50,10],"rotation":[0,0,0,1],"scale":[1,1,1],"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","order":0.6644431107322474},"9dc7379b-05f8-4beb-af4b-a5cf038a56c3":{"id":"9dc7379b-05f8-4beb-af4b-a5cf038a56c3","position":[0.00775452111507066,0.10883949592772793,0.03443241969513731],"rotation":[0.700909264299852,0,0,0.7132504491541805],"scale":[0.38461538461538514,0.38461538461538564,0.38461538461538564],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-avatar-anim-01":{"id":"comp-avatar-anim-01","name":"AvatarAnimationComponent","parameters":{"clip1":"Armature.001|mixamo.com|Layer0","clip2":"Armature|mixamo.com|Layer0"}}},"gltfModel":{"src":{"type":"asset","asset":"assets/YoBailanding.glb"},"animationClip":"Armature.001|mixamo.com|Layer0","loop":true,"collider":true},"name":"YoBailanding.glb","order":2.295440257932817},"24337461-b0b2-47db-a68d-1061a6608f2a":{"id":"24337461-b0b2-47db-a68d-1061a6608f2a","position":[0,0,0],"rotation":[-0.7071067811865475,0,0,0.7071067811865476],"scale":[1.932103081440475,2.1513397123000333,1],"geometry":null,"material":null,"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","components":{},"name":"Image Target","imageTarget":{"name":"Dmc"},"order":3.6434105978200564,"disabled":true},"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8":{"id":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","position":[0,0,0],"rotation":[-0.7071067811865475,0,0,0.7071067811865476],"scale":[2.6000000000000014,2.6000000000000014,2.6000000000000014],"geometry":null,"material":null,"parentId":"88453035-dc0f-486d-868a-8ff7c2fda864","components":{},"name":"Image Target (1)","imageTarget":{"name":"TarjetaProfesional"},"order":5.363991776955565},"0ed0800c-e667-4d35-bf03-4ceaf9f9a0f3":{"id":"0ed0800c-e667-4d35-bf03-4ceaf9f9a0f3","position":[0,0.9144730089247948,0.5008703406106403],"rotation":[0.7071067811865475,0,0,0.7071067811865476],"scale":[1.8461538461538463,1.1538461538461537,1.1538461538461535],"geometry":{"type":"plane","width":1,"height":1},"material":{"type":"basic","color":"#FFFFFF","textureSrc":{"type":"asset","asset":"assets/Un_vagon_llamado_deseo_1.mp4"}},"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-video-ctrl-01":{"id":"comp-video-ctrl-01","name":"VideoControlComponent","parameters":{"targetName":"TarjetaProfesional","videoSrc":"assets/Un_vagon_llamado_deseo_1.mp4"}}},"name":"Plane","order":11.062780065811888,"videoControls":{"volume":0.2},"hidden":false},"21713d56-49e9-4e3f-8d8a-b0a0f7085733":{"id":"21713d56-49e9-4e3f-8d8a-b0a0f7085733","position":[0,-0.28556072730335924,1.2290907895080168],"rotation":[0,0,0,1],"scale":[0.19999999999999993,0.33333333333333304,0.33333333333333315],"geometry":null,"material":null,"parentId":"0ed0800c-e667-4d35-bf03-4ceaf9f9a0f3","components":{},"ui":{"type":"3d","width":100,"height":36,"background":"#bd0000","borderRadius":18,"flexDirection":"row","backgroundOpacity":1,"padding":"10","gap":"6","alignItems":"center","justifyContent":"center"},"name":"Button","order":8.636582721891168,"hidden":false},"d327f1b1-8f61-4023-a4cd-456996deb5fb":{"id":"d327f1b1-8f61-4023-a4cd-456996deb5fb","position":[-0.323,0,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"21713d56-49e9-4e3f-8d8a-b0a0f7085733","components":{},"name":"Icon","ui":{"width":16,"height":16,"image":{"type":"asset","asset":"assets/pause-button-png-31.png"},"backgroundOpacity":1,"backgroundSize":"contain"},"order":0.18712984955022477},"a298cc6d-1145-4202-a179-255438cccd27":{"id":"a298cc6d-1145-4202-a179-255438cccd27","position":[0,0,0],"rotation":[0,0,0,1],"scale":[1,1,1],"geometry":null,"material":null,"parentId":"21713d56-49e9-4e3f-8d8a-b0a0f7085733","components":{},"name":"Text","ui":{"width":50,"height":14,"text":"Pausa","color":"#ffffff","fontSize":10,"font":{"type":"font","font":"Press Start 2p"},"verticalTextAlign":"center"},"order":1.2695086777501219},"6c555f07-7875-4241-8e6f-86c7e0c1852c":{"id":"6c555f07-7875-4241-8e6f-86c7e0c1852c","position":[0.42684057749265936,-0.4349873446529787,9.658659309085909e-17],"rotation":[0.7071067811865485,-2.8968314995582293e-18,-3.150675423702335e-18,0.7071067811865466],"scale":[0.40000000000000036,0.4000000000000019,0.4000000000000019],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-link-instagram-01":{"id":"comp-link-instagram-01","name":"LinkOpenerComponent","parameters":{"url":"https://www.instagram.com/samuel_aguirre22?igsh=eWRubXNxZW0wZW00"}}},"gltfModel":{"src":{"type":"asset","asset":"assets/InstagramPortafolio.glb"},"animationClip":"InstagramAction.001","loop":true,"collider":true},"name":"InstagramPortafolio.glb","order":3.863403699520937},"6faf9f26-33a1-4e9e-98dd-3144fb4683ab":{"id":"6faf9f26-33a1-4e9e-98dd-3144fb4683ab","position":[-0.7493755959479346,-0.20528576222429212,4.558259596982686e-17],"rotation":[0.7071067811865474,0,0,0.7071067811865477],"scale":[0.4000000000000003,0.40000000000000013,0.40000000000000013],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-link-linkedin-01":{"id":"comp-link-linkedin-01","name":"LinkOpenerComponent","parameters":{"url":"https://www.linkedin.com/in/samuel-aguirre-10404737a?utm_source=share_via&utm_content=profile&utm_medium=member_android"}}},"gltfModel":{"src":{"type":"asset","asset":"assets/LinkedinPortafolio.glb"},"animationClip":"InstagramAction.002","loop":true,"collider":true},"name":"LinkedinPortafolio.glb","order":5.312500269344557},"60c44156-47f7-4013-a862-7e88bda52275":{"id":"60c44156-47f7-4013-a862-7e88bda52275","position":[-0.4497585570330217,-0.39386604374680506,8.745583007714443e-17],"rotation":[0.7071067811865474,0,0,0.7071067811865476],"scale":[0.4000000000000002,0.4000000000000002,0.4000000000000002],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-link-web-01":{"id":"comp-link-web-01","name":"LinkOpenerComponent","parameters":{"url":"https://legendary-sopapillas-2de101.netlify.app/"}}},"gltfModel":{"src":{"type":"asset","asset":"assets/WebPortafolio.glb"},"animationClip":"InstagramAction.002","loop":true,"collider":true},"name":"WebPortafolio.glb","order":7.271866834957741},"42536bef-518b-44c4-9f70-6fb6775f2c3b":{"id":"42536bef-518b-44c4-9f70-6fb6775f2c3b","position":[0.7403094671408736,-0.24853487542220906,5.5185828223216285e-17],"rotation":[0.7071067811865471,0,0,0.7071067811865479],"scale":[0.40000000000000063,0.40000000000000013,0.40000000000000013],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{"comp-link-whatsapp-01":{"id":"comp-link-whatsapp-01","name":"LinkOpenerComponent","parameters":{"url":"https://wa.me/573017384737"}}},"gltfModel":{"src":{"type":"asset","asset":"assets/WhatsappPortafolio.glb"},"animationClip":"InstagramAction","loop":true,"collider":true},"name":"WhatsappPortafolio.glb","order":8.832631599291263},"1f71af66-4a5c-487d-9b9e-e30977b4ba60":{"id":"1f71af66-4a5c-487d-9b9e-e30977b4ba60","position":[1.3164563695680738,0.33064753215819914,0],"rotation":[0.6916548014520734,-0.14701576633820648,-0.1470157665921911,0.6916548015083777],"scale":[0.16023534923242203,0.16023534923242239,0.16023534923242236],"geometry":null,"material":null,"parentId":"cd1f92a2-44f2-4cb1-9dd4-765c44c905f8","components":{},"gltfModel":{"src":{"type":"asset","asset":"assets/WhalterCatparao.glb"},"animationClip":"Armature|mixamo.com","loop":true},"name":"WhalterCatparao.glb","order":9.91298056231974}},"spaces":{"88453035-dc0f-486d-868a-8ff7c2fda864":{"id":"88453035-dc0f-486d-868a-8ff7c2fda864","name":"Default Space","activeCamera":"a608ddd9-9379-464d-966f-5d8d8674c83c"}},"entrySpaceId":"88453035-dc0f-486d-868a-8ff7c2fda864"}');
      delete sceneData.history;
      delete sceneData.historyVersion;
      ECS.application.init(sceneData);
    } catch (e) {
      console.error("Error during ECS application init:", e);
    }
  })();
})();