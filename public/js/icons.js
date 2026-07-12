const SVG_ICONS = {
  phone: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>',
  whatsapp: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M20.52 3.44C18.24 1.15 15.2 0 11.96 0 5.46 0 .17 5.29.17 11.79c0 2.08.54 4.12 1.57 5.92L0 24l6.45-1.69c1.74.96 3.73 1.47 5.76 1.47 6.5 0 11.79-5.29 11.79-11.79 0-3.15-1.23-6.11-3.48-8.55zm-8.56 18.25c-1.78 0-3.52-.48-5.05-1.39l-.36-.21-3.76.99.99-3.66-.23-.37c-1-1.59-1.53-3.44-1.53-5.35 0-5.54 4.51-10.05 10.05-10.05 2.68 0 5.2 1.04 7.09 2.94 1.9 1.9 2.94 4.41 2.94 7.1.01 5.54-4.5 10.05-10.04 10.05zm5.51-7.53c-.3-.15-1.79-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.23-.65.08-.3-.15-1.28-.47-2.43-1.5-1-1-1.78-1.57-1.98-1.88-.2-.3-.02-.45.13-.6.13-.13.3-.3.45-.45.15-.15.2-.25.3-.43.1-.18.05-.33-.02-.48-.08-.15-.68-1.63-.93-2.23-.24-.59-.49-.51-.68-.52-.18-.01-.38-.01-.58-.01-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5 0 1.48 1.08 2.9 1.23 3.1.15.2 2.1 3.2 5.1 4.5.7.3 1.25.48 1.68.61.7.23 1.35.2 1.85.12.58-.09 1.79-.73 2.04-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35z"/></svg>',
  cart: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>',
  heart_outline: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>',
  heart_filled: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  fabric: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M21 4H3v16h18V4zm-2 14H5V6h14v12zm-6-2h4v-2h-4v2zm0-4h4v-2h-4v2zm0-4h4V6h-4v2zM7 16h4v-2H7v2zm0-4h4v-2H7v2zm0-4h4V6H7v2z"/></svg>',
  plus: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
  minus: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>',
  trash: '<svg class="svg-icon" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
};

// Map categories to specific icons if possible, otherwise use generic fabric
function getCategoryIcon(category) {
  return SVG_ICONS.fabric; // Simplification, can add more later
}

function svgDataUri(svg) {
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function unsplashFeatured(query, width = 1600, height = 900) {
  return `https://source.unsplash.com/featured/${width}x${height}/?${encodeURIComponent(query)}`;
}

function createFabricHeroImage(title, subtitle, accent, background) {
  const text = `${title || ''} ${subtitle || ''}`.toLowerCase();
  if (text.includes('shawl')) return unsplashFeatured('pakistani men shawl traditional');
  if (text.includes('suit') || text.includes('formal') || text.includes('sherwani') || text.includes('kurta')) {
    return unsplashFeatured('pakistani men sherwani formal wear');
  }
  return unsplashFeatured('pakistani textile fabric closeup');
}

function createCategoryImage(label, accent, background) {
  const key = String(label || '').toLowerCase();
  if (key.includes('shawl') || key.includes('khaddar') || key.includes('karandi')) {
    return unsplashFeatured('pakistani men shawl winter fabric', 1200, 1200);
  }
  if (key.includes('suit') || key.includes('wash & wear') || key.includes('boski') || key.includes('jamawar')) {
    return unsplashFeatured('pakistani men suit sherwani formal', 1200, 1200);
  }
  if (key.includes('silk')) return unsplashFeatured('silk fabric luxury textile', 1200, 1200);
  if (key.includes('chiffon')) return unsplashFeatured('embroidered chiffon fabric', 1200, 1200);
  if (key.includes('cotton') || key.includes('lawn') || key.includes('linen')) return unsplashFeatured('pakistani fabric closeup', 1200, 1200);
  return unsplashFeatured('pakistani textile fabric pattern', 1200, 1200);
}

function createProductPlaceholder(label, accent, background, size = 400) {
  const key = String(label || '').toLowerCase();
  if (key.includes('shawl') || key.includes('khaddar') || key.includes('karandi')) {
    return unsplashFeatured('pakistani men shawl texture', size, size);
  }
  if (key.includes('suit') || key.includes('wash & wear') || key.includes('boski') || key.includes('jamawar')) {
    return unsplashFeatured('pakistani men suit formal wear', size, size);
  }
  if (key.includes('silk')) return unsplashFeatured('silk fabric closeup', size, size);
  if (key.includes('chiffon')) return unsplashFeatured('chiffon fabric texture', size, size);
  return unsplashFeatured('pakistani fabric textile closeup', size, size);
}
