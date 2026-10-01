const { createClient } = supabase;
const cfg = window.LMS_CONFIG || {};
const sb = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

let currentUser = null;
let profile = null;
let currentPage = "dashboard";
let currentExam = null;
let examAnswers = {};

const $ = (id) => document.getElementById(id);
const esc = (v="") => String(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function toast(msg, error=false){const t=$("toast");t.textContent=msg;t.className="toast show";t.style.background=error?"#8f1827":"#231616";setTimeout(()=>t.className="toast",3200)}
function avatar(url){return url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23eee5df'/%3E%3Ccircle cx='50' cy='38' r='20' fill='%235b101c'/%3E%3Cpath d='M15 96c5-25 65-25 70 0' fill='%235b101c'/%3E%3C/svg%3E"}
function showModal(html){$("modalBody").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden");$("modalBody").innerHTML=""}
$("modalClose").onclick=closeModal;$("modal").onclick=e=>{if(e.target===$("modal"))closeModal()};

document.querySelectorAll(".auth-tab").forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll(".auth-tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
 $("loginForm").classList.toggle("hidden",btn.dataset.auth!=="login");
 $("signupForm").classList.toggle("hidden",btn.dataset.auth!=="signup");
});
$("signupRole").onchange=()=> $("classWrap").style.display=$("signupRole").value==="teacher"?"none":"grid";

$("loginForm").onsubmit=async e=>{
 e.preventDefault();
 const {data,error}=await sb.auth.signInWithPassword({email:$("loginEmail").value.trim(),password:$("loginPassword").value});
 if(error) return toast(error.message,true);
 if(!data.user.email_confirmed_at) return toast("Please verify your email before logging in.",true);
 await boot();
};
$("signupForm").onsubmit=async e=>{
 e.preventDefault();
 const role=$("signupRole").value;
 const {data,error}=await sb.auth.signUp({
   email:$("signupEmail").value.trim(),password:$("signupPassword").value,
   options:{data:{first_name:$("signupFirst").value.trim(),last_name:$("signupLast").value.trim(),role,class:$("signupClass").value}}
 });
 if(error)return toast(error.message,true);
 toast("Account created. Check your email to verify your account.");
};
$("forgotBtn").onclick=async()=>{
 const email=prompt("Enter your account email:");
 if(!email)return;
 const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
 if(error)toast(error.message,true);else toast("Password reset instructions sent.");
};
$("logoutBtn").onclick=async()=>{await sb.auth.signOut();location.reload()};
$("refreshBtn").onclick=()=>renderPage(currentPage);
$("mobileMenu").onclick=()=>document.querySelector(".sidebar").classList.toggle("open");
$("profileBtn").onclick=()=>navigate("profile");

function navItems(){
 const base=[
  ["dashboard","⌂","Dashboard"],
  ["courses","▦","My Courses"],
  ["cbt","✓","CBT Centre"],
  ["profile","◉","My Profile"]
 ];
 if(profile?.role==="teacher")base.splice(2,0,["teacher","▣","Teacher Studio"]);
 if(profile?.role==="admin")base.splice(2,0,["admin","⚙","Admin Control"]);
 return base;
}
function renderNav(){
 $("sideNav").innerHTML=navItems().map(([id,icon,name])=>`<button class="nav-item ${currentPage===id?"active":""}" onclick="navigate('${id}')">${icon}<span>${name}</span></button>`).join("");
}
function navigate(page){currentPage=page;renderNav();$("mobileMenu")?.click();renderPage(page)}

async function getProfile(){
 const {data,error}=await sb.from("profiles").select("*").eq("id",currentUser.id).single();
 if(error)throw error;profile=data;
 $("topName").textContent=`${profile.first_name} ${profile.last_name}`;
 $("topAvatar").src=avatar(profile.avatar_url);
 renderNav();
}

async function boot(){
 const {data:{session}}=await sb.auth.getSession();
 if(!session){$("authView").classList.remove("hidden");$("appView").classList.add("hidden");return}
 currentUser=session.user;
 if(!currentUser.email_confirmed_at){await sb.auth.signOut();$("authView").classList.remove("hidden");return}
 try{await getProfile();$("authView").classList.add("hidden");$("appView").classList.remove("hidden");navigate("dashboard")}
 catch(e){toast("Unable to load your profile: "+e.message,true)}
}
sb.auth.onAuthStateChange((_event,session)=>{if(session&&!currentUser)boot()});

async function renderPage(page){
 $("content").innerHTML=`<div class="empty">Loading...</div>`;
 const titles={dashboard:["Dashboard","Your learning space"],courses:["My Courses","Explore your class subjects and lessons"],cbt:["CBT Centre","Practice and take secure computer-based tests"],teacher:["Teacher Studio","Create lessons, audio lectures and assignments"],admin:["Admin Control","Manage learners, teachers, CBT and school activity"],profile:["My Profile","Manage your account and profile picture"]};
 $("pageTitle").textContent=titles[page]?.[0]||"Dashboard";$("pageSub").textContent=titles[page]?.[1]||"";
 try{
  if(page==="dashboard")await dashboard();
  if(page==="courses")await courses();
  if(page==="cbt")await cbtCentre();
  if(page==="teacher")await teacherStudio();
  if(page==="admin")await adminPanel();
  if(page==="profile")await profilePage();
 }catch(e){$("content").innerHTML=`<div class="card"><strong>Something went wrong.</strong><p class="muted">${esc(e.message)}</p></div>`}
}

async function dashboard(){
 const [{data:subjects},{data:lessons},{data:attempts}]=await Promise.all([
  sb.from("subjects").select("*").eq("class",profile.class).order("name"),
  sb.from("lessons").select("id,title,subject_id").eq("published",true).limit(5),
  sb.from("exam_attempts").select("score,total,submitted_at,question_banks(name)").eq("student_id",currentUser.id).order("submitted_at",{ascending:false}).limit(5)
 ]);
 const name=esc(profile.first_name);
 $("content").innerHTML=`
 <div class="hero-banner"><div><span class="eyebrow">WELCOME BACK</span><h1>Keep moulding your future, ${name}.</h1><p>Your ${esc(profile.class||"school")} learning dashboard brings lessons, assignments and CBT practice into one place.</p></div><button class="btn btn-gold" onclick="navigate('courses')">Explore courses →</button></div>
 <div class="grid grid-4" style="margin-top:18px">
  <div class="card stat"><div class="icon">📚</div><strong>${subjects?.length||0}</strong><span>Subjects in ${esc(profile.class||"your class")}</span></div>
  <div class="card stat"><div class="icon">🎧</div><strong>${lessons?.length||0}</strong><span>Recent lessons</span></div>
  <div class="card stat"><div class="icon">🧠</div><strong>${attempts?.length||0}</strong><span>Recent CBT attempts</span></div>
  <div class="card stat"><div class="icon">🏆</div><strong>${attempts?.[0]?.score??0}</strong><span>Latest score</span></div>
 </div>
 <div class="page-head" style="margin-top:30px"><div><h1>Continue learning</h1><p>Pick a subject and start a lesson.</p></div><button class="btn btn-soft" onclick="navigate('courses')">View all</button></div>
 <div class="grid grid-3">${(subjects||[]).slice(0,6).map(s=>courseCard(s)).join("")||'<div class="empty">No subjects have been added for your class yet.</div>'}</div>`;
}
function courseCard(s){return `<div class="card course-card"><div class="course-cover">${esc(s.name)}</div><div class="course-body"><span class="tag">${esc(s.class)}</span><p style="font-size:12px;color:#6e6666">${esc(s.description||"Explore lessons and learning resources.")}</p><button class="btn btn-primary" onclick="openCourse('${s.id}')">Open course →</button></div></div>`}

async function courses(){
 const {data,error}=await sb.from("subjects").select("*").eq("class",profile.class).order("name");if(error)throw error;
 $("content").innerHTML=`<div class="page-head"><div><h1>Your subjects</h1><p>Curriculum learning for ${esc(profile.class||"your class")}.</p></div></div><div class="grid grid-3">${(data||[]).map(courseCard).join("")||'<div class="empty">No subjects available yet.</div>'}</div>`;
}
async function openCourse(id){
 const {data:s}=await sb.from("subjects").select("*").eq("id",id).single();
 const {data:lessons}=await sb.from("lessons").select("*").eq("subject_id",id).eq("published",true).order("created_at");
 $("pageTitle").textContent=s.name;$("pageSub").textContent=`${s.class} · Course`;
 $("content").innerHTML=`<div class="page-head"><div><span class="eyebrow">${esc(s.class)}</span><h1>${esc(s.name)}</h1><p>${esc(s.description||"")}</p></div><button class="btn btn-soft" onclick="navigate('courses')">← Courses</button></div>
 <div class="lesson-list">${(lessons||[]).map(l=>`<div class="lesson-row"><div><span class="tag">LESSON</span><h3>${esc(l.title)}</h3><p>${esc(l.summary||"Lesson resource")} · ${l.duration_minutes||30} min</p></div><div class="lesson-actions"><button class="btn btn-primary" onclick="openLesson('${l.id}')">Open</button>${l.notes_url?`<a class="btn btn-soft" target="_blank" href="${l.notes_url}">Notes</a>`:""}${l.audio_url?`<audio controls src="${l.audio_url}" style="height:34px;max-width:180px"></audio>`:""}</div></div>`).join("")||'<div class="empty">No lessons have been published for this subject yet.</div>'}</div>`;
}
async function openLesson(id){
 const {data:l}=await sb.from("lessons").select("*,subjects(name,class)").eq("id",id).single();
 const {data:comments}=await sb.from("comments").select("id,body,created_at,user_id").eq("lesson_id",id).order("created_at");
 const ids=[...new Set((comments||[]).map(c=>c.user_id))];let names={};
 if(ids.length){const {data:p}=await sb.from("profiles").select("id,first_name,last_name").in("id",ids);(p||[]).forEach(x=>names[x.id]=`${x.first_name} ${x.last_name}`)}
 showModal(`<span class="eyebrow">${esc(l.subjects?.class||"")}</span><h2>${esc(l.title)}</h2><p class="muted">${esc(l.summary||"")}</p><div class="lesson-content" style="line-height:1.8">${esc(l.content||"No lesson text has been added yet.").replace(/\n/g,"<br>")}</div>
 ${l.audio_url?`<audio controls src="${l.audio_url}" style="width:100%;margin:20px 0"></audio>`:""}
 <hr style="border:0;border-top:1px solid var(--line);margin:24px 0"><h3>Discussion</h3>
 <div>${(comments||[]).map(c=>`<div class="comment"><strong>${esc(names[c.user_id]||"Student")}</strong><p>${esc(c.body)}</p></div>`).join("")||'<p class="muted">Be the first to comment.</p>'}</div>
 <form id="commentForm" class="field"><label>Add a comment<textarea id="commentBody" rows="3" required placeholder="Ask a question or share your thought..."></textarea></label><button class="btn btn-primary" type="submit">Post comment</button></form>`);
 $("commentForm").onsubmit=async e=>{e.preventDefault();const {error}=await sb.from("comments").insert({lesson_id:id,user_id:currentUser.id,body:$("commentBody").value.trim()});if(error)toast(error.message,true);else{toast("Comment posted.");openLesson(id)}}
}

async function cbtCentre(){
 const {data:banks,error}=await sb.from("question_banks").select("*,subjects(name)").eq("class",profile.class).eq("active",true).order("created_at",{ascending:false});if(error)throw error;
 $("content").innerHTML=`<div class="hero-banner"><div><span class="eyebrow">CBT CENTRE</span><h1>Test your knowledge.</h1><p>Use a CBT access code supplied by the school administrator. Results are calculated immediately.</p></div><div style="font-size:50px">🧠</div></div>
 <div class="page-head" style="margin-top:28px"><div><h1>${esc(profile.class)} CBT</h1><p>Choose an available question bank.</p></div></div>
 <div class="grid grid-2">${(banks||[]).map(b=>`<div class="card"><span class="tag">${esc(b.exam_standard)}</span><h2>${esc(b.name)}</h2><p class="muted">${esc(b.subjects?.name||"Subject")} · ${b.question_count} questions · ${b.duration_minutes} minutes</p><button class="btn btn-primary" onclick="startCBT('${b.id}')">Start with access code →</button></div>`).join("")||'<div class="empty">No CBT question banks are active for your class yet.</div>'}</div>`;
}
async function startCBT(bankId){
 const code=prompt("Enter the CBT access code supplied by the school admin:");
 if(!code)return;
 const {data:use,error}=await sb.rpc("use_cbt_code",{p_code:code,p_bank_id:bankId});
 if(error||!use?.ok)return toast(error?.message||use?.message||"Invalid CBT code.",true);
 const {data:bank}=await sb.from("question_banks").select("*,subjects(name)").eq("id",bankId).single();
 const {data:q,error:qe}=await sb.from("questions").select("*").eq("bank_id",bankId).limit(50);
 if(qe||!q?.length)return toast("This question bank has no questions yet.",true);
 currentExam={bank,questions:q.slice(0,Math.min(50,q.length)),codeId:use.code_id,started:Date.now()};examAnswers={};
 renderQuestion(0);
}
function renderQuestion(index){
 const q=currentExam.questions[index];currentExam.index=index;
 $("pageTitle").textContent=currentExam.bank.name;$("pageSub").textContent=`Question ${index+1} of ${currentExam.questions.length}`;
 const option=(letter,text)=>`<label class="cbt-option"><input type="radio" name="answer" value="${letter}" ${examAnswers[q.id]===letter?"checked":""} onchange="examAnswers['${q.id}']=this.value"> <strong>${letter}.</strong> ${esc(text)}</label>`;
 $("content").innerHTML=`<div class="card"><div class="question-nav">${currentExam.questions.map((x,i)=>`<button class="qnum ${i===index?"active":""} ${examAnswers[x.id]?"done":""}" onclick="renderQuestion(${i})">${i+1}</button>`).join("")}</div></div>
 <div class="card" style="margin-top:18px"><span class="tag">QUESTION ${index+1}</span><h2 style="line-height:1.5">${esc(q.question_text)}</h2>
 ${option("A",q.option_a)}${option("B",q.option_b)}${option("C",q.option_c)}${option("D",q.option_d)}
 <div style="display:flex;justify-content:space-between;margin-top:25px"><button class="btn btn-soft" ${index===0?"disabled":""} onclick="renderQuestion(${index-1})">← Previous</button>${index===currentExam.questions.length-1?`<button class="btn btn-primary" onclick="submitExam()">Submit exam</button>`:`<button class="btn btn-primary" onclick="renderQuestion(${index+1})">Next →</button>`}</div></div>`;
}
async function submitExam(){
 if(!confirm("Submit this CBT now? You will receive your score immediately."))return;
 let score=0;
 currentExam.questions.forEach(q=>{if(examAnswers[q.id]===q.correct_option)score+=q.marks||1});
 const total=currentExam.questions.reduce((a,q)=>a+(q.marks||1),0);
 const {data,error}=await sb.from("exam_attempts").insert({bank_id:currentExam.bank.id,student_id:currentUser.id,code_id:currentExam.codeId,score,total,answers:examAnswers,started_at:new Date(currentExam.started).toISOString(),submitted_at:new Date().toISOString()}).select().single();
 if(error)return toast(error.message,true);
 const pct=Math.round(score/total*100);
 $("content").innerHTML=`<div class="card" style="text-align:center;max-width:680px;margin:auto"><span class="eyebrow">RESULT</span><h1>${esc(currentExam.bank.name)}</h1><div class="result-ring" style="--score:${pct}%"><div><div class="result-score">${pct}%</div><small>${score} / ${total}</small></div></div><p class="muted">Submitted ${new Date().toLocaleString()}</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px"><button class="btn btn-primary" onclick="downloadResult('${data.id}')">Download result</button><button class="btn btn-soft" onclick="navigate('cbt')">Back to CBT</button></div></div>`;
 currentExam=null;
}
async function downloadResult(id){
 const {data:a,error}=await sb.from("exam_attempts").select("*,question_banks(name,exam_standard,subjects(name,class)),profiles(first_name,last_name,email,class)").eq("id",id).single();
 if(error)return toast(error.message,true);
 const html=`<!doctype html><html><head><meta charset="utf-8"><title>CBT Result</title><style>body{font-family:Arial;padding:40px;color:#222}h1{color:#5b101c}.box{border:1px solid #ddd;padding:20px;border-radius:10px}.score{font-size:45px;font-weight:800;color:#5b101c}</style></head><body><h1>Potter And Clay Schools</h1><p>Moulding your future</p><div class="box"><h2>CBT Result</h2><p><b>Student:</b> ${esc(a.profiles.first_name+" "+a.profiles.last_name)}</p><p><b>Class:</b> ${esc(a.profiles.class||"")}</p><p><b>Subject:</b> ${esc(a.question_banks.subjects?.name||"")}</p><p><b>Test:</b> ${esc(a.question_banks.name)}</p><p><b>Standard:</b> ${esc(a.question_banks.exam_standard)}</p><p><b>Date:</b> ${new Date(a.submitted_at).toLocaleString()}</p><div class="score">${a.score} / ${a.total} (${Math.round(a.score/a.total*100)}%)</div></div></body></html>`;
 const blob=new Blob([html],{type:"text/html"}),url=URL.createObjectURL(blob),ael=document.createElement("a");ael.href=url;ael.download=`CBT-Result-${a.profiles.last_name}.html`;ael.click();URL.revokeObjectURL(url);
}

async function profilePage(){
 $("content").innerHTML=`<div class="page-head"><div><h1>My Profile</h1><p>Keep your account information up to date.</p></div></div>
 <div class="grid grid-2"><div class="card"><div class="profile-head"><img id="profileAvatar" class="avatar-lg" src="${avatar(profile.avatar_url)}"><div><h2>${esc(profile.first_name)} ${esc(profile.last_name)}</h2><p>${esc(profile.email||currentUser.email)} · ${esc(profile.role)}</p><p>${esc(profile.class||"Teacher/Admin")}</p></div></div><hr style="border:0;border-top:1px solid var(--line);margin:22px 0"><div class="field"><label>Profile picture<input id="avatarFile" type="file" accept="image/*"></label></div><button class="btn btn-primary" style="margin-top:15px" onclick="uploadAvatar()">Upload picture</button></div>
 <div class="card"><h2>Account information</h2><div class="grid grid-2"><div class="field"><label>First name<input id="pf" value="${esc(profile.first_name)}"></label></div><div class="field"><label>Last name<input id="pl" value="${esc(profile.last_name)}"></label></div><div class="field"><label>Phone<input id="pp" value="${esc(profile.phone||"")}"></label></div><div class="field"><label>Class<input value="${esc(profile.class||"N/A")}" disabled></label></div></div><button class="btn btn-primary" style="margin-top:15px" onclick="saveProfile()">Save changes</button></div></div>`;
}
async function saveProfile(){const {data,error}=await sb.from("profiles").update({first_name:$("pf").value.trim(),last_name:$("pl").value.trim(),phone:$("pp").value.trim()}).eq("id",currentUser.id).select().single();if(error)toast(error.message,true);else{profile=data;$("topName").textContent=`${profile.first_name} ${profile.last_name}`;toast("Profile updated.")}}
async function uploadAvatar(){
 const f=$("avatarFile").files[0];if(!f)return toast("Choose an image first.",true);
 const ext=f.name.split(".").pop().toLowerCase();const path=`${currentUser.id}/avatar.${ext}`;
 const {error}=await sb.storage.from("avatars").upload(path,f,{upsert:true,contentType:f.type});if(error)return toast(error.message,true);
 const {data}=sb.storage.from("avatars").getPublicUrl(path);const {data:p,error:pe}=await sb.from("profiles").update({avatar_url:data.publicUrl}).eq("id",currentUser.id).select().single();if(pe)return toast(pe.message,true);profile=p;$("topAvatar").src=avatar(p.avatar_url);toast("Profile picture updated.");profilePage();
}

async function teacherStudio(){
 if(!["teacher","admin"].includes(profile.role))return navigate("dashboard");
 const {data:subjects}=await sb.from("subjects").select("*").order("class").order("name");
 const {data:lessons}=await sb.from("lessons").select("*,subjects(name,class)").eq("teacher_id",currentUser.id).order("created_at",{ascending:false});
 $("content").innerHTML=`<div class="page-head"><div><h1>Teacher Studio</h1><p>Publish learning resources and create assignments.</p></div><button class="btn btn-primary" onclick="newLesson()">+ New lesson</button></div>
 <div class="grid grid-2"><div class="card"><h2>My lessons</h2><div class="lesson-list">${(lessons||[]).map(l=>`<div class="lesson-row"><div><h3>${esc(l.title)}</h3><p>${esc(l.subjects?.class||"")} · ${esc(l.subjects?.name||"")}</p></div><span class="badge ${l.published?"green":""}">${l.published?"Published":"Draft"}</span></div>`).join("")||'<div class="empty">No lessons yet.</div>'}</div></div><div class="card"><h2>Teacher tools</h2><p class="muted">Create lesson resources and assignments for your learners.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="newLesson()">+ Lesson</button><button class="btn btn-soft" onclick="newAssignment()">+ Assignment</button></div><hr style="border:0;border-top:1px solid var(--line);margin:22px 0"><h3>Publishing checklist</h3><ul class="muted"><li>Use clear lesson titles.</li><li>Add practical explanations.</li><li>Keep audio files reasonably sized.</li><li>Set realistic assignment due dates.</li></ul></div></div>`;
}

async function newAssignment(){
 const {data:subjects}=await sb.from("subjects").select("*").order("class").order("name");
 showModal(`<h2>Create assignment</h2><form id="assignmentForm" class="field">
 <label>Subject<select id="as">${(subjects||[]).map(x=>`<option value="${x.id}">${esc(x.class)} · ${esc(x.name)}</option>`).join("")}</select></label>
 <label>Title<input id="at" required></label>
 <label>Instructions<textarea id="ai" rows="7" required></textarea></label>
 <label>Due date<input id="ad" type="datetime-local"></label>
 <label>Attachment<input id="af" type="file"></label>
 <button class="btn btn-primary" type="submit">Publish assignment</button></form>`);
 $("assignmentForm").onsubmit=async e=>{
   e.preventDefault();
   const f=$("af").files[0]; let url=null;
   if(f){
     const path=`${currentUser.id}/${Date.now()}-${f.name}`;
     const r=await sb.storage.from("assignments").upload(path,f);
     if(r.error)return toast(r.error.message,true);
     url=sb.storage.from("assignments").getPublicUrl(path).data.publicUrl;
   }
   const {error}=await sb.from("assignments").insert({
     subject_id:$("as").value,teacher_id:currentUser.id,title:$("at").value.trim(),
     instructions:$("ai").value.trim(),due_at:$("ad").value?new Date($("ad").value).toISOString():null,attachment_url:url
   });
   if(error)toast(error.message,true);else{closeModal();toast("Assignment published.");teacherStudio();}
 };
}

async function newLesson(){
 const {data:subjects}=await sb.from("subjects").select("*").order("class").order("name");
 showModal(`<h2>Create lesson</h2><form id="lessonForm" class="field">
 <label>Subject<select id="ls">${(subjects||[]).map(s=>`<option value="${s.id}">${esc(s.class)} · ${esc(s.name)}</option>`).join("")}</select></label>
 <label>Title<input id="lt" required></label><label>Summary<input id="lm"></label><label>Lesson content<textarea id="lc" rows="8" required></textarea></label>
 <label>Lesson note / PDF<input id="ln" type="file" accept=".pdf,.doc,.docx"></label>
 <label>Audio lecture<input id="la" type="file" accept="audio/*"></label>
 <label>Duration (minutes)<input id="ld" type="number" value="30"></label>
 <button class="btn btn-primary" type="submit">Publish lesson</button></form>`);
 $("lessonForm").onsubmit=async e=>{e.preventDefault();const note=$("ln").files[0],audio=$("la").files[0];let noteUrl=null,audioUrl=null;
  if(note){const path=`${currentUser.id}/${Date.now()}-${note.name}`;const r=await sb.storage.from("lesson-files").upload(path,note);if(r.error)return toast(r.error.message,true);noteUrl=sb.storage.from("lesson-files").getPublicUrl(path).data.publicUrl}
  if(audio){const path=`${currentUser.id}/${Date.now()}-${audio.name}`;const r=await sb.storage.from("audio-lectures").upload(path,audio);if(r.error)return toast(r.error.message,true);audioUrl=sb.storage.from("audio-lectures").getPublicUrl(path).data.publicUrl}
  const {error}=await sb.from("lessons").insert({subject_id:$("ls").value,teacher_id:currentUser.id,title:$("lt").value,summary:$("lm").value,content:$("lc").value,duration_minutes:Number($("ld").value),notes_url:noteUrl,audio_url:audioUrl,published:true});
  if(error)toast(error.message,true);else{closeModal();toast("Lesson published.");teacherStudio()}
 }
}

async function adminPanel(){
 if(profile.role!=="admin")return navigate("dashboard");
 const [{data:profiles},{data:codes},{data:attempts}]=await Promise.all([
  sb.from("profiles").select("*").order("created_at",{ascending:false}).limit(100),
  sb.from("cbt_codes").select("*,question_banks(name),profiles(first_name,last_name)").order("created_at",{ascending:false}).limit(50),
  sb.from("exam_attempts").select("*,question_banks(name),profiles(first_name,last_name,class)").order("submitted_at",{ascending:false}).limit(50)
 ]);
 $("content").innerHTML=`<div class="page-head"><div><h1>Admin Control</h1><p>School-wide LMS management.</p></div><div style="display:flex;gap:8px"><button class="btn btn-soft" onclick="generateCode()">+ Generate CBT code</button><button class="btn btn-soft" onclick="addQuestion()">+ Add question</button><button class="btn btn-soft" onclick="bulkImportQuestions()">⇧ Import CSV</button><button class="btn btn-primary" onclick="manageQuestionBank()">+ Question bank</button></div></div>
 <div class="grid grid-4"><div class="card stat"><strong>${profiles?.length||0}</strong><span>Users</span></div><div class="card stat"><strong>${profiles?.filter(x=>x.role==="student").length||0}</strong><span>Students</span></div><div class="card stat"><strong>${profiles?.filter(x=>x.role==="teacher").length||0}</strong><span>Teachers</span></div><div class="card stat"><strong>${attempts?.length||0}</strong><span>Recent CBT attempts</span></div></div>
 <div class="grid grid-2" style="margin-top:20px"><div class="card"><h2>CBT access codes</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Bank</th><th>Uses</th><th>Status</th></tr></thead><tbody>${(codes||[]).map(c=>`<tr><td><strong>${esc(c.code)}</strong></td><td>${esc(c.question_banks?.name||"")}</td><td>${c.uses}/${c.max_uses}</td><td><span class="badge ${c.active&&c.uses<c.max_uses?"green":"red"}">${c.active&&c.uses<c.max_uses?"Active":"Closed"}</span></td></tr>`).join("")||"<tr><td colspan='4'>No codes.</td></tr>"}</tbody></table></div></div>
 <div class="card"><h2>Recent CBT activity</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Test</th><th>Score</th></tr></thead><tbody>${(attempts||[]).map(a=>`<tr><td>${esc((a.profiles?.first_name||"")+" "+(a.profiles?.last_name||""))}</td><td>${esc(a.question_banks?.name||"")}</td><td><strong>${a.score}/${a.total}</strong></td></tr>`).join("")||"<tr><td colspan='3'>No attempts.</td></tr>"}</tbody></table></div></div></div>
 <div class="card" style="margin-top:20px"><h2>User accounts</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Class</th></tr></thead><tbody>${(profiles||[]).map(p=>`<tr><td>${esc(p.first_name+" "+p.last_name)}</td><td>${esc(p.email||"")}</td><td><span class="badge">${esc(p.role)}</span></td><td>${esc(p.class||"—")}</td></tr>`).join("")}</tbody></table></div></div>`;
}
async function generateCode(){
 const {data:banks}=await sb.from("question_banks").select("*,subjects(name,class)").eq("active",true).order("created_at",{ascending:false});
 if(!banks?.length)return toast("Create a question bank first.",true);
 showModal(`<h2>Generate CBT access code</h2><form id="codeForm" class="field"><label>Question bank<select id="cb">${banks.map(b=>`<option value="${b.id}">${esc(b.subjects?.class)} · ${esc(b.subjects?.name)} · ${esc(b.name)}</option>`).join("")}</select></label><label>Student email (optional)<input id="ce" type="email" placeholder="Leave blank for unassigned code"></label><label>Expiry<input id="cx" type="datetime-local"></label><button class="btn btn-primary" type="submit">Generate code</button></form>`);
 $("codeForm").onsubmit=async e=>{e.preventDefault();let student_id=null;const email=$("ce").value.trim();if(email){const {data:p}=await sb.from("profiles").select("id").eq("email",email).single();if(!p)return toast("No student found with that email.",true);student_id=p.id}
 const code=("PCS-"+crypto.randomUUID().replaceAll("-","").slice(0,8)).toUpperCase();
 const {error}=await sb.from("cbt_codes").insert({code,bank_id:$("cb").value,student_id,expires_at:$("cx").value?new Date($("cx").value).toISOString():null,created_by:currentUser.id});
 if(error)return toast(error.message,true);
 showModal(`<div style="text-align:center"><span class="eyebrow">CBT ACCESS CODE</span><h1 style="font-size:42px;letter-spacing:.08em;color:#5b101c">${code}</h1><p class="muted">This code can be used twice.</p><button class="btn btn-primary" onclick="navigator.clipboard.writeText('${code}');toast('Copied')">Copy code</button></div>`);
 }
}

async function addQuestion(){
 const {data:banks}=await sb.from("question_banks").select("*,subjects(name,class)").order("created_at",{ascending:false});
 if(!banks?.length)return toast("Create a question bank first.",true);
 showModal(`<h2>Add CBT question</h2><form id="questionForm" class="field">
 <label>Question bank<select id="qb">${banks.map(b=>`<option value="${b.id}">${esc(b.subjects?.class)} · ${esc(b.subjects?.name)} · ${esc(b.name)}</option>`).join("")}</select></label>
 <label>Question<textarea id="qt" rows="4" required></textarea></label>
 <div class="two-col"><label>Option A<input id="qa" required></label><label>Option B<input id="qb2" required></label></div>
 <div class="two-col"><label>Option C<input id="qc" required></label><label>Option D<input id="qd" required></label></div>
 <label>Correct option<select id="qo"><option>A</option><option>B</option><option>C</option><option>D</option></select></label>
 <label>Explanation<textarea id="qe" rows="3"></textarea></label>
 <button class="btn btn-primary" type="submit">Save question</button></form>`);
 $("questionForm").onsubmit=async e=>{
   e.preventDefault();
   const {error}=await sb.from("questions").insert({
     bank_id:$("qb").value,question_text:$("qt").value.trim(),option_a:$("qa").value.trim(),
     option_b:$("qb2").value.trim(),option_c:$("qc").value.trim(),option_d:$("qd").value.trim(),
     correct_option:$("qo").value,explanation:$("qe").value.trim()
   });
   if(error)toast(error.message,true);else{closeModal();toast("Question added.");}
 };
}

function parseCSV(text){
 const rows=[]; let row=[], field='', quoted=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i], next=text[i+1];
  if(ch==='"'){if(quoted&&next==='"'){field+='"';i++;continue}quoted=!quoted;continue}
  if(ch===','&&!quoted){row.push(field);field='';continue}
  if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(field);field='';if(row.some(v=>v.trim()!==''))rows.push(row);row=[];continue}
  field+=ch;
 }
 if(field!==''||row.length){row.push(field);if(row.some(v=>v.trim()!==''))rows.push(row)}
 if(!rows.length)return [];
 const headers=rows.shift().map(h=>h.trim().toLowerCase().replace(/^\uFEFF/,''));
 return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]??'').trim()])));
}
function csvTemplate(){
 const header='class,subject,bank_name,exam_standard,duration_minutes,question_count,question_text,option_a,option_b,option_c,option_d,correct_option,explanation,marks';
 const sample=['JSS 1','Mathematics','JSS 1 Mathematics Practice','School Standard','60','50','What is 2 + 3?','4','5','6','7','B','2 + 3 = 5.','1'];
 const escCsv=v=>'"'+String(v).replaceAll('"','""')+'"';
 return header+'\n'+sample.map(escCsv).join(',');
}
async function bulkImportQuestions(){
 showModal('<h2>Bulk import CBT questions</h2><p class="muted">Upload a CSV containing your class, subject, question bank and questions. The importer will find the matching subject/question bank and create them when needed.</p><div class="card" style="background:#faf7f4;margin:15px 0"><strong>Required columns</strong><p style="font-size:12px;line-height:1.7;margin:8px 0">class, subject, bank_name, question_text, option_a, option_b, option_c, option_d, correct_option</p><strong>Optional</strong><p style="font-size:12px;line-height:1.7;margin:8px 0">exam_standard, duration_minutes, question_count, explanation, marks</p></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:15px"><button type="button" class="btn btn-soft" id="downloadCsvTemplate">Download CSV template</button></div><form id="bulkImportForm" class="field"><label>CSV file<input id="bulkCsvFile" type="file" accept=".csv,text/csv" required></label><label>When a question bank does not exist<select id="bulkBankMode"><option value="create">Create it automatically</option><option value="stop">Stop and report an error</option></select></label><button class="btn btn-primary" type="submit">Validate and import</button></form><div id="bulkImportStatus" class="muted" style="margin-top:14px"></div>');
 $('downloadCsvTemplate').onclick=()=>{const blob=new Blob([csvTemplate()],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='potter-clay-cbt-question-template.csv';a.click();URL.revokeObjectURL(url)};
 $('bulkImportForm').onsubmit=async e=>{
  e.preventDefault(); const file=$('bulkCsvFile').files[0]; if(!file)return;
  const status=$('bulkImportStatus'); status.textContent='Reading and validating CSV...';
  try{
   const rows=parseCSV(await file.text());
   const required=['class','subject','bank_name','question_text','option_a','option_b','option_c','option_d','correct_option'];
   if(!rows.length)throw new Error('The CSV file is empty.');
   const missing=required.filter(k=>!(k in rows[0]));
   if(missing.length)throw new Error('Missing required column(s): '+missing.join(', '));
   const validOptions=['A','B','C','D'],errors=[];
   rows.forEach((r,i)=>{const line=i+2;if(!r.class||!r.subject||!r.bank_name||!r.question_text)errors.push('Row '+line+': class, subject, bank_name and question_text are required.');if(!validOptions.includes((r.correct_option||'').toUpperCase()))errors.push('Row '+line+': correct_option must be A, B, C or D.')});
   if(errors.length)throw new Error(errors.slice(0,12).join('\n')+(errors.length>12?'\n...and '+(errors.length-12)+' more error(s).':''));
   status.textContent='Validated '+rows.length+' question(s). Matching subjects and question banks...';
   const groups=new Map();
   rows.forEach(r=>{const cls=r.class.trim(),subject=r.subject.trim(),bank=r.bank_name.trim(),key=[cls.toLowerCase(),subject.toLowerCase(),bank.toLowerCase()].join('|');if(!groups.has(key))groups.set(key,{className:cls,subjectName:subject,bankName:bank,rows:[]});groups.get(key).rows.push(r)});
   let inserted=0,createdBanks=0,createdSubjects=0;
   for(const g of groups.values()){
    let {data:subject,error:se}=await sb.from('subjects').select('*').eq('class',g.className).ilike('name',g.subjectName).maybeSingle();if(se)throw se;
    if(!subject){const {data:newSubject,error:ce}=await sb.from('subjects').insert({class:g.className,name:g.subjectName,description:g.className+' '+g.subjectName+' curriculum'}).select().single();if(ce)throw new Error('Could not create subject '+g.subjectName+' for '+g.className+': '+ce.message);subject=newSubject;createdSubjects++}
    let {data:bank,error:be}=await sb.from('question_banks').select('*').eq('class',g.className).eq('subject_id',subject.id).ilike('name',g.bankName).maybeSingle();if(be)throw be;
    if(!bank){if($('bulkBankMode').value==='stop')throw new Error('Question bank '+g.bankName+' was not found for '+g.className+' / '+g.subjectName+'.');const first=g.rows[0];const {data:newBank,error:ce}=await sb.from('question_banks').insert({subject_id:subject.id,class:g.className,name:g.bankName,exam_standard:first.exam_standard||'School Standard',duration_minutes:Number(first.duration_minutes||60),question_count:Number(first.question_count||g.rows.length),active:true}).select().single();if(ce)throw new Error('Could not create question bank '+g.bankName+': '+ce.message);bank=newBank;createdBanks++}
    const payload=g.rows.map(r=>({bank_id:bank.id,question_text:r.question_text.trim(),option_a:r.option_a.trim(),option_b:r.option_b.trim(),option_c:r.option_c.trim(),option_d:r.option_d.trim(),correct_option:r.correct_option.toUpperCase(),explanation:r.explanation||'',marks:Number(r.marks||1)}));
    for(let i=0;i<payload.length;i+=50){const {error:qe}=await sb.from('questions').insert(payload.slice(i,i+50));if(qe)throw new Error('Could not import questions into '+g.bankName+': '+qe.message);inserted+=Math.min(50,payload.length-i)}
    const {count}=await sb.from('questions').select('id',{count:'exact',head:true}).eq('bank_id',bank.id);await sb.from('question_banks').update({question_count:count||payload.length}).eq('id',bank.id);
   }
   status.textContent='Import complete: '+inserted+' question(s), '+createdBanks+' question bank(s) and '+createdSubjects+' subject(s) created.';toast('Imported '+inserted+' CBT question(s).');setTimeout(()=>{closeModal();adminPanel()},700);
  }catch(err){status.textContent=err.message||'Import failed.';toast(err.message||'Import failed.',true)}
 };
}
async function manageQuestionBank(){
 const {data:subjects}=await sb.from("subjects").select("*").order("class").order("name");
 showModal(`<h2>Create question bank</h2><form id="bankForm" class="field"><label>Subject<select id="bs">${subjects.map(s=>`<option value="${s.id}">${esc(s.class)} · ${esc(s.name)}</option>`).join("")}</select></label><label>Bank name<input id="bn" value="Practice CBT" required></label><label>Exam standard<select id="be"><option>School Standard</option><option>NECO BECE Standard</option><option>WAEC Standard</option><option>JAMB Standard</option><option>WAEC/NECO/JAMB-style practice</option></select></label><label>Duration<input id="bd" type="number" value="60"></label><label>Question count<input id="bq" type="number" value="50"></label><button class="btn btn-primary" type="submit">Create bank</button></form>
 <hr style="border:0;border-top:1px solid var(--line);margin:22px 0">
 <p class="muted" style="font-size:12px">After creating a bank, use <b>Add questions</b> from the Admin panel to enter approved questions.</p>`);
 $("bankForm").onsubmit=async e=>{e.preventDefault();const {data:s}=await sb.from("subjects").select("class").eq("id",$("bs").value).single();const {error}=await sb.from("question_banks").insert({subject_id:$("bs").value,class:s.class,name:$("bn").value,exam_standard:$("be").value,duration_minutes:Number($("bd").value),question_count:Number($("bq").value)});if(error)toast(error.message,true);else{closeModal();toast("Question bank created. Add its questions in Supabase or extend the admin question editor.");adminPanel()}}
}

boot();
