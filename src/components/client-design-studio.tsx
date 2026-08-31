import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { alumSku, glassSku, jobTotals, priceJob } from "@/lib/workshop";
import { useItar, type WindowKind } from "@/lib/itar-store";
import { Camera, Check, ImagePlus, Maximize2, Move, Ruler, Save, Send, X } from "lucide-react";

type Props = { open: boolean; onClose: () => void; lang: "ar" | "he" | "en" };

const copy = {
  ar: {
    title: "مصمم الواجهات الذكي", subtitle: "صوّر واجهتك أو ارفع صورة، ثم أضف المقاسات والملاحظات لإرسال تصور أولي لفريقنا.",
    photo: "صورة الواجهة", customer: "بيانات العميل", phone: "الهاتف", email: "البريد الإلكتروني", color: "لون الإطار", submitOk: "تم إرسال التصميم إلى فريق الشركة بنجاح.", camera: "تصوير بالكاميرا", upload: "رفع صورة", design: "بيانات التصميم", width: "العرض (مم)", height: "الارتفاع (مم)", type: "نوع الواجهة", glass: "نوع الزجاج", notes: "ملاحظات المشروع", notesPh: "مثال: إطار أسود، زجاج دبل، باب في الجهة اليمنى...", preview: "المعاينة", save: "حفظ التصميم", send: "إرسال طلب التصميم", close: "إغلاق", noPhoto: "أضف صورة للبدء", window: "شباك", door: "باب", facade: "واجهة زجاجية", curtain: "ستارة زجاجية", clear: "إزالة الصورة", saved: "تم حفظ التصميم على هذا الجهاز.", sent: "تم تجهيز طلب التصميم. سيتطلب الإرسال الفعلي ربطه بقاعدة البيانات.", guide: "اسحب خطوط القياس داخل الصورة لتوضيح المنطقة المطلوبة.",
  },
  he: {
    title: "מעצב חזיתות חכם", subtitle: "צלמו את החזית או העלו תמונה, הוסיפו מידות והערות ושלחו סקיצה ראשונית לצוות שלנו.",
    photo: "תמונת החזית", customer: "פרטי הלקוח", phone: "טלפון", email: "אימייל", color: "צבע המסגרת", submitOk: "התכנון נשלח בהצלחה לצוות החברה.", camera: "צילום במצלמה", upload: "העלאת תמונה", design: "פרטי התכנון", width: "רוחב (מ״מ)", height: "גובה (מ״מ)", type: "סוג חזית", glass: "סוג זכוכית", notes: "הערות לפרויקט", notesPh: "לדוגמה: מסגרת שחורה, זכוכית כפולה, דלת בצד ימין...", preview: "תצוגה מקדימה", save: "שמירת התכנון", send: "שליחת בקשת תכנון", close: "סגירה", noPhoto: "הוסיפו תמונה כדי להתחיל", window: "חלון", door: "דלת", facade: "חזית זכוכית", curtain: "קיר זכוכית", clear: "הסרת התמונה", saved: "התכנון נשמר במכשיר הזה.", sent: "בקשת התכנון מוכנה. שליחה בפועל דורשת חיבור למסד הנתונים.", guide: "גררו את קווי המידה על התמונה כדי לסמן את האזור המבוקש.",
  },
  en: {
    title: "Smart Facade Designer", subtitle: "Take a photo or upload one, add dimensions and notes, then send an initial concept to our team.",
    photo: "Facade photo", customer: "Customer details", phone: "Phone", email: "Email", color: "Frame color", submitOk: "The design was sent successfully to our team.", camera: "Take photo", upload: "Upload image", design: "Design details", width: "Width (mm)", height: "Height (mm)", type: "Facade type", glass: "Glass type", notes: "Project notes", notesPh: "Example: black frame, double glass, door on the right...", preview: "Preview", save: "Save design", send: "Send design request", close: "Close", noPhoto: "Add a photo to start", window: "Window", door: "Door", facade: "Glass facade", curtain: "Glass curtain wall", clear: "Remove photo", saved: "Design saved on this device.", sent: "Design request prepared. Actual submission needs database integration.", guide: "Drag the measurement lines over the image to mark the requested area.",
  },
} as const;

export function ClientDesignStudio({ open, onClose, lang }: Props) {
  const t = copy[lang];
  const [image, setImage] = useState<string>("");
  const [width, setWidth] = useState("2400");
  const [height, setHeight] = useState("2200");
  const [type, setType] = useState<"window" | "door" | "facade" | "curtain">("window");
  const [glass, setGlass] = useState("double");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [scale, setScale] = useState(1);
  const [color, setColor] = useState("أبيض");
  const user = useCurrentUser();
  const addDesignRequest = useItar((s) => s.addDesignRequest);
  const products = useItar((s) => s.products);

  useEffect(() => {
    if (!open) return;
    setMessage("");
    try {
      const saved = localStorage.getItem("giant-design-draft");
      if (saved) {
        const draft = JSON.parse(saved) as { image?: string; width?: string; height?: string; type?: typeof type; glass?: string; notes?: string };
        setImage(draft.image || ""); setWidth(draft.width || "2400"); setHeight(draft.height || "2200"); setType(draft.type || "window"); setGlass(draft.glass || "double"); setColor((draft as any).color || "أبيض"); setNotes(draft.notes || "");
      }
    } catch { /* ignore malformed local draft */ }
  }, [open]);

  const typeLabel = useMemo(() => ({ window: t.window, door: t.door, facade: t.facade, curtain: t.curtain })[type], [t, type]);

  function readImage(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function save() {
    localStorage.setItem("giant-design-draft", JSON.stringify({ image, width, height, type, glass, color, notes }));
    setMessage(t.saved);
  }

  if (!open) return null;

  return (
    <div className="designer-backdrop" role="dialog" aria-modal="true" aria-label={t.title}>
      <div className="designer-modal" dir={lang === "en" ? "ltr" : "rtl"}>
        <div className="designer-head">
          <div><span className="designer-kicker">GIANT / DESIGN STUDIO</span><h2>{t.title}</h2><p>{t.subtitle}</p></div>
          <button className="designer-close" onClick={onClose} aria-label={t.close}><X size={20} /></button>
        </div>
        <div className="designer-grid">
          <section className="designer-preview-card">
            <div className="designer-section-title"><div><b>{t.preview}</b><small>{t.guide}</small></div><Maximize2 size={17} /></div>
            <div className="designer-canvas">
              {image ? <div className="designer-photo-wrap" style={{ transform: `scale(${scale})` }}><img src={image} alt={t.photo} /><div className="measure measure-width"><span>{width || "0"} mm</span></div><div className="measure measure-height"><span>{height || "0"} mm</span></div><div className="design-tag"><Move size={13} /> {typeLabel}</div></div> : <div className="designer-empty"><ImagePlus size={42} /><b>{t.noPhoto}</b><small>{t.photo}</small></div>}
            </div>
            <div className="designer-canvas-actions"><label className="designer-action primary"><Camera size={16} />{t.camera}<input type="file" accept="image/*" capture="environment" onChange={(e) => readImage(e.target.files?.[0])} /></label><label className="designer-action"><ImagePlus size={16} />{t.upload}<input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0])} /></label>{image && <><button className="designer-action" onClick={() => setScale((s) => Math.min(1.25, s + .05))}>＋</button><button className="designer-action" onClick={() => setScale((s) => Math.max(.8, s - .05))}>−</button><button className="designer-clear" onClick={() => setImage("")}>{t.clear}</button></>}</div>
          </section>

          <section className="designer-form-card">
            <div className="designer-section-title"><div><b>{t.design}</b><small>01 — 04</small></div><Ruler size={17} /></div>
            <div className="designer-fields">
              <label>{t.width}<input inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value.replace(/[^0-9.]/g, ""))} /></label>
              <label>{t.height}<input inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value.replace(/[^0-9.]/g, ""))} /></label>
              <label className="full">{t.type}<select value={type} onChange={(e) => setType(e.target.value as typeof type)}><option value="sliding">{t.window}</option><option value="door">{t.door}</option><option value="fixed">{t.facade}</option><option value="fixed">{t.curtain}</option></select></label>
              <label>{t.color}<select value={color} onChange={(e) => setColor(e.target.value)}><option>أبيض</option><option>بني</option><option>أسود</option></select></label>
              <label>{t.glass}<select value={glass} onChange={(e) => setGlass(e.target.value)}><option value="single">Single / 6mm</option><option value="double">Double / 24mm</option><option value="tempered">Tempered / 10mm</option><option value="laminated">Laminated</option></select></label>
              <label className="full">{t.notes}<textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t.notesPh} /></label>
            </div>
            {message && <div className="designer-message"><Check size={16} />{message}</div>}
            <div className="designer-footer-actions"><button className="designer-save" onClick={save}><Save size={17} />{t.save}</button><button className="designer-send" onClick={() => {
              const kind: WindowKind = type === "door" ? "door" : type === "facade" || type === "curtain" ? "fixed" : "sliding";
              const opening = { id: crypto.randomUUID(), kind, width: Number(width) || 0, height: Number(height) || 0, qty: 1, color, glass };
              const totals = jobTotals([opening]);
              const priced = priceJob([opening], products);
              const bySku = (sku: string, qty: number) => { const p = products.find((x) => x.sku === sku); return p && qty > 0 ? { sku, name: p.name, qty, unit: p.unit } : null; };
              const bom = [bySku(alumSku(kind, color), totals.alumM), bySku(glassSku(glass), totals.glassM2), bySku("AC-ROL", totals.rollers), bySku("AC-HND", totals.handles), bySku("AC-HNG", totals.hinges), bySku("CN-SIL", totals.silicone)].filter(Boolean) as { sku: string; name: string; qty: number; unit: any }[];
              addDesignRequest({ customerId: user?.id ?? "guest", customerName: user?.displayName ?? "زائر", customerEmail: user?.primaryEmail ?? undefined, image, width: Number(width) || 0, height: Number(height) || 0, type: kind, glass, color, notes, bom, estimatedTotal: priced.total });
              save(); setMessage(t.submitOk);
            }}><Send size={17} />{t.send}</button></div>
          </section>
        </div>
      </div>
    </div>
  );
}
