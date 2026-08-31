import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  createCloudUploadServer,
  deleteCloudFileServer,
  downloadCloudFileServer,
  listCloudFilesServer,
} from "./cloud-files.server";

export const createCloudUpload = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: z.string().min(1).max(160),
      mimeType: z.string().min(1).max(120),
      base64: z.string().min(1),
      folder: z
        .enum([
          "general",
          "projects",
          "documents",
          "backups",
        ])
        .default("general"),
    }),
  )
  .handler(async ({ data, context }) => {
    return createCloudUploadServer(
      data,
      context.userId,
    );
  });

export const listCloudFiles = createServerFn({
  method: "POST",
})
  .middleware([authMiddleware])
  .validator(
    z.object({
      folder: z
        .enum([
          "",
          "general",
          "projects",
          "documents",
          "backups",
        ])
        .default(""),
    }),
  )
  .handler(async ({ data, context }) => {
    return listCloudFilesServer(
      data.folder,
      context.userId,
    );
  });

export const downloadCloudFile = createServerFn({
  method: "POST",
})
  .middleware([authMiddleware])
  .validator(
    z.object({
      path: z.string().min(1).max(500),
    }),
  )
  .handler(async ({ data, context }) => {
    return downloadCloudFileServer(
      data.path,
      context.userId,
    );
  });

export const deleteCloudFile = createServerFn({
  method: "POST",
})
  .middleware([authMiddleware])
  .validator(
    z.object({
      path: z.string().min(1).max(500),
    }),
  )
  .handler(async ({ data, context }) => {
    return deleteCloudFileServer(
      data.path,
      context.userId,
    );
  });