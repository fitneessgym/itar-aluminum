import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MapPin, Navigation, ShieldCheck, UserCheck, UserX, Clock3, Camera, RefreshCw } from "lucide-react";
import { Badge, Btn, Card, fieldClass } from "./ui-bits";
import { TEAM_LABEL, type Employee, useItar } from "@/lib/itar-store";
import { qty } from "@/lib/format";

function distanceMeters(aLat:number,aLng:number,bLat:number,bLng:number){
  const R=6371000, p1=aLat*Math.PI/180,p2=bLat*Math.PI/180, dp=(bLat-aLat)*Math.PI/180, dl=(bLng-aLng)*Math.PI/180;
  const x=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function time(v?:string){ return v ? new Date(v).toLocaleTimeString("ar",{hour:"2-digit",minute:"2-digit"}) : "—"; }
function day(v?:string){ return v ? new Date(v).toLocaleDateString("ar") : "—"; }

export function EmployeeView(){
  const employees=useItar(s=>s.employees);
  const attendance=useItar(s=>s.attendance);
  const pings=useItar(s=>s.gpsPings);
  const sites=useItar(s=>s.workSites);
  const [selected,setSelected]=useState(employees[0]?.id??"");
  const [tracking,setTracking]=useState(false);
  const [permission,setPermission]=useState<PermissionState>("prompt");
  const [position,setPosition]=useState<GeolocationPosition|null>(null);
  const [error,setError]=useState("");
  const employee=employees.find(e=>e.id===selected);
  const today=new Date().toISOString().slice(0,10);
  const todayAttendance=attendance.find(a=>a.employeeId===selected&&a.date===today);
  const active=attendance.filter(a=>a.date===today&&a.checkIn&&!a.checkOut);
  const latestByEmployee=useMemo(()=>new Map(employees.map(e=>[e.id,pings.find(p=>p.employeeId===e.id)])),[employees,pings]);

  useEffect(()=>{ if(!navigator.geolocation) return; navigator.permissions?.query({name:"geolocation" as PermissionName}).then(p=>setPermission(p.state)).catch(()=>{}); },[]);
  useEffect(()=>{
    if(!tracking || !employee || !navigator.geolocation) return;
    const id=navigator.geolocation.watchPosition(pos=>{
      setPosition(pos); setError("");
      useItar.getState().addGpsPing(employee.id,{lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy});
    },e=>setError(e.message),{enableHighAccuracy:true,maximumAge:15000,timeout:15000});
    return ()=>navigator.geolocation.clearWatch(id);
  },[tracking,employee]);

  function locate(){
    if(!navigator.geolocation){setError("هذا الجهاز لا يدعم GPS.");return;}
    navigator.geolocation.getCurrentPosition(p=>{setPosition(p);setPermission("granted");},e=>setError(e.message),{enableHighAccuracy:true,timeout:15000});
  }
  function checkIn(){
    const loc=position?{lat:position.coords.latitude,lng:position.coords.longitude}:undefined;
    useItar.getState().checkIn(selected,loc); setTracking(true); locate();
  }
  function checkOut(){
    const loc=position?{lat:position.coords.latitude,lng:position.coords.longitude}:undefined;
    useItar.getState().checkOut(selected,loc); setTracking(false);
  }
  const nearest=position ? sites.map(s=>({...s,d:distanceMeters(position.coords.latitude,position.coords.longitude,s.lat,s.lng)})).sort((a,b)=>a.d-b.d)[0] : null;
  const inFence=nearest ? nearest.d<=nearest.radius : false;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-medium tracking-widest text-subtle">الموارد البشرية والميدان</p><h1 className="mt-1 text-3xl tracking-tight">الموظفون والحضور وGPS</h1><p className="mt-2 max-w-2xl text-sm text-muted">تسجيل الحضور والانصراف، التحقق الجغرافي، وتتبع الموقع أثناء ساعات العمل بموافقة الموظف.</p></div>
      <Badge tone="ok"><ShieldCheck className="me-1 inline size-3"/> التتبع بموافقة الموظف</Badge>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={<UsersIcon/>} title="الموظفون" value={employees.length}/><Stat icon={<UserCheck/>} title="على رأس العمل" value={active.length}/><Stat icon={<Navigation/>} title="GPS نشط" value={new Set(pings.filter(p=>Date.now()-new Date(p.timestamp).getTime()<5*60*1000).map(p=>p.employeeId)).size}/><Stat icon={<Clock3/>} title="سجلات اليوم" value={attendance.filter(a=>a.date===today).length}/>
    </div>

    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <Card>
        <h2 className="mb-4 text-base font-medium">حساب الموظف</h2>
        <select className={fieldClass} value={selected} onChange={e=>{setSelected(e.target.value);setTracking(false)}}>{employees.map(e=><option key={e.id} value={e.id}>{e.name} — {TEAM_LABEL[e.team]}</option>)}</select>
        {employee ? <div className="mt-4 rounded-xl border border-border bg-elevated p-4"><p className="font-medium">{employee.name}</p><p className="mt-1 text-sm text-muted">{employee.role??TEAM_LABEL[employee.team]}</p><p className="mt-1 text-xs text-subtle">{employee.phone}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span>الدوام</span><b>{employee.workStart??"10:00"} — {employee.workEnd??"02:00"}</b><span>الإنجاز</span><b>{qty(employee.meters)} م</b></div></div>:null}
        <div className="mt-4 flex flex-wrap gap-2">
          {!todayAttendance?.checkIn ? <Btn onClick={checkIn}><UserCheck className="size-4"/> تسجيل الحضور</Btn> : null}
          {todayAttendance?.checkIn&&!todayAttendance.checkOut ? <Btn onClick={checkOut}><UserX className="size-4"/> تسجيل الانصراف</Btn>:null}
          {todayAttendance?.checkOut ? <Badge tone="ok">تم إنهاء الدوام {time(todayAttendance.checkOut)}</Badge>:null}
          {todayAttendance?.checkIn&&!todayAttendance.checkOut ? <button className={`${fieldClass} inline-flex w-auto items-center gap-2`} onClick={()=>setTracking(v=>!v)}><Navigation className="size-4"/>{tracking?"إيقاف التتبع مؤقتًا":"تشغيل GPS"}</button>:null}
        </div>
        {todayAttendance ? <div className="mt-4 space-y-2 rounded-xl border border-border p-3 text-xs"><p>الحضور: <b>{time(todayAttendance.checkIn)}</b> — {todayAttendance.status==="late"?"متأخر":"في الموعد"}</p><p>الانصراف: <b>{time(todayAttendance.checkOut)}</b></p>{todayAttendance.checkInLat?<p>موقع الدخول: {todayAttendance.checkInLat.toFixed(5)}, {todayAttendance.checkInLng?.toFixed(5)}</p>:null}</div>:null}
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-medium">الموقع الحي للموظف</h2><p className="mt-1 text-xs text-subtle">لا يتم تسجيل الموقع إلا أثناء الدوام وبعد الموافقة.</p></div><button className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-xs ring-1 ring-border" onClick={locate}><RefreshCw className="size-4"/> تحديث الموقع</button></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-elevated p-5"><p className="text-xs text-subtle">حالة GPS</p><p className="mt-2 text-xl font-medium">{tracking?"🟢 يعمل":"⚪ متوقف"}</p><p className="mt-2 text-xs text-muted">{permission==="granted"?"تم السماح للموقع":"يحتاج إلى إذن المتصفح"}</p></div><div className="rounded-xl bg-elevated p-5"><p className="text-xs text-subtle">Geofence</p><p className="mt-2 text-xl font-medium">{nearest?inFence?"داخل النطاق":"خارج النطاق":"غير محدد"}</p><p className="mt-2 text-xs text-muted">{nearest?`${nearest.name} · ${Math.round(nearest.d)}م`:"فعّل الموقع لمعرفة النطاق"}</p></div></div>
        {position?<div className="mt-3 rounded-xl border border-border p-4 text-sm"><p className="flex items-center gap-2"><MapPin className="size-4 text-accent"/> {position.coords.latitude.toFixed(6)}, {position.coords.longitude.toFixed(6)}</p><p className="mt-2 text-xs text-subtle">دقة تقريبية: {Math.round(position.coords.accuracy)} متر · آخر تحديث {time(new Date().toISOString())}</p><a className="mt-3 inline-block text-xs text-accent underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`}>فتح الموقع على الخريطة</a></div>:null}
        {error?<p className="mt-3 rounded-lg bg-red-500/10 p-3 text-xs text-red-600">{error}</p>:null}
      </Card>
    </div>

    <Card><div className="flex items-center justify-between"><h2 className="text-base font-medium">المراقبة اللحظية</h2><span className="text-xs text-subtle">آخر 5 دقائق</span></div><div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs text-subtle"><tr className="border-b border-border"><th className="p-3 text-right">الموظف</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الحضور</th><th className="p-3 text-right">GPS</th><th className="p-3 text-right">آخر موقع</th></tr></thead><tbody>{employees.map(e=>{const a=attendance.find(x=>x.employeeId===e.id&&x.date===today);const g=latestByEmployee.get(e.id);const live=Boolean(g&&Date.now()-new Date(g.timestamp).getTime()<5*60*1000);return <tr key={e.id} className="border-b border-border/70"><td className="p-3 font-medium">{e.name}</td><td className="p-3">{a?.checkIn&&!a.checkOut?<Badge tone="ok">على رأس العمل</Badge>:a?.checkOut?<Badge tone="muted">انتهى</Badge>:<Badge tone="warn">لم يحضر</Badge>}</td><td className="p-3">{time(a?.checkIn)}</td><td className="p-3">{live?<span className="text-green-600">● مباشر</span>:<span className="text-subtle">○ متوقف</span>}</td><td className="p-3 text-xs">{g?`${g.lat.toFixed(5)}, ${g.lng.toFixed(5)} · ${day(g.timestamp)}`:"—"}</td></tr>})}</tbody></table></div></Card>

    <Card><h2 className="text-base font-medium">سجل الحضور</h2><div className="mt-3 grid gap-2">{attendance.slice(0,20).map(a=>{const e=employees.find(x=>x.id===a.employeeId);return <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-xs"><span><b>{e?.name??"موظف"}</b> · {a.date}</span><span>{time(a.checkIn)} → {time(a.checkOut)}</span><span>{a.status==="late"?"متأخر":"حاضر"}</span></div>})}{attendance.length===0?<p className="text-sm text-muted">لا توجد سجلات بعد.</p>:null}</div></Card>
  </div>
}
function Stat({icon,title,value}:{icon:ReactNode,title:string,value:number}){return <Card><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent">{icon}</span><div><p className="text-xs text-subtle">{title}</p><p className="mt-1 text-2xl font-semibold tabular">{value}</p></div></div></Card>}
function UsersIcon(){return <span className="text-lg">👥</span>}
