import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';

/**
 * WebGL scene for the auth-screen backdrop, kept in its own module so the
 * `three` imports above are *static named* imports. That lets Rollup
 * tree-shake the library down to just these classes — a dynamic
 * `import('three')` would pull the entire namespace instead. The caller
 * dynamic-imports this module, so the chunk is still fetched only on the
 * auth routes.
 */

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform float uDark;

  varying vec2 vUv;

  // Ashima 2D simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Only two octaves: more would add fine detail and make the field read as
  // marbled texture rather than as soft, out-of-focus colour.
  float fbm(vec2 p) {
    return snoise(p) * 0.65 + snoise(p * 2.0) * 0.25;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

    float t = uTime * 0.04;

    // A single, gentle domain warp at low frequency gives big lava-lamp
    // blooms that drift rather than a busy scrolling pattern.
    vec2 warp = vec2(fbm(p * 0.5 + vec2(0.0, t)),
                     fbm(p * 0.5 + vec2(2.7, -t)));
    float n = fbm(p * 0.7 + 0.8 * warp);
    n = smoothstep(-0.55, 0.75, n);

    vec3 darkBase   = vec3(0.008, 0.023, 0.043);
    vec3 darkMid    = vec3(0.020, 0.106, 0.094);
    vec3 darkAccent = vec3(0.043, 0.278, 0.212);

    vec3 lightBase   = vec3(0.976, 0.984, 0.992);
    vec3 lightMid    = vec3(0.886, 0.965, 0.933);
    vec3 lightAccent = vec3(0.776, 0.933, 0.867);

    vec3 dark = mix(darkBase, darkMid, n);
    dark = mix(dark, darkAccent, smoothstep(0.62, 1.0, n) * 0.55);

    vec3 light = mix(lightBase, lightMid, n);
    light = mix(light, lightAccent, smoothstep(0.62, 1.0, n) * 0.6);

    vec3 color = mix(light, dark, uDark);

    // Fade hard toward the flat app background in the middle, so the form
    // card always sits on a quiet, even backdrop and the colour lives at
    // the edges of the viewport.
    float centreCalm = 1.0 - smoothstep(0.05, 0.95, length(p));
    color = mix(color, mix(lightBase, darkBase, uDark), centreCalm * 0.85);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const isDark = () => document.documentElement.classList.contains('dark');

/** Boots the scene and returns a teardown function. Throws if WebGL is unavailable. */
export function createAuthBackground(canvas: HTMLCanvasElement): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true });
  // Retina beyond 2x costs a lot of fill rate for no visible gain.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uDark: { value: isDark() ? 1 : 0 },
  };

  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
  });
  scene.add(new Mesh(geometry, material));

  const resize = () => {
    const { innerWidth: width, innerHeight: height } = window;
    renderer.setSize(width, height, false);
    uniforms.uResolution.value.set(width, height);
  };
  resize();

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let targetDark = uniforms.uDark.value;
  let frame = 0;
  const startedAt = performance.now();

  const renderFrame = (now: number) => {
    uniforms.uTime.value = (now - startedAt) / 1000;
    // Ease the palette so toggling the theme cross-fades instead of snapping.
    uniforms.uDark.value += (targetDark - uniforms.uDark.value) * 0.06;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(renderFrame);
  };

  const startLoop = () => {
    if (motionQuery.matches) {
      uniforms.uDark.value = targetDark;
      renderer.render(scene, camera); // a single static frame
      return;
    }
    if (!frame) frame = requestAnimationFrame(renderFrame);
  };

  const stopLoop = () => {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  // Don't burn cycles (or laptop battery) on a tab nobody is looking at.
  const onVisibility = () => (document.hidden ? stopLoop() : startLoop());
  const onResize = () => {
    resize();
    if (motionQuery.matches) renderer.render(scene, camera);
  };

  const themeObserver = new MutationObserver(() => {
    targetDark = isDark() ? 1 : 0;
    if (motionQuery.matches) {
      uniforms.uDark.value = targetDark;
      renderer.render(scene, camera);
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  motionQuery.addEventListener('change', startLoop);
  startLoop();

  return () => {
    stopLoop();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibility);
    motionQuery.removeEventListener('change', startLoop);
    themeObserver.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}
