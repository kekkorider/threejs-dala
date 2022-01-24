
import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  BoxGeometry,
  ShaderMaterial,
  Color,
  Clock,
  Vector2,
  Vector3,
  Raycaster,
  Object3D,
  MathUtils
} from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Remove this if you don't need to load any 3D model
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'

import { Pane } from 'tweakpane'
import Stats from 'stats.js'
import { gsap } from 'gsap'

const stats = new Stats()
document.body.appendChild(stats.dom)

class App {
  constructor(container) {
    this.container = document.querySelector(container)

    this.hover = false

    this.colors = [
      new Color(0x963CBD),
      new Color(0xFF6F61),
      new Color(0xC5299B),
      new Color(0xFEAE51)
    ]

    this._resizeCb = () => this._onResize()
    this._mousemoveCb = e => this._onMousemove(e)
  }

  init() {
    this._createScene()
    this._createCamera()
    this._createRenderer()
    this._createClock()
    this._createRaycaster()
    this._addListeners()
    this._createControls()
    this._createDebugPanel()

    this._loadModel().then(() => {
      this.renderer.setAnimationLoop(() => {
        stats.begin()

        this._update()
        this._render()

        stats.end()
      })

      console.log(this)
    })
  }

  destroy() {
    this.renderer.dispose()
    this._removeListeners()
  }

  _update() {
    const elapsed = this.clock.getElapsedTime()

    // this.mesh.rotation.y = elapsed*0.3
  }

  _render() {
    this.renderer.render(this.scene, this.camera)
  }

  _createScene() {
    this.scene = new Scene()
  }

  _createCamera() {
    this.camera = new PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 100)
    this.camera.position.set(0, 0, 1.2)
  }

  _createRenderer() {
    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio === 1
    })

    this.container.appendChild(this.renderer.domElement)

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio))
    this.renderer.setClearColor(0x121212)
    this.renderer.physicallyCorrectLights = true
  }

  /**
   * Load a 3D model and append it to the scene
   */
  _loadModel() {
    return new Promise(resolve => {
      this.loader = new GLTFLoader()

      this.loader.load('./brain.glb', gltf => {
        const mesh = gltf.scene.children[0]

        const material = new ShaderMaterial({
          vertexShader: require('./shaders/brain.vertex.glsl'),
          fragmentShader: require('./shaders/brain.fragment.glsl'),
          wireframe: true,
          uniforms: {
            uPointer: { value: new Vector3() },
            uColor: { value: new Color() },
            uRandom: { value: 0 }
          }
        })

        this.mesh = mesh

        {
          const dummy = new Object3D()
          const geom = new BoxGeometry(0.003, 0.003, 0.003, 1, 1, 1)
          this.instancedMesh = new InstancedUniformsMesh(geom, material, this.mesh.geometry.attributes.position.count)

          this.scene.add(this.instancedMesh)

          const positions = this.mesh.geometry.attributes.position.array
          for (let i = 0; i < positions.length; i += 3) {
            dummy.position.set(
              positions[i + 0],
              positions[i + 1],
              positions[i + 2]
            )

            dummy.updateMatrix()

            this.instancedMesh.setMatrixAt(i / 3, dummy.matrix)
            this.instancedMesh.setUniformAt('uRandom', i / 3, MathUtils.randFloat(-1, 1))

            const colorIndex = MathUtils.randInt(0, this.colors.length - 1)
            this.instancedMesh.setUniformAt('uColor', i / 3, this.colors[colorIndex])
          }
        }

        // this.scene.add(this.mesh)

        resolve()
      })
    })
  }

  _createRaycaster() {
    this.mouse = new Vector2()
    this.raycaster = new Raycaster()
    this.intersects = []
    this.point = new Vector3()
  }

  _createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
  }

  _createDebugPanel() {
    this.pane = new Pane()

    /**
     * Scene configuration
     */
    const sceneFolder = this.pane.addFolder({ title: 'Scene' })

    let params = { background: { r: 18, g: 18, b: 18 } }

    sceneFolder.addInput(params, 'background', { label: 'Background Color' }).on('change', e => {
      this.renderer.setClearColor(new Color(e.value.r / 255, e.value.g / 255, e.value.b / 255))
    })

    sceneFolder.addMonitor(this, 'hover', { label: 'Hover on mesh' })
  }

  _createClock() {
    this.clock = new Clock()
  }

  _addListeners() {
    window.addEventListener('resize', this._resizeCb, { passive: true })
    window.addEventListener('mousemove', this._mousemoveCb, { passive: true })
  }

  _removeListeners() {
    window.removeEventListener('resize', this._resizeCb, { passive: true })
    window.removeEventListener('mousemove', this._mousemoveCb, { passive: true })
  }

  _onMousemove(e) {
    this.mouse.set(
      e.clientX / this.container.offsetWidth * 2 - 1,
      -(e.clientY / this.container.offsetHeight * 2 - 1)
    )

    this.raycaster.setFromCamera(this.mouse, this.camera)
    this.intersects = this.raycaster.intersectObject(this.mesh)

    if (this.intersects.length === 0) {
      if (this.hover) {
        this.hover = false
      }

      return
    }

    if (!this.hover) {
      this.hover = true
    }

    // this.mesh.worldToLocal(this.point.copy(this.intersects[0].point))

    gsap.to(this.point, {
      x: () => this.intersects[0]?.point.x ?? 0,
      y: () => this.intersects[0]?.point.y ?? 0,
      z: () => this.intersects[0]?.point.z ?? 0,
      overwrite: true,
      duration: 0.3,
      onUpdate: () => {
        for (let i = 0; i < this.instancedMesh.count; i++) {
          this.instancedMesh.setUniformAt('uPointer', i, this.point)
        }
      }
    })
  }

  _onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
}

const app = new App('#app')
app.init()
