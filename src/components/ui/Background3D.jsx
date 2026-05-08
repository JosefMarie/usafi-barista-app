import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Background3D() {
    const containerRef = useRef();

    useEffect(() => {
        if (!containerRef.current) return;

        // --- Setup ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        camera.position.z = 20;

        // --- Mouse tracking for parallax ---
        const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        const handleMouseMove = (e) => {
            mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // --- Particles ---
        const particleCount = 180;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        const baseSizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3]     = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

            velocities[i * 3]     = (Math.random() - 0.5) * 0.025;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.025;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.012;

            baseSizes[i] = 0.15 + Math.random() * 0.45;
        }

        // ShaderMaterial for per-point pulsing size
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(baseSizes, 1));

        const particleMaterial = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uTime:    { value: 0 },
                uColor:   { value: new THREE.Color(0x321C00) },
                uOpacity: { value: 0.85 },
            },
            vertexShader: `
                attribute float aSize;
                uniform float uTime;
                varying float vAlpha;

                void main() {
                    // Each point breathes at its own rate driven by its position as a unique seed
                    float pulse = 1.0 + 0.65 * sin(uTime * 1.4 + position.x * 0.3 + position.y * 0.25 + position.z * 0.2);
                    float size = aSize * pulse * 9.0;

                    // Soft edge fade based on distance from centre
                    float dist = length(position.xy) / 30.0;
                    vAlpha = 1.0 - clamp(dist, 0.0, 0.75);

                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position  = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3  uColor;
                uniform float uOpacity;
                varying float vAlpha;

                void main() {
                    float d = length(gl_PointCoord - vec2(0.5));
                    if (d > 0.5) discard;
                    float alpha = smoothstep(0.5, 0.08, d) * vAlpha * uOpacity;
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
        });

        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particleSystem);

        // --- Connecting Lines ---
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x321C00,
            transparent: true,
            opacity: 0.13,
        });
        const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lineMesh);

        // --- Animation Loop ---
        let frame = 0;
        const clock = new THREE.Clock();

        const animate = () => {
            frame = requestAnimationFrame(animate);
            const elapsed = clock.getElapsedTime();

            // Advance shader time
            particleMaterial.uniforms.uTime.value = elapsed;

            // Smooth lerp mouse parallax
            mouse.x += (mouse.targetX - mouse.x) * 0.05;
            mouse.y += (mouse.targetY - mouse.y) * 0.05;

            const posArray = particleGeometry.attributes.position.array;
            const linePositions = [];

            for (let i = 0; i < particleCount; i++) {
                // Drift each particle
                posArray[i * 3]     += velocities[i * 3];
                posArray[i * 3 + 1] += velocities[i * 3 + 1];
                posArray[i * 3 + 2] += velocities[i * 3 + 2];

                // Bounce off walls
                if (Math.abs(posArray[i * 3])     > 26) velocities[i * 3]     *= -1;
                if (Math.abs(posArray[i * 3 + 1]) > 26) velocities[i * 3 + 1] *= -1;
                if (Math.abs(posArray[i * 3 + 2]) > 16) velocities[i * 3 + 2] *= -1;

                // Connect close neighbours with a line
                for (let j = i + 1; j < particleCount; j++) {
                    const dx = posArray[i * 3]     - posArray[j * 3];
                    const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
                    const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
                    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 9) {
                        linePositions.push(
                            posArray[i * 3], posArray[i * 3 + 1], posArray[i * 3 + 2],
                            posArray[j * 3], posArray[j * 3 + 1], posArray[j * 3 + 2]
                        );
                    }
                }
            }

            particleGeometry.attributes.position.needsUpdate = true;
            lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

            // Slow global rotation of the whole constellation
            particleSystem.rotation.y = elapsed * 0.045;
            particleSystem.rotation.x = elapsed * 0.022;
            lineMesh.rotation.y = elapsed * 0.045;
            lineMesh.rotation.x = elapsed * 0.022;

            // Breathing camera drift + mouse parallax tilt
            camera.position.x = Math.sin(elapsed * 0.09) * 2.5 + mouse.x * 1.8;
            camera.position.y = Math.cos(elapsed * 0.07) * 1.8 + mouse.y * 1.8;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        animate();

        // --- Resize ---
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(frame);
            if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
            particleGeometry.dispose();
            particleMaterial.dispose();
            lineGeometry.dispose();
            lineMaterial.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{ opacity: 0.7 }}
        />
    );
}
