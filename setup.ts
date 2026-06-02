/**
 * Runtime audit harness setup.
 * Provides JSDOM globals, stubs Firebase + Audio, so the modules can render
 * without a real browser or network.
 */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

(globalThis as any).window = dom.window;
(dom.window as any).__MGC_AUDIT__ = true;
(globalThis as any).document = dom.window.document;
(globalThis as any).navigator = dom.window.navigator;
(globalThis as any).HTMLElement = dom.window.HTMLElement;
(globalThis as any).HTMLCanvasElement = dom.window.HTMLCanvasElement;
(globalThis as any).Image = dom.window.Image;
(globalThis as any).Element = dom.window.Element;
(globalThis as any).Node = dom.window.Node;
(globalThis as any).getComputedStyle = dom.window.getComputedStyle;
(globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 0);
(globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
(globalThis as any).localStorage = dom.window.localStorage;
(globalThis as any).matchMedia = (q: string) => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false });
function AudioCtxStub(this: any) {
  this.createOscillator = () => ({ connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {} }, type: '' });
  this.createGain = () => ({ connect() {}, gain: { setValueAtTime() {} } });
  this.destination = {};
  this.currentTime = 0;
}
(dom.window as any).AudioContext = AudioCtxStub as any;
(globalThis as any).AudioContext = AudioCtxStub as any;
// Stub canvas getContext (jsdom does not implement)
(dom.window as any).HTMLCanvasElement.prototype.getContext = function () {
  return {
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, clearRect() {},
    fillRect() {}, fillText() {}, drawImage() {}, save() {}, restore() {},
    setTransform() {}, scale() {}, translate() {}, rotate() {},
    createLinearGradient() { return { addColorStop() {} }; },
    measureText() { return { width: 10 }; },
  };
};
(dom.window as any).HTMLCanvasElement.prototype.toDataURL = function () { return 'data:image/png;base64,'; };
// scrollTo / print stubs
(dom.window as any).scrollTo = () => {};
(dom.window as any).print = () => {};
(dom.window as any).open = () => null;
(dom.window as any).alert = () => {};
(dom.window as any).confirm = () => true;
(dom.window as any).prompt = () => null;
// Hoist to globalThis for raw `alert(...)` / `confirm(...)` calls.
(globalThis as any).alert = (dom.window as any).alert;
(globalThis as any).confirm = (dom.window as any).confirm;
(globalThis as any).prompt = (dom.window as any).prompt;
