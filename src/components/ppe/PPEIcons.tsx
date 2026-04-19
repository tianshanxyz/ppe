import {
  Shield,
  HardHat,
  Goggles,
  HandHelping,
  BadgePlus,
  Mask,
  Bandage,
  Eye,
  Footprints,
  ShieldCheck,
  SafetyGoggles,
} from 'lucide-react';

export const PPEIconMap = {
  masks: Mask,
  'protective-clothing': Shield,
  gloves: HandHelping,
  'eye-protection': Goggles,
  'head-protection': HardHat,
  'safety-footwear': Footprints,
  'face-shield': ShieldCheck,
  'respirators': Bandage,
  'ear-protection': Shield,
  'hand-protection': HandHelping,
  'body-protection': Shield,
};

interface PPEIconProps {
  categoryId: keyof typeof PPEIconMap;
  size?: number;
  className?: string;
  color?: string;
}

export function PPEIcon({ categoryId, size = 24, className = '', color = '#339999' }: PPEIconProps) {
  const IconComponent = PPEIconMap[categoryId] || Shield;
  return <IconComponent size={size} className={className} color={color} />;
}

export function getPPEIconComponent(categoryId: string) {
  return PPEIconMap[categoryId as keyof typeof PPEIconMap] || Shield;
}
