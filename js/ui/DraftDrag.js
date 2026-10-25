// Portraits keep tap-to-inspect. Touch swipes scroll; holding starts a draft drag.
export function bindDraftDrag(card, unit, game) {
  let state=null, suppressClick=false;
  card.style.touchAction='none';
  card.addEventListener('click',event=>{
    if(suppressClick) {event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}
  },true);
  const cleanup=()=>{
    clearTimeout(state?.timer);
    state?.ghost?.remove();
    document.querySelector('#formation-grid .draft-preview')?.remove();
    document.body.classList.remove('draft-dragging');
    state=null;
  };
  card.onpointerdown=event=>{
    if(event.button!==0 || state) return;
    suppressClick=false;
    const touch=event.pointerType!=='mouse';
    state={id:event.pointerId,x:event.clientX,y:event.clientY,lastY:event.clientY,touch,active:false,scroll:false};
    card.setPointerCapture(event.pointerId);
    if(touch) state.timer=setTimeout(()=>{if(state && !state.scroll) start(event.clientX,event.clientY);},230);
  };
  function start(x,y) {
    state.active=true;
    game.selectedBlueprint=unit.id; game.selectedPlaced=null;
    const ghost=card.cloneNode(true);
    ghost.removeAttribute('id');ghost.setAttribute('aria-hidden','true');ghost.className='draft-ghost';
    ghost.style.width=`${card.offsetWidth}px`;ghost.style.height=`${card.offsetHeight}px`;
    document.body.append(ghost);state.ghost=ghost;
    document.body.classList.add('draft-dragging');
    move(x,y);
  }
  function move(clientX,clientY) {
    const grid=document.querySelector('#formation-grid');
    const rect=grid.getBoundingClientRect();
    const [w,h]=game.sizeFor(unit,game.rotated);
    state.ghost.style.left=`${clientX-card.offsetWidth/2}px`;
    state.ghost.style.top=`${clientY-card.offsetHeight-15}px`;
    const inside=clientX>=rect.left && clientX<=rect.right && clientY>=rect.top && clientY<=rect.bottom;
    const cellW=(rect.width-10)/6,cellH=(rect.height-8)/5;
    const x=Math.max(0,Math.min(6-w,Math.floor((clientX-rect.left)/(cellW+2))-Math.floor(w/2)));
    const y=Math.max(0,Math.min(5-h,Math.floor((clientY-rect.top)/(cellH+2))-Math.floor(h/2)));
    state.drop=inside?{x,y}:null;
    let preview=grid.querySelector('.draft-preview');
    if(!preview){preview=document.createElement('div');preview.className='draft-preview';grid.append(preview);}
    preview.hidden=!inside;
    if(inside){
      const issue=game.draftIssue(unit,x,y);
      preview.classList.toggle('invalid',Boolean(issue));
      Object.assign(preview.style,{left:`${x*(cellW+2)}px`,top:`${y*(cellH+2)}px`,width:`${w*cellW+(w-1)*2}px`,height:`${h*cellH+(h-1)*2}px`});
      document.querySelector('#prep-status').textContent=issue || `RELEASE TO DRAFT · ${w}×${h}`;
    }
  }
  card.onpointermove=event=>{
    if(!state || state.id!==event.pointerId) return;
    const distance=Math.hypot(event.clientX-state.x,event.clientY-state.y);
    if(!state.active && distance>7){
      clearTimeout(state.timer);
      if(state.touch){state.scroll=true;card.parentElement.scrollTop+=state.lastY-event.clientY;}
      else start(event.clientX,event.clientY);
    }
    if(state.active) move(event.clientX,event.clientY);
    state.lastY=event.clientY;
  };
  card.onpointerup=event=>{
    if(!state || state.id!==event.pointerId) return;
    suppressClick=state.active || state.scroll;
    if(state.active){
      const drop=state.drop;
      cleanup();
      if(drop) game.placeUnit(drop.x,drop.y);
      else document.querySelector('#prep-status').textContent='DRAFT CANCELLED';
    } else cleanup();
  };
  card.onpointercancel=()=>{suppressClick=true;cleanup();};
  card.onlostpointercapture=()=>{if(state){suppressClick=true;cleanup();}};
  card.oncontextmenu=event=>event.preventDefault();
}
