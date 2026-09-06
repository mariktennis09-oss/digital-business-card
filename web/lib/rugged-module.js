// Rugged stacked module — programmatic three.js model.
// Usage:  import { buildRuggedModule } from './rugged-module.js';
//         scene.add(buildRuggedModule(THREE));
// Units: meters, y-up, base resting at y = 0.
//
// Файл принят как есть и правится только заменой целиком. Приводить его
// к габаритам сцены, объединять по материалам и центрировать — задача
// device-model.ts, чтобы новую версию модели можно было положить сюда
// поверх старой, ничего больше не трогая.

export function buildRuggedModule(THREE) {
  const M = {
    shell: new THREE.MeshStandardMaterial({ name:'shell', color:0x17181a, roughness:0.62, metalness:0.22 }),
    shellTextured: new THREE.MeshStandardMaterial({ name:'shell_textured', color:0x1e2023, roughness:0.92, metalness:0.10 }),
    recess: new THREE.MeshStandardMaterial({ name:'recess', color:0x08090a, roughness:0.95, metalness:0.05 }),
    trim: new THREE.MeshStandardMaterial({ name:'trim_white', color:0xe8e9ea, roughness:0.35, metalness:0.05 }),
    metal: new THREE.MeshStandardMaterial({ name:'brushed_metal', color:0x9aa0a6, roughness:0.42, metalness:0.35 }),
    led: new THREE.MeshStandardMaterial({ name:'led_red', color:0xd8321c, roughness:0.35, metalness:0.0, emissive:0x5a0e04 })
  };

  const model = new THREE.Group();
  model.name = 'rugged_module_stack';

  const box = (name, mat, w, h, d, x, y, z, parent = model) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.name = name; m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  };
  const cyl = (name, mat, r, h, x, y, z, seg = 24, parent = model) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
    m.name = name; m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    parent.add(m); return m;
  };

  const W = 0.44, D = 0.40;
  const HW = W / 2, HD = D / 2;
  let y = 0;
  const layer = (h) => { const c = y + h / 2; y += h; return c; };
  const trim = (i) => {
    const c = layer(0.007);
    box(`edge_trim_${i}`, M.trim, W + 0.004, 0.007, D + 0.004, 0, c, 0);
  };

  /* 1 — base plinth ---------------------------------------------------- */
  {
    const c = layer(0.048);
    box('base_chassis', M.shell, W, 0.048, D, 0, c, 0);
    box('base_skid_front', M.shellTextured, W - 0.05, 0.014, 0.022, 0, 0.007, HD - 0.012);
    box('base_skid_rear', M.shellTextured, W - 0.05, 0.014, 0.022, 0, 0.007, -HD + 0.012);
    // front nameplate strip + tiny status LED
    box('base_label_plate', M.recess, 0.13, 0.022, 0.004, -0.10, c, HD + 0.001);
    box('status_led', M.led, 0.016, 0.010, 0.006, -HW + 0.022, c + 0.004, HD + 0.002);
  }
  trim(1);

  /* 2 — finned heat-sink module ---------------------------------------- */
  {
    const h = 0.088, c = layer(h);
    box('heatsink_body', M.shell, W, h, D, 0, c, 0);
    const g = new THREE.Group(); g.name = 'heatsink_fins'; model.add(g);
    for (let i = 0; i < 13; i++) {
      box(`fin_${String(i).padStart(2,'0')}`, M.shellTextured, 0.012, h - 0.014, 0.030,
          -HW + 0.030 + i * 0.0305, c, HD + 0.014, g);
    }
    box('fin_shroud_top', M.shell, W, 0.010, 0.034, 0, c + h/2 - 0.004, HD + 0.014);
    // side vent recesses
    box('vent_left', M.recess, 0.006, h - 0.030, D - 0.14, -HW - 0.002, c, 0.02);
    box('vent_right', M.recess, 0.006, h - 0.030, D - 0.14, HW + 0.002, c, 0.02);
  }
  trim(2);

  /* 3 — slotted card cage ---------------------------------------------- */
  {
    const h = 0.082, c = layer(h);
    box('cardcage_body', M.shell, W, h, D, 0, c, 0);
    box('cardcage_recess', M.recess, W - 0.055, h - 0.020, 0.010, 0, c, HD - 0.002);
    const g = new THREE.Group(); g.name = 'card_slots'; model.add(g);
    for (let i = 0; i < 9; i++) {
      const x = -HW + 0.048 + i * 0.043;
      box(`card_face_${String(i).padStart(2,'0')}`, M.shellTextured, 0.032, h - 0.030, 0.012, x, c, HD + 0.003, g);
      box(`card_ejector_${String(i).padStart(2,'0')}`, M.metal, 0.020, 0.005, 0.006, x, c - h/2 + 0.018, HD + 0.008, g);
    }
    box('cage_rail_left', M.shellTextured, 0.020, h, 0.016, -HW + 0.012, c, HD + 0.005);
    box('cage_rail_right', M.shellTextured, 0.020, h, 0.016, HW - 0.012, c, HD + 0.005);
  }
  trim(3);

  /* 4 — control / label panel module ----------------------------------- */
  {
    const h = 0.094, c = layer(h);
    box('panel_body', M.shell, W, h, D, 0, c, 0);
    box('panel_recess', M.recess, 0.26, h - 0.024, 0.008, 0.06, c, HD - 0.001);
    box('panel_door', M.shellTextured, 0.24, h - 0.034, 0.012, 0.06, c, HD + 0.004);
    // silkscreen bar-code style stripes
    for (let i = 0; i < 4; i++) {
      box(`panel_stripe_${i}`, M.trim, 0.070, 0.0045, 0.004, 0.10, c + 0.014 - i * 0.009, HD + 0.011);
    }
    // handle-side utility block
    box('io_block', M.shellTextured, 0.10, h - 0.020, 0.030, -0.14, c, HD + 0.013);
    for (let i = 0; i < 3; i++) {
      box(`io_port_${i}`, M.recess, 0.020, 0.014, 0.006, -0.17 + i * 0.028, c + 0.006, HD + 0.029);
    }
    // corner fasteners
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const s = cyl(`panel_screw_${sx>0?'r':'l'}${sy>0?'t':'b'}`, M.metal, 0.005, 0.005,
                    sx * (HW - 0.016), c + sy * (h/2 - 0.016), HD + 0.002);
      s.rotation.x = Math.PI / 2;
    }
  }
  trim(4);

  /* 5 — top grille module ---------------------------------------------- */
  {
    const h = 0.066, c = layer(h);
    box('top_body', M.shell, W, h, D, 0, c, 0);
    box('top_grille_well', M.recess, 0.20, 0.008, 0.20, -0.09, c + h/2 - 0.001, -0.02);
    const g = new THREE.Group(); g.name = 'top_grille'; model.add(g);
    for (let i = 0; i < 15; i++) {
      box(`grille_bar_${String(i).padStart(2,'0')}`, M.shellTextured, 0.19, 0.006, 0.006,
          -0.09, c + h/2 - 0.002, -0.11 + i * 0.0128, g);
    }
    box('top_hatch', M.shellTextured, 0.17, 0.008, 0.30, 0.13, c + h/2 - 0.001, 0.02);
    const dial = cyl('top_dial', M.metal, 0.026, 0.010, 0.13, c + h/2 + 0.004, -0.12);
    dial.name = 'top_dial';
    box('top_badge', M.recess, 0.05, 0.006, 0.05, 0.13, c + h/2 + 0.002, 0.13);
    box('carry_lip', M.shell, W, 0.014, 0.030, 0, c + h/2 - 0.006, HD + 0.012);
  }

  const TOP = y;

  /* rear connector bank ------------------------------------------------- */
  {
    const g = new THREE.Group(); g.name = 'rear_connectors'; model.add(g);
    box('rear_bulkhead', M.shellTextured, W - 0.03, TOP * 0.72, 0.024, 0, TOP * 0.40, -HD - 0.012, g);
    for (let i = 0; i < 5; i++) {
      box(`connector_shell_${i}`, M.shell, W - 0.10, 0.030, 0.034, 0, 0.055 + i * 0.055, -HD - 0.028, g);
      box(`connector_pins_${i}`, M.metal, W - 0.13, 0.012, 0.008, 0, 0.055 + i * 0.055, -HD - 0.046, g);
    }
    for (const sx of [-1, 1]) {
      box(`rear_rib_${sx>0?'r':'l'}`, M.shellTextured, 0.022, TOP * 0.86, 0.040,
          sx * (HW - 0.014), TOP * 0.46, -HD - 0.020, g);
    }
  }

  /* side carry handle (−X) ---------------------------------------------- */
  {
    const g = new THREE.Group(); g.name = 'carry_handle'; model.add(g);
    const bowY = TOP * 0.56;
    for (const sz of [-1, 1]) {
      box(`handle_mount_${sz>0?'f':'r'}`, M.shellTextured, 0.026, 0.048, 0.036,
          -HW - 0.010, bowY + sz * 0.0, sz * 0.11, g);
    }
    // side data plate
    box('side_plate', M.recess, 0.004, 0.06, 0.16, -HW - 0.001, TOP * 0.24, -0.04, g);
  }

  /* right-side latch cluster --------------------------------------------- */
  {
    const g = new THREE.Group(); g.name = 'side_latches'; model.add(g);
    for (let i = 0; i < 3; i++) {
      box(`latch_${i}`, M.shellTextured, 0.018, 0.026, 0.055, HW + 0.008, 0.06 + i * 0.12, 0.09, g);
      box(`latch_keeper_${i}`, M.metal, 0.020, 0.006, 0.020, HW + 0.010, 0.06 + i * 0.12, 0.09, g);
    }
  }

  model.position.y = 0;
    return model;
}
