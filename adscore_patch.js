/*
 * AdScore perf-coherence patch (v11) — ETAT FINAL VALIDE
 * Linux honnete = proxy / Windows claim + noise ON = proxy (3/3 apres correction)
 * v11: RETIRE le defineProperty navigator.gpu (propriete own enumerable
 * detectee par la sonde s19 d'AdScore = cause de la regression bot generalisee)
 * Contient: hook Worker compatible self (workers imbriques), benchmark
 * getParameter ~120us, MAX_ELEMENTS 65535, canvas 2d slowdown (s35 timeout),
 * overrides GPU/voices/matchMedia conditionnes UA Android.
 * A inserer AVANT le tag Adscore sur une page que vous controlez.
 */
/* perf-coherence patch v6 */
function workerPatch(){
function workerSrc(){return 'var workerPatch='+workerPatch.toString()+';workerPatch();'}
var IS_WIN=/Android/.test(navigator.userAgent);
try{if(IS_WIN){Object.defineProperty(navigator,'hardwareConcurrency',{get:function(){return 8},configurable:true})}}catch(e){}
function patchProto(proto){if(!proto)return;var orig=proto.getParameter;if(!orig||orig.__pcd)return;var UNR=37446,UNV=37445,MEI=34025,MEV=34024;var w=function(p){if(p===UNR||p===UNV){var t0=performance.now();while(performance.now()-t0<0.12){}}var v=orig.call(this,p);if(p===MEI||p===MEV)return 65535;if(IS_WIN){if(p===37446)return 'Adreno (TM) 740';if(p===37445)return 'Qualcomm';if(p===7937)return 'Adreno (TM) 740';if(p===7936)return 'Qualcomm'}return v};nat(w,'getParameter');w.__pcd=1;try{proto.getParameter=w}catch(e){}}
function nat(fn,name){try{Object.defineProperty(fn,'name',{value:name})}catch(e){}try{fn.toString=function(){return 'function '+name+'() {\n    [native code]\n}'}}catch(e){}return fn}
if(typeof WebGLRenderingContext!=='undefined')patchProto(WebGLRenderingContext.prototype);
if(typeof WebGL2RenderingContext!=='undefined')patchProto(WebGL2RenderingContext.prototype);
if(typeof HTMLCanvasElement!=='undefined'&&HTMLCanvasElement.prototype){var oc=HTMLCanvasElement.prototype.getContext;if(oc&&!oc.__pcd2){var wc=function(t,attrs){if(t==='2d'){var t0=performance.now();while(performance.now()-t0<60){}}return oc.call(this,t,attrs)};nat(wc,'getContext');wc.__pcd2=1;try{HTMLCanvasElement.prototype.getContext=wc}catch(e){}}}
var G=(typeof window!=='undefined')?window:self;
try{if(typeof Worker!=='undefined'&&!G.__wpHooked){G.__wpHooked=1;var _W=G.Worker;G.Worker=function(url,opts){var u=String(url),src=null;try{if(u.indexOf('blob:')===0||u.indexOf('data:')===0){var x=new XMLHttpRequest();x.open('GET',u,false);x.send();src=x.responseText}}catch(e){}if(src!=null&&src.length){try{url=URL.createObjectURL(new Blob([workerSrc(),"\n",src],{type:'application/javascript'}))}catch(e){}}return new _W(url,opts)}}}catch(e){}
if(typeof document!=='undefined'&&IS_WIN){
var _mm=G.matchMedia;
try{if(_mm&&navigator.maxTouchPoints>0){G.matchMedia=function(q){var s=String(q);if(/hover/.test(s)){var none=/none/.test(s);return{matches:none,media:s,addEventListener:function(){},removeEventListener:function(){},addListener:function(){},removeListener:function(){},onchange:null,dispatchEvent:function(){return false}}}if(/any-pointer:\s*coarse/.test(s))return{matches:true,media:s,addEventListener:function(){},removeEventListener:function(){},addListener:function(){},removeListener:function(){},onchange:null,dispatchEvent:function(){return false}};return _mm.call(G,q)}}}catch(e){}
try{var g=document.createElement('div');g.style.cssText='position:absolute;left:-9999px;top:-9999px;visibility:hidden';var fams=['Arial','Courier New','Georgia','Times New Roman','Trebuchet MS','Verdana','Roboto','Noto Sans','Segoe UI','Tahoma','Calibri','Cambria','Mistral'];for(var i=0;i<fams.length;i++){var l=document.createElement('span');l.style.font='72px "'+fams[i]+'"';l.textContent='mmmmmmmmmmlli';g.appendChild(l)}document.documentElement.appendChild(g);void g.offsetHeight;document.documentElement.removeChild(g)}catch(e){}
}
}
workerPatch();
var _OW=window.Worker;
window.Worker=function(url,opts){var u=String(url),src=null;try{if(u.indexOf('blob:')===0||u.indexOf('data:')===0){var x=new XMLHttpRequest();x.open('GET',u,false);x.send();src=x.responseText}}catch(e){}if(src!=null&&src.length){try{url=URL.createObjectURL(new Blob(['var workerPatch='+workerPatch.toString()+';workerPatch();',"\n",src],{type:'application/javascript'}))}catch(e){}}return new _OW(url,opts)};
