const MODULE_ID = "gga-hit-location-bucket";

const DEFAULT_LOCATIONS = [
  { id: "eye", label: "Eye", mod: -9, order: 10 },
  { id: "skull", label: "Skull", mod: -7, order: 20 },
  { id: "face", label: "Face", mod: -5, order: 30 },
  { id: "neck", label: "Neck", mod: -5, order: 40 },
  { id: "head", label: "Head", mod: -5, order: 50 },
  { id: "torso", label: "Torso", mod: 0, order: 60 },
  { id: "vitals", label: "Vitals", mod: -3, order: 70 },
  { id: "groin", label: "Groin", mod: -3, order: 80 },
  { id: "arm-l", label: "Left Arm", mod: -2, order: 90 },
  { id: "arm-r", label: "Right Arm", mod: -2, order: 100 },
  { id: "hand-l", label: "Left Hand", mod: -4, order: 110 },
  { id: "hand-r", label: "Right Hand", mod: -4, order: 120 },
  { id: "leg-l", label: "Left Leg", mod: -2, order: 130 },
  { id: "leg-r", label: "Right Leg", mod: -2, order: 140 },
  { id: "foot-l", label: "Left Foot", mod: -4, order: 150 },
  { id: "foot-r", label: "Right Foot", mod: -4, order: 160 }
];

const MODULE_MODIFIER_FLAG = "[GGA Hit Location]";

const COLOR_REGIONS = [
  { id: "vitals", rgb: [122, 1, 226] },
  { id: "skull", rgb: [235, 51, 255] },
  { id: "face", rgb: [246, 255, 0] },
  { id: "neck", rgb: [255, 1, 0] },
  { id: "torso", rgb: [228, 197, 166] },
  { id: "groin", rgb: [171, 0, 1] },
  { id: "arm", rgb: [0, 255, 119] },
  { id: "hand", rgb: [1, 255, 247] },
  { id: "leg", rgb: [0, 102, 254] },
  { id: "foot", rgb: [17, 124, 115] }
];

const DEFAULT_LOCATION_HIGHLIGHT_COLORS = {
  eye: "#eb33ff",
  skull: "#eb33ff",
  face: "#f6ff00",
  neck: "#ff0100",
  head: "#eb33ff",
  torso: "#e4c5a6",
  vitals: "#7a01e2",
  groin: "#ab0001",
  "arm-l": "#00ff77",
  "arm-r": "#00ff77",
  "hand-l": "#01fff7",
  "hand-r": "#01fff7",
  "leg-l": "#0066fe",
  "leg-r": "#0066fe",
  "foot-l": "#117c73",
  "foot-r": "#117c73"
};

const REFERENCE_IMAGE_SIZE = { width: 640, height: 1280 };

const LEG_SPLIT_POINTS = [
  { y: 610, x: 344 },
  { y: 700, x: 342 },
  { y: 800, x: 332 },
  { y: 920, x: 323 },
  { y: 1040, x: 317 },
  { y: 1160, x: 315 }
];

const VITALS_BOUNDS = {
  left: 310,
  top: 318,
  right: 398,
  bottom: 386
};

let pickerApp = null;
let selectedLocationId = null;
let colorParserCanvas = null;
let colorParserContext = null;

function signed(mod) {
  return mod > 0 ? `+${mod}` : `${mod}`;
}

function getGurpsBucket() {
  const gurps = globalThis.GURPS ?? game.gurps ?? null;
  return gurps?.ModifierBucket ?? gurps?.modifierBucket ?? null;
}

function getBucketState() {
  const bucket = getGurpsBucket();
  const list = bucket?.modifierStack?.modifierList ?? [];
  const items = list.map((entry) => {
    const modint = Number(entry?.modint ?? 0);
    const rawDesc = String(entry?.desc ?? entry?.label ?? "Modifier");
    const desc = rawDesc.startsWith(MODULE_MODIFIER_FLAG)
      ? rawDesc.replace(`${MODULE_MODIFIER_FLAG} `, "")
      : rawDesc;
    return {
      modint,
      desc,
      signedMod: signed(modint)
    };
  });

  return {
    items,
    count: items.length,
    total: items.reduce((sum, item) => sum + item.modint, 0)
  };
}

function getLocationById(locationId) {
  return DEFAULT_LOCATIONS.find((location) => location.id === locationId) ?? null;
}

function toLocationView(location) {
  if (!location) return null;
  return {
    ...location,
    signedMod: signed(location.mod),
    title: `${location.label} (${signed(location.mod)})`
  };
}

function distanceToColor(rgb, target) {
  return Math.hypot(rgb[0] - target[0], rgb[1] - target[1], rgb[2] - target[2]);
}

function getDefaultHighlightColor(locationId) {
  return DEFAULT_LOCATION_HIGHLIGHT_COLORS[locationId] ?? "#7a1f1f";
}

function getHighlightColor(locationId) {
  return game.settings.get(MODULE_ID, `highlightColor-${locationId}`) ?? getDefaultHighlightColor(locationId);
}

function resolveCssColor(color) {
  colorParserCanvas ??= document.createElement("canvas");
  colorParserCanvas.width = 1;
  colorParserCanvas.height = 1;
  colorParserContext ??= colorParserCanvas.getContext("2d");
  if (!colorParserContext) return [122, 31, 31, 1];

  colorParserContext.clearRect(0, 0, 1, 1);
  colorParserContext.fillStyle = "#000000";
  colorParserContext.fillStyle = color;
  colorParserContext.fillRect(0, 0, 1, 1);
  const [red, green, blue, alpha] = colorParserContext.getImageData(0, 0, 1, 1).data;
  return [red, green, blue, alpha / 255];
}

function sideFromX(x, width) {
  return x < width / 2 ? "l" : "r";
}

function interpolateReferenceX(points, referenceY) {
  if (referenceY <= points[0].y) return points[0].x;

  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    if (referenceY > current.y) continue;

    const progress = (referenceY - previous.y) / (current.y - previous.y);
    return previous.x + (current.x - previous.x) * progress;
  }

  return points[points.length - 1].x;
}

function legSideFromPoint(x, y, width, height) {
  const referenceY = y * (REFERENCE_IMAGE_SIZE.height / height);
  const referenceSplitX = interpolateReferenceX(LEG_SPLIT_POINTS, referenceY);
  const splitX = referenceSplitX * (width / REFERENCE_IMAGE_SIZE.width);
  return x < splitX ? "l" : "r";
}

function isWithinReferenceBounds(x, y, width, height, bounds) {
  const referenceX = x * (REFERENCE_IMAGE_SIZE.width / width);
  const referenceY = y * (REFERENCE_IMAGE_SIZE.height / height);

  return (
    referenceX >= bounds.left &&
    referenceX <= bounds.right &&
    referenceY >= bounds.top &&
    referenceY <= bounds.bottom
  );
}

function locationIdFromPixel(x, y, rgb, width, height) {
  if (rgb[3] < 20 || (rgb[0] < 24 && rgb[1] < 24 && rgb[2] < 24)) return null;

  const nearest = COLOR_REGIONS
    .map((region) => ({ ...region, distance: distanceToColor(rgb, region.rgb) }))
    .sort((a, b) => a.distance - b.distance)[0];

  if (!nearest || nearest.distance > 135) return null;

  if (nearest.id === "vitals") {
    return isWithinReferenceBounds(x, y, width, height, VITALS_BOUNDS) ? "vitals" : null;
  }

  if (nearest.id === "arm") return `arm-${sideFromX(x, width)}`;
  if (nearest.id === "hand") return `hand-${sideFromX(x, width)}`;
  if (nearest.id === "leg") return `leg-${legSideFromPoint(x, y, width, height)}`;
  if (nearest.id === "foot") return `foot-${sideFromX(x, width)}`;
  if (nearest.id === "skull" && x > width / 2 && y > 95) return "face";

  return nearest.id;
}

function locationIdFromCanvasPoint(context, x, y, width, height) {
  const scores = new Map();
  const radius = 4;

  for (let oy = -radius; oy <= radius; oy++) {
    for (let ox = -radius; ox <= radius; ox++) {
      const px = x + ox;
      const py = y + oy;
      if (px < 0 || py < 0 || px >= width || py >= height) continue;

      const pixel = context.getImageData(px, py, 1, 1).data;
      const locationId = locationIdFromPixel(px, py, pixel, width, height);
      if (!locationId) continue;

      const distance = Math.hypot(ox, oy);
      const score = 1 / (1 + distance);
      scores.set(locationId, (scores.get(locationId) ?? 0) + score);
    }
  }

  return [...scores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function createSelectedMaskDataUrl(sourceImage, sourceContext, locationId, fillColor) {
  if (!locationId) return "";

  const width = sourceImage.naturalWidth;
  const height = sourceImage.naturalHeight;
  const source = sourceContext.getImageData(0, 0, width, height);
  const output = new ImageData(width, height);
  const [fillRed, fillGreen, fillBlue, fillAlpha] = resolveCssColor(fillColor);

  for (let index = 0; index < source.data.length; index += 4) {
    const pixelIndex = index / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const pixel = [
      source.data[index],
      source.data[index + 1],
      source.data[index + 2],
      source.data[index + 3]
    ];

    if (locationIdFromPixel(x, y, pixel, width, height) !== locationId) continue;

    output.data[index] = fillRed;
    output.data[index + 1] = fillGreen;
    output.data[index + 2] = fillBlue;
    output.data[index + 3] = Math.round(source.data[index + 3] * fillAlpha);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").putImageData(output, 0, 0);
  return canvas.toDataURL("image/png");
}

function getObjectFitContainRect(element) {
  const rect = element.getBoundingClientRect();
  const naturalRatio = element.naturalWidth / element.naturalHeight;
  const renderedRatio = rect.width / rect.height;

  if (renderedRatio > naturalRatio) {
    const width = rect.height * naturalRatio;
    return {
      left: rect.left + (rect.width - width) / 2,
      top: rect.top,
      width,
      height: rect.height
    };
  }

  const height = rect.width / naturalRatio;
  return {
    left: rect.left,
    top: rect.top + (rect.height - height) / 2,
    width: rect.width,
    height
  };
}

function getModuleBucketDescriptions() {
  return DEFAULT_LOCATIONS.flatMap((location) => [
    `${MODULE_MODIFIER_FLAG} ${location.label}`,
    location.label,
    `${location.label} (${signed(location.mod)})`
  ]);
}

function removePreviousLocationModifier(bucket) {
  const list = bucket?.modifierStack?.modifierList;
  if (!Array.isArray(list)) return false;

  const removable = new Set(getModuleBucketDescriptions());
  const before = list.length;
  const kept = list.filter((entry) => !removable.has(String(entry?.desc ?? "")));
  list.splice(0, list.length, ...kept);
  return list.length !== before;
}

function addToBucket(location) {
  const bucket = getGurpsBucket();
  if (!bucket?.addModifier) {
    ui.notifications.warn("O GURPS Modifier Bucket nao esta disponivel nesta sessao.");
    return false;
  }

  removePreviousLocationModifier(bucket);
  bucket.addModifier(location.mod, `${MODULE_MODIFIER_FLAG} ${location.label}`);
  Hooks.callAll(`${MODULE_ID}.addModifier`, location);

  if (game.settings.get(MODULE_ID, "autoCloseAfterAdd")) {
    pickerApp?.close();
  } else {
    pickerApp?.render(false);
  }

  return true;
}

function handleLocationClick(locationId) {
  const location = toLocationView(getLocationById(locationId));
  if (!location) return false;

  selectedLocationId = locationId;
  const added = addToBucket(location);
  pickerApp?.render(false);
  return added;
}

function clearBucket() {
  const bucket = getGurpsBucket();
  if (!bucket?.clear) {
    ui.notifications.warn("O GURPS Modifier Bucket nao esta disponivel nesta sessao.");
    return false;
  }

  bucket.clear();
  Hooks.callAll(`${MODULE_ID}.clearBucket`);
  pickerApp?.render(false);
  return true;
}

class HitLocationPicker extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `${MODULE_ID}-app`,
      classes: [MODULE_ID],
      template: `modules/${MODULE_ID}/templates/hit-location-picker.hbs`,
      width: 900,
      height: 700,
      resizable: true,
      title: "GGA Hit Location Bucket"
    });
  }

  getData() {
    const current = getBucketState();
    const selectedLocation = toLocationView(getLocationById(selectedLocationId));

    return {
      current,
      selectedLocation,
      selectedHighlightColor: selectedLocation ? getHighlightColor(selectedLocation.id) : null,
      bucketReady: Boolean(getGurpsBucket()),
      autoCloseAfterAdd: game.settings.get(MODULE_ID, "autoCloseAfterAdd")
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._updateSelectedMask();

    html.on("click", "[data-action='pick-from-body']", (event) => {
      const locationId = this._locationIdFromBodyEvent(event);
      if (locationId) handleLocationClick(locationId);
    });

    html.on("click", "[data-action='clear-bucket']", () => clearBucket());
    html.on("click", "[data-action='refresh']", () => this.render(false));
  }

  _locationIdFromBodyEvent(event) {
    const image = this.element.find(".gga-hit-location__bodycolors")[0];
    if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return null;

    const rect = getObjectFitContainRect(image);
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * image.naturalWidth);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * image.naturalHeight);
    if (x < 0 || y < 0 || x >= image.naturalWidth || y >= image.naturalHeight) return null;

    const sourceContext = this._ensureHitCanvas(image);

    return locationIdFromCanvasPoint(
      sourceContext,
      x,
      y,
      image.naturalWidth,
      image.naturalHeight
    );
  }

  _ensureHitCanvas(image) {
    const canvas = this._hitCanvas ??= document.createElement("canvas");
    if (canvas.width !== image.naturalWidth || canvas.height !== image.naturalHeight) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      this._hitCanvasContext = canvas.getContext("2d", { willReadFrequently: true });
      this._hitCanvasContext.drawImage(image, 0, 0);
      this._maskCache = new Map();
    }

    return this._hitCanvasContext;
  }

  _updateSelectedMask() {
    const sourceImage = this.element.find(".gga-hit-location__bodycolors")[0];
    const maskImage = this.element.find(".gga-hit-location__selected-mask")[0];
    if (!sourceImage || !maskImage) return;

    const applyMask = () => {
      if (!selectedLocationId) {
        maskImage.removeAttribute("src");
        return;
      }

      const fillColor = getHighlightColor(selectedLocationId);
      const cacheKey = `${selectedLocationId}:${fillColor}`;
      const sourceContext = this._ensureHitCanvas(sourceImage);
      this._maskCache ??= new Map();

      if (!this._maskCache.has(cacheKey)) {
        this._maskCache.set(
          cacheKey,
          createSelectedMaskDataUrl(sourceImage, sourceContext, selectedLocationId, fillColor)
        );
      }

      maskImage.src = this._maskCache.get(cacheKey);
    };

    if (sourceImage.complete && sourceImage.naturalWidth) {
      applyMask();
    } else {
      sourceImage.addEventListener("load", applyMask, { once: true });
    }
  }

  close(options = {}) {
    pickerApp = null;
    return super.close(options);
  }
}

function openPicker() {
  if (pickerApp) {
    pickerApp.render(true);
    pickerApp.bringToTop();
    return pickerApp;
  }

  pickerApp = new HitLocationPicker();
  return pickerApp.render(true);
}

Hooks.once("init", () => {
  for (const location of DEFAULT_LOCATIONS) {
    game.settings.register(MODULE_ID, `highlightColor-${location.id}`, {
      name: `${location.label} highlight color`,
      hint: `Color used when ${location.label.toLowerCase()} is selected in the hit-location picker.`,
      scope: "client",
      config: true,
      type: new foundry.data.fields.ColorField(),
      default: getDefaultHighlightColor(location.id),
      onChange: () => {
        if (!pickerApp) return;
        pickerApp.render(false);
      }
    });
  }

  game.settings.register(MODULE_ID, "autoCloseAfterAdd", {
    name: "Auto close after adding",
    hint: "Close the hit-location window after a modifier is added to the bucket.",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.keybindings.register(MODULE_ID, "open-picker", {
    name: "Open Hit Location Bucket",
    hint: "Open the clickable hit-location window.",
    editable: [{ key: "KeyH", modifiers: ["Control", "Alt"] }],
    onDown: () => {
      openPicker();
      return true;
    },
    restricted: false
  });

  Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControls = controls.find((control) => control.name === "token");
    if (!tokenControls) return;

    tokenControls.tools.push({
      name: "gga-hit-location-bucket",
      title: "Hit Location Bucket",
      icon: "fas fa-bone",
      button: true,
      onClick: () => openPicker()
    });
  });
});

Hooks.once("ready", () => {
  if (game.system.id !== "gurps") {
    console.warn(`[${MODULE_ID}] This module is intended for the GURPS system.`);
  }

  const moduleEntry = game.modules.get(MODULE_ID);
  if (moduleEntry) {
    moduleEntry.api = {
      openPicker,
      addToBucket,
      clearBucket,
      getBucketState,
      handleLocationClick,
      HitLocationPicker
    };
  }
});

export {
  HitLocationPicker,
  addToBucket,
  clearBucket,
  getBucketState,
  handleLocationClick,
  openPicker
};
