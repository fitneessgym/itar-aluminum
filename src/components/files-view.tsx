import { useEffect, useState, type ReactNode } from "react";
import { Archive, CheckCircle2, Cloud, Download, File, RefreshCw, Trash2, Upload } from "lucide-react";
import {
  createCloudUpload,
  deleteCloudFile,
  downloadCloudFile,
  listCloudFiles,
} from "@/lib/cloud-files.functions";import { workspaceSnapshot } from "@/lib/workspace-backup";
import { useItar } from "@/lib/itar-store";

const MAX_FILE_BYTES = 3 * 1024 * 1024;

type CloudFile = { name: string; path: string; createdAt?: string | null; metadata?: Record<string, unknown> | null };

function toBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      const comma = value.indexOf(",");
      resolve(comma >= 0 ? value.slice(comma + 1) : value);
    };
    reader.onerror = () => reject(reader.error ?? new Error("تعذر قراءة الملف"));
    reader.readAsDataURL(file);
  });
}

function encodeJson(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value, null, 2));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeJson(base64: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
}

export function FilesView() {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [filter, setFilter] = useState<"" | "general" | "projects" | "documents" | "backups">("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    setBusy(true);
    try {
      setFiles(await listCloudFiles({ data: { folder: filter } }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تحميل الملفات");
    } finally { setBusy(false); }
  }

  useEffect(() => { void refresh(); }, [filter]);

  async function upload(file: File, folder: "general" | "projects" | "documents") {
    if (file.size > MAX_FILE_BYTES) { setMessage("الحد الأقصى للملف هو 3MB"); return; }
    setBusy(true); setMessage("");
    try {
      await createCloudUpload({ data: { name: file.name, mimeType: file.type || "application/octet-stream", base64: await toBase64(file), folder } });
      setMessage("تم رفع الملف إلى Supabase بنجاح");
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر رفع الملف"); }
    finally { setBusy(false); }
  }

  async function backup() {
    setBusy(true); setMessage("");
    try {
      const json = JSON.stringify(workspaceSnapshot(), null, 2);
      const size = new Blob([json]).size;
      if (size > MAX_FILE_BYTES) throw new Error("النسخة الاحتياطية أكبر من 3MB");
      await createCloudUpload({ data: { name: `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, mimeType: "application/json", base64: encodeJson(workspaceSnapshot()), folder: "backups" } });
      setMessage("تم حفظ النسخة الاحتياطية في Supabase");
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر إنشاء النسخة الاحتياطية"); }
    finally { setBusy(false); }
  }

  async function download(path: string) {
    setBusy(true); setMessage("");
    try {
      const result = await downloadCloudFile({ data: { path } });
      const binary = atob(result.base64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: result.mimeType }));
      const a = document.createElement("a"); a.href = url; a.download = result.name; a.click(); URL.revokeObjectURL(url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر تنزيل الملف"); }
    finally { setBusy(false); }
  }

  async function restore(path: string) {
    if (!window.confirm("استعادة هذه النسخة ستستبدل بيانات العمل الحالية. متابعة؟")) return;
    setBusy(true); setMessage("");
    try {
      const result = await downloadCloudFile({ data: { path } });
      useItar.getState().hydrateCloud(decodeJson(result.base64));
      setMessage("تمت استعادة النسخة الاحتياطية");
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر استعادة النسخة"); }
    finally { setBusy(false); }
  }

  async function remove(path: string) {
    if (!window.confirm("حذف الملف من Supabase؟")) return;
    setBusy(true); setMessage("");
    try { await deleteCloudFile({ data: { path } }); setMessage("تم حذف الملف"); await refresh(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "تعذر حذف الملف"); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <header><p className="text-xs font-medium tracking-widest text-subtle">السحابة</p><h1 className="mt-1 text-3xl tracking-tight md:text-4xl">الملفات والنسخ الاحتياطية</h1><p className="mt-2 max-w-2xl text-sm leading-normal text-muted">الملفات تُخزّن في Supabase Storage عبر الـBackend، والبيانات في PostgreSQL.</p></header>
    {message ? <div className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">{message}</div> : null}
    <div className="grid gap-3 md:grid-cols-4">
      <FileButton icon={<Upload size={18}/>} label="رفع ملف" busy={busy} onFile={(f)=>void upload(f,"general")}/>
      <FileButton icon={<Cloud size={18}/>} label="رفع مشروع" busy={busy} onFile={(f)=>void upload(f,"projects")}/>
      <FileButton icon={<File size={18}/>} label="رفع مستند" busy={busy} onFile={(f)=>void upload(f,"documents")}/>
      <button type="button" disabled={busy} onClick={()=>void backup()} className="flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-accent-fg disabled:opacity-60"><Archive size={18}/>نسخة احتياطية الآن</button>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {(["", "general", "projects", "documents", "backups"] as const).map((value)=><button key={value||"all"} type="button" onClick={()=>setFilter(value)} className={`rounded-full px-3 py-1.5 text-xs ring-1 ring-border ${filter===value?"bg-accent/10 text-accent":"text-muted"}`}>{value===""?"الكل":value==="backups"?"نسخ احتياطية":value==="projects"?"مشاريع":value==="documents"?"مستندات":"عام"}</button>)}
      <button type="button" disabled={busy} onClick={()=>void refresh()} className="ms-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-muted ring-1 ring-border"><RefreshCw size={14}/>تحديث</button>
    </div>
    <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-border">
      {files.length===0?<div className="px-5 py-10 text-center text-sm text-muted">لا توجد ملفات.</div>:<ul className="divide-y divide-border">{files.map((f)=><li key={f.path} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><p className="truncate text-sm">{f.name}</p><p className="mt-1 text-xs text-subtle">{f.path}{f.createdAt?` · ${new Date(f.createdAt).toLocaleString("ar")}`:""}</p></div><div className="flex flex-wrap gap-2">{f.path.startsWith("backups/")?<button type="button" onClick={()=>void restore(f.path)} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs text-accent ring-1 ring-border"><CheckCircle2 size={14}/>استعادة</button>:null}<button type="button" onClick={()=>void download(f.path)} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs ring-1 ring-border"><Download size={14}/>تنزيل</button><button type="button" onClick={()=>void remove(f.path)} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs text-danger ring-1 ring-border"><Trash2 size={14}/>حذف</button></div></li>)}</ul>}
    </div>
  </div>;
}

function FileButton({ icon, label, busy, onFile }: { icon: ReactNode; label: string; busy: boolean; onFile: (file: File) => void }) {
  return <label className={`flex cursor-pointer items-center gap-2 rounded-xl bg-surface px-4 py-3 ring-1 ring-border ${busy?"pointer-events-none opacity-60":""}`}>{icon}<span>{label}</span><input className="hidden" type="file" onChange={(e)=>{const f=e.target.files?.[0];if(f)onFile(f);e.currentTarget.value="";}}/></label>;
}
