import type { Events, Props, Slots } from '@threlte/core'
import CC from 'camera-controls'
import type { SvelteComponent } from 'svelte'

export type CameraAnimatorProps = Props<CC> & {
  autoRotate?: boolean
  autoRotateSpeed?: number
}
export type CameraAnimatorEvents = Events<CC>
export type CameraAnimatorSlots = Slots<CC>

export default class CameraAnimator extends SvelteComponent<
  CameraAnimatorProps,
  CameraAnimatorEvents,
  CameraAnimatorSlots
> {}
