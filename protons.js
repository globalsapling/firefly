(function () {
    'use strict';

    var canvas = document.getElementById('proton-field');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var particles = [];
    var flashes = [];
    var rafId = null;
    var nextSpawnAt = 0;
    var scrollBoost = 0;
    var lastScroll = window.pageYOffset || 0;

    // Ink/gray tones pulled from the palette, kept faint and flat.
    var TONES = ['22, 21, 15', '58, 56, 47', '107, 105, 96'];
    var TAU = Math.PI * 2;

    function enabled() {
        return window.innerWidth >= 640;   // off on phones to protect performance
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function makeBase(p) {
        p.phase = rand(0, TAU);
        p.freq = rand(0.07, 0.13);          // pronounced helix curvature
        p.tone = TONES[(Math.random() * TONES.length) | 0];
        p.trail = [];
    }

    function spawnPrimary() {
        if (!enabled()) return;
        var p = {};
        makeBase(p);
        var fromLeft = Math.random() < 0.5;
        var dir = fromLeft ? rand(-0.35, 0.35) : Math.PI + rand(-0.35, 0.35);
        p.angle = dir;
        p.dirRight = Math.cos(dir) > 0;
        p.speed = rand(3.8, 5.6);
        p.amp = rand(18, 40);
        p.cx = p.dirRight ? -60 : width + 60;
        p.cy = rand(0.2, 0.8) * height;
        p.opacity = rand(0.16, 0.22);
        p.maxTrail = (rand(54, 84)) | 0;
        p.traveled = 0;
        p.canFission = true;
        p.fade = null;
        p.fissionX = p.dirRight ? rand(0.42, 0.66) * width : rand(0.34, 0.58) * width;
        particles.push(p);
    }

    function fission(parent) {
        flashes.push({
            x: parent.cx, y: parent.cy, age: 0, max: 36,
            tone: parent.tone, opacity: parent.opacity
        });
        var n = 2 + (Math.random() < 0.35 ? 1 : 0);   // 2 or 3 fragments
        var spread = rand(0.55, 0.95);
        for (var k = 0; k < n; k++) {
            var p = {};
            makeBase(p);
            p.angle = parent.angle + (k - (n - 1) / 2) * spread;
            p.dirRight = Math.cos(p.angle) > 0;
            p.speed = rand(5.5, 8.5);
            p.amp = rand(8, 20);                       // tighter helix
            p.cx = parent.cx;
            p.cy = parent.cy;
            p.opacity = parent.opacity * 0.9;
            p.maxTrail = (rand(40, 64)) | 0;
            p.traveled = 0;
            p.canFission = false;
            p.fade = 1;                                // fragments fade out
            particles.push(p);
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        particles = [];
        flashes = [];
        nextSpawnAt = 0;
        if (reduceMotion) {
            drawStatic();
        } else if (enabled()) {
            spawnPrimary();
        } else {
            ctx.clearRect(0, 0, width, height);
        }
    }

    function drawStatic() {
        // Reduced motion: a single faint, motionless point.
        ctx.clearRect(0, 0, width, height);
        if (!enabled()) return;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + TONES[1] + ',0.18)';
        ctx.arc(width * 0.5, height * 0.4, 1.6, 0, TAU);
        ctx.fill();
    }

    function drawTrail(p, eff) {
        var t = p.trail;
        var nn = t.length / 2;
        if (nn < 3) return;
        for (var j = 1; j < nn - 1; j++) {
            var f = j / nn;                            // 0 at tail .. 1 at head
            var x0 = t[(j - 1) * 2], y0 = t[(j - 1) * 2 + 1];
            var x1 = t[j * 2], y1 = t[j * 2 + 1];
            var x2 = t[(j + 1) * 2], y2 = t[(j + 1) * 2 + 1];
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(' + p.tone + ',' + (eff * f) + ')';
            ctx.lineWidth = 1;
            ctx.moveTo((x0 + x1) / 2, (y0 + y1) / 2);
            ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2);
            ctx.stroke();
        }
    }

    function step(now) {
        ctx.clearRect(0, 0, width, height);

        var boost = 1 + scrollBoost;
        scrollBoost *= 0.9;
        if (scrollBoost < 0.001) scrollBoost = 0;

        // Fission flashes (expanding faint ring).
        for (var i = flashes.length - 1; i >= 0; i--) {
            var fl = flashes[i];
            fl.age++;
            var prog = fl.age / fl.max;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(' + fl.tone + ',' + (fl.opacity * (1 - prog)) + ')';
            ctx.lineWidth = 1;
            ctx.arc(fl.x, fl.y, 4 + prog * 26, 0, TAU);
            ctx.stroke();
            if (fl.age >= fl.max) flashes.splice(i, 1);
        }

        var margin = 70;
        var survivors = [];

        for (var k = 0; k < particles.length; k++) {
            var p = particles[k];
            var sp = p.speed * boost;

            p.phase += p.freq * boost;
            p.cx += Math.cos(p.angle) * sp;
            p.cy += Math.sin(p.angle) * sp;
            p.traveled += sp;
            if (p.fade !== null) p.fade -= 0.009;

            var lateral = p.amp * Math.sin(p.phase);
            var perp = p.angle + Math.PI / 2;
            var hx = p.cx + Math.cos(perp) * lateral;
            var hy = p.cy + Math.sin(perp) * lateral;

            p.trail.push(hx);
            p.trail.push(hy);
            if (p.trail.length > p.maxTrail * 2) {
                p.trail.shift();
                p.trail.shift();
            }

            // Fission once the neutron reaches its split point on screen.
            if (p.canFission &&
                (p.dirRight ? p.cx >= p.fissionX : p.cx <= p.fissionX)) {
                fission(p);
                continue;
            }

            var off = p.cx < -margin || p.cx > width + margin ||
                p.cy < -margin || p.cy > height + margin;
            if (off || (p.fade !== null && p.fade <= 0)) continue;

            drawTrail(p, p.opacity * (p.fade === null ? 1 : p.fade));
            survivors.push(p);
        }

        particles = survivors;

        // When the scene is empty, pause briefly, then send in a new neutron.
        if (particles.length === 0 && flashes.length === 0) {
            if (nextSpawnAt === 0) {
                nextSpawnAt = now + rand(700, 1500);
            } else if (now >= nextSpawnAt) {
                nextSpawnAt = 0;
                spawnPrimary();
            }
        }

        rafId = window.requestAnimationFrame(step);
    }

    function onScroll() {
        var y = window.pageYOffset || 0;
        scrollBoost = Math.min(0.8, scrollBoost + Math.abs(y - lastScroll) * 0.008);
        lastScroll = y;
    }

    resize();

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    if (!reduceMotion) {
        window.addEventListener('scroll', onScroll, { passive: true });
        rafId = window.requestAnimationFrame(step);

        // Pause the loop when the tab is hidden to save resources.
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; }
            } else if (!rafId) {
                lastScroll = window.pageYOffset || 0;
                rafId = window.requestAnimationFrame(step);
            }
        });
    }
})();
