(()=>{
 const ACTIVE="odontologia-profile-active-v1";
 const LOCKED="odontologia-profile-browser-lock-v1";
 const PREFIX="odontologia-user-v1";
 const raw=window.localStorage;
 const normalize=v=>String(v||"").trim().toLowerCase();
 const valid=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(v));
 const active=()=>normalize(raw.getItem(ACTIVE)||"");
 const locked=()=>normalize(raw.getItem(LOCKED)||"");
 const scoped=(base,email=active())=>PREFIX+"::"+encodeURIComponent(email)+"::"+base;

 const storage={
   getItem(base){const email=active();return email?raw.getItem(scoped(base,email)):raw.getItem(base);},
   setItem(base,value){const email=active();return email?raw.setItem(scoped(base,email),String(value)):raw.setItem(base,String(value));},
   removeItem(base){const email=active();return email?raw.removeItem(scoped(base,email)):raw.removeItem(base);}
 };

 function login(value){
   const email=normalize(value);
   if(!valid(email))return {ok:false,message:"Digite um e-mail válido."};
   const browserEmail=locked();
   if(browserEmail&&email!==browserEmail){
     return {ok:false,message:"Confira o e-mail digitado. Para acessar o Caderno de Odontologia, você deve utilizar o mesmo e-mail informado quando realizou a compra."};
   }
   if(!browserEmail)raw.setItem(LOCKED,email);
   raw.setItem(ACTIVE,email);
   return {ok:true,email};
 }
 window.ODONTO_PROFILE={active,locked,valid,login,storage,scopedKey:scoped};

 function bind(){
   const modal=document.getElementById("profileModal"),form=document.getElementById("profileForm");
   const input=document.getElementById("profileEmail"),error=document.getElementById("profileError");
   const button=document.getElementById("profileBtn"),closeBtn=document.getElementById("profileClose");
   if(!modal||!form||!input)return;
   const email=active();
   if(closeBtn)closeBtn.hidden=!email;
   const open=()=>{modal.hidden=false;document.body.classList.add("profile-modal-open");input.value=active();setTimeout(()=>input.focus(),40);};
   const close=()=>{if(!active())return;modal.hidden=true;document.body.classList.remove("profile-modal-open");};
   if(email){
     modal.hidden=true;
     if(button){button.hidden=false;button.textContent=email;button.title="E-mail de acesso";button.onclick=open;}
   }else{
     document.body.classList.add("profile-locked");if(button)button.hidden=true;open();
   }
   form.onsubmit=e=>{e.preventDefault();if(error)error.textContent="";const result=login(input.value);if(!result.ok){if(error)error.textContent=result.message;return;}location.reload();};
   if(closeBtn)closeBtn.onclick=close;
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
})();

