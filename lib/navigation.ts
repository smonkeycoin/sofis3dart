import {
  Flame,
  Grid2X2,
  Heart,
  Home,
  Mail,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export const sidebarLinks = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/shop", label: "Tienda", icon: ShoppingBag },
  { href: "/collections", label: "Colecciones", icon: Grid2X2 },
  { href: "/new", label: "Nuevos ingresos", icon: Sparkles },
  { href: "/best-sellers", label: "Más vendidos", icon: Flame },
  { href: "/about", label: "Sobre nosotros", icon: Heart },
  { href: "/contact", label: "Contacto", icon: Mail },
];

export const categoryLinks = [
  "Todos",
  "Hogar",
  "Oficina",
  "Juguetes",
  "Decoracion",
  "Accesorios",
  "Geek",
] as const;
