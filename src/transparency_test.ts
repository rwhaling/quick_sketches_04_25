import p5 from "p5";

// Parameter definitions moved from main.tsx to here
export const numericParameterDefs = {
  "timeMultiplier": {
    "min": 0,
    "max": 1.0,
    "step": 0.01,
    "defaultValue": 0.5, 
  },
  "transparencyStrength": {
    "min": 0,
    "max": 255,
    "step": 1,
    "defaultValue": 1, 
  },
  "steps": {
    "min": 1,
    "max": 400,
    "step": 1,
    "defaultValue": 400,
  }
};

// This type represents the parameter store structure
export type ParameterStore = {
  [K in keyof typeof numericParameterDefs]: number;
};

// Create initialization function here too
export function initParameterStore(): ParameterStore {
  // Initialize from default values in the parameter definitions
  const store = {} as ParameterStore;
  
  Object.entries(numericParameterDefs).forEach(([key, def]) => {
    store[key as keyof ParameterStore] = def.defaultValue;
  });
  
  return store;
}

// This function creates the p5 sketch
export function createSketch(parameterStore: ParameterStore) {
  let currentParams = parameterStore;
  
  return function sketch(p: p5) {
    let font: p5.Font;
    let startTime = p.millis();
   
    // Expose a method to update parameters
    (p as any).updateParameters = (newParams: ParameterStore) => {
      currentParams = newParams;
    };
   
    p.preload = function() {
      // can preload assets here...
      font = p.loadFont(
        new URL("/public/fonts/inconsolata.otf", import.meta.url).href
      );
    };
    

    let lastTransparencyStrength = -1
    p.setup = function() {
      // Keep the fixed dimensions - this is the actual size of your visualization
      p.createCanvas(400, 400, p.WEBGL);
      p.frameRate(0.5);
      // Make sure we're using the right coordinate system
      
      // Fix any potential canvas styling issues
      const canvas = document.querySelector('.p5Canvas');
      if (canvas) {
        (canvas as any).style.margin = '0 auto';
        (canvas as any).style.display = 'block';
      }

    }
    

    let frameCount = 0;
    let prevTime = 0;
    p.draw = function() {
      if (currentParams.transparencyStrength == lastTransparencyStrength) return;
      lastTransparencyStrength = currentParams.transparencyStrength;
      p.translate(-p.width/2, -p.height/2); // Move to top-left for image drawing

      // draw a black background
      p.background("#000000");

      let alphaHex = Math.floor(currentParams.transparencyStrength).toString(16).padStart(2, '0');
      let transparencyColor = "#000000" + alphaHex;


      let gridSize = Math.ceil(Math.sqrt(currentParams.steps));

      let w = p.width / gridSize;

      // draw 25 80 x 80 rectangles in a grid
      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {    
          let n = i * gridSize + j;
          p.fill("#4422FF");
          p.noStroke();
          p.rect(i * w, j * w, w, w);
          for (let k = 0; k < n; k++) {


            p.fill(transparencyColor);
            p.rect(i * w, j * w, w, w);
          }
          let actualPixel = p.get(5 + i * w, 5 + j * w);
          let actualColor = p.color(actualPixel);
          console.log("n",n, "actualColor", actualColor.toString("#rrggbbaa"));
        }
      }
      

    }


  };
}