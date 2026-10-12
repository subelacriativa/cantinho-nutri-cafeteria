const state={stream:null,photo:null,frame:'classic'};
const $=s=>document.querySelector(s);
const screens=['welcome','capture','frames','result','thanks'];
function show(id){screens.forEach(x=>$('#'+x).classList.toggle('active',x===id));window.scrollTo({top:0,behavior:'smooth'});if(id==='capture'&&!state.stream&&!state.photo){startCamera();}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function stopCamera(){if(state.stream){state.stream.getTracks().forEach(t=>t.stop());state.stream=null}const v=$('#video');v.pause();v.srcObject=null;v.style.display='none';$('#cameraPlaceholder').style.display='flex'}
async function startCamera(){try{state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});const v=$('#video');v.srcObject=state.stream;v.style.display='block';$('#cameraPlaceholder').style.display='none';await v.play();$('#cameraBtn').textContent='Tirar foto';$('#cameraBtn').onclick=captureFromVideo}catch(e){toast('Não foi possível abrir a câmera. Verifique a permissão do navegador.');$('#cameraBtn').textContent='Tirar foto';$('#cameraBtn').onclick=startCamera}}
function captureFromVideo(){const v=$('#video'), c=$('#captureCanvas');c.width=v.videoWidth||720;c.height=v.videoHeight||960;const ctx=c.getContext('2d');ctx.save();ctx.translate(c.width,0);ctx.scale(-1,1);ctx.drawImage(v,0,0,c.width,c.height);ctx.restore();state.photo=c.toDataURL('image/jpeg',.92);stopCamera();prepareFrames();show('frames')}
function loadFile(file){if(!file)return;const reader=new FileReader();reader.onload=e=>{state.photo=e.target.result;stopCamera();prepareFrames();show('frames')};reader.readAsDataURL(file)}
const frames=[
 {id:'classic',name:'Eu fui ao Cantinho',accent:'#5b321f'},
 {id:'botanical',name:'Nova história',accent:'#697047'},
 {id:'minimal',name:'Reinauguração 2026',accent:'#8b5d3f'},
 {id:'coffee',name:'Café + carinho',accent:'#7b4b30'}
];
function drawFrame(canvas,img,frameId,preview=false){const W=800,H=960;canvas.width=W;canvas.height=H;const ctx=canvas.getContext('2d');ctx.fillStyle='#f6eddc';ctx.fillRect(0,0,W,H);const scale=Math.max(W/img.width,H*.78/img.height);const dw=img.width*scale,dh=img.height*scale;ctx.save();ctx.beginPath();ctx.roundRect(24,24,W-48,H-220,24);ctx.clip();ctx.drawImage(img,(W-dw)/2,35+(H-220-dh)/2,dw,dh);ctx.restore();
ctx.fillStyle=frameId==='botanical'?'#697047':frameId==='minimal'?'#8b5d3f':'#5b321f';ctx.fillRect(0,H-180,W,180);
ctx.fillStyle='#fffaf0';ctx.textAlign='center';ctx.font='700 44px Playfair Display, serif';ctx.fillText(frameId==='coffee'?'CAFÉ + CARINHO':'CANTINHO DA NUTRI',W/2,H-116);ctx.font='600 30px Caveat, cursive';ctx.fillText(frameId==='classic'?'Eu fui ao Cantinho!':frameId==='botanical'?'Faço parte dessa nova história.':frameId==='minimal'?'Reinauguração 2026':'Um momento para guardar ❤️',W/2,H-70);
ctx.font='600 18px DM Sans, sans-serif';ctx.fillStyle='#e7d6bb';ctx.fillText('@CANTINHO • #REINAUGURAÇÃODOCANTINHO',W/2,H-32);ctx.strokeStyle='#d7b889';ctx.lineWidth=5;ctx.strokeRect(15,15,W-30,H-30);}
function prepareFrames(){const grid=$('#frameGrid');grid.innerHTML='';const img=new Image();img.onload=()=>frames.forEach((f,i)=>{const b=document.createElement('button');b.className='frame-option'+(i===0?' selected':'');b.dataset.frame=f.id;const c=document.createElement('canvas');drawFrame(c,img,f.id,true);b.appendChild(c);const s=document.createElement('span');s.className='frame-label';s.textContent=f.name;b.appendChild(s);b.onclick=()=>{document.querySelectorAll('.frame-option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.frame=f.id};grid.appendChild(b)});img.src=state.photo}
function makeResult(){const img=new Image();img.onload=()=>{drawFrame($('#resultCanvas'),img,state.frame);show('result')};img.src=state.photo}
$('#startBtn').onclick=()=>show('capture');
$('#cameraBtn').onclick=startCamera;
$('#fileInput').onchange=e=>loadFile(e.target.files[0]);
$('#applyFrameBtn').onclick=makeResult;
$('#downloadBtn').onclick=()=>{const a=document.createElement('a');a.download='cantinho-da-nutri-reinauguracao.png';a.href=$('#resultCanvas').toDataURL('image/png');a.click();toast('Imagem salva no aparelho! ❤️')};
$('#shareBtn').onclick=async()=>{const c=$('#resultCanvas');c.toBlob(async blob=>{const file=new File([blob],'cantinho-da-nutri.png',{type:'image/png'});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],text:'Eu fui ao Cantinho da Nutri! ❤️ @CANTINHO #REINAUGURAÇÃODOCANTINHO'});return}catch(e){}}await navigator.clipboard?.writeText('@CANTINHO #REINAUGURAÇÃODOCANTINHO');window.open('https://www.instagram.com/','_blank','noopener');toast('Legenda copiada. No Instagram, anexe a imagem e publique!')},'image/png')};
$('#newPhotoBtn').onclick=()=>{state.photo=null;state.frame='classic';$('#cameraBtn').textContent='Ativar câmera';$('#cameraBtn').onclick=startCamera;show('capture')};
$('#restartBtn').onclick=()=>show('welcome');
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));
window.addEventListener('beforeunload',stopCamera);
