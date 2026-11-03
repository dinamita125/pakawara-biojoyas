/* Visor de fotografía: zoom, arrastre, rueda, teclado y gesto de dos dedos. */
const photoDialog=document.createElement('dialog');
photoDialog.id='photo-viewer';
photoDialog.setAttribute('aria-labelledby','photo-title');
photoDialog.innerHTML='<header class="photo-header"><div><span class="eyebrow">PAKAWARA · VISTA DE DETALLE</span><h2 id="photo-title"></h2></div><button type="button" id="photo-close" aria-label="Cerrar fotografía">Cerrar ×</button></header><div id="photo-stage" tabindex="0" aria-label="Fotografía ampliable. Usa más y menos para ampliar, flechas para mover y cero para ajustar."><img id="photo-full" alt="" draggable="false"></div><footer class="photo-tools"><button id="photo-minus" aria-label="Reducir ampliación">−</button><label for="photo-scale">Ampliación</label><input id="photo-scale" type="range" min="1" max="5" step="0.1" value="1"><output id="photo-percent" aria-live="polite">100%</output><button id="photo-plus" aria-label="Aumentar ampliación">+</button><button id="photo-reset">Ajustar imagen</button><p>Arrastra para recorrer · rueda o dos dedos para ampliar. El detalle depende de la resolución de la foto original.</p></footer>';
document.body.appendChild(photoDialog);
const photoStage=document.getElementById('photo-stage'),photoImage=document.getElementById('photo-full');
let photoScale=1,photoX=0,photoY=0,photoFocus=null,photoPointers=new Map(),pinchDistance=0;
function paintPhoto(){const bounds=photoStage.getBoundingClientRect(),width=photoImage.offsetWidth,height=photoImage.offsetHeight;const maxX=Math.max(0,(width*photoScale-bounds.width)/2),maxY=Math.max(0,(height*photoScale-bounds.height)/2);photoX=Math.max(-maxX,Math.min(maxX,photoX));photoY=Math.max(-maxY,Math.min(maxY,photoY));photoImage.style.transform=`translate(${photoX}px,${photoY}px) scale(${photoScale})`;$('photo-scale').value=photoScale;$('photo-percent').textContent=Math.round(photoScale*100)+'%';}
function zoomPhoto(value){photoScale=Math.max(1,Math.min(5,value));paintPhoto();}
function resetPhoto(){photoScale=1;photoX=0;photoY=0;paintPhoto();}
function openPhotoViewer(){const product=PRODUCTS.find(p=>p.id===modalCurrentId);if(!product)return;photoFocus=document.activeElement;$('photo-title').textContent=product.name;photoImage.alt='Detalle de '+product.name;photoImage.src=safeImage(product.img);photoDialog.showModal();resetPhoto();photoStage.focus();}
function closePhotoViewer(){photoDialog.close();photoPointers.clear();pinchDistance=0;photoFocus?.focus();}
photoImage.addEventListener('load',resetPhoto);
$('photo-close').addEventListener('click',closePhotoViewer);
$('photo-plus').addEventListener('click',()=>zoomPhoto(photoScale+.5));
$('photo-minus').addEventListener('click',()=>zoomPhoto(photoScale-.5));
$('photo-reset').addEventListener('click',resetPhoto);
$('photo-scale').addEventListener('input',event=>zoomPhoto(Number(event.target.value)));
photoStage.addEventListener('wheel',event=>{event.preventDefault();zoomPhoto(photoScale+(event.deltaY<0?.2:-.2));},{passive:false});
photoStage.addEventListener('dblclick',()=>zoomPhoto(photoScale>1?1:2.5));
photoStage.addEventListener('pointerdown',event=>{photoStage.setPointerCapture(event.pointerId);photoPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});pinchDistance=0;});
photoStage.addEventListener('pointermove',event=>{const prior=photoPointers.get(event.pointerId);if(!prior)return;photoPointers.set(event.pointerId,{x:event.clientX,y:event.clientY});if(photoPointers.size===2){const [a,b]=[...photoPointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinchDistance>0)zoomPhoto(photoScale*distance/pinchDistance);pinchDistance=distance;}else{photoX+=event.clientX-prior.x;photoY+=event.clientY-prior.y;paintPhoto();}});
for(const name of ['pointerup','pointercancel','lostpointercapture'])photoStage.addEventListener(name,event=>{photoPointers.delete(event.pointerId);pinchDistance=0;});
photoDialog.addEventListener('cancel',event=>{event.preventDefault();closePhotoViewer();});
// Keep the native dialog focus trap separate from the underlying product modal.
photoDialog.addEventListener('keydown',event=>{if(event.key==='Tab')event.stopPropagation();});
photoDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closePhotoViewer();return;}if(event.target!==photoStage)return;const moves={ArrowLeft:[35,0],ArrowRight:[-35,0],ArrowUp:[0,35],ArrowDown:[0,-35]};if(moves[event.key]){event.preventDefault();photoX+=moves[event.key][0];photoY+=moves[event.key][1];paintPhoto();}else if(['+','=','-','0'].includes(event.key)){event.preventDefault();if(event.key==='0')resetPhoto();else zoomPhoto(photoScale+(event.key==='-'?-.5:.5));}});
window.addEventListener('resize',()=>{if(photoDialog.open)paintPhoto();});
toggleZoom=function(event){event?.stopPropagation();openPhotoViewer();};
$('zoom-control').textContent='Explorar fotografía';
$('zoom-control').setAttribute('aria-label','Abrir visor de detalle de la fotografía');
const openDetailBeforeViewer=openModal;
openModal=function(id){openDetailBeforeViewer(id);$('zoom-control').textContent='Explorar fotografía';};
