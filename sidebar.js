(() => {
 const sidebar=document.querySelector('.sidebar');
 if(!sidebar)return;
 const key='boundary-sidebar-pinned';
 let pinned=false;
 try{pinned=localStorage.getItem(key)==='true'}catch{}
 const shell=document.createElement('div');shell.className='nav-shell';
 sidebar.before(shell);shell.append(sidebar);sidebar.id='workspace-navigation';
 const toggle=document.createElement('button');toggle.className='nav-toggle';toggle.type='button';
 toggle.setAttribute('aria-controls',sidebar.id);shell.append(toggle);
 document.body.classList.add('nav-auto');
 function update(open=pinned){
  shell.classList.toggle('nav-open',open||pinned);
  document.body.classList.toggle('nav-pinned',pinned);
  sidebar.inert=!(open||pinned);
  toggle.textContent=pinned?'‹':'☰';
  toggle.setAttribute('aria-expanded',String(open||pinned));
  toggle.setAttribute('aria-label',pinned?'收起导航，开启自动隐藏':'固定展开导航');
  toggle.title=pinned?'收起导航':'悬停临时展开 · 点击固定展开';
 }
 toggle.addEventListener('click',()=>{pinned=!pinned;try{localStorage.setItem(key,String(pinned))}catch{}update()});
 shell.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')update(true)});
 shell.addEventListener('pointerleave',()=>update());
 toggle.addEventListener('focus',()=>update(true));
 shell.addEventListener('focusout',e=>{if(!shell.contains(e.relatedTarget))update()});
 sidebar.addEventListener('click',e=>{if(!pinned&&e.target.closest('button,a')){toggle.focus();update(false)}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pinned){if(shell.contains(document.activeElement))toggle.focus();update(false)}});
 document.addEventListener('pointerdown',e=>{if(!pinned&&!shell.contains(e.target))update(false)});
 update();
})();
