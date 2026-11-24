/* Globo do OND (o mesmo do /explorar), exposto como window.createOndGlobe(canvas, {onPin}). */
(function () {
  var RAD = Math.PI / 180;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function unitVector(latitude, longitude) {
    var latitudeRadians = latitude * RAD, longitudeRadians = longitude * RAD, ring = Math.cos(latitudeRadians);
    return [ring * Math.sin(longitudeRadians), Math.sin(latitudeRadians), ring * Math.cos(longitudeRadians)];
  }
  function createGlobe(canvas, options) {
    var context = canvas.getContext('2d');
    var landRings = decodeLand(window.OND_GLOBE_LAND || '');
    var graticule = buildGraticule();
    var pins = [], route = [];
    var yaw = 0.35, pitch = 0.26, yawVelocity = 0, zoom = 1, targetZoom = 1;
    var dragging = false, interacted = false, moved = 0, lastX = 0, lastY = 0;
    var flight = null, hovered = -1, lastTime = 0, elapsed = 0, width = 0, height = 0;
    var pointers = new Map(), pinchDistance = 0;

    function decodeLand(encoded) {
      if (!encoded) return [];
      var binary = atob(encoded), view = new DataView(new ArrayBuffer(binary.length));
      for (var index = 0; index < binary.length; index++) view.setUint8(index, binary.charCodeAt(index));
      var cursor = 0;
      function next() { var value = view.getInt16(cursor, true); cursor += 2; return value; }
      var rings = [], polygonCount = next();
      for (var polygonIndex = 0; polygonIndex < polygonCount; polygonIndex++) {
        var ringCount = next();
        for (var ringIndex = 0; ringIndex < ringCount; ringIndex++) {
          var pointCount = next(), ring = new Float64Array(pointCount * 3);
          for (var pointIndex = 0; pointIndex < pointCount; pointIndex++) {
            var longitude = next() / 100, latitude = next() / 100, vector = unitVector(latitude, longitude);
            ring[pointIndex * 3] = vector[0]; ring[pointIndex * 3 + 1] = vector[1]; ring[pointIndex * 3 + 2] = vector[2];
          }
          rings.push(ring);
        }
      }
      return rings;
    }
    function buildGraticule() {
      var lines = [], longitude, latitude, points;
      for (longitude = -180; longitude < 180; longitude += 30) {
        points = [];
        for (latitude = -80; latitude <= 80; latitude += 4) points.push(unitVector(latitude, longitude));
        lines.push(points);
      }
      for (latitude = -60; latitude <= 60; latitude += 30) {
        points = [];
        for (longitude = -180; longitude <= 180; longitude += 4) points.push(unitVector(latitude, longitude));
        lines.push(points);
      }
      return lines;
    }

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    window.addEventListener('resize', resize);
    resize();

    function radius() { return Math.min(width, height) * 0.44 * zoom; }
    function center() { return [width / 2, height / 2]; }
    function rotate(horizontal, vertical, depth) {
      var cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw), cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
      var rotatedHorizontal = horizontal * cosYaw + depth * sinYaw;
      var rotatedDepth = -horizontal * sinYaw + depth * cosYaw;
      return [rotatedHorizontal, vertical * cosPitch - rotatedDepth * sinPitch, vertical * sinPitch + rotatedDepth * cosPitch];
    }
    function toScreen(rotated, sphereRadius, sphereCenter) {
      return [sphereCenter[0] + rotated[0] * sphereRadius, sphereCenter[1] - rotated[1] * sphereRadius];
    }
    function limbAngle(from, to) {
      var share = from[2] / (from[2] - to[2]);
      var right = from[0] + (to[0] - from[0]) * share, up = from[1] + (to[1] - from[1]) * share;
      return Math.atan2(-up, right);
    }
    function traceRing(ring, sphereRadius, sphereCenter) {
      var count = ring.length / 3, rotated = [], firstVisible = -1, index;
      for (index = 0; index < count; index++) {
        rotated.push(rotate(ring[index * 3], ring[index * 3 + 1], ring[index * 3 + 2]));
        if (firstVisible < 0 && rotated[index][2] > 0) firstVisible = index;
      }
      if (firstVisible < 0) return;
      var start = toScreen(rotated[firstVisible], sphereRadius, sphereCenter);
      context.moveTo(start[0], start[1]);
      var exitAngle = null;
      for (var step = 1; step <= count; step++) {
        var previous = rotated[(firstVisible + step - 1) % count], current = rotated[(firstVisible + step) % count];
        var previousVisible = previous[2] > 0, currentVisible = current[2] > 0, point;
        if (previousVisible && !currentVisible) {
          exitAngle = limbAngle(previous, current);
          context.lineTo(sphereCenter[0] + Math.cos(exitAngle) * sphereRadius, sphereCenter[1] + Math.sin(exitAngle) * sphereRadius);
        } else if (!previousVisible && currentVisible) {
          var entryAngle = limbAngle(previous, current), exit = exitAngle == null ? entryAngle : exitAngle;
          var sweep = ((entryAngle - exit) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          if (sweep > Math.PI) sweep -= Math.PI * 2;
          context.arc(sphereCenter[0], sphereCenter[1], sphereRadius, exit, exit + sweep, sweep < 0);
          point = toScreen(current, sphereRadius, sphereCenter);
          context.lineTo(point[0], point[1]);
          exitAngle = null;
        } else if (currentVisible) {
          point = toScreen(current, sphereRadius, sphereCenter);
          context.lineTo(point[0], point[1]);
        }
      }
      context.closePath();
    }

    function projectedPins() {
      var sphereRadius = radius(), sphereCenter = center();
      return pins.map(function (pin, index) {
        var rotated = rotate(pin.vector[0], pin.vector[1], pin.vector[2]);
        var screen = toScreen(rotated, sphereRadius, sphereCenter);
        return { index: index, x: screen[0], y: screen[1], depth: rotated[2] };
      });
    }

    function draw(time) {
      requestAnimationFrame(draw);
      var delta = lastTime ? Math.min(0.1, (time - lastTime) / 1000) : 0;
      lastTime = time; elapsed += delta;
      var frames = delta * 60;
      if (flight) {
        var seconds = (options && options.flightSeconds) || 0.62, progress = Math.min(1, (elapsed - flight.startedAt) / seconds);
        var eased = options && options.flightSeconds ? (progress < .5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2) : 1 - Math.pow(1 - progress, 3);
        yaw = flight.startYaw + flight.deltaYaw * eased;
        pitch = flight.startPitch + flight.deltaPitch * eased;
        if (progress >= 1) flight = null;
      } else if (!dragging) {
        if (!interacted && !reduceMotion) yaw += 0.13 * delta;
        yaw += yawVelocity * delta;
        yawVelocity *= Math.pow(0.94, frames);
        if (Math.abs(yawVelocity) < 0.001) yawVelocity = 0;
      }
      zoom += (targetZoom - zoom) * (1 - Math.pow(0.88, frames));
      if (Math.abs(targetZoom - zoom) < 0.002) zoom = targetZoom;
      if (!width || !height) return;

      var sphereRadius = radius(), sphereCenter = center(), centerX = sphereCenter[0], centerY = sphereCenter[1];
      context.clearRect(0, 0, width, height);

      context.save();
      context.shadowColor = 'rgba(124,63,255,.55)';
      context.shadowBlur = sphereRadius * 0.14;
      var ocean = context.createRadialGradient(centerX - sphereRadius * 0.35, centerY - sphereRadius * 0.4, 0, centerX, centerY, sphereRadius * 1.1);
      ocean.addColorStop(0, '#3a1078'); ocean.addColorStop(0.55, '#290756'); ocean.addColorStop(1, '#150a2e');
      context.beginPath(); context.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      context.fillStyle = ocean; context.fill();
      context.restore();

      context.save();
      context.beginPath(); context.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2); context.clip();

      context.beginPath();
      graticule.forEach(function (line) {
        var drawing = false;
        line.forEach(function (vector) {
          var rotated = rotate(vector[0], vector[1], vector[2]);
          if (rotated[2] <= 0) { drawing = false; return; }
          var point = toScreen(rotated, sphereRadius, sphereCenter);
          if (drawing) context.lineTo(point[0], point[1]); else { context.moveTo(point[0], point[1]); drawing = true; }
        });
      });
      context.strokeStyle = 'rgba(255,255,255,.08)'; context.lineWidth = 0.8; context.stroke();

      context.beginPath();
      landRings.forEach(function (ring) { traceRing(ring, sphereRadius, sphereCenter); });
      context.fillStyle = '#bfb4fc'; context.fill('evenodd');
      context.strokeStyle = '#a87bff'; context.lineWidth = 0.8; context.stroke();

      var light = context.createRadialGradient(centerX - sphereRadius * 0.45, centerY - sphereRadius * 0.5, 0, centerX, centerY, sphereRadius * 1.35);
      light.addColorStop(0, 'rgba(255,255,255,.22)'); light.addColorStop(0.45, 'rgba(255,255,255,0)'); light.addColorStop(1, 'rgba(30,30,30,.5)');
      context.fillStyle = light;
      context.fillRect(centerX - sphereRadius, centerY - sphereRadius, sphereRadius * 2, sphereRadius * 2);
      context.restore();

      context.beginPath(); context.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(168,123,255,.55)'; context.lineWidth = 1.5; context.stroke();

      drawPins();
    }

    /* rota opcional: arcos de círculo máximo entre os pinos, na ordem */
    function drawRoute() {
      if (route.length < 2) return;
      var sphereRadius = radius(), sphereCenter = center();
      context.save(); context.setLineDash([5, 6]); context.lineWidth = 2; context.strokeStyle = "rgba(17,245,88,.85)";
      for (var leg = 1; leg < route.length; leg++) {
        var from = route[leg - 1], to = route[leg], drawing = false;
        context.beginPath();
        for (var step = 0; step <= 40; step++) {
          var t = step / 40, x = from[0] + (to[0] - from[0]) * t, y = from[1] + (to[1] - from[1]) * t, z = from[2] + (to[2] - from[2]) * t;
          var size = Math.sqrt(x * x + y * y + z * z) || 1, lift = 1 + 0.06 * Math.sin(Math.PI * t);
          var rotated = rotate(x / size * lift, y / size * lift, z / size * lift);
          if (rotated[2] <= 0) { drawing = false; continue; }
          var point = toScreen(rotated, sphereRadius, sphereCenter);
          if (drawing) context.lineTo(point[0], point[1]); else { context.moveTo(point[0], point[1]); drawing = true; }
        }
        context.stroke();
      }
      context.restore();
    }
    function drawPins() {
      drawRoute();
      var pulse = (Math.sin(elapsed / 0.46) + 1) / 2;
      var labels = [];
      projectedPins().forEach(function (pin) {
        if (pin.depth <= 0.04) return;
        var isHovered = pin.index === hovered, alpha = 0.35 + 0.65 * pin.depth;
        context.globalAlpha = alpha * 0.32 * (0.45 + 0.55 * pulse);
        context.beginPath(); context.arc(pin.x, pin.y, 6 + pulse * 3, 0, Math.PI * 2);
        context.fillStyle = '#11f558'; context.fill();
        var coreRadius = isHovered ? 5 : 3.6;
        context.globalAlpha = alpha;
        context.beginPath(); context.arc(pin.x, pin.y, coreRadius, 0, Math.PI * 2);
        context.fillStyle = '#11f558'; context.fill();
        context.strokeStyle = 'rgba(41,7,86,.9)'; context.lineWidth = 1.4; context.stroke();
        if (isHovered || pin.depth > 0.3) labels.push({ pin: pin, priority: isHovered ? 9 : pin.depth, emphasized: isHovered, alpha: isHovered ? 1 : alpha * 0.9 });
      });
      labels.sort(function (first, second) { return second.priority - first.priority; });
      var placed = [];
      context.textAlign = 'center'; context.textBaseline = 'bottom';
      labels.forEach(function (label) {
        context.font = (label.emphasized ? '800 13px' : '600 11.5px') + ' Onest, system-ui, sans-serif';
        var text = pins[label.pin.index].label, halfWidth = context.measureText(text).width / 2 + 3;
        var box = { left: label.pin.x - halfWidth, right: label.pin.x + halfWidth, top: label.pin.y - 26, bottom: label.pin.y - 10 };
        if (placed.some(function (other) { return other.left < box.right && box.left < other.right && other.top < box.bottom && box.top < other.bottom; })) return;
        placed.push(box);
        context.globalAlpha = label.alpha;
        context.lineWidth = 2.5; context.strokeStyle = 'rgba(21,10,46,.7)'; context.lineJoin = 'round';
        context.strokeText(text, label.pin.x, label.pin.y - 10);
        context.fillStyle = label.emphasized ? '#11f558' : '#ffffff';
        context.fillText(text, label.pin.x, label.pin.y - 10);
      });
      context.globalAlpha = 1;
    }

    function pinAt(clientX, clientY, isTouch, isTap) {
      var bounds = canvas.getBoundingClientRect(), pointX = clientX - bounds.left, pointY = clientY - bounds.top;
      var limit = isTouch ? 30 : 18, best = -1, bestDistance = limit * limit;
      var sphereCenter = center(), sphereRadius = radius();
      if (isTap && Math.hypot(pointX - sphereCenter[0], pointY - sphereCenter[1]) <= sphereRadius) {
        bestDistance = Math.pow(Math.max(70, sphereRadius * 0.5), 2);
      }
      projectedPins().forEach(function (pin) {
        if (pin.depth <= 0.04) return;
        var distance = Math.pow(pin.x - pointX, 2) + Math.pow(pin.y - pointY, 2);
        if (distance < bestDistance) { bestDistance = distance; best = pin.index; }
      });
      return best;
    }

    canvas.addEventListener('pointerdown', function (event) {
      pointers.set(event.pointerId, [event.clientX, event.clientY]);
      if (canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
      dragging = true; interacted = true; moved = 0; flight = null; yawVelocity = 0;
      lastX = event.clientX; lastY = event.clientY;
      canvas.classList.add('grabbing');
    });
    canvas.addEventListener('pointermove', function (event) {
      if (pointers.has(event.pointerId)) pointers.set(event.pointerId, [event.clientX, event.clientY]);
      if (pointers.size === 2) {
        var positions = Array.from(pointers.values());
        var distance = Math.hypot(positions[0][0] - positions[1][0], positions[0][1] - positions[1][1]);
        if (pinchDistance) targetZoom = Math.max(1, Math.min(5, targetZoom * distance / pinchDistance));
        pinchDistance = distance; moved += 20;
        return;
      }
      if (!dragging) {
        var hit = pinAt(event.clientX, event.clientY, false, false);
        if (hit !== hovered) { hovered = hit; canvas.style.cursor = hit >= 0 ? 'pointer' : ''; }
        return;
      }
      var deltaX = event.clientX - lastX, deltaY = event.clientY - lastY;
      moved += Math.abs(deltaX) + Math.abs(deltaY);
      yaw += deltaX * 0.006; yawVelocity = deltaX * 0.072;
      pitch = Math.max(-1.35, Math.min(1.35, pitch + deltaY * 0.006));
      lastX = event.clientX; lastY = event.clientY;
    });
    function release(event) {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchDistance = 0;
      if (pointers.size) return;
      dragging = false; canvas.classList.remove('grabbing');
      if (event.type !== 'pointerup' || moved >= (event.pointerType === 'touch' ? 14 : 5)) return;
      var hit = pinAt(event.clientX, event.clientY, event.pointerType === 'touch', true);
      if (hit < 0) return;
      var pin = pins[hit];
      if (options && options.onPin) options.onPin(pin);
    }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('pointerleave', function () { if (!dragging && hovered >= 0) { hovered = -1; canvas.style.cursor = ''; } });
    canvas.addEventListener('wheel', function (event) {
      event.preventDefault();
      targetZoom = Math.max(1, Math.min(5, targetZoom * (event.deltaY < 0 ? 1.18 : 1 / 1.18)));
    }, { passive: false });

    requestAnimationFrame(draw);

    return {
      setPins: function (list) {
        pins = list.map(function (pin) { pin.vector = unitVector(pin.latitude, pin.longitude); return pin; });
        hovered = -1;
      },
      setRoute: function (list) {
        route = list.map(function (point) { return unitVector(point[0], point[1]); });
      },
      flyTo: function (latitude, longitude, nextZoom) {
        var targetYaw = -longitude * RAD, targetPitch = latitude * RAD, turn = Math.PI * 2;
        var shortest = ((targetYaw - yaw) % turn + turn + Math.PI) % turn - Math.PI;
        flight = { startYaw: yaw, deltaYaw: shortest, startPitch: pitch, deltaPitch: targetPitch - pitch, startedAt: elapsed };
        interacted = true; yawVelocity = 0;
        targetZoom = Math.max(1, Math.min(5, nextZoom));
      }
    };
  }
  window.createOndGlobe = createGlobe;
})();
