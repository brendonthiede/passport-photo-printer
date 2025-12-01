import { useState, useCallback, useEffect, useRef } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import './App.css'

interface ImageData {
  url: string
  width: number
  height: number
}

interface CropAreaSize {
  width: number
  height: number
  x: number
  y: number
}

function App() {
  const [image, setImage] = useState<ImageData | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)
  const [showQualityWarning, setShowQualityWarning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [cropAreaSize, setCropAreaSize] = useState<CropAreaSize | null>(null)
  const cropperWrapperRef = useRef<HTMLDivElement>(null)

  const MIN_DIMENSION = 600 // Minimum pixels for quality 2x2 inch print at 300 DPI

  // Track the crop area size from react-easy-crop
  useEffect(() => {
    if (!image || !cropperWrapperRef.current) return

    const updateCropAreaSize = () => {
      const cropArea = cropperWrapperRef.current?.querySelector('[data-testid="cropper"]')?.parentElement?.querySelector('.reactEasyCrop_CropArea')
      if (cropArea) {
        const rect = cropArea.getBoundingClientRect()
        const wrapperRect = cropperWrapperRef.current!.getBoundingClientRect()
        setCropAreaSize({
          width: rect.width,
          height: rect.height,
          x: rect.left - wrapperRect.left,
          y: rect.top - wrapperRect.top
        })
      }
    }

    // Initial update after a short delay to let react-easy-crop render
    const timer = setTimeout(updateCropAreaSize, 100)
    
    // Also update on window resize
    window.addEventListener('resize', updateCropAreaSize)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateCropAreaSize)
    }
  }, [image, zoom])

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const loadImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setImage({
          url: reader.result as string,
          width: img.width,
          height: img.height
        })
        // Check quality
        if (img.width < MIN_DIMENSION || img.height < MIN_DIMENSION) {
          setShowQualityWarning(true)
        } else {
          setShowQualityWarning(false)
        }
        // Reset crop state
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCroppedImage(null)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      loadImage(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      loadImage(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const createCroppedImage = async (): Promise<string> => {
    if (!image || !croppedAreaPixels) {
      throw new Error('No image or crop area')
    }

    const img = new Image()
    img.src = image.url
    await new Promise((resolve) => (img.onload = resolve))

    const canvas = document.createElement('canvas')
    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    )

    return canvas.toDataURL('image/jpeg', 0.95)
  }

  const handleCrop = async () => {
    try {
      const cropped = await createCroppedImage()
      setCroppedImage(cropped)
    } catch (error) {
      console.error('Error cropping image:', error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleReset = () => {
    setImage(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setCroppedImage(null)
    setShowQualityWarning(false)
  }

  return (
    <div className="app">
      <header className="header no-print">
        <h1>🛂 Passport Photo Printer</h1>
        <p className="subtitle">Create perfectly sized 2" × 2" US passport photos</p>
      </header>

      <main className="main-content">
        {/* Privacy Notice */}
        <div className="privacy-notice no-print">
          🔒 <strong>Your privacy is protected:</strong> All photo processing happens entirely in your browser. 
          Your photos never leave your device and are not uploaded to any server.
        </div>

        {!image && (
          <div 
            className={`upload-zone no-print ${isDragging ? 'dragging' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-content">
              <span className="upload-icon">📷</span>
              <p>Drag and drop a photo here, or</p>
              <label className="upload-button">
                Choose File
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  hidden
                />
              </label>
            </div>
          </div>
        )}

        {image && !croppedImage && (
          <div className="cropper-container no-print">
            {showQualityWarning && (
              <div className="quality-warning">
                ⚠️ <strong>Low Resolution Warning:</strong> Your image is smaller than 600×600 pixels. 
                For best print quality at 2"×2" (300 DPI), use a higher resolution image.
              </div>
            )}
            
            <div className="cropper-wrapper" ref={cropperWrapperRef}>
              <Cropper
                image={image.url}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
              
              {/* Head size overlay guides - ovals positioned over the crop area */}
              {cropAreaSize && (
                <div 
                  className="head-overlay"
                  style={{
                    position: 'absolute',
                    left: cropAreaSize.x,
                    top: cropAreaSize.y,
                    width: cropAreaSize.width,
                    height: cropAreaSize.height,
                  }}
                >
                  <div className="oval-guides">
                    <div className="oval-guide oval-max" title="Maximum head size (1⅜ inch)">
                      <span className="oval-label">Max (1⅜")</span>
                    </div>
                    <div className="oval-guide oval-min" title="Minimum head size (1 inch)">
                      <span className="oval-label">Min (1")</span>
                    </div>
                    <div className="oval-legend">
                      <div className="legend-item"><span className="legend-color min"></span> Min head size</div>
                      <div className="legend-item"><span className="legend-color max"></span> Max head size</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="zoom-control">
              <label>Zoom: </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>

            <p className="crop-hint">
              Drag the image to position your face. The head (from chin to top of hair) 
              should fill 50%–69% of the frame height (1" to 1⅜" when printed).
            </p>

            <div className="button-group">
              <button onClick={handleCrop} className="primary-button">
                Crop Photo
              </button>
              <button onClick={handleReset} className="secondary-button">
                Start Over
              </button>
            </div>
          </div>
        )}

        {croppedImage && (
          <div className="preview-container">
            <div className="preview-section no-print">
              <h2>Preview</h2>
              <p>Your photo will print at exactly 2" × 2"</p>
              <img src={croppedImage} alt="Cropped passport photo preview" className="preview-image" />
              
              <div className="print-instructions">
                <h3>⚠️ Important Print Settings</h3>
                <p>To ensure your photo prints at exactly 2" × 2":</p>
                <ol>
                  <li>In the print dialog, find <strong>"Scale"</strong> or <strong>"More settings"</strong></li>
                  <li>Set scale to <strong>100%</strong> (not "Fit to page" or "Shrink to fit")</li>
                  <li>Disable any "Fit to printable area" options</li>
                </ol>
                <p className="browser-note">Edge/Chrome: Look for "More settings" → Scale → 100%</p>
              </div>
              
              <div className="button-group">
                <button onClick={handlePrint} className="primary-button">
                  🖨️ Print Photo
                </button>
                <button onClick={() => setCroppedImage(null)} className="secondary-button">
                  Adjust Crop
                </button>
                <button onClick={handleReset} className="secondary-button">
                  New Photo
                </button>
              </div>
            </div>
            
            {/* This is what gets printed */}
            <div className="print-area">
              <img src={croppedImage} alt="Passport photo" className="print-image" />
            </div>
          </div>
        )}

        {/* Guidelines Panel */}
        <div className="guidelines-panel no-print">
          <h2>📋 US Passport Photo Requirements</h2>
          <ul>
            <li><strong>Size:</strong> 2" × 2" (51mm × 51mm)</li>
            <li><strong>Head size:</strong> Between 1" and 1⅜" (25mm–35mm) from chin to top of head</li>
            <li><strong>Background:</strong> Plain white or off-white</li>
            <li><strong>Recency:</strong> Taken within the last 6 months</li>
            <li><strong>Expression:</strong> Neutral expression, both eyes open</li>
            <li><strong>Glasses:</strong> Generally not allowed (with few exceptions)</li>
            <li><strong>Head coverings:</strong> Only for religious purposes</li>
          </ul>
          <p className="disclaimer">
            <strong>⚠️ Important:</strong> These are simplified guidelines. Please verify all requirements at the{' '}
            <a 
              href="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              official U.S. Department of State website
            </a>{' '}
            before submitting your passport application.
          </p>
        </div>
      </main>

      <footer className="footer no-print">
        <p>
          Made with ❤️ for hassle-free passport photos • 
          <a 
            href="https://github.com/brendonthiede/passport-photo-printer" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
