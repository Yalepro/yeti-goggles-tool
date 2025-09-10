import React, { useRef, useState } from "react";

export default function YetiGogglesOverlay() {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [goggles, setGoggles] = useState({ x: 100, y: 100, size: 150, rotation: 0 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [touchState, setTouchState] = useState(null);

  const gogglesImg = new Image();
  gogglesImg.src = "/goggles.png";

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => setImage(img);
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(goggles.x + goggles.size / 2, goggles.y + goggles.size / 2);
    ctx.rotate((goggles.rotation * Math.PI) / 180);
    ctx.drawImage(
      gogglesImg,
      -goggles.size / 2,
      -goggles.size / 2,
      goggles.size,
      goggles.size * (gogglesImg.height / gogglesImg.width)
    );
    ctx.restore();
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x >= goggles.x &&
      x <= goggles.x + goggles.size &&
      y >= goggles.y &&
      y <= goggles.y + goggles.size
    ) {
      if (e.shiftKey) {
        setResizing(true);
      } else if (e.altKey) {
        setRotating(true);
      } else {
        setDragging(true);
      }
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragging) {
      setGoggles({ ...goggles, x: x - goggles.size / 2, y: y - goggles.size / 2 });
    } else if (resizing) {
      const newSize = Math.max(50, x - goggles.x);
      setGoggles({ ...goggles, size: newSize });
    } else if (rotating) {
      const centerX = goggles.x + goggles.size / 2;
      const centerY = goggles.y + goggles.size / 2;
      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
      setGoggles({ ...goggles, rotation: angle });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
    setRotating(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      if (x >= goggles.x && x <= goggles.x + goggles.size && y >= goggles.y && y <= goggles.y + goggles.size) {
        setDragging(true);
      }
    } else if (e.touches.length === 2) {
      const [touch1, touch2] = e.touches;
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      setTouchState({ distance, angle });
    }
  };

  const handleTouchMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (dragging && e.touches.length === 1) {
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      setGoggles({ ...goggles, x: x - goggles.size / 2, y: y - goggles.size / 2 });
    } else if (e.touches.length === 2 && touchState) {
      const [touch1, touch2] = e.touches;
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const newDistance = Math.sqrt(dx * dx + dy * dy);
      const newAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      const scale = newDistance / touchState.distance;
      const rotationDelta = newAngle - touchState.angle;

      setGoggles({
        ...goggles,
        size: Math.max(50, goggles.size * scale),
        rotation: goggles.rotation + rotationDelta,
      });

      setTouchState({ distance: newDistance, angle: newAngle });
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    setTouchState(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "yeti-profile.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  React.useEffect(() => {
    drawCanvas();
  }, [image, goggles]);

  return (
    <div className="flex flex-col items-center p-6 space-y-4">
      <h1 className="text-2xl font-bold">Yeti Goggles Overlay</h1>
      <input type="file" accept="image/*" onChange={handleUpload} />
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="border rounded-lg shadow"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      {image && (
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-gray-600 text-center">Drag to move | Shift+Drag to resize | Alt+Drag to rotate | Pinch/Rotate with two fingers on mobile</p>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
          >
            Download Image
          </button>
        </div>
      )}
    </div>
  );
}
