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

const progressBar = document.getElementById("progressbar")

const progressLabel = document.getElementById("progresslabel")

const playBtn = document.getElementById("play")

const stopBtn = document.getElementById("stop")

const prevBtn = document.getElementById("prev")

const nextBtn = document.getElementById("next")

let frameCount
let duration
let fpsScaleValue
let displayHeight
let displayWidth

let deviceFps = 30

fpsScale.onchange = () => {
    let t = parseFloat(fpsScale.value)

    if (t > 0) {
        fpsScaleValue = t
    }
}

imgDecoder.completed.then(() => {

    return imgDecoder.decode()
}).then((result) => {
    frameCount = imgDecoder.tracks.selectedTrack.frameCount
    progressBar.max = frameCount - 1
    duration = result.image.duration / 1000.0 / 1000.0
    if (duration <= 0) {
        duration = 1 / deviceFps
    }

    fpsScale.onchange(undefined)

    displayHeight = result.image.displayHeight
    displayWidth = result.image.displayWidth

    canvas.width = displayWidth
    canvas.height = displayHeight

    const ctx = canvas.getContext("2d")

    ctx.drawImage(result.image, 0, 0)

    curIndex = 0
    render()
})

let played = true

let lastTimestamp = 0

let curIndex
let delayResult = null
function render(timestamp = 0) {


    if (curIndex >= frameCount || curIndex < 0) {
        curIndex = 0
    }
    
    progressBar.value = curIndex
    progressLabel.textContent = `${curIndex+1}/${frameCount}`
    
    let result
    if (delayResult != null) {
        result = delayResult
        delayResult = null
    } else {
        result = imgDecoder.decode({ frameIndex: curIndex })
    }
    let aTime = Date.now()
    result.then((result) => {
        let bTime = Date.now()
        if (played && timestamp + bTime - aTime - lastTimestamp < result.image.duration / 1000 / fpsScaleValue ) {
            delayResult = Promise.resolve(result)
            requestAnimationFrame(render)
            return
        }
        lastTimestamp = timestamp


        const ctx = canvas.getContext("2d")

        ctx.drawImage(result.image, 0, 0)

        if (played) {
            curIndex++
            requestAnimationFrame(render)
        }
    })

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
