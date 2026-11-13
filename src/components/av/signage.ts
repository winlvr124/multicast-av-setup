import welcome from "@/assets/signage-welcome.jpg";
import showcase from "@/assets/signage-showcase.jpg";
import programme from "@/assets/signage-programme.jpg";
import dinner from "@/assets/signage-dinner.jpg";

export interface SignageItem {
  id: string;
  title: string;
  src: string;
}

export const SIGNAGE: SignageItem[] = [
  { id: "welcome", title: "Welcome", src: welcome },
  { id: "showcase", title: "AV Showcase", src: showcase },
  { id: "programme", title: "Programme", src: programme },
  { id: "dinner", title: "Dinner & Dance", src: dinner },
];

export const DEFAULT_SIGNAGE: SignageItem = { id: "welcome", title: "Welcome", src: welcome };
