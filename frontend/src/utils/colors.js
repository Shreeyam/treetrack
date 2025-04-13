// Helper function to blend two hex colors
function blendColors(color1, color2, weight) {
    let c1 = parseInt(color1.slice(1), 16);
    let c2 = parseInt(color2.slice(1), 16);
    let r1 = c1 >> 16;
    let g1 = (c1 >> 8) & 0xff;
    let b1 = c1 & 0xff;
    let r2 = c2 >> 16;
    let g2 = (c2 >> 8) & 0xff;
    let b2 = c2 & 0xff;
    let r = Math.round(r1 * (1 - weight) + r2 * weight);
    let g = Math.round(g1 * (1 - weight) + g2 * weight);
    let b = Math.round(b1 * (1 - weight) + b2 * weight);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export default blendColors;