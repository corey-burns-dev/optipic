/** biome-ignore-all lint/a11y/useSemanticElements: <explanation> */
"use client";

import Image from "next/image";
import { type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import ThemeToggle from "./components/theme-toggle";

type Preset = "tiny" | "small" | "balanced" | "crisp" | "custom";
type OutputFormat = "auto" | "jpeg" | "png" | "webp" | "avif" | "tiff" | "gif";

const presetQuality: Record<Exclude<Preset, "custom">, number> = {
  tiny: 45,
  small: 60,
  balanced: 75,
  crisp: 88,
};

const formatLabels: Record<OutputFormat, string> = {
  auto: "Auto (keep format)",
  jpeg: "JPG",
  png: "PNG",
  webp: "WebP",
  avif: "AVIF",
  tiff: "TIFF",
  gif: "GIF",
};

type LocalFile = {
  id: string;
  file: File;
  url: string;
};

type Result = {
  name: string;
  url: string;
  size: number;
  count: number;
};

type Estimate = {
  name: string;
  inputName: string;
  inputSize: number;
  outputSize: number;
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [format, setFormat] = useState<OutputFormat>("auto");
  const [preset, setPreset] = useState<Preset>("balanced");
  const [quality, setQuality] = useState(75);
  const [targetSizeKB, setTargetSizeKB] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [fit, setFit] = useState<"inside" | "cover" | "contain">("inside");
  const [keepMetadata, setKeepMetadata] = useState(false);
  const [flattenBackground, setFlattenBackground] = useState(true);
  const [background, setBackground] = useState("#ffffff");
  const [lossless, setLossless] = useState(false);
  const [progressive, setProgressive] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [estimate, setEstimate] = useState<Estimate[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const totalInputSize = useMemo(
    () => files.reduce((sum, item) => sum + item.file.size, 0),
    [files]
  );

  const handleAddFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter((file) => file.type.startsWith("image/"));
    if (!list.length) {
      setError("Please add image files only.");
      return;
    }
    setError("");
    setResult(null);
    setEstimate([]);
    setStatus("idle");
    setFiles((prev) => [
      ...prev,
      ...list.map((file) => ({
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${file.name}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer?.files?.length) {
      handleAddFiles(event.dataTransfer.files);
    }
  };

  const handlePresetChange = (value: Preset) => {
    setPreset(value);
    if (value !== "custom") {
      setQuality(presetQuality[value]);
    }
  };

  const removeFile = (id: string) => {
    let removedName = "";
    setFiles((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.url);
        removedName = removed.file.name;
      }
      return prev.filter((item) => item.id !== id);
    });
    if (removedName) {
      setEstimate((prev) => prev.filter((entry) => entry.inputName !== removedName));
    }
  };

  const clearAll = () => {
    files.forEach((item) => {
      URL.revokeObjectURL(item.url);
    });
    setFiles([]);
    setResult(null);
    setEstimate([]);
    setStatus("idle");
  };

  const triggerDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  };

  const handleSubmit = async () => {
    if (!files.length) {
      setError("Add at least one image to continue.");
      return;
    }
    setProcessing(true);
    setStatus("processing");
    setError("");
    setResult(null);

    const formData = new FormData();
    files.map((item) => formData.append("files", item.file, item.file.name));
    formData.set("format", format);
    formData.set("preset", preset === "custom" ? "balanced" : preset);
    formData.set("quality", String(quality));
    if (targetSizeKB) formData.set("targetSizeKB", targetSizeKB);
    if (width) formData.set("width", width);
    if (height) formData.set("height", height);
    formData.set("fit", fit);
    formData.set("keepMetadata", String(keepMetadata));
    formData.set("flatten", String(flattenBackground));
    formData.set("background", background);
    formData.set("lossless", String(lossless));
    formData.set("progressive", String(progressive));

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Conversion failed.");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/);
      const name = fileNameMatch?.[1] ?? "optipic-export.zip";
      const url = URL.createObjectURL(blob);

      const nextResult = {
        name,
        url,
        size: blob.size,
        count: files.length,
      };
      if (result) URL.revokeObjectURL(result.url);
      setResult(nextResult);
      triggerDownload(nextResult.url, nextResult.name);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
      setStatus("idle");
    } finally {
      setProcessing(false);
    }
  };

  const handleEstimate = async () => {
    if (!files.length) {
      setError("Add at least one image to continue.");
      return;
    }
    setEstimating(true);
    setStatus("processing");
    setError("");

    const formData = new FormData();
    files.map((item) => formData.append("files", item.file, item.file.name));
    formData.set("format", format);
    formData.set("preset", preset === "custom" ? "balanced" : preset);
    formData.set("quality", String(quality));
    if (targetSizeKB) formData.set("targetSizeKB", targetSizeKB);
    if (width) formData.set("width", width);
    if (height) formData.set("height", height);
    formData.set("fit", fit);
    formData.set("keepMetadata", String(keepMetadata));
    formData.set("flatten", String(flattenBackground));
    formData.set("background", background);
    formData.set("lossless", String(lossless));
    formData.set("progressive", String(progressive));

    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Estimate failed.");
      }
      const payload = await response.json();
      setEstimate(payload.files ?? []);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Estimate failed.");
      setStatus("idle");
    } finally {
      setEstimating(false);
    }
  };

  useEffect(() => {
    if (format !== "webp") {
      setLossless(false);
    }
    if (format !== "jpeg") {
      setProgressive(false);
    } else {
      setProgressive(true);
    }
  }, [format]);

  useEffect(() => {
    return () => {
      files.map((item) => URL.revokeObjectURL(item.url));
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [files, result]);

  return (
    <div className="text-foreground relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(79,209,183,0.2),transparent_60%)] blur-2xl" />
      <div className="float-slow pointer-events-none absolute top-30 -right-30 h-95 w-95 rounded-full bg-[radial-gradient(circle_at_center,rgba(244,183,64,0.18),transparent_60%)] blur-2xl" />
      <div className="float-slower pointer-events-none absolute -bottom-30 -left-30 h-105 w-105 rounded-full bg-[radial-gradient(circle_at_center,rgba(27,42,58,0.8),transparent_60%)] blur-2xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pt-10 pb-20 sm:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-(--sea) text-black shadow-lg">
              OP
            </div>
            <div>
              <div className="font-display text-xl font-semibold tracking-tight">
                🪄 Image Mage 📸
              </div>
              <div className="text-sm text-(--muted)">
                Convert, compress, and export in one flow
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-(--muted)">
              {files.length} file{files.length === 1 ? "" : "s"} ·{" "}
              {formatBytes(totalInputSize)}
            </div>
            <ThemeToggle />
            <button
              type="button"
              className="text-foreground rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleEstimate}
              disabled={estimating || processing || !files.length}
            >
              {estimating ? "Estimating..." : "Estimate"}
            </button>
            <button
              type="button"
              className="rounded-full bg-(--sea) px-5 py-2 text-sm font-medium text-black shadow-md transition hover:-translate-y-0.5 hover:bg-[#3cc0a6] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleSubmit}
              disabled={processing || !files.length}
            >
              {processing ? "Processing..." : "Run Conversion"}
            </button>
          </div>
        </header>

        <main className="mt-12 grid gap-8 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <section className="space-y-6 lg:col-span-1">
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop images here or press Enter to choose files"
              className={`glass flex min-h-45 w-full flex-col items-center justify-center gap-4 rounded-[28px] border border-white/10 p-6 text-center transition hover:-translate-y-0.5 ${
                status === "processing" ? "animate-pulse-soft" : ""
              } ${isDragOver ? "ring-2 ring-(--sea)/60" : ""} `}
              onDrop={handleDrop}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragEnter={() => setIsDragOver(true)}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
            >
              <div className="text-sm tracking-[0.3em] text-(--muted) uppercase">
                {isDragOver ? "Release to Upload" : "Drop Files"}
              </div>
              <div className="font-display text-2xl font-semibold">
                {isDragOver ? "Drop images now" : "Drag images here or choose files"}
              </div>
              <div className="text-sm text-(--muted)">
                {isDragOver
                  ? "We will start preparing them immediately."
                  : "JPG, PNG, WebP, AVIF, TIFF, GIF, and more"}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="rounded-full bg-(--sea) px-6 py-2 text-sm font-semibold text-black shadow-lg transition hover:-translate-y-0.5 hover:bg-[#3cc0a6]"
                  onClick={() => inputRef.current?.click()}
                >
                  Choose Images
                </button>
                <button
                  type="button"
                  className="text-foreground rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold transition hover:border-white/30 hover:bg-white/10"
                  onClick={clearAll}
                >
                  Clear All
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(event) => {
                  if (event.target.files?.length) {
                    handleAddFiles(event.target.files);
                    event.target.value = "";
                  }
                }}
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="grid max-h-105 gap-3 overflow-auto pr-1">
              {files.map((item) => (
                <div
                  key={item.id}
                  className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={item.url}
                      alt={item.file.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="size-12 rounded-xl object-cover"
                    />
                    <div>
                      <div className="text-foreground font-semibold">
                        {item.file.name}
                      </div>
                      <div className="text-xs text-(--muted)">
                        {formatBytes(item.file.size)} · {item.file.type || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {estimate.length ? (
                      <div className="text-right text-xs text-(--muted)">
                        <div className="text-foreground font-semibold">
                          {formatBytes(
                            estimate.find((entry) => entry.inputName === item.file.name)
                              ?.outputSize ?? item.file.size
                          )}
                        </div>
                        <div>
                          Est. savings{" "}
                          {formatPercent(
                            Math.max(
                              0,
                              100 -
                                ((estimate.find(
                                  (entry) => entry.inputName === item.file.name
                                )?.outputSize ?? item.file.size) /
                                  item.file.size) *
                                  100
                            )
                          )}
                        </div>
                      </div>
                    ) : null}
                    <button
                      type="button"
                      className="hover:text-foreground rounded-full border border-white/10 px-4 py-1 text-xs font-semibold text-(--muted) transition hover:border-white/30"
                      onClick={() => removeFile(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {!files.length && (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-(--muted)">
                  Drop some files to see them listed here.
                </div>
              )}
            </div>

            <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 px-5 py-4 text-sm text-(--muted)">
              <div>
                <div className="text-xs tracking-[0.2em] uppercase">Output</div>
                <div className="text-foreground font-semibold">
                  {result
                    ? `${formatBytes(result.size)} ready to download`
                    : estimate.length
                      ? `Estimated ${formatBytes(
                          estimate.reduce((sum, item) => sum + item.outputSize, 0)
                        )}`
                      : "Run conversion to generate output"}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-full bg-(--sea) px-5 py-2 text-xs font-semibold text-black shadow-md transition hover:-translate-y-0.5 hover:bg-[#3cc0a6] disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={handleSubmit}
                  disabled={processing || !files.length}
                >
                  {processing ? "Processing..." : "Convert Now"}
                </button>
                {result && (
                  <button
                    type="button"
                    className="text-foreground rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-semibold transition hover:border-white/30 hover:bg-white/10"
                    onClick={() => triggerDownload(result.url, result.name)}
                  >
                    Download Again
                  </button>
                )}
              </div>
            </div>
            {status === "done" && (
              <div className="animate-pop rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Finished. Your files are ready.
              </div>
            )}
          </section>

          <section className="order-2 space-y-6 lg:order-0">
            <div className="glass rounded-[28px] border border-white/70 p-6">
              <div className="text-xs tracking-[0.2em] text-(--muted) uppercase">
                Output Format
              </div>
              <div className="mt-4 grid gap-3">
                <label htmlFor="format" className="text-foreground text-sm font-semibold">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(event) => setFormat(event.target.value as OutputFormat)}
                  className="text-foreground rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  {Object.entries(formatLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-(--muted)">
                  Auto keeps the original format, perfect for compression-only.
                </div>
              </div>
            </div>

            <div className="glass rounded-[28px] border border-white/70 p-6">
              <div className="text-xs tracking-[0.2em] text-(--muted) uppercase">
                Estimate Summary
              </div>
              <div className="mt-4 grid gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-(--muted)">Input total</span>
                  <span className="text-foreground font-semibold">
                    {formatBytes(totalInputSize)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-(--muted)">Estimated output</span>
                  <span className="text-foreground font-semibold">
                    {estimate.length
                      ? formatBytes(
                          estimate.reduce((sum, item) => sum + item.outputSize, 0)
                        )
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-(--muted)">Estimated savings</span>
                  <span className="font-semibold text-(--sea)">
                    {estimate.length
                      ? formatPercent(
                          Math.max(
                            0,
                            100 -
                              (estimate.reduce((sum, item) => sum + item.outputSize, 0) /
                                Math.max(totalInputSize, 1)) *
                                100
                          )
                        )
                      : "—"}
                  </span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-(--muted)">
                  Click “Estimate” to preview expected compression before you run the
                  conversion.
                </div>
              </div>
            </div>
          </section>

          <section className="order-3 space-y-6 lg:order-0">
            <div className="glass rounded-[28px] border border-white/70 p-6">
              <div className="text-xs tracking-[0.2em] text-(--muted) uppercase">
                Compression
              </div>
              <div className="mt-4 grid gap-4">
                <div>
                  <label htmlFor="" className="text-foreground text-sm font-semibold">
                    Preset
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold">
                    {(["tiny", "small", "balanced", "crisp"] as Preset[]).map((value) => (
                      <button
                        type="button"
                        key={value}
                        className={`rounded-full border px-3 py-2 transition ${
                          preset === value
                            ? `border-(--sea) bg-(--sea) text-black`
                            : `border-white/10 bg-white/5 text-(--muted) hover:border-white/30`
                        } `}
                        onClick={() => handlePresetChange(value)}
                      >
                        {value}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-2 transition ${
                        preset === "custom"
                          ? `border-(--sea) bg-(--sea) text-black`
                          : `border-white/10 bg-white/5 text-(--muted) hover:border-white/30`
                      } `}
                      onClick={() => setPreset("custom")}
                    >
                      custom
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="quality"
                    className="text-foreground text-sm font-semibold"
                  >
                    Quality ({quality})
                  </label>
                  <input
                    id="quality"
                    type="range"
                    min={10}
                    max={95}
                    value={quality}
                    onChange={(event) => {
                      setQuality(Number(event.target.value));
                      setPreset("custom");
                    }}
                    className="mt-2 w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="targetSizeKB"
                    className="text-foreground text-sm font-semibold"
                  >
                    Target size (KB)
                  </label>
                  <input
                    id="targetSizeKB"
                    type="number"
                    min={0}
                    placeholder="Leave blank for auto"
                    value={targetSizeKB}
                    onChange={(event) => setTargetSizeKB(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  />
                  <div className="mt-2 text-xs text-(--muted)">
                    Best-effort target for JPEG, WebP, and AVIF.
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="order-4 space-y-6 lg:order-0">
            <div className="glass rounded-[28px] border border-white/70 p-6">
              <div className="text-xs tracking-[0.2em] text-(--muted) uppercase">
                Resize & Output
              </div>
              <div className="mt-4 grid gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="width"
                      className="text-foreground text-sm font-semibold"
                    >
                      Width (px)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={width}
                      onChange={(event) => setWidth(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="height"
                      className="text-foreground text-sm font-semibold"
                    >
                      Height (px)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={height}
                      onChange={(event) => setHeight(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="fit" className="text-foreground text-sm font-semibold">
                    Fit
                  </label>
                  <select
                    value={fit}
                    onChange={(event) =>
                      setFit(event.target.value as "inside" | "cover" | "contain")
                    }
                    className="text-foreground mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    <option value="inside">Inside (keep aspect)</option>
                    <option value="contain">Contain (pad)</option>
                    <option value="cover">Cover (crop)</option>
                  </select>
                </div>
                <label className="group relative flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <span className="tooltip-bubble">
                    Preserves EXIF/metadata like camera info. Can slightly increase file
                    size.
                  </span>
                  <span className="text-foreground font-semibold">Keep metadata</span>
                  <input
                    type="checkbox"
                    checked={keepMetadata}
                    onChange={(event) => setKeepMetadata(event.target.checked)}
                    className="size-4"
                  />
                </label>
                <label
                  className={`group relative flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm ${
                    format !== "jpeg" ? "opacity-60" : ""
                  } `}
                >
                  <span className="tooltip-bubble">
                    Progressive JPEGs load in passes. Only applies when output is JPG.
                  </span>
                  <span className="text-foreground font-semibold">Progressive JPEG</span>
                  <input
                    type="checkbox"
                    checked={progressive}
                    onChange={(event) => setProgressive(event.target.checked)}
                    className="size-4"
                    disabled={format !== "jpeg"}
                  />
                </label>
                <label
                  className={`group relative flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm ${
                    format !== "webp" ? "opacity-60" : ""
                  } `}
                >
                  <span className="tooltip-bubble">
                    Lossless WebP keeps all detail with larger files. Only applies to WebP
                    output.
                  </span>
                  <span className="text-foreground font-semibold">Lossless WebP</span>
                  <input
                    type="checkbox"
                    checked={lossless}
                    onChange={(event) => setLossless(event.target.checked)}
                    className="size-4"
                    disabled={format !== "webp"}
                  />
                </label>
                <label className="group relative flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <span className="tooltip-bubble">
                    Fill transparent areas with a background color (useful for JPG).
                  </span>
                  <span className="text-foreground font-semibold">
                    Flatten transparency
                  </span>
                  <input
                    type="checkbox"
                    checked={flattenBackground}
                    onChange={(event) => setFlattenBackground(event.target.checked)}
                    className="size-4"
                  />
                </label>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                  <span className="text-foreground font-semibold">Background color</span>
                  <input
                    type="color"
                    value={background}
                    onChange={(event) => setBackground(event.target.value)}
                    className="h-8 w-12 rounded-lg border border-black/10 bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-xs text-(--muted)">
              All processing happens on the server. GIF output is single-frame and HEIC
              support depends on server codecs.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
