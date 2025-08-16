"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Brain3D({ activeSide }) {
  const containerRef = useRef(null);
  const leftRef = useRef();
  const rightRef = useRef();

  useEffect(() => {
    const el = containerRef.current;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    // --- Scene & Camera ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      40,
      el.clientWidth / el.clientHeight,
      0.1,
      100
    );
    // Camera angle & distance tuned to the reference
    camera.position.set(0, 0.18, 3.08);

    // --- Geometry ---
    // High segment UV sphere for smooth silhouette
    const geom = new THREE.SphereGeometry(1, 160, 120);

    // --- Shader (soft diffuse + rim, vertex fbm displacement) ---
    const vs = `
      precision highp float;
      varying vec3 vN;
      varying vec3 vW;
      uniform mat4 modelMatrix;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      attribute vec3 position;
      attribute vec3 normal;

      // cheap noise
      float snoise(vec3 p){
        return sin(p.x*1.3 + cos(p.y*1.7) + p.z*1.1) * cos(p.x*0.7 - p.y*1.1 + p.z*0.5);
      }
      float fbm(vec3 p){
        float t = 0.0, a = 1.0, f = 1.0;
        for(int i=0;i<4;i++){
          t += a * snoise(p*f);
          a *= 0.5; f *= 1.9;
        }
        return t*0.5 + 0.5;
      }

      void main(){
        vec3 N = normalize(normal);
        // tuned displacement depth to match ref micro-bump
        float d = fbm(position*vec3(2.2,2.0,2.4))*0.12
                + fbm(position.zyx*vec3(3.1,2.8,2.6))*0.06;
        vec3 displaced = position + N * d;

        vec4 world = modelMatrix * vec4(displaced, 1.0);
        vW = world.xyz;
        vN = normalize(mat3(modelMatrix) * N);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `;

    const fs = `
      precision highp float;
      varying vec3 vN;
      varying vec3 vW;

      uniform vec3 uBase;
      uniform float uEmissive;

      // 3 key lights roughly matching the reference
      const vec3 L1 = normalize(vec3(-3.0,  2.0,  2.0)); // warm left key
      const vec3 L2 = normalize(vec3( 3.0,  2.0,  2.0)); // cool right key
      const vec3 L3 = normalize(vec3( 0.0, -1.0, -2.0)); // underside fill

      void main(){
        vec3 N = normalize(vN);
        float d1 = max(dot(N, L1), 0.0);
        float d2 = max(dot(N, L2), 0.0);
        float d3 = max(dot(N, L3), 0.0) * 0.45;

        // soft matte look
        float diff = d1*1.05 + d2*1.0 + d3;
        vec3 col = uBase * (0.35 + diff*0.85);

        // gentle rim for a soft edge highlight
        float rim = pow(1.0 - max(dot(N, normalize(-vW)), 0.0), 3.0);
        col += vec3(0.12) * rim;

        // on-hover emissive lift
        col += uBase * uEmissive;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const makeMat = (baseHex) =>
      new THREE.ShaderMaterial({
        vertexShader: vs,
        fragmentShader: fs,
        uniforms: {
          uBase: { value: new THREE.Color(baseHex).convertSRGBToLinear() },
          uEmissive: { value: 0.05 },
        },
        glslVersion: THREE.GLSL3, // Three uses #version 300 es when possible
      });

    // --- Left (red) & Right (blue) hemispheres ---
    const left = new THREE.Mesh(geom, makeMat("#d05e3f"));
    const right = new THREE.Mesh(geom, makeMat("#25445c"));

    // Transform to match reference pose/scale
    const group = new THREE.Group();
    left.position.x = -0.55;
    right.position.x = 0.55;
    group.scale.set(1.55, 1.35, 1.55);
    group.rotation.x = 0.08;
    scene.add(group);
    group.add(left, right);

    leftRef.current = left;
    rightRef.current = right;

    // --- Animate (slow yaw + tiny bob) ---
    let raf = 0;
    const animate = (t) => {
      raf = requestAnimationFrame(animate);
      group.rotation.y += 0.0015;
      group.position.y = Math.sin(t * 0.0006) * 0.02;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    // --- Resize handling ---
    const onResize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      el.innerHTML = "";
    };
  }, []);

  // On hover/focus, boost emissive per side
  useEffect(() => {
    if (!leftRef.current || !rightRef.current) return;
    leftRef.current.material.uniforms.uEmissive.value =
      activeSide === "left" ? 0.25 : 0.05;
    rightRef.current.material.uniforms.uEmissive.value =
      activeSide === "right" ? 0.25 : 0.05;
  }, [activeSide]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height: "100%" }}
      aria-label="3D render of a human brain, red left hemisphere and blue right hemisphere."
      role="img"
    />
  );
}
