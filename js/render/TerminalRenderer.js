import * as THREE from 'three';

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

  void main() {
    vec2 sampleUv = uCropOffset + vUv * uCropScale;
    vec3 procedural = vec3(0.018, 0.043, 0.027);
    procedural += 0.018 * sin(vec3(1.0, 1.7, 2.3) + vUv.y * 8.0 + uTime * 0.14);
    vec3 image = texture2D(uTexture, sampleUv).rgb;
    vec3 color = mix(procedural, image, uHasTexture);

    float vignette = smoothstep(0.0, 0.17, vUv.x) * smoothstep(0.0, 0.17, 1.0 - vUv.x)
      * smoothstep(0.0, 0.11, vUv.y) * smoothstep(0.0, 0.11, 1.0 - vUv.y);

    // This is the environmental signal only. The shared CSS glass pass covers
    // this image, map canvas AND HTML so lettering receives the same scanlines.
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luminance) * vec3(0.80, 1.0, 0.67), color, 0.62);
    color *= mix(0.53, 1.0, vignette);
    color *= mix(0.16, 1.0, smoothstep(0.0, 1.0, uReveal));
    gl_FragColor = vec4(color, 1.0);
  }
`;

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
    this.activeScreen = '';
    this.reveal = 0;
    this.lastRenderTime = 0;

    this.createLayers();
    this.observe();
    this.resize();
    this.syncScreen(true);
    this.renderer.setAnimationLoop(time => {
      const chartOpen = this.activeScreen === 'sector' || this.activeScreen === 'map';
      if (chartOpen && time - this.lastRenderTime < 50) return;
      this.lastRenderTime = time;
      this.render();
    });
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
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneMinusDstColorFactor,
      blendDst: THREE.OneFactor,
      uniforms: {
        uTexture: { value: chassisTexture },
        uHasTexture: { value: 0 },
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uCropScale: { value: new THREE.Vector2(1, 1) },
        uCropOffset: { value: new THREE.Vector2(0, 0) }
      }
    });
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.screenMaterial);
    this.screen.position.z = 1;
    this.scene.add(this.screen);

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
    this.updateTextureCrop(this.screenMaterial.uniforms.uTexture.value);
  }

  render() {
    const time = this.clock.getElapsedTime();
    const reducedMotion = document.body.classList.contains('reduced-motion');
    const shaderTime = reducedMotion ? 0 : time;
    this.syncScreen();
    this.reveal = reducedMotion ? 1 : Math.min(1, this.reveal + 0.045);
    this.screenMaterial.uniforms.uTime.value = shaderTime;
    this.screenMaterial.uniforms.uReveal.value = this.reveal;
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
