const BUCKET = "giant-files";
const MAX_BYTES = 3 * 1024 * 1024;

function env(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function headers() {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

export function baseUrl() {
  return env("SUPABASE_URL").replace(/\/$/, "");
}

export function objectUrl(path: string) {
  return `${baseUrl()}/storage/v1/object/${BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export function bytesFromBase64(base64: string) {
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  const buf = Buffer.from(clean, "base64");

  if (!buf.length) {
    throw new Error("الملف فارغ");
  }

  if (buf.length > MAX_BYTES) {
    throw new Error("حجم الملف يتجاوز 3MB");
  }

  return buf;
}

export function safe(value: string) {
  return (
    value
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "file"
  );
}

export async function createCloudUploadServer(
  data: {
    name: string;
    mimeType: string;
    base64: string;
    folder: "general" | "projects" | "documents" | "backups";
  },
  userId: string,
) {
  const buf = bytesFromBase64(data.base64);

  const ext =
    data.name.match(/\.[a-z0-9]{1,8}$/i)?.[0]?.toLowerCase() ?? "";

  const base = safe(
    data.name.replace(/\.[a-z0-9]{1,8}$/i, ""),
  );

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const path =
    `${data.folder}/${safe(userId)}/${stamp}-${base}${ext}`;

  const response = await fetch(objectUrl(path), {
    method: "POST",
    headers: {
      ...headers(),
      "Content-Type":
        data.mimeType || "application/octet-stream",
      "x-upsert": "false",
    },
    body: buf,
  });

  if (!response.ok) {
    throw new Error(
      `فشل رفع الملف (${response.status}): ${await response.text()}`,
    );
  }

  return {
    ok: true as const,
    path,
  };
}

export async function listCloudFilesServer(
  folder: "" | "general" | "projects" | "documents" | "backups",
  userId: string,
) {
  const folders = folder
    ? [folder]
    : ["general", "projects", "documents", "backups"];

  const results = await Promise.all(
    folders.map(async (currentFolder) => {
      const prefix =
        `${currentFolder}/${safe(userId)}`;

      const response = await fetch(
        `${baseUrl()}/storage/v1/object/list/${BUCKET}`,
        {
          method: "POST",
          headers: {
            ...headers(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prefix,
            limit: 100,
            offset: 0,
            sortBy: {
              column: "created_at",
              order: "desc",
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `فشل قراءة الملفات (${response.status}): ${await response.text()}`,
        );
      }

      const rows =
        (await response.json()) as Array<
          Record<string, unknown>
        >;

      return rows.map((row) => ({
        name: String(row.name ?? ""),
        path: `${prefix}/${String(row.name ?? "")}`,
        createdAt:
          typeof row.created_at === "string"
            ? row.created_at
            : null,
        metadata:
          (row.metadata as Record<string, unknown> | null) ??
          null,
      }));
    }),
  );

  return results
    .flat()
    .sort((a, b) =>
      String(b.createdAt ?? "").localeCompare(
        String(a.createdAt ?? ""),
      ),
    );
}

export async function downloadCloudFileServer(
  path: string,
  userId: string,
) {
  if (!path.includes(`/${safe(userId)}/`)) {
    throw new Error("غير مسموح بالوصول إلى هذا الملف");
  }

  const response = await fetch(objectUrl(path), {
    headers: headers(),
  });

  if (!response.ok) {
    throw new Error(
      `فشل تنزيل الملف (${response.status})`,
    );
  }

  const buf = Buffer.from(await response.arrayBuffer());

  if (buf.length > MAX_BYTES) {
    throw new Error(
      "هذا الملف أكبر من الحد المدعوم",
    );
  }

  return {
    name: path.split("/").at(-1) ?? "download.bin",
    base64: buf.toString("base64"),
    mimeType:
      response.headers.get("content-type") ??
      "application/octet-stream",
  };
}

export async function deleteCloudFileServer(
  path: string,
  userId: string,
) {
  if (!path.includes(`/${safe(userId)}/`)) {
    throw new Error("غير مسموح بحذف هذا الملف");
  }

  const response = await fetch(objectUrl(path), {
    method: "DELETE",
    headers: headers(),
  });

  if (!response.ok) {
    throw new Error(
      `فشل حذف الملف (${response.status}): ${await response.text()}`,
    );
  }

  return {
    ok: true as const,
  };
}