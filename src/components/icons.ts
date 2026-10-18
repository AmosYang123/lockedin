import {
  Bike, BookOpen, Brain, Code, Droplets, Dumbbell, Focus, Footprints, GlassWater, GraduationCap, Moon, PenLine,
  PhoneOff, Pill, Salad, Sun, type LucideIcon,
} from 'lucide-react'
import type { HabitIcon } from '../lib/habits'

export const HABIT_ICON_COMPONENTS: Record<HabitIcon, LucideIcon> = {
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
}
