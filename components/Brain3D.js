"use client";
import { useEffect, useRef } from "react";

/**
 * Minimal raw WebGL brain:
 * - Two sphere hemispheres with FBM displacement (gyri look)
 * - Camera/FOV/scale tuned to match the reference
 * - DPR-aware canvas, ResizeObserver, and clean unmount
 */
export default function Brain3D({ activeSide }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const gl =
      el.getContext("webgl", { antialias: true, alpha: true }) ||
      el.getContext("experimental-webgl");
    if (!gl) return;

    // ---- matrices ----
    const m4 = {
      I: () =>
        new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
      mul: (a, b) => {
        const o = new Float32Array(16);
        for (let i = 0; i < 4; i++)
          for (let j = 0; j < 4; j++)
            o[i * 4 + j] =
              a[i * 4 + 0] * b[0 * 4 + j] +
              a[i * 4 + 1] * b[1 * 4 + j] +
              a[i * 4 + 2] * b[2 * 4 + j] +
              a[i * 4 + 3] * b[3 * 4 + j];
        return o;
      },
      persp: (fovy, aspect, near, far) => {
        const f = 1 / Math.tan((fovy * Math.PI) / 180 / 2),
          nf = 1 / (near - far);
        return new Float32Array([
          f / aspect,
          0,
          0,
          0,
          0,
          f,
          0,
          0,
          0,
          0,
          (far + near) * nf,
          -1,
          0,
          0,
          (2 * far * near) * nf,
          0,
        ]);
      },
      t: (m, [x, y, z]) => {
        const o = m.slice(0);
        o[12] += x;
        o[13] += y;
        o[14] += z;
        return o;
      },
      s: (m, [x, y, z]) => {
        const o = m.slice(0);
        o[0] *= x;
        o[5] *= y;
        o[10] *= z;
        return o;
      },
      rX: (m, r) => {
        const c = Math.cos(r),
          s = Math.sin(r);
        const R = new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
        return m4.mul(m, R);
      },
      rY: (m, r) => {
        const c = Math.cos(r),
          s = Math.sin(r);
        const R = new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
        return m4.mul(m, R);
      },
    };

    // ---- shaders ----
    const vs = `
      precision mediump float;
      attribute vec3 position; attribute vec3 normal;
      uniform mat4 uMVP, uModel;
      varying vec3 vN; varying vec3 vW;
      float snoise(vec3 p){ return sin(p.x*1.3+cos(p.y*1.7)+p.z*1.1)*cos(p.x*0.7 - p.y*1.1 + p.z*0.5); }
      float fbm(vec3 p){ float t=0.0, a=1.0, f=1.0; for(int i=0;i<4;i++){ t+=a*snoise(p*f); a*=0.5; f*=1.9; } return t*0.5+0.5; }
      void main(){
        vec3 N = normalize(normal);
        float d = fbm(position*vec3(2.2,2.0,2.4))*0.12 + fbm(position.zyx*vec3(3.1,2.8,2.6))*0.06;
        vec3 displaced = position + N * d;
        vec4 world = uModel * vec4(displaced,1.0);
        vW = world.xyz; vN = mat3(uModel) * N;
        gl_Position = uMVP * vec4(displaced,1.0);
      }`;
    const fs = `
      precision mediump float;
      varying vec3 vN; varying vec3 vW;
      uniform vec3 uColor; uniform float uEmissive;
      const vec3 L1 = normalize(vec3(-3.0, 2.0, 2.0));
      const vec3 L2 = normalize(vec3( 3.0, 2.0, 2.0));
      const vec3 L3 = normalize(vec3( 0.0,-1.0,-2.0));
      void main(){
        vec3 N = normalize(vN);
        float d1 = max(dot(N,L1), 0.0);
        float d2 = max(dot(N,L2), 0.0);
        float d3 = max(dot(N,L3), 0.0)*0.5;
        float diff = d1*1.05 + d2*1.0 + d3;
        vec3 col = uColor*(0.35 + diff*0.85) + uColor*uEmissive;
        float fres = pow(1.0 - max(dot(N, normalize(-vW)), 0.0), 3.0);
        col += vec3(0.12)*fres;
        gl_FragColor = vec4(col,1.0);
      }`;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILER_STATUS ?? gl.COMPILE_STATUS))
        throw gl.getShaderInfoLog(s);
      return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw gl.getProgramInfoLog(prog);

    const aPos = gl.getAttribLocation(prog, "position");
    const aNor = gl.getAttribLocation(prog, "normal");
    const uMVP = gl.getUniformLocation(prog, "uMVP");
    const uModel = gl.getUniformLocation(prog, "uModel");
    const uColor = gl.getUniformLocation(prog, "uColor");
    const uEmi = gl.getUniformLocation(prog, "uEmissive");

    // sphere
    const sphere = (() => {
      const r = 1, lat = 96, lon = 96;
      const pos = [], nor = [], idx = [];
      for (let i = 0; i <= lat; i++) {
        const th = (i * Math.PI) / lat, st = Math.sin(th), ct = Math.cos(th);
        for (let j = 0; j <= lon; j++) {
          const ph = (j * 2 * Math.PI) / lon, sp = Math.sin(ph), cp = Math.cos(ph);
          const x = cp * st, y = ct, z = sp * st;
          pos.push(r * x, r * y, r * z);
          nor.push(x, y, z);
        }
      }
      for (let i = 0; i < lat; i++) {
        for (let j = 0; j < lon; j++) {
          const a = i * (lon + 1) + j;
          const b = a + lon + 1;
          idx.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
      const ext = gl.getExtension("OES_element_index_uint");
      return {
        pos: new Float32Array(pos),
        nor: new Float32Array(nor),
        idx: ext ? new Uint32Array(idx) : new Uint16Array(idx),
        type: ext ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
      };
    })();

    // buffers
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const interleaved = new Float32Array((sphere.pos.length / 3) * 6);
    for (let i = 0, j = 0; i < sphere.pos.length; i += 3, j += 6) {
      interleaved[j] = sphere.pos[i];
      interleaved[j + 1] = sphere.pos[i + 1];
      interleaved[j + 2] = sphere.pos[i + 2];
      interleaved[j + 3] = sphere.nor[i];
      interleaved[j + 4] = sphere.nor[i + 1];
      interleaved[j + 5] = sphere.nor[i + 2];
    }
    gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(aNor);
    gl.vertexAttribPointer(aNor, 3, gl.FLOAT, false, 24, 12);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.idx, gl.STATIC_DRAW);

    // DPR-aware resize
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = el.clientWidth | 0;
      const h = el.clientHeight | 0;
      if (el.width !== (w * dpr) || el.height !== (h * dpr)) {
        el.width = w * dpr;
        el.height = h * dpr;
      }
      gl.viewport(0, 0, el.width, el.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el); resize();

    let t = 0, ry = 0, raf = 0;
    const proj = () => m4.persp(40, el.width / el.height, 0.1, 100);

    function drawHemi(offsetX, color, emissive) {
      let model = m4.I();
      model = m4.s(model, [1.6, 1.4, 1.6]);   // <- size matches comp
      model = m4.rX(model, 0.08);
      model = m4.rY(model, ry);
      model = m4.t(model, [offsetX, Math.sin(t * 0.6) * 0.02, 0]);

      const view = m4.t(m4.I(), [0, 0, -3.1]);
      const mvp = m4.mul(proj(), m4.mul(view, model));

      gl.useProgram(prog);
      gl.uniformMatrix4fv(uMVP, false, mvp);
      gl.uniformMatrix4fv(uModel, false, model);
      gl.uniform3fv(uColor, color);
      gl.uniform1f(uEmi, emissive);
      gl.drawElements(gl.TRIANGLES, sphere.idx.length, sphere.type, 0);
    }

    const loop = (now) => {
      t = now * 0.001;
      ry += 0.10 * 0.016; // slow idle rotation
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // left / right (exact palette)
      drawHemi(-0.55, new Float32Array([0.816, 0.369, 0.247]), activeSide === "left" ? 0.25 : 0.05);
      drawHemi(+0.55, new Float32Array([0.145, 0.267, 0.361]), activeSide === "right" ? 0.25 : 0.05);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [activeSide]);

  return (
    <div className="brain-3d">
      <canvas ref={ref} style={{ width: "100%", height: "100%", display: "block", borderRadius: 12 }} />
    </div>
  );
}
