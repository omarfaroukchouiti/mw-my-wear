"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useCart } from "@/components/cart";
import { Garment } from "@/components/garment";
import { DESIGN_H, DESIGN_RATIO, DESIGN_W } from "@/lib/design";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatPrice, type GarmentType, type Product } from "@/lib/products";

/* ------------------------------------------------------------------ */
/* Design space                                                        */
/* ------------------------------------------------------------------ */

/** Where the print lands on each garment, as a fraction of the stage. */
const PRINT_AREA: Record<GarmentType, { w: number; top: number }> = {
  tee: { w: 0.34, top: 0.34 },
  oversized: { w: 0.38, top: 0.33 },
  hoodie: { w: 0.32, top: 0.47 },
  sweatshirt: { w: 0.34, top: 0.36 },
  cap: { w: 0.17, top: 0.36 },
};

const STORAGE_KEY = "mw.design.v1";

type Side = "front" | "back";

type SelectionInfo = {
  id: string;
  kind: "text" | "image" | "shape";
  count: number;
  fill: string;
  fontFamily: string;
  fontSize: number;
  textAlign: string;
  opacity: number;
  srcW: number;
  srcH: number;
  dispW: number;
  dispH: number;
  scaleX: number;
  scaleY: number;
};

type LayerInfo = {
  id: string;
  label: string;
  kind: "text" | "image" | "shape";
};

type SavedDesign = {
  piece: string;
  colorHex: string;
  size: string;
  side: Side;
  front: string;
  back: string;
  updatedAt: number;
};

type EditorApi = {
  layout: () => void;
  addText: () => void;
  addImage: (file: File) => Promise<void>;
  addShape: (kind: "rect" | "circle" | "triangle") => void;
  selectLayer: (id: string) => void;
  deleteSelected: () => void;
  duplicateSelected: () => Promise<void>;
  moveSelected: (direction: 1 | -1) => void;
  centerSelected: () => void;
  updateSelected: (patch: Record<string, unknown>) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  save: () => void;
  reset: () => void;
  switchSide: (side: Side) => Promise<void>;
  exportPrint: () => Promise<void>;
  addToCart: () => Promise<void>;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastOn(hex: string): string {
  return luminance(hex) > 0.62 ? "#111110" : "#f5f2ec";
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = src;
  });
}

/**
 * Downscale big uploads so the design still fits in localStorage, while
 * remembering the original pixel size — that is what decides real print
 * quality, so the quality meter must not measure the downscaled copy.
 */
async function prepareImage(
  file: File,
): Promise<{ dataUrl: string; srcW: number; srcH: number }> {
  const original = await readFile(file);
  const image = await loadImage(original);
  const srcW = image.width;
  const srcH = image.height;
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: original, srcW, srcH };
  ctx.drawImage(image, 0, 0, width, height);

  const hasAlpha = file.type === "image/png" || file.type === "image/webp";
  const png = canvas.toDataURL("image/png");
  if (hasAlpha && png.length < 1_400_000) return { dataUrl: png, srcW, srcH };
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.86), srcW, srcH };
}

function numberFromHex(hex: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#111110";
}

/* ------------------------------------------------------------------ */
/* Editor                                                              */
/* ------------------------------------------------------------------ */

export function StudioEditor({
  locale,
  dict,
  products,
  initialSlug,
}: {
  locale: Locale;
  dict: Dictionary;
  products: Product[];
  initialSlug?: string;
}) {
  const { add } = useCart();
  const t = dict.editor;

  const initialProduct =
    products.find((product) => product.slug === initialSlug) ?? products[0];

  const [piece, setPiece] = useState<Product>(initialProduct);
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState(initialProduct.sizes[0]);
  const [side, setSide] = useState<Side>("front");
  const [flip, setFlip] = useState<"idle" | "out" | "in">("idle");
  const [selected, setSelected] = useState<SelectionInfo | null>(null);
  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [qualityTarget, setQualityTarget] = useState<150 | 200 | 300>(300);
  const [rightsAccepted, setRightsAccepted] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const flipTimers = useRef<number[]>([]);
  const flippingRef = useRef(false);
  const apiRef = useRef<EditorApi | null>(null);

  const canvasRef = useRef<any>(null);
  const fabricRef = useRef<any>(null);
  const pieceRef = useRef(piece);
  const colorRef = useRef(piece.colors[0]);
  const sizeRef = useRef(size);
  const sideRef = useRef<Side>("front");
  const dimsRef = useRef({ cw: 0, ch: 0 });

  useEffect(() => {
    pieceRef.current = piece;
  }, [piece]);

  useEffect(() => {
    colorRef.current = piece.colors[colorIndex] ?? piece.colors[0];
  }, [piece, colorIndex]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    sideRef.current = side;
  }, [side]);

  useEffect(
    () => () => {
      flipTimers.current.forEach((id) => window.clearTimeout(id));
    },
    [],
  );

  const color = piece.colors[colorIndex] ?? piece.colors[0];
  const area = PRINT_AREA[piece.type];

  /* ---------------------------------------------------------------- */
  /* Fabric bootstrap — all canvas logic lives in this one effect      */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    let alive = true;
    let canvas: any = null;
    let observer: ResizeObserver | null = null;
    let snapTimer: number | undefined;
    let saveTimer: number | undefined;
    let cleanupKeys: (() => void) | null = null;
    let restoring = false;

    const store: Record<Side, string> = { front: "", back: "" };
    const history: Record<Side, string[]> = { front: [], back: [] };
    const pointer: Record<Side, number> = { front: 0, back: 0 };

    const stage = stageRef.current;
    if (!stage) return;

    const refreshHistoryState = () => {
      const current = sideRef.current;
      const stack = history[current];
      setCanUndo(pointer[current] > 0);
      setCanRedo(pointer[current] < stack.length - 1);
    };

    const saveDesign = () => {
      if (!canvas) return;
      const data: SavedDesign = {
        piece: pieceRef.current.slug,
        colorHex: colorRef.current.hex,
        size: sizeRef.current,
        side: sideRef.current,
        front: store.front,
        back: store.back,
        updatedAt: Date.now(),
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setSavedAt(data.updatedAt);
      } catch {
        // Storage full: the design still works for this session.
      }
    };

    const scheduleSave = () => {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(saveDesign, 800);
    };

    const snapshot = () => {
      if (!canvas || restoring) return;
      const current = sideRef.current;
      const json = JSON.stringify(canvas.toJSON(["mwSrcW", "mwSrcH"]));
      const stack = history[current];
      if (stack[pointer[current]] === json) return;
      stack.splice(pointer[current] + 1);
      stack.push(json);
      if (stack.length > 60) stack.shift();
      pointer[current] = stack.length - 1;
      store[current] = json;
      refreshHistoryState();
      scheduleSave();
    };

    const snapshotSoon = () => {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snapshot, 320);
    };

    const kindOf = (object: any): SelectionInfo["kind"] => {
      if (object?.type === "image") return "image";
      if (object?.type === "textbox" || object?.type === "i-text" || object?.type === "text") {
        return "text";
      }
      return "shape";
    };

    const labelFor = (object: any): string => {
      if (object?.mwLabel) return object.mwLabel;
      const kind = kindOf(object);
      if (kind === "text") {
        const text = String(object.text ?? "").trim();
        return text ? text.slice(0, 18) : locale === "ar" ? "نص" : "Text";
      }
      if (kind === "image") return locale === "ar" ? "صورة" : "Image";
      if (object?.type === "circle") return locale === "ar" ? "دائرة" : "Circle";
      if (object?.type === "triangle") return locale === "ar" ? "مثلث" : "Triangle";
      return locale === "ar" ? "مربع" : "Square";
    };

    const tag = (object: any) => {
      if (!object.mwId) object.mwId = uid();
      object.mwLabel = labelFor(object);
      return object;
    };

    const tagAll = () => {
      canvas?.getObjects().forEach((object: any) => {
        if (!object.mwId) object.mwId = uid();
      });
    };

    const syncLayers = () => {
      if (!canvas) return;
      setLayers(
        canvas
          .getObjects()
          .map((object: any) => ({
            id: object.mwId ?? uid(),
            kind: kindOf(object),
            label: labelFor(object),
          }))
          .reverse(),
      );
    };

    const syncSelection = () => {
      if (!canvas) return;
      const objects = canvas.getActiveObjects();
      if (!objects.length) {
        setSelected(null);
        return;
      }
      const object: any = objects[0];
      setSelected({
        id: object.mwId ?? "",
        kind: kindOf(object),
        count: objects.length,
        fill: typeof object.fill === "string" ? object.fill : "#111110",
        fontFamily: String(object.fontFamily ?? "Cairo"),
        fontSize: Math.round(Number(object.fontSize ?? 0)),
        textAlign: String(object.textAlign ?? "center"),
        opacity: Number(object.opacity ?? 1),
        srcW: Math.round(Number(object.mwSrcW ?? object.width ?? 0)),
        srcH: Math.round(Number(object.mwSrcH ?? object.height ?? 0)),
        dispW: Number(object.width ?? 0),
        dispH: Number(object.height ?? 0),
        scaleX: Number(object.scaleX ?? 1),
        scaleY: Number(object.scaleY ?? 1),
      });
    };

    const clamp = (object: any) => {
      if (!object) return;
      object.left = Math.min(Math.max(object.left, 0), DESIGN_W);
      object.top = Math.min(Math.max(object.top, 0), DESIGN_H);
    };

    const loadSide = async (json: string) => {
      if (!canvas) return;
      restoring = true;
      canvas.discardActiveObject();
      try {
        await canvas.loadFromJSON(json || { objects: [] });
      } catch {
        canvas.getObjects().forEach((object: any) => canvas.remove(object));
      }
      tagAll();
      canvas.setZoom(dimsRef.current.cw / DESIGN_W);
      canvas.requestRenderAll();
      restoring = false;
      syncSelection();
      syncLayers();
      refreshHistoryState();
    };

    /** True when a stored side actually contains artwork. */
    const hasObjects = (json: string): boolean => {
      try {
        const parsed = JSON.parse(json || "{}");
        return Array.isArray(parsed.objects) && parsed.objects.length > 0;
      } catch {
        return false;
      }
    };

    /**
     * Render one side at print proportions into a throwaway canvas.
     * Returns null when the side is empty.
     */
    const renderSidePreview = async (json: string, widthPx: number): Promise<string | null> => {
      const fabric = fabricRef.current;
      if (!fabric || !hasObjects(json)) return null;
      const element = document.createElement("canvas");
      const offscreen = new fabric.StaticCanvas(element, {
        width: DESIGN_W,
        height: DESIGN_H,
      });
      try {
        await offscreen.loadFromJSON(JSON.parse(json));
        return offscreen.toDataURL({ format: "png", multiplier: widthPx / DESIGN_W });
      } catch {
        return null;
      } finally {
        offscreen.dispose();
      }
    };

    const api: EditorApi = {
      layout: () => {
        if (!canvas || !stage) return;
        const sw = stage.clientWidth;
        if (!sw) return;
        const cw = Math.round(sw);
        const ch = Math.round(cw * DESIGN_RATIO);
        dimsRef.current = { cw, ch };
        canvas.setDimensions({ width: cw, height: ch });
        canvas.setZoom(cw / DESIGN_W);
        canvas.requestRenderAll();
      },

      addText: () => {
        const fabric = fabricRef.current;
        if (!canvas || !fabric) return;
        const text = new fabric.Textbox(locale === "ar" ? "نصك هنا" : "YOUR TEXT", {
          left: DESIGN_W / 2,
          top: DESIGN_H / 2,
          originX: "center",
          originY: "center",
          width: 820,
          fontFamily: "Cairo",
          fontWeight: "700",
          fontSize: 110,
          fill: contrastOn(colorRef.current.hex),
          textAlign: "center",
          splitByGrapheme: false,
          editable: true,
        });
        tag(text);
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.requestRenderAll();
        syncSelection();
        snapshot();
      },

      addImage: async (file: File) => {
        const fabric = fabricRef.current;
        if (!canvas || !fabric) return;
        setUploading(true);
        try {
          const prepared = await prepareImage(file);
          const image = await fabric.FabricImage.fromURL(prepared.dataUrl, {
            crossOrigin: "anonymous",
          });
          image.mwSrcW = prepared.srcW;
          image.mwSrcH = prepared.srcH;
          const maxW = DESIGN_W * 0.62;
          const maxH = DESIGN_H * 0.5;
          const scale = Math.min(maxW / (image.width || 1), maxH / (image.height || 1), 1.2);
          image.set({
            left: DESIGN_W / 2,
            top: DESIGN_H / 2,
            originX: "center",
            originY: "center",
            scaleX: scale,
            scaleY: scale,
          });
          tag(image);
          canvas.add(image);
          canvas.setActiveObject(image);
          canvas.requestRenderAll();
          syncSelection();
          snapshot();
        } finally {
          setUploading(false);
        }
      },

      addShape: (kind) => {
        const fabric = fabricRef.current;
        if (!canvas || !fabric) return;
        const fill = contrastOn(colorRef.current.hex);
        const common = {
          left: DESIGN_W / 2,
          top: DESIGN_H / 2,
          originX: "center" as const,
          originY: "center" as const,
          fill,
        };
        const shape =
          kind === "circle"
            ? new fabric.Circle({ ...common, radius: 220 })
            : kind === "triangle"
              ? new fabric.Triangle({ ...common, width: 400, height: 360 })
              : new fabric.Rect({ ...common, width: 400, height: 400 });
        tag(shape);
        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.requestRenderAll();
        syncSelection();
        snapshot();
      },

      selectLayer: (id: string) => {
        if (!canvas) return;
        const object = canvas.getObjects().find((item: any) => item.mwId === id);
        if (!object) return;
        canvas.setActiveObject(object);
        canvas.requestRenderAll();
        syncSelection();
      },

      deleteSelected: () => {
        if (!canvas) return;
        const objects = canvas.getActiveObjects();
        if (!objects.length) return;
        objects.forEach((object: any) => canvas.remove(object));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        syncSelection();
        snapshot();
      },

      duplicateSelected: async () => {
        if (!canvas) return;
        const object = canvas.getActiveObject();
        if (!object) return;
        const clone = await object.clone();
        clone.set({
          left: (object.left ?? 0) + 48,
          top: (object.top ?? 0) + 48,
          mwId: uid(),
        });
        tagAll();
        canvas.add(clone);
        canvas.setActiveObject(clone);
        canvas.requestRenderAll();
        syncSelection();
        snapshot();
      },

      moveSelected: (direction) => {
        if (!canvas) return;
        const object = canvas.getActiveObject();
        if (!object) return;
        if (direction > 0) canvas.bringObjectForward(object);
        else canvas.sendObjectBackwards(object);
        canvas.requestRenderAll();
        syncLayers();
        snapshot();
      },

      centerSelected: () => {
        if (!canvas) return;
        const object = canvas.getActiveObject();
        if (!object) return;
        object.set({
          originX: "center",
          originY: "center",
          left: DESIGN_W / 2,
          top: DESIGN_H / 2,
        });
        if (typeof object.setCoords === "function") object.setCoords();
        canvas.requestRenderAll();
        syncSelection();
        snapshotSoon();
      },

      updateSelected: (patch) => {
        if (!canvas) return;
        const objects = canvas.getActiveObjects();
        objects.forEach((object: any) => object.set(patch));
        objects.forEach((object: any) => {
          if (typeof object.setCoords === "function") object.setCoords();
        });
        canvas.requestRenderAll();
        syncSelection();
        syncLayers();
        snapshotSoon();
      },

      undo: async () => {
        const current = sideRef.current;
        if (pointer[current] <= 0) return;
        pointer[current] -= 1;
        await loadSide(history[current][pointer[current]]);
        store[current] = history[current][pointer[current]];
        scheduleSave();
        refreshHistoryState();
      },

      redo: async () => {
        const current = sideRef.current;
        if (pointer[current] >= history[current].length - 1) return;
        pointer[current] += 1;
        await loadSide(history[current][pointer[current]]);
        store[current] = history[current][pointer[current]];
        scheduleSave();
        refreshHistoryState();
      },

      save: () => {
        snapshot();
        saveDesign();
        setNotice(t.saved);
        window.setTimeout(() => setNotice(null), 1800);
      },

      reset: () => {
        if (!canvas) return;
        if (!window.confirm(t.confirmReset)) return;
        canvas.getObjects().forEach((object: any) => canvas.remove(object));
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        history.front = [];
        history.back = [];
        pointer.front = 0;
        pointer.back = 0;
        store.front = JSON.stringify({ objects: [] });
        store.back = JSON.stringify({ objects: [] });
        history[sideRef.current] = [store[sideRef.current]];
        syncSelection();
        syncLayers();
        refreshHistoryState();
        saveDesign();
      },

      switchSide: async (next) => {
        if (!canvas || next === sideRef.current) return;
        snapshot();
        sideRef.current = next;
        setSide(next);
        await loadSide(store[next] || JSON.stringify({ objects: [] }));
        refreshHistoryState();
      },

      exportPrint: async () => {
        if (!canvas) return;
        snapshot();
        setBusy(true);
        try {
          const { cw } = dimsRef.current;
          // At the current zoom one design pixel covers cw/1200 screen pixels,
          // so this multiplier always yields a 3600px wide print file.
          const url = canvas.toDataURL({ format: "png", multiplier: 3600 / cw });
          const link = document.createElement("a");
          link.href = url;
          link.download = `MW-${pieceRef.current.slug}-${sideRef.current}-print.png`;
          link.click();
          setNotice(t.export);
          window.setTimeout(() => setNotice(null), 2200);
        } finally {
          setBusy(false);
        }
      },

      addToCart: async () => {
        if (!canvas) return;
        snapshot();
        setBusy(true);
        try {
          // Render each side on its own offscreen canvas so a design that only
          // exists on the back still reaches the cart with its preview.
          const [frontPreview, backPreview] = await Promise.all([
            renderSidePreview(store.front, 300),
            renderSidePreview(store.back, 300),
          ]);
          add({
            slug: pieceRef.current.slug,
            type: pieceRef.current.type,
            colorHex: colorRef.current.hex,
            colorNameAr: colorRef.current.name.ar,
            colorNameEn: colorRef.current.name.en,
            size: sizeRef.current,
            price: pieceRef.current.price,
            qty: 1,
            front: hasObjects(store.front)
              ? { design: store.front, preview: frontPreview ?? undefined }
              : undefined,
            back: hasObjects(store.back)
              ? { design: store.back, preview: backPreview ?? undefined }
              : undefined,
          });
          setNotice(t.added);
          window.setTimeout(() => setNotice(null), 2500);
        } finally {
          setBusy(false);
        }
      },
    };

    apiRef.current = api;

    (async () => {
      const fabric = await import("fabric");
      if (!alive) return;
      fabricRef.current = fabric;

      const element = document.createElement("canvas");
      stage.appendChild(element);

      canvas = new fabric.Canvas(element, {
        preserveObjectStacking: true,
        selection: true,
        controlsAboveOverlay: true,
      });
      canvasRef.current = canvas;
      if (process.env.NODE_ENV !== "production") {
        (window as unknown as { __mwCanvas?: unknown }).__mwCanvas = canvas;
      }

      let restored: SavedDesign | null = null;
      try {
        const raw = !initialSlug ? window.localStorage.getItem(STORAGE_KEY) : null;
        if (raw) restored = JSON.parse(raw) as SavedDesign;
      } catch {
        restored = null;
      }

      if (restored && products.some((item) => item.slug === restored!.piece)) {
        const product = products.find((item) => item.slug === restored!.piece)!;
        const index = Math.max(
          0,
          product.colors.findIndex((item) => item.hex === restored!.colorHex),
        );
        pieceRef.current = product;
        colorRef.current = product.colors[index];
        sizeRef.current = restored.size;
        sideRef.current = restored.side === "back" ? "back" : "front";
        setPiece(product);
        setColorIndex(index);
        setSize(restored.size);
        setSide(sideRef.current);
        store.front = restored.front ?? "";
        store.back = restored.back ?? "";
        setSavedAt(restored.updatedAt ?? null);
      }

      api.layout();

      observer = new ResizeObserver(() => api.layout());
      observer.observe(stage);

      canvas.on("selection:created", syncSelection);
      canvas.on("selection:updated", syncSelection);
      canvas.on("selection:cleared", syncSelection);
      canvas.on("object:added", () => {
        syncLayers();
        snapshotSoon();
      });
      canvas.on("object:removed", () => {
        syncLayers();
        snapshotSoon();
      });
      canvas.on("object:modified", () => {
        syncLayers();
        snapshot();
      });
      canvas.on("text:changed", () => {
        syncLayers();
        snapshotSoon();
      });
      canvas.on("object:moving", (event: any) => clamp(event.target));
      canvas.on("object:scaling", (event: any) => clamp(event.target));

      if (restored) {
        await loadSide(store[sideRef.current] || JSON.stringify({ objects: [] }));
      } else {
        store.front = JSON.stringify(canvas.toJSON(["mwSrcW", "mwSrcH"]));
      }

      const seed = (which: Side) => {
        if (!store[which]) store[which] = JSON.stringify({ objects: [] });
        history[which] = [store[which]];
        pointer[which] = 0;
      };
      seed("front");
      seed("back");

      syncLayers();
      syncSelection();
      refreshHistoryState();
      if (alive) setReady(true);

      const onKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
        const active: any = canvas?.getActiveObject();
        if (!active || active.isEditing) return;
        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          api.deleteSelected();
        }
      };
      window.addEventListener("keydown", onKeyDown);
      cleanupKeys = () => window.removeEventListener("keydown", onKeyDown);
    })();

    return () => {
      alive = false;
      window.clearTimeout(snapTimer);
      window.clearTimeout(saveTimer);
      observer?.disconnect();
      cleanupKeys?.();
      apiRef.current = null;
      canvasRef.current = null;
      if (canvas) canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeSide = (next: Side) => {
    if (next === side || flippingRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      flippingRef.current = true;
      const pending = apiRef.current?.switchSide(next);
      if (pending) void pending.finally(() => (flippingRef.current = false));
      else flippingRef.current = false;
      return;
    }
    flippingRef.current = true;
    setFlip("out");
    const out = window.setTimeout(async () => {
      try {
        await apiRef.current?.switchSide(next);
        setFlip("in");
        const settle = window.setTimeout(() => {
          flippingRef.current = false;
          setFlip("idle");
        }, 280);
        flipTimers.current.push(settle);
      } catch {
        flippingRef.current = false;
        setFlip("idle");
      }
    }, 180);
    flipTimers.current.push(out);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setNotice(t.tooBig);
      window.setTimeout(() => setNotice(null), 2600);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    await apiRef.current?.addImage(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const sizeLabel = (value: string) =>
    value === "ONE" ? (locale === "ar" ? "مقاس واحد" : "One size") : value;

  /* ---------------------------------------------------------------- */
  /* Print-quality math (design space: 1200 × 1600 units = 30 × 40 cm)  */
  /* ---------------------------------------------------------------- */
  const imageSel = selected?.kind === "image" ? selected : null;
  const placedWcm = imageSel ? imageSel.scaleX * imageSel.dispW * (30 / DESIGN_W) : 0;
  const placedHcm = imageSel ? imageSel.scaleY * imageSel.dispH * (40 / DESIGN_H) : 0;
  const effectiveDpi =
    imageSel && placedWcm > 0.2 ? imageSel.srcW / (placedWcm / 2.54) : 0;
  const maxPrintCm =
    imageSel && effectiveDpi > 0 ? (imageSel.srcW * 2.54) / qualityTarget : 0;
  const qualityVerdict = !imageSel
    ? null
    : effectiveDpi >= 280
      ? t.qExcellent
      : effectiveDpi >= 200
        ? t.qGood
        : effectiveDpi >= 150
          ? t.qFair
          : t.qLow;
  const verdictDot =
    qualityVerdict === null
      ? "bg-line"
      : qualityVerdict === t.qExcellent
        ? "bg-ink"
        : qualityVerdict === t.qGood
          ? "bg-accent"
          : qualityVerdict === t.qFair
            ? "bg-ink-soft"
            : "bg-red-700";
  // Widest the selected image can go while still fitting the 30×40cm area.
  const sliderMax = imageSel
    ? Math.min(
        30,
        Math.floor(((40 * imageSel.dispW) / Math.max(1, imageSel.dispH)) * 2) / 2,
      )
    : 30;
  const sliderValue = imageSel
    ? Math.min(Math.max(3, Math.round(placedWcm * 2) / 2), sliderMax)
    : 3;
  const numberFormat = new Intl.NumberFormat("en-US");
  const printBorder =
    luminance(color.hex) > 0.45 ? "rgba(17,17,17,0.3)" : "rgba(255,255,255,0.55)";

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_370px] xl:grid-cols-[minmax(0,1fr)_400px]">
      {/* ------------------------------ stage ----------------------------- */}
      <section className="overflow-hidden rounded-3xl border border-line bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2.5">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
            {products.map((product) => (
              <button
                key={product.slug}
                type="button"
                aria-pressed={product.slug === piece.slug}
                onClick={() => {
                  setPiece(product);
                  setColorIndex(0);
                  setSize(product.sizes[0]);
                }}
                className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition-colors ${
                  product.slug === piece.slug
                    ? "border-ink bg-ink text-paper"
                    : "border-line text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {product.name[locale]}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="flex items-center rounded-full border border-line p-1">
              {(["front", "back"] as Side[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={side === value}
                  disabled={flip !== "idle"}
                  onClick={() => changeSide(value)}
                  className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors disabled:cursor-wait ${
                    side === value ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {value === "front" ? t.front : t.back}
                </button>
              ))}
            </div>

            <IconButton
              onClick={() => void apiRef.current?.undo()}
              disabled={!canUndo}
              label={t.undo}
            >
              ↺
            </IconButton>
            <IconButton
              onClick={() => void apiRef.current?.redo()}
              disabled={!canRedo}
              label={t.redo}
            >
              ↻
            </IconButton>
            <IconButton onClick={() => apiRef.current?.save()} label={t.save}>
              ⌷
            </IconButton>
            <IconButton onClick={() => apiRef.current?.reset()} label={t.reset}>
              ✕
            </IconButton>
          </div>
        </div>

        <div className="bg-stage px-3 py-8 sm:px-6 md:py-10">
          <div
            className={`relative mx-auto w-full max-w-[440px] xl:max-w-[520px] ${
              flip === "out" ? "mw-flip-out" : flip === "in" ? "mw-flip-in" : ""
            } ${flip !== "idle" ? "pointer-events-none" : ""}`}
            style={{ aspectRatio: "400 / 470" }}
            aria-busy={flip !== "idle"}
          >
            <Garment
              type={piece.type}
              color={color.hex}
              side={side}
              mark={false}
              className="absolute inset-0 h-full w-full"
            />
            <div
              ref={stageRef}
              className="absolute border border-dashed"
              style={{
                left: `${((1 - area.w) / 2) * 100}%`,
                top: `${area.top * 100}%`,
                width: `${area.w * 100}%`,
                aspectRatio: `${DESIGN_W} / ${DESIGN_H}`,
                borderColor: printBorder,
              }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-paper px-2.5 py-1 text-[9px] font-bold tracking-[0.06em] text-ink"
              style={{ top: `calc(${area.top * 100}% - 13px)` }}
            >
              {t.printTag}
            </span>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                …
              </div>
            )}
          </div>
        </div>

        <p className="border-t border-line bg-paper px-4 py-3 text-[10px] leading-relaxed text-ink-soft md:px-5">
          {t.dragHint}
        </p>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line bg-paper px-4 py-4 md:px-5">
          <div>
            <p className="mb-2 text-[11px]">
              <span className="text-ink-soft">{t.colour}: </span>
              <span className="font-extrabold">{color.name[locale]}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {piece.colors.map((item, index) => (
                <button
                  key={item.hex}
                  type="button"
                  onClick={() => setColorIndex(index)}
                  aria-label={item.name[locale]}
                  aria-pressed={index === colorIndex}
                  className={`h-9 w-9 rounded-full border p-0.5 transition-colors ${
                    index === colorIndex ? "border-ink ring-2 ring-ink/15" : "border-line hover:border-ink/50"
                  }`}
                >
                  <span
                    className="block h-full w-full rounded-full"
                    style={{ backgroundColor: item.hex }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] text-ink-soft">{t.size}</p>
            <div className="flex flex-wrap gap-1.5">
              {piece.sizes.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={size === item}
                  onClick={() => setSize(item)}
                  className={`rounded-lg border px-3 py-2 text-[11px] font-bold transition-colors ${
                    size === item ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
                  }`}
                >
                  {sizeLabel(item)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper px-4 py-3 text-[10px] text-ink-soft md:px-5">
          <span>
            {savedAt
              ? `${t.saved} · ${new Date(savedAt).toLocaleTimeString(
                  locale === "ar" ? "ar-DZ" : "en-GB",
                  { hour: "2-digit", minute: "2-digit" },
                )}`
              : t.designNote}
          </span>
          <span>{t.printNote}</span>
        </div>
      </section>

      {/* ----------------------------- sidebar ---------------------------- */}
      <aside className="flex flex-col gap-3">
        {/* your image */}
        <div className="mw-card px-4 py-4 md:px-5">
          <p className="text-[13px] font-extrabold">{t.yourImage}</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mw-btn mw-btn-solid mt-3 w-full px-4 text-[12px]"
          >
            {uploading ? t.uploading : t.uploadCta}
            <span aria-hidden="true">↑</span>
          </button>
          <p className="mt-2 text-[10px] text-ink-soft">{t.uploadHint}</p>

          <Field label={t.qualityTarget}>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { value: 150, label: t.tqNormal },
                  { value: 200, label: t.tqMedium },
                  { value: 300, label: t.tqHigh },
                ] as { value: 150 | 200 | 300; label: string }[]
              ).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={qualityTarget === item.value}
                  onClick={() => setQualityTarget(item.value)}
                  className={`rounded-full border py-2 text-[11px] font-bold transition-colors ${
                    qualityTarget === item.value
                      ? "border-ink bg-ink text-paper"
                      : "border-line text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t.quickAdd}>
            <div className="grid grid-cols-3 gap-1.5">
              <ToolButton onClick={() => apiRef.current?.addText()} label={t.addText} icon="T" />
              <ToolButton
                onClick={() => apiRef.current?.addShape("rect")}
                label={t.square}
                icon="□"
              />
              <ToolButton
                onClick={() => apiRef.current?.addShape("circle")}
                label={t.circle}
                icon="○"
              />
            </div>
          </Field>

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </div>

        {/* print quality */}
        <section
          aria-label={t.quality}
          className="rounded-2xl border border-line bg-accent-soft px-4 py-4 md:px-5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-[13px] font-extrabold">
              <span
                aria-hidden="true"
                className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[8px] text-paper ${verdictDot}`}
              >
                ✓
              </span>
              {t.quality}
            </p>
            {qualityVerdict && (
              <p className="text-[12px] font-extrabold">{qualityVerdict}</p>
            )}
          </div>
          <div className="mt-2.5 space-y-1 text-[11px] leading-relaxed text-ink-soft">
            {imageSel ? (
              <>
                <p>
                  {numberFormat.format(Math.round(imageSel.srcW))} ×{" "}
                  {numberFormat.format(Math.round(imageSel.srcH))} {t.qPx} · {t.qMax}{" "}
                  {maxPrintCm.toFixed(1)} {t.cm}
                </p>
                <p className="font-semibold text-ink">
                  {effectiveDpi >= 150 ? t.qGoodNote : t.qLowNote}
                </p>
              </>
            ) : (
              <p>{t.qNone}</p>
            )}
          </div>
        </section>

        {/* image size */}
        <div className="mw-card px-4 py-4 md:px-5">
          <p className="text-[13px] font-extrabold">{t.imageSize}</p>
          {imageSel ? (
            <>
              <Field label={`${t.imgWidth} — ${placedWcm.toFixed(1)} ${t.cm}`}>
                <input
                  type="range"
                  min={3}
                  max={sliderMax}
                  step={0.5}
                  value={sliderValue}
                  onChange={(event) => {
                    if (!imageSel) return;
                    const cm = Number(event.target.value);
                    const scale = (cm * (DESIGN_W / 30)) / Math.max(1, imageSel.dispW);
                    const patch: Record<string, unknown> = { scaleX: scale };
                    if (Math.abs(imageSel.scaleY - imageSel.scaleX) < 0.02) {
                      patch.scaleY = scale;
                    }
                    apiRef.current?.updateSelected(patch);
                  }}
                  className="w-full accent-ink"
                />
              </Field>
              <p className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-ink-soft">{t.imgHeight}</span>
                <span className="font-bold tabular-nums">
                  {placedHcm.toFixed(1)} {t.cm}
                </span>
              </p>
              <button
                type="button"
                onClick={() => apiRef.current?.centerSelected()}
                className="mw-btn mw-btn-ghost mt-3 w-full px-4 py-2 text-[11px]"
              >
                {t.centerImage}
              </button>
            </>
          ) : (
            <p className="mt-2.5 rounded-xl border border-dashed border-line px-3 py-5 text-center text-[11px] leading-relaxed text-ink-soft">
              {t.noImageMeasure}
            </p>
          )}
        </div>

        {/* layers + properties */}
        <div className="mw-card px-4 py-4 md:px-5">
          <p className="text-[13px] font-extrabold">{t.layersAndProps}</p>

          <Field label={t.layers}>
            {layers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[11px] leading-relaxed text-ink-soft">
                {t.emptyLayers}
              </p>
            ) : (
              <ul className="space-y-1">
                {layers.map((layer) => (
                  <li key={layer.id}>
                    <button
                      type="button"
                      onClick={() => apiRef.current?.selectLayer(layer.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-start text-[11px] transition-colors ${
                        selected?.id === layer.id
                          ? "border-ink bg-paper-dim"
                          : "border-line hover:border-ink/40"
                      }`}
                    >
                      <span className="w-3 text-center text-ink-soft">
                        {layer.kind === "text" ? "T" : layer.kind === "image" ? "▣" : "◇"}
                      </span>
                      <span className="truncate">{layer.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>

          {selected && (
            <div className="mt-4 border-t border-line pt-4">
              {selected.count > 1 && (
                <p className="mb-2 text-[11px] font-semibold">
                  {layers.find((layer) => layer.id === selected.id)?.label ?? ""} +{selected.count - 1}
                </p>
              )}

              {selected.kind === "text" && (
                <>
                  <Field label={t.font}>
                    <select
                      value={selected.fontFamily}
                      onChange={(event) =>
                        apiRef.current?.updateSelected({ fontFamily: event.target.value })
                      }
                      className="w-full rounded-lg border border-line bg-paper px-2 py-1.5 text-[11px]"
                    >
                      {[
                        { value: "Cairo", label: "Cairo" },
                        { value: "Anton", label: "Anton" },
                        { value: "Times New Roman", label: "Times" },
                        { value: "Courier New", label: "Courier" },
                      ].map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label={`${t.fontSize} — ${selected.fontSize}`}>
                    <input
                      type="range"
                      min={30}
                      max={280}
                      value={selected.fontSize || 110}
                      onChange={(event) =>
                        apiRef.current?.updateSelected({ fontSize: Number(event.target.value) })
                      }
                      className="w-full accent-ink"
                    />
                  </Field>

                  <Field label={t.align}>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { value: "left", icon: "⇤" },
                        { value: "center", icon: "↔" },
                        { value: "right", icon: "⇥" },
                      ].map((align) => (
                        <button
                          key={align.value}
                          type="button"
                          onClick={() =>
                            apiRef.current?.updateSelected({ textAlign: align.value })
                          }
                          className={`rounded-lg border py-1.5 text-[11px] transition-colors ${
                            selected.textAlign === align.value
                              ? "border-ink bg-ink text-paper"
                              : "border-line hover:border-ink"
                          }`}
                        >
                          {align.icon}
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}

              {selected.kind !== "text" && (
                <Field label={t.fill}>
                  <input
                    type="color"
                    value={numberFromHex(selected.fill)}
                    onChange={(event) =>
                      apiRef.current?.updateSelected({ fill: event.target.value })
                    }
                    className="h-9 w-full cursor-pointer rounded-lg border border-line bg-paper"
                  />
                </Field>
              )}

              <Field label={`${t.opacity} — ${Math.round(selected.opacity * 100)}%`}>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(selected.opacity * 100)}
                  onChange={(event) =>
                    apiRef.current?.updateSelected({ opacity: Number(event.target.value) / 100 })
                  }
                  className="w-full accent-ink"
                />
              </Field>

              <div className="grid grid-cols-2 gap-1.5">
                <SmallButton onClick={() => void apiRef.current?.duplicateSelected()}>
                  {t.duplicate}
                </SmallButton>
                <SmallButton onClick={() => apiRef.current?.moveSelected(1)}>
                  {t.forward}
                </SmallButton>
                <SmallButton onClick={() => apiRef.current?.moveSelected(-1)}>
                  {t.backward}
                </SmallButton>
                <SmallButton onClick={() => apiRef.current?.deleteSelected()} danger>
                  {t.delete}
                </SmallButton>
              </div>
            </div>
          )}

          {!selected && (
            <p className="mt-3 rounded-xl border border-dashed border-line px-3 py-6 text-center text-[11px] leading-relaxed text-ink-soft">
              {t.noSelection}
            </p>
          )}
        </div>

        {/* tip */}
        <div className="mw-card px-4 py-4 md:px-5">
          <p className="text-[13px] font-extrabold">{t.tip}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">{t.tipText}</p>
        </div>

        {/* image rights — optional by decision */}
        <div className="mw-card px-4 py-4 md:px-5">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={rightsAccepted}
              onChange={(event) => setRightsAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
            />
            <span className="text-[12px] font-semibold leading-snug">{t.rightsLine}</span>
          </label>
          <p className="mt-2.5 text-[10px] leading-relaxed text-ink-soft">{t.rightsNote}</p>
          <p className="mt-1 text-[9px] text-ink-soft">{t.rightsHint}</p>
        </div>

        {/* order */}
        <div className="mw-card px-4 py-4 md:px-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-extrabold">{piece.name[locale]}</p>
              <p className="mt-0.5 truncate text-[10px] text-ink-soft">
                {color.name[locale]} · {sizeLabel(size)}
              </p>
            </div>
            <p className="text-lg font-black tabular-nums">
              {formatPrice(piece.price, locale)}
            </p>
          </div>
          <div className="mt-3 grid gap-1.5">
            <button
              type="button"
              onClick={() => void apiRef.current?.addToCart()}
              disabled={busy}
              className="mw-btn mw-btn-solid w-full px-4 text-[12px]"
            >
              {busy ? t.adding : t.addToCart}
            </button>
            <button
              type="button"
              onClick={() => void apiRef.current?.exportPrint()}
              disabled={busy}
              className="mw-btn mw-btn-ghost w-full px-4 text-[11px]"
            >
              {t.export}
            </button>
          </div>
        </div>
      </aside>

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <p className="rounded-full border border-ink bg-ink px-4 py-2 text-[11px] font-semibold text-paper">
            {notice}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-ink-soft">{label}</p>
      {children}
    </div>
  );
}

function ToolButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-xl border border-line py-2.5 text-[10px] transition-colors hover:border-ink"
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="px-1 text-center leading-tight">{label}</span>
    </button>
  );
}

function IconButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-sm transition-colors hover:border-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function SmallButton({
  onClick,
  children,
  danger,
}: {
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-[11px] transition-colors hover:border-ink ${
        danger ? "border-line text-red-700" : "border-line"
      }`}
    >
      {children}
    </button>
  );
}
