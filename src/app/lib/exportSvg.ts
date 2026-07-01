function inlineSvg(svg: SVGSVGElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clone)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadSvg(svg: SVGSVGElement, name: string) {
  downloadBlob(new Blob([inlineSvg(svg)], { type: 'image/svg+xml;charset=utf-8' }), `${name}.svg`)
}

export async function downloadPng(svg: SVGSVGElement, name: string, scale = 1) {
  const source = inlineSvg(svg)
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const image = new Image()
  const box = svg.viewBox.baseVal
  const width = box?.width || svg.width.baseVal.value
  const height = box?.height || svg.height.baseVal.value

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = reject
      image.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(width * scale)
    canvas.height = Math.ceil(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context unavailable')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((next) => (next ? resolve(next) : reject(new Error('PNG export failed'))), 'image/png')
    })
    downloadBlob(png, `${name}.png`)
  } finally {
    URL.revokeObjectURL(url)
  }
}
