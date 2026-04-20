import {
  Shield,
  HardHat,
  Eye,
  HandHelping,
  VenetianMask,
  Bandage,
  Footprints,
  ShieldCheck,
  Ear,
  Hand,
  Shirt,
} from 'lucide-react';

export const PPEIconMap = {
  masks: VenetianMask,
  'protective-clothing': Shirt,
  gloves: Hand,
  'eye-protection': Eye,
  'head-protection': HardHat,
  'safety-footwear': Footprints,
  'face-shield': ShieldCheck,
  respirators: Bandage,
  'ear-protection': Ear,
  'hand-protection': HandHelping,
  'body-protection': Shield,
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
