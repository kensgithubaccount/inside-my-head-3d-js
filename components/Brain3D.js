"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Brain3D({ activeSide }){
  const containerRef = useRef(null);
  const hemiLeft = useRef();
  const hemiRight = useRef();
  const groupRef = useRef();

  useEffect(()=>{
    const el = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, el.clientWidth/el.clientHeight, 0.1, 100);
    camera.position.set(0, 0.45, 3.1);

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const leftKey = new THREE.DirectionalLight(new THREE.Color("#d05e3f"), 1.05);
    leftKey.position.set(-3,2,2);
    const rightKey = new THREE.DirectionalLight(new THREE.Color("#25445c"), 1.0);
    rightKey.position.set(3,2,2);
    const rim = new THREE.DirectionalLight(0xffffff, 0.4);
    rim.position.set(0,-1,-2);
    scene.add(leftKey, rightKey, rim);

    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

    const createHemi = (side, color, offsetX) => {
      const geom = makeGyriSphere(1, 7, side);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.9, metalness: 0.05, envMapIntensity: 0.4,
        emissive: new THREE.Color(color), emissiveIntensity: 0.05
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(offsetX, 0, 0);
      mesh.rotation.x = 0.08;
      group.add(mesh);
      return mesh;
    };

    hemiLeft.current = createHemi("left", "#d05e3f", -0.55);
    hemiRight.current = createHemi("right", "#25445c", 0.55);
    group.scale.set(1.6,1.4,1.6);

    let raf = 0;
    const animate = (t)=>{
      raf = requestAnimationFrame(animate);
      group.rotation.y += 0.0016 * Math.min(2, renderer.getPixelRatio());
      group.position.y = Math.sin(t*0.0006)*0.02;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    const onResize = ()=>{
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w,h);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return ()=>{ cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); el.innerHTML=""; };
  }, []);

  useEffect(()=>{
    if (!hemiLeft.current || !hemiRight.current) return;
    hemiLeft.current.material.emissiveIntensity = activeSide==="left"?0.25:0.05;
    hemiRight.current.material.emissiveIntensity = activeSide==="right"?0.25:0.05;
  }, [activeSide]);

  return <div ref={containerRef} style={{position:"relative", width:"100%", height:"100%"}} aria-label="3D brain" role="img" />;
}

// geometry helpers
function makeGyriSphere(radius=1, detail=6, side="left"){
  const geom = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geom.attributes.position;
  const v = new THREE.Vector3();
  for(let i=0;i<pos.count;i++){
    v.fromBufferAttribute(pos, i);
    const bias = side==="left" ? 1.0 : 0.95;
    const n = fbm(v.x*2.2, v.y*2.0, v.z*2.4);
    const n2 = fbm(v.z*3.1, v.x*2.8, v.y*2.6);
    const disp = (n*0.12 + n2*0.06) * bias;
    v.normalize().multiplyScalar(radius + disp);
    pos.setXYZ(i, v.x, v.y*1.02, v.z);
  }
  geom.computeVertexNormals();
  return geom;
}
function fbm(x,y,z){
  let t=0, amp=1, freq=1;
  for(let i=0;i<4;i++){
    t += amp * snoise(x*freq, y*freq, z*freq);
    amp *= 0.5; freq *= 1.9;
  }
  return t*0.5 + 0.5;
}
function snoise(x,y,z){
  return Math.sin(x*1.3+Math.cos(y*1.7)+z*1.1) * Math.cos(x*0.7 - y*1.1 + z*0.5);
}
