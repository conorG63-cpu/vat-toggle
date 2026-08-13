(function(){'use strict';
const S='vat_display_mode',P='vat_popup_choice',C='vat_settings_cache',T=3e5;
const R={none:'0',small:'4px',medium:'6px',large:'12px',full:'50px'};

class V{
constructor(){
  this.c=document.getElementById('vat-toggle-container');
  if(!this.c)return;
  const d=this.c.dataset;
  
  // Read ALL settings from data attributes (including styles from metafields)
  this.cfg={
    vr:parseFloat(d.vatRate)||20,
    dm:d.defaultMode||'inclusive',
    il:d.inclusiveLabel||'Inc. VAT',
    el:d.exclusiveLabel||'Ex. VAT',
    sp:d.showPopup==='true',
    pt:d.popupTitle||'',
    pm:d.popupMessage||'',
    mf:d.moneyFormat||'£{{amount}}',
    b2b:false,
    b2bt:'',
    b2bm:'exclusive',
    // Style settings from data attributes (populated from metafields in Liquid)
    ts:d.toggleStyle||'pill',
    pc:d.primaryColor||'#000000',
    bc:d.backgroundColor||'#f4f4f4',
    tc:d.activeTextColor||'#ffffff',
    br:d.borderRadius||'medium',
    vi:true,
    ip:'after',
    as:d.animationStyle||'smooth'
    ,sv:Number(d.settingsVersion)||1,wp:d.widgetPosition||'bottom-right',dx:Number(d.desktopOffsetX)||24,dy:Number(d.desktopOffsetY)||24,mx:Number(d.mobileOffsetX)||16,my:Number(d.mobileOffsetY)||80,wa:Number(d.widgetPadding)||12,cs:d.controlSize||'medium',bw:Number(d.widgetBorderWidth)||0,bl:d.widgetBorderColor||'#e1e3e5',ws:d.widgetShadow||'medium',am:d.allowMinimize!=='false',hs:d.helperTextSize||'medium',hc:d.helperTextColor||'#6d7175',pd:Number(d.popupChoiceDays)||30,pw:Number(d.popupWidth)||420,pb:d.popupBackgroundColor||'#ffffff',po:d.popupOverlayColor||'#000000',oo:Number(d.popupOverlayOpacity)||55,pr:d.popupBorderRadius||'medium',ptc:d.popupTitleColor||'#202223',pmc:d.popupTextColor||'#616161',pbs:d.popupButtonStyle||'solid',pcx:d.popupShowClose!=='false'
  };
  this.ps=['.price','.product-price','.price__regular','.price__sale','.price-item','.price-item--regular','.price-item--sale','.cart-item__price','.product__price','.money','[data-product-price]','[data-price]'];
  this.init()
}

async init(){
  await this.fetch();
  this.style();
  this.c.dataset.position==='floating'||this.c.classList.contains('vat-toggle--floating')?this.float():this.header();
  this.m=this.initial();
  this.bind();
  this.ui();
  this.prices();
  this.popup();
  this.obs()
}

float(){this.c.classList.add('vat-toggle--floating');try{localStorage.getItem('vat_toggle_minimized')==='true'&&this.c.classList.add('vat-toggle--minimized')}catch(e){}this.c.onclick=e=>{if(!this.cfg.am)return;if(e.target.closest('.vat-toggle-minimize')){e.preventDefault();e.stopPropagation();this.min();return}this.c.classList.contains('vat-toggle--minimized')&&(e.target===this.c||e.target.closest('.vat-toggle-minimized-icon'))&&(e.stopPropagation(),this.min())}}
min(){try{localStorage.setItem('vat_toggle_minimized',this.c.classList.toggle('vat-toggle--minimized').toString())}catch(e){}}
header(){const h=this.c.closest('header,.header,.site-header,[class*="header"]');if(!h)return;requestAnimationFrame(()=>{const cs=getComputedStyle(this.c),w=parseFloat(cs.width),t=this.c.querySelector('.vat-toggle'),tw=t?parseFloat(getComputedStyle(t).width):0;if(w<120||tw<100){const s=this.c.style;s.setProperty('min-width','150px','important');s.setProperty('width','auto','important');s.setProperty('flex-shrink','0','important');s.setProperty('display','inline-flex','important');let p=this.c.parentElement,d=0;while(p&&d<5){const ps=getComputedStyle(p);(ps.display.includes('flex')||ps.display.includes('grid'))&&(p.style.setProperty('flex-shrink','0','important'),p.style.setProperty('min-width','fit-content','important'));p=p.parentElement;d++}}const fp=this.c.parentElement;fp&&getComputedStyle(fp).display.includes('flex')&&this.c.style.setProperty('order','-1','important')})}

isThemeEditor(){return window.Shopify&&window.Shopify.designMode===true||window.location.href.includes('preview_theme_id')||window.location.pathname.includes('/editor')}

async fetch(){
  try{
    // In theme editor, settings come from metafields via data attributes - no fetch needed
    if(this.isThemeEditor())return;
    const c=localStorage.getItem(C);
    if(c){
      const{settings:s,timestamp:t}=JSON.parse(c);
      if(Date.now()-t<T&&s.settingsVersion===this.cfg.sv){this.apply(s);return}
    }
    const shop=window.Shopify?.shop||this.c.dataset.shopDomain||location.hostname;
    const r=await fetch(`/apps/vat-toggle/settings?shop=${shop}`);
    if(r.ok){
      const payload=await r.json();
      const s=payload.settings||payload;
      const locale=(this.c.dataset.locale||document.documentElement.lang||navigator.language||'').toLowerCase();
      const translation=(payload.translations||[]).find(t=>locale===t.locale||locale.startsWith(t.locale+'-'));
      if(translation)Object.assign(s,translation);
      const country=this.c.dataset.countryCode||window.Shopify?.country||document.documentElement.dataset.country||'';
      const marketRate=(payload.rates||[]).find(x=>x.countryCode===country);
      if(marketRate)s.defaultVatRate=marketRate.rate;
      this.apply(s);
      localStorage.setItem(C,JSON.stringify({settings:s,timestamp:Date.now()}))
    }
  }catch(e){}
}

apply(s){
  const c=this.cfg;
  s.defaultVatRate!==undefined&&(c.vr=s.defaultVatRate);
  s.defaultDisplayMode&&(c.dm=s.defaultDisplayMode);
  s.inclusiveLabel&&(c.il=s.inclusiveLabel);
  s.exclusiveLabel&&(c.el=s.exclusiveLabel);
  s.showPopupOnFirstVisit!==undefined&&(c.sp=s.showPopupOnFirstVisit);
  s.popupTitle&&(c.pt=s.popupTitle);
  s.popupMessage&&(c.pm=s.popupMessage);
  s.enableB2BMode!==undefined&&(c.b2b=s.enableB2BMode);
  s.b2bCustomerTags&&(c.b2bt=s.b2bCustomerTags);
  s.b2bDefaultMode&&(c.b2bm=s.b2bDefaultMode);
  s.toggleStyle&&(c.ts=s.toggleStyle);
  s.primaryColor&&(c.pc=s.primaryColor);
  s.backgroundColor&&(c.bc=s.backgroundColor);
  s.activeTextColor&&(c.tc=s.activeTextColor);
  s.borderRadius&&(c.br=s.borderRadius);
  s.showVatIndicator!==undefined&&(c.vi=s.showVatIndicator);
  s.indicatorPosition&&(c.ip=s.indicatorPosition);
  s.animationStyle&&(c.as=s.animationStyle);
  ['settingsVersion','widgetPosition','desktopOffsetX','desktopOffsetY','mobileOffsetX','mobileOffsetY','widgetPadding','controlSize','widgetBorderWidth','widgetBorderColor','widgetShadow','allowMinimize','helperTextSize','helperTextColor','popupChoiceDays','popupWidth','popupBackgroundColor','popupOverlayColor','popupOverlayOpacity','popupBorderRadius','popupTitleColor','popupTextColor','popupButtonStyle','popupShowClose'].forEach(k=>{if(s[k]!==undefined){const map={settingsVersion:'sv',widgetPosition:'wp',desktopOffsetX:'dx',desktopOffsetY:'dy',mobileOffsetX:'mx',mobileOffsetY:'my',widgetPadding:'wa',controlSize:'cs',widgetBorderWidth:'bw',widgetBorderColor:'bl',widgetShadow:'ws',allowMinimize:'am',helperTextSize:'hs',helperTextColor:'hc',popupChoiceDays:'pd',popupWidth:'pw',popupBackgroundColor:'pb',popupOverlayColor:'po',popupOverlayOpacity:'oo',popupBorderRadius:'pr',popupTitleColor:'ptc',popupTextColor:'pmc',popupButtonStyle:'pbs',popupShowClose:'pcx'};c[map[k]]=s[k]}});
  this.labels();
  this.style()
}

style(){
  const t=this.c.querySelector('.vat-toggle');
  const br=R[this.cfg.br]||'6px';
  const c=this.cfg;
  if(t){
    t.className='vat-toggle vat-toggle--'+c.ts+' vat-toggle--animation-'+c.as;
    t.style.setProperty('--vat-primary-color',c.pc);
    t.style.setProperty('--vat-background-color',c.bc);
    t.style.setProperty('--vat-active-text-color',c.tc);
    t.style.setProperty('--vat-border-radius',br);
    t.style.setProperty('--vat-btn-border-radius',`calc(${br} - 2px)`);
    c.ts==='buttons'&&t.style.setProperty('--vat-border-color',c.bc)
  }
  this.c.style.setProperty('--vat-primary-color',c.pc);
  this.c.style.setProperty('--vat-background-color',c.bc);
  this.c.style.setProperty('--vat-active-text-color',c.tc);
  this.c.style.setProperty('--vat-border-radius',br);
  const shadows={none:'none',small:'0 2px 8px rgba(0,0,0,.10)',medium:'0 4px 24px rgba(0,0,0,.12)',large:'0 10px 36px rgba(0,0,0,.18)'};this.c.style.setProperty('--vat-widget-padding',c.wa+'px');this.c.style.setProperty('--vat-widget-border-width',c.bw+'px');this.c.style.setProperty('--vat-widget-border-color',c.bl);this.c.style.setProperty('--vat-widget-shadow',shadows[c.ws]||shadows.medium);this.c.style.setProperty('--vat-helper-text-color',c.hc);this.c.dataset.position=c.wp;
  const pos={"bottom-right":['right','bottom'],"bottom-left":['left','bottom'],"top-right":['right','top'],"top-left":['left','top']}[c.wp]||['right','bottom'];['top','right','bottom','left'].forEach(x=>this.c.style[x]='');this.c.style[pos[0]]=c.dx+'px';this.c.style[pos[1]]=c.dy+'px';this.c.style.setProperty('--vat-mobile-x',c.mx+'px');this.c.style.setProperty('--vat-mobile-y',c.my+'px');this.c.classList.toggle('vat-toggle--no-minimize',!c.am);
  const p=document.getElementById('vat-popup-overlay');
  if(p){const r=R[c.pr]||'6px';p.style.setProperty('--vat-primary-color',c.pc);p.style.setProperty('--vat-active-text-color',c.tc);p.style.setProperty('--vat-popup-width',c.pw+'px');p.style.setProperty('--vat-popup-background',c.pb);p.style.setProperty('--vat-popup-overlay',c.po);p.style.setProperty('--vat-popup-opacity',String(c.oo/100));p.style.setProperty('--vat-popup-radius',r);p.style.setProperty('--vat-popup-title-color',c.ptc);p.style.setProperty('--vat-popup-text-color',c.pmc);p.classList.toggle('vat-popup--outline-buttons',c.pbs==='outline');const close=p.querySelector('.vat-popup-close');close&&(close.style.display=c.pcx?'':'none')}
}

labels(){const c=this.cfg,ib=this.c.querySelector('.vat-toggle-inclusive'),eb=this.c.querySelector('.vat-toggle-exclusive');ib&&(ib.textContent=c.il);eb&&(eb.textContent=c.el);const p=document.getElementById('vat-popup-overlay');if(p){const pt=p.querySelector('.vat-popup-title'),pm=p.querySelector('.vat-popup-message'),pi=p.querySelector('.vat-popup-inclusive'),pe=p.querySelector('.vat-popup-exclusive');pt&&c.pt&&(pt.textContent=c.pt);pm&&c.pm&&(pm.textContent=c.pm);pi&&(pi.textContent=c.il);pe&&(pe.textContent=c.el)}}
initial(){try{const s=localStorage.getItem(S);if(s)return s}catch(e){}if(this.cfg.b2b){const ct=window.__st?.cid?this.tags():[],bt=this.cfg.b2bt.split(',').map(t=>t.trim().toLowerCase());if(ct.some(t=>bt.includes(t.toLowerCase())))return this.cfg.b2bm}return this.cfg.dm}
tags(){const m=document.querySelector('meta[name="customer-tags"]');return m?m.content.split(',').map(t=>t.trim()):window.customerTags||[]}
bind(){this.c.querySelectorAll('.vat-toggle-btn').forEach(b=>b.onclick=e=>this.set(e.target.dataset.mode));const p=document.getElementById('vat-popup-overlay');p&&(p.querySelectorAll('.vat-popup-btn').forEach(b=>b.onclick=e=>{this.set(e.target.dataset.mode);this.close()}),p.querySelector('.vat-popup-close')?.addEventListener('click',()=>this.close()),p.onclick=e=>e.target===p&&this.close(),document.onkeydown=e=>e.key==='Escape'&&p.style.display==='flex'&&this.close())}
set(m){this.m=m;try{localStorage.setItem(S,m)}catch(e){}this.ui();this.prices();window.dispatchEvent(new CustomEvent('vatModeChanged',{detail:{mode:m,vatRate:this.cfg.vr}}))}

ui(){
  const c=this.cfg;
  this.c.querySelectorAll('.vat-toggle-btn').forEach(b=>{
    const a=b.dataset.mode===this.m;
    b.classList.toggle('active',a);
    b.setAttribute('aria-pressed',a);
    if(a){
      b.style.backgroundColor=c.ts==='minimal'?'transparent':c.pc;
      b.style.color=c.ts==='minimal'?c.pc:c.tc;
      c.ts==='minimal'&&(b.style.borderBottomColor=c.pc);
      c.ts==='buttons'&&(b.style.borderColor=c.pc)
    }else{
      b.style.backgroundColor='';
      b.style.color='';
      b.style.borderColor='';
      b.style.borderBottomColor=''
    }
  })
}

prices(){document.querySelectorAll(this.ps.join(',')).forEach(e=>this.price(e))}
price(e){if(e.closest('#vat-toggle-container,#vat-popup-overlay'))return;let op=e.dataset.originalPrice;if(!op){const t=e.textContent,c=t.replace(/[£$€¥₹,\s]/g,'').match(/[\d.]+/);if(!c)return;op=c[0];e.dataset.originalPrice=op;e.dataset.pricesIncludeVat='true'}const pr=parseFloat(op),inc=e.dataset.pricesIncludeVat==='true',vr=this.cfg.vr;let dp=this.m==='inclusive'?(inc?pr:pr*(1+vr/100)):(inc?pr/(1+vr/100):pr);const f=dp.toFixed(2),fp=this.cfg.mf.replace('{{amount}}',f).replace('{{amount_no_decimals}}',Math.round(dp)).replace('{{amount_with_comma_separator}}',f.replace('.',','));const mn=e.querySelector('.money');mn&&!e.classList.contains('money')?mn.textContent=fp:e.textContent=fp;if(this.cfg.vi){let i=e.parentElement?.querySelector('.vat-indicator');if(!i){i=document.createElement('span');i.className='vat-indicator';this.cfg.ip==='before'?e.parentElement?.insertBefore(i,e):e.parentElement?.appendChild(i);this.cfg.ip==='below'&&(i.style.display='block')}const l=this.m==='inclusive'?this.cfg.il:this.cfg.el;i.textContent=this.cfg.ip==='before'?l+' ':' '+l;i.style.fontSize=this.cfg.hs==='small'?'11px':this.cfg.hs==='large'?'15px':'13px'}}
popup(){if(!this.cfg.sp)return;try{const saved=JSON.parse(localStorage.getItem(P)||'null');if((!saved||Date.now()>saved.expiresAt)&&!localStorage.getItem(S))this.show()}catch(e){this.show()}}
show(){const p=document.getElementById('vat-popup-overlay');p&&(p.style.display='flex',document.body.style.overflow='hidden',p.querySelector('.vat-popup-btn')?.focus())}
close(){const p=document.getElementById('vat-popup-overlay');p&&(p.style.display='none',document.body.style.overflow='');try{localStorage.setItem(P,JSON.stringify({expiresAt:Date.now()+this.cfg.pd*864e5}))}catch(e){}}
obs(){new MutationObserver(ms=>{let u=0;ms.forEach(m=>m.addedNodes.forEach(n=>n.nodeType===1&&(n.matches?.(this.ps.join(','))||n.querySelector?.(this.ps.join(',')))&&u++));u&&(clearTimeout(this.ut),this.ut=setTimeout(()=>this.prices(),100))}).observe(document.body,{childList:1,subtree:1})}
getMode(){return this.m}getConfig(){return{...this.cfg}}refresh(){this.prices()}
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>window.vatToggle=new V):window.vatToggle=new V;
window.VATToggle=V;
})();
