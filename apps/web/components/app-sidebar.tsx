'use client';

import * as React from 'react';
import {
  FileText,
  Users,
  Building2,
  Settings,
  LayoutDashboard,
  CreditCard,
  LifeBuoy,
  Send,
  Receipt,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const data = {
  user: {
    name: 'Mon Entreprise',
    email: 'contact@entreprise.tn',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Facturation',
      url: '/invoices',
      icon: Receipt,
      isActive: true,
      items: [
        {
          title: 'Toutes les Factures',
          url: '/invoices',
        },
        {
          title: 'Nouvelle Facture',
          url: '/invoices/new',
        },
      ],
    },
    {
      title: 'Clients',
      url: '/clients',
      icon: Users,
      items: [
        {
          title: 'Liste des Clients',
          url: '/clients',
        },
      ],
    },
    {
      title: 'Entreprise & Fiscalité',
      url: '/settings/organization',
      icon: Building2,
      items: [
        {
          title: 'Régime Fiscal & TVA',
          url: '/settings/organization',
        },
        {
          title: 'Cachet & Signature',
          url: '/settings/organization',
        },
        {
          title: 'Coordonnées Bancaires',
          url: '/settings/organization',
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: 'Commentaires',
      url: '#',
      icon: Send,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/invoices">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shadow-sm">
                  <Receipt className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">Fatoora TN</span>
                  <span className="truncate text-xs text-muted-foreground">Facturation Tunisie</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
