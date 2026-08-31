import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ClientDesignStudio } from "./client-design-studio";

const DATA = {
  ar: { dir: "rtl", short: "ع", name: "العملاق للزجاج والألمنيوم", kicker: "حلول ألمنيوم وزجاج للمنازل والأعمال", hero: "نصنع الواجهة التي تليق بمكانك", text: "تصميم وتنفيذ شبابيك وأبواب وواجهات ألمنيوم وزجاج، من القياس الدقيق حتى التركيب والتسليم.", services: "خدماتنا", servicesText: "حلول عملية وأنيقة مصممة حسب المقاس والاستخدام.", about: "شركة تبني على الجودة", aboutText: "نحوّل القياسات والأفكار إلى أعمال ألمنيوم وزجاج متقنة. نهتم بالتفاصيل، جودة المواد، دقة القص، ونظافة التركيب في كل مشروع.", projects: "مجالات العمل", projectsText: "من المشاريع السكنية إلى الواجهات التجارية، نقدم حلولاً مرنة حسب احتياج كل عميل.", quote: "لديك مشروع؟", quoteText: "أرسل تفاصيل مشروعك وسنتواصل معك لمناقشة القياسات والمواد والتكلفة.", contact: "تواصل معنا", login: "دخول النظام", cta: "اطلب عرض سعر", more: "اكتشف خدماتنا", phone: "الهاتف", location: "الموقع", locationValue: "فلسطين", footer: "العملاق للزجاج والألمنيوم — جودة تبدأ من التفاصيل", items: [["شبابيك ألمنيوم", "منزلقة، مفصلية وثابتة بتشطيبات متعددة."], ["أبواب ألمنيوم وزجاج", "أبواب للمنازل والمحلات والمكاتب والواجهات."], ["واجهات زجاجية", "واجهات عصرية للمحلات والمكاتب والمباني التجارية."], ["مطابخ وخزائن", "تنفيذ حسب المقاس واستغلال ذكي للمساحة."]], features: ["قياس دقيق", "مواد مختارة", "تنفيذ احترافي", "متابعة حتى التسليم"] },
  he: { dir: "rtl", short: "ע", name: "ענק הזכוכית והאלומיניום", kicker: "פתרונות אלומיניום וזכוכית לבתים ולעסקים", hero: "חזית שמתאימה בדיוק למקום שלך", text: "תכנון וביצוע חלונות, דלתות וחזיתות אלומיניום וזכוכית, מהמדידה המדויקת ועד ההתקנה והמסירה.", services: "השירותים שלנו", servicesText: "פתרונות מעוצבים ומעשיים בהתאמה אישית.", about: "חברה שבונה על איכות", aboutText: "אנו הופכים מידות ורעיונות לעבודות אלומיניום וזכוכית מדויקות. אנו מקפידים על פרטים, חומרים, חיתוך נקי והתקנה מקצועית.", projects: "תחומי פעילות", projectsText: "מפרויקטים למגורים ועד חזיתות מסחריות, אנו מתאימים את הפתרון לצורך של כל לקוח.", quote: "יש לכם פרויקט?", quoteText: "שלחו את פרטי הפרויקט ונחזור אליכם למדידות, חומרים ותמחור.", contact: "צרו קשר", login: "כניסה למערכת", cta: "בקשו הצעת מחיר", more: "לשירותים שלנו", phone: "טלפון", location: "מיקום", locationValue: "פלסטין", footer: "ענק הזכוכית והאלומיניום — איכות מתחילה בפרטים", items: [["חלונות אלומיניום", "הזזה, ציר וקבוע במגוון גימורים."], ["דלתות אלומיניום וזכוכית", "לבית, לעסק, לחנויות ולמשרדים."], ["חזיתות זכוכית", "חזיתות מודרניות לחנויות, משרדים ומבנים."], ["מטבחים וארונות", "ביצוע לפי מידה וניצול חכם של החלל."]], features: ["מדידה מדויקת", "חומרים איכותיים", "ביצוע מקצועי", "ליווי עד המסירה"] },
  en: { dir: "ltr", short: "EN", name: "Giant Glass & Aluminum", kicker: "Aluminum & glass solutions for homes and businesses", hero: "A facade made for your space", text: "Design and installation of aluminum windows, doors and glass facades, from precise measurement to final installation.", services: "Our Services", servicesText: "Practical, elegant solutions designed around your needs.", about: "A company built on quality", aboutText: "We turn measurements and ideas into precise aluminum and glass work. We care about details, materials, clean fabrication and professional installation.", projects: "What We Do", projectsText: "From residential projects to commercial facades, we shape flexible solutions for every client.", quote: "Have a project?", quoteText: "Send us your project details and we will discuss measurements, materials and pricing.", contact: "Contact Us", login: "System Login", cta: "Request a Quote", more: "Explore Services", phone: "Phone", location: "Location", locationValue: "Palestine", footer: "Giant Glass & Aluminum — Quality starts with details", items: [["Aluminum Windows", "Sliding, hinged and fixed in multiple finishes."], ["Aluminum & Glass Doors", "Solutions for homes, shops, offices and entrances."], ["Glass Facades", "Modern facades for shops, offices and buildings."], ["Kitchens & Cabinets", "Made-to-measure solutions with smart space use."]], features: ["Precise measurement", "Quality materials", "Professional execution", "Support to delivery"] },
} as const;

type Lang = keyof typeof DATA;

export function SiteView() {
  const [lang, setLang] = useState<Lang>("ar");
  const t = DATA[lang];
  const [designerOpen, setDesignerOpen] = useState(false);
  return <div className="company-site" dir={t.dir}>
    <header className="company-header">
      <div className="container nav-wrap">
        <a href="#top" className="brand"><span className="brand-icon">G</span><span><b>{t.name}</b><small>GLASS · ALUMINUM</small></span></a>
        <nav className="main-nav"><a href="#services">{t.services}</a><a href="#about">{t.about}</a><a href="#projects">{t.projects}</a><a href="#contact">{t.contact}</a></nav>
        <div className="nav-actions"><div className="langs">{(["ar","he","en"] as Lang[]).map(x => <button key={x} className={x===lang?"selected":""} onClick={()=>setLang(x)}>{DATA[x].short}</button>)}</div><Link to="/portal" className="login-link">{t.login}</Link></div>
      </div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-orb orb-a"/><div className="hero-orb orb-b"/>
        <div className="container hero-grid">
          <div className="hero-copy"><div className="eyebrow"><i/>{t.kicker}</div><h1>{t.hero}</h1><p>{t.text}</p><div className="actions"><a href="#contact" className="btn primary">{t.cta}<span>↗</span></a><button type="button" className="btn designer-hero-btn" onClick={() => setDesignerOpen(true)}>✦ {lang === "ar" ? "صمّم واجهتك بالتصوير" : lang === "he" ? "עצבו את החזית בצילום" : "Design your facade from a photo"}</button><a href="#services" className="btn secondary">{t.more}</a></div><div className="trust">{t.features.map(f=><span key={f}>✓ {f}</span>)}</div></div>
          <div className="hero-art"><div className="building"><div className="building-sky"/><div className="frames">{Array.from({length:9}).map((_,i)=><span key={i}/>)}</div><div className="art-caption"><b>01</b><span>DESIGN · PRECISION · QUALITY</span></div></div><div className="art-badge"><b>G</b><span>GIANT<small>GLASS & ALUMINUM</small></span></div></div>
        </div>
      </section>

      <section id="about" className="about section"><div className="container split"><div><span className="kicker">ABOUT / 01</span><h2>{t.about}</h2></div><div><p className="lead">{t.aboutText}</p><div className="stats"><div><b>100%</b><span>Custom</span></div><div><b>01</b><span>Team</span></div><div><b>4</b><span>Services</span></div></div></div></div></section>

      <section id="services" className="services section"><div className="container"><div className="section-head"><div><span className="kicker">SERVICES / 02</span><h2>{t.services}</h2></div><p>{t.servicesText}</p></div><div className="service-grid">{t.items.map(([title,body],i)=><article className="service-card" key={title}><span className="service-no">0{i+1}</span><div className="service-symbol">{["▣","⌂","◇","▤"][i]}</div><h3>{title}</h3><p>{body}</p><a href="#contact">{t.cta} ↗</a></article>)}</div></div></section>

      <section id="projects" className="projects section"><div className="container project-grid"><div className="project-art"><div className="project-glass"/><div className="project-lines"/><span>ARCHITECTURE / GLASS / ALUMINUM</span></div><div className="project-copy"><span className="kicker">PROJECTS / 03</span><h2>{t.projects}</h2><p>{t.projectsText}</p><ul>{t.features.map(f=><li key={f}><b>+</b>{f}</li>)}</ul><a className="text-cta" href="#contact">{t.cta} ↗</a></div></div></section>

      <section id="contact" className="contact section"><div className="container contact-box"><div><span className="kicker">CONTACT / 04</span><h2>{t.quote}</h2><p>{t.quoteText}</p><a href="#contact" className="btn light">{t.contact} <span>↗</span></a></div><div className="contact-info"><div><small>{t.phone}</small><strong dir="ltr">+970 00 000 0000</strong></div><div><small>WhatsApp</small><strong dir="ltr">WhatsApp</strong></div><div><small>{t.location}</small><strong>{t.locationValue}</strong></div></div></div></section>
    </main>
    <ClientDesignStudio open={designerOpen} onClose={() => setDesignerOpen(false)} lang={lang} />
    <footer className="footer"><div className="container footer-row"><div><b>{t.name}</b><span>{t.footer}</span></div><span>© {new Date().getFullYear()}</span></div></footer>
  </div>;
}
