import type { NextRequest } from "next/server";
import sharp from "sharp";
import { getExtension, safeNumber, toBoolean } from "@/lib/utils";

type OutputFormat = "auto" | "jpeg" | "jpg" | "png" | "webp" | "avif" | "tiff" | "gif";

type Preset = "tiny" | "small" | "balanced" | "crisp";

const presetQuality: Record<Preset, number> = {
  tiny: 45,
  small: 60,
  balanced: 75,
  crisp: 88,
};

function normalizeFormat(
  format: OutputFormat,
  fallback?: string
): Exclude<OutputFormat, "auto"> {
  const normalizedFallback = fallback ?? "";
  if (format === "auto") {
    if (normalizedFallback === "jpeg") return "jpeg";
    if (normalizedFallback === "jpg") return "jpeg";
    if (normalizedFallback === "png") return "png";
    if (normalizedFallback === "webp") return "webp";
    if (normalizedFallback === "avif") return "avif";
    if (normalizedFallback === "tiff") return "tiff";
    if (normalizedFallback === "gif") return "gif";
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
    const encoded = await encodeWithQuality(buffer, format, quality, options).toBuffer();
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

    const requestedFormat = (formData.get("format") || "auto") as OutputFormat;
    const preset = (formData.get("preset") || "balanced") as Preset;
    const quality = safeNumber(formData.get("quality"), presetQuality[preset] ?? 75);
    const targetSizeKB = safeNumber(formData.get("targetSizeKB"), 0);
    const resizeWidth = safeNumber(formData.get("width"), 0);
    const resizeHeight = safeNumber(formData.get("height"), 0);
    const fit = (formData.get("fit") || "inside") as "inside" | "cover" | "contain";
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
        const alphaFormats = new Set<Exclude<OutputFormat, "auto">>([
          "png",
          "webp",
          "avif",
          "gif",
        ]);
        const shouldFlatten = flatten && !alphaFormats.has(outputFormat);

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
          inputName: file.name,
          inputSize: file.size,
          outputSize: encoded.length,
        };
      })
    );

    return Response.json({ files: outputs });
  } catch (error) {
    console.error("estimate failed", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to estimate images.",
      },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
