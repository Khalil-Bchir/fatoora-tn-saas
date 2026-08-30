import {
  LayoutDashboard,
  FileText,
  Sparkles,
  Users,
  CheckCircle2,
  Settings,
  Building2,
  User,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  items?: NavSubItem[]
}

export interface NavSubItem {
  title: string
  href: string
  badge?: string
}

export const navItems: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/overview',
    icon: LayoutDashboard,
  },
  {
    title: 'Factures & Devis',
    href: '/invoices',
    icon: FileText,
  },
  {
    title: 'Fatoora AI Builder',
    href: '/invoices/chat',
    icon: Sparkles,
    badge: 'AI',
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: Users,
  },
  {
    title: 'Vérification Paiements',
    href: '/payments',
    icon: CheckCircle2,
  },
]

export const userNavItems: NavItem[] = [
  {
    title: 'Paramètres',
    href: '/settings',
    icon: Settings,
    items: [
      {
        title: 'Profil Entreprise & Fiscalité',
        href: '/settings/organization',
      },
      {
        title: 'Mon Compte',
        href: '/settings/account',
      },
    ],
  },
]
