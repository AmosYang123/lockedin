import {
  Bike, BookOpen, Brain, Code, Droplets, Dumbbell, Focus, Footprints, GlassWater, GraduationCap, Moon, PenLine,
  PhoneOff, Pill, Salad, Sun,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { HabitIcon } from '../lib/habits'
import { FriendsIcon, type IconProps } from './FriendsIcon'

export const HABIT_ICON_COMPONENTS: Record<HabitIcon, ComponentType<IconProps>> = {
  sun: Sun,
  moon: Moon,
  brain: Brain,
  focus: Focus,
  dumbbell: Dumbbell,
  bike: Bike,
  footprints: Footprints,
  droplets: Droplets,
  glass: GlassWater,
  salad: Salad,
  pill: Pill,
  book: BookOpen,
  graduation: GraduationCap,
  pen: PenLine,
  code: Code,
  'phone-off': PhoneOff,
  friends: FriendsIcon,
}
