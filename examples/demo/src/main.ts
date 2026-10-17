import { ParticleView } from "@reparticle/pixi";
import { Application, Assets, Graphics, type Texture, type WebGLRenderer } from "pixi.js";
import { createStats } from "./devtools";
import "./style.css";
import { validateGPU } from "./validate";
const host = document.querySelector<HTMLDivElement>("#preview")!;
const app = new Application();
try {
  await app.init({
    resizeTo: host,
    background: "#0a111c",
    antialias: false,
    preference: "webgl",
    preferWebGLVersion: 2,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  host.appendChild(app.canvas);
  let view = new ParticleView(app.renderer as WebGLRenderer, { rate: 4000 });
  const textures = await Assets.load<Texture>([
    "/textures/star.svg",
    "/textures/leaf.svg",
    "/textures/spark.svg",
  ]);
  const choices: Record<string, Texture | null> = {
    star: textures["/textures/star.svg"]!,
    leaf: textures["/textures/leaf.svg"]!,
    spark: textures["/textures/spark.svg"]!,
    procedural: null,
  };
  view.texture = choices.star!;
  const selector = document.querySelector<HTMLSelectElement>("#texture")!;
  selector.addEventListener("change", () => {
    view.texture = choices[selector.value]!;
  });
  const size = document.querySelector<HTMLInputElement>("#size")!;
  size.addEventListener("input", () => {
    view.particleSize = size.valueAsNumber;
    document.querySelector("#size-value")!.textContent = size.value + " px";
  });
  let emitter = view.emitter;
  emitter.x = host.clientWidth / 2;
  emitter.y = host.clientHeight * 0.7;
  app.stage.addChild(view);
  // A normal Pixi object after the custom draw checks scene ordering/state restoration.
  app.stage.addChild(new Graphics().roundRect(16, 16, 104, 5, 2).fill(0x70e8cc));
  const stats = createStats({
    gl: (app.renderer as WebGLRenderer).gl as WebGL2RenderingContext,
    subscribePostRender(listener) {
      const callback = () => listener(app.ticker.lastTime);
      // Pixi renders at LOW (-25). Sample only after that draw completes.
      app.ticker.add(callback, undefined, -100);
      return () => {
        app.ticker.remove(callback);
      };
    },
  });
  let statsVisible = true;
  document.querySelector("#stats-toggle")!.addEventListener("click", (event) => {
    statsVisible = !statsVisible;
    if (statsVisible) stats.show();
    else stats.hide();
    (event.currentTarget as HTMLButtonElement).textContent = statsVisible
      ? "Hide stats"
      : "Show stats";
  });
  const capacity = document.querySelector<HTMLSelectElement>("#capacity")!;
  function updateCapacityNote(): void {
    const target = emitter.options.rate * emitter.options.lifetime;
    document.querySelector("#capacity-note")!.textContent =
      target > emitter.capacity
        ? "Emission × lifetime exceeds capacity: older particles will be replaced early."
        : "Switching clears particles. Wait one lifetime before comparing FPS.";
  }
  capacity.addEventListener("change", () => {
    const previous = view;
    stats.hide();
    try {
      const next = new ParticleView(
        app.renderer as WebGLRenderer,
        emitter.options,
        Number(capacity.value),
      );
      next.texture = previous.texture;
      next.particleSize = previous.particleSize;
      next.emitter.x = emitter.x;
      next.emitter.y = emitter.y;
      next.emitter.emitting = emitter.emitting;
      app.stage.addChildAt(next, app.stage.getChildIndex(previous));
      app.stage.removeChild(previous);
      view = next;
      emitter = next.emitter;
      previous.destroy();
      document.querySelector("#count")!.textContent = emitter.capacity.toLocaleString();
      document.querySelector("#validation")!.textContent = "";
      document.querySelector("#error")!.textContent = "";
      updateCapacityNote();
    } catch (error) {
      capacity.value = String(emitter.capacity);
      document.querySelector("#error")!.textContent = `Unable to change capacity: ${String(error)}`;
    } finally {
      if (statsVisible) stats.show();
    }
  });
  updateCapacityNote();
  let paused = false;
  document.querySelector("#count")!.textContent = emitter.capacity.toLocaleString();
  app.ticker.add((ticker) => {
    if (!paused) view.update(Math.min(ticker.deltaMS / 1000, 0.05));
  });
  host.addEventListener("pointermove", (event) => {
    const rect = host.getBoundingClientRect();
    emitter.x = ((event.clientX - rect.left) * app.screen.width) / rect.width;
    emitter.y = ((event.clientY - rect.top) * app.screen.height) / rect.height;
  });
  for (const key of ["rate", "gravity", "lifetime"] as const) {
    const input = document.querySelector<HTMLInputElement>(`#${key}`)!;
    input.addEventListener("input", () => {
      emitter.setOptions({ [key]: input.valueAsNumber });
      updateCapacityNote();
      document.querySelector(`#${key}-value`)!.textContent =
        input.value + (key === "rate" ? " / s" : key === "lifetime" ? " s" : "");
    });
  }
  document.querySelector("#pause")!.addEventListener("click", (event) => {
    paused = !paused;
    (event.currentTarget as HTMLButtonElement).textContent = paused ? "Resume" : "Pause";
  });
  document.querySelector("#reset")!.addEventListener("click", () => view.reset());
  document.querySelector("#validate")!.addEventListener("click", () => {
    const report = document.querySelector("#validation")!;
    stats.hide();
    try {
      report.textContent = JSON.stringify(validateGPU(app, view), null, 2);
    } catch (error) {
      report.textContent = String(error);
    } finally {
      if (statsVisible) stats.show();
    }
  });
  document.querySelector("#status")!.textContent = "GPU.js · WebGL2 · direct GPU rendering";
  import.meta.hot?.dispose(() => {
    stats.destroy();
    app.destroy(true, { children: true });
  });
} catch (error) {
  document.querySelector("#error")!.textContent = `Unable to start the preview: ${String(error)}`;
}
