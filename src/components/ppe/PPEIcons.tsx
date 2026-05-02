import {
  Shield,
  HardHat,
  HandHelping,
  VenetianMask,
  Footprints,
  ShieldCheck,
  Hand,
  Shirt,
  Glasses,
  Headphones,
  HeartPulse,
  Wind,
} from 'lucide-react';

export const PPEIconMap = {
  // Map category IDs from categories.json to icons
  'respiratory-protection': Wind,
  'protective-clothing': Shirt,
  'protective-gloves': Hand,
  'eye-face-protection': Glasses,
  'head-protection': HardHat,
  'safety-footwear': Footprints,
  'face-shield': ShieldCheck,
  'hearing-protection': Headphones,
  'hand-protection': HandHelping,
  'body-protection': HeartPulse,
  // Legacy mappings for backward compatibility
  masks: VenetianMask,
  respirators: Wind,
  gloves: Hand,
  'eye-protection': Glasses,
  'ear-protection': Headphones,
};

interface PPEIconProps {
  categoryId: string;
  size?: number;
  className?: string;
  color?: string;
}

export function PPEIcon({ categoryId, size = 24, className = '', color = '#339999' }: PPEIconProps) {
  const IconComponent = PPEIconMap[categoryId as keyof typeof PPEIconMap] || Shield;
  return <IconComponent size={size} className={className} color={color} />;
}

export function getPPEIconComponent(categoryId: string) {
  return PPEIconMap[categoryId as keyof typeof PPEIconMap] || Shield;
}
