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
const SCHOOL_NAME = "Potter And Clay Schools";
const SCHOOL_MOTTO = "Moulding Your Future";
const SCHOOL_LOGO = "data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAUAAD/4QMhaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjAtYzA2MSA2NC4xNDA5NDksIDIwMTAvMTIvMDctMTA6NTc6MDEgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIEZpcmV3b3JrcyBDUzQiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6OEUzMTVGQzE4ODYzMTFFNUIwMTdDNjU4RjE0MzBGMTciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6OEUzMTVGQzI4ODYzMTFFNUIwMTdDNjU4RjE0MzBGMTciPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo4RTMxNUZCRjg4NjMxMUU1QjAxN0M2NThGMTQzMEYxNyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo4RTMxNUZDMDg4NjMxMUU1QjAxN0M2NThGMTQzMEYxNyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/uAA5BZG9iZQBkwAAAAAH/2wCEABIODg4QDhUQEBUeFBEUHiMaFRUaIyIZGRoZGSIn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";
const SCHOOL_ADDRESSES = [
  "School 1: B283 Imo, Ilesa, Osun State",
  "School 2: B231 Imo, Ilesa, Osun State",
  "School 3: Iloko Road, opposite Gold FM, Ilesa, Osun State"
];
const SCHOOL_PHONE = "+2348033861640";
const SCHOOL_EMAIL = "potter.clay.schools@gmail.com";
function schoolBrandBlock(compact=false) {
  return `<div class="school-brand" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 20px;background:#fff;border:1px solid #eadfe0;border-radius:14px;margin-bottom:18px">
    <img src="${SCHOOL_LOGO}" alt="Potter And Clay Schools logo" style="width:76px;height:78px;object-fit:contain;border-radius:8px">
    <div style="flex:1;min-width:220px"><div style="font-size:21px;font-weight:800;color:#5b101c">${SCHOOL_NAME}</div><div style="font-size:13px;color:#6d4a4d;font-style:italic">${SCHOOL_MOTTO}</div>
    ${compact ? "" : `<div style="font-size:12px;color:#544b4b;margin-top:7px">${SCHOOL_ADDRESSES.map(esc).join(" · ")}</div><div style="font-size:12px;color:#544b4b;margin-top:3px">${SCHOOL_PHONE} · ${SCHOOL_EMAIL}</div>`}</div>
  </div>`;
}

function formatLmsDateTime(date=new Date()){return new Intl.DateTimeFormat("en-NG",{dateStyle:"medium",timeStyle:"medium",timeZone:"Africa/Lagos"}).format(date);}
function startLmsClock(){const update=()=>{const el=$("lmsDateTime");if(el)el.textContent="Current date and time: "+formatLmsDateTime();};update();if(window.__lmsClockInterval)clearInterval(window.__lmsClockInterval);window.__lmsClockInterval=setInterval(update,1000);}
async function saveAcademicSession(){
 if(profile?.role!=="admin")return toast("Only an administrator can update the academic session.",true);
 const session=($("academicSessionInput")?.value||"").trim();
 if(!session)return toast("Enter the academic session, e.g. 2026/2027.",true);
 const {error}=await sb.from("academic_settings").upsert({id:1,academic_session:session,updated_by:currentUser.id,updated_at:new Date().toISOString()},{onConflict:"id"});
 if(error)return toast("Unable to update academic session: "+error.message,true);
 toast("Academic session updated for all users.");await adminPanel();
}
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
  ["messages","✉","Messages"],
  ["profile","◉","My Profile"]
 ];
 if(profile?.role==="teacher")base.splice(2,0,["teacher","▣","Teacher Studio"]);
 if(profile?.role==="admin"){
  base.splice(2,0,
   ["admin","⚙","Admin Control"],
   ["admin-students","🎓","Students"],
   ["admin-teachers","👩‍🏫","Teachers"],
   ["admin-admins","🛡","Admins"]
  );
 }
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
 try{await getProfile();if(profile.is_active===false){await sb.auth.signOut();currentUser=null;profile=null;$("authView").classList.remove("hidden");$("appView").classList.add("hidden");return toast("This account has been disabled by the school administrator.",true)}$("authView").classList.add("hidden");$("appView").classList.remove("hidden");navigate("dashboard")}
 catch(e){toast("Unable to load your profile: "+e.message,true)}
}
sb.auth.onAuthStateChange((_event,session)=>{if(session&&!currentUser)boot()});

async function renderPage(page){
 $("content").innerHTML=`<div class="empty">Loading...</div>`;
 const titles={dashboard:["Dashboard","Your learning space"],courses:["My Courses","Explore your class subjects and lessons"],cbt:["CBT Centre","Practice and take secure computer-based tests"],teacher:["Teacher Studio","Create lessons, audio lectures and assignments"],admin:["Admin Control","Manage learners, teachers, CBT and school activity"],"admin-students":["Students","Manage student accounts and classes"],"admin-teachers":["Teachers","Manage teacher accounts and assignments"],"admin-admins":["Admins","Review administrator accounts"],profile:["My Profile","Manage your account and profile picture"],messages:["Messages","Conversations with teachers and students"]};
 $("pageTitle").textContent=titles[page]?.[0]||"Dashboard";$("pageSub").textContent=(titles[page]?.[1]||"")+" · "+formatLmsDateTime();
 try{
  if(page==="dashboard")await dashboard();
  if(page==="courses")await courses();
  if(page==="cbt")await cbtCentre();
  if(page==="teacher")await teacherStudio();
  if(page==="admin")await adminPanel();
  if(page==="admin-students")await adminPeoplePage("student");
  if(page==="admin-teachers")await adminPeoplePage("teacher");
  if(page==="admin-admins")await adminPeoplePage("admin");
  if(page==="profile")await profilePage();
  if(page==="messages")await messagesPage();
 }catch(e){$("content").innerHTML=`<div class="card"><strong>Something went wrong.</strong><p class="muted">${esc(e.message)}</p></div>`}
}

async function dashboard(){
 const [{data:subjects},{data:lessons},{data:attempts},{data:announcements},{data:academic}] = await Promise.all([
  sb.from("subjects").select("*").eq("class",profile.class).order("name"),
  sb.from("lessons").select("id,title,subject_id").eq("published",true).limit(5),
  sb.from("exam_attempts").select("score,total,submitted_at,question_banks(name)").eq("student_id",currentUser.id).order("submitted_at",{ascending:false}).limit(5),
  sb.from("general_announcements").select("id,message,updated_at").eq("active",true).order("updated_at",{ascending:false}).limit(1),
  sb.from("academic_settings").select("academic_session,updated_at").eq("id",1).maybeSingle()
 ]);
 const name=esc(profile.first_name);
 $("content").innerHTML=`
 ${schoolBrandBlock(false)}
  <div class="card" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:10px 0 16px">
   <div><strong>Academic Session:</strong> ${esc(academic?.academic_session||"Not set by administrator")}</div>
   <div id="lmsDateTime" class="muted">Current date and time: ${esc(formatLmsDateTime())}</div>
  </div>
  ${(announcements||[]).length ? `<div class="announcement-ticker" role="status" aria-label="School announcement"><div class="announcement-track"><span>📢 SCHOOL ANNOUNCEMENT: ${esc(announcements[0].message)}　　✦　　📢 SCHOOL ANNOUNCEMENT: ${esc(announcements[0].message)}　　✦　　</span><span aria-hidden="true">📢 SCHOOL ANNOUNCEMENT: ${esc(announcements[0].message)}　　✦　　📢 SCHOOL ANNOUNCEMENT: ${esc(announcements[0].message)}　　✦　　</span></div></div><style>.announcement-ticker{overflow:hidden;white-space:nowrap;background:#5b101c;color:#fff;border-radius:10px;padding:13px 0;margin:12px 0 18px;font-weight:700}.announcement-track{display:flex;width:max-content;animation:schoolAnnouncementScroll 28s linear infinite}.announcement-track span{padding-right:30px}.announcement-ticker:hover .announcement-track{animation-play-state:paused}@keyframes schoolAnnouncementScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style>` : ""}
  <div class="hero-banner"><div><span class="eyebrow">WELCOME BACK</span><h1>Keep moulding your future, ${name}.</h1><p>Your ${esc(profile.class||"school")} learning dashboard brings lessons, assignments and CBT practice into one place.</p></div><button class="btn btn-gold" onclick="navigate('courses')">Explore courses →</button></div>
 <div class="grid grid-4" style="margin-top:18px">
  <div class="card stat"><div class="icon">📚</div><strong>${subjects?.length||0}</strong><span>Subjects in ${esc(profile.class||"your class")}</span></div>
  <div class="card stat"><div class="icon">🎧</div><strong>${lessons?.length||0}</strong><span>Recent lessons</span></div>
  <div class="card stat"><div class="icon">🧠</div><strong>${attempts?.length||0}</strong><span>Recent CBT attempts</span></div>
  <div class="card stat"><div class="icon">🏆</div><strong>${attempts?.[0]?.score??0}</strong><span>Latest score</span></div>
 </div>
 <div class="page-head" style="margin-top:30px"><div><h1>Continue learning</h1><p>Pick a subject and start a lesson.</p></div><button class="btn btn-soft" onclick="navigate('courses')">View all</button></div>
 <div class="grid grid-3">${(subjects||[]).slice(0,6).map(s=>courseCard(s)).join("")||'<div class="empty">No subjects have been added for your class yet.</div>'}</div>`;
 startLmsClock();
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
function renderCommentTree(comments, names, parentId = null, depth = 0, moderate = false, lessonId = "", subjectId = "", className = "", replyEnabled = true){
 const children=(comments||[]).filter(c=>(c.parent_comment_id||null)===(parentId||null));
 if(!children.length) return '';
 return children.map(c=>`<div class="comment" style="margin:12px 0 12px ${Math.min(depth,3)*18}px;padding:12px;border-left:3px solid var(--line);border-radius:6px">
  <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><strong>${esc(names[c.user_id]||"LMS member")}</strong><span class="tag">${esc(c.author_role||"member")}</span><small class="muted">${c.created_at?new Date(c.created_at).toLocaleString():""}</small></div>
  <p style="white-space:pre-wrap;margin:8px 0">${esc(c.body)}</p>
  ${replyEnabled?`<form class="replyForm field" data-parent-id="${esc(c.id)}" style="margin-top:8px"><label>Reply<textarea name="replyBody" rows="2" required maxlength="5000" placeholder="Reply to this comment..."></textarea></label><button class="btn btn-soft" type="submit">Reply</button></form>`:""}
  ${moderate?`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-soft" type="button" onclick="deleteLessonComment('${c.id}','${lessonId}')">Delete comment</button>${c.author_role==="student"?`<button class="btn btn-soft" type="button" onclick="muteLessonStudent('${c.user_id}','${subjectId}','${className}')">Mute student for this subject</button>`:""}</div>`:""}
  ${renderCommentTree(comments,names,c.id,depth+1,moderate,lessonId,subjectId,className,replyEnabled)}
 </div>`).join('');
}

async function canModerateLesson(lesson){
 if(profile?.role==="admin")return true;
 if(profile?.role!=="teacher")return false;
 const {data:subject}=await sb.from("subjects").select("id,class").eq("id",lesson.subject_id).maybeSingle();
 if(!subject)return false;
 const {data:assignments,error}=await sb.from("teacher_subject_assignments").select("subject_id,class").eq("teacher_id",currentUser.id).eq("subject_id",subject.id);
 if(error)return false;
 return (assignments||[]).some(a=>!a.class||a.class===subject.class);
}

async function openLesson(id){
 const {data:l,error:lessonError}=await sb.from("lessons").select("*,subjects(name,class)").eq("id",id).single();
 if(lessonError||!l){toast(lessonError?.message||"Lesson could not be loaded.",true);return;}
 const {data:comments,error:commentError}=await sb.from("comments").select("id,body,created_at,user_id,lesson_id,parent_comment_id").eq("lesson_id",id).order("created_at");
 if(commentError){toast("Unable to load discussion: "+commentError.message,true);return;}
 const ids=[...new Set((comments||[]).map(c=>c.user_id))];let names={};let roles={};
 if(ids.length){const {data:p,error:profileError}=await sb.rpc("get_subject_member_names",{p_subject_id:l.subject_id,p_user_ids:ids});if(profileError){toast("Comments loaded, but member names could not be loaded: "+profileError.message,true)}(p||[]).forEach(x=>{names[x.id]=`${x.first_name||""} ${x.last_name||""}`.trim()||"LMS member";roles[x.id]=x.role||"member"})}
 (comments||[]).forEach(c=>c.author_role=roles[c.user_id]||"member");
 const moderate=await canModerateLesson(l);
 let muted=false;
 if(profile?.role==="student"){
  const {data:mutes,error:muteError}=await sb.from("student_mutes").select("id,muted_until,reason").eq("student_id",currentUser.id).eq("subject_id",l.subject_id);
  if(!muteError)muted=(mutes||[]).some(m=>!m.muted_until||new Date(m.muted_until)>new Date());
 }
 showModal(`<span class="eyebrow">${esc(l.subjects?.class||"")}</span><h2>${esc(l.title)}</h2><p class="muted">${esc(l.summary||"")}</p><div class="lesson-content" style="line-height:1.8">${esc(l.content||"No lesson text has been added yet.").replace(/\n/g,"<br>")}</div>
 ${l.notes_url?`<p><a class="btn btn-soft" target="_blank" rel="noopener" href="${esc(l.notes_url)}">Open lesson document</a></p>`:""}
 ${l.audio_url?`<audio controls src="${esc(l.audio_url)}" style="width:100%;margin:20px 0"></audio>`:""}
 <hr style="border:0;border-top:1px solid var(--line);margin:24px 0"><h3>Discussion & replies</h3>
 ${muted?'<div class="card"><strong>Commenting is temporarily disabled for this subject.</strong><p class="muted">Please contact your teacher or school administrator if you need help.</p></div>':''}
 <div id="commentsThread">${renderCommentTree(comments||[],names,null,0,moderate,id,l.subject_id,l.subjects?.class||"",!muted)||'<p class="muted">Be the first to comment.</p>'}</div>
 ${currentUser&&!muted?`<form id="commentForm" class="field"><label>Add a comment<textarea id="commentBody" rows="3" required maxlength="5000" placeholder="Ask a question or share your thought..."></textarea></label><button class="btn btn-primary" type="submit">Post comment</button></form>`:""}`);
 const submitComment=async(body,parentId=null)=>{
  const clean=String(body||"").trim();if(!clean)return toast("Please enter a comment or reply.",true);
  const payload={lesson_id:id,user_id:currentUser.id,body:clean};if(parentId)payload.parent_comment_id=parentId;
  const {error}=await sb.from("comments").insert(payload);
  if(error){toast("Could not post. Check whether you are muted or whether discussion permissions are configured: "+error.message,true);return;}
  toast(parentId?"Reply posted.":"Comment posted.");await openLesson(id);
 };
 if($("commentForm"))$("commentForm").onsubmit=async e=>{e.preventDefault();await submitComment($("commentBody").value);};
 document.querySelectorAll(".replyForm").forEach(form=>form.onsubmit=async e=>{e.preventDefault();const body=form.querySelector('[name="replyBody"]').value;await submitComment(body,form.dataset.parentId);});
}

async function deleteLessonComment(commentId,lessonId){
 if(!confirm("Delete this comment and its replies? This cannot be undone."))return;
 const {error}=await sb.from("comments").delete().eq("id",commentId);
 if(error)return toast("Unable to delete comment: "+error.message,true);
 toast("Comment deleted.");await openLesson(lessonId);
}

async function muteLessonStudent(studentId,subjectId,className){
 if(!["teacher","admin"].includes(profile?.role))return toast("Teacher access required.",true);
 showModal(`<h2>Mute student for this subject</h2><p class="muted">This prevents the student from posting or replying in discussions for this subject while the mute is active.</p><form id="muteForm" class="field"><label>Duration<select id="muteDuration"><option value="0">Until manually unmuted</option><option value="1">24 hours</option><option value="7">7 days</option><option value="30">30 days</option></select></label><label>Reason (optional)<textarea id="muteReason" rows="3" maxlength="500"></textarea></label><button class="btn btn-primary" type="submit">Confirm mute</button></form>`);
 $("muteForm").onsubmit=async e=>{e.preventDefault();const days=Number($("muteDuration").value);const until=days?new Date(Date.now()+days*86400000).toISOString():null;
  const {error}=await sb.from("student_mutes").upsert({teacher_id:currentUser.id,student_id:studentId,subject_id:subjectId,class:className,muted_until:until,reason:$("muteReason").value.trim()||null},{onConflict:"teacher_id,student_id,subject_id"});
  if(error)return toast("Could not mute student: "+error.message,true);closeModal();toast("Student muted for this subject.");
 };
}

async function unmuteClassStudent(studentId,subjectId){
 const {error}=await sb.from("student_mutes").delete().eq("teacher_id",currentUser.id).eq("student_id",studentId).eq("subject_id",subjectId);
 if(error)return toast("Could not unmute student: "+error.message,true);toast("Student unmuted.");await loadTeacherClassroomContent(subjectId);
}

async function teacherClassroom(){
 if(!["teacher","admin"].includes(profile.role))return toast("Teacher or administrator access required.",true);
 let subjects=[];
 if(profile.role==="admin"){
  const {data,error}=await sb.from("subjects").select("id,name,class").order("class").order("name");if(error)return toast(error.message,true);subjects=data||[];
 }else{
  const {data:as,error}=await sb.from("teacher_subject_assignments").select("subject_id,class").eq("teacher_id",currentUser.id);if(error)return toast(error.message,true);
  const {data:ss,error:se}=await sb.from("subjects").select("id,name,class").order("class").order("name");if(se)return toast(se.message,true);
  subjects=(ss||[]).filter(s=>(as||[]).some(a=>a.subject_id===s.id&&(!a.class||a.class===s.class)));
 }
 if(!subjects.length)return toast("No subjects have been assigned to this account.",true);
 showModal(`<h2>Classroom chat & moderation</h2><p class="muted">Manage discussions and contact students for subjects you teach.</p><div class="field"><label>Assigned subject<select id="classroomSubject">${subjects.map(s=>`<option value="${s.id}">${esc(s.class)} · ${esc(s.name)}</option>`).join("")}</select></label></div><div id="classroomStudents"><p class="muted">Loading students…</p></div>`);
 $("classroomSubject").onchange=()=>loadTeacherClassroomContent($("classroomSubject").value);
 await loadTeacherClassroomContent(subjects[0].id);
}

async function loadTeacherClassroomContent(subjectId){
 const host=$("classroomStudents");if(!host)return;
 const {data:subject,error:se}=await sb.from("subjects").select("id,name,class").eq("id",subjectId).single();if(se)return host.innerHTML=`<p class="muted">${esc(se.message)}</p>`;
 const {data:students,error}=await sb.rpc("get_subject_students",{p_subject_id:subjectId});
 if(error)return host.innerHTML=`<p class="muted">Could not load students: ${esc(error.message)}</p>`;
 const {data:mutes,error:me}=await sb.from("student_mutes").select("student_id,muted_until,reason,teacher_id").eq("subject_id",subjectId).eq("teacher_id",currentUser.id);
 if(me)return host.innerHTML=`<p class="muted">Could not load moderation status: ${esc(me.message)}</p>`;
 host.innerHTML=`<h3>${esc(subject.class)} · ${esc(subject.name)}</h3><div class="lesson-list">${(students||[]).map(st=>{const m=(mutes||[]).find(x=>x.student_id===st.id&&(!x.muted_until||new Date(x.muted_until)>new Date()));return `<div class="lesson-row"><div><strong>${esc((st.first_name||"")+" "+(st.last_name||""))}</strong><p class="muted">${esc(st.class||"")} ${esc(st.arm||"")}${m?' · <strong>Muted</strong>':''}</p></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-primary" onclick="openConversation('${subjectId}','${st.id}')">${'Start conversation'}</button>${m?`<button class="btn btn-soft" onclick="unmuteClassStudent('${st.id}','${subjectId}')">Unmute</button>`:`<button class="btn btn-soft" onclick="muteLessonStudent('${st.id}','${subjectId}','${subject.class}')">Mute</button>`}</div></div>`}).join("")||'<div class="empty">No students are registered in this class.</div>'}</div>`;
}

async function messagesPage(){
 if(!currentUser)return;
 const {data:messages,error}=await sb.from("direct_messages").select("id,subject_id,sender_id,recipient_id,body,created_at").or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`).order("created_at",{ascending:false}).limit(500);
 if(error){$("content").innerHTML=`<div class="card"><h2>Messages unavailable</h2><p>${esc(error.message)}</p><p class="muted">The messaging database migration may not have been run yet.</p></div>`;return;}
 const list=messages||[];const userIds=[...new Set(list.map(m=>m.sender_id===currentUser.id?m.recipient_id:m.sender_id))];const subjectIds=[...new Set(list.map(m=>m.subject_id))];let names={},subjects={};
 if(userIds.length){for(const subjectId of subjectIds){const idsForSubject=[...new Set(list.filter(m=>m.subject_id===subjectId).map(m=>m.sender_id===currentUser.id?m.recipient_id:m.sender_id))];const {data:ps}=await sb.rpc("get_subject_member_names",{p_subject_id:subjectId,p_user_ids:idsForSubject});(ps||[]).forEach(p=>names[p.id]=`${p.first_name||""} ${p.last_name||""}`.trim()||"LMS member");}}
 if(subjectIds.length){const {data:ss}=await sb.from("subjects").select("id,name,class").in("id",subjectIds);(ss||[]).forEach(s=>subjects[s.id]=s);}
 const groups=new Map();for(const m of list){const other=m.sender_id===currentUser.id?m.recipient_id:m.sender_id;const key=`${m.subject_id}:${other}`;if(!groups.has(key))groups.set(key,{subjectId:m.subject_id,otherId:other,last:m});}
 $("content").innerHTML=`<div class="page-head"><div><h1>Messages</h1><p>Conversations about your classes and subjects.</p></div>${profile.role==="teacher"||profile.role==="admin"?`<button class="btn btn-primary" onclick="teacherClassroom()">+ Start conversation</button>`:""}</div><div class="lesson-list">${[...groups.values()].map(g=>`<div class="lesson-row"><div><strong>${esc(names[g.otherId]||"LMS member")}</strong><p>${esc(subjects[g.subjectId]?.class||"")} · ${esc(subjects[g.subjectId]?.name||"Subject")}</p><p class="muted">${esc(g.last.body.slice(0,120))} · ${new Date(g.last.created_at).toLocaleString()}</p></div><button class="btn btn-primary" onclick="openConversation('${g.subjectId}','${g.otherId}')">Open conversation</button></div>`).join("")||'<div class="empty">No conversations yet. Your teacher can start one for an assigned subject.</div>'}</div>`;
}

async function openConversation(subjectId,otherId){
 const {data:subject,error:se}=await sb.from("subjects").select("id,name,class").eq("id",subjectId).single();
 if(se)return toast(se.message||"Conversation could not be opened.",true);
 const {data:memberRows,error:memberError}=await sb.rpc("get_subject_member_names",{p_subject_id:subjectId,p_user_ids:[otherId]});
 if(memberError||!memberRows?.length)return toast(memberError?.message||"This person is not available for a conversation in this subject.",true);
 const other=memberRows[0];
 let mutedHere=false;
 if(profile.role==="student"){
  const {data:mutes}=await sb.from("student_mutes").select("id,muted_until").eq("student_id",currentUser.id).eq("subject_id",subjectId);
  mutedHere=(mutes||[]).some(m=>!m.muted_until||new Date(m.muted_until)>new Date());
 }
 const load=async()=>{
  const {data:messages,error}=await sb.from("direct_messages").select("id,sender_id,recipient_id,body,created_at").eq("subject_id",subjectId).or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${currentUser.id})`).order("created_at");
  if(error)return toast("Could not load conversation: "+error.message,true);
  const meName=`${profile.first_name||""} ${profile.last_name||""}`.trim()||"You",otherName=`${other?.first_name||""} ${other?.last_name||""}`.trim()||"LMS member";
  showModal(`<h2>${esc(otherName)}</h2><p class="muted">${esc(subject.class)} · ${esc(subject.name)}</p><div style="max-height:45vh;overflow:auto;padding:10px;background:var(--surface);border-radius:8px">${(messages||[]).map(m=>`<div style="padding:10px;margin:8px 0;border-radius:8px;background:${m.sender_id===currentUser.id?'var(--line)':'var(--card)'}"><strong>${m.sender_id===currentUser.id?esc(meName):esc(otherName)}</strong><p style="white-space:pre-wrap">${esc(m.body)}</p><small class="muted">${new Date(m.created_at).toLocaleString()}</small></div>`).join("")||'<p class="muted">Start the conversation with a helpful message.</p>'}</div>${mutedHere?'<p class="muted">Messaging is temporarily disabled for this subject while your mute is active.</p>':`<form id="directMessageForm" class="field" style="margin-top:14px"><label>Message<textarea id="directMessageBody" rows="3" maxlength="5000" required placeholder="Write your message..."></textarea></label><button class="btn btn-primary" type="submit">Send message</button></form>`}`);
  if($("directMessageForm"))$("directMessageForm").onsubmit=async e=>{e.preventDefault();const body=$("directMessageBody").value.trim();if(!body)return;const {error:ie}=await sb.from("direct_messages").insert({subject_id:subjectId,sender_id:currentUser.id,recipient_id:otherId,body});if(ie)return toast("Could not send message: "+ie.message,true);await load();};
 };
 await load();
}

async function cbtCentre(){
 const {data:banks,error}=await sb.from("question_banks").select("*,subjects(name)").eq("class",profile.class).eq("active",true).order("created_at",{ascending:false});if(error)throw error;
 $("content").innerHTML=`<div class="hero-banner"><div><span class="eyebrow">CBT CENTRE</span><h1>Test your knowledge.</h1><p>Use a CBT access code supplied by the school administrator. Results are calculated immediately.</p></div><div style="font-size:50px">🧠</div></div>
 <div class="page-head" style="margin-top:28px"><div><h1>${esc(profile.class)} CBT</h1><p>Choose an available question bank.</p></div></div>
 <div class="grid grid-2">${(banks||[]).map(b=>`<div class="card"><span class="tag">${esc(b.exam_standard)}</span><h2>${esc(b.name)}</h2><p class="muted">${esc(b.subjects?.name||"Subject")} · ${b.question_count} questions · ${b.duration_minutes} minutes</p><button class="btn btn-primary" onclick="startCBT('${b.id}')">Start with access code →</button></div>`).join("")||'<div class="empty">No CBT question banks are active for your class yet.</div>'}</div>`;
}

let candidateDetails=null, theoryTimer=null, objectiveTimer=null, currentTheory=null, lastAttemptId=null, submittingExam=false;
async function startCBT(bankId){
 // The class is controlled by the school and is displayed as read-only.
 const candidateClass=normalizeSchoolClass(profile.class||"");
 if(!candidateClass)return toast("Your school has not assigned a class to your account. Contact the administrator.",true);
 const fullName=[profile.first_name,profile.last_name].filter(Boolean).join(" ");
 showModal(`<div style="max-width:560px;margin:auto">
   <span class="eyebrow">BEFORE YOU BEGIN</span>
   <h2>Candidate Information</h2>
   <p class="muted">Please complete this form and enter the CBT access code supplied by your school. Check your details before proceeding.</p>
   <form id="cbtCandidateForm" class="field">
     <label>Student's full name<input id="cbtCandidateName" name="candidateName" type="text" maxlength="200" value="${esc(fullName)}" autocomplete="name" required></label>
     <label>Class<input id="cbtCandidateClass" type="text" value="${esc(candidateClass)}" readonly aria-readonly="true"></label>
     <label>Sex<select id="cbtCandidateSex" required><option value="">Select sex</option><option value="Male" ${String(profile.sex||"").toLowerCase()==="male"?"selected":""}>Male</option><option value="Female" ${String(profile.sex||"").toLowerCase()==="female"?"selected":""}>Female</option></select></label>
     <label>Arm<select id="cbtCandidateArm" required><option value="">Select arm</option>${["A","B","C","D"].map(a=>`<option value="${a}" ${String(profile.arm||"").toUpperCase()===a?"selected":""}>${a}</option>`).join("")}</select></label>
     <label>CBT access code<input id="cbtAccessCode" type="text" maxlength="100" autocomplete="off" autocapitalize="characters" required placeholder="Enter the code provided by your school"></label>
     <p id="cbtFormStatus" class="muted" role="status" aria-live="polite"></p>
     <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><button id="cbtProceedBtn" class="btn btn-primary" type="submit">Verify details and proceed →</button><button class="btn btn-soft" type="button" id="cbtCancelBtn">Cancel</button></div>
   </form>
 </div>`);
 $("cbtCancelBtn").onclick=closeModal;
 $("cbtCandidateForm").onsubmit=async e=>{
   e.preventDefault();
   const submitButton=$("cbtProceedBtn"),status=$("cbtFormStatus");
   const name=$("cbtCandidateName").value.trim();
   const sex=$("cbtCandidateSex").value;
   const arm=$("cbtCandidateArm").value.toUpperCase();
   const accessCode=$("cbtAccessCode").value.trim();
   if(!name){status.textContent="Enter the student's full name.";return;}
   if(!["Male","Female"].includes(sex)){status.textContent="Please select Male or Female.";return;}
   if(!/^[A-D]$/.test(arm)){status.textContent="Please select a valid arm.";return;}
   if(!accessCode){status.textContent="Enter the CBT access code supplied by the school.";return;}
   submitButton.disabled=true;submitButton.textContent="Checking details…";status.textContent="Verifying the access code and preparing your exam…";
   try{
     const {data:bank,error:bankError}=await sb.from("question_banks").select("*,subjects(name)").eq("id",bankId).eq("active",true).single();
     if(bankError)throw bankError;
     const {data:q,error:qe}=await sb.from("questions").select("*").eq("bank_id",bankId).order("id",{ascending:true}).limit(50);
     if(qe)throw qe;
     if(!q?.length)throw new Error("This question bank has no questions yet. Please contact your teacher.");
     const {data:use,error}=await sb.rpc("use_cbt_code",{p_code:accessCode,p_bank_id:bankId});
     if(error)throw error;
     if(!use?.ok)throw new Error(use?.message||"Invalid CBT access code.");
     candidateDetails={name,className:candidateClass,sex,arm};
     currentExam={bank,questions:q.slice(0,Math.min(50,q.length)),codeId:use.code_id,started:Date.now(),deadline:Date.now()+Number(bank.duration_minutes||60)*60000};
     examAnswers={};
     closeModal();
     renderQuestion(0);startObjectiveClock();
   }catch(err){
     status.textContent=err?.message||"Unable to prepare the exam. Please try again.";
     submitButton.disabled=false;submitButton.textContent="Verify details and proceed →";
   }
 };
}
function startObjectiveClock(){
 clearInterval(objectiveTimer);
 const tick=()=>{if(!currentExam)return clearInterval(objectiveTimer);const left=Math.max(0,currentExam.deadline-Date.now());$("pageSub").textContent="Time remaining: "+Math.floor(left/60000)+"m "+Math.floor(left%60000/1000)+"s";if(left<=0){clearInterval(objectiveTimer);objectiveTimer=null;submitExam(true)}};
 tick();objectiveTimer=setInterval(tick,1000);
}
function renderQuestion(index){
 const q=currentExam.questions[index];currentExam.index=index;
 $("pageTitle").textContent=currentExam.bank.name;
 const option=(letter,text)=>`<label class="cbt-option"><input type="radio" name="answer" value="${letter}" ${examAnswers[q.id]===letter?"checked":""} onchange="examAnswers['${q.id}']=this.value"> <strong>${letter}.</strong> ${esc(text)}</label>`;
 $("content").innerHTML=`<div class="card"><div class="question-nav">${currentExam.questions.map((x,i)=>`<button class="qnum ${i===index?"active":""} ${examAnswers[x.id]?"done":""}" onclick="renderQuestion(${i})">${i+1}</button>`).join("")}</div></div>
 <div class="card" style="margin-top:18px"><span class="tag">QUESTION ${index+1}</span><h2 style="line-height:1.5">${esc(q.question_text)}</h2>
 ${option("A",q.option_a)}${option("B",q.option_b)}${option("C",q.option_c)}${option("D",q.option_d)}
 <div style="display:flex;justify-content:space-between;margin-top:25px"><button class="btn btn-soft" ${index===0?"disabled":""} onclick="renderQuestion(${index-1})">← Previous</button>${index===currentExam.questions.length-1?`<button class="btn btn-primary" onclick="submitExam()">Submit objective</button>`:`<button class="btn btn-primary" onclick="renderQuestion(${index+1})">Next →</button>`}</div></div>`;
}
async function submitExam(autoSubmit=false){
 if(!currentExam||submittingExam)return;
 if(!autoSubmit&&!confirm("Submit the objective section now?"))return;
 submittingExam=true;
 clearInterval(objectiveTimer);objectiveTimer=null;
 const questionIds=currentExam.questions.map(q=>q.id);
 const {data,error}=await sb.rpc("submit_objective_exam",{
  p_bank_id:currentExam.bank.id,
  p_code_id:currentExam.codeId,
  p_question_ids:questionIds,
  p_answers:examAnswers,
  p_candidate_name:candidateDetails?.name||[profile.first_name,profile.last_name].filter(Boolean).join(" "),
  p_candidate_sex:candidateDetails?.sex||profile.sex||null,
  p_candidate_arm:candidateDetails?.arm||profile.arm||null,
  p_started_at:new Date(currentExam.started).toISOString()
 });
 if(error){submittingExam=false;return toast("Could not submit exam: "+error.message,true);}
 if(!data?.ok||!data?.attempt_id){submittingExam=false;return toast(data?.message||"The exam could not be submitted. Please contact the administrator.",true);}
 const score=Number(data.score||0),total=Number(data.total||0);
 lastAttemptId=data.attempt_id;
 const pct=Math.round(score/total*100);
 const {data:theoryQs}=await sb.from("theory_questions").select("id").eq("bank_id",currentExam.bank.id).limit(1);
 $("content").innerHTML=`<div class="card" style="text-align:center;max-width:680px;margin:auto"><span class="eyebrow">OBJECTIVE RESULT</span><h1>${esc(currentExam.bank.name)}</h1><div class="result-ring" style="--score:${pct}%"><div><div class="result-score">${pct}%</div><small>${score} / ${total}</small></div></div><p class="muted">Candidate: ${esc(candidateDetails?.name||"")} · ${esc(candidateDetails?.className||profile.class||"")} ${esc(candidateDetails?.arm||"")}</p><p class="muted">${autoSubmit?"Objective section submitted automatically when time expired.":"Objective section submitted."}</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px"><button class="btn btn-soft" onclick="downloadResult('${data.attempt_id}')">Download result</button>${theoryQs?.length?`<button class="btn btn-primary" onclick="startTheory('${data.attempt_id}','${currentExam.bank.id}')">Proceed to Theory →</button>`:""}<button class="btn btn-soft" onclick="navigate('cbt')">Exit to CBT Centre</button></div></div>`;
 currentExam=null;submittingExam=false;
}
async function startTheory(attemptId,bankId){
 const {data:questions,error}=await sb.from("theory_questions").select("*").eq("bank_id",bankId).order("position");
 if(error)return toast(error.message,true);if(!questions?.length)return toast("No theory questions have been added for this test.",true);
 const {data:bank,error:be}=await sb.from("question_banks").select("name,theory_duration_minutes").eq("id",bankId).single();if(be)return toast(be.message,true);
 const {data:session,error:se}=await sb.from("theory_sessions").insert({attempt_id:attemptId,bank_id:bankId,student_id:currentUser.id,status:"started"}).select().single();
 if(se)return toast(se.message,true);
 currentTheory={attemptId,bankId,sessionId:session.id,questions,started:Date.now(),deadline:Date.now()+Number(bank.theory_duration_minutes||60)*60000,bankName:bank.name};
 renderTheory();startTheoryClock();
}
function startTheoryClock(){
 clearInterval(theoryTimer);
 const tick=()=>{if(!currentTheory)return clearInterval(theoryTimer);const left=Math.max(0,currentTheory.deadline-Date.now());$("pageSub").textContent="Theory time remaining: "+Math.floor(left/60000)+"m "+Math.floor(left%60000/1000)+"s";if(left<=0){clearInterval(theoryTimer);exitTheory(true)}};
 tick();theoryTimer=setInterval(tick,1000);
}
function renderTheory(){
 $("pageTitle").textContent=currentTheory.bankName+" — Theory";
 $("content").innerHTML=`<div class="hero-banner"><div><span class="eyebrow">THEORY EXAMINATION</span><h1>Write your answers in your physical answer booklet.</h1><p>This screen displays the questions only. Do not type your answers here. Submit your booklet to your teacher before exiting.</p></div></div><div class="card" style="margin-top:18px"><h2>${esc(currentTheory.bankName)} — Theory Questions</h2>${currentTheory.questions.map((q,i)=>`<div style="padding:15px 0;border-bottom:1px solid var(--line)"><strong>Question ${i+1} (${Number(q.marks||1)} marks)</strong><p style="line-height:1.7">${esc(q.question_text)}</p></div>`).join("")}<p class="muted">The theory timer runs separately from the objective timer.</p><button class="btn btn-primary" onclick="exitTheory(false)">Exit / Finish Theory</button></div>`;
}
async function exitTheory(autoExit=false){
 if(!currentTheory)return;
 if(!autoExit&&!confirm("Have you finished writing your theory answers in your booklet? Exit this section now?"))return;
 clearInterval(theoryTimer);theoryTimer=null;
 const {error}=await sb.rpc("submit_theory_session",{p_session_id:currentTheory.sessionId,p_answers:{}});
 if(error){toast(error.message,true);startTheoryClock();return}
 currentTheory=null;
 $("content").innerHTML=`<div class="card" style="text-align:center;max-width:650px;margin:auto"><span class="eyebrow">THEORY SECTION CLOSED</span><h1>${autoExit?"Theory time has expired":"You have exited the theory section"}</h1><p class="muted">Your teacher will mark your physical answer booklet and enter the theory score. Your final result will combine objective and theory marks after marking.</p><button class="btn btn-primary" onclick="navigate('cbt')">Return to CBT Centre</button></div>`;
}
async function downloadResult(id){
 const {data:a,error}=await sb.from("exam_attempts").select("*,question_banks(name,exam_standard,subjects(name,class)),profiles(first_name,last_name,email,class)").eq("id",id).single();
 if(error)return toast(error.message,true);
 const {data:m,error:me}=await sb.from("theory_result_marks").select("score,total,marked_at").eq("attempt_id",id).maybeSingle();if(me)return toast(me.message,true);
 const theoryScore=m?.score??null,theoryTotal=m?.total??null,finalScore=Number(a.score||0)+Number(theoryScore||0),finalTotal=Number(a.total||0)+Number(theoryTotal||0);
 const theoryHtml=m?`<p><b>Theory score:</b> ${theoryScore} / ${theoryTotal}</p><p><b>Final combined score:</b> ${finalScore} / ${finalTotal} (${finalTotal?Math.round(finalScore/finalTotal*100):0}%)</p><p><b>Theory marked:</b> ${new Date(m.marked_at).toLocaleString()}</p>`:'<p><b>Theory score:</b> Pending teacher marking</p><p><b>Final combined score:</b> Pending teacher marking</p>';
  const addressHtml = SCHOOL_ADDRESSES.map(address => `<div>${esc(address)}</div>`).join("");
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CBT Result - ${esc(SCHOOL_NAME)}</title><style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px;color:#222;max-width:900px;margin:0 auto}
  .school-head{display:flex;gap:18px;align-items:center;border-bottom:3px solid #5b101c;padding-bottom:18px;margin-bottom:22px}
  .school-head img{width:100px;height:104px;object-fit:contain}.school-name{font-size:26px;font-weight:800;color:#5b101c}
  .motto{font-style:italic;color:#6d4a4d;margin:5px 0 10px}.address{font-size:12px;line-height:1.6;color:#514747}
  .box{border:1px solid #ddd;padding:20px;border-radius:10px}.footer{margin-top:22px;padding-top:12px;border-top:1px solid #ddd;font-size:12px;color:#666}
  @media print{body{padding:10mm}.box{break-inside:avoid}}
  </style></head><body>
  <header class="school-head"><img src="${SCHOOL_LOGO}" alt="Potter And Clay Schools logo"><div><div class="school-name">${esc(SCHOOL_NAME)}</div><div class="motto">${esc(SCHOOL_MOTTO)}</div><div class="address">${addressHtml}</div><div class="address">${esc(SCHOOL_PHONE)} · ${esc(SCHOOL_EMAIL)}</div></div></header>
  <div class="box"><h2>Examination Result</h2><p><b>Student:</b> ${esc(a.candidate_name||((a.profiles?.first_name||"")+" "+(a.profiles?.last_name||"")))}</p><p><b>Class:</b> ${esc(a.candidate_class||a.profiles?.class||"")}</p><p><b>Subject:</b> ${esc(a.question_banks.subjects?.name||"")}</p><p><b>Test:</b> ${esc(a.question_banks.name)}</p><p><b>Standard:</b> ${esc(a.question_banks.exam_standard||"")}</p><p><b>Date:</b> ${new Date(a.submitted_at).toLocaleString()}</p><p><b>Objective score:</b> ${a.score} / ${a.total} (${a.total?Math.round(a.score/a.total*100):0}%)</p>${theoryHtml}</div>
  <div class="footer">Official result generated by ${esc(SCHOOL_NAME)}. Please contact the school if any detail requires verification.</div></body></html>`;
 const blob=new Blob([html],{type:"text/html"}),url=URL.createObjectURL(blob),ael=document.createElement("a");ael.href=url;ael.download=`CBT-Result-${(a.profiles?.last_name||"Student")}.html`;ael.click();URL.revokeObjectURL(url);
}
async function profilePage(){
 const isStudent=profile.role==="student";
 $("content").innerHTML=`<div class="page-head"><div><h1>My Profile</h1><p>Keep your account information up to date, including class promotion and arm.</p></div></div>
 <div class="grid grid-2"><div class="card"><div class="profile-head"><img id="profileAvatar" class="avatar-lg" src="${avatar(profile.avatar_url)}"><div><h2>${esc(profile.first_name)} ${esc(profile.last_name)}</h2><p>${esc(profile.email||currentUser.email)} · ${esc(profile.role)}</p><p>${esc(profile.class||"Teacher/Admin")} ${profile.arm?esc(profile.arm):""}</p></div></div><hr style="border:0;border-top:1px solid var(--line);margin:22px 0"><div class="field"><label>Profile picture<input id="avatarFile" type="file" accept="image/*"></label></div><button class="btn btn-primary" style="margin-top:15px" onclick="uploadAvatar()">Upload picture</button></div>
 <div class="card"><h2>Account information</h2><div class="grid grid-2"><div class="field"><label>First name<input id="pf" value="${esc(profile.first_name)}"></label></div><div class="field"><label>Last name<input id="pl" value="${esc(profile.last_name)}"></label></div><div class="field"><label>Phone<input id="pp" value="${esc(profile.phone||"")}"></label></div>${isStudent?`<div class="field"><label>Assigned class<input value="${esc(profile.class||"Not assigned")}" disabled></label></div><div class="field"><label>Sex<select id="px"><option value="">Select</option><option ${profile.sex==="Male"?"selected":""}>Male</option><option ${profile.sex==="Female"?"selected":""}>Female</option></select></label></div><div class="field"><label>Arm<select id="pa"><option value="">Select arm</option><option ${profile.arm==="A"?"selected":""}>A</option><option ${profile.arm==="B"?"selected":""}>B</option><option ${profile.arm==="C"?"selected":""}>C</option><option ${profile.arm==="D"?"selected":""}>D</option></select></label></div>`:`<div class="field"><label>Class<input value="${esc(profile.class||"N/A")}" disabled></label></div>`}</div><button class="btn btn-primary" style="margin-top:15px" onclick="saveProfile()">Save changes</button></div></div>`;
}
async function saveProfile(){
 const update={first_name:$("pf").value.trim(),last_name:$("pl").value.trim(),phone:$("pp").value.trim()};
 if(profile.role==="student"){update.sex=$("px").value;update.arm=$("pa").value}
 const {data,error}=await sb.from("profiles").update(update).eq("id",currentUser.id).select().single();
 if(error)toast(error.message,true);else{profile=data;$("topName").textContent=`${profile.first_name} ${profile.last_name}`;toast("Profile updated.");profilePage()}
}

async function uploadAvatar(){
 const f=$("avatarFile").files[0];if(!f)return toast("Choose an image first.",true);
 if(!f.type.startsWith("image/"))return toast("Please select a valid image file.",true);
 if(f.size>5*1024*1024)return toast("Profile pictures must be 5 MB or smaller.",true);
 const ext=({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"})[f.type];
 if(!ext)return toast("Use a JPG, PNG, WEBP or GIF image.",true);
 const path=`${currentUser.id}/avatar.${ext}`;
 const {error}=await sb.storage.from("avatars").upload(path,f,{upsert:true,contentType:f.type});if(error)return toast(error.message,true);
 const {data}=sb.storage.from("avatars").getPublicUrl(path);const {data:p,error:pe}=await sb.from("profiles").update({avatar_url:data.publicUrl}).eq("id",currentUser.id).select().single();if(pe)return toast(pe.message,true);profile=p;$("topAvatar").src=avatar(p.avatar_url);toast("Profile picture updated.");profilePage();
}


async function teacherStudio(){
 if(!["teacher","admin"].includes(profile.role))return navigate("dashboard");
 const {data:subjects,error}=await sb.from("subjects").select("*").order("class").order("name");if(error)throw error;
 let lessons=[];
 if(profile.role==="admin"){
  const {data:allLessons,error:le}=await sb.from("lessons").select("*,subjects(name,class)").order("created_at",{ascending:false});if(le)throw le;lessons=allLessons||[];
 }else{
  const {data:as,error:ae}=await sb.from("teacher_subject_assignments").select("subject_id,class").eq("teacher_id",currentUser.id);if(ae)throw ae;
  const {data:allLessons,error:le}=await sb.from("lessons").select("*,subjects(name,class)").order("created_at",{ascending:false});if(le)throw le;
  lessons=(allLessons||[]).filter(l=>(as||[]).some(a=>a.subject_id===l.subject_id&&(!a.class||a.class===l.subjects?.class)));
 }
 $("content").innerHTML=`<div class="page-head"><div><h1>Teacher Studio</h1><p>Publish lessons, create objective/theory examinations and mark physical theory answer booklets.</p></div><button class="btn btn-primary" onclick="newLesson()">+ New lesson</button></div>
 <div class="grid grid-2"><div class="card"><h2>My lessons</h2><div class="lesson-list">${(lessons||[]).map(l=>`<div class="lesson-row"><div><h3>${esc(l.title)}</h3><p>${esc(l.subjects?.class||"")} · ${esc(l.subjects?.name||"")}</p></div><div style="display:flex;gap:6px;flex-wrap:wrap"><span class="badge ${l.published?"green":""}">${l.published?"Published":"Draft"}</span><button class="btn btn-soft" onclick="openLesson('${l.id}')">Discussion</button></div></div>`).join("")||'<div class="empty">No lessons yet.</div>'}</div></div><div class="card"><h2>Classroom tools</h2><p class="muted">Moderate comments, mute students for a subject, initiate conversations, and publish audio lectures for your assigned subjects.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="teacherClassroom()">Classroom chat & moderation</button><button class="btn btn-soft" onclick="navigate('messages')">Messages</button><button class="btn btn-soft" onclick="manageTheoryQuestions()">+ Theory questions</button><button class="btn btn-soft" onclick="teacherResults()">Results & marking</button><button class="btn btn-soft" onclick="newAssignment()">+ Assignment</button></div></div></div>`;
}
async function manageTheoryQuestions(){
 if(!["teacher","admin"].includes(profile.role))return toast("Teacher or administrator access required.",true);
 let banks=[];
 if(profile.role==="admin"){const {data,error}=await sb.from("question_banks").select("*,subjects(name,class)").order("created_at",{ascending:false});if(error)return toast(error.message,true);banks=data||[]}
 else{
  const {data:as,error:ae}=await sb.from("teacher_subject_assignments").select("subject_id,class").eq("teacher_id",currentUser.id);if(ae)return toast(ae.message,true);
  if(!as?.length)return toast("No subjects or classes have been assigned to your account yet.",true);
  const {data,error}=await sb.from("question_banks").select("*,subjects(name,class)").order("created_at",{ascending:false});if(error)return toast(error.message,true);
  banks=(data||[]).filter(b=>as.some(a=>a.subject_id===b.subject_id&&(!a.class||a.class===b.class)));
 }
 if(!banks.length)return toast("No question banks are available for your assigned subjects/classes.",true);
 showModal(`<h2>Set theory examination</h2><p class="muted">New questions are appended so existing student exam sessions are not damaged.</p><form id="theoryForm" class="field"><label>Question bank<select id="tbank">${banks.map(b=>`<option value="${b.id}">${esc(b.class)} · ${esc(b.subjects?.name)} · ${esc(b.name)}</option>`).join("")}</select></label><label>Theory duration (minutes)<input id="tduration" type="number" min="1" max="300" value="60" required></label><label>New questions (one per line; use a blank line between questions if you need paragraphs)<textarea id="tquestions" rows="8" required placeholder="1. Explain ...\n\n2. Describe ..."></textarea></label><label>Marks per question<input id="tmarks" type="number" min="0.5" step="0.5" value="10" required></label><button class="btn btn-primary" type="submit">Add theory questions</button></form>`);
 $("tbank").onchange=async()=>{const {data:b,error}=await sb.from("question_banks").select("theory_duration_minutes").eq("id",$("tbank").value).single();if(error)return toast(error.message,true);$("tduration").value=b?.theory_duration_minutes||60};
 $("theoryForm").onsubmit=async e=>{e.preventDefault();const bankId=$("tbank").value,duration=Number($("tduration").value),marks=Number($("tmarks").value);if(!Number.isFinite(duration)||duration<1||duration>300)return toast("Theory duration must be between 1 and 300 minutes.",true);if(!Number.isFinite(marks)||marks<=0)return toast("Marks per question must be greater than zero.",true);const qs=$("tquestions").value.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);if(!qs.length)return toast("Enter at least one theory question.",true);const {data:used,error:se}=await sb.from("theory_sessions").select("id").eq("bank_id",bankId).limit(1);if(se)return toast(se.message,true);if(used?.length)return toast("This question bank already has theory sessions. Create a new bank to change its theory questions, so previous exams remain fair.",true);const {data:old,error:qe}=await sb.from("theory_questions").select("position").eq("bank_id",bankId).order("position",{ascending:false}).limit(1);if(qe)return toast(qe.message,true);const start=(old?.[0]?.position||0)+1;const {error:ue}=await sb.from("question_banks").update({theory_duration_minutes:duration}).eq("id",bankId);if(ue)return toast(ue.message,true);const payload=qs.map((question_text,i)=>({bank_id:bankId,question_text:question_text.replace(/^\d+[.)]\s*/,''),marks,position:start+i,created_by:currentUser.id}));const {error:ie}=await sb.from("theory_questions").insert(payload);if(ie)return toast(ie.message,true);closeModal();toast("Theory questions added.");teacherStudio()};
}
async function teacherResults(){
 if(!["teacher","admin"].includes(profile.role))return toast("Teacher or administrator access required.",true);
 let allowed=null;
 if(profile.role==="teacher"){
  const {data:as,error:ae}=await sb.from("teacher_subject_assignments").select("subject_id,class").eq("teacher_id",currentUser.id);if(ae)return toast(ae.message,true);if(!as?.length)return toast("No subjects or classes have been assigned to your account yet.",true);
  const {data:banks,error:be}=await sb.from("question_banks").select("id,subject_id,class");if(be)return toast(be.message,true);allowed=(banks||[]).filter(b=>as.some(a=>a.subject_id===b.subject_id&&(!a.class||a.class===b.class))).map(b=>b.id);if(!allowed.length)return toast("No question banks match your assignments.",true);
 }
 let q=sb.from("exam_attempts").select("*,question_banks(name,class,subjects(name)),profiles(first_name,last_name,class,sex,arm)").not("submitted_at","is",null).order("submitted_at",{ascending:false}).limit(500);if(allowed)q=q.in("bank_id",allowed);
 const {data:attempts,error}=await q;if(error)return toast(error.message,true);
 const {data:sessions,error:se}=await sb.from("theory_sessions").select("attempt_id,status").eq("status","completed");if(se)return toast(se.message,true);
 const {data:marks,error:me}=await sb.from("theory_result_marks").select("*");if(me)return toast(me.message,true);
 const completed=new Set((sessions||[]).map(x=>x.attempt_id)),rows=(attempts||[]).filter(a=>completed.has(a.id)).map(a=>({...a,tm:(marks||[]).find(m=>m.attempt_id===a.id)}));
 showModal(`<h2>Exam results & theory marking</h2><p class="muted">Mark the physical answer booklet, then enter one total theory score. Final score = objective score + theory score. Only completed theory sessions are listed.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Class/Arm</th><th>Subject / test</th><th>Objective</th><th>Theory mark</th><th>Final score</th><th>Action</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${esc(a.candidate_name||((a.profiles?.first_name||"")+" "+(a.profiles?.last_name||"")))}</td><td>${esc(a.candidate_class||a.profiles?.class||"")} ${esc(a.candidate_arm||a.profiles?.arm||"")}</td><td>${esc(a.question_banks?.subjects?.name||a.question_banks?.name||"")}</td><td>${a.score}/${a.total}</td><td>${a.tm?`${a.tm.score}/${a.tm.total}`:"Not marked"}</td><td>${a.tm?`${Number(a.score||0)+Number(a.tm.score||0)} / ${Number(a.total||0)+Number(a.tm.total||0)}`:"Pending theory mark"}</td><td><button class="btn btn-soft" onclick="markTheory('${a.id}',${Number(a.tm?.score||0)},${Number(a.tm?.total||0)})">Enter total</button></td></tr>`).join("")||'<tr><td colspan="7">No completed theory sessions are ready for marking.</td></tr>'}</tbody></table></div><button class="btn btn-primary" onclick="downloadTeacherResults()">Download results CSV</button>`);
}
async function markTheory(attemptId,oldScore=0,oldTotal=0){
 const {data:a,error:ae}=await sb.from("exam_attempts").select("id,bank_id,student_id,score,total,question_banks(name)").eq("id",attemptId).single();if(ae||!a)return toast(ae?.message||"Exam attempt not found.",true);
 const {data:questions,error:qe}=await sb.from("theory_questions").select("marks").eq("bank_id",a.bank_id);if(qe)return toast(qe.message,true);
 const total=(questions||[]).reduce((sum,q)=>sum+Number(q.marks||1),0);if(total<=0)return toast("No theory questions or maximum marks are configured.",true);
 const {data:existing}=await sb.from("theory_result_marks").select("teacher_notes").eq("attempt_id",attemptId).maybeSingle();
 showModal(`<h2>Enter total theory mark</h2><p class="muted">${esc(a.question_banks?.name||"Examination")} · Maximum theory marks: ${total}. Mark the physical answer booklet first.</p><form id="markForm" class="field"><label>Theory score<input id="mscore" type="number" min="0" max="${total}" step="0.5" value="${oldScore}" required></label><label>Teacher's notes<textarea id="mnotes" rows="3">${esc(existing?.teacher_notes||"")}</textarea></label><button class="btn btn-primary" type="submit">Save total mark</button></form>`);
 $("markForm").onsubmit=async e=>{e.preventDefault();const score=Number($("mscore").value);if(!Number.isFinite(score)||score<0||score>total)return toast("Score must be between 0 and "+total,true);const {error}=await sb.rpc("save_theory_total_mark",{p_attempt_id:attemptId,p_score:score,p_teacher_notes:$("mnotes").value.trim()||null});if(error)return toast(error.message,true);toast("Theory score saved.");teacherResults()};
}
async function downloadTeacherResults(){
 if(!["teacher","admin"].includes(profile.role))return toast("Teacher or administrator access required.",true);
 let allowed=null;
 if(profile.role==="teacher"){
  const {data:as,error:ae}=await sb.from("teacher_subject_assignments").select("subject_id,class").eq("teacher_id",currentUser.id);if(ae)return toast(ae.message,true);if(!as?.length)return toast("No subjects or classes have been assigned to your account yet.",true);
  const {data:banks,error:be}=await sb.from("question_banks").select("id,subject_id,class");if(be)return toast(be.message,true);allowed=(banks||[]).filter(b=>as.some(a=>a.subject_id===b.subject_id&&(!a.class||a.class===b.class))).map(b=>b.id);if(!allowed.length)return toast("No question banks match your assignments.",true);
 }
 let q=sb.from("exam_attempts").select("*,question_banks(name,subjects(name)),profiles(first_name,last_name,class,sex,arm)").not("submitted_at","is",null).order("submitted_at",{ascending:false}).limit(2000);if(allowed)q=q.in("bank_id",allowed);
 const [{data:attempts,error},{data:marks,error:me}]=await Promise.all([q,sb.from("theory_result_marks").select("*")]);if(error)return toast(error.message,true);if(me)return toast(me.message,true);
 const rows=[["Student","Class","Sex","Arm","Subject","Exam","Objective Score","Objective Total","Theory Score","Theory Total","Final Score","Final Total","Theory Status","Date"]];
 (attempts||[]).forEach(a=>{const m=(marks||[]).find(x=>x.attempt_id===a.id);rows.push([a.candidate_name||((a.profiles?.first_name||"")+" "+(a.profiles?.last_name||"")),a.candidate_class||a.profiles?.class||"",a.candidate_sex||a.profiles?.sex||"",a.candidate_arm||a.profiles?.arm||"",a.question_banks?.subjects?.name||"",a.question_banks?.name||"",a.score,a.total,m?.score??"",m?.total??"",Number(a.score||0)+Number(m?.score||0),Number(a.total||0)+Number(m?.total||0),m?"Marked":"Not marked",a.submitted_at||""])});
 const csv=rows.map(r=>r.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\r\n");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="potter-clay-exam-results.csv";a.click();URL.revokeObjectURL(url);
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
 let subjects=[];
 if(profile.role==="admin"){
  const {data,error}=await sb.from("subjects").select("*").order("class").order("name");if(error)return toast(error.message,true);subjects=data||[];
 }else{
  const {data:as,error:ae}=await sb.from("teacher_subject_assignments").select("subject_id,class").eq("teacher_id",currentUser.id);if(ae)return toast(ae.message,true);
  const {data:ss,error:se}=await sb.from("subjects").select("*").order("class").order("name");if(se)return toast(se.message,true);
  subjects=(ss||[]).filter(s=>(as||[]).some(a=>a.subject_id===s.id&&(!a.class||a.class===s.class)));
 }
 if(!subjects.length)return toast("You must be assigned to a subject before publishing lessons or audio lectures.",true);
 showModal(`<h2>Create lesson / audio lecture</h2><p class="muted">Teachers can publish resources only for their assigned subjects.</p><form id="lessonForm" class="field">
 <label>Assigned subject<select id="ls">${subjects.map(s=>`<option value="${s.id}">${esc(s.class)} · ${esc(s.name)}</option>`).join("")}</select></label>
 <label>Title<input id="lt" required></label><label>Summary<input id="lm"></label><label>Lesson content<textarea id="lc" rows="8" placeholder="For an audio-only lecture, enter a short description." required></textarea></label>
 <label>Lesson note / PDF<input id="ln" type="file" accept=".pdf,.doc,.docx"></label>
 <label>Audio lecture (MP3, M4A, WAV, OGG or WEBM; max 50 MB)<input id="la" type="file" accept="audio/*"></label>
 <label>Duration (minutes)<input id="ld" type="number" min="1" max="600" value="30" required></label>
 <button class="btn btn-primary" type="submit">Publish lesson</button></form>`);
 $("lessonForm").onsubmit=async e=>{e.preventDefault();const note=$("ln").files[0],audio=$("la").files[0],subjectId=$("ls").value;let noteUrl=null,audioUrl=null;
  if(audio){if(!audio.type.startsWith("audio/"))return toast("Please select a valid audio file.",true);if(audio.size>50*1024*1024)return toast("Audio lectures must be 50 MB or smaller.",true);}
  if(note){const path=`${currentUser.id}/${Date.now()}-${note.name}`;const r=await sb.storage.from("lesson-files").upload(path,note);if(r.error)return toast(r.error.message,true);noteUrl=sb.storage.from("lesson-files").getPublicUrl(path).data.publicUrl}
  if(audio){const safeName=audio.name.replace(/[^a-zA-Z0-9._-]/g,"_");const path=`${subjectId}/${currentUser.id}/${Date.now()}-${safeName}`;const r=await sb.storage.from("audio-lectures").upload(path,audio,{contentType:audio.type,upsert:false});if(r.error)return toast("Audio upload failed: "+r.error.message,true);audioUrl=sb.storage.from("audio-lectures").getPublicUrl(path).data.publicUrl}
  const {error}=await sb.from("lessons").insert({subject_id:subjectId,teacher_id:currentUser.id,title:$("lt").value.trim(),summary:$("lm").value.trim()||null,content:$("lc").value.trim(),duration_minutes:Number($("ld").value),notes_url:noteUrl,audio_url:audioUrl,published:true});
  if(error)toast(error.message,true);else{closeModal();toast(audioUrl?"Lesson and audio lecture published.":"Lesson published.");teacherStudio()}
 };
}

async function saveGeneralAnnouncement(){
 if(profile?.role!=="admin")return toast("Only an administrator can publish announcements.",true);
 const field=$("announcementText");
 const message=(field?.value||"").trim();
 if(!message)return toast("Enter an announcement first.",true);
 const {data:existing,error:readError}=await sb.from("general_announcements").select("id").eq("active",true).limit(1);
 if(readError)return toast("Unable to check existing announcements: "+readError.message,true);
 if(existing?.length){
  const {error}=await sb.from("general_announcements").update({message,active:true,updated_at:new Date().toISOString()}).eq("id",existing[0].id);
  if(error)return toast("Unable to update announcement: "+error.message,true);
 }else{
  const {error}=await sb.from("general_announcements").insert({message,active:true,created_by:currentUser.id});
  if(error)return toast("Unable to publish announcement: "+error.message,true);
 }
 toast("Announcement published. It will scroll on dashboards.");
 await adminPanel();
}
async function stopGeneralAnnouncement(){
 if(profile?.role!=="admin")return toast("Only an administrator can stop announcements.",true);
 const {error}=await sb.from("general_announcements").update({active:false,updated_at:new Date().toISOString()}).eq("active",true);
 if(error)return toast("Unable to stop announcement: "+error.message,true);
 toast("Announcement stopped.");
 await adminPanel();
}

async function adminPeoplePage(role){
 if(profile?.role!=="admin")return navigate("dashboard");
 const roleLabel=role==="student"?"Students":role==="teacher"?"Teachers":"Administrators";
 const {data:people,error}=await sb.from("profiles").select("*").eq("role",role).order("created_at",{ascending:false}).limit(500);
 if(error)throw error;
 const actionButtons=(p)=>`<button class="btn btn-soft" onclick="adminChangeClass('${p.id}')" ${role!=="student"?"disabled":""}>Change class</button>
 <button class="btn btn-soft" onclick="adminToggleActive('${p.id}',${p.is_active!==false})">${p.is_active===false?"Restore access":"Disable access"}</button>`;
 $("content").innerHTML=`<div class="page-head"><div><h1>${roleLabel}</h1><p>Manage ${roleLabel.toLowerCase()} separately from other account types.</p></div><button class="btn btn-soft" onclick="navigate('admin')">← Admin Control</button></div>
 <div class="card stat"><strong>${people?.length||0}</strong><span>${roleLabel} accounts</span></div>
 <div class="card" style="margin-top:18px"><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th>${role==="student"?"<th>Class</th>":""}<th>Status</th><th>Actions</th></tr></thead><tbody>
 ${(people||[]).map(p=>`<tr><td>${esc([p.first_name,p.last_name].filter(Boolean).join(" ")||"Unnamed user")}</td><td>${esc(p.email||"")}</td>${role==="student"?`<td>${esc(p.class||"Not assigned")}</td>`:""}<td><span class="badge ${p.is_active===false?"red":"green"}">${p.is_active===false?"Inactive":"Active"}</span></td><td><div style="display:flex;gap:6px;flex-wrap:wrap">${actionButtons(p)}</div></td></tr>`).join("")||`<tr><td colspan="${role==="student"?5:4}">No ${roleLabel.toLowerCase()} found.</td></tr>`}
 </tbody></table></div></div>`;
}
async function adminChangeClass(id){
 if(profile?.role!=="admin")return toast("Only administrators can change a student's class.",true);
 const choices=["JSS 1","JSS 2","JSS 3","SS 1","SS 2","SS 3"];
 const value=prompt("Enter the student's new class:\n"+choices.join(", "));
 if(!value)return;
 const normalized=choices.find(c=>c.toLowerCase()===value.trim().toLowerCase());
 if(!normalized)return toast("Choose one of: "+choices.join(", "),true);
 const {error}=await sb.from("profiles").update({class:normalized}).eq("id",id);
 if(error)return toast("Unable to change class: "+error.message,true);
 toast("Student class updated.");
 await adminPeoplePage("student");
}
async function adminToggleActive(id,currentActive){
 if(profile?.role!=="admin")return toast("Only administrators can change account access.",true);
 const action=currentActive?"disable":"restore";
 if(!confirm(`Are you sure you want to ${action} this account?`))return;
 const {error}=await sb.from("profiles").update({is_active:!currentActive}).eq("id",id);
 if(error)return toast("Unable to update account: "+error.message,true);
 toast(currentActive?"Account disabled.":"Account restored.");
 const page=currentPage==="admin-students"?"student":currentPage==="admin-teachers"?"teacher":"admin";
 await adminPeoplePage(page);
}

async function adminPanel(){
 if(profile.role!=="admin")return navigate("dashboard");
 const [{data:profiles},{data:codes},{data:attempts},{data:academic}]=await Promise.all([
  sb.from("profiles").select("*").order("created_at",{ascending:false}).limit(100),
  sb.from("cbt_codes").select("*,question_banks(name),profiles(first_name,last_name)").order("created_at",{ascending:false}).limit(50),
  sb.from("exam_attempts").select("*,question_banks(name),profiles(first_name,last_name,class)").order("submitted_at",{ascending:false}).limit(50),
  sb.from("academic_settings").select("academic_session,updated_at").eq("id",1).maybeSingle()
 ]);
 $("content").innerHTML=`<div class="page-head"><div><h1>Admin Control</h1><p>School-wide LMS management.</p></div><div style="display:flex;gap:8px"><button class="btn btn-soft" onclick="generateCode()">+ Generate CBT code</button><button class="btn btn-soft" onclick="generateBulkCodes()">Bulk codes</button><button class="btn btn-soft" onclick="manageAccounts()">Manage accounts</button><button class="btn btn-soft" onclick="manageTeacherAssignments()">Teacher assignments</button><button class="btn btn-soft" onclick="addQuestion()">+ Add question</button><button class="btn btn-soft" onclick="bulkImportQuestions()">⇧ Import CSV</button><button class="btn btn-primary" onclick="manageQuestionBank()">+ Question bank</button></div></div>
 <div class="card" style="margin-top:20px;border-left:5px solid #8f1827">
 <div class="page-head"><div><h2>📢 General Announcements</h2><p>Announcements appear on every user's dashboard and scroll continuously until you stop or change them.</p></div></div>
 <textarea id="announcementText" rows="3" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:10px" placeholder="Type the announcement everyone should see..."></textarea>
 <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
  <button class="btn btn-primary" onclick="saveGeneralAnnouncement()">Publish / Update announcement</button>
  <button class="btn btn-soft" onclick="stopGeneralAnnouncement()">Stop scrolling</button>
 </div>
 <div id="announcementAdminStatus" class="muted" style="margin-top:8px"></div>
</div>
<div class="card" style="margin:18px 0;border-left:5px solid #5b101c">
 <h2>Academic Session</h2><p>Current session: <strong>${esc(academic?.academic_session||"Not set")}</strong></p>
 <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
 <input id="academicSessionInput" type="text" maxlength="30" placeholder="e.g. 2026/2027" value="${esc(academic?.academic_session||"")}" style="padding:11px;border:1px solid #ddd;border-radius:8px;min-width:220px">
 <button class="btn btn-primary" onclick="saveAcademicSession()">Update academic session</button></div>
 <p class="muted" style="margin-top:8px">Last changed: ${academic?.updated_at?esc(formatLmsDateTime(new Date(academic.updated_at))):"Not yet set"}</p>
</div>
<div class="grid grid-4"><div class="card stat"><strong>${profiles?.length||0}</strong><span>Users</span></div><div class="card stat"><strong>${profiles?.filter(x=>x.role==="student").length||0}</strong><span>Students</span></div><div class="card stat"><strong>${profiles?.filter(x=>x.role==="teacher").length||0}</strong><span>Teachers</span></div><div class="card stat"><strong>${attempts?.length||0}</strong><span>Recent CBT attempts</span></div></div>
 <div class="grid grid-2" style="margin-top:20px"><div class="card"><h2>CBT access codes</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Bank</th><th>Uses</th><th>Status</th></tr></thead><tbody>${(codes||[]).map(c=>`<tr><td><strong>${esc(c.code)}</strong></td><td>${esc(c.question_banks?.name||"")}</td><td>${c.uses}/${c.max_uses}</td><td><span class="badge ${c.active&&c.uses<c.max_uses?"green":"red"}">${c.active&&c.uses<c.max_uses?"Active":"Closed"}</span></td></tr>`).join("")||"<tr><td colspan='4'>No codes.</td></tr>"}</tbody></table></div></div>
 <div class="card"><h2>Recent CBT activity</h2><div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Test</th><th>Score</th></tr></thead><tbody>${(attempts||[]).map(a=>`<tr><td>${esc((a.profiles?.first_name||"")+" "+(a.profiles?.last_name||""))}</td><td>${esc(a.question_banks?.name||"")}</td><td><strong>${a.score}/${a.total}</strong></td></tr>`).join("")||"<tr><td colspan='3'>No attempts.</td></tr>"}</tbody></table></div></div></div>
 <div class="card" style="margin-top:20px"><h2>User accounts</h2><p class="muted">Promote students when a new session begins, or remove departing students and teachers by disabling their LMS access. Historical results and records are preserved.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Class</th><th>Account status</th><th>Actions</th></tr></thead><tbody>${(profiles||[]).map(p=>`<tr><td>${esc(p.first_name+" "+p.last_name)}</td><td>${esc(p.email||"")}</td><td><span class="badge">${esc(p.role)}</span></td><td>${esc(p.class||"—")}</td><td><span class="badge ${p.is_active===false?"red":"green"}">${p.is_active===false?"Removed / inactive":"Active"}</span></td><td style="display:flex;gap:6px;flex-wrap:wrap">${p.role==="student"?`<button class="btn btn-soft" onclick="changeStudentClass('${p.id}')">Change class</button>`:""}${["student","teacher"].includes(p.role)&&p.id!==currentUser.id?`<button class="btn ${p.is_active===false?"btn-primary":"btn-soft"}" onclick="setLmsAccountStatus('${p.id}',${p.is_active===false?"true":"false"})">${p.is_active===false?"Restore access":"Remove from LMS"}</button>`:""}</td></tr>`).join("")||"<tr><td colspan='6'>No user accounts found.</td></tr>"}</tbody></table></div></div>`;
}

async function setLmsAccountStatus(userId, shouldActivate){
 if(profile?.role!=="admin")return toast("Administrator access required.",true);
 if(userId===currentUser?.id)return toast("You cannot remove or disable your own current account.",true);
 const {data:user,error}=await sb.from("profiles").select("id,first_name,last_name,email,role,is_active").eq("id",userId).maybeSingle();
 if(error||!user)return toast(error?.message||"User account not found.",true);
 if(!["student","teacher"].includes(user.role))return toast("Only student and teacher accounts can be removed from the LMS here.",true);
 const activate=shouldActivate===true;
 const verb=activate?"restore access for":"remove from the LMS";
 const explanation=activate?"They will be able to sign in again.":"Their LMS access will be disabled. Their profile, exam results, comments, lessons and other historical records will be retained.";
 if(!confirm(`Are you sure you want to ${verb} ${user.first_name} ${user.last_name} (${user.email||"no email"})?\n\n${explanation}`))return;
 const {data:updated,error:updateError}=await sb.from("profiles").update({is_active:activate}).eq("id",user.id).in("role",["student","teacher"]).select("id,is_active").maybeSingle();
 if(updateError)return toast(updateError.message,true);
 if(!updated)return toast("The account status was not changed. Check administrator permissions and try again.",true);
 toast(activate?"LMS access restored.":"Account removed from active LMS use. Historical records were preserved.");
 await adminPanel();
}

async function changeStudentClass(studentId){
 if(profile?.role!=="admin")return toast("Administrator access required.",true);
 const {data:student,error}=await sb.from("profiles").select("id,first_name,last_name,email,role,class").eq("id",studentId).maybeSingle();
 if(error||!student)return toast(error?.message||"Student account not found.",true);
 if(student.role!=="student")return toast("Only student accounts can be promoted using this action.",true);
 const classes=["JSS 1","JSS 2","JSS 3","SS 1","SS 2","SS 3"];
 const options=classes.map(c=>`<option value="${c}" ${student.class===c?"selected":""}>${c}</option>`).join("");
 showModal(`<h2>Change student's class</h2><p class="muted">${esc(student.first_name+" "+student.last_name)} · ${esc(student.email||"")}</p><p>Current class: <strong>${esc(student.class||"Not assigned")}</strong></p><form id="changeStudentClassForm" class="field"><label>New class<select id="newStudentClass" required>${options}</select></label><p class="muted">This updates the student's official class. Check subject access, teacher assignments and any active exams after promotion.</p><button class="btn btn-primary" type="submit">Save class change</button></form>`);
 $("changeStudentClassForm").onsubmit=async e=>{
  e.preventDefault();
  const newClass=$("newStudentClass").value;
  if(!classes.includes(newClass))return toast("Select a valid school class.",true);
  if(newClass===student.class)return toast("The student is already in that class.",true);
  if(!confirm(`Change ${student.first_name} ${student.last_name} from ${student.class||"unassigned"} to ${newClass}?`))return;
  const {data:updated,error:updateError}=await sb.from("profiles").update({class:newClass}).eq("id",student.id).eq("role","student").select("id,class").maybeSingle();
  if(updateError)return toast(updateError.message,true);
  if(!updated)return toast("The class was not changed. Check administrator permissions and try again.",true);
  closeModal();toast(`Student promoted to ${newClass}.`);await adminPanel();
 };
}

async function manageTeacherAssignments(){
 if(profile.role!=="admin")return toast("Administrator access required.",true);
 const [{data:teachers,error:te},{data:subjects,error:se},{data:assignments,error:ae}]=await Promise.all([sb.from("profiles").select("id,first_name,last_name,email").eq("role","teacher").order("first_name"),sb.from("subjects").select("id,name,class").order("class").order("name"),sb.from("teacher_subject_assignments").select("id,teacher_id,subject_id,class,profiles(first_name,last_name),subjects(name)").order("created_at",{ascending:false})]);
 if(te||se||ae)return toast(te?.message||se?.message||ae?.message,true);if(!teachers?.length)return toast("Create a teacher account before assigning subjects.",true);if(!subjects?.length)return toast("Create subjects before assigning teachers.",true);
 showModal(`<h2>Teacher subject assignments</h2><p class="muted">Assign a teacher to a subject. The class is taken from that subject's class.</p><form id="teacherAssignForm" class="field"><label>Teacher<select id="assignTeacher">${teachers.map(t=>`<option value="${t.id}">${esc(t.first_name+" "+t.last_name)} · ${esc(t.email||"")}</option>`).join("")}</select></label><label>Subject and class<select id="assignSubject">${subjects.map(x=>`<option value="${x.id}">${esc(x.class)} · ${esc(x.name)}</option>`).join("")}</select></label><button class="btn btn-primary" type="submit">Assign subject</button></form><h3 style="margin-top:24px">Current assignments</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>Teacher</th><th>Class</th><th>Subject</th></tr></thead><tbody>${(assignments||[]).map(a=>`<tr><td>${esc((a.profiles?.first_name||"")+" "+(a.profiles?.last_name||""))}</td><td>${esc(a.class||"All assigned classes")}</td><td>${esc(a.subjects?.name||"")}</td></tr>`).join("")||'<tr><td colspan="3">No teacher assignments yet.</td></tr>'}</tbody></table></div>`);
 $("teacherAssignForm").onsubmit=async e=>{e.preventDefault();const teacherId=$("assignTeacher").value,subjectId=$("assignSubject").value,subject=subjects.find(x=>x.id===subjectId);if(!subject)return toast("Select a valid subject.",true);if((assignments||[]).some(a=>a.teacher_id===teacherId&&a.subject_id===subjectId))return toast("This teacher is already assigned to this subject.",true);const {error}=await sb.from("teacher_subject_assignments").insert({teacher_id:teacherId,subject_id:subjectId,class:subject.class});if(error)return toast(error.message,true);toast("Teacher assigned to "+subject.class+" "+subject.name+".");manageTeacherAssignments()};
}
async function manageAccounts(){
 if(profile.role!=="admin")return toast("Administrator access required.",true);
 const email=prompt("Enter the exact email address of the student or teacher account:");
 if(!email)return;
 const {data:p,error}=await sb.from("profiles").select("id,first_name,last_name,email,role,is_active").ilike("email",email.trim()).maybeSingle();
 if(error||!p)return toast(error?.message||"Account not found.",true);
 if(p.id===currentUser.id)return toast("You cannot disable your own current admin account.",true);
 const currentlyActive=p.is_active!==false;
 const action=currentlyActive?"disable":"re-enable";
 if(!confirm("Do you want to "+action+" "+p.first_name+" "+p.last_name+" ("+p.email+")?"))return;
 const {error:ue}=await sb.from("profiles").update({is_active:!currentlyActive}).eq("id",p.id);
 if(ue)return toast(ue.message,true);
 toast("Account "+(currentlyActive?"disabled":"re-enabled")+".");adminPanel();
}
async function generateBulkCodes(){
 if(profile.role!=="admin")return toast("Administrator access required.",true);
 const {data:banks,error}=await sb.from("question_banks").select("*,subjects(name,class)").eq("active",true).order("created_at",{ascending:false});
 if(error)return toast(error.message,true);if(!banks?.length)return toast("Create an active question bank first.",true);
 showModal(`<h2>Generate bulk CBT access codes</h2><form id="bulkCodeForm" class="field"><label>Question bank<select id="bulkCodeBank">${banks.map(b=>`<option value="${b.id}">${esc(b.class)} · ${esc(b.subjects?.name)} · ${esc(b.name)}</option>`).join("")}</select></label><label>Number of codes (1–200)<input id="bulkCodeCount" type="number" min="1" max="200" value="20" required></label><label>Expiry (optional)<input id="bulkCodeExpiry" type="datetime-local"></label><button class="btn btn-primary" type="submit">Generate codes</button></form>`);
 $("bulkCodeForm").onsubmit=async e=>{e.preventDefault();const count=Math.max(1,Math.min(200,Number($("bulkCodeCount").value)||1)),bankId=$("bulkCodeBank").value,expiry=$("bulkCodeExpiry").value?new Date($("bulkCodeExpiry").value).toISOString():null,codes=[];
 for(let i=0;i<count;i++){const code=("PCS-"+crypto.randomUUID().replaceAll("-","").slice(0,8)).toUpperCase();const {error:ie}=await sb.from("cbt_codes").insert({code,bank_id:bankId,student_id:null,expires_at:expiry,created_by:currentUser.id});if(ie)return toast("Stopped after "+codes.length+" code(s): "+ie.message,true);codes.push(code)}
 showModal(`<h2>${codes.length} CBT codes generated</h2><p class="muted">Each code follows the existing two-use rule. Copy and distribute them securely.</p><textarea id="bulkCodesText" rows="10" style="width:100%">${codes.join("\n")}</textarea><button class="btn btn-primary" onclick="navigator.clipboard.writeText(document.getElementById('bulkCodesText').value).then(()=>toast('Codes copied')).catch(()=>toast('Select and copy the codes manually',true))">Copy codes</button>`);
 };
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
function normalizeSchoolClass(value){
 const raw=String(value||'').trim().replace(/\s+/g,' ');
 const key=raw.toUpperCase().replace(/\s+/g,'');
 const map={'JSS1':'JSS 1','JSS2':'JSS 2','JSS3':'JSS 3','SS1':'SS 1','SS2':'SS 2','SS3':'SS 3'};
 return map[key]||raw;
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
   rows.forEach(r=>{const cls=normalizeSchoolClass(r.class),subject=r.subject.trim(),bank=r.bank_name.trim(),key=[cls.toLowerCase(),subject.toLowerCase(),bank.toLowerCase()].join('|');if(!groups.has(key))groups.set(key,{className:cls,subjectName:subject,bankName:bank,rows:[]});groups.get(key).rows.push(r)});
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
