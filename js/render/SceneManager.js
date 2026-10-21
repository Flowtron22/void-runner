import * as THREE from 'three';

const COLORS = { bridge:0x2d8f91, shields:0x7857d8, weapons:0xc53f62, medbay:0x3d9b65, oxygen:0x3477b8, engines:0xd98b32, empty:0x465166 };
const PALETTE = { ink:0xf2f4df, cyan:0x42f5d7, red:0xff496c, amber:0xffd166, void:0x05050b, hull:0x101827 };

export class SceneManager {
  constructor(canvas,onPick){
    this.canvas=canvas; this.onPick=onPick; this.scene=new THREE.Scene(); this.scene.fog=new THREE.FogExp2(PALETTE.void,.014);
    this.camera=new THREE.OrthographicCamera(-9,9,16,-16,.1,100); this.camera.position.set(0,27,31); this.camera.lookAt(0,0,0);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true,powerPreference:'high-performance'}); this.renderer.setPixelRatio(Math.min(1,devicePixelRatio*.75)); this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.raycaster=new THREE.Raycaster(); this.pointer=new THREE.Vector2(); this.pickables=[]; this.roomMeshes=new Map(); this.crewMeshes=new Map(); this.doorMeshes=new Map(); this.projectiles=[]; this.shieldMeshes={}; this.shake=0;
    this.scene.add(new THREE.HemisphereLight(0x76ffe8,0x080711,1.15)); const sun=new THREE.DirectionalLight(0xffd88a,1.9);sun.position.set(-5,18,8);this.scene.add(sun);
    this.createSpace();
    canvas.addEventListener('pointerdown',e=>this.pick(e)); window.addEventListener('resize',()=>this.resize()); this.resize();
  }

  createSpace(){
    const geo=new THREE.BufferGeometry(); const pos=[]; for(let i=0;i<240;i++) pos.push(Math.round((Math.random()-.5)*55),Math.round((Math.random()-.3)*18),Math.round((Math.random()-.5)*58));
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); const stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0x8ab4c7,size:.075,transparent:true,opacity:.75,sizeAttenuation:true})); this.scene.add(stars); this.stars=stars;
    const grid=new THREE.GridHelper(18,18,0x16384a,0x101d30);grid.position.y=-.28;grid.position.z=-1.2;grid.material.transparent=true;grid.material.opacity=.28;this.scene.add(grid);
    const lane=new THREE.Mesh(new THREE.PlaneGeometry(6.5,7.5),new THREE.MeshBasicMaterial({color:0x143648,transparent:true,opacity:.08,side:THREE.DoubleSide}));lane.rotation.x=-Math.PI/2;lane.position.set(0,-.25,-1.7);this.scene.add(lane);
  }

  buildShip(ship,{offsetZ,scale=1,enemy=false}){
    const root=new THREE.Group();root.position.z=offsetZ;root.scale.setScalar(scale);this.scene.add(root);ship.renderRoot=root;
    const hullShape=new THREE.Shape(); hullShape.moveTo(0,-6.1);hullShape.lineTo(3.4,-3);hullShape.lineTo(3.1,4.8);hullShape.lineTo(0,6.9);hullShape.lineTo(-3.1,4.8);hullShape.lineTo(-3.4,-3);hullShape.closePath();
    const hull=new THREE.Mesh(new THREE.ShapeGeometry(hullShape),new THREE.MeshStandardMaterial({color:enemy?0x2b111d:PALETTE.hull,roughness:.85,metalness:.12,flatShading:true,side:THREE.DoubleSide}));hull.rotation.x=-Math.PI/2;hull.position.y=-.22;root.add(hull);
    const hullEdge=new THREE.LineSegments(new THREE.EdgesGeometry(hull.geometry),new THREE.LineBasicMaterial({color:enemy?PALETTE.red:PALETTE.cyan,transparent:true,opacity:.78}));hull.add(hullEdge);
    for(const room of ship.rooms.values()) this.createRoom(root,room,enemy,offsetZ,scale);
    for(const door of ship.doors.values()) this.createDoor(root,ship,door,enemy);
    const shield=new THREE.Mesh(new THREE.IcosahedronGeometry(4.65,1),new THREE.MeshBasicMaterial({color:enemy?PALETTE.red:PALETTE.cyan,transparent:true,opacity:.16,wireframe:true,side:THREE.DoubleSide,depthWrite:false}));shield.scale.z=1.45;shield.scale.y=.62;shield.position.y=.45;root.add(shield);this.shieldMeshes[enemy?'enemy':'player']=shield;
  }

  createRoom(root,room,enemy,offsetZ,scale){
    const group=new THREE.Group();group.position.set(room.x,0,room.z);root.add(group);
    const mat=new THREE.MeshStandardMaterial({color:COLORS[room.system]||COLORS.empty,roughness:.9,metalness:.05,flatShading:true,emissive:0x000000});
    const floor=new THREE.Mesh(new THREE.BoxGeometry(room.w,.18,room.d),mat);floor.userData={type:'room',id:room.id,enemy};group.add(floor);this.pickables.push(floor);this.roomMeshes.set(room.id,{floor,group,room,enemy});
    const floorEdge=new THREE.LineSegments(new THREE.EdgesGeometry(floor.geometry),new THREE.LineBasicMaterial({color:enemy?0xff6a7e:0xa6fff0}));floor.add(floorEdge);
    const wallMat=new THREE.MeshStandardMaterial({color:enemy?0x72243c:0x1c5260,roughness:.85,metalness:.1,flatShading:true});
    const addWall=(w,d,x,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.55,d),wallMat);m.position.set(x,.32,z);group.add(m);};
    addWall(room.w+.12,.12,0,-room.d/2);addWall(room.w+.12,.12,0,room.d/2);addWall(.12,room.d,room.w/2,0);addWall(.12,room.d,-room.w/2,0);
    this.createEquipment(group,room,enemy);
    const label=this.makeLabel(room.name);label.position.set(0,.08,room.d*.22);label.rotation.x=-Math.PI/2;group.add(label);
  }

  createEquipment(group,room,enemy){
    const color=enemy?PALETTE.red:PALETTE.cyan; const dark=new THREE.MeshStandardMaterial({color:0x0c101a,roughness:.9,flatShading:true}); const glow=new THREE.MeshBasicMaterial({color});
    if(!room.system)return;
    if(room.system==='engines'){for(const x of [-.75,.75]){const c=new THREE.Mesh(new THREE.BoxGeometry(.68,.55,.48),dark);c.position.set(x,.35,0);group.add(c);const core=new THREE.Mesh(new THREE.BoxGeometry(.16,.6,.55),glow);core.position.set(x,.36,0);group.add(core);}}
    else if(room.system==='shields'){const t=new THREE.Mesh(new THREE.TorusGeometry(.42,.14,4,8),glow);t.rotation.x=Math.PI/2;t.rotation.z=Math.PI/4;t.position.y=.38;group.add(t);}
    else {const base=new THREE.Mesh(new THREE.BoxGeometry(.8,.45,.48),dark);base.position.set(0,.28,-.1);group.add(base);const screen=new THREE.Mesh(new THREE.PlaneGeometry(.45,.2),glow);screen.rotation.x=-Math.PI/3;screen.position.set(0,.55,-.05);group.add(screen);}
  }

  makeLabel(text){const c=document.createElement('canvas');c.width=128;c.height=32;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.font='700 12px monospace';x.textAlign='center';x.fillStyle='#f2f4df';x.fillText(text.toUpperCase(),64,20);const tex=new THREE.CanvasTexture(c);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,opacity:.9,depthWrite:false}));m.scale.set(1.7,.42,1);return m;}

  createDoor(root,ship,door,enemy){
    const a=ship.rooms.get(door.a),b=ship.rooms.get(door.b); const x=(a.x+b.x)/2,z=(a.z+b.z)/2; const horizontal=Math.abs(a.x-b.x)>Math.abs(a.z-b.z);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(horizontal?.15:.72,.48,horizontal?.72:.15),new THREE.MeshBasicMaterial({color:enemy?PALETTE.red:PALETTE.cyan}));mesh.position.set(x,.3,z);mesh.userData={type:'door',id:door.id,ship};root.add(mesh);this.pickables.push(mesh);this.doorMeshes.set(`${enemy?'e':'p'}:${door.id}`,{mesh,door,horizontal});
  }

  addCrew(ship,crew){
    const group=new THREE.Group();const mat=new THREE.MeshBasicMaterial({color:crew.color});const dark=new THREE.MeshBasicMaterial({color:0x080b12});const body=new THREE.Mesh(new THREE.BoxGeometry(.38,.42,.3),mat);body.position.y=.35;group.add(body);const head=new THREE.Mesh(new THREE.BoxGeometry(.28,.24,.26),mat);head.position.y=.69;group.add(head);for(const x of [-.24,.24]){const limb=new THREE.Mesh(new THREE.BoxGeometry(.1,.32,.11),dark);limb.position.set(x,.32,0);group.add(limb);}const ring=new THREE.Mesh(new THREE.RingGeometry(.3,.4,4),new THREE.MeshBasicMaterial({color:PALETTE.ink,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.rotation.z=Math.PI/4;ring.position.y=.04;ring.visible=false;group.add(ring);group.userData={type:'crew',id:crew.id,ship};ship.renderRoot.add(group);this.pickables.push(...group.children);for(const c of group.children)c.userData=group.userData;this.crewMeshes.set(crew.id,{group,ring,crew,ship});
  }

  getCrewPosition(entry){const {crew,ship}=entry;const current=ship.rooms.get(crew.currentRoom);if(!crew.path.length)return new THREE.Vector3(current.x,0,current.z);const next=ship.rooms.get(crew.path[0]);return new THREE.Vector3(THREE.MathUtils.lerp(current.x,next.x,crew.moveProgress),0,THREE.MathUtils.lerp(current.z,next.z,crew.moveProgress));}
  spawnProjectile({from,to,color,onHit,duration=.7}){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.5),new THREE.MeshBasicMaterial({color}));mesh.rotation.x=Math.PI/2;this.scene.add(mesh);this.projectiles.push({mesh,from:from.clone(),to:to.clone(),t:0,duration,onHit});}
  roomWorld(ship,id){const r=ship.rooms.get(id),v=new THREE.Vector3(r.x,.55,r.z);ship.renderRoot.localToWorld(v);return v;}
  impact(pos,color=0xffffff){for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.09),new THREE.MeshBasicMaterial({color,transparent:true}));m.position.copy(pos);this.scene.add(m);this.projectiles.push({mesh:m,from:pos.clone(),to:pos.clone().add(new THREE.Vector3((Math.random()-.5)*1.2,Math.random()*.8,(Math.random()-.5)*1.2)),t:0,duration:.4,particle:true});}this.shake=.18;}

  update(dt,player,enemy){
    this.stars.rotation.y+=dt*.004;
    for(const entry of this.crewMeshes.values()){const p=this.getCrewPosition(entry);entry.group.position.set(p.x,.02,p.z);entry.ring.visible=entry.crew.selected&&!entry.crew.dead;entry.group.visible=!entry.crew.dead;}
    for(const [key,e] of this.roomMeshes){const r=e.room;const selected=r.selected;e.floor.material.emissive.setHex(selected?0x20a69a:r.fire>0?0x8b1e12:0x000000);e.floor.material.emissiveIntensity=selected?.7:r.fire>0?Math.min(1.2,r.fire/40):0;e.floor.material.opacity=Math.max(.35,r.oxygen/100);e.floor.material.transparent=r.oxygen<35;this.updateHazard(e);}
    for(const e of this.doorMeshes.values()){e.mesh.scale[e.horizontal?'z':'x']=Math.max(.1,1-e.door.progress*.82);e.mesh.material.color.setHex(e.door.open?PALETTE.cyan:PALETTE.red);}
    this.shieldMeshes.player.visible=player.shield>0;this.shieldMeshes.enemy.visible=enemy.shield>0;this.shieldMeshes.player.material.opacity=.07+player.shield*.055;this.shieldMeshes.enemy.material.opacity=.07+enemy.shield*.055;
    for(let i=this.projectiles.length-1;i>=0;i--){const p=this.projectiles[i];p.t+=dt/p.duration;p.mesh.position.lerpVectors(p.from,p.to,Math.min(1,p.t));if(p.particle){p.mesh.material.opacity=1-p.t;p.mesh.scale.setScalar(1-p.t*.7);}if(p.t>=1){this.scene.remove(p.mesh);this.projectiles.splice(i,1);if(p.onHit)p.onHit();}}
    if(this.shake>0){this.shake-=dt;this.camera.position.x=(Math.random()-.5)*.12;this.camera.position.z=31+(Math.random()-.5)*.12;}else{this.camera.position.x=0;this.camera.position.z=31;}
  }

  updateHazard(entry){const {group,room}=entry;if(room.fire>0&&!entry.fire){const fire=new THREE.Group();for(let i=0;i<3;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(.18-i*.03,.22,.18-i*.03),new THREE.MeshBasicMaterial({color:[0xff496c,0xff8c42,0xffd166][i],transparent:true}));p.position.y=.15+i*.18;p.position.x=(i%2)*.08;fire.add(p);}fire.position.set(room.w*.22,.18,0);group.add(fire);entry.fire=fire;}if(entry.fire){entry.fire.visible=room.fire>0;entry.fire.scale.y=.75+(Math.floor(performance.now()/120)%2)*.22+room.fire/140;}if(room.breach&&!entry.breach){const b=new THREE.Mesh(new THREE.RingGeometry(.15,.3,8),new THREE.MeshBasicMaterial({color:0x020207,side:THREE.DoubleSide}));b.rotation.x=-Math.PI/2;b.position.set(-room.w*.25,.11,0);group.add(b);entry.breach=b;}if(entry.breach)entry.breach.visible=room.breach;}

  pick(e){const rect=this.canvas.getBoundingClientRect();this.pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObjects(this.pickables,false)[0];if(hit)this.onPick(hit.object.userData);}
  resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight,aspect=w/h;const height=29;this.camera.top=height/2;this.camera.bottom=-height/2;this.camera.left=-height*aspect/2;this.camera.right=height*aspect/2;if(aspect>.72){this.camera.left=-10.8;this.camera.right=10.8;}this.camera.updateProjectionMatrix();this.renderer.setSize(Math.max(320,Math.floor(w*.8)),Math.max(480,Math.floor(h*.8)),false);}
  render(){this.renderer.render(this.scene,this.camera);}
}
