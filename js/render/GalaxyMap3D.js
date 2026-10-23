import * as THREE from 'three';

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

function radialTexture(inner,outer = 'rgba(0,0,0,0)',size = 256) {
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

function nebulaTexture(colors,size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  context.fillStyle = '#020407';
  context.fillRect(0,0,size,size);
  const random = seededRandom(4021);
  context.globalCompositeOperation = 'screen';
  for (let index=0; index<34; index++) {
    const x = random()*size, y = random()*size;
    const radius = size*(.08+random()*.24);
    const color = colors[index % colors.length];
    const gradient = context.createRadialGradient(x,y,0,x,y,radius);
    gradient.addColorStop(0,`${color}55`);
    gradient.addColorStop(.42,`${color}20`);
    gradient.addColorStop(1,`${color}00`);
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(x,y,radius,radius*(.32+random()*.5),random()*Math.PI,0,Math.PI*2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export class GalaxyMap3D {
  constructor({viewport,canvas,labelLayer,mode='galaxy',systems=[],onSelect,reducedMotion=false}) {
    this.viewport = viewport;
    this.canvas = canvas;
    this.labelLayer = labelLayer;
    this.mode = mode;
    this.systems = systems;
    this.onSelect = onSelect;
    this.reducedMotion = reducedMotion;
    this.abortController = new AbortController();
    this.pointerMap = new Map();
    this.pickables = [];
    this.systemGroups = new Map();
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.target = new THREE.Vector3(0,0,0);
    this.cameraGoal = new THREE.Vector3(0,0,mode === 'galaxy' ? 29 : 23);
    this.travel = null;
    this.drag = null;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(mode === 'galaxy' ? 0x020307 : 0x01060a);
    this.scene.fog = new THREE.FogExp2(this.scene.background,mode === 'galaxy' ? .018 : .025);
    this.camera = new THREE.PerspectiveCamera(42,1,.1,120);
    this.camera.position.copy(this.cameraGoal);
    this.camera.lookAt(this.target);
    this.renderer = new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
    this.createEnvironment();
    this.createSystems();
    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(viewport);
    this.resize();
    this.renderer.setAnimationLoop(() => this.render());
  }

  createEnvironment() {
    const galaxy = this.mode === 'galaxy';
    const starRandom = seededRandom(galaxy ? 8219 : 4417);
    for (let layer=0; layer<3; layer++) {
      const count = galaxy ? 520-layer*90 : 380-layer*70;
      const positions = new Float32Array(count*3);
      const colors = new Float32Array(count*3);
      for (let index=0; index<count; index++) {
        positions[index*3] = (starRandom()-.5)*(34+layer*20);
        positions[index*3+1] = (starRandom()-.5)*(46+layer*18);
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

    const nebula = nebulaTexture(galaxy ? ['#443050','#692d43','#243b57'] : ['#173d51','#255764','#28334e']);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(galaxy ? 48 : 38,galaxy ? 62 : 54),new THREE.MeshBasicMaterial({map:nebula,transparent:true,opacity:galaxy?.7:.8,depthWrite:false}));
    plane.position.z = -17;
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
    this.scene.add(core);
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
    ship.position.set(-6.4,-6.8,1.5);
    ship.rotation.z = .15;
    this.scene.add(ship);
    this.ship = ship;
  }

  createSystems() {
    for (const system of this.systems) {
      const tone = TONES[system.tone] || TONES.gold;
      const group = new THREE.Group();
      group.position.set(...system.position);
      group.userData = {id:system.id,locked:system.locked};
      const texture = radialTexture(`rgba(${tone.core>>16},${(tone.core>>8)&255},${tone.core&255},1)`);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:tone.light,transparent:true,opacity:system.locked?.28:.86,blending:THREE.AdditiveBlending,depthWrite:false}));
      const scale = (system.size || 1)*(system.primary ? 3.4 : 2.25);
      halo.scale.set(scale,scale,1);
      halo.userData = group.userData;
      group.add(halo);
      const core = new THREE.Mesh(new THREE.SphereGeometry((system.primary?.34:.18)*(system.size||1),20,14),new THREE.MeshBasicMaterial({color:tone.core,transparent:true,opacity:system.locked?.4:1}));
      core.userData = group.userData;
      group.add(core);
      const pick = new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,opacity:.001,depthWrite:false}));
      pick.scale.set(Math.max(1.4,scale*.75),Math.max(1.4,scale*.75),1);
      pick.userData = group.userData;
      group.add(pick);
      this.pickables.push(pick);
      if (system.available && !system.locked) {
        const reticle = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:40},(_,i)=>{
          const angle=i/40*Math.PI*2; return new THREE.Vector3(Math.cos(angle)*scale*.43,Math.sin(angle)*scale*.43,0);
        })),new THREE.LineBasicMaterial({color:tone.core,transparent:true,opacity:.34}));
        reticle.userData.rotationRate = .18;
        group.add(reticle);
      }
      this.scene.add(group);
      this.systemGroups.set(system.id,{group,halo,core,system});
    }
  }

  bindEvents() {
    const signal = this.abortController.signal;
    this.canvas.addEventListener('wheel',event => {
      event.preventDefault();
      this.cameraGoal.z = clamp(this.cameraGoal.z + Math.sign(event.deltaY)*1.8,12,38);
    },{passive:false,signal});
    this.canvas.addEventListener('pointerdown',event => {
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
        this.cameraGoal.z = clamp(this.pinch.z*this.pinch.distance/Math.max(distance,1),12,38);
        return;
      }
      if (!this.drag) return;
      const dx=event.clientX-this.drag.x,dy=event.clientY-this.drag.y;
      if (Math.hypot(dx,dy)>5) this.drag.moved=true;
      const units=this.cameraGoal.z/Math.max(this.viewport.clientHeight,1)*1.8;
      this.target.x=clamp(this.drag.target.x-dx*units,-11,11);
      this.target.y=clamp(this.drag.target.y+dy*units,-14,14);
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

  flyTo(id) {
    if (this.travel) return;
    const entry=this.systemGroups.get(id);
    if (!entry || entry.system.locked) return;
    if (this.reducedMotion) return this.onSelect?.(id);
    this.viewport.classList.add('webgl-travelling');
    const startTarget=this.target.clone(),startCamera=this.camera.position.clone();
    const endTarget=entry.group.position.clone();
    const endCamera=new THREE.Vector3(endTarget.x,endTarget.y,10.5);
    this.travel={id,start:performance.now(),duration:620,startTarget,startCamera,endTarget,endCamera};
  }

  resize() {
    const width=Math.max(1,this.viewport.clientWidth),height=Math.max(1,this.viewport.clientHeight);
    this.camera.aspect=width/height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width,height,false);
  }

  projectLabels() {
    const width=this.viewport.clientWidth,height=this.viewport.clientHeight;
    for (const {group,system} of this.systemGroups.values()) {
      if (!system.button) continue;
      const point=group.position.clone().project(this.camera);
      const visible=point.z>-1&&point.z<1&&Math.abs(point.x)<1.16&&Math.abs(point.y)<1.16;
      system.button.hidden=!visible;
      if (!visible) continue;
      system.button.style.transform=`translate3d(${(point.x*.5+.5)*width}px,${(-point.y*.5+.5)*height}px,0) translate(-50%,-20%)`;
      const distance=this.camera.position.distanceTo(group.position);
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
    if (!this.reducedMotion) {
      for (const points of this.starLayers || []) {
        points.position.x=(this.camera.position.x-this.target.x)*-points.userData.parallax;
        points.position.y=(this.camera.position.y-this.target.y)*-points.userData.parallax;
      }
      this.nebulaPlane.rotation.z+=(this.mode==='galaxy'?.0004:.0002);
      if (this.localDust) this.localDust.rotation.z+=.0003;
      if (this.ship) this.ship.position.y+=Math.sin(elapsed*.8)*.00045;
      for (const {group,halo,system} of this.systemGroups.values()) {
        const pulse=system.available ? 1+Math.sin(elapsed*2.1+group.position.x)*.08 : 1;
        halo.scale.setScalar((system.size||1)*(system.primary?3.4:2.25)*pulse);
        for (const child of group.children) if (child.userData.rotationRate) child.rotation.z+=child.userData.rotationRate*delta;
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
    this.viewport.classList.remove('navigating','webgl-travelling');
  }
}
