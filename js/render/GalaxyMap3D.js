import * as THREE from 'three';
import { constellationFraming } from './ChartLayout.js';

const TONES = {
  gold: {core:0xffe5a0, light:0xe69645},
  blue: {core:0xd8ffff, light:0x4fb7c2},
  white:{core:0xffffff, light:0xa8b9d3},
  red:  {core:0xffb19b, light:0xc94842},
  amber:{core:0xffe1a0, light:0xe38a3c},
  ice:  {core:0xd8ffff, light:0x58c8c8},
  crimson:{core:0xffb0a4, light:0xd33f48}
};

const clamp = (value,min,max) => Math.max(min,Math.min(max,value));

function seededRandom(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function radialTexture(inner,outer = 'rgba(0,0,0,0)',size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  gradient.addColorStop(0,inner);
  gradient.addColorStop(.12,inner);
  gradient.addColorStop(.38,inner.replace(/([\d.]+)\)$/,'0.34)'));
  gradient.addColorStop(1,outer);
  context.fillStyle = gradient;
  context.fillRect(0,0,size,size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function neutronStarTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const center = size / 2;
  context.globalCompositeOperation = 'screen';
  const glow = context.createRadialGradient(center,center,0,center,center,center*.48);
  glow.addColorStop(0,'rgba(255,255,255,1)');
  glow.addColorStop(.11,'rgba(239,249,255,1)');
  glow.addColorStop(.23,'rgba(142,210,255,.92)');
  glow.addColorStop(.5,'rgba(73,151,220,.28)');
  glow.addColorStop(1,'rgba(22,74,132,0)');
  context.fillStyle = glow;
  context.fillRect(0,0,size,size);
  const horizontal = context.createLinearGradient(0,center,size,center);
  horizontal.addColorStop(0,'rgba(92,178,255,0)');
  horizontal.addColorStop(.46,'rgba(176,226,255,.42)');
  horizontal.addColorStop(.5,'rgba(255,255,255,.95)');
  horizontal.addColorStop(.54,'rgba(176,226,255,.42)');
  horizontal.addColorStop(1,'rgba(92,178,255,0)');
  context.fillStyle = horizontal;
  context.fillRect(0,center-1,size,2);
  const vertical = context.createLinearGradient(center,0,center,size);
  vertical.addColorStop(0,'rgba(110,194,255,0)');
  vertical.addColorStop(.47,'rgba(205,236,255,.3)');
  vertical.addColorStop(.5,'rgba(255,255,255,.88)');
  vertical.addColorStop(.53,'rgba(205,236,255,.3)');
  vertical.addColorStop(1,'rgba(110,194,255,0)');
  context.fillStyle = vertical;
  context.fillRect(center-1,0,2,size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function nebulaTexture(colors,size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  context.clearRect(0,0,size,size);
  const random = seededRandom(4021);
  context.globalCompositeOperation = 'source-over';
  for (let index=0; index<28; index++) {
    const progress = index / 27;
    const x = size * (.02 + progress * .96) + (random()-.5)*size*.12;
    const y = size * (.2 + progress*.58 + Math.sin(progress*Math.PI*2.2)*.11) + (random()-.5)*size*.12;
    const radius = size*(.07+random()*.11);
    const color = colors[index % colors.length];
    // Soft before rasterisation: no Canvas filter or ellipse clipping dependency.
    context.save();
    context.translate(x,y); context.rotate(-.7+random()*.5);
    context.scale(radius,radius*(.36+random()*.3));
    const gradient = context.createRadialGradient(0,0,0,0,0,1);
    gradient.addColorStop(0,`${color}60`);
    gradient.addColorStop(.28,`${color}32`);
    gradient.addColorStop(.65,`${color}0c`);
    gradient.addColorStop(1,`${color}00`);
    context.fillStyle = gradient;
    context.fillRect(-1,-1,2,2);
    context.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  return texture;
}

export class GalaxyMap3D {
  constructor({viewport,canvas,labelLayer,mode='galaxy',systems=[],routes=[],onSelect,reducedMotion=false}) {
    this.viewport = viewport;
    this.canvas = canvas;
    this.labelLayer = labelLayer;
    this.mode = mode;
    this.systems = systems;
    this.routes = routes;
    this.routeChart = routes.length > 0;
    this.onSelect = onSelect;
    this.reducedMotion = reducedMotion;
    this.abortController = new AbortController();
    this.pointerMap = new Map();
    this.pickables = [];
    this.systemGroups = new Map();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    const initialVerticalFocus = mode === 'galaxy' ? 2.25 : 0;
    this.target = new THREE.Vector3(0,initialVerticalFocus,0);
    this.cameraGoal = new THREE.Vector3(0,initialVerticalFocus,mode === 'galaxy' ? 29 : 23);
    this.travel = null;
    this.drag = null;
    this.scene = new THREE.Scene();
    const spaceColor = new THREE.Color(mode === 'galaxy' ? 0x020307 : 0x01060a);
    this.scene.fog = new THREE.FogExp2(spaceColor,this.routeChart ? .009 : mode === 'galaxy' ? .018 : .025);
    this.camera = new THREE.PerspectiveCamera(42,1,.1,400);
    this.camera.position.copy(this.cameraGoal);
    this.camera.lookAt(this.target);
    this.compactGpu = window.matchMedia('(max-width: 640px), (pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({canvas,alpha:true,premultipliedAlpha:false,antialias:!this.compactGpu,powerPreference:'high-performance'});
    this.renderer.setClearColor(0x000000,0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,this.compactGpu ? 1 : 1.35));
    this.createEnvironment();
    this.createSystems();
    this.createRoutes();
    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(viewport);
    this.resize();
    this.render();
    this.renderer.setAnimationLoop(() => this.render());
  }

  createEnvironment() {
    const galaxy = this.mode === 'galaxy';
    const starRandom = seededRandom(galaxy ? 8219 : 4417);
    for (let layer=0; layer<3; layer++) {
      const count = galaxy ? 360-layer*65 : 290-layer*55;
      const positions = new Float32Array(count*3);
      const colors = new Float32Array(count*3);
      for (let index=0; index<count; index++) {
        positions[index*3] = (starRandom()-.5)*(this.routeChart ? 100 : 34+layer*20);
        positions[index*3+1] = (starRandom()-.5)*(this.routeChart ? 160 : 46+layer*18)+(this.routeChart ? 25 : 0);
        positions[index*3+2] = -8-layer*8-starRandom()*12;
        const warmth = starRandom();
        colors[index*3] = warmth > .86 ? 1 : .58+starRandom()*.28;
        colors[index*3+1] = warmth > .86 ? .68 : .72+starRandom()*.25;
        colors[index*3+2] = warmth > .86 ? .48 : .82+starRandom()*.18;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
      geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
      const points = new THREE.Points(geometry,new THREE.PointsMaterial({size:.045+layer*.025,vertexColors:true,transparent:true,opacity:.78-layer*.14,sizeAttenuation:true,depthWrite:false}));
      points.userData.parallax = .06+layer*.04;
      this.scene.add(points);
      (this.starLayers ||= []).push(points);
    }

    const nebula = nebulaTexture(galaxy ? ['#4e3968','#793c68','#2d5275'] : ['#18506b','#2c7180','#394d77']);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(this.routeChart ? 220 : galaxy ? 52 : 42,this.routeChart ? 320 : galaxy ? 66 : 58),new THREE.MeshBasicMaterial({map:nebula,transparent:true,opacity:galaxy?.88:.82,blending:THREE.AdditiveBlending,depthWrite:false}));
    plane.position.set(this.routeChart ? 8 : 0,this.routeChart ? 35 : 0,this.routeChart ? -35 : -15);
    plane.rotation.z = galaxy ? -.14 : .08;
    this.scene.add(plane);
    this.nebulaPlane = plane;

    const grid = new THREE.GridHelper(54,27,galaxy?0x56475a:0x315361,galaxy?0x282635:0x182d35);
    grid.rotation.x = Math.PI/2;
    grid.position.z = -6;
    grid.material.transparent = true;
    grid.material.opacity = galaxy ? .16 : .13;
    this.scene.add(grid);

    if (!galaxy) this.createLocalSystem();
  }

  createLocalSystem() {
    const starTexture = radialTexture('rgba(255,233,176,1)');
    const core = new THREE.Sprite(new THREE.SpriteMaterial({map:starTexture,color:0xffcf75,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    core.scale.set(5.6,5.6,1);
    core.position.set(-1.2,.2,-2.5);
    if (!this.routeChart) this.scene.add(core);
    else { core.material.map.dispose(); core.material.dispose(); }
    this.localCore = core;

    const dustRandom = seededRandom(913);
    const positions = [];
    for (let index=0; index<540; index++) {
      const angle = dustRandom()*Math.PI*2;
      const radius = 3+dustRandom()*13;
      positions.push(Math.cos(angle)*radius-1.2,Math.sin(angle)*radius*.68+.2,-4+dustRandom()*3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const dust = new THREE.Points(geometry,new THREE.PointsMaterial({color:0x678b9b,size:.035,transparent:true,opacity:.34,depthWrite:false}));
    this.scene.add(dust);
    this.localDust = dust;

    const ship = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.ConeGeometry(.28,1.15,4),new THREE.MeshBasicMaterial({color:0xb8c1bd}));
    hull.rotation.z = -Math.PI/2;
    ship.add(hull);
    const engine = new THREE.Sprite(new THREE.SpriteMaterial({map:radialTexture('rgba(101,220,190,1)'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    engine.scale.set(.8,.8,1); engine.position.x = -.58; ship.add(engine);
    const current = this.systems.find(system => system.current);
    ship.position.set(...(current ? [current.position[0] - .7,current.position[1] + .45,1.5] : [-6.4,-6.8,1.5]));
    ship.rotation.z = .15;
    this.scene.add(ship);
    this.ship = ship;
  }

  createSystems() {
    const starTexture = neutronStarTexture();
    for (const system of this.systems) {
      const tone = TONES[system.tone] || TONES.gold;
      const group = new THREE.Group();
      group.position.set(...system.position);
      group.userData = {id:system.id,locked:system.locked};
      const starColor = system.current ? new THREE.Color(0xa6e5be) : system.complete ? new THREE.Color(0x9eb98c) : system.locked ? new THREE.Color(0xb0b9bb) : new THREE.Color(tone.light).lerp(new THREE.Color(tone.core),.28);
      const opacity = system.locked ? .66 : 1;
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({map:starTexture,color:starColor,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
      const scale = (system.size || 1)*(system.primary ? 1.9 : 1.3)*1.2;
      halo.scale.set(scale,scale,1);
      halo.userData = group.userData;
      group.add(halo);
      const pick = new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,opacity:.001,depthWrite:false}));
      pick.scale.set(Math.max(1.65,scale*1.35),Math.max(1.65,scale*1.35),1);
      pick.userData = group.userData;
      group.add(pick);
      this.pickables.push(pick);
      this.scene.add(group);
      this.systemGroups.set(system.id,{group,halo,baseScale:scale,baseOpacity:opacity,system});
    }
  }

  createRoutes() {
    this.routeLines = [];
    for (const route of this.routes) {
      const from = this.systemGroups.get(route.from)?.group.position;
      const to = this.systemGroups.get(route.to)?.group.position;
      if (!from || !to) continue;
      const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
      const material = new THREE.LineDashedMaterial({color:route.travelled ? 0xc4b57c : route.available ? 0x95bb8d : 0x8a9290,
        transparent:true, opacity:route.travelled ? .85 : route.available ? .8 : .4,
        dashSize:.16, gapSize:.13, depthWrite:false});
      const line = new THREE.Line(geometry, material);
      line.computeLineDistances(); this.scene.add(line);
      this.routeLines.push({line, route});
    }
  }

  zoomBounds() { return this.routeChart ? [Math.max(10,this.nearDistance * .7), this.chartDistance * 1.08] : [12,38]; }

  setZoom(distance) {
    this.travel = null;
    this.viewport.classList.remove('webgl-travelling');
    this.cameraGoal.z = clamp(distance,...this.zoomBounds());
    if (this.routeChart) {
      const amount = clamp((this.cameraGoal.z-this.zoomFocusDistance)/Math.max(1,this.chartDistance-this.zoomFocusDistance),0,1);
      this.target.lerpVectors(this.zoomFocus,this.chartCenter,amount);
      this.cameraGoal.x=this.target.x; this.cameraGoal.y=this.target.y;
    }
  }

  bindEvents() {
    const signal = this.abortController.signal;
    for (const button of this.viewport.querySelectorAll('[data-chart-zoom]')) {
      button.addEventListener('click',() => this.setZoom(button.dataset.chartZoom === 'all' ? this.chartDistance :
        this.cameraGoal.z * (button.dataset.chartZoom === 'in' ? .8 : 1.25)),{signal});
    }
    this.canvas.addEventListener('wheel',event => {
      event.preventDefault();
      this.setZoom(this.cameraGoal.z + Math.sign(event.deltaY)*Math.max(1.8,this.cameraGoal.z*.09));
    },{passive:false,signal});
    this.canvas.addEventListener('pointerdown',event => {
      this.travel = null; this.viewport.classList.remove('webgl-travelling');
      this.pointerMap.set(event.pointerId,{x:event.clientX,y:event.clientY});
      this.canvas.setPointerCapture(event.pointerId);
      if (this.pointerMap.size === 1) this.drag = {x:event.clientX,y:event.clientY,target:this.target.clone(),moved:false};
      if (this.pointerMap.size === 2) {
        const [a,b] = [...this.pointerMap.values()];
        this.pinch = {distance:Math.hypot(a.x-b.x,a.y-b.y),z:this.cameraGoal.z};
      }
      this.viewport.classList.add('navigating');
    },{signal});
    this.canvas.addEventListener('pointermove',event => {
      if (!this.pointerMap.has(event.pointerId)) return;
      this.pointerMap.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if (this.pointerMap.size === 2 && this.pinch) {
        const [a,b] = [...this.pointerMap.values()];
        const distance = Math.hypot(a.x-b.x,a.y-b.y);
        this.setZoom(this.pinch.z*this.pinch.distance/Math.max(distance,1));
        return;
      }
      if (!this.drag) return;
      const dx=event.clientX-this.drag.x,dy=event.clientY-this.drag.y;
      if (Math.hypot(dx,dy)>5) this.drag.moved=true;
      const units=this.cameraGoal.z/Math.max(this.viewport.clientHeight,1)*1.8;
      this.target.x=clamp(this.drag.target.x-dx*units,this.chartBounds?.minX ?? -11,this.chartBounds?.maxX ?? 11);
      this.target.y=clamp(this.drag.target.y+dy*units,this.chartBounds?.minY ?? -14,this.chartBounds?.maxY ?? 14);
      if (this.routeChart && this.drag.moved) { this.zoomFocus.copy(this.target); this.zoomFocusDistance=this.cameraGoal.z; }
    },{signal});
    const release = event => {
      const moved=this.drag?.moved;
      this.pointerMap.delete(event.pointerId);
      if (!this.pointerMap.size) {
        this.viewport.classList.remove('navigating');
        this.drag=null; this.pinch=null;
        if (!moved) this.pick(event);
      } else if (this.pointerMap.size===1) {
        const [remaining]=this.pointerMap.values();
        this.drag={x:remaining.x,y:remaining.y,target:this.target.clone(),moved:true};
      }
    };
    this.canvas.addEventListener('pointerup',release,{signal});
    this.canvas.addEventListener('pointercancel',release,{signal});
    for (const system of this.systems) {
      system.button?.addEventListener('click',() => {
        if (!system.locked) this.flyTo(system.id);
      },{signal});
    }
  }

  pick(event) {
    const rect=this.canvas.getBoundingClientRect();
    this.pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    const hit=this.raycaster.intersectObjects(this.pickables,false)[0];
    if (hit && !hit.object.userData.locked) this.flyTo(hit.object.userData.id);
  }

  flyTo(id, {duration = 620, arrivalDistance = null} = {}) {
    if (this.travel) return;
    const entry=this.systemGroups.get(id);
    if (!entry || entry.system.locked) return;
    if (this.reducedMotion) return this.onSelect?.(id);
    this.viewport.classList.add('webgl-travelling');
    const startTarget=this.target.clone(),startCamera=this.camera.position.clone();
    const endTarget=entry.group.position.clone();
    const endCamera=new THREE.Vector3(endTarget.x,endTarget.y,arrivalDistance === null ? 10.5 : endTarget.z + arrivalDistance);
    this.travel={id,start:performance.now(),duration,startTarget,startCamera,endTarget,endCamera};
  }

  resize() {
    const width=Math.max(1,this.viewport.clientWidth),height=Math.max(1,this.viewport.clientHeight);
    this.camera.aspect=width/height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width,height,false);
    if (this.routeChart) {
      const current = [...this.systemGroups.values()].find(entry => entry.system.current);
      if (current && this.ship) this.ship.position.set(current.group.position.x-.7,current.group.position.y+.45,1.5);
      const previousDistance=this.chartDistance;
      const framing=constellationFraming(this.systems,this.camera.aspect);
      this.chartDistance=framing.full.distance;
      this.nearDistance=framing.near.distance;
      this.chartBounds=framing.bounds;
      this.chartCenter=new THREE.Vector3(...framing.full.center,0);
      if (!previousDistance) {
        this.zoomFocus=new THREE.Vector3(...framing.near.center,0);
        this.zoomFocusDistance=this.nearDistance;
        this.target.copy(this.zoomFocus);
        this.cameraGoal.set(this.target.x,this.target.y,this.nearDistance);
        this.camera.position.copy(this.cameraGoal);
      } else {
        const ratio=this.cameraGoal.z/previousDistance;
        this.zoomFocusDistance=this.nearDistance;
        this.setZoom(this.chartDistance*ratio);
        this.camera.position.copy(this.cameraGoal);
      }
      this.camera.lookAt(this.target);
    }
  }

  projectLabels() {
    const width=this.viewport.clientWidth,height=this.viewport.clientHeight;
    for (const {group,system} of this.systemGroups.values()) {
      if (!system.button) continue;
      const point=group.position.clone().project(this.camera);
      const visible=point.z>-1&&point.z<1&&Math.abs(point.x)<1.16&&Math.abs(point.y)<1.16;
      if (system.button.hidden !== !visible) system.button.hidden=!visible;
      if (!visible) continue;
      const distance=this.camera.position.distanceTo(group.position);
      const labelScale=this.routeChart ? clamp(this.nearDistance/distance,.6,1.1) : 1;
      system.button.style.transform=`translate3d(${(point.x*.5+.5)*width}px,${(-point.y*.5+.5)*height}px,0) translate(-50%,-20%) scale(${labelScale})`;
      system.button.style.setProperty('--depth-scale',clamp(25/distance,.78,1.16).toFixed(3));
    }
  }

  render() {
    const delta=Math.min(this.clock.getDelta(),.05);
    const elapsed=this.clock.elapsedTime;
    if (this.travel) {
      const raw=clamp((performance.now()-this.travel.start)/this.travel.duration,0,1);
      const eased=1-Math.pow(1-raw,3);
      this.target.lerpVectors(this.travel.startTarget,this.travel.endTarget,eased);
      this.camera.position.lerpVectors(this.travel.startCamera,this.travel.endCamera,eased);
      if (raw>=1) {
        const id=this.travel.id; this.travel=null;
        this.onSelect?.(id);
        return;
      }
    } else {
      this.cameraGoal.x=this.target.x;
      this.cameraGoal.y=this.target.y;
      this.camera.position.lerp(this.cameraGoal,1-Math.pow(.001,delta));
    }
    this.camera.lookAt(this.target.x,this.target.y,-1.2);
    if (this.routeChart) {
      const overview=this.camera.position.z>this.chartDistance*.72;
      if (this.viewport.classList.contains('chart-overview') !== overview) this.viewport.classList.toggle('chart-overview',overview);
    }
    if (!this.reducedMotion) {
      for (const points of this.starLayers || []) {
        points.position.x=(this.camera.position.x-this.target.x)*-points.userData.parallax;
        points.position.y=(this.camera.position.y-this.target.y)*-points.userData.parallax;
      }
      this.nebulaPlane.rotation.z+=(this.mode==='galaxy'?.0004:.0002);
      if (this.localDust) this.localDust.rotation.z+=.0003;
      if (this.ship) this.ship.position.y+=Math.sin(elapsed*.8)*.00045;
      for (const {group,halo,baseScale,baseOpacity,system} of this.systemGroups.values()) {
        const wave=Math.sin(elapsed*(system.locked?1.45:2.15)+group.position.x*.7);
        const pulse=1+wave*(system.available?.15:.08);
        halo.scale.setScalar(baseScale*pulse);
        halo.material.opacity=clamp(baseOpacity+wave*(system.locked?.18:.06),.22,1);
      }
    }
    this.projectLabels();
    this.renderer.render(this.scene,this.camera);
  }

  destroy() {
    this.abortController.abort();
    this.resizeObserver?.disconnect();
    this.renderer.setAnimationLoop(null);
    this.scene.traverse(object => {
      object.geometry?.dispose?.();
      const materials=Array.isArray(object.material)?object.material:[object.material];
      for (const material of materials) {
        material?.map?.dispose?.();
        material?.dispose?.();
      }
    });
    this.renderer.dispose();
    this.viewport.classList.remove('navigating','webgl-travelling','chart-overview');
  }
}
