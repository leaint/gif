//@ts-check

const url = new URL(location.href)

const path = url.searchParams.get("file")
const data = await fetch(path)

let type = "image/gif"
if(path.endsWith('.webp')) {
    type = "image/webp"
}
const imgDecoder = new ImageDecoder({ data: data.body, type })

const canvas = document.querySelector("canvas")

/**
 * @type { HTMLInputElement}
 */
const fpsScale = document.getElementById("fpsscale")

const details = document.getElementById("details")

const progressBar = document.getElementById("progressbar")

const progressLabel = document.getElementById("progresslabel")

const playBtn = document.getElementById("play")

const stopBtn = document.getElementById("stop")

const prevBtn = document.getElementById("prev")

const nextBtn = document.getElementById("next")

let open = false

details.ontoggle = () => {
    open = details.open
}

let frameCount
let duration
let fpsScaleValue
let displayHeight
let displayWidth

let deviceFps = 60

fpsScale.onchange = () => {
    let t = parseFloat(fpsScale.value)

    if (t > 0) {
        fpsScaleValue = t
    }
}

let curIndex = 0

imgDecoder.completed.then(() => imgDecoder.decode()).then((result) => {
    frameCount = imgDecoder.tracks.selectedTrack.frameCount
    progressBar.max = frameCount - 1
    duration = result.image.duration / 1000.0 / 1000.0
    if (duration <= 0) {
        duration = 1 / deviceFps
    }

    fpsScale.onchange()

    displayHeight = result.image.displayHeight
    displayWidth = result.image.displayWidth

    canvas.width = displayWidth
    canvas.height = displayHeight

    canvas.getContext("2d").drawImage(result.image, 0, 0)

    curIndex = 0
    render()
})

let played = true

let lastTimestamp = 0

let delayResult = null

let aTime = 0
let bTime = 0
let timestamp1 = 0
const ctx = canvas.getContext("2d")

function resultProcess(result) {
    bTime = Date.now()
    if (played && bTime - aTime + timestamp1 - lastTimestamp < result.image.duration / 1000 / fpsScaleValue ) {
        delayResult = result
        requestAnimationFrame(render)
        return
    }
    lastTimestamp = timestamp1

    ctx.drawImage(result.image, 0, 0)

    if (played) {
        curIndex++
        requestAnimationFrame(render)
    }

}

function render(timestamp = 0) {

    if (curIndex >= frameCount || curIndex < 0) {
        curIndex = 0
    }

    aTime = Date.now()
    timestamp1 = timestamp
    
    if (delayResult === null) {
        imgDecoder.decode({ frameIndex: curIndex }).then(resultProcess)
    } else {
        resultProcess(delayResult)
        delayResult = null
    }
    
    if (open) {
        progressBar.value = curIndex
        progressLabel.textContent = `${curIndex+1}/${frameCount}`
    }
}

progressBar.onchange = () => {
    
    if(progressBar.value != curIndex) {
        curIndex = progressBar.value
        render()
    }
    
    progressLabel.textContent = `${+curIndex+1}/${frameCount}`

}

playBtn.onclick = () => {

    let oldPlayed = played

    played = true

    if (!oldPlayed) {
        render()
    }

}

stopBtn.onclick = () => {

    played = false
}

prevBtn.onclick = () => {
    played = false
    curIndex--
    render()
}

nextBtn.onclick = () => {

    played = false
    curIndex++
    if (curIndex >= frameCount) {
        curIndex = frameCount - 1
    }
    render()
}
