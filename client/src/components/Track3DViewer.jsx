import { useEffect, useRef, useState } from 'react';
import { trackLayouts } from '../data/trackLayouts';

const Track3DViewer = ({ trackId }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 45, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const track = trackLayouts[trackId];

  useEffect(() => {
    if (!track || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    const drawTrack = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Transform coordinates for 3D effect
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = 1.5;

      const project3D = (point) => {
        const radX = (rotation.x * Math.PI) / 180;
        const radY = (rotation.y * Math.PI) / 180;

        // Rotate around Y axis
        let x = point.x * Math.cos(radY) - point.z * Math.sin(radY);
        let z = point.x * Math.sin(radY) + point.z * Math.cos(radY);
        let y = point.y;

        // Rotate around X axis
        const y2 = y * Math.cos(radX) - z * Math.sin(radX);
        const z2 = y * Math.sin(radX) + z * Math.cos(radX);

        // Project to 2D
        const perspective = 500;
        const projectedX = (x * perspective) / (perspective + z2) * scale + centerX;
        const projectedY = (y2 * perspective) / (perspective + z2) * scale + centerY;

        return { x: projectedX, y: projectedY, z: z2 };
      };

      // Draw track surface
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const projectedPoints = track.coordinates.map(project3D);

      // Draw track line
      ctx.beginPath();
      projectedPoints.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // Draw sector markers
      projectedPoints.forEach((point, i) => {
        const coord = track.coordinates[i];
        
        // Sector color
        const sectorColors = {
          1: '#22c55e',
          2: '#eab308',
          3: '#3b82f6'
        };

        ctx.fillStyle = sectorColors[coord.sector];
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Start/Finish line
        if (i === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('S/F', point.x, point.y + 4);
        }
      });

      // Draw elevation profile
      ctx.fillStyle = '#64748b';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Elevation: ${track.elevation.min}m - ${track.elevation.max}m`, 10, 20);
      ctx.fillText(`Change: ${track.elevation.change}m`, 10, 40);
      ctx.fillText(`Direction: ${track.direction}`, 10, 60);
    };

    drawTrack();
  }, [track, rotation]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMouse.x;
    const deltaY = e.clientY - lastMouse.y;

    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x + deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));

    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!track) {
    return <div className="text-white">Track not found</div>;
  }

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full cursor-grab active:cursor-grabbing rounded-lg"
        style={{ maxWidth: '800px', height: 'auto' }}
      />
      <p className="text-slate-400 text-sm mt-2 text-center">
        Drag to rotate • Sector 1: Green • Sector 2: Yellow • Sector 3: Blue
      </p>
    </div>
  );
};

export default Track3DViewer;

