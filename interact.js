function Interact(selector, minSize = 64, snapRange = 32) {
  
  const body = document.body;
  const classes = ['drag', 'resizeHorizontal', 'resizeDiagonal2', 'resizeVertical', 'resizeDiagonal1'].map(c => 'interact-' + c);
  const cursors = ['move', 'w-resize', 'nesw-resize', 's-resize', 'nwse-resize'];
  const boxes = [...document.querySelectorAll(selector)];

  let interact = null;
  let topBox = boxes.reverse()[0];
  
  const mouseIsInside = (mx, my, x, y, w, h) => mx > x && mx < x + w && my > y && my < y + h;
  /*  4   3   2 *   -1   0   1   *
   *  1      -1 * = 3 * vertical *
   * -2  -3  -4 *   + horizontal */
  const mouseIsEdging = (a => (mx, my, x, y, w, h, r) => mouseIsInside(mx, my, x - r, y - r, w + 2 * r, h + 2 * r) * (3 * (a(y - my) < r) - 3 * (a(y + h - my) < r) + (a(x - mx) < r) - (a(x + w - mx) < r)))(Math.abs);
  
  const style = document.createElement('style');
  style.innerHTML = classes.map((c, i) => `body.${c}{cursor:${cursors[i]}}`).join('');
  style.classList.add('interact-cursors');
  document.head.appendChild(style);

  this.mouseMove = function ({ clientX: mx, clientY: my }) {
    if (interact) {
      const {box: b, x, y, w, h} = interact;
      const s = b.style;
      const resizeAxe = ((n, a, f, o, i, p) => (mt, t, d, st, sd) => {
        const ot = o + st[0].toUpperCase() + st.slice(1);
        const ud = sd[0].toUpperCase() + sd.slice(1);
        if (!d) {
          if (!t) return;
          // Dragging
          const snapEdges = boxes.map(bb => bb === b ? [0, window[i + ud]] : [bb[ot], [bb[ot] + bb[o + ud]]]).flat();
          let snapEdge = snapEdges[f](edge => a(mt - t - edge) < snapRange)[0];
          if (n(snapEdge)) { s[st] = snapEdge + p; return }
          const d = b[o + ud];
          snapEdge = snapEdges[f](edge => a(mt - t + d - edge) < snapRange)[0];
          if (n(snapEdge)) { s[st] = snapEdge - d + p; return }
          s[st] = mt - t + p;
          return;
        }
        // Resizing
        if (t) {
          let nt = d - mt;
          const snapEdges = boxes.map(bb => bb === b ? 0 : [bb[ot], bb[ot] + bb[o + ud]]).flat();
          const snapEdge = snapEdges[f](edge => a(mt - t - edge) < snapRange)[0];
          n(snapEdge) && (nt = d - t - snapEdge);
          if (nt > minSize) { s[st] = d - t - nt + p; s[sd] = nt + p; return }
        }
        if (!t) {
          let nt = mt - d;
          const t = b[ot];
          const snapEdges = boxes.map(bb => bb === b ? window[i + ud] : [bb[ot], bb[ot] + bb[o + ud]]).flat();
          const snapEdge = snapEdges[f](edge => a(mt - edge) < snapRange)[0];
          n(snapEdge) && (nt = snapEdge - t);
          if (nt > minSize) { s[sd] = nt + p; return }
        }
        // Current size is less than minimum
        t && (s[st] = d - t - minSize + p);
        s[sd] = minSize + p;
      })(n => !isNaN(n), Math.abs, 'filter', 'offset', 'inner', 'px');
      resizeAxe(mx, x, w, 'left', 'width');
      resizeAxe(my, y, h, 'top', 'height');
      return;
    }
    body.classList.remove(...classes);
    for (const box of boxes) {
      const { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h } = box;
      const state = mouseIsEdging(mx, my, x, y, w, h, 16);
      if (state) {
        body.classList.add(classes[Math.abs(state)]);
        break;
      }
      if (mouseIsInside(mx, my, x, y, w, h)) {
        body.classList.add(classes[0]);
        break;
      }
    }
  }

  this.mouseDown = function ({ clientX: mx, clientY: my }) {
    for (const box of boxes) {
      const { offsetLeft: x, offsetTop: y, offsetWidth: w, offsetHeight: h } = box;
      const innerState = mouseIsInside(mx, my, x, y, w, h);
      innerState && topBox !== box && (
        box.style.zIndex = topBox.style.zIndex + 1,
        topBox = box,
        boxes.sort((b1, b2) => b2.style.zIndex - b1.style.zIndex)
      );
      const state = mouseIsEdging(mx, my, x, y, w, h, 16);
      if (state) {
        interact = {box};
        /* x: 4  1 -2           *
         * y: 4  3  2           *
         * w: 4  1 -2 (2 -1 -4) *
         * h: 4  3  2 (2 -3 -4) */
        (state - 1) % 3 === 0 && (interact.x = mx - x, interact.w = mx + w);
        (state + 1) % 3 === 0 && (interact.w = mx - w);
        state >  1 && (interact.y = my - y, interact.h = my + h);
        state < -1 && (interact.h = my - h);
        break;
      }
      if (innerState) { interact = { box, x: mx - x, y: my - y }; break }
    }
  }

  this.mouseUp = function () { interact = null }

}
