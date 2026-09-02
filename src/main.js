import './styles.css';

const icon = (name, size = 20) => {
  const paths = {
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 2.8 21 3 21 3s.2 5.5-3.1 11.2A7 7 0 0 1 11 20Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6.94C9.9 12.68 13.5 12 17 12"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-8"/>',
    drop: '<path d="M12 2.7 6.3 9a7.8 7.8 0 1 0 11.4 0L12 2.7Z"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v3m6-3v3M9 20v3m6-3v3M20 9h3m-3 5h3M1 9h3m-3 5h3"/>',
    refresh: '<path d="M20 6v5h-5"/><path d="M19 11a7 7 0 1 0 .1 5"/>',
    thermometer: '<path d="M14 14.8V5a4 4 0 0 0-8 0v9.8a6 6 0 1 0 8 0Z"/><path d="M10 7v10"/>',
    cloud: '<path d="M17.5 19H7a5 5 0 1 1 1.7-9.7A6 6 0 0 1 20 12a3.5 3.5 0 0 1-2.5 7Z"/><path d="m9 22 1-2m4 2 1-2"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 20h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>'
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
};

const beds = [
  { name: 'Aromáticas', value: 52, min: 40, max: 65, color: '#2b7a5c' },
  { name: 'Hojas', value: 28, min: 35, max: 60, color: '#5ca680' },
  { name: 'Raíces', value: 44, min: 38, max: 58, color: '#d6a53c' },
  { name: 'Legumbres', value: 49, min: 42, max: 62, color: '#3a8ea5' },
];

let state = { temp: 24.8, humidity: 63, rain: 4.2, updated: new Date(), auto: false, bedOffline: false, selectedBed: 1, period: 24, irrigation: [] };
let autoTimer;
const themePreference = window.matchMedia('(prefers-color-scheme: dark)');
let theme = localStorage.getItem('huerta-theme') || (themePreference.matches ? 'dark' : 'light');

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#101915' : '#153f32';
}
applyTheme();

const pages = {
  resumen: { label: 'Resumen', icon: 'grid' }, historial: { label: 'Historial', icon: 'chart' }, riegos: { label: 'Riegos', icon: 'drop' }, dispositivos: { label: 'Dispositivos', icon: 'cpu' }
};

function activePage() { return (location.hash.slice(1) in pages ? location.hash.slice(1) : 'resumen'); }
function formatTime(date) { return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); }

function layout() {
  const page = activePage();
  document.querySelector('#app').innerHTML = `
    <aside class="sidebar" id="sidebar">
      <div class="brand"><div class="brand-mark">${icon('leaf', 27)}</div><div><strong>HUERTA</strong><span>Monitoreo IoT</span></div></div>
      <nav aria-label="Navegación principal">${Object.entries(pages).map(([id,p]) => `<a href="#${id}" class="${page===id?'active':''}">${icon(p.icon)}<span>${p.label}</span></a>`).join('')}</nav>
      <div class="sidebar-info"><span class="pulse"></span><div><strong>Entorno conceptual</strong><small>Wi-Fi 2,4 GHz · MQTT/TLS</small></div></div>
      <div class="academic">PROYECTO ACADÉMICO<br><span>Huerta experimental · 2026</span></div>
    </aside>
    <div class="shell">
      <header>
        <button class="icon-btn menu-btn" id="menu" aria-label="Abrir menú">${icon('menu')}</button>
        <div class="title"><span>Monitoreo de huerta orgánica</span><small>Panel de control experimental</small></div>
        <div class="header-actions"><span class="demo-badge"><i></i> DEMO · DATOS SIMULADOS</span><button class="btn secondary" id="refresh">${icon('refresh',17)} <span>Actualizar datos</span></button><button class="theme-toggle" id="theme-toggle" aria-label="${theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}" title="${theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}">${icon(theme === 'dark' ? 'sun' : 'moon', 18)}</button></div>
      </header>
      <main><div class="page-head"><div><span class="eyebrow">TABLERO / ${pages[page].label.toUpperCase()}</span><h1>${pages[page].label}</h1><p>${pageSubtitle(page)}</p></div><div class="last-update">${icon('clock',16)} Actualizado <strong id="updated">${formatTime(state.updated)}</strong></div></div><div id="content">${renderPage(page)}</div></main>
      <footer><span>Prototipo académico · Los valores y eventos son simulados.</span><span>Sin conexión a dispositivos reales</span></footer>
    </div><div class="toast" id="toast"></div>`;
  bindGlobal(); bindPage(page);
}

function pageSubtitle(page) {
  return { resumen:'Estado general de cultivos y condiciones ambientales.', historial:'Análisis temporal de las mediciones simuladas.', riegos:'Registro manual de intervenciones de riego.', dispositivos:'Estado conceptual de la red de sensores.' }[page];
}

function renderPage(page) {
  if(page==='resumen') return renderSummary();
  if(page==='historial') return renderHistory();
  if(page==='riegos') return renderIrrigation();
  return renderDevices();
}

function renderSummary() {
  const alerts = beds.filter(b=>b.value<b.min).length;
  return `<section class="metrics">
    ${metric('thermometer','Temperatura ambiente',state.temp.toFixed(1).replace('.',','),'°C','Dentro del rango esperado','green')}
    ${metric('drop','Humedad relativa',Math.round(state.humidity),'%','Condición estable','blue')}
    ${metric('cloud','Lluvia acumulada hoy',state.rain.toFixed(1).replace('.',','),'mm','Último evento: 08:42','cyan')}
    ${metric('bell','Alertas activas',alerts,'','Requieren atención','yellow')}
  </section>
  <section class="section"><div class="section-title"><div><h2>Humedad de suelo</h2><p>Lectura actual por cantero y rango agronómico definido</p></div><div class="legend"><i></i> En rango <i class="warn"></i> Bajo mínimo</div></div>
  <div class="beds">${beds.map((b,i)=>bedCard(b,i)).join('')}</div></section>
  <div class="two-col"><section class="panel"><div class="section-title"><div><h2>Actividad reciente</h2><p>Eventos de la jornada</p></div><button class="text-btn">Ver historial</button></div>
    <div class="timeline">${eventRow('drop','Lluvia detectada','4,2 mm acumulados por el pluviómetro','08:42','blue')}${eventRow('bell','Humedad baja · Hojas','Cantero 2 descendió del umbral de 35 %','08:17','yellow')}${eventRow('cpu','Sincronización completada','Todos los nodos reportaron telemetría','07:55','green')}${eventRow('drop','Riego manual registrado','Cantero 1 · Aromáticas · 12 minutos','Ayer','cyan')}</div>
  </section><section class="panel system"><div class="section-title"><div><h2>Estado del sistema</h2><p>Servicios conceptuales de la demo</p></div><span class="status-pill online">Operativo</span></div>
  ${statusRow('Red de sensores','6 nodos configurados','6 / 6')}${statusRow('Mensajería MQTT/TLS','Flujo simulado','Normal')}${statusRow('Almacenamiento','Datos locales temporales','Activo')}
  <label class="auto"><div><strong>Simulación automática</strong><small>Actualizar cada 10 segundos</small></div><input type="checkbox" id="auto" ${state.auto?'checked':''}><span></span></label></section></div>`;
}

function metric(ic,label,val,unit,note,tone) { return `<article class="metric"><div class="metric-top"><span class="metric-icon ${tone}">${icon(ic)}</span><span class="dots">•••</span></div><p>${label}</p><div class="metric-value">${val}<small>${unit}</small></div><span class="trend ${tone==='yellow'?'attention':''}">${tone==='yellow'?'!':'↗'} ${note}</span></article>`; }
function bedCard(b,i) { const low=b.value<b.min; const pct=Math.min(100,Math.max(0,b.value)); return `<article class="bed-card ${low?'low':''}"><div class="bed-top"><span class="bed-number">0${i+1}</span><span class="status-pill ${low?'danger':'online'}">${low?'Bajo mínimo':'En rango'}</span></div><h3>${b.name}</h3><p>Cantero ${i+1}</p><div class="moist"><strong>${Math.round(b.value)}<small>%</small></strong><span>Rango<br><b>${b.min}–${b.max} %</b></span></div><div class="bar"><i style="width:${pct}%;background:${low?'#d79a21':b.color}"></i><em style="left:${b.min}%"></em><em style="left:${b.max}%"></em></div>${low?`<div class="bed-alert">${icon('bell',15)} Requiere atención · mínimo ${b.min} %</div>`:`<div class="bed-foot">Nivel adecuado para el cultivo</div>`}</article>`; }
function eventRow(ic,title,text,time,tone) { return `<div class="event"><span class="event-icon ${tone}">${icon(ic,17)}</span><div><strong>${title}</strong><p>${text}</p></div><time>${time}</time></div>`; }
function statusRow(a,b,c) { return `<div class="status-row"><span class="status-dot"></span><div><strong>${a}</strong><small>${b}</small></div><b>${c}</b></div>`; }

function renderHistory() {
  return `<section class="panel chart-panel"><div class="chart-toolbar"><div><h2>Evolución de humedad y lluvia</h2><p>Lecturas sintéticas para análisis del comportamiento</p></div><div class="filters"><label>Cantero<select id="bed-filter">${beds.map((b,i)=>`<option value="${i}" ${state.selectedBed===i?'selected':''}>${i+1} · ${b.name}</option>`).join('')}</select></label><label>Período<select id="period"><option value="24" ${state.period===24?'selected':''}>Últimas 24 horas</option><option value="168" ${state.period===168?'selected':''}>Últimos 7 días</option></select></label></div></div><div class="chart-legend"><span><i class="line-green"></i> Humedad de suelo (%)</span><span><i class="line-blue"></i> Lluvia (mm)</span><span><i class="line-dash"></i> Umbral mínimo (${beds[state.selectedBed].min} %)</span></div><div class="canvas-wrap"><canvas id="chart" aria-label="Gráfico de humedad y lluvia"></canvas></div><div class="chart-foot">${icon('info',16)} Los valores se generan localmente para representar el funcionamiento esperado del sistema.</div></section>`;
}

function renderIrrigation() {
  return `<div class="irrigation-grid"><section class="panel form-panel"><div class="section-title"><div><h2>Registrar riego manual</h2><p>Documentá una intervención realizada en la huerta</p></div></div><form id="irrigation-form"><label>Sector<select name="sector" required>${beds.map((b,i)=>`<option>Cantero ${i+1} · ${b.name}</option>`).join('')}</select></label><div class="form-row"><label>Fecha y hora<input name="date" type="datetime-local" required value="${localInputDate()}"></label><label>Duración (min)<input name="duration" type="number" min="1" value="10" required></label></div><label>Volumen estimado (litros)<input name="volume" type="number" min="0.1" step="0.1" value="8" required></label><label>Observaciones<textarea name="notes" rows="3" placeholder="Ej.: Riego manual con regadera"></textarea></label><div class="notice">${icon('info',18)}<span><strong>Registro informativo</strong> Esta acción no activa bombas ni electroválvulas.</span></div><button class="btn primary" type="submit">${icon('drop',17)} Guardar registro</button></form></section><section class="panel table-panel"><div class="section-title"><div><h2>Últimos riegos</h2><p>Historial de intervenciones registradas</p></div></div><div class="table-scroll"><table><thead><tr><th>Sector</th><th>Fecha</th><th>Duración</th><th>Volumen</th></tr></thead><tbody id="irrigation-list">${irrigationRows()}</tbody></table></div></section></div>`;
}
function localInputDate(){const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,16)}
function irrigationRows(){const defaults=[{sector:'Cantero 1 · Aromáticas',date:'01/09 · 18:20',duration:12,volume:'9,5'},{sector:'Cantero 3 · Raíces',date:'31/08 · 17:45',duration:15,volume:'12,0'},{sector:'Cantero 4 · Legumbres',date:'30/08 · 18:10',duration:10,volume:'8,0'}];return [...state.irrigation,...defaults].map(r=>`<tr><td><strong>${r.sector}</strong></td><td>${r.date}</td><td>${r.duration} min</td><td>${r.volume} L</td></tr>`).join('')}

function renderDevices(){
  const devices=[
    ['ESP32-C01','Cantero 1 · Aromáticas','Humedad de suelo',true,'hace 1 min','Batería · 84 %','-48 dBm'],
    ['ESP32-C02','Cantero 2 · Hojas','Humedad de suelo',!state.bedOffline,state.bedOffline?'sin contacto':'hace 2 min','Batería · 71 %',state.bedOffline?'—':'-56 dBm'],
    ['ESP32-C03','Cantero 3 · Raíces','Humedad de suelo',true,'hace 1 min','Batería · 79 %','-51 dBm'],
    ['ESP32-C04','Cantero 4 · Legumbres','Humedad de suelo',true,'hace 3 min','Batería · 88 %','-45 dBm'],
    ['ESP32-AMB','Estación ambiental','Temperatura y H. relativa',true,'hace 1 min','Fuente 5 V','-42 dBm'],
    ['ESP32-PLU','Pluviómetro','Precipitación',true,'hace 2 min','Batería · 93 %','-61 dBm']];
  return `<section class="panel devices-panel"><div class="section-title"><div><h2>Nodos y telemetría</h2><p>Topología simulada · Wi-Fi 2,4 GHz · MQTT/TLS conceptual</p></div><button class="btn ${state.bedOffline?'primary':'danger-outline'}" id="toggle-node">${icon(state.bedOffline?'refresh':'wifi',17)} ${state.bedOffline?'Reconectar nodo C02':'Interrumpir nodo C02'}</button></div><div class="table-scroll"><table class="devices"><thead><tr><th>Dispositivo / ubicación</th><th>Variable medida</th><th>Estado</th><th>Último contacto</th><th>Alimentación</th><th>Señal Wi-Fi</th></tr></thead><tbody>${devices.map(d=>`<tr class="${!d[3]?'offline':''}"><td><span class="device-icon">${icon('cpu',18)}</span><strong>${d[0]}</strong><small>${d[1]}</small></td><td>${d[2]}</td><td><span class="status-pill ${d[3]?'online':'danger'}">${d[3]?'En línea':'Sin conexión'}</span></td><td>${d[4]}</td><td>${d[5]}</td><td>${icon('wifi',16)} ${d[6]}</td></tr>`).join('')}</tbody></table></div><div class="devices-note">${icon('info',17)} Esta vista representa la arquitectura prevista. No existe conexión con equipos, broker ni sensores reales.</div></section>`;
}

function bindGlobal(){
  document.querySelector('#refresh').onclick=()=>updateData(true);
  document.querySelector('#theme-toggle').onclick=()=>{theme=theme==='dark'?'light':'dark';localStorage.setItem('huerta-theme',theme);applyTheme();layout()};
  document.querySelector('#menu').onclick=()=>document.querySelector('#sidebar').classList.toggle('open');
  document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>document.querySelector('#sidebar').classList.remove('open'));
}
function bindPage(page){
  if(page==='resumen'){document.querySelector('#auto').onchange=e=>{state.auto=e.target.checked; toggleAuto(); showToast(state.auto?'Simulación automática activada':'Simulación automática pausada','success')}}
  if(page==='historial'){
    document.querySelector('#bed-filter').onchange=e=>{state.selectedBed=+e.target.value;layout()};
    document.querySelector('#period').onchange=e=>{state.period=+e.target.value;layout()};
    requestAnimationFrame(drawChart);
  }
  if(page==='riegos') document.querySelector('#irrigation-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const date=new Date(f.get('date'));state.irrigation.unshift({sector:f.get('sector'),date:date.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'})+' · '+formatTime(date),duration:f.get('duration'),volume:(+f.get('volume')).toFixed(1).replace('.',',')});document.querySelector('#irrigation-list').innerHTML=irrigationRows();showToast('Riego registrado correctamente','success');e.target.reset();e.target.date.value=localInputDate()};
  if(page==='dispositivos') document.querySelector('#toggle-node').onclick=()=>{state.bedOffline=!state.bedOffline;layout();setTimeout(()=>showToast(state.bedOffline?'Nodo C02 interrumpido en la simulación':'Nodo C02 reconectado correctamente',state.bedOffline?'warning':'success'),20)};
}
function updateData(manual=false){state.temp=Math.max(20,Math.min(29,state.temp+(Math.random()-.5)*.8));state.humidity=Math.max(50,Math.min(75,state.humidity+(Math.random()-.5)*3));beds.forEach((b,i)=>b.value=Math.max(20,Math.min(75,b.value+(i===1?Math.random()*2-.5:(Math.random()-.45)*2))));state.updated=new Date();layout();if(manual)setTimeout(()=>showToast('Datos simulados actualizados','success'),20)}
function toggleAuto(){clearInterval(autoTimer);if(state.auto)autoTimer=setInterval(()=>updateData(),10000)}
function showToast(message,type){const t=document.querySelector('#toast');if(!t)return;t.className=`toast show ${type}`;t.innerHTML=`<span>${type==='warning'?'!':'✓'}</span>${message}`;setTimeout(()=>t.classList.remove('show'),3000)}

function drawChart(){
  const canvas=document.querySelector('#chart'); if(!canvas)return; const rect=canvas.parentElement.getBoundingClientRect(); const dpr=devicePixelRatio||1;canvas.width=rect.width*dpr;canvas.height=340*dpr;canvas.style.height='340px';const c=canvas.getContext('2d');c.scale(dpr,dpr);const w=rect.width,h=340,p={l:48,r:40,t:25,b:42};const n=state.period===24?13:15;const min=beds[state.selectedBed].min;const moisture=Array.from({length:n},(_,i)=>Math.max(20,Math.min(70,beds[state.selectedBed].value+Math.sin(i*.8)*5+(i-n+1)*.35)));const rain=Array.from({length:n},(_,i)=>(i===5||i===6?1.2+i%2*1.8:i===10?.8:0));
  const styles=getComputedStyle(document.documentElement);const chartGrid=styles.getPropertyValue('--chart-grid').trim();const chartText=styles.getPropertyValue('--chart-text').trim();
  c.fillStyle=styles.getPropertyValue('--surface').trim();c.fillRect(0,0,w,h);c.font='12px Inter, sans-serif';c.strokeStyle=chartGrid;c.fillStyle=chartText;c.lineWidth=1;for(let v=20;v<=80;v+=15){const y=p.t+(80-v)/60*(h-p.t-p.b);c.beginPath();c.moveTo(p.l,y);c.lineTo(w-p.r,y);c.stroke();c.fillText(v+'%',8,y+4)}
  const x=i=>p.l+i/(n-1)*(w-p.l-p.r), y=v=>p.t+(80-v)/60*(h-p.t-p.b);const threshold=y(min);c.setLineDash([6,5]);c.strokeStyle='#d39b2b';c.beginPath();c.moveTo(p.l,threshold);c.lineTo(w-p.r,threshold);c.stroke();c.setLineDash([]);
  const grad=c.createLinearGradient(0,p.t,0,h-p.b);grad.addColorStop(0,'rgba(42,122,91,.23)');grad.addColorStop(1,'rgba(42,122,91,0)');c.beginPath();moisture.forEach((v,i)=>i?c.lineTo(x(i),y(v)):c.moveTo(x(i),y(v)));c.lineTo(x(n-1),h-p.b);c.lineTo(x(0),h-p.b);c.closePath();c.fillStyle=grad;c.fill();c.beginPath();moisture.forEach((v,i)=>i?c.lineTo(x(i),y(v)):c.moveTo(x(i),y(v)));c.strokeStyle='#237454';c.lineWidth=2.5;c.stroke();
  const maxRain=4;c.beginPath();rain.forEach((v,i)=>{const yy=h-p.b-v/maxRain*100;i?c.lineTo(x(i),yy):c.moveTo(x(i),yy)});c.strokeStyle='#43a2c2';c.lineWidth=2;c.stroke();
  c.fillStyle=chartText;const labels=state.period===24?['00 h','04 h','08 h','12 h','16 h','20 h','Ahora']:['Hace 7 d','Hace 6 d','Hace 5 d','Hace 4 d','Hace 3 d','Ayer','Hoy'];labels.forEach((l,i)=>c.fillText(l,p.l+i/(labels.length-1)*(w-p.l-p.r)-12,h-15));
}
themePreference.addEventListener('change',event=>{if(!localStorage.getItem('huerta-theme')){theme=event.matches?'dark':'light';applyTheme();layout()}});
window.addEventListener('hashchange',layout);window.addEventListener('resize',()=>activePage()==='historial'&&drawChart());layout();
