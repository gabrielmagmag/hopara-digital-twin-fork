const DEFAULT_ANGLE = 45
const ANGLE_STEP = 90
const ANGLE_COUNT = 4
const MIN_ANGLE = DEFAULT_ANGLE
const MAX_ANGLE = MIN_ANGLE + (ANGLE_STEP * (ANGLE_COUNT - 1))

export class ImageRotation {
  private currentAngle: number

  constructor(currentAngle?: number) {
    this.currentAngle = currentAngle ?? DEFAULT_ANGLE
  }

  getRotatedAngle() {
    // Rotates left
    if ( this.currentAngle <= MIN_ANGLE ) {
      return MAX_ANGLE
    }

    return this.currentAngle - ANGLE_STEP
  }

  getAngleWithOffset(offset: number | undefined): number {
    return (this.currentAngle + (offset ?? 0)) % (ANGLE_STEP * ANGLE_COUNT)
  }
}
