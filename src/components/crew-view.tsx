import { useRef } from "react";
import {
  TEAM_LABEL,
  WAGE,
  type Team,
  useItar,
} from "@/lib/itar-store";
import { money, qty } from "@/lib/format";
import { Badge, Btn, Card, fieldClass } from "./ui-bits";

export function CrewView() {
  const employees = useItar((s) => s.employees);
  const tasks = useItar((s) => s.tasks);
  const orders = useItar((s) => s.workOrders);
  const parties = useItar((s) => s.parties);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium tracking-widest text-subtle">الفنيون</p>
        <h1 className="mt-1 text-3xl tracking-tight">فرق القص والتجميع والتركيب</h1>
        <p className="mt-2 max-w-lg text-sm text-muted">
          كل متر يُنجَز يُحتسب للمكافأة. الميدان يقدر يستلم المهمة ويصوّر التركيب لإغلاقها.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {employees.map((e) => (
          <Card key={e.id}>
            <p className="text-xs text-subtle">{TEAM_LABEL[e.team]}</p>
            <p className="mt-1 font-medium">{e.name}</p>
            <p className="mt-2 text-sm text-muted">{e.phone}</p>
            <p className="mt-3 tabular text-lg">{qty(e.meters)} م</p>
            <p className="text-xs text-subtle">مكافأة تقديرية {money(e.meters * WAGE[e.team])}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 text-base font-medium">المهام المفتوحة</h2>
        <ul className="divide-y divide-border">
          {tasks.map((t) => {
            const order = orders.find((o) => o.id === t.orderId);
            const who = parties.find((p) => p.id === order?.customerId);
            const team = employees.filter((e) => e.team === t.team);
            return (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm">
                    {order?.number} — {who?.name}
                  </p>
                  <p className="text-xs text-subtle">
                    {TEAM_LABEL[t.team]} · {qty(order?.alumM ?? 0)} م
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={t.status === "done" ? "ok" : t.status === "doing" ? "accent" : "muted"}>
                    {t.status === "done" ? "أُغلقت" : t.status === "doing" ? "جارٍ" : "مفتوحة"}
                  </Badge>
                  <select
                    className={`${fieldClass} h-10 w-40`}
                    value={t.employeeId ?? ""}
                    onChange={(e) => useItar.getState().assignTask(t.id, e.target.value)}
                  >
                    <option value="">بدون</option>
                    {team.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

export function FieldView() {
  const employees = useItar((s) => s.employees);
  const storedTech = useItar((s) => s.techId);
  const techId = storedTech || employees.find((e) => e.team === "install")?.id || employees[0]?.id || "";
  const tech = employees.find((e) => e.id === techId);
  const allTasks = useItar((s) => s.tasks);
  const tasks = allTasks.filter((t) => t.employeeId === techId);
  const orders = useItar((s) => s.workOrders);
  const parties = useItar((s) => s.parties);
  const mine = tasks.filter((t) => t.status !== "done");
  const inputRef = useRef<HTMLInputElement>(null);
  const pending = useRef<string | null>(null);

  function onFile(file: File, taskId: string) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const s = 480 / Math.max(img.width, img.height);
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        useItar.getState().finishTask(taskId, c.toDataURL("image/jpeg", 0.6));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium tracking-widest text-subtle">ميدان</p>
        <h1 className="mt-1 text-3xl tracking-tight">مهام الفني</h1>
      </div>
      <select
        className={fieldClass}
        value={techId}
        onChange={(e) => useItar.getState().setTech(e.target.value)}
      >
        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name} — {TEAM_LABEL[e.team as Team]}
          </option>
        ))}
      </select>
      {tech ? (
        <p className="text-sm text-muted">
          أنجزت {qty(tech.meters)} م · مكافأة {money(tech.meters * WAGE[tech.team])}
        </p>
      ) : null}

      {mine.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">لا مهام مفتوحة عليك الآن.</p>
        </Card>
      ) : (
        mine.map((t) => {
          const order = orders.find((o) => o.id === t.orderId);
          const who = parties.find((p) => p.id === order?.customerId);
          return (
            <Card key={t.id}>
              <p className="text-xs text-subtle">
                {order?.number} · {TEAM_LABEL[t.team]}
              </p>
              <p className="mt-1 text-lg font-medium">{who?.name}</p>
              <p className="mt-1 text-sm text-muted">
                {who?.city} · {qty(order?.alumM ?? 0)} م ألمنيوم
              </p>
              {t.photo ? <img src={t.photo} alt="" className="mt-3 max-h-40 rounded-md object-cover" /> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {t.status === "open" ? (
                  <Btn onClick={() => useItar.getState().startTask(t.id)}>استلام الطلب</Btn>
                ) : null}
                {t.status === "doing" && t.team === "install" ? (
                  <Btn
                    onClick={() => {
                      pending.current = t.id;
                      inputRef.current?.click();
                    }}
                  >
                    تصوير وإغلاق
                  </Btn>
                ) : null}
                {t.status === "doing" && t.team !== "install" ? (
                  <Btn onClick={() => useItar.getState().finishTask(t.id)}>إغلاق المهمة</Btn>
                ) : null}
              </div>
            </Card>
          );
        })
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const id = pending.current;
          if (file && id) onFile(file, id);
          e.target.value = "";
        }}
      />
    </div>
  );
}
