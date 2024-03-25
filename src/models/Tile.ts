import { spring } from 'svelte/motion'
import { get, writable } from 'svelte/store'

export default class Tile {
  id: string
  _x = spring<number>(undefined, { stiffness: 0.25, damping: 0.7 })
  _y = spring<number>(undefined, { stiffness: 0.25, damping: 0.7 })
  _value = writable(0)
  scale = spring(1, { stiffness: 0.3, damping: 0.5 })

  /**
   * Creates a new tile.
   * @param value - The initial value of the tile (default random 2 or 4).
   */
  constructor([x, y]: [number, number], value?: number) {
    this.id = `tile-${Math.random().toString(36).substring(2, 9)}`
    this.value = value ?? (Math.random() > 0.9 ? 4 : 2)
    this.moveTo([x, y])
  }

  /** Gets the value of the tile. */
  get value() {
    return get(this._value)
  }

  /**
   * Sets the value of the tile and updates its appearance.
   * @param v - The new value of the tile.
   */
  set value(v: number) {
    this._value.set(v)
  }

  /**
   * Sets the x-coordinate and/or y-coordinate of the tile and updates its position.
   *
   */
  async moveTo([x, y]: [number, number]) {
    await Promise.all([this._x.set(x), this._y.set(y)])
  }

  /**
   * Triggers a 'pop' animation on the tile.
   * @param options - Options for the pop animation.
   */
  async pop() {
    await this.scale.set(1.1)
    await this.scale.set(1)
  }

  toJSON() {
    return {
      id: this.id,
      x: get(this._x),
      y: get(this._y),
      value: this.value,
    }
  }
}
