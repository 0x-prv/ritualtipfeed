useEffect(() => {
  if (xHandle === null || xHandle === undefined || !account) return;
  const canvas = document.getElementById("confetti-canvas") as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  const colors = ["#1D9E75","#9FE1CB","#5DCAA5","#ffffff","#0F6E56"];
  const pieces = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: Math.random() * 8 + 4,
    h: Math.random() * 4 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.08,
    speed: Math.random() * 2 + 1,
    done: false,
  }));
  let frame = 0;
  let raf: number;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let allDone = true;
    pieces.forEach((p) => {
      if (p.done) return;
      allDone = false;
      p.y += p.speed;
      p.rot += p.rotSpeed;
      if (p.y > canvas.height) { p.done = true; return; }
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (!allDone && frame++ < 300) raf = requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
  return () => cancelAnimationFrame(raf);
}, [xHandle, account]);