const gift=document.querySelector('#gift'),invite=document.querySelector('#invitation');let opened=false, selectedVote=null;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function goTo(id){const page=document.getElementById(id);page.hidden=false;page.classList.add('entering');page.focus({preventScroll:true});requestAnimationFrame(()=>page.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}));}
gift.addEventListener('click',()=>{if(opened){goTo('story');return}opened=true;gift.classList.add('open');gift.setAttribute('aria-expanded','true');document.querySelector('#hint').innerHTML='Uma nova vida. Um amor sem medida.<span aria-hidden="true">↓</span>';invite.hidden=false;setTimeout(()=>goTo('story'),reduced?0:650)});
document.querySelector('#to-guess').addEventListener('click',e=>{e.currentTarget.setAttribute('aria-expanded','true');goTo('guess')});
document.querySelector('#to-details').addEventListener('click',e=>{e.currentTarget.setAttribute('aria-expanded','true');goTo('details')});
document.querySelector('#back-guess').addEventListener('click',()=>goTo('guess'));
function selectVote(v,celebrate){selectedVote=v;document.querySelector('#rsvp-vote').textContent='Seu palpite: '+(v==='menino'?'menino · time azul':'menina · time rosa')+'.';document.querySelectorAll('[data-vote]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vote===v)));document.querySelector('#result').replaceChildren();let title=document.createElement('strong');title.textContent=v==='menino'?'Seu coração escolheu azul!':'Seu coração escolheu rosa!';document.querySelector('#result').append(title,document.createTextNode('A resposta vamos descobrir juntos no grande dia.'));document.querySelector('#to-details').hidden=false;if(celebrate&&!reduced)smoke(v);}
document.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',()=>{try{localStorage.setItem('gl-palpite',b.dataset.vote)}catch{}selectVote(b.dataset.vote,true)}));try{const v=localStorage.getItem('gl-palpite');if(v==='menino'||v==='menina')selectVote(v,false)}catch{}
let smokeLayer=null;
function smoke(v){
 if(smokeLayer)smokeLayer.remove();
 const button=document.querySelector('[data-vote="'+v+'"]'),r=button.getBoundingClientRect();
 const layer=document.createElement('div');smokeLayer=layer;layer.className='smoke-layer';layer.setAttribute('aria-hidden','true');
 const hue=v==='menino'?204:340;
 for(let i=0;i<24;i++){
  const cloud=document.createElement('i');const size=100+Math.random()*100;
  cloud.className='smoke-puff';cloud.style.cssText='left:'+(r.left+r.width/2)+'px;top:'+(r.top+r.height*.7)+'px;width:'+size+'px;height:'+size+'px;margin-left:'+(-size/2)+'px;margin-top:'+(-size/2)+'px;--dx:'+((Math.random()-.5)*460)+'px;--dy:'+(-150-Math.random()*300)+'px;--hue:'+hue+';--light:'+(68+Math.random()*12)+'%;--delay:'+(Math.random()*.3)+'s;--scale:'+(1.5+Math.random()*1.6)+';';
  layer.append(cloud);
 }
 document.body.append(layer);setTimeout(()=>{layer.remove();if(smokeLayer===layer)smokeLayer=null},2900);
}
document.querySelector('#to-rsvp').addEventListener('click',e=>{e.currentTarget.setAttribute('aria-expanded','true');goTo('rsvp')});
document.querySelector('#back-details').addEventListener('click',()=>goTo('details'));
const rsvpForm=document.querySelector('#rsvp-form'),guestName=document.querySelector('#guest-name');
rsvpForm.addEventListener('submit',e=>{
 e.preventDefault();const name=guestName.value.trim();
 guestName.setCustomValidity(name.length<2?'Informe seu nome para continuar.':'');
 if(!rsvpForm.reportValidity())return;
 const attendance=rsvpForm.querySelector('input[name="attendance"]:checked').value;
 const answer=attendance==='sim'?'Confirmo minha presença na revelação do dia 27/10/2026, às 4h30, na Orla de Atalaia — Cinelândia.':'Desta vez não poderei ir à revelação do dia 27/10/2026.';
 const message='Olá, Gessica! Sou '+name+'.\n\n'+answer+'\n\nMeu palpite é: '+(selectedVote==='menino'?'menino 💙':selectedVote==='menina'?'menina 🩷':'ainda não escolhi')+'.';
 const url='https://wa.me/5579989901959?text='+encodeURIComponent(message);
 const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.click();
 const status=document.querySelector('#rsvp-status');status.replaceChildren(document.createTextNode('Para concluir sua resposta, envie a mensagem no WhatsApp. '));
 const retry=document.createElement('a');retry.href=url;retry.target='_blank';retry.rel='noopener noreferrer';retry.textContent='Abrir WhatsApp novamente';status.append(retry);
});
guestName.addEventListener('input',()=>guestName.setCustomValidity(''));
