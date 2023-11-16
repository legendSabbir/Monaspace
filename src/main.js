import styles from "./styles.scss"

const pluginId = "acode.plugin.monaspace";
const { editor } = editorManager;
const fonts = acode.require("fonts");
const sidebarApps = acode.require("sidebarApps");
const select = acode.require("select");
const appSettings = acode.require("settings");


function init(baseUrl) {
  if (!baseUrl.endsWith("/")) {
    baseUrl += "/";
  }
  
  let settings;
  if (!appSettings.value[pluginId]) {
    settings = {
      weight: "600",
      width: "100",
      slant: "0"
    }
    appSettings.value[pluginId] = settings
    appSettings.update(false);
  } else {
    settings = appSettings.value[pluginId]
  }
  
  const allFonts = [];
  function addFont(name) {
    allFonts.push("Monaspace " + name);
    fonts.add(
      `Monaspace ${name}`,
      `
        @font-face {
          font-family: "Monaspace ${name}";
          src: url("${baseUrl}fonts/monaspace-${name.toLowerCase()}.ttf") format("truetype");
          font-display: swap;
        }
        
        .editor-container.ace_editor {
          font-variation-settings: "wght" var(--monaspace-weight, ${settings.weight}),"wdth" var(--monaspace-width, ${settings.width}),"slnt" var(--monaspace-slant, ${settings.slant})!important;
          font-feature-settings: "calt" 1, "dlig" 1,"ss01" 1,"ss02" 1,"ss03" 1,"ss04" 1,"ss05" 1,"ss06" 1,"ss07" 1,"ss08" 1!important;
        }
        
        .ace_autocomplete.ace_editor {
          font-family: "Monaspace ${name}";
          font-weight: normal;
        }
      `
    );
  }
  
  addFont("Argon");
  addFont("Krypton");
  addFont("Neon");
  addFont("Radon");
  addFont("Xenon");
  


  /**
   * Side Bar
   */
  
  const $styleEl = tag("style", { textContent: styles });
  document.head.append($styleEl);
  
  
  function createRange(label, min, max, step, type) {
    const value = type === "editor" ? parseFloat(appSettings.value[label]) : settings[label];
    
    return tag("input", {
      attr: {
        type: "range",
        min,
        max,
        step,
        value,
      },
      dataset: {
        value,
        label,
        type
      },
      oninput: update
    });
  }
  
  
  let timeout;
  function update() {
    const label = this.dataset.label
    const value = this.value + (label === "fontSize" ? "px" : "")
    const type = this.dataset.type
    this.dataset.value = value
    
    if (type === "editor") {
      editor.container.style[label] = value
    } else {
      editor.container.style.setProperty("--monaspace-" + label, value);
    }
    
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (type === "editor") {
        appSettings.value[label] = label === "lineHeight" ? +value : value;
      } else {
        appSettings.value[pluginId][label] = value
      }
      
      appSettings.update(false);
    }, 1000);
  }
  
  
  
  let lastSelectedFont = () => appSettings.value["editorFont"];
  const fontVariantSelectBox = tag("div", {
    className: "monaspace-select",
    onclick: async function () {
      const selectedFont = await select('Monaspace Font Variants', allFonts, { default: lastSelectedFont() });
      if (!selectedFont) return
      
      appSettings.value["editorFont"] = selectedFont
      appSettings.update();
      
      this.firstElementChild.textContent = selectedFont
      fonts.setFont(selectedFont);
    },
    
    children: [
      tag("b", {
        textContent: lastSelectedFont()
      }),
      tag("span", {
        className: "icon keyboard_arrow_down"
      })
    ]
  })
  
  
  sidebarApps.add("monaspace-sidebar-icon", "monaspace", "Monaspace", (app) => {
    app.appendChild(
      tag("div", {
        className: "monaspace",
        children: [
          tag("h2", { className: "title", textContent: "Monaspace" }),
          createRange("fontSize", "6", "20", "0.1", "editor"),
          createRange("lineHeight", "1", "2", "0.01", "editor"),
          createRange("weight", "200", "900", "1", "plugin"),
          createRange("width", "100", "125", "1", "plugin"),
          createRange("slant", "-11", "0", "1", "plugin"),
          fontVariantSelectBox
        ]
      })
    );
  });
}


function destroy() {
  $styleEl.remove();
  delete appSettings.value[pluginId];
  appSettings.update(false);
}


if (window.acode) {
  acode.setPluginInit(pluginId, init);
  acode.setPluginUnmount(pluginId, destroy);
}