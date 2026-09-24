let auth=null,db=null,firebaseReady=false;
try{
  firebase.initializeApp(firebaseConfig);
  auth=firebase.auth(); db=firebase.firestore(); firebaseReady=true;
  auth.onAuthStateChanged(u=>{ if(u && document.getElementById('dashboard').classList.contains('active')) loadBookings(u.uid); });
}catch(e){console.error(e)}
function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id).classList.add('active');window.scrollTo({top:0,behavior:'smooth'});if(id==='dashboard'&&auth?.currentUser)loadBookings(auth.currentUser.uid)}
function pick(a){document.getElementById('activity').value=a;showView('register')}
function msg(el,t,ok=false){el.textContent=t;el.className='msg '+(ok?'ok':'error')}
function prepareExistingUser(){if(auth?.currentUser){email.value=auth.currentUser.email||'';email.disabled=true;password.required=false;password.placeholder='غير مطلوب لأنك مسجل دخول';}}
document.getElementById('regForm').addEventListener('submit',async e=>{
 e.preventDefault(); const m=document.getElementById('formMsg'); if(!firebaseReady)return msg(m,'تعذر الاتصال بقاعدة البيانات.');
 const data={parentName:parentName.value.trim(),phone:phone.value.trim(),email:email.value.trim(),childName:childName.value.trim(),age:Number(age.value),activity:activity.value,date:date.value,notes:notes.value.trim(),location:'حديقة الراجحي - تبوك',status:'مؤكد',createdAt:firebase.firestore.FieldValue.serverTimestamp()};
 try{
   let u=auth.currentUser;
   if(!u){const c=await auth.createUserWithEmailAndPassword(data.email,password.value);u=c.user;}
   const parentId=u.uid;
   await db.collection('users').doc(parentId).set({name:data.parentName,phone:data.phone,email:u.email||data.email,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
   const childRef=await db.collection('children').add({parentId,name:data.childName,age:data.age,notes:data.notes,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
   await db.collection('bookings').add({parentId,childId:childRef.id,childName:data.childName,age:data.age,activity:data.activity,date:data.date,notes:data.notes,location:data.location,status:data.status,createdAt:data.createdAt});
   msg(m,'تم حفظ التسجيل والحجز بنجاح ✓',true); setTimeout(()=>showView('dashboard'),600);
 }catch(err){msg(m,arabicError(err));}
});
document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();const m=document.getElementById('loginMsg');try{await auth.signInWithEmailAndPassword(loginEmail.value.trim(),loginPassword.value);showView('dashboard')}catch(err){msg(m,arabicError(err))}});
document.getElementById('logoutBtn').onclick=async()=>{if(auth)await auth.signOut();email.disabled=false;password.required=true;showView('home')};
async function loadBookings(uid){const box=document.getElementById('bookings');box.innerHTML='<div class="empty">جارٍ تحميل الحجوزات...</div>';try{const snap=await db.collection('bookings').where('parentId','==',uid).get();if(snap.empty){box.innerHTML='<div class="empty">لا توجد حجوزات حتى الآن.</div>';return}const rows=[];snap.forEach(d=>rows.push(d.data()));rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));box.innerHTML=rows.map(x=>`<article class="booking"><div><h3>${esc(x.childName)} — ${esc(x.activity)}</h3><p>📅 ${esc(x.date)} · 📍 حديقة الراجحي، تبوك</p><p>العمر: ${x.age} سنوات</p></div><span class="status">${esc(x.status||'مؤكد')}</span></article>`).join('')}catch(e){console.error(e);box.innerHTML='<div class="empty">تعذر تحميل الحجوزات.</div>'}}
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function arabicError(e){if(e.code==='auth/email-already-in-use')return 'البريد مسجل مسبقًا. استخدم تسجيل الدخول.';if(e.code==='auth/invalid-credential'||e.code==='auth/wrong-password'||e.code==='auth/user-not-found')return 'البريد أو كلمة المرور غير صحيحة.';if(e.code==='auth/weak-password')return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';if(e.code==='permission-denied')return 'تم رفض الحفظ بواسطة قواعد الحماية.';return 'حدث خطأ: '+(e.message||'حاول مرة أخرى')}