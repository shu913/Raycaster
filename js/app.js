import * as THREE from "three";
import { gsap } from "gsap";

window.addEventListener("DOMContentLoaded", () => {
  const app = new App();

  app.load().then(() => {
    app.setup();
    app.setupObjects();
    app.render();
  });
});

class App {
  static get MATERIAL_PARAM() {
    return {
      color: 0xffffff,
    };
  }

  static get POINT_MATERIAL_PARAM() {
    return {
      color: 0xffffff,
      size: 0.2,
      sizeAttenuation: true,
    };
  }

  constructor() {
    this.planeArray = [];

    this.isMouseMove = false;
    this.isClicked = false;

    this.object;
    this.objectCopy;

    // API key
    this.apiKey = "0296d9cfab50bb2bb831354611c78819";
    this.movieList;

    window.addEventListener("resize", () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    this.raycaster = new THREE.Raycaster();

    window.addEventListener("pointermove", (event) => {
      const x = (event.clientX / window.innerWidth) * 2.0 - 1.0;
      const y = (event.clientY / window.innerHeight) * 2.0 - 1.0;

      const v = new THREE.Vector2(x, -y);

      this.raycaster.setFromCamera(v, this.camera);

      const intersects = this.raycaster.intersectObjects(this.planeArray);

      if (intersects.length > 0 && !this.isClicked) {
        const intersected = intersects[0];
        this.object = intersected.object;

        gsap.to(this.object.position, { duration: 0.5, y: 0.3 });
        document.querySelector(".movie-title").innerHTML = this.object.userData["original_title"] + "(" + this.object.userData["release_date"].slice(0, 4) + ")";

        this.planeArray.forEach((plane) => {
          if (plane !== this.object) {
            gsap.to(plane.position, { duration: 0.5, y: 0.0 });
          }
        });
      }
    });

    window.addEventListener("click", (event) => {
      const x = (event.clientX / window.innerWidth) * 2.0 - 1.0;
      const y = (event.clientY / window.innerHeight) * 2.0 - 1.0;

      const v = new THREE.Vector2(x, -y);

      this.raycaster.setFromCamera(v, this.camera);

      const intersects = this.raycaster.intersectObjects(this.planeArray);

      if (intersects.length > 0 && !this.isClicked) {
        const intersected = intersects[0];
        this.object = intersected.object;
        this.objectCopy = this.object.clone();

        if (!this.object.userData["overview"] == "") {
          document.querySelector(".movie-overview").innerHTML = this.object.userData["overview"];
        } else {
          document.querySelector(".movie-overview").innerHTML = "No overview";
        }

        let tl = gsap.timeline({ onStart: () => (this.isClicked = true) });
        const duration = 0.5;
        const scale = 3.0;

        tl.to(
          this.object.position,
          {
            duration: duration,
            x: 0,
            y: 0,
            z: 1.0,
          },
          0
        );
        tl.to(
          this.object.rotation,
          {
            duration: duration,
            x: Math.PI * 2 + 0.1,
            y: -0.1,
          },
          0
        );
        tl.to(
          this.object.scale,
          {
            duration: duration,
            x: scale,
            y: scale,
          },
          0
        );
        tl.to(
          ".movie-info-container",
          {
            duration: duration,
            y: -100,
          },
          0
        );
        tl.to(
          ".movie-overview-container",
          {
            duration: duration,
            opacity: 1,
          },
          0
        );
      } else if (this.isClicked) {
        let tl = gsap.timeline({ onComplete: () => (this.isClicked = false) });
        const duration = 0.5;
        const scale = 1.0;

        tl.to(
          this.object.position,
          {
            duration: duration,
            x: this.objectCopy.position.x,
            y: this.objectCopy.position.y,
            z: this.objectCopy.position.z,
          },
          0
        );
        tl.to(
          this.object.rotation,
          {
            duration: duration,
            x: -Math.PI * 2 + 0.1,
            y: this.objectCopy.rotation.y,
          },
          0
        );
        tl.to(
          this.object.scale,
          {
            duration: duration,
            x: scale,
            y: scale,
          },
          0
        );
        tl.to(
          ".movie-info-container",
          {
            duration: duration,
            y: 100,
          },
          0
        );
        tl.to(
          ".movie-overview-container",
          {
            duration: duration,
            opacity: 0,
            onComplete: () => {
              document.querySelector(".movie-overview").innerHTML = "";
            },
          },
          0
        );
      }
    });
  }

  async load() {
    this.movieList = {
      "movie": [],
    };
    for (let i = 0; i < 5; i++) {
      const url = `https://api.themoviedb.org/3/search/movie?query=spider%20man&include_adult=false&language=en-US&page=${i + 1}&region=US&api_key=${this.apiKey}`;

      const response = await fetch(url);
      const json = await response.json();
      console.log(json);

      let filtered = json.results.filter((movie) =>
        movie["original_language"] === "en" &&
        movie["release_date"] !== "" &&
        movie["poster_path"] !== null
      );

      filtered.forEach((movie) => {
        this.movieList["movie"].push(movie);
        this.movieList["movie"].push(movie);
      });

      // 並び替える場合
      // for (const key in this.movieList) {
      //   this.movieList[key].sort((a, b) => {
      //     return a["release_date"] > b["release_date"] ? 1 : -1;
      //   });
      // }
    }
  }

  async loadTexture(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(url,
        (texture) => resolve(texture),
        (error) => reject(error)
      );
    });
  }

  setup() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(new THREE.Color(0xffffff));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    document.getElementById("app").appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1.0,
      15.0,
    );
    this.camera.position.set(-1.0, 2.0, 12.5);
    this.camera.lookAt(new THREE.Vector3(0.0, 0.0, 0.0));

    this.directionalLight = new THREE.DirectionalLight(
      0xffffff,
      20.0,
    );
    this.directionalLight.position.set(1.5, 2.0, 2.5);
    this.scene.add(this.directionalLight);

    this.ambientLight = new THREE.AmbientLight(
      0xffffff,
      0.2,
    );
    this.scene.add(this.ambientLight);

    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  setupObjects() {
    const width = 0.1;
    const geometry = new THREE.PlaneGeometry(1.0, 1.0);
    for (const [index, [key, value]] of Object.entries(Object.entries(this.movieList))) {
      const movies = value;
      movies.forEach((movie, i) => {
        console.log(movie);
        const plane = new THREE.Mesh(geometry);
        plane.position.set(i * 0.1 - 3.0, 0.0, width * index);
        plane.rotation.y = -Math.PI / 5;

        // store movie data attached to plane
        plane.userData = movie;

        this.loadTexture(`https://image.tmdb.org/t/p/original/${movie["poster_path"]}`).then((texture) => {
          const material = new THREE.MeshBasicMaterial({ map: texture });
          plane.material = material;
          this.scene.add(plane);
          this.group.add(plane);
          this.planeArray.push(plane);
        }).catch((error) => {
          console.error("Error loading texture:", error);
        });
      });
    }

    this.group.position.z = 5.0;
  }

  render() {
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}
