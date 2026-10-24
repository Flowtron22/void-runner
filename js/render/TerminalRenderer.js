import * as THREE from 'three';

const BUTTON_SELECTOR = [
  '#home-screen .home-actions button',
  '#hub-screen .hub-station'
].join(',');

const SCREEN_TEXTURES = {
  home: new URL('../../assets/combat-patrol-menu-portrait.png', import.meta.url).href,
  intro: new URL('../../assets/ordo-malleus-intro.webp', import.meta.url).href,
  hub: new URL('../../assets/patrol-ship-command-deck.png', import.meta.url).href
};

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const screenFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uHasTexture;
  uniform float uTime;
  uniform float uReveal;
  uniform vec2 uCropScale;
  uniform vec2 uCropOffset;
  uniform vec2 uResolution;
  uniform vec3 uTint;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 sampleUv = uCropOffset + vUv * uCropScale;
    vec3 procedural = vec3(0.018, 0.043, 0.027);
    procedural += 0.018 * sin(vec3(1.0, 1.7, 2.3) + vUv.y * 8.0 + uTime * 0.14);
    vec3 image = texture2D(uTexture, sampleUv).rgb;
    vec3 color = mix(procedural, image, uHasTexture);

    float scan = 0.93 + 0.07 * sin(vUv.y * uResolution.y * 2.55);
    float noise = (hash(floor(vUv * uResolution + uTime * 13.0)) - 0.5) * 0.035;
    float vignette = smoothstep(0.0, 0.17, vUv.x) * smoothstep(0.0, 0.17, 1.0 - vUv.x)
      * smoothstep(0.0, 0.11, vUv.y) * smoothstep(0.0, 0.11, 1.0 - vUv.y);
    float sweep = smoothstep(0.12, 0.0, abs(fract(vUv.y - uTime * 0.035) - 0.5));

    color = color * scan + noise + uTint * sweep * 0.09;
    color *= mix(0.53, 1.0, vignette);
    color *= mix(0.16, 1.0, smoothstep(0.0, 1.0, uReveal));
    gl_FragColor = vec4(color, 1.0);
  }
`;

const glassFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(41.31, 289.17))) * 15731.743);
  }

  void main() {
    float edge = 1.0 - smoothstep(0.22, 0.49, distance(vUv, vec2(0.5)));
    float interference = sin(vUv.y * 760.0 + uTime * 1.7) * 0.5 + 0.5;
    float dust = step(0.9975, hash(floor(vUv * vec2(510.0, 790.0))));
    vec3 color = vec3(0.18, 0.31, 0.19) * (0.018 + interference * 0.018);
    color += vec3(0.46, 0.58, 0.38) * dust * 0.12;
    gl_FragColor = vec4(color, 0.09 + edge * 0.025);
  }
`;

const buttonFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uState;
  uniform float uPrimary;
  uniform float uDanger;
  uniform float uDisabled;
  uniform vec2 uSize;

  void main() {
    float px = 1.0 / max(min(uSize.x, uSize.y), 1.0);
    float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float border = 1.0 - smoothstep(px, px * 2.2, edge);
    float inner = smoothstep(px * 2.0, px * 5.0, edge);
    vec3 iron = mix(vec3(0.035, 0.047, 0.039), vec3(0.13, 0.14, 0.105), vUv.y);
    vec3 brass = mix(vec3(0.27, 0.19, 0.07), vec3(0.84, 0.67, 0.27), vUv.y);
    vec3 red = mix(vec3(0.20, 0.035, 0.025), vec3(0.61, 0.13, 0.07), vUv.y);
    vec3 base = mix(iron, brass, uPrimary);
    base = mix(base, red, uDanger);
    base *= 1.0 + uState * 0.38;
    float shine = smoothstep(0.10, 0.0, abs(vUv.x - fract(uTime * 0.14))) * uState;
    base += vec3(0.65, 0.52, 0.23) * shine * 0.22;
    vec3 rim = mix(vec3(0.31, 0.29, 0.21), vec3(0.95, 0.78, 0.34), max(uPrimary, uState));
    base = mix(base, rim, border * 0.72);
    base *= mix(1.0, 0.32, uDisabled);
    float alpha = mix(0.90, 0.98, inner);
    gl_FragColor = vec4(base, alpha);
  }
`;

function buttonState(button) {
  if (button.disabled) return 0;
  if (button.matches(':active')) return 1;
  if (button.matches(':hover, :focus-visible')) return 0.72;
  return 0;
}

export class TerminalRenderer {
  constructor(root) {
    this.root = root;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'terminal-webgl';
    this.canvas.setAttribute('aria-hidden', 'true');
    root.prepend(this.canvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 1);
    root.classList.add('webgl-terminal-active');

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    this.camera.position.z = 10;
    this.clock = new THREE.Clock();
    this.loader = new THREE.TextureLoader();
    this.textures = new Map();
    this.buttonMeshes = new Map();
    this.activeScreen = '';
    this.reveal = 0;

    this.createLayers();
    this.observe();
    this.resize();
    this.syncScreen(true);
    this.renderer.setAnimationLoop(() => this.render());
  }

  createLayers() {
    const chassisUrl = new URL('../../assets/command-terminal-chassis.png', import.meta.url).href;
    const chassisTexture = this.loader.load(chassisUrl, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      this.resize();
    });
    chassisTexture.colorSpace = THREE.SRGBColorSpace;
    this.chassis = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: chassisTexture, transparent: true })
    );
    this.chassis.position.z = 0;
    this.scene.add(this.chassis);

    this.screenMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: screenFragmentShader,
      uniforms: {
        uTexture: { value: chassisTexture },
        uHasTexture: { value: 0 },
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uCropScale: { value: new THREE.Vector2(1, 1) },
        uCropOffset: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(400, 700) },
        uTint: { value: new THREE.Color(0x6f9b65) }
      }
    });
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.screenMaterial);
    this.screen.position.z = 1;
    this.scene.add(this.screen);

    this.glassMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: glassFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } }
    });
    this.glass = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.glassMaterial);
    this.glass.position.z = 4;
    this.scene.add(this.glass);

    for (const [name, url] of Object.entries(SCREEN_TEXTURES)) {
      this.loader.load(url, texture => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
        this.textures.set(name, texture);
        if (this.activeScreen === name) this.applyTexture(name);
      });
    }
  }

  observe() {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.root);
    this.mutationObserver = new MutationObserver(() => this.syncScreen());
    this.mutationObserver.observe(this.root, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'disabled'] });
    window.addEventListener('pagehide', () => this.destroy(), { once: true });
  }

  getScreenName() {
    const active = this.root.querySelector('.screen.active');
    return active?.id?.replace('-screen', '') || 'home';
  }

  syncScreen(force = false) {
    const next = this.getScreenName();
    if (!force && next === this.activeScreen) return;
    this.activeScreen = next;
    this.reveal = 0;
    this.applyTexture(next);
    this.root.dataset.terminalScreen = next;
  }

  applyTexture(name) {
    const texture = this.textures.get(name);
    this.screenMaterial.uniforms.uHasTexture.value = texture ? 1 : 0;
    if (!texture) return;
    this.screenMaterial.uniforms.uTexture.value = texture;
    this.updateTextureCrop(texture);
  }

  updateTextureCrop(texture) {
    const image = texture?.image;
    if (!image || !this.screenWidth || !this.screenHeight) return;
    const imageAspect = image.width / image.height;
    const planeAspect = this.screenWidth / this.screenHeight;
    const scale = this.screenMaterial.uniforms.uCropScale.value.set(1, 1);
    const offset = this.screenMaterial.uniforms.uCropOffset.value.set(0, 0);
    if (imageAspect > planeAspect) {
      scale.x = planeAspect / imageAspect;
      offset.x = (1 - scale.x) * 0.5;
    } else {
      scale.y = imageAspect / planeAspect;
      offset.y = (1 - scale.y) * 0.5;
    }
  }

  resize() {
    const rect = this.root.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    this.chassis.scale.set(width, height, 1);
    this.screenWidth = width * 0.808;
    this.screenHeight = height * 0.743;
    this.screen.scale.set(this.screenWidth, this.screenHeight, 1);
    this.screen.position.set(0, height * 0.003, 1);
    this.glass.scale.copy(this.screen.scale);
    this.glass.position.set(0, height * 0.003, 4);
    this.screenMaterial.uniforms.uResolution.value.set(this.screenWidth, this.screenHeight);
    this.updateTextureCrop(this.screenMaterial.uniforms.uTexture.value);
  }

  makeButtonMesh(button) {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: buttonFragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uState: { value: 0 },
        uPrimary: { value: button.matches('.menu-primary, .primary, .primary-button') ? 1 : 0 },
        uDanger: { value: button.matches('.danger, .command-return') ? 1 : 0 },
        uDisabled: { value: button.disabled ? 1 : 0 },
        uSize: { value: new THREE.Vector2(100, 44) }
      }
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    mesh.position.z = 3;
    this.scene.add(mesh);
    this.buttonMeshes.set(button, mesh);
    return mesh;
  }

  syncButtons(time) {
    const rootRect = this.root.getBoundingClientRect();
    const visible = new Set();
    for (const button of this.root.querySelectorAll(BUTTON_SELECTOR)) {
      const rect = button.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && rect.bottom > rootRect.top && rect.top < rootRect.bottom;
      if (!isVisible) continue;
      visible.add(button);
      const mesh = this.buttonMeshes.get(button) || this.makeButtonMesh(button);
      const x = rect.left - rootRect.left + rect.width / 2 - this.width / 2;
      const y = this.height / 2 - (rect.top - rootRect.top + rect.height / 2);
      mesh.visible = true;
      mesh.position.x = x;
      mesh.position.y = y;
      mesh.scale.set(rect.width, rect.height, 1);
      mesh.material.uniforms.uTime.value = time;
      mesh.material.uniforms.uState.value = THREE.MathUtils.lerp(mesh.material.uniforms.uState.value, buttonState(button), 0.18);
      mesh.material.uniforms.uDisabled.value = button.disabled ? 1 : 0;
      mesh.material.uniforms.uSize.value.set(rect.width, rect.height);
    }
    for (const [button, mesh] of this.buttonMeshes) {
      if (!visible.has(button)) mesh.visible = false;
      if (!button.isConnected) {
        mesh.geometry.dispose();
        mesh.material.dispose();
        this.scene.remove(mesh);
        this.buttonMeshes.delete(button);
      }
    }
  }

  render() {
    const time = this.clock.getElapsedTime();
    const reducedMotion = document.body.classList.contains('reduced-motion');
    const shaderTime = reducedMotion ? 0 : time;
    this.syncScreen();
    this.reveal = reducedMotion ? 1 : Math.min(1, this.reveal + 0.045);
    this.screenMaterial.uniforms.uTime.value = shaderTime;
    this.screenMaterial.uniforms.uReveal.value = this.reveal;
    this.glassMaterial.uniforms.uTime.value = shaderTime;
    this.syncButtons(shaderTime);
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    for (const texture of this.textures.values()) texture.dispose();
    this.scene.traverse(object => {
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material?.map?.dispose?.();
        material?.dispose?.();
      }
    });
    this.renderer.dispose();
    this.root.classList.remove('webgl-terminal-active');
  }
}
