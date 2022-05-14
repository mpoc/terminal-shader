import readline from 'readline'

// Override to fix a problem with readline
// http://stackoverflow.com/q/41314556/1049894
// @ts-ignore
readline.Interface.prototype._insertString = function(c) {
    if (this.cursor < this.line.length) {
        var beg = this.line.slice(0, this.cursor)
        var end = this.line.slice(this.cursor, this.line.length)

        // @ts-ignore
        this.line = beg + c + end
        // @ts-ignore
        this.cursor += c.length
        // @ts-ignore
        this._refreshLine()
    } else {
        // @ts-ignore
        this.line += c
        // @ts-ignore
        this.cursor += c.length
        // @ts-ignore
        this.output.write(c)
        // @ts-ignore
        this._moveCursor(0)
    }
}

import chalko from 'chalk'
const chalk = new chalko.Instance({ level: 2 })

const targetFps = 30
let frame = 0

// const getWidth = () => Math.floor(process.stdout.columns / 2)
const getWidth = () => process.stdout.columns
const getHeight = () => process.stdout.rows

const fragCoord: vec2 = [getWidth(), getHeight()]

type vec1 = [number]
type vec2 = [number, number]
type vec3 = [number, number, number]
type vec4 = [number, number, number, number]
type vec = vec1 | vec2 | vec3 | vec4

const vec1 = (x: number): vec1 => [x]
const vec2 = (x: number, y: number): vec2 => [x, y]
const vec3 = (x: number, y: number, z: number): vec3 => [x, y, z]
const vec4 = (x: number, y: number, z: number, w: number): vec4 => [x, y, z, w]

const remap = (x: number, a: number, b: number, c: number, d: number) => c + (((d - c) / (b - a)) * (x - a))

const clamp = (x: number, min: number, max: number) => {
    if (x < min) {
        return min
    }
    if (x > max) {
        return max
    }
    return x
}

const remapAndClamp = (x: number, a: number, b: number, c: number, d: number) => {
    const mapped = remap(x, a, b, c, d)
    const clamped = clamp(mapped, c, d)
    return clamped
}

const getX = (vec: vec): number => vec[0] as number
const getY = (vec: vec): number => vec[1] as number
const getZ = (vec: vec): number => vec[2] as number
const getW = (vec: vec): number => vec[3] as number

const divideVectors = (v1: vec, v2: vec): vec => v1.map((coord, index) => v2[index] != 0 ? coord / v2[index] : 0) as vec
const multiplyVectors = (v1: vec, v2: vec): vec => v1.map((coord, index) => coord * v2[index]) as vec
const multiplyVector = (x: number, v: vec): vec => v.map(coord => x * coord) as vec
const plusVector = (x: number, v: vec) => v.map(coord => x + coord) as vec
const plusVectors = (v1: vec, v2: vec) => v1.map((coord, index) => coord + v2[index]) as vec
const cosineVector = (v: vec): vec => v.map(coord => Math.cos(coord)) as vec

const pixelColours: vec4[][] = Array(getHeight()).fill(Array(getWidth()))

const setPixelColour = (x: number, y: number, colour: vec4) => {
    pixelColours[y][x] = colour
}

const getPixelColour = (x: number, y: number) => pixelColours[y][x]

const mainImage = (x: number, y: number): vec4 => {
    const uv: vec2 = divideVectors(fragCoord, [x, y]) as vec2
    const colour: vec3 = plusVector(0.5, multiplyVector(0.5, cosineVector(plusVectors(plusVector(frame / 20, [getX(uv), getY(uv), getX(uv)] as vec3), vec3(0, 2, 4))))) as vec3
    return [...multiplyVector(255, colour), 1] as vec4
}

const constructLineString = (line: vec4[]) => line.map(colour =>
    chalk.bgRgb(colour[0], colour[1], colour[2])(' ')
).join('')

const constructString = () => pixelColours.map(constructLineString).join('\n')

const runShader = () => {
    for (let y = 0; y < getHeight(); y++) {
        for (let x = 0; x < getWidth(); x++) {
            setPixelColour(x, y, mainImage(x, y))
        }
    }
}

readline.cursorTo(process.stdout, 0, 0)
readline.clearScreenDown(process.stdout)
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
})
rl.on('close', () => process.exit(0))

setInterval(() => {
    runShader()
    for (let y = 0; y < getHeight(); y++) {
        readline.cursorTo(process.stdout, 0, y)
        rl.write(constructLineString(pixelColours[y]))
    }
    frame++
}, 1000 / 60)
