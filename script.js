
const VIEW_ONLY_MODE = true;
window.addEventListener("DOMContentLoaded",()=>{
  ["metricsFile","trainingFile","sytFile","charterFile"].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.disabled=true;
  });
});

let metrics=[],leaders=[],syt=[],charters=[],metaDates=[],activeView="overview",selectedUnit="";
const $=id=>document.getElementById(id);
const yes=v=>String(v||"").trim().toUpperCase()==="YES";
const num=v=>{let n=Number(String(v??"").replace(/[,% ]/g,""));return Number.isFinite(n)?n:null};
const clean=v=>String(v||"").trim();

function csvParse(t){
 let o=[],r=[],f="",q=false;
 for(let i=0;i<t.length;i++){let c=t[i],n=t[i+1];
  if(q){if(c=='"'&&n=='"'){f+='"';i++}else if(c=='"')q=false;else f+=c}
  else{if(c=='"')q=true;else if(c==","){r.push(f);f=""}else if(c=="\n"){r.push(f.replace(/\r$/,""));o.push(r);r=[];f=""}else f+=c}}
 if(f||r.length){r.push(f);o.push(r)}return o
}
function parseReport(text,signature){
 let lines=text.replace(/^\uFEFF/,"").split(/\r?\n/),meta={};
 for(let l of lines){if(l.startsWith("Date Report Generated:"))meta.date=l.slice(22).trim()}
 let i=lines.findIndex(l=>l.includes(signature));if(i<0)throw Error("This is not the expected Commissioner Tools report.");
 let data=lines.slice(i).join("\n").replace(/^\.\.(?=[A-Za-z])/,""),m=csvParse(data),h=m[0].map(x=>x.trim()),
 rows=m.slice(1).filter(r=>r.some(v=>clean(v))).map(r=>{let o={};h.forEach((x,j)=>o[x]=r[j]??"");return o});
 return{meta,rows}
}
function parseDate(v){if(!v)return null;let m=String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/),d=m?new Date(+m[3],+m[1]-1,+m[2]):new Date(v);return isNaN(d)?null:d}
function dayDelta(v){let d=parseDate(v);if(!d)return null;let n=new Date();n.setHours(0,0,0,0);d.setHours(0,0,0,0);return Math.ceil((d-n)/86400000)}
function daysSince(v){let x=dayDelta(v);return x===null?null:Math.max(0,-x)}
function key(type,number){let n=clean(number).replace(/^0+/,"")||"0";return `${clean(type).toLowerCase()}-${n}`}
function keyFromUnitLabel(v){let m=clean(v).match(/^(Pack|Troop|Crew|Ship)\s+0*(\d+)$/i);return m?key(m[1],m[2]):""}
function labelFromKey(k){let u=unitCatalog().find(x=>x.key===k);return u?u.label:k}

function normMetric(r){
 let u={key:key(r.Unit_Type,r.Unit_Number),type:r.Unit_Type,number:r.Unit_Number,charter:r.Chartered_Organization,score:num(r.Metric_Summary__the_number_of_metrics_met_)??0,cur:num(r.Total_Youth__current_)??0,prev:num(r.Total_Youth__prev__year_)??0,delta:num(r.YOY_Members____)??0,ret:num(r.Retention____),last:r.Last_Connection_Date,days:daysSince(r.Last_Connection_Date),comms:r.Assigned_Commissioners||""};
 let h=u.score>=4?"Green":u.score>=2?"Yellow":"Red";if(u.days===null||u.days>180)h="Red";else if(u.days>90&&h==="Green")h="Yellow";u.health=h;return u
}
function normLeader(r){return{key:keyFromUnitLabel(r.Unit),unit:r.Unit,first:r.First_Name,last:r.Last_Name,member:r.MemberID,position:r.Position,direct:r.Direct_Contact_Leader,trained:r.Trained,expires:r.Registration_Expiration_Date,mandatory:r.Incomplete_Mandatory,classroom:r.Incomplete_Classroom,online:r.Incomplete_Online,program:r.Program}}
function normSyt(r){return{key:key(r.unittype,r.unitnumber),type:r.unittype,number:r.unitnumber,first:r.firstname,last:r.lastname,member:r.memberid,position:r.positionname,current:r.isyptcurrent2,expires:r.yptexpirationdatec,daysRemaining:dayDelta(r.yptexpirationdatec),regExpires:r.cregistrationexpirydate}}
function normCharter(r){return{key:key(r.Unit,r.Unit_Number),type:r.Unit,number:r.Unit_Number,charter:r.Current_Chartered_Org,status:r.Renewal_Status,newStatus:r.New_Separated_Rechartered,expiry:r.Current_Expiry_Date,daysRemaining:dayDelta(r.Current_Expiry_Date),youth:num(r.Total_Youth)??0,adults:num(r.Total_Adults)??0,lastModified:r.Last_Modified}}

$("metricsFile").onchange=async e=>loadFile(e,"metrics");
$("trainingFile").onchange=async e=>loadFile(e,"training");
$("sytFile").onchange=async e=>loadFile(e,"syt");
$("charterFile").onchange=async e=>loadFile(e,"charter");
async function loadFile(e,type){
 let f=e.target.files[0];if(!f)return;
 try{
  let text=await f.text(),p;
  if(type==="metrics"){p=parseReport(text,"Council_Name,District_Name");metrics=p.rows.map(normMetric);$("metricsFileStatus").textContent=`${metrics.length} units`; $("metricsContent").hidden=false;$("metricsEmpty").hidden=true}
  if(type==="training"){p=parseReport(text,"Council,Service_Area,District,Sub_District,Unit");leaders=p.rows.map(normLeader);let staleTraining=[...new Set(leaders.filter(x=>x.key&&!activeUnitKeys().has(x.key)).map(x=>x.key))].length;
  $("trainingFileStatus").textContent=`${leaders.length} records${(metrics.length||charters.length)&&staleTraining?` • ${staleTraining} inactive units ignored`:""}`; $("trainingContent").hidden=false;$("trainingEmpty").hidden=true}
  if(type==="syt"){p=parseReport(text,"district,unittype,unitnumber");syt=p.rows.map(normSyt);let staleSyt=[...new Set(syt.filter(x=>x.key&&!activeUnitKeys().has(x.key)).map(x=>x.key))].length;
  $("sytFileStatus").textContent=`${syt.length} records${(metrics.length||charters.length)&&staleSyt?` • ${staleSyt} inactive units ignored`:""}`; $("sytContent").hidden=false;$("sytEmpty").hidden=true}
  if(type==="charter"){p=parseReport(text,"Service_Territory,Council,District,Unit_ID");charters=p.rows.map(normCharter);$("charterFileStatus").textContent=`${charters.length} units`; $("charterContent").hidden=false;$("charterEmpty").hidden=true}
  if(p.meta.date)metaDates.push(p.meta.date);refresh()
 }catch(err){alert(err.message)}
}

function unitCatalog(){
 // AUTHORITATIVE ACTIVE-UNIT ROSTER:
 // Only Unit Metrics and Charter Renewal may define active units.
 // Training and SYT enrich those units but never create additional dashboard units.
 let m=new Map();
 metrics.forEach(x=>m.set(x.key,{key:x.key,label:`${x.type} ${String(x.number).replace(/^0+/,"")}`,type:x.type,number:x.number,source:"metrics"}));
 charters.forEach(x=>{if(!m.has(x.key))m.set(x.key,{key:x.key,label:`${x.type} ${String(x.number).replace(/^0+/,"")}`,type:x.type,number:x.number,source:"charter"})});
 return [...m.values()].sort((a,b)=>a.type.localeCompare(b.type)||Number(a.number)-Number(b.number))
}
function activeUnitKeys(){return new Set(unitCatalog().map(x=>x.key))}
function activeOnly(arr){
 // Once either authoritative report is loaded, suppress training/SYT rows
 // for units that are no longer on the active roster.
 if(!metrics.length && !charters.length)return arr;
 let keys=activeUnitKeys();
 return arr.filter(x=>!x.key || keys.has(x.key))
}
function populateUnitSelector(){
 let sel=$("globalUnitSelect"),current=selectedUnit;
 sel.innerHTML='<option value="">All Units</option>'+unitCatalog().map(u=>`<option value="${u.key}">${esc(u.label)}</option>`).join("");
 if(unitCatalog().some(x=>x.key===current))sel.value=current;else{selectedUnit="";sel.value=""}
 updateUnitIndicator()
}
$("globalUnitSelect").onchange=e=>{selectedUnit=e.target.value;updateUnitIndicator();renderAll()};
function updateUnitIndicator(){$("unitIndicator").textContent=selectedUnit?labelFromKey(selectedUnit):"All Units"}

function scope(arr){
 let filtered=activeOnly(arr);
 return selectedUnit?filtered.filter(x=>x.key===selectedUnit):filtered
}
function rate(a,fn){return a.length?Math.round(a.filter(fn).length/a.length*100):0}
function uniqPeople(a){return new Set(a.map(x=>x.member).filter(Boolean)).size}
function bar(label,n,total,cls=""){let p=total?Math.round(n/total*100):0;return `<div class="barrow"><span>${label}</span><div class="track"><div class="fill ${cls}" style="width:${p}%"></div></div><b>${p}%</b></div>`}
function priority(label,value){return `<div class="priority"><b>${label}</b><span>${value}</span></div>`}

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showView(b.dataset.view));
function showView(v){
 activeView=v;document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.view===v));
 ["overview","metrics","training","syt","charter"].forEach(x=>$(x+"View").hidden=x!==v);
 let t={overview:["Combined Dashboard","District Overview"],metrics:["Unit Metrics Snapshot","Unit Metrics"],training:["Trained Leaders Status","Leader Training"],syt:["Safeguarding Youth Training","Safeguarding Youth"],charter:["Unit Renewal Status","Charter Renewal"]};
 $("viewEyebrow").textContent=t[v][0];$("viewTitle").textContent=t[v][1];updateEmpty()
}
function updateEmpty(){
 let any=metrics.length||leaders.length||syt.length||charters.length;$("emptyState").hidden=!!any;
 if(!any)["overviewView","metricsView","trainingView","sytView","charterView"].forEach(x=>$(x).hidden=true)
}
function updateSourceStatus(){
 if(leaders.length){
  let stale=[...new Set(leaders.filter(x=>x.key&&!activeUnitKeys().has(x.key)).map(x=>x.key))].length;
  $("trainingFileStatus").textContent=`${leaders.length} records${(metrics.length||charters.length)&&stale?` • ${stale} inactive units ignored`:""}`
 }
 if(syt.length){
  let stale=[...new Set(syt.filter(x=>x.key&&!activeUnitKeys().has(x.key)).map(x=>x.key))].length;
  $("sytFileStatus").textContent=`${syt.length} records${(metrics.length||charters.length)&&stale?` • ${stale} inactive units ignored`:""}`
 }
}
function refresh(){
 populateUnitSelector();updateSourceStatus();updateEmpty();if(metrics.length||leaders.length||syt.length||charters.length){showView(activeView);$("metaDate").textContent=metaDates.length?`Latest report: ${metaDates[metaDates.length-1]}`:"";renderAll()}
}
function renderAll(){renderOverview();renderMetrics();renderTraining();renderSyt();renderCharter()}

function trainingUnitSummary(){
 let m=new Map();activeOnly(leaders).filter(x=>x.key).forEach(x=>{if(!m.has(x.key))m.set(x.key,{direct:0,trained:0,total:0});let z=m.get(x.key);z.total++;if(yes(x.direct)){z.direct++;if(yes(x.trained))z.trained++}});return m
}
function sytUnitSummary(){
 let m=new Map();activeOnly(syt).filter(x=>x.key&&x.type).forEach(x=>{if(!m.has(x.key))m.set(x.key,{total:0,current:0,expiring30:0});let z=m.get(x.key);z.total++;if(yes(x.current))z.current++;if(x.daysRemaining!==null&&x.daysRemaining>=0&&x.daysRemaining<=30)z.expiring30++});return m
}
function charterMap(){let m=new Map();charters.forEach(x=>m.set(x.key,x));return m}

function renderOverview(){
 let ms=scope(metrics),ls=scope(leaders.filter(x=>x.key)),ss=scope(syt.filter(x=>x.key&&x.type)),cs=scope(charters),units=selectedUnit?(unitCatalog().filter(x=>x.key===selectedUnit)):unitCatalog();
 let direct=ls.filter(x=>yes(x.direct));
 $("ovUnits").textContent=units.length;$("ovYouth").textContent=ms.reduce((a,x)=>a+x.cur,0);
 $("ovGreen").textContent=ms.length?rate(ms,x=>x.health==="Green")+"%":"—";
 $("ovTraining").textContent=direct.length?rate(direct,x=>yes(x.trained))+"%":"—";
 $("ovSyt").textContent=ss.length?rate(ss,x=>yes(x.current))+"%":"—";
 $("ovRenewal").textContent=cs.length?rate(cs,x=>clean(x.status).toLowerCase()==="posted"||x.daysRemaining===null||x.daysRemaining>90)+"%":"—";
 let bars=[];
 if(ms.length)bars.push(bar("Green Unit Health",ms.filter(x=>x.health==="Green").length,ms.length,"Green"));
 if(direct.length)bars.push(bar("Direct Leaders Trained",direct.filter(x=>yes(x.trained)).length,direct.length));
 if(ss.length)bars.push(bar("SYT Current",ss.filter(x=>yes(x.current)).length,ss.length));
 if(cs.length)bars.push(bar("Renewal Posted",cs.filter(x=>clean(x.status).toLowerCase()==="posted").length,cs.length));
 $("overviewBars").innerHTML=bars.join("")||'<div class="sub">Load reports to populate combined indicators.</div>';
 let p=[];
 if(ms.length){p.push(["Red unit health",ms.filter(x=>x.health==="Red").length],["Contact > 90 days",ms.filter(x=>x.days===null||x.days>90).length])}
 if(direct.length)p.push(["Untrained direct-contact positions",direct.filter(x=>!yes(x.trained)).length]);
 if(ss.length)p.push(["SYT expired / not current",ss.filter(x=>!yes(x.current)||x.daysRemaining<0).length]);
 if(cs.length)p.push(["Renewals not posted",cs.filter(x=>clean(x.status).toLowerCase()!=="posted"&&!clean(x.newStatus).toLowerCase().includes("new")).length]);
 $("overviewPriorities").innerHTML=p.map(x=>priority(x[0],x[1])).join("")||priority("No report data","—");
 let tmap=trainingUnitSummary(),smap=sytUnitSummary(),cmap=charterMap(),mm=new Map(metrics.map(x=>[x.key,x]));
 $("overviewRows").innerHTML=units.map(u=>{let m=mm.get(u.key),t=tmap.get(u.key),s=smap.get(u.key),c=cmap.get(u.key);let tp=t&&t.direct?Math.round(t.trained/t.direct*100):null,sp=s&&s.total?Math.round(s.current/s.total*100):null;return `<tr><td><div class="unitname">${esc(u.label)}</div></td><td>${m?`<span class="pill"><i class="dot ${m.health}"></i>${m.health}</span>`:"—"}</td><td>${m?m.score+"/5":"—"}</td><td>${m?m.cur:"—"}</td><td class="${tp===100?"yes":tp===null?"":"no"}">${tp===null?"—":`${t.trained}/${t.direct} (${tp}%)`}</td><td class="${sp===100?"yes":sp===null?"":"warn"}">${sp===null?"—":sp+"%"}</td><td>${c?esc(c.status||c.newStatus||"Not posted"):"—"}</td><td>${m?esc(m.last||"None"):"—"}</td></tr>`}).join("")
}

function renderMetrics(){
 if(!metrics.length)return;let a=scope(metrics),h=$("metricHealth").value,q=$("metricSearch").value.toLowerCase();
 let greenCount=a.filter(x=>x.health==="Green").length,
     yellowCount=a.filter(x=>x.health==="Yellow").length,
     redCount=a.filter(x=>x.health==="Red").length;
 $("mUnits").textContent=a.length;
 $("mGreen").textContent=`${greenCount} (${a.length?Math.round(greenCount/a.length*100):0}%)`;
 $("mYellow").textContent=`${yellowCount} (${a.length?Math.round(yellowCount/a.length*100):0}%)`;
 $("mRed").textContent=`${redCount} (${a.length?Math.round(redCount/a.length*100):0}%)`;
 $("mStale").textContent=a.filter(x=>x.days===null||x.days>90).length;
 $("mDecline").textContent=a.filter(x=>x.delta<0).length;
 a=a.filter(x=>(!h||x.health===h)&&(!q||`${x.type} ${x.number} ${x.charter} ${x.comms}`.toLowerCase().includes(q)));
 $("metricRows").innerHTML=a.sort((x,y)=>({Red:0,Yellow:1,Green:2}[x.health]-({Red:0,Yellow:1,Green:2}[y.health]))).map(x=>`<tr><td><span class="pill"><i class="dot ${x.health}"></i>${x.health}</span></td><td><div class="unitname">${esc(x.type)} ${esc(String(x.number).replace(/^0+/,""))}</div><div class="sub">${esc(x.charter)}</div></td><td>${x.score}/5</td><td>${x.cur}<div class="sub">prev ${x.prev}</div></td><td class="${x.delta>0?"up":x.delta<0?"down":""}">${x.delta>0?"+":""}${x.delta}</td><td>${x.ret===null?"—":x.ret+"%"}</td><td>${esc(x.last||"None")}<div class="sub">${x.days===null?"No date":x.days+" days ago"}</div></td><td>${esc(x.comms)}</td></tr>`).join("")
}
$("metricHealth").onchange=renderMetrics;$("metricSearch").oninput=renderMetrics;

function renderTraining(){
 if(!leaders.length)return;let a=scope(leaders.filter(x=>x.key)),direct=a.filter(x=>yes(x.direct));
 $("tPeople").textContent=uniqPeople(a);$("tPositions").textContent=a.length;$("tTrained").textContent=a.length?rate(a,x=>yes(x.trained))+"%":"—";$("tDirect").textContent=direct.length;$("tDirectPct").textContent=direct.length?rate(direct,x=>yes(x.trained))+"%":"—";$("tUntrainedDirect").textContent=direct.filter(x=>!yes(x.trained)).length;
 let programs=[...new Set(direct.map(x=>x.program).filter(Boolean))];$("trainingBars").innerHTML=programs.map(p=>{let z=direct.filter(x=>x.program===p);return bar(p,z.filter(x=>yes(x.trained)).length,z.length)}).join("")||'<div class="sub">No direct-contact records in this unit selection.</div>';
 let by=new Map();a.forEach(x=>{if(!by.has(x.key))by.set(x.key,{label:labelFromKey(x.key),d:0,t:0});let z=by.get(x.key);if(yes(x.direct)){z.d++;if(yes(x.trained))z.t++}});
 let gaps=[...by.values()].filter(x=>x.d&&x.t<x.d).sort((x,y)=>(x.t/x.d)-(y.t/y.d));$("trainingPriorities").innerHTML=gaps.length?gaps.slice(0,10).map(x=>priority(x.label,`${x.t}/${x.d} trained`)).join(""):priority("No direct-contact training gaps","—");
 renderTrainingRows()
}
function renderTrainingRows(){
 let mode=$("trainingFilter").value,q=$("trainingSearch").value.toLowerCase(),a=scope(leaders.filter(x=>x.key));
 if(mode==="direct")a=a.filter(x=>yes(x.direct));
 if(mode==="untrained-direct")a=a.filter(x=>yes(x.direct)&&!yes(x.trained));
 if(mode==="untrained-all")a=a.filter(x=>!yes(x.trained));
 if(q)a=a.filter(x=>`${x.unit} ${x.first} ${x.last} ${x.position}`.toLowerCase().includes(q));
 $("trainingRows").innerHTML=a.map(x=>`<tr><td>${esc(x.unit)}</td><td>${esc(x.first+" "+x.last)}</td><td>${esc(x.position)}</td><td class="${yes(x.direct)?"yes":""}">${yes(x.direct)?"Yes":"No"}</td><td class="${yes(x.trained)?"yes":"no"}">${yes(x.trained)?"Trained":"Not Trained"}</td><td>${esc(x.expires)}</td><td>${esc([x.mandatory,x.classroom,x.online].filter(Boolean).join(" • ")||"—")}</td></tr>`).join("")
}
$("trainingFilter").onchange=renderTrainingRows;$("trainingSearch").oninput=renderTrainingRows;
$("untrainedDirectBtn").onclick=()=>{$("trainingFilter").value="untrained-direct";$("untrainedDirectBtn").classList.add("active");renderTrainingRows()};

function renderSyt(){
 if(!syt.length)return;let base=scope(syt.filter(x=>selectedUnit?x.key===selectedUnit:true)),people=new Set(base.map(x=>x.member).filter(Boolean)),unitAssigned=base.filter(x=>x.type&&x.number);
 $("sPeople").textContent=people.size;$("sCurrent").textContent=base.length?rate(base,x=>yes(x.current))+"%":"—";$("s90").textContent=base.filter(x=>x.daysRemaining!==null&&x.daysRemaining>=0&&x.daysRemaining<=90).length;$("s30").textContent=base.filter(x=>x.daysRemaining!==null&&x.daysRemaining>=0&&x.daysRemaining<=30).length;$("sExpired").textContent=base.filter(x=>!yes(x.current)||x.daysRemaining<0).length;$("sUnitPeople").textContent=unitAssigned.length;
 let mode=$("sytFilter").value,q=$("sytSearch").value.toLowerCase(),a=base;
 if(mode==="expired")a=a.filter(x=>!yes(x.current)||x.daysRemaining<0);
 if(mode==="30")a=a.filter(x=>x.daysRemaining!==null&&x.daysRemaining>=0&&x.daysRemaining<=30);
 if(mode==="90")a=a.filter(x=>x.daysRemaining!==null&&x.daysRemaining>=0&&x.daysRemaining<=90);
 if(mode==="current")a=a.filter(x=>yes(x.current));
 if(q)a=a.filter(x=>`${x.type} ${x.number} ${x.first} ${x.last} ${x.position}`.toLowerCase().includes(q));
 $("sytRows").innerHTML=a.map(x=>`<tr><td>${x.type&&x.number?esc(`${x.type} ${String(x.number).replace(/^0+/,"")}`):'<span class="sub">District / non-unit</span>'}</td><td>${esc(x.first+" "+x.last)}</td><td>${esc(x.position)}</td><td class="${yes(x.current)?"yes":"no"}">${yes(x.current)?"Current":"Not Current"}</td><td>${esc(x.expires)}</td><td class="${x.daysRemaining!==null&&x.daysRemaining<=30?"no":x.daysRemaining!==null&&x.daysRemaining<=90?"warn":""}">${x.daysRemaining===null?"—":x.daysRemaining}</td><td>${esc(x.regExpires)}</td></tr>`).join("")
}
$("sytFilter").onchange=renderSyt;$("sytSearch").oninput=renderSyt;

function renderCharter(){
 if(!charters.length)return;let base=scope(charters);
 $("cUnits").textContent=base.length;$("cPosted").textContent=base.filter(x=>clean(x.status).toLowerCase()==="posted").length;$("cPending").textContent=base.filter(x=>clean(x.status).toLowerCase()!=="posted"&&!clean(x.newStatus).toLowerCase().includes("new")).length;$("cNew").textContent=base.filter(x=>clean(x.newStatus).toLowerCase().includes("new")).length;$("c90").textContent=base.filter(x=>x.daysRemaining!==null&&x.daysRemaining>=0&&x.daysRemaining<=90).length;$("c30").textContent=base.filter(x=>x.daysRemaining!==null&&x.daysRemaining>=0&&x.daysRemaining<=30).length;
 let mode=$("charterFilter").value,q=$("charterSearch").value.toLowerCase(),a=base;
 if(mode==="Posted")a=a.filter(x=>clean(x.status).toLowerCase()==="posted");
 if(mode==="pending")a=a.filter(x=>clean(x.status).toLowerCase()!=="posted"&&!clean(x.newStatus).toLowerCase().includes("new"));
 if(mode==="new")a=a.filter(x=>clean(x.newStatus).toLowerCase().includes("new"));
 if(q)a=a.filter(x=>`${x.type} ${x.number} ${x.charter}`.toLowerCase().includes(q));
 $("charterRows").innerHTML=a.sort((x,y)=>(x.daysRemaining??9999)-(y.daysRemaining??9999)).map(x=>`<tr><td><div class="unitname">${esc(x.type)} ${esc(String(x.number).replace(/^0+/,""))}</div></td><td>${esc(x.charter)}</td><td>${esc(x.status||x.newStatus||"Not posted")}</td><td>${esc(x.expiry)}</td><td class="${x.daysRemaining!==null&&x.daysRemaining<=30?"no":x.daysRemaining!==null&&x.daysRemaining<=90?"warn":""}">${x.daysRemaining===null?"—":x.daysRemaining}</td><td>${x.youth}</td><td>${x.adults}</td><td>${esc(x.lastModified)}</td></tr>`).join("")
}
$("charterFilter").onchange=renderCharter;$("charterSearch").oninput=renderCharter;

function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
showView("overview");




function markViewerSourcesLoaded(){
  if(metrics.length){
    if($("metricsContent"))$("metricsContent").hidden=false;
    if($("metricsEmpty"))$("metricsEmpty").hidden=true;
    if($("metricsFileStatus"))$("metricsFileStatus").textContent=`${metrics.length} published units`;
  }
  if(viewerTrainingRows.length){
    if($("trainingContent"))$("trainingContent").hidden=false;
    if($("trainingEmpty"))$("trainingEmpty").hidden=true;
    if($("trainingFileStatus"))$("trainingFileStatus").textContent=`${viewerTrainingRows.length} published training summaries`;
  }
  if(viewerSytRows.length){
    if($("sytContent"))$("sytContent").hidden=false;
    if($("sytEmpty"))$("sytEmpty").hidden=true;
    if($("sytFileStatus"))$("sytFileStatus").textContent=`${viewerSytRows.length} published SYT summaries`;
  }
  if(charters.length){
    if($("charterContent"))$("charterContent").hidden=false;
    if($("charterEmpty"))$("charterEmpty").hidden=true;
    if($("charterFileStatus"))$("charterFileStatus").textContent=`${charters.length} published units`;
  }
}

// ---------- Sanitized Viewer Data Loader ----------
let viewerTrainingRows=[];
let viewerSytRows=[];

if(typeof PUBLIC_DASHBOARD_DATA!=="undefined"){
  try{
    if(PUBLIC_DASHBOARD_DATA.metrics) metrics=PUBLIC_DASHBOARD_DATA.metrics.map(normMetric);

    viewerTrainingRows=(PUBLIC_DASHBOARD_DATA.training||[]).map(r=>({
      key:keyFromUnitLabel(r.Unit),
      unit:r.Unit,
      position:r.Position||"Unit Position",
      direct:r.Direct_Contact_Leader,
      trained:r.Trained,
      count:Number(r.Count||0)
    }));

    viewerSytRows=(PUBLIC_DASHBOARD_DATA.syt||[]).map(r=>({
      key:key(r.unittype,r.unitnumber),
      type:r.unittype,
      number:r.unitnumber,
      status:r.Status||"Current",
      count:Number(r.Count||0)
    }));

    // Build anonymous synthetic records only for shared KPI logic.
    leaders=[];
    viewerTrainingRows.forEach(r=>{
      for(let i=0;i<r.count;i++) leaders.push({
        key:r.key,unit:r.unit,first:"",last:"",member:"",
        position:r.position,direct:r.direct,trained:r.trained,
        expires:"",mandatory:"",classroom:"",online:"",program:""
      });
    });

    syt=[];
    viewerSytRows.forEach(r=>{
      for(let i=0;i<r.count;i++) syt.push({
        key:r.key,type:r.type,number:r.number,first:"",last:"",member:"",
        position:"Registered Adult",
        current:r.status==="Expired / Not Current"?"NO":"YES",
        expires:"",daysRemaining:
          r.status==="Expired / Not Current"?-1:
          r.status==="Expires ≤ 30 Days"?30:
          r.status==="Expires ≤ 90 Days"?90:365,
        regExpires:""
      });
    });

    if(PUBLIC_DASHBOARD_DATA.charter) charters=PUBLIC_DASHBOARD_DATA.charter.map(normCharter);

    markViewerSourcesLoaded();
    refresh();

    // Override person-detail tables with sanitized unit-level category rows.
    renderViewerTrainingTable();
    renderViewerSytTable();
  }catch(e){console.error("Unable to load static viewer data",e)}
}

function renderViewerTrainingTable(){
  if(!viewerTrainingRows.length)return;
  let mode=$("trainingFilter").value,
      q=$("trainingSearch").value.toLowerCase(),
      rows=viewerTrainingRows.filter(r=>!selectedUnit||r.key===selectedUnit);

  if(mode==="direct")rows=rows.filter(r=>yes(r.direct));
  if(mode==="untrained-direct")rows=rows.filter(r=>yes(r.direct)&&!yes(r.trained));
  if(mode==="untrained-all")rows=rows.filter(r=>!yes(r.trained));
  if(q)rows=rows.filter(r=>`${r.unit} ${r.position}`.toLowerCase().includes(q));

  $("trainingRows").innerHTML=rows.map(r=>`<tr>
    <td>${esc(r.unit)}</td>
    <td>${esc(r.position)}</td>
    <td class="${yes(r.direct)?"yes":""}">${yes(r.direct)?"Yes":"No"}</td>
    <td class="${yes(r.trained)?"yes":"no"}">${yes(r.trained)?"Trained":"Not Trained"}</td>
    <td>${r.count}</td>
  </tr>`).join("");
}

function renderViewerSytTable(){
  if(!viewerSytRows.length)return;
  let mode=$("sytFilter").value,
      q=$("sytSearch").value.toLowerCase(),
      rows=viewerSytRows.filter(r=>!selectedUnit||r.key===selectedUnit);

  if(mode==="expired")rows=rows.filter(r=>r.status==="Expired / Not Current");
  if(mode==="30")rows=rows.filter(r=>r.status==="Expires ≤ 30 Days");
  if(mode==="90")rows=rows.filter(r=>r.status==="Expires ≤ 30 Days"||r.status==="Expires ≤ 90 Days");
  if(mode==="current")rows=rows.filter(r=>r.status!=="Expired / Not Current");
  if(q)rows=rows.filter(r=>`${r.type} ${r.number} ${r.status}`.toLowerCase().includes(q));

  $("sytRows").innerHTML=rows.map(r=>`<tr>
    <td>${esc(r.type)} ${esc(String(r.number).replace(/^0+/,""))}</td>
    <td class="${r.status==="Expired / Not Current"?"no":r.status.includes("30")?"no":r.status.includes("90")?"warn":"yes"}">${esc(r.status)}</td>
    <td>${r.count}</td>
  </tr>`).join("");
}

// Re-bind viewer filters to sanitized tables.
window.addEventListener("DOMContentLoaded",()=>{
  if($("trainingFilter"))$("trainingFilter").addEventListener("change",renderViewerTrainingTable);
  if($("trainingSearch"))$("trainingSearch").addEventListener("input",renderViewerTrainingTable);
  if($("untrainedDirectBtn"))$("untrainedDirectBtn").addEventListener("click",()=>{
    $("trainingFilter").value="untrained-direct";
    renderViewerTrainingTable();
  });
  if($("sytFilter"))$("sytFilter").addEventListener("change",renderViewerSytTable);
  if($("sytSearch"))$("sytSearch").addEventListener("input",renderViewerSytTable);
  if($("globalUnitSelect"))$("globalUnitSelect").addEventListener("change",()=>{
    renderViewerTrainingTable();
    renderViewerSytTable();
  });
});


// Keep sanitized Viewer category tables visible after any global/unit refresh.
const _viewerOriginalRenderAll = renderAll;
renderAll = function(){
  _viewerOriginalRenderAll();
  if(typeof renderViewerTrainingTable==="function") renderViewerTrainingTable();
  if(typeof renderViewerSytTable==="function") renderViewerSytTable();
  markViewerSourcesLoaded();
};
