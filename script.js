document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', function() {
        this.parentElement.parentElement.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    
    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                hamburger.parentElement.parentElement.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });
    
    // Back to Top Button
    const backToTopBtn = document.querySelector('.back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('active');
        } else {
            backToTopBtn.classList.remove('active');
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Tab System for Predictions Section
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Carousel Navigation for Experts Section
    const carouselContainer = document.querySelector('.carousel-container');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    
    if (carouselContainer && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', function() {
            carouselContainer.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        });
        
        nextBtn.addEventListener('click', function() {
            carouselContainer.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        });
    }
    
    // Animated Counter for IoT Stats
    const counters = document.querySelectorAll('.stat-number');
    const speed = 200;
    
    if (counters.length > 0) {
        const animateCounters = () => {
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText;
                const increment = target / speed;
                
                if (count < target) {
                    counter.innerText = Math.ceil(count + increment);
                    setTimeout(animateCounters, 1);
                } else {
                    counter.innerText = target;
                }
            });
        };
        
        // Start animation when section is in view
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Set data targets
                    document.getElementById('devices-count').setAttribute('data-target', '500');
                    document.getElementById('data-volume').setAttribute('data-target', '175');
                    document.getElementById('market-size').setAttribute('data-target', '1.6');
                    
                    animateCounters();
                    io.unobserve(entry.target);
                }
            });
        });
        
        io.observe(document.querySelector('.iot-visualization'));
    }
    
    // Form Submission
    const futureForm = document.getElementById('future-form');
    
    if (futureForm) {
        futureForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = this.querySelector('#name').value;
            const email = this.querySelector('#email').value;
            const interest = this.querySelector('#interest').value;
            const message = this.querySelector('#message').value;
            
            // Here you would typically send the data to a server
            console.log({ name, email, interest, message });
            
            // Show success message
            alert('Terima kasih atas pesan Anda! Kami akan segera menghubungi Anda.');
            
            // Reset form
            this.reset();
        });
    }
    
    // Initialize Particles.js
    if (document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#ffffff"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 5
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#ffffff",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    }
    
    // Animate Progress Bars on Scroll
    const progressBars = document.querySelectorAll('.progress-bar');
    
    if (progressBars.length > 0) {
        const animateProgressBars = () => {
            progressBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0';
                
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        };
        
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateProgressBars();
                    io.unobserve(entry.target);
                }
            });
        });
        
        io.observe(document.querySelector('.ai-features'));
    }
    
    // Simple 3D Globe for IoT Visualization (using Three.js)
    if (document.getElementById('iot-globe')) {
        const globeContainer = document.getElementById('iot-globe');
        
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, globeContainer.clientWidth / globeContainer.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(globeContainer.clientWidth, globeContainer.clientHeight);
        globeContainer.appendChild(renderer.domElement);
        
        // Create globe
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00c6fb,
            transparent: true,
            opacity: 0.9,
            specular: 0x111111,
            shininess: 30
        });
        
        const globe = new THREE.Mesh(geometry, material);
        scene.add(globe);
        
        // Add points for IoT devices
        const pointsGeometry = new THREE.BufferGeometry();
        const pointsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.8
        });
        
        const pointsPositions = [];
        for (let i = 0; i < 500; i++) {
            // Random points on sphere surface
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 2.05;
            
            pointsPositions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
        }
        
        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointsPositions, 3));
        const points = new THREE.Points(pointsGeometry, pointsMaterial);
        scene.add(points);
        
        // Add connecting lines
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00f2c3,
            transparent: true,
            opacity: 0.3
        });
        
        const linePositions = [];
        for (let i = 0; i < pointsPositions.length; i += 3) {
            if (Math.random() > 0.7) {
                const j = Math.floor(Math.random() * pointsPositions.length / 3) * 3;
                
                linePositions.push(
                    pointsPositions[i], pointsPositions[i+1], pointsPositions[i+2],
                    pointsPositions[j], pointsPositions[j+1], pointsPositions[j+2]
                );
            }
        }
        
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Position camera
        camera.position.z = 5;
        
        // Animation
        function animate() {
            requestAnimationFrame(animate);
            
            globe.rotation.y += 0.002;
            points.rotation.y += 0.002;
            lines.rotation.y += 0.002;
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle resize
        window.addEventListener('resize', function() {
            camera.aspect = globeContainer.clientWidth / globeContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(globeContainer.clientWidth, globeContainer.clientHeight);
        });
    }
});