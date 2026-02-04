import archiver from "archiver";
import type { NextRequest } from "next/server";
import sharp from "sharp";
import { PassThrough } from "stream";

type OutputFormat =
  | "auto"
  | "jpeg"
  | "jpg"
  | "png"
  | "webp"
  | "avif"
  | "tiff"
  | "gif";

type Preset = "tiny" | "small" | "balanced" | "crisp";

const presetQuality: Record<Preset, number> = {
  tiny: 45,
  small: 60,
  balanced: 75,
  crisp: 88,
};

const mimeForFormat: Record<Exclude<OutputFormat, "auto">, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  tiff: "image/tiff",
  gif: "image/gif",
};

function safeNumber(value: FormDataEntryValue | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "1";
}

function getExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function normalizeFormat(format: OutputFormat, fallback: string) {
  if (format === "auto") {
    if (fallback === "jpeg") return "jpeg";
    if (fallback === "jpg") return "jpeg";
    if (fallback === "png") return "png";
    if (fallback === "webp") return "webp";
    if (fallback === "avif") return "avif";
    if (fallback === "tiff") return "tiff";
    if (fallback === "gif") return "gif";
    return "jpeg";
  }
  if (format === "jpg") return "jpeg";
  return format;
}

async function fileToBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function buildPipeline(
  buffer: Buffer,
  options: {
    width?: number;
    height?: number;
    fit?: "inside" | "cover" | "contain";
    keepMetadata: boolean;
    background?: string;
  }
) {
  let pipeline = sharp(buffer, { animated: false }).rotate();
  if (options.width || options.height) {
    pipeline = pipeline.resize({
      width: options.width || undefined,
      height: options.height || undefined,
      fit: options.fit || "inside",
      withoutEnlargement: true,
    });
  }
  if (options.keepMetadata) {
    pipeline = pipeline.withMetadata();
  }
  if (options.background) {
    pipeline = pipeline.flatten({ background: options.background });
  }
  return pipeline;
}

function encodeWithQuality(
  buffer: Buffer,
  format: Exclude<OutputFormat, "auto">,
  quality: number,
  options: {
    width?: number;
    height?: number;
    fit?: "inside" | "cover" | "contain";
    keepMetadata: boolean;
    background?: string;
    lossless: boolean;
    progressive: boolean;
  }
) {
  const pipeline = buildPipeline(buffer, options);
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({
        quality,
        mozjpeg: true,
        progressive: options.progressive,
      });
    case "png":
      return pipeline.png({
        quality,
        compressionLevel: 9,
        palette: true,
      });
    case "webp":
      return pipeline.webp({
        quality,
        effort: 5,
        lossless: options.lossless,
      });
    case "avif":
      return pipeline.avif({
        quality,
        effort: 5,
      });
    case "tiff":
      return pipeline.tiff({
        quality,
        compression: "lzw",
      });
    case "gif":
      return pipeline.gif();
    default:
      return pipeline.jpeg({ quality });
  }
}

async function encodeToTargetSize(
  buffer: Buffer,
  format: Exclude<OutputFormat, "auto">,
  targetBytes: number,
  baseQuality: number,
  options: {
    width?: number;
    height?: number;
    fit?: "inside" | "cover" | "contain";
    keepMetadata: boolean;
    background?: string;
    lossless: boolean;
    progressive: boolean;
  }
) {
  let low = 30;
  let high = Math.max(baseQuality, 40);
  let bestBuffer: Buffer | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < 8; i += 1) {
    const quality = Math.round((low + high) / 2);
    const encoded = await encodeWithQuality(
      buffer,
      format,
      quality,
      options
    ).toBuffer();
    const diff = Math.abs(encoded.length - targetBytes);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestBuffer = encoded;
    }
    if (encoded.length > targetBytes) {
      high = quality - 2;
    } else {
      low = quality + 2;
    }
  }

  return (
    bestBuffer ??
    (await encodeWithQuality(buffer, format, baseQuality, options).toBuffer())
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter(Boolean) as File[];
    if (!files.length) {
      return Response.json({ error: "No files provided." }, { status: 400 });
    }

    const requestedFormat = (formData.get("format") ||
      "auto") as OutputFormat;
    const preset = (formData.get("preset") || "balanced") as Preset;
    const quality = safeNumber(
      formData.get("quality"),
      presetQuality[preset] ?? 75
    );
    const targetSizeKB = safeNumber(formData.get("targetSizeKB"), 0);
    const resizeWidth = safeNumber(formData.get("width"), 0);
    const resizeHeight = safeNumber(formData.get("height"), 0);
    const fit = (formData.get("fit") || "inside") as
      | "inside"
      | "cover"
      | "contain";
    const keepMetadata = toBoolean(formData.get("keepMetadata"));
    const flatten = toBoolean(formData.get("flatten"));
    const background = (formData.get("background") || "#ffffff") as string;
    const lossless = toBoolean(formData.get("lossless"));
    const progressive = toBoolean(formData.get("progressive"));

    const outputs = await Promise.all(
      files.map(async (file) => {
        const buffer = await fileToBuffer(file);
        const inputExt = getExtension(file.name);
        const outputFormat = normalizeFormat(requestedFormat, inputExt);
        const hasAlphaFormats = ["png", "webp", "avif", "gif"];
        const shouldFlatten =
          flatten && !hasAlphaFormats.includes(outputFormat);

        const encoderOptions = {
          width: resizeWidth || undefined,
          height: resizeHeight || undefined,
          fit,
          keepMetadata,
          background: shouldFlatten ? background : undefined,
          lossless,
          progressive,
        };

        const encoded =
          targetSizeKB > 0
            ? await encodeToTargetSize(
                buffer,
                outputFormat,
                targetSizeKB * 1024,
                quality,
                encoderOptions
              )
            : await encodeWithQuality(
                buffer,
                outputFormat,
                quality,
                encoderOptions
              ).toBuffer();

        const extension = outputFormat === "jpeg" ? "jpg" : outputFormat;
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const outputName = `${baseName}.${extension}`;

        return {
          name: outputName,
          buffer: encoded,
          mime: mimeForFormat[outputFormat],
        };
      })
    );

    if (outputs.length === 1) {
      const file = outputs[0];
      return new Response(file.buffer, {
        headers: {
          "Content-Type": file.mime,
          "Content-Disposition": `attachment; filename="${file.name}"`,
        },
      });
    }

    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    const finished = new Promise<void>((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk as Buffer));
      stream.on("end", () => resolve());
      stream.on("error", reject);
      archive.on("error", reject);
    });

    archive.pipe(stream);
    for (const output of outputs) {
      archive.append(output.buffer, { name: output.name });
    }
    archive.finalize();
    await finished;

    const zipBuffer = Buffer.concat(chunks);

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="optipic-export.zip"`,
      },
    });
  } catch (error) {
    console.error("convert failed", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process images.",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
