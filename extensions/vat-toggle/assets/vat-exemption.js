(function () {
  const hints={AT:'U12345678',BE:'0123456789',DE:'123456789',DK:'12345678',ES:'X1234567X',FR:'12345678901',IE:'1234567A',IT:'12345678901',NL:'123456789B01',SE:'123456789012',PL:'1234567890'};
  const drawer=document.querySelector('[data-vat-exemption-drawer]');
  const closeDrawer=()=>{if(!drawer)return;drawer.hidden=true;document.body.style.overflow=''};
  document.querySelectorAll('[data-vat-exemption-open]').forEach((button)=>button.addEventListener('click',()=>{if(!drawer)return;drawer.hidden=false;document.body.style.overflow='hidden';drawer.querySelector('select')?.focus()}));
  drawer?.addEventListener('click',(event)=>{if(event.target===drawer)closeDrawer()}); document.querySelectorAll('[data-vat-exemption-close]').forEach((button)=>button.addEventListener('click',closeDrawer));
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape')closeDrawer()});
  document.querySelectorAll('[data-vat-exemption-form]').forEach((form)=>{
    const country=form.querySelector('[data-vat-country]'), number=form.querySelector('[data-vat-number]'), hint=form.querySelector('[data-vat-hint]'), submit=form.querySelector('[data-vat-submit]'), result=form.querySelector('[data-vat-result]');
    if(!country||!number||!submit||!result)return;
    country.addEventListener('change',()=>{const example=hints[country.value]||'VAT number';number.placeholder=country.value?`e.g. ${country.value}${example}`:'Select a country first';hint.textContent=country.value&&hints[country.value]?`Expected format: ${country.value}${hints[country.value]}`:''});
    submit.addEventListener('click',async()=>{result.className='priceswitch-exemption__result';result.textContent='Validating VAT number…';submit.disabled=true;try{const response=await fetch('/apps/vat-toggle/validate-vat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({countryCode:country.value,vatNumber:number.value})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Validation failed');result.classList.add('is-success');result.textContent=data.companyName?`VAT validated for ${data.companyName}. Tax exemption is active.`:'VAT validated. Tax exemption is active.';try{localStorage.setItem('vat_display_mode','exclusive')}catch(e){};window.vatToggle?.set('exclusive')}catch(error){result.classList.add('is-error');result.textContent=error.message||'Validation failed. Please try again.'}finally{submit.disabled=false}});
  });
})();
