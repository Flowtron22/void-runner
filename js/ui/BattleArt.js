const requests=new WeakMap();

export function clearBattleArt(image) {
  requests.set(image,(requests.get(image) || 0)+1);
  image.style.visibility='hidden';
  image.onload=null;
  image.onerror=null;
  image.removeAttribute('src');
}

export function loadBattleArt(image,src) {
  // A reused <img> can keep displaying its previous decoded GIF while src loads.
  clearBattleArt(image);
  const request=requests.get(image);
  image.onload=()=>{
    if(requests.get(image)===request && image.complete && image.naturalWidth>0)image.style.visibility='visible';
  };
  image.onerror=()=>{
    if(requests.get(image)===request)image.style.visibility='hidden';
  };
  image.src=src;
}
