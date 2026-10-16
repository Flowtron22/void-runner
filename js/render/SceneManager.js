import * as THREE from 'three';

const COLORS = { bridge:0x4d9cab, shields:0x7167c8, weapons:0xb3635e, medbay:0x4a9d76, oxygen:0x4d87b9, engines:0xd28b45, empty:0x52616b };

export class SceneManager {
  constructor(canvas,onPick){
    this.canvas=canvas; this.onPick=onPick; this.scene=new THREE.Scene(); this.scene.fog=new THREE.FogExp2(0x03080c,.018);
    this.camera=new THREE.OrthographicCamera(-9,9,16,-16,.1,100); this.camera.position.set(0,27,31); this.camera.lookAt(0,0,0);
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)); this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.raycaster=new THREE.Raycaster(); this.pointer=new THREE.Vector2(); this.pickables=[]; this.roomMeshes=new Map(); this.crewMeshes=new Map(); this.doorMeshes=new Map(); this.projectiles=[]; this.shieldMeshes={}; this.shake=0;
    this.scene.add(new THREE.HemisphereLight(0x8edcff,0x101018,1.45)); const sun=new THREE.DirectionalLight(0xffedd0,2.1);sun.position.set(-5,18,8);this.scene.add(sun);
    this.createSpace();
    canvas.addEventListener('pointerdown',e=>this.pick(e)); window.addEventListener('resize',()=>this.resize()); this.resize();
  }

  createSpace(){
    const geo=new THREE.BufferGeometry(); const pos=[]; for(let i=0;i<420;i++) pos.push((Math.random()-.5)*55,(Math.random()-.3)*18,(Math.random()-.5)*58);
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); const stars=new THREE.Points(geo,new THREE.PointsMaterial({color:0x83b9d6,size:.045,transparent:true,opacity:.7})); this.scene.add(stars); this.stars=stars;
    const lane=new THREE.Mesh(new THREE.PlaneGeometry(7,8),new THREE.MeshBasicMaterial({color:0x12344c,transparent:true,opacity:.055,side:THREE.DoubleSide}));lane.rotation.x=-Math.PI/2;lane.position.set(0,-.1,-1.7);this.scene.add(lane);
  }

  buildShip(ship,{offsetZ,scale=1,enemy=false}){
    const root=new THREE.Group();root.position.z=offsetZ;root.scale.setScalar(scale);this.scene.add(root);ship.renderRoot=root;
    const hullShape=new THREE.Shape(); hullShape.moveTo(0,-6.1);hullShape.lineTo(3.4,-3);hullShape.lineTo(3.1,4.8);hullShape.lineTo(0,6.9);hullShape.lineTo(-3.1,4.8);hullShape.lineTo(-3.4,-3);hullShape.closePath();
    const hull=new THREE.Mesh(new THREE.ShapeGeometry(hullShape),new THREE.MeshStandardMaterial({color:enemy?0x321f2c:0x172f3c,roughness:.65,metalness:.45,side:THREE.DoubleSide}));hull.rotation.x=-Math.PI/2;hull.position.y=-.22;root.add(hull);
    for(const room of ship.rooms.values()) this.createRoom(root,room,enemy,offsetZ,scale);
    for(const door of ship.doors.values()) this.createDoor(root,ship,door,enemy);
    const shield=new THREE.Mesh(new THREE.SphereGeometry(4.6,28,14,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:enemy?0xff6685:0x5df2dd,transparent:true,opacity:.13,wireframe:true,side:THREE.DoubleSide,depthWrite:false}));shield.scale.z=1.5;shield.position.y=.35;shield.rotation.x=Math.PI/2;root.add(shield);this.shieldMeshes[enemy?'enemy':'player']=shield;
  }

  createRoom(root,room,enemy,offsetZ,scale){
    const group=new THREE.Group();group.position.set(room.x,0,room.z);root.add(group);
    const mat=new THREE.MeshStandardMaterial({color:COLORS[room.system]||COLORS.empty,roughness:.7,metalness:.2,emissive:0x000000});
    const floor=new THREE.Mesh(new THREE.BoxGeometry(room.w,.18,room.d),mat);floor.userData={type:'room',id:room.id,enemy};group.add(floor);this.pickables.push(floor);this.roomMeshes.set(room.id,{floor,group,room,enemy});
    const wallMat=new THREE.MeshStandardMaterial({color:enemy?0x5b3442:0x294857,roughness:.5,metalness:.55});
    const addWall=(w,d,x,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,.55,d),wallMat);m.position.set(x,.32,z);group.add(m);};
    addWall(room.w+.12,.12,0,-room.d/2);addWall(room.w+.12,.12,0,room.d/2);addWall(.12,room.d,room.w/2,0);addWall(.12,room.d,-room.w/2,0);
    this.createEquipment(group,room,enemy);
    const label=this.makeLabel(room.name);label.position.set(0,.08,room.d*.22);label.rotation.x=-Math.PI/2;group.add(label);
  }

  createEquipment(group,room,enemy){
    const color=enemy?0xff7185:0x62efdd; const dark=new THREE.MeshStandardMaterial({color:0x1d2e38,roughness:.45,metalness:.7}); const glow=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.4});
    if(!room.system)return;
    if(room.system==='engines'){for(const x of [-.75,.75]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.35,.45,.75,8),dark);c.rotation.z=Math.PI/2;c.position.set(x,.42,0);group.add(c);}}
    else if(room.system==='shields'){const t=new THREE.Mesh(new THREE.TorusGeometry(.42,.13,7,18),glow);t.rotation.x=Math.PI/2;t.position.y=.38;group.add(t);}
    else {const base=new THREE.Mesh(new THREE.BoxGeometry(.8,.45,.48),dark);base.position.set(0,.28,-.1);group.add(base);const screen=new THREE.Mesh(new THREE.PlaneGeometry(.45,.2),glow);screen.rotation.x=-Math.PI/3;screen.position.set(0,.55,-.05);group.add(screen);}
  }

  makeLabel(text){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');x.font='600 24px Chakra Petch, sans-serif';x.textAlign='center';x.fillStyle='#d7f6ff';x.fillText(text.toUpperCase(),128,38);const tex=new THREE.CanvasTexture(c);const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,opacity:.82,depthWrite:false}));m.scale.set(1.7,.42,1);return m;}

  createDoor(root,ship,door,enemy){
    const a=ship.rooms.get(door.a),b=ship.rooms.get(door.b); const x=(a.x+b.x)/2,z=(a.z+b.z)/2; const horizontal=Math.abs(a.x-b.x)>Math.abs(a.z-b.z);
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(horizontal?.15:.72,.48,horizontal?.72:.15),new THREE.MeshStandardMaterial({color:enemy?0xb84f62:0x58b8c0,emissive:0x17333a,metalness:.7}));mesh.position.set(x,.3,z);mesh.userData={type:'door',id:door.id,ship};root.add(mesh);this.pickables.push(mesh);this.doorMeshes.set(`${enemy?'e':'p'}:${door.id}`,{mesh,door,horizontal});
  }

  addCrew(ship,crew){
    const group=new THREE.Group();const mat=new THREE.MeshStandardMaterial({color:crew.color,roughness:.65});const body=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.3,3,7),mat);body.position.y=.36;group.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),mat);head.position.y=.75;group.add(head);const ring=new THREE.Mesh(new THREE.RingGeometry(.27,.36,18),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,transparent:true,opacity:.9}));ring.rotation.x=-Math.PI/2;ring.position.y=.04;ring.visible=false;group.add(ring);group.userData={type:'crew',id:crew.id,ship};ship.renderRoot.add(group);this.pickables.push(...group.children);for(const c of group.children)c.userData=group.userData;this.crewMeshes.set(crew.id,{group,ring,crew,ship});
  }

  getCrewPosition(entry){const {crew,ship}=entry;const current=ship.rooms.get(crew.currentRoom);if(!crew.path.length)return new THREE.Vector3(current.x,0,current.z);const next=ship.rooms.get(crew.path[0]);return new THREE.Vector3(THREE.MathUtils.lerp(current.x,next.x,crew.moveProgress),0,THREE.MathUtils.lerp(current.z,next.z,crew.moveProgress));}
  spawnProjectile({from,to,color,onHit,duration=.7}){const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.32,3,6),new THREE.MeshBasicMaterial({color}));mesh.rotation.x=Math.PI/2;this.scene.add(mesh);this.projectiles.push({mesh,from:from.clone(),to:to.clone(),t:0,duration,onHit});}
  roomWorld(ship,id){const r=ship.rooms.get(id),v=new THREE.Vector3(r.x,.55,r.z);ship.renderRoot.localToWorld(v);return v;}
  impact(pos,color=0xffffff){for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.035,5,4),new THREE.MeshBasicMaterial({color,transparent:true}));m.position.copy(pos);this.scene.add(m);this.projectiles.push({mesh:m,from:pos.clone(),to:pos.clone().add(new THREE.Vector3((Math.random()-.5)*1.2,Math.random()*.8,(Math.random()-.5)*1.2)),t:0,duration:.4,particle:true});}this.shake=.18;}

  update(dt,player,enemy){
    this.stars.rotation.y+=dt*.004;
    for(const entry of this.crewMeshes.values()){const p=this.getCrewPosition(entry);entry.group.position.set(p.x,.02,p.z);entry.ring.visible=entry.crew.selected&&!entry.crew.dead;entry.group.visible=!entry.crew.dead;}
    for(const [key,e] of this.roomMeshes){const r=e.room;const selected=r.selected;e.floor.material.emissive.setHex(selected?0x20a69a:r.fire>0?0x8b1e12:0x000000);e.floor.material.emissiveIntensity=selected?.7:r.fire>0?Math.min(1.2,r.fire/40):0;e.floor.material.opacity=Math.max(.35,r.oxygen/100);e.floor.material.transparent=r.oxygen<35;this.updateHazard(e);}
    for(const e of this.doorMeshes.values()){e.mesh.scale[e.horizontal?'z':'x']=Math.max(.1,1-e.door.progress*.82);e.mesh.material.emissive.setHex(e.door.open?0x164646:0x551727);}
    this.shieldMeshes.player.visible=player.shield>0;this.shieldMeshes.enemy.visible=enemy.shield>0;this.shieldMeshes.player.material.opacity=.07+player.shield*.055;this.shieldMeshes.enemy.material.opacity=.07+enemy.shield*.055;
    for(let i=this.projectiles.length-1;i>=0;i--){const p=this.projectiles[i];p.t+=dt/p.duration;p.mesh.position.lerpVectors(p.from,p.to,Math.min(1,p.t));if(p.particle){p.mesh.material.opacity=1-p.t;p.mesh.scale.setScalar(1-p.t*.7);}if(p.t>=1){this.scene.remove(p.mesh);this.projectiles.splice(i,1);if(p.onHit)p.onHit();}}
    if(this.shake>0){this.shake-=dt;this.camera.position.x=(Math.random()-.5)*.12;this.camera.position.z=31+(Math.random()-.5)*.12;}else{this.camera.position.x=0;this.camera.position.z=31;}
  }

  updateHazard(entry){const {group,room}=entry;if(room.fire>0&&!entry.fire){const fire=new THREE.Mesh(new THREE.ConeGeometry(.23,.7,7),new THREE.MeshBasicMaterial({color:0xff7a2e,transparent:true}));fire.position.set(room.w*.22,.4,0);group.add(fire);entry.fire=fire;}if(entry.fire){entry.fire.visible=room.fire>0;entry.fire.scale.y=.55+Math.sin(performance.now()*.012)*.18+room.fire/100;entry.fire.material.opacity=.45+room.fire/150;}if(room.breach&&!entry.breach){const b=new THREE.Mesh(new THREE.RingGeometry(.15,.3,12),new THREE.MeshBasicMaterial({color:0x0a0a0a,side:THREE.DoubleSide}));b.rotation.x=-Math.PI/2;b.position.set(-room.w*.25,.11,0);group.add(b);entry.breach=b;}if(entry.breach)entry.breach.visible=room.breach;}

  pick(e){const rect=this.canvas.getBoundingClientRect();this.pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hit=this.raycaster.intersectObjects(this.pickables,false)[0];if(hit)this.onPick(hit.object.userData);}
  resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight,aspect=w/h;const height=29;this.camera.top=height/2;this.camera.bottom=-height/2;this.camera.left=-height*aspect/2;this.camera.right=height*aspect/2;if(aspect>.72){this.camera.left=-10.8;this.camera.right=10.8;}this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);}
  render(){this.renderer.render(this.scene,this.camera);}
}
