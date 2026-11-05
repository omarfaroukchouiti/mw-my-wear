import { DESIGN_H, DESIGN_W, PRINT_WIDTH } from "./design";

/**
 * Rebuild a stored fabric scene in the browser and export it at print size.
 * Fabric runs client-side only, so the admin dashboard does the rendering.
 */
export async function downloadPrintFile(
  design: string,
  filename: string,
): Promise<boolean> {
  if (typeof document === "undefined" || !design) return false;

  let scene: string | Record<string, unknown>;
  try {
    scene = JSON.parse(design) as Record<string, unknown>;
  } catch {
    return false;
  }

  try {
    await document.fonts.ready;
  } catch {
    // Older browsers: render with fallback fonts rather than failing.
  }

  const fabric = await import("fabric");
  const element = document.createElement("canvas");
  const canvas = new fabric.StaticCanvas(element, {
    width: DESIGN_W,
    height: DESIGN_H,
  });

  try {
    await canvas.loadFromJSON(scene);
    canvas.requestRenderAll();
    const url = canvas.toDataURL({
      format: "png",
      multiplier: PRINT_WIDTH / DESIGN_W,
    });
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } catch {
    return false;
  } finally {
    canvas.dispose();
  }
}
